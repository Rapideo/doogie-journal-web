interface MenuBarProps {
  onNew: () => void;
  onSave: () => void;
  onBrowse: () => void;
  onHelp: () => void;
  onQuit: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
}

export function MenuBar({
  onNew,
  onSave,
  onBrowse,
  onHelp,
  onQuit,
  hasUnsavedChanges,
  isSaving,
}: MenuBarProps) {
  return (
    <div className="menu-bar flex justify-between items-center px-2">
      <div className="flex">
        <button
          className="menu-item"
          onClick={onHelp}
          title="F1 - Help"
        >
          <span className="hotkey">F1</span> Help
        </button>
        <button
          className="menu-item"
          onClick={onSave}
          disabled={isSaving}
          title="F2 - Save"
        >
          <span className="hotkey">F2</span> {isSaving ? 'Saving...' : 'Save'}
          {hasUnsavedChanges && !isSaving && ' *'}
        </button>
        <button
          className="menu-item"
          onClick={onNew}
          title="F3 - New Entry"
        >
          <span className="hotkey">F3</span> New
        </button>
        <button
          className="menu-item"
          onClick={onBrowse}
          title="F4 - Browse Entries"
        >
          <span className="hotkey">F4</span> Browse
        </button>
        <button
          className="menu-item"
          onClick={onQuit}
          title="F10 - Quit"
        >
          <span className="hotkey">F10</span> Quit
        </button>
      </div>
      <div className="text-xs opacity-70">
        DOOGIE JOURNAL v1.0
      </div>
    </div>
  );
}
