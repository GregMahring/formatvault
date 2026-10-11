/**
 * Shared result types for the conversion pair modules
 * (jsonCsv, jsonYaml, csvYaml, jsonToml, tomlYaml, jsonXml).
 *
 * Each converter returns { output, error, warning? }.
 * A warning (not an error) is used for lossy conversions (e.g. nested JSON → CSV).
 *
 * Routes import the pair module they need directly. A single module (or a
 * re-export barrel) here would bundle papaparse, js-yaml, fast-xml-parser and
 * the TOML code into every converter page — papaparse and js-yaml can't be
 * tree-shaken through a barrel because Rollup can't prove they're side-effect free.
 */

export interface ConvertResult {
  output: string;
  error: null;
  /** Non-fatal notice about lossy conversion or data changes */
  warning?: string | undefined;
}

export interface ConvertError {
  output: null;
  error: string;
}

export type ConversionResult = ConvertResult | ConvertError;

export type CsvOutputDelimiter = ',' | '\t' | '|' | ';';
