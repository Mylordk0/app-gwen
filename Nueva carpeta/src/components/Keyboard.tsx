import React, { useCallback, useRef } from 'react';

interface KeyboardProps {
  onNoteOn: (noteId: string, frequency: number) => void;
  onNoteOff: (noteId: string) => void;
  octave: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteToFrequency(note: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(note);
  const midiNote = (octave + 1) * 12 + noteIndex;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Define keys for 2 octaves
function generateKeys(startOctave: number) {
  const keys: { note: string; octave: number; freq: number; isBlack: boolean; id: string }[] = [];
  
  for (let oct = startOctave; oct < startOctave + 2; oct++) {
    for (let i = 0; i < 12; i++) {
      const note = NOTE_NAMES[i];
      const isBlack = note.includes('#');
      keys.push({
        note,
        octave: oct,
        freq: noteToFrequency(note, oct),
        isBlack,
        id: `${note}${oct}`,
      });
    }
  }
  
  // Add the final C
  keys.push({
    note: 'C',
    octave: startOctave + 2,
    freq: noteToFrequency('C', startOctave + 2),
    isBlack: false,
    id: `C${startOctave + 2}`,
  });
  
  return keys;
}

export default function Keyboard({ onNoteOn, onNoteOff, octave }: KeyboardProps) {
  const keys = generateKeys(octave);
  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);
  const activeTouches = useRef<Map<number, string>>(new Map());

  const getNoteAtPosition = useCallback((clientX: number, clientY: number): { id: string; freq: number } | null => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const noteId = el.getAttribute('data-note-id');
    const freq = el.getAttribute('data-note-freq');
    if (noteId && freq) {
      return { id: noteId, freq: parseFloat(freq) };
    }
    return null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const note = getNoteAtPosition(touch.clientX, touch.clientY);
      if (note) {
        activeTouches.current.set(touch.identifier, note.id);
        onNoteOn(note.id, note.freq);
      }
    }
  }, [onNoteOn, getNoteAtPosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const note = getNoteAtPosition(touch.clientX, touch.clientY);
      const prevNoteId = activeTouches.current.get(touch.identifier);
      
      if (note && note.id !== prevNoteId) {
        if (prevNoteId) onNoteOff(prevNoteId);
        activeTouches.current.set(touch.identifier, note.id);
        onNoteOn(note.id, note.freq);
      }
    }
  }, [onNoteOn, onNoteOff, getNoteAtPosition]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const noteId = activeTouches.current.get(touch.identifier);
      if (noteId) {
        onNoteOff(noteId);
        activeTouches.current.delete(touch.identifier);
      }
    }
  }, [onNoteOff]);

  // Mouse handlers for desktop
  const [mouseNote, setMouseNote] = React.useState<string | null>(null);

  const handleMouseDown = useCallback((noteId: string, freq: number) => {
    setMouseNote(noteId);
    onNoteOn(noteId, freq);
  }, [onNoteOn]);

  const handleMouseUp = useCallback(() => {
    if (mouseNote) {
      onNoteOff(mouseNote);
      setMouseNote(null);
    }
  }, [mouseNote, onNoteOff]);

  const handleMouseEnter = useCallback((noteId: string, freq: number) => {
    if (mouseNote) {
      onNoteOn(noteId, freq);
    }
  }, [mouseNote, onNoteOn]);

  const handleMouseLeave = useCallback((noteId: string) => {
    if (mouseNote === noteId) {
      onNoteOff(noteId);
    }
  }, [mouseNote, onNoteOff]);

  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (mouseNote) {
        onNoteOff(mouseNote);
        setMouseNote(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [mouseNote, onNoteOff]);

  // Calculate black key positions
  const whiteKeyWidth = 100 / whiteKeys.length;
  
  const getBlackKeyPosition = (blackKey: typeof blackKeys[0]) => {
    const noteIndex = NOTE_NAMES.indexOf(blackKey.note);
    const octOffset = (blackKey.octave - octave) * 12;
    const absoluteIndex = octOffset + noteIndex;
    
    // Find the white key just before this black key
    const whiteKeyBefore = whiteKeys.findIndex(wk => {
      const wkNoteIndex = NOTE_NAMES.indexOf(wk.note);
      const wkOctOffset = (wk.octave - octave) * 12;
      return wkOctOffset + wkNoteIndex === absoluteIndex - 1;
    });
    
    if (whiteKeyBefore === -1) return -100;
    return (whiteKeyBefore + 1) * whiteKeyWidth - whiteKeyWidth * 0.3;
  };

  return (
    <div
      className="relative w-full h-36 sm:h-44 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseUp={handleMouseUp}
    >
      {/* White keys */}
      <div className="absolute inset-0 flex">
        {whiteKeys.map((key) => (
          <div
            key={key.id}
            data-note-id={key.id}
            data-note-freq={key.freq}
            className={`flex-1 border-r border-slate-300 rounded-b-lg transition-colors duration-75 ${
              mouseNote === key.id
                ? 'bg-cyan-200'
                : 'bg-white hover:bg-slate-100'
            }`}
            style={{ borderRight: '1px solid #cbd5e1' }}
            onMouseDown={() => handleMouseDown(key.id, key.freq)}
            onMouseEnter={() => handleMouseEnter(key.id, key.freq)}
            onMouseLeave={() => handleMouseLeave(key.id)}
          >
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-400">
              {key.note}{key.octave}
            </div>
          </div>
        ))}
      </div>
      
      {/* Black keys */}
      {blackKeys.map((key) => {
        const left = getBlackKeyPosition(key);
        if (left < 0) return null;
        return (
          <div
            key={key.id}
            data-note-id={key.id}
            data-note-freq={key.freq}
            className={`absolute top-0 h-[60%] w-[6%] rounded-b-md z-10 transition-colors duration-75 ${
              mouseNote === key.id
                ? 'bg-cyan-600'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
            style={{ left: `${left}%` }}
            onMouseDown={() => handleMouseDown(key.id, key.freq)}
            onMouseEnter={() => handleMouseEnter(key.id, key.freq)}
            onMouseLeave={() => handleMouseLeave(key.id)}
          />
        );
      })}
    </div>
  );
}
