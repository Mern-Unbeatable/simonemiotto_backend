// services/email.service.js
const nodemailer = require('nodemailer');
const { AppError } = require('../middlewares/errorHandler');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'mdrakibulhasan12346@gmail.com',
        pass: 'rbyz nvgi eppd rwqm',
      },
    });

    // this.transporter = nodemailer.createTransport({
    //   host: config.mailchimp.smtp.host,
    //   port: process.env.SMTP_PORT,
    //   secure: false,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
  }

  async sendMail(to, subject, text, html) {
    try {
      const mailOptions = {
        from: `"TrustSurgery" <mdrakibulhasan12346@gmail.com>`,
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
