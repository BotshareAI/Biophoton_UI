const MIN_FREQ = 200 // lower floor so the drop is more audible
const BASE_FREQ = 600
const MAX_FREQ = 1000
const LOWEST_DROP_FREQ = 140 // extra-low for severe drops

export class PitchFollower {
  private ctx: AudioContext | null = null
  private osc?: OscillatorNode
  private gain?: GainNode
  private muted = true
  private readonly baseGain = 0.15 // normal volume when unmuted

  private lastValue: number | null = null
  private scrapeThreshold = 50
  private lastScrapeTime = 0

  private playScrape(): void {
    if (!this.ctx || !this.gain) return
    const ctx = this.ctx
    const now = ctx.currentTime

    // Limit rate (e.g. max a few times per second)
    if (now - this.lastScrapeTime < 0.18) return
    this.lastScrapeTime = now

    // Slightly longer, more "real" scrape
    const durationSec = 0.35
    const frameCount = Math.floor(ctx.sampleRate * durationSec)
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // White noise base (a bit hotter)
    for (let i = 0; i < frameCount; i++) {
      data[i] = (Math.random() * 2 - 1) * 1.0
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    // Start higher, sweep downward more dramatically
    const startFreq = 2200
    const endFreq = 200
    filter.frequency.setValueAtTime(startFreq, now)
    filter.frequency.linearRampToValueAtTime(endFreq, now + durationSec)
    filter.Q.value = 2.5 // a bit broader

    const g = ctx.createGain()
    g.gain.value = 0

    noise.connect(filter)
    filter.connect(g)
    // Route through main gain so mute/unmute applies to scrape too
    g.connect(this.gain)

    // Envelope: quick attack, then decay, slightly louder
    const peakGain = this.baseGain * 1.6
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(peakGain, now + 0.02)
    g.gain.linearRampToValueAtTime(0, now + durationSec)

    noise.start(now)
    noise.stop(now + durationSec + 0.05)
  }

  setScrapeThreshold(v: number): void {
    this.scrapeThreshold = v
  }

  async start(): Promise<void> {
    if (!this.ctx) this.ctx = new window.AudioContext()
    const ctx = this.ctx

    this.gain = ctx.createGain()
    this.gain.gain.value = 0
    this.gain.connect(ctx.destination)

    this.osc = ctx.createOscillator()
    this.osc.type = 'triangle'
    this.osc.frequency.value = BASE_FREQ
    this.osc.connect(this.gain)
    this.osc.start()

    this.muted = true
    this.lastValue = null
  }

  stop(): void {
    if (!this.ctx || !this.gain || !this.osc) return
    const t = this.ctx.currentTime
    this.gain.gain.cancelScheduledValues(t)
    this.gain.gain.linearRampToValueAtTime(0, t + 0.05)
    this.osc.stop(t + 0.06)
    this.osc.disconnect()
    this.gain.disconnect()
    this.osc = undefined
    this.gain = undefined
  }

  setMuted(muted: boolean): void {
    if (!this.ctx || !this.gain) return
    if (muted === this.muted) return

    this.muted = muted
    const t = this.ctx.currentTime
    this.gain.gain.cancelScheduledValues(t)
    const target = muted ? 0 : this.baseGain
    this.gain.gain.linearRampToValueAtTime(target, t + 0.05)
  }

  /** periodSec = sample period (0.05s) so the ramp spans exactly one update */
  update(value: number, periodSec = 0.05): void {
    if (!this.ctx || !this.osc) return
    const t = this.ctx.currentTime

    // Base mapping (5–95 → MIN_FREQ–MAX_FREQ)
    let hz = mapExp(value, 5, 95, MIN_FREQ, MAX_FREQ)

    const isDropping = this.lastValue !== null && value < this.lastValue - 0.5 // 0.5% hysteresis
    const inLowZone = value <= this.scrapeThreshold

    if (inLowZone) {
      // How deep into the "bad" zone are we? 0 at threshold, 1 at 0%
      const severity = Math.min(1, (this.scrapeThreshold - value) / this.scrapeThreshold)

      // Push more aggressively toward a very low floor
      const extraLowFloor = LOWEST_DROP_FREQ
      hz = extraLowFloor + (hz - extraLowFloor) * (1 - 0.6 * severity)

      // Add jitter so it feels unstable
      const jitterAmount = 15 + 45 * severity // Hz
      hz += (Math.random() * 2 - 1) * jitterAmount
    }

    this.osc.frequency.cancelScheduledValues(t)
    this.osc.frequency.setValueAtTime(this.osc.frequency.value, t)
    this.osc.frequency.linearRampToValueAtTime(hz, t + Math.min(periodSec, 0.2))

    if (isDropping && inLowZone) {
      this.playScrape()
    }

    this.lastValue = value
  }
}

function mapExp(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const n = Math.min(1, Math.max(0, (v - inMin) / (inMax - inMin)))
  return outMin * Math.pow(outMax / outMin, n) // perceptual (log) pitch
}
