# History Daily

History Daily is a Firebase-ready Node.js web application that surfaces a notable fact or event for the current day in history. Each day the server requests a curated summary from the Gemini API, caches the response, and serves the content through a historically themed interface that supports Firebase Authentication for sign-in gated features.

## Features

- **Daily Gemini integration** – A scheduled job prompts Gemini with detailed instructions to return an engaging JSON summary, media links, sources, and Amazon book recommendations.
- **API caching** – Responses are cached server-side and automatically refreshed once per day (or on-demand through an authenticated endpoint).
- **Firebase authentication** – Front-end integrates with Firebase Authentication (Google provider by default) to enable user login.
- **Modern historical theme** – Responsive design blending modern UI cues with archival aesthetics.

## Getting started

### Prerequisites

- Node.js 18+
- A Google AI Studio Gemini API key (`GEMINI_API_KEY`)
- A Firebase project for hosting and authentication

### Installation

```bash
npm install
```

> **Note:** In restricted environments npm may be unable to reach the public registry. In that case, configure your npm proxy/registry and rerun `npm install` on your machine.

### Environment variables

Create a `.env` file in the project root with the following values:

```
PORT=8080
GEMINI_API_KEY=your_api_key
# Optional overrides
GEMINI_MODEL=gemini-1.5-pro-latest
ADMIN_API_TOKEN=shared_secret_for_manual_refresh
```

- `GEMINI_API_KEY` – required for scheduled Gemini requests.
- `ADMIN_API_TOKEN` – optional token enabling secure POST refreshes to `/api/daily-fact/refresh`.

### Firebase configuration

1. Duplicate `public/scripts/firebase-config.example.js` to `public/scripts/firebase-config.js`.
2. Replace the placeholder values with the configuration snippet from **Firebase Console → Project settings → General → Your apps**.

```js
window.__FIREBASE_CONFIG__ = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  appId: 'YOUR_APP_ID',
};
```

### Running locally

```bash
npm start
```

This starts the Express server on `http://localhost:8080`, serving both the API and static site.

### Deploying to Firebase Hosting

1. Build or configure a Firebase Hosting site.
2. Use `firebase init hosting` in this directory, choosing "Use an existing project".
3. Set the public directory to `public` and configure a rewrite so `/api/**` routes proxy to your Express server using Firebase Functions or Cloud Run.
4. Deploy with `firebase deploy` once your environment secrets are configured in Firebase.

### Scheduled Gemini refresh

- The server uses `node-cron` to refresh the daily fact at 08:00 UTC.
- On startup, the application fetches the current day's fact if the cache is empty or stale.
- Manual refresh: send a `POST` request to `/api/daily-fact/refresh` with header `x-admin-token` matching `ADMIN_API_TOKEN` (if set).

### Project structure

```
├── data/
│   └── dailyFact.json      # Cached Gemini response
├── public/                 # Static assets served to the browser
│   ├── index.html
│   ├── scripts/
│   │   ├── app.js
│   │   ├── firebase-config.js
│   │   └── firebase-config.example.js
│   └── styles/
│       └── main.css
├── src/
│   ├── app.js              # Express server and scheduler
│   ├── services/
│   │   └── geminiService.js
│   └── store/
│       └── dailyFactStore.js
├── package.json
└── README.md
```

## API

- `GET /api/daily-fact` – Returns `{ status: 'cached' | 'fresh', data: GeminiResponse }`.
- `POST /api/daily-fact/refresh` – Forces a refresh (requires `x-admin-token` if `ADMIN_API_TOKEN` is set).

### Gemini response schema

```json
{
  "title": "string",
  "eventDate": "ISO date string",
  "summary": "string",
  "whyItMatters": "string",
  "media": [
    { "type": "image" | "video", "url": "string", "caption": "string" }
  ],
  "sources": [
    { "title": "string", "url": "string", "description": "string" }
  ],
  "books": [
    { "title": "string", "author": "string", "amazonUrl": "string", "description": "string" }
  ],
  "fetchedAt": "ISO timestamp added by the server"
}
```

## Development notes

- The cached JSON lives in `data/dailyFact.json`. Add the file to `.gitignore` if you plan to store live data.
- Extend Firebase-authenticated features by checking the client auth state or adding protected API routes.
- For production deployments, consider moving persistent storage to Firestore or Cloud Storage.
