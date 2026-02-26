import {
  getPendingActions,
  removePendingAction,
  type PendingAction,
} from "./db";
import { toggleMemorized } from "@/actions/words";
import { saveQuizResult } from "@/actions/quiz-history";

type ProgressCallback = (current: number, total: number) => void;

/**
 * Deduplicate: for TOGGLE_MEMORIZED, keep only the last action per wordId.
 * Returns the deduplicated actions to process and IDs to remove from queue.
 */
function deduplicateActions(actions: PendingAction[]) {
  const lastToggleByWord = new Map<string, PendingAction>();
  const others: PendingAction[] = [];

  for (const action of actions) {
    if (action.type === "TOGGLE_MEMORIZED") {
      const wordId = (action.payload as { wordId: string }).wordId;
      lastToggleByWord.set(wordId, action);
    } else {
      others.push(action);
    }
  }

  const keptActions = Array.from(lastToggleByWord.values());
  const keptIds = new Set<number>();
  for (const a of keptActions) {
    if (a.id !== undefined) keptIds.add(a.id);
  }
  for (const a of others) {
    if (a.id !== undefined) keptIds.add(a.id);
  }

  const idsToRemove: number[] = [];
  for (const a of actions) {
    if (a.id !== undefined && !keptIds.has(a.id)) {
      idsToRemove.push(a.id);
    }
  }

  return {
    actions: [...keptActions, ...others],
    idsToRemove,
  };
}

export async function syncPendingActions(
  onProgress?: ProgressCallback
): Promise<void> {
  const allActions = await getPendingActions();
  if (allActions.length === 0) return;

  // Deduplicate: e.g. 2000 toggles → ~500 unique words
  const { actions, idsToRemove } = deduplicateActions(allActions);

  // Remove duplicate entries from queue first
  for (const id of idsToRemove) {
    await removePendingAction(id).catch(() => {});
  }

  const total = actions.length;
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 3;

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    onProgress?.(i + 1, total);

    try {
      switch (action.type) {
        case "TOGGLE_MEMORIZED": {
          const { wordId, memorized } = action.payload as {
            wordId: string;
            memorized: boolean;
          };
          await toggleMemorized(wordId, memorized);
          break;
        }
        case "QUIZ_RESULT": {
          const payload = action.payload as {
            totalWords: number;
            correctCount: number;
            wrongCount: number;
            quizMode: string;
          };
          await saveQuizResult(payload);
          break;
        }
        case "CLEAR_SESSION": {
          break;
        }
      }

      if (action.id !== undefined) {
        await removePendingAction(action.id);
      }
      consecutiveFailures = 0;
    } catch {
      // Skip failed action, continue to next
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        // Likely network issue — stop and retry later
        break;
      }
    }
  }
}
