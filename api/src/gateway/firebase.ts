import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { Message, getMessaging } from 'firebase-admin/messaging';

const app = initializeApp({
  credential: applicationDefault(),
});

export async function sendFCMMessages(msgs: Message[]) {
  const response = await getMessaging(app).sendEach(msgs);
  return response;
}

export async function sendFCMMessage(msg: Message) {
  const response = await getMessaging(app).send(msg);
  return response;
}
