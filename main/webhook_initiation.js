import dotenv from "dotenv";
dotenv.config();
import fetch from 'node-fetch'; // if using CommonJS, require('node-fetch')

console.log("CLIENT_ID:", process.env.OURA_CLIENT_ID);
console.log("CLIENT_SECRET length:", process.env.OURA_CLIENT_SECRET?.length);
console.log("CALLBACK_URL:", process.env.CALLBACK_URL);
console.log("WEBHOOK_TOKEN length:", process.env.OURA_WEBHOOK_TOKEN?.length);

const url = "https://api.ouraring.com/v2/webhook/subscription";

const headers = {
  "x-client-id": process.env.OURA_CLIENT_ID,
  "x-client-secret": process.env.OURA_CLIENT_SECRET,
  "Content-Type": "application/json",
};

const body = {
  callback_url: process.env.CALLBACK_URL,
  verification_token: process.env.OURA_WEBHOOK_TOKEN,
  event_type: "update",
  data_type: "sleep",
};

(async () => {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
})();
