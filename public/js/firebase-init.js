import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics, logEvent, setAnalyticsCollectionEnabled } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4l7mRSSHJz7bN1kmI1G7fqELHn2ID_kQ",
  authDomain: "aws-workshop-to-pdf.firebaseapp.com",
  projectId: "aws-workshop-to-pdf",
  storageBucket: "aws-workshop-to-pdf.firebasestorage.app",
  messagingSenderId: "316108199777",
  appId: "1:316108199777:web:5c116a1ff8776c07f4d720",
  measurementId: "G-0Y5CS35XQQ"
};

const app = initializeApp(firebaseConfig);
let analyticsInstance = null;

function ensureAnalytics() {
  if (!analyticsInstance) {
    analyticsInstance = getAnalytics(app);
    window.analytics = analyticsInstance;
    window.logEvent = logEvent;
  }
  return analyticsInstance;
}

function applyConsent(consentState) {
  if (!consentState) {
    return;
  }

  if (consentState.analytics) {
    const analytics = ensureAnalytics();
    setAnalyticsCollectionEnabled(analytics, true);
  } else if (analyticsInstance) {
    setAnalyticsCollectionEnabled(analyticsInstance, false);
  }
}

window.addEventListener('consent:updated', (event) => {
  applyConsent(event.detail);
});

if (window.__consentState) {
  applyConsent(window.__consentState);
}
