import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Stands in for the real Workers ASSETS binding (`cloudflare:workers`'s
 * `env.ASSETS`), which only exists inside the Workers runtime. Same
 * contract as the real binding — fetch a path, get a Response — just backed
 * by Node's fs reading from public/ instead of Cloudflare's asset store.
 */
export function cloudflareEnvMock() {
  return {
    env: {
      ASSETS: {
        fetch: async (input: string) => {
          const { pathname } = new URL(input);
          try {
            const buffer = await readFile(
              path.join(process.cwd(), "public", pathname),
            );
            return new Response(new Uint8Array(buffer), { status: 200 });
          } catch {
            return new Response(null, { status: 404 });
          }
        },
      },
    },
  };
}
