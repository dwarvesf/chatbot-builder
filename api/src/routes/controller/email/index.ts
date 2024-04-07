import { MailService } from '@sendgrid/mail';
import {
  SendGridActivationEmailTemplateId,
  SendGridApiKey,
  SendGridContactUsEmail,
  SendGridEmailFrom,
  SendGridForgotPasswordTemplatedId,
  SendGridHomePageUrl,
  isDev,
} from '../../../config';
import logger from '../../../logger';

const sgClient = new MailService();
sgClient.setApiKey(SendGridApiKey);

export async function sendUserActivationEmail({
  activationLink,
  email,
  site_name = 'Cresendify',
  site_url = SendGridHomePageUrl,
  contact_us_email = SendGridContactUsEmail,
}: {
  activationLink: string;
  email: string;
  site_name?: string;
  site_url?: string;
  contact_us_email?: string;
}) {
  // Don't send email in dev mode
  if (isDev()) {
    logger.info(`Activation link: ${activationLink}`);
    return;
  }

  return await sgClient.send({
    from: SendGridEmailFrom,
    templateId: SendGridActivationEmailTemplateId,
    to: email,
    dynamicTemplateData: {
      account_activation_link: activationLink,
      site_name,
      site_url,
      contact_us_email,
    },
  });
}

export async function sendUserForgotPasswordEmail({
  forgotPasswordLink,
  email,
  site_name = 'AI Chatbot Builder',
  site_url = SendGridHomePageUrl,
  contact_us_email = SendGridContactUsEmail,
}: {
  forgotPasswordLink: string;
  email: string;
  site_name?: string;
  site_url?: string;
  contact_us_email?: string;
}) {
  // Don't send email in dev mode
  if (isDev()) {
    logger.info(`Set new password link: ${forgotPasswordLink}`);
    return;
  }

  return await sgClient.send({
    from: SendGridEmailFrom,
    templateId: SendGridForgotPasswordTemplatedId,
    to: email,
    dynamicTemplateData: {
      forgot_password_link: forgotPasswordLink,
      site_name,
      site_url,
      contact_us_email,
    },
  });
}
