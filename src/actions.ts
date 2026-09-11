//
// actions.ts — the buttons, as vendor requests.
//
// Every action here is a thin wrapper over the plugin's vendor API (§8.3 of the
// project scope): the same command the plugin's own pages and hotkeys run. The
// module adds no behaviour of its own, which is the point — a button and a
// keypress cannot disagree about what "hold" means.
//
// The marker and recording dropdowns are rebuilt from the latest status, so the
// choices are this room's actual markers and this room's actual recordings
// rather than a list somebody typed twice.
//
import type { CompanionActionDefinitions, JsonObject } from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { EventEntry } from './types.js'

type NoOptions = Record<string, never>

export type ActionsSchema = {
	encoder_go_live: { options: { event_name: string } }
	encoder_end: { options: NoOptions }
	encoder_marker: { options: { label: string } }
	decoder_play: { options: NoOptions }
	decoder_stop: { options: NoOptions }
	decoder_hold: { options: NoOptions }
	decoder_continue: { options: NoOptions }
	decoder_catch_up: { options: NoOptions }
	decoder_return_to_live: { options: NoOptions }
	decoder_jog: { options: { seconds: number } }
	decoder_seek: { options: { seconds: number } }
	decoder_delay: { options: { seconds: number } }
	decoder_marker: { options: { id: string } }
	decoder_load_event: { options: { event_id: string } }
	vendor_request: { options: { request: string; data: string } }
}

/** The marker buttons the main site published, as dropdown choices. */
function markerChoices(self: ModuleInstance): { id: string; label: string }[] {
	const labels = self.encoderStatus.marker_labels ?? []
	if (labels.length === 0) return [{ id: '', label: '(no markers published yet)' }]
	return labels.map((label) => ({ id: label, label }))
}

/** The recordings the room has, as dropdown choices. */
function eventChoices(self: ModuleInstance): { id: string; label: string }[] {
	const events: EventEntry[] = self.events.events ?? []
	if (events.length === 0) return [{ id: '', label: '(no recordings listed — use Refresh recordings)' }]
	return events.map((e) => ({ id: e.event_id, label: e.name ? `${e.name}` : e.event_id }))
}

export function UpdateActions(self: ModuleInstance): void {
	const actions: CompanionActionDefinitions<ActionsSchema> = {
		// ── The main site ────────────────────────────────────────────────────
		encoder_go_live: {
			name: 'Encoder: Go live',
			description: 'Start sending. Leave the name blank to name it with the current time, as the dock does.',
			options: [
				{
					id: 'event_name',
					type: 'textinput',
					label: 'Event name (optional)',
					default: '',
					useVariables: true,
				},
			],
			callback: async (event) => {
				await self.command('encoder/go-live', { event_name: event.options.event_name ?? '' }, 'encoder')
			},
		},

		encoder_end: {
			name: 'Encoder: End the broadcast',
			options: [],
			callback: async () => {
				await self.command('encoder/end', {}, 'encoder')
			},
		},

		encoder_marker: {
			name: 'Encoder: Drop a marker',
			options: [
				{
					id: 'label',
					type: 'dropdown',
					label: 'Marker',
					default: markerChoices(self)[0].id,
					choices: markerChoices(self),
					allowCustom: true,
				},
			],
			callback: async (event) => {
				await self.command('encoder/marker', { label: String(event.options.label ?? '') }, 'encoder')
			},
		},

		// ── The campus ───────────────────────────────────────────────────────
		decoder_play: {
			name: 'Decoder: Play',
			options: [],
			callback: async () => {
				await self.command('decoder/play')
			},
		},

		decoder_stop: {
			name: 'Decoder: Stop',
			options: [],
			callback: async () => {
				await self.command('decoder/stop')
			},
		},

		decoder_hold: {
			name: 'Decoder: Hold (pause)',
			options: [],
			callback: async () => {
				await self.command('decoder/hold')
			},
		},

		decoder_continue: {
			name: 'Decoder: Resume (continue)',
			options: [],
			callback: async () => {
				await self.command('decoder/continue')
			},
		},

		decoder_catch_up: {
			name: 'Decoder: Catch up to live',
			options: [],
			callback: async () => {
				await self.command('decoder/catch-up')
			},
		},

		decoder_return_to_live: {
			name: 'Decoder: Return to the room (follow live)',
			description: 'Stop playing a past recording and follow whatever the room is live with.',
			options: [],
			callback: async () => {
				await self.command('decoder/return-to-live')
			},
		},

		decoder_jog: {
			name: 'Decoder: Jog',
			description: 'Step forward or back by a number of seconds. Negative goes back.',
			options: [
				{
					id: 'seconds',
					type: 'number',
					label: 'Seconds',
					default: 10,
					min: -86400,
					max: 86400,
					step: 1,
				},
			],
			callback: async (event) => {
				await self.command('decoder/jog', { seconds: Number(event.options.seconds ?? 0) })
			},
		},

		decoder_seek: {
			name: 'Decoder: Seek to a time of day',
			description: 'Go to a clock time within the recording, counted from midnight (seconds).',
			options: [
				{
					id: 'seconds',
					type: 'number',
					label: 'Seconds from midnight',
					default: 3600,
					min: 0,
					max: 86399,
					step: 1,
				},
			],
			callback: async (event) => {
				await self.command('decoder/seek', { ms: Math.round(Number(event.options.seconds ?? 0) * 1000) })
			},
		},

		decoder_delay: {
			name: 'Decoder: Sit behind live',
			description: 'Hold a constant delay behind live, in seconds. Zero returns to the live edge.',
			options: [
				{
					id: 'seconds',
					type: 'number',
					label: 'Seconds behind live',
					default: 30,
					min: 0,
					max: 14400,
					step: 1,
				},
			],
			callback: async (event) => {
				await self.command('decoder/delay', { seconds: Number(event.options.seconds ?? 0) })
			},
		},

		decoder_marker: {
			name: 'Decoder: Jump to a marker',
			options: [
				{
					id: 'id',
					type: 'dropdown',
					label: 'Marker',
					default: '',
					choices: [],
					allowCustom: true,
				},
			],
			callback: async (event) => {
				await self.command('decoder/marker', { id: String(event.options.id ?? '') })
			},
		},

		decoder_load_event: {
			name: 'Decoder: Load a recording',
			description: 'Play a past event from this room. Pinning does not follow the room afterwards.',
			options: [
				{
					id: 'event_id',
					type: 'dropdown',
					label: 'Recording',
					default: eventChoices(self)[0].id,
					choices: eventChoices(self),
					allowCustom: true,
				},
			],
			callback: async (event) => {
				const id = String(event.options.event_id ?? '')
				if (id !== '') await self.command('decoder/load-event', { event_id: id })
			},
		},

		// ── The escape hatch ─────────────────────────────────────────────────
		vendor_request: {
			name: 'Any obs-multisite request',
			description:
				'Call any command of the plugin, by name, with a JSON object. ' +
				'The escape hatch for a command a newer plugin has and this module does not yet.',
			options: [
				{
					id: 'request',
					type: 'textinput',
					label: 'Request (e.g. decoder/status)',
					default: 'decoder/status',
					useVariables: true,
				},
				{
					id: 'data',
					type: 'textinput',
					label: 'JSON data',
					default: '{}',
					useVariables: true,
				},
			],
			callback: async (event) => {
				const request = String(event.options.request ?? '').trim()
				if (request === '') return
				let data: JsonObject = {}
				const raw = String(event.options.data ?? '').trim()
				if (raw !== '') {
					try {
						data = JSON.parse(raw) as JsonObject
					} catch {
						self.log('warn', `"Any obs-multisite request": the data is not valid JSON: ${raw}`)
						return
					}
				}
				// Encoder commands answer with the encoder document; everything
				// else with the decoder's. Getting this wrong only mislabels the
				// reply, so it is a best guess by namespace rather than a table.
				const half = request.startsWith('encoder/') ? 'encoder' : 'decoder'
				await self.command(request, data, half)
			},
		},
	}

	self.setActionDefinitions(actions)
}
