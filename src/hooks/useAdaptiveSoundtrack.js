/**
 * Хук управления адаптивным саундтреком читалки.
 * Звук всегда стартует только по явному клику — браузеры не дают
 * запускать AudioContext автоматически.
 */
import { useEffect, useRef, useState } from 'react';
import { SoundtrackEngine } from '../audio/SoundtrackEngine.js';

const VOLUME_KEY = 'hyperborea:sound-volume';
const DEFAULT_VOLUME = 0.42;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const readVolume = () => {
  if (typeof window === 'undefined') return DEFAULT_VOLUME;
  try {
    const stored = window.localStorage.getItem(VOLUME_KEY);
    if (stored == null || stored === '') return DEFAULT_VOLUME;
    const raw = Number(stored);
    return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
};

const saveVolume = (value) => {
  try {
    window.localStorage.setItem(VOLUME_KEY, String(value));
  } catch {
    /* ignore quota/private mode */
  }
};

export function useAdaptiveSoundtrack(cue) {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolumeState] = useState(readVolume);
  const [mode, setMode] = useState('procedural');
  const [status, setStatus] = useState('idle');
  const engineRef = useRef(null);
  const enabledRef = useRef(false);
  const volumeRef = useRef(volume);
  const cueRef = useRef(cue);

  volumeRef.current = volume;
  cueRef.current = cue;

  const supported = typeof window !== 'undefined'
    && Boolean(window.AudioContext || window.webkitAudioContext);

  const ensureEngine = () => {
    if (engineRef.current) return engineRef.current;
    const engine = new SoundtrackEngine({
      volume: volumeRef.current,
      onModeChange: setMode,
      onStatus: setStatus,
    });
    engineRef.current = engine;
    if (import.meta.env.DEV) {
      window.__hbSoundtrackDebug = () => engine.getDebugState();
    }
    return engine;
  };

  const toggle = () => {
    if (!supported) return;
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);

    if (!next) {
      engineRef.current?.stop();
      return;
    }

    const engine = ensureEngine();
    // resume() вызывается синхронно из обработчика клика — это важно для Safari/iOS.
    engine.unlock();
    engine.setVolume(volumeRef.current);
    engine.start(cueRef.current).catch(() => {
      engine.stop();
      enabledRef.current = false;
      setEnabled(false);
      setStatus('error');
    });
  };

  const setVolume = (value) => {
    const next = clamp(Number(value) || 0, 0, 1);
    volumeRef.current = next;
    setVolumeState(next);
    saveVolume(next);
    engineRef.current?.setVolume(next);
  };

  useEffect(() => {
    if (!enabledRef.current) return;
    engineRef.current?.setCue(cue);
  }, [cue]);

  useEffect(() => () => {
    engineRef.current?.dispose();
    engineRef.current = null;
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      delete window.__hbSoundtrackDebug;
    }
  }, []);

  return {
    supported,
    enabled,
    volume,
    mode,
    status,
    toggle,
    setVolume,
  };
}
