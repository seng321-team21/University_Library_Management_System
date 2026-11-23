import { CopyStatus } from './bookRepository.js';

/**
 * Availability badge shown to members (US-06).
 *  - AVAILABLE:   at least one copy can be borrowed from the shelf now.
 *  - ON_LOAN:     no copy on the shelf, but copies are in circulation
 *                 (on loan or held for a reservation) and will come back.
 *  - UNAVAILABLE: no copy in circulation (lost, in maintenance, or none).
 */
export const AvailabilityBadge = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  ON_LOAN: 'ON_LOAN',
  UNAVAILABLE: 'UNAVAILABLE',
});

const IN_CIRCULATION = new Set([CopyStatus.ON_LOAN, CopyStatus.RESERVED]);

export class BookNotFoundError extends Error {
  constructor(bookId) {
    super(`No book found with id '${bookId}'.`);
    this.name = 'BookNotFoundError';
    this.bookId = bookId;
  }
}

function countByStatus(copies) {
  const counts = Object.fromEntries(Object.values(CopyStatus).map((s) => [s, 0]));
  copies.forEach((copy) => { counts[copy.status] += 1; });
  return counts;
}

function badgeFor(counts) {
  if (counts[CopyStatus.AVAILABLE] > 0) return AvailabilityBadge.AVAILABLE;
  if ([...IN_CIRCULATION].some((s) => counts[s] > 0)) return AvailabilityBadge.ON_LOAN;
  return AvailabilityBadge.UNAVAILABLE;
}

/**
 * Primary shelf location shown on the book page: where the member should go.
 * Prefers the shelf of an available copy; otherwise the most common shelf of the
 * copies on loan or on hold. Lost and maintenance copies are ignored; returns
 * null when no copy is left in circulation.
 */
function primaryShelfLocation(copies) {
  const available = copies.find((c) => c.status === CopyStatus.AVAILABLE);
  if (available) return available.shelfLocation;
  // Lost copies and copies in maintenance are not on any shelf a member can visit.
  const locatable = copies.filter((c) => IN_CIRCULATION.has(c.status));
  if (locatable.length === 0) return null;
  const freq = new Map();
  locatable.forEach((c) => freq.set(c.shelfLocation, (freq.get(c.shelfLocation) ?? 0) + 1));
  let best = null;
  for (const [location, n] of freq) if (best === null || n > freq.get(best)) best = location;
  return best;
}

export class AvailabilityService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Returns the BookDetail payload (see docs/openapi.yaml) with copy counts,
   * availability badge and shelf location derived from the current copy records.
   */
  getBookDetail(bookId) {
    const book = this.repository.findBookById(bookId);
    if (!book) throw new BookNotFoundError(bookId);

    const copies = this.repository.findCopiesByBookId(bookId);
    const counts = countByStatus(copies);

    return {
      ...book,
      totalCopies: copies.length,
      availableCopies: counts[CopyStatus.AVAILABLE],
      availabilityStatus: badgeFor(counts),
      shelfLocation: primaryShelfLocation(copies),
      copyStatusCounts: counts,
      copies: copies
        .map(({ barcode, shelfLocation, status }) => ({ barcode, shelfLocation, status }))
        .sort((a, b) => a.barcode.localeCompare(b.barcode)),
    };
  }
}
