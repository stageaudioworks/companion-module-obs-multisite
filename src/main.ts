import { InstanceBase, InstanceStatus } from '@companion-module/base'
import type { CompanionVariableValues, JsonObject, SomeCompanionConfigField } from '@companion-module/base'

import { GetConfigFields } from './config.js'
import type { ModuleConfig, ModuleSecrets } from './types.js'
import type { EncoderStatus, DecoderStatus, EventsResponse } from './types.js'
import { MultisiteConnection, EVENT_ENCODER_STATE, EVENT_DECODER_STATE } from './connection.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdateVariables, UpdateVariableValues } from './variables.js'
import { UpdatePresets } from './presets.js'
import { UpgradeScripts } from './upgrades.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: ModuleSecrets
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	// Variables stay untyped: several are built from the plugin's document,
	// which this module deliberately does not pin to a version.
	variables: CompanionVariableValues
}

export { UpgradeScripts }

/** How long to wait before asking again, at most, after a drop. */
const MAX_RECONNECT_MS = 30_000
/** The safety net: the plugin also pushes changes, but a missed event must not leave a stale button. */
const POLL_INTERVAL_MS = 5000

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig
	secrets!: ModuleSecrets

	readonly conn: MultisiteConnection

	/** The last document each half reported. Empty until the first reply. */
	encoderStatus: EncoderStatus = {}
	decoderStatus: DecoderStatus = {}
	events: EventsResponse = {}

	/** Which halves this machine has. A satellite has no encoder request to reach. */
	hasEncoder = false
	hasDecoder = false

	private reconnectTimer?: NodeJS.Timeout
	private pollTimer?: NodeJS.Timeout
	private reconnectDelayMs = 1000
	private destroyed = false

	constructor(internal: unknown) {
		super(internal)
		this.conn = new MultisiteConnection({
			onConnected: () => void this.handleConnected(),
			onDisconnected: (reason) => this.handleDisconnected(reason),
			onVendorEvent: (eventType, eventData) => this.handleVendorEvent(eventType, eventData),
		})
	}

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets

		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariables()

		await this.reconnect()
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets
		// A different OBS is a different broadcast: forget everything the last
		// one said before pointing at the new one.
		this.encoderStatus = {}
		this.decoderStatus = {}
		this.events = {}
		this.hasEncoder = false
		this.hasDecoder = false
		await this.reconnect()
	}

	async destroy(): Promise<void> {
		this.destroyed = true
		this.clearTimers()
		await this.conn.disconnect()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariables(): void {
		UpdateVariables(this)
	}

	/**
	 * Republish the values only. Redefining the variables drops the values the
	 * host holds for them, so a status change must go through here and not
	 * through updateVariables().
	 */
	publishVariables(): void {
		UpdateVariableValues(this)
	}

	// ── The connection ───────────────────────────────────────────────────────

	/** Connect, refusing to start when the two required fields are missing. */
	private async reconnect(): Promise<void> {
		this.clearTimers()

		if (!this.config?.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'No OBS host set')
			return
		}
		if (!this.config?.port) {
			this.updateStatus(InstanceStatus.BadConfig, 'No OBS WebSocket port set')
			return
		}

		this.updateStatus(InstanceStatus.Connecting)
		try {
			await this.conn.connect(this.config.host, this.config.port, this.secrets?.password ?? '')
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error)
			this.updateStatus(InstanceStatus.ConnectionFailure, reason)
			this.scheduleReconnect()
		}
	}

	private scheduleReconnect(): void {
		if (this.destroyed) return
		const delay = this.reconnectDelayMs
		this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, MAX_RECONNECT_MS)
		this.reconnectTimer = setTimeout(() => void this.reconnect(), delay)
	}

	private handleConnected(): void {
		this.reconnectDelayMs = 1000
		this.updateStatus(InstanceStatus.Ok)
		this.log('info', 'connected to OBS')
		void this.refreshAll()
		this.pollTimer = setInterval(() => void this.refreshAll(), POLL_INTERVAL_MS)
	}

	private handleDisconnected(reason: string): void {
		if (this.destroyed) return
		this.log('warn', `disconnected: ${reason}`)
		this.updateStatus(InstanceStatus.ConnectionFailure, reason)
		this.clearTimers()
		this.scheduleReconnect()
	}

	private handleVendorEvent(eventType: string, eventData: JsonObject): void {
		if (eventType === EVENT_ENCODER_STATE) this.applyEncoderStatus(eventData)
		else if (eventType === EVENT_DECODER_STATE) this.applyDecoderStatus(eventData)
	}

	private clearTimers(): void {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}
	}

	// ── Reading and writing the state ────────────────────────────────────────

	/**
	 * Ask both halves what they are doing. This is what fills the buttons in
	 * after connecting mid-event, when the next pushed change may be minutes
	 * away. Each half is asked independently: one being absent is normal, not a
	 * fault — a satellite has no encoder.
	 */
	async refreshAll(): Promise<void> {
		if (!this.conn.isConnected) return
		await Promise.allSettled([this.refreshEncoder(), this.refreshDecoder()])
	}

	async refreshEncoder(): Promise<void> {
		try {
			const status = await this.conn.vendor('encoder/status')
			if (typeof status.error === 'string') {
				this.hasEncoder = false
			} else {
				this.hasEncoder = true
				this.applyEncoderStatus(status)
			}
		} catch {
			// Not worth a log line every five seconds: either this machine has
			// no encoder half, or the socket has just gone.
		}
	}

	async refreshDecoder(): Promise<void> {
		try {
			const status = await this.conn.vendor('decoder/status')
			if (typeof status.error === 'string') {
				this.hasDecoder = false
			} else {
				this.hasDecoder = true
				this.applyDecoderStatus(status)
			}
		} catch {
			// As above.
		}
	}

	/** Take a status document as truth and repaint anything that depends on it. */
	applyEncoderStatus(status: JsonObject): void {
		this.encoderStatus = status
		this.publishVariables()
		this.checkFeedbacks('encoder_live', 'encoder_link_health')
	}

	applyDecoderStatus(status: JsonObject): void {
		this.decoderStatus = status
		this.publishVariables()
		this.checkFeedbacks(
			'decoder_playing',
			'decoder_held',
			'decoder_buffering',
			'decoder_loading',
			'decoder_no_source',
			'decoder_ended',
			'decoder_behind_live',
			'decoder_link_health',
		)
	}

	/** The recordings list, fetched on demand — for an action or a dropdown. */
	async fetchEvents(): Promise<EventsResponse> {
		try {
			const res = await this.conn.vendor('decoder/events')
			this.events = res
		} catch {
			this.events = { error: 'could not read the recordings list' }
		}
		return this.events
	}

	/**
	 * Run a vendor command and fold its reply into the state. Every control
	 * request answers with the new status document, so a button updates itself
	 * from the response rather than waiting for the next pushed event.
	 */
	async command(
		requestType: string,
		requestData: JsonObject = {},
		half: 'encoder' | 'decoder' = 'decoder',
	): Promise<JsonObject> {
		const res = await this.conn.vendor(requestType, requestData)
		if (typeof res.error === 'string' && res.error !== '') {
			this.log('warn', `${requestType} refused: ${res.error}`)
			return res
		}
		if (half === 'encoder') this.applyEncoderStatus(res)
		else this.applyDecoderStatus(res)
		return res
	}
}
