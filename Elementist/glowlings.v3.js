// This is a cache-busted build of GlowlingsGame. Version marker:
window.GLOWLINGS_BUILD = { name: 'glowlings.v3.js', ts: '2025-08-16T21:26:54+03:00' };

// BEGIN contents copied from glowlings.js (current fixed version)
// Glowlings Game - Neon Universe Battle
class GlowlingsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        console.info('[Glowlings] glowlings.v3.js loaded @', new Date().toISOString());
        
        // Game state
        this.gameState = 'menu'; // menu, playing, gameOver
        this.gameTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.startTime = 0;
        this.score = 0;
        
        // Player settings
        this.playerSettings = {
            name: '',
            element: 'fire',
            color: '#00ffff',
            shape: 'circle'
        };
        
        // Game objects
        this.player = null;
        this.energyOrbs = [];
        this.bonusOrbs = [];
        this.elementZones = [];
        this.players = new Map();
        this.particles = [];
        this.aiBots = [];
        // Compatibility alias: prevent crashes if any code still references aiPlayers
        this.aiPlayers = this.aiBots;
        this.towers = [];
        this.projectiles = [];
        this.leaderboard = [];
        
        // Input handling
        this.mouse = new Vector2(0, 0);
        this.keys = {};
        
        // Camera
        this.camera = new Vector2(0, 0);
        this.worldSize = { width: 15000, height: 15000 };
        
        // Element abilities
        this.abilityReady = true;
        this.abilityCooldown = 0;
        this.abilityDuration = 0;
        
        this.setupEventListeners();
        this.initializeWorld();
        this.gameLoop();
        
        // Make game instance globally accessible
        window.game = this;
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    setupEventListeners() {
        // Menu interactions
        document.querySelectorAll('.element-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.playerSettings.element = e.target.dataset.element;
            });
        });
        
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.playerSettings.color = e.target.dataset.color;
            });
        });
        
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.playerSettings.shape = e.target.dataset.shape;
            });
        });
        
        // Event listener removed - now handled in glowlings.html
        // document.getElementById('startBtn').addEventListener('click', () => {
        //     this.playerSettings.name = (document.getElementById('playerName')?.value || '').trim() || 'Elementist';
        //     this.startGame();
        // });
        
        // Game controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Space bar for ability
            if (e.key === ' ' && this.gameState === 'playing') {
                e.preventDefault();
                this.useAbility();
            }
            
            // ESC key for in-game menu
            if (e.key === 'Escape' && this.gameState === 'playing') {
                e.preventDefault();
                this.toggleInGameMenu();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Touch controls for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.useAbility();
        });
    }
    
    initializeWorld() {
        // Create energy orbs
        this.energyOrbs = [];
        for (let i = 0; i < 2000; i++) {
            this.energyOrbs.push({
                pos: new Vector2(
                    Math.random() * this.worldSize.width,
                    Math.random() * this.worldSize.height
                ),
                size: 3 + Math.random() * 2,
                color: this.getRandomNeonColor(),
                energy: 1,
                glowIntensity: Math.random() * 0.5 + 0.5
            });
        }
        
        // Create bonus orbs
        this.bonusOrbs = [];
        for (let i = 0; i < 35; i++) {
            this.bonusOrbs.push({
                pos: new Vector2(
                    Math.random() * this.worldSize.width,
                    Math.random() * this.worldSize.height
                ),
                size: 8 + Math.random() * 4,
                color: '#ffffff',
                energy: 5,
                glowIntensity: 1,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        
        // Create element zones
        this.elementZones = [
            {
                pos: new Vector2(1000, 1000),
                radius: 120,
                element: 'fire',
                color: '#ff4444'
            },
            {
                pos: new Vector2(this.worldSize.width - 1000, 1000),
                radius: 120,
                element: 'water',
                color: '#4444ff'
            },
            {
                pos: new Vector2(this.worldSize.width / 2, this.worldSize.height - 1000),
                radius: 120,
                element: 'air',
                color: '#44ff44'
            },
            {
                pos: new Vector2(this.worldSize.width / 4, this.worldSize.height / 2),
                radius: 100,
                element: 'fire',
                color: '#ff4444'
            },
            {
                pos: new Vector2(this.worldSize.width * 3/4, this.worldSize.height / 2),
                radius: 100,
                element: 'water',
                color: '#4444ff'
            }
        ];
        
        // Initialize AI bots and towers
        this.createAIBots();
        this.createTowers();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.score = 0;
        
        // ALWAYS check for custom element selection from start screen
        if (window.gameElement && ['fire', 'water', 'air'].includes(window.gameElement)) {
            this.playerSettings.element = window.gameElement;
            console.log('🔥 Using selected element:', window.gameElement);
        } else {
            console.log('🔥 Using default element: fire');
        }
        
        // ALWAYS check for custom character selection
        if (window.gameCharacter && ['warrior', 'mage', 'archer', 'assassin'].includes(window.gameCharacter)) {
            this.playerSettings.character = window.gameCharacter;
            console.log('⚔️ Using selected character:', window.gameCharacter);
        }
        
        // Create player
        this.player = new Glowling(
            new Vector2(this.worldSize.width / 2, this.worldSize.height / 2),
            this.playerSettings
        );
        
        console.log('🎮 Player created with element:', this.player.element);
        
        // Initialize leaderboard
        this.updateLeaderboard();
        
        // Hide menu, show game UI
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameUI').style.display = 'block';
        document.getElementById('timer').style.display = 'block';
        document.getElementById('leaderboard').style.display = 'block';
        document.querySelector('.ability-cooldown').style.display = 'block';
        
        this.updateAbilityIcon();
    }
    
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        
        if (this.gameState === 'playing') {
            this.update();
        }
        
        this.render();
    }
    
    update() {
        const deltaTime = 16; // Assume 60 FPS
        
        // Update timer
        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, this.gameTime - elapsed);
        
        if (remaining <= 0) {
            this.endGame();
            return;
        }
        
        this.updateTimer(remaining);
        
        // Update player
        if (this.player) {
            this.updatePlayer(deltaTime);
        }
        
        // Update AI bots
        this.aiBots.forEach(bot => bot.update(this, deltaTime));
        
        // Update towers
        this.towers.forEach(tower => tower.update(this, deltaTime));
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            return !projectile.update(deltaTime);
        });
        
        // Update ability cooldown
        if (this.abilityCooldown > 0) {
            this.abilityCooldown -= deltaTime;
            if (this.abilityCooldown <= 0) {
                this.abilityReady = true;
                document.querySelector('.ability-cooldown').style.display = 'none';
            }
        }
        
        // Update ability duration
        if (this.abilityDuration > 0) {
            this.abilityDuration -= deltaTime;
        }
        
        // Update particles (reduced trail effect)
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime * 2; // Faster decay
            particle.pos.plusEq(particle.velocity);
            particle.velocity.multiplyEq(0.95); // Faster slowdown
            return particle.life > 0;
        });
        
        // Keep water zone anchored to player and apply slow while active
        if (this.player && this.player.waterZone) {
            // Ensure the zone stays centered on the player each frame
            this.player.waterZone.pos = this.player.pos.clone();
            const slowZoneRadius = this.player.waterZone.radius;
            // Continuously refresh slow on bots inside the zone for smooth effect
            (this.aiBots || []).forEach(target => {
                const distance = this.player.waterZone.pos.minusNew(target.pos).magnitude();
                if (distance < slowZoneRadius) {
                    target.slowedUntil = Date.now() + 120; // short refresh, extended every frame while inside
                    target.slowFactor = this.player.waterZone.slowEffect;
                }
            });
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update camera
        this.updateCamera();
        
        // Update leaderboard
        this.updateLeaderboard();
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer(deltaTime) {
        // Calculate movement direction
        const screenCenter = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
        const direction = this.mouse.minusNew(screenCenter).normalise();
        
        // Apply movement with maneuver boost
        const speed = this.player.getSpeed();
        const maneuverFactor = this.player.maneuverBoost || 1;
        this.player.velocity = direction.multiplyNew(speed * maneuverFactor);
        this.player.pos.plusEq(this.player.velocity.multiplyNew(deltaTime / 1000));
        
        // Keep player in bounds
        this.player.pos.x = Math.max(this.player.size, Math.min(this.worldSize.width - this.player.size, this.player.pos.x));
        this.player.pos.y = Math.max(this.player.size, Math.min(this.worldSize.height - this.player.size, this.player.pos.y));
        
        // Check if player is in element zone
        this.checkElementZones();
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        // Energy orbs
        this.energyOrbs = this.energyOrbs.filter(orb => {
            const distance = this.player.pos.minusNew(orb.pos).magnitude();
            if (distance < this.player.size + orb.size) {
                this.collectOrb(orb);
                return false;
            }
            return true;
        });
        
        // Bonus orbs
        this.bonusOrbs = this.bonusOrbs.filter(orb => {
            const distance = this.player.pos.minusNew(orb.pos).magnitude();
            if (distance < this.player.size + orb.size) {
                this.collectBonusOrb(orb);
                return false;
            }
            return true;
        });
    }
    
    collectOrb(orb) {
        this.player.grow(orb.energy);
        this.score += orb.energy * 10;
        
        // Create particles
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                pos: orb.pos.clone(),
                velocity: new Vector2(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100
                ),
                color: orb.color,
                life: 500,
                size: 2
            });
        }
        
        // Respawn orb elsewhere
        setTimeout(() => {
            this.energyOrbs.push({
                pos: new Vector2(
                    Math.random() * this.worldSize.width,
                    Math.random() * this.worldSize.height
                ),
                size: 3 + Math.random() * 2,
                color: this.getRandomNeonColor(),
                energy: 1,
                glowIntensity: Math.random() * 0.5 + 0.5
            });
        }, 2000);
    }
    
    collectBonusOrb(orb) {
        this.player.grow(orb.energy);
        this.score += orb.energy * 50;
        this.player.addElementEnergy(10);
        
        // Create more particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                pos: orb.pos.clone(),
                velocity: new Vector2(
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 150
                ),
                color: orb.color,
                life: 1000,
                size: 3
            });
        }
        
        // Respawn bonus orb elsewhere
        setTimeout(() => {
            this.bonusOrbs.push({
                pos: new Vector2(
                    Math.random() * this.worldSize.width,
                    Math.random() * this.worldSize.height
                ),
                size: 8 + Math.random() * 4,
                color: '#ffffff',
                energy: 5,
                glowIntensity: 1,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }, 5000);
    }
    
    checkElementZones() {
        if (!this.player) return;
        
        this.elementZones.forEach(zone => {
            const distance = this.player.pos.minusNew(zone.pos).magnitude();
            if (distance < zone.radius) {
                if (zone.element === this.player.element) {
                    this.player.inElementZone = true;
                    this.player.addElementEnergy(1);
                } else {
                    this.player.inElementZone = false;
                }
            }
        });
    }
    
    useAbility() {
        if (!this.abilityReady || !this.player) return;
        
        this.abilityReady = false;
        this.abilityCooldown = 3000; // 3 seconds
        this.abilityDuration = 1000; // 1 second
        
        document.getElementById('cooldownOverlay').style.display = 'flex';
        
        switch (this.player.element) {
            case 'fire':
                this.useFireAbility();
                break;
            case 'water':
                this.useWaterAbility();
                break;
            case 'air':
                this.useAirAbility();
                break;
        }
    }
    
    useFireAbility() {
        // Create explosion effect with push force
        const explosionRadius = this.player.size * 4;
        
        // Push away nearby players and AI
        [...(this.aiBots || []), this.player].forEach(target => {
            if (target === this.player) return;
            const distance = this.player.pos.minusNew(target.pos).magnitude();
            if (distance < explosionRadius && distance > 0) {
                const pushForce = (explosionRadius - distance) / explosionRadius;
                const direction = target.pos.minusNew(this.player.pos).normalise();
                const pushVector = direction.multiplyNew(pushForce * 300);
                target.pos.plusEq(pushVector.multiplyNew(0.1));
            }
        });
        
        // Visual explosion effect
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            this.particles.push({
                pos: this.player.pos.clone(),
                velocity: new Vector2(
                    Math.cos(angle) * 150,
                    Math.sin(angle) * 150
                ),
                color: '#ff4444',
                life: 600,
                size: 3
            });
        }
        
        // Temporary hunting boost
        this.player.huntingBoost = 1.5;
        this.player.abilityActive = true;
        
        setTimeout(() => {
            this.player.huntingBoost = 1;
            this.player.abilityActive = false;
        }, this.abilityDuration);
    }
    
    useWaterAbility() {
        const slowZoneRadius = this.player.size * 5;
        
        this.player.waterZone = {
            pos: this.player.pos.clone(),
            radius: slowZoneRadius,
            duration: this.abilityDuration,
            slowEffect: 0.3 // 70% speed reduction
        };
        
        // Apply slowing effect to nearby entities
        [...(this.aiBots || [])].forEach(target => {
            const distance = this.player.waterZone.pos.minusNew(target.pos).magnitude();
            if (distance < slowZoneRadius) {
                target.slowedUntil = Date.now() + this.abilityDuration;
                target.slowFactor = this.player.waterZone.slowEffect;
            }
        });
        
        // Visual water ripple effect
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = Math.random() * slowZoneRadius;
            this.particles.push({
                pos: this.player.pos.clone().plusEq(new Vector2(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius
                )),
                velocity: new Vector2(
                    Math.cos(angle) * 30,
                    Math.sin(angle) * 30
                ),
                color: '#4444ff',
                life: 1200,
                size: 2
            });
        }
        
        this.player.abilityActive = true;
        setTimeout(() => {
            this.player.abilityActive = false;
            this.player.waterZone = null;
        }, this.abilityDuration);
    }
    
    useAirAbility() {
        // Significant speed boost with enhanced maneuverability
        this.player.speedBoost = 3;
        this.player.maneuverBoost = 2; // Better turning
        this.player.abilityActive = true;
        
        // Visual wind effect
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                pos: this.player.pos.clone(),
                velocity: new Vector2(
                    Math.cos(angle) * 100,
                    Math.sin(angle) * 100
                ),
                color: '#44ff44',
                life: 400,
                size: 1.5
            });
        }
        
        setTimeout(() => {
            this.player.speedBoost = 1;
            this.player.maneuverBoost = 1;
            this.player.abilityActive = false;
        }, this.abilityDuration);
    }
    
    updateCamera() {
        if (!this.player) return;
        
        const targetX = this.player.pos.x - this.canvas.width / 2;
        const targetY = this.player.pos.y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
    }
    
    updateTimer(remaining) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateUI() {
        if (!this.player) return;
        
        document.getElementById('score').textContent = this.score;
        document.getElementById('size').textContent = this.player.size.toFixed(1);
        document.getElementById('elementType').textContent = this.player.element;
        
        // Update leaderboard display
        this.drawLeaderboard();
    }
    
    updateLeaderboard() {
        // Combine player and bots for leaderboard
        const allPlayers = [];
        
        if (this.player) {
            allPlayers.push({
                name: this.player.name || 'You',
                score: this.score,
                size: this.player.size,
                isPlayer: true
            });
        }
        
        this.aiBots.forEach(bot => {
            allPlayers.push({
                name: bot.name,
                score: bot.score,
                size: bot.size,
                isPlayer: false
            });
        });
        
        // Sort by combined score (size * 100 + score)
        this.leaderboard = allPlayers
            .sort((a, b) => (b.size * 100 + b.score) - (a.size * 100 + a.score))
            .slice(0, 10);
    }
    
    drawLeaderboard() {
        const leaderboardEl = document.getElementById('leaderboard');
        if (!leaderboardEl) return;
        
        let html = '<h3>🏆 Liderlik Tablosu</h3>';
        this.leaderboard.forEach((player, index) => {
            const rank = index + 1;
            const playerClass = player.isPlayer ? 'player-entry' : 'bot-entry';
            const totalScore = Math.floor(player.size * 100 + player.score);
            
            html += `
                <div class="leaderboard-entry ${playerClass}">
                    <span class="rank">${rank}.</span>
                    <span class="name">${player.name}</span>
                    <span class="score">${totalScore}</span>
                </div>`;
        });
        
        leaderboardEl.innerHTML = html;
    }
    
    drawAIBots() {
        this.aiBots.forEach(bot => {
            const screenPos = new Vector2(
                bot.pos.x - this.camera.x,
                bot.pos.y - this.camera.y
            );
            
            // Only draw if on screen
            if (screenPos.x < -100 || screenPos.x > this.canvas.width + 100 ||
                screenPos.y < -100 || screenPos.y > this.canvas.height + 100) {
                return;
            }
            
            // Draw bot glow
            const glowSize = bot.size * 2;
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, glowSize
            );
            gradient.addColorStop(0, bot.color + '66');
            gradient.addColorStop(1, bot.color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw bot body
            this.ctx.fillStyle = bot.color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, bot.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw bot name
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(bot.name, screenPos.x, screenPos.y - bot.size - 8);
            
            // Draw state indicator
            let stateColor = '#00ff00';
            if (bot.state === 'hunting') stateColor = '#ff0000';
            else if (bot.state === 'fleeing') stateColor = '#ffff00';
            
            this.ctx.fillStyle = stateColor;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawTowers() {
        this.towers.forEach(tower => {
            const screenPos = new Vector2(
                tower.pos.x - this.camera.x,
                tower.pos.y - this.camera.y
            );
            
            // Only draw if on screen
            if (screenPos.x < -200 || screenPos.x > this.canvas.width + 200 ||
                screenPos.y < -200 || screenPos.y > this.canvas.height + 200) {
                return;
            }
            
            // Draw tower range (faint)
            this.ctx.strokeStyle = '#ff000020';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, tower.range, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw tower base
            this.ctx.fillStyle = '#666666';
            this.ctx.strokeStyle = '#333333';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw tower cannon
            this.ctx.fillStyle = '#444444';
            this.ctx.fillRect(screenPos.x - 3, screenPos.y - 8, 6, 16);
            
            // Draw tower symbol
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚡', screenPos.x, screenPos.y + 4);
        });
    }
    
    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            const screenPos = new Vector2(
                projectile.pos.x - this.camera.x,
                projectile.pos.y - this.camera.y
            );
            
            // Draw projectile
            this.ctx.fillStyle = '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw projectile trail
            this.ctx.strokeStyle = '#ff444466';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(screenPos.x, screenPos.y);
            const trailEnd = screenPos.minusNew(projectile.velocity.multiplyNew(0.1));
            this.ctx.lineTo(trailEnd.x, trailEnd.y);
            this.ctx.stroke();
        });
    }
    
    updateAbilityIcon() {
        const symbols = { fire: '🔥', water: '💧', air: '🌬️' };
        const colors = { fire: '#ff4444', water: '#4444ff', air: '#44ff44' };
        
        document.getElementById('abilitySymbol').textContent = symbols[this.player.element];
        document.getElementById('abilityIcon').style.borderColor = colors[this.player.element];
        document.getElementById('abilityIcon').style.color = colors[this.player.element];
    }
    
    toggleInGameMenu() {
        const menu = document.getElementById('inGameMenu');
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
        } else {
            menu.style.display = 'block';
        }
    }
    
    resumeGame() {
        document.getElementById('inGameMenu').style.display = 'none';
    }
    
    endGame() {
        this.gameState = 'gameOver';
        
        // Hide game UI, show game over screen
        document.getElementById('gameUI').style.display = 'none';
        document.getElementById('timer').style.display = 'none';
        document.getElementById('leaderboard').style.display = 'none';
        document.querySelector('.ability-cooldown').style.display = 'none';
        document.getElementById('inGameMenu').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'block';
        
        // Show final stats
        document.getElementById('finalStats').innerHTML = `
            <h3>Final Skor: ${this.score}</h3>
            <p>Boyut: ${this.player ? this.player.size.toFixed(1) : '0'}</p>
            <p>Element: ${this.player ? this.player.element : '-'}</p>
        `;
        
        // Setup share button
        document.getElementById('shareBtn').onclick = () => {
            const text = `Glowlings'te ${this.score} puan aldım! Sen de oyna: ${window.location.href}`;
            if (navigator.share) {
                navigator.share({ text });
            } else {
                navigator.clipboard.writeText(text);
                alert('Skor panoya kopyalandı!');
            }
        };
    }
    
    render() {
        // Clear canvas completely (no blur effect)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background stars
        this.drawBackgroundStars();
        
        if (this.gameState === 'playing') {
            // Draw element zones
            this.drawElementZones();
            
            // Draw energy orbs
            this.drawEnergyOrbs();
            
            // Draw bonus orbs
            this.drawBonusOrbs();
            
            // Draw towers
            this.drawTowers();
            
            // Draw projectiles
            this.drawProjectiles();

            // Draw particles EARLY so ability overlays remain on top
            this.drawParticles();
            
            // Draw AI bots
            this.drawAIBots();
            
            // Draw player
            if (this.player) {
                this.drawGlowling(this.player);
            }
        }
    }
    
    drawBackgroundStars() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 123.456) % this.canvas.width;
            const y = (i * 789.012) % this.canvas.height;
            const size = Math.sin(Date.now() * 0.001 + i) * 0.5 + 1;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawElementZones() {
        this.elementZones.forEach((zone, index) => {
            // Calculate screen position relative to camera
            const screenPos = new Vector2(
                zone.pos.x - this.camera.x,
                zone.pos.y - this.camera.y
            );
            
            // Draw solid background first for visibility
            this.ctx.fillStyle = zone.color + '30';
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, zone.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw zone boundary
            this.ctx.strokeStyle = zone.color;
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, zone.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Draw element text
            this.ctx.fillStyle = zone.color;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${zone.element.toUpperCase()} ZONU`, screenPos.x, screenPos.y);
        });
    }
    
    drawEnergyOrbs() {
        this.energyOrbs.forEach((orb, index) => {
            const screenPos = new Vector2(
                orb.pos.x - this.camera.x,
                orb.pos.y - this.camera.y
            );
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, orb.size * 6
            );
            gradient.addColorStop(0, orb.color + '80');
            gradient.addColorStop(1, orb.color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, orb.size * 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, orb.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawBonusOrbs() {
        this.bonusOrbs.forEach((orb, index) => {
            const screenPos = new Vector2(
                orb.pos.x - this.camera.x,
                orb.pos.y - this.camera.y
            );
            
            // Glow effect stronger
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, orb.size * 8
            );
            gradient.addColorStop(0, '#ffffff80');
            gradient.addColorStop(1, '#ffffff00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, orb.size * 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, orb.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // Placeholder stubs for methods used above but defined elsewhere in original project
    createAIBots() {}
    createTowers() {}
    drawParticles() {}
    drawGlowling() {}
    getRandomNeonColor() { return '#00ffff'; }
}

// END contents

// Ensure Vector2 is available
if (typeof Vector2 === 'undefined') {
    console.error('Vector2.js not loaded before glowlings.v3.js');
}

// Auto-start
window.addEventListener('load', () => {
    new GlowlingsGame();
});
