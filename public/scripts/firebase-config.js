/* eslint-disable no-console */
if (!window.__FIREBASE_CONFIG__) {
  console.warn('Firebase configuration not found. Copy public/scripts/firebase-config.example.js to public/scripts/firebase-config.js and provide your project credentials.');
  window.__FIREBASE_CONFIG__ = {
    apiKey: 'demo',
    authDomain: 'demo.firebaseapp.com',
    projectId: 'demo',
    appId: 'demo',
  };
}
