# Sync Slice Documentation

## Overview

The sync slice implements an offline-first synchronization system for the Wiewiorka finance application. In modern mobile applications, users expect to continue working even when their network connection is unreliable or unavailable. Rather than blocking the user interface or displaying errors, this system allows all data modifications to happen immediately in the local Redux state while queueing the server synchronization for later.

### Why Offline-First?

When a user adds an expense while riding the subway or edits a budget item in an area with poor reception, the application doesn't freeze or display connection errors. Instead, the changes are immediately visible in the UI and stored locally. Behind the scenes, the sync slice maintains a queue of operations that need to be sent to the server. When connectivity is restored, these operations are processed automatically in the background.

This approach provides several key benefits:

1. **Immediate Feedback**: Users see their changes instantly without waiting for network requests
2. **Resilient Experience**: Network interruptions don't disrupt the user's workflow
3. **Automatic Recovery**: Failed operations are automatically retried with fixed delay
4. **Data Integrity**: The queue system ensures operations are processed in the correct order
5. **Transparency**: Users can see which operations are pending and investigate any failures

### The Sync Queue Model

At its core, the sync slice is a queue of operations waiting to be synchronized with the server. Each operation represents a single HTTP request (POST, PUT, DELETE, or PATCH) that needs to be made to a specific API endpoint. Operations are added to the queue when users create, update, or delete data locally. A separate sync processor (typically implemented as a thunk or middleware) pulls operations from the queue and attempts to execute them.

The queue isn't just a simple FIFO structure. It includes intelligent optimization logic that prevents redundant operations. For example, if a user creates an expense and then immediately deletes it before either operation syncs, the queue automatically removes both operations since they cancel each other out. This reduces unnecessary network traffic and prevents confusing server-side state changes.

## State Shape

The sync slice maintains five distinct pieces of state, each serving a specific purpose in the synchronization lifecycle:

### pendingOperations

This is an array of `SyncOperation` objects representing all operations waiting to be synchronized or currently being processed. Each operation contains:

- **id**: A unique identifier generated when the operation is added to the queue (format: `sync_XXXXXXXX`)
- **path**: An array of strings representing the API endpoint path (e.g., `['main', 'expenses']` maps to `/main/expenses`)
- **method**: The HTTP method for this operation (POST, PUT, DELETE, or PATCH)
- **data**: The request payload for POST, PUT, and PATCH operations (omitted for DELETE)
- **frontendId**: A crucial identifier that links the operation to the local Redux state. For new items, this is a temporary ID starting with `f_`. For updates and deletes, this is the server ID
- **handler**: Identifies which thunk or function should process this operation
- **status**: Current lifecycle state (pending, processing, retrying, or failed)
- **timestamp**: When the operation was created (milliseconds since epoch)
- **retryCount**: How many times this operation has been attempted
- **lastAttempt**: Timestamp of the most recent sync attempt
- **nextRetryAt**: When the next retry should occur (only set for retrying status)

The `frontendId` deserves special attention because it's the bridge between optimistic local state and eventual server state. When a user creates a new expense, the application assigns it a temporary ID like `f_abc12345`. This ID is stored as the `frontendId` in the sync operation. When the POST request succeeds, the server returns a permanent ID. The sync handler is responsible for updating the Redux state to replace the temporary ID with the permanent one, maintaining referential integrity.

### isSyncing

A boolean flag indicating whether a sync operation is currently in progress. This prevents multiple concurrent sync attempts from interfering with each other. The sync processor should check this flag before starting work and set it to true immediately when beginning. This creates a simple locking mechanism that ensures operations are processed sequentially.

Sequential processing is important because some operations may depend on previous ones. For example, you can't update an expense on the server until the POST that created it has completed and returned the server ID. While the queue itself doesn't enforce operation dependencies (that's the responsibility of the sync processor), this flag ensures operations don't execute concurrently and potentially interfere with each other.

### lastSyncTimestamp

Records the last time a sync operation completed successfully (in milliseconds since epoch). This is primarily used for debugging and user transparency. The application can display "Last synced 5 minutes ago" to help users understand the current sync state. It can also be used to trigger periodic background syncs or to detect if it's been too long since the last successful sync.

Note that this timestamp updates only on successful syncs, not on retry attempts or failures. This means it represents the last time we know for certain that the client and server states were aligned.

### syncErrors

A dictionary mapping operation IDs to error messages. When an operation fails (either permanently or before a retry), the error message is stored here. This allows the UI to display specific error information to users, helping them understand what went wrong and potentially take corrective action.

The error messages are stored separately from the operations themselves to make it easy to clear errors without modifying the operation structure. When an operation is retried or removed from the queue, the corresponding error is automatically cleaned up.

### shouldReload

A boolean flag that can be set to indicate the application should perform a full data reload from the server. This is typically used after a catastrophic sync failure or when the sync system detects that local and server states have diverged too far to reconcile through normal sync operations.

For example, if a user has been offline for an extended period and another user (in a shared household) has made extensive changes via a different device, it might be safer to discard the local changes and reload fresh data rather than attempting to merge potentially conflicting states.

## Operation Lifecycle

Operations flow through a well-defined lifecycle with four distinct states. Understanding these transitions is essential for both implementing sync handlers and debugging sync issues.

### Pending → Processing

When an operation is first added to the queue, it receives the `pending` status. This means it's waiting for the sync processor to pick it up. The sync processor periodically checks the queue for pending operations and, if no other operation is currently processing (isSyncing is false), selects the next pending operation to execute.

Before making the HTTP request, the processor calls `setOperationStatus` to transition the operation to `processing`. This serves two purposes: it prevents other sync attempts from picking up the same operation, and it records the `lastAttempt` timestamp. The processing state means "a network request is currently in flight for this operation."

### Processing → Success (Removed from Queue)

If the HTTP request succeeds, the operation is simply removed from the queue using `removeFromQueue`. There's no "success" status because successful operations don't remain in the queue at all. The sync processor is responsible for updating the main application state based on the server's response before removing the operation.

For example, when a POST expense operation succeeds, the handler must:
1. Extract the server-generated ID from the response
2. Update the expense in the main slice, replacing the temporary `f_` ID with the permanent ID
3. Remove the operation from the sync queue
4. Update `lastSyncTimestamp`

This ensures the application state accurately reflects what's on the server before declaring the sync complete.

### Processing → Retrying

If the HTTP request fails with a transient error (network timeout, 5xx server error, etc.), the sync processor calls `incrementRetryCount`. This reducer checks if the operation has exceeded the maximum retry limit (default: 3 attempts).

If retries remain, the operation transitions to `retrying` status and `nextRetryAt` is set to the current time plus the retry delay (default: 3 minutes). The `retrying` status tells the sync processor "don't process this operation yet; wait until nextRetryAt has passed."

This implements a simple time-based backoff strategy. Each failed attempt waits the same 3-minute interval before retrying. This gives temporary network issues time to resolve while preventing aggressive retry loops that could waste battery and bandwidth.

### Retrying → Processing

When the sync processor runs and finds a retrying operation whose `nextRetryAt` timestamp has passed, it transitions the operation back to `processing` and attempts the HTTP request again. This cycle continues until either the operation succeeds or exceeds the maximum retry count.

### Processing → Failed (Permanent Failure)

If an operation exceeds the maximum retry count (3 attempts), `incrementRetryCount` transitions it to `failed` status. Failed operations remain in the queue indefinitely, allowing users to investigate the failure and decide how to handle it.

When an operation fails permanently, the reducer also logs detailed information to Crashlytics, including the operation type, method, path, retry count, and frontend ID. This telemetry helps developers identify systemic sync issues and improve the sync system's reliability.

Users can manually retry a failed operation (which resets its retry count and status to pending) or discard it from the queue entirely.

## Reducers

The sync slice provides 14 reducers, each handling a specific aspect of the queue lifecycle. These can be grouped into five functional categories:

### Queue Management

**addToQueue**: This is the primary entry point for new sync operations. It accepts a partial operation object (missing the generated fields like id, timestamp, retryCount, and status) and creates a complete operation ready for the queue.

The reducer doesn't simply append the operation to the queue. It first runs through smart optimization logic that detects and eliminates redundant operations. This logic is particularly important for DELETE operations:

- If a DELETE operation targets a frontendId starting with `f_` (indicating an unsynced creation), the reducer removes all existing operations for that frontendId and doesn't add the DELETE. This is because the item never reached the server, so there's nothing to delete remotely.
- If a DELETE targets a synced item (server ID), all existing operations for that frontendId are removed and only the DELETE is added. This ensures that if a user creates, modifies, and then deletes an item, only the DELETE reaches the server.
- For POST and PUT operations, no optimization occurs; they're simply appended to maintain the correct operation order.

**removeFromQueue**: Removes an operation by its ID and cleans up any associated error message. This is called when an operation succeeds or when a user manually discards a failed operation.

**clearQueue**: Removes all operations and errors from the queue. This is a destructive operation typically used only during logout or when performing a full application reset. It should be used with caution since it discards all pending changes.

### Status Management

**setSyncingStatus**: Sets the isSyncing flag to prevent concurrent sync operations. The sync processor should set this to true before processing any operation and false when processing completes (whether successful or failed).

**setLastSyncTimestamp**: Records the current time as the last successful sync. This should be called only when an operation completes successfully, not when it fails or starts processing.

**setOperationStatus**: Updates an operation's status field. This is used to transition operations between lifecycle states. When transitioning to `processing`, it also records the `lastAttempt` timestamp.

### Error Handling

**setSyncError**: Stores an error message for a specific operation. This should be called whenever an operation fails, whether it will be retried or has permanently failed.

**clearSyncError**: Removes the error message for an operation. This is typically called when retrying an operation or when the user acknowledges the error.

### Retry Management

**incrementRetryCount**: This reducer implements the core retry logic. It increments the operation's retry count, records the attempt timestamp, and determines whether the operation should retry or fail permanently.

The reducer enforces the maximum retry limit (default 3, but can be overridden per-operation). If the limit is exceeded, it transitions to `failed` status and logs detailed telemetry to Crashlytics. Otherwise, it transitions to `retrying` and calculates the `nextRetryAt` timestamp.

The retry delay is fixed at 3 minutes for all retries. This simplistic strategy prioritizes simplicity over sophisticated backoff algorithms. If network conditions are poor, waiting 3 minutes between attempts is usually sufficient for transient issues to resolve.

**retryOperation**: Manually resets a failed operation back to pending state. This gives users control over when to retry after investigating a failure. It resets the retry count to 0, clears the status fields, and removes any associated error message. **Important**: This reducer only works on operations with `failed` status to prevent accidentally resetting in-progress operations.

**retryAllFailed**: Convenience reducer that calls retryOperation logic for all failed operations. This is useful when a systemic issue (like device network settings) has been resolved and the user wants to retry everything at once.

### Cleanup Operations

**discardOperation**: Permanently removes a failed operation from the queue. Unlike removeFromQueue (which can remove any operation), discardOperation includes a safety check that only removes operations with `failed` status. This prevents accidentally discarding pending or in-progress operations.

**discardAllFailed**: Removes all failed operations from the queue at once. This is useful when a user has been offline for an extended period and decides to abandon all pending changes in favor of reloading fresh data from the server.

**dropSync**: Returns the slice to its initial empty state. This is typically called during logout to ensure the next user doesn't see sync operations from the previous user.

### Development Utilities

**addTestFailedOperations**: A development-only reducer that adds several mock failed operations to the queue. This is used for testing the failed operations UI and retry flows without needing to trigger actual network failures. The reducer checks `__DEV__` and does nothing in production builds.

## Selectors

The slice exports three selectors for accessing sync state:

**selectOperations**: Returns the full pendingOperations array. Use this when you need access to all operations regardless of status, such as when displaying a full sync queue view.

**selectFailedOperations**: Returns only operations with `failed` status. This is used to display a warning indicator when there are failures requiring user attention.

**selectFailedOperationsCount**: Returns the number of failed operations. This is useful for badge counts or simple "you have X failed syncs" messages without needing to iterate the full array in the component.

These selectors are intentionally simple. More complex filtering (e.g., "all retrying operations ready for retry") should be done in the sync processor or in component-specific selectors to keep the slice focused on core state management.

## Smart Queue Optimization

The most sophisticated logic in the sync slice is the queue optimization performed in `addToQueue`. This system prevents redundant network traffic by recognizing when operations cancel each other out or supersede previous operations.

### DELETE Optimization for Unsynced Items

When a user creates an item (POST), it receives a temporary frontend ID starting with `f_`. If the user deletes that item before it syncs to the server, there's no need to send any network requests at all. The item never existed on the server, so there's nothing to create and nothing to delete.

The reducer detects this scenario by checking if a DELETE operation's frontendId starts with `f_`. If so, it removes all existing operations for that frontendId from the queue and doesn't add the DELETE. This completely eliminates both the POST and the DELETE from the sync queue.

This is particularly important for user experience. If a user quickly creates and deletes an expense (perhaps they made a data entry mistake), they don't want to wait for both operations to sync. With this optimization, the operations disappear from the queue entirely, and the user never sees sync indicators for those changes.

### DELETE Optimization for Synced Items

When deleting an item that has already been synced to the server (frontendId is a server ID, not starting with `f_`), any previous operations for that item become irrelevant. If there was a pending PUT to update the item, there's no point in executing it since we're about to delete the item anyway.

The reducer handles this by removing all existing operations for the frontendId and adding only the DELETE. This ensures that regardless of how many pending modifications existed, only a single DELETE request reaches the server.

This optimization is especially important in poor network conditions. Imagine a user makes several edits to an expense while offline, then decides to delete it. Without optimization, the sync system would execute multiple PUT requests followed by a DELETE. With optimization, only the DELETE executes, significantly reducing sync time.

### Why POST and PUT Aren't Optimized

You might wonder why the reducer doesn't optimize sequential PUT operations (e.g., replacing two PUT operations with a single PUT containing the final state). This is an intentional design decision.

First, the sync system doesn't have enough semantic knowledge to safely merge PUT operations. If the first PUT updates `{price: 100}` and the second updates `{category: 'Food'}`, the system would need to merge these into `{price: 100, category: 'Food'}`. But what if the second PUT intentionally omitted price to reset it to a default? The merge logic would incorrectly preserve the price field.

Second, maintaining operation order matters for audit trails and business logic. Each PUT might represent a distinct user action that should be recorded separately in server logs or history tables.

Third, the optimization complexity isn't worth the benefit. DELETE optimization eliminates network requests entirely (major benefit), while PUT merging would only reduce request count marginally (minor benefit) at the cost of significantly more complex logic and potential bugs.

## Retry Strategy

The retry strategy is intentionally simple and conservative. When an operation fails, it waits exactly 3 minutes before retrying, regardless of the failure reason or retry count. After 3 failed attempts, the operation transitions to permanent failure.

### Why Fixed Delay Instead of Exponential Backoff?

Most sophisticated sync systems use exponential backoff (1 minute, 2 minutes, 4 minutes, etc.) to reduce server load and respect rate limits. This implementation uses a fixed 3-minute delay for several reasons:

First, the application's typical failure mode is network connectivity issues, not server overload. When a user is on a subway, retrying after 1 minute vs 3 minutes doesn't matter; the network still won't work. When they exit the subway, the first retry attempt will likely succeed regardless of timing.

Second, exponential backoff adds significant complexity to the retry logic. The reducer would need to track which retry attempt this is and calculate different delays accordingly. The fixed delay keeps the code simple and easy to understand.

Third, this is a personal finance app with relatively low traffic, not a high-scale distributed system. Server overload from aggressive retries is not a realistic concern.

The 3-minute delay is long enough to avoid rapid retry loops that drain battery but short enough that users typically don't notice the delay. By the time they check their sync status, the retry has usually already completed.

### Maximum Retry Count

The maximum of 3 attempts is a balance between persistence and user experience. Three attempts means:
- Attempt 1: Immediate failure detection
- Attempt 2: After 3 minutes (catches brief network outages)
- Attempt 3: After 6 minutes (catches longer network issues)

If an operation still fails after 6 minutes and 3 attempts, it's likely not a transient network issue. Either the user is in a sustained network dead zone, or there's a genuine error in the operation data (validation failure, permission issue, etc.). At this point, requiring user intervention is appropriate.

The maximum retry count can be overridden per-operation by passing `maxRetries` to `incrementRetryCount`. This allows special handling for critical operations that deserve more retry attempts.

### Crashlytics Integration

When an operation fails permanently, the reducer logs comprehensive telemetry to Firebase Crashlytics. This includes:
- Operation type (expense, income, budget, etc.) derived from the path
- HTTP method (POST, PUT, DELETE, PATCH)
- Full API path
- Frontend ID
- Final retry count

This telemetry serves two purposes. First, it helps developers identify systemic sync issues. If many users experience failures on a specific operation type, that indicates a bug in the sync handler or API endpoint. Second, it provides context for user support. If a user reports sync problems, support can look up the specific failed operations and provide targeted assistance.

The logging uses both `log` (for searchable attributes) and `logError` (for error tracking and alerting). This ensures failed syncs appear in both Crashlytics logs and error reports, making them easy to find regardless of how you're investigating the issue.
