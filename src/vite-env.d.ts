/// <reference types="vite/client" />

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface JournalData {
  entries: JournalEntry[];
}

interface SaveResult {
  success: boolean;
  entries?: JournalEntry[];
  error?: string;
}

interface ElectronAPI {
  getEntries: () => Promise<JournalData>;
  saveEntry: (entry: JournalEntry) => Promise<SaveResult>;
  deleteEntry: (entryId: string) => Promise<SaveResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
