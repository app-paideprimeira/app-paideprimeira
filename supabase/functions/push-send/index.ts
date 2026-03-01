// supabase/functions/push-send/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT     = Deno.env.get("VAPID_SUBJECT")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: { endpoint: string; p256dh: string; auth: string; title: string; body: string; url?: string };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { endpoint, p256dh, auth, title, body: msgBody, url } = body;

  if (!endpoint || !p256dh || !auth || !title || !msgBody) {
    return json({ error: "Missing required fields" }, 400);
  }

  console.log("Sending push to:", endpoint.substring(0, 60) + "...");

  try {
    const result = await sendWebPush({
      endpoint,
      p256dh,
      auth,
      payload: JSON.stringify({ title, body: msgBody, url: url || "/" }),
    });

    console.log("Push service status:", result.status);

    if (result.status === 201 || result.status === 200) {
      return json({ ok: true });
    }
    if (result.status === 410) {
      return json({ error: "subscription_expired" }, 410);
    }

    const text = await result.text();
    console.error("Push failed:", result.status, text);
    return json({ error: `Push returned ${result.status}` }, 500);

  } catch (err) {
    console.error("Exception:", String(err));
    return json({ error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Utils ────────────────────────────────────────────────────

function b64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str: string): Uint8Array {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

// ── Importa chave privada VAPID via JWK (formato correto para Deno) ──
async function importVapidPrivateKey(): Promise<CryptoKey> {
  // Chave privada VAPID raw (32 bytes base64url) → JWK ES256
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d:   VAPID_PRIVATE_KEY,           // chave privada raw em base64url
    x:   VAPID_PUBLIC_KEY.slice(0, 43), // primeiros 32 bytes da pub key (x)
    y:   VAPID_PUBLIC_KEY.slice(43),    // últimos 32 bytes (y)
    key_ops: ["sign"],
  };

  // A chave pública VAPID (65 bytes = 04 + x(32) + y(32)) precisa ser decodificada
  const pubBytes = fromB64url(VAPID_PUBLIC_KEY);
  // pubBytes[0] = 0x04 (uncompressed), [1..32] = x, [33..64] = y
  const xBytes = pubBytes.slice(1, 33);
  const yBytes = pubBytes.slice(33, 65);

  const correctJwk = {
    kty: "EC",
    crv: "P-256",
    d:   VAPID_PRIVATE_KEY,
    x:   b64url(xBytes),
    y:   b64url(yBytes),
    key_ops: ["sign"],
  };

  return crypto.subtle.importKey(
    "jwk",
    correctJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

// ── VAPID JWT ────────────────────────────────────────────────

async function makeVapidJWT(audience: string): Promise<string> {
  const enc     = new TextEncoder();
  const header  = b64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64url(enc.encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: VAPID_SUBJECT,
  })));

  const signingInput = `${header}.${payload}`;
  const key          = await importVapidPrivateKey();
  const sig          = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(signingInput)
  );

  return `${signingInput}.${b64url(new Uint8Array(sig))}`;
}

// ── Payload encryption (RFC 8291 / aes128gcm) ────────────────

async function encryptPayload(payload: string, p256dhB64: string, authB64: string): Promise<Uint8Array> {
  const enc        = new TextEncoder();
  const salt       = crypto.getRandomValues(new Uint8Array(16));
  const authSecret = fromB64url(authB64);
  const dh         = fromB64url(p256dhB64);

  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  );
  const ephPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", ephemeral.publicKey));

  const clientPub = await crypto.subtle.importKey(
    "raw", dh, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPub }, ephemeral.privateKey, 256
  );

  const prkKey = await crypto.subtle.importKey(
    "raw", new Uint8Array(sharedBits), { name: "HKDF" }, false, ["deriveBits"]
  );

  const ikmInfo = concat(enc.encode("WebPush: info\0"), dh, ephPubRaw);
  const ikm     = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authSecret, info: ikmInfo }, prkKey, 256
  );

  const ikmKey = await crypto.subtle.importKey(
    "raw", ikm, { name: "HKDF" }, false, ["deriveBits"]
  );

  const cekBits   = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: enc.encode("Content-Encoding: aes128gcm\0") }, ikmKey, 128
  );
  const nonceBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: enc.encode("Content-Encoding: nonce\0") }, ikmKey, 96
  );

  const cek = await crypto.subtle.importKey("raw", cekBits, { name: "AES-GCM" }, false, ["encrypt"]);

  const plaintext  = enc.encode(payload);
  const padded     = concat(plaintext, new Uint8Array([2]));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonceBits }, cek, padded
  ));

  // Header: salt(16) + rs(4, big-endian) + idlen(1) + keyid(65)
  const header = new Uint8Array(21 + ephPubRaw.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = ephPubRaw.length;
  header.set(ephPubRaw, 21);

  return concat(header, ciphertext);
}

// ── Envia push ───────────────────────────────────────────────

async function sendWebPush({ endpoint, p256dh, auth, payload }: {
  endpoint: string;
  p256dh: string;
  auth: string;
  payload: string;
}) {
  const url      = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt      = await makeVapidJWT(audience);
  const body     = await encryptPayload(payload, p256dh, auth);

  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization":    `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type":     "application/octet-stream",
      "TTL":              "86400",
    },
    body,
  });
}