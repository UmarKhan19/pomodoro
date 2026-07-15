# Horizon + Cadence timer interface prototype

> **THROWAWAY PROTOTYPE — not application code.** Delete it after its design answer has been absorbed into the implementation specification.

## Question

Which compact main-window design makes every agreed timer state and action immediately understandable?

## Selected direction

**Horizon + Cadence** combines an asymmetric, image-led timer with an explicit Pomodoro Cycle rail. The user selected it because it preserves Horizon’s modern, calm atmosphere while making the cadence legible: each Focus Session is paired with its following Short Break, and the fourth is visibly paired with the Long Break.

The nature image is crisp and masked into the timer surface. It is a resized prototype placeholder derived from an existing local wallpaper, not a proposed production asset.

## Run

```bash
./prototypes/timer-interface/run.sh
```

Then open <http://127.0.0.1:4173/>.

Use **Test state** to inspect Ready, Running, Paused, Short Break, Long Break, and Completion Feedback scenarios. The visible timer controls are interactive; **Complete now** is prototype-only.

Theme selection is stored locally so the System/Dark/Light interaction can be judged across reloads. Timer state itself remains in memory.
