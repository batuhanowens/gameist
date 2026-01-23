// Shared Authentication Component for Game Pages
// This component provides consistent auth UI across all game pages

class GameistAuth {
    constructor() {
        this.firebaseConfig = {
            apiKey: "AIzaSyD7ckcqdZWfnUx5r8uKmvu9Ikax1x5Qidk",
            authDomain: "gameist.firebaseapp.com",
            projectId: "gameist",
            storageBucket: "gameist.firebasestorage.app",
            messagingSenderId: "525659299937",
            appId: "1:525659299937:web:1c8343a25be2a994bcca20",
            measurementId: "G-WE9R0GWKM6"
        };
        
        this.init();
    }

    init() {
        // Load Firebase scripts if not already loaded
        this.loadFirebaseScripts();
        
        // Wait for scripts to load, then initialize
        setTimeout(() => {
            if (typeof firebase !== 'undefined') {
                this.initFirebase();
                this.createAuthUI();
                this.checkSavedSession();
            }
        }, 1000);
    }

    loadFirebaseScripts() {
        if (document.getElementById('firebase-app-script')) return;

        const scripts = [
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'
        ];

        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.id = src.split('/').pop().replace('.js', '-script');
            document.head.appendChild(script);
        });
    }

    initFirebase() {
        if (!firebase.apps.length) {
            firebase.initializeApp(this.firebaseConfig);
        }
        
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.provider = new firebase.auth.GoogleAuthProvider();
        
        console.log('🔥 Firebase initialized for game page');
    }

    createAuthUI() {
        // Auth UI disabled - no login/logout buttons in game pages
        console.log('🔕 Auth UI disabled for game pages');
        return;
    }

    async signIn() {
        const statusEl = document.getElementById('game-auth-status');
        statusEl.style.display = 'block';
        statusEl.textContent = '🔄 Giriş yapılıyor...';

        try {
            const result = await this.auth.signInWithPopup(this.provider);
            this.handleAuthSuccess(result);
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            this.updateUI(null);
            localStorage.removeItem('gameist_user');
            console.log('✅ Signed out from game');
        } catch (error) {
            console.error('❌ Sign out error:', error);
        }
    }

    handleAuthSuccess(result) {
        const user = result.user;
        this.updateUI(user);
        
        // Save session
        localStorage.setItem('gameist_user', JSON.stringify({
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            uid: user.uid
        }));

        const statusEl = document.getElementById('game-auth-status');
        statusEl.textContent = '✅ Giriş başarılı!';
        setTimeout(() => statusEl.style.display = 'none', 2000);

        console.log('✅ Game authentication successful:', user.displayName);
    }

    handleAuthError(error) {
        const statusEl = document.getElementById('game-auth-status');
        statusEl.textContent = '❌ Giriş başarısız: ' + error.message;
        setTimeout(() => statusEl.style.display = 'none', 3000);
        console.error('❌ Game auth error:', error);
    }

    updateUI(user) {
        const loginBtn = document.getElementById('game-login-btn');
        const userInfo = document.getElementById('game-user-info');

        if (user) {
            loginBtn.style.display = 'none';
            userInfo.style.display = 'block';
            document.getElementById('game-user-name').textContent = user.displayName;
            document.getElementById('game-user-photo').src = user.photoURL;
        } else {
            loginBtn.style.display = 'block';
            userInfo.style.display = 'none';
        }
    }

    checkSavedSession() {
        const savedUser = localStorage.getItem('gameist_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                this.updateUI(user);
                console.log('🔄 Restored session for game:', user.displayName);
            } catch (e) {
                console.error('❌ Failed to restore game session:', e);
            }
        }
    }

    // Get current user for game logic
    getCurrentUser() {
        const savedUser = localStorage.getItem('gameist_user');
        return savedUser ? JSON.parse(savedUser) : null;
    }

    // Save score to leaderboard
    async saveScore(gameName, score) {
        const user = this.getCurrentUser();
        if (!user || !this.db) {
            console.error('❌ Cannot save score: user not logged in or DB not available');
            return false;
        }

        try {
            await this.db.collection('leaderboard').add({
                userId: user.uid,
                displayName: user.displayName,
                email: user.email,
                score: score,
                game: gameName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Score saved to leaderboard:', score);
            return true;
        } catch (error) {
            console.error('❌ Failed to save score:', error);
            return false;
        }
    }
}

// Initialize auth component
let gameistAuth;
document.addEventListener('DOMContentLoaded', function() {
    gameistAuth = new GameistAuth();
    window.gameistAuth = gameistAuth; // Make it globally accessible
});
