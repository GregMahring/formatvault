import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { MarkdownPreviewProps } from '@/components/MarkdownPreview';

// The preview panel is off by default; loading it on demand keeps marked and
// DOMPurify out of the formatter routes' initial bundle.
const MarkdownPreview = lazy(() =>
  import('@/components/MarkdownPreview').then((m) => ({ default: m.MarkdownPreview }))
);

export type LazyMarkdownPreviewProps = MarkdownPreviewProps;

export function LazyMarkdownPreview(props: LazyMarkdownPreviewProps) {
  return (
    <Suspense
      fallback={<LoadingSpinner className={props.className ?? ''} label="Loading preview…" />}
    >
      <MarkdownPreview {...props} />
    </Suspense>
  );
}
