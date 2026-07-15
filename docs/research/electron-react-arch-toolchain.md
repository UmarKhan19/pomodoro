# Electron, React, and Arch packaging toolchain

Research for [Evaluate the Electron, React, and Arch packaging toolchain](https://github.com/UmarKhan19/pomodoro/issues/4), performed 2026-07-15.

## Answer

There is no maintained option that is simultaneously first-party Electron tooling, a current React + TypeScript scaffold, and a stable Arch-native package maker.

The viable shortlist is:

1. **`create-electron` React + TypeScript → electron-vite 5 → electron-builder 26**. This is the strongest direct fit for this Linux-only v1: it supplies the requested React scaffold, a supported Vite 7 line, integrated main/preload/renderer builds, and a working Arch `pacman` target. A disposable Electron 43.1.0 build produced a valid package and launcher on this machine. Its generated runtime security must be hardened before feature work, and electron-builder labels the `pacman` target beta.
2. **Electron Forge 7 with its Vite + TypeScript template, then electron-builder only for a prepackaged `pacman` artifact**. This keeps Electron's officially recommended packager and Forge's hardened fuse defaults. The Forge Vite plugin is explicitly experimental, React integration is manual, and the current template's TypeScript/Vite/ESLint baseline needs modernization.
3. **Electron Forge 7 with Webpack + TypeScript, then the same Arch packaging bridge or a custom `PKGBUILD`**. This avoids Forge's experimental Vite plugin and has the clearest sandboxed-preload support, but carries the most configuration and the least current React development setup.

The first stack has the least v1 friction; the Forge stacks have stronger first-party ownership and generated fuse defaults. This ticket does **not** select the application architecture. [Choose the v1 application architecture](https://github.com/UmarKhan19/pomodoro/issues/7) should choose between those trade-offs and require the non-negotiable security, packaging, and test constraints below.

## Evaluated baseline

The map fixes Electron **43.1.0** until its desktop probes are repeated against a newer runtime. The research probes therefore replaced scaffold defaults with exact `electron@43.1.0` rather than silently adopting Electron 43.1.1.

Observed locally:

```text
Arch Linux / Hyprland, x86_64
Node 25.8.2
npm 11.11.1
system Electron package: electron43 43.1.0-1 (332.56 MiB installed)
```

The direct electron-vite path and the Forge + Vite path both completed under the current Node 25 installation. However, Vite documents that odd-numbered, non-LTS Node releases are not tested in its CI. A reproducible implementation should pin a supported even-numbered Node release rather than treat this successful Node 25 probe as a support guarantee.

## Comparison

| Concern | electron-vite 5 + electron-builder 26 | Forge 7 + Vite | Forge 7 + Webpack |
| --- | --- | --- | --- |
| Ownership | Independent projects, actively released | Electron organization | Electron organization |
| React + TypeScript start | Direct `react-ts` scaffold | No first-party React/Vite/TS scaffold; add React manually | Documented manual React/TS integration |
| Development | Renderer HMR; optional main/preload restart; one config | Renderer HMR; Forge lifecycle | Renderer HMR; mature Forge lifecycle |
| Build | Separate optimized main, preload, and renderer builds | Separate Vite targets; plugin explicitly experimental | Separate Webpack targets; plugin not marked experimental |
| Current template | React 19, TS 5.9, Vite 7; Electron must be updated from 39 | TS 4.5 and Vite 5 need replacement | Template source also declares TS 4.5; React guide was tested against React 18/TS 4.3 |
| Generated renderer isolation | `contextIsolation` remains on, but scaffold explicitly disables sandboxing | Electron defaults retained | Electron defaults retained; plugin compiles sandboxed preloads by default |
| Generated bridge | Broad `@electron-toolkit/preload` API; must be removed | Empty preload; app defines its own narrow bridge | Empty preload; app defines its own narrow bridge |
| Generated fuses | Electron defaults; must configure builder's `electronFuses` | Hardened Forge fuse plugin included | Hardened Forge fuse plugin included |
| Arch package | Native `pacman` target, marked beta | No first-party pacman maker | No first-party pacman maker |
| Launcher installation | Generated and installed by configured `pacman` artifact | Use builder's supported `--prepackaged` bridge or custom packaging | Same |
| Future native modules | electron-vite externalization + builder rebuild/unpack controls | Forge rebuild + native-module plugins | Forge's most documented native-module path |
| Natural unit/component tests | Vitest on the same supported Vite pipeline | Vitest after upgrading the template's Vite | Vitest adds a second transform pipeline; Jest is another option |

## Candidate 1: electron-vite and electron-builder

### What works well

`electron-vite@5.0.0` is the current stable line; `6.0.0-beta.1` is a prerelease and should not be the v1 baseline. Version 5 supports Vite 5–7 and provides one configuration surface for main, preload, and renderer builds. Its maintained `create-electron@1.0.30` scaffold has a direct React + TypeScript preset with type-check, lint, formatting, dev, build, and electron-builder scripts.

The scaffold's dependency layout also leaves a reasonable path for future local-only features:

- renderer dependencies are bundled;
- main/preload production dependencies are externalized and included by the packager;
- externalization can be disabled for a sandboxed preload;
- native add-ons can stay external and be unpacked from ASAR;
- electron-builder can rebuild native dependencies for the selected Electron ABI.

The current v1 needs no native add-on: notifications, completion audio, power events, theme detection, and local preference files all have Electron, Web, or Node platform APIs. Native-module handling is therefore a future seam, not a reason to complicate v1.

A disposable scaffold pinned to Electron 43.1.0 resolved electron-vite 5.0.0, React 19.2.7, TypeScript 5.9.3, Vite 7.3.6, and electron-builder 26.15.3. Install, type-check, production build, and configured pacman packaging all passed; `npm audit` reported no known vulnerabilities in that resolved tree on the research date.

### Mandatory corrections to the scaffold

The template is a convenience start, not a secure application baseline.

1. **Pin Electron 43.1.0.** The tagged React/TS template declares `electron: ^39.2.6`, which cannot resolve to major 43.
2. **Delete `sandbox: false`.** Electron enables renderer sandboxing by default from Electron 20, and this application has no reason to disable it.
3. **Delete the generic `electronAPI` bridge.** `@electron-toolkit/preload` exposes arbitrary-channel `send`, `sendSync`, `invoke`, listeners, WebFrame controls, and process environment data. Electron's security guide says not to expose raw Electron/IPC APIs; expose one typed function per required operation instead.
4. **Remove the arbitrary `shell.openExternal(details.url)` handler.** The Pomodoro Timer has no v1 external-link requirement. Electron requires allowlisting if this behavior ever returns.
5. **Keep the generated restrictive CSP** and make the production renderer local-only.
6. **Configure fuses.** electron-builder supports an `electronFuses` block, but the quick-start template does not provide one. At minimum, disable RunAsNode, `NODE_OPTIONS`, and CLI inspect in production, and require ASAR-only loading. Any file-protocol fuse choice must agree with whether the architecture uses `file://` or a custom local protocol.
7. **Remove updater/publish configuration.** The no-updater scaffold choice avoids the updater dependency, but the generated YAML still contains an example generic publish URL. v1 permits no network/update service.
8. **Do not retain `npmRebuild: false` blindly if a future native dependency is added.** Revisit rebuild and `asarUnpack` settings with that dependency.

The disposable package confirmed the difference: before adding `electronFuses`, RunAsNode, `NODE_OPTIONS`, CLI inspect, and non-ASAR loading remained at Electron's permissive defaults. Forge's generated package had RunAsNode, `NODE_OPTIONS`, and CLI inspect disabled and ASAR-only loading enabled.

## Candidates 2 and 3: Electron Forge

Electron's own application-packaging documentation recommends Forge. Forge 7.11.2 is maintained and its TypeScript templates:

- leave Electron's `nodeIntegration: false`, `contextIsolation: true`, and renderer sandbox defaults intact;
- begin with an empty preload rather than a broad renderer API;
- package with ASAR;
- include a fuse plugin configured to disable RunAsNode, `NODE_OPTIONS`, and CLI inspect and to require the packaged ASAR.

That is a better generated security posture than `create-electron`. It is not complete: the generated HTML omits a CSP and the generated main process opens DevTools unconditionally, so both still need production-safe changes.

### Forge + Vite trade-offs

Forge marks its Vite plugin **experimental** and reserves the right to make breaking changes in minor Forge releases. It has no maintained React + Vite + TypeScript template. The current Vite/TS template declares TypeScript 4.5 and Vite 5; Vite 5 is outside Vite's current supported-version window.

A local exact-version scaffold showed the practical consequences:

- `electron-forge package` succeeded with Electron 43.1.0;
- `tsc --noEmit` failed out of the box because TypeScript 4.5 could not parse the current transitive Node type definitions;
- `npm audit` reported 30 development-tool vulnerabilities and no production vulnerabilities;
- upgrading to TypeScript 5.9 and Vite 7 restored type-checking and packaging;
- React 19 and the Vite React plugin packaged successfully after modernizing module resolution, but the legacy ESLint resolver also needed replacement.

Forge + Vite is viable, but the specification cannot say merely “use the current Forge template.” It must pin a reviewed modern dependency set and scripts that actually run type-checking.

### Forge + Webpack trade-offs

Forge's Webpack plugin is not marked experimental and now compiles preloads for Electron's sandbox by default. Its documentation gives explicit paths for native modules and React. This is the conservative Forge route.

Its drawbacks are setup and currency: React is not preconfigured, the React/TypeScript guide states that it was tested with React 18, TypeScript 4.3, and Webpack 5, and the tagged template fragment still declares TypeScript 4.5-era tooling. It should also be treated as source material to modernize, not accepted unchanged.

### Arch packaging with Forge

Forge has maintained makers for deb, RPM, Flatpak, Snap, ZIP, and other platforms, but no first-party Arch/pacman maker. On this machine:

- the deb maker cannot build because `dpkg` is absent and would not produce an Arch-native install anyway;
- RPM is the wrong installation format;
- Flatpak itself exists, but `flatpak-builder` is absent and the Forge maker requires it plus a Flathub runtime;
- ZIP and a bare Forge package do not install the app-menu entry.

A supported bridge does work: first run `electron-forge package`, then pass its Linux bundle to electron-builder's `--prepackaged` option and build only the `pacman` target. A disposable Forge 7.11.2/Electron 43.1.0 bundle produced a valid Arch package this way, retained Forge's flipped fuses, and installed the same validated launcher metadata as the direct electron-builder path. The cost is maintaining both Forge and electron-builder configuration.

A custom `PKGBUILD` is the other clean Forge route. Arch's `makepkg` is installed and is the native package-building interface, but the repository would own all file layout, launcher, icon, install, dependency, and uninstall details.

## Arch package and launcher findings

### Validated electron-builder path

`electron-builder@26.15.3` documents `pacman` as a beta target. With explicit configuration, it generated a package that:

- was recognized by `pacman -Qp` and `pacman -Qip`;
- used a normal `.pkg.tar.zst` name and Zstandard compression;
- installed the application under `/opt`;
- installed a reverse-DNS-named desktop file under `/usr/share/applications`;
- installed a 512 px icon under the hicolor icon hierarchy;
- created the executable symlink and refreshed the desktop database in its install script;
- passed `desktop-file-validate`;
- aligned `Name`, `Icon`, `StartupWMClass`, and the desktop filename.

The validated artifact was 114.61 MiB compressed and 311.64 MiB installed because it bundled another Electron runtime. That buys an exact, app-controlled Electron binary and app-specific fuses. A custom package that depends on the already installed `electron43` could be much smaller, but would couple the app to Arch's Electron upgrades, require a custom launcher/runtime layout, and lose app-specific fuse control. That remains an architecture trade-off, not the default conclusion of this research.

### Do not use electron-builder's pacman defaults unchanged

The first uncustomized package used an unusual `.pacman` filename, XZ compression, no usable package description, and default dependencies including `http-parser` and `libappindicator-gtk3`. `http-parser` is unavailable from this machine's configured repositories, and `libappindicator-gtk3` is not in them and is unnecessary because tray behavior is out of scope.

The working configuration supplied:

- a one-line `linux.synopsis`;
- `linux.target: pacman` only;
- `pacman.compression: zstd`;
- a conventional `${name}-${version}-${arch}.pkg.tar.zst` artifact name;
- explicit repository-backed dependencies: `gtk3`, `libnotify`, `nss`, `libxss`, `libxtst`, `xdg-utils`, `at-spi2-core`, and `libsecret`;
- `desktopName` plus `linux.syncDesktopName: true`;
- a reverse-DNS application/desktop ID, Utility category, product name, executable name, maintainer, description, and icon.

The application must still call `app.setDesktopName('<same-id>.desktop')` before `ready`, preserving the desktop-integration decision already recorded by the map.

### Formats not suitable as the sole v1 artifact

- **AppImage:** electron-builder embeds desktop metadata, but AppImage no longer installs it. AppImageLauncher is absent here, so launcher integration would require a second manual installer.
- **Flatpak/Snap:** both add runtime and sandbox configuration that this single-machine utility does not otherwise need.
- **deb/RPM/ZIP:** none is an Arch-native tracked installation with a launcher.
- **Unpackaged directory:** acceptable for development, not sufficient for the destination's installed app-menu launcher.

## Test-tooling consequences

Neither scaffold chooses tests. The implementation-ready verification decision should consider this split:

1. **Vitest 4.1.10** for deterministic domain and main-process-independent modules. It supports TypeScript/JSX and shares Vite configuration; its current peer range is Vite 6–8, so Vite 7 is a compatible stable line. Use a Node environment for the timer state model and a DOM environment plus React Testing Library for renderer interactions. Keep `tsc --noEmit` as a separate command because Vitest transforms TypeScript but does not type-check it.
2. **Electron boundary tests:** Electron documents WebdriverIO and Playwright. WebdriverIO's Electron service can locate bundles produced by Forge or electron-builder. Playwright's Electron support remains experimental.
3. **Hardened-package caveat:** Playwright says its Electron launcher requires the `nodeCliInspect` fuse not to be disabled. A secure production package should disable that fuse, so Playwright is suitable for development-bundle tests but not the sole packaged-artifact test.
4. **Package checks:** inspect the package with `pacman -Qip`, extract it, validate the desktop file, inspect icons and paths, then perform one controlled install/uninstall and Rofi/Hyprland launcher smoke test on this machine.
5. **Desktop integration:** keep the real suspend/resume test, notification/audio behavior, and launcher/window identity as machine smoke tests rather than pretending a browser runner proves them.

This research narrows the tools; [Define the v1 verification and acceptance strategy](https://github.com/UmarKhan19/pomodoro/issues/8) should choose the exact layers and acceptance commands.

## Decision inputs for the architecture ticket

Whichever candidate is chosen, the specification should require all of the following:

- exact Electron 43.1.0 until desktop probes authorize an upgrade;
- a lockfile and a supported, pinned build-time Node line;
- separate main, preload, and renderer entry points;
- sandboxed renderer, no Node integration, context isolation, and a restrictive CSP;
- a narrow typed preload API with one method per capability and sender validation in main-process handlers;
- no arbitrary external navigation and no runtime network/update path;
- production fuse configuration verified from the built binary;
- explicit type-check, lint, unit/component test, production build, package-inspection, and machine-smoke commands;
- an Arch package that owns its launcher and icon and can be cleanly uninstalled;
- explicit native-module rebuild/unpack review if a future local feature adds one.

## Primary sources

### Electron

- [Electron application packaging (v43.1.0)](https://github.com/electron/electron/blob/v43.1.0/docs/tutorial/application-distribution.md) — recommends Electron Forge and documents manual packaging.
- [Electron security checklist (v43.1.0)](https://github.com/electron/electron/blob/v43.1.0/docs/tutorial/security.md), [context isolation](https://github.com/electron/electron/blob/v43.1.0/docs/tutorial/context-isolation.md), and [process sandboxing](https://github.com/electron/electron/blob/v43.1.0/docs/tutorial/sandbox.md) — required renderer, IPC, navigation, CSP, and sandbox posture.
- [Electron fuses (v43.1.0)](https://github.com/electron/electron/blob/v43.1.0/docs/tutorial/fuses.md) — package-time hardening and fuse defaults.
- [Electron automated testing (v43.1.0)](https://github.com/electron/electron/blob/v43.1.0/docs/tutorial/automated-testing.md) — WebdriverIO, Playwright, and custom-driver options.

### Electron Forge

- [Forge 7.11.2 release](https://github.com/electron/forge/releases/tag/v7.11.2).
- [Forge Vite plugin's experimental notice](https://github.com/electron/forge/blob/v7.11.2/packages/plugin/vite/README.md) and [Vite/TypeScript template](https://github.com/electron/forge/tree/v7.11.2/packages/template/vite-typescript/tmpl).
- [Forge Webpack plugin](https://github.com/electron/forge/blob/v7.11.2/packages/plugin/webpack/README.md) and [sandboxed preload documentation](https://github.com/electron-forge/electron-forge-docs/blob/ab9a522c50fe48174788631a15695850fc6e55f2/config/plugins/webpack.md#preload-scripts-are-sandboxed-by-default).
- [Forge Vite template main process](https://github.com/electron/forge/blob/v7.11.2/packages/template/vite-typescript/tmpl/main.ts), [dependency fragment](https://github.com/electron/forge/blob/v7.11.2/packages/template/vite-typescript/tmpl/package.json), and [Forge/fuse configuration](https://github.com/electron/forge/blob/v7.11.2/packages/template/vite-typescript/tmpl/forge.config.ts) — generated defaults examined in the probe.
- [Forge React + TypeScript guide](https://github.com/electron-forge/electron-forge-docs/blob/ab9a522c50fe48174788631a15695850fc6e55f2/guides/framework-integration/react-with-typescript.md) and [Forge maker catalog](https://github.com/electron-forge/electron-forge-docs/tree/ab9a522c50fe48174788631a15695850fc6e55f2/config/makers).

### electron-vite and its scaffold

- [electron-vite 5.0.0](https://github.com/alex8088/electron-vite/tree/v5.0.0) — stable build tooling and supported feature set.
- [electron-vite development and sandbox guidance](https://github.com/alex8088/electron-vite-docs/blob/781136ffc6b0e04e31890f18935135679f5e980a/packages/en-US/docs/guide/dev.md), [dependency handling](https://github.com/alex8088/electron-vite-docs/blob/781136ffc6b0e04e31890f18935135679f5e980a/packages/en-US/docs/guide/dependency-handling.md), and [distribution](https://github.com/alex8088/electron-vite-docs/blob/781136ffc6b0e04e31890f18935135679f5e980a/packages/en-US/docs/guide/distribution.md).
- [`create-electron` 1.0.30 React/TS dependencies](https://github.com/alex8088/quick-start/blob/create-electron%401.0.30/packages/create-electron/template/react-ts/package.json), [window defaults](https://github.com/alex8088/quick-start/blob/create-electron%401.0.30/packages/create-electron/template/react-ts/src/main/index.ts), [preload bridge](https://github.com/alex8088/quick-start/blob/create-electron%401.0.30/packages/create-electron/template/react-ts/src/preload/index.ts), and [builder configuration](https://github.com/alex8088/quick-start/blob/create-electron%401.0.30/packages/create-electron/template/react-ts/electron-builder.yml).
- [`@electron-toolkit/preload` 3.0.2 implementation](https://github.com/alex8088/electron-toolkit/blob/preload%403.0.2/packages/preload/src/index.ts) — exact broad API exposed by the scaffold.

### Packaging and tests

- [electron-builder 26.15.3 release](https://github.com/electron-userland/electron-builder/releases/tag/electron-builder%4026.15.3), [Linux/pacman configuration](https://github.com/electron-userland/electron-builder/blob/electron-builder%4026.15.3/website/docs/linux.md), [desktop-entry generation](https://github.com/electron-userland/electron-builder/blob/electron-builder%4026.15.3/packages/app-builder-lib/src/targets/LinuxTargetHelper.ts), and [FPM package layout](https://github.com/electron-userland/electron-builder/blob/electron-builder%4026.15.3/packages/app-builder-lib/src/targets/FpmTarget.ts).
- [electron-builder fuse integration](https://github.com/electron-userland/electron-builder/blob/electron-builder%4026.15.3/website/docs/tutorials/adding-electron-fuses.md) and [`--prepackaged` CLI option](https://github.com/electron-userland/electron-builder/blob/electron-builder%4026.15.3/packages/electron-builder/src/cli/cli.ts).
- [electron-builder AppImage desktop-integration limits](https://github.com/electron-userland/electron-builder/blob/electron-builder%4026.15.3/website/docs/appimage.md).
- [Arch `PKGBUILD(5)`](https://man.archlinux.org/man/PKGBUILD.5.en) and [`makepkg(8)`](https://man.archlinux.org/man/makepkg.8.en) — native custom-package route.
- [Vite supported-version policy](https://github.com/vitejs/vite/blob/main/docs/releases.md) — why Vite 5 is no longer an acceptable new baseline.
- [Vitest 4.1.10 features](https://github.com/vitest-dev/vitest/blob/v4.1.10/docs/guide/features.md), [environments](https://github.com/vitest-dev/vitest/blob/v4.1.10/docs/config/environment.md), and [Vite configuration sharing](https://github.com/vitest-dev/vitest/blob/v4.1.10/docs/config/index.md).
- [Playwright 1.61.1 Electron API](https://github.com/microsoft/playwright/blob/v1.61.1/docs/src/electron-api/class-electron.md) — experimental status and fuse limitation.
- [freedesktop Desktop Entry Specification](https://specifications.freedesktop.org/desktop-entry-spec/latest/) — launcher metadata validated in both package probes.
