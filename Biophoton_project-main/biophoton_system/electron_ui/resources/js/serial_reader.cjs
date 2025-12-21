#!/usr/bin/env node
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

const path = require('node:path')
const readline = require('node:readline')
const { createRequire } = require('module')

// ---- environment ----
const USE_MOCK =
  String(process.env.GSR_MOCK || '').toLowerCase() === 'true' ||
  String(process.env.GSR_MOCK || '') === '1'

const BASELINE_OHM = Number(process.env.MEAN || 100) // average value -> 50%
const BASELINE_PERCENT = 50

// logistic curve steepness
const CURVE_K = Number(process.env.CURVE_K || 2)

// Noise floor: below this, output baseline (50%)
const NOISE_THRESHOLD = Number(process.env.NOISE_THRESHOLD || 0)

// Blend of upper values
const ENABLE_BLEND = String(process.env.ENABLE_BLEND || 'true') === 'true'

// Upper safety clamp
const MAX_RESISTANCE = Number(process.env.MAX_RESISTANCE || 2500)

// Smoothing (EWMA) only for high values
const SMOOTHING_ALPHA = Number(process.env.SMOOTHING_ALPHA || 0.5)

const SMOOTHING_ENABLED =
  String(process.env.SMOOTHING_ENABLED || '').toLowerCase() === 'true' ||
  String(process.env.SMOOTHING_ENABLED || '') === '1'

// Output rate after downsampling (ms between emitted percent values)
// const OUTPUT_INTERVAL_MS = Number(process.env.OUTPUT_INTERVAL_MS || 100) // ~10Hz output

// Internal state for smoothing (percent domain)
let lastPercent = BASELINE_PERCENT

// // Downsampling / smoothing bucket state
// let bucketSum = 0
// let bucketCount = 0
// let lastEmitTs = Date.now() - OUTPUT_INTERVAL_MS // so first bucket can emit quickly

let parentPort = null
try {
  parentPort = require('worker_threads').parentPort
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_) {
  /* not running as worker */
}

// ---- logging ----
function log(...a) {
  console.error('[serial_reader]', ...a)
} // diagnostics -> stderr

// Swallow broken pipe gracefully (parent closed read end)
process.stdout.on('error', (err) => {
  if (err && err.code === 'EPIPE') {
    log('stdout EPIPE -> exiting')
    shutdown(0)
  } else {
    log('stdout error:', (err && err.message) || err)
  }
})

// central output function: worker or stdout
function emitLine(line) {
  if (stopping) return
  if (parentPort) {
    parentPort.postMessage({ type: 'data', line })
    return
  }
  try {
    if (!process.stdout.destroyed) process.stdout.write(line + '\n')
  } catch (e) {
    if (e && e.code === 'EPIPE') return shutdown(0)
    throw e
  }
}

// ---- shared helpers: clamp + mapping ----
function clampValue(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.min(MAX_RESISTANCE, Math.max(0, v))
}

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

function logisticPercent(R) {
  const ratio = R / BASELINE_OHM
  const raw = 1 / (1 + Math.pow(ratio, CURVE_K)) // 0..1
  return raw * 100
}

/**
 * Mapping:
 * - 0..NOISE_THRESHOLD → 50%
 * - ~20..MEAN          → high % (logistic)
 * - > MEAN             → low % with light smoothing
 */
function mapOhmToPercent(ohm) {
  const R = clampValue(ohm)

  // 1) Noise floor: 0..NOISE_THRESHOLD → baseline (50%)
  if (R <= NOISE_THRESHOLD) {
    lastPercent = BASELINE_PERCENT
    return BASELINE_PERCENT
  }

  // 2) Core logistic curve: MEAN → 50%, lower → high %, higher → low %
  let base = logisticPercent(R) // 0..100

  // 3) Optional small blend just above noise to avoid step
  const blendStart = NOISE_THRESHOLD
  const blendEnd = NOISE_THRESHOLD + 10

  if (ENABLE_BLEND && R > blendStart && R < blendEnd) {
    const t = (R - blendStart) / (blendEnd - blendStart) // 0..1
    const x = Math.max(0, Math.min(1, t))
    const blend = smoothstep(x)
    base = BASELINE_PERCENT * (1 - blend) + base * blend
  }

  // 4) Asymmetric smoothing:
  //    - BELOW or at MEAN: no smoothing → let the “good” zone pop
  //    - ABOVE MEAN: light EWMA smoothing
  if (R <= BASELINE_OHM) {
    const out = Math.max(0, Math.min(100, Math.round(base)))
    lastPercent = out // keep in sync
    return out
  }

  // 5) Above MEAN: apply smoothing only if enabled
  if (!SMOOTHING_ENABLED) {
    const out = Math.max(0, Math.min(100, Math.round(base)))
    lastPercent = out
    return out
  }

  const smoothed = SMOOTHING_ALPHA * base + (1 - SMOOTHING_ALPHA) * lastPercent
  lastPercent = smoothed
  return Math.max(0, Math.min(100, Math.round(smoothed)))
}

// small wrapper used by real serial path
function toPercentFromRaw(raw) {
  const vRaw = clampValue(raw)
  return mapOhmToPercent(vRaw)
}

/**
 * Downsampling / smoothing:
 * - called for every incoming percent sample (e.g. 20Hz)
 * - accumulates into a bucket
 * - every OUTPUT_INTERVAL_MS, emits one averaged percent line
 */
function handlePercentSample(percent) {
  if (stopping) return

  const out = Math.round(Math.max(0, Math.min(100, percent)))
  emitLine(String(out))

  // bucketSum += percent
  // bucketCount += 1

  // const now = Date.now()
  // if (now - lastEmitTs >= OUTPUT_INTERVAL_MS) {
  //   const avg = bucketCount > 0 ? bucketSum / bucketCount : percent

  //   // reset bucket
  //   bucketSum = 0
  //   bucketCount = 0
  //   lastEmitTs = now

  //   const out = Math.round(Math.max(0, Math.min(100, avg)))
  //   emitLine(String(out))
  // }
}

// ---- shutdown shared ----
let stopping = false
function shutdown(code = 0) {
  if (stopping) return
  stopping = true

  try {
    if (mockTimer) clearInterval(mockTimer)
  } catch {}

  try {
    rl && rl.close()
  } catch {}
  try {
    parser && parser.removeAllListeners()
  } catch {}
  try {
    port && port.removeAllListeners()
  } catch {}

  try {
    if (port && port.isOpen) {
      return port.close(() => process.exit(code))
    }
  } catch {}

  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

// ==========================================================
// MOCK MODE
// ==========================================================

let mockTimer = null
let port = null
let parser = null
let rl = null

if (USE_MOCK) {
  // import large mock values ONLY in mock mode
  const loaded = require('./merilynn.cjs')
  const values = Array.isArray(loaded) ? loaded : loaded.values
  let i = 0
  const valuesLen = values.length

  function tick() {
    if (stopping) return
    const rawOhm = values[i]
    const v = mapOhmToPercent(rawOhm)
    handlePercentSample(v)
    i = (i + 1) % valuesLen
  }

  // ~20Hz input from mock, ~10Hz output after OUTPUT_INTERVAL_MS bucketing
  mockTimer = setInterval(tick, 50)

  // if used as worker, main thread can send "stop"
  if (parentPort) {
    parentPort.on('message', (m) => {
      if (m && m.type === 'stop') shutdown(0)
    })
  }

  // nothing else to set up in mock mode
  return
}

// ==========================================================
// REAL SERIAL MODE
// ==========================================================

// ---- serial-only environment ----
const base = process.env.REQUIRE_BASE || process.cwd()
const requireFromApp = createRequire(path.join(base, 'package.json'))

const { SerialPort } = requireFromApp('serialport')
const { ReadlineParser } = requireFromApp('@serialport/parser-readline')

const PATH = process.env.SERIAL_PATH || '/dev/ttyACM0'
const BAUD = Number(process.env.SERIAL_BAUD || 115200)
const OPEN_DELAY_MS = Number(process.env.SERIAL_OPEN_DELAY_MS || 2000) // Arduino reset window

// ---- state ----
let currentMode = 0 // 0=idle, 1=measure, 2=treat
let portReady = false

// Command pipeline to guarantee ordering:
const cmdQueue = []
let sending = false

// ---- serial setup ----
port = new SerialPort({
  path: PATH,
  baudRate: BAUD,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  autoOpen: true
})

// Arduino commonly uses CRLF; parser tolerates '\r\n'
parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }))

function enqueueCmd(s) {
  if (!s) return
  cmdQueue.push(String(s))
  trySend()
}

function trySend() {
  if (sending) return
  if (!portReady) return
  const next = cmdQueue.shift()
  if (!next) return

  sending = true
  const msg = next + '\r\n'
  port.write(msg, (err) => {
    if (err) {
      log('write failed:', err.message)
      sending = false
      return setImmediate(trySend)
    }
    port.drain(() => {
      log('wrote', JSON.stringify(next))
      sending = false
      setImmediate(trySend)
    })
  })
}

port.on('open', () => {
  log(`open ${PATH} @ ${BAUD}; waiting ${OPEN_DELAY_MS}ms for MCU reset…`)
  setTimeout(() => {
    portReady = true
    trySend()
  }, OPEN_DELAY_MS)
})

port.on('error', (e) => !stopping && log('port error:', (e && e.message) || e))
port.on('close', () => !stopping && log('port closed'))

// ---- serial helpers ----
function sendMode1() {
  currentMode = 1
  enqueueCmd('MODE,1')
  enqueueCmd('START')
}

function sendStop() {
  enqueueCmd('STOP')
}

function sendMode2AndStart(freqs, durationMs) {
  currentMode = 2
  // freqs: [blood, saliva, photo, r1..r10]
  const base3 = freqs.slice(0, 3)
  const remedies = freqs.slice(3, 13)
  while (remedies.length < 10) remedies.push(0)

  const all = [...base3, ...remedies, durationMs]
  const freqLine = 'FREQ,' + all.map((x) => String(Number(x) || 0)).join(',')

  enqueueCmd('MODE,2')
  enqueueCmd(freqLine)
  enqueueCmd('START')
}

function sendMode4() {
  currentMode = 4
  enqueueCmd('MODE,4')
  enqueueCmd('START')
}

// ---- incoming serial parsing ----
parser.on('data', (line) => {
  if (stopping) return

  // Mode 1 stream: GSR,<t_ms>,<ohm>
  if (line.startsWith('GSR,')) {
    if (currentMode !== 1) return
    const parts = line.split(',')
    if (parts.length < 3) return
    const ohm = Number(parts[2])
    if (!Number.isFinite(ohm)) return

    const percent = toPercentFromRaw(ohm)
    // feed into downsampling / smoothing pipeline
    handlePercentSample(percent)
    return
  }

  // Mode 2 events:
  if (line.startsWith('EMIT,')) {
    const parts = line.split(',')
    if (parts.length >= 6) {
      const uptime = Number(parts[1]) || 0
      const nums = parts.slice(2).map((x) => Number(x) || 0)
      log('EMIT received:', { uptime, numsLen: nums.length })
      emitLine('EMIT\t' + [uptime, ...nums].join('\t'))
    }
    return
  }

  if (line.startsWith('EMIT_DONE')) {
    log('EMIT_DONE received')
    emitLine('EMIT_DONE')
    return
  }

  // Mode 4: RNG,<final_freq_hz>
  if (line.startsWith('RNG,')) {
    const parts = line.split(',')
    const freq = Number(parts[1]) || 0
    log('RNG received:', freq)
    emitLine('RNG\t' + freq)
    currentMode = 0
    return
  }

  // Debug any other serial lines
  log('serial:', line)
})

// ---- stdin command parser ----
rl = readline.createInterface({
  input: process.stdin,
  output: undefined,
  terminal: false
})

rl.on('line', (cmdLine) => {
  const line = (cmdLine || '').trim()
  if (!line) return

  const [cmd, ...args] = line.split(/\s+/)
  switch ((cmd || '').toUpperCase()) {
    case 'MEASURE': {
      sendMode1()
      break
    }
    case 'STOP': {
      sendStop()
      break
    }
    case 'TREAT': {
      if (args.length < 4) {
        log('TREAT requires: blood saliva photo [r1..r10] duration_ms')
        break
      }
      const nums = args.map((x) => Number(x) || 0)
      const durationMs = nums[nums.length - 1]
      const freqs = nums.slice(0, nums.length - 1)
      if (freqs.length < 3) {
        log('TREAT needs blood, saliva, photo before duration')
        break
      }
      sendMode2AndStart(freqs, durationMs)
      break
    }
    case 'RNG': {
      sendMode4()
      break
    }
    default:
      log('Unknown command:', line)
  }
})
