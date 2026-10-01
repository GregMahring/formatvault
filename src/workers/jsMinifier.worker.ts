/**
 * JavaScript minifier Web Worker (ADR-0009).
 *
 * terser's compressor can take seconds on large bundles, so minification
 * always runs off the main thread regardless of input size.
 *
 * Message protocol (see workerRequest.ts):
 *   IN:  { id: number, input: string, options: JsMinifyOptions }
 *   OUT: { id: number, result: JsMinifyResult }
 */

import {
  minifyJs,
  type JsMinifyOptions,
  type JsMinifyResult,
} from '@/features/javascript/jsMinifier';
import { createRequestHandler, type WorkerRequest } from './workerRequest';

export interface JsMinifyPayload {
  input: string;
  options: JsMinifyOptions;
}

export type JsMinifyRequest = WorkerRequest<JsMinifyPayload>;

self.onmessage = createRequestHandler<JsMinifyPayload, JsMinifyResult>(({ input, options }) =>
  minifyJs(input, options)
);
