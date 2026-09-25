import fs from 'fs';

let content = fs.readFileSync('src/audio/AudioManager.ts', 'utf8');

const updatedAudioMethods = `  // Distant frog drum pulse with dynamic intensity ("Cắc tùng, cắc tùng")
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
}
`;

// Replace playFrogDrum and ending of class
const target = content.slice(content.indexOf('  // Distant frog drum pulse ("Cắc tùng")'));
content = content.replace(target, updatedAudioMethods + '\nexport const audioManager = new AudioManager();\n');
fs.writeFileSync('src/audio/AudioManager.ts', content, 'utf8');
console.log('Successfully updated AudioManager.ts with children festival chant and dynamic frog drum!');
