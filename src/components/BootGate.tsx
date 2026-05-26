import { useEffect } from 'react';

interface BootGateProps {
  onAdvance: () => void;
}

export function BootGate({ onAdvance }: BootGateProps) {
  useEffect(() => {
    const handleKey = (_e: KeyboardEvent) => {
      onAdvance();
    };
    const handleClick = () => {
      onAdvance();
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('click', handleClick);
    };
  }, [onAdvance]);

  return (
    <div className="crt-screen h-screen bg-black text-white flex flex-col items-center justify-center font-mono">
      <pre className="text-cyan-400 text-sm mb-12 leading-tight">
{`  ____   ___   ___   ____ ___ _____
 |  _ \\ / _ \\ / _ \\ / ___|_ _| ____|
 | | | | | | | | | | |  _ | ||  _|
 | |_| | |_| | |_| | |_| || || |___
 |____/ \\___/ \\___/ \\____|___|_____|

       JOURNAL  v1.0  --  1989`}
      </pre>
      <div className="text-white text-lg">
        PRESS ANY KEY TO BEGIN<span className="boot-cursor">▮</span>
      </div>
      <div className="text-xs opacity-50 mt-8">
        (c) WIZARD &amp; ASSOCIATES &mdash; 25th &amp; SACRAMENTO
      </div>
    </div>
  );
}
