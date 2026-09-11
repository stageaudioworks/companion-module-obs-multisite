# companion-module-obs-multisite

A [Bitfocus Companion](https://companion.free) module for
[obs-multisite](https://github.com/stageaudioworks/obs-multisite) — the
store-and-forward video system for sending one live event from a main campus to
satellite campuses over ordinary venue internet.

It puts the event on a Stream Deck: **Go live** and **End** at the main site,
and **Play / Hold / Resume / Catch up / Jog** at a campus, with the buttons
lighting up to show what is actually happening — on air, held, buffering, how
far behind live, or that the link has gone wobbly.

## Status

**Alpha, and not yet in the Companion store.** It has to be installed as a
developer module for now (see below). It has been driven against a real OBS —
the connection, the commands and the feedbacks — but it has not yet run a full
event end to end.

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

## Installing it before it is in the store

Companion loads unreleased modules from a **developer modules path**. That path
is a _directory to search_, not the module itself: each folder inside it that has
a `companion/manifest.json` is treated as a module.

```sh
git clone https://github.com/stageaudioworks/companion-module-obs-multisite
cd companion-module-obs-multisite
yarn install && yarn build        # the manifest points at dist/, so this matters

mkdir -p ~/companion-dev-modules
ln -s "$PWD" ~/companion-dev-modules/obs-multisite
```

Then, in the **Companion launcher** (not the web UI): **Developer** → tick
**Enable Developer Modules**, set **Developer Modules Path** to
`~/companion-dev-modules`, and restart Companion. The module appears in the
Connections list marked _Dev_.

`yarn build` again after a code change and Companion reloads it — the launcher
watches that directory.

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

- **Companion 4.0 or later** — this uses module API `@companion-module/base` 2.x,
  and Companion installs modules on demand from 4.0. (It also loads as a developer
  module from the 3.x launcher, but the store path is 4.0 and up.)
- obs-multisite **v0.1.10-alpha or later** — the release that carries the
  obs-websocket **vendor API**. Against an older plugin the connection succeeds
  but no commands appear; the module logs that it found nothing to talk to.

## License

The module source is **MIT** — a requirement of the Companion module store,
which keeps modules portable. The module is distributed under
**GPL-3.0-only**, declared in `companion/manifest.json`, matching the licence of
[obs-multisite](https://github.com/stageaudioworks/obs-multisite) itself.

See [LICENSE](./LICENSE).
