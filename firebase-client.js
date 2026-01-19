const firebaseConfig = {
  apiKey: "AIzaSyD7ckcqdZWfnUx5r8uKmvu9Ikax1x5Qidk",
  authDomain: "gameist.firebaseapp.com",
  projectId: "gameist",
  storageBucket: "gameist.firebasestorage.app",
  messagingSenderId: "525659299937",
  appId: "1:525659299937:web:1c8343a25be2a994bcca20",
  measurementId: "G-WE9R0GWKM6"
};

let _initPromise = null;
let _ctx = null;
let _authObserverAttached = false;

async function ensureInit() {
  try {
    if (_ctx) return _ctx;
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
      const base = "https://www.gstatic.com/firebasejs/12.8.0/";
      const [appMod, authMod, fsMod] = await Promise.all([
        import(base + "firebase-app.js"),
        import(base + "firebase-auth.js"),
        import(base + "firebase-firestore.js")
      ]);

      const app = appMod.initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      const db = fsMod.getFirestore(app);

      _ctx = {
        app,
        auth,
        db,
        authMod,
        fsMod
      };
      return _ctx;
    })();

    return _initPromise;
  } catch (e) {
    _initPromise = null;
    throw e;
  }
}

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

  async function attachObserverOnce() {
    if (_authObserverAttached) return;
    try {
      const ctx = await ensureInit();
      if (_authObserverAttached) return;
      _authObserverAttached = true;

      ctx.authMod.onAuthStateChanged(ctx.auth, (user) => {
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
            const ref = ctx.fsMod.doc(ctx.db, 'users', user.uid);
            ctx.fsMod.setDoc(ref, {
              displayName: user.displayName || null,
              email: user.email || null,
              photoURL: user.photoURL || null,
              lastSeenAt: ctx.fsMod.serverTimestamp()
            }, { merge: true });
          } catch (_) {
          }
        }
      });
    } catch (_) {
    }
  }

  if (btn) {
    btn.addEventListener('click', async () => {
      const ctx = await ensureInit();
      await attachObserverOnce();
      const provider = new ctx.authMod.GoogleAuthProvider();
      await ctx.authMod.signInWithPopup(ctx.auth, provider);
    });
  }

  if (logout) {
    logout.addEventListener('click', async () => {
      const ctx = await ensureInit();
      await attachObserverOnce();
      await ctx.authMod.signOut(ctx.auth);
    });
  }

  attachObserverOnce();
}

async function submitScore(payload) {
  const ctx = await ensureInit();
  const user = ctx.auth.currentUser;
  if (!user) return { ok: false, reason: 'not_signed_in' };

  const game = safeText(payload?.game || 'unknown');
  const score = Number(payload?.score || 0);
  const wave = Number(payload?.wave || 0);
  const durationMs = Number(payload?.durationMs || 0);

  await ctx.fsMod.addDoc(ctx.fsMod.collection(ctx.db, 'scores'), {
    uid: user.uid,
    game,
    score: Number.isFinite(score) ? score : 0,
    wave: Number.isFinite(wave) ? wave : 0,
    durationMs: Number.isFinite(durationMs) ? durationMs : 0,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    ts: ctx.fsMod.serverTimestamp()
  });

  return { ok: true };
}

async function fetchTopScores(game, n) {
  const ctx = await ensureInit();
  const g = safeText(game || 'elementist');
  const lim = Math.max(1, Math.min(50, (n | 0) || 10));

  const q = ctx.fsMod.query(
    ctx.fsMod.collection(ctx.db, 'scores'),
    ctx.fsMod.where('game', '==', g),
    ctx.fsMod.orderBy('score', 'desc'),
    ctx.fsMod.limit(lim)
  );

  const snap = await ctx.fsMod.getDocs(q);
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
  get app() { return _ctx ? _ctx.app : null; },
  get auth() { return _ctx ? _ctx.auth : null; },
  get db() { return _ctx ? _ctx.db : null; },
  ensureInit,
  submitScore,
  fetchTopScores
};

renderAuthUI();

try {
  const idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 2500); };
  idle(function () {
    try { ensureInit(); } catch (_) { }
  });
} catch (_) {
}
