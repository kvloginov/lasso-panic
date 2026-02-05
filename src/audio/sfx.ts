export interface ToneOptions {
  readonly startHz: number;
  readonly endHz: number;
  readonly durationSec: number;
  readonly type: OscillatorType;
  readonly peakGain: number;
  readonly attackSec: number;
  readonly releaseSec: number;
  readonly timeOffsetSec?: number;
}

const DEFAULT_MASTER_GAIN = 0.18;

export class SfxEngine {
  private context: AudioContext | null = null;

  private master: GainNode | null = null;

  private muted = false;

  private unlocked = false;

  private ensureGraph(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!this.context) {
      const AudioCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        return false;
      }

      this.context = new AudioCtor();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : DEFAULT_MASTER_GAIN;
      this.master.connect(this.context.destination);
    }

    return Boolean(this.context && this.master);
  }

  public async resume(): Promise<void> {
    if (!this.ensureGraph() || !this.context) {
      return;
    }

    if (this.context.state !== 'running') {
      await this.context.resume();
    }

    this.unlocked = true;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    if (!this.ensureGraph() || !this.master) {
      this.muted = !this.muted;
      return this.muted;
    }

    this.muted = !this.muted;
    this.master.gain.setValueAtTime(this.muted ? 0 : DEFAULT_MASTER_GAIN, this.context!.currentTime);
    return this.muted;
  }

  private tone(options: ToneOptions): void {
    if (!this.ensureGraph() || !this.context || !this.master || this.muted || !this.unlocked) {
      return;
    }

    const now = this.context.currentTime + (options.timeOffsetSec ?? 0);
    const end = now + options.durationSec;
    const attackEnd = now + options.attackSec;
    const releaseStart = Math.max(attackEnd, end - options.releaseSec);

    const oscillator = this.context.createOscillator();
    oscillator.type = options.type;
    oscillator.frequency.setValueAtTime(Math.max(12, options.startHz), now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(12, options.endHz), end);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(options.peakGain, attackEnd);
    gain.gain.setValueAtTime(options.peakGain * 0.6, releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(this.master);

    oscillator.start(now);
    oscillator.stop(end + 0.01);
  }

  private noise(durationSec: number, peakGain: number): void {
    if (!this.ensureGraph() || !this.context || !this.master || this.muted || !this.unlocked) {
      return;
    }

    const frameCount = Math.max(1, Math.floor(this.context.sampleRate * durationSec));
    const noiseBuffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const channel = noiseBuffer.getChannelData(0);

    for (let i = 0; i < frameCount; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
    }

    const source = this.context.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 760;
    filter.Q.value = 0.9;

    const gain = this.context.createGain();
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + durationSec * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    source.start(now);
    source.stop(now + durationSec + 0.01);
  }

  public spawnPreview(): void {
    this.tone({
      startHz: 680,
      endHz: 590,
      durationSec: 0.055,
      type: 'triangle',
      peakGain: 0.065,
      attackSec: 0.006,
      releaseSec: 0.04
    });
  }

  public activate(): void {
    this.tone({
      startHz: 360,
      endHz: 520,
      durationSec: 0.07,
      type: 'square',
      peakGain: 0.075,
      attackSec: 0.005,
      releaseSec: 0.05
    });
  }

  public success(count: number, combo: number): void {
    const countBoost = Math.min(180, count * 18);
    const comboBoost = Math.min(140, combo * 12);
    const base = 500 + countBoost + comboBoost;

    this.tone({
      startHz: base,
      endHz: base * 1.08,
      durationSec: 0.1,
      type: 'triangle',
      peakGain: 0.1,
      attackSec: 0.008,
      releaseSec: 0.06
    });

    this.tone({
      startHz: base * 1.22,
      endHz: base * 1.32,
      durationSec: 0.11,
      type: 'square',
      peakGain: 0.08,
      attackSec: 0.008,
      releaseSec: 0.07,
      timeOffsetSec: 0.045
    });
  }

  public error(): void {
    this.tone({
      startHz: 190,
      endHz: 95,
      durationSec: 0.17,
      type: 'sawtooth',
      peakGain: 0.12,
      attackSec: 0.005,
      releaseSec: 0.12
    });

    this.noise(0.11, 0.07);
  }

  public gameOver(): void {
    this.tone({
      startHz: 430,
      endHz: 210,
      durationSec: 0.24,
      type: 'triangle',
      peakGain: 0.1,
      attackSec: 0.01,
      releaseSec: 0.18
    });

    this.tone({
      startHz: 240,
      endHz: 120,
      durationSec: 0.27,
      type: 'square',
      peakGain: 0.08,
      attackSec: 0.01,
      releaseSec: 0.2,
      timeOffsetSec: 0.1
    });
  }
}
