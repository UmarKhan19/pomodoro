# Electron repeat-launch activation on Arch/Hyprland

Research for [Verify repeat-launch window activation on native Wayland](https://github.com/UmarKhan19/pomodoro/issues/14), performed 2026-07-16.

## Answer

Electron 43.1.0 can **reliably keep one application instance and notify the existing instance of a repeat launch** on this machine. It cannot reliably force the existing native-Wayland window to take focus or move to the active workspace.

The production contract should be:

1. acquire Electron's single-instance lock before normal startup;
2. let every later process notify the primary and exit without creating a window or a new Timer Run;
3. in the primary's `second-instance` handler, restore or show the sole window only when its current state requires it, then make one best-effort focus request; and
4. describe the result as **requesting activation**, never as guaranteed “bring to front.”

The handler's required ordering is equivalent to:

```ts
if (window.isMinimized()) window.restore()
if (!window.isVisible()) window.show()
window.focus()
```

`show()` must not be called unconditionally. On an already-visible window it provided no stronger result than `focus()` and produced redundant activation traffic in the probe. `app.focus()` is also unnecessary: on Linux Electron implements it by focusing the first visible window, so it is equivalent but less precise for this one-window application and does nothing for a hidden window.

On this exact Hyprland configuration, a focus request for an unfocused visible window reliably becomes **urgency**, not focus:

- the previously focused application stays focused;
- the active workspace does not change;
- a Pomodoro Timer window on another workspace stays there; and
- Hyprland emits an `urgent` event for the Pomodoro Timer window.

That result held both when Electron generated a fresh XDG activation token and when a valid compositor-issued token was passed through the launcher-style `XDG_ACTIVATION_TOKEN` path and transferred through Electron's single-instance path. How urgency is presented to the user remains compositor/panel policy.

## Guaranteed behavior versus best effort

| Situation or operation | Reliable application behavior | Current-machine compositor result | Specification status |
| --- | --- | --- | --- |
| Second process calls `requestSingleInstanceLock()` | The primary receives `second-instance`; the second process receives `false` and exits without creating another window | No second Hyprland surface appeared | **Required guarantee** |
| Visible, unfocused window on the active workspace; `window.focus()` | Electron sends an XDG activation request | Existing app kept focus; Pomodoro Timer became urgent | **Best effort only** |
| Visible, unfocused window on another workspace; `window.focus()` | Electron sends an XDG activation request | Workspace did not switch; window stayed on its workspace and became urgent | **Best effort only** |
| Visible window; `window.show()` | Electron reports/show-notifies and also requests activation | No better focus result than `focus()`; redundant urgency was observed | Do not call unconditionally |
| Visible window; `app.focus()` | Electron selects the first visible app window and requests focus | Same urgency-only result | Do not use for the sole window |
| Hidden or initial `show: false` window; `window.focus()` or `app.focus()` | No visible window is activated | No surface appeared and focus did not change | `show()` is required first |
| Hidden window; `window.show()` | The Wayland toplevel is remapped | It mapped on the currently active workspace; final focus varied between probes | Mapping observed; focus remains best effort |
| `window.minimize()` | Electron enters a local minimized/hidden state | Hyprland ignored minimization and left the surface mapped and visible | Do not expose minimization in v1 |
| Minimized window; `restore()` then `focus()` | Electron returns its local state to visible/non-minimized and requests activation | Surface remained on its workspace; focus did not move | Defensive fallback only |

The XDG activation protocol deliberately leaves activation to the compositor. Even a valid token can be ineffective, and the client cannot discover that from the protocol. Electron's own Wayland documentation likewise says focus may instead produce a notification or flashing app icon.

## Current machine facts

Observed without changing compositor rules or configuration:

```text
Electron:                         43.1.0
Chromium:                         150.0.7871.47
Hyprland:                         0.55.4
Window backend:                   native Wayland (xwayland: false)
misc:focus_on_activate:           false (int 0, not explicitly set)
Pomodoro window focus_on_activate false
XDG activation protocol:         available, version 1
```

`misc:focus_on_activate = false` is also Hyprland 0.55.4's default. Hyprland's activation implementation marks a window urgent first, then stops before focusing it when this setting (or the equivalent window rule) is false. The current Pomodoro probe window had no rule overriding that result.

No Hyprland, Waybar, launcher, or desktop configuration was edited. The probes did not force XWayland, invoke compositor IPC as an application workaround, create a compositor rule, or use always-on-top behavior. `hyprctl` was used only by the research harness to inspect state, return focus to a known window, and place a probe window on a disposable workspace before testing it.

## Probe design

A disposable Electron app under `/tmp` used the same intended production shape:

- Electron 43.1.0 with default Ozone auto/native Wayland;
- one normal `BrowserWindow` with a stable Wayland application ID;
- `requestSingleInstanceLock(additionalData)` before `ready`;
- a primary-process `second-instance` handler;
- structured logs of Electron visibility, focus, and minimized state; and
- Hyprland client/event inspection before and after each repeat launch.

Sixteen fresh-primary matrix cases compared `noop`, `focus`, `show`, `app.focus`, `restore`, and ordered combinations across visible, other-workspace, client-minimized, and explicitly hidden states. Additional probes covered an initially `show: false` window, hiding a window that had been on another workspace, minimization on another workspace, and repeat launch with a valid compositor-issued activation token.

All tested secondary processes:

- failed to acquire the lock as intended;
- caused exactly one action-bearing `second-instance` event in the primary;
- exited successfully;
- created no second `BrowserWindow` or Hyprland client; and
- left the existing primary process and its in-memory state alive.

The temporary probe code and raw traces stayed outside the repository under `/tmp`; they are not application implementation.

## Single-instance and activation-token path

Electron's Linux implementation temporarily injects a launching process's `XDG_ACTIVATION_TOKEN` into the process-singleton command line. The existing primary extracts and removes that switch before emitting `second-instance`. The next `window.focus()` consumes that transferred token. If no token arrived, Chromium requests a fresh token from the compositor.

The no-token trace showed the full request path:

```text
xdg_activation_v1.get_activation_token(...)
xdg_activation_token_v1.commit()
xdg_activation_token_v1.done("<token>")
xdg_activation_v1.activate("<token>", <window surface>)
```

A second launch carrying a valid compositor-issued token skipped token creation and went directly to:

```text
xdg_activation_v1.activate("<forwarded token>", <window surface>)
```

In both cases Hyprland emitted `urgent` and retained the previously active window. With the Pomodoro Timer on disposable workspace 99 and the launching window on workspace 1, the valid-token result was:

```text
before: active workspace 1; Pomodoro Timer on workspace 99
request: forwarded-token window.focus()
after:  active workspace 1; Pomodoro Timer still on workspace 99
Hyprland event: urgent for Pomodoro Timer
```

This means launcher integration and Electron token forwarding are functioning. The lack of forced focus is the chosen compositor policy, not a missing Electron token.

## Visible-window activation

For a visible but unfocused native-Wayland window:

- `window.focus()` issued one activation request and did not focus the window;
- `app.focus()` had the same result because Electron delegates to the first visible window;
- a no-op `second-instance` handler caused no activation by itself; and
- `window.show()` on an already-visible window did not raise it, switch workspaces, or focus it. It generated extra activation/urgency activity and therefore should not be the normal path.

The result was the same with both windows on one workspace and with the Pomodoro Timer on another workspace. There is no supported Electron API that upgrades this request into a focus guarantee on native Wayland.

The application must not compensate with `hyprctl`, a Pomodoro-specific `focus_on_activate` rule, forced XWayland, repeated notifications, temporary always-on-top, or a second surrogate window. Those would violate the map's no-desktop-reconfiguration boundary and Wayland's focus-stealing model.

## Minimized state

Native Wayland has no queryable minimized state or unminimize request in `xdg-shell`. A compositor may ignore `set_minimized`, and Electron 43's `BrowserWindow` documentation explicitly says minimized is not currently a supported Wayland state.

That limitation is concrete on this machine. After `window.minimize()`:

```text
Electron:  visible=false, focused=false, minimized=true
Hyprland:  mapped=true, visible=true, hidden=false
```

Hyprland 0.55.4 receives the `set_minimized` request but does not apply it to a native xdg-toplevel. Electron nevertheless updates its own local state and emits `minimize`. This creates a dangerous split: the user can still see the tiled window while Electron treats it as not visible, so a direct `window.focus()` is a no-op inside Electron's native-window layer.

`restore()` reconciled Electron's local state to visible/non-minimized. Following it with `focus()` still produced only a best-effort activation request. When the surface was on another workspace, it remained there.

The production window policy should therefore expose **no minimize control or accelerator**. `BrowserWindow`'s `minimizable: false` option is not implemented on Linux, so that option cannot enforce the policy. The frame/title-bar decision must avoid presenting a minimize affordance—for example, by owning only the controls v1 actually permits—rather than relying on the unsupported option.

## Hidden and not-yet-shown states

`window.hide()` genuinely unmaps the Wayland toplevel. While hidden:

- `window.focus()` is explicitly ignored by Electron's native-window implementation;
- `app.focus()` finds no visible window and is also a no-op; and
- `window.show()` recreates/remaps the toplevel and requests activation.

A window hidden after being placed on another workspace remapped on the workspace active at `show()` time; its prior workspace association was not preserved. In repeated probes the remapped window became focused initially, but final focus was not stable in every run. The specification may rely on remapping, not on focus or workspace-history preservation.

v1 should not have a user-reachable hidden/background state. Closing its only window quits and ends the Timer Run, and there is no tray from which to recover a hidden window. The conditional `show()` branch remains useful only as defensive lifecycle handling.

One transient hidden state is still expected: a `BrowserWindow` created with `show: false` to guarantee a theme-correct first paint. Electron defers `second-instance` until the app is ready, but not until that renderer is ready for first show. If a repeat launch arrives during this startup gap, the Application Shell must remember the activation request and complete the normal theme-correct first-show gate before showing/focusing. A repeat launch must not reveal an unready or wrong-theme renderer.

## Specification consequences

1. **Single-instance startup is normative.** Request the lock before creating the Application Shell's window or Timer Runtime. A lock-losing process exits without beginning a Timer Run.
2. **One repeat launch never resets state.** It must not recreate Timer Runtime, reset the current interval, alter the Focus Session Number, replay Completion Feedback, or create another window.
3. **Use the sole `BrowserWindow` directly.** In `second-instance`, restore if Electron reports minimized, show if still not visible, then call `focus()` once. Do not use `app.focus()` or unconditional `show()`.
4. **Gate startup presentation.** If first show is still pending, record the activation request and honor it only after persisted theme and renderer readiness satisfy the normal no-flash first-show contract.
5. **Activation wording must be honest.** The implementation requests focus; current Hyprland normally marks the window urgent instead. Acceptance must not require a workspace switch or stolen focus.
6. **Do not expose minimize or hide.** The production frame may expose Close, but no minimize command, minimize accelerator, hide command, close-to-background behavior, or tray recovery path. Closing ends the Timer Run.
7. **No focus workaround is part of v1.** Do not require compositor rules, desktop reconfiguration, XWayland, `hyprctl`, always-on-top toggles, or extra notification behavior.
8. **Machine acceptance should cover the boundary.** From both the active workspace and another workspace, launch the installed desktop entry twice and verify one process/window/Timer Run, clean secondary exit, an activation request/urgency indication, unchanged timer state, and no forced-focus promise. Also verify that the production frame exposes no unsupported minimize path.

These findings unblock [Specify the production window policy](https://github.com/UmarKhan19/pomodoro/issues/13): repeat launch has a precise implementation path, but its user-visible activation remains compositor-controlled.

## Primary sources

- [Electron 43.1.0 `app` API](https://github.com/electron/electron/blob/v43.1.0/docs/api/app.md#event-second-instance) — `second-instance`, the usual restore/focus response, `requestSingleInstanceLock()`, and Wayland's best-effort `app.focus()` semantics.
- [Electron 43.1.0 `BrowserWindow` API and Wayland platform notices](https://github.com/electron/electron/blob/v43.1.0/docs/api/browser-window.md#platform-notices) — focus limitations, hidden-window APIs, and unsupported Wayland minimization.
- [Electron single-instance activation-token implementation](https://github.com/electron/electron/blob/v43.1.0/shell/browser/api/electron_api_app.cc#L433-L461) and [lock notification path](https://github.com/electron/electron/blob/v43.1.0/shell/browser/api/electron_api_app.cc#L1032-L1087) — transfer, extraction, and consumption setup for a second launch's XDG token.
- [Electron native window implementation](https://github.com/electron/electron/blob/v43.1.0/shell/browser/native_window_views.cc#L576-L612) — hidden-window focus is ignored and `show()` explicitly activates.
- [Electron `BaseWindow` options](https://github.com/electron/electron/blob/v43.1.0/docs/api/structures/base-window-options.md#L17-L25) — `minimizable` is not implemented on Linux.
- [Chromium 150 Wayland toplevel activation](https://chromium.googlesource.com/chromium/src/+/150.0.7871.47/ui/ozone/platform/wayland/host/wayland_toplevel_window.cc#298) and [XDG token creation](https://chromium.googlesource.com/chromium/src/+/150.0.7871.47/ui/ozone/platform/wayland/host/xdg_activation.cc#102) — use a transferred token or request a new one, then submit activation to the compositor.
- [XDG activation protocol](https://gitlab.freedesktop.org/wayland/wayland-protocols/-/blob/main/staging/xdg-activation/xdg-activation-v1.xml) — tokens may be ineffective and activation remains the compositor's decision.
- [Stable xdg-shell minimization contract](https://gitlab.freedesktop.org/wayland/wayland-protocols/-/blob/main/stable/xdg-shell/xdg-shell.xml#L1131) — minimization is only a request, cannot be queried or unset by the client, and unsupported requests may be ignored.
- [Hyprland 0.55.4 XDG activation handling](https://github.com/hyprwm/Hyprland/blob/v0.55.4/src/protocols/XDGActivation.cpp#L59-L89) — accepted activation requests are handed to the target window.
- [Hyprland 0.55.4 window activation behavior](https://github.com/hyprwm/Hyprland/blob/v0.55.4/src/desktop/view/Window.cpp#L1188-L1212) — mark urgent, then focus only when activation-focus policy permits it.
- [Hyprland 0.55.4 `focus_on_activate` default](https://github.com/hyprwm/Hyprland/blob/v0.55.4/src/config/values/ConfigValues.cpp#L471) — activation focus defaults to false.
