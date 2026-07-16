# Completion Feedback sound-cue specification

This document is the durable answer from the live Completion Feedback sound prototype. It specifies the exact locally generated Web Audio cues for v1; the throwaway comparison player has been deleted.

## Decision

Use the prototype’s **B — Rounded chime** pair unchanged. Live listening selected it over the cleaner two-note cadence and continuous glide because its additive strikes remain gentle while carrying more clearly through the target machine’s speakers.

- Completing a **Focus Session** plays the descending cue. It settles from G5 to D5 while the following Break becomes the Ready Interval.
- Completing either a **Short Break** or **Long Break** plays the rising cue. It lifts from D5 to G5 while the next Focus Session becomes the Ready Interval.
- Short and Long Breaks deliberately share one cue. Completion Feedback text identifies which Break completed.

The cue is an informational Completion Feedback channel. It does not carry meaning that is absent from the visual toast or native notification.

## Reference samples

These files are listening and regression references, not production playback assets. Production must synthesize the cue through Web Audio rather than bundle or decode the WAV files.

- [Focus Session completion — gently settling](assets/completion-feedback/focus-session-complete.wav)
- [Break completion — gently rising](assets/completion-feedback/break-complete.wav)

Both references were rendered from the recipe below with Chromium 150.0.7871.114 `OfflineAudioContext`, then encoded as 48 kHz, 16-bit PCM, mono WAV. Each has 38,400 frames and an 800 ms file duration: 790 ms of gain automation followed by a silent tail.

| Reference | Peak | Whole-file RMS | SHA-256 |
| --- | ---: | ---: | --- |
| Focus Session completion | −17.412 dBFS | −29.984 dBFS | `7d2b3e135f6a9dfa005b980ff80ee532743ad35ebd8442130a5fc28a4f27c163` |
| Break completion | −17.347 dBFS | −29.985 dBFS | `288c5e770f314f222441d4fd42e3e7892e3b82838bf3c44b2446045abfc53bc7` |

The references begin at cue time zero and therefore omit the production scheduler’s 25 ms look-ahead.

## Exact synthesis recipe

### Shared output

- Use only standard `OscillatorNode` and `GainNode` Web Audio primitives.
- Every oscillator uses the `sine` waveform.
- Connect every layer gain to one cue master gain, then connect that master directly to `AudioContext.destination`.
- Set the cue master gain to **0.34** (`−9.370 dB`). Do not add normalization, compression, limiting, filtering, reverb, delay, stereo panning, or another app-controlled output stage.
- Schedule cue time zero at `audioContext.currentTime + 0.025` seconds. This 25 ms look-ahead is part of the recipe and avoids late same-quantum scheduling.
- Audible gain reaches exact zero at **790 ms** after cue time zero. The final oscillator stops at **794 ms**. The complete request-to-stop span is therefore 819 ms and remains below one second.
- The mono synthesis graph is left to Web Audio’s normal destination up-mixing.

### Oscillator layers

All offsets, envelope times, and durations below are relative to cue time zero or, where stated, to that layer’s own start.

| Layer | Focus Session completion frequency | Break completion frequency | Start offset | Duration | Peak layer gain | Linear attack | Shoulder time from layer start | Shoulder gain |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| First fundamental | 783.99 Hz (G5) | 587.33 Hz (D5) | 0 ms | 500 ms | 0.280 | 8 ms | 110 ms | 0.1176 (42% of peak) |
| First octave partial | 1567.98 Hz (G6) | 1174.66 Hz (D6) | 0 ms | 320 ms | 0.055 | 6 ms | 70 ms | 0.0165 (30% of peak) |
| Second fundamental | 587.33 Hz (D5) | 783.99 Hz (G5) | 230 ms | 560 ms | 0.340 | 10 ms | 140 ms | 0.1700 (50% of peak) |
| Second octave partial | 1174.66 Hz (D6) | 1567.98 Hz (G6) | 230 ms | 360 ms | 0.060 | 6 ms | 80 ms | 0.0192 (32% of peak) |

Frequencies are fixed within each layer; do not glide or detune them.

### Click-free envelope

Apply this automation independently to every layer, where `start`, `duration`, `peak`, `attack`, `shoulderTime`, and `shoulderGain` come from the table:

1. Set gain to exact `0` at `start`.
2. Linearly ramp to `peak` at `start + attack`.
3. Exponentially ramp to `shoulderGain` at `start + shoulderTime`.
4. Exponentially ramp to `0.0001` (`−80 dB`) at `start + duration − 12 ms`.
5. Linearly ramp to exact `0` at `start + duration`.
6. Stop the oscillator 4 ms after the gain reaches zero.

Starting at zero, retaining a positive floor for exponential automation, and reaching exact zero before oscillator stop are all required. Do not stop an audible oscillator directly.

## Web Audio scheduling reference

This framework-independent TypeScript expresses the normative values. Production code may reshape the module boundary, but must preserve its graph and automation.

```ts
type CompletedInterval = "focus-session" | "break";

type Layer = Readonly<{
  frequency: number;
  offset: number;
  duration: number;
  peak: number;
  attack: number;
  shoulderTime: number;
  shoulderRatio: number;
}>;

const MIN_GAIN = 0.0001;
const RELEASE_CLOSE = 0.012;
const OSCILLATOR_STOP_PADDING = 0.004;
const SCHEDULER_LOOK_AHEAD = 0.025;
const MASTER_GAIN = 0.34;

const layer = (
  frequency: number,
  offset: number,
  duration: number,
  peak: number,
  attack: number,
  shoulderTime: number,
  shoulderRatio: number,
): Layer => ({
  frequency,
  offset,
  duration,
  peak,
  attack,
  shoulderTime,
  shoulderRatio,
});

const roundedChime = (first: number, second: number): readonly Layer[] => [
  layer(first, 0, 0.5, 0.28, 0.008, 0.11, 0.42),
  layer(first * 2, 0, 0.32, 0.055, 0.006, 0.07, 0.3),
  layer(second, 0.23, 0.56, 0.34, 0.01, 0.14, 0.5),
  layer(second * 2, 0.23, 0.36, 0.06, 0.006, 0.08, 0.32),
];

const layersByCompletion: Record<CompletedInterval, readonly Layer[]> = {
  "focus-session": roundedChime(783.99, 587.33),
  break: roundedChime(587.33, 783.99),
};

export function scheduleCompletionCue(
  context: AudioContext,
  completedInterval: CompletedInterval,
): void {
  const cueStart = context.currentTime + SCHEDULER_LOOK_AHEAD;
  const master = context.createGain();
  const layers = layersByCompletion[completedInterval];
  let oscillatorsRemaining = layers.length;

  master.gain.setValueAtTime(MASTER_GAIN, cueStart);
  master.connect(context.destination);

  for (const layer of layers) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const start = cueStart + layer.offset;
    const end = start + layer.duration;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(layer.frequency, start);

    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(layer.peak, start + layer.attack);
    envelope.gain.exponentialRampToValueAtTime(
      layer.peak * layer.shoulderRatio,
      start + layer.shoulderTime,
    );
    envelope.gain.exponentialRampToValueAtTime(
      MIN_GAIN,
      end - RELEASE_CLOSE,
    );
    envelope.gain.linearRampToValueAtTime(0, end);

    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.addEventListener(
      "ended",
      () => {
        envelope.disconnect();
        oscillatorsRemaining -= 1;
        if (oscillatorsRemaining === 0) master.disconnect();
      },
      { once: true },
    );
    oscillator.start(start);
    oscillator.stop(end + OSCILLATOR_STOP_PADDING);
  }
}
```

## Delivery and failure isolation

- Timer Runtime must complete its state transition and prepare the next Ready Interval independently of this function.
- Treat audio scheduling as one best-effort Completion Feedback attempt, independent of the visual toast and native notification attempts.
- Context creation, `resume()`, and scheduling failures must be caught at the audio-channel boundary, recorded through the local diagnostic path, and otherwise ignored. Do not retry and do not surface an audio error to the user.
- Never await audio before changing timer state or attempting another Completion Feedback channel.
- Route only through `AudioContext.destination`. The fixed master gain shapes the cue; the operating system’s output volume and mute remain authoritative.
- v1 provides no audio setting and does not synthesize speech.

## Acceptance checks

- A Focus Session completion audibly descends G5→D5; either Break completion audibly rises D5→G5.
- Both cues match the corresponding reference WAV closely enough that no changed pitch, onset, spacing, brightness, envelope, or level is perceptible in an A/B comparison on the target machine.
- Audible output reaches zero within 790 ms, has no start or stop click, and does not clip.
- System mute silences the cue and normal system volume changes its level.
- Throwing or rejecting at every audio boundary leaves the next Ready Interval, visual toast, and native-notification attempt unchanged.
