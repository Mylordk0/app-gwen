import React, { useRef, useCallback, useState } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  color?: string;
}

export default function Knob({ value, min, max, step = 0.01, label, unit = '', onChange, color = '#06b6d4' }: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const normalizedValue = (value - min) / (max - min);
  const rotation = normalizedValue * 270 - 135; // -135 to 135 degrees

  const handleStart = useCallback((clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    startValueRef.current = value;
  }, [value]);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const deltaY = startYRef.current - clientY;
    const range = max - min;
    const sensitivity = range / 150;
    let newValue = startValueRef.current + deltaY * sensitivity;
    newValue = Math.max(min, Math.min(max, newValue));
    newValue = Math.round(newValue / step) * step;
    onChange(newValue);
  }, [isDragging, min, max, step, onChange]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
  }, [handleStart]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  }, [handleStart]);

  // Global move/end handlers
  React.useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);
    const onEnd = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const displayValue = step >= 1 ? Math.round(value) : value.toFixed(2);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        ref={knobRef}
        className="relative w-12 h-12 rounded-full cursor-pointer touch-none"
        style={{
          background: `conic-gradient(${color} ${normalizedValue * 270}deg, #1e293b ${normalizedValue * 270}deg ${270}deg, transparent 270deg)`,
          transform: 'rotate(-135deg)',
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="absolute inset-1.5 rounded-full bg-slate-800 flex items-center justify-center"
          style={{ transform: `rotate(${rotation + 135}deg)` }}>
          <div className="w-0.5 h-3 rounded-full absolute top-1.5" style={{ backgroundColor: color }} />
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-medium">{displayValue}{unit}</span>
      <span className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}
