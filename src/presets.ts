//
// presets.ts — the buttons somebody can drop on a page and use immediately.
//
// Written for the volunteer who has never opened Companion before: the encoder
// bank is "start the event", "end the event", "is it on air"; the decoder bank
// is the transport controls with the lights already attached. Presets are only
// a starting point — everything is still editable afterwards.
//
import type {
	CompanionPresetDefinitions,
	CompanionPresetSection,
	CompanionButtonStyleProps,
} from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { ModuleSchema } from './main.js'

function style(text: string, bgcolor: number, color = 0xffffff): CompanionButtonStyleProps {
	return { text, size: 'auto', color, bgcolor, show_topbar: false }
}

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}

	// ── Encoder ──────────────────────────────────────────────────────────────
	presets['encoder_go_live'] = {
		type: 'simple',
		name: 'Encoder: Go live',
		style: style('GO LIVE', 0xcc0000),
		steps: [{ down: [{ actionId: 'encoder_go_live', options: { event_name: '' } }], up: [] }],
		feedbacks: [{ feedbackId: 'encoder_live', options: {}, style: { bgcolor: 0x00aa00, color: 0xffffff } }],
	}

	presets['encoder_end'] = {
		type: 'simple',
		name: 'Encoder: End the broadcast',
		style: style('END', 0x444444),
		steps: [{ down: [{ actionId: 'encoder_end', options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['encoder_status'] = {
		type: 'simple',
		name: 'Encoder: status',
		style: {
			text: '$(obs-multisite:encoder_status)\\n$(obs-multisite:encoder_event_name)',
			size: 'auto',
			color: 0xffffff,
			bgcolor: 0x000000,
			show_topbar: false,
		},
		steps: [{ down: [{ actionId: 'vendor_request', options: { request: 'encoder/status', data: '{}' } }], up: [] }],
		feedbacks: [{ feedbackId: 'encoder_live', options: {}, style: { bgcolor: 0xcc0000, color: 0xffffff } }],
	}

	// ── Decoder ──────────────────────────────────────────────────────────────
	presets['decoder_play'] = {
		type: 'simple',
		name: 'Decoder: Play',
		style: style('PLAY', 0x005500),
		steps: [{ down: [{ actionId: 'decoder_play', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'decoder_playing', options: {}, style: { bgcolor: 0x00aa00 } }],
	}

	presets['decoder_hold'] = {
		type: 'simple',
		name: 'Decoder: Hold',
		style: style('HOLD', 0x885500),
		steps: [{ down: [{ actionId: 'decoder_hold', options: {} }], up: [] }],
		feedbacks: [{ feedbackId: 'decoder_held', options: {}, style: { bgcolor: 0xffcc00, color: 0x000000 } }],
	}

	presets['decoder_continue'] = {
		type: 'simple',
		name: 'Decoder: Resume',
		style: style('RESUME', 0x005500),
		steps: [{ down: [{ actionId: 'decoder_continue', options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['decoder_catch_up'] = {
		type: 'simple',
		name: 'Decoder: Catch up to live',
		style: style('CATCH UP', 0x005577),
		steps: [{ down: [{ actionId: 'decoder_catch_up', options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['decoder_jog_back'] = {
		type: 'simple',
		name: 'Decoder: Jog back 10s',
		style: style('-10s', 0x333333),
		steps: [{ down: [{ actionId: 'decoder_jog', options: { seconds: -10 } }], up: [] }],
		feedbacks: [],
	}

	presets['decoder_jog_forward'] = {
		type: 'simple',
		name: 'Decoder: Jog forward 10s',
		style: style('+10s', 0x333333),
		steps: [{ down: [{ actionId: 'decoder_jog', options: { seconds: 10 } }], up: [] }],
		feedbacks: [],
	}

	presets['decoder_return_live'] = {
		type: 'simple',
		name: 'Decoder: Return to the room',
		style: style('LIVE', 0x005500),
		steps: [{ down: [{ actionId: 'decoder_return_to_live', options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['decoder_status'] = {
		type: 'simple',
		name: 'Decoder: status',
		style: {
			text: '$(obs-multisite:decoder_state)\\n$(obs-multisite:decoder_behind_live)',
			size: 'auto',
			color: 0xffffff,
			bgcolor: 0x000000,
			show_topbar: false,
		},
		steps: [{ down: [{ actionId: 'vendor_request', options: { request: 'decoder/status', data: '{}' } }], up: [] }],
		feedbacks: [
			{ feedbackId: 'decoder_playing', options: {}, style: { bgcolor: 0x00aa00 } },
			{ feedbackId: 'decoder_held', options: {}, style: { bgcolor: 0xffcc00, color: 0x000000 } },
			{ feedbackId: 'decoder_no_source', options: {}, style: { bgcolor: 0x880000 } },
		],
	}

	const structure: CompanionPresetSection<ModuleSchema>[] = []

	// The encoder bank belongs to a main site. A campus player has no encoder,
	// so a section of buttons that can only refuse is not offered at all — and
	// the presets it would have referenced are dropped below, because a preset
	// with no section is still draggable from the presets list.
	if (self.isObs) {
		structure.push({
			id: 'encoder',
			name: 'Multisite: main site',
			definitions: [
				{
					id: 'encoder_controls',
					type: 'simple',
					name: 'The broadcast',
					description: 'Start and stop the event, and a button showing whether it is on air.',
					presets: ['encoder_go_live', 'encoder_end', 'encoder_status'],
				},
			],
		})
	}

	structure.push({
		id: 'decoder',
		name: 'Multisite: campus',
		definitions: [
			{
				id: 'decoder_transport',
				type: 'simple',
				name: 'Transport',
				description: 'Play, hold and catch up, with the lights already attached.',
				presets: ['decoder_play', 'decoder_hold', 'decoder_continue', 'decoder_catch_up', 'decoder_return_live'],
			},
			{
				id: 'decoder_nudge',
				type: 'simple',
				name: 'Nudge and status',
				description: 'Step ten seconds either way, and a button showing how far behind live it is.',
				presets: ['decoder_jog_back', 'decoder_jog_forward', 'decoder_status'],
			},
		],
	})

	if (!self.isObs) {
		delete presets.encoder_go_live
		delete presets.encoder_end
		delete presets.encoder_status
	}

	self.setPresetDefinitions(structure, presets)
}
