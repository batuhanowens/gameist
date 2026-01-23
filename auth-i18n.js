// Firebase Authentication Internationalization
// Multi-language support for auth interface

const authTranslations = {
    tr: {
        welcome_text: "Hoş geldin,",
        logout_button: "Çıkış Yap",
        profile_button: "Profil",
        login_button: "Google ile Giriş Yap",
        login_success: "Giriş başarılı!",
        login_failed: "Giriş başarısız!",
        logout_success: "Çıkış yapıldı",
        popup_blocked: "Popup engellendi. Lütfen popup engelleyiciyi devre dışı bırakın.",
        popup_closed: "Popup kapatıldı. Lütfen tekrar deneyin.",
        unauthorized_domain: "Domain yetkili değil. Firebase Console'a domain ekleyin.",
        redirect_initiated: "Yönlendirme başlatıldı...",
        auth_initiating: "Google giriş başlatılıyor...",
        auth_redirecting: "Popup engellendi, yönlendiriliyor..."
    },
    en: {
        welcome_text: "Welcome,",
        logout_button: "Sign Out",
        profile_button: "Profile",
        login_button: "Sign in with Google",
        login_success: "Login successful!",
        login_failed: "Login failed!",
        logout_success: "Signed out",
        popup_blocked: "Popup blocked. Please disable popup blocker.",
        popup_closed: "Popup closed. Please try again.",
        unauthorized_domain: "Domain not authorized. Add domain to Firebase Console.",
        redirect_initiated: "Redirect initiated...",
        auth_initiating: "Initiating Google login...",
        auth_redirecting: "Popup blocked, redirecting..."
    }
};

// Get current language from localStorage or browser
function getCurrentLanguage() {
    const saved = localStorage.getItem('gameist-language');
    if (saved && authTranslations[saved]) return saved;
    
    const browserLang = navigator.language.split('-')[0];
    return authTranslations[browserLang] ? browserLang : 'tr';
}

// Apply translations to elements with data-i18n attribute
function applyAuthTranslations(lang = getCurrentLanguage()) {
    const translations = authTranslations[lang];
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[key]) {
            element.textContent = translations[key];
        }
    });
    
    // Update login button
    const loginBtn = document.getElementById('googleLogin');
    if (loginBtn && translations.login_button) {
        const svg = loginBtn.querySelector('svg');
        loginBtn.innerHTML = '';
        if (svg) loginBtn.appendChild(svg);
        loginBtn.appendChild(document.createTextNode(' ' + translations.login_button));
    }
    
    console.log(`🌐 Auth translations applied: ${lang}`);
}

// Get translation for a key
function getAuthTranslation(key, lang = getCurrentLanguage()) {
    return authTranslations[lang]?.[key] || authTranslations['tr'][key] || key;
}

// Initialize auth i18n
document.addEventListener('DOMContentLoaded', function() {
    applyAuthTranslations();
    
    // Listen for language changes
    window.addEventListener('languageChanged', function(e) {
        applyAuthTranslations(e.detail.language);
    });
});

// Export for use in other scripts
window.authTranslations = authTranslations;
window.getCurrentLanguage = getCurrentLanguage;
window.applyAuthTranslations = applyAuthTranslations;
window.getAuthTranslation = getAuthTranslation;
