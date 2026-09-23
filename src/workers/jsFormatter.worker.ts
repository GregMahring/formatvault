/**
 * JavaScript formatter Web Worker (ADR-0009).
 *
 * Prettier can take seconds on large bundles, so formatting always runs off
 * the main thread regardless of input size.
 *
 * Message protocol:
 *   IN:  { id: number, input: string, options: JsFormatOptions }
 *   OUT: { id: number, result: JsResult }
 */

import { formatJs, type JsFormatOptions, type JsResult } from '../features/javascript/jsFormatter';

export interface JsFormatRequest {
  id: number;
  input: string;
  options: JsFormatOptions;
}

export interface JsFormatResponse {
  id: number;
  result: JsResult;
}

self.onmessage = async (e: MessageEvent<JsFormatRequest>) => {
  const { id, input, options } = e.data;
  const result = await formatJs(input, options);
  self.postMessage({ id, result } satisfies JsFormatResponse);
};
