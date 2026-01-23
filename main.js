// Gameist Main JavaScript
// Firebase Authentication and site functionality

console.log('🎮 Gameist main.js loaded');

// Fix tracking prevention and storage issues
(function() {
    // Try to enable localStorage/sessionStorage for Firebase
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('✅ localStorage available');
    } catch (e) {
        console.warn('⚠️ localStorage blocked:', e);
        // Create fallback storage
        window.gameistStorage = {};
        window.localStorage = {
            getItem: function(key) { return window.gameistStorage[key] || null; },
            setItem: function(key, value) { window.gameistStorage[key] = value; },
            removeItem: function(key) { delete window.gameistStorage[key]; }
        };
    }
    
    // Same for sessionStorage
    try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        console.log('✅ sessionStorage available');
    } catch (e) {
        console.warn('⚠️ sessionStorage blocked:', e);
        window.gameistSessionStorage = {};
        window.sessionStorage = {
            getItem: function(key) { return window.gameistSessionStorage[key] || null; },
            setItem: function(key, value) { window.gameistSessionStorage[key] = value; },
            removeItem: function(key) { delete window.gameistSessionStorage[key]; }
        };
    }
})();

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing Gameist...');
    
    // Firebase is already initialized in index.html
    // Additional site functionality can be added here
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add hover effects to game cards
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Initialize any other site features
    console.log('✅ Gameist site initialized');
});
