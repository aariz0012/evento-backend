const twilio = require('twilio');

/**
 * Send an SMS notification
 * @param {Object} options - SMS options
 * @param {String} options.to - Recipient phone number
 * @param {String} options.body - SMS message body
 */
const sendSMS = async (options) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: options.body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: options.to
  });
};

module.exports = sendSMS;
