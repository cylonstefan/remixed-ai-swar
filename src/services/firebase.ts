import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
try { setLogLevel('silent'); } catch (e) {}

let dbInstance: any = null;
export const db = (() => {
  try {
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    dbInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
    return dbInstance;
  } catch (error) {
    console.warn("Firestore log init failed, attempting re-initialization...", error);
    dbInstance = getFirestore(app);
    return dbInstance;
  }
})();

export const auth = getAuth();

export interface LogEntry {
  id: string;
  agentId?: string;
  agentName?: string;
  action: string;
  details?: string;
  timestamp: string;
  centralized?: boolean;
}

export function subscribeToLogs(callback: (logs: LogEntry[]) => void) {
  const q = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => doc.data() as LogEntry);
    callback(logs);
  }, (error) => {
    console.error("Firestore Log Subscription Error:", error);
  });
}
