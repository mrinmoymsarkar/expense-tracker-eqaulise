import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// getAuth() probes localStorage/indexedDB persistence in a Promise; on the server
// (incl. Node 25's partial webstorage) that throws. Auth is only ever used client-side,
// so initialize it only in the browser (mirrors the lazy getDb() guard).
const auth: Auth = typeof window !== "undefined" ? getAuth(app) : (undefined as unknown as Auth);

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) {
    _db =
      typeof window !== "undefined"
        ? initializeFirestore(app, {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          })
        : initializeFirestore(app, {});
  }
  return _db;
}

export { app, auth };
