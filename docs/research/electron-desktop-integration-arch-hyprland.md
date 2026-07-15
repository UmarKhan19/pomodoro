# Electron desktop integration on this Arch/Hyprland machine

Research for [Verify Electron desktop integration on this Arch/Hyprland machine](https://github.com/UmarKhan19/pomodoro/issues/2), performed 2026-07-15.

## Answer

Use **Electron 43.1.0 with its default Ozone `auto` behavior**, which runs natively on Wayland in this session. Do not set `ELECTRON_OZONE_PLATFORM_HINT` and do not add an Ozone command-line flag. Keep the tested `--ozone-platform=x11` mode as a documented fallback, not the default.

For v1 on this machine:

- **Include** native desktop notifications through Electron `Notification`.
- **Include** a brief renderer-produced completion sound through Web Audio.
- **Include** suspend/resume handling through Electron `powerMonitor`.
- **Include** an installed freedesktop `.desktop` entry and icon, with its filename passed to `app.setDesktopName()` before `ready`.
- **Exclude tray behavior.** Electron can construct a `Tray`, but this desktop has no StatusNotifier watcher, no Waybar tray module, and no X11 system-tray owner, so the icon is not visible without changing the desktop setup. That fails the map's no-system-reconfiguration threshold.

Native Wayland and XWayland both launched successfully, but the required feature set does not need Electron's documented XWayland-only positioning and post-creation resizing capabilities. Native Wayland is therefore the simpler supported default.

## Explicit findings

| Capability | Result | Current-machine evidence |
| --- | --- | --- |
| Supported Electron baseline | **PASS** | Arch's `/usr/bin/electron` resolves to Electron 43.1.0; it is the current stable major and inside Electron's latest-three-stable support window. |
| Default/native Wayland window | **PASS** | With no Ozone flags, Electron created a mapped, visible Hyprland client with `xwayland: false` and exited cleanly. Explicit `--ozone-platform=wayland` did the same. |
| XWayland fallback | **PASS** | `--ozone-platform=x11` created a mapped, visible client with `xwayland: true` and exited cleanly. XWayland 24.1.13 is already running. |
| Standard Electron `Tray` | **FAIL** | `Tray` constructed but reported `{x:0,y:0,width:0,height:0}`. Neither `org.kde.StatusNotifierWatcher` nor `org.freedesktop.StatusNotifierWatcher` exists, Waybar's configured modules omit `tray`, and `_NET_SYSTEM_TRAY_S0` has no owner. The icon was not user-visible. |
| Native desktop notification | **PASS** | `Notification.isSupported()` returned `true`; Electron emitted `show`; D-Bus captured `org.freedesktop.Notifications.Notify` with the expected app name, title, body, desktop-entry ID, urgency, and icon data. SwayNotificationCenter 0.12.6 owns the notification service. |
| Completion audio | **PASS** | After a trusted renderer click, Web Audio entered `running`, completed a two-second oscillator, and created an active PipeWire `Stream/Output/Audio` routed to the default hardware sink. |
| Suspend/resume detection | **PASS**, with end-to-end smoke still required | `powerMonitor` initialized and returned live idle/power data; listeners for `suspend` and `resume` registered without error. `systemd-logind` is active, reports `CanSuspend = yes`, and exposes `PrepareForSleep`. A physical suspend was deliberately not triggered during the active agent session; the final machine smoke test must exercise the two events. |
| App-menu launcher with name and icon | **PASS** | A temporary standards-compliant desktop entry and valid PNG icon passed `desktop-file-validate`, were indexed by this machine's Rofi `drun` launcher, and launched the probe through `gtk-launch`. Hyprland observed the matching native-Wayland application ID. |

## Current machine

Observed on 2026-07-15:

```text
OS:                   Arch Linux
Kernel:               7.1.3-arch1-3 x86_64
Session:              XDG_SESSION_TYPE=wayland
Desktop:              XDG_CURRENT_DESKTOP=Hyprland
Wayland display:      wayland-1
X11 display:          :0
Hyprland:             0.55.4
Electron:             43.1.0 (Chromium 150.0.7871.47, Node 24.18.0)
XWayland:              24.1.13
Waybar:               0.15.0
Notification server:  SwayNotificationCenter 0.12.6
PipeWire:              1.6.8
WirePlumber:           0.5.15
Rofi:                  2.0.0
```

Relevant existing services and packages were already present: SwayNotificationCenter owns `org.freedesktop.Notifications`; PipeWire, PipeWire Pulse, and WirePlumber are active; `systemd-logind` is active; `desktop-file-utils` and `xdg-utils` are installed. No compositor file, panel file, daemon, service, or system package was changed by the probes. Temporary launcher files were removed afterward.

## Probe details

### Runtime and window backend

A minimal Electron app created one `BrowserWindow` under three launch modes. Hyprland's own client data, rather than environment-variable inference, identified the backend:

```text
launch                                  Hyprland xwayland   mapped   visible   exit
electron /tmp/pomodoro-electron-probe   false               true     true      0
electron --ozone-platform=wayland ...   false               true     true      0
electron --ozone-platform=x11 ...       true                true     true      0
```

Electron 38 changed `--ozone-platform`'s default to `auto`, making Electron native-Wayland by default in a Wayland session. Electron 43's documentation still identifies `--ozone-platform=x11` as the compatibility mode when an app needs programmatic positioning, movement, focus, or post-creation resizing.

Hyprland tiled the probe's requested 420×220 normal window to the available tile. This is compositor policy, not a launch failure. The v1 specification should treat “compact” as the app's requested initial/content size and responsive information density; it must not promise to override Hyprland's tiling or force a floating position.

Each mode logged one non-fatal VA-API initialization error. The app has no video-decoding requirement, the renderer remained healthy, and every process exited with status 0, so this is not a v1 blocker.

### Tray

The standard Electron call completed:

```text
new Tray(icon)
tray.setToolTip(...)
tray.setContextMenu(...)
tray.getBounds() -> { x: 0, y: 0, width: 0, height: 0 }
```

However, all three required host checks were negative:

```text
org.kde.StatusNotifierWatcher:           absent
org.freedesktop.StatusNotifierWatcher:   absent
X11 _NET_SYSTEM_TRAY_S0 owner:            absent
Waybar configured `tray` module:          absent
```

Electron documents that Linux tray icons use StatusNotifierItem when available and otherwise fall back to `GtkStatusIcon`. This session hosts neither StatusNotifierItem nor the legacy X11 tray protocol. Constructing an invisible object is not a user-facing pass. Enabling Waybar's tray module or adding another host would be desktop reconfiguration and is outside the acceptance threshold.

### Notifications

The current notification server reported freedesktop Notifications specification version 1.3. Electron's main-process API reported support and emitted `show`. A D-Bus monitor observed:

```text
interface:      org.freedesktop.Notifications
member:         Notify
app_name:       Pomodoro Electron Probe
summary:        Pomodoro Electron probe
body:           Native notification integration is working.
desktop-entry:  io.github.UmarKhan19.PomodoroElectronProbe
urgency:        normal
icon data:      present
```

Use `silent: true` if the app also plays its own completion audio, avoiding two competing sounds. Notification click behavior is not required for completion feedback and was not used as a pass criterion.

### Completion audio

The renderer created an `AudioContext`, oscillator, and low-gain output after a trusted click, matching the product's manual Start interaction. Observations:

```text
AudioContext state:       running
Oscillator completion:    observed
PipeWire application:     Pomodoro Electron Probe
Media class:              Stream/Output/Audio
Route:                    default Ryzen HD Audio Controller Analog Stereo sink
Stream state:             active during playback
```

The implementation should initialize or resume its audio context from a user gesture (for example, Start) and reuse it for interval-completion playback. No external audio player, daemon, or shell command is needed.

### Suspend and resume

The probe subscribed to `powerMonitor`'s `suspend` and `resume` events after `app.whenReady()` and successfully queried:

```text
getSystemIdleState(60):  active
getSystemIdleTime():     0 during probe
isOnBatteryPower():      false during probe
```

On this machine, `systemd-logind` reports that suspend is available and exposes the `PrepareForSleep(boolean)` signal used around sleep transitions. Electron officially exposes matching `suspend` and `resume` events.

A real suspend would interrupt the active development/session environment, so it was not initiated automatically. This is the only destructive leg not exercised end to end. The implementation-ready acceptance strategy must require a manual machine smoke test that starts a short disposable interval, suspends, resumes, and confirms exactly one suspend and one resume transition while remaining time does not advance during sleep.

### App-menu launcher

The temporary probe installed:

```ini
[Desktop Entry]
Type=Application
Name=Pomodoro Electron Probe
Exec=/usr/bin/env ... /usr/bin/electron /tmp/pomodoro-electron-probe
Icon=io.github.UmarKhan19.PomodoroElectronProbe
Terminal=false
Categories=Utility;
```

The file and PNG icon were placed under the user's XDG data hierarchy for the test. `desktop-file-validate` and `update-desktop-database` succeeded. Rofi `drun` returned the named entry and resolved the icon when icon display was enabled; `gtk-launch` started it, and Hyprland observed `class: io.github.UmarKhan19.PomodoroElectronProbe` with `xwayland: false`.

The packaged app should install a reverse-DNS-named desktop file and theme icon, then call `app.setDesktopName('<same filename>.desktop')` before `ready`. The current Rofi invocation suppresses icons globally by default; the application can and must provide correct icon metadata but should not alter that launcher-wide user preference.

## Specification consequences

1. Set the tested runtime baseline to Electron 43.1.0 using native Wayland/default Ozone auto behavior. If the toolchain decision selects a newer supported major, rerun these smoke probes before changing the baseline.
2. Do not add `ELECTRON_OZONE_PLATFORM_HINT`; Electron removed it. Do not add `--ozone-platform=wayland`, because the supported default already chooses Wayland.
3. Document `--ozone-platform=x11` only as a troubleshooting fallback. Nothing in the current v1 feature set requires it.
4. Remove tray-dependent behavior from v1 on this machine. In particular, the app must not hide its only window with no discoverable way to reopen it.
5. Native notification and local completion audio are both viable. The completion-feedback decision can choose one or both without desktop changes.
6. Own suspend/resume detection in the Electron main process via `powerMonitor`; require the final real-suspend smoke test noted above.
7. Package a `.desktop` file plus icon and keep its filename aligned with `app.setDesktopName()` and the Wayland application ID.
8. Do not require compositor rules, a custom notification daemon, a tray host, an external audio player, or system reconfiguration.

## Primary sources

- [Electron 43.1.0 release](https://github.com/electron/electron/releases/tag/v43.1.0) — exact tested runtime and bundled Chromium/Node versions.
- [Electron release support policy](https://github.com/electron/electron/blob/v43.1.0/docs/tutorial/electron-timelines.md#version-support-policy) — latest three stable majors are supported.
- [Electron 38 breaking change: native Wayland by default](https://www.electronjs.org/blog/electron-38-0#removed-electron_ozone_platform_hint-environment-variable) — Ozone defaults to `auto`, `ELECTRON_OZONE_PLATFORM_HINT` was removed, and `--ozone-platform=x11` is the compatibility escape hatch.
- [Electron `BrowserWindow` platform notices](https://github.com/electron/electron/blob/v43.1.0/docs/api/browser-window.md#platform-notices) — native Wayland positioning/resizing limits and the XWayland flag.
- [Electron `Tray` API, Linux platform considerations](https://github.com/electron/electron/blob/v43.1.0/docs/api/tray.md#platform-considerations) — StatusNotifierItem and `GtkStatusIcon` behavior.
- [Waybar 0.15 tray module documentation](https://github.com/Alexays/Waybar/blob/0.15.0/man/waybar-tray.5.scd) — the panel module that hosts tray items.
- [Electron notification tutorial, Linux](https://github.com/electron/electron/blob/v43.1.0/docs/tutorial/notifications.md#linux) and [Notification API](https://github.com/electron/electron/blob/v43.1.0/docs/api/notification.md) — libnotify/freedesktop integration, support detection, and delivery events.
- [freedesktop Desktop Notifications Specification](https://specifications.freedesktop.org/notification-spec/latest/) — notification service protocol implemented by the current server.
- [Electron `powerMonitor` API](https://github.com/electron/electron/blob/v43.1.0/docs/api/power-monitor.md) — suspend and resume events.
- [`org.freedesktop.login1` D-Bus API](https://www.freedesktop.org/software/systemd/man/latest/org.freedesktop.login1.html) — `PrepareForSleep` semantics and sleep capability.
- [Web Audio API specification](https://www.w3.org/TR/webaudio/) — renderer audio graph used by the probe.
- [Electron `app.setDesktopName()`](https://github.com/electron/electron/blob/v43.1.0/docs/api/app.md#appsetdesktopnamename-linux), [Electron Linux desktop launcher guidance](https://github.com/electron/electron/blob/v43.1.0/docs/tutorial/linux-desktop-actions.md), and [freedesktop Desktop Entry Specification](https://specifications.freedesktop.org/desktop-entry-spec/latest/) — launcher identity, entry, execution, and icon metadata.
