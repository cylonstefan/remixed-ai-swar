import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Agent, Team, Task, Message } from '../types';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Strictly compliant Firestore Error Utility
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on startup (as required by skill)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase service: current environment is offline. Local SQLite engine is fully operational.");
    }
  }
}
testConnection();

// Firebase Auth Service
export const firebaseAuth = {
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async loginWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Sync or create user profile on login
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        createdAt: new Date().toISOString()
      }, { merge: true });

      return user;
    } catch (error) {
      console.error("Firebase Login Error: ", error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await signOut(auth);
  }
};

// Firestore Sync Engine / DB CRUD
export const firebaseDb = {
  // --- Agents CRUD ---
  async getAgents(userId: string): Promise<Agent[]> {
    const p = `users/${userId}/agents`;
    try {
      const q = query(collection(db, p));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Agent);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, p);
      return [];
    }
  },

  async saveAgent(userId: string, agent: Agent): Promise<void> {
    const p = `users/${userId}/agents/${agent.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'agents', agent.id), {
        ...agent,
        userId,
        createdAt: agent.createdAt || new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, p);
    }
  },

  async deleteAgent(userId: string, agentId: string): Promise<void> {
    const p = `users/${userId}/agents/${agentId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'agents', agentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, p);
    }
  },

  // --- Teams CRUD ---
  async getTeams(userId: string): Promise<Team[]> {
    const p = `users/${userId}/teams`;
    try {
      const q = query(collection(db, p));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Team);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, p);
      return [];
    }
  },

  async saveTeam(userId: string, team: Team): Promise<void> {
    const p = `users/${userId}/teams/${team.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'teams', team.id), {
        ...team,
        userId,
        createdAt: team.createdAt || new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, p);
    }
  },

  async deleteTeam(userId: string, teamId: string): Promise<void> {
    const p = `users/${userId}/teams/${teamId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'teams', teamId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, p);
    }
  },

  // --- Tasks CRUD ---
  async getTasks(userId: string): Promise<Task[]> {
    const p = `users/${userId}/tasks`;
    try {
      const q = query(collection(db, p));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Task);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, p);
      return [];
    }
  },

  async saveTask(userId: string, task: Task): Promise<void> {
    const p = `users/${userId}/tasks/${task.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'tasks', task.id), {
        ...task,
        userId,
        createdAt: task.createdAt || new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, p);
    }
  },

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const p = `users/${userId}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, p);
    }
  },

  // --- Messages CRUD ---
  async getMessages(userId: string): Promise<Message[]> {
    const p = `users/${userId}/messages`;
    try {
      const q = query(collection(db, p));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Message);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, p);
      return [];
    }
  },

  async saveMessage(userId: string, message: Message): Promise<void> {
    const p = `users/${userId}/messages/${message.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'messages', message.id), {
        ...message,
        userId,
        timestamp: message.timestamp || new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, p);
    }
  },

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const p = `users/${userId}/messages/${messageId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'messages', messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, p);
    }
  }
};
