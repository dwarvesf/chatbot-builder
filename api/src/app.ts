import { getEnvF } from './config';
import { startCronJobs } from './cronjobs';
import { startServer } from './server';

async function main() {
  // ** Override **
  // Support serialize BigInt to JSON
  BigInt.prototype['toJSON'] = function () {
    return this.toString();
  };

  // startCronJobs();
  startCronJobs();

  await startServer(parseInt(getEnvF('SERVER_PORT')));
}
main();

process.on('SIGTERM', process.exit);
