/**
 * JavaScript formatter Web Worker (ADR-0009).
 *
 * Prettier can take seconds on large bundles, so formatting always runs off
 * the main thread regardless of input size.
 *
 * Message protocol (see workerRequest.ts):
 *   IN:  { id: number, input: string, options: JsFormatOptions }
 *   OUT: { id: number, result: JsResult }
 */

import { formatJs, type JsFormatOptions, type JsResult } from '@/features/javascript/jsFormatter';
import { createRequestHandler, type WorkerRequest, type WorkerResponse } from './workerRequest';

export interface JsFormatPayload {
  input: string;
  options: JsFormatOptions;
}

export type JsFormatRequest = WorkerRequest<JsFormatPayload>;
export type JsFormatResponse = WorkerResponse<JsResult>;

self.onmessage = createRequestHandler<JsFormatPayload, JsResult>(({ input, options }) =>
  formatJs(input, options)
);
