import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/app.js';
import { BookRepository } from '../src/catalog/bookRepository.js';

let server;
let baseUrl;

before(async () => {
  server = createApp({ repository: BookRepository.fromSeedFile() });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test('GET /api/v1/books/{id} returns BookDetail with availability and shelf location', async () => {
  const res = await fetch(`${baseUrl}/api/v1/books/BK-1042`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/json/);

  const body = await res.json();
  for (const field of ['id', 'isbn', 'title', 'author', 'category', 'totalCopies', 'availableCopies']) {
    assert.ok(field in body, `missing required field ${field}`);
  }
  assert.equal(body.id, 'BK-1042');
  assert.equal(body.totalCopies, 4);
  assert.equal(body.availableCopies, 2);
  assert.equal(body.availabilityStatus, 'AVAILABLE');
  assert.equal(body.shelfLocation, 'Floor 2 - Shelf B4');
  assert.equal(body.copies.length, 4);
});

test('book whose copies are all on loan or reserved shows ON_LOAN badge', async () => {
  const body = await (await fetch(`${baseUrl}/api/v1/books/BK-1043`)).json();
  assert.equal(body.availableCopies, 0);
  assert.equal(body.availabilityStatus, 'ON_LOAN');
});

test('book with only a lost copy shows UNAVAILABLE badge', async () => {
  const body = await (await fetch(`${baseUrl}/api/v1/books/BK-2001`)).json();
  assert.equal(body.title, 'Çalıkuşu');
  assert.equal(body.availabilityStatus, 'UNAVAILABLE');
});

test('unknown book returns 404 Problem with BOOK_NOT_FOUND', async () => {
  const res = await fetch(`${baseUrl}/api/v1/books/BK-9999`);
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type'), /application\/problem\+json/);
  const body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), ['code', 'detail', 'status', 'title']);
  assert.equal(body.code, 'BOOK_NOT_FOUND');
  assert.equal(body.status, 404);
});

test('invalid book id returns 400 Problem', async () => {
  const res = await fetch(`${baseUrl}/api/v1/books/${encodeURIComponent('BK 1042;')}`);
  assert.equal(res.status, 400);
  assert.equal((await res.json()).code, 'INVALID_BOOK_ID');
});

test('non-GET method returns 405', async () => {
  const res = await fetch(`${baseUrl}/api/v1/books/BK-1042`, { method: 'DELETE' });
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('allow'), 'GET');
});

test('availability page is served', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Book availability/);
});

test('static files cannot escape the public folder', async () => {
  const res = await fetch(`${baseUrl}/..%2Fsrc%2Fserver.js`);
  assert.equal(res.status, 404);
});
