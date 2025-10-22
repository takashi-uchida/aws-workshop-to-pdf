import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

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
const analytics = getAnalytics(app);

export { analytics, logEvent };
