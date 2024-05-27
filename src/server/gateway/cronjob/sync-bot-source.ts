import { env } from '~/env'

export async function submitSyncBotSource(bsId: string) {
  await fetch(`${env.CRON_SERVICE_URL}/api/sync-bot-source`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': env.CRON_JOB_SECRET,
    },
    body: JSON.stringify({ botSourceId: bsId }),
  })
}
