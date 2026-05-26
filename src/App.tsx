import { useState, useEffect, useCallback } from 'react';
import { MenuBar } from './components/MenuBar';
import { StatusBar } from './components/StatusBar';
import { Editor } from './components/Editor';
import { EntryBrowser } from './components/EntryBrowser';
import { HelpDialog } from './components/HelpDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useJournal } from './hooks/useJournal';
import { useKeyboardSound } from './hooks/useKeyboardSound';

type AppMode = 'edit' | 'browse' | 'help';
type DialogType = 'none' | 'help' | 'browse' | 'unsaved-new' | 'unsaved-browse' | 'unsaved-quit' | 'quit';

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
  } = useJournal();

  const { playBeep, playTheme } = useKeyboardSound();

  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [activeDialog, setActiveDialog] = useState<DialogType>('none');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Play theme when splash screen shows
  useEffect(() => {
    if (isLoading || !showSplash) return;

    // Small delay to ensure audio context is ready, then play theme
    const themeTimer = setTimeout(() => {
      playTheme();
    }, 500);

    return () => clearTimeout(themeTimer);
  }, [isLoading, showSplash, playTheme]);

  // Auto-open today's entry after splash screen (7 seconds)
  useEffect(() => {
    if (isLoading || !showSplash) return;

    const timer = setTimeout(() => {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Check if an entry for today already exists
      const todayEntry = entries.find(e => e.date === today);

      if (todayEntry) {
        // Load existing entry for today
        loadEntry(todayEntry);
      } else {
        // Create a new entry for today
        createNewEntry();
      }

      setShowSplash(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, [isLoading, showSplash, entries, loadEntry, createNewEntry]);

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

  const handleConfirmQuit = useCallback(() => {
    // Replaced in Task 7 with shutdown phase transition.
    setActiveDialog('none');
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if we're in a dialog
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
          handleNew();
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
  }, [activeDialog, handleHelp, handleSave, handleNew, handleBrowse, handleQuit]);

  if (isLoading) {
    return (
      <div className="crt-screen crt-flicker dos-blue-bg h-screen flex items-center justify-center">
        <div className="text-white crt-glow text-xl">Loading...</div>
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
    </div>
  );
}

export default App;
