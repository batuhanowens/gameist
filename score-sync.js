// Gameist Score Synchronization System
// This script provides real-time score synchronization across all game pages

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
            
            // Initialize real-time listeners
            init() {
                if (this.isListening) return;
                this.isListening = true;
                
                console.log('🔄 Initializing score synchronization...');
                
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
                
                // Set up periodic sync
                setInterval(() => {
                    this.checkForUpdates();
                }, 30000); // Check every 30 seconds
                
                console.log('✅ Score synchronization initialized');
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
