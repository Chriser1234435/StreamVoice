import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const port = Number(process.env.PGLITE_PORT || 55432);
const db = new PGlite();
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' });
await server.start();
console.log('Temporary PGlite PostgreSQL-wire test database listening on 127.0.0.1:' + port);
const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
