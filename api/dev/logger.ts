import logger from '../src/logger';

async function main() {
  const log = logger.child({ fn: 'main' });
  log.info('hello %v', { foo: 'bar' });
}

main();
