import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { db, auth } from './firebase';
import { UserProfile, Lesson, PracticeSession, LiveCallSession } from '../types';

export interface UserLessonProgressDoc {
  lessonId: string;
  userId: string;
  track?: string;
  tier?: number;
  completedAt: string;
  userLyrics?: string;
  score?: number;
  xpAwarded: number;
}

/**
 * Ensures a Firebase Auth user exists (using Anonymous Auth or existing session).
 * Returns the current authenticated UID.
 */
export async function ensureFirebaseAuth(): Promise<string> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user.uid);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          resolve(cred.user.uid);
        } catch (error) {
          console.warn('Firebase Auth anonymous sign-in fallback:', error);
          unsubscribe();
          // Fallback to local identifier if network/auth offline
          const fallbackUid = localStorage.getItem('rimalab_local_uid') || `user_${Date.now()}`;
          localStorage.setItem('rimalab_local_uid', fallbackUid);
          resolve(fallbackUid);
        }
      }
    });
  });
}

/**
 * Get current Auth UID if available
 */
export function getCurrentAuthUid(): string | null {
  return auth.currentUser?.uid || localStorage.getItem('rimalab_local_uid') || null;
}

/**
 * Saves or updates a UserProfile in Firestore
 */
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<boolean> {
  try {
    const uid = profile.userId || (await ensureFirebaseAuth());
    const profileDocRef = doc(db, 'users', uid, 'profile', 'main');
    const userDocRef = doc(db, 'users', uid);

    const profileData = {
      ...profile,
      userId: uid,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(profileDocRef, profileData, { merge: true });
    await setDoc(userDocRef, {
      id: uid,
      email: profile.email || 'user@rimalab.app',
      role: profile.role || 'USER',
      lastActiveAt: new Date().toISOString(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.warn('Error saving user profile to Firestore:', error);
    return false;
  }
}

/**
 * Subscribes to real-time UserProfile changes from Firestore
 */
export function subscribeUserProfileFromFirestore(userId: string, onUpdate: (profile: UserProfile) => void): () => void {
  try {
    const profileDocRef = doc(db, 'users', userId, 'profile', 'main');
    const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as UserProfile);
      }
    }, (error) => {
      console.warn('Firestore profile subscription notice:', error);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore profile subscription error:', err);
    return () => {};
  }
}

/**
 * Loads UserProfile from Firestore
 */
export async function loadUserProfileFromFirestore(userId?: string): Promise<UserProfile | null> {
  try {
    const uid = userId || (await ensureFirebaseAuth());
    const profileDocRef = doc(db, 'users', uid, 'profile', 'main');
    const docSnap = await getDoc(profileDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn('Error loading user profile from Firestore:', error);
    return null;
  }
}

/**
 * Saves a completed lesson record to Firestore
 */
export async function saveLessonCompletionToFirestore(
  lessonId: string, 
  customLyrics: string, 
  xpReward: number,
  lessonMeta?: Partial<Lesson>
): Promise<boolean> {
  try {
    const uid = await ensureFirebaseAuth();
    const lessonDocRef = doc(db, 'users', uid, 'lessons', lessonId);

    const progressData: UserLessonProgressDoc = {
      lessonId,
      userId: uid,
      track: lessonMeta?.track || 'geral',
      tier: lessonMeta?.tier || 1,
      completedAt: new Date().toISOString(),
      userLyrics: customLyrics,
      xpAwarded: xpReward,
    };

    await setDoc(lessonDocRef, progressData, { merge: true });
    return true;
  } catch (error) {
    console.warn('Error saving lesson progress to Firestore:', error);
    return false;
  }
}

/**
 * Loads all completed lesson records for the current user from Firestore
 */
export async function loadCompletedLessonsFromFirestore(userId?: string): Promise<Record<string, UserLessonProgressDoc>> {
  try {
    const uid = userId || (await ensureFirebaseAuth());
    const lessonsColRef = collection(db, 'users', uid, 'lessons');
    const snapshot = await getDocs(lessonsColRef);

    const completedMap: Record<string, UserLessonProgressDoc> = {};
    snapshot.forEach((doc) => {
      completedMap[doc.id] = doc.data() as UserLessonProgressDoc;
    });

    return completedMap;
  } catch (error) {
    console.warn('Error loading completed lessons from Firestore:', error);
    return {};
  }
}

/**
 * Saves a freestyle practice session to Firestore
 */
export async function savePracticeSessionToFirestore(sessionData: PracticeSession): Promise<boolean> {
  try {
    const uid = sessionData.userId || (await ensureFirebaseAuth());
    const sessionDocRef = doc(db, 'users', uid, 'sessions', sessionData.id);

    await setDoc(sessionDocRef, {
      ...sessionData,
      userId: uid,
      createdAt: sessionData.createdAt || new Date().toISOString(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.warn('Error saving practice session to Firestore:', error);
    return false;
  }
}

/**
 * Loads recent practice sessions from Firestore
 */
export async function loadPracticeSessionsFromFirestore(userId?: string): Promise<PracticeSession[]> {
  try {
    const uid = userId || (await ensureFirebaseAuth());
    const sessionsColRef = collection(db, 'users', uid, 'sessions');
    const q = query(sessionsColRef, orderBy('createdAt', 'desc'), limit(20));
    const snapshot = await getDocs(q);

    const sessions: PracticeSession[] = [];
    snapshot.forEach((doc) => {
      sessions.push(doc.data() as PracticeSession);
    });

    return sessions;
  } catch (error) {
    console.warn('Error loading practice sessions from Firestore:', error);
    return [];
  }
}

/**
 * Subscribes to live call updates from Firestore with real-time onSnapshot
 */
export function subscribeLiveCallFromFirestore(onUpdate: (call: LiveCallSession) => void): () => void {
  try {
    const liveCallDocRef = doc(db, 'live_calls', 'active');
    const unsubscribe = onSnapshot(liveCallDocRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as LiveCallSession);
      }
    }, (error) => {
      console.warn('Firestore Live Call subscription error:', error);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore live call listener setup error:', err);
    return () => {};
  }
}

/**
 * Saves or updates the active Live Call Session in Firestore for all users
 */
export async function saveLiveCallToFirestore(callData: Partial<LiveCallSession>): Promise<boolean> {
  try {
    const liveCallDocRef = doc(db, 'live_calls', 'active');
    await setDoc(liveCallDocRef, {
      ...callData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('Error saving live call to Firestore:', error);
    return false;
  }
}
