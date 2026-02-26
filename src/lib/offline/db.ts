const DB_NAME = "word-quiz-offline";
const DB_VERSION = 1;

export interface LocalWord {
  id: string;
  word: string;
  meaning: string;
  memorized: boolean;
  level: number;
  nextReviewAt: string; // ISO string
  folderId: string | null;
}

export interface LocalFolder {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface PendingAction {
  id?: number; // autoIncrement
  type: "TOGGLE_MEMORIZED" | "QUIZ_RESULT" | "CLEAR_SESSION";
  payload: Record<string, unknown>;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("words")) {
        const wordStore = db.createObjectStore("words", { keyPath: "id" });
        wordStore.createIndex("by-folder", "folderId", { unique: false });
        wordStore.createIndex("by-memorized", "memorized", { unique: false });
      }

      if (!db.objectStoreNames.contains("folders")) {
        db.createObjectStore("folders", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("pendingActions")) {
        db.createObjectStore("pendingActions", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Words ---

export async function saveWordsToLocal(words: LocalWord[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("words", "readwrite");
  const store = tx.objectStore("words");
  store.clear();
  for (const w of words) {
    store.put(w);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getLocalWords(
  folderIds?: string[],
  memorizedFilter?: boolean
): Promise<LocalWord[]> {
  const db = await openDB();
  const tx = db.transaction("words", "readonly");
  const store = tx.objectStore("words");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      let words = request.result as LocalWord[];

      if (memorizedFilter !== undefined) {
        words = words.filter((w) => w.memorized === memorizedFilter);
      }

      if (folderIds && folderIds.length > 0) {
        const folderSet = new Set(folderIds);
        words = words.filter((w) => w.folderId && folderSet.has(w.folderId));
      }

      resolve(words);
    };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function getLocalReviewWords(
  folderIds?: string[]
): Promise<LocalWord[]> {
  const db = await openDB();
  const tx = db.transaction("words", "readonly");
  const store = tx.objectStore("words");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      const now = new Date().toISOString();
      let words = (request.result as LocalWord[]).filter(
        (w) => w.nextReviewAt <= now
      );

      if (folderIds && folderIds.length > 0) {
        const folderSet = new Set(folderIds);
        words = words.filter((w) => w.folderId && folderSet.has(w.folderId));
      }

      resolve(words);
    };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function updateLocalWord(
  id: string,
  changes: Partial<LocalWord>
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("words", "readwrite");
  const store = tx.objectStore("words");

  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, ...changes });
      }
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// --- Folders ---

export async function saveFoldersToLocal(
  folders: LocalFolder[]
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("folders", "readwrite");
  const store = tx.objectStore("folders");
  store.clear();
  for (const f of folders) {
    store.put(f);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getLocalFolders(): Promise<LocalFolder[]> {
  const db = await openDB();
  const tx = db.transaction("folders", "readonly");
  const store = tx.objectStore("folders");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      const folders = (request.result as LocalFolder[]).sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      resolve(folders);
    };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

// --- Pending Actions ---

export async function addPendingAction(
  action: Omit<PendingAction, "id">
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("pendingActions", "readwrite");
  tx.objectStore("pendingActions").add(action);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await openDB();
  const tx = db.transaction("pendingActions", "readonly");
  const store = tx.objectStore("pendingActions");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function removePendingAction(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("pendingActions", "readwrite");
  tx.objectStore("pendingActions").delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function clearPendingActions(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("pendingActions", "readwrite");
  tx.objectStore("pendingActions").clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// --- Meta ---

export async function getMetaValue(key: string): Promise<unknown | null> {
  const db = await openDB();
  const tx = db.transaction("meta", "readonly");
  const store = tx.objectStore("meta");

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => {
      db.close();
      resolve(request.result ? request.result.value : null);
    };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function setMetaValue(
  key: string,
  value: unknown
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("meta", "readwrite");
  tx.objectStore("meta").put({ key, value });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function isOfflineDataReady(): Promise<boolean> {
  try {
    const lastSync = await getMetaValue("lastSyncAt");
    return lastSync !== null;
  } catch {
    return false;
  }
}

// --- Quiz Session (offline fallback) ---

export async function saveQuizSessionToLocal(
  session: Record<string, unknown>
): Promise<void> {
  await setMetaValue("quizSession", session);
}

export async function loadQuizSessionFromLocal(): Promise<Record<
  string,
  unknown
> | null> {
  const session = await getMetaValue("quizSession");
  return session as Record<string, unknown> | null;
}

export async function clearQuizSessionFromLocal(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("meta", "readwrite");
  tx.objectStore("meta").delete("quizSession");
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
