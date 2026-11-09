/**
 * CS:GO Lunch Case Opener - Web Audio API Sound Synthesizer
 * Generates realistic case opening clicks, whooshes, and victory fanfares.
 */

class CSGOAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('csgo_sound_muted') === 'true';
    this.masterGain = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0.0 : 0.8;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  ensureContextActive() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('csgo_sound_muted', this.muted);
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0.0 : 0.8, this.ctx.currentTime);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Mechanical Tick Sound: Plays when an item card passes the needle.
   * Sharp attack, highpass filtered click.
   */
  playTick() {
    if (this.muted || !this.ctx) return;
    this.ensureContextActive();

    const now = this.ctx.currentTime;

    // Short crisp oscillator pulse
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  /**
   * Sound played when the "Open Container" button is clicked.
   */
  playRollStart() {
    if (this.muted || !this.ctx) return;
    this.ensureContextActive();

    const now = this.ctx.currentTime;
    
    // Latch click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Victory Reveal Fanfare based on item rarity
   */
  playWinReveal(rarity) {
    if (this.muted || !this.ctx) return;
    this.ensureContextActive();

    const now = this.ctx.currentTime;

    if (rarity === 'gold') {
      // Legendary Gold Knife fanfare: Rich celebratory major chord progression
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.setValueAtTime(0.25, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.09);
        osc.stop(now + 2.5);
      });
    } else if (rarity === 'covert') {
      // Covert (Red): Energetic victory trumpet flourish
      const notes = [349.23, 440.0, 523.25, 698.46]; // F Major
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.setValueAtTime(0.18, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.1);
        osc.stop(now + 1.9);
      });
    } else if (rarity === 'classified') {
      // Classified (Pink): Bright chime arpeggio
      const notes = [440.0, 554.37, 659.25, 880.0]; // A Major
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.08);
        osc.stop(now + 1.3);
      });
    } else {
      // Mil-Spec or Restricted: Clean friendly chime
      const notes = [523.25, 659.25, 783.99]; // C Major
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.18, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.1);
        osc.stop(now + 0.9);
      });
    }
  }
}

// Global instance
window.csgoAudio = new CSGOAudioEngine();
