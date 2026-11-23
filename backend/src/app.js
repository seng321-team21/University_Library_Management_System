import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AvailabilityService, BookNotFoundError } from './catalog/availabilityService.js';
import { sendJson, sendProblem } from './http/problem.js';

const API_PREFIX = '/api/v1';
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const BOOK_ID_PATTERN = /^[A-Za-z0-9-]{1,32}$/;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

async function serveStatic(res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = normalize(join(PUBLIC_DIR, relative));
  if (!filePath.startsWith(PUBLIC_DIR)) return false;
  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds the UniLib HTTP server.
 * US-06 endpoint: GET /api/v1/books/{bookId}
 */
export function createApp({ repository }) {
  const availability = new AvailabilityService(repository);

  return createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');

    try {
      const bookMatch = pathname.match(/^\/api\/v1\/books\/([^/]+)\/?$/);
      if (bookMatch) {
        if (req.method !== 'GET') {
          res.setHeader('Allow', 'GET');
          return sendProblem(res, 405, 'Method Not Allowed', 'METHOD_NOT_ALLOWED', `${req.method} is not supported on this resource.`);
        }
        const bookId = decodeURIComponent(bookMatch[1]);
        if (!BOOK_ID_PATTERN.test(bookId)) {
          return sendProblem(res, 400, 'Bad Request', 'INVALID_BOOK_ID', 'Book id may only contain letters, digits and dashes.');
        }
        return sendJson(res, 200, availability.getBookDetail(bookId));
      }

      if (pathname.startsWith(API_PREFIX)) {
        return sendProblem(res, 404, 'Not Found', 'ROUTE_NOT_FOUND', `No API route for ${pathname}.`);
      }

      if (req.method === 'GET' && (await serveStatic(res, pathname))) return undefined;
      return sendProblem(res, 404, 'Not Found', 'ROUTE_NOT_FOUND', `No resource at ${pathname}.`);
    } catch (err) {
      if (err instanceof BookNotFoundError) {
        return sendProblem(res, 404, 'Book Not Found', 'BOOK_NOT_FOUND', err.message);
      }
      if (err instanceof URIError) {
        return sendProblem(res, 400, 'Bad Request', 'INVALID_BOOK_ID', 'Malformed book id.');
      }
      console.error(err);
      return sendProblem(res, 500, 'Internal Server Error', 'INTERNAL_ERROR', 'Unexpected internal system error.');
    }
  });
}
