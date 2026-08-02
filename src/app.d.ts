declare global {
  namespace App {
    interface Platform {
      env?: {
        /** Static assets binding — see wrangler.jsonc. Used by serve-pdf.ts. */
        ASSETS?: { fetch: (request: Request) => Promise<Response> };
        RESEND_API_KEY?: string;
        RESEND_FROM?: string;
        TURNSTILE_SECRET_KEY?: string;
        E2E_TESTING?: string;
      };
      context?: { waitUntil: (promise: Promise<unknown>) => void };
      caches?: CacheStorage;
    }
  }
}

export {};
