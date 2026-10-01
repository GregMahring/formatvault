/**
 * CSS minifier Web Worker (ADR-0009).
 *
 * lightningcss is a ~16 MB WebAssembly module; compiling it on the main thread
 * would freeze the page, so it always loads and runs here.
 *
 * Message protocol (see workerRequest.ts):
 *   IN:  { id: number, input: string }
 *   OUT: { id: number, result: CssMinifyResult }
 */

import { minifyCss, type CssMinifyResult } from '@/features/css/cssMinifier';
import { createRequestHandler, type WorkerRequest } from './workerRequest';

export interface CssMinifyPayload {
  input: string;
}

export type CssMinifyRequest = WorkerRequest<CssMinifyPayload>;

self.onmessage = createRequestHandler<CssMinifyPayload, CssMinifyResult>(({ input }) =>
  minifyCss(input)
);
