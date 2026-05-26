import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sampleEntry } from '../data/sampleEntry';

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const ERROR_VISIBLE_MS = 4000;

function isFirstVisit(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === null;
  } catch {
    return false;
  }
}

function readEntries(storageKey: string): JournalEntry[] {
  try {
    const data = localStorage.getItem(storageKey);
    if (data) {
      return JSON.parse(data).entries || [];
    }
  } catch (e) {
    console.error('Error reading from localStorage:', e);
  }
  return [];
}

function writeEntries(storageKey: string, entries: JournalEntry[]): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ entries }));
    return true;
  } catch (e) {
    console.error('Error saving to localStorage:', e);
    return false;
  }
}

function seedSampleEntry(storageKey: string): JournalEntry[] {
  const seeded = [sampleEntry];
  writeEntries(storageKey, seeded);
  return seeded;
}

export function useJournal(storageKey: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isFirstVisit(storageKey)) {
      setEntries(seedSampleEntry(storageKey));
    } else {
      setEntries(readEntries(storageKey));
    }
    setIsLoading(false);
  }, [storageKey]);

  // Auto-clear the storage warning after a short interval.
  useEffect(() => {
    if (!storageWarning) return;
    const t = setTimeout(() => setStorageWarning(null), ERROR_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [storageWarning]);

  const flagStorageFull = useCallback(() => {
    setStorageWarning('WARN: STORAGE FULL');
  }, []);

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

  const saveCurrentEntry = useCallback(async () => {
    if (!currentEntry) return false;

    setIsSaving(true);
    try {
      const existingIndex = entries.findIndex(e => e.id === currentEntry.id);
      let newEntries: JournalEntry[];
      if (existingIndex >= 0) {
        newEntries = [...entries];
        newEntries[existingIndex] = currentEntry;
      } else {
        newEntries = [currentEntry, ...entries];
      }
      newEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const ok = writeEntries(storageKey, newEntries);
      // Even if the write fails, keep the entry in component state so the
      // user does not lose work for the current session.
      setEntries(newEntries);
      if (!ok) {
        flagStorageFull();
        setIsSaving(false);
        return false;
      }
      setHasUnsavedChanges(false);
      setIsSaving(false);
      return true;
    } catch (e) {
      console.error('Error saving entry:', e);
      flagStorageFull();
      setIsSaving(false);
      return false;
    }
  }, [currentEntry, entries, flagStorageFull, storageKey]);

  const loadEntry = useCallback((entry: JournalEntry) => {
    setCurrentEntry(entry);
    setHasUnsavedChanges(false);
  }, []);

  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      const newEntries = entries.filter(e => e.id !== entryId);
      const ok = writeEntries(storageKey, newEntries);
      setEntries(newEntries);
      if (!ok) {
        flagStorageFull();
      }
      if (currentEntry?.id === entryId) {
        setCurrentEntry(null);
        setHasUnsavedChanges(false);
      }
      return ok;
    } catch (e) {
      console.error('Error deleting entry:', e);
      flagStorageFull();
      return false;
    }
  }, [currentEntry, entries, flagStorageFull, storageKey]);

  const clearAllEntries = useCallback(async () => {
    try {
      const seeded = seedSampleEntry(storageKey);
      setEntries(seeded);
      setCurrentEntry(null);
      setHasUnsavedChanges(false);
      return true;
    } catch (e) {
      console.error('Error clearing entries:', e);
      return false;
    }
  }, [storageKey]);

  return {
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
  };
}
