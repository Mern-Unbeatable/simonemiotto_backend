const emailEmitter = require('./eventEmitter');

emailEmitter.on('user-registered', async (userData) => {
  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;
  const SERVER_PREFIX = process.env.SERVER_PREFIX;

  if (!API_KEY || !LIST_ID || !SERVER_PREFIX) {
    console.warn(
      'Mailchimp is not configured. Skipping subscribe for:',
      userData.email,
    );
    return;
  }

  const authHeader =
    'Basic ' + Buffer.from(`anystring:${API_KEY}`).toString('base64');

  const nameParts = userData.name ? userData.name.trim().split(' ') : [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  try {
    const response = await fetch(
      `https://${SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: userData.email,
          status: 'subscribed',
          merge_fields: {
            FNAME: firstName || '',
            LNAME: lastName || '',
          },
        }),
      },
    );
    const data = await response.json();
  } catch (error) {
    console.error('Mailchimp Error in Background:', error.message);
  }
});
