// Gameist Score Synchronization System
// This script provides real-time score synchronization across all game pages and devices

(function() {
    'use strict';
    
    console.log('🔄 Gameist Score Sync loading...');
    
    // Wait for DOM to be ready
    function initSync() {
        if (window.gameistScoreSync) {
            console.log('✅ Score sync already initialized');
            return;
        }
        
        // Global score synchronization system
        window.gameistScoreSync = {
            lastUpdate: 0,
            isListening: false,
            realtimeListener: null,
            
            // Initialize real-time listeners
            init() {
                if (this.isListening) return;
                this.isListening = true;
                
                console.log('🔄 Initializing cross-device score synchronization...');
                
                // Listen for storage events (cross-tab sync)
                window.addEventListener('storage', (e) => {
                    if (e.key === 'gameist_score_update') {
                        console.log('📡 Storage event detected - refreshing scores');
                        this.triggerRefresh();
                    }
                });
                
                // Listen for visibility changes (tab switch)
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                        console.log('👁️ Tab became visible - checking for score updates');
                        this.checkForUpdates();
                    }
                });
                
                // Listen for window focus
                window.addEventListener('focus', () => {
                    console.log('🎯 Window focused - checking for score updates');
                    this.checkForUpdates();
                });
                
                // Initialize Firebase Realtime Database listener for cross-device sync
                this.initRealtimeListener();
                
                // Set up periodic sync
                setInterval(() => {
                    this.checkForUpdates();
                }, 30000); // Check every 30 seconds
                
                console.log('✅ Cross-device score synchronization initialized');
            },
            
            // Initialize Firebase Realtime Database listener
            initRealtimeListener() {
                try {
                    // Check if Firebase is available
                    if (typeof firebase === 'undefined') {
                        console.log('⚠️ Firebase not available, using fallback sync');
                        return;
                    }
                    
                    const savedUser = localStorage.getItem('gameist_user');
                    if (!savedUser) {
                        console.log('⚠️ No user found, skipping realtime listener');
                        return;
                    }
                    
                    const user = JSON.parse(savedUser);
                    const database = firebase.database();
                    
                    // Listen for real-time score updates
                    const userScoresRef = database.ref(`userScores/${user.uid}`);
                    
                    this.realtimeListener = userScoresRef.on('value', (snapshot) => {
                        const data = snapshot.val();
                        if (data) {
                            console.log('📡 Real-time score update received from Firebase');
                            this.handleRealtimeUpdate(data);
                        }
                    });
                    
                    console.log('✅ Firebase Realtime listener established for user:', user.displayName);
                    
                } catch (error) {
                    console.error('❌ Failed to initialize realtime listener:', error);
                }
            },
            
            // Handle real-time updates from Firebase
            handleRealtimeUpdate(data) {
                const scores = Object.values(data);
                const latestScore = scores.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
                
                if (latestScore && latestScore.timestamp > this.lastUpdate) {
                    console.log(`🎮 Real-time update: ${latestScore.game} - ${latestScore.score} pts`);
                    
                    // Update UI if available
                    if (typeof loadUserStats === 'function') {
                        const savedUser = localStorage.getItem('gameist_user');
                        if (savedUser) {
                            const user = JSON.parse(savedUser);
                            loadUserStats(user.uid);
                        }
                    }
                    
                    // Trigger custom event
                    window.dispatchEvent(new CustomEvent('gameistRealtimeUpdate', {
                        detail: {
                            game: latestScore.game,
                            score: latestScore.score,
                            timestamp: latestScore.timestamp
                        }
                    }));
                    
                    // Update last update time
                    this.lastUpdate = latestScore.timestamp;
                    
                    // Show notification
                    this.showUpdateNotification(latestScore);
                }
            },
            
            // Show update notification
            showUpdateNotification(score) {
                // Create subtle notification
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    z-index: 10000;
                    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    animation: slideIn 0.3s ease-out;
                `;
                
                notification.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">🎮</span>
                        <div>
                            <div style="font-weight: 700;">Puan Güncellendi!</div>
                            <div style="font-size: 12px; opacity: 0.9;">${score.game}: ${score.score.toLocaleString()} pts</div>
                        </div>
                    </div>
                `;
                
                // Add animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
                
                document.body.appendChild(notification);
                
                // Auto-remove after 3 seconds
                setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, 3000);
            },
            
            // Trigger score refresh across all tabs
            triggerRefresh() {
                const savedUser = localStorage.getItem('gameist_user');
                if (savedUser) {
                    const user = JSON.parse(savedUser);
                    console.log('🔄 Auto-refreshing scores for:', user.displayName);
                    
                    // Try to update UI if we're on main page
                    if (typeof loadUserStats === 'function') {
                        loadUserStats(user.uid);
                    }
                    
                    // Notify other tabs
                    localStorage.setItem('gameist_score_update', Date.now().toString());
                    
                    // Update last update time
                    this.lastUpdate = Date.now();
                    
                    // Custom event for game-specific updates
                    window.dispatchEvent(new CustomEvent('gameistScoreUpdate', {
                        detail: { userId: user.uid, timestamp: this.lastUpdate }
                    }));
                }
            },
            
            // Check if updates are needed
            checkForUpdates() {
                const savedUser = localStorage.getItem('gameist_user');
                if (!savedUser) return;
                
                const timeSinceLastUpdate = Date.now() - this.lastUpdate;
                
                // Auto-refresh if it's been more than 10 seconds
                if (timeSinceLastUpdate > 10000) {
                    this.triggerRefresh();
                }
            },
            
            // Manual refresh from game pages
            notifyScoreUpdate(gameName, score) {
                console.log(`🎮 Score update notification: ${gameName} - ${score}`);
                this.triggerRefresh();
            }
        };
        
        // Enhanced saveScore function with real-time sync
        window.saveUserScore = async function(userId, displayName, score, gameName) {
            console.log('💾 saveUserScore called:', { userId, displayName, score, gameName });
            
            try {
                // Try to use parent's save function if in iframe
                if (window.parent && typeof window.parent.saveUserScore === 'function') {
                    return await window.parent.saveUserScore(userId, displayName, score, gameName);
                }
                
                // Try to use main page's save function
                if (typeof saveUserScore === 'function' && window.saveUserScore !== arguments.callee) {
                    return await window.saveUserScore(userId, displayName, score, gameName);
                }
                
                // Fallback: save to localStorage and trigger sync
                const localScores = JSON.parse(localStorage.getItem('gameist_local_scores') || '[]');
                const scoreData = {
                    userId: userId,
                    displayName: displayName,
                    score: score,
                    game: gameName,
                    timestamp: Date.now(),
                    id: 'local_' + Date.now()
                };
                
                localScores.push(scoreData);
                localStorage.setItem('gameist_local_scores', JSON.stringify(localScores));
                console.log('✅ Score saved to localStorage fallback');
                
                // Save to Firebase Realtime Database for cross-device sync
                try {
                    if (typeof firebase !== 'undefined') {
                        const database = firebase.database();
                        const scoreRef = database.ref(`userScores/${userId}/${scoreData.id}`);
                        await scoreRef.set(scoreData);
                        console.log('✅ Score synced to Firebase Realtime Database');
                    }
                } catch (firebaseError) {
                    console.log('ℹ️ Firebase sync failed:', firebaseError.message);
                }
                
                // Trigger synchronization
                if (window.gameistScoreSync) {
                    window.gameistScoreSync.notifyScoreUpdate(gameName, score);
                }
                
                return scoreData;
                
            } catch (error) {
                console.error('❌ Failed to save score:', error);
                return false;
            }
        };
        
        // Initialize sync system
        setTimeout(() => {
            if (window.gameistScoreSync) {
                window.gameistScoreSync.init();
            }
        }, 1000);
        
        console.log('✅ Gameist Score Sync loaded successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSync);
    } else {
        initSync();
    }
    
})();
