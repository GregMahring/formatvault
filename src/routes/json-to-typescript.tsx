import { useState, useCallback } from 'react';
import type { Route } from './+types/json-to-typescript';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToTypescript, type TypeGenOptions } from '@/features/convert/jsonToTypescript';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to TypeScript Converter — Free, No Upload, Private',
    description:
      'Convert JSON to TypeScript interfaces privately in your browser — no data uploaded. Handles nested objects, arrays, optional fields, and union types. Free, no account required.',
    path: '/json-to-typescript',
    faqItems: [
      {
        q: 'Is my data safe to convert here?',
        a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
      },
      {
        q: 'How are optional fields detected?',
        a: 'If a key appears in some objects in an array but not all, it is marked as optional (?) in the generated interface.',
      },
      {
        q: 'Are nested objects supported?',
        a: 'Yes. Nested objects generate nested named interfaces. The root interface is named Root by default.',
      },
      {
        q: 'What happens with arrays of mixed types?',
        a: 'Mixed-type arrays generate union types, e.g. (string | number)[].',
      },
    ],
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
    >
      <ToolPageContent
        toolName="JSON to TypeScript converter"
        why={
          <p className="text-fg-secondary">
            Generating TypeScript interfaces from JSON payloads helps you type API responses without
            writing types by hand. This converter runs entirely in your browser — no data is
            uploaded or transmitted, making it safe for internal API schemas.
          </p>
        }
        howItWorks={
          <p className="text-fg-secondary">
            The converter analyses the JSON structure recursively, infers the TypeScript type for
            each field (string, number, boolean, null, array, or nested interface), and generates
            named interfaces. Optional fields are detected when a key appears in some objects but
            not all. Arrays of mixed types produce union types.
          </p>
        }
        useCases={[
          'Generating TypeScript types for REST API responses without writing them by hand',
          'Typing GraphQL response payloads for use in React components',
          'Converting JSON Schema definitions to TypeScript interfaces',
          'Bootstrapping type definitions when integrating a new third-party API',
          'Converting internal JSON configs to typed TypeScript objects',
        ]}
        faq={[
          {
            q: 'Is my data safe to convert here?',
            a: 'Yes. All conversion happens in your browser. No data is transmitted to any server.',
          },
          {
            q: 'How are optional fields detected?',
            a: 'If a key appears in some objects in an array but not all, it is marked as optional (?) in the generated interface.',
          },
          {
            q: 'Are nested objects supported?',
            a: 'Yes. Nested objects generate nested named interfaces. The root interface is named Root by default but you can change it.',
          },
          {
            q: 'What happens with arrays of mixed types?',
            a: 'Mixed-type arrays generate union types, e.g. (string | number)[].',
          },
        ]}
      />
    </ConverterLayout>
  );
}
