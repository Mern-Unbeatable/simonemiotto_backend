// services/email.service.js
const nodemailer = require('nodemailer');
const { AppError } = require('../middlewares/errorHandler');
const config = require('../config');

class EmailService {
  constructor() {
    const host = process.env.SMTP_HOST || config.mailchimp.smtp.host;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || config.mailchimp.smtp.user;
    const pass = process.env.SMTP_PASS || config.mailchimp.smtp.password;
    const from = process.env.SMTP_FROM || 'no-reply@localhost';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });


    this.fromAddress = from;
  }

  async sendMail(to, subject, text, html) {
    try {
      const mailOptions = {
        from: this.fromAddress,
        to,
        subject,
        text,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('✅ Email sent: ' + info.response);

      console.log('✅ Email sent: ' + info.response);
      return info;
    } catch (error) {
      console.error('❌ Email error:', error);
      // throw new AppError('Failed to send email', 400);
    }
  }
}



module.exports = EmailService;
