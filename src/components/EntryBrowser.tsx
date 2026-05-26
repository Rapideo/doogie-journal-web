import React, { useState, useEffect, useCallback } from 'react';
import { useKeyboardSound } from '../hooks/useKeyboardSound';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface EntryBrowserProps {
  entries: JournalEntry[];
  onSelect: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
  onClose: () => void;
}

export function EntryBrowser({ entries, onSelect, onDelete, onClose }: EntryBrowserProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { playKeyClick, playBeep } = useKeyboardSound();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPreview = (content: string, maxLength: number = 50) => {
    const firstLine = content.split('\n')[0] || '';
    if (firstLine.length > maxLength) {
      return firstLine.substring(0, maxLength) + '...';
    }
    return firstLine || '(empty entry)';
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showDeleteConfirm) {
      if (e.key === 'y' || e.key === 'Y') {
        const entry = entries[selectedIndex];
        if (entry) {
          onDelete(entry.id);
          setShowDeleteConfirm(false);
          playBeep();
        }
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        setShowDeleteConfirm(false);
        playKeyClick();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
        playKeyClick();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(entries.length - 1, prev + 1));
        playKeyClick();
        break;
      case 'Enter':
        if (entries[selectedIndex]) {
          onSelect(entries[selectedIndex]);
          playKeyClick();
        }
        break;
      case 'Delete':
      case 'd':
      case 'D':
        if (entries[selectedIndex]) {
          setShowDeleteConfirm(true);
          playBeep();
        }
        break;
      case 'Escape':
        onClose();
        playKeyClick();
        break;
    }
  }, [entries, selectedIndex, showDeleteConfirm, onSelect, onDelete, onClose, playKeyClick, playBeep]);

  // Focus for keyboard events
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      handleKeyDown(e as unknown as React.KeyboardEvent);
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div
        className="dos-dialog w-[600px] max-h-[80vh] flex flex-col"
        role="dialog"
        aria-label="Browse Journal Entries"
      >
        {/* Title bar */}
        <div className="dos-dialog-title flex justify-between items-center">
          <span>Browse Journal Entries</span>
          <button
            onClick={onClose}
            className="hover:bg-red-700 px-2"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto dos-blue-bg p-2 min-h-[200px] max-h-[400px]">
          {entries.length === 0 ? (
            <div className="text-center text-white py-8 crt-glow">
              No journal entries yet.
              <br />
              <span className="text-sm opacity-70">Press Esc to close, then F3 to create one.</span>
            </div>
          ) : (
            entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`entry-list-item text-white crt-glow ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => {
                  setSelectedIndex(index);
                  playKeyClick();
                }}
                onDoubleClick={() => {
                  onSelect(entry);
                  playKeyClick();
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">{formatDate(entry.date)}</span>
                  <span className="text-xs opacity-70">
                    {entry.content.split('\n').length} lines
                  </span>
                </div>
                <div className="text-sm opacity-80 truncate mt-1">
                  {getPreview(entry.content)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with controls */}
        <div className="bg-gray-400 p-2 flex justify-between items-center text-black text-sm">
          <div className="flex gap-2">
            <button
              className="dos-button"
              onClick={() => entries[selectedIndex] && onSelect(entries[selectedIndex])}
              disabled={entries.length === 0}
            >
              <span className="hotkey">E</span>dit
            </button>
            <button
              className="dos-button"
              onClick={() => entries[selectedIndex] && setShowDeleteConfirm(true)}
              disabled={entries.length === 0}
            >
              <span className="hotkey">D</span>elete
            </button>
            <button className="dos-button" onClick={onClose}>
              <span className="hotkey">C</span>lose
            </button>
          </div>
          <div className="text-xs">
            ↑↓ Navigate | Enter=Edit | D=Delete | Esc=Close
          </div>
        </div>

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="dos-dialog p-4 text-center">
              <div className="dos-dialog-title mb-4">Confirm Delete</div>
              <p className="mb-4">Delete this entry permanently?</p>
              <div className="flex justify-center gap-4">
                <button
                  className="dos-button"
                  onClick={() => {
                    const entry = entries[selectedIndex];
                    if (entry) {
                      onDelete(entry.id);
                      setShowDeleteConfirm(false);
                      playBeep();
                    }
                  }}
                >
                  <span className="hotkey">Y</span>es
                </button>
                <button
                  className="dos-button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    playKeyClick();
                  }}
                >
                  <span className="hotkey">N</span>o
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
