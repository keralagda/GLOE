import { Milestone, MILESTONE_SEQUENCE } from './milestones';

export interface Dispatch {
  id: string;
  currentMilestone: Milestone | null;
  completedAt: Date | null;
}

export class MilestoneValidator {
  /**
   * Validates if a milestone transition is valid.
   * Rule 1: Sequential Locking (N -> N+1).
   * Rule 2: Future timestamps not allowed (Max 5m grace).
   */
  static validateTransition(
    dispatch: Dispatch,
    targetMilestone: Milestone,
    completedAt: Date
  ): { valid: boolean; error?: string } {
    const targetIndex = MILESTONE_SEQUENCE.indexOf(targetMilestone);
    const currentIndex = dispatch.currentMilestone 
      ? MILESTONE_SEQUENCE.indexOf(dispatch.currentMilestone) 
      : -1;

    // Rule 1: Sequential Locking
    if (currentIndex === -1) {
      if (targetIndex !== 0) {
        return { valid: false, error: 'New dispatch must start at the first milestone.' };
      }
    } else if (targetIndex !== currentIndex + 1) {
      return { 
        valid: false, 
        error: `Invalid transition. Milestones must be completed sequentially (from ${dispatch.currentMilestone} to ${MILESTONE_SEQUENCE[currentIndex + 1]}).` 
      };
    }

    // Rule 2: Timestamp Validation
    const now = new Date();
    const maxAllowed = new Date(now.getTime() + 5 * 60 * 1000);
    if (completedAt > maxAllowed) {
      return { valid: false, error: 'Future timestamps not allowed. Max grace is 5 minutes.' };
    }

    return { valid: true };
  }
}
