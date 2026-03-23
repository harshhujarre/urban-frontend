// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHA64ptWIVJ1zLqqdliDvg3mzDsMAoWns",
  authDomain: "urbanstay-auth.firebaseapp.com",
  projectId: "urbanstay-auth",
  storageBucket: "urbanstay-auth.firebasestorage.app",
  messagingSenderId: "13856637905",
  appId: "1:13856637905:web:02d254512bf34cb31396f0",
  measurementId: "G-GXFDDBC27N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);