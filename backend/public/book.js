// US-06: show a book's availability badge, copy counts and shelf location.

const BADGE_LABELS = {
  AVAILABLE: 'Available on shelf',
  ON_LOAN: 'On loan / on hold',
  UNAVAILABLE: 'Not available',
};

const COPY_STATUS_LABELS = {
  AVAILABLE: 'Available',
  ON_LOAN: 'On loan',
  RESERVED: 'Held for reservation',
  MAINTENANCE: 'In maintenance',
  LOST: 'Lost',
};

const $ = (id) => document.getElementById(id);

function showMessage(text) {
  $('book').hidden = true;
  $('message').textContent = text;
  $('message').hidden = false;
}

function cell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

function render(book) {
  $('message').hidden = true;
  $('title').textContent = book.title;
  $('meta').textContent = [book.author, book.publisher, book.publicationYear, `ISBN ${book.isbn}`]
    .filter(Boolean).join(' · ');

  const badge = $('badge');
  badge.className = `badge ${book.availabilityStatus}`;
  badge.textContent = BADGE_LABELS[book.availabilityStatus] ?? book.availabilityStatus;

  $('available').textContent = book.availableCopies;
  $('total').textContent = book.totalCopies;
  $('shelf').textContent = book.shelfLocation ?? '—';

  const rows = book.copies.map((copy) => {
    const tr = document.createElement('tr');
    tr.append(cell(copy.barcode), cell(copy.shelfLocation), cell(COPY_STATUS_LABELS[copy.status] ?? copy.status));
    return tr;
  });
  $('copies').replaceChildren(...rows);
  $('book').hidden = false;
}

async function load(bookId) {
  try {
    const res = await fetch(`/api/v1/books/${encodeURIComponent(bookId)}`);
    const body = await res.json();
    if (!res.ok) return showMessage(body.detail ?? 'Book could not be loaded.');
    render(body);
  } catch {
    showMessage('The library service is not reachable right now.');
  }
}

$('lookup').addEventListener('submit', (event) => {
  event.preventDefault();
  const bookId = $('bookId').value.trim();
  history.replaceState(null, '', `?bookId=${encodeURIComponent(bookId)}`);
  load(bookId);
});

const initial = new URLSearchParams(location.search).get('bookId');
if (initial) {
  $('bookId').value = initial;
  load(initial);
}
