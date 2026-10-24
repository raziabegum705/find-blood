# Find Blood (CareRoute IC26-03-01)
Frontend (public/) + Node/Express/Socket.io backend (server/) with MongoDB, Gemini 2.5 Flash and WhatsApp Cloud API.

## Run
1. `cp .env.example .env` and fill MONGODB_URI, GEMINI_API_KEY (WhatsApp keys optional: without WA_TOKEN alerts print to the console)
2. `npm install && npm run seed && npm start` then open http://localhost:3000
   (Opening public/index.html directly still works as a demo with simulated data.)

## WhatsApp setup
- Create template `blood_alert` (language en): "Urgent blood request: {{1}}, {{2}} unit(s) needed at {{3}} for {{4}}. Can you help?" with quick-reply buttons "I Accept" and "Not Available".
- Webhook URL: https://YOUR-HTTPS-URL/webhook/whatsapp (use ngrok for local), verify token = WA_VERIFY_TOKEN, subscribe to `messages`.
- Only message donors who consented; phones are E.164 without "+".

## API
POST /api/triage (file) > GET /api/requests/:id/donors > POST /api/requests/:id/broadcast > webhook accepts (Socket.io `donor:accepted`) > POST /api/requests/:id/complete (kill switch). GET /api/banks.

## Not done yet
NMC registry lookup for the doctor number, Cloudinary/S3 upload storage, rate limiting, auth for the hospital desk "complete" action, and converting Chrome's webm voice notes to ogg/wav with ffmpeg if Gemini rejects them.

## Donor data (3 ways)
1. Demo data: `npm run seed` (or `npm run seed 150`). Add `DEMO_PHONE=91XXXXXXXXXX` to .env so donor "Hari" is your own WhatsApp number.
2. Registration: Home > Become a Donor (POST /api/donors; needs consent + location).
3. Bulk import: copy data/donors.sample.csv, fill it, set consent to yes ONLY for people who agreed, then `npm run import data/donors.csv`.
