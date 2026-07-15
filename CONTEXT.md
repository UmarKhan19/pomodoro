# Pomodoro Timer

This context defines the language for a personal desktop utility that guides alternating periods of focused work and rest.

## Language

**Pomodoro Timer**:
A personal desktop utility that guides alternating focus and break intervals. It does not manage tasks or measure productivity.
_Avoid_: Task manager, productivity tracker

**Timer Run**:
One continuous use of the Pomodoro Timer, beginning when it is opened and ending when it closes. Timer progress is not carried between Timer Runs.
_Avoid_: Work session, persisted session

**Focus Session Number**:
The ordinal number of a Focus Session within one Timer Run. It starts at 1 and continues across Pomodoro Cycles until that Timer Run ends.
_Avoid_: Lifetime count, cycle position

**Pomodoro Cycle**:
Four Focus Sessions, with a Short Break after each of the first three and a Long Break after the fourth.
_Avoid_: Three-interval cycle

**Ready Interval**:
The current Focus Session, Short Break, or Long Break when it is at its full duration and waiting for Start. Completing an interval immediately prepares the next Ready Interval.
_Avoid_: Completed state, awaiting acknowledgment

**Running Interval**:
The current interval after Start or Resume while its remaining time is counting down.
_Avoid_: Active task

**Paused Interval**:
An interval that has started but is not counting down, with its remaining time preserved for Resume during the current Timer Run.
_Avoid_: Ready Interval

**Completion Feedback**:
A transient indication that an interval ended. It identifies the interval that completed while the next Ready Interval is current; it is not timer state and does not wait for acknowledgment.
_Avoid_: Completed state, completion screen

**Focus Session**:
A timed interval reserved for focused work.
_Avoid_: Work session, pomodoro

**Short Break**:
The rest interval following each of the first three Focus Sessions in a Pomodoro Cycle.
_Avoid_: Small break

**Long Break**:
The extended rest interval following the fourth Focus Session in a Pomodoro Cycle.
_Avoid_: Big break

**Focus Audio**:
Optional locally sourced audio intended to accompany Focus Sessions. It does not include streaming-service integrations.
_Avoid_: Streaming music
