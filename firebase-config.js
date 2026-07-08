// ======================================================
// KONFIGURASI FIREBASE
// ======================================================
// GANTI seluruh objek di bawah ini dengan firebaseConfig
// yang Anda dapat dari Firebase Console:
// Project Settings > General > Your apps > Web app
//
// Contoh bentuknya:
// {
//   apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//   authDomain: "fidi-scie-auth.firebaseapp.com",
//   projectId: "fidi-scie-auth",
//   storageBucket: "fidi-scie-auth.appspot.com",
//   messagingSenderId: "123456789012",
//   appId: "1:123456789012:web:abcdef1234567890"
// }
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  getMultiFactorResolver
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcJDo5Kpy7uAZztfex6N4ql1cCB9pRc98",
  authDomain: "fidi-scie-auth.firebaseapp.com",
  projectId: "fidi-scie-auth",
  storageBucket: "fidi-scie-auth.firebasestorage.app",
  messagingSenderId: "432265864011",
  appId: "1:432265864011:web:8217c6f8ceb5c0158d7ece",
  measurementId: "G-F0XB5BNH0P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Diekspos ke window supaya script.js (non-module) bisa memakainya
window.fidiAuth = {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  getMultiFactorResolver
};

window.dispatchEvent(new Event("fidiAuthReady"));
  
