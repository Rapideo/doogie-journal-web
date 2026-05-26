import { useState, useEffect } from 'react';

interface StatusBarProps {
  currentDate: string | null;
  cursorPosition: { line: number; column: number };
  mode: 'edit' | 'browse' | 'help';
  warning?: string | null;
}

export function StatusBar({ currentDate, cursorPosition, mode, warning }: StatusBarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const modeLabel = {
    edit: 'EDIT',
    browse: 'BROWSE',
    help: 'HELP',
  };

  return (
    <div className="status-bar flex justify-between items-center">
      <div className="flex gap-6 items-center">
        <span>Entry: {formatDate(currentDate)}</span>
        <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        <span>Mode: {modeLabel[mode]}</span>
        {warning && (
          <span className="bg-yellow-400 text-black px-2 font-bold animate-pulse">
            {warning}
          </span>
        )}
      </div>
      <div>
        {formatTime(time)}
      </div>
    </div>
  );
}
