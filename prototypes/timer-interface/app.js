// THROWAWAY PROTOTYPE: selected Horizon + Cadence timer-window direction.

const SCENARIOS = [
  { key: 'focus-ready', label: 'Focus Session 5 · Ready' },
  { key: 'focus-running', label: 'Focus Session 5 · Running' },
  { key: 'focus-paused', label: 'Focus Session 5 · Paused' },
  { key: 'short-ready', label: 'Short Break · Ready' },
  { key: 'long-ready', label: 'Long Break · Ready' },
  { key: 'focus-complete', label: 'Focus complete · Feedback' },
  { key: 'break-complete', label: 'Break complete · Feedback' },
]

const DURATIONS = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
const prototypeHost = document.querySelector('#prototype-ui')
const appHost = document.querySelector('#timer-app')
const showPrototypeUi =
  ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
  window.location.search.includes('prototypeControls=1')

let themePreference = readThemePreference()
let state = scenarioState(readScenario())
let toastTimeout
let lastRenderedSecond = state.remaining

applyTheme()
render()
if (state.toast) scheduleToastDismissal()

window.setInterval(tick, 250)
systemTheme.addEventListener('change', () => {
  if (themePreference === 'system') applyTheme()
})

appHost.addEventListener('click', handleAppClick)
prototypeHost.addEventListener('click', handlePrototypeClick)
prototypeHost.addEventListener('change', handlePrototypeChange)

function readThemePreference() {
  const requested = new URLSearchParams(window.location.search).get('theme')
  if (['system', 'dark', 'light'].includes(requested)) return requested

  try {
    const stored = window.localStorage.getItem('pomodoro-prototype-theme')
    return ['system', 'dark', 'light'].includes(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function readScenario() {
  const requested = new URLSearchParams(window.location.search).get('scenario')
  return SCENARIOS.some(({ key }) => key === requested) ? requested : 'focus-ready'
}

function applyTheme() {
  const resolved =
    themePreference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : themePreference
  document.documentElement.dataset.themePreference = themePreference
  document.documentElement.dataset.theme = resolved
}

function scenarioState(key) {
  const base = {
    scenario: key,
    interval: 'focus',
    focusNumber: 5,
    status: 'ready',
    remaining: DURATIONS.focus,
    deadline: null,
    toast: null,
  }

  switch (key) {
    case 'focus-running':
      return runningState({ ...base, status: 'running', remaining: 14 * 60 + 32 })
    case 'focus-paused':
      return { ...base, status: 'paused', remaining: 11 * 60 + 47 }
    case 'short-ready':
      return { ...base, interval: 'short', remaining: DURATIONS.short }
    case 'long-ready':
      return {
        ...base,
        interval: 'long',
        focusNumber: 8,
        remaining: DURATIONS.long,
      }
    case 'focus-complete':
      return {
        ...base,
        interval: 'short',
        remaining: DURATIONS.short,
        toast: {
          title: 'Focus Session 5 complete',
          message: 'Short Break ready — start when you’re ready.',
        },
      }
    case 'break-complete':
      return {
        ...base,
        focusNumber: 6,
        toast: {
          title: 'Short Break complete',
          message: 'Focus Session 6 ready — start when you’re ready.',
        },
      }
    default:
      return base
  }
}

function runningState(nextState) {
  return {
    ...nextState,
    deadline: Date.now() + nextState.remaining * 1000,
  }
}

function setScenario(key) {
  if (!SCENARIOS.some((scenario) => scenario.key === key)) return
  window.clearTimeout(toastTimeout)
  state = scenarioState(key)
  lastRenderedSecond = state.remaining
  const url = new URL(window.location.href)
  url.searchParams.set('scenario', key)
  window.history.replaceState({}, '', url)
  if (state.toast) scheduleToastDismissal()
  render()
}

function markInteractive() {
  state.scenario = 'custom'
  const url = new URL(window.location.href)
  url.searchParams.delete('scenario')
  window.history.replaceState({}, '', url)
}

function tick() {
  if (state.status !== 'running' || !state.deadline) return

  const remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000))
  if (remaining <= 0) {
    completeInterval()
    return
  }

  state.remaining = remaining
  if (remaining !== lastRenderedSecond) {
    lastRenderedSecond = remaining
    updateCountdownVisuals()
  }
}

function handleAppClick(event) {
  const actionTarget = event.target.closest('[data-action]')
  if (!actionTarget || actionTarget.disabled) return

  const { action, value } = actionTarget.dataset
  if (action === 'theme') setTheme(value)
  if (action === 'start' && state.status === 'ready') {
    window.clearTimeout(toastTimeout)
    state = runningState({ ...state, status: 'running', toast: null })
    markInteractive()
    render('[data-action="pause"]')
  }
  if (action === 'pause' && state.status === 'running') {
    if (!reconcileRemaining()) return
    state = { ...state, status: 'paused', deadline: null }
    markInteractive()
    render('[data-action="resume"]')
  }
  if (action === 'resume' && state.status === 'paused') {
    state = runningState({ ...state, status: 'running' })
    markInteractive()
    render('[data-action="pause"]')
  }
  if (action === 'reset' && state.status !== 'ready') {
    if (state.status === 'running' && !reconcileRemaining()) return
    state = {
      ...state,
      status: 'ready',
      remaining: DURATIONS[state.interval],
      deadline: null,
    }
    markInteractive()
    render('[data-action="start"]')
  }
  if (action === 'dismiss-toast') dismissToast(true)
}

function handlePrototypeClick(event) {
  const actionTarget = event.target.closest('[data-prototype-action]')
  if (actionTarget?.dataset.prototypeAction === 'complete') completeInterval()
}

function handlePrototypeChange(event) {
  if (event.target.matches('[data-scenario]')) setScenario(event.target.value)
}

function setTheme(value) {
  if (!['system', 'dark', 'light'].includes(value)) return
  themePreference = value
  try {
    window.localStorage.setItem('pomodoro-prototype-theme', value)
  } catch {
    // Theme persistence is best-effort in this throwaway prototype.
  }
  const url = new URL(window.location.href)
  url.searchParams.set('theme', value)
  window.history.replaceState({}, '', url)
  applyTheme()
  render(`[data-action="theme"][data-value="${value}"]`)
}

function reconcileRemaining() {
  if (!state.deadline) return true
  state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000))
  if (state.remaining <= 0) {
    completeInterval()
    return false
  }
  return true
}

function completeInterval() {
  const completedInterval = state.interval
  const completedFocusNumber = state.focusNumber
  let toast

  if (completedInterval === 'focus') {
    const nextInterval = completedFocusNumber % 4 === 0 ? 'long' : 'short'
    const nextLabel = nextInterval === 'long' ? 'Long Break' : 'Short Break'
    toast = {
      title: `Focus Session ${completedFocusNumber} complete`,
      message: `${nextLabel} ready — start when you’re ready.`,
    }
    state = {
      ...state,
      interval: nextInterval,
      status: 'ready',
      remaining: DURATIONS[nextInterval],
      deadline: null,
      toast,
    }
  } else {
    const completedLabel = completedInterval === 'long' ? 'Long Break' : 'Short Break'
    const nextFocusNumber = completedFocusNumber + 1
    toast = {
      title: `${completedLabel} complete`,
      message: `Focus Session ${nextFocusNumber} ready — start when you’re ready.`,
    }
    state = {
      ...state,
      interval: 'focus',
      focusNumber: nextFocusNumber,
      status: 'ready',
      remaining: DURATIONS.focus,
      deadline: null,
      toast,
    }
  }

  markInteractive()
  lastRenderedSecond = state.remaining
  scheduleToastDismissal()
  render()
}

function scheduleToastDismissal() {
  window.clearTimeout(toastTimeout)
  toastTimeout = window.setTimeout(() => {
    state.toast = null
    render()
  }, 8000)
}

function dismissToast(returnFocusToTimer = false) {
  window.clearTimeout(toastTimeout)
  if (!state.toast) return
  state.toast = null
  render(returnFocusToTimer ? '#timer-app-main' : undefined)
}

function render(requestedFocusSelector) {
  const focusSelector = requestedFocusSelector ?? captureFocusSelector()
  appHost.innerHTML = renderSelectedHorizon()
  prototypeHost.innerHTML = showPrototypeUi ? renderPrototypeUi() : ''
  document.title = 'Horizon + Cadence · Timer Prototype'

  if (focusSelector) {
    window.queueMicrotask(() => document.querySelector(focusSelector)?.focus())
  }
}

function captureFocusSelector() {
  const activeElement = document.activeElement
  if (!(activeElement instanceof HTMLElement)) return null
  if (activeElement.matches('[data-scenario]')) return '[data-scenario]'
  if (activeElement.dataset.action) {
    const valueSelector = activeElement.dataset.value
      ? `[data-value="${activeElement.dataset.value}"]`
      : ''
    return `[data-action="${activeElement.dataset.action}"]${valueSelector}`
  }
  if (activeElement.dataset.prototypeAction) {
    return `[data-prototype-action="${activeElement.dataset.prototypeAction}"]`
  }
  return null
}

function updateCountdownVisuals() {
  const formatted = formatTime(state.remaining)
  document.querySelectorAll('.timer-value').forEach((timer) => {
    timer.textContent = formatted
    timer.dateTime = `PT${state.remaining}S`
  })

  const ratio = remainingRatio()
  document.querySelectorAll('.horizon-progress span').forEach((bar) => {
    bar.style.setProperty('--progress', String(ratio))
  })
}

function renderSelectedHorizon() {
  return `
    <main class="timer-shell horizon-selected" id="timer-app-main" tabindex="-1">
      <div class="horizon-image" aria-hidden="true"></div>
      <div class="horizon-scrim" aria-hidden="true"></div>
      ${renderHeader()}

      <section class="horizon-stage" aria-labelledby="horizon-title">
        <div class="horizon-copy">
          ${renderStateBadge()}
          <p class="interval-name" id="horizon-title">${intervalName()}</p>
          <time class="timer-value horizon-time" datetime="PT${state.remaining}S">${formatTime(state.remaining)}</time>
          <p class="state-instruction horizon-instruction">${stateInstruction()}</p>
          <div class="horizon-progress" aria-hidden="true">
            <span style="--progress: ${remainingRatio()}"></span>
          </div>
          <div class="horizon-context-copy">
            <strong>${focusContext()}</strong>
            <span>${cyclePositionLabel()}</span>
          </div>
          ${renderTimerControls()}
        </div>

        ${renderHorizonCadenceRail()}
      </section>
      ${renderToast()}
    </main>
  `
}

function renderHeader() {
  return `
    <header class="app-header horizon-header">
      ${renderBrand()}
      ${renderThemeSwitcher()}
    </header>
  `
}

function renderBrand() {
  return `
    <div class="brand" role="img" aria-label="Pomodoro Timer">
      <svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5"></circle>
        <path d="M12 3.5v3M20.5 12h-3M12 20.5v-3M3.5 12h3"></path>
      </svg>
      <span>Pomodoro Timer</span>
    </div>
  `
}

function renderThemeSwitcher() {
  return `
    <div class="theme-switcher" role="group" aria-label="Theme">
      ${['system', 'dark', 'light']
        .map(
          (theme) => `
            <button
              class="theme-option"
              type="button"
              data-action="theme"
              data-value="${theme}"
              aria-pressed="${themePreference === theme}"
            >${capitalize(theme)}</button>
          `,
        )
        .join('')}
    </div>
  `
}

function renderStateBadge() {
  return `
    <span class="state-badge state-${state.status}">
      <span class="state-glyph" aria-hidden="true"></span>
      ${capitalize(state.status)}
    </span>
  `
}

function renderTimerControls() {
  const primaryAction =
    state.status === 'ready'
      ? { action: 'start', label: 'Start' }
      : state.status === 'running'
        ? { action: 'pause', label: 'Pause' }
        : { action: 'resume', label: 'Resume' }

  return `
    <div class="timer-controls" aria-label="Timer controls">
      <button class="button button-primary" type="button" data-action="${primaryAction.action}">
        ${primaryAction.label}
      </button>
      <button
        class="button button-secondary"
        type="button"
        data-action="reset"
        ${state.status === 'ready' ? 'disabled' : ''}
      >Reset current interval</button>
    </div>
  `
}

function renderHorizonCadenceRail() {
  const baseFocusNumber = (cycleNumber() - 1) * 4 + 1
  const currentPosition = cyclePosition()

  return `
    <aside class="horizon-cadence" aria-label="${cycleLabel()} Focus and Break cadence">
      <header>
        <strong>${cycleLabel()}</strong>
        <span>Four Focus Sessions, then a Long Break</span>
      </header>
      <ol>
        ${[1, 2, 3, 4]
          .map((position) => {
            const focusNumber = baseFocusNumber + position - 1
            const breakName = position === 4 ? 'Long Break' : 'Short Break'
            const breakMinutes = position === 4 ? 15 : 5
            const focusCurrent = position === currentPosition && state.interval === 'focus'
            const breakCurrent = position === currentPosition && state.interval !== 'focus'
            const completed = position < currentPosition || breakCurrent
            const classes = [
              completed ? 'is-past' : '',
              focusCurrent || breakCurrent ? 'is-current' : '',
              breakCurrent ? 'is-break' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return `
              <li class="${classes}">
                <div class="cadence-focus" ${focusCurrent ? 'aria-current="step"' : ''}>
                  <span class="cadence-node">${position}</span>
                  <span><strong>Focus ${focusNumber}</strong><small>25 min</small></span>
                </div>
                <div class="cadence-break" ${breakCurrent ? 'aria-current="step"' : ''}>
                  <span>${breakName}</span>
                  <small>${breakMinutes} min</small>
                </div>
              </li>
            `
          })
          .join('')}
      </ol>
    </aside>
  `
}

function renderToast() {
  if (!state.toast) return ''

  return `
    <aside class="completion-toast" role="status" aria-live="polite" aria-atomic="true">
      <div class="toast-icon" aria-hidden="true">✓</div>
      <div class="toast-copy">
        <strong>${state.toast.title}</strong>
        <span>${state.toast.message}</span>
      </div>
      <button class="toast-close" type="button" data-action="dismiss-toast" aria-label="Dismiss completion feedback">×</button>
    </aside>
  `
}

function renderPrototypeUi() {
  const selectedScenario = SCENARIOS.some(({ key }) => key === state.scenario)
    ? state.scenario
    : 'custom'

  return `
    <div class="prototype-state-tools">
      <span class="prototype-tag">Prototype</span>
      <label>
        <span>Test state</span>
        <select data-scenario aria-label="Test timer state">
          ${SCENARIOS.map(
            ({ key, label }) => `<option value="${key}" ${selectedScenario === key ? 'selected' : ''}>${label}</option>`,
          ).join('')}
          <option value="custom" ${selectedScenario === 'custom' ? 'selected' : ''} disabled>Interactive state</option>
        </select>
      </label>
      <button type="button" data-prototype-action="complete">Complete now</button>
    </div>
  `
}

function intervalName() {
  return {
    focus: 'Focus Session',
    short: 'Short Break',
    long: 'Long Break',
  }[state.interval]
}

function focusContext() {
  return state.interval === 'focus'
    ? `Focus Session ${state.focusNumber}`
    : `After Focus Session ${state.focusNumber}`
}

function stateInstruction() {
  return {
    ready: 'Start when you’re ready.',
    running: 'Counting down.',
    paused: 'Remaining time is held until you resume.',
  }[state.status]
}

function cycleNumber() {
  return Math.floor((state.focusNumber - 1) / 4) + 1
}

function cyclePosition() {
  return ((state.focusNumber - 1) % 4) + 1
}

function cycleLabel() {
  return `Pomodoro Cycle ${cycleNumber()}`
}

function cyclePositionLabel() {
  const relationship = state.interval === 'focus' ? 'position' : 'Break after position'
  return `${relationship} ${cyclePosition()} of 4`
}

function remainingRatio() {
  return Math.max(0, Math.min(1, state.remaining / DURATIONS[state.interval]))
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
