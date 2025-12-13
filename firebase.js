// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxh_fO9nfoOTk_lE3xjB0QXsYeT5etopc",
  authDomain: "rwat-ca2-cf443.firebaseapp.com",
  projectId: "rwat-ca2-cf443",
  storageBucket: "rwat-ca2-cf443.firebasestorage.app",
  messagingSenderId: "751533144550",
  appId: "1:751533144550:web:5e67a7049f8f6d7072fe27",
  measurementId: "G-TCFLR94GHK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// Connect to Firestore
const db = getFirestore(app);

// Export the database so other files can use it
export { db };