import { createApp } from './app.js';
import { BookRepository } from './catalog/bookRepository.js';

const port = Number(process.env.PORT ?? 8080);
const repository = BookRepository.fromSeedFile();

createApp({ repository }).listen(port, () => {
  console.log(`UniLib API listening on http://localhost:${port}/api/v1`);
  console.log(`Book availability page: http://localhost:${port}/?bookId=BK-1042`);
});
