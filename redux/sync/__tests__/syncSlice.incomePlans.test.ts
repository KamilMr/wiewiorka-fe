import reducer, {
  addToQueue,
  discardOperation,
  incrementRetryCount,
  replaceQueuedOperationTarget,
  setOperationStatus,
  updateQueuedOperationData,
} from '../syncSlice';

jest.mock('@/utils/crashlytics', () => ({
  log: jest.fn(),
  logError: jest.fn(),
  setAttribute: jest.fn(),
}));

describe('income plan sync queue', () => {
  it('merges offline edits into the pending create request', () => {
    const queued = reducer(undefined, addToQueue({
      path: ['main', 'income-plan'],
      method: 'POST',
      handler: 'genericSync',
      data: {yearMonth: '2026-08-01', amount: 5000},
      cb: 'replaceIncomePlan',
      frontendId: 'f_ip-1',
    }));

    const updated = reducer(queued, updateQueuedOperationData({
      frontendId: 'f_ip-1',
      data: {amount: 6000},
    }));

    expect(updated.pendingOperations).toHaveLength(1);
    expect(updated.pendingOperations[0]).toMatchObject({
      method: 'POST',
      data: {yearMonth: '2026-08-01', amount: 6000},
    });
  });

  it('rewrites dependent operations after the server assigns an ID', () => {
    let state = reducer(undefined, addToQueue({
      path: ['main', 'income-plan'],
      method: 'POST',
      handler: 'genericSync',
      data: {yearMonth: '2026-08-01', amount: 5000},
      cb: 'replaceIncomePlan',
      frontendId: 'f_ip-1',
    }));
    state = reducer(state, addToQueue({
      path: ['main', 'income-plan', 'f_ip-1'],
      method: 'PATCH',
      handler: 'genericSync',
      data: {amount: 6000},
      cb: 'replaceIncomePlan',
      frontendId: 'f_ip-1',
    }));

    const updated = reducer(state, replaceQueuedOperationTarget({
      frontendId: 'f_ip-1',
      serverId: 'ip-server',
    }));

    expect(updated.pendingOperations[1]).toMatchObject({
      path: ['main', 'income-plan', 'ip-server'],
      frontendId: 'ip-server',
    });
  });

  it('queues delete behind an in-flight create', () => {
    let state = reducer(undefined, addToQueue({
      path: ['main', 'income-plan'],
      method: 'POST',
      handler: 'genericSync',
      data: {yearMonth: '2026-08-01', amount: 5000},
      cb: 'replaceIncomePlan',
      frontendId: 'f_ip-1',
    }));
    const createId = state.pendingOperations[0].id;
    state = reducer(state, setOperationStatus({
      operationId: createId,
      status: 'processing',
    }));
    state = reducer(state, addToQueue({
      path: ['main', 'income-plan', 'f_ip-1'],
      method: 'DELETE',
      handler: 'genericSync',
      data: {},
      cb: 'deleteIncomePlan',
      frontendId: 'f_ip-1',
    }));

    expect(state.pendingOperations.map(operation => operation.method)).toEqual([
      'POST',
      'DELETE',
    ]);
  });

  it('discards dependent operations with a failed temporary create', () => {
    let state = reducer(undefined, addToQueue({
      path: ['main', 'income-plan'],
      method: 'POST',
      handler: 'genericSync',
      data: {yearMonth: '2026-08-01', amount: 5000},
      cb: 'replaceIncomePlan',
      frontendId: 'f_ip-1',
    }));
    state = reducer(state, addToQueue({
      path: ['main', 'income-plan', 'f_ip-1'],
      method: 'PATCH',
      handler: 'genericSync',
      data: {amount: 6000},
      cb: 'replaceIncomePlan',
      frontendId: 'f_ip-1',
    }));
    const createId = state.pendingOperations[0].id;
    state = reducer(state, incrementRetryCount({operationId: createId, maxRetries: 1}));
    state = reducer(state, discardOperation(createId));

    expect(state.pendingOperations).toEqual([]);
  });
});
