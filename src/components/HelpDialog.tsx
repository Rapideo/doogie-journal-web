import { useEffect, useState } from 'react';
import { useKeyboardSound } from '../hooks/useKeyboardSound';
import { getRandomQuote } from '../data/quotes';

interface HelpDialogProps {
  onClose: () => void;
}

export function HelpDialog({ onClose }: HelpDialogProps) {
  const { playKeyClick } = useKeyboardSound();
  const [quote] = useState(() => getRandomQuote());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onClose();
        playKeyClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, playKeyClick]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div
        className="dos-dialog w-[500px]"
        role="dialog"
        aria-label="Help"
      >
        {/* Title bar */}
        <div className="dos-dialog-title flex justify-between items-center">
          <span>DOOGIE JOURNAL - Help</span>
          <button
            onClick={onClose}
            className="hover:bg-red-700 px-2"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="dos-blue-bg text-white p-4 crt-glow">
          <div className="mb-4 text-center border-b border-blue-400 pb-2">
            ╔══════════════════════════════════════╗
            <br />
            ║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DOOGIE JOURNAL v1.0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║
            <br />
            ║&nbsp;&nbsp;&nbsp;A Retro Personal Diary&nbsp;&nbsp;&nbsp;&nbsp;║
            <br />
            ╚══════════════════════════════════════╝
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-yellow-400">KEYBOARD SHORTCUTS:</span>
            </div>
            <div className="ml-4 space-y-1">
              <div><span className="text-cyan-400">F1</span> - Show this help screen</div>
              <div><span className="text-cyan-400">F2</span> - Save current entry</div>
              <div><span className="text-cyan-400">F3</span> - Create new entry</div>
              <div><span className="text-cyan-400">F4</span> - Browse saved entries</div>
              <div><span className="text-cyan-400">F10</span> - Quit application</div>
              <div><span className="text-cyan-400">Shift+F3</span> - Clear all entries</div>
            </div>

            <div className="mt-4">
              <span className="text-yellow-400">BROWSE MODE:</span>
            </div>
            <div className="ml-4 space-y-1">
              <div><span className="text-cyan-400">↑/↓</span> - Navigate entries</div>
              <div><span className="text-cyan-400">Enter</span> - Edit selected entry</div>
              <div><span className="text-cyan-400">D</span> - Delete selected entry</div>
              <div><span className="text-cyan-400">Esc</span> - Close browser</div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-400 text-xs opacity-80">
              <span className="text-yellow-400">NOTE:</span> Your entries are stored only in this browser. Clearing your browser data will erase them.
            </div>

            <div className="mt-4 text-center text-xs opacity-70">
              "{quote}"
              <br />
              - Doogie Howser, M.D. (1989-1993)
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-400 p-2 flex justify-center text-black">
          <button className="dos-button" onClick={onClose}>
            <span className="hotkey">O</span>K
          </button>
        </div>
      </div>
    </div>
  );
}
