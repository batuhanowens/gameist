import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp, collection, addDoc, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7ckcqdZWfnUx5r8uKmvu9Ikax1x5Qidk",
  authDomain: "gameist.firebaseapp.com",
  projectId: "gameist",
  storageBucket: "gameist.firebasestorage.app",
  messagingSenderId: "525659299937",
  appId: "1:525659299937:web:1c8343a25be2a994bcca20",
  measurementId: "G-WE9R0GWKM6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function safeText(s) {
  try {
    return String(s == null ? "" : s);
  } catch (_) {
    return "";
  }
}

function renderAuthUI() {
  const btn = document.getElementById('gameistLoginBtn');
  const img = document.getElementById('gameistUserImg');
  const name = document.getElementById('gameistUserName');
  const logout = document.getElementById('gameistLogoutBtn');

  const hasAny = !!btn || !!logout || !!img || !!name;
  if (!hasAny) return;

  onAuthStateChanged(auth, (user) => {
    const signedIn = !!user;

    if (btn) btn.style.display = signedIn ? 'none' : '';
    if (logout) logout.style.display = signedIn ? '' : 'none';

    if (img) {
      img.style.display = signedIn && user.photoURL ? '' : 'none';
      if (signedIn && user.photoURL) img.src = user.photoURL;
    }

    if (name) {
      name.style.display = signedIn ? '' : 'none';
      name.textContent = signedIn ? safeText(user.displayName || user.email || 'Player') : '';
    }

    if (signedIn) {
      try {
        const ref = doc(db, 'users', user.uid);
        setDoc(ref, {
          displayName: user.displayName || null,
          email: user.email || null,
          photoURL: user.photoURL || null,
          lastSeenAt: serverTimestamp()
        }, { merge: true });
      } catch (_) {
      }
    }
  });

  if (btn) {
    btn.addEventListener('click', async () => {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    });
  }

  if (logout) {
    logout.addEventListener('click', async () => {
      await signOut(auth);
    });
  }
}

async function submitScore(payload) {
  const user = auth.currentUser;
  if (!user) return { ok: false, reason: 'not_signed_in' };

  const game = safeText(payload?.game || 'unknown');
  const score = Number(payload?.score || 0);
  const wave = Number(payload?.wave || 0);
  const durationMs = Number(payload?.durationMs || 0);

  await addDoc(collection(db, 'scores'), {
    uid: user.uid,
    game,
    score: Number.isFinite(score) ? score : 0,
    wave: Number.isFinite(wave) ? wave : 0,
    durationMs: Number.isFinite(durationMs) ? durationMs : 0,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    ts: serverTimestamp()
  });

  return { ok: true };
}

async function fetchTopScores(game, n) {
  const g = safeText(game || 'elementist');
  const lim = Math.max(1, Math.min(50, (n | 0) || 10));

  const q = query(
    collection(db, 'scores'),
    where('game', '==', g),
    orderBy('score', 'desc'),
    limit(lim)
  );

  const snap = await getDocs(q);
  const out = [];
  snap.forEach((d) => {
    try {
      const v = d.data() || {};
      out.push({
        uid: safeText(v.uid),
        score: Number(v.score || 0),
        wave: Number(v.wave || 0),
        displayName: safeText(v.displayName || ''),
        photoURL: safeText(v.photoURL || '')
      });
    } catch (_) {
    }
  });
  return out;
}

window.GameistFirebase = {
  app,
  auth,
  db,
  submitScore,
  fetchTopScores
};

renderAuthUI();
