import { headersFromTicket, loginWithPinForm } from "./auth.js";
import type { SecureSiteAccessConfig, TicketCredentials } from "./types.js";

function mergeHeaders(
  a: HeadersInit | undefined,
  b: HeadersInit
): Record<string, string> {
  const out = new Headers(a);
  for (const [k, v] of new Headers(b).entries()) out.set(k, v);
  return Object.fromEntries(out.entries());
}

/**
 * Cliente HTTP para sitios con ticket fijo o login por PIN (form POST).
 * Las credenciales en memoria no deben loguearse.
 */
export class SecureSiteClient {
  private active: TicketCredentials;
  private readonly timeoutMs: number;

  constructor(private readonly config: SecureSiteAccessConfig) {
    this.timeoutMs = config.timeoutMs ?? 15_000;
    this.active = { ...config.ticket };
  }

  /** Renueva sesión usando el flujo PIN definido en config. */
  async refreshSession(fetchImpl: typeof fetch = fetch): Promise<void> {
    if (!this.config.pinForm) {
      throw new Error("refreshSession: pinForm no configurado");
    }
    const creds = await loginWithPinForm(
      this.config.pinForm,
      this.timeoutMs,
      fetchImpl
    );
    this.active = { ...this.active, ...creds };
  }

  async fetch(
    pathOrUrl: string,
    init: RequestInit = {},
    fetchImpl: typeof fetch = fetch
  ): Promise<Response> {
    const url = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : new URL(pathOrUrl.replace(/^\//, ""), this.config.baseUrl).toString();

    const authHeaders = headersFromTicket(this.active);
    const headers = mergeHeaders(init.headers, authHeaders);

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeoutMs);

    let res = await fetchImpl(url, {
      ...init,
      headers,
      signal: init.signal ?? controller.signal,
    });
    clearTimeout(id);

    if (res.status === 401 && this.config.pinForm) {
      await this.refreshSession(fetchImpl);
      const retryHeaders = mergeHeaders(init.headers, headersFromTicket(this.active));
      const c2 = new AbortController();
      const id2 = setTimeout(() => c2.abort(), this.timeoutMs);
      res = await fetchImpl(url, {
        ...init,
        headers: retryHeaders,
        signal: init.signal ?? c2.signal,
      });
      clearTimeout(id2);
    }

    return res;
  }
}
