import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useKeyboardSound } from '../hooks/useKeyboardSound';

interface EditorProps {
  content: string;
  date: string | null;
  onChange: (content: string) => void;
  onCursorChange: (position: { line: number; column: number }) => void;
  disabled?: boolean;
  ownerName: string;
}

// Format date like "January 31, 1991..."
function formatJournalDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return `${formatted}...`;
}

const TYPING_SPEED_MS = 80; // milliseconds per character

export function Editor({ content, date, onChange, onCursorChange, disabled, ownerName }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { playKeyClick, playEnterKey } = useKeyboardSound();
  const [typedDateLength, setTypedDateLength] = useState<number | null>(null);
  const fullDate = formatJournalDate(date);
  const prevDateRef = useRef<string | null>(null);

  // Determine if animation is complete
  const isDateTypingComplete = typedDateLength !== null && typedDateLength >= fullDate.length;

  // Reset typing animation when date changes (new entry)
  useEffect(() => {
    if (date && date !== prevDateRef.current) {
      // If loading an existing entry with content, skip animation
      if (content.length > 0) {
        setTypedDateLength(fullDate.length);
      } else {
        // New empty entry - animate the date starting from 0
        setTypedDateLength(0);
      }
      prevDateRef.current = date;
    }
  }, [date, content, fullDate.length]);

  // Typewriter animation for date
  useEffect(() => {
    if (typedDateLength === null || !date) return;
    if (typedDateLength >= fullDate.length) return;

    const timer = setTimeout(() => {
      setTypedDateLength(prev => (prev ?? 0) + 1);
      playKeyClick();
    }, TYPING_SPEED_MS);
    return () => clearTimeout(timer);
  }, [date, typedDateLength, fullDate.length, playKeyClick]);

  // Timeout fallback: if animation stalls, force-complete after 3 seconds
  useEffect(() => {
    if (typedDateLength !== null && typedDateLength < fullDate.length && date) {
      const fallback = setTimeout(() => {
        setTypedDateLength(fullDate.length);
      }, 3000);
      return () => clearTimeout(fallback);
    }
  }, [typedDateLength, fullDate.length, date]);

  // Focus textarea when date typing completes
  useEffect(() => {
    if (isDateTypingComplete && textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [isDateTypingComplete, disabled]);

  // Calculate cursor position
  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    onCursorChange({ line, column });
  }, [onCursorChange]);

  // Handle key events for sound
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      playEnterKey();
    } else if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab') {
      playKeyClick();
    }
  }, [playKeyClick, playEnterKey]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    updateCursorPosition();
  }, [onChange, updateCursorPosition]);

  const handleSelect = useCallback(() => {
    updateCursorPosition();
  }, [updateCursorPosition]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {disabled ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center journal-text crt-glow">
            <p className="text-2xl mb-2">Welcome to</p>
            <p className="text-6xl font-bold tracking-wider">Doogie</p>
          </div>
        </div>
      ) : (
        <>
          {/* Teal Header Bar - Personal Journal Banner */}
          <div className="journal-header-container">
            <div className="journal-header">
              <div className="journal-header-line"></div>
              <span className="journal-header-text">PERSONAL JOURNAL OF {ownerName}</span>
              <div className="journal-header-line"></div>
            </div>
          </div>

          {/* Journal Content Area */}
          <div className="flex-1 p-8 pt-6 overflow-auto relative">
            {/* Date prefix - displayed but not editable */}
            <div className="journal-content">
              <span className="journal-date">
                {fullDate.substring(0, typedDateLength ?? 0)}
                {!isDateTypingComplete && typedDateLength !== null && (
                  <span className="cursor-blink">█</span>
                )}
              </span>
              {isDateTypingComplete && content === '' && (
                <span
                  className="journal-date cursor-blink"
                  style={{ left: `${fullDate.length}ch` }}
                >█</span>
              )}
              <textarea
                ref={textareaRef}
                className={`journal-input crt-glow ${content === '' ? 'caret-transparent' : ''}`}
                style={{ textIndent: `${fullDate.length}ch` }}
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onSelect={handleSelect}
                onClick={handleSelect}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                disabled={!isDateTypingComplete}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
