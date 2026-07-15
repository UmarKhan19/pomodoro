# Pomodoro Timer production design specification

This is the normative, framework-independent visual and interaction specification for the Linux-first Pomodoro Timer v1. It turns the selected [Horizon + Cadence timer interface](docs/prototypes/horizon-cadence-timer-interface.md) into an implementation-ready system.

The product intent and anti-references in [PRODUCT.md](PRODUCT.md) remain authoritative. Timer behavior comes from [Define the Pomodoro timer state machine](https://github.com/UmarKhan19/pomodoro/issues/3), Completion Feedback behavior comes from [Choose the interval-completion feedback](https://github.com/UmarKhan19/pomodoro/issues/5), and theme persistence behavior comes from [Choose the v1 application architecture](https://github.com/UmarKhan19/pomodoro/issues/7). This document specifies presentation and interaction only; it does not prescribe Electron process or module boundaries.

Normative words such as **must**, **must not**, and **should** are intentional. The throwaway prototype is a visual reference, not production code. Prototype scenario controls must not ship.

## Experience contract

The interface is a quiet desktop instrument for one person working on a 1920×1080, scale-1 Arch Linux/Hyprland desktop. It must make the current interval, timer state, remaining time, and valid action immediately understandable without resembling a task manager, scorecard, or motivational system.

The production direction is deliberately restrained:

- one image-led composition in the Full interface;
- near-neutral foundations with burnt orange for primary actions and Focus context;
- blue for Break context;
- one locally bundled sans-serif family;
- familiar controls, no ornamental interaction patterns, and no continuous decorative motion;
- text and shape always carry meaning before color does.

## Production assets

### Landscape photograph

Use **[Mountain Landscape at Sunset](<https://commons.wikimedia.org/wiki/File:Mountain_Landscape_at_Sunset_(50299037648).jpg>)** by Glacier National Park Service as the sole production background image.

| Property             | Requirement                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Original source      | [Glacier National Park Service on Flickr](https://www.flickr.com/photos/glaciernps/50299037648)                              |
| Rights/source record | [Wikimedia Commons file page](<https://commons.wikimedia.org/wiki/File:Mountain_Landscape_at_Sunset_(50299037648).jpg>)      |
| Creator              | Glacier National Park Service (`GlacierNPS`)                                                                                 |
| Captured             | 2020-08-29                                                                                                                   |
| Retrieved            | 2026-07-15                                                                                                                   |
| Original dimensions  | 6240×4160 JPEG, 3:2                                                                                                          |
| Rights               | Public domain; the reviewed Commons record applies `PD-USGov-NPS`, reports `Copyrighted: false`, and requires no attribution |
| Original SHA-256     | `9f0b6db915ce92545e7d947398308b418d8dfeb43c9e692e70bfca0f1b359d07`                                                           |
| Production filename  | `mountain-landscape-at-sunset.webp`                                                                                          |

The repository must retain a rights record containing the source and Commons URLs, creator, public-domain basis, retrieval date, original dimensions, original SHA-256, derivative command/tool version, and derivative SHA-256. Credit is not legally required, but the rights record should preserve `Glacier National Park Service` as a courtesy credit.

Create one production derivative as follows:

1. Auto-orient and convert the original to sRGB.
2. Retain the complete 3:2 composition; do not make a destructive editorial crop.
3. Resize to **2560×1707** using a high-quality downsampling filter.
4. Encode as WebP at quality **82**.
5. Strip EXIF, XMP, location, camera, and editing metadata from the derivative.
6. Bundle the derivative locally. The application must not fetch, rotate, or replace imagery at runtime.

#### Placement and treatment

The photograph is decorative and must be absent from the accessibility tree.

In the Full interface:

- The image layer occupies the rightmost **68%** of the content box and the full content height.
- Render it with cover sizing and a focal position of **72% horizontal / 50% vertical**.
- Apply a left-to-right alpha mask: zero opacity at the image layer’s left edge, increasing smoothly to full opacity at **38%** of the image layer, then remaining fully opaque.
- Place a canvas-colored scrim over the full window. It is fully opaque through **44%** of the content width and fades smoothly to transparent at **74%**. This alpha gradient is functional contrast protection, not a decorative color gradient.
- The entire bounds behind timer text and controls must composite to at least **96% opaque canvas color**. If content growth would violate that rule, extend the solid scrim rather than placing content directly on the photograph.
- The theme switcher sits on its own fully opaque canvas surface.

Theme treatment:

| Theme | Image treatment                                                  |
| ----- | ---------------------------------------------------------------- |
| Light | 82% saturation, 105% brightness, 96% contrast, 92% layer opacity |
| Dark  | 70% saturation, 62% brightness, 104% contrast, 86% layer opacity |

Do not blur the image. Do not add parallax, panning, zooming, crossfades, glass effects, or theme-specific crops. Do not render the image in Compact mode.

### Typeface

Bundle **Inter Variable Roman v4.1** from the [official Inter release](https://github.com/rsms/inter/releases/tag/v4.1). Inter is not installed on the target machine; a system-only stack would currently resolve to Nimbus Sans and would not preserve the selected design’s metrics.

| Property        | Requirement                                                        |
| --------------- | ------------------------------------------------------------------ |
| Release archive | `Inter-4.1.zip`                                                    |
| Archive SHA-256 | `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e` |
| Bundled file    | `web/InterVariable.woff2` from the release archive                 |
| Font SHA-256    | `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3` |
| License         | SIL Open Font License 1.1                                          |

Bundle the Roman WOFF2 and the upstream license text. Do not bundle italics or static per-weight files. The fallback order is Inter, the platform UI sans-serif, then generic sans-serif. The interface must remain usable if the font fails, but production acceptance must verify that the bundled font loads.

### Launcher and brand icon

The launcher’s visible product name is **Pomodoro Timer**. Its icon is an abstract timer dial, not a tomato, lettermark, checkmark, flame, streak, or productivity badge.

Create a 512×512 vector master with this geometry:

- a 512×512 rounded-square field filled with the Light-theme `ink` value (`#16100D`), corner radius 96;
- a centered unfilled dial ring, radius 146, stroke width 28, colored `primary` (`#B84C00`);
- four radial capsule ticks centered 184 units from the icon center, each 20×44 with radius 10;
- top, right, and left ticks use `primary`; the bottom/fourth tick uses the Dark-theme `break` value (`#4DA6D6`);
- no gradient, shadow, texture, lettering, or dynamic timer state.

Export the required Linux PNG sizes from the vector master, including 16, 32, 48, 64, 128, 256, and 512 pixels. Inspect 16px and 32px exports manually; the ring and fourth tick must remain distinct without adding detail at larger sizes.

The in-window brand mark is a one-color, transparent 24×24 simplification of the same dial: an 8.5-unit-radius ring with a 1.8-unit orange stroke and four 3-unit orange cardinal ticks. It appears beside the exact visible name `Pomodoro Timer`. The mark is decorative and therefore has no separate accessible name.

## Window modes and responsive contract

All dimensions in this section refer to the application content box, excluding any platform-managed frame.

- Requested content size: **960×640**.
- Hard minimum content size: **320×240**.
- **Full mode** applies only when content width is at least 800px **and** content height is at least 600px.
- **Compact mode** applies whenever width is below 800px **or** height is below 600px.
- There is no intermediate mode.
- Mode changes are immediate and must not animate layout.

Hyprland may ignore the requested size or resize a tiled window. Presentation must use the actual content dimensions rather than assume that the requested dimensions were honored.

### Full mode

Full mode contains:

1. header with product mark/name and theme switcher;
2. state marker and state name;
3. interval name;
4. dominant remaining time;
5. one-line state instruction;
6. remaining-time progress rule;
7. Focus Session and Pomodoro Cycle context;
8. timer controls;
9. Pomodoro Cycle cadence rail;
10. transient Completion Feedback when present.

Layout requirements:

- Header height: 64px. Horizontal padding: 24px.
- Timer content is left aligned on an opaque canvas region, with a maximum width of 400px.
- Timer content starts 56px from the inline edge at widths of 960px or greater and 32px from the edge from 800–959px.
- Vertically center the timer content in the clear area between the header and cadence rail, biased 24px upward from mathematical center.
- The progress rule is at most 360px wide and never wider than the timer content.
- At widths of 960px or greater, the cadence rail is 600px wide, 32px from the right edge, and 24px from the bottom edge.
- From 800–959px, cadence width is `min(600px, content width − 288px)`, with 20px right and 16px bottom insets.
- Completion Feedback is 360px wide, at most `content width − 48px`, 24px from the right edge, and 76px from the top.
- Full mode must not scroll at 800×600 with any supported v1 state or copy.

### Compact mode

Compact mode removes the image, header, brand, theme switcher, state instruction, progress rule, Focus Session Number context, Pomodoro Cycle context, and cadence rail. Hidden Full-mode content must also be absent from the accessibility tree.

Compact mode contains only:

1. an identifying line in the exact form `<Interval> · <State>`;
2. remaining time;
3. the primary timer control;
4. Reset;
5. a temporary Completion Feedback banner when feedback exists.

Examples include `Focus Session · Running`, `Short Break · Ready`, and `Long Break · Paused`. Use the canonical interval names; do not shorten either Break name to “Break.”

Layout requirements:

- Use a solid theme `canvas` background with no photograph, texture, panel, or decorative mark.
- Center the timer group both horizontally and vertically in the available space. Roomy Compact uses 16px outer padding and 12px vertical gaps.
- Tight Compact uses 8px outer padding and 4px vertical gaps so feedback and controls fit at the hard minimum.
- Keep the primary action and Reset in one centered horizontal row with an 8px gap.
- Primary action minimum size: 112×48px. Reset minimum size: 88×48px.
- Use the visible label **Reset** in Compact mode while retaining the accessible name **Reset Current Interval**.
- At width 480px and height 360px or greater, use the Roomy Compact timer size. Otherwise use the Tight Compact timer size.
- Never introduce horizontal scrolling.
- At 320×240, all core content and a visible Completion Feedback banner must remain operable without overlap or clipping.
- If a compositor forces dimensions below the hard minimum, preserve identifier, time, and controls in that order with vertical scrolling; never clip controls or introduce horizontal scrolling.

The Compact Completion Feedback banner participates in layout above the identifying line rather than covering it. It spans the available width inside 8px outer insets, contains the same title and message as Full feedback, and includes a 44×44 close target. Roomy Compact uses 12px banner padding and the normal feedback type roles. Tight Compact uses 4px vertical and 8px horizontal banner padding, the Tight Compact feedback type roles, and no decorative completion icon. Its two semantic text lines may wrap to additional visual lines; they must never truncate.

## Foundation tokens

### Color strategy

The sRGB hex values below are the exact visual references. The corresponding OKLCH values are the authored token values; differences caused by rounding must remain visually equivalent to the listed hex value.

#### Shared action colors

| Token            | OKLCH                          | sRGB      | Use                                   |
| ---------------- | ------------------------------ | --------- | ------------------------------------- |
| `primary`        | `oklch(0.55089 0.15611 45.52)` | `#B84C00` | Primary controls and Focus progress   |
| `primary-hover`  | `oklch(0.50237 0.14947 42.75)` | `#A63E00` | Primary-control hover                 |
| `primary-active` | `oklch(0.46090 0.13584 43.27)` | `#933700` | Primary-control active                |
| `on-primary`     | `oklch(0.99107 0 0)`           | `#FCFCFC` | Text/icons on filled primary controls |

#### Light theme

| Token              | OKLCH                           | sRGB      | Use                                                 |
| ------------------ | ------------------------------- | --------- | --------------------------------------------------- |
| `canvas`           | `oklch(0.99107 0 0)`            | `#FCFCFC` | Window and opaque content foundation                |
| `surface`          | `oklch(0.96445 0.00602 43.34)`  | `#F7F2F0` | Toasts and quiet controls                           |
| `surface-strong`   | `oklch(0.92432 0.00964 41.88)`  | `#ECE4E1` | Pressed/selected neutral surface and progress track |
| `surface-hover`    | `oklch(0.94088 0.00767 48.65)`  | `#F0EAE7` | Neutral hover                                       |
| `ink`              | `oklch(0.17960 0.01181 48.04)`  | `#16100D` | Primary text and selected theme segment             |
| `muted`            | `oklch(0.44884 0.01791 43.98)`  | `#5E524D` | Secondary text                                      |
| `quiet`            | `oklch(0.52058 0.01384 51.14)`  | `#706762` | Tertiary and disabled text                          |
| `divider`          | `oklch(0.83976 0.01252 43.26)`  | `#D2C8C4` | Decorative separators and disabled borders only     |
| `control-border`   | `oklch(0.60115 0.01623 50.66)`  | `#897E78` | Operable neutral control boundaries                 |
| `disabled-surface` | `oklch(0.94942 0.00605 43.33)`  | `#F2EDEB` | Disabled controls                                   |
| `primary-soft`     | `oklch(0.93957 0.03358 48.34)`  | `#FFE5D8` | Completion icon background                          |
| `break`            | `oklch(0.50477 0.11257 238.37)` | `#006C9D` | Break markers, Break progress, and focus ring       |
| `break-hover`      | `oklch(0.45509 0.10252 239.00)` | `#005D89` | Interactive blue hover if needed                    |
| `break-soft`       | `oklch(0.92901 0.03504 234.81)` | `#D2ECFC` | Quiet Break background                              |

#### Dark theme

| Token              | OKLCH                           | sRGB      | Use                                                 |
| ------------------ | ------------------------------- | --------- | --------------------------------------------------- |
| `canvas`           | `oklch(0.10668 0 0)`            | `#040404` | Window and opaque content foundation                |
| `surface`          | `oklch(0.16204 0.00659 55.87)`  | `#100D0B` | Toasts and quiet controls                           |
| `surface-strong`   | `oklch(0.21422 0.00892 43.07)`  | `#1D1816` | Pressed/selected neutral surface and progress track |
| `surface-hover`    | `oklch(0.26064 0.00939 53.07)`  | `#282320` | Neutral hover                                       |
| `ink`              | `oklch(0.94037 0.00606 43.33)`  | `#EFEAE8` | Primary text and selected theme segment             |
| `muted`            | `oklch(0.69923 0.01208 45.66)`  | `#A59C98` | Secondary text                                      |
| `quiet`            | `oklch(0.62006 0.01246 45.64)`  | `#8D8480` | Tertiary and disabled text                          |
| `divider`          | `oklch(0.31133 0.01239 51.72)`  | `#362F2B` | Decorative separators and disabled borders only     |
| `control-border`   | `oklch(0.51992 0.01193 48.48)`  | `#6F6763` | Operable neutral control boundaries                 |
| `disabled-surface` | `oklch(0.18050 0.00641 55.94)`  | `#14110F` | Disabled controls                                   |
| `primary-soft`     | `oklch(0.24108 0.05552 48.36)`  | `#341605` | Completion icon background                          |
| `primary-text`     | `oklch(0.71994 0.13957 47.99)`  | `#EA8751` | Focus markers/text on dark canvas                   |
| `break`            | `oklch(0.69062 0.11030 235.12)` | `#4DA6D6` | Break markers and Break progress                    |
| `break-soft`       | `oklch(0.23411 0.05006 235.56)` | `#002132` | Quiet Break background                              |
| `focus-ring`       | `oklch(0.72016 0.12026 235.14)` | `#4CB0E5` | Keyboard focus                                      |

Filled primary controls use the same `primary` and `on-primary` colors in both themes. Blue identifies Break context only; it never replaces orange on Start, Pause, Resume, or Reset.

#### Theme-invariant cadence rail

| Token         | OKLCH                           | sRGB      | Use                                   |
| ------------- | ------------------------------- | --------- | ------------------------------------- |
| `rail-canvas` | `oklch(0.13808 0.00618 41.86)`  | `#0B0807` | Opaque rail background                |
| `rail-ink`    | `oklch(0.97015 0 0)`            | `#F5F5F5` | Primary rail text/current ring        |
| `rail-muted`  | `oklch(0.74073 0.00543 48.66)`  | `#AEAAA8` | Secondary rail text/upcoming outlines |
| `rail-line`   | `oklch(0.51992 0.01193 48.48)`  | `#6F6763` | Connecting rule                       |
| `rail-break`  | `oklch(0.74939 0.09993 234.98)` | `#6AB8E4` | Current Break marker/text             |

The cadence rail is solid, not translucent or blurred. No text or controls may rely on the photograph as their background.

Do not add gradients except the functional image alpha mask/scrim. Do not use opacity to derive text colors; use the explicit tokens so contrast remains deterministic.

### Verified contrast

The following WCAG relative-luminance ratios are acceptance baselines:

| Pair                                   |   Ratio |
| -------------------------------------- | ------: |
| Light primary text / canvas            | 18.37:1 |
| Light secondary text / canvas          |  7.34:1 |
| Light quiet text / canvas              |  5.38:1 |
| Light control border / canvas          |  3.85:1 |
| `on-primary` / `primary`               |  5.03:1 |
| Light Focus accent / canvas            |  5.03:1 |
| Light Break accent / canvas            |  5.64:1 |
| Light disabled text / disabled surface |  4.75:1 |
| Dark primary text / canvas             | 17.19:1 |
| Dark secondary text / canvas           |  7.62:1 |
| Dark quiet text / canvas               |  5.61:1 |
| Dark control border / canvas           |  3.71:1 |
| Dark Focus accent text / canvas        |  7.89:1 |
| Dark Break accent / canvas             |  7.56:1 |
| Dark disabled text / disabled surface  |  5.14:1 |
| Rail primary text / rail canvas        | 18.31:1 |
| Rail secondary text / rail canvas      |  8.66:1 |
| Rail line / rail canvas                |  3.61:1 |
| Rail Break accent / rail canvas        |  9.12:1 |

Any implementation-induced compositing must preserve at least 4.5:1 for normal text, 3:1 for large text, and 3:1 for meaningful non-text UI boundaries and indicators.

### Typography

Use one type family. Do not introduce a display, monospace, or serif face.

| Role                           | Size / line height | Weight | Letter spacing |
| ------------------------------ | ------------------ | -----: | -------------: |
| Product name                   | 14 / 20px          |    650 |        −0.01em |
| Theme option                   | 12 / 16px          |    650 |              0 |
| State label                    | 13 / 18px          |    700 |              0 |
| Interval name                  | 18 / 24px          |    700 |       −0.015em |
| Full timer                     | 112 / 101px        |    650 |       −0.035em |
| State instruction              | 14 / 20px          |    400 |              0 |
| Context primary                | 14 / 20px          |    650 |              0 |
| Context secondary              | 12 / 18px          |    400 |              0 |
| Button                         | 14 / 20px          |    650 |              0 |
| Cadence title                  | 13 / 18px          |    700 |              0 |
| Cadence label                  | 12 / 16px          |    650 |              0 |
| Cadence metadata               | 11 / 14px          |    500 |              0 |
| Feedback title                 | 14 / 20px          |    700 |              0 |
| Feedback message               | 13 / 18px          |    400 |              0 |
| Compact identifier             | 14 / 20px          |    700 |              0 |
| Roomy Compact timer            | 96 / 86px          |    650 |       −0.035em |
| Tight Compact timer            | 72 / 65px          |    650 |        −0.03em |
| Tight Compact feedback title   | 12 / 16px          |    700 |              0 |
| Tight Compact feedback message | 11 / 14px          |    400 |              0 |

The timer must use tabular lining numerals. Always show two minute digits and two second digits (`25:00`, `05:00`, `00:09`). Do not enable a slashed-zero stylistic feature. Do not animate individual digits.

### Spacing, shape, borders, and elevation

Use a 4px base spacing system:

| Token      | Value |
| ---------- | ----: |
| `space-1`  |   4px |
| `space-2`  |   8px |
| `space-3`  |  12px |
| `space-4`  |  16px |
| `space-6`  |  24px |
| `space-8`  |  32px |
| `space-12` |  48px |
| `space-16` |  64px |

Radii:

- small icon/close hover: 8px;
- buttons: 10px;
- cadence rail and Completion Feedback: 12px;
- segmented theme control: full pill.

Borders:

- standard control and panel boundary: 1px;
- state/current emphasis: 2px;
- keyboard focus: 3px plus a 2px canvas-colored separation.

Use no button shadow. The cadence rail has no shadow. Completion Feedback alone may use a compact `0 4px 8px` black shadow at 16% opacity in Light and 40% in Dark, paired with a 1px divider-colored border. Do not use wide diffuse “floating card” shadows.

Layer order is image, scrim, normal content, cadence rail, Completion Feedback, then focus indication. No normal content may establish an arbitrary layer above feedback or focus.

## Full-mode information hierarchy

Within the timer block, use this vertical rhythm:

1. state marker/label;
2. 16px gap;
3. interval name;
4. 4px gap;
5. remaining time;
6. 16px gap;
7. state instruction;
8. 12px gap;
9. progress rule;
10. 16px gap;
11. context block, with 4px between its two lines;
12. 16px gap;
13. controls.

Exact copy:

| State            | State label | Instruction                                |
| ---------------- | ----------- | ------------------------------------------ |
| Ready Interval   | `Ready`     | `Start when you’re ready.`                 |
| Running Interval | `Running`   | `Counting down.`                           |
| Paused Interval  | `Paused`    | `Remaining time is held until you resume.` |

Interval headings are exactly `Focus Session`, `Short Break`, and `Long Break`.

Context copy:

- A Focus Session shows `Focus Session {n}` and `position {p} of 4`.
- A Break shows `After Focus Session {n}` and `Break after position {p} of 4`.
- Cycle position is `p = ((n − 1) mod 4) + 1`.
- Pomodoro Cycle is `floor((n − 1) / 4) + 1`.

Do not introduce a special visual or message for a suspend-caused pause; it uses the normal Paused treatment and copy.

## Timer states and controls

### State markers

Every state includes visible text and a distinct shape:

- Ready: 10px hollow circle with a 2px interval-accent stroke.
- Running: 10px solid interval-accent circle. It does not pulse.
- Paused: two 3×10px vertical bars separated by 3px, using `muted`.

Focus Session accents use `primary` in Light and `primary-text` in Dark when drawn as text or a small marker on canvas. Short and Long Break accents use the theme’s `break` token.

### Remaining-time progress

The 4px-high progress rule represents **time remaining**:

- full width in Ready;
- contracts toward zero in Running;
- freezes in Paused;
- returns to full on Reset;
- orange for a Focus Session and blue for either Break.

The track uses `surface-strong`. The fill uses a horizontal scale transform or equivalent paint-only operation with its origin at the inline start. It is decorative duplication of the numeric timer and must be hidden from assistive technology.

### Control matrix

The Full control row has a 12px gap; the Compact row has the previously specified 8px gap. Buttons use 16px horizontal padding and the 10px control radius.

| Timer state | Primary control | Reset Current Interval |
| ----------- | --------------- | ---------------------- |
| Ready       | Start           | Visible, disabled      |
| Running     | Pause           | Enabled                |
| Paused      | Resume          | Enabled                |

There is no Skip control.

Reset acts immediately without confirmation. It returns the same interval to Ready at full duration and never advances Focus Session Number or Pomodoro Cycle.

#### Primary control states

- Minimum size: 112×44px in Full mode and 112×48px in Compact mode.
- Default: `primary` fill, `on-primary` text, transparent 1px border.
- Hover: `primary-hover` fill.
- Active: `primary-active` fill and 1px downward visual translation.
- Focus-visible: the shared dual focus treatment described below.
- Primary controls are never disabled in a settled timer snapshot.

#### Reset states

- Full visible label: `Reset Current Interval`.
- Compact visible label: `Reset`; accessible name remains `Reset Current Interval`.
- Minimum height: 44px Full, 48px Compact.
- Default enabled: transparent canvas background, `ink` text, 1px `control-border` boundary.
- Hover: `surface-hover` background.
- Active: `surface-strong` background and 1px downward visual translation.
- Disabled: `disabled-surface` background, `quiet` text, `divider` border, default cursor, no hover or active change.
- Use a native disabled semantic or equivalent platform semantic. A disabled Reset is not in the sequential Tab order.

Timer commands are local and atomic; do not show spinners, progress labels, optimistic loading states, success states, or user-facing command errors. Duplicate or invalid activation must never create a visual error state.

## Cadence rail

The rail is an opaque, theme-invariant `rail-canvas` surface with 16px horizontal and 14px vertical padding. It has one header row, a 12px gap, and an ordered four-column sequence of equal widths. Within a position, use an 8px node-to-label gap and an 8px gap before the Break row. The connecting rule is centered on the 24px nodes.

Header copy:

- left: `Pomodoro Cycle {c}`;
- right: `Four Focus Sessions, then a Long Break`.

Each position contains:

- a numbered 24×24 Focus node;
- the compact visible label `Focus {n}` with the accessible name `Focus Session {n}`;
- `25 min`;
- `Short Break` and `5 min` for positions one through three;
- `Long Break` and `15 min` for position four.

Never truncate interval names or Focus Session Numbers. Labels may wrap within their column, and the rail may grow up to 144px high to accommodate unusually large Timer Run numbers while remaining inside Full mode.

### Cadence states

Meaning must remain clear in grayscale:

- **Completed position:** solid `primary` numbered node with `on-primary` number text and `rail-muted` labels. Keep the number; do not replace it with a checkmark.
- **Current Focus Session:** solid `primary` numbered node plus a 2px `rail-ink` outer ring; its label and visible `Current` text use `rail-ink`.
- **Upcoming position:** transparent node with a 1px `rail-muted` outline; its number and labels use `rail-muted`.
- **Current Break:** its associated Focus node remains completed; a 10px `rail-break` diamond precedes the Break label, and both that label and visible `Current` text use `rail-break`.
- The connecting rule uses `rail-line` and remains visible behind the nodes.

Expose the four positions as an ordered list. Mark the current Focus Session or Break with the platform equivalent of `aria-current="step"`. Accessible descriptions must say whether each Focus Session and following Break are completed, current, or upcoming; visual color names are never part of the accessible copy.

## Theme switcher

The Full-mode header contains a text-only segmented control with three options in this order: **System**, **Dark**, **Light**.

- The group has an accessible name of `Theme`.
- Each option is at least 44px high; minimum widths are 64px for System and 52px for Dark and Light.
- The group uses an opaque `canvas` background, 6px internal padding, a 1px `control-border`, and a full-pill radius. The padding contains the complete focus treatment so it never sits directly against the photograph.
- Unselected options are transparent with `muted` text.
- Hovered unselected options use `surface-hover` and `ink`.
- The selected preference uses `ink` fill and `canvas` text.
- An active unselected option uses `surface-strong`; an active selected option retains its selected colors and translates downward by 1px.
- Focus-visible uses the shared dual focus treatment.
- Selection is represented with a pressed/selected semantic, not color alone.
- Theme options have no disabled, loading, or error state.
- When System is selected, keep System visibly selected even though the effective theme is Light or Dark. Its accessible name includes the effective result, for example `System theme, currently Dark`.
- An operating-system theme change while System is selected updates the effective theme immediately without changing focus or animating the palette.
- The first visible paint must use the persisted preference and correct effective theme; a Light-to-Dark or Dark-to-Light flash is a failure.

The theme switcher is not rendered in Compact mode. The persisted choice remains in effect, and returning to Full mode restores the control with the same selected preference.

## Completion Feedback

Completion Feedback is transient presentation, never a timer state. The next Ready Interval and its controls are visible immediately underneath or after it.

### Full toast

Use a non-modal upper-right toast with three columns:

1. a 26px circular `primary-soft` field containing a 14px, 2px-stroke `primary` check glyph;
2. title and message;
3. a 44×44 close button with a standard 16px close glyph.

The toast uses `surface`, a 1px `divider` boundary, 12px radius, 14px padding, and the specified compact shadow. It must not cover timer controls at any supported Full-mode size. The close button is transparent with a `muted` glyph by default, uses `surface-hover` and `ink` on hover, uses `surface-strong` when active, and uses the shared focus treatment. It has no disabled, loading, or error state.

### Compact banner

Use the layout-participating banner specified under Compact mode. It uses the same colors, copy, semantics, timing, and close behavior as the Full toast.

### Copy and timing

After Focus Session `n`:

- title: `Focus Session {n} complete`;
- message: `Short Break ready — start when you’re ready.`;
- substitute `Long Break` when `n` is divisible by four.

After the Break associated with Focus Session `n`:

- title: `Short Break complete` or `Long Break complete`;
- message: `Focus Session {n+1} ready — start when you’re ready.`.

Behavior:

- Enter once over 200ms.
- Do not steal keyboard or screen-reader focus.
- Expose the combined title/message as one polite, atomic status announcement.
- Auto-dismiss after 8 seconds.
- Provide a keyboard-accessible close button.
- Starting the Ready Interval dismisses feedback immediately.
- Do not require acknowledgment and do not pause or delay timer interaction.

## Keyboard and focus

v1 has no window-wide or global timer shortcuts. Keyboard operation uses standard sequential navigation and native Enter/Space activation on focused controls. Escape dismisses visible Completion Feedback and otherwise does nothing.

### Focus appearance

Every interactive element uses a 3px focus ring plus a 2px separation matching its immediate opaque surface (`canvas` for main controls and `surface` for feedback controls). Use `break` as the Light focus-ring color and `focus-ring` as the Dark focus-ring color. The separation is required so the ring remains distinguishable from orange controls, selected theme segments, and the photograph.

Focus indication:

- appears only for keyboard-style focus (`focus-visible` behavior or platform equivalent);
- is never clipped by a container;
- remains fully visible and unobscured;
- has at least a 2px-perimeter equivalent area and 3:1 contrast against the adjacent opaque surface;
- is not represented by color change alone.

### Tab order

Full mode order:

1. System;
2. Dark;
3. Light;
4. Completion Feedback close, when present;
5. current primary timer action;
6. Reset Current Interval when enabled.

Compact order:

1. Completion Feedback close, when present;
2. current primary timer action;
3. Reset when enabled.

Branding, timer text, progress, image, state markers, and cadence rail are not focusable.

### Focus continuity

| Event                                                    | Required focus result                       |
| -------------------------------------------------------- | ------------------------------------------- |
| Start                                                    | Replacement Pause control                   |
| Pause                                                    | Replacement Resume control                  |
| Resume                                                   | Replacement Pause control                   |
| Reset                                                    | Start                                       |
| Natural completion while a timer control is focused      | Start for the newly prepared Ready Interval |
| Suspend changes Running to Paused while Pause is focused | Resume                                      |
| Feedback close by keyboard                               | Current primary timer action                |
| Feedback auto-dismiss while its close button is focused  | Current primary timer action before removal |
| Theme selection                                          | The selected theme option                   |
| Resize hides a focused Full-only control                 | Current primary timer action                |
| Resize preserves a timer control                         | Equivalent control in the new mode          |

A timer re-render must not drop focus to the document body.

## Motion

Motion communicates state and feedback only.

| Token         | Duration | Easing                           | Use                                 |
| ------------- | -------: | -------------------------------- | ----------------------------------- |
| `instant`     |      0ms | none                             | Responsive mode and theme changes   |
| `fast`        |    120ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Button press/hover                  |
| `standard`    |    180ms | `cubic-bezier(0.22, 1, 0.36, 1)` | State color and control replacement |
| `feedback-in` |    200ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Completion Feedback entrance        |

Completion Feedback enters with opacity from 0 to 1 and an 8px upward-to-rest translation. It exits without delaying removal or timer interaction. The progress fill may interpolate linearly between authoritative visible-second updates while Running; it freezes immediately when Paused and snaps to full on Ready/Reset.

Do not animate layout, timer digits, image treatment, theme changes, cadence positions, or window-mode changes. Do not pulse the Running marker.

When reduced motion is requested:

- use `instant` for every transition and animation;
- update progress without interpolation;
- preserve all state changes and feedback content;
- do not replace removed movement with flashing.

## Accessibility semantics

The production interface targets **WCAG 2.2 AA**.

- Use one main landmark for the timer and one labelled complementary region for the cadence rail.
- The visible interval name acts as the timer region’s heading in Full mode. The Compact identifying line provides the equivalent accessible name in Compact mode.
- Represent remaining time with a time semantic or equivalent accessible value, including an accessible phrase such as `14 minutes 32 seconds remaining`.
- Do **not** make the per-second countdown a live region. Screen readers must not announce every tick.
- Announce user-visible state transitions once (`Timer running`, `Timer paused`, `Focus Session ready`, and equivalent Break text) through a polite status mechanism. Completion Feedback supplies its own one-time announcement.
- All controls use native button semantics or a fully equivalent platform pattern.
- All pointer targets are at least 44×44px, exceeding WCAG 2.2’s 24×24 minimum target size.
- Text remains selectable where the platform normally permits, but selection must not interfere with button activation.
- No information depends only on color, image, sound, animation, hover, or spatial position.
- The decorative photo and brand mark are hidden from assistive technology.
- Hidden responsive content is removed from both sequential focus and the accessibility tree.
- At 200% text size and at an effective 320 CSS-pixel viewport, content reflows into Compact mode without loss of information or control.
- Completion Feedback never moves focus, and native notification/audio failures never alter the visible timer state.

## Acceptance matrix

Implementation is not complete until all checks below pass against the packaged application where applicable.

### Asset and offline checks

- Verify the source hashes and rights records for the photograph and Inter.
- Verify the derivative is exactly 2560×1707 WebP, sRGB, metadata-free, and locally bundled.
- Verify no production CSS, markup, or code references the prototype placeholder image.
- Verify the application performs no runtime image, font, icon, or stylesheet request.
- Inspect launcher icons at every exported size, especially 16px and 32px.
- Verify the bundled Inter file is the rendered typeface and that tabular numerals do not shift width from `11:11` to `00:00`.

### Viewport checks

Test both Light and Dark effective themes at:

- 960×640: Full mode;
- 800×600: Full mode boundary;
- 799×600: Compact mode by width;
- 800×599: Compact mode by height;
- 480×360: Roomy Compact;
- 320×240: Tight Compact;
- 320×240 with Completion Feedback;
- 200% text scaling/zoom until the effective viewport reaches 320 CSS pixels.

At every size, verify no clipped controls, no horizontal scroll, no text truncation, no overlap, no content behind controls, and no focus indicator clipping. At 800×600, the cadence rail must not obscure timer controls. At 320×240 with feedback, the banner, identifier, time, and controls must all remain operable.

### State checks

In Full and Compact modes, inspect:

- Focus Session, Short Break, and Long Break in Ready, Running, and Paused states;
- Reset from Running and Paused;
- automatic pause on suspend;
- Focus and Break Completion Feedback;
- Focus Session Numbers 1, 4, 5, 8, 9, 99, and 1000;
- Pomodoro Cycle rollover after a Long Break;
- System preference resolving to both effective themes.

Verify control labels/enabled states, state marker shapes, exact copy, progress behavior, context calculations, cadence current/completed/upcoming treatment, and Compact identifying lines.

### Keyboard and assistive-technology checks

- Complete every timer and theme interaction using only Tab, Shift+Tab, Enter, Space, and Escape.
- Verify the specified Tab order and every focus-continuity transition.
- Resize across both mode boundaries while each interactive control is focused.
- Let Completion Feedback auto-dismiss while its close button is focused.
- Verify a screen reader announces timer state changes once, Completion Feedback once, and never announces every countdown second.
- Verify cadence descriptions expose completed/current/upcoming state and the full canonical `Focus Session` term.
- Verify disabled Reset is announced as unavailable and is omitted from sequential Tab order.
- Verify the photograph and decorative brand mark are absent from the accessibility tree.

### Visual and motion checks

- Programmatically verify every listed contrast baseline and manually inspect focus against every component state.
- Verify all operable neutral boundaries and meaningful indicators meet 3:1 non-text contrast.
- Verify theme switching has no incorrect-theme first paint and does not move focus.
- Verify reduced motion removes feedback entrance, button translation, state transitions, and progress interpolation.
- Verify no perpetual animation, blurred imagery, glass surface, decorative gradient, oversized radius, or wide diffuse card shadow has entered the production interface.

### Automated checks

Run an automated WCAG audit for every Full-mode timer state and every Compact-mode timer state in both themes, including Completion Feedback. Automated results do not replace the keyboard, screen-reader, contrast, resize, packaged-font, launcher-icon, or real Hyprland checks above.

## Explicit exclusions

This specification does not add or define:

- task management, productivity history, goals, streaks, or analytics;
- configurable durations;
- Skip, window-wide timer shortcuts, global shortcuts, or always-on-top behavior;
- tray UI, launch-on-login UI, or additional settings screens;
- Compact-mode theme controls;
- image rotation, user-selected imagery, network assets, or image animation;
- implementation framework, Electron process ownership, IPC shape, persistence mechanism, or module boundaries.
