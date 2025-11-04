// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// ==== Config (use .env) ====
const CLIENT_ID = process.env.OURA_CLIENT_ID;
const CLIENT_SECRET = process.env.OURA_CLIENT_SECRET;
const VERIFICATION_TOKEN = process.env.OURA_VERIFICATION_TOKEN;
const REDIRECT_URI = process.env.OURA_REDIRECT_URI || 'http://localhost:3000/oura/callback';
// Example scopes: pick what you need (see Oura docs)
const SCOPES = 'email personal daily'; 

// ---------------------------
// 1) OAuth: kick off login
// ---------------------------
app.get('/connect/oura', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex'); // store/verify in real use (session/cookie)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
  }).toString();

  res.redirect(`https://cloud.ouraring.com/oauth/authorize?${params}`);
});

// ----------------------------------------------
// 2) OAuth: REDIRECT URI (handle ?code=... here)
// ----------------------------------------------
app.get('/oura/callback', async (req, res) => {
  const { code /*, state */ } = req.query;
  if (!code) return res.status(400).send('Missing authorization code');

  try {
    // Exchange authorization code -> access/refresh tokens
    const tokenRes = await axios.post(
      'https://api.ouraring.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tokens = tokenRes.data; // { access_token, refresh_token, expires_in, token_type, ... }
    // TODO: persist tokens securely (DB, encrypted file, etc.)
    console.log('Oura tokens acquired:', {
      has_access: !!tokens.access_token,
      has_refresh: !!tokens.refresh_token,
      expires_in: tokens.expires_in,
    });

    res.send('Oura connected! You can close this tab.');
  } catch (err) {
    console.error('Token exchange failed:', err.response?.data || err.message);
    res.status(500).send('Token exchange failed');
  }
});

// ==================================================
// Existing WEBHOOK verification endpoint (unchanged)
// ==================================================
app.get('/oura-webhook', (req, res) => {
  const { verification_token, challenge } = req.query;
  if (verification_token === VERIFICATION_TOKEN) {
    res.json({ challenge });
  } else {
    res.status(401).send('Invalid verification token');
  }
});

// =====================================
// WEBHOOK handler
// =====================================
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

  const { event_type, data_type, object_id, user_id } = req.body;
  console.log(`Received ${event_type} for ${data_type} (object ${object_id})`);

  // Process in background
  fetchDataAsync(data_type, object_id, user_id).catch(console.error);

  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});

// Async fetch after webhook (stub)
async function fetchDataAsync(dataType, objectId, userId) {
  // Use stored access_token to call Oura APIs and update your DB
  // e.g., axios.get('https://api.ouraring.com/v2/usercollection/sleep', { headers: { Authorization: `Bearer ${token}` }})
}