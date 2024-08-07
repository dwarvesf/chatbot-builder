export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  BILLING: '/billing',
  BOT_DETAIL: (botId: string) => `/bots/${botId}`,
  BOT_DETAIL_SETTINGS: (botId: string) => `/bots/${botId}/settings`,
  BOT_DETAIL_SOURCES: (botId: string) => `/bots/${botId}/sources`,
  BOT_DETAIL_APPEARANCE: (botId: string) => `/bots/${botId}/appearance`,
  BOT_DETAIL_INTEGRATIONS: (botId: string) => `/bots/${botId}/integrations`,
  BOT_DETAIL_LOGS: (botId: string) => `/bots/${botId}/logs`,
  BOT_DETAIL_KNOWLEDGE: (botId: string) => `/bots/${botId}/knowledge`,
}
