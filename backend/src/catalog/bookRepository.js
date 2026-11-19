import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Physical copy statuses. Mirrors the circulation states used by
 * checkout (US-07), check-in (US-09) and reservations (US-11).
 */
export const CopyStatus = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  ON_LOAN: 'ON_LOAN',
  RESERVED: 'RESERVED',
  MAINTENANCE: 'MAINTENANCE',
  LOST: 'LOST',
});

const VALID_STATUSES = new Set(Object.values(CopyStatus));

/**
 * In-memory catalog repository.
 *
 * Holds books and their physical copies. It is the single source of truth
 * that availability is derived from, so counts are never stored separately
 * and cannot drift from the copy records (US-06 acceptance check).
 * When the database layer (EN-1) is merged, this class can be replaced by a
 * DB-backed implementation exposing the same methods.
 */
export class BookRepository {
  #books = new Map();
  #copies = new Map();

  constructor({ books = [], copies = [] } = {}) {
    books.forEach((book) => this.addBook(book));
    copies.forEach((copy) => this.addCopy(copy));
  }

  static fromSeedFile(path = fileURLToPath(new URL('../data/seed.json', import.meta.url))) {
    return new BookRepository(JSON.parse(readFileSync(path, 'utf8')));
  }

  addBook(book) {
    if (!book?.id) throw new Error('Book must have an id');
    this.#books.set(book.id, { ...book });
  }

  addCopy(copy) {
    if (!copy?.barcode) throw new Error('Copy must have a barcode');
    if (this.#copies.has(copy.barcode)) throw new Error(`Duplicate barcode: ${copy.barcode}`);
    if (!this.#books.has(copy.bookId)) throw new Error(`Unknown book for copy: ${copy.bookId}`);
    if (!VALID_STATUSES.has(copy.status)) throw new Error(`Invalid copy status: ${copy.status}`);
    this.#copies.set(copy.barcode, { ...copy });
  }

  updateCopyStatus(barcode, status) {
    const copy = this.#copies.get(barcode);
    if (!copy) throw new Error(`Unknown copy: ${barcode}`);
    if (!VALID_STATUSES.has(status)) throw new Error(`Invalid copy status: ${status}`);
    copy.status = status;
  }

  findBookById(id) {
    const book = this.#books.get(id);
    return book ? { ...book } : null;
  }

  findCopiesByBookId(bookId) {
    return [...this.#copies.values()]
      .filter((copy) => copy.bookId === bookId)
      .map((copy) => ({ ...copy }));
  }
}
