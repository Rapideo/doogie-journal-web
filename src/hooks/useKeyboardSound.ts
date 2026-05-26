import { useCallback, useRef } from 'react';

// Click sound WAV files
const clickSounds = ['/click01.wav', '/Click02.wav', '/Click03.wav'];

// Web Audio API-based keyboard click sounds
export function useKeyboardSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastClickTime = useRef<number>(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playKeyClick = useCallback(() => {
    // Throttle clicks to prevent audio overload
    const now = Date.now();
    if (now - lastClickTime.current < 30) return;
    lastClickTime.current = now;

    try {
      // Randomly select one of the three click sounds
      const randomIndex = Math.floor(Math.random() * clickSounds.length);
      const audio = new Audio(clickSounds[randomIndex]);
      audio.volume = 0.5;
      audio.play().catch(e => {
        console.warn('Could not play click sound:', e);
      });
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, []);

  const playEnterKey = useCallback(() => {
    try {
      // Randomly select one of the three click sounds
      const randomIndex = Math.floor(Math.random() * clickSounds.length);
      const audio = new Audio(clickSounds[randomIndex]);
      audio.volume = 0.5;
      audio.play().catch(e => {
        console.warn('Could not play click sound:', e);
      });
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, []);

  const playBeep = useCallback(() => {
    try {
      const ctx = getAudioContext();

      // Classic DOS beep
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, [getAudioContext]);

  const playTheme = useCallback(() => {
    try {
      // Play the intro WAV file
      const audio = new Audio('/DoogieIntro.wav');
      audio.volume = 0.7;
      audio.play().catch(e => {
        console.warn('Could not play intro audio:', e);
      });
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }, []);

  return { playKeyClick, playEnterKey, playBeep, playTheme };
}
