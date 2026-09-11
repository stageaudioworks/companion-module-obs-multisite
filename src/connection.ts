//
// connection.ts — the obs-websocket connection, and the one place the plugin's
// vendor API is spoken to.
//
// This module does NOT share a connection with Companion's OBS Studio module:
// Companion modules each own their connection, so this one takes the same host,
// port and password and opens its own. Worth saying plainly, because it means
// the operator types those three things twice.
//
import OBSWebSocket from 'obs-websocket-js'
import type { JsonObject } from '@companion-module/base'

import { asJsonObject } from './types.js'

/** The vendor name the obs-multisite plugin registers with rather than one the client chooses. */
export const VENDOR_NAME = 'obs-multisite'

/** The event types the plugin emits; anything else under this vendor is ignored. */
export const EVENT_ENCODER_STATE = 'encoder/state'
export const EVENT_DECODER_STATE = 'decoder/state'

export interface ConnectionCallbacks {
	/** The socket is up and identified. */
	onConnected: () => void
	/** The socket went away, with something to put in the log. */
	onDisconnected: (reason: string) => void
	/** A vendor event this module cares about. */
	onVendorEvent: (eventType: string, eventData: JsonObject) => void
}

export class MultisiteConnection {
	private readonly ws = new OBSWebSocket()
	private readonly callbacks: ConnectionCallbacks
	private connected = false

	constructor(callbacks: ConnectionCallbacks) {
		this.callbacks = callbacks

		this.ws.on('ConnectionOpened', () => {
			this.connected = true
		})
		this.ws.on('ConnectionClosed', (error) => {
			this.connected = false
			this.callbacks.onDisconnected(error?.message ?? 'the connection closed')
		})
		this.ws.on('ConnectionError', (error) => {
			this.connected = false
			this.callbacks.onDisconnected(error?.message ?? 'the connection failed')
		})
		this.ws.on('VendorEvent', ({ vendorName, eventType, eventData }) => {
			if (vendorName !== VENDOR_NAME) return
			this.callbacks.onVendorEvent(eventType, asJsonObject(eventData))
		})
	}

	get isConnected(): boolean {
		return this.connected
	}

	/**
	 * Open the connection. `onConnected` fires once the socket is identified,
	 * which is later than the promise resolving for a reconnect — so the caller
	 * should treat the callback, not this promise, as "ready".
	 */
	async connect(host: string, port: number, password: string): Promise<void> {
		await this.ws.connect(`ws://${host}:${port}`, password || undefined)
		this.connected = true
		this.callbacks.onConnected()
	}

	async disconnect(): Promise<void> {
		this.connected = false
		try {
			await this.ws.disconnect()
		} catch {
			// Already gone. Disconnecting a socket that is not there is not a fault.
		}
	}

	/**
	 * Call a vendor request and return its `responseData`. A refusal arrives as
	 * an `error` field inside that object — obs-websocket gives a vendor request
	 * no status code of its own — so callers read it rather than catching.
	 */
	async vendor(requestType: string, requestData: JsonObject = {}): Promise<JsonObject> {
		const res = await this.ws.call('CallVendorRequest', {
			vendorName: VENDOR_NAME,
			requestType,
			requestData,
		})
		return asJsonObject(res.responseData)
	}
}
