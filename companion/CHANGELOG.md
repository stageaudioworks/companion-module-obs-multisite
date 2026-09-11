# Changelog

All notable changes to this module are recorded here.

## [0.1.0] — unreleased

First functional version.

- Connect to OBS over obs-websocket, and to the `obs-multisite` vendor.
- Actions: Go live, End, Drop a marker; Play, Stop, Hold, Resume, Catch up,
  Return to the room, Jog, Seek, Sit behind live, Jump to a marker, Load a
  recording; and a pass-through for any vendor request.
- Feedbacks: on air; playing / held / buffering / loading; no source; the
  recording has ended; more than N seconds behind live; link degraded or
  offline.
- Variables for both halves, so a button can show the state as text.
- Two preset banks for the main site and a campus.
- State is seeded by asking on connect and by a slow poll, as well as by the
  plugin's pushed events, so a module that connects mid-event shows the truth
  immediately rather than waiting for the next change.
