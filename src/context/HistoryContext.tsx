import { createContext, useContext, useState } from "react";

export interface HistoryEntry {
  id: string;
  question: string;
  answer: string;
  providers: string[];
  complexity: string;
  debate?: unknown | null;
  cost: number | null;
  timestamp: number;
}

interface HistoryCtx {
  entries: HistoryEntry[];
  add: (entry: HistoryEntry) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const HistoryContext = createContext<HistoryCtx>({
  entries: [],
  add: () => {},
  remove: () => {},
  clear: () => {},
});

const STORAGE_KEY = "debate_history";
const MAX_ENTRIES = 50;

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>(load);

  const add = (entry: HistoryEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      save(next);
      return next;
    });
  };

  const remove = (id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      save(next);
      return next;
    });
  };

  const clear = () => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <HistoryContext.Provider value={{ entries, add, remove, clear }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}
