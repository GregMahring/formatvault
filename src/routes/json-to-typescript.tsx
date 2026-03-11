import { useState, useCallback } from 'react';
import type { Route } from './+types/json-to-typescript';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToTypescript, type TypeGenOptions } from '@/features/convert/jsonToTypescript';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to TypeScript Converter',
    description:
      'Convert JSON to TypeScript interfaces and types online for free. Handles nested objects, arrays, optional fields, and union types. 100% client-side.',
    path: '/json-to-typescript',
  });
}

export default function JsonToTypescriptConverter() {
  const [rootName, setRootName] = useState('Root');
  const [style, setStyle] = useState<TypeGenOptions['style']>('interface');
  const [allOptional, setAllOptional] = useState(false);

  const convert = useCallback(
    (input: string) => jsonToTypescript(input, { rootName, style, allOptional }),
    [rootName, style, allOptional]
  );

  return (
    <ConverterLayout
      title="JSON → TypeScript"
      fromLanguage="json"
      toLanguage="typescript"
      fromPlaceholder='{"name": "Alice", "age": 30, "address": {"city": "NYC"}}'
      toPlaceholder="TypeScript interfaces will appear here..."
      convert={convert}
      toolbarSlot={
        <>
          <label htmlFor="ts-root-name" className="text-xs text-fg-secondary">
            Root name
          </label>
          <input
            id="ts-root-name"
            type="text"
            value={rootName}
            onChange={(e) => {
              setRootName(e.target.value || 'Root');
            }}
            className="w-24 rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
            placeholder="Root"
          />

          <label htmlFor="ts-style-select" className="text-xs text-fg-secondary">
            Style
          </label>
          <select
            id="ts-style-select"
            value={style}
            onChange={(e) => {
              setStyle(e.target.value as TypeGenOptions['style']);
            }}
            className="rounded border border-edge-emphasis bg-surface-raised px-2 py-1 text-xs text-fg focus:border-accent-500 focus:outline-none"
          >
            <option value="interface">interface</option>
            <option value="type">type</option>
          </select>

          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-secondary">
            <input
              type="checkbox"
              className="h-3 w-3 accent-accent-500"
              checked={allOptional}
              onChange={(e) => {
                setAllOptional(e.target.checked);
              }}
            />
            All optional
          </label>
        </>
      }
    />
  );
}
