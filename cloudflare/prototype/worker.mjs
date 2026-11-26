const securityHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

function response(body, status, contentType, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      ...securityHeaders,
      "Content-Type": contentType,
      ...extraHeaders
    }
  });
}

export async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return response("Method not allowed", 405, "text/plain; charset=utf-8", {
      Allow: "GET"
    });
  }

  if (url.pathname === "/health") {
    return response(
      JSON.stringify({
        status: "alive",
        service: "vayro-cloudflare-edge-prototype",
        mode: "isolated",
        productionConnected: false,
        databaseConnected: false
      }),
      200,
      "application/json; charset=utf-8"
    );
  }

  if (url.pathname === "/") {
    return response(
      "VAYRO Cloudflare edge prototype. This isolated endpoint is not the production application.",
      200,
      "text/plain; charset=utf-8"
    );
  }

  return response("Not found", 404, "text/plain; charset=utf-8");
}

export default {
  fetch(request) {
    return handleRequest(request);
  }
};
