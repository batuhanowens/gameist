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
                
                // Trigger sync for logged-in users
                const user = this.getCurrentUser();
                if (user) {
                    setTimeout(() => {
                        this.syncPendingScores();
                    }, 2000);
                }
            } else {
                // Retry if firebase not loaded yet
                setTimeout(() => this.init(), 1000);
            }
        }, 500);
    }

    loadFirebaseScripts() {
        if (document.getElementById('firebase-app-script')) return;

        const scripts = [
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js'
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
        this.realtimeDb = firebase.database();
        this.provider = new firebase.auth.GoogleAuthProvider();
        
        console.log('🔥 Firebase initialized for game page');
    }

    createAuthUI() {
        // Find or create auth container
        let authContainer = document.getElementById('gameist-auth-container');
        if (!authContainer) {
            authContainer = document.createElement('div');
            authContainer.id = 'gameist-auth-container';
            authContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
                padding: 12px;
                border-radius: 12px;
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                min-width: 200px;
            `;
            document.body.appendChild(authContainer);
        }

        authContainer.innerHTML = `
            <div id="game-login-btn" class="auth-btn" style="display: block;">
                <button onclick="gameistAuth.signIn()" style="
                    padding: 8px 16px;
                    background: #4285f4;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    </svg>
                    <span data-i18n="login_button">Giriş Yap</span>
                </button>
            </div>
            <div id="game-user-info" class="auth-info" style="display: none;">
                <!-- User info hidden - no profile box -->
            </div>
            <div id="game-auth-status" style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; display: none;"></div>
        `;

        // Apply translations if available
        if (typeof applyAuthTranslations === 'function') {
            applyAuthTranslations();
        }
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

    // Save score to leaderboard with cross-device sync
    async saveScore(gameName, score) {
        console.log('🎮 saveScore called with:', { gameName, score });
        
        const user = this.getCurrentUser();
        console.log('👤 Current user:', user);
        
        if (!user || !this.db) {
            console.error('❌ Cannot save score: user not logged in or DB not available');
            console.error('❌ User exists:', !!user);
            console.error('❌ DB exists:', !!this.db);
            return false;
        }

        console.log('💾 Attempting to save to Firestore...');
        console.log('🔥 DB reference:', this.db);
        
        const scoreData = {
            userId: user.uid,
            displayName: user.displayName,
            email: user.email,
            score: score,
            game: gameName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            deviceId: this.getDeviceId()
        };
        
        console.log('📄 Document data to save:', scoreData);
        
        try {
            // Try to save to Firestore first
            const firestoreResult = await this.saveToFirestore(scoreData);
            
            // Also save to Realtime Database for cross-device sync
            await this.saveToRealtimeDatabase(user.uid, scoreData);
            
            // Save to localStorage as backup
            this.saveToLocalStorage(scoreData);
            
            console.log('✅ Score saved successfully to all locations:', score);
            return firestoreResult;
            
        } catch (error) {
            console.error('❌ Failed to save score:', error);
            
            // Fallback: save to localStorage and mark for sync
            scoreData.firestoreFailed = true;
            scoreData.needsSync = true;
            this.saveToLocalStorage(scoreData);
            
            return false;
        }
    }

    // Get unique device ID for tracking
    getDeviceId() {
        let deviceId = localStorage.getItem('gameist_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('gameist_device_id', deviceId);
        }
        return deviceId;
    }

    // Save to Firestore with retry logic
    async saveToFirestore(scoreData) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`🔄 Firestore attempt ${attempt}/3`);
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Firestore write timeout')), 3000);
                });
                
                const writePromise = this.db.collection('leaderboard').add(scoreData);
                const result = await Promise.race([writePromise, timeoutPromise]);
                
                console.log('✅ Score saved to Firestore:', scoreData.score);
                console.log('📄 Document ID:', result.id);
                return result;
                
            } catch (attemptError) {
                console.error(`❌ Attempt ${attempt} failed:`, attemptError.message);
                if (attempt < 3) {
                    console.log(`⏳ Waiting ${attempt * 2} seconds before retry...`);
                    await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                } else {
                    throw attemptError;
                }
            }
        }
    }

    // Save to Realtime Database for cross-device sync
    async saveToRealtimeDatabase(userId, scoreData) {
        try {
            const database = this.realtimeDb || firebase.database();
            const userScoresRef = database.ref(`userScores/${userId}`);
            
            // Use timestamp as key for uniqueness
            const scoreKey = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const realtimeData = {
                ...scoreData,
                timestamp: scoreData.timestamp || Date.now()
            };
            
            await userScoresRef.child(scoreKey).set(realtimeData);
            console.log('✅ Score saved to Realtime Database for cross-device sync');
            
        } catch (error) {
            console.error('❌ Failed to save to Realtime Database:', error.message);
            // Don't throw error, continue with other storage methods
        }
    }

    // Save to localStorage as backup
    saveToLocalStorage(scoreData) {
        try {
            const localScores = JSON.parse(localStorage.getItem('gameist_local_scores') || '[]');
            localScores.push({
                ...scoreData,
                timestamp: Date.now()
            });
            
            // Keep only last 100 scores to prevent storage issues
            if (localScores.length > 100) {
                localScores.splice(0, localScores.length - 100);
            }
            
            localStorage.setItem('gameist_local_scores', JSON.stringify(localScores));
            console.log('✅ Score saved to localStorage backup');
            
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error.message);
        }
    }

    // Sync pending scores from localStorage to cloud
    async syncPendingScores() {
        const user = this.getCurrentUser();
        if (!user || !this.db) return;

        try {
            const localScores = JSON.parse(localStorage.getItem('gameist_local_scores') || '[]');
            const pendingScores = localScores.filter(score => 
                score.userId === user.uid && (score.firestoreFailed || score.needsSync)
            );

            console.log(`🔄 Found ${pendingScores.length} pending scores to sync`);

            for (const score of pendingScores) {
                try {
                    const scoreData = {
                        userId: score.userId,
                        displayName: score.displayName,
                        email: score.email,
                        score: score.score,
                        game: score.game,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        deviceId: score.deviceId || this.getDeviceId(),
                        syncedFrom: 'localStorage'
                    };

                    await this.saveToFirestore(scoreData);
                    await this.saveToRealtimeDatabase(user.uid, scoreData);
                    
                    // Mark as synced
                    score.firestoreFailed = false;
                    score.needsSync = false;
                    score.syncedAt = Date.now();
                    
                    console.log(`✅ Synced pending score: ${score.game} - ${score.score}`);
                } catch (error) {
                    console.error(`❌ Failed to sync pending score:`, error);
                }
            }

            // Update localStorage with sync status
            localStorage.setItem('gameist_local_scores', JSON.stringify(localScores));
            
        } catch (error) {
            console.error('❌ Failed to sync pending scores:', error);
        }
    }
}

// Initialize auth component
let gameistAuth;

// Initialize immediately if DOM is ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        gameistAuth = new GameistAuth();
        window.gameistAuth = gameistAuth; // Make it globally accessible
    });
} else {
    // DOM is already ready
    gameistAuth = new GameistAuth();
    window.gameistAuth = gameistAuth; // Make it globally accessible
}
