import type { Route } from './+types/json-to-xml-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { jsonToXml } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'JSON to XML Converter — Free, No Upload, Private',
    description:
      'Convert JSON to XML privately in your browser — no data uploaded. Keys prefixed with "@" become attributes, preserves nesting and types. Free, no account required, 100% client-side.',
    path: '/json-to-xml-converter',
    faqItems: [
      {
        q: 'Is it safe to convert JSON that contains credentials or sensitive data?',
        a: 'Yes. fast-xml-parser runs entirely in your browser — your JSON is never sent to any server. You can verify this in DevTools → Network.',
      },
      {
        q: 'How do I produce XML attributes from JSON?',
        a: 'Prefix any JSON key with "@" and it will be serialized as an XML attribute. For example, { "item": { "@id": 1, "#text": "hello" } } produces <item id="1">hello</item>.',
      },
      {
        q: 'What happens if my JSON has multiple top-level keys?',
        a: 'XML requires a single root element. If your JSON object has more than one top-level key, the converter automatically wraps them in a <root> element and shows a warning.',
      },
      {
        q: 'Can I convert a JSON array to XML?',
        a: 'Not directly — XML has no concept of a bare array root. Wrap the array in an object first: { "items": [ ... ] }. Each array item will become a repeated <items> child element.',
      },
    ],
  });
}

export default function JsonToXmlConverter() {
  return (
    <ConverterLayout
      title="JSON → XML Converter"
      fromLanguage="json"
      toLanguage="xml"
      fromPlaceholder={
        '{\n  "users": {\n    "user": [\n      { "@id": "1", "name": "Alice", "role": "admin" },\n      { "@id": "2", "name": "Bob", "role": "user" }\n    ]\n  }\n}'
      }
      convert={jsonToXml}
    >
      <ToolPageContent
        toolName="JSON to XML converter"
        why={
          <p className="text-fg-secondary">
            Many enterprise systems, legacy APIs, and config formats still require XML as input.
            This converter transforms your JSON to well-formed XML entirely in your browser using{' '}
            <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
              fast-xml-parser
            </code>
            . Your data never leaves the tab.
          </p>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              The JSON is parsed and passed to{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
                XMLBuilder
              </code>
              , which maps JSON keys to XML elements. Keys starting with{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
                @
              </code>{' '}
              become element attributes, and{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
                #text
              </code>{' '}
              becomes the text content of a mixed element. The output includes an XML declaration
              and is indented for readability.
            </p>
            <p>
              XML requires a single root element. If your JSON object has multiple top-level keys,
              they are automatically wrapped in a{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-brand-cyan bg-[#00d4e8]/8">
                {'<root>'}
              </code>{' '}
              element. JSON arrays of objects produce repeated sibling elements with the same tag
              name.
            </p>
          </div>
        }
        useCases={[
          'Building SOAP request bodies from a JSON payload for legacy enterprise APIs',
          'Generating Android XML resource files (strings.xml, layout attributes) from JSON config',
          'Producing Maven pom.xml structures from a JSON dependency manifest',
          'Converting JSON API responses to XML for systems that only accept XML input',
          'Generating RSS or Atom feed XML from a JSON content source',
          'Preparing XML fixtures for testing XML parsers and deserializers',
        ]}
        faq={[
          {
            q: 'Is it safe to convert JSON that contains credentials or sensitive data?',
            a: 'Yes. fast-xml-parser runs entirely in your browser — your JSON is never sent to any server. You can verify this in DevTools → Network.',
          },
          {
            q: 'How do I produce XML attributes from JSON?',
            a: 'Prefix any JSON key with "@" and it will be serialized as an XML attribute. For example, { "item": { "@id": 1, "#text": "hello" } } produces <item id="1">hello</item>.',
          },
          {
            q: 'What happens if my JSON has multiple top-level keys?',
            a: 'XML requires a single root element. If your JSON object has more than one top-level key, the converter automatically wraps them in a <root> element and shows a warning.',
          },
          {
            q: 'Can I convert a JSON array to XML?',
            a: 'Not directly — XML has no concept of a bare array root. Wrap the array in an object first: { "items": [ ... ] }. Each array item will become a repeated <items> child element.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
