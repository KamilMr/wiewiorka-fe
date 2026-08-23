import reducer, {addIncomePlan, mainEmptyState, replaceIncomePlan} from '../mainSlice';

const plan = {id: 'f_ip-1', owner: 'user' as const, ownerId: '1', yearMonth: '2026-08-01', amount: 5000};

describe('main income plans', () => {
  it('defaults to an empty collection', () => expect(mainEmptyState().incomePlans).toEqual([]));
  it('creates optimistically and replaces the temporary ID', () => {
    const optimistic = reducer(undefined, addIncomePlan(plan));
    expect(optimistic.incomePlans).toEqual([plan]);
    const serverPlan = {...plan, id: 'ip-server'};
    expect(reducer(optimistic, replaceIncomePlan({frontendId: plan.id, resp: serverPlan})).incomePlans).toEqual([serverPlan]);
  });
  it('hydrates safely when ini omits plans', () => {
    const state = reducer(undefined, {type: 'ini/fetchIni/fulfilled', payload: {expenses: [], income: [], categories: {}, budgets: []}});
    expect(state.incomePlans).toEqual([]);
  });
});
