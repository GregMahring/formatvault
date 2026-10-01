import type { EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';
import { renderToReadableStream } from 'react-dom/server';
import { applyDocumentHeaders } from '@/lib/securityHeaders';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        // Log server errors to console (dev only — do not expose to client)
        if (process.env.NODE_ENV === 'development') {
          console.error(error);
        }
        responseStatusCode = 500;
      },
    }
  );

  responseHeaders.set('Content-Type', 'text/html');
  // Cloudflare Pages doesn't apply public/_headers to Pages Function responses,
  // so SSR documents must set the ADR-0007 headers themselves. Production only:
  // the CSP would block the Vite dev server's HMR client and websocket.
  if (import.meta.env.PROD) {
    applyDocumentHeaders(responseHeaders);
  }

  return new Response(body, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
