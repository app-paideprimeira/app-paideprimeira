// lib/rateLimit.js
// Rate limit em memória com limpeza automática de entradas antigas.
// Nota: em ambiente serverless (Vercel) cada instância tem seu próprio Map.
// Para rate limit distribuído em produção, migrar para Redis/Upstash.

const store = new Map();

/**
 * Verifica rate limit por chave (IP, userId, etc.)
 * @param {string} key - Identificador único (ex: IP do cliente)
 * @param {number} limit - Número máximo de requisições
 * @param {number} windowMs - Janela de tempo em ms
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
export function checkRateLimit(key, limit = 10, windowMs = 60_000) {
  const now = Date.now();

  // Limpeza de entradas expiradas a cada 100 chamadas para evitar vazamento de memória
  if (store.size > 100) {
    for (const [k, v] of store.entries()) {
      if (now - v.start > windowMs * 2) store.delete(k);
    }
  }

  const entry = store.get(key) || { count: 0, start: now };

  // Reseta janela se expirou
  if (now - entry.start > windowMs) {
    store.set(key, { count: 1, start: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.start + windowMs };
  }

  entry.count++;
  store.set(key, entry);
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.start + windowMs };
}

/**
 * Extrai o IP real do cliente considerando proxies
 */
export function getClientIp(request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}