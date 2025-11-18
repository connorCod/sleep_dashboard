const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
require('dotenv').config()

const app = express();
app.use(bodyParser.json());

const CLIENT_SECRET = process.env.OURA_CLIENT_SECRET;

// Verification endpoint for webhook setup
app.get('/oura-webhook', (req, res) => {
  const { verification_token, challenge } = req.query;

  // Verify the token matches what you expect
  if (verification_token === "YOUR_VERIFICATION_TOKEN") {
    res.json({ challenge });
  } else {
    res.status(401).send('Invalid verification token');
  }
});

// Webhook handler for incoming data
app.post('/oura-webhook', (req, res) => {
  const signature = req.headers['x-oura-signature'];
  const timestamp = req.headers['x-oura-timestamp'];

  // Verify HMAC signature for security
  const hmac = crypto.createHmac('sha256', CLIENT_SECRET);
  hmac.update(timestamp + JSON.stringify(req.body));
  const calculatedSignature = hmac.digest('hex').toUpperCase();

  if (calculatedSignature !== signature) {
    return res.status(401).send('Invalid signature');
  }

  // Process the webhook data
  const { event_type, data_type, object_id, user_id } = req.body;

  console.log(`Received ${event_type} event for ${data_type}`);

  // Fetch the updated data using the object_id
  // This should be done asynchronously to respond quickly
  fetchDataAsync(data_type, object_id, user_id);

  // Respond quickly to acknowledge receipt
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});

// Asynchronous function to fetch the updated data
async function fetchDataAsync(dataType, objectId, userId) {
  // Implementation depends on your data storage and processing needs
  // This would typically fetch the new data from the Oura API
  // and update your database or application state
}