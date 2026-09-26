/**
 * Procedural Audio Engine for Mid-Autumn Storybook
 * Uses Web Audio API to create authentic atmospheric sounds without external asset dependencies.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private cricketNode: AudioNode | null = null;
  private windNode: AudioNode | null = null;
  private flameNode: AudioNode | null = null;
  private musicInterval: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();
  }

  // Realistic mechanical clock ticking that rapidly spins then decelerates
  public playClockRewind(onComplete?: () => void) {
    if (!this.ctx) this.init();
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    let t = now + 0.1;
    let dt = 0.08; // start fast (12.5 ticks/sec)
    let tickCount = 0;

    const scheduleTick = () => {
      if (!this.ctx) return;
      while (t < now + 6.0) {
        tickCount++;
        const isTick = tickCount % 2 === 0;

        // Mechanical wooden/metallic escapement click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = isTick ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(isTick ? 1400 : 1800, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.025);

        filter.type = 'bandpass';
        filter.frequency.value = isTick ? 1200 : 1600;
        filter.Q.value = 4.0;

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.03);

        // Gradually slow down
        t += dt;
        dt *= 1.09; // deceleration factor
        if (dt > 1.4) break;
      }

      // Transition into gentle nocturnal crickets & wind
      setTimeout(() => {
        this.startNightAmbience();
        if (onComplete) onComplete();
      }, 5500);
    };

    scheduleTick();
  }

  public startNightAmbience() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // 1. Soft nocturnal breeze (Bandpass filtered white noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 350;
    windFilter.Q.value = 2.5;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.035;

    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ctx.destination);
    whiteNoise.start();
    this.windNode = windGain;

    // 2. Distant crickets ambient pulse
    this.startCrickets();
  }

  private startCrickets() {
    if (!this.ctx) return;

    // Periodic soft chirping pulse
    const cricketOsc = this.ctx.createOscillator();
    const cricketGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    cricketOsc.type = 'sine';
    cricketOsc.frequency.value = 4600;

    filter.type = 'bandpass';
    filter.frequency.value = 4600;
    filter.Q.value = 5.0;

    cricketGain.gain.value = 0.0;

    cricketOsc.connect(filter);
    filter.connect(cricketGain);
    cricketGain.connect(this.ctx.destination);
    cricketOsc.start();

    // Modulate gain to sound like real summer/autumn crickets
    let tick = 0;
    const interval = window.setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      tick++;
      const now = this.ctx.currentTime;
      // Chirp burst
      if (tick % 6 === 0 || tick % 6 === 1 || tick % 6 === 2) {
        cricketGain.gain.cancelScheduledValues(now);
        cricketGain.gain.setValueAtTime(0.015, now);
        cricketGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      }
    }, 120);

    this.cricketNode = cricketGain;
  }

  // Play bamboo wood tap when snapping bamboo frame
  public playBambooSnap() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Cellophane paper rustle when applying glass paper
  public playPaperRustle() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.25;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);
  }

  // Twine / string tying chime
  public playStringTie() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Match strike & warm candle flame birth
  public playCandleIgnite() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Friction strike
    const bufferSize = this.ctx.sampleRate * 0.15;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const strike = this.ctx.createBufferSource();
    strike.buffer = noiseBuffer;
    const strikeFilter = this.ctx.createBiquadFilter();
    strikeFilter.type = 'bandpass';
    strikeFilter.frequency.value = 2200;
    const strikeGain = this.ctx.createGain();
    strikeGain.gain.setValueAtTime(0.25, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    strike.connect(strikeFilter);
    strikeFilter.connect(strikeGain);
    strikeGain.connect(this.ctx.destination);
    strike.start(now);

    // 2. Warm musical harmonic chord (Ghibli nostalgic chime)
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C
    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.1 + idx * 0.05);

      g.gain.setValueAtTime(0.001, now + 0.1 + idx * 0.05);
      g.gain.exponentialRampToValueAtTime(0.08, now + 0.2 + idx * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(now + 0.1 + idx * 0.05);
      osc.stop(now + 2.6);
    });

    // 3. Subtle warm flame drone
    this.startFlameDrone();
  }

  private startFlameDrone() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 95;

    filter.type = 'lowpass';
    filter.frequency.value = 250;

    gain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    this.flameNode = gain;
  }

  // Wooden door creak when opening into village
  public playDoorCreak() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.8);
    osc.frequency.linearRampToValueAtTime(95, now + 1.4);

    filter.type = 'lowpass';
    filter.frequency.value = 400;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.6);
  }

  // Distant frog drum pulse with dynamic intensity ("Cắc tùng, cắc tùng")
  public playFrogDrum(intensity: number = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const scaledIntensity = Math.min(2.5, Math.max(0.2, intensity));

    // High wood rim "Cắc"
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(950, now);
    osc1.frequency.exponentialRampToValueAtTime(320, now + 0.05);
    gain1.gain.setValueAtTime(0.08 * scaledIntensity, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.07);

    // Deep skin drum "Tùng"
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(175, now + 0.14);
    osc2.frequency.exponentialRampToValueAtTime(55, now + 0.48);
    gain2.gain.setValueAtTime(0.18 * scaledIntensity, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.65);

    // Subtle resonance ring
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(260, now + 0.16);
    osc3.frequency.exponentialRampToValueAtTime(130, now + 0.4);
    gain3.gain.setValueAtTime(0.06 * scaledIntensity, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc3.connect(gain3);
    gain3.connect(this.ctx.destination);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.5);
  }

  // Children festival chant & cheerful Mid-Autumn melody ("Tùng rinh rinh... rước đèn đón trăng")
  public playChildrenFestivalChant(volume: number = 0.12) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Traditional Pentatonic Mid-Autumn Motif: G4 - A4 - C5 - D5 - E5 - G5
    // "Tùng rinh rinh, tùng tùng tùng rinh rinh"
    const motif = [
      { f: 523.25, time: 0.0, dur: 0.18, type: 'triangle' }, // C5 (Tùng)
      { f: 659.25, time: 0.22, dur: 0.15, type: 'sine' },     // E5 (rinh)
      { f: 783.99, time: 0.40, dur: 0.22, type: 'sine' },     // G5 (rinh)
      { f: 523.25, time: 0.70, dur: 0.16, type: 'triangle' }, // C5 (tùng)
      { f: 587.33, time: 0.90, dur: 0.16, type: 'triangle' }, // D5 (tùng)
      { f: 523.25, time: 1.10, dur: 0.25, type: 'triangle' }, // C5 (tùng)
      { f: 659.25, time: 1.40, dur: 0.18, type: 'sine' },     // E5 (rinh)
      { f: 783.99, time: 1.62, dur: 0.35, type: 'sine' }      // G5 (rinh)
    ];

    motif.forEach(note => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = note.type as OscillatorType;
      osc.frequency.setValueAtTime(note.f, now + note.time);

      filter.type = 'bandpass';
      filter.frequency.value = note.f * 1.5;
      filter.Q.value = 2.0;

      gain.gain.setValueAtTime(0.001, now + note.time);
      gain.gain.exponentialRampToValueAtTime(volume, now + note.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur + 0.05);
    });
  }

  // Soft rural earth footsteps ("Bước chân trên nền đất làng")
  public playFootstep(surface: 'earth' | 'wood' = 'earth') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Earth contact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = surface === 'earth' ? 90 + Math.random() * 20 : 160 + Math.random() * 30;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    // 2. Earth / gravel scuff
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = surface === 'earth' ? 240 : 600;
    filter.Q.value = 1.8;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.025, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Autumn wind gust sweeping through bamboo trees ("Làn gió thu thổi ào qua rặng tre")
  public playWindGust() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 2.2);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(850, now + 0.9);
    filter.frequency.exponentialRampToValueAtTime(260, now + 2.0);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Children cheerful laughter & calls ("Tiếng cười đùa vang vang của lũ trẻ")
  public playChildrenLaughter() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Series of soft joyful pentatonic chirps (E5, G5, A5, C6)
    const pitches = [659.25, 783.99, 880.0, 1046.5, 880.0, 783.99];
    pitches.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f + (Math.random() - 0.5) * 20, now + i * 0.12);
      osc.frequency.exponentialRampToValueAtTime(f * 1.08, now + i * 0.12 + 0.08);

      g.gain.setValueAtTime(0.001, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.035, now + i * 0.12 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.11);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.12);
    });
  }

  // Gentle hand shielding flutter ("Tiếng bàn tay ấp ôm che gió cho nến")
  public playHandShield() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Cozy porch murmurs & soft whispers ("Tiếng cười nói thì thầm ấm cúng bên hiên nhà")
  public playPorchWhispers(volume: number = 0.04) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Harmonic vocal-like formant whispers
    const formants = [260, 420, 680, 850];
    formants.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * (1 + (i % 2 === 0 ? 0.05 : -0.04)), now + 0.8);
      osc.frequency.linearRampToValueAtTime(f, now + 1.6);

      filter.type = 'bandpass';
      filter.frequency.value = f;
      filter.Q.value = 4.0;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.3);
      gain.gain.linearRampToValueAtTime(volume * 0.2, now + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 1.9);
    });
  }

  // Authentic Mid-Autumn Frog Drum Cadence: "Cắc - Tùng - Cắc - Cắc - Tùng"
  public playTraditionalFrogDrumRhythm(volume: number = 0.16) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const baseVol = Math.min(0.4, Math.max(0.02, volume));

    // Rhythm: Cắc (0.0s), Tùng (0.22s), Cắc (0.48s), Cắc (0.66s), Tùng (0.88s)
    const hits = [
      { time: 0.00, type: 'cac', vol: 0.7 },
      { time: 0.22, type: 'tung', vol: 1.0 },
      { time: 0.48, type: 'cac', vol: 0.65 },
      { time: 0.66, type: 'cac', vol: 0.75 },
      { time: 0.88, type: 'tung', vol: 1.2 }
    ];

    hits.forEach(h => {
      const hitTime = now + h.time;
      if (h.type === 'cac') {
        // High rim wood strike
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(980, hitTime);
        osc.frequency.exponentialRampToValueAtTime(320, hitTime + 0.05);
        gain.gain.setValueAtTime(baseVol * h.vol * 0.8, hitTime);
        gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(hitTime);
        osc.stop(hitTime + 0.07);
      } else {
        // Resonant deep drum
        const osc1 = this.ctx!.createOscillator();
        const gain1 = this.ctx!.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(180, hitTime);
        osc1.frequency.exponentialRampToValueAtTime(52, hitTime + 0.5);
        gain1.gain.setValueAtTime(baseVol * h.vol, hitTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.6);

        osc1.connect(gain1);
        gain1.connect(this.ctx!.destination);
        osc1.start(hitTime);
        osc1.stop(hitTime + 0.65);

        // Body wood resonance
        const osc2 = this.ctx!.createOscillator();
        const gain2 = this.ctx!.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(260, hitTime);
        osc2.frequency.exponentialRampToValueAtTime(120, hitTime + 0.35);
        gain2.gain.setValueAtTime(baseVol * h.vol * 0.4, hitTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.4);

        osc2.connect(gain2);
        gain2.connect(this.ctx!.destination);
        osc2.start(hitTime);
        osc2.stop(hitTime + 0.45);
      }
    });
  }

  // Festival crowd cheering & joyful shouts ("Tiếng reo hò rộn rã đêm hội sân đình")
  public playFestivalCheer(volume: number = 0.1) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const vol = Math.min(0.3, Math.max(0.02, volume));

    // Warm pentatonic cheer glissandi
    const cheers = [523.25, 659.25, 783.99, 1046.5];
    cheers.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 30, now + idx * 0.08);
      osc.frequency.linearRampToValueAtTime(freq * 1.15, now + idx * 0.08 + 0.25);

      filter.type = 'bandpass';
      filter.frequency.value = freq * 1.2;
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(vol * 0.5, now + idx * 0.08 + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }

  // 17. Authentic Lion Dance Drum & Cymbal Cadence (Trống hội múa lân & Chũm chọe)
  public playLionDanceRhythm(intensity: number = 1.0, style: 'distant' | 'roll' | 'leap' | 'groove' = 'groove') {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const vol = Math.min(1.5, Math.max(0.1, intensity));

    // Master filter for distance attenuation
    const masterFilter = this.ctx.createBiquadFilter();
    if (style === 'distant') {
      masterFilter.type = 'lowpass';
      masterFilter.frequency.value = 850; // Muffled through walls
    } else {
      masterFilter.type = 'allpass';
    }
    masterFilter.connect(this.ctx.destination);

    // Helper: Play deep bass lion drum ("TÙNG")
    const playBassDrum = (timeOffset: number, drumVol: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(46, now + timeOffset + 0.42);

      gain.gain.setValueAtTime(drumVol * vol, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.55);

      osc.connect(gain);
      gain.connect(masterFilter);
      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.6);
    };

    // Helper: Play sharp high rim stroke ("CẮC")
    const playRimSnap = (timeOffset: number, snapVol: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1250, now + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(380, now + timeOffset + 0.06);

      gain.gain.setValueAtTime(snapVol * vol, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.07);

      osc.connect(gain);
      gain.connect(masterFilter);
      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.08);
    };

    // Helper: Play metallic cymbal clash ("XOÈNG / BENG")
    const playCymbal = (timeOffset: number, cymbalVol: number) => {
      // Noise burst for sizzle
      const bufferSize = Math.floor(this.ctx!.sampleRate * 0.35);
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx!.sampleRate * 0.08));
      }
      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;

      const nFilter = this.ctx!.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.value = 4600;
      nFilter.Q.value = 1.8;

      const nGain = this.ctx!.createGain();
      nGain.gain.setValueAtTime(cymbalVol * vol * 0.35, now + timeOffset);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.35);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(masterFilter);
      noise.start(now + timeOffset);

      // Resonant metallic bell overtones
      [3150, 4850].forEach(f => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + timeOffset);
        g.gain.setValueAtTime(cymbalVol * vol * 0.12, now + timeOffset);
        g.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.4);

        osc.connect(g);
        g.connect(masterFilter);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.42);
      });
    };

    // Style cadences
    if (style === 'distant') {
      // Spaced rhythmic distant thuds
      playBassDrum(0.0, 0.22);
      playRimSnap(0.35, 0.14);
      playBassDrum(0.55, 0.26);
    } else if (style === 'roll') {
      // Rapid drum roll into a cymbal strike
      const rollSteps = [0.0, 0.1, 0.18, 0.25, 0.31, 0.36];
      rollSteps.forEach((t, i) => {
        playBassDrum(t, 0.12 + (i / rollSteps.length) * 0.2);
      });
      playRimSnap(0.44, 0.28);
      playBassDrum(0.55, 0.38);
      playCymbal(0.55, 0.35);
    } else if (style === 'leap') {
      // Grand celebratory leap hit
      playBassDrum(0.0, 0.42);
      playCymbal(0.0, 0.45);
      playRimSnap(0.24, 0.3);
      playBassDrum(0.38, 0.36);
    } else {
      // Standard energetic groove: "TÙNG (0) - CẮC (0.24) - TÙNG (0.42) - TÙNG (0.60) - TÙNG (0.76) - XOÈNG (0.76)"
      playBassDrum(0.0, 0.32);
      playRimSnap(0.22, 0.22);
      playBassDrum(0.40, 0.28);
      playBassDrum(0.58, 0.28);
      playBassDrum(0.74, 0.36);
      playCymbal(0.74, 0.3);
    }
  }

  // 18. Cheering crowd gasping in awe at the lion ("Ồ... Hay quá!")
  public playCrowdCheerOoh(volume: number = 0.25) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const vol = Math.min(1.0, Math.max(0.05, volume));

    // Formant vocal chorus sweep: Aaa -> Ooo
    const formants = [420, 680, 1150];
    formants.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f * 0.85, now + idx * 0.04);
      osc.frequency.linearRampToValueAtTime(f * 1.15, now + idx * 0.04 + 0.25);
      osc.frequency.exponentialRampToValueAtTime(f * 0.8, now + idx * 0.04 + 0.9);

      filter.type = 'bandpass';
      filter.frequency.value = f;
      filter.Q.value = 3.5;

      gain.gain.setValueAtTime(0.001, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(vol * 0.25, now + idx * 0.04 + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.95);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 1.0);
    });
  }

  // 19. Playful mechanical wooden click of lion eyelids blinking
  public playLionHeadBlink() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.025);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // ===========================================================================
  // 20. PHASE 3 ITERATION C: THE MEMORY RISES INTO THE MOONLIGHT
  // Procedural Nostalgic Pentatonic Suite, Distant Drum Fade & High Altitude Wind
  // ===========================================================================
  private ascentWindGain: GainNode | null = null;

  public startMemoryAscentAudio() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // High altitude atmospheric night wind (Gentle bandpass pink/white noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 450;
    windFilter.Q.value = 1.6;

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    windGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 3.0);

    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ctx.destination);
    whiteNoise.start();

    this.ascentWindGain = windGain;
  }

  // Play nostalgic melodic phrase during each stage of the camera ascent
  public playMemoryAscentPhrase(stage: 1 | 2 | 3 | 4) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (stage === 1) {
      // Stage 1: Soft warm chime chord greeting the star lantern
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        g.gain.setValueAtTime(0.001, now + idx * 0.12);
        g.gain.linearRampToValueAtTime(0.08, now + idx * 0.12 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 2.2);

        osc.connect(g);
        g.connect(this.ctx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 2.4);
      });
    } else if (stage === 2) {
      // Stage 2: Gentle Mid-Autumn pentatonic melody drifting over the village
      // "Chiếc đèn ông sao... đêm rằm tháng Tám"
      const melody = [
        { f: 523.25, t: 0.0, d: 0.45 },  // C5
        { f: 587.33, t: 0.4, d: 0.45 },  // D5
        { f: 659.25, t: 0.8, d: 0.65 },  // E5
        { f: 783.99, t: 1.4, d: 0.55 },  // G5
        { f: 880.00, t: 1.9, d: 0.50 },  // A5
        { f: 1046.50, t: 2.4, d: 0.90 }, // C6
        { f: 880.00, t: 3.3, d: 0.60 },  // A5
        { f: 783.99, t: 3.9, d: 1.20 }   // G5
      ];

      melody.forEach(n => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        const f = this.ctx!.createBiquadFilter();

        osc.type = 'triangle'; // Warm wooden flute timbre
        osc.frequency.setValueAtTime(n.f, now + n.t);

        f.type = 'lowpass';
        f.frequency.setValueAtTime(n.f * 2.8, now + n.t);

        g.gain.setValueAtTime(0.001, now + n.t);
        g.gain.linearRampToValueAtTime(0.075, now + n.t + 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

        osc.connect(f);
        f.connect(g);
        g.connect(this.ctx!.destination);

        osc.start(now + n.t);
        osc.stop(now + n.t + n.d + 0.1);
      });
    } else if (stage === 3) {
      // Stage 3: Sparse crystalline celestial bells under the Moon
      const bells = [
        { f: 1046.50, t: 0.0 }, // C6
        { f: 1318.51, t: 0.7 }, // E6
        { f: 1567.98, t: 1.5 }, // G6
        { f: 1174.66, t: 2.4 }, // D6
        { f: 1046.50, t: 3.3 }  // C6
      ];

      bells.forEach(b => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(b.f, now + b.t);

        g.gain.setValueAtTime(0.001, now + b.t);
        g.gain.linearRampToValueAtTime(0.05, now + b.t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + b.t + 2.8);

        osc.connect(g);
        g.connect(this.ctx!.destination);
        osc.start(now + b.t);
        osc.stop(now + b.t + 3.0);
      });
    } else if (stage === 4) {
      // Stage 4: Final timeless sustained harmonic chord fading into the moonlight
      // C major 9th warm pentatonic chord: C4, G4, E5, B5, D6
      const chord = [261.63, 392.00, 659.25, 987.77, 1174.66];
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        g.gain.setValueAtTime(0.001, now + idx * 0.15);
        g.gain.linearRampToValueAtTime(0.055, now + idx * 0.15 + 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 5.5);

        osc.connect(g);
        g.connect(this.ctx!.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 5.8);
      });
    }
  }

  // Adjust wind and ambient sound volume as camera ascends
  public updateAscentWind(volumeFactor: number) {
    if (!this.ascentWindGain || !this.ctx) return;
    const targetVol = Math.min(Math.max(0.02 + volumeFactor * 0.08, 0.01), 0.12);
    this.ascentWindGain.gain.setValueAtTime(targetVol, this.ctx.currentTime);
  }

  // ===========================================================================
  // 21. PHASE 4: MODERN PRESENT ERA AMBIENCE & FESTIVAL MOTIF
  // ===========================================================================
  private modernParkGain: GainNode | null = null;
  private modernDrumInterval: number | null = null;
  private modernFocus = 1;

  public setModernFestivalFocus(focus: number) {
    this.modernFocus = Math.max(0.05, Math.min(1.2, focus));
    if (this.modernParkGain && this.ctx) {
      this.modernParkGain.gain.setTargetAtTime(0.045 * this.modernFocus,
        this.ctx.currentTime, 0.7);
    }
  }

  public startModernAmbientAudio() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.stopModernAmbientAudio();

    // 1. Modern park night air (warm, spacious breeze)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const parkFilter = this.ctx.createBiquadFilter();
    parkFilter.type = 'lowpass';
    parkFilter.frequency.value = 650;

    const parkGain = this.ctx.createGain();
    parkGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    parkGain.gain.linearRampToValueAtTime(0.045, this.ctx.currentTime + 3.0);

    whiteNoise.connect(parkFilter);
    parkFilter.connect(parkGain);
    parkGain.connect(this.ctx.destination);
    whiteNoise.start();

    this.modernParkGain = parkGain;

    // 2. Distant festival lion drum beat occurring every 3.5s
    this.modernDrumInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      this.playDistantModernFestivalDrum();
    }, 3800);
  }

  // Distant modern festival percussion beat
  private playDistantModernFestivalDrum() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.04 * this.modernFocus, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  // Shimmering crystalline chime when lantern modernizes into electric light
  public playLanternModernizeChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22]; // E5, G#5, B5, E6, G#6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      g.gain.setValueAtTime(0.001, now + idx * 0.08);
      g.gain.linearRampToValueAtTime(0.065, now + idx * 0.08 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 2.5);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 2.6);
    });
  }

  // Modern re-orchestrated pentatonic Mid-Autumn festival melody
  public playModernPentatonicMotif() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Motif notes with rich harmonic chords underneath
    const melody = [
      { f: 523.25, t: 0.0, d: 0.45 },  // C5
      { f: 587.33, t: 0.4, d: 0.45 },  // D5
      { f: 659.25, t: 0.8, d: 0.65 },  // E5
      { f: 783.99, t: 1.4, d: 0.55 },  // G5
      { f: 880.00, t: 1.9, d: 0.50 },  // A5
      { f: 1046.50, t: 2.4, d: 0.90 }, // C6
      { f: 880.00, t: 3.3, d: 0.60 },  // A5
      { f: 1046.50, t: 3.9, d: 1.40 }  // C6 (Higher, brighter modern resolution!)
    ];

    melody.forEach(n => {
      // 1. Lead Bell tone
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      g.gain.setValueAtTime(0.001, now + n.t);
      g.gain.linearRampToValueAtTime(0.08, now + n.t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.1);

      // 2. Warm harmonic underlay (Octave below)
      const oscLow = this.ctx!.createOscillator();
      const gLow = this.ctx!.createGain();
      oscLow.type = 'triangle';
      oscLow.frequency.setValueAtTime(n.f * 0.5, now + n.t);

      gLow.gain.setValueAtTime(0.001, now + n.t);
      gLow.gain.linearRampToValueAtTime(0.04, now + n.t + 0.06);
      gLow.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d * 1.2);

      oscLow.connect(gLow);
      gLow.connect(this.ctx!.destination);
      oscLow.start(now + n.t);
      oscLow.stop(now + n.t + n.d + 0.2);
    });
  }

  // Spatial festival celebration audio burst (panned to the side / right flank)
  public playGrandSquarePivotAudio(panValue: number = 0.85) {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const now = this.ctx.currentTime;

    // Create StereoPannerNode for spatial placement
    let panner: StereoPannerNode | null = null;
    try {
      panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(panValue, now);
      panner.connect(this.ctx.destination);
    } catch {
      // Fallback if stereo panner not supported
    }
    const dest = panner || this.ctx.destination;

    // 1. Festive bell / brass chime melody
    const notes = [
      { f: 587.33, t: 0.0, d: 0.35 }, // D5
      { f: 659.25, t: 0.18, d: 0.35 }, // E5
      { f: 783.99, t: 0.38, d: 0.45 }, // G5
      { f: 880.00, t: 0.65, d: 0.35 }, // A5
      { f: 1046.50, t: 0.85, d: 0.70 }, // C6
      { f: 1174.66, t: 1.25, d: 0.95 }  // D6 (Grand flourish)
    ];
    notes.forEach(n => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      g.gain.setValueAtTime(0.001, now + n.t);
      g.gain.linearRampToValueAtTime(0.12, now + n.t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(g);
      g.connect(dest);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.1);
    });

    // 2. Celebratory lion drums echo from the right side
    for (let i = 0; i < 7; i++) {
      const dt = 0.22 * i;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now + dt);
      osc.frequency.exponentialRampToValueAtTime(45, now + dt + 0.12);
      g.gain.setValueAtTime(0.15, now + dt);
      g.gain.exponentialRampToValueAtTime(0.001, now + dt + 0.18);
      osc.connect(g);
      g.connect(dest);
      osc.start(now + dt);
      osc.stop(now + dt + 0.2);
    }
  }

  private vistaAmbienceInterval: number | null = null;
  private vistaMasterGain: GainNode | null = null;
  private vistaPannerNode: StereoPannerNode | null = null;
  private vistaFilterNode: BiquadFilterNode | null = null;
  private currentVistaPan: number = 0.8;
  private currentVistaVolume: number = 0.7;

  public startFestivalVistaAmbience() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.vistaAmbienceInterval !== null) return;

    // Create persistent master gain & panner nodes for smooth dynamic transition
    this.vistaMasterGain = this.ctx.createGain();
    this.vistaMasterGain.gain.setValueAtTime(this.currentVistaVolume, this.ctx.currentTime);
    this.vistaFilterNode = this.ctx.createBiquadFilter();
    this.vistaFilterNode.type = 'lowpass';
    this.vistaFilterNode.frequency.setValueAtTime(12000, this.ctx.currentTime);
    this.vistaMasterGain.connect(this.vistaFilterNode);

    try {
      this.vistaPannerNode = this.ctx.createStereoPanner();
      this.vistaPannerNode.pan.setValueAtTime(this.currentVistaPan, this.ctx.currentTime);
      this.vistaFilterNode.connect(this.vistaPannerNode);
      this.vistaPannerNode.connect(this.ctx.destination);
    } catch {
      this.vistaFilterNode.connect(this.ctx.destination);
    }

    const playRhythmicPulse = () => {
      if (!this.ctx || this.isMuted || !this.vistaMasterGain) return;
      const now = this.ctx.currentTime;
      const dest = this.vistaMasterGain;

      // 1. Celebratory Lion Dance syncopation drums
      const drumTimes = [0.0, 0.18, 0.36, 0.65, 0.85];
      drumTimes.forEach(dt => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now + dt);
        osc.frequency.exponentialRampToValueAtTime(45, now + dt + 0.15);
        g.gain.setValueAtTime(0.18, now + dt);
        g.gain.exponentialRampToValueAtTime(0.001, now + dt + 0.17);
        osc.connect(g);
        g.connect(dest);
        osc.start(now + dt);
        osc.stop(now + dt + 0.19);
      });

      // 2. Playful bell chimes
      const bellFreqs = [783.99, 880.0, 1046.5, 1174.66];
      bellFreqs.forEach((bf, idx) => {
        const bOsc = this.ctx!.createOscillator();
        const bG = this.ctx!.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bf, now + 1.0 + idx * 0.14);
        bG.gain.setValueAtTime(0.001, now + 1.0 + idx * 0.14);
        bG.gain.linearRampToValueAtTime(0.08, now + 1.0 + idx * 0.14 + 0.03);
        bG.gain.exponentialRampToValueAtTime(0.001, now + 1.0 + idx * 0.14 + 0.5);
        bOsc.connect(bG);
        bG.connect(dest);
        bOsc.start(now + 1.0 + idx * 0.14);
        bOsc.stop(now + 1.0 + idx * 0.14 + 0.55);
      });
    };

    playRhythmicPulse();
    this.vistaAmbienceInterval = window.setInterval(playRhythmicPulse, 3800);
  }

  /**
   * Dynamically adjusts stereo pan and volume as the player turns and approaches the festival.
   * pan: 0.8 (right channel) -> 0.0 (centered stereo)
   * volumeFactor: 0.7 -> 1.5 (closer approach)
   */
  public updateFestivalVistaAudio(pan: number, volumeFactor: number) {
    if (!this.ctx) return;
    this.currentVistaPan = pan;
    this.currentVistaVolume = volumeFactor;
    const now = this.ctx.currentTime;

    if (this.vistaPannerNode) {
      this.vistaPannerNode.pan.setTargetAtTime(pan, now, 0.15);
    }
    if (this.vistaMasterGain) {
      this.vistaMasterGain.gain.setTargetAtTime(volumeFactor, now, 0.15);
    }
  }

  public setFestivalVistaMuffle(cutoffHz: number) {
    if (!this.ctx || !this.vistaFilterNode) return;
    this.vistaFilterNode.frequency.setTargetAtTime(
      Math.max(500, Math.min(12000, cutoffHz)), this.ctx.currentTime, 0.6);
  }

  public playPhase6Cue(kind: 'separation' | 'memory' | 'hope' | 'reunion' | 'gate') {
    if (!this.ctx || this.isMuted) return;
    const phrases: Record<typeof kind, number[]> = {
      separation: [440, 392, 330],
      memory: [523.25, 659.25, 587.33],
      hope: [392, 523.25, 659.25],
      reunion: [523.25, 659.25, 783.99, 1046.5],
      gate: [659.25, 783.99, 880, 1174.66]
    };
    const now = this.ctx.currentTime;
    phrases[kind].forEach((frequency, i) => {
      const oscillator = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + i * 0.19);
      const start = now + i * 0.19;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(kind === 'separation' ? 0.017 : 0.026,
        start + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.75);
      oscillator.connect(gain);
      gain.connect(this.ctx!.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.8);
    });
  }

  public playPhase7Cue(kind: 'reveal' | 'intimate' | 'release' | 'moon') {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
    const notes: Record<typeof kind, number[]> = {
      reveal: [293.66, 440, 587.33, 739.99, 880, 1174.66],
      intimate: [293.66, 369.99, 440, 587.33],
      release: [493.88, 587.33, 739.99, 880, 1174.66],
      moon: [587.33, 880, 1174.66]
    };
    const now = this.ctx.currentTime;
    notes[kind].forEach((frequency, index) => {
      const start = now + index * (kind === 'intimate' ? 0.38 : 0.22);
      const oscillator = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      oscillator.type = index % 3 === 0 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(kind === 'release' ? 0.042 :
        kind === 'reveal' ? 0.034 : 0.021, start + 0.11);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 4.1);
      oscillator.connect(gain); gain.connect(this.ctx!.destination);
      oscillator.start(start); oscillator.stop(start + 4.2);
    });
  }

  public playModernFootstep() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public stopFestivalVistaAmbience() {
    if (this.vistaAmbienceInterval !== null) {
      clearInterval(this.vistaAmbienceInterval);
      this.vistaAmbienceInterval = null;
    }
    if (this.vistaMasterGain && this.ctx) {
      this.vistaMasterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      this.vistaMasterGain = null;
    }
    this.vistaPannerNode = null;
    this.vistaFilterNode = null;
  }

  public stopModernAmbientAudio() {
    this.stopFestivalVistaAmbience();
    if (this.modernParkGain && this.ctx) {
      this.modernParkGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
      this.modernParkGain = null;
    }
    if (this.modernDrumInterval !== null) {
      clearInterval(this.modernDrumInterval);
      this.modernDrumInterval = null;
    }
    this.modernFocus = 1;
    this.currentVistaPan = 0.8;
    this.currentVistaVolume = 0.7;
  }

  /**
   * Crisp, authoritative mechanical toggle switch "TÁCH" sound.
   * Multi-stage synthesis:
   * 1. Contact detent transient snap (fast frequency-swept square pulse).
   * 2. Metallic spring resonance body (dual bandpass damped sinusoids).
   * 3. Bakelite/ABS chassis tactile thud (sub-bass lowpass thump).
   */
  public playMechanicalSwitchClick() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    const now = this.ctx.currentTime;

    // 1. Sharp detent trip transient ("TÁCH" snap)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    const snapFilter = this.ctx.createBiquadFilter();

    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(3400, now);
    snapOsc.frequency.exponentialRampToValueAtTime(750, now + 0.016);

    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(3100, now);
    snapFilter.Q.setValueAtTime(4.2, now);

    snapGain.gain.setValueAtTime(0.24, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);

    snapOsc.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.028);

    // 2. Metallic lever spring resonance (Internal steel spring ring)
    const ringFreqs = [2850, 4920];
    ringFreqs.forEach((freq, idx) => {
      const ringOsc = this.ctx!.createOscillator();
      const ringGain = this.ctx!.createGain();
      const ringFilter = this.ctx!.createBiquadFilter();

      ringOsc.type = 'triangle';
      ringOsc.frequency.setValueAtTime(freq, now + 0.002);
      ringOsc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.045);

      ringFilter.type = 'bandpass';
      ringFilter.frequency.value = freq;
      ringFilter.Q.value = 8.0;

      ringGain.gain.setValueAtTime(0.09 / (idx + 1), now + 0.002);
      ringGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.048);

      ringOsc.connect(ringFilter);
      ringFilter.connect(ringGain);
      ringGain.connect(this.ctx!.destination);
      ringOsc.start(now + 0.002);
      ringOsc.stop(now + 0.052);
    });

    // 3. Tactile switch chassis solid thud (Bakelite/plastic body impact)
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();

    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(175, now);
    thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.04);

    thudGain.gain.setValueAtTime(0.16, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    thudOsc.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.05);
  }

  /**
   * Warm wind chime / bronze chime entrance sound when companion enters room.
   * Vietnamese Mid-Autumn pentatonic harmony: D5, F#5, A5, B5, D6
   * Enhanced with non-integer inharmonic overtones (cast bronze physical resonance).
   */
  public playCompanionChime() {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    const now = this.ctx.currentTime;

    const bellNotes = [
      { freq: 587.33, time: 0.00, gain: 0.075 }, // D5
      { freq: 739.99, time: 0.09, gain: 0.070 }, // F#5
      { freq: 880.00, time: 0.19, gain: 0.065 }, // A5
      { freq: 987.77, time: 0.30, gain: 0.060 }, // B5
      { freq: 1174.66, time: 0.42, gain: 0.080 }  // D6 (High radiant chime)
    ];

    bellNotes.forEach(note => {
      const t0 = now + note.time;

      // 1. Fundamental warm sine tone
      const oscFund = this.ctx!.createOscillator();
      const gainFund = this.ctx!.createGain();
      oscFund.type = 'sine';
      oscFund.frequency.setValueAtTime(note.freq, t0);

      gainFund.gain.setValueAtTime(0.0001, t0);
      gainFund.gain.linearRampToValueAtTime(note.gain, t0 + 0.006);
      gainFund.gain.exponentialRampToValueAtTime(0.0005, t0 + 2.2);

      oscFund.connect(gainFund);
      gainFund.connect(this.ctx!.destination);
      oscFund.start(t0);
      oscFund.stop(t0 + 2.25);

      // 2. Inharmonic bronze chime overtone (~2.76x fundamental)
      const oscOvertone = this.ctx!.createOscillator();
      const gainOvertone = this.ctx!.createGain();
      oscOvertone.type = 'triangle';
      oscOvertone.frequency.setValueAtTime(note.freq * 2.76, t0);

      gainOvertone.gain.setValueAtTime(0.0001, t0);
      gainOvertone.gain.linearRampToValueAtTime(note.gain * 0.35, t0 + 0.004);
      gainOvertone.gain.exponentialRampToValueAtTime(0.0002, t0 + 1.4);

      oscOvertone.connect(gainOvertone);
      gainOvertone.connect(this.ctx!.destination);
      oscOvertone.start(t0);
      oscOvertone.stop(t0 + 1.45);
    });
  }

  /**
   * Backward compatibility alias for playCompanionChime
   */
  public playCompanionArrivalChime() {
    this.playCompanionChime();
  }
}

export const audioManager = new AudioManager();
