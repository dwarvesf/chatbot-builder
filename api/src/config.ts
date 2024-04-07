export const ApiHost = process.env.API_HOST || 'localhost:3001';

export const CookieSameSite = getEnv('COOKIE_SAME_SITE', 'lax') as 'strict' | 'lax' | 'none';
export const CookieSecure: boolean | 'auto' = parseCookieSecure(getEnv('COOKIE_SECURE', 'auto'));

export const RedisUrl = getEnvF('REDIS_URL');
export const RedisPassword = getEnv('REDIS_PASSWORD');

export const JwtPrivateKeyPath = getEnvF('JWT_PRIVATE_KEY_PATH');
export const JwtPublicKeyPath = getEnvF('JWT_PUBLIC_KEY_PATH');
export const NewAccountActivationLinkExp = getEnv('NEW_ACCOUNT_ACTIVATION_LINK_EXPIRATION') || '1h';
export const ForgotPasswordLinkExp = getEnv('FORGOT_PASSWORD_LINK_EXPIRATION') || '1h';
export const AccountActivatedRedirectUrl = getEnv('ACCOUNT_ACTIVATED_REDIRECT_URL') || 'https://chat-builder.com/login';
export const WebAppResetPasswordPageURL =
  getEnv('WEB_APP_RESET_PASSWORD_PAGE_URL') || 'https://chat-builder.com/reset-password';

export const SendGridApiKey = getEnv('SENDGRID_API_KEY');
export const SendGridEmailFrom = getEnv('SENDGRID_EMAIL_FROM');
export const SendGridActivationEmailTemplateId = getEnvF('SENDGRID_ACTIVATION_EMAIL_TEMPLATE_ID');
export const SendGridForgotPasswordTemplatedId = getEnvF('SENDGRID_FORGOT_PASSWORD_TEMPLATE_ID');
export const SendGridHomePageUrl = getEnv('SENDGRID_HOME_PAGE_URL') || 'https://chat-builder.com';
export const SendGridContactUsEmail = getEnv('SENDGRID_CONTACT_US_EMAIL') || 'info@chat-builder.com';
export const TwilioAccountSid = getEnv('TWILIO_ACCOUNT_SID');
export const TwilioAuthToken = getEnv('TWILIO_AUTH_TOKEN');
export const TwilioPhoneFrom = getEnv('TWILIO_PHONE_FROM');

export const AzureStorageConnectionString = getEnvF('AZURE_STORAGE_CONNECTION_STRING');
export const AzureStorageContainerName = getEnvF('AZURE_STORAGE_CONTAINER_NAME');
export const AzureStorageBlobPathPrefix = getEnv('AZURE_STORAGE_BLOB_PATH_PREFIX') || '';

export const NotifyWatchYourTimeIntervalMs = Number(getEnv('NOTIFY_WATCH_YOUR_TIME_INTERVAL_MS')) || 30e3; // Default 30 seconds

export const LogHTTPRequests = getEnv('LOG_HTTP_REQUESTS', 'true') === 'true';

export function isDev(): boolean {
  return process.env.ENV === 'dev';
}

export function getEnv(key: string, defaultValue?: string): string | undefined {
  const val = process.env[key];
  if (val) {
    return val;
  }
  if (defaultValue) {
    return defaultValue;
  }
  return val;
}

export function getEnvF(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable ${key}`);
  }
  return value;
}

function parseCookieSecure(value: string): boolean | 'auto' {
  if (value === 'auto') {
    return 'auto';
  }
  return value === 'true';
}
