import {
  getPendingActions,
  removePendingAction,
} from "./db";
import { toggleMemorized } from "@/actions/words";
import { saveQuizResult } from "@/actions/quiz-history";

type ProgressCallback = (current: number, total: number) => void;

export async function syncPendingActions(
  onProgress?: ProgressCallback
): Promise<void> {
  const actions = await getPendingActions();
  if (actions.length === 0) return;

  const total = actions.length;

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
          // Session already cleared locally; server session may have expired
          break;
        }
      }

      if (action.id !== undefined) {
        await removePendingAction(action.id);
      }
    } catch {
      // If a single action fails, skip it and continue
      // The action stays in the queue for next sync attempt
      break;
    }
  }
}
