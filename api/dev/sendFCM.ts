import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

async function main() {
  const app = initializeApp({
    credential: applicationDefault(),
  });

  // This registration token comes from the client FCM SDKs.
  // const registrationToken = 'YOUR_REGISTRATION_TOKEN';
  const registrationToken =
    'e_iGPh-5f4pl30ymW3iUG0:APA91bH-QbxKY2HmHO1UuUcyzhO6goxEnfjsJflKG9x4_gD0CT9oKGmWCTgdE2wjnLQfvZQbrS1UixxTLmCeTf7_TMfYBa3yeM0lM9iV0A9TqHKo-lj3RVBr8qWchi4nM_akxa9SOnsE';

  const message = {
    data: {
      score: '850',
      time: '2:45',
    },
    token: registrationToken,
  };

  // Send a message to the device corresponding to the provided
  // registration token.
  getMessaging(app)
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
}
main();
