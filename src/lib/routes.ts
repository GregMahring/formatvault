import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Binary,
  Braces,
  CalendarClock,
  Database,
  FileCode2,
  FileJson,
  FileText,
  Globe,
  Hash,
  KeyRound,
  Lock,
  Pipette,
  Slash,
  Timer,
} from 'lucide-react';

export type RouteGroup = 'Formatters' | 'Converters' | 'Utilities';

export interface ToolRoute {
  /** Unique identifier — used as command palette id prefix (e.g. 'json-formatter') */
  id: string;
  /** Full display name used in the command palette and page titles */
  label: string;
  /**
   * Shorter label for header nav dropdowns.
   * Falls back to `label` when omitted.
   */
  navLabel?: string;
  /** Route path */
  path: string;
  /** Navigation group */
  group: RouteGroup;
  /** Lucide icon for the command palette entry */
  icon: LucideIcon;
  /** Additional search terms for the command palette fuzzy search */
  keywords?: readonly string[];
}

export const TOOL_ROUTES: readonly ToolRoute[] = [
  // ── Formatters ──────────────────────────────────────────────────────────
  {
    id: 'json-formatter',
    label: 'JSON Formatter',
    path: '/json-formatter',
    group: 'Formatters',
    icon: Braces,
    keywords: ['pretty', 'beautify', 'validate', 'minify'],
  },
  {
    id: 'xml-formatter',
    label: 'XML Formatter',
    path: '/xml-formatter',
    group: 'Formatters',
    icon: FileCode2,
    keywords: ['pretty', 'beautify', 'validate'],
  },
  {
    id: 'csv-formatter',
    label: 'CSV Formatter',
    path: '/csv-formatter',
    group: 'Formatters',
    icon: FileText,
    keywords: ['delimiter', 'comma', 'tab'],
  },
  {
    id: 'yaml-formatter',
    label: 'YAML Formatter',
    path: '/yaml-formatter',
    group: 'Formatters',
    icon: FileCode2,
    keywords: ['yml'],
  },
  {
    id: 'toml-formatter',
    label: 'TOML Formatter',
    path: '/toml-formatter',
    group: 'Formatters',
    icon: FileCode2,
    keywords: ['cargo', 'pyproject', 'config'],
  },
  {
    id: 'sql-formatter',
    label: 'SQL Formatter',
    path: '/sql-formatter',
    group: 'Formatters',
    icon: Database,
    keywords: ['query', 'database', 'select', 'postgres', 'mysql'],
  },

  // ── Converters ──────────────────────────────────────────────────────────
  {
    id: 'xml-to-json-converter',
    label: 'XML → JSON',
    path: '/xml-to-json-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'xml', 'json'],
  },
  {
    id: 'json-to-xml-converter',
    label: 'JSON → XML',
    path: '/json-to-xml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'xml'],
  },
  {
    id: 'json-to-csv-converter',
    label: 'JSON → CSV',
    path: '/json-to-csv-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'csv'],
  },
  {
    id: 'json-to-yaml-converter',
    label: 'JSON → YAML',
    path: '/json-to-yaml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'yaml'],
  },
  {
    id: 'json-to-toml-converter',
    label: 'JSON → TOML',
    path: '/json-to-toml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'toml'],
  },
  {
    id: 'json-to-typescript',
    label: 'JSON → TypeScript',
    path: '/json-to-typescript',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'json', 'typescript', 'ts', 'interface', 'types'],
  },
  {
    id: 'csv-to-json-converter',
    label: 'CSV → JSON',
    path: '/csv-to-json-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'csv', 'json'],
  },
  {
    id: 'csv-to-yaml-converter',
    label: 'CSV → YAML',
    path: '/csv-to-yaml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'csv', 'yaml'],
  },
  {
    id: 'yaml-to-json-converter',
    label: 'YAML → JSON',
    path: '/yaml-to-json-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'yaml', 'json'],
  },
  {
    id: 'yaml-to-toml-converter',
    label: 'YAML → TOML',
    path: '/yaml-to-toml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'yaml', 'toml'],
  },
  {
    id: 'toml-to-json-converter',
    label: 'TOML → JSON',
    path: '/toml-to-json-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'toml', 'json'],
  },
  {
    id: 'toml-to-yaml-converter',
    label: 'TOML → YAML',
    path: '/toml-to-yaml-converter',
    group: 'Converters',
    icon: ArrowLeftRight,
    keywords: ['convert', 'transform', 'toml', 'yaml'],
  },

  // ── Utilities ────────────────────────────────────────────────────────────
  {
    id: 'regex-tester',
    label: 'Regex Tester',
    path: '/regex-tester',
    group: 'Utilities',
    icon: Slash,
    keywords: ['regexp', 'pattern', 'match', 'test'],
  },
  {
    id: 'jwt-decoder',
    label: 'JWT Decoder',
    path: '/jwt-decoder',
    group: 'Utilities',
    icon: KeyRound,
    keywords: ['token', 'decode'],
  },
  {
    id: 'base64-encoder',
    label: 'Base64 Encoder',
    path: '/base64-encoder',
    group: 'Utilities',
    icon: Lock,
    keywords: ['encode', 'decode', 'base64'],
  },
  {
    id: 'url-encoder',
    label: 'URL Encoder',
    path: '/url-encoder',
    group: 'Utilities',
    icon: Globe,
    keywords: ['percent', 'encode', 'decode', 'query'],
  },
  {
    id: 'unix-timestamp-converter',
    label: 'Unix Timestamp Converter',
    navLabel: 'Timestamp Converter',
    path: '/unix-timestamp-converter',
    group: 'Utilities',
    icon: Timer,
    keywords: ['timestamp', 'unix', 'epoch', 'date', 'time', 'seconds', 'milliseconds'],
  },
  {
    id: 'cron-expression-explainer',
    label: 'Cron Expression Explainer',
    navLabel: 'Cron Explainer',
    path: '/cron-expression-explainer',
    group: 'Utilities',
    icon: CalendarClock,
    keywords: ['cron', 'schedule', 'recurring', 'job', 'task', 'cronjob', 'next run'],
  },
  {
    id: 'color-picker',
    label: 'Color Picker',
    path: '/color-picker',
    group: 'Utilities',
    icon: Pipette,
    keywords: ['color', 'colour', 'hex', 'rgb', 'hsl', 'oklch', 'picker', 'converter'],
  },
  {
    id: 'number-base-converter',
    label: 'Number Base Converter',
    path: '/number-base-converter',
    group: 'Utilities',
    icon: Binary,
    keywords: ['binary', 'hex', 'octal', 'decimal', 'base', 'bits', 'number', 'convert'],
  },
  {
    id: 'hash-generator',
    label: 'Hash Generator',
    path: '/hash-generator',
    group: 'Utilities',
    icon: Hash,
    keywords: ['md5', 'sha', 'sha256', 'sha512', 'checksum', 'digest'],
  },
  {
    id: 'json-schema-generator',
    label: 'JSON Schema Generator',
    path: '/json-schema-generator',
    group: 'Utilities',
    icon: FileJson,
    keywords: ['schema', 'json', 'generate', 'validate', 'draft'],
  },
] as const;

/** Routes belonging to a specific group, in declaration order. */
export function getRoutesByGroup(group: RouteGroup): readonly ToolRoute[] {
  return TOOL_ROUTES.filter((r) => r.group === group);
}

const GROUP_ORDER: readonly RouteGroup[] = ['Formatters', 'Converters', 'Utilities'];

/**
 * Navigation groups consumed by `Header`.
 * Each item's `label` uses `navLabel` when present (shorter strings for dropdowns).
 */
export const NAV_GROUPS = GROUP_ORDER.map((group) => ({
  label: group,
  items: getRoutesByGroup(group).map((r) => ({
    to: r.path,
    label: r.navLabel ?? r.label,
  })),
}));
