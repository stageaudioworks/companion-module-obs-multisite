//
// variables.ts — what the plugin is doing, as text a button can show.
//
// The names here are the public surface as much as the actions are: somebody
// will put `$(obs-multisite:decoder_behind_live)` on a button and expect it to
// keep meaning what it means. They are also declared here rather than generated
// from the document, so a typo in a preset is caught rather than silently empty.
//
import type ModuleInstance from './main.js'
import { formatBytes, formatClockTime, formatDuration, formatRate, linkHealthText, roomStateText } from './state.js'

function yesNo(value: boolean | undefined): string {
	return value ? 'yes' : 'no'
}

export function UpdateVariables(self: ModuleInstance): void {
	self.setVariableDefinitions({
		// Encoder — the main site.
		encoder_live: { name: 'Encoder — on air (yes/no)' },
		encoder_status: { name: 'Encoder — reading (Live / Idle)' },
		encoder_event_id: { name: 'Encoder — event id' },
		encoder_event_name: { name: 'Encoder — event name' },
		encoder_room: { name: 'Encoder — room' },
		encoder_confirmed: { name: 'Encoder — pieces confirmed in storage' },
		encoder_pending: { name: 'Encoder — pieces waiting to send' },
		encoder_retries: { name: 'Encoder — retries' },
		encoder_bytes: { name: 'Encoder — bytes sent' },
		encoder_upload_rate: { name: 'Encoder — upload rate' },
		encoder_link: { name: 'Encoder — link (Healthy / Degraded / Offline)' },
		encoder_colo: { name: 'Encoder — Cloudflare edge serving the bucket' },
		encoder_version: { name: 'Encoder — plugin version' },

		// Decoder — the campus.
		decoder_state: { name: 'Decoder — room state (Unknown/Offline/Live/Ended/Interrupted)' },
		decoder_have_source: { name: 'Decoder — a source exists here (yes/no)' },
		decoder_playing: { name: 'Decoder — playing (yes/no)' },
		decoder_held: { name: 'Decoder — held (yes/no)' },
		decoder_buffering: { name: 'Decoder — buffering (yes/no)' },
		decoder_loading: { name: 'Decoder — loading an event (yes/no)' },
		decoder_ended: { name: 'Decoder — the recording has ended (yes/no)' },
		decoder_behind_live: { name: 'Decoder — how far behind live' },
		decoder_playhead: { name: 'Decoder — playhead (time of day)' },
		decoder_live: { name: 'Decoder — live edge (time of day)' },
		decoder_cached_segments: { name: 'Decoder — pieces downloaded' },
		decoder_link: { name: 'Decoder — link (Healthy / Degraded / Offline)' },
		decoder_current_marker: { name: 'Decoder — marker being played' },
		decoder_event_id: { name: 'Decoder — event id' },
		decoder_room: { name: 'Decoder — room' },
		decoder_version: { name: 'Decoder — plugin version' },
	})
	UpdateVariableValues(self)
}

export function UpdateVariableValues(self: ModuleInstance): void {
	const enc = self.encoderStatus
	const dec = self.decoderStatus

	self.setVariableValues({
		encoder_live: yesNo(enc.live),
		encoder_status: enc.live ? 'Live' : 'Idle',
		encoder_event_id: enc.event_id ?? '',
		encoder_event_name: enc.event_name ?? '',
		encoder_room: enc.room_id ?? '',
		encoder_confirmed: enc.confirmed ?? 0,
		encoder_pending: enc.pending ?? 0,
		encoder_retries: enc.retries ?? 0,
		encoder_bytes: formatBytes(enc.bytes),
		encoder_upload_rate: formatRate(enc.upload_bytes_per_s),
		encoder_link: enc.link_known ? linkHealthText(enc.link_health) : '',
		encoder_colo: enc.colo ?? '',
		encoder_version: enc.version ?? '',

		decoder_state: dec.have_source === false ? 'No source' : roomStateText(dec.room_state),
		decoder_have_source: yesNo(dec.have_source),
		decoder_playing: yesNo(dec.playing),
		decoder_held: yesNo(dec.paused),
		decoder_buffering: yesNo(dec.buffering),
		decoder_loading: yesNo(dec.loading),
		decoder_ended: yesNo(dec.ended || dec.at_end),
		decoder_behind_live: dec.ended || dec.at_end ? '' : formatDuration(dec.behind_live_s),
		decoder_playhead: formatClockTime(dec.playhead_ms),
		decoder_live: formatClockTime(dec.live_ms),
		decoder_cached_segments: dec.cached_segments ?? 0,
		decoder_link: dec.link_known ? linkHealthText(dec.link_health) : '',
		decoder_current_marker: dec.current_marker ?? '',
		decoder_event_id: dec.event_id ?? '',
		decoder_room: dec.room_id ?? '',
		decoder_version: dec.version ?? '',
	})
}
