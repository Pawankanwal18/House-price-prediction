import { useEffect, useState } from 'react';
import { validPrediction } from '../services/api';

export function readStorage(key, fallback, validate) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return validate(data) ? data : fallback;
  } catch { return fallback; }
}

export function useTheme() {
  const [theme, setTheme] = useState(() => readStorage('housely.theme.v1', 'light', v => v === 'light' || v === 'dark'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('housely.theme.v1', JSON.stringify(theme)); } catch { /* The theme still works without storage. */ }
  }, [theme]);
  return [theme, () => setTheme(current => current === 'light' ? 'dark' : 'light')];
}

export function useHistory() {
  const [history, setHistory] = useState(() => readStorage('housely.history.v1', [], v => Array.isArray(v)
    && v.length <= 10 && v.every(item => validPrediction(item) && typeof item.id === 'string'
      && typeof item.saved_at === 'string' && Number.isFinite(Date.parse(item.saved_at)))));
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try { localStorage.setItem('housely.history.v1', JSON.stringify(history)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [history]);
  function add(result) {
    const record = { ...result, id: crypto.randomUUID(), saved_at: new Date().toISOString() };
    setHistory(current => [record, ...current].slice(0, 10));
    return record;
  }
  return { history, add, clear: () => setHistory([]), storageError };
}
