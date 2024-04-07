import Twilio from 'twilio';
import { TwilioAccountSid, TwilioAuthToken, TwilioPhoneFrom } from '../config';

const twilioClient = Twilio(TwilioAccountSid, TwilioAuthToken);

export async function sendMessageToPhone(to: string, body: string) {
  return twilioClient.messages.create({
    body,
    from: TwilioPhoneFrom,
    to,
  });
}
