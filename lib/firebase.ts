import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDPxx5GpeEUvbhK2PZA-5eL0R43qygH11k",
    authDomain: "kevara-9bc71.firebaseapp.com",
    projectId: "kevara-9bc71",
    storageBucket: "kevara-9bc71.firebasestorage.app",
    messagingSenderId: "140030283136",
    appId: "1:140030283136:web:6c64e8150253d6723cc565",
    measurementId: "G-7P75LYTMKY"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
