// eventLogger.js
// Captures and persists raw user events (cursor, edits, file, custom) in browser IndexedDB

const DB_NAME = 'hyperpersonal-context-memory';
const LOG_STORE = 'eventLog';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LOG_STORE)) {
        db.createObjectStore(LOG_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function logEvent(event) {
  const db = await openDB();
  const tx = db.transaction(LOG_STORE, 'readwrite');
  tx.objectStore(LOG_STORE).add({ ...event, time: event.time || new Date().toISOString() });
  return tx.complete;
}

export async function getEvents({ since, type, file, limit = 1000 } = {}) {
  const db = await openDB();
  const tx = db.transaction(LOG_STORE, 'readonly');
  const store = tx.objectStore(LOG_STORE);
  const result = [];
  const req = store.openCursor(null, 'prev');
  let count = 0;
  return new Promise((resolve, reject) => {
    req.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor && count < limit) {
        const ev = cursor.value;
        if ((!since || ev.time >= since) && (!type || ev.type === type) && (!file || ev.file === file)) {
          result.push(ev);
          count++;
        }
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    req.onerror = reject;
  });
}

export default { logEvent, getEvents };
