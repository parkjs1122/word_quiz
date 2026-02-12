interface QuizWord {
  id: string;
  word: string;
  meaning: string;
  memorized: boolean;
}

export interface SavedQuizSession {
  words: QuizWord[];
  currentIndex: number;
  memorizedCount: number;
  folderIds?: string[];
  savedAt: number;
}

const STORAGE_KEY_PREFIX = "word-quiz-session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

export function loadQuizSession(userId: string): SavedQuizSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(getKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedQuizSession;

    if (!Array.isArray(parsed.words) || parsed.words.length === 0) return null;
    if (typeof parsed.currentIndex !== "number" || parsed.currentIndex < 0) return null;
    if (parsed.currentIndex >= parsed.words.length) return null;
    if (typeof parsed.memorizedCount !== "number" || parsed.memorizedCount < 0) return null;
    if (typeof parsed.savedAt !== "number") return null;

    const hasValidWords = parsed.words.every(
      (w) =>
        typeof w.id === "string" &&
        typeof w.word === "string" &&
        typeof w.meaning === "string"
    );
    if (!hasValidWords) return null;

    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearQuizSession(userId);
      return null;
    }

    return parsed;
  } catch {
    clearQuizSession(userId);
    return null;
  }
}

export function saveQuizSession(
  userId: string,
  session: Omit<SavedQuizSession, "savedAt">
): void {
  if (typeof window === "undefined") return;

  try {
    const data: SavedQuizSession = {
      ...session,
      savedAt: Date.now(),
    };
    localStorage.setItem(getKey(userId), JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

export function clearQuizSession(userId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(getKey(userId));
  } catch {
    // fail silently
  }
}
