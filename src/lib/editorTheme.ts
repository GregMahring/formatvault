/**
 * FormatVault brand editor theme for CodeMirror 6.
 *
 * Dark palette is built from the app's CSS custom properties:
 *   surface-raised (#0d0d22) — editor background
 *   brand-indigo   (#5555cc) — keywords, primary accent
 *   brand-cyan     (#00d4e8) — strings, attributes
 *   fg             (#e8e6f0) — default text
 *   fg-secondary   (#9896b0) — operators, punctuation
 *   fg-muted       (#4a4870) — comments, gutter numbers
 *
 * Light palette maps the same roles to the light-mode tokens.
 */

import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { Extension } from '@uiw/react-codemirror';

// ─── Dark palette ────────────────────────────────────────────────────────────
// Terminal feel: violet keywords, cyan strings, orange numbers, lavender types.
// Inspired by Tokyo Night / Dracula but built on the brand's indigo+cyan palette.
const dark = {
  bg: '#0d0d22',
  bgLine: 'rgba(255,255,255,0.04)',
  bgSelection: 'rgba(99,102,241,0.28)',
  bgMatchingBracket: 'rgba(0,212,232,0.2)',
  gutter: '#0d0d22',
  gutterBorder: '#1a1a3a',
  gutterFg: '#3d3b5c',
  gutterActiveFg: '#7c7a9a',
  cursor: '#00d4e8', // brand cyan — bright, easy to spot
  fg: '#cdd6f4', // slightly warm white, easier on eyes than pure white
  fgSecondary: '#9896b0',
  fgMuted: '#4a4870',
  // syntax
  keyword: '#a78bfa', // violet — const/let/if/return/function (classic terminal)
  builtin: '#7c7cff', // bright indigo — built-ins, constructors
  string: '#00d4e8', // brand cyan — strings
  stringSpecial: '#67e8f9', // light cyan — regex, template literals, escape seqs
  number: '#fb923c', // warm orange — great contrast on dark bg, classic terminal
  comment: '#4a4870', // muted indigo-gray, italic
  meta: '#6a6882',
  tag: '#7c7cff', // bright indigo — XML/HTML tag names
  attribute: '#00d4e8', // brand cyan — attribute names
  property: '#a5b4fc', // soft indigo — object keys, CSS props
  operator: '#89dceb', // soft cyan — operators blend without disappearing
  punctuation: '#6a6882', // muted — braces/brackets recede
  variableName: '#cdd6f4', // same as fg — variables are default text
  functionName: '#67e8f9', // light cyan — function names pop distinctly
  typeName: '#c4b5fd', // lavender — types, classes, interfaces
  className: '#c4b5fd',
  invalid: '#f38ba8', // soft red
  link: '#00d4e8',
};

// ─── Light palette ───────────────────────────────────────────────────────────
const light = {
  bg: '#fafafa',
  bgLine: 'rgba(0,0,0,0.03)',
  bgSelection: 'rgba(85,85,204,0.13)',
  bgMatchingBracket: 'rgba(0,145,175,0.15)',
  gutter: '#fafafa',
  gutterBorder: '#d4d0c8',
  gutterFg: '#9896b0',
  gutterActiveFg: '#4a4660',
  cursor: '#5555cc',
  fg: '#1a1820',
  fgSecondary: '#4a4660',
  fgMuted: '#8a8698',
  // syntax — same roles, adjusted for white bg contrast
  keyword: '#6d28d9', // violet-700
  builtin: '#4f46e5', // indigo-600
  string: '#0e7490', // cyan-800
  stringSpecial: '#0369a1', // sky-700
  number: '#c2410c', // orange-700
  comment: '#9ca3af', // gray-400, italic
  meta: '#6b7280',
  tag: '#4f46e5', // indigo
  attribute: '#0e7490', // cyan
  property: '#4338ca', // indigo-700
  operator: '#0369a1', // sky-700
  punctuation: '#9ca3af',
  variableName: '#1a1820',
  functionName: '#0369a1', // sky-700
  typeName: '#7c3aed', // violet-600
  className: '#7c3aed',
  invalid: '#dc2626',
  link: '#0e7490',
};

function buildTheme(p: typeof dark, isDark: boolean): Extension {
  const editorTheme = EditorView.theme(
    {
      '&': {
        color: p.fg,
        backgroundColor: p.bg,
      },
      '.cm-content': {
        caretColor: p.cursor,
        padding: '8px 0',
      },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: p.cursor },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        { backgroundColor: p.bgSelection },
      '.cm-panels': { backgroundColor: p.bg, color: p.fg },
      '.cm-panels.cm-panels-top': { borderBottom: `2px solid ${p.gutterBorder}` },
      '.cm-panels.cm-panels-bottom': { borderTop: `2px solid ${p.gutterBorder}` },
      '.cm-searchMatch': {
        backgroundColor: 'rgba(85,85,204,0.12)',
        outline: `1px solid rgba(85,85,204,0.4)`,
      },
      '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: p.bgSelection },
      '.cm-activeLine': { backgroundColor: p.bgLine },
      '.cm-selectionMatch': { backgroundColor: p.bgSelection },
      '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: p.bgMatchingBracket,
      },
      '.cm-gutters': {
        backgroundColor: p.gutter,
        color: p.gutterFg,
        border: 'none',
        borderRight: `1px solid ${p.gutterBorder}`,
      },
      '.cm-activeLineGutter': { backgroundColor: p.bgLine, color: p.gutterActiveFg },
      '.cm-placeholder': {
        color: p.fgSecondary,
        fontStyle: 'italic',
      },
      '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: p.fgMuted,
      },
      '.cm-tooltip': {
        border: `1px solid ${p.gutterBorder}`,
        backgroundColor: p.bg,
        color: p.fg,
      },
      '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
      },
      '.cm-tooltip .cm-tooltip-arrow:after': {
        borderTopColor: p.bg,
        borderBottomColor: p.bg,
      },
      '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
          backgroundColor: p.bgSelection,
          color: p.fg,
        },
      },
      '.cm-focused': { outline: 'none' },
    },
    { dark: isDark }
  );

  const highlightStyle = HighlightStyle.define([
    // Keywords — violet, slightly bold
    { tag: t.keyword, color: p.keyword, fontWeight: '500' },
    { tag: t.operatorKeyword, color: p.keyword, fontWeight: '500' },
    // Identifiers
    { tag: t.variableName, color: p.variableName },
    { tag: t.definition(t.variableName), color: p.variableName },
    {
      tag: [t.function(t.variableName), t.function(t.definition(t.variableName))],
      color: p.functionName,
    },
    { tag: t.labelName, color: p.functionName },
    { tag: [t.typeName, t.className], color: p.typeName },
    { tag: [t.namespace, t.self, t.changed, t.annotation, t.modifier], color: p.typeName },
    { tag: [t.propertyName, t.macroName], color: p.property },
    // Built-ins: true/false/null/undefined/NaN, constructors
    { tag: [t.atom, t.bool], color: p.number }, // booleans/null share orange with numbers
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: p.builtin },
    // Numbers
    { tag: t.number, color: p.number },
    // Strings and string-like
    { tag: [t.string, t.processingInstruction, t.inserted], color: p.string },
    { tag: [t.regexp, t.escape, t.special(t.string)], color: p.stringSpecial },
    { tag: t.url, color: p.link, textDecoration: 'underline' },
    // Operators and punctuation
    { tag: t.operator, color: p.operator },
    { tag: [t.separator, t.punctuation], color: p.punctuation },
    { tag: t.angleBracket, color: p.punctuation },
    // Comments
    { tag: t.comment, color: p.comment, fontStyle: 'italic' },
    { tag: t.meta, color: p.meta },
    // Markup (Markdown, HTML)
    { tag: t.strong, fontWeight: 'bold' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.link, color: p.link, textDecoration: 'underline' },
    { tag: [t.heading, t.heading1, t.heading2, t.heading3], fontWeight: 'bold', color: p.keyword },
    // XML/HTML
    { tag: t.tagName, color: p.tag, fontWeight: '500' },
    { tag: t.attributeName, color: p.attribute },
    { tag: t.attributeValue, color: p.string },
    // Errors
    { tag: [t.invalid, t.deleted], color: p.invalid },
  ]);

  return [editorTheme, syntaxHighlighting(highlightStyle)];
}

export const formatvaultDark: Extension = buildTheme(dark, true);
export const formatvaultLight: Extension = buildTheme(light, false);
