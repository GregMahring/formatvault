import { lazy, Suspense, useState } from 'react';
import type { KeyboardShortcutsModalProps } from '@/components/KeyboardShortcutsModal';

// Loaded on first open so @radix-ui/react-dialog stays out of every formatter and
// converter page's initial bundle.
const KeyboardShortcutsModal = lazy(() =>
  import('@/components/KeyboardShortcutsModal').then((m) => ({
    default: m.KeyboardShortcutsModal,
  }))
);

export type LazyKeyboardShortcutsModalProps = KeyboardShortcutsModalProps;

export function LazyKeyboardShortcutsModal(props: LazyKeyboardShortcutsModalProps) {
  // Stay mounted after the first open so Radix can return focus to the trigger on close.
  const [hasOpened, setHasOpened] = useState(props.isOpen);
  if (props.isOpen && !hasOpened) setHasOpened(true);
  if (!hasOpened) return null;

  return (
    <Suspense fallback={null}>
      <KeyboardShortcutsModal {...props} />
    </Suspense>
  );
}
