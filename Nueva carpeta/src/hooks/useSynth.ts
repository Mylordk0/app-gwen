import { useRef, useCallback, useState } from 'react';

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface SynthParams {
  waveform: WaveformType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFreq: number;
  filterRes: number;
  masterVolume: number;
  reverbMix: number;
  delayMix: number;
  delayTime: number;
  delayFeedback: number;
}

interface ActiveNote {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
}

export function useSynth() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const delayMixRef = useRef<GainNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const activeNotesRef = useRef<Map<string, ActiveNote>>(new Map());
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [params, setParams] = useState<SynthParams>({
    waveform: 'sawtooth',
    attack: 0.05,
    decay: 0.2,
    sustain: 0.6,
    release: 0.3,
    filterFreq: 2000,
    filterRes: 1,
    masterVolume: 0.7,
    reverbMix: 0.2,
    delayMix: 0.0,
    delayTime: 0.3,
    delayFeedback: 0.4,
  });

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    // Create master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = params.masterVolume;
    masterGainRef.current = masterGain;

    // Create analyser
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    // Create reverb (convolver)
    const convolver = ctx.createConvolver();
    convolver.buffer = createReverbIR(ctx, 2, 2);
    convolverRef.current = convolver;

    // Dry/wet gains for reverb
    const dryGain = ctx.createGain();
    dryGain.gain.value = 1 - params.reverbMix;
    dryGainRef.current = dryGain;

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = params.reverbMix;
    reverbGainRef.current = reverbGain;

    // Create delay
    const delayNode = ctx.createDelay(2);
    delayNode.delayTime.value = params.delayTime;
    delayNodeRef.current = delayNode;

    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = params.delayFeedback;
    delayFeedbackRef.current = delayFeedback;

    const delayMix = ctx.createGain();
    delayMix.gain.value = params.delayMix;
    delayMixRef.current = delayMix;

    // Connect delay feedback loop
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);

    // Connect routing
    // Master -> dry -> analyser -> destination
    masterGain.connect(dryGain);
    dryGain.connect(analyser);

    // Master -> convolver -> reverbGain -> analyser
    masterGain.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(analyser);

    // Master -> delay -> delayMix -> analyser
    masterGain.connect(delayNode);
    delayNode.connect(delayMix);
    delayMix.connect(analyser);

    analyser.connect(ctx.destination);
  }, []);

  const noteOn = useCallback((noteId: string, frequency: number) => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const masterGain = masterGainRef.current!;

    // Stop existing note if any
    if (activeNotesRef.current.has(noteId)) {
      noteOff(noteId);
    }

    // Create oscillator
    const osc = ctx.createOscillator();
    osc.type = params.waveform;
    osc.frequency.value = frequency;

    // Create filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = params.filterFreq;
    filter.Q.value = params.filterRes;

    // Create gain for ADSR
    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + params.attack);
    gainNode.gain.linearRampToValueAtTime(params.sustain, now + params.attack + params.decay);

    // Connect
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start();

    activeNotesRef.current.set(noteId, { oscillator: osc, gainNode, filterNode: filter });
  }, [params, initAudio]);

  const noteOff = useCallback((noteId: string) => {
    const note = activeNotesRef.current.get(noteId);
    if (!note) return;

    const ctx = audioCtxRef.current!;
    const now = ctx.currentTime;

    note.gainNode.gain.cancelScheduledValues(now);
    note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
    note.gainNode.gain.linearRampToValueAtTime(0, now + params.release);

    note.oscillator.stop(now + params.release + 0.1);
    activeNotesRef.current.delete(noteId);
  }, [params]);

  const updateParam = useCallback((key: keyof SynthParams, value: number | string) => {
    setParams(prev => {
      const next = { ...prev, [key]: value };

      const ctx = audioCtxRef.current;
      if (!ctx) return next;

      switch (key) {
        case 'masterVolume':
          if (masterGainRef.current) {
            masterGainRef.current.gain.value = value as number;
          }
          break;
        case 'filterFreq':
          activeNotesRef.current.forEach(note => {
            note.filterNode.frequency.value = value as number;
          });
          break;
        case 'filterRes':
          activeNotesRef.current.forEach(note => {
            note.filterNode.Q.value = value as number;
          });
          break;
        case 'reverbMix':
          if (dryGainRef.current) dryGainRef.current.gain.value = 1 - (value as number);
          if (reverbGainRef.current) reverbGainRef.current.gain.value = value as number;
          break;
        case 'delayMix':
          if (delayMixRef.current) delayMixRef.current.gain.value = value as number;
          break;
        case 'delayTime':
          if (delayNodeRef.current) delayNodeRef.current.delayTime.value = value as number;
          break;
        case 'delayFeedback':
          if (delayFeedbackRef.current) delayFeedbackRef.current.gain.value = value as number;
          break;
      }

      return next;
    });
  }, []);

  return {
    params,
    updateParam,
    noteOn,
    noteOff,
    analyserRef,
    initAudio,
  };
}

function createReverbIR(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  return buffer;
}
