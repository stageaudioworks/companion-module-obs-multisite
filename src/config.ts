import { Regex } from '@companion-module/base'
import type { SomeCompanionConfigField } from '@companion-module/base'

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'Before you start',
			width: 12,
			value:
				'This module talks to OBS over obs-websocket, and needs two things on the OBS machine: ' +
				'the WebSocket Server turned on (Tools → WebSocket Server Settings) and the obs-multisite ' +
				'plugin loaded (Tools → Multisite, or a Multisite source in the scene). ' +
				'It opens its own connection, so the host, port and password below are the same ones ' +
				'you gave the OBS Studio module.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'OBS host',
			width: 8,
			default: '127.0.0.1',
			regex: Regex.HOSTNAME,
		},
		{
			type: 'number',
			id: 'port',
			label: 'Port',
			width: 4,
			default: 4455,
			min: 1,
			max: 65535,
		},
		{
			type: 'secret-text',
			id: 'password',
			label: 'OBS WebSocket password',
			width: 12,
			default: '',
		},
	]
}
