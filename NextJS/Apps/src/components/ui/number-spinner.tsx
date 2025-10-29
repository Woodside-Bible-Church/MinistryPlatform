'use client';

import { useState, useRef, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberSpinnerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function NumberSpinner({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  className,
}: NumberSpinnerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setTempValue(value.toString());
    }
  }, [value, isEditing]);

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
    triggerAnimation();
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
    triggerAnimation();
  };

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    const parsed = parseInt(tempValue) || 0;
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setTempValue(value.toString());
      setIsEditing(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Minus Button */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="h-12 w-12 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
      >
        <Minus className="w-5 h-5" />
      </button>

      {/* Number Display/Input */}
      <div
        onClick={!isEditing ? handleClick : undefined}
        className={cn(
          "relative h-16 min-w-[120px] flex items-center justify-center rounded-lg bg-card border-2 border-border cursor-pointer transition-all",
          isAnimating && "scale-105 border-primary",
          isEditing && "ring-2 ring-primary cursor-text"
        )}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-full text-center text-4xl font-bold bg-transparent outline-none"
            min={min}
            max={max}
          />
        ) : (
          <div
            className={cn(
              "text-5xl font-bold text-primary transition-all",
              isAnimating && "animate-bounce"
            )}
          >
            {value}
          </div>
        )}
      </div>

      {/* Plus Button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="h-12 w-12 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
