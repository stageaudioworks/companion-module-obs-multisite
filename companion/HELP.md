## obs-multisite

Control a Multisite broadcast from Companion: start and stop the event at the
main site, and drive a campus feed's timeslipping — play, hold, catch up, jog —
with buttons that light up to show what is actually happening.

This module talks to the obs-multisite plugin inside OBS over obs-websocket.

### Configuration

You need the obs-multisite plugin loaded in OBS and the WebSocket Server turned
on (Tools → WebSocket Server Settings).

- **OBS host** — where OBS is running. `127.0.0.1` if Companion is on the same
  machine.
- **Port** — the WebSocket Server port, 4455 by default.
- **OBS WebSocket password** — from the same OBS settings window, if you set one.

> The module opens its own connection, so these are the same values you may have
> given the OBS Studio module. Companion modules each own their connection.

### Actions

**Main site (encoder)**

- **Go live** — start the event. Leave the name blank to name it with the
  current time, exactly as the dock does.
- **End the broadcast** — finish cleanly.
- **Drop a marker** — pick one of the markers the main site published, or type
  your own.

**Campus (decoder)**

- **Play / Stop / Hold / Resume** — the transport. _Hold_ keeps the picture on
  screen and stops advancing; _Resume_ continues from where it stopped.
- **Catch up to live** — jump to the live edge.
- **Return to the room** — stop playing a past recording and follow whatever the
  room is live with.
- **Jog** — step forward or back by a number of seconds (negative goes back).
- **Seek** — go to a clock time within the recording (seconds from midnight).
- **Sit behind live** — hold a constant delay behind live. Zero returns to the
  live edge.
- **Jump to a marker** — go to a cue.
- **Load a recording** — play a past event from this room. Pinning does not
  follow the room afterwards.

**Any obs-multisite request** — call any command of the plugin by name, with a
JSON object. The escape hatch for a command a newer plugin has that this module
does not yet.

### Feedbacks

- **Encoder: the broadcast is live**
- **Encoder: the link is degraded or offline**
- **Decoder: playing / held / buffering / loading**
- **Decoder: no source on this machine** — the fix is in the scene collection,
  not on the surface.
- **Decoder: the recording has ended**
- **Decoder: more than N seconds behind live**
- **Decoder: the link is degraded or offline**

A link reading is only shown once it is a real measurement; before anything has
been tried it is blank rather than "healthy".

### Variables

Encoder: `encoder_live`, `encoder_status`, `encoder_event_id`,
`encoder_event_name`, `encoder_room`, `encoder_confirmed`, `encoder_pending`,
`encoder_retries`, `encoder_bytes`, `encoder_upload_rate`, `encoder_link`,
`encoder_colo`, `encoder_version`.

Decoder: `decoder_state`, `decoder_have_source`, `decoder_playing`,
`decoder_held`, `decoder_buffering`, `decoder_loading`, `decoder_ended`,
`decoder_behind_live`, `decoder_playhead`, `decoder_live`,
`decoder_cached_segments`, `decoder_link`, `decoder_current_marker`,
`decoder_event_id`, `decoder_room`, `decoder_version`.

### Presets

Two banks — **Multisite: main site** (Go live, End, status) and
**Multisite: campus** (Play, Hold, Resume, Catch up, Return to the room, Jog
either way, status) — with the feedbacks already attached.
