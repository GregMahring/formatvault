/**
 * Request/response protocol shared by single-purpose workers (ADR-0009).
 *
 *   IN:  { id: number, ...payload }
 *   OUT: { id: number, result }
 *
 * The id lets the caller drop responses to requests it has since superseded.
 */

export type WorkerRequest<TPayload extends object> = { id: number } & TPayload;

export interface WorkerResponse<TResult> {
  id: number;
  result: TResult;
}

/** Build an `onmessage` handler that answers each request with `handle(payload)`. */
export function createRequestHandler<TPayload extends object, TResult>(
  handle: (payload: TPayload) => Promise<TResult>
): (e: MessageEvent<WorkerRequest<TPayload>>) => Promise<void> {
  return async (e) => {
    const { id, ...payload } = e.data;
    const result = await handle(payload as unknown as TPayload);
    self.postMessage({ id, result } satisfies WorkerResponse<TResult>);
  };
}
