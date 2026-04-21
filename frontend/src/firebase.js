import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAwT7hphuT0Ns3WzXbsrsWwyzz9IjVkLfQ",
  authDomain: "interview-ai-61462.firebaseapp.com",
  projectId: "interview-ai-61462",
  storageBucket: "interview-ai-61462.firebasestorage.app",
  messagingSenderId: "199935541796",
  appId: "1:199935541796:web:8dbca76a9f3ed79d11ceb1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();