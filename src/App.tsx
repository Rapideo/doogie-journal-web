import { useState, useEffect, useCallback } from 'react';
import { MenuBar } from './components/MenuBar';
import { StatusBar } from './components/StatusBar';
import { Editor } from './components/Editor';
import { EntryBrowser } from './components/EntryBrowser';
import { HelpDialog } from './components/HelpDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { BootGate } from './components/BootGate';
import { ShutdownScreen } from './components/ShutdownScreen';
import { useJournal } from './hooks/useJournal';
import { useKeyboardSound } from './hooks/useKeyboardSound';

type AppMode = 'edit' | 'browse' | 'help';
type DialogType = 'none' | 'help' | 'browse' | 'unsaved-new' | 'unsaved-browse' | 'unsaved-quit' | 'quit' | 'reset';
type Phase = 'boot-gate' | 'splash' | 'editor' | 'shutdown' | 'safe-to-turn-off';

function App() {
  const {
    entries,
    currentEntry,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    storageWarning,
    createNewEntry,
    updateContent,
    saveCurrentEntry,
    loadEntry,
    deleteEntry,
    clearAllEntries,
  } = useJournal();

  const { playBeep, playTheme, playKeyClick } = useKeyboardSound();

  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [activeDialog, setActiveDialog] = useState<DialogType>('none');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [phase, setPhase] = useState<Phase>('boot-gate');

  // Play theme when splash phase begins
  useEffect(() => {
    if (isLoading || phase !== 'splash') return;

    const themeTimer = setTimeout(() => {
      playTheme();
    }, 500);

    return () => clearTimeout(themeTimer);
  }, [isLoading, phase, playTheme]);

  // Auto-transition to editor after splash (7 seconds)
  useEffect(() => {
    if (isLoading || phase !== 'splash') return;

    const timer = setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = entries.find(e => e.date === today);

      if (todayEntry) {
        loadEntry(todayEntry);
      } else {
        createNewEntry();
      }

      setPhase('editor');
    }, 7000);

    return () => clearTimeout(timer);
  }, [isLoading, phase, entries, loadEntry, createNewEntry]);

  // Determine app mode based on active dialog
  const mode: AppMode = activeDialog === 'browse' ? 'browse' : activeDialog === 'help' ? 'help' : 'edit';

  // Handle unsaved changes before action
  const handleUnsavedAction = useCallback((action: () => void, dialogType: DialogType) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => action);
      setActiveDialog(dialogType);
      playBeep();
    } else {
      action();
    }
  }, [hasUnsavedChanges, playBeep]);

  // Menu actions
  const handleNew = useCallback(() => {
    handleUnsavedAction(() => {
      createNewEntry();
      setActiveDialog('none');
    }, 'unsaved-new');
  }, [createNewEntry, handleUnsavedAction]);

  const handleSave = useCallback(async () => {
    if (currentEntry) {
      const success = await saveCurrentEntry();
      if (success) {
        playBeep();
      }
    }
  }, [currentEntry, saveCurrentEntry, playBeep]);

  const handleBrowse = useCallback(() => {
    handleUnsavedAction(() => {
      setActiveDialog('browse');
    }, 'unsaved-browse');
  }, [handleUnsavedAction]);

  const handleHelp = useCallback(() => {
    setActiveDialog('help');
  }, []);

  const handleQuit = useCallback(() => {
    handleUnsavedAction(() => {
      setActiveDialog('quit');
    }, 'unsaved-quit');
  }, [handleUnsavedAction]);

  const handleReset = useCallback(() => {
    setActiveDialog('reset');
  }, []);

  const handleConfirmReset = useCallback(async () => {
    await clearAllEntries();
    setActiveDialog('none');
    playBeep();
  }, [clearAllEntries, playBeep]);

  const handleBootGateAdvance = useCallback(() => {
    // First gesture unlocks audio context for the splash theme.
    try {
      const Ctx = (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        // Some browsers require an explicit resume after construction.
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    } catch {
      // Audio unlock is best-effort; silent splash is acceptable degradation.
    }
    setPhase('splash');
  }, []);

  // Dialog handlers
  const handleConfirmUnsaved = useCallback(async () => {
    // Save first, then do pending action
    await saveCurrentEntry();
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setActiveDialog('none');
  }, [saveCurrentEntry, pendingAction]);

  const handleDiscardUnsaved = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setActiveDialog('none');
  }, [pendingAction]);

  const handleCancelDialog = useCallback(() => {
    setPendingAction(null);
    setActiveDialog('none');
  }, []);

  const handleSelectEntry = useCallback((entry: typeof entries[0]) => {
    loadEntry(entry);
    setActiveDialog('none');
  }, [loadEntry]);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    await deleteEntry(entryId);
  }, [deleteEntry]);

  const handleConfirmQuit = useCallback(async () => {
    setActiveDialog('none');
    // Auto-save any pending entry before shutting down.
    if (hasUnsavedChanges) {
      await saveCurrentEntry();
    }
    setPhase('shutdown');
  }, [hasUnsavedChanges, saveCurrentEntry]);

  const handleShutdownComplete = useCallback(() => {
    setPhase('safe-to-turn-off');
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only the editor phase listens for function keys.
      if (phase !== 'editor') {
        return;
      }
      // Don't intercept if we're in a dialog that captures input.
      if (activeDialog !== 'none' && activeDialog !== 'browse' && activeDialog !== 'help') {
        return;
      }

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          handleHelp();
          break;
        case 'F2':
          e.preventDefault();
          handleSave();
          break;
        case 'F3':
          e.preventDefault();
          if (e.shiftKey) {
            handleReset();
          } else {
            handleNew();
          }
          break;
        case 'F4':
          e.preventDefault();
          handleBrowse();
          break;
        case 'F10':
          e.preventDefault();
          handleQuit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDialog, phase, handleHelp, handleSave, handleNew, handleBrowse, handleQuit, handleReset]);

  if (isLoading) {
    return (
      <div className="crt-screen crt-flicker dos-blue-bg h-screen flex items-center justify-center">
        <div className="text-white crt-glow text-xl">Loading...</div>
      </div>
    );
  }

  if (phase === 'boot-gate') {
    return <BootGate onAdvance={handleBootGateAdvance} />;
  }

  if (phase === 'splash') {
    return (
      <div className="crt-screen crt-flicker dos-blue-bg h-screen flex flex-col items-center justify-center">
        <div className="text-white crt-glow text-3xl mb-4 font-bold tracking-wider">
          DOOGIE JOURNAL
        </div>
        <div className="text-cyan-300 crt-glow text-sm">
          v1.0 &mdash; loading today's entry...
        </div>
      </div>
    );
  }

  if (phase === 'shutdown') {
    return (
      <ShutdownScreen
        onComplete={handleShutdownComplete}
        onTick={playKeyClick}
      />
    );
  }

  if (phase === 'safe-to-turn-off') {
    return (
      <div className="h-screen bg-black text-orange-400 flex items-center justify-center font-mono">
        <div className="text-xl">
          It is now safe to turn off your computer.
        </div>
      </div>
    );
  }

  return (
    <div className="crt-screen crt-flicker h-screen flex flex-col dos-blue-bg">
      {/* Menu Bar */}
      <MenuBar
        onNew={handleNew}
        onSave={handleSave}
        onBrowse={handleBrowse}
        onHelp={handleHelp}
        onQuit={handleQuit}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
      />

      {/* Main Editor Area */}
      <Editor
        key={currentEntry?.id}
        content={currentEntry?.content || ''}
        date={currentEntry?.date || null}
        onChange={updateContent}
        onCursorChange={setCursorPosition}
        disabled={!currentEntry}
      />

      {/* Status Bar */}
      <StatusBar
        currentDate={currentEntry?.date || null}
        cursorPosition={cursorPosition}
        mode={mode}
        warning={storageWarning}
      />

      {/* Dialogs */}
      {activeDialog === 'help' && (
        <HelpDialog onClose={handleCancelDialog} />
      )}

      {activeDialog === 'browse' && (
        <EntryBrowser
          entries={entries}
          onSelect={handleSelectEntry}
          onDelete={handleDeleteEntry}
          onClose={handleCancelDialog}
        />
      )}

      {(activeDialog === 'unsaved-new' || activeDialog === 'unsaved-browse' || activeDialog === 'unsaved-quit') && (
        <ConfirmDialog
          title="Unsaved Changes"
          message="You have unsaved changes. Save before continuing?"
          onConfirm={handleConfirmUnsaved}
          onCancel={handleDiscardUnsaved}
        />
      )}

      {activeDialog === 'quit' && (
        <ConfirmDialog
          title="Quit"
          message="Are you sure you want to quit DOOGIE JOURNAL?"
          onConfirm={handleConfirmQuit}
          onCancel={handleCancelDialog}
        />
      )}

      {activeDialog === 'reset' && (
        <ConfirmDialog
          title="Reset Journal"
          message="This will erase all journal entries from this browser. Are you sure?"
          onConfirm={handleConfirmReset}
          onCancel={handleCancelDialog}
        />
      )}
    </div>
  );
}

export default App;
