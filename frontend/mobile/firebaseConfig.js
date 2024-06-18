// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCgpGRTMSjsW9UjfKeJvRicGZpMX1foxns",
  authDomain: "icare-server.firebaseapp.com",
  projectId: "icare-server",
  storageBucket: "icare-server.appspot.com",
  messagingSenderId: "1001115187304",
  appId: "1:1001115187304:web:10e145ee1e59da3aaae3dd",
  measurementId: "G-BX3HNS3RZH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });

export { auth, app };