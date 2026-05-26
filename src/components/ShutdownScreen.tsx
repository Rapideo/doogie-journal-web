import { useEffect, useState } from 'react';

interface ShutdownScreenProps {
  onComplete: () => void;
  onTick: () => void;
}

const SHUTDOWN_LINES = [
  'Saving entries...',
  'Closing DOOGIE.EXE...',
  'Shutting down...',
];

export function ShutdownScreen({ onComplete, onTick }: ShutdownScreenProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    SHUTDOWN_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setVisibleLines(prev => [...prev, line]);
          onTick();
        }, 800 * (i + 1))
      );
    });

    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        onComplete();
      }, 800 * (SHUTDOWN_LINES.length + 1))
    );

    return () => {
      cancelled = true;
      timers.forEach(t => clearTimeout(t));
    };
  }, [onComplete, onTick]);

  return (
    <div className="h-screen bg-black text-white font-mono p-8 text-base">
      {visibleLines.map((line, i) => (
        <div key={i}>{`C:\\DOOGIE> ${line}`}</div>
      ))}
    </div>
  );
}
