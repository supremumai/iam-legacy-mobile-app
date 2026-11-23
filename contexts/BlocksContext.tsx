import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { deleteBlock, fetchBlockedIds, insertBlock } from '../lib/moderation';

interface BlocksContextValue {
  blockedIds: Set<string>;
  /** Stable string of the blocked set — use as an effect dependency to refetch on change. */
  blockedKey: string;
  /** False until the first fetch for the current user has settled. */
  loaded: boolean;
  isBlocked: (userId: string | null | undefined) => boolean;
  /** Optimistic: the set updates immediately, and reverts if the write fails. */
  block: (userId: string) => Promise<boolean>;
  unblock: (userId: string) => Promise<boolean>;
  refreshBlocks: () => Promise<void>;
}

const EMPTY = new Set<string>();

const BlocksContext = createContext<BlocksContextValue>({
  blockedIds: EMPTY,
  blockedKey: '',
  loaded: false,
  isBlocked: () => false,
  block: async () => false,
  unblock: async () => false,
  refreshBlocks: async () => {},
});

export function BlocksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [blockedIds, setBlockedIds] = useState<Set<string>>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  const refreshBlocks = useCallback(async () => {
    if (!userId) {
      setBlockedIds(EMPTY);
      setLoaded(true);
      return;
    }
    try {
      setBlockedIds(new Set(await fetchBlockedIds(userId)));
    } catch (e) {
      console.warn('[Blocks] fetch failed:', e);
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    setLoaded(false);
    setBlockedIds(EMPTY);
    refreshBlocks();
  }, [refreshBlocks]);

  const block = useCallback(
    async (targetId: string) => {
      if (!userId || targetId === userId) return false;
      setBlockedIds((prev) => new Set(prev).add(targetId));
      const err = await insertBlock(userId, targetId);
      if (err) {
        setBlockedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        return false;
      }
      return true;
    },
    [userId],
  );

  const unblock = useCallback(
    async (targetId: string) => {
      if (!userId) return false;
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      const err = await deleteBlock(userId, targetId);
      if (err) {
        setBlockedIds((prev) => new Set(prev).add(targetId));
        return false;
      }
      return true;
    },
    [userId],
  );

  const value = useMemo<BlocksContextValue>(
    () => ({
      blockedIds,
      blockedKey: [...blockedIds].sort().join(','),
      loaded,
      isBlocked: (id) => !!id && blockedIds.has(id),
      block,
      unblock,
      refreshBlocks,
    }),
    [blockedIds, loaded, block, unblock, refreshBlocks],
  );

  return <BlocksContext.Provider value={value}>{children}</BlocksContext.Provider>;
}

export function useBlocks() {
  return useContext(BlocksContext);
}
