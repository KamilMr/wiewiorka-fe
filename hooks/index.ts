import {selectStatus} from '@/redux/main/selectors';
import {
  useDispatch,
  useSelector,
  TypedUseSelectorHook,
  useStore,
} from 'react-redux';
import type {AppStore, RootState, AppDispatch} from '@/redux/store';
import {selectOperations} from '@/redux/sync/syncSlice';
import {useCallback, useEffect, useState} from 'react';
import * as mainThunks from '@/redux/main/thunks';
import {useNetInfo} from '@react-native-community/netinfo';
import {printJsonIndent} from '@/common';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {runOnJS, useSharedValue} from 'react-native-reanimated';
import {Dimensions} from 'react-native';
import {useKeyboardHandler} from 'react-native-keyboard-controller';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
const useAppDispatch = useDispatch.withTypes<AppDispatch>();
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
const useAppStore: () => AppStore = useStore;

const useIsLoading = () => {
  const isLoading = useAppSelector(selectStatus);
  return isLoading === 'fetching';
};

const handler = {
  main: mainThunks,
};

const useSync = () => {
  const operations = useAppSelector(selectOperations);
  const dispatch = useAppDispatch();
  const con = useNetInfo();

  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!con.isConnected) return;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (operations.length === 0) return;

    let nextOperation;

    let next;
    if ((next = operations.find(o => o.status === 'pending')))
      nextOperation = next;
    else if (
      (next = operations
        .filter(o => o.status === 'retrying' && o.nextRetryAt !== undefined)
        .sort((a, b) => a.nextRetryAt! - b.nextRetryAt!)[0])
    ) {
      const canRun = Date.now() - next.nextRetryAt!;
      if (canRun > 0) {
        if (timerId) clearTimeout(timerId);
        nextOperation = next;
      } else {
        timerId = setTimeout(() => {
          setReload(x => x + 1);
        }, Math.abs(canRun));
      }
    }

    if (!nextOperation) return;

    const {
      handler: handlerKey,
      path,
      data,
      method,
      id,
      cb,
      frontendId,
    } = nextOperation;

    if (handlerKey === 'genericSync') {
      const handlerThunks = handler[path[0] as keyof typeof handler];

      if (handlerThunks) {
        const thunk = handlerThunks.genericSync;

        if (thunk) {
          dispatch(
            thunk({
              path: path.slice(1),
              method,
              data,
              cb,
              operationId: id,
              frontendId,
            }),
          );
        }
      }
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [operations, con.isConnected, dispatch, reload]);
};

const useDev = () => {
  return useAppSelector(state => state.main.devMode);
};

const PADDING = 20;
/**
 * Custom hook for sophisticated keyboard avoidance using Reanimated
 * @param bottomY - The Y coordinate of the dropdown's bottom edge (measured once on layout)
 */
const useGradualAnimation = (bottomY: number, isDev = false) => {
  // Get safe area insets for accurate screen calculations
  const insets = useSafeAreaInsets();

  // SharedValue for smooth animations on UI thread
  const height = useSharedValue(PADDING);

  // React state for keyboard height (triggers re-renders)
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // React state for calculated margin offset (triggers re-renders)
  const [adjustedMargin, setAdjustedMargin] = useState(0);

  /**
   * Pure function that calculates the exact overlap between dropdown and keyboard
   * @param kbHeight - Current keyboard height from keyboard handler
   */
  const calculateOffset = useCallback(
    (kbHeight: number) => {
      // Early return if no keyboard or dropdown position not measured yet
      if (kbHeight === 0 || bottomY === 0) {
        setAdjustedMargin(0);
        return;
      }

      // FIXED: Calculate actual available screen height
      const windowHeight = Dimensions.get('window').height;
      const screenHeight = Dimensions.get('screen').height;

      // Account for status bar, navigation headers, and tab bars
      const availableHeight = windowHeight - insets.top - insets.bottom;

      // Calculate where keyboard top edge appears in available space
      // Using available height instead of full screen height
      const keyboardTopY = availableHeight - kbHeight + insets.top;

      // Calculate overlap: how much dropdown extends below keyboard top
      // Example: dropdownBottom=550px, keyboardTop=500px → overlap=50px
      // If no overlap (dropdown above keyboard), Math.max returns 0
      const overlap = Math.max(0, bottomY - keyboardTopY);

      // Store the calculated margin that will push dropdown up
      setAdjustedMargin(overlap);
    },
    [bottomY, insets.bottom, insets.top, isDev],
  );

  /**
   * Bridge function that updates state and triggers calculation
   * Called from worklet context via runOnJS
   */
  const updateHeight = (newHeight: number) => {
    setKeyboardHeight(newHeight); // Update React state
    calculateOffset(newHeight); // Recalculate margin with new keyboard height
  };

  // Recalculate when layout or insets change while keyboard is open
  useEffect(() => {
    calculateOffset(keyboardHeight);
  }, [keyboardHeight, calculateOffset]);

  // Hook into keyboard events for frame-by-frame tracking
  useKeyboardHandler({
    onStart: e => {
      'worklet'; // Runs on UI thread
      height.value = e.height; // Update SharedValue for potential animations
      runOnJS(updateHeight)(e.height); // Bridge to React thread for state updates
    },
    onMove: e => {
      'worklet'; // Runs on UI thread - called every frame during keyboard animation
      height.value = e.height; // Smooth SharedValue updates
      runOnJS(updateHeight)(e.height); // Update React state for re-renders
    },
    onEnd: e => {
      'worklet'; // Runs on UI thread
      height.value = e.height; // Final position
      runOnJS(updateHeight)(e.height); // Final state update
    },
  });

  return {height, keyboardHeight, adjustedMargin};
};

export {
  useGradualAnimation,
  useSync,
  useIsLoading,
  useAppSelector,
  useAppDispatch,
  useAppStore,
  useDev,
};
