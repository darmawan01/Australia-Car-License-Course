// Procedural Web Audio API sound synthesizer for Australian driving simulator

class SoundEngine {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineStarted = false;
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;
  private indicatorInterval: number | null = null;
  private isMuted = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.engineGain) {
      this.engineGain.gain.value = 0;
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public startEngine() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx || this.isEngineStarted) return;

      // Engine fundamental oscillator
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime); // 750 RPM idle approx

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineStarted = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public updateEngineSound(speedKmh: number, rpm: number, throttle: number) {
    if (!this.ctx || !this.isEngineStarted || !this.engineOsc || !this.engineGain || !this.engineFilter || this.isMuted) return;

    try {
      // Calculate realistic engine frequency: idle ~45Hz, redline ~220Hz
      const targetFreq = 42 + (rpm / 6500) * 160 + (throttle * 20);
      const targetGain = 0.05 + (throttle * 0.08) + (Math.abs(speedKmh) / 120) * 0.05;
      const targetFilter = 200 + (rpm / 6500) * 800 + (throttle * 300);

      const now = this.ctx.currentTime;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
      this.engineGain.gain.setTargetAtTime(Math.min(targetGain, 0.18), now, 0.08);
      this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.08);
    } catch {
      // Ignore audio sync glitches
    }
  }

  public playIndicatorClick(type: 'on' | 'off') {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const freq = type === 'on' ? 1200 : 950;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, this.ctx.currentTime);
      filter.Q.setValueAtTime(4, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // silent
    }
  }

  public startHorn() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx || this.hornOsc1) return;

      const now = this.ctx.currentTime;
      this.hornOsc1 = this.ctx.createOscillator();
      this.hornOsc2 = this.ctx.createOscillator();
      this.hornGain = this.ctx.createGain();

      this.hornOsc1.type = 'sawtooth';
      this.hornOsc2.type = 'sawtooth';

      // Authentic dual-tone vehicle horn (410Hz and 490Hz)
      this.hornOsc1.frequency.setValueAtTime(415, now);
      this.hornOsc2.frequency.setValueAtTime(495, now);

      this.hornGain.gain.setValueAtTime(0.12, now);

      this.hornOsc1.connect(this.hornGain);
      this.hornOsc2.connect(this.hornGain);
      this.hornGain.connect(this.ctx.destination);

      this.hornOsc1.start();
      this.hornOsc2.start();
    } catch {
      // silent
    }
  }

  public stopHorn() {
    if (!this.hornOsc1 || !this.hornGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.hornGain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      setTimeout(() => {
        if (this.hornOsc1) {
          this.hornOsc1.stop();
          this.hornOsc1.disconnect();
          this.hornOsc1 = null;
        }
        if (this.hornOsc2) {
          this.hornOsc2.stop();
          this.hornOsc2.disconnect();
          this.hornOsc2 = null;
        }
        this.hornGain = null;
      }, 60);
    } catch {
      this.hornOsc1 = null;
      this.hornOsc2 = null;
      this.hornGain = null;
    }
  }

  public playKerbCollision() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // silent
    }
  }

  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const startTime = now + idx * 0.08;
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // silent
    }
  }

  public playWarningBuzzer() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(190, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0, now + 0.12);
      gain.gain.setValueAtTime(0.1, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // silent
    }
  }
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenInterval: number | null = null;

  public playBrakeScreech() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.2);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.Q.setValueAtTime(8, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // silent
    }
  }

  public startSiren() {
    if (this.isMuted || this.sirenOsc) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(650, now);

      this.sirenGain.gain.setValueAtTime(0.08, now);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);

      this.sirenOsc.start();

      let toggle = false;
      this.sirenInterval = window.setInterval(() => {
        if (!this.ctx || !this.sirenOsc) return;
        const curTime = this.ctx.currentTime;
        toggle = !toggle;
        this.sirenOsc.frequency.linearRampToValueAtTime(toggle ? 900 : 650, curTime + 0.3);
      }, 350);
    } catch {
      // silent
    }
  }

  public stopSiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc && this.ctx && this.sirenGain) {
      try {
        const now = this.ctx.currentTime;
        this.sirenGain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        setTimeout(() => {
          if (this.sirenOsc) {
            this.sirenOsc.stop();
            this.sirenOsc.disconnect();
            this.sirenOsc = null;
          }
          this.sirenGain = null;
        }, 100);
      } catch {
        this.sirenOsc = null;
        this.sirenGain = null;
      }
    }
  }

  public playClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // silent
    }
  }

  public playLevelPass() {
    this.playSuccessChime();
  }
}

export const soundManager = new SoundEngine();
