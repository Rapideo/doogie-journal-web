import { useEffect } from 'react';
import { useKeyboardSound } from '../hooks/useKeyboardSound';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  const { playKeyClick, playBeep } = useKeyboardSound();

  useEffect(() => {
    playBeep();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') {
        onConfirm();
        playKeyClick();
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        onCancel();
        playKeyClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel, playKeyClick, playBeep]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="dos-dialog w-[400px]" role="dialog" aria-label={title}>
        {/* Title bar */}
        <div className="dos-dialog-title">{title}</div>

        {/* Content */}
        <div className="dos-blue-bg text-white p-4 text-center crt-glow">
          <p className="mb-4">{message}</p>
        </div>

        {/* Footer */}
        <div className="bg-gray-400 p-2 flex justify-center gap-4 text-black">
          <button className="dos-button" onClick={onConfirm}>
            <span className="hotkey">Y</span>es
          </button>
          <button className="dos-button" onClick={onCancel}>
            <span className="hotkey">N</span>o
          </button>
        </div>
      </div>
    </div>
  );
}
