# Horizon + Cadence timer interface prototype

> **THROWAWAY PROTOTYPE — not application code.** Delete it after its design answer has been absorbed into the implementation specification.

## Selected Compact direction

Live feedback selected a quiet, centered instrument for Compact mode at 320×240 and under 200% text scaling:

- remaining time is the unambiguous focal point;
- the interval title and state label are small and muted, while the state marker alone retains the interval accent;
- one quiet line preserves Focus Session Number and Pomodoro Cycle position;
- Start/Pause/Resume and Reset use restrained desktop-sized targets rather than oversized mobile controls; and
- theme selection is intentionally absent. The persisted theme remains applied, and resizing to Full mode restores System/Dark/Light controls.

Earlier metadata-heavy and left-aligned variants were deleted after the centered direction was approved.

## Existing selected direction

**Horizon + Cadence** combines an asymmetric, image-led timer with an explicit Pomodoro Cycle rail. The user selected it because it preserves Horizon’s modern, calm atmosphere while making the cadence legible: each Focus Session is paired with its following Short Break, and the fourth is visibly paired with the Long Break.

The nature image is crisp and masked into the timer surface. It is a resized prototype placeholder derived from an existing local wallpaper, not a proposed production asset.

## Run

```bash
./prototypes/timer-interface/run.sh
```

Then open <http://127.0.0.1:4173/>.

Use **Test state** to inspect Ready, Running, Paused, Short Break, Long Break, large Focus Session Numbers, and Completion Feedback scenarios. The visible timer controls are interactive; **Complete now** is prototype-only.

For an unobscured 320×240 inspection, add `prototypeControls=0`, for example:

<http://127.0.0.1:4173/?scenario=focus-complete&prototypeControls=0>

Theme selection is stored locally and remains available in Full mode. Timer state itself remains in memory.
