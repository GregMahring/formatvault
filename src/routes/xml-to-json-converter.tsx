import type { Route } from './+types/xml-to-json-converter';
import { buildMeta } from '@/lib/meta';
import { ConverterLayout } from '@/components/ConverterLayout';
import { xmlToJson } from '@/features/convert/converters';
import { ToolPageContent } from '@/components/ToolPageContent';

export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary';

export function meta(_args: Route.MetaArgs) {
  return buildMeta({
    title: 'XML to JSON Converter — Free, No Upload, Private',
    description:
      'Convert XML to JSON privately in your browser — no data uploaded. Preserves attributes, text nodes, and nested elements. Free, no account required, 100% client-side.',
    path: '/xml-to-json-converter',
    faqItems: [
      {
        q: 'Is it safe to convert XML that contains credentials or sensitive config?',
        a: 'Yes. fast-xml-parser runs entirely in your browser — your XML is never sent to any server. You can verify this in DevTools → Network.',
      },
      {
        q: 'How are XML attributes represented in JSON?',
        a: 'Attributes are prefixed with "@" in the JSON output (e.g. <item id="1"> becomes { "@id": 1 }). Text content of elements that also have attributes is stored under "#text".',
      },
      {
        q: 'What happens to XML namespaces?',
        a: 'Namespace prefixes are kept as-is in the JSON keys (e.g. <ns:element> becomes { "ns:element": ... }). Namespace declarations (xmlns:*) are treated as attributes.',
      },
      {
        q: 'Are attribute values parsed as numbers and booleans?',
        a: 'Yes. Numeric and boolean attribute values are parsed to their native JSON types (e.g. id="1" becomes "@id": 1). Wrap values in quotes if you need them to stay as strings.',
      },
    ],
  });
}

export default function XmlToJsonConverter() {
  return (
    <ConverterLayout
      title="XML → JSON Converter"
      fromLanguage="xml"
      toLanguage="json"
      fromPlaceholder={
        '<users>\n  <user id="1">\n    <name>Alice</name>\n    <role>admin</role>\n  </user>\n</users>'
      }
      convert={xmlToJson}
    >
      <ToolPageContent
        toolName="XML to JSON converter"
        why={
          <p className="text-fg-secondary">
            XML documents often contain credentials, internal hostnames, or proprietary data
            structures — especially SOAP responses, enterprise config files, and Android manifests.
            This converter processes your XML entirely in your browser using{' '}
            <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
              fast-xml-parser
            </code>
            . Nothing is uploaded or transmitted.
          </p>
        }
        howItWorks={
          <div className="space-y-3 text-fg-secondary">
            <p>
              The XML is first validated for well-formedness, then parsed into a JavaScript object
              tree. Attributes are mapped to{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                @prefixed
              </code>{' '}
              keys and element text content to{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                #text
              </code>
              . The resulting object is serialized with{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                JSON.stringify()
              </code>
              .
            </p>
            <p>
              Numeric and boolean attribute/element values are automatically parsed to their native
              JSON types. CDATA sections are preserved under{' '}
              <code className="rounded px-1 py-0.5 font-mono text-[0.85em] text-label-cyan bg-label-cyan/8">
                #cdata
              </code>
              .
            </p>
          </div>
        }
        useCases={[
          'Converting SOAP API responses to JSON for processing in JavaScript or Python',
          'Transforming Android AndroidManifest.xml into JSON for tooling or analysis',
          'Converting Maven pom.xml dependency trees to JSON for dependency graphing',
          'Parsing RSS or Atom XML feeds into JSON for a feed reader or aggregator',
          'Converting XML config files (Spring, Log4j) to JSON for migration tooling',
          'Exploring large XML responses from enterprise APIs without writing parsing code',
        ]}
        faq={[
          {
            q: 'Is it safe to convert XML that contains credentials or sensitive config?',
            a: 'Yes. fast-xml-parser runs entirely in your browser — your XML is never sent to any server. You can verify this in DevTools → Network.',
          },
          {
            q: 'How are XML attributes represented in JSON?',
            a: 'Attributes are prefixed with "@" in the JSON output (e.g. <item id="1"> becomes { "@id": 1 }). Text content of elements that also have attributes is stored under "#text".',
          },
          {
            q: 'What happens to XML namespaces?',
            a: 'Namespace prefixes are kept as-is in the JSON keys (e.g. <ns:element> becomes { "ns:element": ... }). Namespace declarations (xmlns:*) are treated as attributes.',
          },
          {
            q: 'Are attribute values parsed as numbers and booleans?',
            a: 'Yes. Numeric and boolean attribute values are parsed to their native JSON types (e.g. id="1" becomes "@id": 1). Wrap values in quotes if you need them to stay as strings.',
          },
        ]}
      />
    </ConverterLayout>
  );
}
