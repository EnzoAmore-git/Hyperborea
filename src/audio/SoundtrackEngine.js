/**
 * Адаптивный саундтрек читалки.
 *
 * Два режима:
 * 1) procedural — встроенная генеративная тема на Web Audio API (работает сразу,
 *    без аудиофайлов);
 * 2) assets — заранее подготовленные музыкальные лупы/стемы из
 *    /audio/soundtrack/manifest.json (см. docs/soundtrack.md).
 *
 * Наружу движок отдаёт только setCue/start/stop/setVolume. Все переходы
 * плавные, громкость и видимость вкладки учитываются.
 */
import { MOODS, MUSIC_STATES } from '../data/soundtrack.js';

const MASTER_LEVEL = 0.8;
const DEFAULT_VOLUME = 0.42;
const MANIFEST_URL = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/audio/soundtrack/manifest.json`;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toAssetUrl = (src) => {
  if (/^(https?:|data:)/i.test(src)) return src;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${base}/${String(src).replace(/^\/+/, '')}`;
};

const createImpulse = (ctx, seconds = 3.4, decay = 2.6) => {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const envelope = Math.pow(1 - i / length, decay);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
  }
  return buffer;
};

const createNoiseBuffer = (ctx, seconds = 2) => {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    // Мягкий «розовый» шум: меньше резких высоких частот, чем у белого.
    const white = Math.random() * 2 - 1;
    last = last * 0.94 + white * 0.06;
    data[i] = Math.max(-1, Math.min(1, last * 2.6));
  }
  return buffer;
};

class ProceduralVoice {
  constructor(engine, mood, intensity) {
    this.engine = engine;
    this.ctx = engine.ctx;
    this.config = MOODS[mood] ?? MOODS.mystery;
    this.intensity = clamp(intensity, 0, 1);
    this.nodes = [];
    this.stopped = false;

    const now = this.ctx.currentTime;
    this.output = this.ctx.createGain();
    this.output.gain.setValueAtTime(0.0001, now);
    this.output.gain.linearRampToValueAtTime(1, now + 4);

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(this.config.filter, now);
    this.filter.Q.setValueAtTime(0.75, now);

    this.droneBus = this.ctx.createGain();
    this.padBus = this.ctx.createGain();
    this.noiseGain = this.ctx.createGain();

    this.droneBus.connect(this.filter);
    this.padBus.connect(this.filter);
    this.noiseGain.connect(this.filter);
    this.filter.connect(this.output);
    this.output.connect(engine.ambientBus);
    this.nodes.push(this.output, this.filter, this.droneBus, this.padBus, this.noiseGain);

    this.droneBus.gain.setValueAtTime(0.0001, now);
    this.padBus.gain.setValueAtTime(0.0001, now);
    this.noiseGain.gain.setValueAtTime(0.0001, now);

    this.buildDrone();
    this.buildPad();
    this.buildNoise();
    this.buildLfo();
    this.setIntensity(this.intensity, 0.05);
  }

  buildDrone() {
    const { root, chord } = this.config;
    const now = this.ctx.currentTime;
    const frequencies = [
      root,
      root * Math.pow(2, chord[1] / 12),
      root * 2,
    ];

    frequencies.forEach((frequency, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = index === 2 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(frequency, now);
      osc.detune.setValueAtTime(index === 0 ? -5 : 4 + index * 2, now);
      gain.gain.setValueAtTime(index === 0 ? 0.55 : 0.28, now);
      osc.connect(gain);
      gain.connect(this.droneBus);
      osc.start(now);
      this.nodes.push(osc, gain);
    });

    // Совсем низкая подложка — ощущение объёма/подземелья.
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(root / 2, now);
    subGain.gain.setValueAtTime(0.32, now);
    sub.connect(subGain);
    subGain.connect(this.droneBus);
    sub.start(now);
    this.nodes.push(sub, subGain);
  }

  buildPad() {
    const { root, chord } = this.config;
    const now = this.ctx.currentTime;

    chord.forEach((semitone, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = typeof this.ctx.createStereoPanner === 'function'
        ? this.ctx.createStereoPanner()
        : null;
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(
        root * 2 * Math.pow(2, semitone / 12),
        now,
      );
      osc.detune.setValueAtTime(index % 2 === 0 ? -3 : 3, now);
      gain.gain.setValueAtTime(0.5, now);
      osc.connect(gain);
      if (panner) {
        panner.pan.setValueAtTime((index - 1.5) * 0.16, now);
        gain.connect(panner);
        panner.connect(this.padBus);
        this.nodes.push(osc, gain, panner);
      } else {
        gain.connect(this.padBus);
        this.nodes.push(osc, gain);
      }
      osc.start(now);
    });
  }

  buildNoise() {
    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    source.buffer = this.engine.noiseBuffer;
    source.loop = true;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420 + this.config.filter * 0.12, now);
    filter.Q.setValueAtTime(0.55, now);
    source.connect(filter);
    filter.connect(this.noiseGain);
    source.start(now);
    this.nodes.push(source, filter);
  }

  buildLfo() {
    const now = this.ctx.currentTime;
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.045, now);
    lfoGain.gain.setValueAtTime(this.config.filter * 0.22, now);
    lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    lfo.start(now);
    this.nodes.push(lfo, lfoGain);
  }

  setIntensity(value, timeConstant = 1.8) {
    this.intensity = clamp(value, 0, 1);
    const now = this.ctx.currentTime;
    const factor = 0.55 + this.intensity * 0.45;
    const { drone, pad, noise, filter } = this.config;
    this.droneBus.gain.setTargetAtTime(drone * factor, now, timeConstant);
    this.padBus.gain.setTargetAtTime(pad * factor, now, timeConstant);
    this.noiseGain.gain.setTargetAtTime(noise * factor, now, timeConstant);
    this.filter.frequency.setTargetAtTime(
      filter * (0.72 + this.intensity * 0.62),
      now,
      timeConstant,
    );
  }

  fadeOut(duration = 5) {
    if (this.stopped) return;
    this.stopped = true;
    const now = this.ctx.currentTime;
    const end = now + duration;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(Math.max(0.0001, this.output.gain.value), now);
    this.output.gain.exponentialRampToValueAtTime(0.0001, end);
    this.nodes.forEach((node) => {
      if (typeof node.stop === 'function') {
        try {
          node.stop(end + 0.1);
        } catch {
          /* already stopped */
        }
      }
    });
    setTimeout(() => {
      this.nodes.forEach((node) => {
        try {
          node.disconnect();
        } catch {
          /* ignore */
        }
      });
    }, (duration + 0.4) * 1000);
  }
}

const equalPowerCurve = (incoming, start = incoming ? 0 : 1) => {
  const curve = new Float32Array(257);
  for (let i = 0; i < curve.length; i += 1) {
    const t = i / (curve.length - 1);
    curve[i] = incoming
      ? Math.sin(t * Math.PI / 2)
      : start * Math.cos(t * Math.PI / 2);
  }
  return curve;
};

class AssetVoice {
  constructor(engine, data, intensity, mood) {
    this.engine = engine;
    this.ctx = engine.ctx;
    this.data = data;
    this.mood = mood;
    this.sources = [];
    this.layers = [];
    this.stopped = false;
    const now = this.ctx.currentTime;
    const start = now + 0.05;
    this.output = this.ctx.createGain();
    this.output.gain.setValueAtTime(0, now);
    this.output.gain.setValueCurveAtTime(equalPowerCurve(true), start, 8);
    this.output.connect(engine.assetBus);
    data.buffers.forEach((buffer, index) => {
      const config = data.config.layers[index] ?? {};
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      const loop = Math.min(Number(data.config.loopSeconds) || buffer.duration, buffer.duration);
      const offset = ((start - engine.transportEpoch) % loop + loop) % loop;
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = loop;
      source.connect(gain);
      gain.connect(this.output);
      source.start(start, offset);
      this.sources.push(source);
      this.layers.push({ gain, config });
    });
    this.setIntensity(intensity, 0.01);
  }

  setIntensity(value, timeConstant = 4) {
    this.intensity = clamp(value, 0, 1);
    const now = this.ctx.currentTime;
    this.layers.forEach(({ gain, config }) => {
      // No threshold means an always-on bed. Thresholded stems can reach silence.
      const from = Number(config.from ?? 0);
      const to = Number(config.to ?? 1);
      let threshold = config.from == null && config.to == null ? 1
        : to > from ? clamp((this.intensity - from) / (to - from), 0, 1)
          : Number(this.intensity >= from);
      threshold = threshold * threshold * (3 - 2 * threshold);
      const floor = clamp(Number(config.floor ?? 0), 0, 1);
      const level = Number(config.gain ?? 1) * (floor + (1 - floor) * threshold);
      gain.gain.setTargetAtTime(level, now, timeConstant);
    });
  }

  fadeOut(duration = 8) {
    if (this.stopped) return;
    this.stopped = true;
    const now = this.ctx.currentTime;
    const held = this.output.gain.value;
    if (this.output.gain.cancelAndHoldAtTime) this.output.gain.cancelAndHoldAtTime(now);
    else this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueCurveAtTime(equalPowerCurve(false, held), now + 0.05, duration);
    this.sources.forEach((source) => { try { source.stop(now + duration + 0.15); } catch { /* stopped */ } });
    this.cleanupTimer = setTimeout(() => {
      this.sources.forEach((source) => source.disconnect());
      this.layers.forEach(({ gain }) => gain.disconnect());
      this.output.disconnect();
    }, (duration + 0.4) * 1000);
  }
}

export class SoundtrackEngine {
  constructor({ volume = DEFAULT_VOLUME, onModeChange, onStatus } = {}) {
    const initialVolume = Number(volume);
    this.volume = clamp(
      Number.isFinite(initialVolume) ? initialVolume : DEFAULT_VOLUME,
      0,
      1,
    );
    this.onModeChange = onModeChange;
    this.onStatus = onStatus;
    this.ctx = null;
    this.master = null;
    this.enabled = false;
    this.mode = 'procedural';
    this.cue = null;
    this.procVoice = null;
    this.assetVoice = null;
    this.noiseBuffer = null;
    this.assetMode = false;
    this.manifest = null;
    this.manifestLoaded = false;
    this.assetCache = new Map();
    this.assetToken = 0;
    this.session = 0;
    this.scheduler = null;
    this.nextEventTime = 0;
    this.eventCount = 0;
    this.suspendTimer = null;
    this.onVisibility = null;
    this.visibilityBound = false;
    this.transportEpoch = null;
    this.activeMood = null;
    this.lastMoodChange = -Infinity;
    this.cueTimer = null;
  }

  ensureContext() {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      this.onStatus?.('unsupported');
      return null;
    }
    this.ctx = new Ctor({ latencyHint: 'interactive' });
    this.buildGraph();
    this.bindVisibility();
    return this.ctx;
  }

  buildGraph() {
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 22;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.01;
    this.compressor.release.value = 0.3;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;

    this.master.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    this.dry = ctx.createGain();
    this.dry.gain.value = 0.9;
    this.dry.connect(this.master);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = createImpulse(ctx);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.32;
    this.reverb.connect(this.wet);
    this.wet.connect(this.master);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = 0.9;
    this.ambientBus.connect(this.dry);
    this.ambientBus.connect(this.reverb);

    this.fxBus = ctx.createGain();
    this.fxBus.gain.value = 0.8;
    this.fxBus.connect(this.dry);
    this.fxBus.connect(this.reverb);

    this.assetBus = ctx.createGain();
    this.assetBus.gain.value = 1;
    this.assetBus.connect(this.master);

    this.noiseBuffer = createNoiseBuffer(ctx);
  }

  bindVisibility() {
    if (this.visibilityBound || typeof document === 'undefined') return;
    this.visibilityBound = true;
    this.onVisibility = () => {
      if (!this.enabled || !this.ctx) return;
      if (document.hidden) {
        this.ctx.suspend().catch(() => {});
      } else {
        this.ctx.resume()
          .then(() => {
            this.nextEventTime = this.ctx.currentTime + 0.1;
          })
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  fadeMaster(target, duration = 1.2) {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    const level = Math.max(0.0001, target);
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), now);
    this.master.gain.exponentialRampToValueAtTime(level, now + duration);
  }

  async start(cue) {
    if (cue) this.cue = cue;
    this.enabled = true;
    this.onStatus?.('starting');
    const session = ++this.session;
    const ctx = this.unlock();
    if (!ctx) return;
    try {
      await ctx.resume();
    } catch {
      /* браузер может отложить запуск до жеста */
    }
    if (session !== this.session || !this.enabled) return;
    if (this.suspendTimer) {
      clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    this.transportEpoch ??= ctx.currentTime;
    this.fadeMaster(this.volume * MASTER_LEVEL, 1.4);
    await this.loadManifest();
    if (session !== this.session || !this.enabled) return;

    if (this.manifest) {
      this.mode = 'assets';
      this.onModeChange?.('assets');
      this.onStatus?.('loading');
      await this.playAsset(this.cue, session);
    } else {
      this.mode = 'procedural';
      this.onModeChange?.('procedural');
      this.startProcedural(this.cue);
    }
    if (session !== this.session || !this.enabled) return;
    if (this.mode === 'procedural') this.startScheduler();
    else this.stopScheduler();
    this.onStatus?.('ready');
  }

  stop() {
    this.enabled = false;
    clearTimeout(this.cueTimer);
    this.cueTimer = null;
    this.assetToken += 1;
    this.activeMood = null;
    this.session += 1;
    this.stopScheduler();
    if (this.procVoice) {
      this.procVoice.fadeOut(1.8);
      this.procVoice = null;
    }
    if (this.assetVoice) {
      this.assetVoice.fadeOut(1.8);
      this.assetVoice = null;
    }
    this.fadeMaster(0.0001, 1.2);
    this.onStatus?.('idle');
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    this.suspendTimer = setTimeout(() => {
      if (!this.enabled && this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    }, 1700);
  }

  setCue(cue) {
    if (!cue) return;
    const previous = this.cue;
    this.cue = cue;
    if (!this.enabled || !this.ctx) return;
    this.prefetchNext(cue);
    // A pending transition to an old scene must not win a later fetch race.
    if (previous?.mood !== cue.mood) this.assetToken += 1;
    clearTimeout(this.cueTimer);
    this.cueTimer = null;
    if (this.activeMood === cue.mood) {
      this.procVoice?.setIntensity(cue.intensity);
      this.assetVoice?.setIntensity(cue.intensity);
      return;
    }
    const hold = cue.urgent ? 0 : Math.max(0, 20 - (this.ctx.currentTime - this.lastMoodChange));
    // 1.4 seconds of stability rejects scroll jitter. Only the latest cue is applied.
    this.cueTimer = setTimeout(() => {
      this.cueTimer = null;
      if (!this.enabled) return;
      if (this.mode === 'assets') this.playAsset(this.cue);
      else this.switchProcedural(this.cue);
    }, Math.max(1400, hold * 1000));
  }

  prefetchNext(cue) {
    if (!this.manifest || !cue?.nextMood || navigator.connection?.saveData) return;
    this.loadAssetState(cue.nextMood).catch(() => {});
  }

  setVolume(value) {
    this.volume = clamp(Number(value) || 0, 0, 1);
    if (this.enabled) this.fadeMaster(this.volume * MASTER_LEVEL, 0.25);
  }

  async loadManifest() {
    if (this.manifestLoaded) return this.manifest;
    this.manifestLoaded = true;
    try {
      const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`manifest ${response.status}`);
      const data = await response.json();
      const states = data?.states;
      const complete = MUSIC_STATES.every((mood) => {
        const layers = states?.[mood]?.layers;
        return Array.isArray(layers)
          && layers.length > 0
          && layers.every((layer) => layer && typeof layer.src === 'string' && layer.src.length > 0);
      });
      if (!complete) {
        this.manifest = null;
        this.assetMode = false;
        return null;
      }
      this.manifest = states;
      this.assetMode = true;
      return states;
    } catch {
      // Пустой/отсутствующий манифест — это нормальный путь: играем встроенную тему.
      this.manifest = null;
      this.assetMode = false;
      return null;
    }
  }

  async loadAssetState(mood) {
    if (!this.manifest) throw new Error('manifest is empty');
    if (this.assetCache.has(mood)) return this.assetCache.get(mood);
    const config = this.manifest[mood];
    const promise = (async () => {
      const buffers = await Promise.all(
        config.layers.map(async (layer) => {
          const response = await fetch(toAssetUrl(layer.src));
          if (!response.ok) throw new Error(`audio ${layer.src}: ${response.status}`);
          const raw = await response.arrayBuffer();
          return this.ctx.decodeAudioData(raw);
        }),
      );
      return { config, buffers };
    })();
    this.assetCache.set(mood, promise);
    while (this.assetCache.size > 3) {
      const key = [...this.assetCache.keys()].find((key) => key !== mood
        && key !== this.activeMood && key !== this.cue?.nextMood);
      if (!key) break;
      this.assetCache.delete(key);
    }
    try {
      return await promise;
    } catch (error) {
      this.assetCache.delete(mood);
      throw error;
    }
  }

  async playAsset(cue, session = this.session) {
    if (!cue || !this.enabled || !this.manifest) return;
    const token = ++this.assetToken;
    const targetMood = cue.mood;
    try {
      const data = await this.loadAssetState(targetMood);
      if (token !== this.assetToken || session !== this.session || !this.enabled) return;
      if (this.cue?.mood !== targetMood) return;
      const old = this.assetVoice;
      this.assetVoice = new AssetVoice(
        this,
        data,
        this.cue?.intensity ?? cue.intensity,
        targetMood,
      );
      this.activeMood = targetMood;
      this.lastMoodChange = this.ctx.currentTime;
      this.prefetchNext(this.cue);
      if (old) old.fadeOut(8);
      if (this.procVoice) {
        this.procVoice.fadeOut(6);
        this.procVoice = null;
      }
      this.mode = 'assets';
      this.onModeChange?.('assets');
      this.onStatus?.('ready');
    } catch (error) {
      if (token !== this.assetToken || session !== this.session || !this.enabled) return;
      if (this.assetVoice) {
        this.assetVoice.fadeOut(8);
        this.assetVoice = null;
      }
      // Если файл не загрузился/не декодировался, не оставляем читателя в тишине.
      console.warn('[soundtrack] assets unavailable, using procedural score', error);
      this.manifest = null;
      this.assetMode = false;
      this.mode = 'procedural';
      this.onModeChange?.('procedural');
      this.startProcedural(this.cue || cue);
      this.startScheduler();
    }
  }

  startProcedural(cue) {
    if (!this.ctx || !cue) return;
    this.activeMood = cue.mood;
    this.lastMoodChange = this.ctx.currentTime;
    if (this.procVoice) {
      this.procVoice.fadeOut(5);
      this.procVoice = null;
    }
    this.mode = 'procedural';
    this.procVoice = new ProceduralVoice(this, cue.mood, cue.intensity);
    this.eventCount = 0;
    this.nextEventTime = this.ctx.currentTime + 0.1;
  }

  switchProcedural(cue) {
    if (!this.ctx || !cue) return;
    this.activeMood = cue.mood;
    this.lastMoodChange = this.ctx.currentTime;
    const old = this.procVoice;
    this.procVoice = new ProceduralVoice(this, cue.mood, cue.intensity);
    if (old) old.fadeOut(5);
    if (this.assetVoice) {
      this.assetVoice.fadeOut(5);
      this.assetVoice = null;
    }
    this.mode = 'procedural';
    this.eventCount = 0;
    this.nextEventTime = this.ctx.currentTime + 0.1;
  }

  startScheduler() {
    if (this.scheduler || !this.ctx || !this.enabled || this.mode !== 'procedural') return;
    this.nextEventTime = this.ctx.currentTime + 0.1;
    this.scheduler = setInterval(() => this.scheduleAhead(), 120);
  }

  stopScheduler() {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  scheduleAhead() {
    if (!this.enabled || this.mode !== 'procedural' || !this.procVoice || !this.ctx) return;
    if (this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (this.nextEventTime < now) this.nextEventTime = now + 0.06;
    while (this.nextEventTime < now + 0.3) {
      this.scheduleStep(this.nextEventTime);
      this.nextEventTime += this.stepDuration();
    }
  }

  stepDuration() {
    const mood = this.cue?.mood ?? 'mystery';
    switch (mood) {
      case 'battle': return 0.5;
      case 'tension': return 1.15;
      case 'horror': return 1.7 + Math.random() * 0.5;
      case 'mystery': return 2.4;
      case 'calm': return 5.2 + Math.random() * 1.6;
      case 'sacred': return 4.2 + Math.random() * 1.5;
      case 'sorrow': return 6.8 + Math.random() * 2.2;
      default: return 3;
    }
  }

  scheduleStep(time) {
    const cue = this.cue;
    if (!cue) return;
    const { mood, intensity } = cue;
    const power = 0.45 + intensity * 0.8;
    const step = this.eventCount;
    this.eventCount += 1;

    switch (mood) {
      case 'battle': {
        this.kick(time, 0.55 + intensity * 0.45);
        if (step % 4 === 1 || step % 4 === 3) this.snare(time, 0.5 + intensity * 0.35);
        this.tick(time + 0.25, 0.45 + intensity * 0.2);
        if (step % 8 === 6) this.lowTom(time, 0.5);
        if (step % 4 === 2) this.tick(time + 0.12, 0.3);
        break;
      }
      case 'tension': {
        this.kick(time, 0.42 * power, 75);
        this.kick(time + 0.18, 0.27 * power, 62);
        if (step % 3 === 0) this.tick(time + 0.55, 0.3);
        break;
      }
      case 'mystery': {
        this.lowPulse(time, 0.35 + intensity * 0.3);
        if (step % 3 === 0) this.bell(time + 0.15, this.pickBellFrequency(), 0.55);
        break;
      }
      case 'horror': {
        this.lowPulse(time, 0.45 + intensity * 0.3);
        if (step % 2 === 0) this.noiseSwell(time, 0.4 + intensity * 0.25);
        if (step % 4 === 1) this.bell(time + 0.3, this.pickBellFrequency(1), 0.35);
        break;
      }
      case 'sacred': {
        this.bell(time, this.pickBellFrequency(), 0.85);
        this.bell(time + 0.28, this.pickBellFrequency(1), 0.35);
        break;
      }
      case 'sorrow': {
        this.bell(time, this.pickBellFrequency(-1), 0.75);
        break;
      }
      case 'calm':
      default: {
        this.bell(time, this.pickBellFrequency(), 0.7);
        break;
      }
    }
  }

  pickBellFrequency(octaveShift = 0) {
    const config = MOODS[this.cue?.mood] ?? MOODS.calm;
    const scale = config.scale;
    const semitone = scale[Math.floor(Math.random() * scale.length)];
    return config.root * 8 * Math.pow(2, (semitone + octaveShift * 12) / 12);
  }

  connectOneShot(node, gainNode, startTime, stopTime) {
    node.connect(gainNode);
    gainNode.connect(this.fxBus);
    const clean = () => {
      try {
        node.disconnect();
        gainNode.disconnect();
      } catch {
        /* ignore */
      }
    };
    node.start(startTime);
    node.stop(stopTime);
    node.onended = clean;
  }

  kick(time, level = 0.5, startFrequency = 92) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFrequency, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.32);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.55 * level), time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.52);
    this.connectOneShot(osc, gain, time, time + 0.56);
  }

  snare(time, level = 0.5) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1900, time);
    filter.Q.setValueAtTime(0.8, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.32 * level), time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxBus);
    source.start(time, Math.random() * 1.2, 0.25);
    source.onended = () => {
      try {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
  }

  tick(time, level = 0.3) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5200, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.09 * level), time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxBus);
    source.start(time, Math.random() * 0.8, 0.12);
    source.onended = () => {
      try {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
  }

  lowTom(time, level = 0.5) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(96, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.45);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.22 * level), time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.7);
    this.connectOneShot(osc, gain, time, time + 0.75);
  }

  lowPulse(time, level = 0.4) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(58, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.55);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.2 * level), time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);
    this.connectOneShot(osc, gain, time, time + 0.85);
  }

  bell(time, frequency, level = 0.6) {
    if (!this.ctx) return;
    [1, 2.01].forEach((ratio, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(frequency * ratio, time);
      osc.detune.setValueAtTime(index === 0 ? 0 : 4, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0002, (index === 0 ? 0.11 : 0.035) * level),
        time + 0.03,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 3.2);
      this.connectOneShot(osc, gain, time, time + 3.3);
    });
  }

  noiseSwell(time, level = 0.4) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, time);
    filter.Q.setValueAtTime(0.4, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(Math.max(0.0002, 0.075 * level), time + 1.2);
    gain.gain.linearRampToValueAtTime(0.0001, time + 2.6);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxBus);
    source.start(time);
    source.stop(time + 2.7);
    source.onended = () => {
      try {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
  }

  getLevel() {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const centered = (data[i] - 128) / 128;
      sum += centered * centered;
    }
    return Math.sqrt(sum / data.length);
  }

  getDebugState() {
    return {
      enabled: this.enabled,
      mode: this.mode,
      activeMood: this.activeMood,
      pendingTransition: Boolean(this.cueTimer),
      transportEpoch: this.transportEpoch,
      cue: this.cue,
      context: this.ctx?.state ?? 'none',
      volume: this.volume,
      master: this.master?.gain.value ?? 0,
      level: this.getLevel(),
      procedural: Boolean(this.procVoice),
      asset: Boolean(this.assetVoice),
      assetCache: [...this.assetCache.keys()],
      manifest: Boolean(this.manifest),
      events: this.eventCount,
    };
  }

  dispose() {
    this.enabled = false;
    clearTimeout(this.cueTimer);
    this.cueTimer = null;
    this.assetToken += 1;
    this.activeMood = null;
    this.session += 1;
    this.assetToken += 1;
    this.stopScheduler();
    if (this.suspendTimer) {
      clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    if (this.onVisibility && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.onVisibility = null;
    }
    if (this.procVoice) {
      this.procVoice.fadeOut(0.8);
      this.procVoice = null;
    }
    if (this.assetVoice) {
      this.assetVoice.fadeOut(0.8);
      this.assetVoice = null;
    }
    if (this.ctx) {
      const ctx = this.ctx;
      this.ctx = null;
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 900);
    }
  }
}
