/**
 * RFC 7807 Problem response helper, matching the Problem schema in
 * docs/openapi.yaml (title, status, code, detail).
 */
export function sendProblem(res, status, title, code, detail) {
  const body = JSON.stringify({ title, status, code, detail });
  res.writeHead(status, {
    'Content-Type': 'application/problem+json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}
