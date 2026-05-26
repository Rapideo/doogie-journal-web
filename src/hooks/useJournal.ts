import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Fallback storage for browser development (without Electron)
const localStorageKey = 'doogie-journal-entries';

function getLocalEntries(): JournalEntry[] {
  try {
    const data = localStorage.getItem(localStorageKey);
    if (data) {
      return JSON.parse(data).entries || [];
    }
  } catch (e) {
    console.error('Error reading from localStorage:', e);
  }
  return [];
}

function saveLocalEntries(entries: JournalEntry[]): void {
  try {
    localStorage.setItem(localStorageKey, JSON.stringify({ entries }));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Load entries on mount
  useEffect(() => {
    async function loadEntries() {
      setIsLoading(true);
      try {
        if (isElectron) {
          const data = await window.electronAPI.getEntries();
          setEntries(data.entries || []);
        } else {
          setEntries(getLocalEntries());
        }
      } catch (e) {
        console.error('Error loading entries:', e);
        setEntries([]);
      }
      setIsLoading(false);
    }
    loadEntries();
  }, [isElectron]);

  // Create a new entry
  const createNewEntry = useCallback(() => {
    const now = new Date();
    const newEntry: JournalEntry = {
      id: uuidv4(),
      date: now.toISOString().split('T')[0],
      content: '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    setCurrentEntry(newEntry);
    setHasUnsavedChanges(false);
    return newEntry;
  }, []);

  // Update the current entry content
  const updateContent = useCallback((content: string) => {
    if (currentEntry) {
      setCurrentEntry({
        ...currentEntry,
        content,
        updatedAt: new Date().toISOString(),
      });
      setHasUnsavedChanges(true);
    }
  }, [currentEntry]);

  // Save the current entry
  const saveCurrentEntry = useCallback(async () => {
    if (!currentEntry) return false;

    setIsSaving(true);
    try {
      if (isElectron) {
        const result = await window.electronAPI.saveEntry(currentEntry);
        if (result.success && result.entries) {
          setEntries(result.entries);
          setHasUnsavedChanges(false);
          setIsSaving(false);
          return true;
        }
      } else {
        // Fallback to localStorage
        const existingIndex = entries.findIndex(e => e.id === currentEntry.id);
        let newEntries: JournalEntry[];
        if (existingIndex >= 0) {
          newEntries = [...entries];
          newEntries[existingIndex] = currentEntry;
        } else {
          newEntries = [currentEntry, ...entries];
        }
        newEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        saveLocalEntries(newEntries);
        setEntries(newEntries);
        setHasUnsavedChanges(false);
        setIsSaving(false);
        return true;
      }
    } catch (e) {
      console.error('Error saving entry:', e);
    }
    setIsSaving(false);
    return false;
  }, [currentEntry, entries, isElectron]);

  // Load an existing entry
  const loadEntry = useCallback((entry: JournalEntry) => {
    setCurrentEntry(entry);
    setHasUnsavedChanges(false);
  }, []);

  // Delete an entry
  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      if (isElectron) {
        const result = await window.electronAPI.deleteEntry(entryId);
        if (result.success && result.entries) {
          setEntries(result.entries);
          if (currentEntry?.id === entryId) {
            setCurrentEntry(null);
            setHasUnsavedChanges(false);
          }
          return true;
        }
      } else {
        const newEntries = entries.filter(e => e.id !== entryId);
        saveLocalEntries(newEntries);
        setEntries(newEntries);
        if (currentEntry?.id === entryId) {
          setCurrentEntry(null);
          setHasUnsavedChanges(false);
        }
        return true;
      }
    } catch (e) {
      console.error('Error deleting entry:', e);
    }
    return false;
  }, [currentEntry, entries, isElectron]);

  return {
    entries,
    currentEntry,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    createNewEntry,
    updateContent,
    saveCurrentEntry,
    loadEntry,
    deleteEntry,
  };
}
