// Pages Function: mints a one-time direct-creator-upload URL from Cloudflare
// Images. The browser then POSTs the file directly to that URL — the file
// never passes through this Worker, which keeps us under the Worker request
// size limit and avoids burning bandwidth on the free tier.
//
// Flow:
//   1. Browser → POST /api/images/upload-url        (this function)
//   2. We call Cloudflare's API with our server-side token, get a
//      one-time uploadURL and image id back
//   3. Browser → POST {uploadURL} with multipart/form-data file=<image>
//   4. Cloudflare Images returns the variants array; the browser constructs
//      delivery URLs from {accountHash}/{imageId}/{variantName}.

interface Env {
  CF_ACCOUNT_ID: string;
  CF_IMAGES_TOKEN: string;
  CF_IMAGES_HASH: string;
}

type DirectUploadResponse = {
  success: boolean;
  errors?: Array<{ code: number; message: string }>;
  result?: {
    id: string;
    uploadURL: string;
  };
};

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  if (!env.CF_IMAGES_TOKEN) {
    return jsonError(500, "CF_IMAGES_TOKEN secret is not set on the Pages project");
  }

  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v2/direct_upload`;

  // Empty FormData body — we don't need to attach metadata, expiry, or
  // signed-URL requirements for the v1 demo. They become useful in 1d when
  // we tag uploads to specific products.
  const cfRes = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CF_IMAGES_TOKEN}` },
    body: new FormData()
  });

  let body: DirectUploadResponse;
  try {
    body = (await cfRes.json()) as DirectUploadResponse;
  } catch {
    return jsonError(502, `Cloudflare Images API returned non-JSON (HTTP ${cfRes.status})`);
  }

  if (!cfRes.ok || !body.success || !body.result) {
    const message = body.errors?.[0]?.message ?? `Cloudflare Images API rejected the request (HTTP ${cfRes.status})`;
    return jsonError(cfRes.status, message);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      imageId: body.result.id,
      uploadURL: body.result.uploadURL,
      accountHash: env.CF_IMAGES_HASH
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
