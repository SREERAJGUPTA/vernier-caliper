const KEY = 'precision-lab.rebuild.v2';
const PREFS = 'precision-lab.preferences.v2';
export function loadPreferences<T>(): T | null { try { const raw=localStorage.getItem(PREFS);return raw?JSON.parse(raw):null;}catch{return null;} }
export function savePreferences(value:unknown) {try{localStorage.setItem(PREFS,JSON.stringify(value));return true;}catch{return false;}}
export function loadSaved<T>(): T | null {
  try { const raw = localStorage.getItem(KEY); if (!raw) return null; const value = JSON.parse(raw); return value?.version === 2 ? value.payload as T : null; } catch { return null; }
}
export function saveLocal(payload: unknown) {
  try { localStorage.setItem(KEY, JSON.stringify({ version: 2, payload })); return true; } catch { return false; }
}
export function clearLocal() { try { localStorage.removeItem(KEY); return true; } catch { return false; } }

export function downloadText(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
