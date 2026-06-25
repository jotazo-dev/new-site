/**
 * Play a success chime sound using Web Audio API
 * No external files needed - generates sound programmatically
 */
export function playSuccessSound(): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Create two oscillators for a pleasant chord
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // First note (higher - E5)
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(329.63, now + 0.1);
    
    // Second note (lower - C5) - creates a pleasant major third interval
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(523.25, now);
    osc2.frequency.exponentialRampToValueAtTime(261.63, now + 0.1);
    
    // Envelope - quick attack, smooth decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    // Connect
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Play
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
    
    // Cleanup
    setTimeout(() => {
      ctx.close();
    }, 600);
  } catch {
    // Silently fail if audio is not supported
  }
}

/**
 * Play an animated "gift unboxing" chime — ascending arpeggio (C5-E5-G5-C6)
 * with a sparkle layer. Used for celebratory moments like plan upgrades.
 */
/**
 * Pre-warm an AudioContext so playGiftSound starts without delay.
 * Call this once on mount; the returned context is reused.
 */
let prewarmedCtx: AudioContext | null = null;
export function preloadGiftAudio(): void {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!prewarmedCtx) {
      prewarmedCtx = new AudioContextCtor();
    }
    if (prewarmedCtx.state === "suspended") {
      prewarmedCtx.resume();
    }
  } catch {
    // noop
  }
}

export function playGiftSound(): void {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    // Reuse prewarmed context so there's no cold-start delay
    let ctx = prewarmedCtx;
    if (!ctx) {
      ctx = new AudioContextCtor();
      prewarmedCtx = ctx;
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);

    // Ascending arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const stepDur = 0.11;

    notes.forEach((freq, i) => {
      const start = now + i * stepDur;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.9, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.25);

      // Sparkle harmonic (octave up, sine, lower volume)
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.type = "sine";
      sparkle.frequency.setValueAtTime(freq * 2, start);
      sparkleGain.gain.setValueAtTime(0, start);
      sparkleGain.gain.linearRampToValueAtTime(0.35, start + 0.008);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      sparkle.connect(sparkleGain);
      sparkleGain.connect(master);
      sparkle.start(start);
      sparkle.stop(start + 0.2);
    });

    // Final shimmer chord (C6 + E6) after the arpeggio
    const shimmerStart = now + notes.length * stepDur;
    [1046.5, 1318.51].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, shimmerStart);
      gain.gain.setValueAtTime(0, shimmerStart);
      gain.gain.linearRampToValueAtTime(0.5, shimmerStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, shimmerStart + 0.6);
      osc.connect(gain);
      gain.connect(master);
      osc.start(shimmerStart);
      osc.stop(shimmerStart + 0.7);
    });
  } catch {
    // Silently fail
  }
}

/**
 * Play a "combo unlocked" celebratory fanfare — bright major chord stab,
 * ascending sparkle arpeggio and high shimmer to match confetti bursts.
 * Used when a Chip 5G combo is completed (different timbre from playGiftSound,
 * which is used for fiber plan upgrades).
 */
export function playComboSound(): void {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    let ctx = prewarmedCtx;
    if (!ctx) {
      ctx = new AudioContextCtor();
      prewarmedCtx = ctx;
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(ctx.destination);

    // 1) Bright major chord stab (C5 + E5 + G5 + C6) — the "POP" with the confetti
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.32, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.6);
    });

    // 2) Quick ascending sparkle arpeggio (G5, C6, E6, G6) — the "shimmer rise"
    const sparkle = [783.99, 1046.5, 1318.51, 1567.98];
    const stepDur = 0.06;
    sparkle.forEach((freq, i) => {
      const start = now + 0.08 + i * stepDur;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.28, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.2);
    });

    // 3) High shimmer tail (C7) — extends the celebration with confetti
    const tailStart = now + 0.35;
    const tail = ctx.createOscillator();
    const tailGain = ctx.createGain();
    tail.type = "sine";
    tail.frequency.setValueAtTime(2093.0, tailStart);
    tailGain.gain.setValueAtTime(0, tailStart);
    tailGain.gain.linearRampToValueAtTime(0.18, tailStart + 0.02);
    tailGain.gain.exponentialRampToValueAtTime(0.001, tailStart + 0.7);
    tail.connect(tailGain);
    tailGain.connect(master);
    tail.start(tailStart);
    tail.stop(tailStart + 0.75);
  } catch {
    // Silently fail
  }
}
