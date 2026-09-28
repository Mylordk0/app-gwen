import React, { useState } from 'react';
import { useSynth, WaveformType } from './hooks/useSynth';
import Keyboard from './components/Keyboard';
import Knob from './components/Knob';
import Visualizer from './components/Visualizer';
import InstallPrompt from './components/InstallPrompt';

const WAVEFORMS: { type: WaveformType; icon: string; label: string }[] = [
  { type: 'sine', icon: '∿', label: 'Sine' },
  { type: 'triangle', icon: '△', label: 'Tri' },
  { type: 'square', icon: '⊓', label: 'Sq' },
  { type: 'sawtooth', icon: '⩘', label: 'Saw' },
];

export default function App() {
  const { params, updateParam, noteOn, noteOff, analyserRef, initAudio } = useSynth();
  const [octave, setOctave] = useState(3);
  const [activeTab, setActiveTab] = useState<'osc' | 'env' | 'fx'>('osc');
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    initAudio();
    setStarted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <span className="text-lg">🎹</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">SynthWave</h1>
            <p className="text-[10px] text-slate-400">Mobile Synthesizer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Octave</span>
          <button
            onClick={() => setOctave(o => Math.max(1, o - 1))}
            className="w-7 h-7 rounded bg-slate-700 text-xs flex items-center justify-center active:bg-slate-600"
          >
            −
          </button>
          <span className="text-xs font-mono w-4 text-center text-cyan-400">{octave}</span>
          <button
            onClick={() => setOctave(o => Math.min(6, o + 1))}
            className="w-7 h-7 rounded bg-slate-700 text-xs flex items-center justify-center active:bg-slate-600"
          >
            +
          </button>
        </div>
      </header>

      {/* Visualizer */}
      <div className="px-4 pt-3">
        <Visualizer analyserRef={analyserRef} />
      </div>

      {/* Controls Panel */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-3 bg-slate-800/50 rounded-lg p-1">
          {(['osc', 'env', 'fx'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'osc' ? 'Oscillator' : tab === 'env' ? 'Envelope' : 'Effects'}
            </button>
          ))}
        </div>

        {/* Oscillator Tab */}
        {activeTab === 'osc' && (
          <div className="space-y-4">
            {/* Waveform Selection */}
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Waveform</p>
              <div className="grid grid-cols-4 gap-2">
                {WAVEFORMS.map(w => (
                  <button
                    key={w.type}
                    onClick={() => updateParam('waveform', w.type)}
                    className={`py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all ${
                      params.waveform === w.type
                        ? 'bg-cyan-600/20 border border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-700/50 border border-slate-600/30 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{w.icon}</span>
                    <span className="text-[9px]">{w.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Filter</p>
              <div className="flex justify-around">
                <Knob
                  value={params.filterFreq}
                  min={20}
                  max={20000}
                  step={10}
                  label="Cutoff"
                  unit="Hz"
                  onChange={v => updateParam('filterFreq', v)}
                  color="#06b6d4"
                />
                <Knob
                  value={params.filterRes}
                  min={0}
                  max={20}
                  step={0.1}
                  label="Resonance"
                  unit="Q"
                  onChange={v => updateParam('filterRes', v)}
                  color="#8b5cf6"
                />
              </div>
            </div>

            {/* Master Volume */}
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Output</p>
              <div className="flex justify-center">
                <Knob
                  value={params.masterVolume}
                  min={0}
                  max={1}
                  step={0.01}
                  label="Volume"
                  onChange={v => updateParam('masterVolume', v)}
                  color="#10b981"
                />
              </div>
            </div>
          </div>
        )}

        {/* Envelope Tab */}
        {activeTab === 'env' && (
          <div className="space-y-4">
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">ADSR Envelope</p>
              
              {/* ADSR Visualization */}
              <div className="h-16 mb-4 relative bg-slate-900/50 rounded-lg overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="envGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const total = params.attack + params.decay + 0.5 + params.release;
                    const aX = (params.attack / total) * 200;
                    const dX = aX + (params.decay / total) * 200;
                    const sX = dX + (0.5 / total) * 200;
                    const rX = sX + (params.release / total) * 200;
                    const sY = 60 - params.sustain * 50;
                    
                    return (
                      <>
                        <path
                          d={`M 0 60 L ${aX} 10 L ${dX} ${sY} L ${sX} ${sY} L ${rX} 60`}
                          fill="url(#envGrad)"
                          stroke="#06b6d4"
                          strokeWidth="1.5"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="flex justify-around">
                <Knob
                  value={params.attack}
                  min={0.001}
                  max={2}
                  step={0.01}
                  label="Attack"
                  unit="s"
                  onChange={v => updateParam('attack', v)}
                  color="#f59e0b"
                />
                <Knob
                  value={params.decay}
                  min={0.001}
                  max={2}
                  step={0.01}
                  label="Decay"
                  unit="s"
                  onChange={v => updateParam('decay', v)}
                  color="#ef4444"
                />
                <Knob
                  value={params.sustain}
                  min={0}
                  max={1}
                  step={0.01}
                  label="Sustain"
                  onChange={v => updateParam('sustain', v)}
                  color="#10b981"
                />
                <Knob
                  value={params.release}
                  min={0.01}
                  max={3}
                  step={0.01}
                  label="Release"
                  unit="s"
                  onChange={v => updateParam('release', v)}
                  color="#8b5cf6"
                />
              </div>
            </div>
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'fx' && (
          <div className="space-y-4">
            {/* Reverb */}
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Reverb</p>
              <div className="flex justify-center">
                <Knob
                  value={params.reverbMix}
                  min={0}
                  max={1}
                  step={0.01}
                  label="Mix"
                  onChange={v => updateParam('reverbMix', v)}
                  color="#06b6d4"
                />
              </div>
            </div>

            {/* Delay */}
            <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Delay</p>
              <div className="flex justify-around">
                <Knob
                  value={params.delayMix}
                  min={0}
                  max={1}
                  step={0.01}
                  label="Mix"
                  onChange={v => updateParam('delayMix', v)}
                  color="#f59e0b"
                />
                <Knob
                  value={params.delayTime}
                  min={0.01}
                  max={1}
                  step={0.01}
                  label="Time"
                  unit="s"
                  onChange={v => updateParam('delayTime', v)}
                  color="#ef4444"
                />
                <Knob
                  value={params.delayFeedback}
                  min={0}
                  max={0.9}
                  step={0.01}
                  label="Feedback"
                  onChange={v => updateParam('delayFeedback', v)}
                  color="#10b981"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard */}
      <div className="border-t border-slate-700/50 bg-slate-800/30 px-2 pb-4 pt-2">
        <Keyboard onNoteOn={noteOn} onNoteOff={noteOff} octave={octave} />
      </div>

      {/* Start overlay for audio context */}
      {!started && (
        <div className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="text-center px-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
              <span className="text-4xl">🎹</span>
            </div>
            <h2 className="text-xl font-bold mb-2">SynthWave</h2>
            <p className="text-sm text-slate-400 mb-6">Sintetizador táctil</p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/30 active:scale-95 transition-transform"
            >
              Empezar a Tocar
            </button>
            <p className="text-[10px] text-slate-500 mt-4">Toca para activar el audio</p>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
