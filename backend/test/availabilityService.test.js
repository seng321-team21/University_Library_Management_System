import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BookRepository, CopyStatus } from '../src/catalog/bookRepository.js';
import { AvailabilityBadge, AvailabilityService, BookNotFoundError } from '../src/catalog/availabilityService.js';

const book = (id) => ({ id, isbn: `isbn-${id}`, title: `Title ${id}`, author: 'Author', category: 'CS' });
const copy = (barcode, bookId, status, shelfLocation = 'Floor 1 - A1') => ({ barcode, bookId, status, shelfLocation });

function serviceWith(copies, books = [book('BK-1')]) {
  const repository = new BookRepository({ books, copies });
  return { repository, service: new AvailabilityService(repository) };
}

test('counts total and available copies from copy records', () => {
  const { service } = serviceWith([
    copy('C1', 'BK-1', CopyStatus.AVAILABLE),
    copy('C2', 'BK-1', CopyStatus.ON_LOAN),
    copy('C3', 'BK-1', CopyStatus.AVAILABLE),
  ]);
  const detail = service.getBookDetail('BK-1');
  assert.equal(detail.totalCopies, 3);
  assert.equal(detail.availableCopies, 2);
  assert.equal(detail.availabilityStatus, AvailabilityBadge.AVAILABLE);
  assert.deepEqual(detail.copyStatusCounts, { AVAILABLE: 2, ON_LOAN: 1, RESERVED: 0, MAINTENANCE: 0, LOST: 0 });
});

test('badge is ON_LOAN when no copy is on the shelf but copies are in circulation', () => {
  const { service } = serviceWith([
    copy('C1', 'BK-1', CopyStatus.ON_LOAN),
    copy('C2', 'BK-1', CopyStatus.RESERVED),
  ]);
  const detail = service.getBookDetail('BK-1');
  assert.equal(detail.availableCopies, 0);
  assert.equal(detail.availabilityStatus, AvailabilityBadge.ON_LOAN);
});

test('badge is UNAVAILABLE when copies are only lost or in maintenance', () => {
  const { service } = serviceWith([
    copy('C1', 'BK-1', CopyStatus.LOST),
    copy('C2', 'BK-1', CopyStatus.MAINTENANCE),
  ]);
  assert.equal(service.getBookDetail('BK-1').availabilityStatus, AvailabilityBadge.UNAVAILABLE);
});

test('book without copies is UNAVAILABLE with no shelf location', () => {
  const { service } = serviceWith([]);
  const detail = service.getBookDetail('BK-1');
  assert.equal(detail.totalCopies, 0);
  assert.equal(detail.availabilityStatus, AvailabilityBadge.UNAVAILABLE);
  assert.equal(detail.shelfLocation, null);
  assert.deepEqual(detail.copies, []);
});

test('shelf location points to where an available copy is', () => {
  const { service } = serviceWith([
    copy('C1', 'BK-1', CopyStatus.ON_LOAN, 'Floor 2 - B4'),
    copy('C2', 'BK-1', CopyStatus.ON_LOAN, 'Floor 2 - B4'),
    copy('C3', 'BK-1', CopyStatus.AVAILABLE, 'Reserve Desk - R1'),
  ]);
  assert.equal(service.getBookDetail('BK-1').shelfLocation, 'Reserve Desk - R1');
});

test('shelf location falls back to the most common shelf when nothing is available', () => {
  const { service } = serviceWith([
    copy('C1', 'BK-1', CopyStatus.ON_LOAN, 'Reserve Desk - R1'),
    copy('C2', 'BK-1', CopyStatus.ON_LOAN, 'Floor 2 - B4'),
    copy('C3', 'BK-1', CopyStatus.RESERVED, 'Floor 2 - B4'),
  ]);
  assert.equal(service.getBookDetail('BK-1').shelfLocation, 'Floor 2 - B4');
});

test('availability reflects the current record after a copy status changes', () => {
  const { repository, service } = serviceWith([copy('C1', 'BK-1', CopyStatus.AVAILABLE)]);
  assert.equal(service.getBookDetail('BK-1').availabilityStatus, AvailabilityBadge.AVAILABLE);

  repository.updateCopyStatus('C1', CopyStatus.ON_LOAN); // e.g. checkout (US-07)
  const afterCheckout = service.getBookDetail('BK-1');
  assert.equal(afterCheckout.availableCopies, 0);
  assert.equal(afterCheckout.availabilityStatus, AvailabilityBadge.ON_LOAN);

  repository.updateCopyStatus('C1', CopyStatus.AVAILABLE); // e.g. check-in (US-09)
  assert.equal(service.getBookDetail('BK-1').availableCopies, 1);
});

test('only copies of the requested book are counted', () => {
  const { service } = serviceWith(
    [copy('C1', 'BK-1', CopyStatus.AVAILABLE), copy('C2', 'BK-2', CopyStatus.AVAILABLE)],
    [book('BK-1'), book('BK-2')],
  );
  const detail = service.getBookDetail('BK-1');
  assert.equal(detail.totalCopies, 1);
  assert.deepEqual(detail.copies.map((c) => c.barcode), ['C1']);
});

test('throws BookNotFoundError for an unknown book', () => {
  const { service } = serviceWith([]);
  assert.throws(() => service.getBookDetail('BK-404'), BookNotFoundError);
});

test('repository rejects duplicate barcodes and invalid statuses', () => {
  const repository = new BookRepository({ books: [book('BK-1')] });
  repository.addCopy(copy('C1', 'BK-1', CopyStatus.AVAILABLE));
  assert.throws(() => repository.addCopy(copy('C1', 'BK-1', CopyStatus.AVAILABLE)), /Duplicate barcode/);
  assert.throws(() => repository.addCopy(copy('C2', 'BK-1', 'BORROWED')), /Invalid copy status/);
  assert.throws(() => repository.addCopy(copy('C3', 'BK-9', CopyStatus.AVAILABLE)), /Unknown book/);
});

test('seed catalog loads and every copy belongs to a known book', () => {
  const repository = BookRepository.fromSeedFile();
  const detail = new AvailabilityService(repository).getBookDetail('BK-1042');
  assert.equal(detail.totalCopies, 4);
  assert.equal(detail.availableCopies, 2);
  assert.equal(detail.shelfLocation, 'Floor 2 - Shelf B4');
});
