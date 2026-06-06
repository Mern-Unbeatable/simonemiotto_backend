const EmailService = require('../../utils/email');
const emailEmitter = require('../../utils/eventEmitter');

const emailService = new EmailService();

emailEmitter.on('user-registered', async (userData) => {
  const subject = 'Welcome to TrustSurgery!';
  const text = `Hi ${userData.name},\n\nThank you for registering at TrustSurgery. We're excited to have you on board!\n\nVerify your account here: [Verification Link]\n\nBest regards,\nThe TrustSurgery Team`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to TrustSurgery</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }
        .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background-color: #005A9C; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .content h2 { color: #005A9C; margin-top: 0; font-size: 22px; }
        .content p { font-size: 16px; color: #555555; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { background-color: #00A86B; color: #ffffff !important; padding: 14px 30px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px; display: inline-block; transition: background-color 0.3s; }
        .footer { background-color: #f4f7f6; padding: 20px; text-align: center; font-size: 13px; color: #777777; border-top: 1px solid #ebeeec; }
        .footer a { color: #005A9C; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>TrustSurgery</h1>
        </div>

        <div class="content">
          <h2>Welcome aboard, ${userData.name}!</h2>
          <p>Thank you for creating an account with <strong>TrustSurgery</strong>. We are dedicated to providing you with trusted, secure, and world-class surgical care management.</p>
          <p>To get started and explore your personalized dashboard, please verify your email address by clicking the button below:</p>
          
          <div class="btn-container">
            <a href="https://trustsurgery.com/dashboard" class="btn" target="_blank">Explore Dashboard</a>
          </div>

          <p>If you have any questions or need assistance, our support team is always here to help you.</p>
          <p>Best regards,<br><strong>The TrustSurgery Team</strong></p>
        </div>

        <div class="footer">
          <p>© 2026 TrustSurgery. All rights reserved.</p>
          <p>You received this email because you signed up on our website.<br>
          <a href="https://trustsurgery.com/privacy">Privacy Policy</a> | <a href="https://trustsurgery.com/support">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await emailService.sendMail(userData.email, subject, text, html);
});

emailEmitter.on('subscription-confirmed', async (data) => {
  const { userData, subscriptionDetails } = data;

  const subject = 'Thank You for Your Subscription! | TrustSurgery';

  const text = `Hi ${userData.name},\n\nThank you for subscribing to TrustSurgery! Your payment for the ${subscriptionDetails.planName} has been processed successfully.\n\nInvoice ID: ${subscriptionDetails.invoiceId}\nAmount Paid: ${subscriptionDetails.amount}\nNext Renewal Date: ${subscriptionDetails.renewalDate}\n\nYou can now access all premium surgery management tools from your dashboard.\n\nBest regards,\nThe TrustSurgery Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Confirmed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333333; }
        .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { background-color: #005A9C; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .content h2 { color: #005A9C; margin-top: 0; font-size: 22px; }
        .content p { font-size: 16px; color: #555555; }
        
        .receipt-table { width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f9fbfb; border: 1px solid #ebeeec; border-radius: 6px; }
        .receipt-table td { padding: 12px 15px; font-size: 15px; border-bottom: 1px solid #ebeeec; }
        .receipt-table td.label { font-weight: bold; color: #666666; }
        .receipt-table td.value { text-align: right; color: #111111; }
        .receipt-table tr:last-child td { border-bottom: none; font-size: 16px; font-weight: bold; color: #00A86B; }

        .btn-container { text-align: center; margin: 30px 0; }
        .btn { background-color: #00A86B; color: #ffffff !important; padding: 14px 30px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px; display: inline-block; }
        .footer { background-color: #f4f7f6; padding: 20px; text-align: center; font-size: 13px; color: #777777; border-top: 1px solid #ebeeec; }
        .footer a { color: #005A9C; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>TrustSurgery</h1>
        </div>

        <div class="content">
          <h2>Subscription Confirmed! 🎉</h2>
          <p>Dear ${userData.name},</p>
          <p>Thank you for subscribing to <strong>TrustSurgery</strong>. Your payment has been successfully processed, and your premium account is now fully active.</p>
          
          <p>Here is a summary of your purchase:</p>
          
          <table class="receipt-table">
            <tr>
              <td class="label">Plan Name</td>
              <td class="value">${subscriptionDetails.planName}</td>
            </tr>
            <tr>
              <td class="label">Invoice ID</td>
              <td class="value">${subscriptionDetails.invoiceId}</td>
            </tr>
            <tr>
              <td class="label">Next Renewal Date</td>
              <td class="value">${subscriptionDetails.renewalDate}</td>
            </tr>
            <tr>
              <td class="label">Amount Paid</td>
              <td class="value">${subscriptionDetails.amount}</td>
            </tr>
          </table>

          <p>You can now seamlessly manage your surgical cases, collaborate with teams, and access all advanced clinical tools.</p>
          
          <div class="btn-container">
            <a href="https://trustsurgery.com/dashboard" class="btn" target="_blank">Go to Dashboard</a>
          </div>

          <p>Need a full PDF invoice? You can download it anytime from your billing settings.</p>
          <p>Best regards,<br><strong>The TrustSurgery Team</strong></p>
        </div>

        <div class="footer">
          <p>© 2026 TrustSurgery. All rights reserved.</p>
          <p>You are receiving this receipt because of a subscription purchase on your account.<br>
          <a href="https://trustsurgery.com/billing">Billing Settings</a> | <a href="https://trustsurgery.com/support">Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await emailService.sendMail(userData.email, subject, text, html);
});
