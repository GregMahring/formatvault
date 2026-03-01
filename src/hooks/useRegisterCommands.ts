import { useEffect } from 'react';
import { type Command, useCommandStore } from '@/stores/commandStore';

/**
 * Register context-dependent commands on mount, unregister on unmount.
 * Callers must memoize the commands array (e.g. via useMemo) to avoid
 * unnecessary re-registrations.
 */
export function useRegisterCommands(commands: Command[]) {
  useEffect(() => {
    if (commands.length === 0) return;

    useCommandStore.getState().register(commands);

    const ids = commands.map((c) => c.id);
    return () => {
      useCommandStore.getState().unregister(ids);
    };
  }, [commands]);
}
