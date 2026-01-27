# Elementist Skor İzleme Test Talimatları

## Hızlı Test için Console Komutları

Elementist oyunu açıkken browser console'una (F12) aşağı komutları yazın:

### 1. Skor İzleme Sisteminin Çalışıp Çalışmadığını Kontrol Et:
```javascript
// Game objesinin varlığını kontrol et
console.log('Game object:', window.game);

// Skor izleme fonksiyonlarını kontrol et
console.log('checkScoreUpdate:', typeof window.game?.checkScoreUpdate);
console.log('sendScoreUpdate:', typeof window.game?.sendScoreUpdate);
console.log('debugTestScoreUpdate:', typeof window.game?.debugTestScoreUpdate);
```

### 2. Manuel Skor Testi Yap:
```javascript
// Skoru manuel artır ve ana menüye gönder
window.game.debugTestScoreUpdate();
```

### 3. Skor İzlemeyi Manuel Tetikle:
```javascript
// Skor kontrolünü hemen çalıştır
window.game.checkScoreUpdate();
```

### 4. Mevcut Durumu Kontrol Et:
```javascript
console.log('Current score:', window.game.score);
console.log('Game state:', window.game.gameState);
console.log('Last reported score:', window.game._lastReportedScore);
console.log('Last score check time:', window.game._lastScoreCheckTime);
```

### 5. Zorla Skor Artışı:
```javascript
// Skoru 1000 artır
window.game.score += 1000;
console.log('New score:', window.game.score);

// Skor kontrolünü tetikle
window.game._lastScoreCheckTime = 0; // Timer'ı sıfırla
window.game.checkScoreUpdate();
```

## Beklenen Console Çıktıları

Çalıştığında görmelisiniz:
- `🎮 Score monitoring initialized - Initial score: 0`
- `🔍 checkScoreUpdate called - Current score: [skor] Game state: playing`
- `🔍 Score check: [eski] → [yeni] (+[artış]), Game state: playing`
- `📈 Score increase detected: [eski] → [yeni] (+[artış])`
- `📤 Sending score update to main menu: [yeni] (+[artış])`
- `✅ Score update sent via BroadcastChannel`

## Eğer Çalışmıyorsa

1. **Game objesi yoksa**: Elementist oyununun tamamen yüklenmiş olduğundan emin olun
2. **Fonksiyonlar yoksa**: glowlings.js dosyasının güncellendiğinden emin olun
3. **Console'da hata varsa**: Firebase authentication'ın çalıştığını kontrol edin

## Ana Menü Kontrolü

Aynı anda ana menüyü açık tutun ve şu mesajları arayın:
- `📡 Received BroadcastChannel message`
- `🎮 Processing live score update from Elementist`
- `✅ Updated UI with live Elementist score`

## Test Dosyaları

- `debug-elementist-score.html` - Görsel test arayüzü
- `test-elementist-continuous-score.html` - Simülasyon testi
