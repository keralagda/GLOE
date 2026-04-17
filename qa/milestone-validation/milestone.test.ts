import { Milestone, MILESTONE_SEQUENCE } from './milestones';
import { MilestoneValidator, Dispatch } from './validator';

describe('Vehicle Dispatch Milestone Validation', () => {
  let dispatch: Dispatch;

  beforeEach(() => {
    dispatch = {
      id: 'TRK-2026-001',
      currentMilestone: null,
      completedAt: null,
    };
  });

  test('should enforce starting with the first milestone', () => {
    const result = MilestoneValidator.validateTransition(
      dispatch,
      Milestone.EN_ROUTE_TO_PICKUP,
      new Date()
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('New dispatch must start at the first milestone.');
  });

  test('should allow starting with DISPATCH_ASSIGNED', () => {
    const result = MilestoneValidator.validateTransition(
      dispatch,
      Milestone.DISPATCH_ASSIGNED,
      new Date()
    );
    expect(result.valid).toBe(true);
  });

  test('should enforce sequential transition (N -> N+1)', () => {
    dispatch.currentMilestone = Milestone.DISPATCH_ASSIGNED;
    
    // Try to skip to ARRIVED_AT_PICKUP (Index 2) from Index 0
    const result = MilestoneValidator.validateTransition(
      dispatch,
      Milestone.ARRIVED_AT_PICKUP,
      new Date()
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Milestones must be completed sequentially');
  });

  test('should allow valid sequential transition', () => {
    dispatch.currentMilestone = Milestone.DISPATCH_ASSIGNED;
    const result = MilestoneValidator.validateTransition(
      dispatch,
      Milestone.EN_ROUTE_TO_PICKUP,
      new Date()
    );
    expect(result.valid).toBe(true);
  });

  test('should reject future timestamps beyond 5 minutes', () => {
    dispatch.currentMilestone = Milestone.DISPATCH_ASSIGNED;
    const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes future
    const result = MilestoneValidator.validateTransition(
      dispatch,
      Milestone.EN_ROUTE_TO_PICKUP,
      futureDate
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Future timestamps not allowed. Max grace is 5 minutes.');
  });

  test('should allow timestamps within 5 minutes grace', () => {
    dispatch.currentMilestone = Milestone.DISPATCH_ASSIGNED;
    const graceDate = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes future
    const result = MilestoneValidator.validateTransition(
      dispatch,
      Milestone.EN_ROUTE_TO_PICKUP,
      graceDate
    );
    expect(result.valid).toBe(true);
  });
});
