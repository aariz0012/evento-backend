const nodemailer = require('nodemailer');

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {String} options.email - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.message - Email message (plain text)
 * @param {String} options.html - Email message (HTML)
 */
const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_FROM}`,
    to: options.email,
    subject: options.subject,
    text: options.message || '',
    html: options.html || ''
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
