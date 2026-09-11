# companion-module-obs-multisite

A [Bitfocus Companion](https://companion.free) module for
[obs-multisite](https://github.com/stageaudioworks/obs-multisite) — the
store-and-forward video system for sending one live event from a main campus to
satellite campuses over ordinary venue internet.

It puts the event on a Stream Deck: **Go live** and **End** at the main site,
and **Play / Hold / Resume / Catch up / Jog** at a campus, with the buttons
lighting up to show what is actually happening — on air, held, buffering, how
far behind live, or that the link has gone wobbly.

## Getting started

You need three things on the machine running OBS:

1. The **obs-multisite plugin** loaded (Tools → Multisite, or a Multisite source
   in the scene collection).
2. The **WebSocket Server** turned on — Tools → WebSocket Server Settings. It
   ships with OBS 28 and later.
3. That machine reachable from wherever Companion runs.

Then, in Companion, add a connection and enter the OBS host, the WebSocket port
(4455 by default) and the WebSocket password.

> This module opens its own obs-websocket connection, so the host, port and
> password are the same ones you may already have given Companion's OBS Studio
> module. Companion modules each own their connection; there is no way around
> entering them twice.

See [companion/HELP.md](./companion/HELP.md) for what each action, feedback and
variable does.

## How it works

Everything here is an adapter. The obs-multisite plugin exposes its commands as
**obs-websocket vendor requests** under the vendor name `obs-multisite`, and
pushes **vendor events** when the state changes. This module calls those
requests and listens for those events — it adds no control logic of its own, so
a button here and a keypress on the desk cannot disagree about what "hold"
means.

The command names are the same ones the plugin's own web pages use, which is
what makes the two interchangeable. If a newer plugin adds a command this module
does not know yet, the **Any obs-multisite request** action reaches it without
waiting for a module release.

## Requirements

- Companion 3.x or later (module API `@companion-module/base` 2.x).
- obs-multisite with the **vendor API** — the obs-websocket work added after
  v0.1.9-alpha. Against an older plugin the connection succeeds but no commands
  appear; the module logs that it found nothing to talk to.

## License

The module source is **MIT** — a requirement of the Companion module store,
which keeps modules portable. The module is distributed under
**GPL-3.0-only**, declared in `companion/manifest.json`, matching the licence of
[obs-multisite](https://github.com/stageaudioworks/obs-multisite) itself.

See [LICENSE](./LICENSE).
