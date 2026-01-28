// Glowlings Game - Neon Universe Battle
class GlowlingsGame {
    constructor() {
        // Core state
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Expose live game instance for shop/UI integrations
        try { if (typeof window !== 'undefined') window.game = this; } catch(_) {}
        // Bind auto-fullscreen on first interaction (mobile)
        this.bindCanvasAutoFullscreen();
        // Ensure canvas backing size matches viewport
        this.resizeCanvas();
        this.bindResizeEvents();
        // World configuration: large map, camera follows player
        this.fixedArena = false;
        this.disableCenterFocus = true; // keep bots from biasing toward center; we'll fix edge sliding locally
        this.playableScale = 0.8; // unused when fixedArena = false
        this.worldSize = { width: 5000, height: 5000 };
        // Inner playable zone: start at 1000x1000 centered (per wave plan)
        const initialZoneW = 1000, initialZoneH = 1000;
        this.playZone = {
            x: Math.floor((this.worldSize.width - initialZoneW) / 2),
            y: Math.floor((this.worldSize.height - initialZoneH) / 2),
            width: initialZoneW,
            height: initialZoneH
        };
        // --- Achievements helpers ---
        this.loadAchievements = () => {
            try {
                const raw = localStorage.getItem('elementist_ach');
                const a = raw ? JSON.parse(raw) : { unlocked: {} };
                if (!a || typeof a !== 'object') return { unlocked: {} };
                a.unlocked = a.unlocked || {};
                return a;
            } catch { return { unlocked: {} }; }
        };
        this.saveAchievements = () => {
            try { localStorage.setItem('elementist_ach', JSON.stringify(this.ach || { unlocked: {} })); } catch {}
        };
        this.ensureAchievementsUI = () => {
            try {
                const panel = document.getElementById('statsPanel');
                if (!panel) return;
                if (!document.getElementById('achList')) {
                    const h = document.createElement('h3');
                    h.textContent = 'Achievements';
                    h.style.marginTop = '10px';
                    h.style.color = '#7dd3fc';
                    const ul = document.createElement('ul');
                    ul.id = 'achList';
                    ul.style.listStyle = 'none';
                    ul.style.padding = '0';
                    ul.style.margin = '0';
                    ul.style.display = 'grid';
                    ul.style.gap = '4px';
                    ul.style.fontSize = '12px';
                    panel.appendChild(h);
                    panel.appendChild(ul);
                }

                this.bindSliderActive = (slider) => {
                    if (!slider || slider.__activeBound) return;
                    const setActive = () => { slider.__active = true; };
                    const clearActive = () => { slider.__active = false; };
                    try {
                        slider.addEventListener('pointerdown', setActive);
                        slider.addEventListener('mousedown', setActive);
                        slider.addEventListener('touchstart', setActive, { passive: true });
                        slider.addEventListener('pointerup', clearActive);
                        slider.addEventListener('mouseup', clearActive);
                        slider.addEventListener('touchend', clearActive);
                        slider.addEventListener('blur', clearActive);
                        window.addEventListener('pointerup', clearActive);
                    } catch(_) {}
            // New/updated shop items (names + descriptions) for 7 locales
            try {
                // English
                Object.assign(this.translations.en, {
                    shop_item_buy_hearts_name: 'Extra Hearts',
                    shop_item_buy_hearts_desc: 'Spend all materials (min 10). Sets total hearts to 2. (Only on waves 4/9/14/19/24/29)',
                    shop_item_wep_turret_damage_name: 'Turret Calibration',
                    shop_item_wep_turret_damage_desc: '+15% turret damage',
                    shop_item_wep_turret_speed_name: 'Auto-loader',
                    shop_item_wep_turret_speed_desc: '+12% turret fire rate',
                    shop_item_wep_turret_range_name: 'Extended Barrels',
                    shop_item_wep_turret_range_desc: '+15% turret range',
                    shop_item_wep_elec_damage_name: 'Overcharge Coils',
                    shop_item_wep_elec_damage_desc: '+15% electric damage',
                    shop_item_wep_elec_speed_name: 'Pulse Optimizer',
                    shop_item_wep_elec_speed_desc: '+12% electric fire rate',
                    shop_item_wep_elec_chain_name: 'Extra Node',
                    shop_item_wep_elec_chain_desc: '+1 chain',
                    shop_item_wep_elec_range_name: 'Long Arc',
                    shop_item_wep_elec_range_desc: '+10% electric range',
                    shop_item_wep_grav_damage_name: 'Dense Core',
                    shop_item_wep_grav_damage_desc: '+15% gravity core damage',
                    shop_item_wep_grav_speed_name: 'Phase Cycler',
                    shop_item_wep_grav_speed_desc: 'Gravity period -12% (faster)',
                    shop_item_wep_grav_radius_name: 'Event Horizon',
                    shop_item_wep_grav_radius_desc: '+12% gravity radius',
                    shop_item_wep_grav_shrapnel_name: 'Fragment Bloom',
                    shop_item_wep_grav_shrapnel_desc: '+2 shrapnel'
                });
                // German
                Object.assign(this.translations.de, {
                    shop_item_buy_hearts_name: 'Extra Herzen',
                    shop_item_buy_hearts_desc: 'Gib alle Materialien aus (min 10). Setzt Gesamt-Herzen auf 2. (Nur bei Welle 4/9/14/19/24/29)',
                    shop_item_wep_turret_damage_name: 'Turm-Kalibrierung',
                    shop_item_wep_turret_damage_desc: '+15% Turmschaden',
                    shop_item_wep_turret_speed_name: 'Auto-Lader',
                    shop_item_wep_turret_speed_desc: '+12% Turm-Feuerrate',
                    shop_item_wep_turret_range_name: 'Verlängerte Läufe',
                    shop_item_wep_turret_range_desc: '+15% Turmreichweite',
                    shop_item_wep_elec_damage_name: 'Überladungs-Spulen',
                    shop_item_wep_elec_damage_desc: '+15% Elektroschaden',
                    shop_item_wep_elec_speed_name: 'Puls-Optimierer',
                    shop_item_wep_elec_speed_desc: '+12% Elektro-Feuerrate',
                    shop_item_wep_elec_chain_name: 'Zusätzlicher Knoten',
                    shop_item_wep_elec_chain_desc: '+1 Kette',
                    shop_item_wep_elec_range_name: 'Langer Bogen',
                    shop_item_wep_elec_range_desc: '+10% Elektro-Reichweite',
                    shop_item_wep_grav_damage_name: 'Dichter Kern',
                    shop_item_wep_grav_damage_desc: '+15% Grav.-Kernschaden',
                    shop_item_wep_grav_speed_name: 'Phasen-Zykler',
                    shop_item_wep_grav_speed_desc: 'Grav.-Periode -12% (schneller)',
                    shop_item_wep_grav_radius_name: 'Ereignishorizont',
                    shop_item_wep_grav_radius_desc: '+12% Grav.-Radius',
                    shop_item_wep_grav_shrapnel_name: 'Splitterblüte',
                    shop_item_wep_grav_shrapnel_desc: '+2 Splitter'
                });
                // Spanish
                Object.assign(this.translations.es, {
                    shop_item_buy_hearts_name: 'Corazones Extra',
                    shop_item_buy_hearts_desc: 'Gasta todos los materiales (mín 10). Fija corazones totales a 2. (Solo en oleadas 4/9/14/19/24/29)',
                    shop_item_wep_turret_damage_name: 'Calibración de Torreta',
                    shop_item_wep_turret_damage_desc: '+15% daño de torreta',
                    shop_item_wep_turret_speed_name: 'Auto-cargador',
                    shop_item_wep_turret_speed_desc: '+12% cadencia de torreta',
                    shop_item_wep_turret_range_name: 'Cañones Extendidos',
                    shop_item_wep_turret_range_desc: '+15% alcance de torreta',
                    shop_item_wep_elec_damage_name: 'Bobinas de Sobrecarga',
                    shop_item_wep_elec_damage_desc: '+15% daño eléctrico',
                    shop_item_wep_elec_speed_name: 'Optimizador de Pulsos',
                    shop_item_wep_elec_speed_desc: '+12% cadencia eléctrica',
                    shop_item_wep_elec_chain_name: 'Nodo Extra',
                    shop_item_wep_elec_chain_desc: '+1 encadenamiento',
                    shop_item_wep_elec_range_name: 'Arco Largo',
                    shop_item_wep_elec_range_desc: '+10% alcance eléctrico',
                    shop_item_wep_grav_damage_name: 'Núcleo Denso',
                    shop_item_wep_grav_damage_desc: '+15% daño del núcleo gravitatorio',
                    shop_item_wep_grav_speed_name: 'Ciclador de Fase',
                    shop_item_wep_grav_speed_desc: 'Período gravitatorio -12% (más rápido)',
                    shop_item_wep_grav_radius_name: 'Horizonte de Sucesos',
                    shop_item_wep_grav_radius_desc: '+12% radio gravitatorio',
                    shop_item_wep_grav_shrapnel_name: 'Flor de Fragmentos',
                    shop_item_wep_grav_shrapnel_desc: '+2 fragmentos'
                });
                // Portuguese (BR)
                Object.assign(this.translations['pt-br'], {
                    shop_item_buy_hearts_name: 'Corações Extras',
                    shop_item_buy_hearts_desc: 'Gaste todos os materiais (mín 10). Define corações totais para 2. (Apenas nas ondas 4/9/14/19/24/29)',
                    shop_item_wep_turret_damage_name: 'Calibração da Torreta',
                    shop_item_wep_turret_damage_desc: '+15% dano da torreta',
                    shop_item_wep_turret_speed_name: 'Auto-carregador',
                    shop_item_wep_turret_speed_desc: '+12% taxa de fogo da torreta',
                    shop_item_wep_turret_range_name: 'Canos Estendidos',
                    shop_item_wep_turret_range_desc: '+15% alcance da torreta',
                    shop_item_wep_elec_damage_name: 'Bobinas de Sobrecarga',
                    shop_item_wep_elec_damage_desc: '+15% dano elétrico',
                    shop_item_wep_elec_speed_name: 'Otimizador de Pulso',
                    shop_item_wep_elec_speed_desc: '+12% taxa de fogo elétrica',
                    shop_item_wep_elec_chain_name: 'Nó Extra',
                    shop_item_wep_elec_chain_desc: '+1 encadeamento',
                    shop_item_wep_elec_range_name: 'Arco Longo',
                    shop_item_wep_elec_range_desc: '+10% alcance elétrico',
                    shop_item_wep_grav_damage_name: 'Núcleo Denso',
                    shop_item_wep_grav_damage_desc: '+15% dano do núcleo gravitacional',
                    shop_item_wep_grav_speed_name: 'Ciclador de Fase',
                    shop_item_wep_grav_speed_desc: 'Período gravitacional -12% (mais rápido)',
                    shop_item_wep_grav_radius_name: 'Horizonte de Eventos',
                    shop_item_wep_grav_radius_desc: '+12% raio gravitacional',
                    shop_item_wep_grav_shrapnel_name: 'Florescer de Fragmentos',
                    shop_item_wep_grav_shrapnel_desc: '+2 estilhaços'
                });
                // Japanese
                Object.assign(this.translations.ja, {
                    shop_item_buy_hearts_name: 'エクストラハート',
                    shop_item_buy_hearts_desc: '素材を全消費 (最小10)。合計ハートを2に設定。（ウェーブ4/9/14/19/24/29のみ）',
                    shop_item_wep_turret_damage_name: 'タレット校正',
                    shop_item_wep_turret_damage_desc: 'タレットダメージ +15%',
                    shop_item_wep_turret_speed_name: 'オートローダー',
                    shop_item_wep_turret_speed_desc: 'タレット発射速度 +12%',
                    shop_item_wep_turret_range_name: '延長バレル',
                    shop_item_wep_turret_range_desc: 'タレット射程 +15%',
                    shop_item_wep_elec_damage_name: '過充電コイル',
                    shop_item_wep_elec_damage_desc: '電撃ダメージ +15%',
                    shop_item_wep_elec_speed_name: 'パルス最適化',
                    shop_item_wep_elec_speed_desc: '電撃発射速度 +12%',
                    shop_item_wep_elec_chain_name: '追加ノード',
                    shop_item_wep_elec_chain_desc: '連鎖 +1',
                    shop_item_wep_elec_range_name: 'ロングアーク',
                    shop_item_wep_elec_range_desc: '電撃射程 +10%',
                    shop_item_wep_grav_damage_name: '高密度コア',
                    shop_item_wep_grav_damage_desc: '重力コアダメージ +15%',
                    shop_item_wep_grav_speed_name: 'フェーズサイクラー',
                    shop_item_wep_grav_speed_desc: '重力周期 -12%（高速）',
                    shop_item_wep_grav_radius_name: '事象の地平線',
                    shop_item_wep_grav_radius_desc: '重力半径 +12%',
                    shop_item_wep_grav_shrapnel_name: 'フラグメントブルーム',
                    shop_item_wep_grav_shrapnel_desc: '破片 +2'
                });
                // Hindi
                Object.assign(this.translations.hi, {
                    shop_item_buy_hearts_name: 'अतिरिक्त हार्ट्स',
                    shop_item_buy_hearts_desc: 'सभी सामग्री खर्च करें (न्यूनतम 10)। कुल दिल 2 पर सेट। (केवल वेव 4/9/14/19/24/29 पर)',
                    shop_item_wep_turret_damage_name: 'टरेट कैलिब्रेशन',
                    shop_item_wep_turret_damage_desc: '+15% टरेट डैमेज',
                    shop_item_wep_turret_speed_name: 'ऑटो-लोडर',
                    shop_item_wep_turret_speed_desc: '+12% टरेट फायर रेट',
                    shop_item_wep_turret_range_name: 'लंबी बैरल',
                    shop_item_wep_turret_range_desc: '+15% टरेट रेंज',
                    shop_item_wep_elec_damage_name: 'ओवरचार्ज कॉइल्स',
                    shop_item_wep_elec_damage_desc: '+15% इलेक्ट्रिक डैमेज',
                    shop_item_wep_elec_speed_name: 'पल्स ऑप्टिमाइज़र',
                    shop_item_wep_elec_speed_desc: '+12% इलेक्ट्रिक फायर रेट',
                    shop_item_wep_elec_chain_name: 'अतिरिक्त नोड',
                    shop_item_wep_elec_chain_desc: '+1 चेन',
                    shop_item_wep_elec_range_name: 'लॉन्ग आर्क',
                    shop_item_wep_elec_range_desc: '+10% इलेक्ट्रिक रेंज',
                    shop_item_wep_grav_damage_name: 'घना कोर',
                    shop_item_wep_grav_damage_desc: '+15% ग्रेविटी कोर डैमेज',
                    shop_item_wep_grav_speed_name: 'फेज साइक्लर',
                    shop_item_wep_grav_speed_desc: 'ग्रेविटी पीरियड -12% (तेज़)',
                    shop_item_wep_grav_radius_name: 'इवेंट होराइजन',
                    shop_item_wep_grav_radius_desc: '+12% ग्रेविटी रेडियस',
                    shop_item_wep_grav_shrapnel_name: 'फ्रैगमेंट ब्लूम',
                    shop_item_wep_grav_shrapnel_desc: '+2 श्रैप्नेल'
                });
                // Chinese (Simplified)
                Object.assign(this.translations['zh-cn'], {
                    shop_item_buy_hearts_name: '额外爱心',
                    shop_item_buy_hearts_desc: '花光所有材料（至少10）。将总爱心设为2。（仅在第4/9/14/19/24/29波）',
                    shop_item_wep_turret_damage_name: '炮塔校准',
                    shop_item_wep_turret_damage_desc: '炮塔伤害 +15%',
                    shop_item_wep_turret_speed_name: '自动装填',
                    shop_item_wep_turret_speed_desc: '炮塔射速 +12%',
                    shop_item_wep_turret_range_name: '加长枪管',
                    shop_item_wep_turret_range_desc: '炮塔射程 +15%',
                    shop_item_wep_elec_damage_name: '过载线圈',
                    shop_item_wep_elec_damage_desc: '电击伤害 +15%',
                    shop_item_wep_elec_speed_name: '脉冲优化器',
                    shop_item_wep_elec_speed_desc: '电击射速 +12%',
                    shop_item_wep_elec_chain_name: '额外节点',
                    shop_item_wep_elec_chain_desc: '+1 连锁',
                    shop_item_wep_elec_range_name: '长弧',
                    shop_item_wep_elec_range_desc: '电击范围 +10%',
                    shop_item_wep_grav_damage_name: '致密核心',
                    shop_item_wep_grav_damage_desc: '重力核心伤害 +15%',
                    shop_item_wep_grav_speed_name: '相位循环器',
                    shop_item_wep_grav_speed_desc: '重力周期 -12%（更快）',
                    shop_item_wep_grav_radius_name: '事件视界',
                    shop_item_wep_grav_radius_desc: '重力半径 +12%',
                    shop_item_wep_grav_shrapnel_name: '碎片绽放',
                    shop_item_wep_grav_shrapnel_desc: '+2 碎片'
                });
            } catch(_) {}

        // ---- Dodge Skins Catalog & Persistence ----
        // Visual-only cosmetics for the dodge/dash trail
        this.DODGE_SKINS = [
            { id: 'dodge_basic',    name: 'Basic Trail',      cost: 0,    reqWave: 0,   rarity: 'common',    ribbon: ['#7dd3fc', '#0ea5e9'], ghostsAlpha: 1.0,  trailMul: 1.0,  ghostsCount: 1, sparkCount: 0, orbitals: 0, waveWidthMul: 1.0 },
            { id: 'dodge_plasma',   name: 'Plasma Streak',    cost: 800,  reqWave: 3,   rarity: 'uncommon',  ribbon: ['#a78bfa', '#22d3ee'], ghostsAlpha: 1.05, trailMul: 1.08, ghostsCount: 2, sparkCount: 6, orbitals: 0, waveWidthMul: 1.0 },
            { id: 'dodge_solar',    name: 'Solar Arc',        cost: 1600, reqWave: 5,   rarity: 'uncommon',  ribbon: ['#fbbf24', '#fb923c'], ghostsAlpha: 1.1,  trailMul: 1.12, ghostsCount: 2, sparkCount: 8, orbitals: 0, waveWidthMul: 1.1 },
            { id: 'dodge_nebula',   name: 'Nebula Drift',     cost: 2600, reqWave: 7,   rarity: 'rare',      ribbon: ['#22d3ee', '#a78bfa'], ghostsAlpha: 1.18, trailMul: 1.18, ghostsCount: 3, sparkCount: 10, orbitals: 1, waveWidthMul: 1.1 },
            { id: 'dodge_ember',    name: 'Ember Wake',       cost: 3400, reqWave: 9,   rarity: 'rare',      ribbon: ['#fb7185', '#f97316'], ghostsAlpha: 1.22, trailMul: 1.22, ghostsCount: 3, sparkCount: 12, orbitals: 0, waveWidthMul: 1.15 },
            { id: 'dodge_void',     name: 'Void Echo',        cost: 4200, reqWave: 12,  rarity: 'epic',      ribbon: ['#0ea5e9', '#111827'], ghostsAlpha: 1.3,  trailMul: 1.25, ghostsCount: 4, sparkCount: 8, orbitals: 2, waveWidthMul: 1.2 },
            { id: 'dodge_aurora',   name: 'Aurora Veil',      cost: 5200, reqWave: 14,  rarity: 'epic',      ribbon: ['#22d3ee', '#a7f3d0'], ghostsAlpha: 1.35, trailMul: 1.3,  ghostsCount: 4, sparkCount: 14, orbitals: 2, waveWidthMul: 1.25 },
            { id: 'dodge_starlit',  name: 'Starlit Ribbon',   cost: 6600, reqWave: 16,  rarity: 'legendary', ribbon: ['#fde68a', '#93c5fd'], ghostsAlpha: 1.42, trailMul: 1.35, ghostsCount: 5, sparkCount: 16, orbitals: 3, waveWidthMul: 1.3 },
            { id: 'dodge_chroma',   name: 'Chroma Surge',     cost: 8200, reqWave: 18,  rarity: 'legendary', ribbon: ['#34d399', '#60a5fa'], ghostsAlpha: 1.5,  trailMul: 1.45, ghostsCount: 5, sparkCount: 18, orbitals: 3, waveWidthMul: 1.35, colorCycle: true },
            { id: 'dodge_thunder',  name: 'Thunder Break',    cost: 9800, reqWave: 20,  rarity: 'legendary', ribbon: ['#a3e635', '#22d3ee'], ghostsAlpha: 1.55, trailMul: 1.5,  ghostsCount: 6, sparkCount: 24, orbitals: 3, waveWidthMul: 1.4 },
            { id: 'dodge_crystal',  name: 'Crystal Shards',   cost: 11000,reqWave: 22,  rarity: 'legendary', ribbon: ['#93c5fd', '#a78bfa'], ghostsAlpha: 1.6,  trailMul: 1.55, ghostsCount: 6, sparkCount: 20, orbitals: 4, waveWidthMul: 1.45 },
            { id: 'dodge_blossom',  name: 'Blossom Bloom',    cost: 12200,reqWave: 24,  rarity: 'mythic',    ribbon: ['#f9a8d4', '#86efac'], ghostsAlpha: 1.65, trailMul: 1.6,  ghostsCount: 7, sparkCount: 26, orbitals: 4, waveWidthMul: 1.5 },
            { id: 'dodge_icefire',  name: 'Icefire Rift',     cost: 13400,reqWave: 26,  rarity: 'mythic',    ribbon: ['#60a5fa', '#f97316'], ghostsAlpha: 1.7,  trailMul: 1.65, ghostsCount: 7, sparkCount: 28, orbitals: 5, waveWidthMul: 1.55 },
            { id: 'dodge_photon',   name: 'Photon Stream',    cost: 14600,reqWave: 28,  rarity: 'mythic',    ribbon: ['#22d3ee', '#fde68a'], ghostsAlpha: 1.75, trailMul: 1.7,  ghostsCount: 8, sparkCount: 30, orbitals: 5, waveWidthMul: 1.6 },
            { id: 'dodge_abyss',    name: 'Abyssal Wake',     cost: 15800,reqWave: 30,  rarity: 'ascended',  ribbon: ['#111827', '#a78bfa'], ghostsAlpha: 1.8,  trailMul: 1.8,  ghostsCount: 8, sparkCount: 22, orbitals: 6, waveWidthMul: 1.7 },
            { id: 'dodge_singularity',name:'Singularity Arc', cost: 17000,reqWave: 32,  rarity: 'ascended',  ribbon: ['#0ea5e9', '#f87171'], ghostsAlpha: 1.85, trailMul: 1.9,  ghostsCount: 9, sparkCount: 34, orbitals: 6, waveWidthMul: 1.8, colorCycle: true },
            { id: 'dodge_prismatic',name: 'Prismatic Nova',   cost: 18200,reqWave: 34,  rarity: 'ascended',  ribbon: ['#f472b6', '#34d399'], ghostsAlpha: 1.9,  trailMul: 2.0,  ghostsCount: 9, sparkCount: 36, orbitals: 7, waveWidthMul: 1.85, colorCycle: true },
            { id: 'dodge_celestial',name: 'Celestial Crown',  cost: 19400,reqWave: 36,  rarity: 'celestial', ribbon: ['#eab308', '#60a5fa'], ghostsAlpha: 2.0,  trailMul: 2.2,  ghostsCount: 10,sparkCount: 40, orbitals: 8, waveWidthMul: 2.0, colorCycle: true }
        ];
        this.loadOwnedDodgeSkins = function(){
            try{ const raw = localStorage.getItem('glowlings_owned_dodge_skins'); return raw ? (JSON.parse(raw)||{}) : {}; }catch(_){ return {}; }
        };
        this.saveOwnedDodgeSkins = function(){ try{ localStorage.setItem('glowlings_owned_dodge_skins', JSON.stringify(this.ownedDodgeSkins||{})); }catch(_){ } };
        this.isOwnedDodge = function(id){ if (!this.ownedDodgeSkins) this.ownedDodgeSkins = this.loadOwnedDodgeSkins(); return !!this.ownedDodgeSkins[id]; };
        this.purchaseDodgeSkin = function(skin){
            try{
                if (!skin || !skin.id) return false;
                const best = (this.runHistory && this.runHistory.best) ? this.runHistory.best : { wave: 0 };
                if ((best.wave||0) < (skin.reqWave||0)) return false;
                if (this.isOwnedDodge(skin.id)) return true;
                if (!this.spendCoins || !this.spendCoins(skin.cost||0)) return false;
                if (!this.ownedDodgeSkins) this.ownedDodgeSkins = this.loadOwnedDodgeSkins();
                this.ownedDodgeSkins[skin.id] = true; this.saveOwnedDodgeSkins();
                try { localStorage.setItem('glowlings_selected_dodge_skin', JSON.stringify({ id: skin.id })); } catch(_){ }
                this._cachedDodgeSkin = skin; // apply immediately
                return true;
            } catch(_){ return false; }
        };
        this.loadSelectedDodgeSkin = function(){
            try{ const raw = localStorage.getItem('glowlings_selected_dodge_skin'); if (!raw) return null; return JSON.parse(raw); }catch(_){ return null; }
        };
        this.saveSelectedDodgeSkin = function(skin){ try{ localStorage.setItem('glowlings_selected_dodge_skin', JSON.stringify({ id: skin.id })); }catch(_){ } this._cachedDodgeSkin = skin; };
        // Ensure basic is owned/selected by default
        try{
            if (!this.ownedDodgeSkins) this.ownedDodgeSkins = this.loadOwnedDodgeSkins();
            if (!this.ownedDodgeSkins['dodge_basic']) { this.ownedDodgeSkins['dodge_basic'] = true; this.saveOwnedDodgeSkins(); }
            const selD = this.loadSelectedDodgeSkin();
            if (!selD || !selD.id) { try{ localStorage.setItem('glowlings_selected_dodge_skin', JSON.stringify({ id: 'dodge_basic' })); }catch(_){ } }
        }catch(_){ }
                    slider.__activeBound = true;
                };
            } catch {}
        };
        // Dramatic BOSS ROUND stinger helper (no flash)
        this.showBossRoundStinger = (cb) => {
            try {
                let ov = document.getElementById('bossRoundStinger');
                if (!ov) {
                    ov = document.createElement('div');
                    ov.id = 'bossRoundStinger';
                    ov.style.position = 'fixed';
                    ov.style.inset = '0';
                    ov.style.zIndex = '200000';
                    ov.style.display = 'flex';
                    ov.style.alignItems = 'center';
                    ov.style.justifyContent = 'center';
                    ov.style.pointerEvents = 'none';
                    ov.style.background = 'rgba(0,0,0,0.0)';
                    const txt = document.createElement('div');
                    txt.id = 'bossRoundStingerText';
                    txt.textContent = 'BOSS ROUND';
                    txt.style.fontFamily = "'Arial Black', Impact, system-ui, sans-serif";
                    txt.style.fontSize = 'min(12vw, 120px)';
                    txt.style.letterSpacing = '0.12em';
                    txt.style.color = '#ffed4a';
                    txt.style.textShadow = '0 0 22px rgba(255,237,74,0.55), 0 0 44px rgba(255,237,74,0.25)';
                    txt.style.opacity = '0';
                    txt.style.transform = 'scale(0.92)';
                    txt.style.transition = 'opacity 400ms ease, transform 400ms ease';
                    ov.appendChild(txt);
                    document.body.appendChild(ov);
                }
                const txt = ov.querySelector('#bossRoundStingerText');
                ov.style.display = 'flex';
                requestAnimationFrame(() => {
                    txt.style.opacity = '1';
                    txt.style.transform = 'scale(1)';
                    setTimeout(() => {
                        setTimeout(() => {
                            txt.style.opacity = '0';
                            txt.style.transform = 'scale(1.04)';
                            setTimeout(() => { ov.style.display = 'none'; if (typeof cb === 'function') cb(); }, 320);
                        }, 500);
                    }, 900);
                });
            } catch (_) { if (typeof cb === 'function') cb(); }
        };
        this.renderAchievementsUI = () => {
            try {
                this.ensureAchievementsUI();
                const ul = document.getElementById('achList');
                if (!ul) return;
                const dict = (this.ach && this.ach.unlocked) ? this.ach.unlocked : {};
                const items = Object.keys(dict).sort((a, b) => (dict[a]?.ts || 0) - (dict[b]?.ts || 0));
                if (!items.length) { ul.innerHTML = '<li class="empty">No achievements yet</li>'; return; }
                ul.innerHTML = items.map(k => {
                    const it = dict[k];
                    const name = it?.name || k;
                    const when = it?.ts ? new Date(it.ts).toLocaleString() : '';
                    return `<li>✔️ ${name} <span style="opacity:.7">(${when})</span></li>`;
                }).join('');
            } catch {}
        };
        this.unlockAchievement = (key, name) => {
            try {
                this.ach = this.ach || { unlocked: {} };
                if (this.ach.unlocked && this.ach.unlocked[key]) return; // already unlocked
                const ts = Date.now();
                this.ach.unlocked[key] = { ts, name };
                this.saveAchievements && this.saveAchievements();
                this.renderAchievementsUI && this.renderAchievementsUI();
                this.showToast && this.showToast(`Achievement: ${name}`);
            } catch {}
        };
        // --- Settings persistence ---
        this.loadUserSettings = () => {
            try {
                const raw = localStorage.getItem('elementist_settings');
                if (!raw) return;
                const s = JSON.parse(raw);
                if (s.lang) this.lang = this.normalizeLang(s.lang);
                if (typeof s.volume === 'number') this.volume = Math.max(0, Math.min(1, s.volume));
                if (typeof s.musicMuted === 'boolean') this.musicMuted = s.musicMuted;
                if (typeof s.mouseSensitivity === 'number') this.mouseSensitivity = Math.max(0.2, Math.min(2.0, s.mouseSensitivity));
                if (typeof s.desktopFovScale === 'number') this.desktopFovScale = Math.max(0.8, Math.min(1.4, s.desktopFovScale));
                if (typeof s.mobileFovScale === 'number') this.mobileFovScale = Math.max(0.6, Math.min(1.6, s.mobileFovScale));
            } catch {}
        };
        this.applyUserSettings = () => {
            try {
                this.applyAudioSettings && this.applyAudioSettings();
                this.applyMusicMute && this.applyMusicMute();
                // Language will be applied lazily by t() usage and labels; if needed we can force-refresh UI here
            } catch {}
        };
        this.saveUserSettings = () => {
            try {
                const s = {
                    lang: this.lang,
                    volume: this.volume,
                    musicMuted: !!this.musicMuted,
                    mouseSensitivity: this.mouseSensitivity,
                    desktopFovScale: this.desktopFovScale,
                    mobileFovScale: this.mobileFovScale,
                };
                localStorage.setItem('elementist_settings', JSON.stringify(s));
            } catch {}
        };
        // Load persisted settings and apply on boot
        this.loadUserSettings();
        this.applyUserSettings();
        this.playZoneShrinkFactor = 1.0; // disable legacy per-wave shrink to avoid flicker
        this.playZoneMinSize = { width: 700, height: 700 }; // allow smaller final arena (legacy)
        // Keyboard state for desktop WASD
        this.keys = { w:false, a:false, s:false, d:false, ArrowUp:false, ArrowLeft:false, ArrowDown:false, ArrowRight:false };
        console.info('[Glowlings] glowlings.js loaded v=3 @', new Date().toISOString());

        // --- SVG Rasterization Helpers for 1:1 shop-to-game visuals ---
        // Build the same SVG used in shop previews for a weapon skin at time now
        this.buildWeaponSkinSVG = (type, skin, now) => {
            try {
                const W = 140, H = 84;
                const primary = (skin && skin.colors && skin.colors[0]) || '#7dd3fc';
                const secondary = (skin && skin.colors && skin.colors[1]) || '#334155';
                if (type === 'turret') {
                    const muzzle = (skin && skin.muzzle) || '#22ff22';
                    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <g transform="translate(20,42)">
    <rect x="0" y="-6" width="26" height="12" rx="3" fill="${secondary}" stroke="${primary}" stroke-width="2"/>
    <rect x="26" y="-3" width="18" height="6" fill="#334155" />
    <circle cx="46" cy="0" r="4" fill="${muzzle}" fill-opacity="0.7" />
  </g>
</svg>`;
                }
                if (type === 'electric') {
                    const bolt = (skin && skin.bolt) || primary;
                    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <polyline points="20,20 40,44 60,28 80,50 100,34 120,46" fill="none" stroke="${bolt}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
                }
                if (type === 'gravity') {
                    const ring = (skin && skin.ring) || primary;
                    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g_rast" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="70" cy="42" r="10" fill="white" stroke="${primary}" stroke-width="2"/>
  <circle cx="70" cy="42" r="20" fill="none" stroke="${ring}" stroke-width="1" stroke-dasharray="6 4"/>
  <circle cx="70" cy="42" r="30" fill="url(#g_rast)" />
</svg>`;
                }
            } catch(_) {}
            return null;
        };
        // Rasterize an SVG string to Image using a cached data URL key
        this.rasterizeSVG = (svg, key) => {
            try {
                this._svgRasterCache = this._svgRasterCache || {};
                const entry = this._svgRasterCache[key];
                const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
                if (entry && entry.img && entry.url === dataUrl) return entry.img;
                const img = new Image();
                img.decoding = 'async';
                img.src = dataUrl;
                this._svgRasterCache[key] = { img, url: dataUrl, t: Date.now() };
                return img;
            } catch(_) { return null; }
        };

        // Ensure player has exactly one selected skin per weapon (assign basics if missing)
        this.ensureWeaponSkinSelections = () => {
            try {
                const basics = {
                    turret: { id:'turret_basic', type:'turret', name:'Standard Barrel', colors:['#06b6d4','#334155'], muzzle:'#22ff22', accents:1, cost:0, reqWave:0, rarity:'common' },
                    electric: { id:'elec_basic', type:'electric', name:'Basic Arc', colors:['#7dd3fc','#a78bfa'], bolt:'#7dd3fc', pulse:1, cost:0, reqWave:0, rarity:'common' },
                    gravity: { id:'grav_basic', type:'gravity', name:'Standard Core', colors:['#7dd3fc','#334155'], ring:'#60a5fa', rings:1, cost:0, reqWave:0, rarity:'common' }
                };
                const map = this.loadSelectedWeaponSkins ? this.loadSelectedWeaponSkins() : { turret:null, electric:null, gravity:null };
                let changed = false;
                for (const k of ['turret','electric','gravity']) {
                    if (!map[k]) { map[k] = basics[k].id; changed = true; }
                    // ensure detailed entries available for gameplay renderers
                    try {
                        const key = `glowlings_selected_weapon_skin_${k}`;
                        const raw = localStorage.getItem(key);
                        if (!raw) localStorage.setItem(key, JSON.stringify(basics[k]));
                    } catch(_) {}
                }
                if (changed) localStorage.setItem('glowlings_selected_weapon_skins', JSON.stringify(map));
            } catch(_) {}
        };
        
        // Game state
        this.gameState = 'menu'; // menu, playing, gameOver
        this.gameTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.gameMode = 'brotato'; // 'classic' | 'brotato'
        this.waveNumber = 0;
        this.waveTimer = 0; // ms remaining in current wave
        this.intermissionTimer = 0; // ms remaining between waves
        this.inWave = false;
        this.magnetActive = false;
        this.magnetRadius = 120;
        this.magnetConsumablesGiven = 0;
        this.forceMagnetDrop = false;
        this.targetWinWave = 20;
        this.materials = 0;
        this.xp = 0;
        this.drops = []; // {pos,type:'xp'|'mat',amount,vel}
        // Boss spawn flags per wave to avoid cross-wave blocking
        this.boss10Spawned = false;
        this.boss20Spawned = false;
        // Cutscene one-time flags
        this.boss5CutscenePlayed = false;
        this.boss10CutscenePlayed = false;
        this.boss15CutscenePlayed = false;
        this.boss20CutscenePlayed = false;
        // Dev hotkey state
        this.f1JumpIndex = 0; // cycles 4 -> 9 -> 14 -> 19
        // Shop freeze state
        this.inShop = false;
        this.shopFreezePos = null;
        this.shopLocked = false;
        this.rerollCost = 4;
        // Minimal run history (localStorage)
        this.runHistory = this.loadRunHistory ? this.loadRunHistory() : { best: { wave: 0, score: 0 }, lastRuns: [] };
        this.currentRun = null;
        // One-purchase-per-intermission gating
        this.purchaseUsedForWave = false;

        // Achievements (very lightweight)
        this.ach = this.loadAchievements ? this.loadAchievements() : { unlocked: {} };

        // Core defaults
        this.player = null;
        this.aiBots = [];
        this.projectiles = [];
        this.towers = [];
        this.energyOrbs = [];
        this.bonusOrbs = [];

        // Audio system
        this.audioCtx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.sfxFilter = null;
        this.musicGain = null;
        this.musicTimer = null;
        this.lastCountdownSecond = null;
        this.lastHitSfxAt = 0;
        this.lastKillSfxAt = 0;
        this.elementZones = [];
        this.particles = [];
        this.leaderboard = [];
        this.score = 0;
        this.camera = { x: 0, y: 0 };
        // Reset run-end guards
        this._runEnded = false;
        this._runEndRecorded = false;
        this.mouse = new Vector2(0, 0);
        // Track last auto-attack direction so abilities can align with bullet aim
        this.lastShotDir = null;
        // Water ability projectiles (expanding moving rings)
        this.waterRings = [];
        // Fire ability projectiles (directional beams)
        this.fireBeams = [];
        this.abilityReady = true;
        this.abilityCooldown = 0;
        this.abilityDuration = 3000;

        // Lives system (Hearts)
        this.lives = 1; // başlangıç kalbi
        // Pause/Sound
        this.paused = false;
        this.muted = false;
        // Controls & Audio settings
        this.mouseSensitivity = 1.0; // 0.5x - 2.0x
        this.volume = 1.0;           // 0.0 - 1.0
        // Mobile-only FOV user scaling (multiplies mobile zoom)
        // Default wider view on mobile
        this.mobileFovScale = this.isMobile ? (this.isMobile() ? 0.7 : 1.0) : 1.0;   // 0.7x - 1.5x via UI slider
        // Desktop-only FOV (reserved for future desktop zoom features)
        this.desktopFovScale = 1.0;  // 0.8x - 1.4x via start screen settings
        // Music-only mute control
        this.musicMuted = false;
        this.musicVolume = 0.15;      // default music gain
        // UX tips (onboarding/guidance); disabled per current request
        this.enableTips = false;
        // Touch controls
        this.usingTouch = (("ontouchstart" in window) || (navigator.maxTouchPoints > 0));
        this.joystick = { active: false, vec: new Vector2(0,0), radius: 50 };
        // Movement memory
        this.lastMoveDir = new Vector2(0, 0);
        // Dodge state
        this.isDodging = false;
        this.dodgeDir = new Vector2(0, 0);
        this.dodgeTimer = 0;       // ms remaining in current dodge
        this.dodgeCooldown = 0;    // ms until next dodge
        this.dodgeInvulnUntil = 0; // timestamp until invulnerable
        this.targetBotCount = 12;
        // Shop/skill economy state
        this.usedFreeSkill = false; // one free purchase in wave 1
        // Brotato defaults
        this.weaponCooldown = 0;
        this.weaponFireRate = 450; // ms (reverted for difficulty)
        this.weaponDamage = 15;
        this.weaponRange = 600;
        this.baseWeaponRange = this.weaponRange; // for mobile zoom scaling
        // Turret-only visual scale (does not affect bots or gameplay hitboxes)
        this.turretVisualScale = 1.28;
        // Bot visual scale after wave 4 (visual only, not hitboxes)
        this.botVisualScaleAfterW4 = 0.85;
        // Combo system
        this.comboWindowMs = 3000; // combo reset window (ms)
        // Combat tuning multipliers and element-specific bonuses
        this.projectileSpeedMult = 1.0; // reverted for difficulty
        // Pressure spawn management (ms cooldown)
        this.pressureSpawnCooldown = 0;
        // Character selection
        this.selectedCharacter = 'berserker';
        this.characterDefs = {
            berserker: {
                name: 'Berserker',
                apply: (g) => {
                    g.weaponDamage += 6;
                    g.weaponFireRate = Math.max(140, Math.floor(g.weaponFireRate * 0.86));
                }
            },
            guardian: {
                name: 'Guardian',
                apply: (g) => {
                    if (g.player) {
                        g.player.maxHP += 40;
                        g.player.hp = g.player.maxHP;
                        g.player.armor = (g.player.armor||0) + 3;
                        // Slightly slower via maneuver/speed boosts
                        g.player.speedBoost *= 0.92;
                    }
                }
            },
            ranger: {
                name: 'Ranger',
                apply: (g) => {
                    g.weaponRange = Math.floor(g.weaponRange * 1.25);
                    g.baseWeaponRange = g.weaponRange;
                    g.projectileSpeedMult *= 1.18;
                }
            },
            engineer: {
                name: 'Engineer',
                apply: (g) => {
                    // Tower synergy: small passive aura and bonus materials
                    if (g.player) {
                        g.player.auraDps = (g.player.auraDps||0) + 6;
                        g.player.auraRadius = Math.max(g.player.auraRadius||0, 120);
                    }
                    g.materials += 10;
                }
            },
            rogue: {
                name: 'Rogue',
                apply: (g) => {
                    if (g.player) {
                        g.player.speedBoost *= 1.15;
                        g.player.maneuverBoost *= 1.15;
                        g.player.critChance = Math.min(0.6, (g.player.critChance||0) + 0.18);
                        g.player.critDamageMult = (g.player.critDamageMult||1) + 0.5; // +50% crit dmg
                    }
                    g.weaponFireRate = Math.max(120, Math.floor(g.weaponFireRate * 0.94));
                }
            }
        };
        this.globalMaxBots = 40; // gameplay cap: toplam bot limiti (carry-over dahil)
        this.carryOverLimit = 10; // wave biterken en fazla bu kadar düşman kalır
        // Spawn smoothing
        this.spawnAccumulator = 0; // fractional spawns per second buffer
        this.spawnPerSecond = 2.5; // will scale per-wave by player power

        // Initial render of stats panel on load
        try { this.renderStatsPanel && this.renderStatsPanel(); } catch(_) {}

        // Wave helpers: build plan, set play zone, choose concurrent target by plan
        this.buildWavePlan = () => {
            // durations in seconds -> ms, and optional composition counts
            // Types are informational here (engine lacks per-type spawners for now);
            // we use totals to set concurrency.
            const s = (n)=>n*1000;
            const P = {};
            // Wave 1–4 (gentle onboarding)
            P[1] = { durationMs: s(20), comp:{ rush:12 } };
            // Introduce a few shooters on Wave 2
            P[2] = { durationMs: s(25), comp:{ rush:14, shooter:2 } };
            // Introduce variety on Wave 3: a few shooters + 1 kite
            P[3] = { durationMs: s(30), comp:{ rush:18, shooter:3, kite:1 } };
            P[4] = { durationMs: s(35), comp:{ rush:25 } };
            // Wave 6–9
            P[6] = { durationMs: s(40), comp:{ rush:20, shooter:5 } };
            P[7] = { durationMs: s(45), comp:{ rush:25, shooter:10 } };
            P[8] = { durationMs: s(50), comp:{ rush:30, shooter:12, kite:2 } };
            P[9] = { durationMs: s(55), comp:{ rush:35, shooter:15, kite:5 } };
            // Wave 11–14
            P[11] = { durationMs: s(50), comp:{ rush:30, shooter:12, kite:8 } };
            P[12] = { durationMs: s(55), comp:{ rush:35, shooter:15, kite:10, tank:2 } };
            P[13] = { durationMs: s(60), comp:{ rush:40, shooter:15, kite:12, tank:4 } };
            P[14] = { durationMs: s(65), comp:{ rush:45, shooter:20, kite:12, tank:6 } };
            // Wave 16–19
            P[16] = { durationMs: s(65), comp:{ rush:40, shooter:20, kite:12, tank:6 } };
            P[17] = { durationMs: s(70), comp:{ rush:45, shooter:20, kite:14, tank:8 } };
            P[18] = { durationMs: s(75), comp:{ rush:50, shooter:25, kite:15, tank:10, elite:2 } };
            P[19] = { durationMs: s(75), comp:{ rush:60, shooter:25, kite:15, tank:12 } };
            // Wave 21–24
            P[21] = { durationMs: s(70), comp:{ rush:50, shooter:25, kite:20, tank:12 } };
            P[22] = { durationMs: s(75), comp:{ rush:60, shooter:30, kite:20, tank:14 } };
            P[23] = { durationMs: s(75), comp:{ rush:70, shooter:35, kite:22, tank:15 } };
            P[24] = { durationMs: s(80), comp:{ rush:80, shooter:35, kite:25, tank:18 } };
            // Wave 26–29
            P[26] = { durationMs: s(80), comp:{ rush:70, shooter:35, kite:25, tank:20 } };
            P[27] = { durationMs: s(85), comp:{ rush:80, shooter:40, kite:25, tank:20 } };
            P[28] = { durationMs: s(85), comp:{ rush:90, shooter:40, kite:30, tank:22, elite:2 } };
            P[29] = { durationMs: s(90), comp:{ rush:100, shooter:50, kite:30, tank:25 } };
            return P;
        };
        this.applyPlayZoneForWave = (wave) => {
            // Keep arena size constant every wave using the initial zone size
            const w = initialZoneW, h = initialZoneH;
            // Center the zone
            this.playZone.width = w; this.playZone.height = h;
            this.playZone.x = Math.floor((this.worldSize.width - w) / 2);
            this.playZone.y = Math.floor((this.worldSize.height - h) / 2);
        };
        this.applyTargetCountForWave = (wave) => {
            const plan = this.wavePlan[wave];
            const total = plan && plan.comp ? Object.values(plan.comp).reduce((a,b)=>a+(b|0),0) : 0;
            const choose = (tot)=>{
                if (tot <= 0) return 12;
                if (tot <= 30) return 12;
                if (tot <= 60) return 20;
                if (tot <= 120) return 30;
                return 40; // cap at globalMaxBots by default
            };
            this.targetBotCount = Math.min(choose(total), this.globalMaxBots|0);
        };
        
        // Wave plan (durations + compositions) and duration resolver
        this.wavePlan = this.buildWavePlan();
        this.getWaveDuration = (wave) => {
            const p = this.wavePlan[wave];
            if (p && p.durationMs) return p.durationMs;
            // fallback legacy pacing
            if (wave <= 3) return 20000;
            if (wave <= 6) return this.randInt(30000, 40000);
            if (wave <= 10) return this.randInt(50000, 60000);
            if (wave <= 15) return this.randInt(70000, 80000);
            if (wave <= 19) return this.randInt(80000, 90000);
            return 90000;
        };
        // Threat budget equals target total enemies for the wave
        this.getThreatBudget = (wave) => {
            if (wave <= 3) return this.randInt(30, 40);
            if (wave <= 6) return this.randInt(60, 80);
            if (wave <= 10) return this.randInt(100, 120);
            if (wave <= 15) return this.randInt(150, 180);
            if (wave <= 19) return this.randInt(200, 250);
            return 200; // Wave 20 support enemies (boss separate)
        };
        // Initialize remaining composition for a wave based on plan
        this.initWaveCompositionFor = (wave) => {
            const p = this.wavePlan[wave] || null;
            this.waveCompRemaining = { rush:0, shooter:0, kite:0, tank:0, elite:0 };
            if (p && p.comp) {
                for (const k of Object.keys(this.waveCompRemaining)) {
                    this.waveCompRemaining[k] = (p.comp[k] | 0);
                }
                // Post-wave6 adjustment (non-boss waves): reduce rush, add shooters, ensure at least 1 tank
                try {
                    const w = Math.max(1, wave|0);
                    const isBossWave = (w % 5) === 0; // 5,10,15,20,25,30
                    if (w >= 6 && !isBossWave) {
                        const total = Object.values(this.waveCompRemaining).reduce((a,b)=>a+(b|0),0) || 0;
                        const baseRush = this.waveCompRemaining.rush|0;
                        // Reduce rush by ~40% after 6+, and even more after 11+ to highlight tactical shooters
                        const reducedRush = (w >= 11)
                          ? Math.max(4, Math.floor(baseRush * 0.35))
                          : Math.max(8, Math.floor(baseRush * 0.6));
                        // Shooter scale: start modestly, grow slowly; stronger boost after 11+
                        const extraShooters = (w >= 11)
                          ? Math.max(6, Math.floor(3 + (w-11)*0.9))
                          : Math.max(3, Math.floor(2 + (w-6)*0.6));
                        // Ensure at least 1 tank, grow every ~8 waves (unchanged)
                        const tanks = Math.max(1, Math.floor(1 + (w-6)/8));
                        // Optionally drop kite in these waves to match spec focus
                        const kites = 0;
                        // Reallocate preserving overall difficulty ballpark
                        let remaining = Math.max(0, total - (reducedRush + extraShooters + tanks + kites));
                        // Distribute remaining into rush and shooters (favor shooters lightly)
                        const addShoot = Math.floor(remaining * (w >= 11 ? 0.6 : 0.4)); remaining -= addShoot;
                        const addRush = remaining; remaining = 0;
                        this.waveCompRemaining.rush = reducedRush + addRush;
                        this.waveCompRemaining.shooter = extraShooters + addShoot;
                        this.waveCompRemaining.kite = kites;
                        this.waveCompRemaining.tank = tanks;
                        // keep elite as-is from plan
                    }
                } catch {}
            }
            this.waveTotalPlanned = Object.values(this.waveCompRemaining).reduce((a,b)=>a+b,0);
        };
        // Choose an enemy type weighted by remaining counts; fallback to rush
        this.chooseEnemyTypeForWave = (wave) => {
            const rem = this.waveCompRemaining || {};
            const entries = Object.entries(rem).filter(([,v]) => (v|0) > 0);
            if (!entries.length) {
                // No specific plan -> soft progression
                if (wave >= 28) return Math.random() < 0.15 ? 'elite' : (Math.random()<0.4?'tank':'rush');
                if (wave >= 18) return Math.random() < 0.08 ? 'elite' : (Math.random()<0.5?'tank':'shooter');
                if (wave >= 12) return Math.random() < 0.3 ? 'tank' : (Math.random()<0.2?'kite':'shooter');
                if (wave >= 6)  return Math.random() < 0.25 ? 'shooter' : 'rush';
                return 'rush';
            }
            const total = entries.reduce((a, [,v]) => a + (v|0), 0);
            let r = Math.random() * total;
            for (const [k, v] of entries) {
                r -= (v|0);
                if (r <= 0) return k;
            }
            return 'rush';
        };
        this.fireBurnDurationBase = 1600; // ms base burn duration
        this.fireBurnDpsBonus = 0;      // additional burn DPS from shop
        this.fireBurnDurationBonus = 0; // ms additional duration from shop
        // Air movement bonuses
        this.speedBoostMult = 1.10;      // slightly faster
        this.maneuverBoostMult = 1.06;   // slightly snappier turns

        // Apply wave plan changes when waveNumber changes (playzone + targetBotCount)
        this._lastWaveApplied = null;
        this._wavePlanWatcher = setInterval(()=>{
            try{
                const w = this.waveNumber|0;
                if(!w || w === this._lastWaveApplied) return;
                this.applyPlayZoneForWave(w);
                this.applyTargetCountForWave(w);
                this._lastWaveApplied = w;
            }catch(_){ }
        }, 500);

        // Place neutral towers once
        this.createTowers && this.createTowers();

        // i18n state (default to English)
        this.lang = 'en';
        // Normalize a variety of language codes to our internal keys
        this.normalizeLang = function(code){
            try{
                const c = String(code||'').toLowerCase();
                if (!c) return 'en';
                // map common variants
                if (c === 'tr' || c.startsWith('tr-')) return 'tr';
                if (c === 'en' || c.startsWith('en-')) return 'en';
                if (c === 'de' || c.startsWith('de-') || c === 'deu' || c === 'ger') return 'de';
                if (c === 'es' || c.startsWith('es-') || c === 'spa') return 'es';
                if (c === 'pt' || c === 'pt-br' || c === 'pt_br' || c.startsWith('pt-')) return (c === 'pt' ? 'pt' : 'pt-br');
                if (c === 'ja' || c.startsWith('ja-') || c === 'jp' || c === 'jpn') return 'ja';
                if (c === 'hi' || c.startsWith('hi-') || c === 'hin') return 'hi';
                if (c === 'zh' || c.startsWith('zh-') || c === 'zh_cn' || c === 'zh-hans' || c === 'zh_hans' || c === 'zh-hant' || c === 'zh_hant') return 'zh';
                return c;
            }catch(_){ return 'en'; }
        };
        // Persist and apply language changes in one place
        this.setLanguage = (lang)=>{
            try{
                const norm = this.normalizeLang(lang);
                // only switch to a language we have translations for
                if (this.translations && this.translations[norm]) {
                    this.lang = norm;
                } else {
                    this.lang = 'en';
                }
                try { localStorage.setItem('lang', this.lang); } catch(_){ }
                // Apply language instantly without reload
                try { this.applyLanguage && this.applyLanguage(); } catch(_){ }
                // Update document language attribute for accessibility/SEO
                try { document.documentElement.setAttribute('lang', this.lang); } catch(_){ }
                // Update cutscene skip button label if overlay exists
                try {
                    const skip = document.getElementById('cutsceneSkipBtn');
                    if (skip) { skip.textContent = (this && typeof this.t==='function') ? this.t('close') : 'CLOSE'; }
                } catch(_){ }
                // Sync dropdown if present
                try { const sel = document.getElementById('languageSelect'); if (sel) sel.value = this.lang; } catch(_){ }
            }catch(_){ }
        };
        // On startup, override default only with URL param if present (do not auto-read saved localStorage language)
        try{
            let initialLang = null;
            try { initialLang = new URLSearchParams(location.search).get('lang'); } catch(_){ }
            if (initialLang) {
                this.lang = this.normalizeLang(initialLang);
            }
            // Apply once after resolving initial language; also sync document lang attribute to default 'en' or URL override
            try {
                this.applyLanguage && this.applyLanguage();
                try { document.documentElement.setAttribute('lang', this.lang || 'en'); } catch(_){ }
            } catch(_){ }
        }catch(_){ }
        this.translations = {
            tr: {
                startSubtitle: 'Neon evreninde enerji topla, büyü ve rakiplerini alt et!',
                colorLabel: 'Renk Seç:',
                shapeLabel: 'Şekil Seç:',
                startBtn: 'OYUNA BAŞLA',
                // Generic keys used by data-lang in HTML
                rotateTitle: 'Lütfen Cihazınızı Yatay Çevirin',
                rotateDesc: 'Bu oyun yatay (16:9) modda en iyi oynanır.',
                subtitle: 'Neon evreninde enerji topla, büyü ve rakiplerini alt et!',
                chooseColor: 'Renk Seç:',
                chooseShape: 'Şekil Seç:',
                startGame: 'OYUNA BAŞLA',
                settings: 'AYARLAR',
                shop: 'MAĞAZA',
                characters: 'KARAKTERLER',
                builders: 'BUILDLER',
                otherGames: 'DİĞER OYUNLAR',
                followUs: '242 Games',
                howTo: 'NASIL OYNANIR',
                howToTitle: 'Nasıl Oynanır',
                controls_pc: 'PC Kontrolleri',
                close: 'KAPAT',
                back: 'GERİ',
                // Main menu shop categories
                catSkins: 'Kostümler',
                catDodgeSkins: 'Dodge Kostümleri',
                catWeaponSkins: 'Silah Kaplamaları',
                catMaps: 'Haritalar',
                // Shop labels
                coins: 'Coin',
                costLabel: 'Maliyet',
                reqWaveLabel: 'Gerekli Dalga',
                locked: 'Kilitli',
                select: 'Seç',
                selected: 'Seçili',
                buy: 'Satın Al',
                insufficientCoins: 'Yetersiz Coin',
                trailLabel: 'İz',
                // Run stats (menu panel)
                runStatsTitle: 'Koşu İstatistikleri',
                bestWaveLabel: 'En İyi Dalga',
                bestScoreLabel: 'En İyi Skor',
                resetStats: 'İstatistikleri Sıfırla',
                noRunsYet: 'Henüz kayıt yok',
                // How To overlay - controls & tips
                arrowKeys: 'Ok Tuşları',
                controls_move: 'Hareket',
                controls_ability: 'Yetenek kullan',
                controls_ability_water_hint: 'Su elementinde yetenek aktifken Shift\'e tekrar basarsan, su havuzu o anki konumda sabitlenir.',
                controls_dash: 'Dash / Kaçış',
                controls_pause: 'Duraklat / Menü',
                tipsTitle: 'İpuçları',
                tip1: 'Düşmanlardan enerji topla, büyü ve güçlen.',
                tip2: 'Wave 3 sonrası silah seçimi yap, sonra shop açılsın.',
                tip3: 'Materyalleri shop’ta güçlendirmeye harca.',
                settingsTitle: 'Ayarlar',
                sound: 'Ses',
                music: 'Müzik',
                // Settings tabs and controls (new)
                appearance: 'Görünüm',
                credits: 'Emeği Geçenler',
                creditsText: 'Elementist geliştirici ekibi ve katkıda bulunanlara teşekkürler.',
                fullscreen: 'Tam Ekran',
                fpsCap: 'FPS Sınırı',
                fpsInfo: 'FPS Bilgisi',
                unlimited: 'Sınırsız',
                on: 'Açık',
                off: 'Kapalı',
                fovDesktop: 'Görüş Alanı: ',
                mouseSensitivity: 'Fare Hassasiyeti: ',
                sensitivity: 'Hassasiyet',
                toggleSound: 'Ses',
                toggleMusic: 'Müzik',
                volume: 'Ses: ',
                charElementTitle: 'Karakter & Element Seç',
                elementOverlayTitle: 'Elementini Seç',
                elementOverlayDesc: 'Shift ile kullanabileceğin özel yeteneği belirler. Cooldown: 10s',
                elementOverlayDescMobile: 'Skill butonu ile kullanabileceğin özel yeteneği belirler. Cooldown: 10s',
                elFire: '🔥 Ateş',
                elWater: '💧 Su',
                elAir: '🌬️ Hava',
                // Character names & desc
                char_berserker_name: 'Berserker',
                char_berserker_desc: 'Yakın dövüşte vahşi: +Hasar, +Saldırı Hızı; düşük zırh.',
                char_guardian_name: 'Guardian',
                char_guardian_desc: 'Ön safta duvar: +Maks HP, +Zırh; daha yavaş.',
                char_ranger_name: 'Ranger',
                char_ranger_desc: 'Uzak mesafe uzmanı: +Menzil, +Mermi Hızı.',
                char_engineer_name: 'Engineer',
                char_engineer_desc: 'Destek ve ekonomi: +Kule sinerjisi, +Malzeme.',
                char_rogue_name: 'Rogue',
                char_rogue_desc: 'Çevik ve ölümcül: +Hareket Hızı, +Kritik Oranı.',
                score: 'Skor:',
                materials: 'Materyal:',
                element: 'Element:',
                lives: 'Kalpler:',
                buildersTitle: 'Buildler',
                buildersSubtitle: '3 element için önerilen build’ler ve kısa açıklamalar.',
                charactersTitle: 'Karakterler',
                charactersSubtitle: 'Temelden zora tüm düşman arketiplerinin görseli ve açıklaması.',
                // Characters modal content
                enemy_rush_circle_title: 'Rush (Daire)',
                enemy_rush_circle_desc: 'En temel yakıncı; ateş etmez. Doğrudan kovalar, sürekli basınç kurar.',
                enemy_rush_triangle_title: 'Rush (Üçgen)',
                enemy_rush_triangle_desc: 'Keskin dönüş alır; kısa patlamalarla hızlanıp üstüne kapanır.',
                enemy_shooter_title: 'Shooter',
                enemy_shooter_desc: 'Orta-uzak mesafeden periyodik enerji mermisi atar; sabit ritim, orta hız.',
                enemy_sniper_title: 'Sniper',
                enemy_sniper_desc: 'Çok uzakta bekler; nişan alıp gecikmeli fakat yüksek hasarlı atış yapar.',
                enemy_charger_title: 'Charger',
                enemy_charger_desc: 'Kısa telegraph sonrası düz bir hatta aşırı hızlanır ve çarpar.',
                enemy_brute_title: 'Brute',
                enemy_brute_desc: 'Yüksek can ve kütle; yakın temasta güçlü itiş uygular, yavaş ama ısrarlı.',
                enemy_assassin_title: 'Assassin',
                enemy_assassin_desc: 'Görünürlük arasında geçiş yapar; pusu kurup ani yaklaşır.',
                enemy_juggernaut_title: 'Juggernaut',
                enemy_juggernaut_desc: 'Önde dönen kalkanla mermileri bloklar; yavaş ilerleyen ağır tank.',
                enemy_parasite_title: 'Parasite',
                enemy_parasite_desc: 'Temasta zayıflatma uygular; yakın kalarak yıpratır.',
                enemy_mutant_title: 'Mutant',
                enemy_mutant_desc: 'Dalga ilerledikçe biçim ve davranış değiştirir; tahmin etmesi zordur.',
                // Builds modal content
                build_fire_crit_title: 'Yanıcı Krit',
                build_fire_crit_desc: 'Yüksek hasar, alan etkili patlamalar',
                build_fire_crit_i1: 'Alev Dansı',
                build_fire_crit_i2: 'Kızıl Çiy',
                build_fire_crit_i3: 'Ateş Halkası',
                build_fire_crit_i4: 'Kritik Alev',
                build_fire_layers_title: 'Yanma Üstüne Yanma',
                build_fire_layers_desc: 'Yanma katmanlarıyla sürekli DPS',
                build_fire_layers_i1: 'Süregelen Yanış',
                build_fire_layers_i2: 'Köz İzi',
                build_fire_layers_i3: 'Isı Dalgası',
                build_fire_layers_i4: 'Kömür Kalp',
                build_fire_explosive_title: 'Patlayıcı',
                build_fire_explosive_desc: 'Temas sonrası mini patlamalar',
                build_fire_explosive_i1: 'Kıvılcım Yükü',
                build_fire_explosive_i2: 'Volatil Alev',
                build_fire_explosive_i3: 'Basınçlı Çekirdek',
                build_fire_explosive_i4: 'Yanardağ',
                build_water_waves_title: 'Dalgasavar',
                build_water_waves_desc: 'Alan kontrolü ve yavaşlatma',
                build_water_waves_i1: 'Gelgit Halkası',
                build_water_waves_i2: 'Soğuk Akım',
                build_water_waves_i3: 'Yoğun Sis',
                build_water_waves_i4: 'Derin Basınç',
                build_water_flow_title: 'Akış Ustası',
                build_water_flow_desc: 'Hareketlilik + iyileşme',
                build_water_flow_i1: 'Canlandıran Damlalar',
                build_water_flow_i2: 'Çiseleyen Perde',
                build_water_flow_i3: 'Akışkan Zırh',
                build_water_flow_i4: 'Nehrin Ritmi',
                build_water_ice_title: 'Buz Dondurucu',
                build_water_ice_desc: 'Düşük hız, yüksek kontrol',
                build_water_ice_i1: 'Donma Noktası',
                build_water_ice_i2: 'Buz Pulu',
                build_water_ice_i3: 'Kırağı Dokunuşu',
                build_water_ice_i4: 'Kutup Sessizliği',
                build_air_crit_title: 'Krit Fırtınası',
                build_air_crit_desc: 'Yüksek crit, hızlı oyun',
                build_air_crit_i1: 'Fırtına Öfkesi',
                build_air_crit_i2: 'Yükselen Basınç',
                build_air_crit_i3: 'Gök Gürültüsü',
                build_air_crit_i4: 'Sonsuz Esinti',
                build_air_dodger_title: 'Dodger',
                build_air_dodger_desc: 'Kaçınma ve hayatta kalma',
                build_air_dodger_i1: 'Hafif Adımlar',
                build_air_dodger_i2: 'Fırtına Zırhı',
                build_air_dodger_i3: 'Rüzgar Kalkanı',
                build_air_dodger_i4: 'Hafiflik Büyüsü',
                build_air_assassin_title: 'Assassin Hızı',
                build_air_assassin_desc: 'Hareket hızı ve ani saldırı',
                build_air_assassin_i1: 'Rüzgar Çizmeleri',
                build_air_assassin_i2: 'Jet Akımı',
                build_air_assassin_i3: 'Tüy Tetik',
                build_air_assassin_i4: 'Fırtına Hücumu',
                elementOverlayTitle: 'Elementini Seç',
                elementOverlayDesc: 'Space ile kullanabileceğin özel yeteneği belirler. Cooldown: 10s',
                chooseFire: '🔥 Ateş', chooseWater: '💧 Su', chooseAir: '🌬️ Hava',
                scoreLabel: 'Skor:', materialsTopLabel: 'Materyal:', elementTopLabel: 'Element:',
                gameOverTitle: 'ÖLDÜN', restartBtn: 'TEKRAR BAŞLA', backToMenuBtn: 'ANA MENÜYE DÖN',
                resumeBtn: 'OYUNA DÖN',
                inGameMenuTitle: 'OYUN MENÜSÜ',
                infoFireTitle: '🔥 Ateş Elementi', infoFire1: 'Patlama İtme: Yakındaki rakipleri iter', infoFire2: 'Avlama Bonusu: Küçük rakipleri daha kolay yakalar', infoFire3: 'Dezavantaj: Kısa menzil, büyük rakiplere etkisiz',
                infoWaterTitle: '💧 Su Elementi', infoWater1: 'Yavaşlatma Alanı: Rakiplerin hızını %70 düşürür', infoWater2: 'Alan Kontrolü: Geniş etki alanı', infoWater3: 'Dezavantaj: Doğrudan saldırı gücü yok',
                infoAirTitle: '🌬️ Hava Elementi', infoAir1: 'Sürat Artışı: 3x hız ve 2x manevra', infoAir2: 'Pozisyon Avantajı: Hızlı kaçış ve takip', infoAir3: 'Dezavantaj: Rakipleri etkileyemez',
                abilityIconTitle: 'Yetenek kullan (Space)',
                abilityIconTitleShift: 'Yetenek kullan (Shift)',
                shopTitle: 'Mağaza - Mola', materialsLabel: 'Materyal:', xpLabel: 'XP:', xp: 'XP:', rerollBtn: 'Yenile', lockBtn: 'Kilit', unlockBtn: 'Kilidi Aç', startWaveBtn: 'Sonraki Dalga', costLabel: 'Maliyet', wavePrefix: 'Dalga',
                tabOffers: 'Ödüller', tabItems: 'Eşyalar', tabUpgrades: 'Yükseltmeler', tabSpecial: 'Özel',
                shopStatsTitle: 'İstatistikler', activeBuffsTitle: 'Aktif Güçlendirmeler',
                offer_fire_1_name: 'Kor Mermiler', offer_fire_1_desc: '+4 hasar (mermi)',
                offer_fire_1_blurb: 'Mermilerinin taban hasarını kalıcı olarak artırır.',
                offer_fire_2_name: 'Cehennem Karışımı', offer_fire_2_desc: '+6 yanma DPS',
                offer_fire_2_blurb: 'Mermilerin uyguladığı yanma hasarını saniye başına artırır.',
                offer_fire_3_name: 'Kalıcı Isı', offer_fire_3_desc: '+600ms yanma süresi',
                offer_fire_3_blurb: 'Yanma etkisinin hedef üstünde kalma süresini uzatır.',
                offer_water_1_name: 'Akış Odak', offer_water_1_desc: '+%15 menzil',
                offer_water_1_blurb: 'Silah menzilini %15 artırır; daha uzaktan hedef vurursun.',
                offer_water_2_name: 'Sakinleştirici Örtü', offer_water_2_desc: '+25 Maks HP, %50 iyileş',
                offer_water_2_blurb: 'Maksimum canı +25 yükseltir; mevcut canının %50’sini anında yeniler.',
                offer_water_3_name: 'Hızlı Akış', offer_water_3_desc: '+%12 mermi hızı',
                offer_water_3_blurb: 'Mermi hızını %12 artırır; hedefe ulaşma süresini kısaltır.',
                offer_air_1_name: 'Rüzgar Çizmeleri', offer_air_1_desc: '+%20 hareket, +%10 manevra',
                offer_air_1_blurb: 'Hareket hızını %20 ve manevra kabiliyetini %10 artırır.',
                offer_air_2_name: 'Tüy Tetik', offer_air_2_desc: '-%12 bekleme',
                offer_air_2_blurb: 'Silah bekleme süresini %12 azaltır; daha sık ateş edersin.',
                offer_air_3_name: 'Çapraz Rüzgar Menzil', offer_air_3_desc: '+%20 menzil'
                ,offer_air_3_blurb: 'Silah menzilini %20 artırır; daha uzaktaki hedefleri vurursun.'
            },
            en: {
                startSubtitle: 'Collect energy in a neon universe, grow, and defeat your rivals!',
                colorLabel: 'Choose Color:',
                shapeLabel: 'Choose Shape:',
                startBtn: 'START GAME',
                // Generic keys used by data-lang in HTML
                rotateTitle: 'Please Rotate Your Device',
                rotateDesc: 'This game plays best in landscape (16:9) mode.',
                subtitle: 'Collect energy in a neon universe, grow, and defeat your rivals!',
                chooseColor: 'Choose Color:',
                chooseShape: 'Choose Shape:',
                startGame: 'START GAME',
                settings: 'SETTINGS',
                shop: 'SHOP',
                characters: 'CHARACTERS',
                builders: 'BUILDS',
                otherGames: 'OTHER GAMES',
                followUs: '242 Games',
                howTo: 'HOW TO PLAY',
                howToTitle: 'How to Play',
                controls_pc: 'PC Controls',
                close: 'CLOSE',
                back: 'Back',
                // Main menu shop categories
                catSkins: 'Skins',
                catDodgeSkins: 'Dodge Skins',
                catWeaponSkins: 'Weapon Skins',
                catMaps: 'Maps',
                // Shop labels
                coins: 'Coins',
                costLabel: 'Cost',
                reqWaveLabel: 'Req Wave',
                locked: 'Locked',
                select: 'Select',
                selected: 'Selected',
                buy: 'Buy',
                insufficientCoins: 'Insufficient Coins',
                trailLabel: 'Trail',
                // Run stats (menu panel)
                runStatsTitle: 'Run Stats',
                bestWaveLabel: 'Best Wave',
                bestScoreLabel: 'Best Score',
                resetStats: 'Reset Stats',
                noRunsYet: 'No runs yet',
                // How To overlay - controls & tips
                arrowKeys: 'Arrow Keys',
                controls_move: 'Move',
                controls_ability: 'Use ability',
                controls_ability_water_hint: 'In Water element, pressing Shift again while the ability is active locks the water pool at your current position.',
                controls_dash: 'Dash / Evade',
                controls_pause: 'Pause / Menu',
                tipsTitle: 'Tips',
                tip1: 'Collect energy from enemies to grow stronger.',
                tip2: 'After Wave 3, pick a weapon, then the shop will open.',
                tip3: 'Spend materials in the shop to upgrade.',
                settingsTitle: 'Settings',
                sound: 'Sound',
                music: 'Music',
                // Settings tabs and controls (new)
                appearance: 'Appearance',
                credits: 'Credits',
                creditsText: 'Thanks to the Elementist dev team and contributors.',
                fullscreen: 'Fullscreen',
                fpsCap: 'FPS Cap',
                fpsInfo: 'FPS Info',
                unlimited: 'Unlimited',
                on: 'On',
                off: 'Off',
                language: 'Language',
                fovDesktop: 'FOV: ',
                mouseSensitivity: 'Mouse Sensitivity: ',
                sensitivity: 'Sensitivity',
                toggleSound: 'Sound',
                toggleMusic: 'Music',
                volume: 'Volume: ',
                charElementTitle: 'Select Character & Element',
                elementOverlayTitle: 'Choose Your Element',
                elementOverlayDesc: 'Defines the special ability used with Shift. Cooldown: 10s',
                elementOverlayDescMobile: 'Defines the special ability used with the Skill button. Cooldown: 10s',
                elFire: '🔥 Fire',
                elWater: '💧 Water',
                elAir: '🌪️ Air',
                // Character names & desc
                char_berserker_name: 'Berserker',
                char_berserker_desc: '+Damage, +Attack Speed, -Armor',
                char_guardian_name: 'Guardian',
                char_guardian_desc: '+HP, +Armor, -Speed',
                char_ranger_name: 'Ranger',
                char_ranger_desc: '+Range, +Projectile Speed',
                char_engineer_name: 'Engineer',
                char_engineer_desc: '+Tower Synergy, +Materials',
                char_rogue_name: 'Rogue',
                char_rogue_desc: '+Speed, +Crit',
                score: 'Score:',
                materials: 'Materials:',
                element: 'Element:',
                lives: 'Lives:',
                buildersTitle: 'Builds',
                buildersSubtitle: 'Recommended builds and short notes for the 3 elements.',
                charactersTitle: 'Characters',
                charactersSubtitle: 'Visuals and descriptions for all enemy archetypes from basic to hard.',
                // Characters modal content
                enemy_rush_circle_title: 'Rush (Circle)',
                enemy_rush_circle_desc: 'Basic melee; does not shoot. Directly chases with constant pressure.',
                enemy_rush_triangle_title: 'Rush (Triangle)',
                enemy_rush_triangle_desc: 'Takes sharp turns; short bursts to close distance.',
                enemy_shooter_title: 'Shooter',
                enemy_shooter_desc: 'Mid-long range periodic energy shots; steady cadence.',
                enemy_sniper_title: 'Sniper',
                enemy_sniper_desc: 'Waits far away; aims and fires delayed high-damage shots.',
                enemy_charger_title: 'Charger',
                enemy_charger_desc: 'After a short telegraph, dashes in a straight line.',
                enemy_brute_title: 'Brute',
                enemy_brute_desc: 'High HP/mass; strong shove on contact, slow but relentless.',
                enemy_assassin_title: 'Assassin',
                enemy_assassin_desc: 'Toggles visibility; ambushes with sudden approach.',
                enemy_juggernaut_title: 'Juggernaut',
                enemy_juggernaut_desc: 'Front rotating shield blocks bullets; slow heavy tank.',
                enemy_parasite_title: 'Parasite',
                enemy_parasite_desc: 'Applies weaken on touch; wears you down up close.',
                enemy_mutant_title: 'Mutant',
                enemy_mutant_desc: 'Changes form/behavior as waves progress; hard to predict.',
                // Builds modal content
                build_fire_crit_title: 'Ignite Crit',
                build_fire_crit_desc: 'High damage, AoE bursts',
                build_fire_crit_i1: 'Flame Dance',
                build_fire_crit_i2: 'Crimson Dew',
                build_fire_crit_i3: 'Fire Ring',
                build_fire_crit_i4: 'Critical Flame',
                build_fire_layers_title: 'Stacks on Fire',
                build_fire_layers_desc: 'Sustained DPS with burn layers',
                build_fire_layers_i1: 'Lingering Burn',
                build_fire_layers_i2: 'Cinder Trail',
                build_fire_layers_i3: 'Heat Wave',
                build_fire_layers_i4: 'Coal Heart',
                build_fire_explosive_title: 'Explosive',
                build_fire_explosive_desc: 'Mini-explosions after contact',
                build_fire_explosive_i1: 'Spark Charge',
                build_fire_explosive_i2: 'Volatile Flame',
                build_fire_explosive_i3: 'Pressurized Core',
                build_fire_explosive_i4: 'Volcano',
                build_water_waves_title: 'Wavebreaker',
                build_water_waves_desc: 'Area control and slow',
                build_water_waves_i1: 'Tidal Ring',
                build_water_waves_i2: 'Cold Current',
                build_water_waves_i3: 'Dense Mist',
                build_water_waves_i4: 'Deep Pressure',
                build_water_flow_title: 'Flow Master',
                build_water_flow_desc: 'Mobility + sustain',
                build_water_flow_i1: 'Revitalizing Drops',
                build_water_flow_i2: 'Drizzling Veil',
                build_water_flow_i3: 'Fluid Armor',
                build_water_flow_i4: 'River Rhythm',
                build_water_ice_title: 'Ice Freezer',
                build_water_ice_desc: 'Lower speed, high control',
                build_water_ice_i1: 'Freezing Point',
                build_water_ice_i2: 'Ice Scale',
                build_water_ice_i3: 'Frost Touch',
                build_water_ice_i4: 'Polar Silence',
                build_air_crit_title: 'Crit Storm',
                build_air_crit_desc: 'High crit, fast play',
                build_air_crit_i1: 'Storm Fury',
                build_air_crit_i2: 'Rising Pressure',
                build_air_crit_i3: 'Thunderclap',
                build_air_crit_i4: 'Endless Breeze',
                build_air_dodger_title: 'Dodger',
                build_air_dodger_desc: 'Evasion and survival',
                build_air_dodger_i1: 'Light Steps',
                build_air_dodger_i2: 'Storm Armor',
                build_air_dodger_i3: 'Wind Shield',
                build_air_dodger_i4: 'Spell of Lightness',
                build_air_assassin_title: 'Assassin Speed',
                build_air_assassin_desc: 'Move speed and sudden strikes',
                build_air_assassin_i1: 'Wind Boots',
                build_air_assassin_i2: 'Jet Stream',
                build_air_assassin_i3: 'Feather Trigger',
                build_air_assassin_i4: 'Storm Dash',
                elementOverlayTitle: 'Choose Your Element',
                elementOverlayDesc: 'Defines the special ability used with Space. Cooldown: 10s',
                chooseFire: '🔥 Fire', chooseWater: '💧 Water', chooseAir: '🌬️ Air',
                scoreLabel: 'Score:', materialsTopLabel: 'Materials:', elementTopLabel: 'Element:',
                gameOverTitle: 'YOU DIED', restartBtn: 'RETRY', backToMenuBtn: 'BACK TO MENU',
                resumeBtn: 'RESUME',
                inGameMenuTitle: 'GAME MENU',
                infoFireTitle: '🔥 Fire Element', infoFire1: 'Blast Push: Pushes nearby enemies', infoFire2: 'Hunting Bonus: Easier to catch small foes', infoFire3: 'Drawback: Short range, weak vs big foes',
                infoWaterTitle: '💧 Water Element', infoWater1: 'Slow Field: Reduces enemy speed by 70%', infoWater2: 'Area Control: Large AoE', infoWater3: 'Drawback: No direct damage',
                infoAirTitle: '🌬️ Air Element', infoAir1: 'Speed Surge: 3x speed and 2x maneuver', infoAir2: 'Positioning: Quick escape and chase', infoAir3: 'Drawback: No enemy impact',
                abilityIconTitle: 'Use ability (Space)',
                abilityIconTitleShift: 'Use ability (Shift)',
                shopTitle: 'Shop - Intermission', materialsLabel: 'Materials:', xpLabel: 'XP:', xp: 'XP:', rerollBtn: 'Reroll', lockBtn: 'Lock', unlockBtn: 'Unlock', startWaveBtn: 'Start Next Wave', costLabel: 'Cost', wavePrefix: 'Wave',
                tabOffers: 'Offers', tabItems: 'Items', tabUpgrades: 'Upgrades', tabSpecial: 'Special',
                shopStatsTitle: 'Stats', activeBuffsTitle: 'Active Buffs',
                offer_fire_1_name: 'Ember Rounds', offer_fire_1_desc: '+4 damage (bullets)',
                offer_fire_1_blurb: 'Permanently increases base bullet damage.',
                offer_fire_2_name: 'Inferno Mix', offer_fire_2_desc: '+6 burn DPS',
                offer_fire_2_blurb: 'Increases bullets’ burn damage per second.',
                offer_fire_3_name: 'Lingering Heat', offer_fire_3_desc: '+600ms burn duration',
                offer_fire_3_blurb: 'Extends the duration of burn on targets.',
                offer_water_1_name: 'Flow Focus', offer_water_1_desc: '+15% range',
                offer_water_1_blurb: 'Increases weapon range by 15% to hit from farther away.',
                offer_water_2_name: 'Soothing Veil', offer_water_2_desc: '+25 Max HP, heal 50%',
                offer_water_2_blurb: 'Raises Max HP by +25 and instantly heals 50% of your current HP.',
                offer_water_3_name: 'Streamlined Shot', offer_water_3_desc: '+12% projectile speed',
                offer_water_3_blurb: 'Increases projectile speed by 12% to reach targets sooner.',
                offer_air_1_name: 'Gale Boots', offer_air_1_desc: '+20% move, +10% maneuver',
                offer_air_1_blurb: 'Boosts movement speed by 20% and maneuverability by 10%.',
                offer_air_2_name: 'Feather Trigger', offer_air_2_desc: '-12% cooldown',
                offer_air_2_blurb: 'Reduces weapon cooldown by 12% to fire more frequently.',
                offer_air_3_name: 'Crosswind Range', offer_air_3_desc: '+20% range'
                ,offer_air_3_blurb: 'Increases weapon range by 20% to hit distant targets.'
            }
        };

        // Provide a simple translator and a DOM applier for [data-lang]
        try {
            this.t = (key) => {
                try {
                    const lang = this.lang || 'en';
                    const pack = (this.translations && this.translations[lang]) ? this.translations[lang] : (this.translations ? this.translations.en : null);
                    if (pack && Object.prototype.hasOwnProperty.call(pack, key)) return pack[key];
                    const en = this.translations && this.translations.en;
                    if (en && Object.prototype.hasOwnProperty.call(en, key)) return en[key];
                    return key;
                } catch(_) { return key; }
            };
            this.applyLanguage = () => {
                try {
                    const nodes = document.querySelectorAll('[data-lang]');
                    nodes.forEach((el) => {
                        const k = el.getAttribute('data-lang');
                        if (!k) return;
                        const v = this.t(k);
                        // Only apply if we actually have a translation; avoid showing raw keys
                        if (v != null && v !== k) el.textContent = v;
                    });
                } catch(_) {}
            };
            // Apply once now that translator exists (covers main menu buttons like #shopBtn)
            try { this.applyLanguage(); } catch(_) {}
        } catch(_) {}

        // Provide translation keys for shop items (names and descriptions) for EN base.
        // Other locales will inherit these and can override later.
        try {
            const en = this.translations.en;
            Object.assign(en, {
                // Consumables
                shop_item_blood_draught_name: 'Blood Draught',
                shop_item_blood_draught_desc: '4s: 40% of your damage returns as HP. After it ends, lose 5% Max HP.',
                shop_item_flame_syrup_name: 'Flame Syrup',
                shop_item_flame_syrup_desc: '3s: Attacks apply burn; 20% of burn damage returns as HP. -20% move speed.',
                shop_item_mist_tonic_name: 'Mist Tonic',
                shop_item_mist_tonic_desc: '3s: First 3 hits are ignored; 30% of damage becomes HP. Vision -50%.',
                shop_item_stone_infusion_name: 'Stone Infusion',
                shop_item_stone_infusion_desc: '5s: +3 Armor. No healing; only 30% of taken damage is refunded. Speed reduced.',
                shop_item_heal_potion_name: 'Heal Potion',
                shop_item_heal_potion_desc: 'Instantly heal 25% HP. (CD 12s)',

                // Upgrades
                shop_item_sharp_crystal_name: 'Sharpened Crystal',
                shop_item_sharp_crystal_desc: '+3 DMG, -3% move speed',
                shop_item_light_core_name: 'Lightweight Core',
                shop_item_light_core_desc: '+6% move speed, -1 Armor',
                shop_item_iron_husk_name: 'Iron Husk',
                shop_item_iron_husk_desc: '+2 Armor, -4% move speed',
                shop_item_vital_shard_name: 'Vital Shard',
                shop_item_vital_shard_desc: '+1 Max Heart; cost increases by +8 after each purchase',

                // Specials
                shop_item_cinder_ring_name: 'Cinder Ring',
                shop_item_cinder_ring_desc: 'Nearby enemies burn for 0.5 DPS (does not stack).',
                shop_item_burning_claw_name: 'Burning Claw',
                shop_item_burning_claw_desc: '+10% crit chance; critical hits deal 30% less damage.',
                shop_item_molten_core_name: 'Molten Core',
                shop_item_molten_core_desc: 'Burn duration +0.5s; your HP regen -1.',
                shop_item_frozen_veil_name: 'Frozen Veil',
                shop_item_frozen_veil_desc: '10% slow aura; while inside the aura you are also 5% slower.',
                shop_item_abyss_pearl_name: 'Abyss Pearl',
                shop_item_abyss_pearl_desc: '+1 Armor, +5% slow; -5% attack speed.',
                shop_item_tidecaller_name: 'Tidecaller',
                shop_item_tidecaller_desc: '+5 materials at end of each wave; 2s slower at wave start.',
                shop_item_tempest_feather_name: 'Tempest Feather',
                shop_item_tempest_feather_desc: '+15% move speed; -10% damage.',
                shop_item_storm_eye_name: 'Storm Eye',
                shop_item_storm_eye_desc: '+10% attack speed; projectile range -10%.',
                shop_item_cyclone_fragment_name: 'Cyclone Fragment',
                shop_item_cyclone_fragment_desc: 'If you have Dash, cooldown -20%; briefly -1 Armor after dash.',
                shop_item_amber_coin_name: 'Amber Coin',
                shop_item_amber_coin_desc: '+5 materials at the start of each wave; enemies gain +5% HP.',
                shop_item_lucky_charm_name: 'Lucky Charm',
                shop_item_lucky_charm_desc: '+10% drop chance; -5% damage.',
                shop_item_time_relic_name: 'Time Relic',
                shop_item_time_relic_desc: 'Wave duration -5s; rewards +10 materials.'
            });
            // Base EN: Weapon upgrades section and items
            try {
                Object.assign(this.translations.en, {
                    weaponUpgrades: 'WEAPON UPGRADES',
                    weaponStatsTitle: 'Weapon Stats',
                    weaponBase: 'BASE WEAPON',
                    weaponSelected: 'SELECTED WEAPON',
                    wepCurrent: 'Current',
                    wepDamage: 'Damage',
                    wepFireRate: 'Fire Rate',
                    wepRange: 'Range',
                    wepPeriod: 'Period',
                    wepRadius: 'Radius',
                    wepChain: 'Chain',
                    wepShrapnel: 'Shrapnel',
                    shop_item_wep_turret_damage_name: 'Turret Calibration',
                    shop_item_wep_turret_damage_desc: '+15% turret damage',
                    shop_item_wep_turret_speed_name: 'Auto-loader',
                    shop_item_wep_turret_speed_desc: '+12% turret fire rate',
                    shop_item_wep_elec_damage_name: 'Overcharge Coils',
                    shop_item_wep_elec_damage_desc: '+15% electric damage',
                    shop_item_wep_elec_speed_name: 'Pulse Optimizer',
                    shop_item_wep_elec_speed_desc: '+12% electric fire rate',
                    shop_item_wep_grav_damage_name: 'Dense Core',
                    shop_item_wep_grav_damage_desc: '+15% gravity core damage',
                    shop_item_wep_grav_speed_name: 'Phase Cycler',
                    shop_item_wep_grav_speed_desc: 'Gravity period -12% (more frequent)'
                });
            } catch(_) {}
        } catch(_) {}

        // Build full locale packs by cloning EN and overriding strings
        try {
            const base = this.translations.en;
            const addLocale = (code, overrides)=>{
                this.translations[code] = Object.assign({}, base, overrides||{});
            };
            addLocale('de', {
                weaponStatsTitle: 'Waffenstatistiken', weaponBase: 'BASISWAFFE', weaponSelected: 'AUSGEWÄHLTE WAFFE', wepCurrent: 'Aktuell', wepDamage: 'Schaden', wepFireRate: 'Feuerrate', wepRange: 'Reichweite', wepPeriod: 'Periode', wepRadius: 'Radius', wepChain: 'Kette', wepShrapnel: 'Splitter',
                startSubtitle: 'Sammle Energie in einem Neon-Universum, wachse und besiege deine Rivalen!',
                colorLabel: 'Farbe wählen:',
                shapeLabel: 'Form wählen:',
                startBtn: 'SPIEL STARTEN',
                rotateTitle: 'Bitte Gerät drehen',
                rotateDesc: 'Dieses Spiel funktioniert im Querformat (16:9) am besten.',
                subtitle: 'Sammle Energie in einem Neon-Universum, wachse und besiege deine Rivalen!',
                chooseColor: 'Farbe wählen:',
                chooseShape: 'Form wählen:',
                startGame: 'SPIEL STARTEN',
                settings: 'EINSTELLUNGEN',
                shop: 'SHOP',
                characters: 'CHARAKTERE',
                builders: 'BUILDS',
                howTo: 'ANLEITUNG',
                howToTitle: 'Wie man spielt',
                controls_pc: 'PC-Steuerung',
                close: 'SCHLIESSEN', back: 'Zurück',
                runStatsTitle: 'Lauf-Statistiken',
                bestWaveLabel: 'Beste Welle',
                bestScoreLabel: 'Bester Score',
                resetStats: 'Statistiken zurücksetzen',
                arrowKeys: 'Pfeiltasten',
                controls_move: 'Bewegen',
                controls_ability: 'Fähigkeit benutzen',
                controls_dash: 'Sprinten / Ausweichen',
                controls_pause: 'Pause / Menü',
                tipsTitle: 'Tipps',
                tip1: 'Sammle Energie von Gegnern, um stärker zu werden.',
                tip2: 'Nach Welle 3 Waffe wählen, dann öffnet der Shop.',
                tip3: 'Gib Materialien im Shop für Upgrades aus.',
                settingsTitle: 'Einstellungen',
                // Settings tabs and controls (new)
                appearance: 'Aussehen',
                credits: 'Mitwirkende',
                creditsText: 'Danke an das Elementist-Entwicklungsteam und alle Mitwirkenden.',
                fullscreen: 'Vollbild',
                fpsCap: 'FPS-Limit',
                fpsInfo: 'FPS-Info',
                unlimited: 'Unbegrenzt',
                sound: 'Sound', music: 'Musik', on: 'An', off: 'Aus', language: 'Sprache',
                fovDesktop: 'Sichtfeld: ', mouseSensitivity: 'Maus-Empfindlichkeit: ', sensitivity: 'Empfindlichkeit',
                volume: 'Lautstärke: ',
                charElementTitle: 'Charakter & Element wählen',
                elementOverlayTitle: 'Wähle dein Element',
                elementOverlayDesc: 'Legt die Spezialfähigkeit (Leertaste) fest. Abklingzeit: 10s',
                elementOverlayDescMobile: 'Legt die Spezialfähigkeit (Skill-Button) fest. Abklingzeit: 10s',
                elFire: '🔥 Feuer', elWater: '💧 Wasser', elAir: '🌪️ Luft',
                score: 'Punkte:', materials: 'Materialien:', element: 'Element:', lives: 'Leben:',
                buildersTitle: 'Builds', buildersSubtitle: 'Empfohlene Builds und kurze Hinweise für die 3 Elemente.',
                charactersTitle: 'Charaktere', charactersSubtitle: 'Visuals und Beschreibungen aller Gegner-Archetypen.',
                scoreLabel: 'Punkte:', materialsTopLabel: 'Materialien:', elementTopLabel: 'Element:',
                gameOverTitle: 'DU BIST GESTORBEN', restartBtn: 'ERNEUT', backToMenuBtn: 'ZURÜCK INS MENÜ',
                resumeBtn: 'WEITER',
                inGameMenuTitle: 'SPIELMENÜ',
                infoFireTitle: '🔥 Feuer-Element', infoFire1: 'Explosionsstoß', infoFire2: 'Jagdbonus', infoFire3: 'Nachteil: kurze Reichweite',
                infoWaterTitle: '💧 Wasser-Element', infoWater1: 'Verlangsamungsfeld 70%', infoWater2: 'Flächenkontrolle', infoWater3: 'Kein direkter Schaden',
                infoAirTitle: '🌪️ Luft-Element', infoAir1: '3x Tempo, 2x Manöver', infoAir2: 'Positioning: Quick escape and chase', infoAir3: 'Kein direkter Einfluss',
                abilityIconTitle: 'Fähigkeit (Leertaste)',
                abilityIconTitleShift: 'Fähigkeit (Shift)',
                shopTitle: 'Shop - Pause', materialsLabel: 'Materialien:', xpLabel: 'EP:', rerollBtn: 'Neu würfeln', lockBtn: 'Sperren', unlockBtn: 'Entsperren', startWaveBtn: 'Nächste Welle', costLabel: 'Kosten', wavePrefix: 'Welle',
                tabOffers: 'Angebote', tabItems: 'Items', tabUpgrades: 'Upgrades', tabSpecial: 'Spezial',
                // Characters (DE)
                enemy_rush_circle_title: 'Rush (Kreis)',
                enemy_rush_circle_desc: 'Einfacher Nahkämpfer; schießt nicht. Verfolgt direkt mit konstantem Druck.',
                enemy_rush_triangle_title: 'Rush (Dreieck)',
                enemy_rush_triangle_desc: 'Nimmt scharfe Kurven; kurze Schübe zum Schließen der Distanz.',
                enemy_shooter_title: 'Schütze',
                enemy_shooter_desc: 'Mittel/weite Distanz, periodische Energieschüsse; gleichmäßiger Rhythmus.',
                enemy_sniper_title: 'Scharfschütze',
                enemy_sniper_desc: 'Wartet weit entfernt; zielt und feuert verzögert hohen Schaden.',
                enemy_charger_title: 'Stürmer',
                enemy_charger_desc: 'Nach kurzer Anzeige sprintet er in gerader Linie.',
                enemy_brute_title: 'Schläger',
                enemy_brute_desc: 'Hohe HP/Masse; starker Stoß bei Kontakt, langsam aber beharrlich.',
                enemy_assassin_title: 'Assassine',
                enemy_assassin_desc: 'Wechselt Sichtbarkeit; überfällt mit plötzlicher Annäherung.',
                enemy_juggernaut_title: 'Koloss',
                enemy_juggernaut_desc: 'Vorne rotierender Schild blockt Kugeln; langsamer schwerer Tank.',
                enemy_parasite_title: 'Parasit',
                enemy_parasite_desc: 'Schwächt bei Berührung; zermürbt aus nächster Nähe.',
                enemy_mutant_title: 'Mutant',
                enemy_mutant_desc: 'Ändert Form/Verhalten mit den Wellen; schwer vorherzusagen.',
                // Builds (DE)
                build_fire_crit_title: 'Zündkrit',
                build_fire_crit_desc: 'Hoher Schaden, Flächenexplosionen',
                build_fire_crit_i1: 'Flammentanz',
                build_fire_crit_i2: 'Karmesintau',
                build_fire_crit_i3: 'Feuerring',
                build_fire_crit_i4: 'Kritische Flamme',
                build_fire_layers_title: 'Brennen stapeln',
                build_fire_layers_desc: 'Anhaltender DPS mit Brandstapeln',
                build_fire_layers_i1: 'Nachglühen',
                build_fire_layers_i2: 'Aschespur',
                build_fire_layers_i3: 'Hitzewelle',
                build_fire_layers_i4: 'Kohlenherz',
                build_fire_explosive_title: 'Explosiv',
                build_fire_explosive_desc: 'Mini-Explosionen nach Kontakt',
                build_fire_explosive_i1: 'Funkenladung',
                build_fire_explosive_i2: 'Flüchtige Flamme',
                build_fire_explosive_i3: 'Druckkern',
                build_fire_explosive_i4: 'Vulkan',
                build_water_waves_title: 'Wellenbrecher',
                build_water_waves_desc: 'Flächenkontrolle und Verlangsamung',
                build_water_waves_i1: 'Gezeitenring',
                build_water_waves_i2: 'Kalte Strömung',
                build_water_waves_i3: 'Dichter Nebel',
                build_water_waves_i4: 'Tiefer Druck',
                build_water_flow_title: 'Flussmeister',
                build_water_flow_desc: 'Beweglichkeit + Regeneration',
                build_water_flow_i1: 'Belebende Tropfen',
                build_water_flow_i2: 'Nieselschleier',
                build_water_flow_i3: 'Flüssige Rüstung',
                build_water_flow_i4: 'Flussrhythmus',
                build_water_ice_title: 'Eisblockierer',
                build_water_ice_desc: 'Wenig Tempo, hohe Kontrolle',
                build_water_ice_i1: 'Gefrierpunkt',
                build_water_ice_i2: 'Eisschuppe',
                build_water_ice_i3: 'Frostberührung',
                build_water_ice_i4: 'Polare Stille',
                build_air_crit_title: 'Krit-Sturm',
                build_air_crit_desc: 'Hoher Krit, schnelles Spiel',
                build_air_crit_i1: 'Sturmwut',
                build_air_crit_i2: 'Steigender Druck',
                build_air_crit_i3: 'Donnerschlag',
                build_air_crit_i4: 'Endlose Brise',
                build_air_dodger_title: 'Ausweicher',
                build_air_dodger_desc: 'Ausweichen und Überleben',
                build_air_dodger_i1: 'Leichte Schritte',
                build_air_dodger_i2: 'Sturmrüstung',
                build_air_dodger_i3: 'Windschild',
                build_air_dodger_i4: 'Leichtigkeitszauber',
                build_air_assassin_title: 'Assassinen-Tempo',
                build_air_assassin_desc: 'Laufgeschwindigkeit und plötzliche Angriffe',
                build_air_assassin_i1: 'Windstiefel',
                build_air_assassin_i2: 'Jetstrom',
                build_air_assassin_i3: 'Federabzug',
                build_air_assassin_i4: 'Sturmrausch',
                // Shop items (DE)
                shop_item_blood_draught_name: 'Bluttrunk',
                shop_item_blood_draught_desc: '4s: 40% deines Schadens wird zu HP. Danach -5% Max-HP.',
                shop_item_flame_syrup_name: 'Flammen-Sirup',
                shop_item_flame_syrup_desc: '3s: Angriffe verursachen Brand; 20% Brandschaden heilt. -20% Laufgeschwindigkeit.',
                shop_item_mist_tonic_name: 'Nebel-Tonikum',
                shop_item_mist_tonic_desc: '3s: Erste 3 Treffer ignoriert; 30% Schaden wird HP. Sicht -50%.',
                shop_item_stone_infusion_name: 'Stein-Infusion',
                shop_item_stone_infusion_desc: '5s: +3 Rüstung. Keine Heilung; nur 30% erlittenen Schadens zurück. Langsamer.',
                shop_item_heal_potion_name: 'Heiltrank',
                shop_item_heal_potion_desc: 'Sofort +25% HP. (CD 12s)',
                shop_item_sharp_crystal_name: 'Geschärfter Kristall',
                shop_item_sharp_crystal_desc: '+3 Schaden, -3% Tempo',
                shop_item_light_core_name: 'Leichtkern',
                shop_item_light_core_desc: '+6% Tempo, -1 Rüstung',
                shop_item_iron_husk_name: 'Eisenhülle',
                shop_item_iron_husk_desc: '+2 Rüstung, -4% Tempo',
                shop_item_vital_shard_name: 'Vital-Scherbe',
                shop_item_vital_shard_desc: '+1 Max-Herz; Kosten +8 nach jedem Kauf',
                shop_item_cinder_ring_name: 'Aschering',
                shop_item_cinder_ring_desc: 'Nahe Gegner brennen für 0,5 DPS (stapelt nicht).',
                shop_item_burning_claw_name: 'Brennende Kralle',
                shop_item_burning_claw_desc: '+10% Krit; Krits verursachen 30% weniger Schaden.',
                shop_item_molten_core_name: 'Geschmolzener Kern',
                shop_item_molten_core_desc: 'Branddauer +0,5s; eigene HP-Regeneration -1.',
                shop_item_frozen_veil_name: 'Frostschleier',
                shop_item_frozen_veil_desc: '10% Verlangsamungs-Aura; darin bist du auch 5% langsamer.',
                shop_item_abyss_pearl_name: 'Abgrund-Perle',
                shop_item_abyss_pearl_desc: '+1 Rüstung, +5% Slow; -5% Angriffstempo.',
                shop_item_tidecaller_name: 'Gezeitenrufer',
                shop_item_tidecaller_desc: '+5 Material am Wellenende; Start 2s langsamer.',
                shop_item_tempest_feather_name: 'Sturmfeder',
                shop_item_tempest_feather_desc: '+15% Tempo; -10% Schaden.',
                shop_item_storm_eye_name: 'Sturmauge',
                shop_item_storm_eye_desc: '+10% Angriffstempo; Projektilreichweite -10%.',
                shop_item_cyclone_fragment_name: 'Zyklon-Fragment',
                shop_item_cyclone_fragment_desc: 'Mit Dash: CD -20%; kurz -1 Rüstung nach Dash.',
                shop_item_amber_coin_name: 'Bernsteinmünze',
                shop_item_amber_coin_desc: '+5 Material zum Wellenstart; Gegner-HP +5%.',
                shop_item_lucky_charm_name: 'Glückstalisman',
                shop_item_lucky_charm_desc: '+10% Dropchance; -5% Schaden.',
                shop_item_time_relic_name: 'Zeitrelikt',
                shop_item_time_relic_desc: 'Wellenzeit -5s; Belohnung +10 Material.'
            });
            // Base weapon upgrades translations
            try {
                Object.assign(this.translations.en, {
                    shop_item_base_overclocker_name: 'Overclocker',
                    shop_item_base_overclocker_desc: '+15% fire rate',
                    shop_item_base_reinforced_slugs_name: 'Reinforced Slugs',
                    shop_item_base_reinforced_slugs_desc: '+12% damage',
                    shop_item_base_calibrated_sight_name: 'Calibrated Sight',
                    shop_item_base_calibrated_sight_desc: '+10% range',
                    shop_item_base_kinetic_rounds_name: 'Kinetic Rounds',
                    shop_item_base_kinetic_rounds_desc: '+12% projectile speed',
                    shop_item_base_quickstep_name: 'Quickstep Harness',
                    shop_item_base_quickstep_desc: '+8% movement speed'
                });
                Object.assign(this.translations.de, {
                    shop_item_base_overclocker_name: 'Overclocker',
                    shop_item_base_overclocker_desc: '+15% Feuerrate',
                    shop_item_base_reinforced_slugs_name: 'Verstärkte Geschosse',
                    shop_item_base_reinforced_slugs_desc: '+12% Schaden',
                    shop_item_base_calibrated_sight_name: 'Kalibriertes Visier',
                    shop_item_base_calibrated_sight_desc: '+10% Reichweite',
                    shop_item_base_kinetic_rounds_name: 'Kinetische Munition',
                    shop_item_base_kinetic_rounds_desc: '+12% Projektilgeschwindigkeit',
                    shop_item_base_quickstep_name: 'Quickstep-Gurt',
                    shop_item_base_quickstep_desc: '+8% Bewegungstempo'
                });
                Object.assign(this.translations.es, {
                    shop_item_base_overclocker_name: 'Overclocker',
                    shop_item_base_overclocker_desc: '+15% cadencia',
                    shop_item_base_reinforced_slugs_name: 'Balas Reforzadas',
                    shop_item_base_reinforced_slugs_desc: '+12% daño',
                    shop_item_base_calibrated_sight_name: 'Mira Calibrada',
                    shop_item_base_calibrated_sight_desc: '+10% alcance',
                    shop_item_base_kinetic_rounds_name: 'Rondas Cinéticas',
                    shop_item_base_kinetic_rounds_desc: '+12% velocidad de proyectil',
                    shop_item_base_quickstep_name: 'Arnés Ágil',
                    shop_item_base_quickstep_desc: '+8% velocidad de movimiento'
                });
                Object.assign(this.translations['pt-br'], {
                    shop_item_base_overclocker_name: 'Overclocker',
                    shop_item_base_overclocker_desc: '+15% taxa de fogo',
                    shop_item_base_reinforced_slugs_name: 'Projéteis Reforçados',
                    shop_item_base_reinforced_slugs_desc: '+12% dano',
                    shop_item_base_calibrated_sight_name: 'Mira Calibrada',
                    shop_item_base_calibrated_sight_desc: '+10% alcance',
                    shop_item_base_kinetic_rounds_name: 'Munição Cinética',
                    shop_item_base_kinetic_rounds_desc: '+12% vel. de projétil',
                    shop_item_base_quickstep_name: 'Cinto Quickstep',
                    shop_item_base_quickstep_desc: '+8% velocidade de movimento'
                });
                Object.assign(this.translations.ja, {
                    shop_item_base_overclocker_name: 'オーバークロッカー',
                    shop_item_base_overclocker_desc: '発射速度 +15%',
                    shop_item_base_reinforced_slugs_name: '強化スラッグ',
                    shop_item_base_reinforced_slugs_desc: 'ダメージ +12%',
                    shop_item_base_calibrated_sight_name: 'キャリブレートサイト',
                    shop_item_base_calibrated_sight_desc: '射程 +10%',
                    shop_item_base_kinetic_rounds_name: 'キネティック弾',
                    shop_item_base_kinetic_rounds_desc: '弾速 +12%',
                    shop_item_base_quickstep_name: 'クイックステップハーネス',
                    shop_item_base_quickstep_desc: '移動速度 +8%'
                });
                Object.assign(this.translations.hi, {
                    shop_item_base_overclocker_name: 'ओवरक्लॉकर',
                    shop_item_base_overclocker_desc: '+15% फायर रेट',
                    shop_item_base_reinforced_slugs_name: 'मजबूत स्लग्स',
                    shop_item_base_reinforced_slugs_desc: '+12% डैमेज',
                    shop_item_base_calibrated_sight_name: 'कैलिब्रेटेड साइट',
                    shop_item_base_calibrated_sight_desc: '+10% रेंज',
                    shop_item_base_kinetic_rounds_name: 'काइनेटिक राउण्ड्स',
                    shop_item_base_kinetic_rounds_desc: '+12% प्रोजेक्टाइल स्पीड',
                    shop_item_base_quickstep_name: 'क्विकस्टेप हार्नेस',
                    shop_item_base_quickstep_desc: '+8% मूवमेंट स्पीड'
                });
                Object.assign(this.translations['zh-cn'], {
                    shop_item_base_overclocker_name: '超频器',
                    shop_item_base_overclocker_desc: '射速 +15%',
                    shop_item_base_reinforced_slugs_name: '强化弹头',
                    shop_item_base_reinforced_slugs_desc: '伤害 +12%',
                    shop_item_base_calibrated_sight_name: '校准瞄具',
                    shop_item_base_calibrated_sight_desc: '范围 +10%',
                    shop_item_base_kinetic_rounds_name: '动能弹',
                    shop_item_base_kinetic_rounds_desc: '弹速 +12%',
                    shop_item_base_quickstep_name: '轻步束带',
                    shop_item_base_quickstep_desc: '移动速度 +8%'
                });
            } catch(_) {}
            addLocale('es', {
                weaponStatsTitle: 'Estadísticas de Arma', weaponBase: 'ARMA BASE', weaponSelected: 'ARMA SELECCIONADA', wepCurrent: 'Actual', wepDamage: 'Daño', wepFireRate: 'Cadencia', wepRange: 'Alcance', wepPeriod: 'Período', wepRadius: 'Radio', wepChain: 'Cadena', wepShrapnel: 'Fragmentos',
                startSubtitle: 'Recoge energía en un universo neón, crece y derrota a tus rivales!',
                colorLabel: 'Elegir color:', shapeLabel: 'Elegir forma:', startBtn: 'EMPEZAR',
                rotateTitle: 'Gira tu dispositivo', rotateDesc: 'Se juega mejor en horizontal (16:9).',
                subtitle: 'Recoge energía en un universo neón, crece y derrota a tus rivales!',
                chooseColor: 'Elegir color:', chooseShape: 'Elegir forma:', startGame: 'EMPEZAR',
                settings: 'AJUSTES', shop: 'TIENDA', characters: 'PERSONAJES', builders: 'BUILDS',
                // Settings tabs and controls (new)
                appearance: 'Apariencia',
                credits: 'Créditos',
                creditsText: 'Gracias al equipo de desarrollo de Elementist y a los colaboradores.',
                fullscreen: 'Pantalla completa',
                fpsCap: 'Límite FPS',
                fpsInfo: 'Info FPS',
                unlimited: 'Ilimitado',
                sound: 'Sonido', music: 'Música', on: 'On', off: 'Off', language: 'Idioma', fovDesktop: 'FOV: ', mouseSensitivity: 'Sensibilidad del mouse: ', sensitivity: 'Sensibilidad', volume: 'Volumen: ',
                charElementTitle: 'Selecciona Personaje y Elemento', elementOverlayTitle: 'Elige tu Elemento', elementOverlayDesc: 'Habilidad especial con Espacio. Enfriamiento: 10s', elementOverlayDescMobile: 'Habilidad con botón Skill. Enfriamiento: 10s',
                elFire: '🔥 Fuego', elWater: '💧 Agua', elAir: '🌪️ Aire',
                score: 'Puntuación:', materials: 'Materiales:', element: 'Elemento:', lives: 'Vidas:',
                buildersTitle: 'Builds', buildersSubtitle: 'Builds recomendados y notas breves para los 3 elementos.',
                charactersTitle: 'Personajes', charactersSubtitle: 'Visuales y descripciones de los arquetipos enemigos.',
                scoreLabel: 'Puntuación:', materialsTopLabel: 'Materiales:', elementTopLabel: 'Elemento:',
                gameOverTitle: 'HAS MUERTO', restartBtn: 'REINTENTAR', backToMenuBtn: 'VOLVER AL MENÚ',
                resumeBtn: 'CONTINUAR',
                inGameMenuTitle: 'MENÚ',
                infoFireTitle: '🔥 Elemento Fuego', infoFire1: 'Empuje explosivo', infoFire2: 'Bonificación de caza', infoFire3: 'Desventaja: poco alcance',
                infoWaterTitle: '💧 Elemento Agua', infoWater1: 'Campo de lentitud 70%', infoWater2: 'Control de área', infoWater3: 'Sin daño directo',
                infoAirTitle: '🌪️ Elemento Aire', infoAir1: 'Velocidad x3, maniobra x2', infoAir2: 'Posicionamiento rápido', infoAir3: 'Sin impacto directo',
                abilityIconTitle: 'Usar habilidad (Espacio)', abilityIconTitleShift: 'Usar habilidad (Shift)',
                shopTitle: 'Tienda - Intermedio', materialsLabel: 'Materiales:', xpLabel: 'XP:', rerollBtn: 'Reroll', lockBtn: 'Bloquear', unlockBtn: 'Desbloquear', startWaveBtn: 'Siguiente oleada', costLabel: 'Costo', wavePrefix: 'Oleada',
                tabOffers: 'Ofertas', tabItems: 'Objetos', tabUpgrades: 'Mejoras', tabSpecial: 'Especial',
                // Characters (ES)
                enemy_rush_circle_title: 'Rush (Círculo)',
                enemy_rush_circle_desc: 'Cuerpo a cuerpo básico; no dispara. Persigue con presión constante.',
                enemy_rush_triangle_title: 'Rush (Triángulo)',
                enemy_rush_triangle_desc: 'Giros cerrados; ráfagas cortas para alcanzar.',
                enemy_shooter_title: 'Tirador',
                enemy_shooter_desc: 'Media-larga distancia, disparos periódicos; ritmo estable.',
                enemy_sniper_title: 'Francotirador',
                enemy_sniper_desc: 'Espera lejos; apunta y dispara con retraso y alto daño.',
                enemy_charger_title: 'Cargador',
                enemy_charger_desc: 'Tras breve aviso, embiste en línea recta.',
                enemy_brute_title: 'Bruto',
                enemy_brute_desc: 'Alta vida/masa; empuje fuerte al contacto, lento pero constante.',
                enemy_assassin_title: 'Asesino',
                enemy_assassin_desc: 'Alterna visibilidad; embosca con acercamiento súbito.',
                enemy_juggernaut_title: 'Juggernaut',
                enemy_juggernaut_desc: 'Escudo giratorio frontal bloquea balas; tanque lento.',
                enemy_parasite_title: 'Parásito',
                enemy_parasite_desc: 'Aplica debilidad al contacto; desgaste cercano.',
                enemy_mutant_title: 'Mutante',
                enemy_mutant_desc: 'Cambia forma/comportamiento por oleadas; difícil de prever.',
                // Builds (ES)
                build_fire_crit_title: 'Crítico Ígneo',
                build_fire_crit_desc: 'Alto daño, explosiones en área',
                build_fire_crit_i1: 'Danza de Llamas',
                build_fire_crit_i2: 'Rocío Carmesí',
                build_fire_crit_i3: 'Anillo de Fuego',
                build_fire_crit_i4: 'Llama Crítica',
                build_fire_layers_title: 'Capas de Quemadura',
                build_fire_layers_desc: 'DPS sostenido con capas de quemadura',
                build_fire_layers_i1: 'Quemadura Persistente',
                build_fire_layers_i2: 'Rastro de Ascuas',
                build_fire_layers_i3: 'Ola de Calor',
                build_fire_layers_i4: 'Corazón de Carbón',
                build_fire_explosive_title: 'Explosivo',
                build_fire_explosive_desc: 'Mini-explosiones tras contacto',
                build_fire_explosive_i1: 'Carga de Chispa',
                build_fire_explosive_i2: 'Llama Volátil',
                build_fire_explosive_i3: 'Núcleo Presurizado',
                build_fire_explosive_i4: 'Volcán',
                build_water_waves_title: 'Rompeolas',
                build_water_waves_desc: 'Control de área y ralentización',
                build_water_waves_i1: 'Anillo de Marea',
                build_water_waves_i2: 'Corriente Fría',
                build_water_waves_i3: 'Niebla Densa',
                build_water_waves_i4: 'Presión Profunda',
                build_water_flow_title: 'Maestro del Flujo',
                build_water_flow_desc: 'Movilidad + sustain',
                build_water_flow_i1: 'Gotas Revitalizantes',
                build_water_flow_i2: 'Velo Llovizna',
                build_water_flow_i3: 'Armadura Fluida',
                build_water_flow_i4: 'Ritmo del Río',
                build_water_ice_title: 'Hielo Congelante',
                build_water_ice_desc: 'Menor velocidad, alto control',
                build_water_ice_i1: 'Punto de Congelación',
                build_water_ice_i2: 'Escama de Hielo',
                build_water_ice_i3: 'Toque de Escarcha',
                build_water_ice_i4: 'Silencio Polar',
                build_air_crit_title: 'Tormenta Crítica',
                build_air_crit_desc: 'Alto crítico, juego rápido',
                build_air_crit_i1: 'Furia de Tormenta',
                build_air_crit_i2: 'Presión Ascendente',
                build_air_crit_i3: 'Trueno',
                build_air_crit_i4: 'Brisa Infinita',
                build_air_dodger_title: 'Esquivo',
                build_air_dodger_desc: 'Evasión y supervivencia',
                build_air_dodger_i1: 'Pasos Ligeros',
                build_air_dodger_i2: 'Armadura de Tormenta',
                build_air_dodger_i3: 'Escudo de Viento',
                build_air_dodger_i4: 'Hechizo de Levedad',
                build_air_assassin_title: 'Velocidad Asesina',
                build_air_assassin_desc: 'Velocidad de movimiento y golpes súbitos',
                build_air_assassin_i1: 'Botas de Viento',
                build_air_assassin_i2: 'Corriente a Chorro',
                build_air_assassin_i3: 'Gatillo Pluma',
                build_air_assassin_i4: 'Embate de Tormenta',
                // Shop items (ES)
                shop_item_blood_draught_name: 'Breve de Sangre',
                shop_item_blood_draught_desc: '4s: 40% del daño vuelve como HP. Luego -5% de HP Máx.',
                shop_item_flame_syrup_name: 'Jarabe Ígneo',
                shop_item_flame_syrup_desc: '3s: Ataques aplican quemadura; 20% del daño de quemadura cura. -20% velocidad.',
                shop_item_mist_tonic_name: 'Tónico de Niebla',
                shop_item_mist_tonic_desc: '3s: Se ignoran los 3 primeros golpes; 30% del daño es HP. Visión -50%.',
                shop_item_stone_infusion_name: 'Infusión Pétrea',
                shop_item_stone_infusion_desc: '5s: +3 armadura. Sin curación; 30% del daño recibido se reembolsa. Más lento.',
                shop_item_heal_potion_name: 'Poción de Curación',
                shop_item_heal_potion_desc: 'Cura instantánea del 25% de HP. (CD 12s)',
                shop_item_sharp_crystal_name: 'Cristal Afilado',
                shop_item_sharp_crystal_desc: '+3 DMG, -3% velocidad',
                shop_item_light_core_name: 'Núcleo Liviano',
                shop_item_light_core_desc: '+6% velocidad, -1 armadura',
                shop_item_iron_husk_name: 'Cáscara de Hierro',
                shop_item_iron_husk_desc: '+2 armadura, -4% velocidad',
                shop_item_vital_shard_name: 'Fragmento Vital',
                shop_item_vital_shard_desc: '+1 corazón máx.; coste +8 tras cada compra',
                shop_item_cinder_ring_name: 'Anillo de Ascuas',
                shop_item_cinder_ring_desc: 'Enemigos cercanos arden 0.5 DPS (no acumula).',
                shop_item_burning_claw_name: 'Garra Ardiente',
                shop_item_burning_claw_desc: '+10% crítico; los críticos hacen 30% menos daño.',
                shop_item_molten_core_name: 'Núcleo Fundido',
                shop_item_molten_core_desc: 'Duración de quemadura +0.5s; tu regen -1.',
                shop_item_frozen_veil_name: 'Velo Helado',
                shop_item_frozen_veil_desc: 'Aura de 10% de ralentización; dentro tú también -5% vel.',
                shop_item_abyss_pearl_name: 'Perla del Abismo',
                shop_item_abyss_pearl_desc: '+1 armadura, +5% slow; -5% velocidad de ataque.',
                shop_item_tidecaller_name: 'Llamamar',
                shop_item_tidecaller_desc: '+5 materiales al final de cada oleada; -2s al inicio.',
                shop_item_tempest_feather_name: 'Pluma de Tempestad',
                shop_item_tempest_feather_desc: '+15% velocidad; -10% daño.',
                shop_item_storm_eye_name: 'Ojo de Tormenta',
                shop_item_storm_eye_desc: '+10% vel. de ataque; alcance proyectil -10%.',
                shop_item_cyclone_fragment_name: 'Fragmento de Ciclón',
                shop_item_cyclone_fragment_desc: 'Si tienes dash: CD -20%; breve -1 armadura tras dash.',
                shop_item_amber_coin_name: 'Moneda Ámbar',
                shop_item_amber_coin_desc: '+5 materiales al inicio de oleada; HP de enemigos +5%.',
                shop_item_lucky_charm_name: 'Amuleto de Suerte',
                shop_item_lucky_charm_desc: '+10% botín; -5% daño.',
                shop_item_time_relic_name: 'Reliquia del Tiempo',
                shop_item_time_relic_desc: 'Duración de oleada -5s; +10 materiales en recompensas.'
            });
            addLocale('pt-br', {
                weaponStatsTitle: 'Estatísticas da Arma', weaponBase: 'ARMA BASE', weaponSelected: 'ARMA SELECIONADA', wepCurrent: 'Atual', wepDamage: 'Dano', wepFireRate: 'Taxa de Fogo', wepRange: 'Alcance', wepPeriod: 'Período', wepRadius: 'Raio', wepChain: 'Cadeia', wepShrapnel: 'Estilhaços',
                startSubtitle: 'Colete energia no universo neon, evolua e derrote seus rivais!',
                colorLabel: 'Escolher cor:', shapeLabel: 'Escolher forma:', startBtn: 'INICIAR JOGO',
                rotateTitle: 'Gire o dispositivo', rotateDesc: 'Melhor em paisagem (16:9).', subtitle: 'Colete energia no universo neon, evolua e derrote seus rivais!',
                chooseColor: 'Escolher cor:', chooseShape: 'Escolher forma:', startGame: 'INICIAR JOGO', settings: 'CONFIGURAÇÕES', shop: 'LOJA', characters: 'PERSONAGENS', builders: 'BUILDS',
                // Settings tabs and controls (new)
                appearance: 'Aparência',
                credits: 'Créditos',
                creditsText: 'Obrigado à equipe de desenvolvimento do Elementist e aos colaboradores.',
                fullscreen: 'Tela cheia',
                fpsCap: 'Limite de FPS',
                fpsInfo: 'Info de FPS',
                unlimited: 'Ilimitado',
                howTo: 'COMO JOGAR', howToTitle: 'Como jogar', controls_pc: 'Controles de PC', close: 'FECHAR',
                runStatsTitle: 'Estatísticas', bestWaveLabel: 'Melhor onda', bestScoreLabel: 'Melhor pontuação', resetStats: 'Redefinir estatísticas',
                arrowKeys: 'Setas', controls_move: 'Mover', controls_ability: 'Usar habilidade', controls_dash: 'Desviar', controls_pause: 'Pausar / Menu',
                tipsTitle: 'Dicas', tip1: 'Colete energia dos inimigos para ficar mais forte.', tip2: 'Após a Onda 3, escolha uma arma; a loja abrirá.', tip3: 'Gaste materiais na loja para melhorar.',
                settingsTitle: 'Configurações', sound: 'Som', music: 'Música', on: 'Ligado', off: 'Desligado', language: 'Idioma', fovDesktop: 'FOV: ', mouseSensitivity: 'Sensibilidade do mouse: ', sensitivity: 'Sensibilidade', volume: 'Volume: ',
                back: 'Voltar',
                charElementTitle: 'Selecionar Personagem & Elemento', elementOverlayTitle: 'Escolha seu Elemento', elementOverlayDesc: 'Define a habilidade (Espaço). Recarga: 10s', elementOverlayDescMobile: 'Define a habilidade (Skill). Recarga: 10s',
                elFire: '🔥 Fogo', elWater: '💧 Água', elAir: '🌪️ Ar',
                score: 'Pontuação:', materials: 'Materiais:', element: 'Elemento:', lives: 'Vidas:',
                buildersTitle: 'Builds', buildersSubtitle: 'Builds recomendados e notas curtas para os 3 elementos.',
                charactersTitle: 'Personagens', charactersSubtitle: 'Visuais e descrições de todos os arquétipos inimigos.',
                scoreLabel: 'Pontuação:', materialsTopLabel: 'Materiais:', elementTopLabel: 'Elemento:',
                gameOverTitle: 'VOCÊ MORREU', restartBtn: 'TENTAR NOVAMENTE', backToMenuBtn: 'VOLTAR AO MENU', inGameMenuTitle: 'MENU DO JOGO',
                resumeBtn: 'RETOMAR',
                infoFireTitle: '🔥 Elemento Fogo', infoFire1: 'Blast Push: Pushes nearby enemies', infoFire2: 'Hunting Bonus: Easier to catch small foes', infoFire3: 'Drawback: Short range, weak vs big foes',
                infoWaterTitle: '💧 Elemento Água', infoWater1: 'Slow Field: Reduces enemy speed by 70%', infoWater2: 'Area Control: Large AoE', infoWater3: 'Drawback: No direct damage',
                infoAirTitle: '🌪️ Elemento Ar', infoAir1: 'Speed Surge: 3x speed and 2x maneuver', infoAir2: 'Positioning: Quick escape and chase', infoAir3: 'Drawback: No enemy impact',
                abilityIconTitle: 'Habilidade (Espaço)', abilityIconTitleShift: 'Habilidade (Shift)',
                shopTitle: 'Loja - Intervalo', materialsLabel: 'Materiais:', xpLabel: 'XP:', rerollBtn: 'Rerrolar', lockBtn: 'Travar', unlockBtn: 'Destravar', startWaveBtn: 'Próxima Onda', costLabel: 'Custo', wavePrefix: 'Onda',
                tabOffers: 'Ofertas', tabItems: 'Itens', tabUpgrades: 'Aprimoramentos', tabSpecial: 'Especial',
                // Characters (PT-BR)
                enemy_rush_circle_title: 'Rush (Círculo)',
                enemy_rush_circle_desc: 'Melee básico; não atira. Persegue com pressão constante.',
                enemy_rush_triangle_title: 'Rush (Triângulo)',
                enemy_rush_triangle_desc: 'Curvas fechadas; arranques curtos para alcançar.',
                enemy_shooter_title: 'Atirador',
                enemy_shooter_desc: 'Médio-longo alcance, tiros periódicos; ritmo estável.',
                enemy_sniper_title: 'Franco-atirador',
                enemy_sniper_desc: 'Espera de longe; mira e dispara com atraso e alto dano.',
                enemy_charger_title: 'Investidor',
                enemy_charger_desc: 'Após breve indicação, avança em linha reta.',
                enemy_brute_title: 'Brutamontes',
                enemy_brute_desc: 'Alto HP/massa; empurrão forte no contato, lento porém incansável.',
                enemy_assassin_title: 'Assassino',
                enemy_assassin_desc: 'Alterna visibilidade; embosca com aproximação súbita.',
                enemy_juggernaut_title: 'Juggernaut',
                enemy_juggernaut_desc: 'Escudo giratório frontal bloqueia balas; tanque lento.',
                enemy_parasite_title: 'Parasita',
                enemy_parasite_desc: 'Enfraquece no toque; desgasta de perto.',
                enemy_mutant_title: 'Mutante',
                enemy_mutant_desc: 'Muda forma/comportamento com as ondas; imprevisível.',
                // Builds (PT-BR)
                build_fire_crit_title: 'Crítico Ígneo',
                build_fire_crit_desc: 'Alto dano, explosões em área',
                build_fire_crit_i1: 'Dança das Chamas',
                build_fire_crit_i2: 'Orvalho Carmesim',
                build_fire_crit_i3: 'Anel de Fogo',
                build_fire_crit_i4: 'Chama Crítica',
                build_fire_layers_title: 'Camadas de Queimadura',
                build_fire_layers_desc: 'DPS contínuo com camadas de queimadura',
                build_fire_layers_i1: 'Queimadura Persistente',
                build_fire_layers_i2: 'Trilho de Cinzas',
                build_fire_layers_i3: 'Onda de Calor',
                build_fire_layers_i4: 'Coração de Carvão',
                build_fire_explosive_title: 'Explosivo',
                build_fire_explosive_desc: 'Mini-explosões após contato',
                build_fire_explosive_i1: 'Carga de Faísca',
                build_fire_explosive_i2: 'Chama Volátil',
                build_fire_explosive_i3: 'Pressurizado Core',
                build_fire_explosive_i4: 'Vulcão',
                build_water_waves_title: 'Quebra-ondas',
                build_water_waves_desc: 'Controle de área e lentidão',
                build_water_waves_i1: 'Anel de Maré',
                build_water_waves_i2: 'Corrente Fria',
                build_water_waves_i3: 'Névoa Densa',
                build_water_waves_i4: 'Pressão Profunda',
                build_water_flow_title: 'Fluxo Mestre',
                build_water_flow_desc: 'Mobilidade + sustentação',
                build_water_flow_i1: 'Gotas Revitalizantes',
                build_water_flow_i2: 'Véu de Garoa',
                build_water_flow_i3: 'Armadura Fluida',
                build_water_flow_i4: 'Ritmo do Rio',
                build_water_ice_title: 'Congelador de Gelo',
                build_water_ice_desc: 'Velocidade menor, alto controle',
                build_water_ice_i1: 'Ponto de Congelamento',
                build_water_ice_i2: 'Escama de Gelo',
                build_water_ice_i3: 'Toque de Geada',
                build_water_ice_i4: 'Silêncio Polar',
                build_air_crit_title: 'Tempestade Crítica',
                build_air_crit_desc: 'Crítico alto, jogo rápido',
                build_air_crit_i1: 'Fúria da Tempestade',
                build_air_crit_i2: 'Pressão Ascendente',
                build_air_crit_i3: 'Trovão',
                build_air_crit_i4: 'Brisa Infinita',
                build_air_dodger_title: 'Evasivo',
                build_air_dodger_desc: 'Desvio e sobrevivência',
                build_air_dodger_i1: 'Passos Leves',
                build_air_dodger_i2: 'Armadura de Tempestade',
                build_air_dodger_i3: 'Escudo de Vento',
                build_air_dodger_i4: 'Feitiço de Leveza',
                build_air_assassin_title: 'Velocidade Assassina',
                build_air_assassin_desc: 'Velocidade e ataques súbitos',
                build_air_assassin_i1: 'Botas do Vento',
                build_air_assassin_i2: 'Corrente de Jato',
                build_air_assassin_i3: 'Gatilho de Pena',
                build_air_assassin_i4: 'Investida da Tempestade',
                // Shop items (PT-BR)
                shop_item_blood_draught_name: 'Draught de Sangue',
                shop_item_blood_draught_desc: '4s: 40% do dano retorna como HP. Depois -5% de HP Máx.',
                shop_item_flame_syrup_name: 'Xarope de Chamas',
                shop_item_flame_syrup_desc: '3s: Ataques aplicam queimadura; 20% do dano cura. -20% velocidade.',
                shop_item_mist_tonic_name: 'Tônico de Névoa',
                shop_item_mist_tonic_desc: '3s: 3 primeiros golpes ignorados; 30% do dano vira HP. Visão -50%.',
                shop_item_stone_infusion_name: 'Infusão de Pedra',
                shop_item_stone_infusion_desc: '5s: +3 Armadura. Sem cura; apenas 30% do dano reembolsado. Mais lento.',
                shop_item_heal_potion_name: 'Poção de Cura',
                shop_item_heal_potion_desc: 'Sofort +25% HP. (CD 12s)',
                shop_item_sharp_crystal_name: 'Cristal Afiado',
                shop_item_sharp_crystal_desc: '+3 Dano, -3% velocidade',
                shop_item_light_core_name: 'Núcleo Leve',
                shop_item_light_core_desc: '+6% velocidade, -1 Armadura',
                shop_item_iron_husk_name: 'Carapaça de Ferro',
                shop_item_iron_husk_desc: '+2 Armadura, -4% velocidade',
                shop_item_vital_shard_name: 'Fragmento Vital',
                shop_item_vital_shard_desc: '+1 Coração Máx.; custo +8 após cada compra',
                shop_item_cinder_ring_name: 'Anel de Cinzas',
                shop_item_cinder_ring_desc: 'Inimigos próximos queimam por 0,5 DPS (não acumula).',
                shop_item_burning_claw_name: 'Garra Flamejante',
                shop_item_burning_claw_desc: '+10% crítico; críticos causam 30% menos dano.',
                shop_item_molten_core_name: 'Núcleo Derretido',
                shop_item_molten_core_desc: 'Duração da queimadura +0,5s; sua regen -1.',
                shop_item_frozen_veil_name: 'Véu Gelado',
                shop_item_frozen_veil_desc: 'Aura de 10% de lentidão; dentro dela você também -5%.',
                shop_item_abyss_pearl_name: 'Pérola do Abismo',
                shop_item_abyss_pearl_desc: '+1 Armadura, +5% slow; -5% velocidade de ataque.',
                shop_item_tidecaller_name: 'Chamado da Maré',
                shop_item_tidecaller_desc: '+5 materiais no fim de cada onda; 2s mais lento no início.',
                shop_item_tempest_feather_name: 'Pena da Tempestade',
                shop_item_tempest_feather_desc: '+15% velocidade; -10% dano.',
                shop_item_storm_eye_name: 'Olho da Tempestade',
                shop_item_storm_eye_desc: '+10% velocidade de ataque; alcance -10%.',
                shop_item_cyclone_fragment_name: 'Fragmento de Ciclone',
                shop_item_cyclone_fragment_desc: 'Se tiver dash: CD -20%; breve -1 Armadura após dash.',
                shop_item_amber_coin_name: 'Moeda Âmbar',
                shop_item_amber_coin_desc: '+5 materiais no início da onda; HP inimigo +5%.',
                shop_item_lucky_charm_name: 'Amuleto da Sorte',
                shop_item_lucky_charm_desc: '+10% drop; -5% dano.',
                shop_item_time_relic_name: 'Relíquia do Tempo',
                shop_item_time_relic_desc: 'Duração da onda -5s; +10 materiais na recompensa.'
            });
            addLocale('ja', {
                weaponStatsTitle: '武器ステータス', weaponBase: 'ベース武器', weaponSelected: '選択した武器', wepCurrent: '現在', wepDamage: 'ダメージ', wepFireRate: '発射速度', wepRange: '射程', wepPeriod: '周期', wepRadius: '半径', wepChain: 'チェイン', wepShrapnel: '破片',
                startSubtitle: 'ネオン宇宙でエネルギーを集め、成長し、ライバルを倒せ！', colorLabel: '色を選択:', shapeLabel: '形を選択:', startBtn: 'ゲーム開始',
                rotateTitle: '端末を横向きにしてください', rotateDesc: '横向き（16:9）推奨。', subtitle: 'ネオン宇宙でエネルギーを集め、成長し、ライバルを倒せ！',
                chooseColor: '色を選択:', chooseShape: '形を選択:', startGame: 'ゲーム開始', settings: '設定', characters: 'キャラクター', builders: 'ビルド',
                // Settings tabs and controls (new)
                appearance: '外観',
                credits: 'クレジット',
                creditsText: 'Elementist の開発チームと貢献者の皆様に感謝します。',
                fullscreen: 'フルスクリーン',
                fpsCap: 'FPS上限',
                fpsInfo: 'FPS情報',
                unlimited: '無制限',
                howTo: '遊び方', howToTitle: '遊び方', controls_pc: 'PC操作', close: '閉じる',
                runStatsTitle: 'ラン統計', bestWaveLabel: '最高ウェーブ', bestScoreLabel: '最高スコア', resetStats: '統計をリセット',
                arrowKeys: '矢印キー', controls_move: '移動', controls_ability: 'アビリティ使用', controls_dash: 'ダッシュ/回避', controls_pause: '一時停止/メニュー',
                tipsTitle: 'ヒント', tip1: '敵からエネルギーを集めて強くなろう。', tip2: 'ウェーブ3後に武器選択、その後ショップが開く。', tip3: 'ショップで素材を使って強化。',
                settingsTitle: '設定', sound: 'サウンド', music: '音楽', on: 'オン', off: 'オフ', language: '言語', fovDesktop: '視野角: ', mouseSensitivity: 'マウス感度: ', sensitivity: '感度', volume: '音量: ',
                charElementTitle: 'キャラと属性を選択', elementOverlayTitle: '属性を選択', elementOverlayDesc: 'スペースの必殺技を決定。CD:10s', elementOverlayDescMobile: 'スキルボタンの必殺技。CD:10s',
                elFire: '🔥 炎', elWater: '💧 水', elAir: '🌪️ 風',
                score: 'スコア:', materials: '素材:', element: '属性:', lives: 'ライフ:',
                buildersTitle: 'ビルド', buildersSubtitle: '3属性向けの推奨ビルドと短い説明。',
                charactersTitle: 'キャラクター', charactersSubtitle: '敵アーキタイプのビジュアルと説明。',
                scoreLabel: 'スコア:', materialsTopLabel: '素材:', elementTopLabel: '属性:',
                gameOverTitle: 'ゲームオーバー', restartBtn: 'リトライ', backToMenuBtn: 'メニューへ', inGameMenuTitle: 'ゲームメニュー',
                resumeBtn: '再開',
                infoFireTitle: '🔥 炎属性', infoFire1: '爆発的な押し', infoFire2: '狩猟ボーナス', infoFire3: '欠点: 短い射程、弱い大きな敵',
                infoWaterTitle: '💧 水属性', infoWater1: '70%のスローフィールド', infoWater2: 'エリアコントロール', infoWater3: '欠点: 直接ダメージなし',
                infoAirTitle: '🌪️ 風属性', infoAir1: 'スピードサージ', infoAir2: 'ポジショニング', infoAir3: '欠点: 敵への影響なし',
                abilityIconTitle: '必殺技 (スペース)', abilityIconTitleShift: '必殺技 (Shift)',
                shopTitle: 'ショップ - インターバル', materialsLabel: '素材:', xpLabel: 'XP:', rerollBtn: 'リロール', lockBtn: 'ロック', unlockBtn: '解除', startWaveBtn: '次のウェーブ', costLabel: 'コスト', wavePrefix: 'ウェーブ',
                tabOffers: 'オファー', tabItems: 'アイテム', tabUpgrades: '強化', tabSpecial: 'スペシャル',
                // Characters (JA)
                enemy_rush_circle_title: 'ラッシュ（円）',
                enemy_rush_circle_desc: '基本近接。射撃なし。持続的に追跡して圧をかける。',
                enemy_rush_triangle_title: 'ラッシュ（三角）',
                enemy_rush_triangle_desc: '鋭い旋回。短い加速で距離を詰める。',
                enemy_shooter_title: 'シューター',
                enemy_shooter_desc: '中〜遠距離で定期的に射撃。一定リズム。',
                enemy_sniper_title: 'スナイパー',
                enemy_sniper_desc: '遠方で待機。狙って遅延の大ダメージ射撃。',
                enemy_charger_title: 'チャージャー',
                enemy_charger_desc: '短い予備動作の後、直線突進。',
                enemy_brute_title: 'ブルート',
                enemy_brute_desc: '高HP/質量。接触で強い押し出し。遅いが執拗。',
                enemy_assassin_title: 'アサシン',
                enemy_assassin_desc: '可視/不可視を切替。伏撃接近。',
                enemy_juggernaut_title: 'ジャガーノート',
                enemy_juggernaut_desc: '前面の回転シールドで弾を防ぐ。重く遅い。',
                enemy_parasite_title: 'パラサイト',
                enemy_parasite_desc: '接触で弱体化。密着して削る。',
                enemy_mutant_title: 'ミュータント',
                enemy_mutant_desc: '波の進行で形態/行動が変化。予測困難。',
                // Builds (JA)
                build_fire_crit_title: 'クリティカル着火',
                build_fire_crit_desc: '高ダメージ・範囲爆発',
                build_fire_crit_i1: 'フレイムダンス',
                build_fire_crit_i2: 'クリムゾン・デュー',
                build_fire_crit_i3: 'ファイアリング',
                build_fire_crit_i4: 'クリティカルフレイム',
                build_fire_layers_title: '重ね燃焼',
                build_fire_layers_desc: '燃焼スタックで継続DPS',
                build_fire_layers_i1: '残留灼熱',
                build_fire_layers_i2: 'シンダートレイル',
                build_fire_layers_i3: 'ヒートウェーブ',
                build_fire_layers_i4: 'コールハート',
                build_fire_explosive_title: '爆発',
                build_fire_explosive_desc: '接触後の小型爆発',
                build_fire_explosive_i1: 'スパークチャージ',
                build_fire_explosive_i2: 'ボラタイルフレイム',
                build_fire_explosive_i3: '加圧コア',
                build_fire_explosive_i4: 'ボルケーノ',
                build_water_waves_title: 'ウェーブブレイカー',
                build_water_waves_desc: '範囲制御とスロー',
                build_water_waves_i1: 'タイダルリング',
                build_water_waves_i2: 'コールドカレント',
                build_water_waves_i3: '濃霧',
                build_water_waves_i4: '深圧',
                build_water_flow_title: 'フローマスター',
                build_water_flow_desc: '機動力＋持続',
                build_water_flow_i1: 'リバイタルドロップ',
                build_water_flow_i2: 'ドリズリングベール',
                build_water_flow_i3: 'フルイドアーマー',
                build_water_flow_i4: 'リバーリズム',
                build_water_ice_title: 'アイスフリーザー',
                build_water_ice_desc: '低速・高制御',
                build_water_ice_i1: '氷点',
                build_water_ice_i2: 'アイススケール',
                build_water_ice_i3: 'フロストタッチ',
                build_water_ice_i4: 'ポーラーサイレンス',
                build_air_crit_title: 'クリットストーム',
                build_air_crit_desc: '高クリ・高速プレイ',
                build_air_crit_i1: 'ストームフューリー',
                build_air_crit_i2: 'ライジングプレッシャー',
                build_air_crit_i3: 'サンダークラップ',
                build_air_crit_i4: 'エンドレスブリーズ',
                build_air_dodger_title: 'ドッジャー',
                build_air_dodger_desc: '回避と生存',
                build_air_dodger_i1: 'ライトステップ',
                build_air_dodger_i2: 'ストームアーマー',
                build_air_dodger_i3: 'ウィンドシールド',
                build_air_dodger_i4: '軽さの魔法',
                build_air_assassin_title: 'アサシンスピード',
                build_air_assassin_desc: '移動速度と奇襲',
                build_air_assassin_i1: 'ウィンドブーツ',
                build_air_assassin_i2: 'ジェットストリーム',
                build_air_assassin_i3: 'フェザー・トリガー',
                build_air_assassin_i4: 'ストームダッシュ',
                // Shop items (JA)
                shop_item_blood_draught_name: 'ブラッドドラフト',
                shop_item_blood_draught_desc: '4秒: 与ダメの40%をHP化。終了後 最大HP-5%。',
                shop_item_flame_syrup_name: 'フレイムシロップ',
                shop_item_flame_syrup_desc: '3秒: 攻撃に燃焼付与。燃焼の20%が回復。移動-20%。',
                shop_item_mist_tonic_name: 'ミストトニック',
                shop_item_mist_tonic_desc: '3秒: 最初の3ヒット無効化。被ダメの30%がHP。視界-50%。',
                shop_item_stone_infusion_name: 'ストーンインフュージョン',
                shop_item_stone_infusion_desc: '5秒: +3アーマー。回復無し; 被ダメ30%返還。移動低下。',
                shop_item_heal_potion_name: 'ヒールポーション',
                shop_item_heal_potion_desc: '即時HP25%回復。（CD 12s）',
                shop_item_sharp_crystal_name: '研磨クリスタル',
                shop_item_sharp_crystal_desc: '+3ダメージ、移動-3%',
                shop_item_light_core_name: '軽量コア',
                shop_item_light_core_desc: '移動+6%、アーマー-1',
                shop_item_iron_husk_name: 'アイアンハスク',
                shop_item_iron_husk_desc: '+2アーマー、移動-4%',
                shop_item_vital_shard_name: 'バイタルシャード',
                shop_item_vital_shard_desc: '+1最大ハート；購入ごとにコスト+8',
                shop_item_cinder_ring_name: 'シンダーリング',
                shop_item_cinder_ring_desc: '近くの敵に0.5DPSの燃焼(重複なし)。',
                shop_item_burning_claw_name: 'バーニングクロー',
                shop_item_burning_claw_desc: '+10%クリティカル；クリティカルダメージ30%低下。',
                shop_item_molten_core_name: 'モルテンコア',
                shop_item_molten_core_desc: '燃焼時間+0.5秒；自HP再生-1。',
                shop_item_frozen_veil_name: 'フローズンベール',
                shop_item_frozen_veil_desc: '10%減速オーラ；範囲内で自身も-5%。',
                shop_item_abyss_pearl_name: 'アビスパール',
                shop_item_abyss_pearl_desc: '+1アーマー、+5%スロー；AS-5%。',
                shop_item_tidecaller_name: 'タイドコーラー',
                shop_item_tidecaller_desc: '+5素材各ウェーブ終了時；開始時2秒遅く。',
                shop_item_tempest_feather_name: 'テンペストフェザー',
                shop_item_tempest_feather_desc: '+15%移動；-10%ダメージ。',
                shop_item_storm_eye_name: 'ストームアイ',
                shop_item_storm_eye_desc: '+10%攻撃速度；射程-10%。',
                shop_item_cyclone_fragment_name: 'サイクロンフラグメント',
                shop_item_cyclone_fragment_desc: 'ダッシュ所持でCD-20%；後に一時的にアーマー-1。',
                shop_item_amber_coin_name: 'アンバーコイン',
                shop_item_amber_coin_desc: '+5素材各ウェーブ開始時；敵HP+5%。',
                shop_item_lucky_charm_name: 'ラッキーチャーム',
                shop_item_lucky_charm_desc: '+10%ドロップ；-5%ダメージ。',
                shop_item_time_relic_name: 'タイムレリック',
                shop_item_time_relic_desc: 'ウェーブ-5秒；報酬+10素材。'
            });
            addLocale('hi', {
                weaponStatsTitle: 'हथियार आँकड़े', weaponBase: 'बेस हथियार', weaponSelected: 'चयनित हथियार', wepCurrent: 'वर्तमान', wepDamage: 'डैमेज', wepFireRate: 'फायर रेट', wepRange: 'रेंज', wepPeriod: 'पीरियड', wepRadius: 'त्रिज्या', wepChain: 'चेन', wepShrapnel: 'श्रैपनेल',
                startSubtitle: 'नियोन ब्रह्मांड में ऊर्जा इकट्ठा करें, बढ़ें और प्रतिद्वंद्वियों को हराएँ!', colorLabel: 'रंग चुनें:', shapeLabel: 'आकृति चुनें:', startBtn: 'गेम शुरू करें',
                rotateTitle: 'कृपया डिवाइस घुमाएँ', rotateDesc: 'खेल क्षैतिज (16:9) में बेहतर है।', subtitle: 'नियोन ब्रह्मांड में ऊर्जा इकट्ठा करें, बढ़ें और प्रतिद्वंद्वियों को हराएँ!',
                chooseColor: 'रंग चुनें:', chooseShape: 'आकृति चुनें:', startGame: 'गेम शुरू करें', settings: 'सेटिंग्स', characters: 'पात्र', builders: 'बिल्ड्स',
                // Settings tabs and controls (new)
                appearance: 'रूप',
                credits: 'श्रेय',
                creditsText: 'Elementist विकास टीम और योगदानकर्ताओं का धन्यवाद।',
                fullscreen: 'पूर्ण स्क्रीन',
                fpsCap: 'FPS सीमा',
                fpsInfo: 'FPS जानकारी',
                unlimited: 'असीमित',
                howTo: 'कैसे खेलें', howToTitle: 'कैसे खेलें', controls_pc: 'पीसी कंट्रोल्स', close: 'बंद करें',
                runStatsTitle: 'रन आँकड़े', bestWaveLabel: 'सर्वश्रेष्ठ वेव', bestScoreLabel: 'सर्वश्रेष्ठ स्कोर', resetStats: 'आँकड़े रीसेट करें',
                arrowKeys: 'ऐरो कीज', controls_move: 'चलना', controls_ability: 'क्षमता का उपयोग', controls_dash: 'डैश/बचाव', controls_pause: 'रोकें/मेनू',
                tipsTitle: 'सुझाव', tip1: 'दुश्मनों से ऊर्जा एकत्र करें।', tip2: 'वेव 3 के बाद हथियार चुनें और दुकान खुलेगी।', tip3: 'उन्नयन के लिए सामग्री खर्च करें।',
                settingsTitle: 'सेटिंग्स', sound: 'ध्वनि', music: 'संगीत', on: 'चालू', off: 'बंद', language: 'भाषा', fovDesktop: 'FOV: ', mouseSensitivity: 'माउस सेंसिटिविटी: ', sensitivity: 'संवेदनशीलता', volume: 'वॉल्यूम: ',
                charElementTitle: 'पात्र और तत्व चुनें', elementOverlayTitle: 'तत्व चुनें', elementOverlayDesc: 'स्पेस से विशेष क्षमता। कूलडाउन: 10s', elementOverlayDescMobile: 'स्किल बटन से विशेष क्षमता। कूलडाउन: 10s',
                elFire: '🔥 आग', elWater: '💧 पानी', elAir: '🌪️ वायु',
                score: 'स्कोर:', materials: 'सामग्री:', element: 'तत्व:', lives: 'जीवन:',
                buildersTitle: 'बिल्ड्स', buildersSubtitle: '3 तत्वों के लिए अनुशंसित बिल्ड्स।',
                charactersTitle: 'पात्र', charactersSubtitle: 'सभी दुश्मन आर्केटाइप का विवरण।',
                scoreLabel: 'स्कोर:', materialsTopLabel: 'सामग्री:', elementTopLabel: 'तत्व:',
                gameOverTitle: 'आप हार गए', restartBtn: 'फिर से', backToMenuBtn: 'मेनू पर वापस', inGameMenuTitle: 'गेम मेनू',
                resumeBtn: 'जारी रखें',
                abilityIconTitle: 'क्षमता (स्पेस)', abilityIconTitleShift: 'क्षमता (Shift)',
                shopTitle: 'दुकान - अंतराल', materialsLabel: 'सामग्री:', xpLabel: 'XP:', rerollBtn: 'रीरोल', lockBtn: 'लॉक', unlockBtn: 'अनलॉक', startWaveBtn: 'अगली वेव', costLabel: 'कीमत', wavePrefix: 'वेव',
                tabOffers: 'ऑफ़र', tabItems: 'आइटम', tabUpgrades: 'अपग्रेड', tabSpecial: 'विशेष',
                // Characters (HI)
                enemy_rush_circle_title: 'रश (वृत्त)',
                enemy_rush_circle_desc: 'बेसिक नज़दीकी; गोली नहीं चलाता। सीधे पीछा कर दबाव बनाए रखता है।',
                enemy_rush_triangle_title: 'रश (त्रिभुज)',
                enemy_rush_triangle_desc: 'तेज़ मोड़; छोटे स्प्रिंट से दूरी घटाता है।',
                enemy_shooter_title: 'शूटर',
                enemy_shooter_desc: 'मध्यम-दूर दूरी पर आवधिक फायर; स्थिर लय।',
                enemy_sniper_title: 'स्नाइपर',
                enemy_sniper_desc: 'बहुत दूर प्रतीक्षा; निशाना लगाकर विलंबित उच्च-डैमेज शॉट।',
                enemy_charger_title: 'चार्जर',
                enemy_charger_desc: 'छोटे संकेत के बाद सीधी रेखा में दौड़ता है।',
                enemy_brute_title: 'ब्रूट',
                enemy_brute_desc: 'उच्च HP/भार; टकराने पर ज़ोरदार धक्का, धीमा पर अडिग।',
                enemy_assassin_title: 'असैसिन',
                enemy_assassin_desc: 'दिखाई/ओझल बदलता; घात लगाकर अचानक आता है।',
                enemy_juggernaut_title: 'जगरनॉट',
                enemy_juggernaut_desc: 'सामने घूमती ढाल गोलियाँ रोकती है; धीमा टैंक।',
                enemy_parasite_title: 'पैरासाइट',
                enemy_parasite_desc: 'स्पर्श पर कमजोर करता; पास रहकर थकाता है।',
                enemy_mutant_title: 'म्यूटेंट',
                enemy_mutant_desc: 'लहरों के साथ रूप/व्यवहार बदलता; अनुमान कठिन।',
                // Builds (HI)
                build_fire_crit_title: 'इग्नाइट क्रिट',
                build_fire_crit_desc: 'उच्च डैमेज, क्षेत्रीय धमाके',
                build_fire_crit_i1: 'ज्वाला नृत्य',
                build_fire_crit_i2: 'करिमसन ओस',
                build_fire_crit_i3: 'आग की अंगूठी',
                build_fire_crit_i4: 'क्रिटिकल फ्लेम',
                build_fire_layers_title: 'परतदार जलन',
                build_fire_layers_desc: 'बर्न परतों से सतत DPS',
                build_fire_layers_i1: 'स्थायी दाह',
                build_fire_layers_i2: 'चिंगारी पथ',
                build_fire_layers_i3: 'गर्मी की लहर',
                build_fire_layers_i4: 'कोयला हृदय',
                build_fire_explosive_title: 'विस्फोटक',
                build_fire_explosive_desc: 'स्पर्श के बाद छोटे विस्फोट',
                build_fire_explosive_i1: 'स्पार्क चार्ज',
                build_fire_explosive_i2: 'वोलेटाइल फ्लेम',
                build_fire_explosive_i3: 'दाबित कोर',
                build_fire_explosive_i4: 'ज्वालामुखी',
                build_water_waves_title: 'वेवब्रेकर',
                build_water_waves_desc: 'क्षेत्र नियंत्रण और धीमापन',
                build_water_waves_i1: 'ज्वार अंगूठी',
                build_water_waves_i2: 'शीत प्रवाह',
                build_water_waves_i3: 'घना कुहासा',
                build_water_waves_i4: 'गहरी दाब',
                build_water_flow_title: 'फ्लो मास्टर',
                build_water_flow_desc: 'गतिशीलता + टिकाऊपन',
                build_water_flow_i1: 'ऊर्जादायक बूँदें',
                build_water_flow_i2: 'रिमझिम घूंघट',
                build_water_flow_i3: 'द्रव कवच',
                build_water_flow_i4: 'नदी की लय',
                build_water_ice_title: 'आइस फ्रीज़र',
                build_water_ice_desc: 'कम गति, उच्च नियंत्रण',
                build_water_ice_i1: 'हिमांक',
                build_water_ice_i2: 'बर्फ शल्क',
                build_water_ice_i3: 'तुषार स्पर्श',
                build_water_ice_i4: 'ध्रुवीय निस्तब्धता',
                build_air_crit_title: 'क्रिट तूफ़ान',
                build_air_crit_desc: 'उच्च क्रिट, तेज़ खेल',
                build_air_crit_i1: 'तूफ़ान रोष',
                build_air_crit_i2: 'उदित दबाव',
                build_air_crit_i3: 'गर्जन',
                build_air_crit_i4: 'अनंत समीर',
                build_air_dodger_title: 'डॉजर',
                build_air_dodger_desc: 'बचाव और जीवित रहना',
                build_air_dodger_i1: 'हल्के कदम',
                build_air_dodger_i2: 'तूफ़ानी कवच',
                build_air_dodger_i3: 'पवन ढाल',
                build_air_dodger_i4: 'हल्केपन का मंत्र',
                build_air_assassin_title: 'असैसिन गति',
                build_air_assassin_desc: 'गति और अचानक वार',
                build_air_assassin_i1: 'विंड बूट्स',
                build_air_assassin_i2: 'जेट स्ट्रीम',
                build_air_assassin_i3: 'फेदर ट्रिगर',
                build_air_assassin_i4: 'स्टॉर्म डैश',
                // Shop items (HI)
                shop_item_blood_draught_name: 'ब्लड ड्राफ्ट',
                shop_item_blood_draught_desc: '4s: डैमेज का 40% HP बनता है। बाद में Max HP -5%.',
                shop_item_flame_syrup_name: 'फ्लेम सिरप',
                shop_item_flame_syrup_desc: '3s: हमले में बर्न; बर्न का 20% HP। गति -20%.',
                shop_item_mist_tonic_name: 'मिस्ट टॉनिक',
                shop_item_mist_tonic_desc: '3s: पहले 3 हिट नाकाम; 30% डैमेज HP। विज़न -50%.',
                shop_item_stone_infusion_name: 'स्टोन इन्फ्यूज़न',
                shop_item_stone_infusion_desc: '5s: +3 आर्मर। हील नहीं; लिए गए डैमेज का 30% वापसी। धीमा।',
                shop_item_heal_potion_name: 'हील पोशन',
                shop_item_heal_potion_desc: 'तुरंत 25% HP हील। (CD 12s)',
                shop_item_sharp_crystal_name: 'शार्प क्रिस्टल',
                shop_item_sharp_crystal_desc: '+3 डैमेज, -3% गति',
                shop_item_light_core_name: 'लाइटवेट कोर',
                shop_item_light_core_desc: '+6% गति, -1 आर्मर',
                shop_item_iron_husk_name: 'आयरन हस्क',
                shop_item_iron_husk_desc: '+2 आर्मर, -4% गति',
                shop_item_vital_shard_name: 'वाइटल शार्ड',
                shop_item_vital_shard_desc: '+1 अधिकतम हार्ट; हर खरीद पर लागत +8',
                shop_item_cinder_ring_name: 'सिंडर रिंग',
                shop_item_cinder_ring_desc: 'पास के दुश्मन 0.5 DPS से जलें (स्टैक नहीं)।',
                shop_item_burning_claw_name: 'बर्निंग क्लॉ',
                shop_item_burning_claw_desc: '+10% क्रिट; क्रिट डैमेज 30% कम।',
                shop_item_molten_core_name: 'मोल्टन कोर',
                shop_item_molten_core_desc: 'बर्न अवधि +0.5s; HP रीजेन -1.',
                shop_item_frozen_veil_name: 'फ्रोजन वेल',
                shop_item_frozen_veil_desc: '10% स्लो ऑरा; अंदर तुम भी -5%.',
                shop_item_abyss_pearl_name: 'एबिस पर्ल',
                shop_item_abyss_pearl_desc: '+1 आर्मर, +5% स्लो; -5% अटैक स्पीड.',
                shop_item_tidecaller_name: 'टाइडकॉलर',
                shop_item_tidecaller_desc: '+5 मटेरियल्स अंत में प्रत्येक वेव; शुरुआत में 2s धीमा।',
                shop_item_tempest_feather_name: 'टेम्पेस्ट फेदर',
                shop_item_tempest_feather_desc: '+15% गति; -10% डैमेज.',
                shop_item_storm_eye_name: 'स्टॉर्म आई',
                shop_item_storm_eye_desc: '+10% अटैक स्पीड; रेंज -10%.',
                shop_item_cyclone_fragment_name: 'साइक्लोन फ्रैगमेंट',
                shop_item_cyclone_fragment_desc: 'डैश होने पर CD -20%; डैश के बाद थोड़े समय -1 आर्मर।',
                shop_item_amber_coin_name: 'ऐंबर कॉइन',
                shop_item_amber_coin_desc: '+5 मटेरियल्स शुरुआत में प्रत्येक वेव; दुश्मन HP +5%.',
                shop_item_lucky_charm_name: 'लकी चार्म',
                shop_item_lucky_charm_desc: '+10% ड्रॉप; -5% डैमेज.',
                shop_item_time_relic_name: 'टाइम रелик',
                shop_item_time_relic_desc: 'वेव -5s; इनाम +10 मटेरियल्स.'
            });
            addLocale('zh-cn', {
                weaponStatsTitle: '武器属性', weaponBase: '基础武器', weaponSelected: '已选武器', wepCurrent: '当前', wepDamage: '伤害', wepFireRate: '射速', wepRange: '范围', wepPeriod: '周期', wepRadius: '半径', wepChain: '连锁', wepShrapnel: '弹片',
                startSubtitle: '在霓虹宇宙中收集能量、成长并击败对手！', colorLabel: '选择颜色：', shapeLabel: '选择形状：', startBtn: '开始游戏',
                rotateTitle: '请旋转设备', rotateDesc: '横屏（16:9）体验最佳。', subtitle: '在霓虹宇宙中收集能量、成长并击败对手！',
                chooseColor: '选择颜色：', chooseShape: '选择形状：', startGame: '开始游戏', settings: '设置', characters: '角色', builders: '构筑',
                // Settings tabs and controls (new)
                appearance: '外观',
                credits: '制作人员',
                creditsText: '感谢 Elementist 开发团队及所有贡献者。',
                fullscreen: '全屏',
                fpsCap: 'FPS上限',
                fpsInfo: 'FPS信息',
                unlimited: '无限制',
                howTo: '怎么玩', howToTitle: '怎么玩', controls_pc: 'PC 操作', close: '关闭',
                runStatsTitle: '统计', bestWaveLabel: '最佳波次', bestScoreLabel: '最高分', resetStats: '重置统计',
                arrowKeys: '方向键', controls_move: '移动', controls_ability: '使用技能', controls_dash: '冲刺/闪避', controls_pause: '暂停/菜单',
                tipsTitle: '提示', tip1: '从敌人身上收集能量来变强。', tip2: '第 3 波后选择武器，然后商店会开启。', tip3: '在商店消耗材料来升级。',
                settingsTitle: '设置', sound: '音效', music: '音乐', on: '开', off: '关', language: '语言', fovDesktop: '视野：', mouseSensitivity: '鼠标灵敏度：', sensitivity: '灵敏度', volume: '音量：',
                charElementTitle: '选择角色与元素', elementOverlayTitle: '选择元素', elementOverlayDesc: '空格释放的特殊技能。冷却：10 秒', elementOverlayDescMobile: '技能按钮释放。冷却：10 秒',
                elFire: '🔥 火', elWater: '💧 水', elAir: '🌪️ 风', score: '分数：', materials: '材料：', element: '元素：', lives: '生命：',
                buildersTitle: '构筑', buildersSubtitle: '三种元素的推荐构筑与简短说明。', charactersTitle: '角色', charactersSubtitle: '所有敌人原型的图示与说明。',
                score: '分数：', materialsTopLabel: '材料：', elementTopLabel: '元素：', gameOverTitle: '你已阵亡', restartBtn: '重试', backToMenuBtn: '返回菜单', inGameMenuTitle: '游戏菜单',
                resumeBtn: '继续',
                abilityIconTitle: '使用技能（空格）', abilityIconTitleShift: '使用技能（Shift）', shopTitle: '商店 - 间歇', materialsLabel: '材料：', xpLabel: 'XP：', rerollBtn: '重掷', lockBtn: '锁定', unlockBtn: '解锁', startWaveBtn: '下一波', costLabel: '花费', wavePrefix: '波次',
                tabOffers: '优惠', tabItems: '道具', tabUpgrades: '升级', tabSpecial: '特殊',
                // Characters (ZH-CN)
                enemy_rush_circle_title: '突进（圆形）',
                enemy_rush_circle_desc: '基础近战，不开火。持续逼近施压。',
                enemy_rush_triangle_title: '突进（三角）',
                enemy_rush_triangle_desc: '急转，短冲刺迅速接近。',
                enemy_shooter_title: '射手',
                enemy_shooter_desc: '中远距离周期性能量弹；节奏稳定。',
                enemy_sniper_title: '狙击手',
                enemy_sniper_desc: '远处等待；瞄准后延迟高伤害射击。',
                enemy_charger_title: '冲锋者',
                enemy_charger_desc: '短暂预兆后直线冲锋。',
                enemy_brute_title: '蛮力者',
                enemy_brute_desc: '高生命/质量；接触强推，缓慢但执拗。',
                enemy_assassin_title: '刺客',
                enemy_assassin_desc: '切换可见性；伏击与突然接近。',
                enemy_juggernaut_title: '重装者',
                enemy_juggernaut_desc: '前方旋转护盾挡子弹；缓慢厚重。',
                enemy_parasite_title: '寄生体',
                enemy_parasite_desc: '接触施加削弱；贴身消耗。',
                enemy_mutant_title: '变异体',
                enemy_mutant_desc: '随波次进展改变形态/行为；难以预测。',
                // Builds (ZH-CN)
                build_fire_crit_title: '点燃暴击',
                build_fire_crit_desc: '高伤害与范围爆发',
                build_fire_crit_i1: '火焰之舞',
                build_fire_crit_i2: '绯红露珠',
                build_fire_crit_i3: '火环',
                build_fire_crit_i4: '暴击火焰',
                build_fire_layers_title: '层层灼烧',
                build_fire_layers_desc: '以灼烧层数维持持续伤害',
                build_fire_layers_i1: '余烬灼烧',
                build_fire_layers_i2: '灰烬之径',
                build_fire_layers_i3: '热浪',
                build_fire_layers_i4: '煤炭之心',
                build_fire_explosive_title: '爆裂',
                build_fire_explosive_desc: '接触后产生小型爆炸',
                build_fire_explosive_i1: '火花充能',
                build_fire_explosive_i2: '不稳定之焰',
                build_fire_explosive_i3: '增压核心',
                build_fire_explosive_i4: '火山',
                build_water_waves_title: '破浪者',
                build_water_waves_desc: '范围控制与减速',
                build_water_waves_i1: '潮汐之环',
                build_water_waves_i2: '寒流',
                build_water_waves_i3: '浓雾',
                build_water_waves_i4: '深层压力',
                build_water_flow_title: '流动大师',
                build_water_flow_desc: '机动与续航',
                build_water_flow_i1: '复苏之滴',
                build_water_flow_i2: '细雨之幕',
                build_water_flow_i3: '流体护甲',
                build_water_flow_i4: '河之律动',
                build_water_ice_title: '冰冻者',
                build_water_ice_desc: '速度更低、控制更强',
                build_water_ice_i1: '冰点',
                build_water_ice_i2: '冰鳞',
                build_water_ice_i3: '霜之触',
                build_water_ice_i4: '极地寂静',
                build_air_crit_title: '暴击风暴',
                build_air_crit_desc: '高暴击，快节奏',
                build_air_crit_i1: '风暴之怒',
                build_air_crit_i2: '气压上升',
                build_air_crit_i3: '雷鸣',
                build_air_crit_i4: '无尽清风',
                build_air_dodger_title: '闪避者',
                build_air_dodger_desc: '闪避与生存',
                build_air_dodger_i1: '轻步',
                build_air_dodger_i2: '风暴护甲',
                build_air_dodger_i3: '风之盾',
                build_air_dodger_i4: '轻盈之术',
                build_air_assassin_title: '刺客疾速',
                build_air_assassin_desc: '移动速度与突袭',
                build_air_assassin_i1: '风之靴',
                build_air_assassin_i2: '喷射气流',
                build_air_assassin_i3: '羽触扳机',
                build_air_assassin_i4: '风暴突进',
                // Shop items (ZH-CN)
                shop_item_blood_draught_name: '血之饮剂',
                shop_item_blood_draught_desc: '4秒：造成伤害的40%转为生命。结束后 最大生命-5%。',
                shop_item_flame_syrup_name: '火焰糖浆',
                shop_item_flame_syrup_desc: '3秒：攻击附加灼烧；灼烧20%转为生命。移速-20%。',
                shop_item_mist_tonic_name: '迷雾补剂',
                shop_item_mist_tonic_desc: '3秒：前3次命中无效；30%伤害转为生命。视野-50%。',
                shop_item_stone_infusion_name: '岩石灌注',
                shop_item_stone_infusion_desc: '5秒：+3护甲。无治疗；仅返还30%所受伤害。更慢。',
                shop_item_heal_potion_name: '治疗药水',
                shop_item_heal_potion_desc: '立即恢复25%生命。（冷却12秒）',
                shop_item_sharp_crystal_name: '锋利水晶',
                shop_item_sharp_crystal_desc: '+3伤害，移速-3%',
                shop_item_light_core_name: '轻质核心',
                shop_item_light_core_desc: '移速+6%，护甲-1',
                shop_item_iron_husk_name: '钢铁外壳',
                shop_item_iron_husk_desc: '+2护甲，移速-4%',
                shop_item_vital_shard_name: '活力碎片',
                shop_item_vital_shard_desc: '+1最大心；每次购买后成本+8',
                shop_item_cinder_ring_name: '余烬之环',
                shop_item_cinder_ring_desc: '附近敌人每秒灼烧0.5（不叠加）。',
                shop_item_burning_claw_name: '燃烧之爪',
                shop_item_burning_claw_desc: '+10%暴击；暴击伤害-30%。',
                shop_item_molten_core_name: '熔核',
                shop_item_molten_core_desc: '灼烧持续+0.5秒；你的生命回复-1。',
                shop_item_frozen_veil_name: '冰霜面纱',
                shop_item_frozen_veil_desc: '10%减速光环；其中你也-5%移速。',
                shop_item_abyss_pearl_name: '深渊珍珠',
                shop_item_abyss_pearl_desc: '+1护甲，+5%减速；攻速-5%。',
                shop_item_tidecaller_name: '唤潮者',
                shop_item_tidecaller_desc: '每波结束+5材料；开局慢2秒。',
                shop_item_tempest_feather_name: '风暴之羽',
                shop_item_tempest_feather_desc: '移速+15%；伤害-10%。',
                shop_item_storm_eye_name: '风暴之眼',
                shop_item_storm_eye_desc: '攻速+10%；弹道距离-10%。',
                shop_item_cyclone_fragment_name: '气旋碎片',
                shop_item_cyclone_fragment_desc: '有冲刺则CD-20%；冲刺后短暂-1护甲。',
                shop_item_amber_coin_name: '琥珀硬币',
                shop_item_amber_coin_desc: '每波开始+5材料；敌人生命+5%。',
                shop_item_lucky_charm_name: '幸运符',
                shop_item_lucky_charm_desc: '+10%掉落；伤害-5%。',
                shop_item_time_relic_name: '时之遗物',
                shop_item_time_relic_desc: '波次时长-5秒；奖励+10材料。'
            });
            // Ensure common synonyms point to Simplified Chinese pack by default
            try {
                if (this.translations['zh-cn']) {
                    this.translations['zh'] = this.translations['zh-cn'];
                    this.translations['cn'] = this.translations['zh-cn'];
                }
            } catch(_) {}
        } catch(_) {}

        // Language aliases: map common codes to EN so dropdown selections beyond TR/EN still work
        try {
            const aliasToEn = ['de','es','fr','ru','ar','it','pt','pt-br','hi','zh','zh-cn','zh-tw','ja','ko','nl','pl','sv','cs','uk','ro','hu'];
            aliasToEn.forEach(code => { if (!this.translations[code]) this.translations[code] = this.translations.en; });
        } catch(_) {}

        // Kick off
        this.init();
    }

    // Spawn the Wave 5 mini-boss (lighter triangle boss)
    spawnBoss5() {
        try {
            const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
            let pos = new Vector2(z.x + z.width/2, z.y + z.height/2);
            if (this.player) {
                const toP = this.player.pos.minusNew(pos);
                if (toP.magnitude() < 220) {
                    // pick far corner
                    const corners = [
                        new Vector2(z.x + 40, z.y + 40),
                        new Vector2(z.x + z.width - 40, z.y + 40),
                        new Vector2(z.x + 40, z.y + z.height - 40),
                        new Vector2(z.x + z.width - 40, z.y + z.height - 40),
                    ];
                    pos = corners.sort((a,b)=>b.minusNew(this.player.pos).magnitude()-a.minusNew(this.player.pos).magnitude())[0];
                }
            }
            const boss = new AIBot('W5-MiniBoss', pos, 'air', '#ffc94d', 'triangle');
            boss.size = 20;
            const baseDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
            boss.maxHP = 700 + Math.floor(baseDmg * 45);
            boss.hp = boss.maxHP;
            boss.isBoss = true;
            boss.bossWave = 5;
            boss.isRanged = false;
            const origGetSpeed = boss.getSpeed.bind(boss);
            boss.getSpeed = () => Math.max(75, origGetSpeed() * 0.98);
            boss.bossPhase = 'spinner';
            boss.phaseTimer = 0;
            boss.phaseIndex = 0;
            boss.internal = {};
            this.aiBots.push(boss);
        } catch (e) {}
    }

    // Update Wave 5 mini-boss (simple spinner cycle, lower damage)
    updateBoss5(dt) {
        if (this.waveNumber !== 5) return;
        const boss = (this.aiBots || []).find(b => b.isBoss && b.bossWave === 5);
        if (!boss) return;
        boss.internal = boss.internal || {};
        boss.phaseTimer = (boss.phaseTimer || 0) + dt;
        const goIdleThen = (next, idleMs=1600) => {
            boss.bossPhase = 'idle';
            boss.internal.nextPhase = next;
            boss.internal.idleFor = idleMs;
            boss.phaseTimer = 0;
        };
        if (!boss.bossPhase) boss.bossPhase = 'spinner';
        switch (boss.bossPhase) {
            case 'idle': {
                if (boss.phaseTimer >= (boss.internal.idleFor || 1600)) {
                    const next = boss.internal.nextPhase || 'spinner';
                    boss.bossPhase = next;
                    boss.internal.nextPhase = undefined;
                    boss.phaseTimer = 0;
                    boss.internal.didCast = false;
                }
                break;
            }
            case 'spinner': {
                if (!boss.internal.didCast) {
                    boss.internal.spinnerGroupId = 'w5spin_' + Math.floor(Math.random()*1e9);
                    const src = boss.pos.clone();
                    const target = (this.player && this.player.pos) ? this.player.pos : src.plusNew(new Vector2(1,0));
                    const d = target.minusNew(src);
                    const m = Math.max(1e-3, Math.sqrt(d.x*d.x + d.y*d.y));
                    const dir = new Vector2(d.x/m, d.y/m);
                    if (!this.waterRings) this.waterRings = [];
                    // Spawn 2 spinners with slight offsets, lower damage and speed
                    const baseAng = Math.atan2(dir.y, dir.x);
                    const offsets = [-0.18, 0.18];
                    for (const off of offsets) {
                        const ang = baseAng + off;
                        const v = new Vector2(Math.cos(ang), Math.sin(ang));
                        const tri = {
                            pos: src.clone(),
                            radius: 38,
                            thickness: 0,
                            expandRate: 0,
                            life: 4200,
                            moving: true,
                            dir: v,
                            speed: 460,
                            dps: Math.max(1, Math.floor((this.weaponDamage != null ? this.weaponDamage : 12) * 1.4)),
                            slowFactor: 1.0,
                            fromBoss: true,
                            shape: 'triangle',
                            groupId: boss.internal.spinnerGroupId,
                            rotAngle: 0,
                            rotVel: 5.5,
                            bounceWalls: true
                        };
                        this.waterRings.push(tri);
                    }
                    boss.internal.didCast = true;
                }
                const anySpin = (this.waterRings || []).some(r => r.groupId === boss.internal.spinnerGroupId);
                if (!anySpin) {
                    goIdleThen('spinner', 1400);
                }
                break;
            }
        }
        this.applyVignette('rgba(0,0,0,0.6)');
    }

    // ---- Wallet & Ownership persistence ----
    loadWallet() {
        try {
            const raw = localStorage.getItem('glowlings_wallet');
            if (!raw) return { coins: 200 }; // starter coins
            const w = JSON.parse(raw);
            if (!w || typeof w.coins !== 'number') return { coins: 200 };
            return { coins: Math.max(0, Math.floor(w.coins)) };
        } catch(_) { return { coins: 200 }; }
    }
    saveWallet() {
        try { localStorage.setItem('glowlings_wallet', JSON.stringify(this.wallet || { coins: 0 })); } catch(_) {}
    }
    getCoins() { if (!this.wallet) this.wallet = this.loadWallet(); return (this.wallet.coins||0); }
    grantCoins(amount) {
        if (!this.wallet) this.wallet = this.loadWallet();
        const a = Math.max(0, Math.floor(amount||0));
        this.wallet.coins = Math.max(0, (this.wallet.coins||0) + a);
        this.saveWallet();
    }
    spendCoins(amount) {
        if (!this.wallet) this.wallet = this.loadWallet();
        const a = Math.max(0, Math.floor(amount||0));
        if ((this.wallet.coins||0) < a) return false;
        this.wallet.coins = Math.max(0, (this.wallet.coins||0) - a);
        this.saveWallet();
        return true;
    }
    loadOwnedSkins() {
        try {
            const raw = localStorage.getItem('glowlings_owned_skins');
            if (!raw) return {};
            const o = JSON.parse(raw);
            return (o && typeof o === 'object') ? o : {};
        } catch(_) { return {}; }
    }
    saveOwnedSkins() {
        try { localStorage.setItem('glowlings_owned_skins', JSON.stringify(this.ownedSkins||{})); } catch(_) {}
    }
    isOwned(skinId) {
        if (!this.ownedSkins) this.ownedSkins = this.loadOwnedSkins();
        return !!(this.ownedSkins && this.ownedSkins[skinId]);
    }
    purchaseSkin(skin) {
        try {
            if (!skin || !skin.id) return false;
            const best = (this.runHistory && this.runHistory.best) ? this.runHistory.best : { wave: 0 };
            if ((best.wave||0) < (skin.reqWave||0)) return false;
            if (this.isOwned(skin.id)) return true;
            if (!this.spendCoins || !this.spendCoins(skin.cost||0)) return false;
            if (!this.ownedSkins) this.ownedSkins = this.loadOwnedSkins();
            this.ownedSkins[skin.id] = true;
            this.saveOwnedSkins();
            // Auto-select after purchase
            try { localStorage.setItem('glowlings_selected_skin', JSON.stringify({ id: skin.id, color: skin.color, shape: skin.shape })); } catch(_) {}
            // Apply immediately if player exists
            try {
                if (this.player) {
                    this.player.color = skin.color;
                    this.player.shape = skin.shape;
                }
            } catch(_) {}
            return true;
        } catch(_) { return false; }
    }

    // Keep body class in sync with gameplay to control CSS states (e.g., hide start screen)
    syncBodyPlaying() {
        try {
            const cls = document && document.body && document.body.classList;
            if (!cls) return;
            if (this.gameState === 'playing') cls.add('playing');
            else cls.remove('playing');
        } catch {}
    }

    // Show a prominent boss wave banner (auto hides after ~2.2s)
    showBossBanner(wave) {
        try {
            const el = document.getElementById('bossBanner');
            const txt = document.getElementById('bossBannerText');
            const sub = document.getElementById('bossBannerSub');
            if (!el || !txt || !sub) return;
            const labels = { 5: 'Mini Boss', 10: 'Boss', 15: 'Mini Boss', 20: 'Final Boss' };
            txt.textContent = `BOSS DALGASI — ${labels[wave] || ''}`.trim();
            sub.textContent = `Dalga ${wave} başlıyor!`;
            el.style.display = 'block';
            el.style.opacity = '0';
            el.style.transition = 'opacity 250ms ease-out';
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                setTimeout(() => {
                    el.style.transition = 'opacity 500ms ease-in';
                    el.style.opacity = '0';
                    setTimeout(() => { el.style.display = 'none'; }, 520);
                }, 1700);
            });
        } catch {}
    }

    // Spawn the Wave 15 mini-boss (mid triangle boss)
    spawnBoss15() {
        try {
            const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
            let pos = new Vector2(z.x + z.width/2, z.y + z.height/2);
            if (this.player) {
                const toP = this.player.pos.minusNew(pos);
                if (toP.magnitude() < 240) {
                    const corners = [
                        new Vector2(z.x + 40, z.y + 40),
                        new Vector2(z.x + z.width - 40, z.y + 40),
                        new Vector2(z.x + 40, z.y + z.height - 40),
                        new Vector2(z.x + z.width - 40, z.y + z.height - 40),
                    ];
                    pos = corners.sort((a,b)=>b.minusNew(this.player.pos).magnitude()-a.minusNew(this.player.pos).magnitude())[0];
                }
            }
            const boss = new AIBot('W15-MiniBoss', pos, 'air', '#ffb347', 'triangle');
            boss.size = 22;
            const baseDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
            boss.maxHP = 1200 + Math.floor(baseDmg * 70);
            boss.hp = boss.maxHP;
            boss.isBoss = true;
            boss.bossWave = 15;
            boss.isRanged = false;
            const origGetSpeed = boss.getSpeed.bind(boss);
            boss.getSpeed = () => Math.max(72, origGetSpeed() * 0.95);
            boss.bossPhase = 'spinner';
            boss.phaseTimer = 0;
            boss.phaseIndex = 0;
            boss.internal = {};
            this.aiBots.push(boss);
        } catch (e) {}
    }

    // Update Wave 15 mini-boss (spinner -> coneBurst -> starfall, light versions)
    updateBoss15(dt) {
        if (this.waveNumber !== 15) return;
        const boss = (this.aiBots || []).find(b => b.isBoss && b.bossWave === 15);
        if (!boss) return;
        boss.internal = boss.internal || {};
        boss.phaseTimer = (boss.phaseTimer || 0) + dt;
        const goIdleThen = (next, idleMs=1800) => {
            boss.bossPhase = 'idle';
            boss.internal.nextPhase = next;
            boss.internal.idleFor = idleMs;
            boss.phaseTimer = 0;
        };
        if (!boss.bossPhase) boss.bossPhase = 'spinner';
        switch (boss.bossPhase) {
            case 'idle': {
                if (boss.phaseTimer >= (boss.internal.idleFor || 1800)) {
                    const next = boss.internal.nextPhase || 'spinner';
                    boss.bossPhase = next;
                    boss.internal.nextPhase = undefined;
                    boss.phaseTimer = 0;
                    boss.internal.didCast = false;
                }
                break;
            }
            case 'spinner': {
                if (!boss.internal.didCast) {
                    boss.internal.spinnerGroupId = 'w15spin_' + Math.floor(Math.random()*1e9);
                    const src = boss.pos.clone();
                    const target = (this.player && this.player.pos) ? this.player.pos : src.plusNew(new Vector2(1,0));
                    const d = target.minusNew(src);
                    const m = Math.max(1e-3, Math.sqrt(d.x*d.x + d.y*d.y));
                    const dir = new Vector2(d.x/m, d.y/m);
                    if (!this.waterRings) this.waterRings = [];
                    const baseAng = Math.atan2(dir.y, dir.x);
                    const offsets = [-0.2, 0, 0.2];
                    for (const off of offsets) {
                        const ang = baseAng + off;
                        const v = new Vector2(Math.cos(ang), Math.sin(ang));
                        const tri = {
                            pos: src.clone(),
                            radius: 40,
                            thickness: 0,
                            expandRate: 0,
                            life: 4600,
                            moving: true,
                            dir: v,
                            speed: 500,
                            dps: Math.max(1, Math.floor((this.weaponDamage != null ? this.weaponDamage : 12) * 1.6)),
                            slowFactor: 1.0,
                            fromBoss: true,
                            shape: 'triangle',
                            groupId: boss.internal.spinnerGroupId,
                            rotAngle: 0,
                            rotVel: 5.7,
                            bounceWalls: true
                        };
                        this.waterRings.push(tri);
                    }
                    boss.internal.didCast = true;
                }
                const anySpin = (this.waterRings || []).some(r => r.groupId === boss.internal.spinnerGroupId);
                if (!anySpin) {
                    goIdleThen('coneBurst', 1500);
                }
                break;
            }
            case 'coneBurst': {
                if (!boss.internal.didCast) {
                    boss.internal.coneGroupId = 'w15cone_' + Math.floor(Math.random()*1e9);
                    const basePos = boss.pos.clone();
                    const playerPos = (this.player && this.player.pos) ? this.player.pos : basePos.plusNew(new Vector2(1,0));
                    const dir = playerPos.minusNew(basePos).normalise();
                    const baseAng = Math.atan2(dir.y, dir.x);
                    const count = 7; // fewer than W10
                    const spread = Math.PI / 3;
                    const speed = 400;
                    for (let i = 0; i < count; i++) {
                        const t = count === 1 ? 0 : (i/(count-1) - 0.5);
                        const ang = baseAng + t * spread;
                        const v = new Vector2(Math.cos(ang), Math.sin(ang));
                        const tri = {
                            pos: basePos.clone(),
                            radius: 32,
                            thickness: 0,
                            expandRate: 0,
                            life: 1500,
                            moving: true,
                            dir: v,
                            speed: speed,
                            dps: Math.max(1, Math.floor((this.weaponDamage != null ? this.weaponDamage : 12) * 1.5)),
                            slowFactor: 1.0,
                            fromBoss: true,
                            shape: 'triangle',
                            groupId: boss.internal.coneGroupId
                        };
                        if (!this.waterRings) this.waterRings = [];
                        this.waterRings.push(tri);
                    }
                    boss.internal.didCast = true;
                }
                const anyCone = (this.waterRings || []).some(r => r.groupId === boss.internal.coneGroupId);
                if (!anyCone) {
                    goIdleThen('starfall', 1500);
                }
                break;
            }
            case 'starfall': {
                if (!boss.internal.didCast) {
                    boss.internal.starGroupId = 'w15star_' + Math.floor(Math.random()*1e9);
                    const z = this.playZone || { x:0, y:0, width:(this.worldSize && this.worldSize.width)||2000, height:(this.worldSize && this.worldSize.height)||2000 };
                    const playerPos = (this.player && this.player.pos) ? this.player.pos : new Vector2(z.x + z.width/2, z.y + z.height/2);
                    const lanes = 3;
                    const spacing = 140;
                    const startY = Math.max(z.y + 20, playerPos.y - 420);
                    const speed = 340;
                    for (let i = -Math.floor(lanes/2); i <= Math.floor((lanes-1)/2); i++) {
                        const px = playerPos.x + i * spacing;
                        const py = startY;
                        const tri = {
                            pos: new Vector2(px, py),
                            radius: 38,
                            thickness: 0,
                            expandRate: 0,
                            life: 1700,
                            moving: true,
                            dir: new Vector2(0, 1),
                            speed: speed,
                            dps: Math.max(1, Math.floor((this.weaponDamage != null ? this.weaponDamage : 12) * 1.55)),
                            slowFactor: 1.0,
                            fromBoss: true,
                            shape: 'triangle',
                            groupId: boss.internal.starGroupId
                        };
                        if (!this.waterRings) this.waterRings = [];
                        this.waterRings.push(tri);
                    }
                    boss.internal.didCast = true;
                }
                const anyStar = (this.waterRings || []).some(r => r.groupId === boss.internal.starGroupId);
                if (!anyStar) {
                    goIdleThen('spinner', 1500);
                }
                break;
            }
        }
    }

    // Public toggler used by ESC: in gameplay, open/close pause menu; otherwise, go back/close top overlay
    togglePause() {
        try {
            if (this.gameState === 'playing') {
                this.toggleInGameMenu();
                return true;
            }
            // Not in gameplay: treat ESC as "back". Close any open overlay in priority order.
            const closeIfOpen = (el) => { if (!el) return false; const ds = (el.style && el.style.display) || ''; if (ds && ds !== 'none') { el.style.display = 'none'; return true; } return false; };
            const get = (id)=> document.getElementById(id);
            const order = [
                'buildsOverlay',
                'charactersOverlay',
                'settingsOverlay',
                'howToOverlay',
                'weaponOverlay',
                'shopOverlay',
                'mainShopOverlay'
            ];
            for (let i=0;i<order.length;i++){
                const id = order[i];
                if (closeIfOpen(get(id))) {
                    // After closing in menu context, ensure start screen is visible
                    try{ if (this.gameState !== 'playing') { const ss = get('startScreen'); if (ss) ss.style.display = 'block'; } }catch(_){ }
                    return true;
                }
            }
        } catch(_) { }
        return false;
    }

    // Visible player turrets drawn as compact rifles near player
    drawPlayerTurrets() {
        if (!this.player || !this.playerTurrets) return;
        for (const t of this.playerTurrets) {
            if (!t.pos) continue;
            const screenPos = new Vector2(t.pos.x - this.camera.x, t.pos.y - this.camera.y);
            // Resolve selected turret skin visual params (cached)
            let turretSkin = this._cachedTurretSkin;
            try {
                if (!turretSkin || turretSkin.__ts == null || (Date.now() - turretSkin.__ts) > 1500) {
                    const raw = localStorage.getItem('glowlings_selected_weapon_skin_turret');
                    if (raw) {
                        const s = JSON.parse(raw);
                        if (s && s.type === 'turret') turretSkin = { ...s, __ts: Date.now() };
                    }
                    this._cachedTurretSkin = turretSkin;
                }
            } catch(_) {}
            const bodyStroke = (turretSkin && turretSkin.colors && turretSkin.colors[0]) || '#06b6d4';
            const bodyFill = (turretSkin && turretSkin.colors && turretSkin.colors[1]) || '#1f2937';
            const muzzleCol = (turretSkin && turretSkin.muzzle) || 'rgba(34,255,34,0.35)';
            // aim direction: use cached aimDir or fallback to +X
            const aim = (t.aimDir && (Math.abs(t.aimDir.x) + Math.abs(t.aimDir.y) > 0.0001)) ? t.aimDir : new Vector2(1,0);
            const ang = Math.atan2(aim.y, aim.x);

            let drewRaster = false;
            try {
                if (turretSkin && typeof document !== 'undefined') {
                    if (!this._svgRasterCache) this._svgRasterCache = {};
                    const key = `turret_${turretSkin.id}`;
                    const now = Date.now();
                    const svg = this.buildWeaponSkinSVG ? this.buildWeaponSkinSVG('turret', turretSkin, now) : null;
                    if (svg) {
                        const img = this.rasterizeSVG ? this.rasterizeSVG(svg, key) : null;
                        if (img && img.complete && img.naturalWidth > 0) {
                            this.ctx.save();
                            this.ctx.translate(screenPos.x, screenPos.y);
                            this.ctx.rotate(ang);
                            const targetW = 104 * (this.turretVisualScale || 1);
                            const scale = targetW / Math.max(1, img.naturalWidth);
                            const w = img.naturalWidth * scale;
                            const h = img.naturalHeight * scale;
                            this.ctx.drawImage(img, -w * 0.24, -h * 0.5, w, h);
                            this.ctx.restore();
                            drewRaster = true;
                        }
                    }
                }
            } catch(_) {}
            if (drewRaster) continue;
            this.ctx.save();
            this.ctx.translate(screenPos.x, screenPos.y);
            this.ctx.rotate(ang);
            const k = (this.turretVisualScale || 1);
            if (k !== 1) this.ctx.scale(k, k);
            // body
            this.ctx.fillStyle = bodyFill;
            this.ctx.strokeStyle = bodyStroke;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            if (this.ctx.roundRect) this.ctx.roundRect(-12, -9, 40, 18, 4); else this.ctx.rect(-12, -9, 40, 18);
            this.ctx.fill();
            this.ctx.stroke();
            // barrel
            this.ctx.fillStyle = '#334155';
            this.ctx.fillRect(26, -5, 30, 10);
            // muzzle glow
            this.ctx.fillStyle = muzzleCol;
            this.ctx.beginPath();
            this.ctx.arc(58, 0, 7, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    // Spawn the Wave 10 boss (triangle boss)
    spawnBoss10() {
        try {
            const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
            let pos = new Vector2(z.x + z.width/2, z.y + z.height/2);
            // Avoid spawning on top of the player
            if (this.player) {
                const toP = this.player.pos.minusNew(pos);
                if (toP.magnitude() < 260) {
                    // place to farthest corner from player
                    const corners = [
                        new Vector2(z.x + 40, z.y + 40),
                        new Vector2(z.x + z.width - 40, z.y + 40),
                        new Vector2(z.x + 40, z.y + z.height - 40),
                        new Vector2(z.x + z.width - 40, z.y + z.height - 40),
                    ];
                    pos = corners.sort((a,b)=>b.minusNew(this.player.pos).magnitude()-a.minusNew(this.player.pos).magnitude())[0];
                }
            }
            const name = 'W10-Boss';
            const element = 'air';
            const color = '#ffcc33';
            const shape = 'triangle';
            const boss = new AIBot(name, pos, element, color, shape);
            boss.size = 24;
            const baseDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
            boss.maxHP = 1600 + Math.floor(baseDmg * 90);
            boss.hp = boss.maxHP;
            boss.isBoss = true;
            boss.bossWave = 10;
            // Do not use generic ranged shooting; boss attacks are wave-based
            boss.isRanged = false;
            const origGetSpeed = boss.getSpeed.bind(boss);
            boss.getSpeed = () => Math.max(70, origGetSpeed() * 0.95);
            // Start with the new orbiting spokes phase
            boss.bossPhase = 'spinner';
            boss.phaseTimer = 0;
            boss.phaseIndex = 0;
            boss.internal = {};
            this.aiBots.push(boss);
        } catch (e) {}
    }

    // Update Wave 10 boss attacks and behaviors (triangle boss)
    updateBoss10(dt) {
        if (this.waveNumber !== 10) return;
        const boss = (this.aiBots || []).find(b => b.isBoss && b.bossWave === 10);
        if (!boss) return;
        // Wave 10 rule: no other bots shoot
        for (const b of (this.aiBots || [])) {
            if (!b.isBoss) {
                b.isRanged = false;
                if (b.shootCooldown != null) b.shootCooldown = 999999;
                if (b.fireCooldown != null) b.fireCooldown = 999999;
            }
        }
        boss.internal = boss.internal || {};
        boss.phaseTimer += dt;
        const goIdleThen = (next, idleMs=2000) => {
            boss.bossPhase = 'idle';
            boss.internal.nextPhase = next;
            boss.internal.idleFor = idleMs;
            boss.phaseTimer = 0;
        };
        if (!boss.bossPhase) boss.bossPhase = 'spinner';
        switch (boss.bossPhase) {
            case 'idle':
{
                if (boss.phaseTimer >= (boss.internal.idleFor || 2000)) {
                    const next = boss.internal.nextPhase || 'spinner';
                    boss.bossPhase = next;
                    boss.internal.nextPhase = undefined;
                    boss.phaseTimer = 0;
                    boss.internal.didCast = false;
                }
                break;
            }
            case 'spinner': { // three rotating triangles that bounce off walls
                if (!boss.internal.didCast) {
                    boss.internal.spinnerGroupId = 'spin_' + Math.floor(Math.random()*1e9);
                    const src = boss.pos.clone();
                    const target = (this.player && this.player.pos) ? this.player.pos : src.plusNew(new Vector2(1,0));
                    const d = target.minusNew(src);
                    const m = Math.max(1e-3, Math.sqrt(d.x*d.x + d.y*d.y));
                    const dir = new Vector2(d.x/m, d.y/m);
                    if (!this.waterRings) this.waterRings = [];
                    // Spawn 3 spinners with slight angle offsets
                    const baseAng = Math.atan2(dir.y, dir.x);
                    const offsets = [-0.22, 0, 0.22];
                    for (const off of offsets) {
                        const ang = baseAng + off;
                        const v = new Vector2(Math.cos(ang), Math.sin(ang));
                        const tri = {
                            pos: src.clone(),
                            radius: 44,
                            thickness: 0,
                            expandRate: 0,
                            life: 5000,
                            moving: true,
                            dir: v,
                            speed: 520,
                            dps: Math.max(1, Math.floor((this.weaponDamage != null ? this.weaponDamage : 12) * 3.24)),
                            slowFactor: 1.0,
                            fromBoss: true,
                            shape: 'triangle',
                            groupId: boss.internal.spinnerGroupId,
                            // spin + bounce
                            rotAngle: 0,
                            rotVel: 6.0, // rad/s
                            bounceWalls: true
                        };
                        this.waterRings.push(tri);
                    }
                    boss.internal.didCast = true;
                }
                const anySpin = (this.waterRings || []).some(r => r.groupId === boss.internal.spinnerGroupId);
                if (!anySpin) {
                    goIdleThen('coneBurst', 2000);
                }
                break;
            }
            case 'coneBurst': { // emit a cone of moving triangle hazards toward the player
                if (!boss.internal.didCast) {
                    boss.internal.coneGroupId = 'cone_' + Math.floor(Math.random()*1e9);
                    const basePos = boss.pos.clone();
                    const playerPos = (this.player && this.player.pos) ? this.player.pos : basePos.plusNew(new Vector2(1,0));
                    const dir = playerPos.minusNew(basePos).normalise();
                    const baseAng = Math.atan2(dir.y, dir.x);
                    const count = 9; // number of triangles
                    const spread = Math.PI / 3; // 60 degrees
                    const speed = 420;
                    for (let i = 0; i < count; i++) {
                        const t = count === 1 ? 0 : (i/(count-1) - 0.5);
                        const ang = baseAng + t * spread;
                        const v = new Vector2(Math.cos(ang), Math.sin(ang));
                        const tri = {
                            pos: basePos.clone(),
                            radius: 34,
                            thickness: 0,
                            expandRate: 0,
                            life: 1600,
                            moving: true,
                            dir: v,
                            speed: speed,
                            dps: Math.max(1, Math.floor((this.weaponDamage != null ? this.weaponDamage : 12) * 3.24)),
                            slowFactor: 1.0,
                            fromBoss: true,
                            shape: 'triangle',
                            groupId: boss.internal.coneGroupId
                        };
                        if (!this.waterRings) this.waterRings = [];
                        this.waterRings.push(tri);
                    }
                    boss.internal.didCast = true;
                }
                // End when all cone triangles are gone, then go to starfall
                const anyCone = (this.waterRings || []).some(r => r.groupId === boss.internal.coneGroupId);
                if (!anyCone) {
                    goIdleThen('starfall', 2000);
                }
                break;
            }
            case 'starfall': { // spawn lanes of triangles above player that fall down
                if (!boss.internal.didCast) {
                    boss.internal.starGroupId = 'star_' + Math.floor(Math.random()*1e9);
                    const z = this.playZone || { x:0, y:0, width:(this.worldSize && this.worldSize.width)||2000, height:(this.worldSize && this.worldSize.height)||2000 };
                    const playerPos = (this.player && this.player.pos) ? this.player.pos : new Vector2(z.x + z.width/2, z.y + z.height/2);
                    const lanes = 4;
                    const spacing = 140;
                    const startY = Math.max(z.y + 20, playerPos.y - 420);
                    const speed = 360;
                    for (let i = -Math.floor(lanes/2); i <= Math.floor((lanes-1)/2); i++) {
                        const px = playerPos.x + i * spacing;
                        const py = startY;
                        const tri = {
                            pos: new Vector2(px, py),
                            radius: 42,
                            thickness: 0,
                            expandRate: 0,
                            life: 1800,
                            moving: true,
                            dir: new Vector2(0, 1),
                            speed: speed,
                            dps: Math.max(1, Math.floor((this.weaponDamage != null ? this.weaponDamage : 12) * 3.24)),
                            slowFactor: 1.0,
                            fromBoss: true,
                            shape: 'triangle',
                            groupId: boss.internal.starGroupId
                        };
                        if (!this.waterRings) this.waterRings = [];
                        this.waterRings.push(tri);
                    }
                    boss.internal.didCast = true;
                }
                const anyStar = (this.waterRings || []).some(r => r.groupId === boss.internal.starGroupId);
                if (!anyStar) {
                    goIdleThen('spinner', 2000);
                }
                break;
            }
        }
    }

    // Update the debug overlay values if present
    updateDebugOverlay() {
        const g = (id) => document.getElementById(id);
        const fpsEl = g('dbgFps');
        if (fpsEl && this.fps != null) fpsEl.textContent = `${Math.round(this.fps)}`;
        const rateEl = g('dbgRate');
        if (rateEl) rateEl.textContent = `${(this.spawnPerSecond || 0).toFixed(2)}`;
        const intEl = g('dbgInterval');
        if (intEl) intEl.textContent = `${(this.spawnInterval || 0).toFixed(2)}s`;
        const accEl = g('dbgAccum');
        if (accEl) accEl.textContent = `${(this.spawnAccumulator || 0).toFixed(2)}`;
        const budEl = g('dbgBudget');
        if (budEl) budEl.textContent = `${this.budgetRemaining != null ? this.budgetRemaining : '-'}`;
        const desEl = g('dbgDesired');
        if (desEl) desEl.textContent = `${this.desiredEnemyCap != null ? this.desiredEnemyCap : '-'}`;
        const aliveEl = g('dbgAlive');
        if (aliveEl) aliveEl.textContent = `${(this.aiBots || []).length}`;
    }

    // Select enemy type by wave range using weighted probabilities
    chooseEnemyTypeForWave(wave) {
        const w = Math.max(1, wave|0);
        let weights;
        if (w <= 3) {
            weights = { weak: 0.7, fast: 0.2, tank: 0.1 };
        } else if (w <= 6) {
            weights = { weak: 0.55, fast: 0.25, tank: 0.15, elite: 0.05 };
        } else if (w <= 10) {
            weights = { weak: 0.45, fast: 0.25, tank: 0.20, elite: 0.10 };
        } else if (w <= 15) {
            weights = { weak: 0.35, fast: 0.25, tank: 0.25, elite: 0.15 };
        } else { // 16-20 (boss handled separately)
            weights = { weak: 0.25, fast: 0.30, tank: 0.25, elite: 0.20 };
        }
        const roll = Math.random();
        let acc = 0;
        for (const k of ['weak','fast','tank','elite']) {
            if (weights[k]) { acc += weights[k]; if (roll < acc) return k; }
        }
        return 'weak';
    }

    // Compute enemy HP scaling by type and wave
    getEnemyStats(type, wave) {
        const base = { weak: 20, fast: 18, tank: 45, elite: 80 };
        const b = base[type] || base.weak;
        const w = Math.max(1, wave|0);
        let hp = Math.round(b * Math.pow(1.10, w - 1)); // ~+10% per wave
        if (w >= 16 && w <= 19) hp = Math.round(hp * 1.5); // late-wave boost
        return { hp };
    }

    // Spawn the Wave 20 boss once; does not consume budget
    spawnBoss() {
        try {
            const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
            let pos = new Vector2(z.x + z.width/2, z.y + z.height/2);
            // Avoid spawning on top of player: if too close, move boss toward a far corner from player
            if (this.player) {
                const minDist = (28 + (this.player.size || 12)) + 40; // boss size + player size + margin
                const toPlayer = this.player.pos.minusNew(pos);
                const d = toPlayer.magnitude();
                if (d < minDist) {
                    // Choose a spawn point far from player within play zone
                    const px = this.player.pos.x;
                    const py = this.player.pos.y;
                    const farX = (px < z.x + z.width / 2) ? (z.x + z.width - 80) : (z.x + 80);
                    const farY = (py < z.y + z.height / 2) ? (z.y + z.height - 80) : (z.y + 80);
                    pos = new Vector2(farX, farY);
                }
            }
            const name = 'BOSS';
            const element = ['fire','water','air'][Math.floor(Math.random()*3)];
            const color = '#ff3366';
            const shape = 'star';
            const boss = new AIBot(name, pos, element, color, shape);
            boss.size = 28;
            // high HP boss scaling off wave and player damage
            const baseDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
            boss.maxHP = 3000 + Math.floor(baseDmg * 120);
            boss.hp = boss.maxHP;
            boss.isBoss = true;
            boss.isRanged = true;
            boss.shootCooldown = 400; // shoots more often
            // slight slow so it feels weighty
            const origGetSpeed = boss.getSpeed.bind(boss);
            boss.getSpeed = () => Math.max(60, origGetSpeed() * 0.8);
            // Boss phase machine
            boss.bossPhase = 'dash';
            boss.phaseTimer = 0;
            boss.phaseIndex = 0;
            boss.enraged = false;
            boss.internal = { spiralAngle: 0, summonCooldown: 0 };
            this.aiBots.push(boss);
        } catch (e) {
            // fail-safe: ignore if spawning boss errors
        }
    }

    // Update Wave 20 boss attacks and behaviors
    updateBoss(dt) {
        if (this.waveNumber !== 20) return;
        const boss = (this.aiBots || []).find(b => b.isBoss);
        if (!boss) return;
        // Enrage at 50%
        boss.enraged = boss.hp <= (boss.maxHP || 1) * 0.5;
        const speedMul = boss.enraged ? 1.15 : 1.0;
        const cdMul = boss.enraged ? 0.8 : 1.0;
        boss.phaseTimer = (boss.phaseTimer || 0) + dt;

        const fireProjectile = (origin, dir, speed, damageMul=1) => {
            const vel = dir.multiplyNew(speed * (this.projectileSpeedMult || 1));
            const spawn = origin.plusNew(dir.multiplyNew(14));
            const baseDmg = this.weaponDamage != null ? this.weaponDamage : 12;
            const proj = new Projectile(spawn, vel, boss, { damage: Math.max(1, Math.floor(baseDmg * damageMul)) });
            this.projectiles.push(proj);
        };

        const aimToPlayer = () => {
            if (!this.player) return new Vector2(1,0);
            const v = this.player.pos.minusNew(boss.pos);
            const m = v.magnitude();
            return (m > 1e-6) ? v.divideNew(m) : new Vector2(1,0);
        };

        const nextPhase = (name) => {
            boss.bossPhase = name;
            boss.phaseTimer = 0;
        };

        switch (boss.bossPhase) {
            case 'idle': {
                // 3–4s gap between skills (shorter when enraged)
                if (!boss.internal.idleInit) {
                    boss.internal.idleInit = true;
                    boss.internal.idleFor = 2500; // fixed 2.5 seconds
                }
                if (boss.phaseTimer >= (boss.internal.idleFor || 2500)) {
                    boss.internal.idleInit = false;
                    const target = boss.nextPhaseName || 'dash';
                    boss.nextPhaseName = undefined;
                    nextPhase(target);
                }
                break;
            }
            case 'dash': {
                // Telegraph window (~700ms) then burst cone fire simulating a dangerous dash
                const tele = 900 * cdMul;
                const act = 250 * cdMul;
                if (boss.phaseTimer >= tele && boss.phaseTimer < tele + act) {
                    // fire a tight cone toward player (once at start of action)
                    if (!boss.internal.dashFired) {
                        boss.internal.dashFired = true;
                        const dir = aimToPlayer();
                        const N = 9;
                        const spread = Math.PI * 0.30; // ~54 degrees
                        for (let i = 0; i < N; i++) {
                            const t = (i/(N-1)) - 0.5;
                            const ang = Math.atan2(dir.y, dir.x) + t * spread;
                            const d = new Vector2(Math.cos(ang), Math.sin(ang));
                            fireProjectile(boss.pos, d, 520 * speedMul, 1.2);
                        }
                    }
                }
                if (boss.phaseTimer >= tele + act + 700 * cdMul) {
                    boss.internal.dashFired = false;
                    boss.nextPhaseName = 'spiral';
                    nextPhase('idle');
                }
                break;
            }
            case 'spiral': {
                // Continuous spiral for ~2.2s (enraged: faster)
                const dur = 2800 * cdMul;
                const step = boss.enraged ? 0.20 : 0.14; // radians per tick
                boss.internal.spiralAngle = (boss.internal.spiralAngle || 0) + step;
                // two opposite-phase shots every 120ms
                boss.internal.spiralTick = (boss.internal.spiralTick || 0) + dt;
                if (boss.internal.spiralTick >= 150) {
                    boss.internal.spiralTick = 0;
                    const a = boss.internal.spiralAngle;
                    const d1 = new Vector2(Math.cos(a), Math.sin(a));
                    const d2 = new Vector2(Math.cos(a + Math.PI), Math.sin(a + Math.PI));
                    fireProjectile(boss.pos, d1, 420, 1.0);
                    fireProjectile(boss.pos, d2, 420, 1.0);
                }
                if (boss.phaseTimer >= dur) {
                    boss.nextPhaseName = 'beam';
                    nextPhase('idle');
                }
                break;
            }
            case 'beam': {
                // Beam sweep approximation: burst lines sweeping an arc; 1.6s
                const dur = 1600 * cdMul;
                if (!boss.internal.beamInit) {
                    boss.internal.beamInit = true;
                    boss.internal.beamAngle = Math.atan2(aimToPlayer().y, aimToPlayer().x) - 0.8; // start left
                }
                // every 120ms emit a short line of fast bullets along beamAngle
                boss.internal.beamTick = (boss.internal.beamTick || 0) + dt;
                if (boss.internal.beamTick >= 120) {
                    boss.internal.beamTick = 0;
                    const segs = 6;
                    const a = boss.internal.beamAngle;
                    const d = new Vector2(Math.cos(a), Math.sin(a));
                    for (let i = 1; i <= segs; i++) {
                        const spawn = boss.pos.plusNew(d.multiplyNew(i * 24));
                        const vel = d.multiplyNew(560);
                        const proj = new Projectile(spawn, vel, boss, { damage: Math.max(1, Math.floor((this.weaponDamage||12)*0.9)) });
                        this.projectiles.push(proj);
                    }
                    boss.internal.beamAngle += 0.22; // sweep speed
                }
                if (boss.phaseTimer >= dur) {
                    boss.internal.beamInit = false;
                    boss.nextPhaseName = 'ring';
                    nextPhase('idle');
                }
                break;
            }
            case 'ring': {
                // One or two bullet rings with a small gap
                const doRing = (gapAngle) => {
                    const bullets = 22;
                    for (let i = 0; i < bullets; i++) {
                        const a = (i / bullets) * Math.PI * 2;
                        if (Math.abs(((a - gapAngle + Math.PI*2) % (Math.PI*2)) - Math.PI) < 0.12) continue; // gap
                        const d = new Vector2(Math.cos(a), Math.sin(a));
                        fireProjectile(boss.pos, d, 360, 0.9);
                    }
                };
                if (!boss.internal.ringDone) {
                    boss.internal.ringDone = true;
                    const gap = Math.atan2(aimToPlayer().y, aimToPlayer().x);
                    doRing(gap);
                    setTimeout(() => doRing(gap + 0.6), 180);
                    if (boss.enraged) setTimeout(() => doRing(gap + 1.2), 360);
                }
                if (boss.phaseTimer >= 1400 * cdMul) {
                    boss.internal.ringDone = false;
                    boss.nextPhaseName = 'shockwave';
                    nextPhase('idle');
                }
                break;
            }
            case 'shockwave': {
                // Expanding shockwave ring: multiple slow bullets forming rings with small gaps
                const dur = 1200 * cdMul;
                if (!boss.internal.swInit) {
                    boss.internal.swInit = true;
                    boss.internal.swBurst = 0;
                }
                // every 350ms emit a ring with different gap angle
                boss.internal.swTick = (boss.internal.swTick || 0) + dt;
                if (boss.internal.swTick >= 350) {
                    boss.internal.swTick = 0;
                    boss.internal.swBurst++;
                    const bullets = 18;
                    const gap = Math.atan2(aimToPlayer().y, aimToPlayer().x) + boss.internal.swBurst * 0.5;
                    for (let i = 0; i < bullets; i++) {
                        const a = (i / bullets) * Math.PI * 2;
                        if (Math.abs(((a - gap + Math.PI*2) % (Math.PI*2)) - Math.PI) < 0.18) continue; // wider gap
                        const d = new Vector2(Math.cos(a), Math.sin(a));
                        // slower, dodgeable
                        const vel = d.multiplyNew(240);
                        const spawn = boss.pos.plusNew(d.multiplyNew(16));
                        const proj = new Projectile(spawn, vel, boss, { damage: Math.max(1, Math.floor((this.weaponDamage||12)*0.8)) });
                        this.projectiles.push(proj);
                    }
                }
                if (boss.phaseTimer >= dur) {
                    boss.internal.swInit = false;
                    boss.nextPhaseName = 'summon';
                    nextPhase('idle');
                }
                break;
            }
            case 'summon': {
                // Request refill up to 10 support enemies. Spawning handled in spawnEnemiesDuringWave.
                this._bossWantsRefill = true;
                if (boss.phaseTimer >= 1100 * cdMul) {
                    this._bossWantsRefill = false;
                    boss.nextPhaseName = 'dash';
                    nextPhase('idle');
                }
                break;
            }
        }
    }

    // Update player turrets: follow player, aim, and shoot
    updatePlayerTurrets(dt) {
        if (!this.player || !this.playerTurrets) return;
        // Determine a reasonable facing for offsets
        const face = (this.lastShotDir && (Math.abs(this.lastShotDir.x)+Math.abs(this.lastShotDir.y)>0.0001)) ? this.lastShotDir.clone().normalise() : new Vector2(1,0);
        const right = new Vector2(face.y, -face.x); // perpendicular
        for (const t of this.playerTurrets) {
            // World position from player's position and offset expressed in local space (X along right, Y along face)
            const local = new Vector2(
                right.x * t.offset.x + face.x * t.offset.y,
                right.y * t.offset.x + face.y * t.offset.y
            );
            t.pos = new Vector2(this.player.pos.x + local.x, this.player.pos.y + local.y);
            // cooldown
            t.cooldown = (t.cooldown || 0) - dt;
            // acquire nearest target within range
            let nearest = null; let minD = (t.range || 520) + 1;
            for (const b of this.aiBots) {
                const d = t.pos.minusNew(b.pos).magnitude();
                if (d < minD) { minD = d; nearest = b; }
            }
            if (nearest && minD <= (t.range || 520)) {
                const dir = nearest.pos.minusNew(t.pos).normalise();
                // Smooth rotation with lerp (interpolation factor)
                const lerpFactor = Math.min(1, 0.18 * (dt / 16.67)); // Normalize to 60 FPS
                if (!t.aimDir || (Math.abs(t.aimDir.x) + Math.abs(t.aimDir.y) < 0.0001)) {
                    t.aimDir = dir.clone();
                } else {
                    // Lerp between current and target direction
                    t.aimDir.x += (dir.x - t.aimDir.x) * lerpFactor;
                    t.aimDir.y += (dir.y - t.aimDir.y) * lerpFactor;
                    const mag = Math.sqrt(t.aimDir.x * t.aimDir.x + t.aimDir.y * t.aimDir.y);
                    if (mag > 0.0001) {
                        t.aimDir.x /= mag;
                        t.aimDir.y /= mag;
                    }
                }
                if (t.cooldown <= 0) {
                    const vel = dir.multiplyNew(520 * (this.projectileSpeedMult || 1));
                    const spawn = t.pos.plusNew(dir.multiplyNew(10));
                    const baseDmg = this.weaponDamage != null ? this.weaponDamage : 12;
                    const flat = (this.baseDmgFlat||0);
                    const effDmg = (baseDmg + flat) * (this.turretDamageMul || 1);
                    const opts = { damage: effDmg };
                    const proj = new Projectile(spawn, vel, this.player, opts);
                    // mark as turret-origin if needed by future logic
                    proj.fromTurret = true;
                    this.projectiles.push(proj);
                    this.playShoot();
                    const rateMul = (this.turretFireRateMul || 1);
                    const baseDelay = (t.fireDelay || 600);
                    t.cooldown = Math.max(120, Math.floor(baseDelay * rateMul));
                }
            }
        }

        // Combo timeout reset (safe scope)
        try {
            const pp = this.player;
            if (pp && pp.comboCount && pp.comboCount > 0 && pp.comboExpireAt && Date.now() > pp.comboExpireAt) {
                pp.comboCount = 0;
            }
        } catch(_) {}
    }
    // Pause/Resume and sound
    togglePause() {
        // debounce rapid toggles (e.g., ESC key repeat)
        const now = Date.now();
        if (this._lastPauseToggle && (now - this._lastPauseToggle) < 150) return;
        this._lastPauseToggle = now;
        if (this.paused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }

        // Classic mode last 10s countdown beep
        if (this.gameMode !== 'brotato' && this.gameTime != null) {
            const t = Math.max(0, this.gameTime);
            if (t <= 10000) {
                const sec = Math.ceil(t / 1000);
                if (sec !== this.lastCountdownSecond) {
                    this.lastCountdownSecond = sec;
                    this.playCountdownTick();
                }
            } else {
                this.lastCountdownSecond = null;
            }
        }
    }

    // Random integer helper inclusive
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    drawPlayZone() {
        if (!this.playZone) return;
        // Convert world zone rect to screen rect using camera
        const sx = this.playZone.x - this.camera.x;
        const sy = this.playZone.y - this.camera.y;
        const sw = this.playZone.width;
        const sh = this.playZone.height;
        this.ctx.save();
        // Electric neon border: thin line, animated jitter
        const t = Date.now() * 0.002;
        const colorOuter = '#33ffcc';
        const colorInner = '#99fff0';
        // Top
        this.drawElectricLine(sx, sy, sx + sw, sy, t, colorOuter, colorInner);
        // Right
        this.drawElectricLine(sx + sw, sy, sx + sw, sy + sh, t + 0.7, colorOuter, colorInner);
        // Bottom
        this.drawElectricLine(sx + sw, sy + sh, sx, sy + sh, t + 1.4, colorOuter, colorInner);
        // Left
        this.drawElectricLine(sx, sy + sh, sx, sy, t + 2.1, colorOuter, colorInner);
        this.ctx.restore();
        // Extra: parallax star streaks (subtle, diagonal)
        try{
            const w=this.canvas.width, h=this.canvas.height; const now=Date.now()*0.0013;
            this.ctx.strokeStyle='rgba(125, 211, 252, 0.10)'; this.ctx.lineWidth=1;
            for(let i=0;i<22;i++){
                const sx=((i*173)+ (now*60))%w; const sy=((i*97)+ (now*30))%h;
                this.ctx.beginPath(); this.ctx.moveTo(sx,sy); this.ctx.lineTo(sx+10, sy+4); this.ctx.stroke();
            }
        }catch(_){ }
        this.applyVignette('rgba(0,0,0,0.55)');
    }

    // Draws an animated electric line from (x1,y1) to (x2,y2)
    drawElectricLine(x1, y1, x2, y2, t, colorOuter = '#33ffcc', colorInner = '#99fff0') {
        const ctx = this.ctx;
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / len, ny = dy / len; // unit direction
        const px = -ny, py = nx; // perpendicular
        // Segment parameters
        const segLen = 24; // pixels per segment
        const count = Math.max(2, Math.floor(len / segLen));
        const amp = 4; // small amplitude to keep border thin
        const path = [];
        for (let i = 0; i <= count; i++) {
            const k = i / count;
            const baseX = x1 + dx * k;
            const baseY = y1 + dy * k;
            // Smooth pseudo-noise using sin waves; phase offset by t
            const phase = t * 2.3 + i * 1.7;
            const wobble = (Math.sin(phase) + 0.6 * Math.sin(phase * 0.7 + 1.1)) * 0.5;
            const off = wobble * amp;
            path.push({ x: baseX + px * off, y: baseY + py * off });
        }
        // Outer glow stroke
        ctx.save();
        ctx.strokeStyle = colorOuter;
        ctx.lineWidth = 2; // thin as requested
        ctx.shadowColor = colorOuter;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
        ctx.restore();
        // Inner bright core
        ctx.save();
        ctx.strokeStyle = colorInner;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = colorInner;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
        ctx.restore();
    }
    pauseGame() {
        if (this.gameState !== 'playing') return;
        this.paused = true;
        // Force-hide start menu if any leftover visibility
        try { const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'none'; } catch(_){ }
        const menu = document.getElementById('inGameMenu');
        if (menu) {
            try { if (menu.parentElement !== document.body) document.body.appendChild(menu); } catch(_){ }
            menu.style.display = 'block';
        }
        try { document.body.classList.add('menu-open'); } catch(_){ }
        // Show mouse cursor while menu is open
        this.setCursorVisible(true);
        // Hide touch controls while paused
        this.updateTouchControlsVisibility();
    }
    resumeGame() {
        this.paused = false;
        this.inShop = false;
        const menu = document.getElementById('inGameMenu');
        if (menu) menu.style.display = 'none';
        // Ensure main menu stays hidden after closing pause
        try { const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'none'; } catch(_){ }
        try { document.body.classList.remove('menu-open'); document.body.classList.remove('shop-open'); } catch(_){ }
        // Hide mouse cursor back during gameplay
        this.setCursorVisible(false);
        // Show touch controls again when resuming
        this.updateTouchControlsVisibility();
        // Hard-ensure mobile buttons are interactive and bound
        try { this.forceEnableTouchButtons && this.forceEnableTouchButtons(); } catch(_) {}
        // Ensure touch buttons are tappable and bound after pause toggle
        try {
            const tc = document.getElementById('touchControls');
            if (tc) { tc.style.pointerEvents = 'auto'; tc.style.display = 'block'; tc.style.zIndex = '30000'; }
            const skillBtn = document.getElementById('skillBtn');
            if (skillBtn) { skillBtn.style.pointerEvents = 'auto'; skillBtn.style.zIndex = '30010'; skillBtn.disabled = false; }
            const dodgeBtn = document.getElementById('dodgeBtn');
            if (dodgeBtn) { dodgeBtn.style.pointerEvents = 'auto'; dodgeBtn.style.zIndex = '30010'; dodgeBtn.disabled = false; }
            this.ensureTouchButtonsBound && this.ensureTouchButtonsBound();
            // Re-apply once more after a short delay to override any late overlay sync
            setTimeout(() => {
                try {
                    const tc2 = document.getElementById('touchControls');
                    if (tc2) { tc2.style.pointerEvents = 'auto'; tc2.style.display = (this.usingTouch && this.gameState==='playing' && !this.paused) ? 'block' : 'none'; tc2.style.zIndex = '30000'; }
                    const s2 = document.getElementById('skillBtn'); if (s2) { s2.style.pointerEvents = 'auto'; s2.style.zIndex = '30010'; s2.disabled = false; }
                    const d2 = document.getElementById('dodgeBtn'); if (d2) { d2.style.pointerEvents = 'auto'; d2.style.zIndex = '30010'; d2.disabled = false; }
                    this.ensureTouchButtonsBound && this.ensureTouchButtonsBound();
                    this.forceEnableTouchButtons && this.forceEnableTouchButtons();
                } catch(_) {}
            }, 50);
            setTimeout(() => {
                try { this.updateTouchControlsVisibility(); this.ensureTouchButtonsBound && this.ensureTouchButtonsBound(); this.forceEnableTouchButtons && this.forceEnableTouchButtons(); } catch(_) {}
            }, 150);
        } catch(_) {}
        // Ensure we have a non-zero direction so movement visibly resumes even if mouse is centered
        const screenCenter = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
        const delta = this.mouse.minusNew(screenCenter);
        const isZeroDelta = Math.abs(delta.x) < 0.0001 && Math.abs(delta.y) < 0.0001;
        const hasLast = this.lastMoveDir && (Math.abs(this.lastMoveDir.x) > 0.0001 || Math.abs(this.lastMoveDir.y) > 0.0001);
        if (!hasLast && isZeroDelta) {
            this.lastMoveDir = new Vector2(1, 0);
        }
        this.resumeAudioContext();
    }
    toggleSound() {
        this.muted = !this.muted;
        const btn = document.getElementById('soundToggleBtn');
        if (btn) btn.textContent = this.muted ? 'SESİ AÇ' : 'SESİ KAPAT';
        this.applyAudioSettings();
    }

    applyAudioSettings() {
        try {
            // If Howler.js is used
            if (typeof Howler !== 'undefined') {
                Howler.mute(this.muted);
            }
        } catch {}
        // Fallback: adjust all HTMLAudioElements if present
        try {
            const audios = document.querySelectorAll('audio');
            audios.forEach(a => {
                if (a.id === 'bgm') {
                    // Keep BGM at 0.15 and follow both global mute and music mute
                    a.muted = !!(this.muted || this.musicMuted);
                    a.volume = 0.15;
                } else {
                    a.muted = this.muted;
                    a.volume = this.muted ? 0 : this.volume;
                }
            });
        } catch {}
        // WebAudio master gain
        if (this.masterGain) {
            const target = (this.muted ? 0 : (this.volume != null ? this.volume : 1));
            this.masterGain.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.01);
        }
    }

    // Music-only mute handling (does not affect SFX)
    applyMusicMute() {
        if (this.musicGain && this.audioCtx) {
            const target = this.musicMuted ? 0 : (this.musicVolume != null ? this.musicVolume : 0.15);
            this.musicGain.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.01);
        }
        const btn = document.getElementById('musicToggleBtn');
        if (btn) btn.textContent = this.musicMuted ? 'MÜZİĞİ AÇ' : 'MÜZİĞİ KAPAT';
        // Apply to HTML5 BGM element as well
        try {
            const bgm = document.getElementById('bgm');
            if (bgm) bgm.muted = !!(this.muted || this.musicMuted);
        } catch {}
    }

    // Apply the chosen character's stat modifiers once per run
    applyCharacterModifiers(key) {
        try {
            const def = this.characterDefs && this.characterDefs[key];
            if (def && typeof def.apply === 'function') {
                def.apply(this);
            }
        } catch (e) {
            console.warn('applyCharacterModifiers failed', e);
        }
    }

    // Visually emphasize selected buttons on character/element pickers
    updateSelectStyles() {
        try {
            const selGlow = '0 0 14px currentColor, inset 0 0 10px rgba(255,255,255,0.08)';
            const clearBtn = (btn) => {
                btn.style.boxShadow = '';
                btn.style.transform = '';
                btn.style.opacity = '';
            };
            const setSel = (btn) => {
                btn.style.boxShadow = selGlow;
                btn.style.transform = 'translateY(-1px)';
                btn.style.opacity = '1';
            };

            document.querySelectorAll('.char-btn').forEach(btn => {
                if (btn.classList.contains('selected')) setSel(btn); else clearBtn(btn);
            });
            document.querySelectorAll('.element-btn').forEach(btn => {
                if (btn.classList.contains('selected')) setSel(btn); else clearBtn(btn);
            });
        } catch (e) {
            // Non-fatal visual helper
        }
    }

    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        this.applyMusicMute();
    }

    // --- WebAudio: init and helpers ---
    initAudio() {
        if (this.audioCtx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
            this.masterGain = this.audioCtx.createGain();
            this.sfxGain = this.audioCtx.createGain();
            this.musicGain = this.audioCtx.createGain();
            this.sfxFilter = this.audioCtx.createBiquadFilter();
            this.sfxFilter.type = 'lowpass';
            this.sfxFilter.frequency.setValueAtTime(1800, this.audioCtx.currentTime);
            this.sfxFilter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);
            this.sfxGain.connect(this.sfxFilter);
            this.sfxFilter.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(this.audioCtx.destination);
            this.sfxGain.gain.value = 0.45;
            this.musicGain.gain.value = 0.15;
            // Apply runtime settings if available
            try { this.applyAudioSettings && this.applyAudioSettings(); this.applyMusicMute && this.applyMusicMute(); } catch(_) {}
        } catch (e) {
            console.warn('WebAudio init failed', e);
        }
    }

    // Keep both settings panel and in-game pause sliders/labels synced
    updateVolumeUI() {
        try {
            const s = this.settings || { masterVolume: 1, musicVolume: (this.musicVolume ?? 0.15) };
            // Main settings panel
            const mv = document.getElementById('masterVolume');
            const mvLbl = document.getElementById('masterVolumeVal');
            if (mv && !mv.__active) mv.value = s.masterVolume ?? 1;
            if (mvLbl && !(mv && mv.__active)) mvLbl.textContent = Math.round((s.masterVolume ?? 1) * 100) + '%';
            const muc = document.getElementById('musicVolume');
            const mucLbl = document.getElementById('musicVolumeVal');
            if (muc && !muc.__active) muc.value = s.musicVolume ?? (this.musicVolume ?? 0.15);
            if (mucLbl && !(muc && muc.__active)) mucLbl.textContent = Math.round((s.musicVolume ?? (this.musicVolume ?? 0.15)) * 100) + '%';
            // In-game pause panel
            const vol = document.getElementById('volumeRange');
            const volLbl = document.getElementById('volumeValue');
            if (vol && !vol.__active) vol.value = s.masterVolume ?? 1;
            if (volLbl && !(vol && vol.__active)) volLbl.textContent = Math.round((s.masterVolume ?? 1) * 100) + '%';
            const mvol = document.getElementById('musicVolumeRange');
            const mvolLbl = document.getElementById('musicVolumeValueIngame');
            if (mvol && !mvol.__active) mvol.value = s.musicVolume ?? (this.musicVolume ?? 0.15);
            if (mvolLbl && !(mvol && mvol.__active)) mvolLbl.textContent = Math.round((s.musicVolume ?? (this.musicVolume ?? 0.15)) * 100) + '%';
        } catch(_) {}
    }

    // Apply audio settings to WebAudio and HTML BGM
    applyAudioSettings() {
        try {
            const s = this.settings || { soundMuted:false, masterVolume:1, musicMuted:false, musicVolume:0.15 };
            // Master affects everything
            if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, (s.soundMuted ? 0 : 1) * (s.masterVolume ?? 1)));
            // Music gain separate
            if (this.musicGain) this.musicGain.gain.value = Math.max(0, Math.min(1, (s.musicMuted ? 0 : 1) * (s.musicVolume ?? 0.15)));
            // HTML BGM element, if present
            const bgm = document.getElementById('bgm');
            if (bgm) {
                bgm.volume = Math.max(0, Math.min(1, s.musicVolume ?? 0.15));
                bgm.muted = !!(s.musicMuted || s.soundMuted);
            }
        } catch(_) {}
        try { this.updateVolumeUI && this.updateVolumeUI(); } catch(_) {}
    }

    applyMusicMute() {
        try {
            const s = this.settings || { musicMuted:false };
            // If you implement an always-running procedural music, just set musicGain accordingly
            if (this.musicGain) this.musicGain.gain.value = Math.max(0, Math.min(1, s.musicMuted ? 0 : (this.settings?.musicVolume ?? 0.15)));
            const bgm = document.getElementById('bgm');
            if (bgm) bgm.muted = !!s.musicMuted;
        } catch(_) {}
    }

    applyControlSettings() {
        try {
            const s = this.settings || { mouseSensitivity:1, fovDesktop:90 };
            this.mouseSensitivityFactor = s.mouseSensitivity ?? 1;
            this.fovDegrees = s.fovDesktop ?? 90;
        } catch(_) {}
    }

    resumeAudioContext() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playBeep({ freq = 440, duration = 0.12, type = 'sine', gain = 0.4 } = {}) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        g.gain.setValueAtTime(0, this.audioCtx.currentTime);
        g.gain.linearRampToValueAtTime(gain * 0.8, this.audioCtx.currentTime + 0.03);
        g.gain.linearRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration + 0.02);
    }

    playClick() { this.playBeep({ freq: 520, duration: 0.07, type: 'square', gain: 0.24 }); }
    playHover() { this.playBeep({ freq: 740, duration: 0.04, type: 'triangle', gain: 0.16 }); }

    playAbilitySound(element) {
        if (!this.audioCtx) return;
        switch (element) {
            case 'fire':
                // Rising saw beep
                this.playBeep({ freq: 380, duration: 0.08, type: 'sawtooth', gain: 0.28 });
                setTimeout(() => this.playBeep({ freq: 540, duration: 0.09, type: 'sawtooth', gain: 0.28 }), 70);
                break;
            case 'water':
                // Droplet sine descending
                this.playBeep({ freq: 900, duration: 0.06, type: 'sine', gain: 0.22 });
                setTimeout(() => this.playBeep({ freq: 600, duration: 0.08, type: 'sine', gain: 0.22 }), 60);
                break;
            case 'air':
                // Whoosh triangle quick
                this.playBeep({ freq: 680, duration: 0.05, type: 'triangle', gain: 0.24 });
                setTimeout(() => this.playBeep({ freq: 1020, duration: 0.05, type: 'triangle', gain: 0.2 }), 45);
                break;
            default:
                this.playBeep({ freq: 500, duration: 0.08, type: 'sine', gain: 0.22 });
        }
    }

    playCountdownTick() {
        // Short urgent tick
        this.playBeep({ freq: 1200, duration: 0.05, type: 'square', gain: 0.22 });
    }

    // --- Additional SFX helpers ---
    playPickupXP() { this.playBeep({ freq: 980, duration: 0.05, type: 'triangle', gain: 0.18 }); }
    playPickupMat() { this.playBeep({ freq: 680, duration: 0.06, type: 'square', gain: 0.2 }); }
    // Shooting SFX disabled per request
    playShoot() { return; }
    // Damage-related SFX disabled per request (keep only shooting sound)
    playHit() { return; }
    playKill() { return; }
    playPlayerHurt() { return; }
    playWaveStart() { this.playBeep({ freq: 700, duration: 0.08, type: 'triangle', gain: 0.26 }); }
    playWaveEnd() { this.playBeep({ freq: 440, duration: 0.09, type: 'sine', gain: 0.22 }); }
    playPurchase(ok=true) { ok ? this.playBeep({ freq: 860, duration: 0.06, type: 'triangle', gain: 0.22 }) : this.playBeep({ freq: 260, duration: 0.09, type: 'sine', gain: 0.22 }); }
    playReroll() { this.playBeep({ freq: 520, duration: 0.05, type: 'square', gain: 0.22 }); }
    playError() { this.playBeep({ freq: 220, duration: 0.12, type: 'sine', gain: 0.26 }); }

    startMusic() {
        if (!this.audioCtx) return;
        if (this.musicTimer) return;
        // Simple arpeggio loop
        const scale = [220, 277, 330, 415, 494, 660];
        let i = 0;
        this.musicTimer = setInterval(() => {
            if (!this.audioCtx) return;
            const f = scale[i % scale.length];
            i++;
            const osc = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, this.audioCtx.currentTime);
            g.gain.setValueAtTime(0, this.audioCtx.currentTime);
            g.gain.linearRampToValueAtTime(0.18, this.audioCtx.currentTime + 0.02);
            g.gain.linearRampToValueAtTime(0.0, this.audioCtx.currentTime + 0.32);
            osc.connect(g); g.connect(this.musicGain);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.36);
        }, 380);
    }

    stopMusic() {
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }

    // Cursor visibility helper
    setCursorVisible(visible) {
        if (this.canvas && this.canvas.style) {
            this.canvas.style.cursor = visible ? 'default' : 'none';
        }
    }

    // Visualize moving fire beams as a vertical fiery bar that moves horizontally
    drawFireBeams() {
        if (!this.fireBeams || this.fireBeams.length === 0) return;
        for (const b of this.fireBeams) {
            // Compute visual center along horizontal movement so the bar's long axis is vertical
            const center = b.pos.plusNew(b.dir.multiplyNew(b.length * 0.5));
            const cx = center.x - this.camera.x;
            const cy = center.y - this.camera.y;
            const halfH = b.length * 0.5;
            const halfW = b.thickness * 0.5;
            this.ctx.save();
            const t = Date.now() * 0.006;
            const flicker = 1 + 0.12 * Math.sin(t + (center.x + center.y) * 0.002);
            // Outer glow (vertical rounded-rect)
            this.ctx.fillStyle = 'rgba(255,120,60,0.25)';
            this._fillRoundedRect(cx - halfW * 1.8 * flicker, cy - halfH, halfW * 3.6 * flicker, b.length, Math.min(halfW * 1.8, 12));
            // Mid flame gradient (vertical)
            const grad = this.ctx.createLinearGradient(cx, cy - halfH, cx, cy + halfH);
            grad.addColorStop(0, 'rgba(255,170,60,0.95)');
            grad.addColorStop(1, 'rgba(255,90,30,0.95)');
            this.ctx.fillStyle = grad;
            this._fillRoundedRect(cx - halfW * 0.9 * flicker, cy - halfH, halfW * 1.8 * flicker, b.length, Math.min(halfW, 10));
            // Bright core
            const core = this.ctx.createLinearGradient(cx, cy - halfH, cx, cy + halfH);
            core.addColorStop(0, 'rgba(255,240,180,0.95)');
            core.addColorStop(1, 'rgba(255,170,80,0.95)');
            this.ctx.fillStyle = core;
            this._fillRoundedRect(cx - Math.max(2, halfW * 0.45), cy - halfH, Math.max(4, halfW * 0.9), b.length, Math.min(halfW * 0.7, 8));
            this.ctx.restore();
        }
    }

    init() {
        this.setupCanvas();
        this.registerEvents();
        this.bindLanguageButtons();
        // Initialize settings storage and apply
        try {
            if (!this.settings) {
                this.settings = { soundMuted:false, musicMuted:false, masterVolume:1, musicVolume:0.15, mouseSensitivity:1, fovDesktop:90 };
                try {
                    const persisted = JSON.parse(localStorage.getItem('elementist_settings') || '{}');
                    if (persisted && typeof persisted === 'object') Object.assign(this.settings, persisted);
                } catch(_) {}
                // One-time clamp: if previous sessions stored a higher musicVolume, cap at 0.15 by default
                try {
                    if (typeof this.settings.musicVolume !== 'number' || this.settings.musicVolume > 0.15) {
                        this.settings.musicVolume = 0.15;
                    }
                } catch(_) {}
                this.saveSettings = () => { try { localStorage.setItem('elementist_settings', JSON.stringify(this.settings)); } catch(_) {} };
                // Persist clamped defaults immediately
                try { this.saveSettings(); } catch(_) {}
            }
            this.applyControlSettings && this.applyControlSettings();
            this.applyAudioSettings && this.applyAudioSettings();
        } catch(_) {}
        this.applyLanguage();
        this.createOrbs();
        this.createAIBots();
        if (this.gameMode !== 'brotato') this.createTowers();
        else this.towers = [];
        // prepare shop UI for brotato mode
        this.setupShopUI && this.setupShopUI();
        // (no skill select overlay in this mode)
        // Show cursor by default at startup (menus visible)
        this.setCursorVisible(true);
        // Prepare audio early; actual start after user interaction
        this.initAudio();
        // Touch controls
        this.setupTouchControls();
        // Add body.touch class for mobile-specific CSS rules
        try { if (this.usingTouch) document.body.classList.add('touch'); } catch {}

        // Ensure in-game pause sliders are bound once and reflect current settings
        try {
            const bindIngameVolumeSliders = () => {
                const s = this.settings || { masterVolume: 1, musicVolume: (this.musicVolume ?? 0.15) };
                const vol = document.getElementById('volumeRange');
                const volLbl = document.getElementById('volumeValue');
                if (vol) {
                    vol.value = s.masterVolume ?? 1;
                    if (volLbl) volLbl.textContent = Math.round((s.masterVolume ?? 1) * 100) + '%';
                    try { this.bindSliderActive && this.bindSliderActive(vol); } catch(_) {}
                    if (!vol.__bound) {
                        vol.addEventListener('input', () => {
                            const v = Math.max(0, Math.min(1, parseFloat(vol.value) || 0));
                            if (!this.settings) this.settings = {};
                            this.settings.masterVolume = v;
                            if (volLbl) volLbl.textContent = Math.round(v * 100) + '%';
                            try { this.saveSettings && this.saveSettings(); } catch(_) {}
                            try { this.applyAudioSettings && this.applyAudioSettings(); } catch(_) {}
                        });
                        vol.__bound = true;
                    }
                }
                const mvol = document.getElementById('musicVolumeRange');
                const mvolLbl = document.getElementById('musicVolumeValueIngame');
                if (mvol) {
                    mvol.value = s.musicVolume ?? (this.musicVolume ?? 0.15);
                    if (mvolLbl) mvolLbl.textContent = Math.round((s.musicVolume ?? (this.musicVolume ?? 0.15)) * 100) + '%';
                    try { this.bindSliderActive && this.bindSliderActive(mvol); } catch(_) {}
                    if (!mvol.__bound) {
                        mvol.addEventListener('input', () => {
                            const v = Math.max(0, Math.min(1, parseFloat(mvol.value) || 0));
                            if (!this.settings) this.settings = {};
                            this.settings.musicVolume = v;
                            if (mvolLbl) mvolLbl.textContent = Math.round(v * 100) + '%';
                            try { this.saveSettings && this.saveSettings(); } catch(_) {}
                            try { this.applyAudioSettings && this.applyAudioSettings(); } catch(_) {}
                        });
                        mvol.__bound = true;
                    }
                }
            };
            // Bind now and when menu visibility toggles
            bindIngameVolumeSliders();
            const menu = document.getElementById('inGameMenu');
            if (menu && !menu.__observerAttached) {
                try {
                    const mo = new MutationObserver(() => {
                        try { this.updateVolumeUI && this.updateVolumeUI(); } catch(_) {}
                        bindIngameVolumeSliders();
                    });
                    mo.observe(menu, { attributes: true, attributeFilter: ['style', 'class'] });
                    menu.__observerAttached = true;
                } catch(_) {}
            }
        } catch(_) {}

        try { this.updateVolumeUI && this.updateVolumeUI(); } catch(_) {}
        this.gameLoop();
    }
    
    update(deltaTime) {
        if (!this.player) return;
        // If paused, skip simulation but keep UI fresh
        if (this.paused) {
            // Safety: if menu is not visible but paused is true, auto-unpause
            const menu = document.getElementById('inGameMenu');
            if (menu && (menu.style.display === 'none' || menu.style.display === '')) {
                this.paused = false;
            } else {
                try { this.updateVolumeUI && this.updateVolumeUI(); } catch(_) {}
                this.updateLeaderboard();
                this.updateUI();
                return;
            }
        }

        // Check if shop overlay is open to freeze movement globally
        const shopOverlay = document.getElementById('shopOverlay');
        const shopOpen = !!(shopOverlay && shopOverlay.style.display && shopOverlay.style.display !== 'none');
        // Track entering/leaving shop to capture freeze position
        if (shopOpen && this.player) {
            if (!this.inShop) {
                this.shopFreezePos = new Vector2(this.player.pos.x, this.player.pos.y);
            }
            this.inShop = true;
        } else {
            this.inShop = false;
            this.shopFreezePos = this.shopFreezePos; // keep last for safety; will be ignored
        }

        // Brotato wave system
        if (this.gameMode === 'brotato') {
            // Intermission: freeze player until wave starts
            if (this.inWave && !shopOpen) {
                this.updatePlayer(deltaTime);
            } else if (this.player && shopOpen) {
                this.player.velocity = new Vector2(0, 0);
            }
            this.updateBrotato(deltaTime);
            // Boss logic
            if (this.inWave && this.waveNumber === 5) this.updateBoss5(deltaTime);
            if (this.inWave && this.waveNumber === 10) this.updateBoss10(deltaTime);
            if (this.inWave && this.waveNumber === 15) this.updateBoss15(deltaTime);
            if (this.inWave && this.waveNumber === 20) this.updateBoss(deltaTime);
        } else {
            // Classic mode update
            if (!shopOpen) {
                this.updatePlayer(deltaTime);
            } else if (this.player) {
                this.player.velocity = new Vector2(0, 0);
            }
            this.updateOrbs(deltaTime);
            this.updateAIBots(deltaTime);
            this.updateProjectiles(deltaTime);
            // Boss logic (classic)
            if (this.inWave && this.waveNumber === 5) {
                this.updateBoss5(deltaTime);
            }
            if (this.inWave && this.waveNumber === 10) {
                this.updateBoss10(deltaTime);
            }
            if (this.inWave && this.waveNumber === 15) {
                this.updateBoss15(deltaTime);
            }
            // Wave 20 boss logic
            if (this.inWave && this.waveNumber === 20) {
                this.updateBoss(deltaTime);
            }
        }

        // Enforce hard freeze of player position while in shop (prevents collisions/forces from moving player)
        if (this.inShop && this.player && this.shopFreezePos) {
            this.player.pos.x = this.shopFreezePos.x;
            this.player.pos.y = this.shopFreezePos.y;
            this.player.velocity = new Vector2(0, 0);
        }

        // Passive effects: regen and aura damage
        const p = this.player;
        if (p) {
            // HP regen
            if (p.regen && p.regen > 0 && p.hp > 0) {
                p.hp = Math.min(p.maxHP || 100, p.hp + (p.regen * deltaTime / 1000));
            }
            // Aura DPS vs nearby bots
            if (p.auraDps && p.auraDps > 0) {
                const radius = p.auraRadius || 120;
                for (const b of (this.aiBots || [])) {
                    const d = p.pos.minusNew(b.pos).magnitude();
                    if (d <= radius) {
                        b.hp = Math.max(0, b.hp - (p.auraDps * deltaTime / 1000));
                        if (b.hp <= 0) {
                            const idx = this.aiBots.indexOf(b);
                            if (idx >= 0) this.aiBots.splice(idx, 1);
                            this.score += 200;
                            // Combo: player aura kill
                            try {
                                p.comboCount = (p.comboCount || 0) + 1;
                                const nowC = Date.now();
                                p.comboExpireAt = nowC + (this.comboWindowMs || 3000);
                                p.comboLastIncAt = nowC; // for pop animation
                            } catch(_) {}
                            if (p.onKillHeal && p.onKillHeal > 0) {
                                p.hp = Math.min(p.maxHP || 100, p.hp + p.onKillHeal);
                            }
                            // SFX: kill via aura
                            this.playKill();
                            // Create drop in Brotato mode
                            if (this.gameMode === 'brotato') {
                                // Materials-only drop. Chance by size: 15 -> 30%, 19 -> 100%.
                                const isBig = (b.size === 19);
                                const matChance = isBig ? 1.0 : 0.3;
                                if (Math.random() < matChance) {
                                    const amountBase = 1 + Math.floor((this.waveNumber || 1) * 0.25);
                                    const bonus = Math.random() < 0.2 ? 1 : 0; // 20% chance +1
                                    const drop = {
                                        pos: b.pos.clone(),
                                        type: 'mat',
                                        amount: Math.max(1, amountBase) + bonus,
                                        vel: new Vector2((Math.random()-0.5)*60, (Math.random()-0.5)*60)
                                    };
                                    this.drops.push(drop);
                                }
                                // 40% chance to drop a Magnet consumable; guaranteed by Wave 6 via force flag
                                const w = Math.max(1, this.waveNumber|0);
                                const chance = Math.min(1.0, 0.40 + 0.10 * (Math.min(w, 6) - 1));
                                const wantMagnet = (Math.random() < chance) || this.forceMagnetDrop;
                                if (wantMagnet) {
                                    this.drops.push({ pos: b.pos.clone(), type: 'consum', id: 'magnet_core', icon: '🧲', amount: 1, vel: new Vector2((Math.random()-0.5)*60, (Math.random()-0.5)*60) });
                                    this.magnetConsumablesGiven = (this.magnetConsumablesGiven|0) + 1;
                                    this.forceMagnetDrop = false;
                                }
                            }
                        }
                    }
                }
            }
        }

        // Ability cooldown (common to all modes)
        if (this.abilityCooldown > 0) {
            this.abilityCooldown -= deltaTime;
            const textEl = document.getElementById('cooldownText');
            if (textEl) textEl.textContent = Math.max(0, Math.ceil(this.abilityCooldown / 1000));
            if (this.abilityCooldown <= 0) {
                this.abilityCooldown = 0;
                this.abilityReady = true;
                const overlay = document.getElementById('cooldownOverlay');
                if (overlay) overlay.style.display = 'none';
                // On ability ready, show a brief tip (throttled)
                try {
                    const now = Date.now();
                    if (!this._lastAbilityReadyToastAt || now - this._lastAbilityReadyToastAt > 6000) {
                        this.showTopTip && this.showTopTip((this && typeof this.t==='function') ? this.t('abilityIconTitleShift') : 'Yetenek hazır (Shift)');
                        this._lastAbilityReadyToastAt = now;
                    }
                } catch(_) {}
            }
        }
    }

    // Setup canvas sizing and mouse tracking
    setupCanvas() {
        const resize = () => {
            // Wider field of view on touch devices by increasing backing store size
            const mobileZoomOut = this.usingTouch ? 1.35 : 1.0; // increase for more FOV on mobile
            const vw = (window.visualViewport && window.visualViewport.width) ? window.visualViewport.width : window.innerWidth;
            const vh = (window.visualViewport && window.visualViewport.height) ? window.visualViewport.height : window.innerHeight;
            const targetW = Math.max(1, Math.round(vw * mobileZoomOut));
            const targetH = Math.max(1, Math.round(vh * mobileZoomOut));
            this.canvas.width = targetW;
            this.canvas.height = targetH;
            // Keep CSS size equal to viewport so it fits the screen while showing more world
            this.canvas.style.width = vw + 'px';
            this.canvas.style.height = vh + 'px';
        };
        window.addEventListener('resize', resize);
        resize();
        // Track mouse for movement
        window.addEventListener('mousemove', (e) => {
            this.mouse = new Vector2(e.clientX, e.clientY);
        });
    }
    
    // Draw an enemy based on its shape string; falls back to wave rules if shape missing
    drawEnemyShape(screenPos, size, shape, waveNumber) {
        const s = (typeof shape === 'string' && shape) ? shape.toLowerCase() : null;
        const ctx = this.ctx;
        // Try to use Characters menu visual renderer for consistency
        try {
            if (window.drawCharacterIconOnCtx && s) {
                // Pass an explicit in-game flag so the enhanced renderer can apply 2x scaling only for this path
                const roleOrShapeWithFlag = s + '|ingame';
                // size here is typically radius; render square of approx diameter
                const ok = window.drawCharacterIconOnCtx(ctx, roleOrShapeWithFlag, screenPos.x, screenPos.y, Math.max(8, Math.floor(size * 2)));
                if (ok) return;
            }
        } catch(_) { }
        ctx.beginPath();
        switch (s) {
            case 'triangle-fast':
                this._drawTriangleFast(screenPos, size);
                break;
            case 'hexagon':
                this._drawRegularPolygon(screenPos, size, 6);
                break;
            case 'bolt':
                this._drawBolt(screenPos, size);
                break;
            case 'spider':
                this._drawSpider(screenPos, size);
                break;
            case 'rifle':
            case 'long-rifle':
                this._drawRifle(screenPos, size);
                break;
            case 'cloak':
                this._drawCloak(screenPos, size);
                break;
            case 'block':
            case 'square':
                this._drawBlock(screenPos, size);
                break;
            case 'amoeba':
                this._drawAmoeba(screenPos, size);
                break;
            case 'triangle':
                this._drawTriangle(screenPos, size);
                break;
            case 'star':
                this._drawStar(screenPos, size);
                break;
            case 'diamond':
                this._drawRegularPolygon(screenPos, size, 4, Math.PI/4);
                break;
            case 'circle':
                ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
                break;
            default: {
                // Fallback to wave-based shapes to preserve old behavior
                const fallback = (waveNumber === 10) ? 'triangle' : (waveNumber === 20 ? 'star' : 'circle');
                if (fallback === 'triangle') this._drawTriangle(screenPos, size);
                else if (fallback === 'star') this._drawStar(screenPos, size);
                else ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
                break;
            }
        }
        ctx.fill();
        ctx.stroke();
    }

    // Helpers produce only path outlines; caller handles fill/stroke
    _drawRegularPolygon(p, r, n, rot=0) {
        const ctx = this.ctx;
        for (let i = 0; i < n; i++) {
            const a = rot + (i/n) * Math.PI * 2;
            const x = p.x + Math.cos(a) * r;
            const y = p.y + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    _drawTriangle(p, r) {
        const ctx = this.ctx;
        const a0 = -Math.PI/2;
        const pts = [0,1,2].map(i=>({
            x: p.x + Math.cos(a0 + i*2*Math.PI/3) * r,
            y: p.y + Math.sin(a0 + i*2*Math.PI/3) * r,
        }));
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
    }

    // Fast triangle variant: slimmer, with a notch to differentiate from shooter
    _drawTriangleFast(p, r) {
        const ctx = this.ctx;
        const a0 = -Math.PI/2;
        const scaleX = 0.85; // slimmer profile
        const pts = [0,1,2].map(i=>({
            x: p.x + Math.cos(a0 + i*2*Math.PI/3) * r * (i===0?1:scaleX),
            y: p.y + Math.sin(a0 + i*2*Math.PI/3) * r,
        }));
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        // inner notch line (visual cue)
        ctx.moveTo(p.x, p.y - r*0.45);
        ctx.lineTo(p.x, p.y - r*0.05);
    }

    _drawStar(p, r) {
        const ctx = this.ctx;
        const spikes = 5;
        const outer = r;
        const inner = r * 0.45;
        let rot = -Math.PI/2;
        let step = Math.PI / spikes;
        let x = p.x, y = p.y;
        ctx.moveTo(p.x, p.y - outer);
        for (let i = 0; i < spikes; i++) {
            x = p.x + Math.cos(rot) * outer;
            y = p.y + Math.sin(rot) * outer;
            ctx.lineTo(x, y);
            rot += step;
            x = p.x + Math.cos(rot) * inner;
            y = p.y + Math.sin(rot) * inner;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.closePath();
    }

    _drawBolt(p, r) {
        const ctx = this.ctx;
        const w = r * 1.0, h = r * 1.6;
        const pts = [
            {x:p.x - w*0.4, y:p.y - h*0.5},
            {x:p.x + w*0.1, y:p.y - h*0.5},
            {x:p.x - w*0.05, y:p.y - h*0.05},
            {x:p.x + w*0.45, y:p.y - h*0.05},
            {x:p.x + w*0.0, y:p.y + h*0.5},
            {x:p.x - w*0.2, y:p.y + h*0.1},
        ];
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
    }

    _drawSpider(p, r) {
        const ctx = this.ctx;
        // Body
        ctx.arc(p.x, p.y, r*0.7, 0, Math.PI*2);
        // Legs (stroke only, overdraw acceptable)
        const legs = 6;
        for (let i=0;i<legs;i++) {
            const a = -Math.PI/2 + i*(Math.PI/(legs-1));
            const lx = p.x + Math.cos(a) * r * 1.3;
            const ly = p.y + Math.sin(a) * r * 1.3;
            ctx.moveTo(p.x + Math.cos(a)*r*0.7, p.y + Math.sin(a)*r*0.7);
            ctx.lineTo(lx, ly);
        }
    }

    _drawRifle(p, r) {
        const ctx = this.ctx;
        const w = r * 1.8, h = r * 0.5;
        // Add a small diamond base to make the sniper visually distinct
        const d = r * 0.9;
        const diamond = [
            {x: p.x,       y: p.y - d*0.6},
            {x: p.x + d*0.6, y: p.y},
            {x: p.x,       y: p.y + d*0.6},
            {x: p.x - d*0.6, y: p.y}
        ];
        ctx.moveTo(diamond[0].x, diamond[0].y);
        for (let i=1;i<diamond.length;i++) ctx.lineTo(diamond[i].x, diamond[i].y);
        ctx.closePath();
        // Main body rectangle
        ctx.moveTo(p.x - w*0.5, p.y - h*0.5);
        ctx.rect(p.x - w*0.5, p.y - h*0.5, w*0.8, h);
        // Barrel polygon
        ctx.moveTo(p.x + w*0.3, p.y - h*0.35);
        ctx.lineTo(p.x + w*0.95, p.y - h*0.1);
        ctx.lineTo(p.x + w*0.95, p.y + h*0.1);
        ctx.lineTo(p.x + w*0.3, p.y + h*0.35);
        ctx.closePath();
    }

    _drawCloak(p, r) {
        const ctx = this.ctx;
        const top = {x:p.x, y:p.y - r};
        const left = {x:p.x - r*0.9, y:p.y + r*0.5};
        const right = {x:p.x + r*0.9, y:p.y + r*0.5};
        ctx.moveTo(top.x, top.y);
        ctx.quadraticCurveTo(p.x - r*0.6, p.y, left.x, left.y);
        ctx.quadraticCurveTo(p.x, p.y + r*0.9, right.x, right.y);
        ctx.quadraticCurveTo(p.x + r*0.6, p.y, top.x, top.y);
        ctx.closePath();
    }

    _drawBlock(p, r) {
        const ctx = this.ctx;
        const s = r * 1.2;
        ctx.rect(p.x - s/2, p.y - s/2, s, s);
    }

    _drawAmoeba(p, r) {
        const ctx = this.ctx;
        const bumps = 6;
        for (let i=0;i<=bumps;i++) {
            const a = -Math.PI + i*(2*Math.PI/bumps);
            const rr = r * (0.8 + 0.25*Math.sin(i*1.7));
            const x = p.x + Math.cos(a) * rr;
            const y = p.y + Math.sin(a) * rr;
            if (i===0) ctx.moveTo(x,y); else ctx.quadraticCurveTo((p.x+x)/2, (p.y+y)/2, x, y);
        }
        ctx.closePath();
    }

    // Activate a quick dodge/dash with brief invulnerability
    triggerDodge() {
        if (!this.player) return;
        if (this.dodgeCooldown > 0) return;
        // Prevent dodge when paused or in shop freeze
        if (this.paused || this.inShop) return;
        // Determine dash direction (fallback to last move or forward)
        let dir = null;
        if (this.usingTouch) {
            const v = this.joystick.vec;
            if (v && (Math.abs(v.x) > 1e-4 || Math.abs(v.y) > 1e-4)) {
                const mag = Math.max(1e-6, Math.sqrt(v.x*v.x + v.y*v.y));
                dir = new Vector2(v.x / mag, v.y / mag);
            }
        } else {
            // From current keyboard input
            let dx = 0, dy = 0;
            if (this.keys.w || this.keys.ArrowUp) dy -= 1;
            if (this.keys.s || this.keys.ArrowDown) dy += 1;
            if (this.keys.a || this.keys.ArrowLeft) dx -= 1;
            if (this.keys.d || this.keys.ArrowRight) dx += 1;
            if (dx !== 0 || dy !== 0) {
                const mag = Math.max(1e-6, Math.sqrt(dx*dx + dy*dy));
                dir = new Vector2(dx / mag, dy / mag);
            }
        }
        if (!dir) {
            if (this.lastMoveDir && (this.lastMoveDir.x !== 0 || this.lastMoveDir.y !== 0)) dir = this.lastMoveDir.clone();
            else dir = new Vector2(1, 0);
        }
        this.dodgeDir = dir.clone();
        this.isDodging = true;
        this.dodgeTimer = 220;       // ms
        this.dodgeCooldown = 900;    // ms cooldown
        const now = Date.now();
        this.dodgeInvulnUntil = now + 200; // brief i-frames
        // Remember dash start position/time to filter any residual dot rendering
        try { this.lastDashStart = this.player.pos.clone(); this.lastDashStartAt = now; } catch(_) { this.lastDashStart = null; this.lastDashStartAt = 0; }
        // Small dash particles (disabled to prevent persistent start-dot)
    }

    // Determine current aim direction based on mouse position (primary),
    // then nearest bot, then current velocity as fallback.
    getAimDirection() {
        if (this.player) {
            const center = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
            const mouse = this.mouse || center;
            // If backing store > CSS size (mobile zoom-out), scale mouse to backing coordinates
            const cssW = this.canvas.clientWidth || window.innerWidth || this.canvas.width;
            const cssH = this.canvas.clientHeight || window.innerHeight || this.canvas.height;
            const scaleX = this.canvas.width / Math.max(1, cssW);
            const scaleY = this.canvas.height / Math.max(1, cssH);
            const scaledMouseX = mouse.x * scaleX;
            const scaledMouseY = mouse.y * scaleY;
            // Convert screen mouse to world coordinates
            const worldMouse = new Vector2(this.camera.x + scaledMouseX, this.camera.y + scaledMouseY);
            const toMouse = worldMouse.minusNew(this.player.pos);
            if (toMouse.magnitude() > 0.001) return toMouse.normalise();

            // Fallback: aim at nearest bot
            let nearest = null; let minD = Infinity;
            for (const b of (this.aiBots || [])) {
                const d = this.player.pos.minusNew(b.pos).magnitude();
                if (d < minD) { minD = d; nearest = b; }
            }
            if (nearest) return nearest.pos.minusNew(this.player.pos).normalise();

            // Fallback: current velocity
            const vel = this.player.velocity || new Vector2(1, 0);
            const mag = Math.max(1e-3, Math.sqrt(vel.x * vel.x + vel.y * vel.y));
            return new Vector2(vel.x / mag, vel.y / mag);
        }
        return new Vector2(1, 0);
    }

    // Update moving/expanding water rings and apply slow/damage effects
    updateWaterRings(dt) {
        const keep = [];
        for (const r of (this.waterRings || [])) {
            r.life -= dt;
            // Orbiting behavior for boss spokes (triangles): wobble + pulse + periodic shards
            if (r.mode === 'orbit') {
                // Determine orbit center (follow boss if provided)
                let c = r.orbitCenter;
                if (r.orbitBoss && (this.aiBots || []).includes(r.orbitBoss)) {
                    c = r.orbitBoss.pos;
                }
                // advance angle
                r.angle = (r.angle || 0) + (r.orbitAngVel || 0) * dt / 1000;
                // orbit radius wobble
                r.pulseT = (r.pulseT || 0) + dt;
                const baseR = r.orbitRadiusBase || r.orbitRadius || 120;
                const ampR = r.orbitRadiusAmp || 0;
                const orRad = baseR + ampR * Math.sin((r.pulseT * 0.006) + (r.angle || 0));
                const ox = Math.cos(r.angle) * orRad;
                const oy = Math.sin(r.angle) * orRad;
                r.pos.x = c.x + ox;
                r.pos.y = c.y + oy;
                // size pulse (visual)
                if (r.shape === 'triangle' && r.pulse !== false) {
                    r.baseRadius = r.baseRadius || r.radius;
                    const pulse = 1 + 0.12 * Math.sin(r.pulseT * 0.008 + (r.angle || 0));
                    r.radius = Math.max(10, r.baseRadius * pulse);
                }
                // periodic shard shots toward player during orbit
                if (r.allowShoot) {
                    r.shotCd = (r.shotCd != null ? r.shotCd : 600) - dt;
                    if (r.shotCd <= 0) {
                        const target = (this.player && this.player.pos) ? this.player.pos : c;
                        const d = target.minusNew(r.pos);
                        const m = Math.max(1e-3, Math.sqrt(d.x*d.x + d.y*d.y));
                        const dir = new Vector2(d.x/m, d.y/m);
                        const shard = {
                            pos: r.pos.clone ? r.pos.clone() : new Vector2(r.pos.x, r.pos.y),
                            radius: 20,
                            thickness: 0,
                            expandRate: 0,
                            life: 900,
                            moving: true,
                            dir: dir,
                            speed: 520,
                            dps: Math.max(1, Math.floor((this.weaponDamage != null ? this.weaponDamage : 12) * 3.24)),
                            slowFactor: 1.0,
                            fromBoss: true,
                            shape: 'triangle',
                            groupId: (r.groupId ? (r.groupId + '_shards') : undefined)
                        };
                        if (!this.waterRings) this.waterRings = [];
                        this.waterRings.push(shard);
                        r.shotCd = 600 + Math.random()*400; // reset cooldown
                    }
                }
            }
            if (r.moving) {
                r.pos.plusEq(r.dir.multiplyNew(r.speed * dt / 1000));
                // Bounce off playable zone walls for spinner triangles
                if (r.bounceWalls) {
                    const z = this.playZone || { x:0, y:0, width:(this.worldSize && this.worldSize.width)||2000, height:(this.worldSize && this.worldSize.height)||2000 };
                    const rad = r.radius || 0;
                    const minX = z.x + rad, maxX = z.x + z.width - rad;
                    const minY = z.y + rad, maxY = z.y + z.height - rad;
                    // X bounce
                    if (r.pos.x < minX) { r.pos.x = minX; if (r.dir) r.dir.x = Math.abs(r.dir.x); }
                    else if (r.pos.x > maxX) { r.pos.x = maxX; if (r.dir) r.dir.x = -Math.abs(r.dir.x); }
                    // Y bounce
                    if (r.pos.y < minY) { r.pos.y = minY; if (r.dir) r.dir.y = Math.abs(r.dir.y); }
                    else if (r.pos.y > maxY) { r.pos.y = maxY; if (r.dir) r.dir.y = -Math.abs(r.dir.y); }
                } else {
                    // Non-bouncing rings cannot cross walls: despawn if outside
                    const z = this.playZone || { x:0, y:0, width:(this.worldSize && this.worldSize.width)||2000, height:(this.worldSize && this.worldSize.height)||2000 };
                    const rad = r.radius || 0;
                    const minX = z.x + rad, maxX = z.x + z.width - rad;
                    const minY = z.y + rad, maxY = z.y + z.height - rad;
                    if (r.pos.x < minX || r.pos.x > maxX || r.pos.y < minY || r.pos.y > maxY) {
                        r.life = 0;
                    }
                }
            }
            // Continuous spin for spinner triangles
            if (r.rotVel) {
                r.rotAngle = (r.rotAngle || 0) + r.rotVel * dt / 1000;
            }
            r.radius += r.expandRate * dt / 1000;
            if (r.life <= 0) continue;
            const halfW = r.thickness * 0.5;
            for (const b of (this.aiBots || [])) {
                const d = r.pos.minusNew(b.pos).magnitude();
                // Affect entire interior area
                if (d <= r.radius + halfW) {
                    b.slowedUntil = Date.now() + 400;
                    b.slowFactor = r.slowFactor;
                    if (typeof b.hp === 'number') {
                        b.hp = Math.max(0, b.hp - (r.dps * dt / 1000));
                        if (b.hp <= 0) {
                            const idx = this.aiBots.indexOf(b);
                            if (idx >= 0) this.aiBots.splice(idx, 1);
                            this.score += 180;
                            this.updatePlayerHPFromScore && this.updatePlayerHPFromScore();
                        }
                    }
                }
            }
            // Boss-origin rings damage the player while inside the interior
            if (r.fromBoss && this.player) {
                const dp = r.pos.minusNew(this.player.pos).magnitude();
                if (dp <= r.radius + halfW) {
                    this.player.hp = Math.max(0, this.player.hp - (r.dps * dt / 1000));
                }
            }
            keep.push(r);
        }
        this.waterRings = keep;
    }

    // Visualize moving/expanding water rings
    drawWaterRings() {
        if (!this.waterRings || this.waterRings.length === 0) return;
        for (const r of this.waterRings) {
            const sp = new Vector2(r.pos.x - this.camera.x, r.pos.y - this.camera.y);
            this.ctx.save();
            if (r.shape === 'triangle') {
                // Triangle hazard rendering
                const size = r.radius; // base size
                const a0 = -Math.PI / 2; // point upward
                // Position and rotate around center if spinning
                this.ctx.translate(sp.x, sp.y);
                if (r.rotAngle) this.ctx.rotate(r.rotAngle);
                const p1 = new Vector2(Math.cos(a0) * size, Math.sin(a0) * size);
                const p2 = new Vector2(Math.cos(a0 + (2*Math.PI/3)) * size, Math.sin(a0 + (2*Math.PI/3)) * size);
                const p3 = new Vector2(Math.cos(a0 + (4*Math.PI/3)) * size, Math.sin(a0 + (4*Math.PI/3)) * size);
                // Fill with subtle amber glow
                this.ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.lineTo(p3.x, p3.y);
                this.ctx.closePath();
                this.ctx.fill();
                // Outline
                this.ctx.strokeStyle = 'rgba(255, 196, 64, 0.95)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.lineTo(p3.x, p3.y);
                this.ctx.closePath();
                this.ctx.stroke();
            } else {
                // Ring rendering (default)
                const inner = Math.max(0, r.radius - r.thickness * 0.5);
                const outer = r.radius + r.thickness * 0.5;
                const grad = this.ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, outer);
                grad.addColorStop(0, 'rgba(96,165,250,0.18)');
                grad.addColorStop(0.7, 'rgba(96,165,250,0.35)');
                grad.addColorStop(1, 'rgba(96,165,250,0.0)');
                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.arc(sp.x, sp.y, outer, 0, Math.PI*2);
                this.ctx.fill();
                // outline
                this.ctx.strokeStyle = r.fromBoss ? 'rgba(255, 196, 64, 0.95)' : 'rgba(125, 180, 255, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(sp.x, sp.y, r.radius, 0, Math.PI*2);
                this.ctx.stroke();
            }
            this.ctx.restore();
        }
    }

    drawDrops() {
        const t = Date.now() * 0.005;
        for (const dr of this.drops) {
            const screenX = dr.pos.x - this.camera.x;
            const screenY = dr.pos.y - this.camera.y;
            const isXP = dr.type === 'xp';
            const isMat = dr.type === 'mat';
            const isConsum = dr.type === 'consum';
            const pulse = 1 + 0.3 * (Math.sin(t + (dr.pos.x + dr.pos.y) * 0.001) * 0.5 + 0.5);
            const glowR = 20 * pulse;
            const coreR = 7 * pulse;
            const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowR);
            if (isConsum) {
                gradient.addColorStop(0, 'rgba(59,130,246,0.95)');
                gradient.addColorStop(1, 'rgba(59,130,246,0.0)');
            } else {
                gradient.addColorStop(0, 'rgba(245,158,11,0.95)');
                gradient.addColorStop(1, 'rgba(245,158,11,0.0)');
            }
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, glowR, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = isConsum ? '#60a5fa' : '#f59e0b';
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, coreR, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, coreR + 1, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.fillStyle = '#0a0a0a';
            this.ctx.font = `${Math.max(11, Math.floor(9 * pulse))}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            if (isConsum) this.ctx.fillText(dr.icon || '🧲', screenX, screenY);
            else this.ctx.fillText('$', screenX, screenY);
        }
    }

    // Register UI events (start screen selections and Start button)
    registerEvents() {
        // Element selection
        document.querySelectorAll('.element-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.element-btn').forEach(b=>b.classList.remove('selected'));
                btn.classList.add('selected');
                // Update ability icon preview immediately
                const elem = btn.getAttribute('data-element');
                const icon = document.getElementById('abilityIcon');
                const sym = document.getElementById('abilitySymbol');
                const colors = { fire: '#ff4444', water: '#00aaff', air: '#88ffcc' };
                const symbols = { fire: '🔥', water: '💧', air: '🌪️' };
                if (icon && sym) {
                    icon.style.borderColor = colors[elem] || '#ff4444';
                    icon.style.color = colors[elem] || '#ff4444';
                    sym.textContent = symbols[elem] || '🔥';
                }
                // Visual selected style
                this.updateSelectStyles();
            });
        });
        // Character selection
        document.querySelectorAll('.char-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.char-btn').forEach(b=>b.classList.remove('selected'));
                btn.classList.add('selected');
                const key = btn.getAttribute('data-char');
                if (key) this.selectedCharacter = key;
                this.playHover();
                // Visual selected style
                this.updateSelectStyles();
            });
        });
        // Color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b=>b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
        // Shape selection
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.shape-btn').forEach(b=>b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.isMobile()) this.requestFullscreenIfPossible();
                this.initAudio(); this.resumeAudioContext(); this.playClick();
                // Start HTML5 BGM with fixed volume (0.2) on user gesture
                try {
                    const bgm = document.getElementById('bgm');
                    if (bgm) {
                        bgm.volume = 0.15;
                        bgm.muted = !!(this.muted || this.musicMuted);
                        // Ensure loop is enabled before any playback
                        try { bgm.loop = true; } catch {}
                        // Bind a resilient ended-handler once (some platforms ignore loop attr)
                        if (!bgm._loopBound) {
                            bgm.addEventListener('ended', () => {
                                try { bgm.currentTime = 0; } catch {}
                                const tryPlay = () => bgm.play();
                                tryPlay().catch(()=>{});
                            });
                            bgm._loopBound = true;
                        }
                        // Do NOT start playing here; defer until after cutscene ends
                        try { bgm.pause(); } catch {}
                        bgm.currentTime = 0;
                    }
                } catch {}
                // Try to lock to landscape on mobile after user gesture
                if (this.isMobile() && screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(()=>{});
                }
                // Hide start screen and show element overlay
                const startScreen = document.getElementById('startScreen');
                if (startScreen) startScreen.style.display = 'none';
                const overlay = document.getElementById('elementSelectOverlay');
                if (overlay) overlay.style.display = 'block';
                // Keep cursor visible while selecting element
                this.setCursorVisible(true);

                // Ensure element description matches device (mobile vs desktop)
                try {
                    const elDescNode = document.getElementById('elementOverlayDesc');
                    if (elDescNode) elDescNode.textContent = this.t(this.isMobile() ? 'elementOverlayDescMobile' : 'elementOverlayDesc');
                } catch {}

                // Ensure default character is visually selected
                try {
                    const selKey = this.selectedCharacter || 'berserker';
                    const btn = document.querySelector(`.char-btn[data-char="${selKey}"]`);
                    if (btn && !btn.classList.contains('selected')) btn.classList.add('selected');
                } catch {}
                // Apply initial visual styles for selections
                this.updateSelectStyles();

                // Persist pre-selected name/color/shape from start screen
                const name = (document.getElementById('playerName')?.value || '').trim() || 'Elementist';
                let color = document.querySelector('.color-btn.selected')?.getAttribute('data-color') || '#00ffff';
                let shape = document.querySelector('.shape-btn.selected')?.getAttribute('data-shape') || 'circle';

                const choose = (elem) => {
                    // Create player at world center after choosing element
                    // Apply selected skin override if available
                    try {
                        const selRaw = localStorage.getItem('glowlings_selected_skin');
                        if (selRaw) {
                            const sel = JSON.parse(selRaw);
                            if (sel && (sel.color || sel.shape)) {
                                if (sel.color) color = sel.color;
                                if (sel.shape) shape = sel.shape;
                            }
                        }
                    } catch(_){ }
                    this.player = new Glowling(new Vector2(this.worldSize.width/2, this.worldSize.height/2), {
                        name, element: elem, color, shape
                    });
                    // Apply character modifiers now that player exists
                    this.applyCharacterModifiers(this.selectedCharacter);
                    // Turrets will unlock at Wave 4 (initialized in startNextWave)
                    // Ensure weapon skin selections exist (one per weapon)
                    try { this.ensureWeaponSkinSelections && this.ensureWeaponSkinSelections(); } catch(_) {}
                    this.gameState = 'playing';
                    this.syncBodyPlaying && this.syncBodyPlaying();
                    // Apply mobile zoom immediately
                    if (this.isMobile()) this.resizeCanvas();
                    this.updateTouchControlsVisibility();

                    // Close element select overlay immediately
                    if (overlay) overlay.style.display = 'none';

                    // Define proceed-to-shop flow (what used to happen immediately)
                    const proceedToShop = () => {
                        try {
                            const gameUI = document.getElementById('gameUI');
                            if (gameUI) gameUI.style.display = 'block';
                            const timer = document.getElementById('timer');
                            if (timer) timer.style.display = 'block';
                            const leaderboard = document.getElementById('leaderboard');
                            if (leaderboard) leaderboard.style.display = 'block';
                            const ability = document.querySelector('.ability-cooldown');
                            if (ability) ability.style.display = 'block';
                        } catch {}
                        // Hide cursor for gameplay
                        this.setCursorVisible(false);
                        this.updateAbilityIcon();
                        // Brotato: open shop first (intermission) until player starts wave
                        if (this.gameMode === 'brotato') {
                            this.inWave = false;
                            // First upgrade timing optimization: 10% faster for first wave only
                            const isFirstWave = this.waveNumber === 0;
                            this.intermissionTimer = isFirstWave ? 9000 : 10000; // 9s instead of 10s for first wave
                            this.updateShopCounters();
                            // Ensure shop offers match chosen element
                            this.refreshShopItems && this.refreshShopItems();
                            // Shop open -> show cursor
                            this.setCursorVisible(true);
                            try {
                                const overlay = document.getElementById('shopOverlay');
                                if (overlay) overlay.style.display = 'block';
                                if (document && document.body && document.body.classList) document.body.classList.add('shop-open');
                                // Position consumable bar under the shop box
                                try { this.attachConsumableBarUnderShop && this.attachConsumableBarUnderShop(); } catch(_) {}
                            } catch {}
                        }
                    };

                    // Show cutscene overlay and play video, then proceed to shop
                    try {
                        const cs = document.getElementById('cutsceneOverlay');
                        const video = document.getElementById('cutsceneVideo');
                        const skip = document.getElementById('cutsceneSkipBtn');
                        if (cs && video) {
                            // Ensure skip button label reflects current language
                            try {
                                if (skip) {
                                    const label = (this && typeof this.t === 'function') ? this.t('close') : 'CLOSE';
                                    // Remove stray text nodes to avoid duplicates
                                    Array.from(skip.childNodes).forEach(n => { if (n.nodeType === Node.TEXT_NODE) skip.removeChild(n); });
                                    skip.textContent = label;
                                    skip.setAttribute('data-lang', 'close');
                                }
                            } catch(_) {}
                            // Ensure overlay is at top-level and above everything
                            try {
                                if (cs.parentElement && cs.parentElement !== document.body) {
                                    document.body.appendChild(cs);
                                }
                                cs.style.position = 'fixed';
                                cs.style.inset = '0';
                                cs.style.display = 'flex';
                                cs.style.background = '#000';
                                cs.style.zIndex = '2147483647';
                                cs.style.pointerEvents = 'all';
                                // Prepare for smooth fade-out on close
                                cs.style.opacity = '1';
                                cs.style.transition = 'opacity 500ms ease';
                                video.style.position = 'absolute';
                                video.style.inset = '0';
                                video.style.width = '100vw';
                                video.style.height = '100vh';
                                video.style.objectFit = 'contain';
                                video.style.background = '#000';
                                // Hide game canvas to prevent any bleed-through
                                try { const cvs = document.getElementById('gameCanvas'); if (cvs) cvs.style.visibility = 'hidden'; } catch {}
                            } catch {}
                            // Resolve cutscene URL by language, allow external override via window.CUTSCENE_URL
                            // Extended mapping for newly added languages and regional variants
                            const __langRaw = (this && this.lang) ? String(this.lang) : 'tr';
                            const __lang = __langRaw.toLowerCase();
                            let defaultByLang = 'video/4keng.mp4'; // fallback
                            switch (__lang) {
                                case 'tr':
                                    defaultByLang = 'video/4kTr.mp4';
                                    break;
                                case 'en':
                                    defaultByLang = 'video/4keng.mp4';
                                    break;
                                case 'de': // German
                                    defaultByLang = 'video/deutsch.mp4';
                                    break;
                                case 'es': // Spanish
                                    // Note: file name is spainsh.mp4 in repo
                                    defaultByLang = 'video/spainsh.mp4';
                                    break;
                                case 'pt': // Portuguese (generic)
                                case 'pt-br':
                                case 'pt_br': // tolerate underscore variant
                                    defaultByLang = 'video/br.mp4';
                                    break;
                                case 'ja': // Japanese
                                    defaultByLang = 'video/japan.mp4';
                                    break;
                                case 'hi': // Hindi
                                    defaultByLang = 'video/hindu.mp4';
                                    break;
                                case 'zh': // Chinese (generic)
                                case 'zh-cn':
                                case 'zh_cn':
                                case 'zh-hans':
                                case 'zh_hans':
                                case 'zh-hant':
                                case 'zh_hant':
                                    defaultByLang = 'video/china.mp4';
                                    break;
                                default:
                                    defaultByLang = 'video/4keng.mp4';
                            }
                            const url = (typeof window !== 'undefined' && window.CUTSCENE_URL) ? window.CUTSCENE_URL : defaultByLang;
                            if (url) {
                                // Pause BGM during cutscene
                                let bgmWasPlaying = false;
                                try { const bgmEl = document.getElementById('bgm'); if (bgmEl) { bgmWasPlaying = !bgmEl.paused; bgmEl.pause(); } } catch {}
                                video.src = url;
                                video.currentTime = 0;
                                // Try with sound first (user just clicked an element -> user gesture)
                                video.muted = false;
                                // Close with fade-out, then resume flow and fade-in BGM
                                const closeWithFade = (next) => {
                                    try { video.pause(); } catch {}
                                    video.removeEventListener('ended', onEnd);
                                    video.removeEventListener('error', onError);
                                    if (skip) skip.removeEventListener('click', onSkip);
                                    // Fade out overlay
                                    try { cs.style.opacity = '0'; } catch {}
                                    const afterFade = () => {
                                        // Hide overlay
                                        cs.style.display = 'none';
                                        // Restore game canvas visibility
                                        try { const cvs = document.getElementById('gameCanvas'); if (cvs) cvs.style.visibility = ''; } catch {}
                                        // Start BGM with soft fade-in (only if not muted)
                                        try {
                                            const bgmEl = document.getElementById('bgm');
                                            if (bgmEl) {
                                                const s = this.settings || {};
                                                const effectiveSoundMuted = (typeof this.muted === 'boolean') ? this.muted : !!s.soundMuted;
                                                const effectiveMusicMuted = (typeof this.musicMuted === 'boolean') ? this.musicMuted : !!s.musicMuted;
                                                if (effectiveSoundMuted || effectiveMusicMuted) {
                                                    // Respect mute: ensure BGM stays muted and do not auto-play
                                                    try { bgmEl.pause(); } catch {}
                                                    bgmEl.muted = true;
                                                } else {
                                                    try { this.resumeAudioContext && this.resumeAudioContext(); } catch {}
                                                    bgmEl.muted = false;
                                                    // Enforce looping and resilient restart
                                                    try { bgmEl.loop = true; } catch {}
                                                    if (!bgmEl._loopBound) {
                                                        bgmEl.addEventListener('ended', () => {
                                                            try { bgmEl.currentTime = 0; } catch {}
                                                            const tryPlay = () => bgmEl.play();
                                                            tryPlay().catch(()=>{});
                                                        });
                                                        bgmEl._loopBound = true;
                                                    }
                                                    const target = Math.max(0, Math.min(1, (this.settings?.musicVolume ?? 0.15)));
                                                    let vol = 0.0;
                                                    bgmEl.volume = vol;
                                                    const tryPlay = () => bgmEl.play();
                                                    tryPlay().catch(() => {
                                                        const onInteract = () => {
                                                            document.removeEventListener('pointerdown', onInteract, true);
                                                            tryPlay().catch(()=>{});
                                                        };
                                                        document.addEventListener('pointerdown', onInteract, true);
                                                    });
                                                    const stepMs = 50;
                                                    const durationMs = 1000;
                                                    const step = target / (durationMs / stepMs);
                                                    const iv = setInterval(() => {
                                                        vol = Math.min(target, vol + step);
                                                        try { bgmEl.volume = vol; } catch {}
                                                        if (vol >= target) clearInterval(iv);
                                                    }, stepMs);
                                                }
                                            }
                                        } catch {}
                                        // Continue flow (open shop, etc.)
                                        try { next && next(); } catch {}
                                    };
                                    // Wait for transition end or fallback timeout
                                    let done = false;
                                    const onEndTrans = () => { if (done) return; done = true; cs.removeEventListener('transitionend', onEndTrans); afterFade(); };
                                    try { cs.addEventListener('transitionend', onEndTrans); } catch {}
                                    setTimeout(onEndTrans, 520);
                                };

                                const onEnd = () => closeWithFade(proceedToShop);
                                const onError = () => closeWithFade(proceedToShop);
                                const onSkip = () => closeWithFade(proceedToShop);
                                video.addEventListener('ended', onEnd);
                                video.addEventListener('error', onError);
                                if (skip) skip.addEventListener('click', onSkip);
                                video.play().catch(()=>{
                                    // Fallback: mute then play
                                    try { video.muted = true; video.play().catch(onError); } catch { onError(); }
                                });
                            } else {
                                // No video URL set; show a brief fade then continue
                                let handled = false;
                                const finish = () => { if (handled) return; handled = true; try { cs.style.display = 'none'; } catch {} proceedToShop(); };
                                if (skip) skip.onclick = finish;
                                setTimeout(finish, 3500);
                            }
                        } else {
                            // Fallback if overlay missing
                            proceedToShop();
                        }
                    } catch {
                        proceedToShop();
                    }
                };

                const fireBtn = document.getElementById('chooseFire');
                const waterBtn = document.getElementById('chooseWater');
                const airBtn = document.getElementById('chooseAir');
                if (fireBtn) { fireBtn.onclick = () => { this.playClick(); choose('fire'); }; fireBtn.onmouseover = () => this.playHover(); }
                if (waterBtn) { waterBtn.onclick = () => { this.playClick(); choose('water'); }; waterBtn.onmouseover = () => this.playHover(); }
                if (airBtn) { airBtn.onclick = () => { this.playClick(); choose('air'); }; airBtn.onmouseover = () => this.playHover(); }
            });
        }
        // Start screen settings overlay
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsOverlay = document.getElementById('settingsOverlay');
        const settingsCloseBtn = document.getElementById('settingsCloseBtn');
        if (settingsBtn && settingsOverlay) {
            settingsBtn.addEventListener('click', () => {
                this.playClick();
                settingsOverlay.style.display = 'block';
                this.setCursorVisible(true);
                // Ensure audio graph exists so sliders affect sound immediately
                try { this.initAudio(); this.resumeAudioContext(); } catch(_) {}
                // Sync dropdown to current language on open
                try { const sel = document.getElementById('languageSelect'); if (sel) sel.value = this.lang; } catch(_) {}
                // On mobile, show generic sensitivity title in settings; on desktop, detailed label
                try {
                    const msHeader = document.querySelector('h3[data-lang="mouseSensitivity"]');
                    if (msHeader) msHeader.textContent = this.isMobile() ? this.t('sensitivity') : this.t('mouseSensitivity');
                } catch(_){ }
                // Sync settings UI values
                try {
                    const s = this.settings;
                    const v = (id)=>document.getElementById(id);
                    const sanitizeBtn = (btn, labelKey, stateId) => {
                        if (!btn) return;
                        try {
                            // Remove stray text nodes
                            Array.from(btn.childNodes).forEach(n => {
                                if (n.nodeType === Node.TEXT_NODE && n.nodeValue && n.nodeValue.trim() !== '') {
                                    btn.removeChild(n);
                                }
                            });
                            // Ensure only one label span with data-lang=labelKey
                            const spans = Array.from(btn.querySelectorAll('span[data-lang="' + labelKey + '"]'));
                            if (spans.length > 1) {
                                for (let i = 1; i < spans.length; i++) btn.removeChild(spans[i]);
                            } else if (spans.length === 0) {
                                const sp = document.createElement('span');
                                sp.setAttribute('data-lang', labelKey);
                                sp.textContent = this.t(labelKey);
                                btn.insertBefore(sp, btn.firstChild);
                            }
                            // Ensure state chip exists
                            let chip = btn.querySelector('#' + stateId);
                            if (!chip) {
                                chip = document.createElement('span');
                                chip.id = stateId;
                                chip.className = 'state-chip';
                                chip.textContent = '—';
                                btn.appendChild(chip);
                            }
                        } catch(_) {}
                    };
                    const mv = v('masterVolume'); if (mv) { mv.value = s.masterVolume; }
                    const mvLbl = v('masterVolumeVal'); if (mvLbl) { mvLbl.textContent = Math.round(s.masterVolume*100)+'%'; }
                    const muc = v('musicVolume'); if (muc) { muc.value = s.musicVolume; }
                    const mucLbl = v('musicVolumeVal'); if (mucLbl) { mucLbl.textContent = Math.round(s.musicVolume*100)+'%'; }
                    const ms = v('mouseSensitivity'); if (ms) { ms.value = s.mouseSensitivity; }
                    const msLbl = v('mouseSensitivityVal'); if (msLbl) { msLbl.textContent = (s.mouseSensitivity).toFixed(2)+'x'; }
                    const fov = v('fovDesktop'); if (fov) { fov.value = s.fovDesktop; }
                    const fovLbl = v('fovDesktopVal'); if (fovLbl) { fovLbl.textContent = s.fovDesktop + '°'; }
                    // Show FOV only on mobile per requirement
                    const fovRow = v('fovRow'); if (fovRow) { fovRow.style.display = this.isMobile() ? '' : 'none'; }
                    // Reflect current audio state in chips and aria-pressed
                    const soundBtn = v('soundToggleBtn');
                    sanitizeBtn(soundBtn, 'sound', 'soundState');
                    const soundChip = v('soundState');
                    if (soundBtn) soundBtn.setAttribute('aria-pressed', (!s.soundMuted).toString());
                    if (soundChip) {
                        const on = !s.soundMuted;
                        soundChip.textContent = on ? this.t('on') : this.t('off');
                        soundChip.classList.remove('on','off');
                        soundChip.classList.add(on ? 'on' : 'off');
                    }
                    const musicBtn = v('musicToggleBtn');
                    sanitizeBtn(musicBtn, 'music', 'musicState');
                    const musicChip = v('musicState');
                    if (musicBtn) musicBtn.setAttribute('aria-pressed', (!s.musicMuted).toString());
                    if (musicChip) {
                        const on = !s.musicMuted;
                        musicChip.textContent = on ? this.t('on') : this.t('off');
                        musicChip.classList.remove('on','off');
                        musicChip.classList.add(on ? 'on' : 'off');
                    }

                    // Bind handlers using property assignments to avoid duplicate listeners
                    const _soundBtn = soundBtn;
                    const _musicBtn = musicBtn;
                    if (_soundBtn) {
                        _soundBtn.onclick = (e) => {
                            try { e.preventDefault(); e.stopPropagation(); } catch(_) {}
                            s.soundMuted = !s.soundMuted;
                            this.saveSettings();
                            this.applyAudioSettings();
                            sanitizeBtn(_soundBtn, 'sound', 'soundState');
                            // Update chip + aria
                            try {
                                const freshChip = document.getElementById('soundState');
                                if (freshChip) {
                                    const on = !s.soundMuted;
                                    freshChip.textContent = on ? this.t('on') : this.t('off');
                                    freshChip.classList.remove('on','off');
                                    freshChip.classList.add(on ? 'on' : 'off');
                                }
                                _soundBtn.setAttribute('aria-pressed', (!s.soundMuted).toString());
                            } catch(_) {}
                        };
                    }
                    if (_musicBtn) {
                        _musicBtn.onclick = (e) => {
                            try { e.preventDefault(); e.stopPropagation(); } catch(_) {}
                            s.musicMuted = !s.musicMuted;
                            this.saveSettings();
                            this.applyAudioSettings();
                            sanitizeBtn(_musicBtn, 'music', 'musicState');
                            // Update chip + aria
                            try {
                                const freshChip = document.getElementById('musicState');
                                if (freshChip) {
                                    const on = !s.musicMuted;
                                    freshChip.textContent = on ? this.t('on') : this.t('off');
                                    freshChip.classList.remove('on','off');
                                    freshChip.classList.add(on ? 'on' : 'off');
                                }
                                _musicBtn.setAttribute('aria-pressed', (!s.musicMuted).toString());
                            } catch(_) {}
                        };
                    }
                    if (mv && mvLbl) {
                        mv.oninput = () => {
                            s.masterVolume = Math.max(0, Math.min(1, parseFloat(mv.value)||0));
                            mvLbl.textContent = Math.round(s.masterVolume*100)+'%';
                            this.saveSettings();
                            this.applyAudioSettings();
                        };
                    }
                    if (muc && mucLbl) {
                        muc.oninput = () => {
                            s.musicVolume = Math.max(0, Math.min(1, parseFloat(muc.value)||0));
                            mucLbl.textContent = Math.round(s.musicVolume*100)+'%';
                            this.saveSettings();
                            this.applyAudioSettings();
                        };
                    }
                    if (ms && msLbl) {
                        ms.oninput = () => {
                            s.mouseSensitivity = Math.max(0.2, Math.min(3, parseFloat(ms.value)||1));
                            msLbl.textContent = (s.mouseSensitivity).toFixed(2)+'x';
                            this.saveSettings();
                            this.applyControlSettings();
                        };
                    }
                    if (fov && fovLbl) {
                        fov.oninput = () => {
                            s.fovDesktop = Math.max(60, Math.min(120, parseInt(fov.value)||90));
                            fovLbl.textContent = s.fovDesktop + '°';
                            this.saveSettings();
                            this.applyControlSettings();
                        };
                    }
                } catch(_) {}
            });
        }
        if (settingsCloseBtn && settingsOverlay) {
            settingsCloseBtn.addEventListener('click', () => {
                this.playClick();
                settingsOverlay.style.display = 'none';
            });
        }
        // Bind language dropdown (if present)
        try {
            const sel = document.getElementById('languageSelect');
            if (sel) {
                sel.value = this.lang;
                sel.addEventListener('change', () => {
                    const code = sel.value;
                    this.playClick && this.playClick();
                    this.setLanguage(code);
                });
            }
        } catch(_) {}
        // Bind settings controls (if present)
        try {
            const v = (id)=>document.getElementById(id);
            const s = this.settings;
            const soundBtn = v('soundToggleBtn');
            const musicBtn = v('musicToggleBtn');
            const masterVol = v('masterVolume');
            const musicVol = v('musicVolume');
            const ms = v('mouseSensitivity');
            const fov = v('fovDesktop');
            if (soundBtn) {
                soundBtn.addEventListener('click', ()=>{
                    s.soundMuted = !s.soundMuted; this.saveSettings(); this.applyAudioSettings();
                    // Optional visual: toggle text
                });
            }
            if (musicBtn) {
                musicBtn.addEventListener('click', ()=>{
                    s.musicMuted = !s.musicMuted; this.saveSettings(); this.applyAudioSettings();
                });
            }
            if (masterVol) {
                masterVol.addEventListener('input', ()=>{
                    s.masterVolume = Math.max(0, Math.min(1, parseFloat(masterVol.value)||0));
                    const lbl = v('masterVolumeVal'); if (lbl) lbl.textContent = Math.round(s.masterVolume*100)+'%';
                    this.saveSettings(); this.applyAudioSettings();
                });
            }
            if (musicVol) {
                musicVol.addEventListener('input', ()=>{
                    s.musicVolume = Math.max(0, Math.min(1, parseFloat(musicVol.value)||0));
                    const lbl = v('musicVolumeVal'); if (lbl) lbl.textContent = Math.round(s.musicVolume*100)+'%';
                    this.saveSettings(); this.applyAudioSettings();
                });
            }
            if (ms) {
                ms.addEventListener('input', ()=>{
                    s.mouseSensitivity = Math.max(0.2, Math.min(3, parseFloat(ms.value)||1));
                    const lbl = v('mouseSensitivityVal'); if (lbl) lbl.textContent = (s.mouseSensitivity).toFixed(2)+'x';
                    this.saveSettings(); this.applyControlSettings();
                });
            }
            if (fov) {
                fov.addEventListener('input', ()=>{
                    s.fovDesktop = Math.max(60, Math.min(120, parseInt(fov.value)||90));
                    const lbl = v('fovDesktopVal'); if (lbl) lbl.textContent = s.fovDesktop + '°';
                    this.saveSettings(); this.applyControlSettings();
                });
            }
        } catch(_) {}

        // Start screen: How To Play overlay
        const howToBtn = document.getElementById('howToBtn');
        const howToOverlay = document.getElementById('howToOverlay');
        const howToCloseBtn = document.getElementById('howToCloseBtn');
        if (howToBtn && howToOverlay) {
            howToBtn.addEventListener('click', () => {
                this.playClick && this.playClick();
                howToOverlay.style.display = 'block';
            });
        }
        if (howToCloseBtn && howToOverlay) {
            howToCloseBtn.addEventListener('click', () => {
                this.playClick && this.playClick();
                howToOverlay.style.display = 'none';
            });
        }
        // Outside click closes overlay
        if (howToOverlay) {
            howToOverlay.addEventListener('click', (e) => {
                if (e.target === howToOverlay) {
                    this.playClick && this.playClick();
                    howToOverlay.style.display = 'none';
                }
            });
            // ESC closes overlay
            window.addEventListener('keydown', (e) => {
                if (howToOverlay.style.display === 'block' && (e.key === 'Escape' || e.key === 'Esc')) {
                    this.playClick && this.playClick();
                    howToOverlay.style.display = 'none';
                }
            });
        }

        // Start screen: Characters overlay (open like How To)
        const charactersBtn = document.getElementById('charactersBtn');
        const charactersOverlay = document.getElementById('charactersOverlay');
        const charactersCloseBtn = document.getElementById('charactersCloseBtn');
        if (charactersBtn && charactersOverlay) {
            charactersBtn.addEventListener('click', () => {
                this.playClick && this.playClick();
                charactersOverlay.style.display = 'block';
                this.setCursorVisible && this.setCursorVisible(true);
            });
            if (charactersCloseBtn && !charactersCloseBtn._bound) {
                charactersCloseBtn.addEventListener('click', () => {
                    this.playClick && this.playClick();
                    charactersOverlay.style.display = 'none';
                });
                charactersCloseBtn._bound = true;
            }
        }

        // Main menu: Skins Shop (unlocks by best score and best wave)
        try {
            const shopBtn = document.getElementById('shopBtn');
            const mainShop = document.getElementById('mainShopOverlay');
            const mainShopCloseBtn = document.getElementById('mainShopCloseBtn');
            const mainShopItems = document.getElementById('mainShopItems');
            const mainShopStats = document.getElementById('mainShopStats');

            // Skin catalog (extendable)
            const SKINS = [
                { id: 'skin_basic_core',        name: 'Basic Core',    color: '#00ffff', shape: 'circle',   cost: 0,     reqWave: 0,  rarity: 'common' },
                { id: 'skin_neoncyan_circle',    name: 'Neon Cyan',     color: '#00ffff', shape: 'circle',   cost: 500,   reqWave: 3,  rarity: 'common' },
                { id: 'skin_magenta_triangle',   name: 'Magenta Edge',  color: '#ff00ff', shape: 'triangle', cost: 1200,  reqWave: 6,  rarity: 'uncommon' },
                { id: 'skin_gold_star',          name: 'Golden Star',   color: '#ffd54a', shape: 'star',     cost: 2500,  reqWave: 9,  rarity: 'rare' },
                { id: 'skin_emerald_circle',     name: 'Emerald Core',  color: '#22c55e', shape: 'circle',   cost: 4000,  reqWave: 12, rarity: 'epic' },
                { id: 'skin_ruby_star',          name: 'Ruby Nova',     color: '#ff3b30', shape: 'star',     cost: 5200,  reqWave: 13, rarity: 'epic' },
                { id: 'skin_azure_triangle',     name: 'Azure Shard',   color: '#3b82f6', shape: 'triangle', cost: 2100,  reqWave: 8,  rarity: 'rare' },
                { id: 'skin_obsidian_circle',    name: 'Obsidian Core', color: '#111827', shape: 'circle',   cost: 1600,  reqWave: 7,  rarity: 'uncommon' },
                { id: 'skin_neonlime_triangle',  name: 'Neon Lime',     color: '#a3e635', shape: 'triangle', cost: 2800,  reqWave: 9,  rarity: 'rare' },
                { id: 'skin_amethyst_star',      name: 'Amethyst Star', color: '#8b5cf6', shape: 'star',     cost: 6000,  reqWave: 14, rarity: 'epic' },
                { id: 'skin_silver_circle',      name: 'Silver Core',   color: '#cbd5e1', shape: 'circle',   cost: 900,   reqWave: 5,  rarity: 'common' },
                { id: 'skin_lava_triangle',      name: 'Lava Edge',     color: '#f97316', shape: 'triangle', cost: 3400,  reqWave: 10, rarity: 'rare' },
                { id: 'skin_arctic_star',        name: 'Arctic Crown',  color: '#7dd3fc', shape: 'star',     cost: 8000,  reqWave: 16, rarity: 'legendary' },
                { id: 'skin_solarflare_star',    name: 'Solar Flare',   color: '#fbbf24', shape: 'star',     cost: 9500,  reqWave: 18, rarity: 'legendary' },
                { id: 'skin_void_pulse',         name: 'Void Pulse',    color: '#6d28d9', shape: 'circle',   cost: 11000, reqWave: 20, rarity: 'legendary' },
                { id: 'skin_cobalt_circle',      name: 'Cobalt Core',   color: '#2563eb', shape: 'circle',   cost: 1400,  reqWave: 6,  rarity: 'uncommon' },
                { id: 'skin_ember_star',         name: 'Ember Star',    color: '#fb7185', shape: 'star',     cost: 3600,  reqWave: 10, rarity: 'rare' },
                { id: 'skin_quantum_triangle',   name: 'Quantum Edge',  color: '#22d3ee', shape: 'triangle', cost: 12000, reqWave: 21, rarity: 'legendary' }
            ];

            // Ensure default ownership/selection for Basic skin
            try {
                // Own basic skin
                if (!this.ownedSkins) this.ownedSkins = this.loadOwnedSkins();
                if (!this.ownedSkins['skin_basic_core']) {
                    this.ownedSkins['skin_basic_core'] = true;
                    this.saveOwnedSkins && this.saveOwnedSkins();
                }
                // Select basic skin if none selected
                const rawSel0 = localStorage.getItem('glowlings_selected_skin');
                if (!rawSel0) {
                    const basic = SKINS.find(s=>s.id==='skin_basic_core');
                    if (basic) localStorage.setItem('glowlings_selected_skin', JSON.stringify({ id: basic.id, color: basic.color, shape: basic.shape }));
                }
            } catch(_) {}

            // Helpers to load bests from runHistory
            const getBests = () => {
                try {
                    const best = (this.runHistory && this.runHistory.best) ? this.runHistory.best : { wave: 0, score: 0 };
                    return { bestWave: best.wave || 0, bestScore: best.score || 0 };
                } catch(_) { return { bestWave: 0, bestScore: 0 }; }
            };
            const loadSelectedSkin = () => {
                try {
                    const raw = localStorage.getItem('glowlings_selected_skin');
                    if (raw) return JSON.parse(raw);
                    const basic = SKINS.find(s=>s.id==='skin_basic_core');
                    return basic ? { id: basic.id, color: basic.color, shape: basic.shape } : null;
                } catch(_) { return null; }
            };
            const saveSelectedSkin = (skin) => {
                try { localStorage.setItem('glowlings_selected_skin', JSON.stringify({ id: skin.id, color: skin.color, shape: skin.shape, rarity: skin.rarity })); } catch(_) {}
            };
            // Maps selection persistence
            const loadSelectedMap = () => {
                try { const raw = localStorage.getItem('glowlings_selected_map'); return raw ? JSON.parse(raw) : { id: 'map_neon_core' }; } catch(_) { return { id: 'map_neon_core' }; }
            };
            const saveSelectedMap = (map) => {
                try { if (map && map.id) localStorage.setItem('glowlings_selected_map', JSON.stringify({ id: map.id })); } catch(_) {}
            };
            const isUnlocked = (skin, bests) => {
                return (bests.bestScore >= skin.cost) && (bests.bestWave >= skin.reqWave);
            };

            // Coins and Dodge Skin helpers
            // Persistent currency used in the main menu shop (wallet-based, independent of run stats)
            if (!this.getCoins) {
                this.getCoins = () => {
                    try {
                        if (!this.wallet) this.wallet = this.loadWallet();
                        // Migrate legacy key if present
                        try {
                            const legacy = localStorage.getItem('glowlings_coins');
                            if (legacy != null) {
                                const v = Math.max(0, parseInt(legacy)||0);
                                if ((this.wallet.coins||0) < v) { this.wallet.coins = v; this.saveWallet(); }
                                try { localStorage.removeItem('glowlings_coins'); } catch(_) {}
                            }
                        } catch(_) {}
                        return Math.max(0, this.wallet.coins|0);
                    } catch(_) { return 0; }
                };
            }
            if (!this.setCoins) {
                this.setCoins = (amount) => {
                    try {
                        if (!this.wallet) this.wallet = this.loadWallet();
                        this.wallet.coins = Math.max(0, amount|0);
                        this.saveWallet();
                        // Ensure legacy key is not used anymore
                        try { localStorage.removeItem('glowlings_coins'); } catch(_) {}
                    } catch(_) {}
                };
            }
            // Owned Dodge Skins persistence
            if (!this.loadOwnedDodgeSkins) {
                this.loadOwnedDodgeSkins = () => {
                    try {
                        const raw = localStorage.getItem('glowlings_owned_dodge_skins');
                        const obj = raw ? JSON.parse(raw) : {};
                        return (obj && typeof obj === 'object') ? obj : {};
                    } catch(_) { return {}; }
                };
            }
            if (!this.saveOwnedDodgeSkins) {
                this.saveOwnedDodgeSkins = () => {
                    try { localStorage.setItem('glowlings_owned_dodge_skins', JSON.stringify(this.ownedDodgeSkins||{})); } catch(_) {}
                };
            }
            if (!this.isOwnedDodge) {
                this.isOwnedDodge = (id) => {
                    try {
                        if (!this.ownedDodgeSkins) this.ownedDodgeSkins = this.loadOwnedDodgeSkins();
                        return !!this.ownedDodgeSkins[id];
                    } catch(_) { return false; }
                };
            }
            // Weapon Skins persistence (ownership + per-weapon selection)
            if (!this.loadOwnedWeaponSkins) {
                this.loadOwnedWeaponSkins = () => {
                    try { const raw = localStorage.getItem('glowlings_owned_weapon_skins'); const obj = raw ? JSON.parse(raw) : {}; return (obj && typeof obj === 'object') ? obj : {}; } catch(_) { return {}; }
                };
            }
            if (!this.saveOwnedWeaponSkins) {
                this.saveOwnedWeaponSkins = () => { try { localStorage.setItem('glowlings_owned_weapon_skins', JSON.stringify(this.ownedWeaponSkins||{})); } catch(_) {} };
            }
            if (!this.isOwnedWeapon) {
                this.isOwnedWeapon = (id) => { try { if (!this.ownedWeaponSkins) this.ownedWeaponSkins = this.loadOwnedWeaponSkins(); return !!this.ownedWeaponSkins[id]; } catch(_) { return false; } };
            }
            if (!this.loadSelectedWeaponSkins) {
                this.loadSelectedWeaponSkins = () => {
                    try { const raw = localStorage.getItem('glowlings_selected_weapon_skins'); const obj = raw ? JSON.parse(raw) : null; return (obj && typeof obj === 'object') ? obj : { turret: null, electric: null, gravity: null }; } catch(_) { return { turret: null, electric: null, gravity: null }; }
                };
            }
            if (!this.saveSelectedWeaponSkin) {
                this.saveSelectedWeaponSkin = (type, id, skinData) => {
                    try {
                        const cur = this.loadSelectedWeaponSkins ? this.loadSelectedWeaponSkins() : { turret: null, electric: null, gravity: null };
                        cur[type] = id;
                        localStorage.setItem('glowlings_selected_weapon_skins', JSON.stringify(cur));
                        if (skinData && skinData.type === type) {
                            // store detailed params for quick render usage
                            localStorage.setItem(`glowlings_selected_weapon_skin_${type}`, JSON.stringify(skinData));
                        }
                    } catch(_) {}
                };
            }
            if (!this.purchaseWeaponSkin) {
                this.purchaseWeaponSkin = (skin) => {
                    try {
                        if (!skin || !skin.id) return false;
                        const { bestWave, bestScore } = getBests();
                        if (!(bestWave >= (skin.reqWave||0) && bestScore >= (skin.cost||0))) return false;
                        const coins = this.getCoins ? this.getCoins() : 0;
                        const price = skin.cost|0;
                        if (coins < price) return false;
                        this.setCoins && this.setCoins(coins - price);
                        if (!this.ownedWeaponSkins) this.ownedWeaponSkins = this.loadOwnedWeaponSkins();
                        this.ownedWeaponSkins[skin.id] = true;
                        this.saveOwnedWeaponSkins && this.saveOwnedWeaponSkins();
                        // auto-select for its type
                        if (skin.type) this.saveSelectedWeaponSkin && this.saveSelectedWeaponSkin(skin.type, skin.id, skin);
                        return true;
                    } catch(_) { return false; }
                };
            }
            // Ensure defaults for weapon skins: own/select basics once
            try {
                if (!this.ownedWeaponSkins) this.ownedWeaponSkins = this.loadOwnedWeaponSkins();
                const basics = [
                    { id:'turret_basic', type:'turret', name:'Standard Barrel', colors:['#06b6d4','#334155'], muzzle:'#22ff22', accents:1, cost:0, reqWave:0, rarity:'common' },
                    { id:'elec_basic', type:'electric', name:'Basic Arc', colors:['#7dd3fc','#a78bfa'], bolt:'#7dd3fc', pulse:1, cost:0, reqWave:0, rarity:'common' },
                    { id:'grav_basic', type:'gravity', name:'Standard Core', colors:['#7dd3fc','#334155'], ring:'#60a5fa', rings:1, cost:0, reqWave:0, rarity:'common' }
                ];
                let changed = false;
                for (const b of basics) {
                    if (!this.ownedWeaponSkins[b.id]) { this.ownedWeaponSkins[b.id] = true; changed = true; }
                    const curSel = this.loadSelectedWeaponSkins ? this.loadSelectedWeaponSkins() : { turret:null, electric:null, gravity:null };
                    if (!curSel[b.type]) { this.saveSelectedWeaponSkin && this.saveSelectedWeaponSkin(b.type, b.id, b); }
                }
                if (changed) this.saveOwnedWeaponSkins && this.saveOwnedWeaponSkins();
            } catch(_) {}
            // Selected Dodge Skin (unified key with gameplay): 'glowlings_selected_dodge_skin'
            if (!this.loadSelectedDodgeSkin) {
                this.loadSelectedDodgeSkin = () => {
                    try { const raw = localStorage.getItem('glowlings_selected_dodge_skin'); return raw ? JSON.parse(raw) : null; } catch(_) { return null; }
                };
            }
            if (!this.saveSelectedDodgeSkin) {
                this.saveSelectedDodgeSkin = (skin) => {
                    try { localStorage.setItem('glowlings_selected_dodge_skin', JSON.stringify(skin && { id: skin.id })); } catch(_) {}
                };
            }
            // Ensure default ownership/selection for basic Dodge skin
            try {
                if (!this.ownedDodgeSkins) this.ownedDodgeSkins = this.loadOwnedDodgeSkins();
                if (!this.ownedDodgeSkins['dodge_basic']) {
                    this.ownedDodgeSkins['dodge_basic'] = true;
                    this.saveOwnedDodgeSkins();
                }
                const rawSelD = localStorage.getItem('glowlings_selected_dodge_skin');
                if (!rawSelD) {
                    // pick basic by default
                    localStorage.setItem('glowlings_selected_dodge_skin', JSON.stringify({ id: 'dodge_basic' }));
                }
            } catch(_) {}
            // Purchase handler for Dodge Skins
            if (!this.purchaseDodgeSkin) {
                this.purchaseDodgeSkin = (skin) => {
                    try {
                        if (!skin || !skin.id) return false;
                        const { bestWave, bestScore } = getBests();
                        if (!(bestWave >= (skin.reqWave||0) && bestScore >= (skin.cost||0))) return false; // respect unlock rules
                        const coins = this.getCoins ? this.getCoins() : 0;
                        const price = skin.cost|0;
                        if (coins < price) return false;
                        // Deduct and grant ownership
                        this.setCoins && this.setCoins(coins - price);
                        if (!this.ownedDodgeSkins) this.ownedDodgeSkins = this.loadOwnedDodgeSkins();
                        this.ownedDodgeSkins[skin.id] = true;
                        this.saveOwnedDodgeSkins && this.saveOwnedDodgeSkins();
                        // Auto-select on purchase
                        this.saveSelectedDodgeSkin && this.saveSelectedDodgeSkin(skin);
                        return true;
                    } catch(_) { return false; }
                };
            }

            let shopPage = 0;
            let activeShopCategory = 'skin'; // 'skin' | 'dodge' | 'weapon' | 'maps'
            const pageSize = 9; // 3x3 per page
            const prevBtn = document.getElementById('mainShopPrev');
            const nextBtn = document.getElementById('mainShopNext');
            const pageLabel = document.getElementById('mainShopPageLabel');

            const tr = (k, d) => {
                try { const v = this.t ? this.t(k) : null; return (v && typeof v === 'string' && v !== k) ? v : d; } catch(_) { return d; }
            };
            const renderMainShop = () => {
                if (!mainShop || !mainShopItems) return;
                const { bestWave, bestScore } = getBests();
                let coins = 0;
                try {
                    coins = this.getCoins ? this.getCoins() : 0;
                } catch(_) {
                    try { if (!this.wallet) this.wallet = this.loadWallet(); coins = (this.wallet && this.wallet.coins)|0; } catch(_) { coins = 0; }
                }
                if (mainShopStats) mainShopStats.textContent = `${tr('coins','Coins')}: ${coins} • ${tr('bestWaveLabel','Best Wave')}: ${bestWave} • ${tr('bestScoreLabel','Best Score')}: ${bestScore}`;
                const selected = loadSelectedSkin();
                let selectedId = selected && selected.id;
                let selectedWeapons = null;
                const isDodgeCategory = (activeShopCategory === 'dodge');
                const isWeaponCategory = (activeShopCategory === 'weapon');
                const isMapsCategory = (activeShopCategory === 'maps');
                if (activeShopCategory === 'dodge') {
                    try {
                        const sd = this.loadSelectedDodgeSkin ? this.loadSelectedDodgeSkin() : null;
                        if (sd && sd.id) selectedId = sd.id;
                    } catch(_) {}
                }
                if (isWeaponCategory) {
                    try { selectedWeapons = this.loadSelectedWeaponSkins ? this.loadSelectedWeaponSkins() : { turret:null, electric:null, gravity:null }; } catch(_) { selectedWeapons = { turret:null, electric:null, gravity:null }; }
                }
                if (isMapsCategory) {
                    try { const sm = loadSelectedMap(); if (sm && sm.id) selectedId = sm.id; } catch(_) {}
                }
                mainShopItems.innerHTML = '';

                // Ensure category bar exists (Skins / Dodge Skins / Weapon Skins)
                let cats = document.getElementById('mainShopCats');
                try {
                    if (!cats) {
                        cats = document.createElement('div');
                        cats.id = 'mainShopCats';
                        cats.style.display = 'flex';
                        cats.style.gap = '10px';
                        cats.style.margin = '6px 0 14px 0';
                        cats.style.justifyContent = 'center';
                        cats.style.alignItems = 'center';
                        cats.style.padding = '8px 10px';
                        cats.style.borderRadius = '9999px';
                        cats.style.background = 'linear-gradient(180deg, rgba(30,41,59,0.75), rgba(15,23,42,0.65))';
                        cats.style.backdropFilter = 'blur(6px)';
                        cats.style.border = '1px solid #334155';
                        cats.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)';
                        const parent = mainShopItems.parentNode;
                        parent.insertBefore(cats, mainShopItems);
                    }
                    cats.innerHTML = '';
                    const mkBtn = (key, val) => {
                        const b = document.createElement('button');
                        b.className = 'primary-btn';
                        b.style.width = 'auto';
                        b.style.minWidth = '110px';
                        b.style.padding = '8px 14px';
                        b.style.fontSize = '12px';
                        b.style.letterSpacing = '0.3px';
                        b.style.borderRadius = '9999px';
                        b.style.border = '1px solid transparent';
                        b.style.background = 'linear-gradient(180deg, #0ea5e9, #0284c7)';
                        b.style.color = '#0b1220';
                        b.style.textShadow = '0 1px 0 rgba(255,255,255,0.25)';
                        b.style.boxShadow = '0 6px 12px rgba(2,132,199,0.35), inset 0 1px 0 rgba(255,255,255,0.35)';
                        b.style.transform = 'translateY(0)';
                        b.style.transition = 'all .15s ease';
                        b.textContent = tr(key, key);

                        const setActive = (on) => {
                            if (on) {
                                b.style.background = 'linear-gradient(180deg, #22d3ee, #06b6d4)';
                                b.style.border = '1px solid #38bdf8';
                                b.style.boxShadow = '0 8px 16px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.45)';
                                b.style.color = '#06202a';
                            } else {
                                b.style.background = 'linear-gradient(180deg, #0ea5e9, #0284c7)';
                                b.style.border = '1px solid transparent';
                                b.style.boxShadow = '0 6px 12px rgba(2,132,199,0.35), inset 0 1px 0 rgba(255,255,255,0.35)';
                                b.style.color = '#0b1220';
                            }
                        };
                        setActive(activeShopCategory === val);

                        b.addEventListener('mouseenter', () => {
                            b.style.transform = 'translateY(-1px)';
                            b.style.filter = 'brightness(1.05)';
                        });
                        b.addEventListener('mouseleave', () => {
                            b.style.transform = 'translateY(0)';
                            b.style.filter = 'none';
                        });
                        b.addEventListener('mousedown', () => {
                            b.style.transform = 'translateY(1px) scale(0.99)';
                            b.style.filter = 'brightness(0.98)';
                        });
                        b.addEventListener('mouseup', () => {
                            b.style.transform = 'translateY(0)';
                            b.style.filter = 'none';
                        });
                        b.addEventListener('click', () => {
                            this.playClick && this.playClick();
                            activeShopCategory = val;
                            shopPage = 0; // reset pagination when switching category
                            renderMainShop();
                        });
                        // reflect active state after clicks as well
                        setTimeout(() => setActive(activeShopCategory === val), 0);
                        return b;
                    };
                    cats.appendChild(mkBtn('catSkins','skin'));
                    cats.appendChild(mkBtn('catDodgeSkins','dodge'));
                    cats.appendChild(mkBtn('catWeaponSkins','weapon'));
                    cats.appendChild(mkBtn('catMaps','maps'));
                } catch(_) {}

                // Choose catalog by category
                // Weapon skins: 3 weapons x 6 skins each
                const WEAPON_SKINS = [
                    // Turrets
                    { id: 'turret_basic',  type:'turret',  name:'Standard Barrel',   cost: 0,    reqWave:0,  rarity:'common',    colors:['#06b6d4','#334155'], muzzle:'#22ff22', accents:1 },
                    { id: 'turret_cobalt', type:'turret',  name:'Cobalt Rail',       cost: 1400, reqWave:6,  rarity:'uncommon',  colors:['#2563eb','#1f2937'], muzzle:'#34d399', accents:1 },
                    { id: 'turret_ruby',   type:'turret',  name:'Ruby Cannon',       cost: 3200, reqWave:10, rarity:'rare',      colors:['#ef4444','#1f2937'], muzzle:'#f59e0b', accents:2 },
                    { id: 'turret_emerald',type:'turret',  name:'Emerald Spitfire',  cost: 5200, reqWave:14, rarity:'epic',      colors:['#22c55e','#0f172a'], muzzle:'#a3e635', accents:2 },
                    { id: 'turret_quantum',type:'turret',  name:'Quantum Lancer',    cost: 8400, reqWave:18, rarity:'legendary', colors:['#a78bfa','#0b1220'], muzzle:'#22d3ee', accents:3 },
                    { id: 'turret_void',   type:'turret',  name:'Void Howitzer',     cost: 11200,reqWave:22, rarity:'legendary', colors:['#111827','#0ea5e9'], muzzle:'#7dd3fc', accents:3 },
                    // Electricity
                    { id: 'elec_basic',    type:'electric',name:'Basic Arc',         cost: 0,    reqWave:0,  rarity:'common',    colors:['#7dd3fc','#a78bfa'], bolt:'#7dd3fc', pulse:1 },
                    { id: 'elec_plasma',   type:'electric',name:'Plasma Fork',       cost: 1600, reqWave:7,  rarity:'uncommon',  colors:['#22d3ee','#34d399'], bolt:'#22d3ee', pulse:1 },
                    { id: 'elec_thunder',  type:'electric',name:'Thunder Chain',     cost: 3600, reqWave:10, rarity:'rare',      colors:['#a3e635','#22d3ee'], bolt:'#a3e635', pulse:2 },
                    { id: 'elec_starlit',  type:'electric',name:'Starlit Surge',     cost: 5600, reqWave:14, rarity:'epic',      colors:['#fde68a','#93c5fd'], bolt:'#fde68a', pulse:2 },
                    { id: 'elec_prismatic',type:'electric',name:'Prismatic Web',     cost: 8800, reqWave:18, rarity:'legendary', colors:['#f472b6','#34d399'], bolt:'#f472b6', pulse:3 },
                    { id: 'elec_celestial',type:'electric',name:'Celestial Storm',   cost: 11800,reqWave:22, rarity:'legendary', colors:['#eab308','#60a5fa'], bolt:'#eab308', pulse:3 },
                    // Gravity Orb
                    { id: 'grav_basic',    type:'gravity', name:'Standard Core',     cost: 0,    reqWave:0,  rarity:'common',    colors:['#7dd3fc','#334155'], ring:'#60a5fa', rings:1 },
                    { id: 'grav_azure',    type:'gravity', name:'Azure Singularity', cost: 1800, reqWave:7,  rarity:'uncommon',  colors:['#3b82f6','#1f2937'], ring:'#22d3ee', rings:1 },
                    { id: 'grav_ember',    type:'gravity', name:'Ember Singularity', cost: 3800, reqWave:10, rarity:'rare',      colors:['#f97316','#1f2937'], ring:'#fb7185', rings:2 },
                    { id: 'grav_crystal',  type:'gravity', name:'Crystal Nexus',     cost: 6200, reqWave:14, rarity:'epic',      colors:['#93c5fd','#a78bfa'], ring:'#a78bfa', rings:2 },
                    { id: 'grav_quantum',  type:'gravity', name:'Quantum Well',      cost: 9200, reqWave:18, rarity:'legendary', colors:['#22d3ee','#0b1220'], ring:'#34d399', rings:3 },
                    { id: 'grav_void',     type:'gravity', name:'Void Singularity',  cost: 12400,reqWave:22, rarity:'legendary', colors:['#111827','#0ea5e9'], ring:'#7dd3fc', rings:3 },
                ];
                let catalog = SKINS;
                if (isDodgeCategory) {
                    // Ensure full 9-item catalog exists; add missing by id
                    const full = [
                        { id: 'dodge_basic',    name: 'Basic Trail',      cost: 0,    reqWave: 0,   rarity: 'common',    ribbon: ['#7dd3fc', '#0ea5e9'], ghostsAlpha: 1.0,  trailMul: 1.0,  ghostsCount: 1, sparkCount: 0, orbitals: 0, waveWidthMul: 1.0 },
                        { id: 'dodge_plasma',   name: 'Plasma Streak',    cost: 800,  reqWave: 3,   rarity: 'uncommon',  ribbon: ['#a78bfa', '#22d3ee'], ghostsAlpha: 1.05, trailMul: 1.08, ghostsCount: 2, sparkCount: 6, orbitals: 0, waveWidthMul: 1.0 },
                        { id: 'dodge_solar',    name: 'Solar Arc',        cost: 1600, reqWave: 5,   rarity: 'uncommon',  ribbon: ['#fbbf24', '#fb923c'], ghostsAlpha: 1.1,  trailMul: 1.12, ghostsCount: 2, sparkCount: 8, orbitals: 0, waveWidthMul: 1.1 },
                        { id: 'dodge_nebula',   name: 'Nebula Drift',     cost: 2600, reqWave: 7,   rarity: 'rare',      ribbon: ['#22d3ee', '#a78bfa'], ghostsAlpha: 1.18, trailMul: 1.18, ghostsCount: 3, sparkCount: 10, orbitals: 1, waveWidthMul: 1.1 },
                        { id: 'dodge_ember',    name: 'Ember Wake',       cost: 3400, reqWave: 9,   rarity: 'rare',      ribbon: ['#fb7185', '#f97316'], ghostsAlpha: 1.22, trailMul: 1.22, ghostsCount: 3, sparkCount: 12, orbitals: 0, waveWidthMul: 1.15 },
                        { id: 'dodge_void',     name: 'Void Echo',        cost: 4200, reqWave: 12,  rarity: 'epic',      ribbon: ['#0ea5e9', '#111827'], ghostsAlpha: 1.3,  trailMul: 1.25, ghostsCount: 4, sparkCount: 8, orbitals: 2, waveWidthMul: 1.2 },
                        { id: 'dodge_aurora',   name: 'Aurora Veil',      cost: 5200, reqWave: 14,  rarity: 'epic',      ribbon: ['#22d3ee', '#a7f3d0'], ghostsAlpha: 1.35, trailMul: 1.3,  ghostsCount: 4, sparkCount: 14, orbitals: 2, waveWidthMul: 1.25 },
                        { id: 'dodge_starlit',  name: 'Starlit Ribbon',   cost: 6600, reqWave: 16,  rarity: 'legendary', ribbon: ['#fde68a', '#93c5fd'], ghostsAlpha: 1.42, trailMul: 1.35, ghostsCount: 5, sparkCount: 16, orbitals: 3, waveWidthMul: 1.3 },
                        { id: 'dodge_chroma',   name: 'Chroma Surge',     cost: 8200, reqWave: 18,  rarity: 'legendary', ribbon: ['#34d399', '#60a5fa'], ghostsAlpha: 1.5,  trailMul: 1.45, ghostsCount: 5, sparkCount: 18, orbitals: 3, waveWidthMul: 1.35, colorCycle: true },
                        { id: 'dodge_thunder',  name: 'Thunder Break',    cost: 9800, reqWave: 20,  rarity: 'legendary', ribbon: ['#a3e635', '#22d3ee'], ghostsAlpha: 1.55, trailMul: 1.5,  ghostsCount: 6, sparkCount: 24, orbitals: 3, waveWidthMul: 1.4 },
                        { id: 'dodge_crystal',  name: 'Crystal Shards',   cost: 11000,reqWave: 22,  rarity: 'legendary', ribbon: ['#93c5fd', '#a78bfa'], ghostsAlpha: 1.6,  trailMul: 1.55, ghostsCount: 6, sparkCount: 20, orbitals: 4, waveWidthMul: 1.45 },
                        { id: 'dodge_blossom',  name: 'Blossom Bloom',    cost: 12200,reqWave: 24,  rarity: 'mythic',    ribbon: ['#f9a8d4', '#86efac'], ghostsAlpha: 1.65, trailMul: 1.6,  ghostsCount: 7, sparkCount: 26, orbitals: 4, waveWidthMul: 1.5 },
                        { id: 'dodge_icefire',  name: 'Icefire Rift',     cost: 13400,reqWave: 26,  rarity: 'mythic',    ribbon: ['#60a5fa', '#f97316'], ghostsAlpha: 1.7,  trailMul: 1.65, ghostsCount: 7, sparkCount: 28, orbitals: 5, waveWidthMul: 1.55 },
                        { id: 'dodge_photon',   name: 'Photon Stream',    cost: 14600,reqWave: 28,  rarity: 'mythic',    ribbon: ['#22d3ee', '#fde68a'], ghostsAlpha: 1.75, trailMul: 1.7,  ghostsCount: 8, sparkCount: 30, orbitals: 5, waveWidthMul: 1.6 },
                        { id: 'dodge_abyss',    name: 'Abyssal Wake',     cost: 15800,reqWave: 30,  rarity: 'ascended',  ribbon: ['#111827', '#a78bfa'], ghostsAlpha: 1.8,  trailMul: 1.8,  ghostsCount: 8, sparkCount: 22, orbitals: 6, waveWidthMul: 1.7 },
                        { id: 'dodge_singularity',name:'Singularity Arc', cost: 17000,reqWave: 32,  rarity: 'ascended',  ribbon: ['#0ea5e9', '#f87171'], ghostsAlpha: 1.85, trailMul: 1.9,  ghostsCount: 9, sparkCount: 34, orbitals: 6, waveWidthMul: 1.8, colorCycle: true },
                        { id: 'dodge_prismatic',name: 'Prismatic Nova',   cost: 18200,reqWave: 34,  rarity: 'ascended',  ribbon: ['#f472b6', '#34d399'], ghostsAlpha: 1.9,  trailMul: 2.0,  ghostsCount: 9, sparkCount: 36, orbitals: 7, waveWidthMul: 1.85, colorCycle: true },
                        { id: 'dodge_celestial',name: 'Celestial Crown',  cost: 19400,reqWave: 36,  rarity: 'celestial', ribbon: ['#eab308', '#60a5fa'], ghostsAlpha: 2.0,  trailMul: 2.2,  ghostsCount: 10,sparkCount: 40, orbitals: 8, waveWidthMul: 2.0, colorCycle: true }
                    ];
                    if (!Array.isArray(this.DODGE_SKINS)) this.DODGE_SKINS = [];
                    const have = new Set(this.DODGE_SKINS.map(x=>x && x.id));
                    for (const f of full) if (!have.has(f.id)) this.DODGE_SKINS.push(f);
                    catalog = this.DODGE_SKINS;
                }
                else if (isWeaponCategory) catalog = WEAPON_SKINS;
                else if (isMapsCategory) {
                    const MAPS = [
                        { id:'map_ember_fields', name:'Ember Fields',  rarity:'epic',      desc:'Floating ember particles on red-black. Touch burn flavor.', icon:'🔥' },
                        { id:'map_neon_core',    name:'Neon Core',     rarity:'common',    desc:'Neon grid on deep blue, dense stars. Balanced spawn/loot.', icon:'🗺️' },
                        { id:'map_frost_void',   name:'Frost Void',    rarity:'uncommon',  desc:'Cold teal fog, fewer bigger stars. Slightly reduced visibility.', icon:'❄️' },
                        { id:'map_storm_ridge',  name:'Storm Ridge',   rarity:'rare',      desc:'Storm clouds with lightning streaks. Burst-like wave pacing.', icon:'⛰️' },
                        { id:'map_solar_dunes',  name:'Solar Dunes',   rarity:'uncommon',  desc:'Amber sand-wave bands and warm glow. More frequent bonus orbs.', icon:'🏜️' },
                        { id:'map_abyss_bloom',  name:'Abyss Bloom',   rarity:'rare',      desc:'Bioluminescent blooms over dark purple. Subtle dodge aura zones.', icon:'🌌' },
                        { id:'map_crystal_nexus',name:'Crystal Nexus', rarity:'epic',      desc:'Geometric crystal fields, prismatic flickers. Occasional ricochet.', icon:'💎' },
                        { id:'map_tidal_mist',   name:'Tidal Mist',    rarity:'rare',      desc:'Layered slow-moving wave silhouettes and mist.', icon:'🌊' },
                        { id:'map_city_circuit', name:'City Circuit',  rarity:'legendary', desc:'Neon circuit grid and pulsing nodes. Node-speed hotspots.', icon:'🏙️' },
                        { id:'map_void_labyrinth',name:'Void Labyrinth',rarity:'legendary', desc:'Minimal neon wall outlines over fog. Light maze feel.', icon:'🧩' },
                    ];
                    catalog = MAPS;
                }

                // Sort: keep explicit order for maps; otherwise sort by cost asc then reqWave asc
                const sorted = isMapsCategory ? [...catalog] : [...catalog].sort((a,b)=> (a.cost||0)-(b.cost||0) || (a.reqWave||0)-(b.reqWave||0));
                const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
                if (shopPage >= totalPages) shopPage = totalPages - 1;
                if (shopPage < 0) shopPage = 0;
                const slice = sorted.slice(shopPage * pageSize, shopPage * pageSize + pageSize);
                if (pageLabel) pageLabel.textContent = `${shopPage + 1} / ${totalPages}`;
                if (prevBtn) prevBtn.disabled = (shopPage === 0);
                if (nextBtn) nextBtn.disabled = (shopPage >= totalPages - 1);

                slice.forEach((s) => {
                    const owned = isDodgeCategory ? (this.isOwnedDodge ? this.isOwnedDodge(s.id) : false)
                               : isWeaponCategory ? (this.isOwnedWeapon ? this.isOwnedWeapon(s.id) : false)
                               : isMapsCategory ? true
                               : (this.isOwned ? this.isOwned(s.id) : false);
                    // Owned items should always be considered unlocked/selectable
                    const unlockedByProgress = isDodgeCategory ? (bestWave >= (s.reqWave||0))
                                            : isWeaponCategory ? (bestWave >= (s.reqWave||0))
                                            : isMapsCategory ? true
                                            : isUnlocked(s, { bestWave, bestScore });
                    const unlocked = owned || unlockedByProgress;
                    const canBuy = !owned && unlockedByProgress && coins >= (s.cost||0);
                    const card = document.createElement('div');
                    card.className = `shop-item rarity-${s.rarity} ${unlocked ? (canBuy ? 'affordable' : '') : 'locked'}`;

                    const costLbl = tr('costLabel','Cost');
                    const reqWaveLbl = tr('reqWaveLabel','Req Wave');
                    const lockedTxt = tr('locked','Locked');
                    const selectTxt = tr('select','Select');
                    const selectedTxt = tr('selected','Selected');
                    const buyTxt = tr('buy','Buy');
                    const insufficientTxt = tr('insufficientCoins','Insufficient Coins');

                    let previewHTML = '';
                    let descHTML = '';
                    // Determine per-card selected state
                    const isSel = isWeaponCategory
                        ? !!(selectedWeapons && s.type && selectedWeapons[s.type] === s.id)
                        : (selectedId === s.id);
                    if (isDodgeCategory) {
                        // Animated in-game-like preview: moving orb + gradient ribbon + ghost afterimages
                        const c0 = (s.ribbon && s.ribbon[0]) || '#7dd3fc';
                        const c1 = (s.ribbon && s.ribbon[1]) || '#0ea5e9';
                        const trailLbl = tr('trailLabel','Trail');
                        previewHTML = `
                          <div class="skin-preview">
                            <div class="skin-ambient"></div>
                            <svg class="skin-stage" viewBox="0 0 140 84" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <linearGradient id="ribbon_${s.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stop-color="${c0}" stop-opacity="0.28"/>
                                  <stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
                                </linearGradient>
                                <filter id="soft_${s.id}">
                                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                                </filter>
                              </defs>
                              <!-- Simulated dodge direction: left to right movement with trailing ribbon -->
                              <g>
                                <!-- Ribbon shape behind the orb -->
                                <path d="M 40 42 C 20 36, 6 42, -20 42 L -20 40 C 6 40, 20 34, 40 38 Z"
                                      transform="translate(60,0)"
                                      fill="url(#ribbon_${s.id})" filter="url(#soft_${s.id})">
                                  <animateTransform attributeName="transform" type="translate"
                                                    values="60,0; 70,0; 60,0" dur="1.8s" repeatCount="indefinite" />
                                </path>
                                <!-- Ghost afterimages (fade + shrink) -->
                                <g>
                                  <circle cx="60" cy="42" r="10" fill="${c0}" fill-opacity="0.25">
                                    <animate attributeName="cx" values="60; 50; 60" dur="1.8s" repeatCount="indefinite" />
                                    <animate attributeName="fill-opacity" values="0.25; 0.05; 0.25" dur="1.8s" repeatCount="indefinite" />
                                    <animate attributeName="r" values="10; 8; 10" dur="1.8s" repeatCount="indefinite" />
                                  </circle>
                                  <circle cx="55" cy="42" r="8" fill="${c1}" fill-opacity="0.18">
                                    <animate attributeName="cx" values="55; 45; 55" dur="1.8s" repeatCount="indefinite" />
                                    <animate attributeName="fill-opacity" values="0.18; 0.04; 0.18" dur="1.8s" repeatCount="indefinite" />
                                    <animate attributeName="r" values="8; 6; 8" dur="1.8s" repeatCount="indefinite" />
                                  </circle>
                                </g>
                                <!-- Orbitals rotating around center -->
                                <g transform="translate(70,42)">
                                  <g>
                                    <circle r="2.5" cx="14" cy="0" fill="${c1}" fill-opacity="0.7" />
                                    <circle r="2" cx="-14" cy="0" fill="${c0}" fill-opacity="0.6" />
                                    <animateTransform attributeName="transform" type="rotate" values="0;360" dur="2.4s" repeatCount="indefinite" />
                                  </g>
                                </g>
                                <!-- Particles twinkling along the ribbon -->
                                <g>
                                  <circle cx="68" cy="38" r="1.8" fill="${c0}">
                                    <animate attributeName="cy" values="38; 40; 38" dur="1.2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.9; 0.2; 0.9" dur="1.2s" repeatCount="indefinite" />
                                  </circle>
                                  <circle cx="64" cy="46" r="1.6" fill="${c1}">
                                    <animate attributeName="cy" values="46; 44; 46" dur="1.2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.8; 0.2; 0.8" dur="1.2s" repeatCount="indefinite" />
                                  </circle>
                                  <circle cx="58" cy="41" r="1.4" fill="${c0}">
                                    <animate attributeName="cx" values="58; 55; 58" dur="1.4s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.7; 0.2; 0.7" dur="1.4s" repeatCount="indefinite" />
                                  </circle>
                                </g>
                                <!-- Player orb moving slightly to the right and back -->
                                <circle cx="70" cy="42" r="10" fill="white" stroke="${c0}" stroke-width="2" filter="url(#soft_${s.id})">
                                  <animate attributeName="cx" values="70; 80; 70" dur="1.8s" repeatCount="indefinite" />
                                </circle>
                              </g>
                            </svg>
                          </div>`;
                        descHTML = `<div class="shop-desc">${trailLbl}: ${c0} → ${c1}</div>`;
                    } else if (isWeaponCategory) {
                        // Preview per-weapon type
                        const primary = (s.colors && s.colors[0]) || '#7dd3fc';
                        const secondary = (s.colors && s.colors[1]) || '#334155';
                        if (s.type === 'turret') {
                            previewHTML = `
                              <div class="skin-preview">
                                <div class="skin-ambient"></div>
                                <svg class="skin-stage" viewBox="0 0 140 84" xmlns="http://www.w3.org/2000/svg">
                                  <g transform="translate(20,42)">
                                    <rect x="0" y="-6" width="26" height="12" rx="3" fill="${secondary}" stroke="${primary}" stroke-width="2"/>
                                    <rect x="26" y="-3" width="18" height="6" fill="#334155" />
                                    <circle cx="46" cy="0" r="4" fill="${s.muzzle||'#22ff22'}" fill-opacity="0.7" />
                                  </g>
                                </svg>
                              </div>`;
                        } else if (s.type === 'electric') {
                            previewHTML = `
                              <div class="skin-preview">
                                <div class="skin-ambient"></div>
                                <svg class="skin-stage" viewBox="0 0 140 84" xmlns="http://www.w3.org/2000/svg">
                                  <polyline points="20,20 40,44 60,28 80,50 100,34 120,46" fill="none" stroke="${s.bolt||primary}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite"/>
                                  </polyline>
                                </svg>
                              </div>`;
                        } else if (s.type === 'gravity') {
                            previewHTML = `
                              <div class="skin-preview">
                                <div class="skin-ambient"></div>
                                <svg class="skin-stage" viewBox="0 0 140 84" xmlns="http://www.w3.org/2000/svg">
                                  <defs>
                                    <radialGradient id="g_${s.id}" cx="50%" cy="50%" r="50%">
                                      <stop offset="0%" stop-color="${primary}" stop-opacity="0.6"/>
                                      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
                                    </radialGradient>
                                  </defs>
                                  <circle cx="70" cy="42" r="10" fill="white" stroke="${primary}" stroke-width="2"/>
                                  <circle cx="70" cy="42" r="20" fill="none" stroke="${s.ring||primary}" stroke-width="1" stroke-dasharray="6 4">
                                    <animate attributeName="stroke-dashoffset" values="0;20" dur="2s" repeatCount="indefinite" />
                                  </circle>
                                  <circle cx="70" cy="42" r="30" fill="url(#g_${s.id})" />
                                </svg>
                              </div>`;
                        }
                        descHTML = `<div class="shop-desc">${s.type}</div>`;
                    } else if (isMapsCategory) {
                        // Simple map preview with emoji/icon
                        previewHTML = `
                          <div class="skin-preview">
                            <div class="skin-ambient"></div>
                            <div style="display:flex; width:100%; height:100%; align-items:center; justify-content:center; font-size:32px;">${s.icon||'🗺️'}</div>
                          </div>`;
                        descHTML = `<div class="shop-desc">${s.desc||''}</div>`;
                    } else {
                        // Build SVG preview per shape with rarity-based effects
                        let shapeSVG = '';
                        const stroke = s.color;
                        const fill = s.color + '44';
                        if (s.shape === 'circle') {
                            shapeSVG = `<circle cx="70" cy="42" r="18" fill="${fill}" stroke="${stroke}" stroke-width="3" filter="url(#glow)" />`;
                        } else if (s.shape === 'triangle') {
                            shapeSVG = `<polygon points="70,20 52,64 88,64" fill="${fill}" stroke="${stroke}" stroke-width="3" filter="url(#glow)" />`;
                        } else if (s.shape === 'star') {
                            shapeSVG = `<polygon points="70,18 76,36 96,36 80,48 86,66 70,54 54,66 60,48 44,36 64,36" fill="${fill}" stroke="${stroke}" stroke-width="3" filter="url(#glow)" />`;
                        } else {
                            shapeSVG = `<circle cx="70" cy="42" r="16" fill="${fill}" stroke="${stroke}" stroke-width="3" filter="url(#glow)" />`;
                        }
                        let wrappedShapeOpen = '<g>';
                        let wrappedShapeClose = '</g>';
                        let extraSVG = '';
                        switch (s.rarity) {
                            case 'uncommon':
                                wrappedShapeOpen = `<g>` + `<animateTransform attributeName="transform" type="scale" values="1;1.06;1" dur="2.2s" repeatCount="indefinite"/>`;
                                break;
                            case 'rare':
                                wrappedShapeOpen = `<g>` + `<animateTransform attributeName="transform" type="rotate" from="0 70 42" to="360 70 42" dur="8s" repeatCount="indefinite"/>`;
                                break;
                            case 'epic':
                                extraSVG += `
                                  <g transform="translate(70 42)">
                                    <circle r="3" cx="28" cy="0" fill="${stroke}" />
                                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite"/>
                                  </g>
                                  <g transform="translate(70 42)">
                                    <circle r="2" cx="-20" cy="0" fill="${stroke}" />
                                    <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="3s" repeatCount="indefinite"/>
                                  </g>`;
                                break;
                            case 'legendary':
                                extraSVG += `
                                  <g transform="translate(70 42)">
                                    <circle r="3" cx="30" cy="0" fill="${stroke}" />
                                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3.6s" repeatCount="indefinite"/>
                                  </g>
                                  <g transform="translate(70 42)">
                                    <circle r="2.5" cx="-24" cy="0" fill="${stroke}" />
                                    <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="3s" repeatCount="indefinite"/>
                                  </g>
                                  <g transform="translate(70 42)">
                                    <circle r="2" cx="0" cy="-18" fill="${stroke}" />
                                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.4s" repeatCount="indefinite"/>
                                  </g>
                                  <circle cx="70" cy="42" r="26" fill="none" stroke="${stroke}" stroke-width="1" stroke-dasharray="6 4">
                                    <animate attributeName="stroke-dashoffset" values="0;20" dur="2s" repeatCount="indefinite"/>
                                  </circle>`;
                                break;
                        }
                        const shapeLbl = tr('shapeLabel','Shape');
                        const colorLbl = tr('colorLabel','Color');
                        previewHTML = `
                          <div class="skin-preview">
                            <div class="skin-ambient"></div>
                            <svg class="skin-stage" viewBox="0 0 140 84" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <filter id="glow">
                                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                                  <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                  </feMerge>
                                </filter>
                              </defs>
                              ${wrappedShapeOpen}${shapeSVG}${wrappedShapeClose}
                              ${extraSVG}
                            </svg>
                          </div>`;
                        const shapeTxt = s && s.shape ? String(s.shape).toUpperCase() : '-';
                        const colorTxt = s && s.color ? String(s.color) : '-';
                        descHTML = `<div class="shop-desc">${shapeLbl}: ${shapeTxt} • ${colorLbl}: ${colorTxt}</div>`;
                    }

                    card.innerHTML = `
                        ${previewHTML}
                        <div class="shop-title">${s.name}</div>
                        ${descHTML}
                        ${isMapsCategory ? '' : `<div class="shop-cost ${owned ? '' : (unlocked ? 'affordable' : 'unaffordable')}">${costLbl}: ${s.cost} • ${reqWaveLbl}: ${s.reqWave}</div>`}
                        <div class="price-badge">${tr('rarity_'+(s.rarity||''), (s.rarity||'').toUpperCase())}</div>
                        <div class="lock-overlay"><span class="chain">${(unlocked && !owned) ? '' : (unlocked ? '' : lockedTxt)}</span></div>
                        <div style="margin-top:8px; display:flex; gap:8px;">
                          ${isMapsCategory
                            ? `<button class="primary-btn" data-act="select" style="width:auto; padding:6px 10px;" ${isSel ? 'disabled' : ''}>${isSel ? selectedTxt : selectTxt}</button>`
                            : owned ? `<button class="primary-btn" data-act="select" style="width:auto; padding:6px 10px;" ${isSel ? 'disabled' : ''}>${isSel ? selectedTxt : selectTxt}</button>`
                            : unlockedByProgress ? (canBuy ? `<button class="primary-btn" data-act="buy" style="width:auto; padding:6px 10px;">${buyTxt} (${s.cost})</button>`
                                                   : `<button class="primary-btn" style="width:auto; padding:6px 10px;" disabled>${insufficientTxt}</button>`)
                                               : `<button class="primary-btn" style="width:auto; padding:6px 10px;" disabled>${lockedTxt}</button>`}
                        </div>
                    `;
                    // Bind action button
                    const buyBtn = card.querySelector('button[data-act="buy"]');
                    if (buyBtn) {
                        buyBtn.addEventListener('click', () => {
                            this.playClick && this.playClick();
                            const ok = isDodgeCategory
                                ? (this.purchaseDodgeSkin && this.purchaseDodgeSkin(s))
                                : isWeaponCategory
                                    ? (this.purchaseWeaponSkin && this.purchaseWeaponSkin(s))
                                    : (this.purchaseSkin && this.purchaseSkin(s));
                            renderMainShop();
                        });
                    }
                    const selBtn = card.querySelector('button[data-act="select"]');
                    if (selBtn) {
                        selBtn.addEventListener('click', () => {
                            this.playClick && this.playClick();
                            if (isDodgeCategory) {
                                this.saveSelectedDodgeSkin && this.saveSelectedDodgeSkin(s);
                            } else if (isWeaponCategory) {
                                if (s.type) this.saveSelectedWeaponSkin && this.saveSelectedWeaponSkin(s.type, s.id, s);
                            } else if (isMapsCategory) {
                                saveSelectedMap(s);
                                try { this.selectedMapId = s.id; } catch(_) {}
                            } else {
                                saveSelectedSkin(s);
                                try { if (this.player) { this.player.color = s.color; this.player.shape = s.shape; } } catch(_) {}
                            }
                            renderMainShop();
                        });
                    }
                    mainShopItems.appendChild(card);
                });
            };

            if (shopBtn && mainShop) {
                shopBtn.addEventListener('click', () => {
                    this.playClick && this.playClick();
                    renderMainShop();
                    mainShop.style.display = 'flex';
                    this.setCursorVisible && this.setCursorVisible(true);
                });
            }
            if (mainShop && mainShopCloseBtn && !mainShopCloseBtn._bound) {
                mainShopCloseBtn.addEventListener('click', () => {
                    this.playClick && this.playClick();
                    mainShop.style.display = 'none';
                });
                mainShopCloseBtn._bound = true;
            }
            if (prevBtn && !prevBtn._bound) {
                prevBtn.addEventListener('click', () => {
                    this.playClick && this.playClick();
                    shopPage = Math.max(0, shopPage - 1);
                    renderMainShop();
                });
                prevBtn._bound = true;
            }
            if (nextBtn && !nextBtn._bound) {
                nextBtn.addEventListener('click', () => {
                    this.playClick && this.playClick();
                    shopPage = shopPage + 1;
                    renderMainShop();
                });
                nextBtn._bound = true;
            }
        } catch(_) {}

        charactersOverlay.addEventListener('click', (e) => {
                if (e.target === charactersOverlay) {
                    this.playClick && this.playClick();
                    charactersOverlay.style.display = 'none';
                }
            });
            window.addEventListener('keydown', (e) => {
                if (charactersOverlay.style.display === 'block' && (e.key === 'Escape' || e.key === 'Esc')) {
                    this.playClick && this.playClick();
                    charactersOverlay.style.display = 'none';
                }
            });
        

        // Start screen: Builds overlay (open like How To)
        const buildsBtn = document.getElementById('buildsBtn');
        const buildsOverlay = document.getElementById('buildsOverlay');
        const buildsCloseBtn = document.getElementById('buildsCloseBtn');
        if (buildsBtn && buildsOverlay) {
            buildsBtn.addEventListener('click', () => {
                this.playClick && this.playClick();
                buildsOverlay.style.display = 'block';
                this.setCursorVisible && this.setCursorVisible(true);
            });
        }
        if (buildsCloseBtn && buildsOverlay) {
            buildsCloseBtn.addEventListener('click', () => {
                this.playClick && this.playClick();
                buildsOverlay.style.display = 'none';
            });
        }
        if (buildsOverlay) {
            buildsOverlay.addEventListener('click', (e) => {
                if (e.target === buildsOverlay) {
                    this.playClick && this.playClick();
                    buildsOverlay.style.display = 'none';
                }
            });
            window.addEventListener('keydown', (e) => {
                if (buildsOverlay.style.display === 'block' && (e.key === 'Escape' || e.key === 'Esc')) {
                    this.playClick && this.playClick();
                    buildsOverlay.style.display = 'none';
                }
            });
        }

        if (this.isMobile()) {
            const dFov = document.getElementById('desktopFovRow');
            const dSens = document.getElementById('desktopSensitivityRow');
            if (dFov) dFov.style.display = 'none';
            if (dSens) dSens.style.display = 'none';
        }
        // Start screen: desktop FOV
        const startFovRange = document.getElementById('startFovRange');
        const startFovValue = document.getElementById('startFovValue');
        if (startFovRange && startFovValue) {
            startFovRange.value = this.desktopFovScale.toFixed(2);
            startFovValue.textContent = `${this.desktopFovScale.toFixed(2)}x`;
            startFovRange.addEventListener('input', () => {
                const v = parseFloat(startFovRange.value);
                if (!isNaN(v)) this.desktopFovScale = Math.max(0.8, Math.min(1.4, v));
                startFovValue.textContent = `${this.desktopFovScale.toFixed(2)}x`;
            });
        }
        // Start screen: sensitivity (desktop)
        const startSensitivityRange = document.getElementById('startSensitivityRange');
        const startSensitivityValue = document.getElementById('startSensitivityValue');
        if (startSensitivityRange && startSensitivityValue) {
            startSensitivityRange.value = this.mouseSensitivity.toFixed(2);
            startSensitivityValue.textContent = `${this.mouseSensitivity.toFixed(2)}x`;
            startSensitivityRange.addEventListener('input', () => {
                const v = parseFloat(startSensitivityRange.value);
                if (!isNaN(v)) this.mouseSensitivity = Math.max(0.5, Math.min(2.0, v));
                startSensitivityValue.textContent = `${this.mouseSensitivity.toFixed(2)}x`;
            });
        }
        // Start screen: sound/music toggles and volume
        const startSoundToggleBtn = document.getElementById('startSoundToggleBtn');
        if (startSoundToggleBtn) startSoundToggleBtn.addEventListener('click', () => { this.playClick(); this.toggleSound(); });
        const startMusicToggleBtn = document.getElementById('startMusicToggleBtn');
        if (startMusicToggleBtn) startMusicToggleBtn.addEventListener('click', () => { this.playClick(); this.toggleMusic(); });
        const startVolumeRange = document.getElementById('startVolumeRange');
        const startVolumeValue = document.getElementById('startVolumeValue');
        if (startVolumeRange && startVolumeValue) {
            startVolumeRange.value = String(this.volume);
            startVolumeValue.textContent = `${Math.round(this.volume * 100)}%`;
            startVolumeRange.addEventListener('input', () => {
                const v = parseFloat(startVolumeRange.value);
                if (!isNaN(v)) this.volume = Math.max(0, Math.min(1, v));
                startVolumeValue.textContent = `${Math.round(this.volume * 100)}%`;
                this.applyAudioSettings();
            });
        }
        // Helper: decide if we should stay on the same page (mobile/fullscreen)
        function shouldStayInPage(){
            try {
                if (document.fullscreenElement) return true;
            } catch(_){ }
            try {
                if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
            } catch(_){ }
            try {
                if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true;
            } catch(_){ }
            return false;
        }

        // (removed legacy characters/builds handlers; using unified overlay handlers earlier)
        // In-game menu buttons
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => { this.playClick(); this.resumeGame(); });
            resumeBtn.addEventListener('mouseover', () => this.playHover());
        }
        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', () => { this.playClick(); this.toggleSound(); });
            soundToggleBtn.addEventListener('mouseover', () => this.playHover());
        }
        const musicToggleBtn = document.getElementById('musicToggleBtn');
        if (musicToggleBtn) {
            musicToggleBtn.addEventListener('click', () => { this.playClick(); this.toggleMusic(); });
            musicToggleBtn.addEventListener('mouseover', () => this.playHover());
        }
        // In-game menu: show FOV slider on mobile; sensitivity label generic on mobile
        const fovRow = document.getElementById('fovRow');
        const sensRow = document.getElementById('sensitivityRow');
        if (this.isMobile()) {
            if (fovRow) fovRow.style.display = 'block';
            if (sensRow) sensRow.style.display = 'block';
            try { const sensLabel = document.getElementById('sensitivityLabel'); if (sensLabel) sensLabel.textContent = this.t('sensitivity'); } catch(_){ }
        } else {
            try { const sensLabel = document.getElementById('sensitivityLabel'); if (sensLabel) sensLabel.textContent = this.t('mouseSensitivity').replace(/[:：]\s*$/, ''); } catch(_){ }
        }
        const fovRange = document.getElementById('fovRange');
        const fovValue = document.getElementById('fovValue');
        if (fovRange) {
            // Initialize with current value
            try { fovRange.value = this.mobileFovScale.toFixed(2); } catch {}
            if (fovValue) fovValue.textContent = (this.mobileFovScale.toFixed(2) + 'x');
            fovRange.addEventListener('input', () => {
                const v = parseFloat(fovRange.value);
                if (!isNaN(v)) this.mobileFovScale = Math.max(0.7, Math.min(1.5, v));
                if (fovValue) fovValue.textContent = this.mobileFovScale.toFixed(2) + 'x';
                // Apply immediately by resizing canvas (recomputes mobile zoom)
                if (this.isMobile()) this.resizeCanvas();
            });
        }
        const backToMenuIngameBtn = document.getElementById('backToMenuIngameBtn');
        if (backToMenuIngameBtn) {
            backToMenuIngameBtn.addEventListener('click', () => {
                this.playClick();
                try { this.paused = true; } catch(_) {}
                try { const igm = document.getElementById('inGameMenu'); if (igm) igm.style.display = 'none'; } catch(_) {}
                // Show start screen without reloading to preserve language and settings
                try {
                    // Clear gameplay class so CSS doesn't hide start screen
                    try {
                        document.body.classList.remove('playing');
                        document.body.classList.remove('menu-open');
                        document.body.classList.remove('shop-open');
                    } catch(_) {}
                    // Hide in-game HUD elements explicitly
                    try { const ac = document.querySelector('.ability-cooldown'); if (ac) ac.style.display = 'none'; } catch(_) {}
                    try { const cb = document.getElementById('consumableBar'); if (cb) cb.style.display = 'none'; } catch(_) {}
                    try { const timer = document.getElementById('timer'); if (timer) timer.style.display = 'none'; } catch(_) {}
                    try { const gui = document.getElementById('gameUI'); if (gui) gui.style.display = 'none'; } catch(_) {}
                    try { const swl = document.getElementById('shopWaveLabel'); if (swl) swl.style.display = 'none'; } catch(_) {}
                    const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'block';
                    this.setCursorVisible(true);
                    this.gameState = 'menu';
                    // Sync body classes for menu state
                    try { this.syncBodyPlaying && this.syncBodyPlaying(); } catch(_) {}
                    // Update touch controls visibility for menu state
                    try { this.updateTouchControlsVisibility && this.updateTouchControlsVisibility(); } catch(_) {}
                    // Ensure language/UI reapplies
                    this.applyLanguage && this.applyLanguage();
                    this.updateVolumeUI && this.updateVolumeUI();
                    // Extra safety: hide specific HUD rows if any remain
                    try { const ls = document.getElementById('livesStat'); if (ls) ls.style.display = 'none'; } catch(_) {}
                    try { const mt = document.getElementById('materialsTop'); if (mt) mt.parentElement && (mt.parentElement.style.display = 'none'); } catch(_) {}
                } catch(_) {}
            });
            backToMenuIngameBtn.addEventListener('mouseover', () => this.playHover());
        }

        // Sensitivity slider wiring
        const sensRange = document.getElementById('sensitivityRange');
        const sensValue = document.getElementById('sensitivityValue');
        if (sensRange && sensValue) {
            sensRange.value = this.mouseSensitivity.toFixed(2);
            sensValue.textContent = `${this.mouseSensitivity.toFixed(2)}x`;
            sensRange.addEventListener('input', (e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) {
                    this.mouseSensitivity = Math.max(0.5, Math.min(2.0, v));
                    sensValue.textContent = `${this.mouseSensitivity.toFixed(2)}x`;
                }
            });
        }

        // Volume slider wiring (align to settings.masterVolume)
        const volRange = document.getElementById('volumeRange');
        const volValue = document.getElementById('volumeValue');
        if (volRange && volValue && !volRange.__legacyBound) {
            const s = this.settings || { masterVolume: 1 };
            volRange.value = String(s.masterVolume ?? 1);
            volValue.textContent = `${Math.round((s.masterVolume ?? 1) * 100)}%`;
            try { this.bindSliderActive && this.bindSliderActive(volRange); } catch(_) {}
            volRange.addEventListener('input', (e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) {
                    if (!this.settings) this.settings = {};
                    this.settings.masterVolume = Math.max(0, Math.min(1, v));
                    volValue.textContent = `${Math.round(this.settings.masterVolume * 100)}%`;
                    try { this.saveSettings && this.saveSettings(); } catch(_) {}
                    this.applyAudioSettings();
                }
            });
            volRange.__legacyBound = true;
            volRange.__bound = true;
        }
        // Touch skill button
        const skillBtn = document.getElementById('skillBtn');
        if (skillBtn) {
            const trigger = (ev) => { ev.preventDefault(); if (this.gameState==='playing' && !this.paused) this.useAbility(); };
            skillBtn.addEventListener('touchstart', trigger, { passive: false });
            skillBtn.addEventListener('click', trigger);
        }
        // Ability icon click - enable pointer events on container and icon
        const abilityWrap = document.querySelector('.ability-cooldown');
        if (abilityWrap) abilityWrap.style.pointerEvents = 'auto';
        const abilityIcon = document.getElementById('abilityIcon');
        if (abilityIcon) {
            abilityIcon.style.pointerEvents = 'auto';
            abilityIcon.title = this.t('abilityIconTitleShift'); // Update tooltip text to reference Shift
            abilityIcon.addEventListener('click', () => this.useAbility());
        }

        // Keyboard controls: WASD movement (desktop), Space = dodge, Shift = ability, ESC = pause menu
        window.addEventListener('keydown', (e) => {
            const key = e.key;
            // Movement keys (desktop)
            if (!this.usingTouch) {
                if (key === 'w' || key === 'W') this.keys.w = true;
                if (key === 'a' || key === 'A') this.keys.a = true;
                if (key === 's' || key === 'S') this.keys.s = true;
                if (key === 'd' || key === 'D') this.keys.d = true;
                if (key === 'ArrowUp') this.keys.ArrowUp = true;
                if (key === 'ArrowLeft') this.keys.ArrowLeft = true;
                if (key === 'ArrowDown') this.keys.ArrowDown = true;
                if (key === 'ArrowRight') this.keys.ArrowRight = true;
            }
            // Dodge with Space while actively playing and not paused
            if ((key === ' ' || key === 'Spacebar' || key === 'Space') && this.gameState === 'playing' && !this.paused) {
                e.preventDefault(); // prevent page scroll on Space
                this.triggerDodge();
            }
            // Use ability with Shift
            if ((key === 'Shift' || key === 'ShiftLeft' || key === 'ShiftRight') && this.gameState === 'playing' && !this.paused) {
                e.preventDefault();
                this.useAbility();
            }
            // Toggle pause menu with Escape while in playing state
            if ((key === 'Escape' || key === 'Esc') && this.gameState === 'playing') {
                if (e.repeat) return; // ignore key auto-repeat for ESC
                e.preventDefault();
                this.togglePause();
            }
            // F1: cycle jump to waves 4, 9, 14, 19
            if (key === 'F1') {
                e.preventDefault();
                const targets = [4, 9, 14, 19];
                const idx = Math.max(0, this.f1JumpIndex | 0) % targets.length;
                const to = targets[idx];
                this.f1JumpIndex = (idx + 1) % targets.length;
                if (typeof this.jumpToWave === 'function') this.jumpToWave(to);
            }
        });
        window.addEventListener('keyup', (e) => {
            const key = e.key;
            if (!this.usingTouch) {
                if (key === 'w' || key === 'W') this.keys.w = false;
                if (key === 'a' || key === 'A') this.keys.a = false;
                if (key === 's' || key === 'S') this.keys.s = false;
                if (key === 'd' || key === 'D') this.keys.d = false;
                if (key === 'ArrowUp') this.keys.ArrowUp = false;
                if (key === 'ArrowLeft') this.keys.ArrowLeft = false;
                if (key === 'ArrowDown') this.keys.ArrowDown = false;
                if (key === 'ArrowRight') this.keys.ArrowRight = false;
            }
        });
    }

    setupTouchControls() {
        const tc = document.getElementById('touchControls');
        const joy = document.getElementById('joystick');
        const nub = document.getElementById('joystickNub');
        const pauseBtn = document.getElementById('pauseBtnMobile');
        const dodgeBtn = document.getElementById('dodgeBtn');
        // Show touch controls only on touch devices
        this.updateTouchControlsVisibility();
        if (typeof document !== 'undefined' && document.body) {
            try { document.body.classList.toggle('touch', !!this.usingTouch); } catch(_) {}
        }
        // Bind pause button
        if (pauseBtn) {
            pauseBtn.onclick = () => {
                if (!this.paused) this.pauseGame();
            };
        }
        // Bind mobile dodge button
        if (dodgeBtn) {
            const onDodge = (ev) => { ev.preventDefault(); if (this.gameState==='playing' && !this.paused) this.triggerDodge(); };
            dodgeBtn.addEventListener('touchstart', onDodge, { passive: false });
            dodgeBtn.addEventListener('click', onDodge);
        }
        if (!this.usingTouch || !joy || !nub) return;
        const radiusOuter = joy.clientWidth * 0.5;
        this.joystick.radius = Math.max(40, radiusOuter * 0.45);
        const getCenter = () => {
            const rect = joy.getBoundingClientRect();
            return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
        };

        const setNub = (dx, dy) => {
            const maxR = this.joystick.radius;
            const mag = Math.max(1e-6, Math.sqrt(dx*dx + dy*dy));
            const clamped = Math.min(maxR, mag);
            const nx = dx / mag * clamped; const ny = dy / mag * clamped;
            nub.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
        };

        const onStart = (e) => {
            e.preventDefault();
            this.joystick.active = true;
            nub.style.transition = 'none';
            const t = e.touches ? e.touches[0] : e;
            const c = getCenter();
            const dx = t.clientX - c.x; const dy = t.clientY - c.y;
            const mag = Math.max(1e-6, Math.sqrt(dx*dx + dy*dy));
            this.joystick.vec = new Vector2(dx / mag, dy / mag);
            setNub(dx, dy);
        };
        const onMove = (e) => {
            if (!this.joystick.active) return;
            e.preventDefault();
            const t = e.touches ? e.touches[0] : e;
            const c = getCenter();
            const dx = t.clientX - c.x; const dy = t.clientY - c.y;
            const mag = Math.max(1e-6, Math.sqrt(dx*dx + dy*dy));
            this.joystick.vec = new Vector2(dx / mag, dy / mag);
            setNub(dx, dy);
        };
        const onEnd = (e) => {
            e.preventDefault();
            this.joystick.active = false;
            this.joystick.vec = new Vector2(0,0);
            nub.style.transition = 'transform 0.12s ease-out';
            nub.style.transform = 'translate(-50%, -50%)';
        };

        joy.addEventListener('touchstart', onStart, { passive: false });
        joy.addEventListener('touchmove', onMove, { passive: false });
        joy.addEventListener('touchend', onEnd, { passive: false });
        joy.addEventListener('touchcancel', onEnd, { passive: false });
        // Optional desktop testing via mouse
        joy.addEventListener('mousedown', (e)=>{ if (!this.usingTouch) onStart(e); });
        window.addEventListener('mousemove', (e)=>{ if (!this.usingTouch) onMove(e); });
        window.addEventListener('mouseup', (e)=>{ if (!this.usingTouch) onEnd(e); });
    }

    updateTouchControlsVisibility() {
        const tc = document.getElementById('touchControls');
        if (!tc) return;
        const shouldShow = !!this.usingTouch && this.gameState === 'playing' && !this.paused;
        tc.style.display = shouldShow ? 'block' : 'none';
        if (shouldShow) {
            try { tc.style.pointerEvents = 'auto'; } catch(_) {}
            try { this.ensureTouchButtonsBound && this.ensureTouchButtonsBound(); } catch(_) {}
        }
    }

    // Ensure mobile touch buttons remain bound after opening/closing overlays
    ensureTouchButtonsBound() {
        try {
            const skillBtn = document.getElementById('skillBtn');
            if (skillBtn && !skillBtn.__boundGame) {
                const trigger = (ev) => { ev.preventDefault(); if (this.gameState==='playing' && !this.paused) this.useAbility(); };
                skillBtn.addEventListener('touchstart', trigger, { passive: false });
                skillBtn.addEventListener('click', trigger);
                skillBtn.__boundGame = true;
            }
        } catch(_) {}
        try {
            const dodgeBtn = document.getElementById('dodgeBtn');
            if (dodgeBtn && !dodgeBtn.__boundGame) {
                const onDodge = (ev) => { ev.preventDefault(); if (this.gameState==='playing' && !this.paused) this.triggerDodge(); };
                dodgeBtn.addEventListener('touchstart', onDodge, { passive: false });
                dodgeBtn.addEventListener('click', onDodge);
                dodgeBtn.__boundGame = true;
            }
        } catch(_) {}
    }

    // Aggressively re-enable touch buttons after overlays/menus
    forceEnableTouchButtons() {
        try {
            // Clear any lingering body classes that might block input
            if (document && document.body && document.body.classList) {
                document.body.classList.remove('menu-open');
            }
        } catch(_) {}
        try {
            const tc = document.getElementById('touchControls');
            if (tc) {
                tc.style.display = (this.usingTouch && this.gameState==='playing' && !this.paused) ? 'block' : 'none';
                tc.style.pointerEvents = (this.gameState==='playing' && !this.paused) ? 'auto' : 'none';
                tc.style.zIndex = (this.gameState==='playing' && !this.paused) ? '30000' : '30';
            }
        } catch(_) {}
        try {
            const skillBtn = document.getElementById('skillBtn');
            if (skillBtn) {
                skillBtn.style.pointerEvents = 'auto';
                skillBtn.disabled = false;
                skillBtn.style.zIndex = '30010';
                if (!skillBtn.__boundGame) {
                    const trigger = (ev) => { ev.preventDefault(); if (this.gameState==='playing' && !this.paused) this.useAbility(); };
                    skillBtn.addEventListener('touchstart', trigger, { passive: false });
                    skillBtn.addEventListener('click', trigger);
                    skillBtn.__boundGame = true;
                }
            }
        } catch(_) {}
        try {
            const dodgeBtn = document.getElementById('dodgeBtn');
            if (dodgeBtn) {
                dodgeBtn.style.pointerEvents = 'auto';
                dodgeBtn.disabled = false;
                dodgeBtn.style.zIndex = '30010';
                if (!dodgeBtn.__boundGame) {
                    const onDodge = (ev) => { ev.preventDefault(); if (this.gameState==='playing' && !this.paused) this.triggerDodge(); };
                    dodgeBtn.addEventListener('touchstart', onDodge, { passive: false });
                    dodgeBtn.addEventListener('click', onDodge);
                    dodgeBtn.__boundGame = true;
                }
            }
        } catch(_) {}
    }

    // i18n helpers
    t(key) {
        const k = String(key || '');
        const lang = (this && this.lang) || 'tr';
        const packs = this.translations || {};
        const p0 = packs[lang] || null;
        const p1 = packs.en || null;
        const p2 = packs.tr || null;
        if (p0 && typeof p0[k] !== 'undefined') return p0[k];
        if (p1 && typeof p1[k] !== 'undefined') return p1[k];
        if (p2 && typeof p2[k] !== 'undefined') return p2[k];
        return k;
    }

    bindLanguageButtons() {
        const trBtn = document.getElementById('langTrBtn');
        const enBtn = document.getElementById('langEnBtn');
        if (trBtn) trBtn.onclick = () => this.setLanguage('tr');
        if (enBtn) enBtn.onclick = () => this.setLanguage('en');
    }

    setLanguage(lang) {
        try {
            let code = String(lang || '').trim();
            // Normalize case and separators (pt-BR, zh_CN, etc.)
            code = code.replace('_','-');
            const low = code.toLowerCase();
            // Special handling for Chinese variants
            let norm = low;
            if (low === 'zh' || low === 'cn') norm = 'zh-cn';
            else if (low.startsWith('zh')) {
                if (low.includes('tw')) norm = 'zh-tw';
                else norm = 'zh-cn';
            }
            // Special handling for Portuguese Brazil variants
            if (low === 'ptbr' || low === 'pt_br' || low === 'pt-br') norm = 'pt-br';

            // Use pack if exists; otherwise keep normalized code so UI reflects selection
            this.lang = (this.translations && this.translations[norm]) ? norm : (norm || 'tr');
            if (document && document.documentElement) {
                document.documentElement.lang = this.lang;
            }
        } catch(_) {
            this.lang = 'tr';
        }
        this.applyLanguage();
    }
    applyLanguage() {
        // Ensure persisted language is honored after reloads
        try {
            const savedLang = localStorage.getItem('lang');
            if (savedLang && typeof savedLang === 'string') {
                this.lang = savedLang;
                try { document.documentElement.lang = this.lang; } catch(_){ }
            }
        } catch(_) {}
        const elTitle = document.getElementById('elementOverlayTitle');
        if (elTitle) elTitle.textContent = this.t('elementOverlayTitle');
        const elDesc = document.getElementById('elementOverlayDesc');
        if (elDesc) elDesc.textContent = this.t(this.isMobile() ? 'elementOverlayDescMobile' : 'elementOverlayDesc');
        const chooseFire = document.getElementById('chooseFire');
        if (chooseFire) chooseFire.textContent = this.t('chooseFire');
        const chooseWater = document.getElementById('chooseWater');
        if (chooseWater) chooseWater.textContent = this.t('chooseWater');
        const chooseAir = document.getElementById('chooseAir');
        if (chooseAir) chooseAir.textContent = this.t('chooseAir');

        // Character button labels (apply only if translation exists; avoid showing raw keys)
        const cns = ['berserker','guardian','ranger','engineer','rogue'];
        cns.forEach(k => {
            const n = document.getElementById(`charName_${k}`);
            const d = document.getElementById(`charDesc_${k}`);
            const nk = `char_${k}_name`;
            const dk = `char_${k}_desc`;
            try {
                const nv = this.t(nk);
                if (n && nv && nv !== nk) n.textContent = nv;
            } catch(_) {}
            try {
                const dv = this.t(dk);
                if (d && dv && dv !== dk) d.textContent = dv;
            } catch(_) {}
        });

        // HUD labels
        const scoreLabel = document.getElementById('scoreLabel');
        if (scoreLabel) scoreLabel.textContent = this.t('scoreLabel');
        const materialsTopLabel = document.getElementById('materialsTopLabel');
        if (materialsTopLabel) materialsTopLabel.textContent = this.t('materialsTopLabel');
        const elementTopLabel = document.getElementById('elementTopLabel');
        if (elementTopLabel) elementTopLabel.textContent = this.t('elementTopLabel');

        // Game Over
        const goTitle = document.getElementById('gameOverTitle');
        if (goTitle) goTitle.textContent = this.t('gameOverTitle');
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) restartBtn.textContent = this.t('restartBtn');
        const backBtn = document.getElementById('backToMenuBtn');
        if (backBtn) backBtn.textContent = this.t('backToMenuBtn');

        // In-game menu
        const igTitle = document.getElementById('inGameMenuTitle');
        if (igTitle) igTitle.textContent = this.t('inGameMenuTitle');
        // Explicitly set in-game action buttons
        try {
            const resBtn = document.getElementById('resumeBtn');
            if (resBtn) resBtn.textContent = this.t('resumeBtn');
        } catch(_) {}
        try {
            const backIngame = document.getElementById('backToMenuIngameBtn');
            if (backIngame) backIngame.textContent = this.t('backToMenuBtn');
        } catch(_) {}
        const infoFireTitle = document.getElementById('infoFireTitle');
        if (infoFireTitle) infoFireTitle.textContent = this.t('infoFireTitle');
        const infoFire1 = document.getElementById('infoFire1');
        if (infoFire1) infoFire1.textContent = this.t('infoFire1');
        const infoFire2 = document.getElementById('infoFire2');
        if (infoFire2) infoFire2.textContent = this.t('infoFire2');
        const infoFire3 = document.getElementById('infoFire3');
        if (infoFire3) infoFire3.textContent = this.t('infoFire3');
        const infoWaterTitle = document.getElementById('infoWaterTitle');
        if (infoWaterTitle) infoWaterTitle.textContent = this.t('infoWaterTitle');
        const infoWater1 = document.getElementById('infoWater1');
        if (infoWater1) infoWater1.textContent = this.t('infoWater1');
        const infoWater2 = document.getElementById('infoWater2');
        if (infoWater2) infoWater2.textContent = this.t('infoWater2');
        const infoWater3 = document.getElementById('infoWater3');
        if (infoWater3) infoWater3.textContent = this.t('infoWater3');
        const infoAirTitle = document.getElementById('infoAirTitle');
        if (infoAirTitle) infoAirTitle.textContent = this.t('infoAirTitle');
        const infoAir1 = document.getElementById('infoAir1');
        if (infoAir1) infoAir1.textContent = this.t('infoAir1');
        const infoAir2 = document.getElementById('infoAir2');
        if (infoAir2) infoAir2.textContent = this.t('infoAir2');
        const infoAir3 = document.getElementById('infoAir3');
        if (infoAir3) infoAir3.textContent = this.t('infoAir3');

        // Shop overlay labels
        const shopTitle = document.getElementById('shopTitle');
        if (shopTitle) shopTitle.textContent = this.t('shopTitle');
        const materialsLabel = document.getElementById('materialsLabel');
        if (materialsLabel) materialsLabel.textContent = this.t('materialsLabel');
        const xpLabel = document.getElementById('xpLabel');
        if (xpLabel) xpLabel.textContent = this.t('xpLabel');
        const rerollBtn = document.getElementById('rerollBtn');
        if (rerollBtn) rerollBtn.textContent = `${this.t('rerollBtn')} (${this.rerollCost})`;
        const lockBtn = document.getElementById('lockBtn');
        if (lockBtn) lockBtn.textContent = this.t('lockBtn');
        const startWaveBtn = document.getElementById('startWaveBtn');
        if (startWaveBtn) startWaveBtn.textContent = this.t('startWaveBtn');
        const abilityIcon = document.getElementById('abilityIcon');
        if (abilityIcon) abilityIcon.title = this.t('abilityIconTitle');
        const waveLbl = document.getElementById('shopWaveLabel');
        if (waveLbl) waveLbl.textContent = `${this.t('wavePrefix')} ${Math.max(1, this.waveNumber || 1)}`;

        // Generic: apply data-lang text and placeholders
        try {
            // Text content
            const nodes = document.querySelectorAll('[data-lang]');
            nodes.forEach(node => {
                const key = node.getAttribute('data-lang');
                if (!key) return;
                const val = this.t(key);
                // Skip if translation missing or returns the raw key
                if (!val || typeof val !== 'string' || val === key) return;
                // If the element has no child elements, safe to replace textContent
                if (!node.children || node.children.length === 0) {
                    node.textContent = val;
                } else {
                    // Try to update only the leading text node to preserve inner spans (e.g., value spans)
                    const firstTextNode = Array.from(node.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
                    if (firstTextNode) {
                        firstTextNode.nodeValue = val;
                    }
                    // Otherwise, skip to avoid breaking structure
                }
            });
            // Placeholders
            const phNodes = document.querySelectorAll('[data-lang-placeholder]');
            phNodes.forEach(node => {
                const key = node.getAttribute('data-lang-placeholder');
                if (!key) return;
                const val = this.t(key);
                if (val && typeof val === 'string') {
                    node.setAttribute('placeholder', val);
                }
            });
        } catch {}
    }

    // Populate orbs and element zones
    createOrbs() {
        // Ensure orb arrays exist; keep empty unless game mode fills them elsewhere
        try {
            if (!Array.isArray(this.energyOrbs)) this.energyOrbs = [];
            if (!Array.isArray(this.bonusOrbs)) this.bonusOrbs = [];
            // No default spawn here; classic mode may override elsewhere
        } catch(_) {}
    }

    // Main loop
    gameLoop() {
        this._lastRAFTime = undefined;
        this.fps = 60;
        const alpha = 0.12; // smoothing for FPS EMA
        this._fpsBelowTimer = 0;
        this._fpsAboveTimer = 0;
        this.performanceMode = !!this.performanceMode; // keep previous if any
        // Optional FPS cap (0 = unlimited). Default to 60 for smooth/consistent pacing
        this.fpsCap = (typeof this.fpsCap === 'number') ? this.fpsCap : 60;
        this._lastFrameTimeForCap = undefined;
        const tick = (ts) => {
            // Throttle via rAF gating to avoid timer jitter; only process when cap interval elapsed
            if (this.fpsCap && this.fpsCap > 0) {
                const minFrameMs = 1000 / Math.max(1, this.fpsCap);
                if (this._lastFrameTimeForCap === undefined) this._lastFrameTimeForCap = ts;
                const since = ts - this._lastFrameTimeForCap;
                if (since < (minFrameMs - 0.5)) {
                    requestAnimationFrame(tick);
                    return;
                }
                this._lastFrameTimeForCap = ts;
            }
            if (this._lastRAFTime === undefined) {
                this._lastRAFTime = ts;
            }
            const dt = Math.max(0, Math.min(66, ts - this._lastRAFTime));
            this._lastRAFTime = ts;
            // EMA FPS
            const inst = dt > 0 ? (1000 / dt) : 60;
            this.fps = (1 - alpha) * this.fps + alpha * inst;
            // FPS guard timers
            if (this.fps < 45) {
                this._fpsBelowTimer += dt;
                this._fpsAboveTimer = 0;
            } else if (this.fps > 55) {
                this._fpsAboveTimer += dt;
                this._fpsBelowTimer = 0;
            }
            // Enter performance mode after sustained low FPS
            if (!this.performanceMode && this._fpsBelowTimer > 8000) {
                this.performanceMode = true;
                // Optionally notify once
                // this.showToast && this.showToast('Performans modu: efektler azaltıldı');
            }
            // Exit after sustained high FPS
            if (this.performanceMode && this._fpsAboveTimer > 8000) {
                this.performanceMode = false;
                // this.showToast && this.showToast('Performans modu kapatıldı');
            }
            // Update and render (only update while actively playing)
            if (!this.paused && this.gameState === 'playing') this.update(dt);
            this.render();
            // Particle cap while in performance mode (visual-only reduction)
            try {
                if (this.performanceMode && Array.isArray(this.particles) && this.particles.length > 400) {
                    this.particles.length = 400;
                } else if (!this.performanceMode && Array.isArray(this.particles) && this.particles.length > 1200) {
                    // keep a soft cap as safety
                    this.particles.length = 1200;
                }
            } catch {}

            // Debug overlay
            try { this.updateDebugOverlay && this.updateDebugOverlay(); } catch {}
            
            // Continuous score monitoring for main menu sync
            try { this.checkScoreUpdate(); } catch {}
            
            // Always schedule next frame with rAF for smooth vsync pacing
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    // Set FPS cap (0 = unlimited). Call anytime; takes effect next frame.
    setFpsCap(cap) {
        try { this.fpsCap = Math.max(0, Math.floor(cap || 0)); } catch(_) { this.fpsCap = 0; }
        // Reset throttle timing so new cap applies cleanly
        try { this._lastFrameTimeForCap = undefined; } catch(_) { }
    }

    // Restart the game without reloading the page.
    // Keeps the same player appearance/element, resets all progress and starts from wave 1.
    restartRun() {
        // Force default basic character for a fresh Wave 1 start
        const prev = this.player;
        const name = 'Elementist';
        const element = 'fire';
        let color = '#00ffff';
        let shape = 'circle';

        // Reset core game state
        this.gameState = 'playing';
        this.paused = false;
        this.updateTouchControlsVisibility();
        this.score = 0;
        this.materials = 0;
        this.xp = 0;
        this.waveNumber = 0;
        this.waveTimer = 0;
        this.intermissionTimer = 0;
        this.inWave = false;
        this.usedFreeSkill = false;
        this.purchaseUsedForWave = false;
        this.shopLocked = false;
        this.boss5Spawned = false;
        this.boss10Spawned = false;
        this.boss15Spawned = false;
        this.boss20Spawned = false;
        this.lives = 1;
        this.abilityReady = true;
        this.abilityCooldown = 0;
        this.abilityDuration = 0;
        this.camera = { x: 0, y: 0 };

        // Reset weapon selection and special-weapon instances so restart is truly fresh
        this._wave4WeaponChosen = false;
        this.chosenWeapon = null;
        this.playerTurrets = null;
        this.electroGen = null;
        this.gravityOrb = null;
        this._weaponOverlayOpen = false;
        this._weaponsToastShown = false;

        // Reset all weapon/economy modifiers to fresh-run defaults
        this.weaponCooldown = 0;
        this.weaponFireRate = 450; // default
        this.weaponDamage = 15;     // default
        this.weaponRange = 600;     // default
        this.baseWeaponRange = this.weaponRange;
        this.projectileSpeedMult = 1.0;
        // Shop effect bonuses
        this.fireBurnDpsBonus = 0;
        this.fireBurnDurationBonus = 0;
        // Movement multipliers (base values)
        this.speedBoostMult = 1.10;
        this.maneuverBoostMult = 1.06;
        // Shop state
        this.inShop = false;
        this.shopFreezePos = null;
        this.rerollCost = 4;
        this.currentOffers = [];

        // Clear world entities
        this.aiBots = [];
        this.projectiles = [];
        this.towers = [];
        this.energyOrbs = [];
        this.bonusOrbs = [];
        this.elementZones = [];
        this.particles = [];
        this.drops = [];
        this.waterRings = [];
        this.fireBeams = [];

        // Recreate world
        this.createOrbs();
        this.createAIBots();
        if (this.gameMode !== 'brotato') this.createTowers();
        else this.towers = [];

        // Do not create player yet; re-open element selection like a fresh start
        this.player = null;
        try {
            const startScreen = document.getElementById('startScreen');
            if (startScreen) startScreen.style.display = 'none';
            const elemOverlay = document.getElementById('elementSelectOverlay');
            if (elemOverlay) elemOverlay.style.display = 'block';
            this.setCursorVisible && this.setCursorVisible(true);
        } catch(_) {}

        // Ensure body is not in playing/shop state until element is chosen
        try { document.body.classList.remove('playing', 'shop-open'); } catch(_) {}

        // Hide HUD until player is created after element selection
        const over = document.getElementById('gameOverScreen');
        if (over) over.style.display = 'none';
        const gameUI = document.getElementById('gameUI');
        if (gameUI) gameUI.style.display = 'none';
        const timer = document.getElementById('timer');
        if (timer) timer.style.display = 'none';
        const leaderboard = document.getElementById('leaderboard');
        if (leaderboard) leaderboard.style.display = 'none';
        const ability = document.querySelector('.ability-cooldown');
        if (ability) ability.style.display = 'none';

        // Reset inventory/consumables UI managed by HTML overlay
        try { window.dispatchEvent(new CustomEvent('inventory:reset')); } catch(_) {}

        // Reset cooldown overlay
        const cooldownOverlay = document.getElementById('cooldownOverlay');
        if (cooldownOverlay) cooldownOverlay.style.display = 'none';
        // Re-render persistent stats on menu
        try { this.renderStatsPanel && this.renderStatsPanel(); } catch(_) {}
        const cooldownText = document.getElementById('cooldownText');
        if (cooldownText) cooldownText.textContent = '';

        // Ensure shop UI is closed/cleared
        try {
            const shopOverlay = document.getElementById('shopOverlay');
            if (shopOverlay) shopOverlay.style.display = 'none';
            try { if (document && document.body && document.body.classList) document.body.classList.remove('shop-open'); } catch(_){}
            try { this.detachConsumableBarFromShop && this.detachConsumableBarFromShop(); } catch(_) {}
            const shopItems = document.getElementById('shopItems');
            if (shopItems) shopItems.innerHTML = '';
            const rerollBtn = document.getElementById('rerollBtn');
            if (rerollBtn) rerollBtn.textContent = `Reroll (${this.rerollCost})`;
        } catch(_) {}

        // Update ability icon to match preserved element
        this.updateAbilityIcon && this.updateAbilityIcon();

        // Do not auto-start a wave on restart; wait for element selection and normal flow
        this.inWave = false;
    }

    updateClassic(deltaTime) {
    // Apply ability effects first so movement this frame reflects slow & burn
    this.updateWaterRings(deltaTime);
    this.updateFireBeams(deltaTime);
    this.updateBurningEffects(deltaTime);
    // Update AI bots
    this.aiBots.forEach(bot => bot.update(this, deltaTime));
    if (this.aiBots.length < this.targetBotCount) {
        // respawn bots logic
    }
    
    // Update projectiles
    this.projectiles = this.projectiles.filter(p => !p.update(deltaTime));
    
    // (cooldown handled centrally in update())
        if (this.aiBots.length < this.targetBotCount) {
            // respawn bots logic
        }
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(p => !p.update(deltaTime));
        
        // (cooldown handled centrally in update())

        // Update transient particles (e.g., dash sparks)
        this.updateParticles && this.updateParticles(deltaTime);

        // Water zone DoT
        if (this.player && this.player.waterZone) {
            const zone = this.player.waterZone;
            zone.duration -= deltaTime;
            if (zone.duration <= 0) {
                this.player.waterZone = null;
            } else {
                // apply slow and small damage
                (this.aiBots || []).forEach(b => {
                    const d = zone.pos.minusNew(b.pos).magnitude();
                    if (d < zone.radius) {
                        b.slowedUntil = Date.now() + deltaTime;
                        b.slowFactor = zone.slowEffect;
                        // DoT ~8 DPS
                        if (typeof b.hp === 'number') {
                            b.hp = Math.max(0, b.hp - 0.008 * deltaTime);
                            if (b.hp <= 0) {
                                const idx = this.aiBots.indexOf(b);
                                if (idx >= 0) this.aiBots.splice(idx, 1);
                                this.score += 150;
                                this.updatePlayerHPFromScore();
                            }
                        }
                    }
                });
            }
        }
        // Collect energy/bonus orbs
        this.checkCollisions();
        // Drops update/pickup
        this.updateDrops(deltaTime);
        this.updateLeaderboard();
        this.updateUI();
        this.handleProjectileHits();
        this.updateCamera();
    }
    
    updatePlayer(deltaTime) {
        // Cooldowns and timers
        if (this.dodgeCooldown > 0) this.dodgeCooldown = Math.max(0, this.dodgeCooldown - deltaTime);
        if (this.isDodging) {
            this.dodgeTimer = Math.max(0, this.dodgeTimer - deltaTime);
            // Dash movement: override normal movement
            const dashSpeed = (this.player.getSpeed() * 3.6) * (this.mouseSensitivity || 1.0); // 3.6x speed burst
            this.player.velocity = this.dodgeDir.multiplyNew(dashSpeed);
            this.player.pos.plusEq(this.player.velocity.multiplyNew(deltaTime / 1000));
            // Clamp inside play zone
            const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
            this.player.pos.x = Math.max(z.x + this.player.size, Math.min(z.x + z.width - this.player.size, this.player.pos.x));
            this.player.pos.y = Math.max(z.y + this.player.size, Math.min(z.y + z.height - this.player.size, this.player.pos.y));
            if (this.dodgeTimer === 0) {
                this.isDodging = false;
                this.player.velocity = new Vector2(0, 0);
            }
            // Element zones still checked during dodge
            this.checkElementZones();
            return;
        }
        // Calculate movement direction from joystick on touch; mouse on desktop
        let direction;
        if (this.usingTouch) {
            const v = this.joystick.vec;
            if (v && (Math.abs(v.x) > 1e-4 || Math.abs(v.y) > 1e-4)) {
                const mag = Math.max(1e-6, Math.sqrt(v.x*v.x + v.y*v.y));
                direction = new Vector2(v.x / mag, v.y / mag);
                this.lastMoveDir = direction.clone();
            } else {
                direction = (this.lastMoveDir && (this.lastMoveDir.x !== 0 || this.lastMoveDir.y !== 0))
                    ? this.lastMoveDir.clone()
                    : new Vector2(0, 0);
            }
        } else {
            // Desktop: WASD/Arrow keys, instant response, no momentum
            let dx = 0, dy = 0;
            if (this.keys.w || this.keys.ArrowUp) dy -= 1;
            if (this.keys.s || this.keys.ArrowDown) dy += 1;
            if (this.keys.a || this.keys.ArrowLeft) dx -= 1;
            if (this.keys.d || this.keys.ArrowRight) dx += 1;
            if (dx !== 0 || dy !== 0) {
                const mag = Math.max(1e-6, Math.sqrt(dx*dx + dy*dy));
                direction = new Vector2(dx / mag, dy / mag);
                this.lastMoveDir = direction.clone();
            } else {
                direction = new Vector2(0, 0);
            }
        }
        
        // Apply movement with maneuver boost
        const speed = this.player.getSpeed() * (this.mouseSensitivity || 1.0);
        const maneuverFactor = this.player.maneuverBoost || 1;
        this.player.velocity = direction.multiplyNew(speed * maneuverFactor);
        this.player.pos.plusEq(this.player.velocity.multiplyNew(deltaTime / 1000));
        
        // Keep player in shrinking play zone bounds
        const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
        this.player.pos.x = Math.max(z.x + this.player.size, Math.min(z.x + z.width - this.player.size, this.player.pos.x));
        this.player.pos.y = Math.max(z.y + this.player.size, Math.min(z.y + z.height - this.player.size, this.player.pos.y));
        
        // Check if player is in element zone
        this.checkElementZones();
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        // Map orbs removed; no in-world pickups except drops
    }
    
    collectOrb(orb) {
        this.player.grow(orb.energy);
        this.score += orb.energy * 10;
        this.updatePlayerHPFromScore();
        
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
        this.updatePlayerHPFromScore();
        
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
        if (!this.player) return;
        const now = Date.now();
        this.playAbilitySound(this.player.element);
        // Water special: if a water ring is already moving, second press stops it for 5s.
        // Add small grace period to ignore auto-repeat right after spawning.
        if (this.player.element === 'water' && this.waterRings && this.waterRings.length) {
            const movingRing = this.waterRings.find(r => r.moving);
            if (movingRing) {
                if (!this.lastAbilitySpawnAt || (now - this.lastAbilitySpawnAt) > 200) {
                    movingRing.moving = false;
                    movingRing.speed = 0;
                    movingRing.expandRate = 0;
                    movingRing.life = Math.max(movingRing.life, 5000);
                    // small pulse to indicate lock
                    for (let i = 0; i < 8; i++) {
                        const a = Math.random() * Math.PI * 2;
                        this.particles.push({
                            pos: movingRing.pos.clone(),
                            velocity: new Vector2(Math.cos(a)*70, Math.sin(a)*70),
                            color: '#93c5fd',
                            life: 350,
                            size: 2
                        });
                    }
                    return; // don't consume cooldown again
                }
            }
        }
        // Fire special: stop first moving beam for 5s (with same grace period)
        if (this.player.element === 'fire' && this.fireBeams && this.fireBeams.length) {
            const movingBeam = this.fireBeams.find(b => b.moving);
            if (movingBeam) {
                if (!this.lastAbilitySpawnAt || (now - this.lastAbilitySpawnAt) > 200) {
                    movingBeam.moving = false;
                    movingBeam.speed = 0;
                    movingBeam.life = Math.max(movingBeam.life, 5000);
                    // small ember burst
                    for (let i = 0; i < 8; i++) {
                        const a = Math.random() * Math.PI * 2;
                        this.particles.push({
                            pos: movingBeam.pos.clone(),
                            velocity: new Vector2(Math.cos(a)*80, Math.sin(a)*80),
                            color: '#fb923c',
                            life: 350,
                            size: 2
                        });
                    }
                    return;
                }
            }
        }

        if (!this.abilityReady) return;
        
        this.abilityReady = false;
        this.abilityCooldown = 10000; // 10 seconds
        this.abilityDuration = 1000; // 1 second
        this.lastAbilitySpawnAt = now; // mark for grace period checks
        
        const overlay = document.getElementById('cooldownOverlay');
        const textEl = document.getElementById('cooldownText');
        if (overlay) overlay.style.display = 'flex';
        if (textEl) textEl.textContent = Math.ceil(this.abilityCooldown / 1000);
        // Ability used confirmation
        try { this.showTopTip && this.showTopTip('Yetenek kullanıldı'); } catch(_) {}
        
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
        // Fire infusion: empower player's bullets for 5 seconds
        if (!this.player) return;
        const now = Date.now();
        this.player.fireInfusedUntil = now + 5000;
        this.player.abilityActive = true;
        // Ember burst around player to indicate activation
        for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2;
            this.particles.push({
                pos: this.player.pos.clone(),
                velocity: new Vector2(Math.cos(a)*140, Math.sin(a)*140),
                color: '#f97316',
                life: 500,
                size: 2
            });
        }
        // Safety: clear abilityActive when buff ends
        setTimeout(() => {
            if (!this.player) return;
            if (Date.now() >= (this.player.fireInfusedUntil || 0)) {
                this.player.abilityActive = false;
            }
        }, 5100);
    }
    
    useWaterAbility() {
        // Spawn a moving, expanding water ring that slows and lightly damages enemies
        if (!this.player) return;
        // Compute direction exactly like auto-attack at this instant
        let aimDir = null;
        let nearest = null; let minD = this.weaponRange + 1;
        for (const b of this.aiBots) {
            const d = this.player.pos.minusNew(b.pos).magnitude();
            if (d < minD) { minD = d; nearest = b; }
        }
        if (nearest && minD <= this.weaponRange) {
            aimDir = nearest.pos.minusNew(this.player.pos).normalise();
        } else {
            aimDir = this.getAimDirection();
        }
        const dir = aimDir;
        const spawn = this.player.pos.plusNew(dir.multiplyNew((this.player.size||12)+8));
        const ring = {
            pos: spawn,
            dir: dir,
            radius: 22,
            thickness: 24,
            speed: 520,
            expandRate: 140,
            life: 3200,
            moving: true,
            slowFactor: 0.3, // 70% slow
            dps: 10
        };
        this.waterRings.push(ring);
        // Visual splash
        for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2;
            this.particles.push({
                pos: spawn.clone(),
                velocity: new Vector2(Math.cos(a)*120, Math.sin(a)*120),
                color: '#93c5fd',
                life: 420,
                size: 1.8
            });
        }
    }

    // Update moving fire beams and apply burning to bots that intersect
    updateFireBeams(dt) {
        const keep = [];
        for (const b of this.fireBeams) {
            b.life -= dt;
            if (b.moving) {
                b.pos.plusEq(b.dir.multiplyNew(b.speed * dt/1000));
            }
            // Enforce walls: despawn beam if base or tip leave playZone
            const z = this.playZone || { x:0, y:0, width:(this.worldSize && this.worldSize.width)||2000, height:(this.worldSize && this.worldSize.height)||2000 };
            const tip = b.pos.plusNew(b.dir.multiplyNew(b.length || 0));
            const inside = (pt) => (pt.x >= z.x && pt.x <= z.x + z.width && pt.y >= z.y && pt.y <= z.y + z.height);
            if (!inside(b.pos) || !inside(tip)) {
                b.life = 0;
            }
            if (b.life <= 0) continue;
            // Collision against vertical bar centered along the beam path
            const center = b.pos.plusNew(b.dir.multiplyNew(b.length * 0.5));
            const halfH = b.length * 0.5;
            const halfW = b.thickness * 0.5;
            for (const bot of (this.aiBots||[])) {
                const dx = Math.abs(bot.pos.x - center.x);
                const dy = Math.abs(bot.pos.y - center.y);
                if (dx <= (halfW + (bot.size||12)) && dy <= (halfH + (bot.size||12))) {
                    bot.burningUntil = Date.now() + b.burnDuration;
                    bot.burningDps = b.burnDps;
                    bot.burnOwner = this.player; // Attribute DoT to player
                }
            }
            keep.push(b);
        }
        this.fireBeams = keep;
    }

    // Helper: fill a rounded rectangle
    _fillRoundedRect(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    // Apply burning DoT to bots and remove dead
    updateBurningEffects(dt) {
        const now = Date.now();
        for (let i = this.aiBots.length - 1; i >= 0; i--) {
            const bot = this.aiBots[i];
            if (bot.burningUntil && now < bot.burningUntil && typeof bot.hp === 'number') {
                bot.hp = Math.max(0, bot.hp - (bot.burningDps||0) * dt/1000);
                if (bot.hp <= 0) {
                    this.aiBots.splice(i, 1);
                    this.score += 200;
                    // SFX: kill via burn
                    this.playKill();
                    // Combo: attribute burn kills if applied by player
                    try {
                        if (bot.burnOwner && bot.burnOwner === this.player) {
                            const nowC = Date.now();
                            this.player.comboCount = (this.player.comboCount || 0) + 1;
                            this.player.comboExpireAt = nowC + (this.comboWindowMs || 3000);
                            this.player.comboLastIncAt = nowC;
                        }
                    } catch(_) {}
                }
            }
        }

        // Combo-driven arena reactions (camera shake + milestone flair)
        try {
            const cc = (this.player && this.player.comboCount) ? this.player.comboCount : 0;
            if (this.lastComboCountSeen == null) this.lastComboCountSeen = 0;
            if (cc === 0 && this.lastComboCountSeen !== 0) {
                this.lastComboCountSeen = 0;
            } else if (cc > this.lastComboCountSeen) {
                const now = Date.now();
                const justHitMilestone = (cc >= 10 && cc % 10 === 0);
                // Camera shake parameters
                this.comboShakeDur = justHitMilestone ? 420 : 200;
                this.comboShakeAmp = justHitMilestone ? Math.min(14, 6 + Math.floor(cc / 10) * 2) : 6;
                this.comboShakePhase = (Math.random() * Math.PI * 2);
                this.comboShakeUntil = now + this.comboShakeDur;
                // Flash overlay timing (reverted: no comboFlashStart tracking)
                this.comboFlashUntil = now + (justHitMilestone ? 360 : 180);
                // Milestone particle burst at player
                if (justHitMilestone && this.player) {
                    const burst = Math.min(40, 16 + Math.floor(cc * 0.6));
                    for (let i = 0; i < burst; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const spd = 120 + Math.random() * 220;
                        const col = this.getRandomNeonColor ? this.getRandomNeonColor() : '#ffffff';
                        this.particles.push({
                            pos: this.player.pos.clone(),
                            velocity: new Vector2(Math.cos(a)*spd, Math.sin(a)*spd),
                            color: col,
                            life: 520,
                            size: 2 + Math.random() * 2
                        });
                    }
                }
                this.lastComboCountSeen = cc;
            }
        } catch {}
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
        if (this.fixedArena) {
            // Recompute world to 80% of current viewport and center it
            const w = Math.floor(this.canvas.width * this.playableScale);
            const h = Math.floor(this.canvas.height * this.playableScale);
            this.worldSize = { width: w, height: h };
            this.camera.x = (w - this.canvas.width) / 2;
            this.camera.y = (h - this.canvas.height) / 2;
            return;
        }
        // Fallback: follow player (unused in fixed arena)
        let targetX = this.player.pos.x - this.canvas.width / 2;
        let targetY = this.player.pos.y - this.canvas.height / 2;
        if (this.usingTouch) {
            this.camera.x = targetX;
            this.camera.y = targetY;
        } else {
            this.camera.x += (targetX - this.camera.x) * 0.1;
            this.camera.y += (targetY - this.camera.y) * 0.1;
        }

        // (reverted) combo camera shake has been removed per request
    }
    
    updateTimer(remaining) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateUI() {
        if (!this.player) return;
        
        document.getElementById('score').textContent = this.score;
        const mTop = document.getElementById('materialsTop');
        if (mTop) mTop.textContent = this.materials;
        document.getElementById('elementType').textContent = this.player.element;
        // Lives hearts display
        const livesEl = document.getElementById('livesDisplay');
        if (livesEl) {
            const clamped = Math.max(0, this.lives);
            livesEl.textContent = '❤️'.repeat(clamped);
        }
        
        // Ability-ready glow effect
        try {
            const abilityIcon = document.getElementById('abilityIcon');
            const now = Date.now();
            const cooldownRemaining = Math.max(0, (this.abilityCooldown || 0) - (now - (this.lastAbilityTime || 0)));
            
            if (abilityIcon) {
                if (cooldownRemaining <= 0 && this.abilityReady) {
                    // Ability is ready - add bright glow
                    abilityIcon.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.8), inset 0 0 12px rgba(34, 197, 94, 0.4)';
                    abilityIcon.style.animation = 'abilityReadyGlow 0.6s ease-in-out infinite';
                    
                    // Show hint once when ability becomes ready
                    if (!this._abilityReadyHinted) {
                        this._abilityReadyHinted = true;
                        try {
                            if (typeof this.showHintToast === 'function') {
                                this.showHintToast('Ability Ready!');
                            }
                        } catch(_) {}
                    }
                } else {
                    // On cooldown - remove glow and reset hint flag
                    abilityIcon.style.animation = 'none';
                    abilityIcon.style.boxShadow = 'inset 0 0 8px rgba(0,255,255,0.2)';
                    this._abilityReadyHinted = false;
                }
            }
        } catch(_) {}

        // Update power-up display (centered on player)
        try {
            const powerUpDisplay = document.getElementById('powerUpDisplay');
            const powerUpIcon = document.getElementById('powerUpIcon');
            const now = Date.now();
            
            // Check if any consumable power-up is active
            const activeConsumable = this.activeConsumable ? true : false;
            const consumableName = this.activeConsumable || '';
            
            if (powerUpDisplay && powerUpIcon) {
                if (activeConsumable && consumableName) {
                    // Show power-up with appropriate icon
                    powerUpDisplay.classList.add('active');
                    
                    // Set icon based on consumable type
                    const iconMap = {
                        'blood_draught': '🩸',
                        'flame_syrup': '🔥',
                        'mist_tonic': '🌫️',
                        'stone_infusion': '🪨',
                        'heal_potion': '💚'
                    };
                    
                    powerUpIcon.textContent = iconMap[consumableName] || '⭐';
                    
                    // Calculate and show cooldown progress if there's a duration
                    const consumableExpireAt = this.consumableActiveUntil || 0;
                    const timeRemaining = Math.max(0, consumableExpireAt - now);
                    const totalDuration = this.consumableDuration || 5000;
                    const progress = timeRemaining / totalDuration;
                    
                    // Update SVG progress circle if visible
                    const progressCircle = document.querySelector('.power-up-cooldown-bar .power-up-progress');
                    if (progressCircle && totalDuration > 0) {
                        const circumference = 2 * Math.PI * 45; // radius 45
                        const offset = circumference * (1 - Math.min(1, progress));
                        progressCircle.style.strokeDashoffset = offset;
                    }
                } else {
                    // No active power-up
                    powerUpDisplay.classList.remove('active');
                    powerUpIcon.textContent = '⭐';
                }
            }
        } catch(_) {}
        
        // Update leaderboard display
        this.drawLeaderboard();
    }
    
    updateLeaderboard() {
        // Combine player and bots for leaderboard
        const allPlayers = [];
        
        if (this.player) {
            allPlayers.push({
                name: this.player.name || 'Elementist',
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
            
            const now = Date.now();
            const isBurning = bot.burningUntil && now < bot.burningUntil;
            // Visual-only scale after wave 4
            const visK = (this.waveNumber >= 4) ? (this.botVisualScaleAfterW4 || 1) : 1;
            const sizeV = (bot.size || 12) * visK;
            // Draw bot glow (hotter if burning)
            const glowSize = sizeV * 2 * (isBurning ? 1.2 : 1);
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, glowSize
            );
            if (isBurning) {
                gradient.addColorStop(0, 'rgba(249,115,22,0.7)'); // orange
                gradient.addColorStop(1, 'rgba(249,115,22,0.0)');
            } else {
                gradient.addColorStop(0, bot.color + '66');
                gradient.addColorStop(1, bot.color + '00');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw bot body using archetype shape (fallbacks by wave if no shape set)
            this.ctx.fillStyle = bot.color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.drawEnemyShape(screenPos, sizeV, bot.shape, this.waveNumber);

            // Role-specific idle VFX for better readability
            try {
                if (bot.role === 'overcharged') {
                    // Electric sparks around the body
                    this.ctx.save();
                    this.ctx.strokeStyle = 'rgba(0,204,255,0.85)';
                    this.ctx.lineWidth = 1.5;
                    const sparks = 3;
                    for (let i=0;i<sparks;i++) {
                        if (Math.random() < 0.8) continue;
                        const a = Math.random()*Math.PI*2;
                        const r1 = sizeV*0.8, r2 = sizeV*1.45;
                        const x1 = screenPos.x + Math.cos(a)*r1;
                        const y1 = screenPos.y + Math.sin(a)*r1;
                        const x2 = screenPos.x + Math.cos(a + (Math.random()-0.5)*0.4)*r2;
                        const y2 = screenPos.y + Math.sin(a + (Math.random()-0.5)*0.4)*r2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x1,y1);
                        this.ctx.lineTo(x2,y2);
                        this.ctx.stroke();
                    }
                    // Occasional short lightning arc
                    if (Math.random() < 0.1) {
                        const a0 = Math.random()*Math.PI*2;
                        const segs = 3;
                        let px = screenPos.x + Math.cos(a0)*sizeV*0.9;
                        let py = screenPos.y + Math.sin(a0)*sizeV*0.9;
                        this.ctx.beginPath();
                        this.ctx.moveTo(px,py);
                        for (let s=0;s<segs;s++) {
                            const a = a0 + (Math.random()-0.5)*0.8;
                            px += Math.cos(a)*sizeV*0.5;
                            py += Math.sin(a)*sizeV*0.5;
                            this.ctx.lineTo(px,py);
                        }
                        this.ctx.stroke();
                    }
                    this.ctx.restore();
                } else if (bot.role === 'parasite') {
                    // Toxic tendrils gently waving
                    this.ctx.save();
                    this.ctx.strokeStyle = 'rgba(100,255,100,0.55)';
                    this.ctx.lineWidth = 1;
                    const t = (performance.now ? performance.now() : Date.now())*0.002;
                    const legs = 6;
                    for (let i=0;i<legs;i++) {
                        const baseA = -Math.PI/2 + i*(Math.PI/(legs-1));
                        const a = baseA + Math.sin(t + i)*0.2;
                        const r1 = sizeV*0.7;
                        const r2 = sizeV*1.5;
                        const x1 = screenPos.x + Math.cos(a)*r1;
                        const y1 = screenPos.y + Math.sin(a)*r1;
                        const x2 = screenPos.x + Math.cos(a)*r2;
                        const y2 = screenPos.y + Math.sin(a)*r2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x1,y1);
                        this.ctx.quadraticCurveTo(
                            (screenPos.x + x2)/2 + Math.sin(t*1.3 + i)*4,
                            (screenPos.y + y2)/2 + Math.cos(t*1.1 + i)*4,
                            x2,y2
                        );
                        this.ctx.stroke();
                    }
                    // Faint toxic aura
                    const aura = this.ctx.createRadialGradient(screenPos.x, screenPos.y, sizeV*0.6, screenPos.x, screenPos.y, sizeV*2.0);
                    aura.addColorStop(0, 'rgba(100,255,100,0.10)');
                    aura.addColorStop(1, 'rgba(100,255,100,0.0)');
                    this.ctx.fillStyle = aura;
                    this.ctx.beginPath();
                    this.ctx.arc(screenPos.x, screenPos.y, sizeV*2.0, 0, Math.PI*2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            } catch {}

            // Brief hit flash overlay to enhance hit feedback
            if (!bot.isBoss && bot.hitFlashUntil && now < bot.hitFlashUntil) {
                this.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(screenPos.x, screenPos.y, sizeV + 1, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Sniper telegraph and muzzle flash overlays
            try {
                if (bot.role === 'sniper') {
                    // Aim laser during windup
                    if (bot._sniperLaserUntil && now < bot._sniperLaserUntil && typeof bot._sniperAimAngle === 'number') {
                        const len = Math.min(1400, this.canvas.width + this.canvas.height);
                        const x2 = screenPos.x + Math.cos(bot._sniperAimAngle) * len;
                        const y2 = screenPos.y + Math.sin(bot._sniperAimAngle) * len;
                        this.ctx.save();
                        this.ctx.strokeStyle = 'rgba(191,0,255,0.65)';
                        this.ctx.lineWidth = 1.5;
                        this.ctx.beginPath();
                        this.ctx.moveTo(screenPos.x, screenPos.y);
                        this.ctx.lineTo(x2, y2);
                        this.ctx.stroke();
                        // small reticle at barrel
                        this.ctx.fillStyle = 'rgba(191,0,255,0.9)';
                        this.ctx.beginPath();
                        this.ctx.arc(screenPos.x + Math.cos(bot._sniperAimAngle)*(sizeV+6), screenPos.y + Math.sin(bot._sniperAimAngle)*(sizeV+6), 2.5, 0, Math.PI*2);
                        this.ctx.fill();
                        this.ctx.restore();
                    }
                    // Muzzle flash right after shot
                    if (bot._muzzleFlashUntil && now < bot._muzzleFlashUntil && typeof bot._sniperAimAngle === 'number') {
                        const bx = screenPos.x + Math.cos(bot._sniperAimAngle) * (sizeV + 6);
                        const by = screenPos.y + Math.sin(bot._sniperAimAngle) * (sizeV + 6);
                        this.ctx.save();
                        const grad = this.ctx.createRadialGradient(bx, by, 0, bx, by, 18);
                        grad.addColorStop(0, 'rgba(255,240,200,0.9)');
                        grad.addColorStop(1, 'rgba(255,140,0,0.0)');
                        this.ctx.fillStyle = grad;
                        this.ctx.beginPath();
                        this.ctx.arc(bx, by, 18, 0, Math.PI*2);
                        this.ctx.fill();
                        this.ctx.restore();
                    }
                }
            } catch {}

            // Burning overlay and embers
            if (isBurning) {
                // subtle bright rim
                this.ctx.strokeStyle = 'rgba(255,120,60,0.7)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(screenPos.x, screenPos.y, bot.size + 2, 0, Math.PI * 2);
                this.ctx.stroke();
                // occasional ember
                if (Math.random() < 0.25) {
                    const a = Math.random() * Math.PI * 2;
                    this.particles.push({
                        pos: bot.pos.clone(),
                        velocity: new Vector2(Math.cos(a) * 60, Math.sin(a) * 60),
                        color: '#fb923c',
                        life: 300,
                        size: 1.5
                    });
                }
            }
            
            // Draw bot name
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            // Bot name rendering removed
            
            // Draw state indicator
            let stateColor = '#00ff00';
            if (bot.state === 'hunting') stateColor = '#ff0000';
            else if (bot.state === 'fleeing') stateColor = '#ffff00';
            
            this.ctx.fillStyle = stateColor;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Health bar
            if (bot.maxHP) {
                this.renderHealthBar(screenPos.x, screenPos.y - bot.size - 18, 40, 5, bot.hp, bot.maxHP);
            }
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
            
            // Draw tower visuals with turret-only visual scale
            this.ctx.save();
            const k2 = (this.turretVisualScale || 1);
            this.ctx.translate(screenPos.x, screenPos.y);
            if (k2 !== 1) this.ctx.scale(k2, k2);
            // base
            this.ctx.fillStyle = '#666666';
            this.ctx.strokeStyle = '#333333';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            // cannon
            this.ctx.fillStyle = '#444444';
            this.ctx.fillRect(-3, -8, 6, 16);
            // symbol
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚡', 0, 4);
            this.ctx.restore();
        });
    }
    
    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            const screenPos = new Vector2(
                projectile.pos.x - this.camera.x,
                projectile.pos.y - this.camera.y
            );
            
            // Color-code by owner/type; when fire infusion is active, player's bullets use fiery palette
            const isFiery = !!projectile.isFiery;
            const isPlayerBullet = projectile.owner && (projectile.owner === this.player);
            const isSniperBullet = !!projectile.isSniper;
            const coreColor = isPlayerBullet
                ? (isFiery ? '#ff7a1a' : '#22ff66')
                : (isSniperBullet ? '#bf00ff' : '#ff4444');
            const trailColor = isPlayerBullet
                ? (isFiery ? '#ff7a1a99' : '#22ff6688')
                : (isSniperBullet ? '#bf00ff66' : '#ff444466');
            const glowInner = isPlayerBullet
                ? (isFiery ? 'rgba(255,122,26,0.65)' : 'rgba(34,255,102,0.6)')
                : (isSniperBullet ? 'rgba(191,0,255,0.7)' : 'rgba(255,160,64,0.6)');
            const glowOuter = isPlayerBullet
                ? (isFiery ? 'rgba(255,122,26,0.0)' : 'rgba(34,255,102,0.0)')
                : (isSniperBullet ? 'rgba(191,0,255,0.0)' : 'rgba(255,160,64,0.0)');
            this.ctx.fillStyle = coreColor;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw projectile trail
            this.ctx.strokeStyle = trailColor;
            this.ctx.lineWidth = isFiery ? 2.5 : 2;
            this.ctx.beginPath();
            this.ctx.moveTo(screenPos.x, screenPos.y);
            const trailEnd = screenPos.minusNew(projectile.velocity.multiplyNew(0.1));
            this.ctx.lineTo(trailEnd.x, trailEnd.y);
            this.ctx.stroke();

            // Fiery aura
            if (isFiery) {
                const g = this.ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, 10);
                g.addColorStop(0, glowInner);
                g.addColorStop(1, glowOuter);
                this.ctx.fillStyle = g;
                this.ctx.beginPath();
                this.ctx.arc(screenPos.x, screenPos.y, 10, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    // Check projectile collisions with player and AI, apply damage, and cleanup
    handleProjectileHits() {
        const entities = [];
        if (this.player) entities.push({ obj: this.player, isPlayer: true });
        (this.aiBots || []).forEach(b => entities.push({ obj: b, isPlayer: false }));

        this.projectiles.forEach(p => {
            if (p.hit) return;
            for (const e of entities) {
                // Do not hit the shooter
                if (p.owner && p.owner === e.obj) continue;
                // Prevent enemy projectiles from hitting other enemies (boss bullets pass through support)
                if (p.owner && p.owner !== this.player && !e.isPlayer) continue;
                const radius = (e.obj.size || 12) + 4;
                const d = p.pos.minusNew(e.obj.pos).magnitude();
                if (d <= radius) {
                    // Ignore damage to player during spawn protection
                    if (e.isPlayer && e.obj.spawnProtectedUntil && Date.now() < e.obj.spawnProtectedUntil) {
                        // Let projectile continue to fly; do not consume
                        continue;
                    }
                    // Ignore damage while dodging invulnerable
                    if (e.isPlayer && this.isDodging && Date.now() < this.dodgeInvulnUntil) {
                        continue;
                    }
                    // Base damage
                    let dmg = (p.damage != null ? p.damage : 12);
                    // Offensive crits if shooter is player
                    if (p.owner && p.owner === this.player) {
                        const pc = this.player.critChance || 0;
                        const cm = (this.player.critDamageMult != null) ? this.player.critDamageMult : 1.0; // +100% means 1.0
                        if (Math.random() < pc) {
                            dmg = Math.floor(dmg * (1 + cm));
                            // TODO: on-crit hooks
                        }
                    }
                    // Defensive armor if target is player
                    if (e.isPlayer) {
                        const armor = this.player.armor || 0;
                        if (armor > 0) dmg = Math.max(1, dmg - armor);
                        // During post-revive grace, prevent lethal projectile damage
                        const now = Date.now();
                        if (this.player.reviveNoLethalUntil && now < this.player.reviveNoLethalUntil) {
                            const curHP = (e.obj.hp != null ? e.obj.hp : (e.obj.maxHP || 100));
                            if (dmg >= curHP) dmg = Math.max(1, curHP - 1);
                        }
                    }
                    const maxHP = e.obj.maxHP || 100;
                    e.obj.hp = Math.max(0, (e.obj.hp != null ? e.obj.hp : maxHP) - dmg);
                    // SFX on hit
                    if (e.isPlayer) {
                        this.playPlayerHurt();
                        // Add player hit flash effect
                        this.addPlayerHitFlash(dmg);
                    } else {
                        this.playHit();
                    }

                    // Hitstop + mini knockback + hit flash for bots (not player)
                    if (!e.isPlayer) {
                        const now = Date.now();
                        // derive stagger resistance (wave-scaled) if missing
                        const wave = Math.max(1, this.waveNumber || 1);
                        const resist = (e.obj.staggerResist != null)
                            ? e.obj.staggerResist
                            : Math.min(0.6, 0.12 + wave * 0.04);
                        // scale hitstop and knockback by (1 - resist)
                        const scale = Math.max(0.15, 1 - resist); // never below 0.15
                        const hitstopMs = Math.floor(70 * scale);
                        const kbPixels = 4 * (0.6 + 0.4 * scale); // keep some kb late-game
                        // brief slow (hitstop)
                        e.obj.slowedUntil = now + hitstopMs;
                        e.obj.slowFactor = 0.2;
                        // mini knockback away from impact
                        const dir = e.obj.pos.minusNew(p.pos);
                        const mag = Math.max(1, dir.magnitude());
                        const kb = dir.divideNew(mag).multiplyNew(kbPixels);
                        e.obj.pos.plusEq(kb);
                        // flash
                        e.obj.hitFlashUntil = now + Math.max(60, Math.floor(100 * scale));
                    }

                    // Pierce handling: only consume projectile if no pierce left
                    let consumed = true;
                    if (p.owner && p.owner === this.player) {
                        const pierceChance = this.player.pierceChance || 0;
                        const pierceCount = p.pierce != null ? p.pierce : 0;
                        if (pierceCount > 0 || Math.random() < pierceChance) {
                            // allow projectile to continue, decrement local counter if present
                            if (pierceCount > 0) p.pierce = pierceCount - 1;
                            consumed = false;
                        }
                    }
                    if (consumed) p.hit = true;

                    // Apply burn if fiery and target is not the player
                    if (!e.isPlayer && p.isFiery) {
                        const now = Date.now();
                        e.obj.burningUntil = now + (p.burnDuration || 0);
                        e.obj.burningDps = p.burnDps || 0;
                        // small ember burst on hit
                        for (let i = 0; i < 6; i++) {
                            const a = Math.random() * Math.PI * 2;
                            this.particles.push({
                                pos: e.obj.pos.clone(),
                                velocity: new Vector2(Math.cos(a)*80, Math.sin(a)*80),
                                color: '#fb923c',
                                life: 300,
                                size: 1.5
                            });
                        }
                    }

                    // death handling
                    if (e.obj.hp <= 0) {
                        if (e.isPlayer) {
                            // player dies -> consume heart or end
                            this.onPlayerKilled(e.obj.pos.clone());
                        } else {
                            const idx = this.aiBots.indexOf(e.obj);
                            if (idx >= 0) this.aiBots.splice(idx, 1);
                            this.score += 200;
                            // SFX: kill
                            this.playKill();
                            // Combo: projectile kill by player
                            try {
                                if (p.owner && p.owner === this.player) {
                                    const nowC = Date.now();
                                    this.player.comboCount = (this.player.comboCount || 0) + 1;
                                    this.player.comboExpireAt = nowC + (this.comboWindowMs || 3000);
                                    this.player.comboLastIncAt = nowC;
                                }
                            } catch(_) {}
                            // On-kill heal if killer was the player
                            if (p.owner && p.owner === this.player && this.player.onKillHeal && this.player.onKillHeal > 0) {
                                this.player.hp = Math.min(this.player.maxHP || 100, this.player.hp + this.player.onKillHeal);
                            }
                            // Create drop in Brotato mode
                            if (this.gameMode === 'brotato') {
                                // Materials-only drop. Chance by size: 15 -> 30%, 19 -> 100%.
                                const isBig = (e.obj.size === 19);
                                const matChance = isBig ? 1.0 : 0.3;
                                if (Math.random() < matChance) {
                                    const amountBase = 1 + Math.floor((this.waveNumber || 1) * 0.25);
                                    const bonus = Math.random() < 0.2 ? 1 : 0; // 20% chance +1
                                    const drop = {
                                        pos: e.obj.pos.clone(),
                                        type: 'mat',
                                        amount: Math.max(1, amountBase) + bonus,
                                        vel: new Vector2((Math.random()-0.5)*60, (Math.random()-0.5)*60)
                                    };
                                    this.drops.push(drop);
                                }
                            }
                        }
                    }
                    break;
                }
            }
        });
    }

    // Called when player HP reaches 0; decides to respawn or end game
    onPlayerKilled(pos) {
        if (this.lives > 0) {
            this.lives -= 1;
            // Show 2s heart overlay feedback
            this.showLifeOverlay();
            this.respawnPlayerAt(pos);
        } else {
            this.endGame();
        }
    }

    respawnPlayerAt(pos) {
        if (!this.player) return;
        // Clear stray projectiles to avoid instant death chain
        this.projectiles = [];
        // Restore health and place at exact death position
        this.player.hp = this.player.maxHP || 100;
        this.player.pos = pos.clone ? pos.clone() : new Vector2(pos.x, pos.y);
        this.player.velocity = new Vector2(0, 0);
        // Brief spawn protection
        this.player.spawnProtectedUntil = Date.now() + 1500;
        // Also grant a short "no-lethal" grace to avoid instant death on first hit after revive
        this.player.reviveNoLethalUntil = Date.now() + 3000;
        // Update UI hearts immediately
        const livesEl = document.getElementById('livesDisplay');
        if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, this.lives));
    }

    showLifeOverlay() {
        const overlay = document.getElementById('lifeOverlay');
        const icon = document.getElementById('lifeOverlayIcon');
        if (!overlay || !icon) return;
        // restart animation reliably
        icon.classList.remove('pulse-anim');
        // force reflow
        void icon.offsetWidth;
        icon.classList.add('pulse-anim');
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.style.display = 'none';
            icon.classList.remove('pulse-anim');
        }, 1000);
    }

    // Resolve entity overlaps each frame (player vs bots and bot vs bot)
    handleEntityCollisions(deltaTime) {
        const ents = [];
        if (this.player) ents.push(this.player);
        (this.aiBots || []).forEach(b => ents.push(b));

        for (let i = 0; i < ents.length; i++) {
            for (let j = i + 1; j < ents.length; j++) {
                const a = ents[i];
                const b = ents[j];
                const ra = a.size || 12;
                const rb = b.size || 12;
                const sum = ra + rb;
                const d = b.pos.minusNew(a.pos);
                const dist = d.magnitude();
                if (dist > 0 && dist < sum) {
                    const overlap = sum - dist;
                    const n = d.divideNew(dist);
                    const push = n.multiplyNew(overlap * 0.5);
                    // Push apart; give player more authority
                    a.pos = a.pos.minusNew(push.multiplyNew(a === this.player ? 1.0 : 0.7));
                    b.pos = b.pos.plusNew(push.multiplyNew(b === this.player ? 1.0 : 0.7));
                }
            }
        }
    }

    // Simple health bar renderer
    renderHealthBar(x, y, w, h, hp, maxHP) {
        const pct = Math.max(0, Math.min(1, hp / maxHP));
        // background
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
        // red base
        this.ctx.fillStyle = '#aa2222';
        this.ctx.fillRect(x - w / 2, y, w, h);
        // green current
        this.ctx.fillStyle = '#22dd22';
        this.ctx.fillRect(x - w / 2, y, w * pct, h);
        // border
        this.ctx.strokeStyle = '#ffffffaa';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - w / 2, y, w, h);
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
            try { document.body.classList.remove('menu-open'); } catch(_){ }
            try { this.paused = false; } catch(_) {}
            try { this.updateTouchControlsVisibility(); } catch(_) {}
            try { this.ensureTouchButtonsBound && this.ensureTouchButtonsBound(); } catch(_) {}
            try { this.forceEnableTouchButtons && this.forceEnableTouchButtons(); } catch(_) {}
        } else {
            try { if (menu.parentElement !== document.body) document.body.appendChild(menu); } catch(_){ }
            menu.style.display = 'block';
            try { document.body.classList.add('menu-open'); } catch(_){ }
            // Sync in-game sliders with current settings
            try {
                const s = this.settings || { masterVolume: 1, musicVolume: (this.musicVolume ?? 0.15) };
                const vol = document.getElementById('volumeRange');
                const volLbl = document.getElementById('volumeValue');
                if (vol) {
                    vol.value = s.masterVolume ?? 1;
                    if (volLbl) volLbl.textContent = Math.round((s.masterVolume ?? 1) * 100) + '%';
                    if (!vol.__bound) {
                        vol.addEventListener('input', () => {
                            const v = Math.max(0, Math.min(1, parseFloat(vol.value) || 0));
                            if (!this.settings) this.settings = {};
                            this.settings.masterVolume = v;
                            if (volLbl) volLbl.textContent = Math.round(v * 100) + '%';
                            try { this.saveSettings && this.saveSettings(); } catch(_) {}
                            try { this.applyAudioSettings && this.applyAudioSettings(); } catch(_) {}
                        });
                        vol.__bound = true;
                    }
                }
                const mvol = document.getElementById('musicVolumeRange');
                const mvolLbl = document.getElementById('musicVolumeValueIngame');
                if (mvol) {
                    mvol.value = s.musicVolume ?? (this.musicVolume ?? 0.15);
                    if (mvolLbl) mvolLbl.textContent = Math.round((s.musicVolume ?? (this.musicVolume ?? 0.15)) * 100) + '%';
                    if (!mvol.__bound) {
                        mvol.addEventListener('input', () => {
                            const v = Math.max(0, Math.min(1, parseFloat(mvol.value) || 0));
                            if (!this.settings) this.settings = {};
                            this.settings.musicVolume = v;
                            if (mvolLbl) mvolLbl.textContent = Math.round(v * 100) + '%';
                            try { this.saveSettings && this.saveSettings(); } catch(_) {}
                            try { this.applyAudioSettings && this.applyAudioSettings(); } catch(_) {}
                        });
                        mvol.__bound = true;
                    }
                }
            } catch(_) {}
        }
    }
    
    resumeGame() {
        // Comprehensive resume to ensure touch controls are restored after pause
        this.paused = false;
        this.inShop = false;
        const menu = document.getElementById('inGameMenu');
        if (menu) menu.style.display = 'none';
        // Ensure main menu stays hidden after closing pause
        try { const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'none'; } catch(_) {}
        try { document.body.classList.remove('menu-open'); document.body.classList.remove('shop-open'); } catch(_) {}
        // Hide mouse cursor back during gameplay
        this.setCursorVisible(false);
        // Show touch controls again when resuming
        this.updateTouchControlsVisibility();
        // Hard-ensure mobile buttons are interactive and bound
        try { this.forceEnableTouchButtons && this.forceEnableTouchButtons(); } catch(_) {}
        // Ensure touch buttons are tappable and bound after pause toggle
        try {
            const tc = document.getElementById('touchControls');
            if (tc) { tc.style.pointerEvents = 'auto'; tc.style.display = 'block'; tc.style.zIndex = '30000'; }
            const skillBtn = document.getElementById('skillBtn');
            if (skillBtn) { skillBtn.style.pointerEvents = 'auto'; skillBtn.style.zIndex = '30010'; skillBtn.disabled = false; }
            const dodgeBtn = document.getElementById('dodgeBtn');
            if (dodgeBtn) { dodgeBtn.style.pointerEvents = 'auto'; dodgeBtn.style.zIndex = '30010'; dodgeBtn.disabled = false; }
            this.ensureTouchButtonsBound && this.ensureTouchButtonsBound();
            // Re-apply once more after a short delay to override any late overlay sync
            setTimeout(() => {
                try {
                    const tc2 = document.getElementById('touchControls');
                    if (tc2) { tc2.style.pointerEvents = 'auto'; tc2.style.display = (this.usingTouch && this.gameState==='playing' && !this.paused) ? 'block' : 'none'; tc2.style.zIndex = '30000'; }
                    const s2 = document.getElementById('skillBtn'); if (s2) { s2.style.pointerEvents = 'auto'; s2.style.zIndex = '30010'; s2.disabled = false; }
                    const d2 = document.getElementById('dodgeBtn'); if (d2) { d2.style.pointerEvents = 'auto'; d2.style.zIndex = '30010'; d2.disabled = false; }
                    this.ensureTouchButtonsBound && this.ensureTouchButtonsBound();
                    this.forceEnableTouchButtons && this.forceEnableTouchButtons();
                } catch(_) {}
            }, 50);
            setTimeout(() => {
                try { this.updateTouchControlsVisibility(); this.ensureTouchButtonsBound && this.ensureTouchButtonsBound(); this.forceEnableTouchButtons && this.forceEnableTouchButtons(); } catch(_) {}
            }, 150);
        } catch(_) {}
        // Ensure we have a non-zero direction so movement visibly resumes even if mouse is centered
        const screenCenter = new Vector2(this.canvas.width / 2, this.canvas.height / 2);
        const delta = this.mouse.minusNew(screenCenter);
        const isZeroDelta = Math.abs(delta.x) < 0.0001 && Math.abs(delta.y) < 0.0001;
        const hasLast = this.lastMoveDir && (Math.abs(this.lastMoveDir.x) > 0.0001 || Math.abs(this.lastMoveDir.y) > 0.0001);
        if (!hasLast && isZeroDelta) {
            this.lastMoveDir = new Vector2(1, 0);
        }
        // Resume audio context if suspended
        this.resumeAudioContext && this.resumeAudioContext();
    }

    // Simple mobile check
    isMobile() {
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    }

    // Keep canvas backing size in sync with CSS viewport size
    resizeCanvas() {
        const vw = Math.floor((window.visualViewport?.width) || window.innerWidth || document.documentElement.clientWidth || this.canvas.clientWidth || 800);
        const vh = Math.floor((window.visualViewport?.height) || window.innerHeight || document.documentElement.clientHeight || this.canvas.clientHeight || 600);
        const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        // Slightly higher DPR cap on desktop, especially in fullscreen, to improve crispness
        const dprCap = this.isMobile() ? 3 : (isFS ? 3.5 : 3.2);
        const dpr = Math.max(1, Math.min(dprCap, window.devicePixelRatio || 1));
        // Zoom strategy:
        // - Mobile: use getMobileZoom() to widen/narrow FOV
        // - Desktop: scale with viewport so perceived arena size stays consistent across windowed/fullscreen
        let zoom = 1.0;
        if (this.isMobile()) {
            zoom = this.getMobileZoom();
        } else {
            const baseW = 1280, baseH = 720;
            const zw = vw / baseW;
            const zh = vh / baseH;
            // Increase zoom as viewport grows, capped for performance
            zoom = Math.max(1.0, Math.min(2.5, Math.min(zw, zh)));
        }
        // Desktop quality boost in fullscreen for sharper vectors without blowing perf
        let quality = (this.isMobile() ? 1.0 : (isFS ? 1.25 : 1.0));
        // Pixel budget to keep performance in check (backing store pixels)
        const PIXEL_BUDGET = 5_200_000; // ~5.2 MP
        // Effective scale from CSS pixels to backing pixels
        let scale = (dpr * quality) / zoom;
        // If over budget, reduce quality proportionally
        const estPixels = Math.max(1, Math.floor(vw * vh * scale * scale));
        if (estPixels > PIXEL_BUDGET) {
            const factor = Math.sqrt(PIXEL_BUDGET / estPixels);
            scale *= factor;
        }
        const bw = Math.max(1, Math.floor(vw * scale));
        const bh = Math.max(1, Math.floor(vh * scale));
        this.canvas.width = bw;
        this.canvas.height = bh;
        // Optionally scale context for crisp text, but we draw using backing pixels already
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        try { this.ctx.imageSmoothingEnabled = true; } catch(_) {}
        // Force a re-render in case timing races with fullscreen transition
        // Next animation frame will use updated size
    }

    bindResizeEvents() {
        const doResize = () => this.resizeCanvas();
        window.addEventListener('resize', doResize);
        window.addEventListener('orientationchange', () => setTimeout(doResize, 60));
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', doResize);
        }
        document.addEventListener('fullscreenchange', () => setTimeout(doResize, 120));
        document.addEventListener('webkitfullscreenchange', () => setTimeout(doResize, 120));
    }

    // Determine zoom factor for mobile: closer by default, then widen as range increases
    getMobileZoom() {
        const base = 2.3; // stronger default zoom-in on mobile
        const ratio = Math.max(0.6, Math.min(1.4, this.baseWeaponRange / Math.max(1, this.weaponRange)));
        // User FOV scale multiplies final zoom (1.0 = default); lower -> wider FOV
        let z = base * ratio * (this.mobileFovScale || 1.0);
        // Clamp to safe range
        z = Math.max(1.3, Math.min(2.8, z));
        return z;
    }

    onRangeChanged() {
        if (this.isMobile()) this.resizeCanvas();
    }

    // Attempt to enter fullscreen on supported browsers (especially mobile)
    requestFullscreenIfPossible() {
        try {
            const doc = document;
            if (doc.fullscreenElement || doc.webkitFullscreenElement) return;
            // Use the document element so UI overlays (menus, HUD) remain visible in fullscreen
            const target = doc.documentElement;
            const req = target.requestFullscreen || target.webkitRequestFullscreen || doc.documentElement.requestFullscreen;
            if (req) {
                req.call(target).catch(()=>{});
            }
        } catch (_) { /* no-op */ }
    }

    // Bind a one-time listener to request fullscreen on first user interaction
    bindCanvasAutoFullscreen() {
        if (!this.isMobile()) return; // mobile only
        const once = () => {
            this.requestFullscreenIfPossible();
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(()=>{});
            }
            // Resize shortly after to account for browser UI animation
            setTimeout(() => this.resizeCanvas(), 160);
        };
        const opts = { once: true, passive: true };
        window.addEventListener('pointerdown', once, opts);
        window.addEventListener('touchend', once, opts);
        window.addEventListener('click', once, opts);
    }
    
    endGame() {
        // Guard: prevent multiple end handling from multi-hit lethal frames
        if (this._runEnded) return;
        this._runEnded = true;
        this.gameState = 'gameOver';
        this.syncBodyPlaying && this.syncBodyPlaying();
        
        // Hide game UI, show game over screen
        const gameUI = document.getElementById('gameUI');
        if (gameUI) gameUI.style.display = 'none';
        const timer = document.getElementById('timer');
        if (timer) timer.style.display = 'none';
        const leaderboard = document.getElementById('leaderboard');
        if (leaderboard) leaderboard.style.display = 'none';
        const abilityCooldown = document.querySelector('.ability-cooldown');
        if (abilityCooldown) abilityCooldown.style.display = 'none';
        const inGameMenu = document.getElementById('inGameMenu');
        if (inGameMenu) inGameMenu.style.display = 'none';
        const over = document.getElementById('gameOverScreen');
        if (over) {
            // Ensure it's a direct child of body so position:fixed is relative to viewport
            if (over.parentElement !== document.body) {
                document.body.appendChild(over);
            }
            // Force overlay full-viewport with !important
            over.style.setProperty('display', 'flex', 'important');
            over.style.setProperty('position', 'fixed', 'important');
            over.style.setProperty('inset', '0', 'important');
            over.style.setProperty('width', '100vw', 'important');
            over.style.setProperty('height', '100vh', 'important');
            over.style.setProperty('background', 'rgba(0,0,0,0.7)', 'important');
            over.style.setProperty('align-items', 'center', 'important');
            over.style.setProperty('justify-content', 'center', 'important');
            over.style.setProperty('z-index', '9999', 'important');
            // Force inner card centering (in case flex gets overridden)
            const card = over.firstElementChild;
            if (card) {
                card.style.setProperty('position', 'fixed', 'important');
                card.style.setProperty('top', '50%', 'important');
                card.style.setProperty('left', '50%', 'important');
                card.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
                card.style.setProperty('max-width', '92vw', 'important');
            }
        }
        
        // Persist run history (end of run)
        try {
            const outcome = (this.waveNumber >= (this.targetWinWave || 9999)) ? 'win' : 'death';
            this.recordRunEnd && this.recordRunEnd(outcome);
        } catch (_) {}

        // Show final stats with enhanced information
        const finalStats = document.getElementById('finalStats');
        if (finalStats) finalStats.innerHTML = `
            <div style="margin-bottom:8px;">
                <span style="color:#22c55e; font-weight:700; font-size:16px;">🏆 Final Skor: ${this.score}</span>
            </div>
            <div style="margin-bottom:4px;">
                <span style="color:#94a3b8;">Boyut:</span> 
                <span style="color:#e5e7eb; font-weight:600;">${this.player ? this.player.size.toFixed(1) : '0'}</span>
            </div>
            <div style="margin-bottom:4px;">
                <span style="color:#94a3b8;">Element:</span> 
                <span style="color:#e5e7eb; font-weight:600;">${this.player ? this.getElementDisplayName(this.player.element) : '-'}</span>
            </div>
            <div>
                <span style="color:#94a3b8;">Süre:</span> 
                <span style="color:#e5e7eb; font-weight:600;">${this.formatRunTime(this.gameTime - this.remainingTime)}</span>
            </div>
        `;

        // Update enhanced stats
        this.updateRunTimeStats();
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) restartBtn.onclick = () => this.restartRun();
        const backBtn = document.getElementById('backToMenuBtn');
        if (backBtn) backBtn.onclick = () => location.reload();
    }

    // Helper function to get element display name in Turkish
    getElementDisplayName(element) {
        const elementNames = {
            'fire': '🔥 Ateş',
            'water': '💧 Su',
            'air': '🌬️ Hava'
        };
        return elementNames[element] || element || 'Bilinmeyen';
    }

    // Helper function to format run time
    formatRunTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Update run time statistics
    updateRunTimeStats() {
        try {
            const currentRunTime = this.gameTime - this.remainingTime;
            const formattedTime = this.formatRunTime(currentRunTime);
            
            // Update last run time
            const lastRunEl = document.getElementById('lastRunTime');
            if (lastRunEl) {
                lastRunEl.textContent = formattedTime;
            }
            
            // Get and update best run time
            const bestRunTime = this.getBestRunTime();
            const bestRunEl = document.getElementById('bestRunTime');
            if (bestRunEl) {
                bestRunEl.textContent = bestRunTime || formattedTime;
            }
            
            // Update wave and kills
            const finalWaveEl = document.getElementById('finalWave');
            if (finalWaveEl) {
                finalWaveEl.textContent = this.waveNumber || 0;
            }
            
            const finalKillsEl = document.getElementById('finalKills');
            if (finalKillsEl) {
                finalKillsEl.textContent = this.totalKills || 0;
            }
            
            // Save current run to localStorage
            this.saveRunStats(currentRunTime, this.score, this.waveNumber, this.totalKills || 0);
            
        } catch (error) {
            console.error('Error updating run time stats:', error);
        }
    }

    // Get best run time from localStorage
    getBestRunTime() {
        try {
            const stats = localStorage.getItem('elementist_run_stats');
            if (stats) {
                const parsed = JSON.parse(stats);
                if (parsed.bestTime) {
                    return this.formatRunTime(parsed.bestTime);
                }
            }
        } catch (error) {
            console.error('Error getting best run time:', error);
        }
        return null;
    }

    // Add player hit flash effect
    addPlayerHitFlash(damage) {
        if (!this.player) return;
        
        // Screen flash effect
        this.screenFlashUntil = Date.now() + 150;
        this.screenFlashIntensity = Math.min(0.6, 0.1 + (damage / 100));
        
        // Damage number particles
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                pos: this.player.pos.clone(),
                velocity: new Vector2(
                    (Math.random() - 0.5) * 50,
                    -Math.random() * 80 - 20
                ),
                color: damage > 30 ? '#ff4444' : '#ffaa00',
                life: 800,
                size: damage > 30 ? 8 : 6,
                text: `-${damage}`,
                isDamageNumber: true
            });
        }
        
        // Screen shake
        this.screenShakeUntil = Date.now() + 200;
        this.screenShakeIntensity = damage > 30 ? 3 : 2;
    }

    saveRunStats(runTime, score, wave, kills) {
        try {
            const stats = localStorage.getItem('elementist_run_stats');
            let parsed = stats ? JSON.parse(stats) : {};
            
            // Update best time if current run is better
            if (!parsed.bestTime || runTime > parsed.bestTime) {
                parsed.bestTime = runTime;
            }
            
            // Add to recent runs
            if (!parsed.recentRuns) {
                parsed.recentRuns = [];
            }
            
            parsed.recentRuns.unshift({
                time: runTime,
                score: score,
                wave: wave,
                kills: kills,
                date: new Date().toISOString()
            });
            
            // Keep only last 10 runs
            parsed.recentRuns = parsed.recentRuns.slice(0, 10);
            
            localStorage.setItem('elementist_run_stats', JSON.stringify(parsed));
        } catch (error) {
            console.error('Error saving run stats:', error);
        }
    }

    saveScoreToGameist(score, wave) {
        try {
            console.log('🎮 Saving Elementist score to Gameist system:', { score, wave });
            
            // Get current user from Firebase Auth
            const user = firebase.auth().currentUser;
            
            if (user) {
                // Save to Firebase Firestore leaderboard collection
                const db = firebase.firestore();
                const leaderboardEntry = {
                    userId: user.uid,
                    displayName: user.displayName || 'Anonymous',
                    photoURL: user.photoURL || '',
                    email: user.email,
                    game: 'elementist',
                    score: Math.floor(score),
                    wave: wave,
                    timestamp: Date.now(),
                    character: this.currentRun ? this.currentRun.character : (this.selectedCharacter || 'berserker'),
                    element: (this.player && this.player.element) ? this.player.element : (this.currentRun ? this.currentRun.element : '-')
                };
                
                db.collection('leaderboard').add(leaderboardEntry)
                    .then(() => {
                        console.log('✅ Score saved to Firebase Firestore leaderboard');
                    })
                    .catch(error => {
                        console.error('❌ Error saving to Firestore:', error);
                    });
                
                // Also save to Realtime Database for cross-device sync
                try {
                    const database = firebase.database();
                    const userScoresRef = database.ref(`userScores/${user.uid}`);
                    const newScoreRef = userScoresRef.push();
                    newScoreRef.set({
                        ...leaderboardEntry,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    });
                    console.log('✅ Score saved to Realtime Database');
                } catch (rtError) {
                    console.warn('⚠️ Could not save to Realtime Database:', rtError);
                }
                
                // Save to localStorage as fallback (gameist_local_scores format)
                try {
                    const localScores = JSON.parse(localStorage.getItem('gameist_local_scores') || '[]');
                    localScores.push({
                        ...leaderboardEntry,
                        timestamp: Date.now()
                    });
                    // Keep only last 50 scores per user
                    const userScores = localScores.filter(s => s.userId === user.uid).slice(-50);
                    const otherScores = localScores.filter(s => s.userId !== user.uid);
                    localStorage.setItem('gameist_local_scores', JSON.stringify([...otherScores, ...userScores]));
                    console.log('✅ Score saved to localStorage fallback');
                } catch (localError) {
                    console.warn('⚠️ Could not save to localStorage:', localError);
                }
                
                // Notify main menu of score update (if on same domain)
                try {
                    const gameistChannel = new BroadcastChannel('gameist_stats');
                    gameistChannel.postMessage({
                        type: 'score_update',
                        game: 'elementist',
                        score: Math.floor(score),
                        userId: user.uid
                    });
                    console.log('✅ Notified main menu of score update');
                } catch (bcError) {
                    console.log('ℹ️ BroadcastChannel not available:', bcError.message);
                }
                
            } else {
                console.log('ℹ️ No authenticated user - score not saved to leaderboard');
                // Still save to localStorage for anonymous users
                try {
                    const anonScores = JSON.parse(localStorage.getItem('gameist_local_scores') || '[]');
                    anonScores.push({
                        userId: 'anonymous',
                        displayName: 'Anonymous Player',
                        game: 'elementist',
                        score: Math.floor(score),
                        wave: wave,
                        timestamp: Date.now(),
                        character: this.currentRun ? this.currentRun.character : (this.selectedCharacter || 'berserker'),
                        element: (this.player && this.player.element) ? this.player.element : (this.currentRun ? this.currentRun.element : '-')
                    });
                    localStorage.setItem('gameist_local_scores', JSON.stringify(anonScores.slice(-50)));
                    console.log('✅ Anonymous score saved to localStorage');
                } catch (anonError) {
                    console.warn('⚠️ Could not save anonymous score:', anonError);
                }
            }
        } catch (error) {
            console.error('❌ Error in saveScoreToGameist:', error);
        }
    }

    // Initialize score monitoring variables
    initScoreMonitoring() {
        this._lastReportedScore = 0;
        this._lastScoreCheckTime = 0;
        this._scoreUpdateInterval = 2000; // Check every 2 seconds (very responsive)
        console.log('🎮 Score monitoring initialized - detecting ANY best score improvement');
    }

    // Get current run's best score from run history - ALWAYS get the exact best
    getCurrentRunBestScore() {
        try {
            // Method 1: Try to get from statsBestScore element (most reliable)
            const statsBestScoreEl = document.getElementById('statsBestScore');
            if (statsBestScoreEl && statsBestScoreEl.textContent && statsBestScoreEl.textContent !== '-') {
                const scoreText = statsBestScoreEl.textContent.replace(/,/g, '').trim();
                const scoreFromElement = parseInt(scoreText);
                if (!isNaN(scoreFromElement) && scoreFromElement > 0) {
                    console.log(`🏆 Getting exact best score from statsBestScore element: ${scoreFromElement}`);
                    return scoreFromElement;
                }
            }
            
            // Method 2: Fallback to runHistory.best.score
            if (this.runHistory && this.runHistory.best && typeof this.runHistory.best.score === 'number') {
                const bestScore = this.runHistory.best.score;
                console.log(`🔄 Fallback to runHistory.best.score: ${bestScore}`);
                return bestScore;
            }
            
            // Method 3: Final fallback to current score
            const currentScore = this.score || 0;
            console.log(`⚠️ No best score found, using current score: ${currentScore}`);
            return currentScore;
        } catch (error) {
            console.warn('⚠️ Error getting current run best score:', error);
            return this.score || 0;
        }
    }

    // Check for score updates and notify main menu
    checkScoreUpdate() {
        const now = Date.now();
        
        // Initialize if not done yet
        if (this._lastScoreCheckTime === undefined) {
            this.initScoreMonitoring();
            this._lastScoreCheckTime = now;
            const initialBest = this.getCurrentRunBestScore();
            this._lastReportedScore = initialBest;
            console.log('🎮 Score monitoring initialized - Initial best score:', initialBest);
            return;
        }
        
        // Check if enough time has passed
        if (now - this._lastScoreCheckTime < this._scoreUpdateInterval) {
            return;
        }
        
        // ALWAYS get the current best score from run history
        const currentBestScore = this.getCurrentRunBestScore();
        const scoreIncrease = currentBestScore - this._lastReportedScore;
        
        console.log(`🔍 Score check: Last reported: ${this._lastReportedScore}, Current best: ${currentBestScore}, Increase: ${scoreIncrease}, Game state: ${this.gameState}`);
        
        // ALWAYS send update if best score changed (even by 1 point)
        if (currentBestScore > this._lastReportedScore && (this.gameState === 'playing' || this.gameState === 'menu')) {
            console.log(`🎉 BEST SCORE IMPROVED! ${this._lastReportedScore} → ${currentBestScore} (+${scoreIncrease})`);
            
            // Send score update to main menu
            this.sendScoreUpdate(currentBestScore, scoreIncrease);
            
            // Update last reported values
            this._lastReportedScore = currentBestScore;
            this._lastScoreCheckTime = now;
        } else {
            // Update time even if no change to keep checking
            this._lastScoreCheckTime = now;
            console.log(`ℹ️ No best score improvement (${currentBestScore} ≤ ${this._lastReportedScore})`);
        }
    }

    // Send score update to main menu via multiple channels
    sendScoreUpdate(currentScore, scoreIncrease) {
        try {
            // Get current user
            const user = firebase.auth().currentUser;
            
            if (user) {
                console.log(`📤 Sending score update to main menu: ${currentScore} (+${scoreIncrease})`);
                
                // Method 1: BroadcastChannel for real-time updates
                try {
                    const gameistChannel = new BroadcastChannel('gameist_stats');
                    gameistChannel.postMessage({
                        type: 'score_update',
                        game: 'elementist',
                        score: Math.floor(currentScore),
                        scoreIncrease: Math.floor(scoreIncrease),
                        userId: user.uid,
                        displayName: user.displayName,
                        wave: this.waveNumber || 0,
                        timestamp: Date.now(),
                        isLiveUpdate: true
                    });
                    console.log('✅ Score update sent via BroadcastChannel');
                } catch (bcError) {
                    console.log('ℹ️ BroadcastChannel not available:', bcError.message);
                }
                
                // Method 2: localStorage for polling
                try {
                    const updateData = {
                        type: 'live_score_update',
                        game: 'elementist',
                        score: Math.floor(currentScore),
                        scoreIncrease: Math.floor(scoreIncrease),
                        userId: user.uid,
                        displayName: user.displayName,
                        wave: this.waveNumber || 0,
                        timestamp: Date.now(),
                        isLiveUpdate: true
                    };
                    localStorage.setItem('gameist_live_score_update', JSON.stringify(updateData));
                    console.log('✅ Score update saved to localStorage');
                } catch (localError) {
                    console.warn('⚠️ Could not save score update to localStorage:', localError);
                }
                
                // Method 3: Save to gameist_local_scores for persistent storage
                try {
                    const localScores = JSON.parse(localStorage.getItem('gameist_local_scores') || '[]');
                    const newScoreEntry = {
                        userId: user.uid,
                        displayName: user.displayName || 'Anonymous',
                        photoURL: user.photoURL || '',
                        email: user.email,
                        game: 'elementist',
                        score: Math.floor(currentScore),
                        wave: this.waveNumber || 0,
                        timestamp: Date.now(),
                        character: this.currentRun ? this.currentRun.character : (this.selectedCharacter || 'berserker'),
                        element: (this.player && this.player.element) ? this.player.element : (this.currentRun ? this.currentRun.element : '-'),
                        isLiveUpdate: true
                    };
                    
                    // Add to local scores (keep only last 50 per user)
                    const userScores = localScores.filter(s => s.userId === user.uid).slice(-49);
                    const otherScores = localScores.filter(s => s.userId !== user.uid);
                    localStorage.setItem('gameist_local_scores', JSON.stringify([...otherScores, ...userScores, newScoreEntry]));
                    console.log('✅ Live score saved to gameist_local_scores');
                } catch (persistError) {
                    console.warn('⚠️ Could not persist live score:', persistError);
                }
                
            } else {
                console.log('ℹ️ No authenticated user - score update not sent');
            }
            
        } catch (error) {
            console.error('❌ Error sending score update:', error);
        }
    }

    // Debug function to show current run history state
    debugRunHistory() {
        console.log('🔍 Run History Debug:');
        
        // Check statsBestScore element
        const statsBestScoreEl = document.getElementById('statsBestScore');
        console.log('statsBestScore element exists:', !!statsBestScoreEl);
        if (statsBestScoreEl) {
            console.log('statsBestScore content:', statsBestScoreEl.textContent);
            const scoreFromElement = parseInt(statsBestScoreEl.textContent.replace(/,/g, '').trim());
            console.log('Parsed score from element:', !isNaN(scoreFromElement) ? scoreFromElement : 'NaN');
        }
        
        console.log('runHistory exists:', !!this.runHistory);
        if (this.runHistory) {
            console.log('runHistory.best exists:', !!this.runHistory.best);
            if (this.runHistory.best) {
                console.log('Best score:', this.runHistory.best.score);
                console.log('Best wave:', this.runHistory.best.wave);
                console.log('Best timestamp:', new Date(this.runHistory.best.timestamp).toLocaleString());
            }
        }
        console.log('Current game score:', this.score);
        console.log('getCurrentRunBestScore() result:', this.getCurrentRunBestScore());
        console.log('Last reported score:', this._lastReportedScore);
    }

    // Debug function to manually trigger score update (call from console)
    debugTestScoreUpdate() {
        console.log('🧪 Manual score test triggered');
        console.log('Current score:', this.score);
        console.log('Run history best score:', this.getCurrentRunBestScore());
        console.log('Game state:', this.gameState);
        console.log('Last reported score:', this._lastReportedScore);
        
        // Force a new best score in run history for testing
        const currentBest = this.getCurrentRunBestScore();
        const testBestScore = currentBest + 500;
        
        // Update runHistory
        if (this.runHistory && this.runHistory.best) {
            this.runHistory.best.score = testBestScore;
            console.log(`🎯 Updated run history best score to: ${testBestScore}`);
        } else {
            console.log('⚠️ No run history found, creating one');
            this.runHistory = {
                best: {
                    score: testBestScore,
                    wave: 1,
                    timestamp: Date.now()
                }
            };
        }
        
        // Also update the statsBestScore element for testing
        const statsBestScoreEl = document.getElementById('statsBestScore');
        if (statsBestScoreEl) {
            statsBestScoreEl.textContent = testBestScore.toLocaleString();
            console.log(`📊 Updated statsBestScore element to: ${testBestScore.toLocaleString()}`);
        } else {
            console.log('⚠️ statsBestScore element not found');
        }
        
        // Trigger score check immediately
        this._lastScoreCheckTime = 0; // Reset timer to force check
        this.checkScoreUpdate();
    }

    // Return to Character & Element Select overlay (like pressing Start, then seeing selection)
    // Fully reset progress and clear world, but don't create player or start gameplay yet.
    returnToCharacterSelect() {
        // Reset core state
        this.gameState = 'menu';
        this.syncBodyPlaying && this.syncBodyPlaying();
        this.score = 0;
        this.materials = 0;
        this.xp = 0;
        this.waveNumber = 0;
        this.waveTimer = 0;
        this.intermissionTimer = 0;
        this.inWave = false;
        this.usedFreeSkill = false;
        this.purchaseUsedForWave = false;
        this.abilityReady = true;
        this.abilityCooldown = 0;
        this.abilityDuration = 0;
        this.camera = { x: 0, y: 0 };
        this.lives = 1;
        // Clear end-of-run guards to prepare fresh recording
        this._runEnded = false;
        this._runEndRecorded = false;

        // Clear world entities and player
        this.aiBots = [];
        this.projectiles = [];
        this.towers = [];
        this.energyOrbs = [];
        this.bonusOrbs = [];
        this.elementZones = [];
        this.particles = [];
        this.drops = [];
        this.waterRings = [];
        this.fireBeams = [];
        this.player = null;

        // UI: hide game over and HUD, show selection overlay
        const over = document.getElementById('gameOverScreen');
        if (over) over.style.display = 'none';
        const gameUI = document.getElementById('gameUI');
        if (gameUI) gameUI.style.display = 'none';
        const timer = document.getElementById('timer');
        if (timer) timer.style.display = 'none';
        const leaderboard = document.getElementById('leaderboard');
        if (leaderboard) leaderboard.style.display = 'none';
        const ability = document.querySelector('.ability-cooldown');
        if (ability) ability.style.display = 'none';
        const cooldownOverlay = document.getElementById('cooldownOverlay');
        if (cooldownOverlay) cooldownOverlay.style.display = 'none';
        const cooldownText = document.getElementById('cooldownText');
        if (cooldownText) cooldownText.textContent = '';

        // Start menu screens
        const startScreen = document.getElementById('startScreen');
        if (startScreen) startScreen.style.display = 'none';
        const overlay = document.getElementById('elementSelectOverlay');
        if (overlay) overlay.style.display = 'block';
        // Keep cursor visible while selecting
        this.setCursorVisible && this.setCursorVisible(true);
        // Update localized texts just in case
        this.applyTranslations && this.applyTranslations();
        // Initial render of stats panel (best and last runs)
        this.renderStatsPanel && this.renderStatsPanel();
    }
    
    render() {
        // Clear canvas completely (no blur effect)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake if active
        if (this.screenShakeUntil && Date.now() < this.screenShakeUntil) {
            const intensity = this.screenShakeIntensity || 2;
            const shakeX = (Math.random() - 0.5) * intensity;
            const shakeY = (Math.random() - 0.5) * intensity;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Draw background by selected map (fallback to stars)
        this.drawBackgroundByMap();
        
        // Apply screen flash if active
        if (this.screenFlashUntil && Date.now() < this.screenFlashUntil) {
            const intensity = this.screenFlashIntensity || 0.3;
            this.ctx.fillStyle = `rgba(255, 100, 100, ${intensity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Add themed screen border/frame per map for a professional finish
        this.drawWorldBorderByMap();
        // Mask any residual dot at dash start for a short time window
        try {
            if (this.lastDashStart && this.lastDashStartAt && (Date.now() - this.lastDashStartAt) < 260) {
                const p = this.worldToScreen(this.lastDashStart);
                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0,0,0,1)';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        } catch {}
        
        if (this.gameState === 'playing') {
            // Draw shrinking play zone boundaries
            this.drawPlayZone();
            // Draw element zones
            this.drawElementZones();
            // (energy/bonus orbs disabled)

            // Draw material/xp drops
            this.drawDrops();
            
            // Draw towers (disabled in brotato mode)
            if (this.gameMode !== 'brotato') this.drawTowers();
            
            // Draw projectiles
            this.drawProjectiles();

            // Draw particles EARLY so ability overlays remain on top
            this.drawParticles();
            // Ability visuals
            this.drawWaterRings();
            this.drawFireBeams();
            
            // (water bubble removed)

            // Draw AI bots
            this.drawAIBots();
            
            // Draw player-following turrets (draw before player)
            if (this.playerTurrets && this.playerTurrets.length) this.drawPlayerTurrets && this.drawPlayerTurrets();
            // Draw special weapons (before player)
            if (this.electroGen) this.drawElectroGen && this.drawElectroGen();
            if (this.gravityOrb) this.drawGravityOrb && this.drawGravityOrb();
            // Draw player (ensure selected skin applied)
            if (this.player) {
                try {
                    const rawSel = localStorage.getItem('glowlings_selected_skin');
                    if (rawSel) {
                        const ss = JSON.parse(rawSel);
                        if (ss && (ss.color || ss.shape)) {
                            if (ss.color && this.player.color !== ss.color) this.player.color = ss.color;
                            if (ss.shape && this.player.shape !== ss.shape) this.player.shape = ss.shape;
                        }
                    }
                } catch(_) {}
                this.drawGlowling(this.player);
            }
        }

        // (reverted) combo flash overlay removed per request
    }
    
    drawBackgroundStars() {
        // Combo pulse subtly amplifies background star twinkle
        const now = Date.now();
        let pulse = 0;
        try {
            if (this.player) {
                const incAt = this.player.comboLastIncAt || 0;
                const dt = now - incAt;
                if (dt >= 0 && dt < 220) {
                    const level = Math.max(0, Math.floor((this.player.comboCount || 0) / 10));
                    pulse = (1 - dt / 220) * Math.min(3, level + 0.5);
                }
            }
        } catch {}
        const scale = 1 + 0.35 * pulse;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 123.456) % this.canvas.width;
            const y = (i * 789.012) % this.canvas.height;
            const size = (Math.sin(now * 0.001 + i) * 0.5 + 1) * scale;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // Map-aware background dispatcher
    drawBackgroundByMap() {
        try {
            let mapId = this.selectedMapId || null;
            if (!mapId) {
                try { const raw = localStorage.getItem('glowlings_selected_map'); if (raw) mapId = (JSON.parse(raw)||{}).id || null; } catch(_) {}
            }
            mapId = mapId || 'map_neon_core';
            switch (mapId) {
                case 'map_neon_core':      return this.bgNeonCore();
                case 'map_frost_void':     return this.bgFrostVoid();
                case 'map_storm_ridge':    return this.bgStormRidge();
                case 'map_solar_dunes':    return this.bgSolarDunes();
                case 'map_abyss_bloom':    return this.bgAbyssBloom();
                case 'map_crystal_nexus':  return this.bgCrystalNexus();
                case 'map_tidal_mist':     return this.bgTidalMist();
                case 'map_ember_fields':   return this.bgEmberFields();
                case 'map_city_circuit':   return this.bgCityCircuit();
                case 'map_void_labyrinth': return this.bgVoidLabyrinth();
                default: return this.bgNeonCore();
            }
        } catch(_) {
            // Safe fallback
            this.drawBackgroundStars();
        }
    }

    // --- Map background implementations ---
    bgNeonCore() {
        // Deep void with neon swirl and clustered twinkles (cinematic, no grid)
        const w = this.canvas.width, h = this.canvas.height;
        const g = this.ctx.createRadialGradient(w*0.5,h*0.5,0,w*0.5,h*0.5,Math.hypot(w,h)*0.6);
        g.addColorStop(0, '#050814');
        g.addColorStop(1, '#02040a');
        this.ctx.fillStyle = g; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.001;
        const clusters = Math.min(8, Math.max(4, Math.floor((w*h)/700000)));
        for(let c=0;c<clusters;c++){
            const cx = (c*137 % w);
            const cy = (c*271 % h);
            const r = 80 + 40*Math.sin(t*0.6 + c);
            const glow = this.ctx.createRadialGradient(cx,cy,0,cx,cy,r);
            glow.addColorStop(0,'rgba(0,255,255,0.10)');
            glow.addColorStop(1,'rgba(0,255,255,0.0)');
            this.ctx.fillStyle = glow; this.ctx.beginPath(); this.ctx.arc(cx,cy,r,0,Math.PI*2); this.ctx.fill();
        }
        // Curved neon arc
        this.ctx.save();
        this.ctx.globalAlpha = 0.25;
        this.ctx.strokeStyle = 'rgba(0,240,255,0.25)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        const R = Math.min(w,h)*0.45;
        const a0 = t*0.2, a1 = a0 + Math.PI*0.8;
        for(let a=a0;a<=a1;a+=0.02){
            const x = w*0.5 + Math.cos(a)*R;
            const y = h*0.5 + Math.sin(a)*R*0.6;
            if(a===a0) this.ctx.moveTo(x,y); else this.ctx.lineTo(x,y);
        }
        this.ctx.stroke();
        this.ctx.restore();
        // Sparse twinkles
        this.ctx.fillStyle = 'rgba(180,240,255,0.8)';
        const tw = Math.min(140, Math.max(60, Math.floor((w*h)/80000)));
        for(let i=0;i<tw;i++){
            const x = (i*199) % w; const y = (i*373) % h;
            const s = 0.6 + 0.7*Math.max(0, Math.sin(t*1.7 + i));
            this.ctx.fillRect(x,y,s,s);
        }
        this.applyVignette('rgba(0,30,40,0.6)');
    }

    bgFrostVoid() {
        const w = this.canvas.width, h = this.canvas.height;
        const g = this.ctx.createRadialGradient(w*0.5,h*0.4,0,w*0.5,h*0.5,Math.hypot(w,h)*0.7);
        g.addColorStop(0, '#031018'); g.addColorStop(1, '#00070c');
        this.ctx.fillStyle = g; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.001;
        // Falling snow-like specks
        const flakes = Math.min(220, Math.max(80, Math.floor((w*h)/50000)));
        for(let i=0;i<flakes;i++){
            const x = ((i*97) % w) + Math.sin(t*0.8 + i*0.5)*3;
            const y = (t*30 + i*13) % (h+10) - 10;
            const r = 0.6 + (i%4)*0.3;
            this.ctx.fillStyle = 'rgba(180,220,255,0.9)';
            this.ctx.beginPath(); this.ctx.arc(x,y,r,0,Math.PI*2); this.ctx.fill();
        }
        // Cold fog sheets
        for(let k=0;k<3;k++){
            const yy = h*0.2 + k* h*0.25 + Math.sin(t*0.3 + k)*20;
            this.ctx.fillStyle = `rgba(120,200,255,${0.035 + k*0.02})`;
            this.ctx.fillRect(0, yy, w, 40);
        }
        this.applyVignette('rgba(60,120,160,0.5)');
    }

    bgStormRidge() {
        const w = this.canvas.width, h = this.canvas.height;
        const g = this.ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#03060b'); g.addColorStop(1, '#05070e');
        this.ctx.fillStyle = g; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.001;
        // Volumetric storm clouds
        for(let i=0;i<6;i++){
            const yy = (h*(i/6)) + Math.sin(t*0.4 + i)*18;
            const grd = this.ctx.createLinearGradient(0,yy-20,0,yy+40);
            grd.addColorStop(0,'rgba(120,140,180,0.03)');
            grd.addColorStop(1,'rgba(120,140,180,0.10)');
            this.ctx.fillStyle = grd; this.ctx.fillRect(0,yy-20,w,60);
        }
        // Lightning glow blobs in clouds
        if ((Date.now()%2000) < 160){
            const lx = (Math.random()*w), ly = (Math.random()*h*0.6);
            const glow = this.ctx.createRadialGradient(lx,ly,0,lx,ly,80);
            glow.addColorStop(0,'rgba(200,240,255,0.40)');
            glow.addColorStop(1,'rgba(200,240,255,0.0)');
            this.ctx.fillStyle = glow; this.ctx.beginPath(); this.ctx.arc(lx,ly,80,0,Math.PI*2); this.ctx.fill();
        }
        this.applyVignette('rgba(10,20,40,0.6)');
    }

    bgSolarDunes() {
        const w = this.canvas.width, h = this.canvas.height;
        const g = this.ctx.createLinearGradient(0,0,0,h);
        g.addColorStop(0,'#1c0f05'); g.addColorStop(1,'#0c0703');
        this.ctx.fillStyle = g; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.001;
        // Rolling dunes via bezier ribbons
        this.ctx.strokeStyle = 'rgba(255,180,90,0.08)'; this.ctx.lineWidth = 2;
        for(let k=0;k<4;k++){
            const y0 = h*0.4 + k*26 + Math.sin(t*0.4 + k)*8;
            this.ctx.beginPath();
            this.ctx.moveTo(0,y0);
            for(let x=0;x<=w;x+=32){
                const y = y0 + Math.sin(x*0.02 + k + t*0.8)*8;
                this.ctx.lineTo(x,y);
            }
            this.ctx.stroke();
        }
        // Heat shimmer specks
        for(let i=0;i<80;i++){
            const x = (i*89)%w, y = (i*53)%h;
            const a = 0.02 + 0.04*((i%5)/5);
            this.ctx.fillStyle = `rgba(255,200,120,${a})`;
            this.ctx.fillRect(x, y + Math.sin(t*3 + i)*2, 1.2, 1.2);
        }
        this.applyVignette('rgba(50,30,8,0.6)');
    }

    bgAbyssBloom() {
        const w = this.canvas.width, h = this.canvas.height;
        this.ctx.fillStyle = '#04020a'; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.001;
        // Bioluminescent speck field
        const specks = Math.min(240, Math.max(120, Math.floor((w*h)/40000)));
        for(let i=0;i<specks;i++){
            const x = ((i*131)%w) + Math.sin(t*0.6 + i)*6;
            const y = ((i*197)%h) + Math.cos(t*0.5 + i*0.7)*4;
            const r = 0.8 + (i%3)*0.4;
            const glow = this.ctx.createRadialGradient(x,y,0,x,y,8);
            glow.addColorStop(0,'rgba(150,120,255,0.22)');
            glow.addColorStop(1,'rgba(150,120,255,0.0)');
            this.ctx.fillStyle = glow; this.ctx.beginPath(); this.ctx.arc(x,y,r,0,Math.PI*2); this.ctx.fill();
        }
        this.applyVignette('rgba(30,10,50,0.6)');
    }

    bgCrystalNexus() {
        const w = this.canvas.width, h = this.canvas.height;
        const g = this.ctx.createLinearGradient(0,0,0,h);
        g.addColorStop(0,'#0a0a15'); g.addColorStop(1,'#070713');
        this.ctx.fillStyle = g; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.0006;
        // Prismatic filled shards with glow
        for(let i=0;i<22;i++){
            this.ctx.save();
            this.ctx.translate((i*91)%w, (i*61)%h);
            this.ctx.rotate((i*0.4)+t);
            const c0 = ['#93c5fd','#a78bfa','#7dd3fc'][i%3];
            const grad = this.ctx.createLinearGradient(-20,-10,20,14);
            grad.addColorStop(0, c0+'66'); grad.addColorStop(1, c0+'10');
            this.ctx.fillStyle = grad;
            this.ctx.shadowColor = c0; this.ctx.shadowBlur = 6;
            this.ctx.beginPath();
            this.ctx.moveTo(-18, -8); this.ctx.lineTo(22, -2); this.ctx.lineTo(12, 18); this.ctx.lineTo(-16, 6); this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        }
        this.applyVignette('rgba(14,14,28,0.6)');
    }

    bgTidalMist() {
        const w = this.canvas.width, h = this.canvas.height;
        this.ctx.fillStyle = '#031018'; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.001;
        // Diagonal light rays through mist
        for(let i=0;i<6;i++){
            const x0 = -w*0.2 + i*w*0.25 + Math.sin(t*0.3 + i)*20;
            const grad = this.ctx.createLinearGradient(x0,0,x0+w*0.2,h);
            grad.addColorStop(0,'rgba(120,200,255,0.04)');
            grad.addColorStop(1,'rgba(120,200,255,0.0)');
            this.ctx.fillStyle = grad; this.ctx.fillRect(x0,0,w*0.2,h);
        }
        // Soft moving mist sheets
        for(let k=0;k<3;k++){
            const yy = h*0.5 + Math.sin(t*0.6 + k)*30;
            this.ctx.fillStyle = `rgba(100,160,200,${0.06 + k*0.02})`;
            this.ctx.fillRect(0, yy, w, 30);
        }
        this.applyVignette('rgba(6,18,28,0.6)');
    }

    bgEmberFields() {
        const w = this.canvas.width, h = this.canvas.height;
        const g = this.ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#140606'); g.addColorStop(1, '#070202');
        this.ctx.fillStyle = g; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.001;
        // Sprinkled glowing fire particles: homogeneous scatter (Halton), gentle drift, subtle glow
        const count = Math.min(320, Math.max(140, Math.floor((w*h)/36000)));
        const halton = (idx, base) => {
            let f = 1, r = 0, i = idx + 1;
            while (i > 0) { f /= base; r += f * (i % base); i = Math.floor(i / base); }
            return r;
        };
        for(let i=0;i<count;i++){
            // low-discrepancy base placement for homogeneity
            const baseX = Math.floor(halton(i, 2) * w);
            const baseY = Math.floor(halton(i, 3) * h);
            // gentle upward float with tiny horizontal sway
            const y = (h + baseY - ((t*42 + i*3) % (h+24))) % h;
            const x = (baseX + Math.sin(t*1.0 + i*0.37)*1.8 + Math.sin(t*0.47 + i)*0.8) % w;
            // size and flicker
            const size = 0.8 + (i%4)*0.28;
            const flick = 0.75 + 0.25*Math.sin(t*2.4 + i*0.9);
            const r = size * flick;
            // color variation (amber -> orange)
            const warm = (i%3);
            const core = warm===0 ? 'rgba(255,190,120,0.95)' : warm===1 ? 'rgba(255,160,100,0.95)' : 'rgba(255,175,120,0.95)';
            const halo = warm===0 ? 'rgba(255,150,90,0.22)' : warm===1 ? 'rgba(255,120,80,0.20)' : 'rgba(255,140,90,0.20)';
            // halo
            const grd = this.ctx.createRadialGradient(x,y,0,x,y,8);
            grd.addColorStop(0, halo);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = grd; this.ctx.beginPath(); this.ctx.arc(x,y, Math.max(2.0,r*2.0), 0, Math.PI*2); this.ctx.fill();
            // core
            this.ctx.fillStyle = core;
            this.ctx.beginPath(); this.ctx.arc(x,y,r,0,Math.PI*2); this.ctx.fill();
            // rare sparkle
            if ((i%37)===0){
                this.ctx.fillStyle = 'rgba(255,230,160,0.9)';
                this.ctx.fillRect(x+0.5, y-0.5, 1.2, 1.2);
            }
        }
        this.applyVignette('rgba(45,12,6,0.6)');
    }

    bgCityCircuit() {
        const w = this.canvas.width, h = this.canvas.height;
        this.ctx.fillStyle = '#02050a'; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.0015;
        // Neon constellation: nodes with faint connections (no grid)
        const nodes = Math.min(80, Math.max(28, Math.floor((w*h)/90000)));
        const pts = [];
        for(let i=0;i<nodes;i++){
            const x = (i*97)%w, y = (i*131)%h;
            const pulse = (Math.sin(t + i*0.7)+1)*0.5;
            const r = 2 + pulse*2;
            const glow = this.ctx.createRadialGradient(x,y,0,x,y,14);
            glow.addColorStop(0,'rgba(0,255,255,0.25)'); glow.addColorStop(1,'rgba(0,255,255,0)');
            this.ctx.fillStyle = glow; this.ctx.beginPath(); this.ctx.arc(x,y,r,0,Math.PI*2); this.ctx.fill();
            pts.push([x,y]);
        }
        this.ctx.strokeStyle = 'rgba(0,200,255,0.06)'; this.ctx.lineWidth = 1;
        for(let i=0;i<pts.length;i+=3){
            const a=pts[i], b=pts[(i+7)%pts.length];
            this.ctx.beginPath(); this.ctx.moveTo(a[0],a[1]); this.ctx.lineTo(b[0],b[1]); this.ctx.stroke();
        }
        this.applyVignette('rgba(0,30,50,0.6)');
    }

    bgVoidLabyrinth() {
        const w = this.canvas.width, h = this.canvas.height;
        this.ctx.fillStyle = '#04040a'; this.ctx.fillRect(0,0,w,h);
        const t = Date.now()*0.001;
        // Ghostly maze hints via faint rectangles
        this.ctx.strokeStyle = 'rgba(140,200,255,0.08)'; this.ctx.lineWidth = 2;
        for(let i=0;i<14;i++){
            const x = (i*73)%w, y = (i*91)%h;
            const w2 = 40 + (i%4)*26, h2 = 28 + (i%3)*22;
            this.ctx.globalAlpha = 0.6 + 0.4*Math.sin(t + i);
            this.ctx.strokeRect(x*0.6, y*0.4, w2, h2);
        }
        this.ctx.globalAlpha = 1;
        // Cold fog veil
        this.ctx.fillStyle = 'rgba(220,240,255,0.02)'; this.ctx.fillRect(0,0,w,h);
        this.applyVignette('rgba(6,6,12,0.65)');
    }

    // Soft vignette for cinematic polish
    applyVignette(col) {
        try{
            const w = this.canvas.width, h = this.canvas.height;
            const r = Math.hypot(w,h) * 0.6;
            const cx = w*0.5, cy = h*0.5;
            const g = this.ctx.createRadialGradient(cx,cy, r*0.6, cx,cy, r);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, col||'rgba(0,0,0,0.6)');
            this.ctx.fillStyle = g; this.ctx.fillRect(0,0,w,h);
        }catch(_){ }
    }

    // Themed screen border/frame per map
    drawWorldBorderByMap(){
        try{
            let mapId = this.selectedMapId || null;
            if (!mapId) { try { const raw = localStorage.getItem('glowlings_selected_map'); if (raw) mapId = (JSON.parse(raw)||{}).id || null; } catch(_) {}
            }
            mapId = mapId || 'map_neon_core';
            const w = this.canvas.width, h = this.canvas.height;
            this.ctx.save();
            this.ctx.translate(0,0);
            switch(mapId){
                case 'map_neon_core': {
                    this.ctx.strokeStyle = 'rgba(0,255,255,0.25)';
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([10,4]);
                    this.ctx.strokeRect(8,8,w-16,h-16);
                    this.ctx.setLineDash([]);
                    break;
                }
                case 'map_frost_void': {
                    // icy beveled frame
                    const grad = this.ctx.createLinearGradient(0,0,w,0);
                    grad.addColorStop(0,'rgba(200,240,255,0.28)'); grad.addColorStop(1,'rgba(160,210,255,0.18)');
                    this.ctx.strokeStyle = grad; this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(10,10,w-20,h-20);
                    break;
                }
                case 'map_storm_ridge': {
                    // jagged electric corners
                    this.ctx.strokeStyle = 'rgba(180,220,255,0.35)'; this.ctx.lineWidth = 2;
                    const drawBoltCorner=(x,y,dx,dy)=>{ this.ctx.beginPath(); this.ctx.moveTo(x,y); this.ctx.lineTo(x+dx*20,y); this.ctx.lineTo(x+dx*24,y+dy*8); this.ctx.lineTo(x+dx*34,y); this.ctx.stroke(); };
                    drawBoltCorner(10,10,1,1); drawBoltCorner(w-10,10,-1,1); drawBoltCorner(10,h-10,1,-1); drawBoltCorner(w-10,h-10,-1,-1);
                    this.ctx.strokeStyle='rgba(120,160,200,0.18)'; this.ctx.strokeRect(12,12,w-24,h-24);
                    break;
                }
                case 'map_solar_dunes': {
                    // wavy sand border top/bottom
                    this.ctx.fillStyle = 'rgba(240,180,60,0.12)';
                    this.ctx.beginPath(); this.ctx.moveTo(0,12);
                    for(let x=0;x<=w;x+=24){ const y = 12 + Math.sin((Date.now()*0.002)+x*0.02)*4; this.ctx.lineTo(x,y); }
                    this.ctx.lineTo(w,0); this.ctx.lineTo(0,0); this.ctx.closePath(); this.ctx.fill();
                    this.ctx.beginPath(); this.ctx.moveTo(0,h-12);
                    for(let x=0;x<=w;x+=24){ const y = h-12 + Math.sin((Date.now()*0.002)+x*0.02+1.2)*4; this.ctx.lineTo(x,y); }
                    this.ctx.lineTo(w,h); this.ctx.lineTo(0,h); this.ctx.closePath(); this.ctx.fill();
                    break;
                }
                case 'map_abyss_bloom': {
                    // petal-like soft corners
                    this.ctx.strokeStyle = 'rgba(170,130,255,0.25)'; this.ctx.lineWidth = 3;
                    const r=18; const k=12;
                    const petals=(cx,cy)=>{ for(let i=0;i<4;i++){ this.ctx.beginPath(); this.ctx.arc(cx,cy,r, i*Math.PI/2, (i+0.5)*Math.PI/2); this.ctx.stroke(); } };
                    petals(12,12); petals(w-12,12); petals(12,h-12); petals(w-12,h-12);
                    break;
                }
                case 'map_crystal_nexus': {
                    // faceted frame
                    this.ctx.strokeStyle = 'rgba(160,170,255,0.25)'; this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(16,32); this.ctx.lineTo(32,16); this.ctx.lineTo(w-32,16); this.ctx.lineTo(w-16,32);
                    this.ctx.lineTo(w-16,h-32); this.ctx.lineTo(w-32,h-16); this.ctx.lineTo(32,h-16); this.ctx.lineTo(16,h-32); this.ctx.closePath(); this.ctx.stroke();
                    break;
                }
                case 'map_tidal_mist': {
                    // soft curved frame
                    this.ctx.strokeStyle = 'rgba(120,200,255,0.18)'; this.ctx.lineWidth = 2;
                    this.ctx.beginPath(); this.ctx.moveTo(14,40); this.ctx.quadraticCurveTo(w*0.5,12,w-14,40); this.ctx.quadraticCurveTo(w-12,h*0.5,w-14,h-40); this.ctx.quadraticCurveTo(w*0.5,h-12,14,h-40); this.ctx.quadraticCurveTo(12,h*0.5,14,40); this.ctx.closePath(); this.ctx.stroke();
                    break;
                }
                case 'map_ember_fields': {
                    // ember glow rim
                    const g = this.ctx.createLinearGradient(0,0,w,0);
                    g.addColorStop(0,'rgba(255,120,80,0.18)'); g.addColorStop(1,'rgba(255,80,120,0.18)');
                    this.ctx.strokeStyle=g; this.ctx.lineWidth=2; this.ctx.strokeRect(10,10,w-20,h-20);
                    break;
                }
                case 'map_city_circuit': {
                    // neon corner brackets
                    this.ctx.strokeStyle = 'rgba(0,255,220,0.35)'; this.ctx.lineWidth = 3;
                    const L=22;
                    const drawBracket=(x,y,sx,sy)=>{ this.ctx.beginPath(); this.ctx.moveTo(x,y+sy*L); this.ctx.lineTo(x,y); this.ctx.lineTo(x+sx*L,y); this.ctx.stroke(); };
                    drawBracket(12,12,1,1); drawBracket(w-12,12,-1,1); drawBracket(12,h-12,1,-1); drawBracket(w-12,h-12,-1,-1);
                    break;
                }
                case 'map_void_labyrinth': {
                    // thin double frame
                    this.ctx.strokeStyle = 'rgba(120,220,255,0.18)'; this.ctx.lineWidth = 1.5;
                    this.ctx.strokeRect(14,14,w-28,h-28);
                    this.ctx.strokeRect(24,24,w-48,h-48);
                    break;
                }
            }
            this.ctx.restore();
        }catch(_){ }
    }
    
    drawElementZones() {
        // Map-aware, visual-only zone styling (no gameplay changes)
        let mapId = this.selectedMapId || null;
        if (!mapId) {
            try { const raw = localStorage.getItem('glowlings_selected_map'); if (raw) mapId = (JSON.parse(raw)||{}).id || null; } catch(_) {}
        }
        mapId = mapId || 'map_neon_core';

        const elementGlyph = (el)=> ({ fire:'🔥', water:'💧', air:'🌬️' }[el] || '⦿');
        const elementTitle = (el)=> ({ fire: this.t ? this.t('elFire') : 'Fire', water: this.t ? this.t('elWater') : 'Water', air: this.t ? this.t('elAir'):'Air' }[el] || el);

        this.elementZones.forEach((zone) => {
            const p = new Vector2(zone.pos.x - this.camera.x, zone.pos.y - this.camera.y);
            const r = zone.radius;
            const ctx = this.ctx;
            ctx.save();

            switch (mapId) {
                case 'map_frost_void': {
                    // Frosted ring: cool gradient fill + crystalline ticks
                    const grd = ctx.createRadialGradient(p.x, p.y, r*0.2, p.x, p.y, r);
                    grd.addColorStop(0, 'rgba(180,220,255,0.10)');
                    grd.addColorStop(1, 'rgba(140,200,255,0.00)');
                    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
                    ctx.strokeStyle = 'rgba(160,210,255,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([6,6]);
                    ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                    // crystal ticks
                    ctx.strokeStyle='rgba(190,235,255,0.45)'; ctx.lineWidth=1;
                    for(let i=0;i<12;i++){ const a=i*(Math.PI*2/12); const ix=p.x+Math.cos(a)*(r-10), iy=p.y+Math.sin(a)*(r-10); const ox=p.x+Math.cos(a)*(r+6), oy=p.y+Math.sin(a)*(r+6); ctx.beginPath(); ctx.moveTo(ix,iy); ctx.lineTo(ox,oy); ctx.stroke(); }
                    break;
                }
                case 'map_solar_dunes': {
                    // Sandy dashed arcs + grain fill
                    ctx.fillStyle = 'rgba(240,180,60,0.08)'; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
                    ctx.strokeStyle = 'rgba(240,180,60,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([14,8]);
                    ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                    // light grain dots on perimeter
                    ctx.fillStyle = 'rgba(240,190,90,0.25)';
                    for(let i=0;i<24;i++){ const a=i*(Math.PI*2/24); const gx=p.x+Math.cos(a)*(r+Math.sin(a*7)*4); const gy=p.y+Math.sin(a)*(r+Math.cos(a*5)*4); ctx.fillRect(gx,gy,1.2,1.2); }
                    break;
                }
                case 'map_crystal_nexus': {
                    // Faceted polygonal outline
                    ctx.strokeStyle = 'rgba(160,170,255,0.85)'; ctx.lineWidth = 2;
                    ctx.beginPath();
                    const sides = 8; for(let i=0;i<=sides;i++){ const a=i*(Math.PI*2/sides)+0.2; const x=p.x+Math.cos(a)*r, y=p.y+Math.sin(a)*r; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.stroke();
                    // subtle prism fill
                    const grd = ctx.createRadialGradient(p.x,p.y, r*0.1, p.x,p.y, r);
                    grd.addColorStop(0,'rgba(170,180,255,0.10)'); grd.addColorStop(1,'rgba(170,180,255,0.00)'); ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
                    break;
                }
                case 'map_tidal_mist': {
                    // Soft double ring with aquatic tint
                    ctx.strokeStyle = 'rgba(120,200,255,0.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke();
                    ctx.strokeStyle = 'rgba(120,200,255,0.25)'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(p.x,p.y,r*0.82,0,Math.PI*2); ctx.stroke();
                    break;
                }
                case 'map_city_circuit': {
                    // Neon bracketed ring with nodes
                    ctx.strokeStyle='rgba(0,255,220,0.55)'; ctx.lineWidth=2; ctx.setLineDash([12,6]); ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                    // nodes
                    for(let i=0;i<6;i++){ const a=i*(Math.PI*2/6); const nx=p.x+Math.cos(a)*r, ny=p.y+Math.sin(a)*r; const g=ctx.createRadialGradient(nx,ny,0,nx,ny,10); g.addColorStop(0,'rgba(0,255,255,0.35)'); g.addColorStop(1,'rgba(0,255,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(nx,ny,3,0,Math.PI*2); ctx.fill(); }
                    break;
                }
                case 'map_void_labyrinth': {
                    // Thin double ring matching labyrinth style
                    ctx.strokeStyle='rgba(120,220,255,0.35)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke();
                    ctx.strokeStyle='rgba(120,220,255,0.18)'; ctx.beginPath(); ctx.arc(p.x,p.y,r*0.86,0,Math.PI*2); ctx.stroke();
                    break;
                }
                case 'map_frost_void': default: {
                    // will be handled above; default minimal neon ring for other maps
                    if (mapId!=='map_frost_void'){
                        ctx.fillStyle = this.hexToRgba(zone.color, 0.18); ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
                        ctx.strokeStyle = this.hexToRgba(zone.color, 0.9); ctx.lineWidth=2; ctx.setLineDash([10,8]); ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                    }
                    break;
                }
            }

            // Cinematic fire treatment for Ember Fields zones (visual only)
            if (mapId === 'map_ember_fields') {
                // Ember glow ring
                const g = ctx.createRadialGradient(p.x,p.y, r*0.65, p.x,p.y, r*1.05);
                g.addColorStop(0,'rgba(255,120,60,0.10)'); g.addColorStop(1,'rgba(255,120,60,0)');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x,p.y,r*1.05,0,Math.PI*2); ctx.fill();
                // Animated flame licks around perimeter
                ctx.strokeStyle = 'rgba(255,140,80,0.6)'; ctx.lineWidth = 2;
                const now = Date.now()*0.0025;
                for(let i=0;i<10;i++){
                    const a = i*(Math.PI*2/10) + Math.sin(now+i)*0.2;
                    const bx = p.x + Math.cos(a)*r; const by = p.y + Math.sin(a)*r;
                    const tx = p.x + Math.cos(a)*(r+12+6*Math.sin(now*2+i));
                    const ty = p.y + Math.sin(a)*(r+12+6*Math.cos(now*1.6+i));
                    ctx.beginPath(); ctx.moveTo(bx,by); ctx.quadraticCurveTo((bx+tx)/2 + 6*Math.sin(i+now), (by+ty)/2 - 6*Math.cos(i+now*1.2), tx,ty); ctx.stroke();
                }
                // inner soft ring
                ctx.strokeStyle = 'rgba(255,160,90,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x,p.y,r*0.88,0,Math.PI*2); ctx.stroke();
            }

            // Element icon + label
            ctx.fillStyle = '#e6f3ff'; ctx.font = 'bold 13px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(elementGlyph(zone.element)+' '+elementTitle(zone.element), p.x, p.y);
            ctx.restore();
        });
    }
    
    drawEnergyOrbs() {
        this.energyOrbs.forEach(orb => {
            const screenPos = new Vector2(
                orb.pos.x - this.camera.x,
                orb.pos.y - this.camera.y
            );
            
            // Draw glow
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, orb.size * 3
            );
            gradient.addColorStop(0, orb.color + 'FF');
            gradient.addColorStop(1, orb.color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, orb.size * 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw orb
            this.ctx.fillStyle = orb.color;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, orb.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawBonusOrbs() {
        this.bonusOrbs.forEach(orb => {
            const screenPos = new Vector2(
                orb.pos.x - this.camera.x,
                orb.pos.y - this.camera.y
            );
            const pulse = Math.sin(Date.now() * 0.005 + orb.pulsePhase) * 0.3 + 1;
            
            // Draw glow
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, orb.size * 4 * pulse
            );
            gradient.addColorStop(0, orb.color + 'FF');
            gradient.addColorStop(1, orb.color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, orb.size * 4 * pulse, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw orb
            this.ctx.fillStyle = orb.color;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, orb.size * pulse, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawGlowling(glowling) {
        this.ctx.save();
        // Draw all entities using world->screen transform for consistency
        const screenPos = this.worldToScreen(glowling.pos);
        
        // Draw glow effect
        const glowSize = glowling.size * (glowling.abilityActive ? 3 : 2);
        const gradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, glowSize
        );
        gradient.addColorStop(0, this.hexToRgba(glowling.color, 0.67));
        gradient.addColorStop(1, this.hexToRgba(glowling.color, 0.0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Dodge visual: smooth sliding trail using actual shape ghosts + ribbon
        if (glowling === this.player && this.isDodging && this.dodgeDir) {
            // Resolve selected dodge skin cosmetics
            let ds = this._cachedDodgeSkin;
            if (!ds) {
                try {
                    const sd = this.loadSelectedDodgeSkin ? this.loadSelectedDodgeSkin() : null;
                    if (sd && sd.id) {
                        const list = (this.DODGE_SKINS || []);
                        ds = list.find(x=>x.id===sd.id) || null;
                    }
                } catch(_) {}
                this._cachedDodgeSkin = ds;
            }
            const c0 = (ds && ds.ribbon && ds.ribbon[0]) ? ds.ribbon[0] : this.player?.color || '#7dd3fc';
            const c1 = (ds && ds.ribbon && ds.ribbon[1]) ? ds.ribbon[1] : '#0ea5e9';
            const ghostsAlphaMul = (ds && ds.ghostsAlpha) ? ds.ghostsAlpha : 1.0;
            const trailMul = (ds && ds.trailMul) ? ds.trailMul : 1.0;
            const ghostsCount = (ds && ds.ghostsCount) ? ds.ghostsCount : 1;
            const sparkCount = (ds && ds.sparkCount) ? ds.sparkCount : 0;
            const orbitals = (ds && ds.orbitals) ? ds.orbitals : 0;
            const waveWidthMul = (ds && ds.waveWidthMul) ? ds.waveWidthMul : 1.0;
            const dir = this.dodgeDir.clone();
            const mag = Math.max(1e-6, Math.sqrt(dir.x*dir.x + dir.y*dir.y));
            const nx = dir.x / mag, ny = dir.y / mag;
            const angle = Math.atan2(ny, nx);

            // Soft ribbon behind player (elongated glow aligned to dash)
            this.ctx.save();
            this.ctx.translate(screenPos.x, screenPos.y);
            this.ctx.rotate(angle);
            const ribbonLen = glowling.size * (5 * trailMul);
            const ribbonRad = glowling.size * (1.1 * trailMul * waveWidthMul);
            const gradRibbon = this.ctx.createLinearGradient(0, 0, -ribbonLen, 0);
            gradRibbon.addColorStop(0.00, this.hexToRgba(c0, 0.28));
            gradRibbon.addColorStop(1.00, this.hexToRgba(c1, 0.00));
            this.ctx.fillStyle = gradRibbon;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -ribbonRad);
            this.ctx.lineTo(0, ribbonRad);
            this.ctx.quadraticCurveTo(-ribbonLen * 0.5, ribbonRad * 0.9, -ribbonLen, ribbonRad * 0.3);
            this.ctx.lineTo(-ribbonLen, -ribbonRad * 0.3);
            this.ctx.quadraticCurveTo(-ribbonLen * 0.5, -ribbonRad * 0.9, 0, -ribbonRad);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();

            // Trailing ghosts of the actual shape (stretched slightly along dash)
            const steps = 7;
            const gap = Math.max(8, glowling.size * 0.8);
            for (let i = 2; i <= steps; i++) {
                const t = i / steps; // 0..1
                const alpha = 0.22 * (1 - t);
                const scaleStretch = 1 + 0.35 * (1 - t); // more stretch near player
                const shrink = 1 - 0.06 * i;
                const offX = screenPos.x - nx * gap * i;
                const offY = screenPos.y - ny * gap * i;

                this.ctx.save();
                this.ctx.translate(offX, offY);
                this.ctx.rotate(angle);
                this.ctx.scale(scaleStretch, 1); // stretch along dash axis
                this.ctx.fillStyle = this.hexToRgba(glowling.color, Math.max(0, alpha));
                this.ctx.beginPath();
                // draw shape centered at 0,0 with size shrink
                switch (glowling.shape) {
                    case 'circle':
                        this.ctx.arc(0, 0, Math.max(4, glowling.size * shrink), 0, Math.PI * 2);
                        break;
                    case 'triangle': {
                        const height = (glowling.size * shrink) * Math.sqrt(3);
                        this.ctx.moveTo(0, -height * 0.6);
                        this.ctx.lineTo(-glowling.size * shrink, height * 0.4);
                        this.ctx.lineTo(glowling.size * shrink, height * 0.4);
                        this.ctx.closePath();
                        break; }
                    case 'star': {
                        const spikes = 5;
                        const outer = glowling.size * shrink;
                        const inner = outer * 0.5;
                        for (let k = 0; k < spikes * 2; k++) {
                            const ang = (k * Math.PI) / spikes;
                            const rad = k % 2 === 0 ? outer : inner;
                            const x = Math.cos(ang) * rad;
                            const y = Math.sin(ang) * rad;
                            if (k === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
                        }
                        this.ctx.closePath();
                        break; }
                    default:
                        this.ctx.arc(0, 0, Math.max(4, glowling.size * shrink), 0, Math.PI * 2);
                }
                this.ctx.fill();
                this.ctx.restore();
            }

            // Orbitals circling the player during dodge (match shop preview intent)
            if (orbitals > 0) {
                const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                for (let k = 0; k < orbitals; k++) {
                    const ang2 = (now * 0.008) + (k * (2 * Math.PI / Math.max(1, orbitals)));
                    const rr = glowling.size * 1.8;
                    const ox = screenPos.x + Math.cos(ang2) * rr;
                    const oy = screenPos.y + Math.sin(ang2) * rr;
                    this.ctx.save();
                    this.ctx.fillStyle = this.hexToRgba(c1, 0.6);
                    this.ctx.beginPath();
                    this.ctx.arc(ox, oy, Math.max(2, glowling.size * 0.22), 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }

            // Sparks: short-lived bright dots trailing behind the ribbon
            if (sparkCount > 0) {
                const ribbonLen = glowling.size * (5 * trailMul);
                for (let s = 0; s < sparkCount; s++) {
                    const rt = Math.random();
                    const dist = ribbonLen * (0.1 + 0.7 * rt);
                    const jitter = glowling.size * 0.6 * (Math.random() - 0.5);
                    const sx = screenPos.x - nx * dist + (-ny) * jitter;
                    const sy = screenPos.y - ny * dist + (nx) * jitter;
                    this.ctx.save();
                    this.ctx.fillStyle = this.hexToRgba(Math.random() < 0.5 ? c0 : c1, 0.75);
                    this.ctx.beginPath();
                    this.ctx.arc(sx, sy, Math.max(1.5, glowling.size * 0.16), 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }
        }
        
        // Draw main shape (player uses shop-like styling)
        if (glowling === this.player) {
            const fillColor = this.hexToRgba(glowling.color, 0.27);
            this.ctx.fillStyle = fillColor;
            this.ctx.strokeStyle = glowling.color;
            this.ctx.lineWidth = 3;
            // subtle glow similar to shop filter
            try {
                this.ctx.shadowColor = this.hexToRgba(glowling.color, 0.45);
                this.ctx.shadowBlur = 8;
            } catch(_) {}
        } else {
            this.ctx.fillStyle = glowling.color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
        }
        // Player: draw with rarity transforms; Others: original path
        if (glowling === this.player) {
            // fetch selected skin rarity
            let rarity = 'common';
            try { const raw = localStorage.getItem('glowlings_selected_skin'); if (raw) { const sel = JSON.parse(raw); if (sel && sel.rarity) rarity = String(sel.rarity); } } catch(_) {}
            const now = Date.now();
            // transform around center
            this.ctx.save();
            this.ctx.translate(screenPos.x, screenPos.y);
            // uncommon: gentle pulsating scale
            if (rarity === 'uncommon') {
                const k = 1 + 0.06 * Math.sin(now * 0.0028);
                this.ctx.scale(k, k);
            }
            // rare: slow rotation
            if (rarity === 'rare') {
                const ang = (now * 0.0008) % (Math.PI * 2);
                this.ctx.rotate(ang);
            }
            // draw main shape at origin
            this.ctx.beginPath();
            switch (glowling.shape) {
                case 'circle':
                    this.ctx.arc(0, 0, glowling.size, 0, Math.PI * 2);
                    break;
                case 'triangle': {
                    const height = glowling.size * Math.sqrt(3);
                    this.ctx.moveTo(0, -height * 0.6);
                    this.ctx.lineTo(-glowling.size, height * 0.4);
                    this.ctx.lineTo(glowling.size, height * 0.4);
                    this.ctx.closePath();
                    break; }
                case 'star': {
                    const spikes = 5;
                    const outer = glowling.size;
                    const inner = outer * 0.5;
                    for (let k = 0; k < spikes * 2; k++) {
                        const ang = (k * Math.PI) / spikes;
                        const rad = k % 2 === 0 ? outer : inner;
                        const x = Math.cos(ang) * rad;
                        const y = Math.sin(ang) * rad;
                        if (k === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
                    }
                    this.ctx.closePath();
                    break; }
                default:
                    this.ctx.arc(0, 0, glowling.size, 0, Math.PI * 2);
            }
            this.ctx.fill();
            this.ctx.stroke();
            // extra overlays for epic/legendary
            try {
                if (rarity === 'epic' || rarity === 'legendary') {
                    // orbiting dots
                    const orbColor = glowling.color;
                    const r1 = glowling.size * 1.2;
                    const r2 = glowling.size * 1.6;
                    const a = now * 0.002; // base speed
                    this.ctx.save();
                    this.ctx.fillStyle = this.hexToRgba(orbColor, 0.9);
                    // two opposite small orbs
                    this.ctx.beginPath();
                    this.ctx.arc(Math.cos(a) * r1, Math.sin(a) * r1, Math.max(2, glowling.size * 0.18), 0, Math.PI * 2);
                    this.ctx.arc(Math.cos(a + Math.PI) * r2, Math.sin(a + Math.PI) * r2, Math.max(2, glowling.size * 0.16), 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
                if (rarity === 'legendary') {
                    // dashed outer ring with slow dash offset effect
                    this.ctx.save();
                    this.ctx.setLineDash && this.ctx.setLineDash([6, 4]);
                    this.ctx.lineDashOffset = (now * -0.02) % 20;
                    this.ctx.strokeStyle = glowling.color;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, glowling.size * 1.8, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.setLineDash && this.ctx.setLineDash([]);
                    this.ctx.restore();
                }
            } catch(_) {}
            // reset shadow and restore transform
            try { this.ctx.shadowBlur = 0; this.ctx.shadowColor = 'transparent'; } catch(_) {}
            this.ctx.restore();
        } else {
            this.ctx.beginPath();
            switch (glowling.shape) {
                case 'circle':
                    this.ctx.arc(screenPos.x, screenPos.y, glowling.size, 0, Math.PI * 2);
                    break;
                case 'triangle':
                    this.drawTriangle(screenPos, glowling.size);
                    break;
                case 'star':
                    this.drawStar(screenPos, glowling.size);
                    break;
            }
            this.ctx.fill();
            this.ctx.stroke();
            // reset shadow to avoid leaking into subsequent draws
            try { this.ctx.shadowBlur = 0; this.ctx.shadowColor = 'transparent'; } catch(_) {}
        }

        // Fire ability visual ring
        if (glowling.abilityActive && glowling.element === 'fire') {
            const maxR = glowling.size * 4;
            const pulse = (Math.sin(Date.now() * 0.02) + 1) * 0.5; // 0..1
            const r = glowling.size * 2 + pulse * (maxR - glowling.size * 2);
            const ringGradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, Math.max(0, r - 12),
                screenPos.x, screenPos.y, r
            );
            ringGradient.addColorStop(0, 'rgba(255, 68, 68, 0.0)');
            ringGradient.addColorStop(1, 'rgba(255, 68, 68, 0.55)');
            this.ctx.fillStyle = ringGradient;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, r, 0, Math.PI * 2);
            this.ctx.fill();
            // outline to guarantee visibility
            this.ctx.strokeStyle = 'rgba(255, 120, 120, 0.7)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Draw water zone if active (strong visibility with outline)
        if (glowling.waterZone) {
            const zoneScreenPos = this.worldToScreen(glowling.waterZone.pos);
            const zoneGradient = this.ctx.createRadialGradient(
                zoneScreenPos.x, zoneScreenPos.y, 0,
                zoneScreenPos.x, zoneScreenPos.y, glowling.waterZone.radius
            );
            zoneGradient.addColorStop(0, 'rgba(68, 68, 255, 0.45)');
            zoneGradient.addColorStop(1, 'rgba(68, 68, 255, 0.0)');
            
            this.ctx.fillStyle = zoneGradient;
            this.ctx.beginPath();
            this.ctx.arc(zoneScreenPos.x, zoneScreenPos.y, glowling.waterZone.radius, 0, Math.PI * 2);
            this.ctx.fill();
            // outline
            this.ctx.strokeStyle = 'rgba(120, 120, 255, 0.85)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(zoneScreenPos.x, zoneScreenPos.y, glowling.waterZone.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            // debug cross at center to verify visibility/position
            this.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(zoneScreenPos.x - 6, zoneScreenPos.y);
            this.ctx.lineTo(zoneScreenPos.x + 6, zoneScreenPos.y);
            this.ctx.moveTo(zoneScreenPos.x, zoneScreenPos.y - 6);
            this.ctx.lineTo(zoneScreenPos.x, zoneScreenPos.y + 6);
            this.ctx.stroke();
        }

        // Health bar for entities with HP (player uses screenPos)
        if (glowling.maxHP) {
            this.renderHealthBar(screenPos.x, screenPos.y - glowling.size - 16, 50, 6, glowling.hp, glowling.maxHP);
        }

        // Enhanced combo display: gradient text + shadow + pop + timeout ring
        try {
            const comboVal = (
                (glowling && (glowling.comboCount ?? glowling.combo)) ??
                (this.comboCount)
            );
            const combo = Number.isFinite(comboVal) ? comboVal : 0;
            if (glowling === this.player) {
                const now = Date.now();
                const expireAt = this.player.comboExpireAt || 0;
                const winMs = this.comboWindowMs || 3000;
                const remaining = Math.max(0, expireAt - now);
                const t = Math.min(1, Math.max(0, remaining / winMs)); // 1..0

                // Pop animation on increment (200ms ease-out)
                const incAt = this.player.comboLastIncAt || 0;
                const sinceInc = now - incAt;
                const pop = Math.max(0, 1 - sinceInc / 200);
                const popScale = 1 + 0.25 * pop; // up to +25%

                this.ctx.save();
                this.ctx.translate(screenPos.x, screenPos.y);
                this.ctx.scale(popScale, popScale);

                // Timeout ring (only if combo > 0 and there is time left)
                if (combo > 0 && remaining > 0) {
                    const rOuter = glowling.size + 12;
                    this.ctx.lineWidth = 4;
                    this.ctx.strokeStyle = 'rgba(255,255,255,0.18)';
                    // Background ring
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
                    this.ctx.stroke();
                    // Foreground progress arc (hue shifts with t)
                    const start = -Math.PI / 2;
                    const end = start + Math.PI * 2 * t;
                    const grad = this.ctx.createLinearGradient(-rOuter, 0, rOuter, 0);
                    grad.addColorStop(0, '#4ade80'); // green
                    grad.addColorStop(1, '#fbbf24'); // amber
                    this.ctx.strokeStyle = grad;
                    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
                    this.ctx.shadowBlur = 8;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, rOuter, start, end, false);
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                }

                // Gradient combo text with shadow
                const fontSize = Math.max(12, Math.floor(glowling.size * 1.1));
                this.ctx.font = `900 ${fontSize}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const text = String(combo);

                // Text gradient (vertical)
                const tg = this.ctx.createLinearGradient(0, -fontSize * 0.6, 0, fontSize * 0.8);
                tg.addColorStop(0, '#ffffff');
                tg.addColorStop(1, '#a7f3d0');

                // Shadow
                this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
                this.ctx.shadowBlur = 6;
                this.ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.12));
                this.ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                this.ctx.fillStyle = tg;
                this.ctx.strokeText(text, 0, 0);
                this.ctx.fillText(text, 0, 0);

                this.ctx.restore();
            }
        } catch (_) { }

        this.ctx.restore();
    }
    
    drawTriangle(pos, size) {
        const height = size * Math.sqrt(3);
        this.ctx.moveTo(pos.x, pos.y - height * 0.6);
        this.ctx.lineTo(pos.x - size, pos.y + height * 0.4);
        this.ctx.lineTo(pos.x + size, pos.y + height * 0.4);
        this.ctx.closePath();
    }
    
    drawStar(pos, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;
        
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = pos.x + Math.cos(angle) * radius;
            const y = pos.y + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const screenPos = new Vector2(
                particle.pos.x - this.camera.x,
                particle.pos.y - this.camera.y
            );
            const lifeAlpha = (typeof particle.life === 'number') ? (particle.life / 1000) : 0.8;
            const alpha = Math.max(0, Math.min(1, lifeAlpha));
            
            // Handle damage number particles
            if (particle.isDamageNumber && particle.text) {
                this.ctx.save();
                this.ctx.font = `bold ${particle.size || 6}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                this.ctx.strokeStyle = '#000000' + Math.floor(alpha * 128).toString(16).padStart(2, '0');
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(particle.text, screenPos.x, screenPos.y);
                this.ctx.fillText(particle.text, screenPos.x, screenPos.y);
                this.ctx.restore();
            } else {
                // Regular particles
                this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                this.ctx.beginPath();
                this.ctx.arc(screenPos.x, screenPos.y, particle.size || 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    // Update transient particles (dash sparks, small embers, etc.)
    updateParticles(dt) {
        if (!Array.isArray(this.particles) || this.particles.length === 0) return;
        const keep = [];
        for (const p of this.particles) {
            // Move
            try {
                if (p.velocity && typeof p.velocity.x === 'number' && typeof p.velocity.y === 'number') {
                    p.pos.plusEq(p.velocity.multiplyNew(dt / 1000));
                }
            } catch {}
            // Life decay (only for particles with explicit life)
            if (typeof p.life !== 'number') p.life = 600; // default lifetime for legacy particles
            p.life -= dt;
            if (p.life <= 0) continue; // cull
            keep.push(p);
        }
        this.particles = keep;
    }
    
    worldToScreen(worldPos) {
        return new Vector2(
            worldPos.x - this.camera.x,
            worldPos.y - this.camera.y
        );
    }
    
    // Convert #rrggbb to rgba(r,g,b,a) string
    hexToRgba(hex, alpha) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!m) return `rgba(255,255,255,${alpha})`;
        const r = parseInt(m[1], 16);
        const g = parseInt(m[2], 16);
        const b = parseInt(m[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    getRandomNeonColor() {
        const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ff4444', '#ffff00', '#ff8800'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Rough estimate of player power to scale difficulty
    getPlayerPower() {
        const dmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
        const fr = Math.max(120, this.weaponFireRate || 600); // ms per shot
        const dps = dmg * (1000 / fr);
        let extras = 0;
        if (this.player) {
            extras += (this.player.auraDps || 0) * 2;
            extras += (this.player.maxHP || 60) / 50;
        }
        if (Array.isArray(this.playerTurrets)) extras += this.playerTurrets.length * 10;
        if (this.electroGen) extras += 12; // small bonus for auto-zap
        if (this.gravityOrb) extras += 8;  // small bonus for CC
        return Math.max(1, Math.round(dps + extras));
    }

    // Wave-scaled shop cost multiplier (increase cost as waves go up)
    getShopCostMultiplier() {
        const w = Math.max(1, this.waveNumber || 1);
        // +8% per wave, capped
        const mult = 1 + (w - 1) * 0.08;
        return Math.min(3.5, mult);
    }

    getScaledCost(baseCost) {
        const m = this.getShopCostMultiplier();
        return Math.max(0, Math.round((baseCost || 0) * m));
    }

    // Boss wave helper
    isBossWaveNumber(w) {
        return w === 5 || w === 10 || w === 15 || w === 20;
    }

    // Setup shop UI event handlers (safe-guarded if elements missing)
    setupShopUI() {
        const overlay = document.getElementById('shopOverlay');
        const startBtn = document.getElementById('startWaveBtn');
        const rerollBtn = document.getElementById('rerollBtn');
        const lockBtn = document.getElementById('lockBtn');
        if (startBtn) startBtn.onclick = () => this.startNextWave();
        if (rerollBtn) {
            rerollBtn.onclick = () => this.rerollShop();
            rerollBtn.textContent = `${this.t('rerollBtn')} (${this.rerollCost})`;
        }
        if (lockBtn) lockBtn.onclick = () => { this.shopLocked = !this.shopLocked; lockBtn.textContent = this.shopLocked ? this.t('unlockBtn') : this.t('lockBtn'); };
        if (overlay) overlay.style.display = 'none';
        this.refreshShopItems && this.refreshShopItems();
    }

    // Position the bottom consumable bar under the visible shop box
    attachConsumableBarUnderShop() {
        try {
            const bar = document.getElementById('consumableBar');
            const shop = document.getElementById('shopOverlay');
            if (!bar || !shop) return;
            const box = shop.querySelector('.shop-box');
            if (!box) return;
            const isShopVisible = () => {
                try{
                    const style = window.getComputedStyle(shop);
                    const visible = style && style.display !== 'none' && style.visibility !== 'hidden' && box.offsetParent !== null;
                    const hasClass = !!(document && document.body && document.body.classList && document.body.classList.contains('shop-open'));
                    return visible && hasClass;
                }catch(_){ return false; }
            };
            const place = () => {
                if (!isShopVisible()) return;
                const rect = box.getBoundingClientRect();
                const bh = bar.offsetHeight || 0;
                let top = rect.bottom + 12;
                // Clamp into viewport with small margins
                top = Math.min(window.innerHeight - bh - 8, Math.max(8, top));
                bar.classList.add('attached-to-shop');
                bar.style.position = 'fixed';
                bar.style.top = `${Math.round(top)}px`;
                bar.style.bottom = 'auto';
                // Center under shop using CSS (preserve existing scale from stylesheet)
                bar.style.left = '50%';
                bar.style.transform = '';
                bar.style.zIndex = '10020';
            };
            // Initial placement and on next frame (in case layout animates)
            place();
            this._repositionBarFn = () => {
                if (!isShopVisible()) {
                    try { this.detachConsumableBarFromShop && this.detachConsumableBarFromShop(); } catch(_) {}
                    return;
                }
                place();
            };
            window.addEventListener('resize', this._repositionBarFn, { passive: true });
        } catch(_) { }
    }

    // Restore the consumable bar to its default centered bottom position
    detachConsumableBarFromShop() {
        try {
            const bar = document.getElementById('consumableBar');
            if (!bar) return;
            bar.classList.remove('attached-to-shop');
            bar.style.top = '';
            bar.style.bottom = '';
            bar.style.left = '';
            bar.style.transform = 'translateX(-50%)';
            bar.style.zIndex = '';
            // Clear any width lock injected by HTML logic
            try { bar.__widthLocked = false; } catch(_) {}
            bar.style.width = '';
            if (this._repositionBarFn) {
                window.removeEventListener('resize', this._repositionBarFn);
                this._repositionBarFn = null;
            }
        } catch(_) { }
    }

    // Wave 3 -> Weapon selection overlay control
    showWeaponOverlay() {
        const wOverlay = document.getElementById('weaponOverlay');
        const container = document.getElementById('weaponItems');
        if (!wOverlay || !container) return;
        // Do not re-render if already open (prevents wiping click handlers)
        if (this._weaponOverlayOpen) {
            wOverlay.style.display = 'block';
            return;
        }
        this._weaponOverlayOpen = true;
        // Render offers
        container.innerHTML = '';
        // Toast once
        if (!this._weaponsToastShown) {
            this._weaponsToastShown = true;
            this.showToast && this.showToast('Silahlar açıldı');
        }
        const makeOffer = (title, desc, applyFn) => {
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.style.cursor = 'pointer';
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', title);
            const nameEl = document.createElement('div');
            nameEl.className = 'shop-name';
            nameEl.textContent = title;
            const descEl = document.createElement('div');
            descEl.className = 'shop-desc';
            descEl.textContent = desc;
            const costEl = document.createElement('div');
            costEl.className = 'shop-cost';
            costEl.textContent = 'Maliyet: 0';
            item.onclick = () => {
                applyFn();
                this._wave4WeaponChosen = true;
                // Close weapon overlay and open shop
                this.hideWeaponOverlay();
                // Ensure shop shows now
                const shop = document.getElementById('shopOverlay');
                if (shop) shop.style.display = 'block';
                try { if (document && document.body && document.body.classList) document.body.classList.add('shop-open'); } catch(_){}
                try { this.attachConsumableBarUnderShop && this.attachConsumableBarUnderShop(); } catch(_) {}
                this.updateShopCounters && this.updateShopCounters();
                this.refreshShopItems && this.refreshShopItems();
                this.playPurchase && this.playPurchase(true);
            };
            item.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            };
            item.tabIndex = 0;
            item.appendChild(nameEl);
            item.appendChild(descEl);
            item.appendChild(costEl);
            container.appendChild(item);
        };
        // 1) Turrets
        makeOffer('🔫 Taretler', 'Oyuncunun yanında iki taret dolaşır ve otomatik ateş eder. Orta menzil, dengeli hasar.', () => {
            this.playerTurrets = [
                { offset: new Vector2(36, 0), cooldown: 0, fireDelay: Math.max(150, Math.floor((this.weaponFireRate || 700) * 1.8)), range: 520, aimDir: new Vector2(1,0) },
                { offset: new Vector2(-36, 0), cooldown: 0, fireDelay: Math.max(150, Math.floor((this.weaponFireRate || 700) * 1.8)), range: 520, aimDir: new Vector2(1,0) },
            ];
            this.chosenWeapon = 'turrets';
            try{ if (typeof window!=='undefined' && window.game) window.game.chosenWeapon = 'turrets'; }catch(_){ }
        });
        // 2) Electro generator
        makeOffer('⚡ Elektro Şok Jeneratörü', 'Karakterin etrafında iki elektrik küresi döner. Her 1.5 sn’de en yakındaki hedefe zincirli yıldırım atar, kısa sersemletir.', () => {
            this.electroGen = {
                orbitR: 48,
                angVel: 2.6,
                fireDelay: 1500,
                chain: 2, dmgMult: 0.6, stunMs: 150, range: 520,
                nodes: [
                    { angle: 0, cooldown: 0 },
                    { angle: Math.PI, cooldown: 750 }
                ]
            };
            this.chosenWeapon = 'electro';
            try{ if (typeof window!=='undefined' && window.game) window.game.chosenWeapon = 'electro'; }catch(_){ }
        });
        // 3) Gravity orb (reworked v2: çekim + içte DOT + parçacık saçılımı)
        makeOffer('🌀 Yerçekimi Küresi', '2.6 sn’de bir 0.65 sn boyunca çekim (240px). İç halkada küçük DOT uygular; bitişte patlayıp 6 parça en yakın düşmanlara fırlar ve yavaşlatır.', () => {
            this.gravityOrb = {
                offset: new Vector2(30, -12), cooldown: 0, period: 2600,
                active: false, activeMs: 0, duration: 650, radius: 240,
                slowMs: 1200, slowMult: 0.65, dmgMult: 1.0,
                // rework params
                pullAccel: 900,        // px/s^2 base acceleration at center
                maxPullSpeed: 300,     // px/s cap added by pull
                bossPullScale: 0.35,   // bosses resist pull
                // DOT + shrapnel
                innerRadius: 120,
                dotTickMs: 120,
                dotDmgMul: 0.15,       // per tick vs base
                shrapnelCount: 6,
                shrapnelSpeed: 520,
                shrapnelDmgMul: 0.6
            };
            this.chosenWeapon = 'gravity';
            try{ if (typeof window!=='undefined' && window.game) window.game.chosenWeapon = 'gravity'; }catch(_){ }
        });
        wOverlay.style.display = 'block';
    }

    hideWeaponOverlay() {
        const wOverlay = document.getElementById('weaponOverlay');
        if (wOverlay) wOverlay.style.display = 'none';
        this._weaponOverlayOpen = false;
    }

    // (skill selection overlay removed)

    // Core Brotato update loop
    updateBrotato(dt) {
        // During intermission, show shop, hide enemies spawning
        if (!this.inWave) {
            // Intermission: show shop, freeze player movement, but allow UI updates and pickups logic
            this.intermissionTimer -= dt;
            // Reset countdown tracker while not in wave
            this.lastCountdownSecond = null;
            this.updateShopCounters();
            // Wave 3 gate: show weapon selection first, hide shop until chosen
            const weaponGate = (this.waveNumber === 3) && !this._wave4WeaponChosen;
            const overlay = document.getElementById('shopOverlay');
            if (weaponGate) {
                if (overlay) overlay.style.display = 'none';
                try { if (document && document.body && document.body.classList) document.body.classList.remove('shop-open'); } catch(_){}
                try { this.detachConsumableBarFromShop && this.detachConsumableBarFromShop(); } catch(_) {}
                this.showWeaponOverlay && this.showWeaponOverlay();
                return;
            }
            this.hideWeaponOverlay && this.hideWeaponOverlay();
            if (overlay) overlay.style.display = 'block';
            try { if (document && document.body && document.body.classList) document.body.classList.add('shop-open'); } catch(_){ }
            try { this.attachConsumableBarUnderShop && this.attachConsumableBarUnderShop(); } catch(_){ }
            if (this.player) this.shopFreezePos = new Vector2(this.player.pos.x, this.player.pos.y);
            // Enforce freeze immediately
            if (this.inShop && this.player && this.shopFreezePos) {
                this.player.pos.x = this.shopFreezePos.x;
                this.player.pos.y = this.shopFreezePos.y;
                this.player.velocity = new Vector2(0, 0);
            }
            this.updateDrops(dt);
            this.checkCollisions();
            this.updateCamera();
            this.updateLeaderboard();
            this.updateUI();
            return;
        }
        // Apply ability effects first so movement this frame reflects slow & burn
        this.updateWaterRings(dt);
        this.updateFireBeams(dt);
        this.updateBurningEffects(dt);
        // Update AI enemies and spawn
        this.spawnEnemiesDuringWave(dt);
        // Boss logic (classic mode)
        if (this.inWave && this.waveNumber === 5) this.updateBoss5(dt);
        if (this.inWave && this.waveNumber === 10) this.updateBoss10(dt);
        if (this.inWave && this.waveNumber === 15) this.updateBoss15(dt);
        this.aiBots.forEach(b => b.update(this, dt));
        // Prevent bots from overlapping visually: apply simple separation
        this.resolveBotOverlaps(dt);
        // Update player turrets
        this.updatePlayerTurrets && this.updatePlayerTurrets(dt);
        // Update special weapons (if chosen)
        this.updateElectroGen && this.updateElectroGen(dt);
        this.updateGravityOrb && this.updateGravityOrb(dt);
        // Update neutral towers (passive hazards)
        (this.towers || []).forEach(t => t.update(this, dt));

        // Auto-attack
        this.doAutoAttack(dt);

        // Update projectiles, then resolve hits, then cull hit/expired
        this.projectiles.forEach(p => p.update(dt));
        this.handleProjectileHits();
        this.projectiles = this.projectiles.filter(p => !p.hit && p.life > 0);
        // Update transient particles (e.g., dash sparks)
        this.updateParticles && this.updateParticles(dt);
        // Drops update/pickup
        this.updateDrops(dt);
        // Collect orbs
        this.checkCollisions();

        // Timers and UI
        this.waveTimer -= dt;
        this.updateWaveTimerUI();
        // Determine boss alive state for boss waves (5, 10, 15, 20)
        const boss5Alive = (this.waveNumber === 5) && (this.aiBots || []).some(b => b.isBoss && b.bossWave === 5);
        const boss10Alive = (this.waveNumber === 10) && (this.aiBots || []).some(b => b.isBoss && b.bossWave === 10);
        const boss15Alive = (this.waveNumber === 15) && (this.aiBots || []).some(b => b.isBoss && b.bossWave === 15);
        const boss20Alive = (this.waveNumber === 20) && (this.aiBots || []).some(b => b.isBoss);
        const isBossWave = (this.waveNumber === 5) || (this.waveNumber === 10) || (this.waveNumber === 15) || (this.waveNumber === 20);
        const bossAlive = boss5Alive || boss10Alive || boss15Alive || boss20Alive;
        // If boss wave: do not end by timer while boss alive. If boss dies, end immediately.
        if (isBossWave) {
            if (!bossAlive && this.inWave) {
                this.endWaveToShop();
            } else if (this.waveTimer <= 0) {
                // Keep wave running until boss is defeated
                this.waveTimer = 1000; // keep UI sensible; prevents runaway negatives
            }
        } else {
            if (this.waveTimer <= 0) {
                this.endWaveToShop();
            }
        }
        // Brotato last 10s countdown beep (disabled during boss waves)
        const isBossWaveForBeep = this.inWave && (this.waveNumber === 5 || this.waveNumber === 10 || this.waveNumber === 15 || this.waveNumber === 20);
        if (this.inWave && !isBossWaveForBeep) {
            const t = Math.max(0, this.waveTimer);
            if (t <= 10000) {
                const sec = Math.ceil(t / 1000);
                if (sec !== this.lastCountdownSecond) {
                    this.lastCountdownSecond = sec;
                    this.playCountdownTick();
                }
            } else {
                this.lastCountdownSecond = null;
            }
        }

        this.updateCamera();
        this.updateLeaderboard();
        this.updateUI();
        
        // Restore context if screen shake was applied
        if (this.screenShakeUntil && Date.now() < this.screenShakeUntil) {
            this.ctx.restore();
        }
    }

    // Dev helper: jump directly to a specific wave
    jumpToWave(to) {
        const n = Math.max(1, to|0);
        this.inWave = false;
        this.intermissionTimer = 0;
        this.aiBots = [];
        this.projectiles = [];
        this.waveNumber = n - 1;
        if (typeof this.startNextWave === 'function') this.startNextWave();
        if (typeof this.updateWaveTimerUI === 'function') this.updateWaveTimerUI();
    }

    startNextWave() {
        this.inWave = true;
        // Apply selected character bonuses once at the beginning of the run
        try {
            if (!this._characterApplied) {
                const sc = this && this.selectedCharacter;
                const def = this && this.characterDefs ? this.characterDefs[sc] : null;
                if (def && typeof def.apply === 'function') {
                    def.apply(this);
                    this._characterApplied = true;
                }
            }
        } catch (_) { }
        // Leaving shop: clear freeze state
        this.inShop = false;
        this.shopFreezePos = null;
        // Ensure weapon overlay is closed when starting a wave
        this.hideWeaponOverlay && this.hideWeaponOverlay();
        this.waveNumber = (this.waveNumber || 0) + 1;
        // Reset weapon-purchase allowance every 6-wave block (1,7,13,19)
        try {
            const wn = this.waveNumber|0;
            if (wn === 1 || wn === 7 || wn === 13 || wn === 19) {
                // Default allowance per 6-wave block
                this.weaponBlockAllowance = 1;
            }
        } catch(_) {}
        // Mark run start when Wave 1 begins
        if (this.waveNumber === 1 && !this.currentRun) {
            this.recordRunStart && this.recordRunStart();
        }
        if (this.waveNumber === 3 && !this.wave3MagnetGranted) {
            this.wave3MagnetGranted = true;
            try {
                const ev = new CustomEvent('inventory:consumable:add', { detail: { id: 'magnet_core', icon: '🧲', name: 'Mıknatıs', cost: 0 } });
                window.dispatchEvent(ev);
            } catch(_) { }
        }
        if (this.waveNumber === 5 && (this.magnetConsumablesGiven|0) === 0) {
            this.forceMagnetDrop = true;
        }
        // Onboarding tips for Waves 1–3
        try {
            if (this.waveNumber === 1) {
                this.showTopTip && this.showTopTip('WASD: Hareket • Fare: Nişan • Space: Kaçış • Shift: Yetenek');
            } else if (this.waveNumber === 2) {
                this.showTopTip && this.showTopTip('Uzak atışlara dikkat! Strafing ile mermilerden kaç.');
            } else if (this.waveNumber === 3) {
                this.showTopTip && this.showTopTip('Yeni davranışlar: Pozisyon al, kalabalıklardan uzak dur.');
            }
        } catch(_) {}
        // Initialize per-wave composition counters from plan
        this.initWaveCompositionFor && this.initWaveCompositionFor(this.waveNumber);
        // If this is a boss wave, show a flashy banner
        if (this.isBossWaveNumber && this.isBossWaveNumber(this.waveNumber)) {
            this.showBossBanner && this.showBossBanner(this.waveNumber);
        }
        // Achievement: Reach Wave 10
        try { if (this.waveNumber === 10) this.unlockAchievement && this.unlockAchievement('wave10', 'Reach Wave 10'); } catch(_) {}
        // Wave 4 toast now shown when the special shop opens (after Wave 3)
        // Clear all carry-over enemies from previous wave
        this.aiBots = [];
        // Wave-specific spawn interval and boss flag
        this.bossSpawned = false;
        const wv = this.waveNumber;
        if (wv <= 3) this.spawnInterval = 0.8;
        else if (wv <= 6) this.spawnInterval = 0.7;
        else if (wv <= 10) this.spawnInterval = 0.6;
        else if (wv <= 15) this.spawnInterval = 0.5;
        else if (wv <= 19) this.spawnInterval = 0.3 + Math.random() * 0.1; // 0.3–0.4s
        else this.spawnInterval = 0.45; // after 20, fallback
        this.spawnPerSecond = Math.min(12, 1 / Math.max(0.2, this.spawnInterval));
        this.spawnAccumulator = 0;
        // Decide concurrent enemy cap for this wave, scaled by player power and clamped
        {
            const w = this.waveNumber;
            // Base grows with wave (gentle)
            const base = (w < 4) ? this.randInt(6, 10)
                        : (w < 14) ? this.randInt(18, 28)
                        : this.randInt(28, 40);
            const power = this.getPlayerPower();
            // Scale: power ~50 => x1.8, power ~20 => x1.2, minimum x0.9
            const scale = Math.max(0.9, Math.min(1.8, 0.6 + power / 50));
            let desired = Math.round(base * scale);
            // Consider existing carry-over enemies so we don't spike (never below current alive)
            desired = Math.max(desired, this.aiBots.length);
            // Clamp to gameplay cap and performance cap
            desired = Math.min(desired, this.globalMaxBots, this.maxEnemies);
            // For Waves 1–3 keep cap softer
            if (w <= 3) desired = Math.min(desired, 10);
            this.desiredEnemyCap = Math.max(6, desired);
            // Spawn rate per second scaled by power (smooth spawning)
            this.spawnPerSecond = Math.min(10, 1.5 + power / 30);
            this.spawnAccumulator = 0;
        }
        // Set wave duration and reset per-wave budget
        this.waveTimer = this.getWaveDuration ? this.getWaveDuration(this.waveNumber) : 45000;
        this.budgetRemaining = this.getThreatBudget ? this.getThreatBudget(this.waveNumber) : 0;
        // Clear stray projectiles so old bullets don't carry over
        this.projectiles = [];
        this.updateWaveTimerUI();
        // Hide shop
        const shop = document.getElementById('shopOverlay');
        if (shop) shop.style.display = 'none';
        try { if (document && document.body && document.body.classList) document.body.classList.remove('shop-open'); } catch(_){}
        try { this.detachConsumableBarFromShop && this.detachConsumableBarFromShop(); } catch(_) {}
        // SFX
        this.playWaveStart();
        // Shrink play zone slightly each wave (kept centered)
        if (this.playZone) {
            const factor = this.playZoneShrinkFactor || 1;
            const newW = Math.max(this.playZoneMinSize.width, Math.floor(this.playZone.width * factor));
            const newH = Math.max(this.playZoneMinSize.height, Math.floor(this.playZone.height * factor));
            const cx = this.playZone.x + this.playZone.width / 2;
            const cy = this.playZone.y + this.playZone.height / 2;
            this.playZone.width = newW;
            this.playZone.height = newH;
            this.playZone.x = Math.max(0, Math.floor(cx - newW / 2));
            this.playZone.y = Math.max(0, Math.floor(cy - newH / 2));
            // Ensure zone stays within world
            this.playZone.x = Math.min(this.playZone.x, this.worldSize.width - this.playZone.width);
            this.playZone.y = Math.min(this.playZone.y, this.worldSize.height - this.playZone.height);
            // Clamp existing entities into the new zone
            const clampEnt = (ent, radius) => {
                if (!ent) return;
                const r = radius || ent.size || 12;
                ent.pos.x = Math.max(this.playZone.x + r, Math.min(this.playZone.x + this.playZone.width - r, ent.pos.x));
                ent.pos.y = Math.max(this.playZone.y + r, Math.min(this.playZone.y + this.playZone.height - r, ent.pos.y));
            };
            clampEnt(this.player);
            for (const b of this.aiBots) clampEnt(b);
            for (const t of this.towers) clampEnt(t, 16);
            // After shrink, bots may end up hugging walls; on wave>=6, apply a brief inward lock
            if (!this.disableCenterFocus && this.waveNumber >= 6) {
                const cx = this.playZone.x + this.playZone.width * 0.5;
                const cy = this.playZone.y + this.playZone.height * 0.5;
                for (const b of this.aiBots) {
                    try {
                        const toC = new Vector2(cx - b.pos.x, cy - b.pos.y).normalise();
                        b.targetDir = toC;
                        b._inwardCenter = new Vector2(cx, cy);
                        b._forceInwardUntil = Date.now() + 1000;
                    } catch {}
                }
            }
        }
    }

    endWaveToShop() {
        this.inWave = false;
        // First upgrade timing optimization: 10% faster for first wave only
        const isFirstWave = this.waveNumber === 0;
        this.intermissionTimer = isFirstWave ? 9000 : 10000; // 9s instead of 10s for first wave
        // Reset per-intermission purchase allowance
        this.purchaseUsedForWave = false;
        // Optionally reduce remaining enemies
        // Trim carry-over to avoid ineffective crowds
        if (Array.isArray(this.aiBots) && this.aiBots.length > this.carryOverLimit) {
            const p = this.player;
            // Sort by distance to player, keep closest few for tension
            const withDist = this.aiBots.map(b => ({ b, d: p ? p.pos.minusNew(b.pos).magnitude() : 0 }));
            withDist.sort((a, b) => a.d - b.d);
            const keep = withDist.slice(0, this.carryOverLimit).map(x => x.b);
            const removed = withDist.slice(this.carryOverLimit).map(x => x.b);
            // Optionally convert removed to small materials to reward progress
            const dropAt = (pos) => {
                this.drops.push({ pos: pos.clone(), type: 'mat', amount: 1, vel: new Vector2((Math.random()-0.5)*60, (Math.random()-0.5)*60) });
            };
            removed.forEach(r => dropAt(r.pos));
            this.aiBots = keep;
        }
        // Auto-collect all pending XP drops on shop open and clear XP visuals
        if (this.drops && this.drops.length) {
            let gainedXP = 0;
            const keep = [];
            for (const dr of this.drops) {
                if (dr.type === 'xp') gainedXP += (dr.amount || 1); else keep.push(dr);
            }
            if (gainedXP > 0) {
                this.xp += gainedXP;
                this.playPickupXP && this.playPickupXP();
            }
            this.drops = keep;
        }
        this.updateShopCounters();
        if (!this.shopLocked && this.refreshShopItems) this.refreshShopItems();
        // If next wave is a boss wave, show a pre-boss banner during intermission
        const nextW = (this.waveNumber || 0) + 1;
        if (this.isBossWaveNumber && this.isBossWaveNumber(nextW)) {
            this.showPreBossBanner && this.showPreBossBanner(nextW);
        }
        // Play pre-boss Wave 5/10/15/20 intro sequence once during intermission: stinger -> cutscene
        try {
            if (nextW === 5 && !this.boss5CutscenePlayed) {
                this.boss5CutscenePlayed = true;
                const goVideo5 = () => { try { this.playBossCutscene && this.playBossCutscene(5); } catch(_){} };
                this.showBossRoundStinger ? this.showBossRoundStinger(goVideo5) : goVideo5();
            } else if (nextW === 10 && !this.boss10CutscenePlayed) {
                this.boss10CutscenePlayed = true;
                const goVideo10 = () => { try { this.playBossCutscene && this.playBossCutscene(10); } catch(_){} };
                this.showBossRoundStinger ? this.showBossRoundStinger(goVideo10) : goVideo10();
            } else if (nextW === 15 && !this.boss15CutscenePlayed) {
                this.boss15CutscenePlayed = true;
                const goVideo15 = () => { try { this.playBossCutscene && this.playBossCutscene(15); } catch(_){} };
                this.showBossRoundStinger ? this.showBossRoundStinger(goVideo15) : goVideo15();
            } else if (nextW === 20 && !this.boss20CutscenePlayed) {
                this.boss20CutscenePlayed = true;
                const goVideo20 = () => { try { this.playBossCutscene && this.playBossCutscene(20); } catch(_){} };
                this.showBossRoundStinger ? this.showBossRoundStinger(goVideo20) : goVideo20();
            }
        } catch(_) {}
        // After Wave 3, show a brief shop guidance tip
        try { if (nextW === 4) this.showTopTip && this.showTopTip('Shop: Elementine uygun yükseltmeleri burada al. Bir dalgada sınırlı satın alma!'); } catch(_) {}
        // Achievement: Clear first 3 waves
        try { if (nextW === 4) this.unlockAchievement && this.unlockAchievement('shopUnlocked', 'First Shop Unlocked'); } catch(_) {}
        // SFX
        this.playWaveEnd();
    }

    // Resolve language-specific cutscene URL for given boss wave
    resolveBossCutsceneUrl(wave) {
        try {
            const lang = (this && this.lang ? String(this.lang) : 'en').toLowerCase();
            if (wave === 5) {
                // files under video/Boss/level5/
                // tr1.mp4 (Turkish), china1.mp4 (Chinese), jp1.mp4 (Japanese), alman1.mp4 (German), hindu1.mp4 (Hindi), sp1.mp4 (Spanish), br1.mp4 (Portuguese BR), eng1.mp4 (English)
                switch (lang) {
                    case 'en': return 'video/Boss/level5/eng1.mp4';
                    case 'tr': return 'video/Boss/level5/tr1.mp4';
                    case 'zh':
                    case 'zh-cn':
                    case 'zh_cn':
                    case 'zh-hans':
                    case 'zh_hans':
                    case 'zh-hant':
                    case 'zh_hant': return 'video/Boss/level5/china1.mp4';
                    case 'ja': return 'video/Boss/level5/jp1.mp4';
                    case 'de': return 'video/Boss/level5/alman1.mp4';
                    case 'hi': return 'video/Boss/level5/hindu1.mp4';
                    case 'es': return 'video/Boss/level5/sp1.mp4';
                    case 'pt':
                    case 'pt-br':
                    case 'pt_br': return 'video/Boss/level5/br1.mp4';
                    default: return 'video/Boss/level5/tr1.mp4'; // fallback
                }
            } else if (wave === 10) {
                // files under video/Boss/level10/
                // tr2.mp4 (Turkish), china2.mp4 (Chinese), jp2.mp4 (Japanese), alman2.mp4 (German), hindu2.mp4 (Hindi), sp2.mp4 (Spanish), br2.mp4 (Portuguese BR), eng2.mp4 (English)
                switch (lang) {
                    case 'en': return 'video/Boss/level10/eng2.mp4';
                    case 'tr': return 'video/Boss/level10/tr2.mp4';
                    case 'zh':
                    case 'zh-cn':
                    case 'zh_cn':
                    case 'zh-hans':
                    case 'zh_hans':
                    case 'zh-hant':
                    case 'zh_hant': return 'video/Boss/level10/china2.mp4';
                    case 'ja': return 'video/Boss/level10/jp2.mp4';
                    case 'de': return 'video/Boss/level10/alman2.mp4';
                    case 'hi': return 'video/Boss/level10/hindu2.mp4';
                    case 'es': return 'video/Boss/level10/sp2.mp4';
                    case 'pt':
                    case 'pt-br':
                    case 'pt_br': return 'video/Boss/level10/br2.mp4';
                    default: return 'video/Boss/level10/tr2.mp4'; // fallback
                }
            } else if (wave === 15) {
                // files under video/Boss/level15/
                // tr3.mp4 (Turkish), china3.mp4 (Chinese), jp3.mp4 (Japanese), alman3.mp4 (German), hindu3.mp4 (Hindi), sp3.mp4 (Spanish), br3.mp4 (Portuguese BR), eng3.mp4 (English)
                switch (lang) {
                    case 'en': return 'video/Boss/level15/eng3.mp4';
                    case 'tr': return 'video/Boss/level15/tr3.mp4';
                    case 'zh':
                    case 'zh-cn':
                    case 'zh_cn':
                    case 'zh-hans':
                    case 'zh_hans':
                    case 'zh-hant':
                    case 'zh_hant': return 'video/Boss/level15/china3.mp4';
                    case 'ja': return 'video/Boss/level15/jp3.mp4';
                    case 'de': return 'video/Boss/level15/alman3.mp4';
                    case 'hi': return 'video/Boss/level15/hindu3.mp4';
                    case 'es': return 'video/Boss/level15/sp3.mp4';
                    case 'pt':
                    case 'pt-br':
                    case 'pt_br': return 'video/Boss/level15/br3.mp4';
                    default: return 'video/Boss/level15/tr3.mp4'; // fallback
                }
            } else if (wave === 20) {
                // files under video/Boss/level20/
                // china4.mp4 (Chinese), br4.mp4 (Portuguese BR), eng4.mp4 (English), sp4.mp4 (Spanish), tr4.mp4 (Turkish), hindu4.mp4 (Hindi), alman4.mp4 (German), jp4.mp4 (Japanese)
                switch (lang) {
                    case 'en': return 'video/Boss/level20/eng4.mp4';
                    case 'tr': return 'video/Boss/level20/tr4.mp4';
                    case 'zh':
                    case 'zh-cn':
                    case 'zh_cn':
                    case 'zh-hans':
                    case 'zh_hans':
                    case 'zh-hant':
                    case 'zh_hant': return 'video/Boss/level20/china4.mp4';
                    case 'ja': return 'video/Boss/level20/jp4.mp4';
                    case 'de': return 'video/Boss/level20/alman4.mp4';
                    case 'hi': return 'video/Boss/level20/hindu4.mp4';
                    case 'es': return 'video/Boss/level20/sp4.mp4';
                    case 'pt':
                    case 'pt-br':
                    case 'pt_br': return 'video/Boss/level20/br4.mp4';
                    default: return 'video/Boss/level20/tr4.mp4'; // fallback
                }
            }
            return null;
        } catch(_) { return null; }
    }

    // Play boss cutscene using existing cutscene overlay elements
    playBossCutscene(wave) {
        try {
            const cs = document.getElementById('cutsceneOverlay');
            const video = document.getElementById('cutsceneVideo');
            const skip = document.getElementById('cutsceneSkipBtn');
            const url = this.resolveBossCutsceneUrl(wave);
            if (!cs || !video || !url) return;
            // Pause BGM during cutscene
            let bgmWasPlaying = false;
            try { const bgmEl = document.getElementById('bgm'); if (bgmEl) { bgmWasPlaying = !bgmEl.paused; bgmEl.pause(); } } catch {}
            // Prepare overlay
            cs.style.display = 'block';
            cs.style.opacity = '1';
            cs.style.transition = 'opacity 500ms ease';
            video.style.position = 'absolute';
            video.style.inset = '0';
            video.style.width = '100vw';
            video.style.height = '100vh';
            video.style.objectFit = 'contain';
            video.style.background = '#000';
            // Hide game canvas during cutscene
            try { const cvs = document.getElementById('gameCanvas'); if (cvs) cvs.style.visibility = 'hidden'; } catch {}
            // Apply URL and play
            video.src = url;
            video.currentTime = 0;
            video.muted = false;
            const closeWithFade = (next) => {
                try { video.pause(); } catch {}
                video.removeEventListener('ended', onEnd);
                video.removeEventListener('error', onError);
                if (skip) skip.removeEventListener('click', onSkip);
                try { cs.style.opacity = '0'; } catch {}
                setTimeout(() => {
                    try { cs.style.display = 'none'; } catch {}
                    try { const cvs = document.getElementById('gameCanvas'); if (cvs) cvs.style.visibility = 'visible'; } catch {}
                    // Resume BGM if it was playing
                    try {
                        const bgmEl = document.getElementById('bgm');
                        if (bgmEl && bgmWasPlaying && !this.musicMuted) {
                            const p = bgmEl.play(); if (p && typeof p.catch === 'function') p.catch(()=>{});
                        }
                    } catch {}
                    if (typeof next === 'function') next();
                }, 400);
            };
            const onEnd = () => closeWithFade(() => {});
            const onError = () => closeWithFade(() => {});
            const onSkip = () => closeWithFade(() => {});
            video.addEventListener('ended', onEnd);
            video.addEventListener('error', onError);
            if (skip) skip.addEventListener('click', onSkip);
            video.play().catch(()=>{ try { video.muted = true; video.play().catch(onError); } catch { onError(); } });
        } catch(_) {}
    }

    updateWaveTimerUI() {
        const el = document.getElementById('timer');
        if (!el) return;
        // Hide timer during boss waves (5, 10, 15, 20) while inWave
        const isBossWave = this.inWave && (this.waveNumber === 5 || this.waveNumber === 10 || this.waveNumber === 15 || this.waveNumber === 20);
        if (isBossWave) {
            el.style.display = 'none';
            return;
        }
        el.style.display = 'block';
        const sec = Math.max(0, Math.ceil(this.waveTimer / 1000));
        const label = 'Wave';
        el.textContent = `${label} ${this.waveNumber} - ${sec}s`;
    }

    // ---- Minimal Save/Load: Run History (localStorage) ----
    loadRunHistory() {
        try {
            const raw = localStorage.getItem('glowlings_run_history');
            if (!raw) return { best: { wave: 0, score: 0 }, lastRuns: [] };
            const parsed = JSON.parse(raw);
            // Basic shape guard
            if (!parsed || typeof parsed !== 'object') return { best: { wave: 0, score: 0 }, lastRuns: [] };
            parsed.best = parsed.best || { wave: 0, score: 0 };
            parsed.lastRuns = Array.isArray(parsed.lastRuns) ? parsed.lastRuns : [];
            return parsed;
        } catch (_) {
            return { best: { wave: 0, score: 0 }, lastRuns: [] };
        }
    }

    persistRunHistory() {
        try {
            localStorage.setItem('glowlings_run_history', JSON.stringify(this.runHistory || { best: { wave: 0, score: 0 }, lastRuns: [] }));
        } catch (_) { /* ignore quota/security */ }
    }

    recordRunStart() {
        const element = this.player ? this.player.element : (this._pendingElement || '-');
        const name = (this.player && this.player.name) ? this.player.name : 'Elementist';
        this.currentRun = {
            startedAt: Date.now(),
            character: this.selectedCharacter || 'berserker',
            element,
            playerName: name,
        };
        // Clear any stale end flags at the start of a new run
        this._runEnded = false;
        this._runEndRecorded = false;
    }

    recordRunEnd(outcome) {
        // Guard: only record once per run
        if (this._runEndRecorded) return;
        this._runEndRecorded = true;
        const now = Date.now();
        const wave = this.waveNumber || 0;
        const score = this.score || 0;
        const durationMs = (this.currentRun && this.currentRun.startedAt) ? (now - this.currentRun.startedAt) : 0;
        const entry = {
            when: new Date(now).toISOString(),
            wave,
            score,
            durationMs,
            outcome: outcome || 'death',
            character: this.currentRun ? this.currentRun.character : (this.selectedCharacter || 'berserker'),
            element: (this.player && this.player.element) ? this.player.element : (this.currentRun ? this.currentRun.element : '-')
        };
        // Update bests
        if (!this.runHistory) this.runHistory = { best: { wave: 0, score: 0 }, lastRuns: [] };
        if (!this.runHistory.best) this.runHistory.best = { wave: 0, score: 0 };
        this.runHistory.best.wave = Math.max(this.runHistory.best.wave || 0, wave);
        this.runHistory.best.score = Math.max(this.runHistory.best.score || 0, score);
        // Unshift and cap to 10
        if (!Array.isArray(this.runHistory.lastRuns)) this.runHistory.lastRuns = [];
        this.runHistory.lastRuns.unshift(entry);
        this.runHistory.lastRuns = this.runHistory.lastRuns.slice(0, 10);
        this.persistRunHistory();
        this.renderStatsPanel && this.renderStatsPanel();
        // Clear current run marker
        this.currentRun = null;

        // Save score to Gameist main menu leaderboard system
        this.saveScoreToGameist(score, wave);

        // Coin economy: grant coins based on score and wave (anti-exploit guards)
        try {
            const wave = Math.max(0, this.waveNumber || 0);
            const score = Math.max(0, this.score || 0);
            let coins = 0;
            if (wave >= 2) {
                const fromScore = Math.floor(score / 50);
                const fromWave = 10 * wave;
                coins = Math.max(0, fromScore + fromWave);
            }
            if (coins > 0) { this.grantCoins && this.grantCoins(coins); }
        } catch(_) {}
    }

    renderStatsPanel() {
        try {
            const bestWaveEl = document.getElementById('statsBestWave');
            const bestScoreEl = document.getElementById('statsBestScore');
            const listEl = document.getElementById('statsLastRuns');
            const wepBody = document.getElementById('weaponStatsBody');
            const resetBtn = document.getElementById('resetStatsBtn');
            if (!bestWaveEl || !bestScoreEl || !listEl) return;
            const best = (this.runHistory && this.runHistory.best) ? this.runHistory.best : { wave: 0, score: 0 };
            bestWaveEl.textContent = String(best.wave || 0);
            bestScoreEl.textContent = String(best.score || 0);
            const runs = (this.runHistory && Array.isArray(this.runHistory.lastRuns)) ? this.runHistory.lastRuns : [];
            if (!runs.length) {
                const empty = this.t ? (this.t('noRunsYet') || 'No runs yet') : 'No runs yet';
                listEl.innerHTML = `<div class="empty">${empty}</div>`;
            } else {
                listEl.innerHTML = runs.map(r => {
                    const minutes = Math.floor((r.durationMs || 0) / 60000);
                    const seconds = Math.floor(((r.durationMs || 0) % 60000) / 1000).toString().padStart(2, '0');
                    const dur = `${minutes}:${seconds}`;
                    const ts = (r.when || '').replace('T', ' ').replace('Z', ' UTC');
                    const tag = `${r.character || '-'} • ${r.element || '-'}`;
                    return `<div class="run">W${r.wave} • ${r.score} pts • ${dur} • ${r.outcome || ''}<div class="sub">${tag} — ${ts}</div></div>`;
                }).join('');
            }

            // Weapon stats
            if (wepBody) {
                const t = (k, fb)=> (this.t ? (this.t(k)||fb) : fb);
                const rows = [];
                const cw = (typeof window!=='undefined' && window.game) ? (window.game.chosenWeapon||'') : (this.chosenWeapon||'');
                const cwNorm = String(cw||'').toLowerCase();
                const isTurrets = cwNorm.startsWith('turret') || !!this.playerTurrets;
                const isElectro = cwNorm.startsWith('elec') || !!this.electroGen;
                const isGravity = cwNorm.startsWith('grav') || !!this.gravityOrb;
                // Common base weapon
                const dmg = this.weaponDamage != null ? this.weaponDamage : (this.weaponDmg||0);
                const frMs = Math.max(1, this.weaponFireRate || 0);
                const frS = (frMs/1000).toFixed(2)+'s';
                const rng = this.weaponRange || this.baseWeaponRange || 0;
                rows.push(`<div>${t('wepDamage','Damage')}</div><div>${dmg}</div>`);
                rows.push(`<div>${t('wepFireRate','Fire Rate')}</div><div>${frS}</div>`);
                rows.push(`<div>${t('wepRange','Range')}</div><div>${rng}</div>`);
                if (isTurrets) {
                    const count = Array.isArray(this.playerTurrets) ? this.playerTurrets.length : 0;
                    const r = (Array.isArray(this.playerTurrets) && this.playerTurrets[0] && this.playerTurrets[0].range) ? this.playerTurrets[0].range : 520;
                    rows.push(`<div>Turrets</div><div>${count}</div>`);
                    rows.push(`<div>${t('wepRange','Range')}</div><div>${r}</div>`);
                }
                if (isElectro) {
                    const eg = this.electroGen || {};
                    rows.push(`<div>${t('wepPeriod','Period')}</div><div>${Math.max(0, (eg.fireDelay||1500)/1000).toFixed(2)}s</div>`);
                    rows.push(`<div>${t('wepChain','Chain')}</div><div>${eg.chain||0}</div>`);
                    rows.push(`<div>${t('wepRange','Range')}</div><div>${eg.range||520}</div>`);
                }
                if (isGravity) {
                    const go = this.gravityOrb || {};
                    rows.push(`<div>${t('wepPeriod','Period')}</div><div>${Math.max(0, (go.period||2600)/1000).toFixed(2)}s</div>`);
                    rows.push(`<div>${t('wepRadius','Radius')}</div><div>${go.radius||240}</div>`);
                    rows.push(`<div>${t('wepShrapnel','Shrapnel')}</div><div>${go.shrapnelCount||6}</div>`);
                }
                wepBody.innerHTML = rows.join('');
            }

            // Bind reset button once (only clear last runs; preserve bests)
            if (resetBtn && !resetBtn._bound) {
                resetBtn.addEventListener('click', () => {
                    try {
                        const best = (this.runHistory && this.runHistory.best) ? this.runHistory.best : { wave: 0, score: 0 };
                        this.runHistory = { best: { wave: best.wave||0, score: best.score||0 }, lastRuns: [] };
                        this.persistRunHistory && this.persistRunHistory();
                        this.renderStatsPanel && this.renderStatsPanel();
                    } catch(_) {}
                });
                resetBtn._bound = true;
            }
        } catch (_) { /* ignore DOM issues */ }
    }
    

    updateShopCounters() {
        const mEl = document.getElementById('materialsValue');
        const xEl = document.getElementById('xpValue');
        if (mEl) mEl.textContent = this.materials;
        if (xEl) xEl.textContent = this.xp;
        const waveEl = document.getElementById('shopWaveLabel');
        if (waveEl) waveEl.textContent = `Wave ${Math.max(1, this.waveNumber || 1)}`;
        // Achievement: 100 materials collected in a run
        try { if ((this.materials|0) >= 100) this.unlockAchievement && this.unlockAchievement('mats100', 'Collect 100 Materials'); } catch(_) {}
    }

    // Map enemy role/type to a canonical shape for clear visual identity
    getShapeForRole(role) {
        switch (role) {
            case 'rush': return 'circle';
            case 'shooter': return 'triangle';
            case 'fast': return 'triangle-fast';
            case 'tank': return 'block';
            case 'elite': return 'hexagon';
            case 'sniper': return 'long-rifle';
            case 'bloodmage': return 'cloak';
            case 'berserker': return 'hexagon';
            case 'overcharged': return 'bolt';
            case 'parasite': return 'spider';
            case 'juggernaut': return 'block';
            case 'mutant': return 'amoeba';
            default: return 'circle';
        }
    }

    // Deterministic colors per role for clear player recognition
    getColorForRole(role) {
        switch (role) {
            case 'rush': return '#33ff66';      // neon green
            case 'fast': return '#4dd0e1';      // teal
            case 'shooter': return '#ffd54a';   // amber
            case 'tank': return '#7a5cff';      // violet (matches juggernaut)
            case 'elite': return '#c0c0c0';     // silver
            case 'sniper': return '#c7c7c7';    // steel
            case 'bloodmage': return '#ff1744'; // crimson
            case 'berserker': return '#ff3b30'; // red
            case 'overcharged': return '#00aaff'; // electric blue
            case 'parasite': return '#7f8c8d';  // gray
            case 'juggernaut': return '#7a5cff';// violet
            case 'mutant': return '#9c27b0';    // purple
            default: return this.getRandomNeonColor();
        }
    }

    spawnEnemiesDuringWave(dt) {
        // Regular waves: maintain a target count, but spawn smoothly using accumulator
        let desired = Math.max(1, this.desiredEnemyCap || (6 + Math.floor(this.waveNumber * 1.6)));
        const boss10Alive = (this.waveNumber === 10) && (this.aiBots || []).some(b => b.isBoss && b.bossWave === 10);
        const bossAlive = (this.waveNumber === 20) && (this.aiBots || []).some(b => b.isBoss);
        // Wave 10: cap total enemies to 10 for the whole wave
        if (this.waveNumber === 10) desired = Math.min(desired, 10);
        if (bossAlive) {
            // Keep up to 10 support enemies while boss is alive (excluding boss)
            const supportAlive = (this.aiBots || []).filter(b => !b.isBoss).length;
            const supportTarget = 10;
            // desired is the total gate used by current logic; convert to total including boss
            desired = Math.min(desired, supportTarget) + 1; // +1 for the boss itself
        }
        if (this.aiBots.length < desired) {
            // Respect caps and budget (include gameplay global cap and performance cap)
            const hardCapLeft = Math.max(0, (this.maxEnemies != null ? this.maxEnemies : Infinity) - this.aiBots.length);
            const gameplayCapLeft = Math.max(0, (this.globalMaxBots != null ? this.globalMaxBots : Infinity) - this.aiBots.length);
            const capLeft = Math.min(hardCapLeft, gameplayCapLeft);
            // If boss is alive, only consider support deficit toward 10
            let deficit = Math.max(0, desired - this.aiBots.length);
            if (bossAlive) {
                const supportAlive = (this.aiBots || []).filter(b => !b.isBoss).length;
                const supportTarget = 10;
                deficit = Math.max(0, supportTarget - supportAlive);
            }
            // Flow override: keep a small number of enemies alive even if budget is 0
            const flowFloor = (this.waveNumber === 20) ? 6 : 2;
            const allowFlow = this.waveTimer > 2500 && (this.aiBots.length < Math.min(flowFloor, desired));
            // When allowFlow is true and budget is depleted, ignore budget in 'possible'
            const hasBudget = (this.budgetRemaining == null) ? true : (this.budgetRemaining > 0);
            const possible = (!hasBudget && allowFlow)
                ? Math.min(deficit, capLeft)
                : (this.budgetRemaining != null ? Math.min(deficit, capLeft, this.budgetRemaining) : Math.min(deficit, capLeft));
            // Boss waves: spawn each boss once without consuming budget
            if (this.waveNumber === 5 && !this.boss5Spawned) { this.spawnBoss5(); this.boss5Spawned = true; }
            if (this.waveNumber === 10 && !this.boss10Spawned) { this.spawnBoss10(); this.boss10Spawned = true; }
            if (this.waveNumber === 15 && !this.boss15Spawned) { this.spawnBoss15(); this.boss15Spawned = true; }
            if (this.waveNumber === 20 && !this.boss20Spawned) { this.spawnBoss(); this.boss20Spawned = true; }
            // Accumulate fractional spawns per second (throttle by FPS if low)
            const curFps = Math.max(1, this.fps || 60);
            const fpsScale = Math.min(1, curFps / 60); // below 60FPS -> scale down
            let effectiveRate = (this.spawnPerSecond || 2.5) * (0.75 + 0.25 * fpsScale);
            // During boss summon phase, bias refill slightly faster
            if (bossAlive && this._bossWantsRefill) effectiveRate *= 1.5;
            this.spawnAccumulator += effectiveRate * (dt / 1000);
            let toSpawn = Math.min(possible, Math.floor(this.spawnAccumulator));
            // Avoid per-frame spikes
            const perFrameCap = (curFps < 40) ? 2 : 3;
            toSpawn = Math.min(toSpawn, perFrameCap);
            if (toSpawn > 0) this.spawnAccumulator -= toSpawn;
            for (let i = 0; i < toSpawn; i++) {
                const name = `Enemy-${Math.floor(Math.random()*1000)}`;
                const element = ['fire','water','air'][Math.floor(Math.random()*3)];
                const color = this.getRandomNeonColor();
                const shape = null; // shape will be assigned from role/type below
                // Spawn at play zone edges (avoid corners)
                let pos;
                {
                    const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
                    const side = Math.floor(Math.random() * 4); // 0:top,1:right,2:bottom,3:left
                    // Starting from wave 6, spawn a bit farther from corners and edges to reduce early wall-sliding
                    const edgeInset = (this.waveNumber >= 6) ? 18 : 12; // distance from wall
                    const baseGap = (this.playZone ? Math.min(z.width, z.height) * 0.04 : 100);
                    const cornerGap = (this.waveNumber >= 6)
                        ? Math.max(140, baseGap * 1.6)
                        : Math.max(100, baseGap);
                    if (side === 0) {
                        const x = z.x + cornerGap + Math.random() * Math.max(1, z.width - 2*cornerGap);
                        pos = new Vector2(x, z.y + edgeInset);
                    } else if (side === 1) {
                        const y = z.y + cornerGap + Math.random() * Math.max(1, z.height - 2*cornerGap);
                        pos = new Vector2(z.x + z.width - edgeInset, y);
                    } else if (side === 2) {
                        const x = z.x + cornerGap + Math.random() * Math.max(1, z.width - 2*cornerGap);
                        pos = new Vector2(x, z.y + z.height - edgeInset);
                    } else {
                        const y = z.y + cornerGap + Math.random() * Math.max(1, z.height - 2*cornerGap);
                        pos = new Vector2(z.x + edgeInset, y);
                    }
                }
                const bot = new AIBot(name, pos, element, color, shape);
                // Choose enemy type by wave pool and assign stats (HP, size flags)
                let et = this.chooseEnemyTypeForWave(this.waveNumber);
                if (bossAlive) {
                    // While boss alive, keep support enemies light (no tank/elite)
                    if (et === 'tank' || et === 'elite') et = Math.random() < 0.5 ? 'weak' : 'fast';
                    bot.isSupport = true;
                    // Late boss waves (>=16): allow a small chance for special archetypes to appear for variety
                    // Wave 10 ranged suppression is handled in updateBoss10; we do not alter that here.
                    try {
                        const w = Math.max(1, this.waveNumber || 1);
                        if (w >= 16) {
                            const baseProjectileDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
                            let assigned = false;
                            const r = Math.random();
                            // Reduced probabilities vs non-boss; slightly higher on final boss (20)
                            let pBers=0.05, pOver=0.04, pPara=0.05, pSnip=0.05, pBlood=0.03, pJugg=0.05, pMut=0.04;
                            if (w >= 20) { pBers=0.07; pOver=0.06; pPara=0.07; pSnip=0.07; pBlood=0.05; pJugg=0.07; pMut=0.06; }
                            const tryAssign = (cond, fn) => { if (!assigned && cond) { fn(); assigned = true; } };
                            // Berserker
                            tryAssign(r < pBers, () => { bot.role='berserker'; bot.isRanged=false; bot.shape='hexagon'; bot.color='#ff3b30'; });
                            // Overcharged
                            tryAssign(r>=pBers && r<pBers+pOver, () => { bot.role='overcharged'; bot.isRanged=false; bot.shape='bolt'; bot.color='#00aaff'; });
                            // Parasite
                            tryAssign(r>=pBers+pOver && r<pBers+pOver+pPara, () => { bot.role='parasite'; bot.isRanged=false; bot.shape='spider'; bot.color='#7f8c8d'; bot.maxHP=Math.max(1, Math.floor((bot.maxHP||baseProjectileDmg)*0.9)); bot.hp=bot.maxHP; });
                            // Sniper
                            tryAssign(r>=pBers+pOver+pPara && r<pBers+pOver+pPara+pSnip, () => { bot.role='sniper'; bot.isRanged=true; bot.shape='long-rifle'; bot.color='#c7c7c7'; bot.maxHP=(w>=20)? baseProjectileDmg*2 : baseProjectileDmg*1; bot.hp=bot.maxHP; bot.speedMult=(bot.speedMult||1)*0.9; });
                            // Blood Mage
                            tryAssign(r>=pBers+pOver+pPara+pSnip && r<pBers+pOver+pPara+pSnip+pBlood, () => { bot.role='bloodmage'; bot.isRanged=true; bot.shape='cloak'; bot.color='#ff1744'; bot.maxHP=Math.max(1, Math.floor((bot.maxHP||baseProjectileDmg)*0.8)); bot.hp=bot.maxHP; });
                            // Juggernaut
                            tryAssign(r>=pBers+pOver+pPara+pSnip+pBlood && r<pBers+pOver+pPara+pSnip+pBlood+pJugg, () => { bot.role='juggernaut'; bot.isRanged=false; bot.shape='block'; bot.color='#7a5cff'; bot.size=Math.max(bot.size||15,20); bot.maxHP=Math.max(bot.maxHP||baseProjectileDmg*8, baseProjectileDmg*8); bot.hp=bot.maxHP; bot.staggerResist=Math.max(bot.staggerResist||0,0.7); });
                            // Mutant
                            tryAssign(r>=pBers+pOver+pPara+pSnip+pBlood+pJugg && r<pBers+pOver+pPara+pSnip+pBlood+pJugg+pMut, () => { bot.role='mutant'; bot.isRanged=false; bot.shape='amoeba'; bot.color='#9c27b0'; bot._mutantNextRoll=Date.now()+(3000+Math.random()*2000); bot._mutantBuff=null; });
                            if (!bot.shape) bot.shape = this.getShapeForRole(bot.role || (bot.isRanged ? 'shooter' : 'rush'));
                            if (bot.shape === 'long-rifle' && bot.role !== 'sniper') bot.role = 'sniper';
                            if (!bot.color) bot.color = this.getColorForRole(bot.role || (bot.isRanged ? 'shooter' : 'rush'));
                            // Slightly reduce speed for non-boss ranged during boss to keep clarity
                            if (bot.isRanged && !bot.isBoss) bot.speedMult = (bot.speedMult || 1) * 0.97;
                        }
                    } catch(_) {}
                }
                const stats = this.getEnemyStats ? this.getEnemyStats(et, this.waveNumber) : null;
                // Wave 10: non-boss enemies should die in exactly 3 hits of player base damage
                if (this.waveNumber === 10) {
                    const baseProjectileDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
                    bot.maxHP = baseProjectileDmg * 3;
                    bot.hp = bot.maxHP;
                    // Optional: reduce ranged to keep clarity during boss wave
                    bot.isRanged = false;
                } else {
                    if (stats) { bot.maxHP = stats.hp; bot.hp = bot.maxHP; }
                }
                // Apply visuals/flags
                bot.isFast = et === 'fast' || (stats && stats.role === 'rush' && (stats.speedMult||1)>1.1);
                bot.isTank = et === 'tank';
                bot.isElite = et === 'elite';
                // Size by type for visual distinction
                if (stats && stats.size) bot.size = stats.size; else bot.size = (et === 'tank' || et === 'elite') ? 19 : 15;
                // Behavior params
                if (stats) {
                    bot.speedMult = stats.speedMult || 1.0;
                    bot.role = stats.role || 'rush';
                    bot.kiteRange = stats.kiteRange || 0;
                    bot.isRanged = !!stats.isRanged; // still globally disabled to fire
                    bot.meleeDmg = stats.meleeDmg != null ? stats.meleeDmg : bot.meleeDmg;
                }
                // Wave-specific spawn rules
                try {
                    const w = Math.max(1, this.waveNumber || 1);
                    const isBossWave = (w % 5) === 0;
                    const baseProjectileDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
                    // Waves 1-3: no shooters
                    if (w <= 3) {
                        bot.isRanged = false;
                        bot.role = 'rush';
                    }
                    // Wave 4: only big rush with double HP of standard rush and bigger size
                    if (!isBossWave && w === 4) {
                        bot.isRanged = false;
                        bot.role = 'rush';
                        bot.size = bot.size; // bigger than basic (15)
                        bot.maxHP = baseProjectileDmg * 2; // double of standard 1-hit rush
                        bot.hp = bot.maxHP;
                    } else if (!isBossWave && w !== 4) {
                        // Non-boss waves other than 4
                        if (bot.isRanged) {
                            // Shooters: waves 5-7 = 1-hit, 8+ = 2-hit
                            if (w >= 8) { bot.maxHP = baseProjectileDmg * 2; bot.hp = bot.maxHP; }
                            else if (w >= 5) { bot.maxHP = baseProjectileDmg * 1; bot.hp = bot.maxHP; }
                            else { /* w<=3 handled above: shooters disabled */ }
                        } else if (bot.role === 'rush' && !bot.isTank && !bot.isElite) {
                            // Basic rush: 1-hit on all non-boss waves except wave 4 which is handled above
                            bot.maxHP = baseProjectileDmg * 1; bot.hp = bot.maxHP;
                        }
                        // Brotato-like flow: probabilistically convert some rush to shooters by wave band
                        if (w >= 5 && !bot.isBoss && bot.role === 'rush' && !bot.isTank && !bot.isElite) {
                            let shooterRatio = 0;
                            if (w <= 7) shooterRatio = 0.30; else if (w <= 10) shooterRatio = 0.35; else if (w <= 15) shooterRatio = 0.40; else shooterRatio = 0.45;
                            if (Math.random() < shooterRatio) {
                                bot.isRanged = true; bot.role = 'shooter'; bot.shape = this.getShapeForRole('shooter'); bot.color = this.getColorForRole('shooter');
                                // Ensure shooter HP matches band rule
                                if (w >= 8) { bot.maxHP = baseProjectileDmg * 2; bot.hp = bot.maxHP; }
                                else { bot.maxHP = baseProjectileDmg * 1; bot.hp = bot.maxHP; }
                                // Slightly slower than rush to favor projectile pressure over chase
                                bot.speedMult = (bot.speedMult || 1) * 0.95;
                            }
                        }
                        // New archetypes (non-boss). Keep rare initially; adjust per wave band.
                        if (!bot.isBoss) {
                            const r = Math.random();
                            // Base probabilities per band
                            let pBers=0, pOver=0, pPara=0, pSnip=0, pBlood=0, pJugg=0, pMut=0;
                            if (w >= 5 && w <= 7) { pBers=0.05; pOver=0.03; pPara=0.05; pSnip=0.02; }
                            else if (w >= 8 && w <= 10) { pBers=0.08; pOver=0.06; pPara=0.08; pSnip=0.04; pJugg=0.03; }
                            else if (w >= 11 && w <= 15) { pBers=0.10; pOver=0.08; pPara=0.10; pSnip=0.06; pBlood=0.04; pJugg=0.05; pMut=0.05; }
                            else if (w >= 16) { pBers=0.12; pOver=0.10; pPara=0.12; pSnip=0.07; pBlood=0.05; pJugg=0.07; pMut=0.07; }
                            // Assign at most one special archetype to this bot
                            let assigned = false;
                            const tryAssign = (cond, fn) => { if (!assigned && cond) { fn(); assigned = true; } };
                            // Berserker (melee): hexagon, red; rage handled in future pass
                            tryAssign(r < pBers, () => {
                                bot.role = 'berserker'; bot.isRanged = false; bot.shape = 'hexagon'; bot.color = '#ff3b30';
                                bot.attackRateMult = 1.0; // rage multiplier; to be increased on damage in future
                            });
                            // Overcharged (melee): bolt, blue; chain damage on-hit in future pass
                            tryAssign(r >= pBers && r < pBers + pOver, () => {
                                bot.role = 'overcharged'; bot.isRanged = false; bot.shape = 'bolt'; bot.color = '#00aaff';
                            });
                            // Parasite (melee lifesteal): spider, gray
                            tryAssign(r >= pBers + pOver && r < pBers + pOver + pPara, () => {
                                bot.role = 'parasite'; bot.isRanged = false; bot.shape = 'spider'; bot.color = '#7f8c8d';
                                // Slightly lower HP; relies on lifesteal sustain
                                bot.maxHP = Math.max(1, Math.floor((bot.maxHP || baseProjectileDmg) * 0.9)); bot.hp = bot.maxHP;
                            });
                            // Sniper (ranged alpha): long-rifle, steel
                            tryAssign(r >= pBers + pOver + pPara && r < pBers + pOver + pPara + pSnip, () => {
                                bot.role = 'sniper'; bot.isRanged = true; bot.shape = 'long-rifle'; bot.color = '#c7c7c7';
                                // Sniper should be fragile-ish but threatening
                                if (w <= 7) { bot.maxHP = baseProjectileDmg * 1; bot.hp = bot.maxHP; }
                                else { bot.maxHP = baseProjectileDmg * 2; bot.hp = bot.maxHP; }
                                bot.speedMult = (bot.speedMult || 1) * 0.9;
                            });
                            // Blood Mage (ranged AOE caster): cloak, crimson (behavior in later pass)
                            tryAssign(r >= pBers + pOver + pPara + pSnip && r < pBers + pOver + pPara + pSnip + pBlood, () => {
                                bot.role = 'bloodmage'; bot.isRanged = true; bot.shape = 'cloak'; bot.color = '#ff1744';
                                bot.maxHP = Math.max(1, Math.floor((bot.maxHP || baseProjectileDmg) * 0.8)); bot.hp = bot.maxHP;
                            });
                            // Juggernaut (tank pusher): block, violet
                            tryAssign(r >= pBers + pOver + pPara + pSnip + pBlood && r < pBers + pOver + pPara + pSnip + pBlood + pJugg, () => {
                                bot.role = 'juggernaut'; bot.isRanged = false; bot.shape = 'block'; bot.color = '#7a5cff';
                                bot.size = Math.max(bot.size || 15, 20);
                                bot.maxHP = Math.max(bot.maxHP || baseProjectileDmg * 8, baseProjectileDmg * 8); bot.hp = bot.maxHP;
                                bot.staggerResist = Math.max(bot.staggerResist || 0, 0.7);
                            });
                            // Mutant (random buffs): amoeba, purple
                            tryAssign(r >= pBers + pOver + pPara + pSnip + pBlood + pJugg && r < pBers + pOver + pPara + pSnip + pBlood + pJugg + pMut, () => {
                                bot.role = 'mutant'; bot.isRanged = false; bot.shape = 'amoeba'; bot.color = '#9c27b0';
                                bot._mutantNextRoll = Date.now() + (3000 + Math.random()*2000);
                                bot._mutantBuff = null;
                            });
                        }
                        // If no explicit archetype shape was set, assign based on role/type
                        if (!bot.shape) bot.shape = this.getShapeForRole(bot.role || (bot.isRanged ? 'shooter' : 'rush'));
                        // Safety: if shape indicates long-rifle, force sniper role
                        if (bot.shape === 'long-rifle' && bot.role !== 'sniper') bot.role = 'sniper';
                        if (!bot.color) bot.color = this.getColorForRole(bot.role || (bot.isRanged ? 'shooter' : 'rush'));
                        // Speed policy: cap rush speed modestly; keep shooters slightly slower
                        if (bot.role === 'rush' && !bot.isBoss) {
                            const cap = (w >= 12) ? 1.05 : 1.02;
                            bot.speedMult = Math.min(bot.speedMult || 1, cap);
                        }
                        if (bot.isRanged && !bot.isBoss) {
                            bot.speedMult = (bot.speedMult || 1) * 0.97;
                        }
                        // Assign default shapes/colors for pressure spawns as well
                        if (!bot.shape) bot.shape = this.getShapeForRole(bot.role || (bot.isRanged ? 'shooter' : 'rush'));
                        if (!bot.color) bot.color = this.getColorForRole(bot.role || (bot.isRanged ? 'shooter' : 'rush'));
                    }
                } catch {}
                // Decrement planned remaining for this type if tracked
                if (this.waveCompRemaining && this.waveCompRemaining[et] != null && this.waveCompRemaining[et] > 0) {
                    this.waveCompRemaining[et]--;
                }
                // Slight stagger resist scaling by wave to avoid perma-stagger
                const wave = Math.max(1, this.waveNumber || 1);
                bot.staggerResist = Math.min(0.6, 0.12 + wave * 0.04);
                // Brotato: very few ranged enemies starting wave >= 3
                if (this.gameMode === 'brotato') {
                    const rangedProb = (this.waveNumber >= 3)
                        ? Math.min(0.4, 0.1 + this.waveNumber * 0.015)
                        : 0.0;
                    const becameRanged = Math.random() < rangedProb;
                    if (becameRanged && !bot.isBoss) {
                        bot.isRanged = true; bot.role = 'shooter';
                        bot.shape = this.getShapeForRole('shooter');
                        bot.color = this.getColorForRole('shooter');
                    }
                }
                // Keep initial direction as assigned by role logic; do not force inward steering here
                try { /* no-op: intentionally avoid center bias on spawn */ } catch {}
                this.aiBots.push(bot);
                // Do not consume budget for flow-maintenance spawns (keeps waves active when emptied early)
                if (this.budgetRemaining != null && !(allowFlow && !hasBudget)) {
                    this.budgetRemaining = Math.max(0, this.budgetRemaining - 1);
                }
            }
        }
        // Ensure constant pressure: if no enemies near the player, spawn one nearby on a cooldown
        if (this.player) {
            // decrement cooldown
            this.pressureSpawnCooldown = Math.max(0, (this.pressureSpawnCooldown || 0) - dt);
            const nearRadius = 1000;
            const anyNear = this.aiBots.some(b => b.pos.minusNew(this.player.pos).magnitude() < nearRadius);
            if (!anyNear && this.pressureSpawnCooldown <= 0) {
                // respect caps (pressure spawns ignore budget to avoid empty waves)
                const capLeft = Math.max(0,
                    Math.min(
                        (this.maxEnemies != null ? this.maxEnemies : Infinity) - this.aiBots.length,
                        (this.globalMaxBots != null ? this.globalMaxBots : Infinity) - this.aiBots.length
                    )
                );
                const canSpawn = capLeft > 0;
                // Wave 10: do not exceed total 10 enemies including boss
                if (!canSpawn) return;
                if (this.waveNumber === 10 && this.aiBots.length >= 10) return;
                // spawn around player at a ring distance 420..620 px
                const angle = Math.random() * Math.PI * 2;
                // Pressure spawns also come from play zone edges (avoid corners)
                let spawnPos;
                {
                    const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
                    const side = Math.floor(Math.random() * 4);
                    const edgeInset = (this.waveNumber >= 6) ? 18 : 12;
                    const baseGap = (this.playZone ? Math.min(z.width, z.height) * 0.04 : 100);
                    const cornerGap = (this.waveNumber >= 6)
                        ? Math.max(140, baseGap * 1.6)
                        : Math.max(100, baseGap);
                    if (side === 0) {
                        const x = z.x + cornerGap + Math.random() * Math.max(1, z.width - 2*cornerGap);
                        spawnPos = new Vector2(x, z.y + edgeInset);
                    } else if (side === 1) {
                        const y = z.y + cornerGap + Math.random() * Math.max(1, z.height - 2*cornerGap);
                        spawnPos = new Vector2(z.x + z.width - edgeInset, y);
                    } else if (side === 2) {
                        const x = z.x + cornerGap + Math.random() * Math.max(1, z.width - 2*cornerGap);
                        spawnPos = new Vector2(x, z.y + z.height - edgeInset);
                    } else {
                        const y = z.y + cornerGap + Math.random() * Math.max(1, z.height - 2*cornerGap);
                        spawnPos = new Vector2(z.x + edgeInset, y);
                    }
                }
                const name = `P-Enemy-${Math.floor(Math.random()*1000)}`;
                const element = ['fire','water','air'][Math.floor(Math.random()*3)];
                const color = this.getRandomNeonColor();
                const shape = null; // will assign from role/type below
                const bot = new AIBot(name, spawnPos, element, color, shape);
                {
                    const baseProjectileDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
                    const isBig = bot.size === 19;
                    bot.size = isBig ? 19 : 15;
                    if (this.waveNumber === 10) {
                        // Wave 10 pressure spawns: 3-hit kill and non-ranged
                        bot.maxHP = baseProjectileDmg * 3;
                        bot.hp = bot.maxHP;
                        bot.isRanged = false;
                    } else {
                        const w = Math.max(1, this.waveNumber || 1);
                        const targetHP = (w >= 14)
                            ? (isBig ? baseProjectileDmg * 3 : baseProjectileDmg * 1)
                            : (isBig ? baseProjectileDmg * 6 : baseProjectileDmg * 2);
                        bot.maxHP = targetHP;
                        bot.hp = bot.maxHP;
                    }
                    const wave = Math.max(1, this.waveNumber || 1);
                    bot.staggerResist = Math.min(0.6, 0.12 + wave * 0.04);
                }
                // Apply the same wave-specific HP rules for pressure spawns
                try {
                    const w = Math.max(1, this.waveNumber || 1);
                    const isBossWave = (w % 5) === 0;
                    const baseProjectileDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
                    // Waves 1-3: no shooters
                    if (w <= 3) {
                        bot.isRanged = false;
                        bot.role = 'rush';
                    }
                    // Wave 4: only big rush with double HP
                    if (!isBossWave && w === 4) {
                        bot.isRanged = false;
                        bot.role = 'rush';
                        bot.size = bot.size;
                        bot.maxHP = baseProjectileDmg * 2; bot.hp = bot.maxHP;
                    } else if (!isBossWave && w !== 4) {
                        if (bot.isRanged) {
                            if (w >= 8) { bot.maxHP = baseProjectileDmg * 2; bot.hp = bot.maxHP; }
                            else if (w >= 5) { bot.maxHP = baseProjectileDmg * 1; bot.hp = bot.maxHP; }
                        } else if (bot.role === 'rush' && !bot.isTank && !bot.isElite) {
                            bot.maxHP = baseProjectileDmg * 1; bot.hp = bot.maxHP;
                        }
                        // Pressure composition bias: similar shooter ratio but keep rush majority
                        if (w >= 5 && !bot.isBoss && bot.role === 'rush' && !bot.isTank && !bot.isElite) {
                            let shooterRatio = 0;
                            if (w <= 7) shooterRatio = 0.28; else if (w <= 10) shooterRatio = 0.33; else if (w <= 15) shooterRatio = 0.38; else shooterRatio = 0.42;
                            if (Math.random() < shooterRatio) {
                                bot.isRanged = true; bot.role = 'shooter';
                                if (w >= 8) { bot.maxHP = baseProjectileDmg * 2; bot.hp = bot.maxHP; }
                                else { bot.maxHP = baseProjectileDmg * 1; bot.hp = bot.maxHP; }
                                bot.speedMult = (bot.speedMult || 1) * 0.95;
                            }
                        }
                        // New archetypes for pressure spawns (reduced rates)
                        if (!bot.isBoss) {
                            const r = Math.random();
                            let pBers=0, pOver=0, pPara=0, pSnip=0, pBlood=0, pJugg=0, pMut=0;
                            if (w >= 5 && w <= 7) { pBers=0.04; pOver=0.02; pPara=0.04; pSnip=0.015; }
                            else if (w >= 8 && w <= 10) { pBers=0.06; pOver=0.04; pPara=0.06; pSnip=0.03; pJugg=0.02; }
                            else if (w >= 11 && w <= 15) { pBers=0.08; pOver=0.06; pPara=0.08; pSnip=0.05; pBlood=0.03; pJugg=0.04; pMut=0.04; }
                            else if (w >= 16) { pBers=0.10; pOver=0.08; pPara=0.10; pSnip=0.06; pBlood=0.04; pJugg=0.06; pMut=0.06; }
                            let assigned = false;
                            const tryAssign = (cond, fn) => { if (!assigned && cond) { fn(); assigned = true; } };
                            tryAssign(r < pBers, () => { bot.role='berserker'; bot.isRanged=false; bot.shape='hexagon'; bot.color='#ff3b30'; bot.attackRateMult=1.0; });
                            tryAssign(r >= pBers && r < pBers+pOver, () => { bot.role='overcharged'; bot.isRanged=false; bot.shape='bolt'; bot.color='#00aaff'; });
                            tryAssign(r >= pBers+pOver && r < pBers+pOver+pPara, () => { bot.role='parasite'; bot.isRanged=false; bot.shape='spider'; bot.color='#7f8c8d'; bot.maxHP=Math.max(1, Math.floor((bot.maxHP||baseProjectileDmg)*0.9)); bot.hp=bot.maxHP; });
                            tryAssign(r >= pBers+pOver+pPara && r < pBers+pOver+pPara+pSnip, () => { bot.role='sniper'; bot.isRanged=true; bot.shape='long-rifle'; bot.color='#c7c7c7'; if (w<=7){bot.maxHP=baseProjectileDmg*1;} else {bot.maxHP=baseProjectileDmg*2;} bot.hp=bot.maxHP; bot.speedMult=(bot.speedMult||1)*0.9; });
                            tryAssign(r >= pBers+pOver+pPara+pSnip && r < pBers+pOver+pPara+pSnip+pBlood, () => { bot.role='bloodmage'; bot.isRanged=true; bot.shape='cloak'; bot.color='#ff1744'; bot.maxHP=Math.max(1, Math.floor((bot.maxHP||baseProjectileDmg)*0.8)); bot.hp=bot.maxHP; });
                            tryAssign(r >= pBers+pOver+pPara+pSnip+pBlood && r < pBers+pOver+pPara+pSnip+pBlood+pJugg, () => { bot.role='juggernaut'; bot.isRanged=false; bot.shape='block'; bot.color='#7a5cff'; bot.size=Math.max(bot.size||15,20); bot.maxHP=Math.max(bot.maxHP||baseProjectileDmg*8, baseProjectileDmg*8); bot.hp=bot.maxHP; bot.staggerResist=Math.max(bot.staggerResist||0,0.7); });
                            tryAssign(r >= pBers+pOver+pPara+pSnip+pBlood+pJugg && r < pBers+pOver+pPara+pSnip+pBlood+pJugg+pMut, () => { bot.role='mutant'; bot.isRanged=false; bot.shape='amoeba'; bot.color='#9c27b0'; bot._mutantNextRoll=Date.now()+(3000+Math.random()*2000); bot._mutantBuff=null; });
                        }
                        if (bot.role === 'rush' && !bot.isBoss) {
                            const cap = (w >= 12) ? 1.05 : 1.02;
                            bot.speedMult = Math.min(bot.speedMult || 1, cap);
                        }
                        if (bot.isRanged && !bot.isBoss) {
                            bot.speedMult = (bot.speedMult || 1) * 0.97;
                        }
                    }
                } catch {}
                
                if (this.gameMode === 'brotato') {
                    const rangedProb = (this.waveNumber >= 3)
                        ? Math.min(0.4, 0.1 + this.waveNumber * 0.015)
                        : 0.0;
                    bot.isRanged = Math.random() < rangedProb;
                }
                // Pressure spawn initial intent
                try {
                    const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
                    if (this.disableCenterFocus) {
                        const rnd = new Vector2(Math.random()-0.5, Math.random()-0.5).normalise();
                        bot.targetDir = rnd;
                        bot.velocity = rnd.multiplyNew(bot.getSpeed ? bot.getSpeed() : 120);
                    } else {
                        const center = this.player ? this.player.pos : new Vector2(z.x + z.width*0.5, z.y + z.height*0.5);
                        const dir = center.minusNew(bot.pos).normalise();
                        bot.targetDir = dir;
                        bot.velocity = dir.multiplyNew(bot.getSpeed ? bot.getSpeed() : 120);
                        bot._forceInwardUntil = Date.now() + (this.waveNumber >= 6 ? 1800 : 1000);
                        bot._inwardCenter = center.clone();
                    }
                } catch {}
                this.aiBots.push(bot);
                // set cooldown (~3.5s)
                this.pressureSpawnCooldown = 3500;
                // Pressure spawns do not consume budget
            }
        }
    }

    // Push overlapping bots apart so they don't stack visually
    resolveBotOverlaps(dt) {
        if (!this.aiBots || this.aiBots.length <= 1) return;
        const bots = this.aiBots;
        const maxPush = 12; // px per frame safety
        for (let i = 0; i < bots.length; i++) {
            for (let j = i + 1; j < bots.length; j++) {
                const a = bots[i], b = bots[j];
                const ra = (a.size || 15); const rb = (b.size || 15);
                const minSep = ra + rb + 2; // small gap
                const delta = b.pos.minusNew(a.pos);
                let dist = delta.magnitude();
                if (dist === 0) {
                    // Avoid zero vector
                    const rand = new Vector2((Math.random()-0.5)*2, (Math.random()-0.5)*2);
                    a.pos.plusEq(rand);
                    b.pos.minusEq(rand);
                    continue;
                }
                if (dist < minSep) {
                    const overlap = (minSep - dist);
                    const dir = delta.divideNew(dist);
                    const push = Math.min(maxPush, overlap * 0.5);
                    // Move each half the needed distance
                    a.pos.plusEq(dir.multiplyNew(-push));
                    b.pos.plusEq(dir.multiplyNew(push));
                    // Keep inside play zone if present
                    if (this.playZone) {
                        const z = this.playZone;
                        const clamp = (ent) => {
                            const r = ent.size || 12;
                            ent.pos.x = Math.max(z.x + r, Math.min(z.x + z.width - r, ent.pos.x));
                            ent.pos.y = Math.max(z.y + r, Math.min(z.y + z.height - r, ent.pos.y));
                        };
                        clamp(a); clamp(b);
                    }
                }
            }
        }
    }
    doAutoAttack(dt) {
        if (!this.player) return;
        this.weaponCooldown -= dt;
        if (this.weaponCooldown > 0) return;
        // Find nearest enemy within range
        let nearest = null; let minD = this.weaponRange + 1;
        for (const b of this.aiBots) {
            const d = this.player.pos.minusNew(b.pos).magnitude();
            if (d < minD) { minD = d; nearest = b; }
        }
        if (!nearest || minD > this.weaponRange) return;
        // Fire projectile (offset from player edge) and set owner
        const dir = nearest.pos.minusNew(this.player.pos).normalise();
        this.lastShotDir = dir.clone();
        const vel = dir.multiplyNew(520 * (this.projectileSpeedMult || 1));
        const spawn = this.player.pos.plusNew(dir.multiplyNew((this.player.size||12)+4));
        // Build projectile options; make fiery if fire infusion buff is active
        const now = Date.now();
        const infused = this.player.fireInfusedUntil && now < this.player.fireInfusedUntil;
        const baseDmg = this.weaponDamage != null ? this.weaponDamage : 12;
        const opts = infused ? {
            damage: baseDmg + (this.fireBonusDamage || 0),
            isFiery: true,
            burnDps: (this.fireBurnDpsBase||20) + (this.fireBurnDpsBonus||0),
            burnDuration: (this.fireBurnDurationBase||1600) + (this.fireBurnDurationBonus||0)
        } : { damage: baseDmg };
        this.projectiles.push(new Projectile(spawn, vel, this.player, opts));
        // SFX: shoot
        this.playShoot();
        this.weaponCooldown = Math.max(120, this.weaponFireRate);
    }

    updateDrops(dt) {
        const p = this.player;
        if (!p) return;
        // When visuals are hidden, still allow pickups during intermission so counters rise
        const canGainXP = (this.gameMode === 'brotato') && !this.inWave;
        this.drops.forEach(dr => {
            if (dr.vel) {
                dr.pos.plusEq(dr.vel.multiplyNew(dt/1000));
                dr.vel = dr.vel.multiplyNew(0.98);
            }
            const toP = p.pos.minusNew(dr.pos);
            const dist = toP.magnitude();
            const isMat = (dr.type === 'mat');
            const radius = this.magnetActive && isMat ? Math.max(180, this.magnetRadius||180) : 120;
            if (dist < radius && dist > 1) {
                const strength = (this.magnetActive && isMat) ? 325 : 60;
                const pull = toP.divideNew(dist).multiplyEq(strength * (1 - dist/radius));
                dr.pos.plusEq(pull.multiplyNew(dt/1000));
            }
        });
        const keep = [];
        for (const dr of this.drops) {
            const d = p.pos.minusNew(dr.pos).magnitude();
            if (d < p.size + 28) {
                if (dr.type === 'xp') {
                    // If XP wouldn't increase stats now (wave active), defer pickup
                    if (!canGainXP) { keep.push(dr); continue; }
                    this.xp += dr.amount || 1;
                    this.playPickupXP();
                } else if (dr.type === 'consum') {
                    try {
                        const ev = new CustomEvent('inventory:consumable:add', { detail: { id: dr.id || 'magnet_core', icon: dr.icon || '🧲', name: dr.name || 'Mıknatıs', cost: 0 } });
                        window.dispatchEvent(ev);
                    } catch(_) { }
                    this.playPickupMat && this.playPickupMat();
                } else {
                    this.materials += dr.amount || 1;
                    this.playPickupMat();
                }
            } else keep.push(dr);
        }
        this.drops = keep;
        this.updateShopCounters();
    }
    
    // Shop: 3 randomized offers from the player's element only, localized
    refreshShopItems() {
        // HARD STOP: Do not auto-render any shop list when shop opens.
        // This prevents the element-pool recommendation page with no category.
        if (!this.inWave) return;
        // If weapon selection is pending at end of Wave 3, do not render shop items yet
        if (!this.inWave && (this.waveNumber === 3) && !this._wave4WeaponChosen) {
            const shop = document.getElementById('shopOverlay');
            if (shop) shop.style.display = 'none';
            this.showWeaponOverlay && this.showWeaponOverlay();
            return;
        }
        const elem = this.player ? this.player.element : 'fire';
        let pool = [];
        if (elem === 'fire') {
            pool = [
                { id: 'f1', icon: '🔥', name: 'Ateş Gücü +4', blurb: 'Saldırı gücünü artırır', desc: 'Silah hasarını +4 artırır.', cost: 20, apply: () => { this.weaponDamage = (this.weaponDamage||12) + 4; } },
                { id: 'f2', icon: '♨️', name: 'Yanan Hasar +6', blurb: 'Sürekli yanma güçlenir', desc: 'Yanma DPS +6 artar.', cost: 14, apply: () => { this.fireBurnDpsBonus = (this.fireBurnDpsBonus||0) + 6; } },
                { id: 'f3', icon: '⏱️', name: 'Yanma Süresi +0.6s', blurb: 'Yanma etkisi uzar', desc: 'Yanma süresi +600ms.', cost: 16, apply: () => { this.fireBurnDurationBonus = (this.fireBurnDurationBonus||0) + 600; } },
            ];
        } else if (elem === 'water') {
            pool = [
                { id: 'w1', icon: '💧', name: 'Su Halkası +1', blurb: 'Savunma alanı büyür', desc: 'Aktif su halkası sayısını artırır.', cost: 18, apply: () => { this.waterRingCount = (this.waterRingCount||0) + 1; } },
                { id: 'w2', icon: '❄️', name: 'Yavaşlatma +10%', blurb: 'Düşmanlar daha çok yavaşlar', desc: 'Su yavaşlatması güçlenir.', cost: 16, apply: () => { this.waterSlowBonus = (this.waterSlowBonus||0) + 0.10; } },
                { id: 'w3', icon: '🛡️', name: 'Zırh +1', blurb: 'Alınan hasar azalır', desc: 'Zırh +1 artar.', cost: 15, apply: () => { this.player.armor = (this.player.armor||0) + 1; } },
            ];
        } else { // air
            pool = [
                { id: 'a1', icon: '🌬️', name: 'Hız +10%', blurb: 'Daha hızlı hareket', desc: 'Hareket hızı +%10.', cost: 14, apply: () => { this.player.speedBoost = (this.player.speedBoost||1) * 1.10; } },
                { id: 'a2', icon: '🎯', name: 'Atış Hızı +10%', blurb: 'Daha sık ateş', desc: 'Ateş etme hızı +%10.', cost: 16, apply: () => { this.weaponFireRate = Math.max(120, Math.floor((this.weaponFireRate||700) * 0.9)); } },
                { id: 'a3', icon: '🌀', name: 'Manevra +10%', blurb: 'Daha çevik kontrol', desc: 'Manevra +%10.', cost: 12, apply: () => { this.player.maneuverBoost = (this.player.maneuverBoost||1) * 1.10; } },
            ];
        }
        // Build one special upgrade offer for chosen Wave 4 weapon after Wave 4
        let specialWeaponOffer = null;
        if (!this.inWave && (this.waveNumber >= 4) && this.chosenWeapon) {
            const make = (id, icon, name, blurb, desc, cost, apply) => ({ id, icon, name, blurb, desc, cost, apply });
            if (this.chosenWeapon === 'turrets' && Array.isArray(this.playerTurrets) && this.playerTurrets.length) {
                const opts = [
                    make('t_rate', '🔫', 'Taret Atış Hızı +15%', 'Taretler daha sık ateş eder', 'Taret bekleme süresi %15 azalır.', 28, () => {
                        this.playerTurrets.forEach(t => t.fireDelay = Math.max(120, Math.floor((t.fireDelay||700) * 0.85)));
                    }),
                    make('t_range', '🎯', 'Taret Menzili +60', 'Hedefe daha uzaktan kilitlenir', 'Taret menzili +60 artar.', 22, () => {
                        this.playerTurrets.forEach(t => t.range = (t.range||520) + 60);
                    })
                ];
                specialWeaponOffer = opts[Math.floor(Math.random()*opts.length)];
                if (specialWeaponOffer) specialWeaponOffer.isSpecial = true;
            } else if (this.chosenWeapon === 'electro' && this.electroGen) {
                const g = this.electroGen;
                const opts = [
                    make('e_chain', '⚡', 'Zincir +1', 'Daha fazla hedefe sıçrar', 'Elektrik zinciri +1 artar.', 30, () => { g.chain = (g.chain||0) + 1; }),
                    make('e_rate', '⏱️', 'Atış Hızı +15%', 'Daha kısa bekleme', 'Ateş bekleme süresi %15 azalır.', 28, () => { g.fireDelay = Math.max(600, Math.floor((g.fireDelay||1500) * 0.85)); }),
                    make('e_dmg', '💥', 'Hasar +20%', 'Daha yüksek etki', 'Elektrik hasarı %20 artar.', 26, () => { g.dmgMult = (g.dmgMult||0.6) + 0.2; }),
                    make('e_range', '📏', 'Menzil +80', 'Uzak hedeflere erişim', 'Elektrik menzili +80 artar.', 22, () => { g.range = (g.range||520) + 80; })
                ];
                specialWeaponOffer = opts[Math.floor(Math.random()*opts.length)];
                if (specialWeaponOffer) specialWeaponOffer.isSpecial = true;
            } else if (this.chosenWeapon === 'gravity' && this.gravityOrb) {
                const g = this.gravityOrb;
                const opts = [
                    make('g_radius', '🌀', 'Yarıçap +60', 'Daha geniş çekim alanı', 'Küre yarıçapı +60 artar.', 24, () => { g.radius = (g.radius||250) + 60; }),
                    make('g_dmg', '💥', 'Patlama Hasarı +20%', 'Daha sert patlama', 'Patlama hasarı %20 artar.', 26, () => { g.dmgMult = (g.dmgMult||0.5) + 0.2; }),
                    make('g_duration', '🕒', 'Aktif Süre +0.2s', 'Daha uzun çekim', 'Aktif kalma süresi +200ms.', 20, () => { g.duration = (g.duration||500) + 200; }),
                    make('g_period', '⏱️', 'Periyot -15%', 'Daha sık etkinleşir', 'Bekleme süresi %15 azalır.', 28, () => { g.period = Math.max(1200, Math.floor((g.period||3000) * 0.85)); })
                ];
                specialWeaponOffer = opts[Math.floor(Math.random()*opts.length)];
                if (specialWeaponOffer) specialWeaponOffer.isSpecial = true;
            }
        }

        // Build exactly 3 offers. After Wave 4: slot #3 has 40% chance to be special upgrade.
        const baseOffers = [];
        const poolCopy = pool.slice();
        while (baseOffers.length < 3 && poolCopy.length > 0) {
            const idx = Math.floor(Math.random() * poolCopy.length);
            baseOffers.push(poolCopy.splice(idx,1)[0]);
        }
        let offers = baseOffers.slice(0, 3);
        if (!this.inWave && (this.waveNumber >= 4)) {
            const useSpecial = (Math.random() < 0.40) && !!specialWeaponOffer;
            if (useSpecial) {
                // Ensure 3 items: first two normal + special in 3rd slot
                offers = [offers[0], offers[1]].filter(Boolean);
                offers.push(specialWeaponOffer);
                // If pool was too small and we have <2 base offers, just fill with what exists
                while (offers.length < 3 && poolCopy.length > 0) {
                    const idx = Math.floor(Math.random() * poolCopy.length);
                    offers.splice(offers.length-1, 0, poolCopy.splice(idx,1)[0]);
                }
            }
            // else keep the 3 normal offers already in 'offers'
        }
        // Inject special pre/post-boss survival offer (costs all materials)
        const isIntermission = !this.inWave;
        const isPostBoss = this.isBossWaveNumber(this.waveNumber || 0);        // just finished a boss wave
        const isPreBoss = this.isBossWaveNumber((this.waveNumber || 0) + 1);   // next wave is a boss wave
        if (isIntermission && (isPreBoss || isPostBoss)) {
            const heartValue = 20; // 1 heart equivalency in HP
            if (isPreBoss) {
                // Pre-boss: grant +1 heart (ensure total hearts=2) AND full heal
                offers.push({
                    id: 'boss_pre_heart_fullheal',
                    icon: '❤️',
                    name: 'Kalp +1 & Tam Şifa',
                    blurb: 'Tüm paran karşılığında hayatta kalma takviyesi',
                    desc: `Maks HP en az 2 kalbe çıkarılır (+${heartValue}) ve canın tamamen doldurulur. Ücret: Cüzdandaki tüm materyaller.`,
                    cost: -1,
                    allMoney: true,
                    apply: () => {
                        if (this.player) {
                            const perHeart = heartValue;
                            const targetHP = perHeart * 2;
                            this.player.maxHP = Math.max((this.player.maxHP || 100), targetHP);
                            this.player.hp = this.player.maxHP;
                        }
                        this.lives = Math.max(2, this.lives || 0);
                        const livesEl = document.getElementById('livesDisplay');
                        if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, this.lives));
                    }
                });
            } else if (isPostBoss) {
                // Post-boss: ONLY full heal, no extra heart
                offers.push({
                    id: 'boss_post_fullheal',
                    icon: '❤️',
                    name: 'Tam Şifa',
                    blurb: 'Tüm paran karşılığında tam iyileşme',
                    desc: `Canın tamamen doldurulur. Ücret: Cüzdandaki tüm materyaller.`,
                    cost: -1,
                    allMoney: true,
                    apply: () => {
                        if (this.player) {
                            this.player.hp = this.player.maxHP || this.player.hp;
                        }
                        // deliberately no lives change here
                        const livesEl = document.getElementById('livesDisplay');
                        if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, this.lives));
                    }
                });
            }
        }
        this.currentOffers = offers;
        // Render
        const container = document.getElementById('shopItems');
        if (!container) return;
        container.innerHTML = '';
        offers.forEach((of, i) => {
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.id = `shopItem${i+1}`; // so purchaseItem can highlight if cannot afford
            const title = document.createElement('div');
            title.className = 'shop-name';
            title.textContent = `${of.icon ? of.icon+" " : ''}${of.name}`;
            const blurb = document.createElement('small');
            blurb.className = 'shop-blurb';
            blurb.textContent = of.blurb || '';
            const desc = document.createElement('small');
            desc.className = 'shop-desc';
            desc.textContent = of.desc || '';
            const cost = document.createElement('small');
            cost.className = 'shop-cost';
            // Special handling for all-money item
            let effectiveCost;
            if (of.allMoney) {
                cost.textContent = 'Maliyet: Tüm para (min 10)';
                effectiveCost = this.materials; // spends everything if allowed
            } else {
                const baseCost = (of.cost || 0);
                // Only allow a single free purchase in the very first shop (pre-wave-1)
                effectiveCost = (this.waveNumber === 0 && !this.usedFreeSkill) ? 0 : this.getScaledCost(baseCost);
                cost.textContent = `Maliyet: ${effectiveCost}`;
            }
            // Affordability visual cues via CSS classes
            const affordable = of.allMoney ? (this.materials >= 10) : (this.materials >= effectiveCost);
            item.classList.add(affordable ? 'affordable' : 'unaffordable');
            cost.classList.add(affordable ? 'affordable' : 'unaffordable');
            // Show badge only when 3rd slot is actually SPECIAL (Wave 4+)
            if (!this.inWave && (this.waveNumber >= 4) && i === 2 && of.isSpecial) {
                const badge = document.createElement('div');
                badge.textContent = 'ÖZEL';
                badge.className = 'shop-badge special';
                item.appendChild(badge);
            }
            item.onclick = () => this.purchaseItem(i);
            item.tabIndex = 0;
            item.appendChild(title);
            item.appendChild(blurb);
            item.appendChild(desc);
            item.appendChild(cost);
            container.appendChild(item);
        });
    }

    // Simple UI toast helper
    showToast(text) {
        try {
            const el = document.createElement('div');
            el.textContent = text;
            el.style.position = 'fixed';
            el.style.top = '20px';
            el.style.left = '50%';
            el.style.transform = 'translateX(-50%)';
            el.style.padding = '10px 16px';
            el.style.background = 'rgba(0,0,0,0.7)';
            el.style.color = '#fff';
            el.style.border = '1px solid #33ffcc';
            el.style.borderRadius = '8px';
            el.style.zIndex = 9999;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1800);
        } catch {}
    }

    // Top-center, subtle tip used for onboarding and short guidance
    showTopTip(text) {
        try {
            if (this.enableTips === false) return; // tips disabled
            const el = document.createElement('div');
            el.textContent = text;
            el.style.position = 'fixed';
            el.style.top = '14px';
            el.style.left = '50%';
            el.style.transform = 'translateX(-50%)';
            el.style.padding = '8px 12px';
            el.style.background = 'rgba(2,6,23,0.85)';
            el.style.color = '#e2e8f0';
            el.style.border = '1px solid rgba(148,163,184,0.35)';
            el.style.borderRadius = '10px';
            el.style.boxShadow = '0 0 14px rgba(148,163,184,0.25)';
            el.style.fontWeight = '600';
            el.style.pointerEvents = 'none';
            el.style.zIndex = 20050; // above in-game HUD/menus
            document.body.appendChild(el);
            setTimeout(() => { try { el.remove(); } catch(_){} }, 2000);
        } catch {}
    }

    showHintToast(message) {
        try {
            const hintToast = document.getElementById('hintToast');
            if (!hintToast) return;
            
            // Update message text
            const hintToastText = document.getElementById('hintToastText');
            if (hintToastText) {
                hintToastText.textContent = message || 'New power-up active!';
            }
            
            // Remove animation class and re-apply it to trigger animation
            hintToast.classList.remove('hint-toast');
            // Force reflow to trigger animation
            void hintToast.offsetWidth;
            hintToast.classList.add('hint-toast');
        } catch {}
    }

    // --- Electro Shock Generator ---
    updateElectroGen(dt) {
        if (!this.player || !this.electroGen) return;
        const g = this.electroGen;
        const range = Math.floor((g.range || 520) * (this.elecRangeMul || 1));
        const fireDelay = Math.max(120, Math.floor((g.fireDelay || 1500) * (this.elecFireRateMul || 1)));

        // helper: create jagged arc points
        const makeJagged = (from, to) => {
            const segs = 9; // slightly more segments for richer look
            const points = [from.clone()];
            for (let i = 1; i < segs; i++) {
                const t = i / segs;
                const px = from.x + (to.x - from.x) * t;
                const py = from.y + (to.y - from.y) * t;
                const nx = to.y - from.y; // perpendicular for jitter
                const ny = -(to.x - from.x);
                const nlen = Math.max(1, Math.hypot(nx, ny));
                const j = (Math.random() - 0.5) * 14; // jitter amount
                points.push(new Vector2(px + (nx / nlen) * j, py + (ny / nlen) * j));
            }
            points.push(to.clone());
            return points;
        };

        // multi-node support (preferred)
        if (Array.isArray(g.nodes) && g.nodes.length) {
            this._electroArcs = this._electroArcs || [];
            for (const n of g.nodes) {
                n.angle = (n.angle || 0) + (g.angVel || 2.6) * (dt/1000);
                const pos = new Vector2(
                    this.player.pos.x + Math.cos(n.angle) * (g.orbitR || 48),
                    this.player.pos.y + Math.sin(n.angle) * (g.orbitR || 48)
                );
                n.pos = pos;
                n.cooldown = (n.cooldown || 0) - dt;
                if (n.cooldown <= 0 && this.aiBots && this.aiBots.length) {
                    let targets = this.aiBots.slice();
                    let chainLeft = (g.chain||0) + 1 + (this.elecChainBonus||0);
                    let from = pos.clone();
                    let base = (this.weaponDamage != null ? this.weaponDamage : 15) + (this.baseDmgFlat||0);
                    let dmg = base * (g.dmgMult || 0.6) * (this.elecDmgMul || 1);
                    while (chainLeft > 0 && targets.length > 0) {
                        let best = null; let bestD = Infinity; let bestIdx = -1;
                        for (let i=0;i<targets.length;i++) {
                            const b = targets[i];
                            const d = from.minusNew(b.pos).magnitude();
                            if (d < bestD && d <= range) { best = b; bestD = d; bestIdx = i; }
                        }
                        if (!best) break;
                        if (best.hp != null) best.hp -= dmg;
                        best._stunTimer = Math.max(best._stunTimer||0, (g.stunMs||150));
                        // jagged points for electric feel
                        const pts = makeJagged(from, best.pos);
                        const arc = { points: pts, life: 140, width: 2.2 };
                        this._electroArcs.push(arc);
                        // spawn a few traveling sparks along this arc
                        this._electroSparks = this._electroSparks || [];
                        const sparkCount = 3 + Math.floor(Math.random()*2);
                        for (let s=0; s<sparkCount; s++) {
                            this._electroSparks.push({ path: pts, t: 0, vt: 0.0016 + Math.random()*0.0012, life: 180 + Math.random()*120 });
                        }
                        from = best.pos.clone();
                        targets.splice(bestIdx,1);
                        chainLeft--;
                        dmg *= 0.8;
                    }
                    n.cooldown = fireDelay;
                }
            }
        } else {
            // backward compatibility: single orb
            g.angle = (g.angle || 0) + (g.angVel || 2.6) * (dt/1000);
            const pos = new Vector2(
                this.player.pos.x + Math.cos(g.angle) * (g.orbitR || 48),
                this.player.pos.y + Math.sin(g.angle) * (g.orbitR || 48)
            );
            g.pos = pos;
            g.cooldown = (g.cooldown||0) - dt;
            if (g.cooldown <= 0 && this.aiBots && this.aiBots.length) {
                let targets = this.aiBots.slice();
                let chainLeft = (g.chain||0) + 1 + (this.elecChainBonus||0);
                let from = pos.clone();
                let dmg = (this.weaponDamage != null ? this.weaponDamage : 15) * (g.dmgMult || 0.6) * (this.elecDmgMul || 1);
                this._electroArcs = this._electroArcs || [];
                while (chainLeft > 0 && targets.length > 0) {
                    let best = null; let bestD = Infinity; let bestIdx = -1;
                    for (let i=0;i<targets.length;i++) {
                        const b = targets[i];
                        const d = from.minusNew(b.pos).magnitude();
                        if (d < bestD && d <= range) { best = b; bestD = d; bestIdx = i; }
                    }
                    if (!best) break;
                    if (best.hp != null) best.hp -= dmg;
                    best._stunTimer = Math.max(best._stunTimer||0, (g.stunMs||150));
                    const pts = makeJagged(from, best.pos);
                    const arc = { points: pts, life: 140, width: 2.2 };
                    this._electroArcs.push(arc);
                    // traveling sparks along the arc
                    this._electroSparks = this._electroSparks || [];
                    const sparkCount = 3 + Math.floor(Math.random()*2);
                    for (let s=0; s<sparkCount; s++) {
                        this._electroSparks.push({ path: pts, t: 0, vt: 0.0016 + Math.random()*0.0012, life: 180 + Math.random()*120 });
                    }
                    from = best.pos.clone();
                    targets.splice(bestIdx,1);
                    chainLeft--;
                    dmg *= 0.8;
                }
                g.cooldown = fireDelay;
            }
        }
        // decay arcs
        if (this._electroArcs) this._electroArcs = this._electroArcs.filter(a => (a.life-=dt) > 0);
        // update sparks traveling along arcs
        if (this._electroSparks) {
            for (const sp of this._electroSparks) {
                sp.t += sp.vt * dt;
                sp.life -= dt;
            }
            this._electroSparks = this._electroSparks.filter(sp => sp.life > 0 && sp.t <= 1.02);
        }
    }
    drawElectroGen() {
        if (!this.electroGen) return;
        const g = this.electroGen;
        this.ctx.save();
        const prevComp = this.ctx.globalCompositeOperation;
        this.ctx.globalCompositeOperation = 'lighter'; // additive glow for electric
        // draw orbs with pulse and faint trail
        g._pulseT = (g._pulseT||0) + 0.016;
        const pulse = 1 + 0.12 * Math.sin(g._pulseT * 6.0);
        const drawOrb = (worldPos, idx=0) => {
            const p = this.worldToScreen(worldPos);
            // faint trail
            if (!g._trail) g._trail = [];
            const tr = g._trail[idx] = g._trail[idx] || [];
            tr.push({x:p.x, y:p.y, life:220});
            while (tr.length > 12) tr.shift();
            for (let i=0;i<tr.length;i++) {
                const t = tr[i];
                t.life -= 16; // approximate per-frame
                const alpha = Math.max(0, t.life/220) * 0.35;
                this.ctx.fillStyle = `rgba(120,170,255,${alpha})`;
                this.ctx.beginPath(); this.ctx.arc(t.x, t.y, 6, 0, Math.PI*2); this.ctx.fill();
            }
            // core glow
            const r = 10 * pulse;
            const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r+4);
            grad.addColorStop(0, 'rgba(190,220,255,0.95)');
            grad.addColorStop(1, 'rgba(80,140,255,0.0)');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, r+4, 0, Math.PI*2); this.ctx.fill();
            // inner ring
            this.ctx.strokeStyle = 'rgba(170,210,255,0.95)';
            this.ctx.lineWidth = 1.6;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 6.2*pulse, 0, Math.PI*2); this.ctx.stroke();
        };
        if (Array.isArray(g.nodes) && g.nodes.length) {
            for (let i=0;i<g.nodes.length;i++) { const n = g.nodes[i]; if (n && n.pos) drawOrb(n.pos, i); }
        } else if (g.pos) {
            drawOrb(g.pos, 0);
        }
        // draw arcs (jagged polyline)
        if (this._electroArcs && this._electroArcs.length) {
            for (const a of this._electroArcs) {
                if (!(a.points && a.points.length)) continue;
                // outer glow pass
                this.ctx.strokeStyle = 'rgba(100,180,255,0.35)';
                this.ctx.lineWidth = (a.width||2) + 4;
                this.ctx.beginPath();
                let first = this.worldToScreen(a.points[0]);
                this.ctx.moveTo(first.x, first.y);
                for (let i=1;i<a.points.length;i++) {
                    const sp = this.worldToScreen(a.points[i]);
                    this.ctx.lineTo(sp.x, sp.y);
                }
                this.ctx.stroke();
                // core pass
                this.ctx.strokeStyle = 'rgba(200,240,255,0.95)';
                this.ctx.lineWidth = (a.width||2);
                this.ctx.beginPath();
                first = this.worldToScreen(a.points[0]);
                this.ctx.moveTo(first.x, first.y);
                for (let i=1;i<a.points.length;i++) {
                    const sp = this.worldToScreen(a.points[i]);
                    this.ctx.lineTo(sp.x, sp.y);
                }
                this.ctx.stroke();
                // quick branching forks (render-time)
                for (let i=1;i<a.points.length-1;i+=2) {
                    if (Math.random() < 0.35) {
                        const base = a.points[i];
                        const next = a.points[i+1];
                        const dir = new Vector2(next.x-base.x, next.y-base.y).normalise();
                        const perp = new Vector2(-dir.y, dir.x);
                        const len = 16 + Math.random()*24;
                        const end = new Vector2(base.x + dir.x*len*0.7 + perp.x*len*0.3*(Math.random()<0.5?1:-1), base.y + dir.y*len*0.7 + perp.y*len*0.3*(Math.random()<0.5?1:-1));
                        const s0 = this.worldToScreen(base);
                        const s1 = this.worldToScreen(end);
                        this.ctx.strokeStyle = 'rgba(170,220,255,0.8)';
                        this.ctx.lineWidth = 1.2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(s0.x, s0.y);
                        this.ctx.lineTo(s1.x, s1.y);
                        this.ctx.stroke();
                    }
                }
            }
        }
        // traveling sparks
        if (this._electroSparks && this._electroSparks.length) {
            for (const sp of this._electroSparks) {
                const pts = sp.path;
                if (!(pts && pts.length>=2)) continue;
                // map t in [0,1] to polyline position
                const segCount = pts.length - 1;
                const ft = Math.min(0.999, Math.max(0, sp.t));
                const idxF = ft * segCount;
                const i0 = Math.min(segCount-1, Math.floor(idxF));
                const lt = idxF - i0;
                const a = pts[i0];
                const b = pts[i0+1];
                const x = a.x + (b.x - a.x) * lt;
                const y = a.y + (b.y - a.y) * lt;
                const s = this.worldToScreen(new Vector2(x,y));
                const alpha = Math.max(0, Math.min(1, sp.life/220));
                this.ctx.fillStyle = `rgba(220,250,255,${0.8*alpha})`;
                this.ctx.beginPath(); this.ctx.arc(s.x, s.y, 2.2, 0, Math.PI*2); this.ctx.fill();
            }
        }
        this.ctx.globalCompositeOperation = prevComp;
        this.ctx.restore();
    }

    // --- Gravity Orb (reworked smooth pull + falloff damage) ---
    updateGravityOrb(dt) {
        if (!this.player || !this.gravityOrb) return;
        const g = this.gravityOrb;
        // anchor near player
        g.pos = this.player.pos.plusNew(g.offset || new Vector2(30,-12));
        g.cooldown = (g.cooldown||0) - dt;
        const effPeriod = Math.max(300, Math.floor((g.period||2600) * (this.gravPeriodMul||1)));
        if (!g.active && g.cooldown <= 0) { g.active = true; g.activeMs = (g.duration||650); g.cooldown = effPeriod; }
        if (g.active) {
            g.activeMs -= dt;
            // pulling phase: acceleration-based, stronger near center, bosses resist
            if (this.aiBots && this.aiBots.length) {
                for (const b of this.aiBots) {
                    const to = g.pos.minusNew(b.pos);
                    const d = to.magnitude();
                    const R = Math.floor((g.radius||220) * (this.gravRadiusMul||1));
                    if (d <= R && d > 1e-3) {
                        const dir = new Vector2(to.x / d, to.y / d);
                        const fall = Math.max(0, 1 - d/R); // 0..1
                        const accel = (g.pullAccel||900) * fall * fall; // quadratic falloff
                        const bossScale = (b.isBoss ? (g.bossPullScale||0.35) : 1);
                        // apply to velocity
                        const dv = dir.multiplyNew((accel * bossScale) * (dt/1000));
                        if (!b.velocity) b.velocity = new Vector2(0,0);
                        // cap pull contribution
                        const add = dv;
                        // approximate cap by limiting per-frame displacement from pull
                        const cap = (g.maxPullSpeed||280) * (dt/1000);
                        const addLen = Math.sqrt(add.x*add.x + add.y*add.y);
                        const scale = addLen > cap ? (cap / (addLen||1)) : 1;
                        b.velocity.plusEq(new Vector2(add.x*scale, add.y*scale));
                        // small positional nudge to make effect visible
                        b.pos.plusEq(dir.multiplyNew(0.15 * cap));
                    }
                }
            }
            // Inner DOT during pull
            try {
                g._dotAcc = (g._dotAcc||0) + dt;
                const tickEvery = Math.max(60, g.dotTickMs||120);
                if (g._dotAcc >= tickEvery) {
                    g._dotAcc = 0;
                    const base = (this.weaponDamage != null ? this.weaponDamage : 15) * (g.dotDmgMul||0.15);
                    const inner = (g.innerRadius||120);
                    for (const b of (this.aiBots||[])){
                        const d = g.pos.minusNew(b.pos).magnitude();
                        if (d <= inner) {
                            if (b.hp != null) b.hp -= base;
                        }
                    }
                }
            } catch(_){}
            if (g.activeMs <= 0) {
                // explosion at end of pull: damage with distance falloff + slow
                if (this.aiBots && this.aiBots.length) {
                    for (const b of this.aiBots) {
                        const d = g.pos.minusNew(b.pos).magnitude();
                        const R = (g.radius||220);
                        if (d <= R) {
                            const base = (this.weaponDamage != null ? this.weaponDamage : 15) * (g.dmgMult||0.8);
                            const fall = 0.4 + 0.6 * Math.max(0, 1 - d/R); // 0.4x edge .. 1.0x center
                            const dmg = base * fall;
                            if (b.hp != null) b.hp -= dmg;
                            b._slowTimer = Math.max(b._slowTimer||0, g.slowMs||1200);
                        }
                    }
                    // emit shrapnel towards nearest targets
                    try{
                        const count = Math.max(0, g.shrapnelCount|0);
                        if (count > 0) {
                            const R = (g.radius||220);
                            const candidates = (this.aiBots||[])
                              .map(b=>({ b, d: g.pos.minusNew(b.pos).magnitude() }))
                              .filter(o=> o.d <= R)
                              .sort((a,b)=> a.d - b.d)
                              .slice(0, count);
                            const base = (this.weaponDamage != null ? this.weaponDamage : 15);
                            const speed = g.shrapnelSpeed || 520;
                            const dmg = Math.max(1, Math.floor(base * (g.shrapnelDmgMul||0.6)));
                            for (const o of candidates){
                                const dir = new Vector2(o.b.pos.x - g.pos.x, o.b.pos.y - g.pos.y);
                                const m = Math.max(1e-3, Math.sqrt(dir.x*dir.x + dir.y*dir.y));
                                const nd = new Vector2(dir.x/m, dir.y/m);
                                const vel = nd.multiplyNew(speed * (this.projectileSpeedMult || 1));
                                const spawn = g.pos.plusNew(nd.multiplyNew(12));
                                const proj = new Projectile(spawn, vel, this.player, { damage: dmg });
                                this.projectiles.push(proj);
                            }
                        }
                    }catch(_){}
                }
                g.active = false;
            }
        }
    }
    drawGravityOrb() {
        if (!this.gravityOrb || !this.gravityOrb.pos) return;
        const g = this.gravityOrb; const p = this.worldToScreen(g.pos);
        // Resolve selected gravity skin
        let gravSkin = this._cachedGravSkin;
        try {
            if (!gravSkin || gravSkin.__ts == null || (Date.now() - gravSkin.__ts) > 1500) {
                const raw = localStorage.getItem('glowlings_selected_weapon_skin_gravity');
                if (raw) {
                    const s = JSON.parse(raw);
                    if (s && s.type === 'gravity') gravSkin = { ...s, __ts: Date.now() };
                }
                this._cachedGravSkin = gravSkin;
            }
        } catch(_) {}
        const ringColor = (gravSkin && (gravSkin.ring || (gravSkin.colors && gravSkin.colors[0]))) || '#60a5fa';
        // Try to draw raster identical to shop
        let drew = false;
        try {
            if (gravSkin && this.buildWeaponSkinSVG && this.rasterizeSVG) {
                const key = `grav_${gravSkin.id}`;
                const svg = this.buildWeaponSkinSVG('gravity', gravSkin, Date.now());
                const img = this.rasterizeSVG(svg, key);
                if (img && img.complete && img.naturalWidth > 0) {
                    const targetW = 68; // visibility scale
                    const scale = targetW / Math.max(1, img.naturalWidth);
                    const w = img.naturalWidth * scale;
                    const h = img.naturalHeight * scale;
                    this.ctx.save();
                    this.ctx.translate(p.x, p.y);
                    this.ctx.drawImage(img, -w*0.5, -h*0.5, w, h);
                    this.ctx.restore();
                    drew = true;
                }
            }
        } catch(_) {}
        if (!drew) {
            // Fallback simple core
            this.ctx.save();
            this.ctx.fillStyle = ringColor;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 8, 0, Math.PI*2); this.ctx.fill();
            this.ctx.restore();
        }
        // Active pull radius ring using skin color
        if (g.active) {
            this.ctx.save();
            this.ctx.strokeStyle = ringColor + '66';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([8,6]);
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, (g.radius||250), 0, Math.PI*2); this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.restore();
        }
    }


    rerollShop() {
        if (this.shopLocked) return;
        if (this.materials < this.rerollCost) {
            const btn = document.getElementById('rerollBtn');
            if (btn) {
                const old = btn.style.borderColor;
                btn.style.borderColor = '#ef4444';
                setTimeout(()=>{ btn.style.borderColor = old || ''; }, 300);
            }
            // SFX: cannot afford
            this.playError();
            return;
        }
        this.materials -= this.rerollCost;
        this.refreshShopItems();
        this.updateShopCounters();
        const rerollBtn = document.getElementById('rerollBtn');
        if (rerollBtn) rerollBtn.textContent = `Reroll (${this.rerollCost})`;
        // SFX
        this.playReroll();
    }

    purchaseItem(index) {
        if (!this.currentOffers || !this.currentOffers[index]) return;
        const offer = this.currentOffers[index];
        // Enforce one purchase per intermission (but allow special all-money offers to bypass)
        if (this.purchaseUsedForWave && !this.inWave && !offer.allMoney) {
            // Visual feedback
            try {
                const btn = document.getElementById(`shopItem${(index|0)+1}`);
                if (btn) {
                    const old = btn.style.borderColor;
                    btn.style.borderColor = '#ef4444';
                    setTimeout(()=>{ btn.style.borderColor = old || ''; }, 400);
                }
            } catch(_) {}
            this.showToast && this.showToast('Bu dalgada zaten satın aldın');
            this.playError && this.playError();
            return;
        }
        
        let effectiveCost;
        if (offer.allMoney) {
            effectiveCost = this.materials; // spend everything if allowed
        } else {
            const baseCost = offer.cost;
            // Only allow a single free purchase in the very first shop (pre-wave-1)
            effectiveCost = (this.waveNumber === 0 && !this.usedFreeSkill) ? 0 : this.getScaledCost(baseCost);
        }
        // Special rule: all-money items require at least 10 materials
        if (offer.allMoney && this.materials < 10) {
            const btnId = `shopItem${index+1}`;
            const btn = document.getElementById(btnId);
            if (btn) {
                const oldBorder = btn.style.borderColor;
                btn.style.borderColor = '#ef4444';
                setTimeout(()=>{ btn.style.borderColor = oldBorder || ''; }, 500);
            }
            this.playError();
            return;
        }
        if (!offer.allMoney && this.materials < effectiveCost) {
            const btnId = `shopItem${index+1}`;
            const btn = document.getElementById(btnId);
            if (btn) {
                const oldBorder = btn.style.borderColor;
                btn.style.borderColor = '#ef4444';
                setTimeout(()=>{ btn.style.borderColor = oldBorder || ''; }, 500);
            }
            // SFX: cannot afford
            this.playError();
            return;
        }
        if (offer.allMoney) {
            // spend all
            this.materials = 0;
        } else {
            this.materials -= effectiveCost;
        }
        // Apply effect
        if (typeof offer.apply === 'function') offer.apply();
        // Mark that the single free purchase has been used if we just consumed it
        if (effectiveCost === 0 && !offer.allMoney) {
            this.usedFreeSkill = true;
        }
        // Mark purchase used for this intermission (do not consume for all-money offers)
        if (!offer.allMoney) {
            this.purchaseUsedForWave = true;
        }
        this.updateShopCounters();
        // Refresh to update disabled states
        this.refreshShopItems();
        // SFX: purchase success
        this.playPurchase(true);
    }
}
GlowlingsGame.prototype.createAIBots = function() {
    const botNames = ['Nova', 'Pulsar', 'Quark', 'Neon', 'Blaze', 'Frost', 'Zephyr', 'Ion', 'Flux', 'Aura', 'Spark', 'Vapor', 'Storm', 'Drift', 'Echo'];
    const elements = ['fire', 'water', 'air'];
    this.aiBots = [];
    for (let i = 0; i < 12; i++) {
        const name = botNames[i % botNames.length] + (i % 3);
        const element = elements[i % elements.length];
        const color = this.getRandomNeonColor();
        const shape = ['circle','triangle','star'][i % 3];
        const z = this.playZone || { x:0, y:0, width:this.worldSize.width, height:this.worldSize.height };
        const pos = new Vector2(
            z.x + Math.random() * z.width,
            z.y + Math.random() * z.height
        );
        const bot = new AIBot(name, pos, element, color, shape);
        // Match spawn rules: sizes 15/19 only and HP 2x/6x base projectile damage
        const baseProjectileDmg = (this.weaponDamage != null) ? this.weaponDamage : 12;
        const isBig = bot.size === 19;
        bot.size = isBig ? 19 : 15;
        bot.maxHP = isBig ? baseProjectileDmg * 6 : baseProjectileDmg * 2;
        bot.hp = bot.maxHP;
        this.aiBots.push(bot);
    }
    // keep compatibility alias
    this.aiPlayers = this.aiBots;
};

GlowlingsGame.prototype.createTowers = function() {
    this.towers = [];
    const placements = [
        new Vector2(2500, 2500),
        new Vector2(this.worldSize.width - 2500, 2500),
        new Vector2(2500, this.worldSize.height - 2500),
        new Vector2(this.worldSize.width - 2500, this.worldSize.height - 2500),
        new Vector2(this.worldSize.width/2, this.worldSize.height/2)
    ];
    placements.forEach(p => this.towers.push(new Tower(p)));
};

class AIBot {
    constructor(name, pos, element, color, shape) {
        this.name = name;
        this.pos = pos;
        this.velocity = new Vector2(0, 0);
        // Only two sizes: 15 (2-hit) and 19 (4-hit). ~16.7% chance (2 in 12) for big.
        this.size = (Math.random() < (2/12)) ? 19 : 15;
        this.element = element;
        this.color = color;
        this.shape = shape;
        this.state = 'wandering'; // wandering, hunting, fleeing
        this.score = 0;
        this.targetDir = new Vector2(Math.random()-0.5, Math.random()-0.5).normalise();
        this.changeDirAt = Date.now() + 1000 + Math.random()*2000;
        this.slowedUntil = 0;
        this.slowFactor = 1;
        this.nameTagTimer = 0;
        // Health
        this.maxHP = 100;
        this.hp = this.maxHP;
        // Shooting
        this.shootCooldown = 500 + Math.random()*400; // ms
        this.isRanged = false;
        this.meleeCooldown = 0;
        // Stuck detection
        this._lastPos = pos.clone();
        this._stuckAccum = 0; // ms accumulated near-edge with tiny movement
        this.spawnedAt = Date.now();
        this._lastCornerEscapeAt = 0;
        this._avoidCornerUntil = 0;
    }
    getSpeed() {
        // Moderate baseline; large bots slow down a bit more to reduce early overwhelm
        const base = Math.max(50, 140 - this.size * 1.8);
        // Global +50% speed-up
        let s = base * 1.5;
        // Apply requested bot-only slow: -20%
        s *= 0.8;
        // Per-type multiplier (rush/tank/elite)
        if (this.speedMult && this.speedMult !== 1) s *= this.speedMult;
        if (this.slowedUntil && Date.now() < this.slowedUntil) s *= this.slowFactor;
        return s;
    }
    update(game, dt) {
        const now = Date.now();
        // Wave 10 boss: keep distance from player (standoff + orbit)
        if (this.isBoss && game.waveNumber === 10 && game.player) {
            const toPlayer = game.player.pos.minusNew(this.pos);
            const d = Math.max(1e-3, toPlayer.magnitude());
            const dirTo = toPlayer.divideNew(d);
            const desired = 280;      // target separation
            const minDist = 220;      // back off if closer than this
            const maxDist = 360;      // approach if farther than this
            let moveDir;
            if (d < minDist) {
                // Too close -> back off
                moveDir = new Vector2(-dirTo.x, -dirTo.y);
            } else if (d > maxDist) {
                // Too far -> approach
                moveDir = dirTo.clone();
            } else {
                // In band -> orbit around player (perpendicular)
                // Choose direction for smoother motion
                const perp = new Vector2(-dirTo.y, dirTo.x);
                moveDir = perp;
            }
            // Boss feels weighty: slower, but steady
            const base = Math.max(50, 130 - this.size * 1.5);
            const speed = base * 1.2; // modest speed
            this.velocity = moveDir.multiplyNew(speed);
            this.pos.plusEq(this.velocity.multiplyNew(dt/1000));
            // keep inside play area (playZone if defined, else worldSize)
            {
                const z = game.playZone || { x:0, y:0, width:game.worldSize.width, height:game.worldSize.height };
                const beforeX = this.pos.x, beforeY = this.pos.y;
                const minX = z.x + this.size, maxX = z.x + z.width - this.size;
                const minY = z.y + this.size, maxY = z.y + z.height - this.size;
                this.pos.x = Math.max(minX, Math.min(maxX, this.pos.x));
                this.pos.y = Math.max(minY, Math.min(maxY, this.pos.y));
                // If clamped, damp outward velocity to avoid pushing into wall
                if (this.pos.x === minX && this.velocity.x < 0) this.velocity.x *= -0.3;
                if (this.pos.x === maxX && this.velocity.x > 0) this.velocity.x *= -0.3;
                if (this.pos.y === minY && this.velocity.y < 0) this.velocity.y *= -0.3;
                if (this.pos.y === maxY && this.velocity.y > 0) this.velocity.y *= -0.3;
                // Stuck detection: if near edge and moved very little, accumulate time; then nudge inward
                const m = Math.max(18, (this.size||15) + 6);
                const nearEdge = (this.pos.x <= z.x + m) || (this.pos.x >= z.x + z.width - m) || (this.pos.y <= z.y + m) || (this.pos.y >= z.y + z.height - m);
                const moved = this.pos.minusNew(this._lastPos).magnitude();
                if (nearEdge && moved < 0.6) {
                    this._stuckAccum += dt;
                } else {
                    this._stuckAccum = Math.max(0, this._stuckAccum - dt*0.5);
                }
                if (this._stuckAccum > 600) {
                    // Nudge toward center and add jitter to break symmetry
                    const cx = z.x + z.width * 0.5, cy = z.y + z.height * 0.5;
                    const toC = new Vector2(cx - this.pos.x, cy - this.pos.y).normalise();
                    const jitter = new Vector2((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6);
                    this.targetDir = new Vector2(toC.x + jitter.x, toC.y + jitter.y).normalise();
                    this.pos.x = Math.max(minX+2, Math.min(maxX-2, this.pos.x + toC.x * 3));
                    this.pos.y = Math.max(minY+2, Math.min(maxY-2, this.pos.y + toC.y * 3));
                    this._stuckAccum = 0;
                }
                this._lastPos = this.pos.clone();
            }
            // Handle melee (reused logic, but less aggressive since we maintain distance)
            this.shootCooldown -= dt;
            this.meleeCooldown -= dt;
            // Only allow melee if still manages to get close
            if (d < 28 && this.meleeCooldown <= 0) {
                if (game.player.spawnProtectedUntil && Date.now() < game.player.spawnProtectedUntil) {
                    this.meleeCooldown = 200;
                } else {
                    let dmg = 8;
                    const armor = game.player.armor || 0;
                    if (armor > 0) dmg = Math.max(1, dmg - armor);
                    const maxHP = game.player.maxHP || 100;
                    game.player.hp = Math.max(0, (game.player.hp != null ? game.player.hp : maxHP) - dmg);
                    game.playPlayerHurt();
                    if (game.player.hp <= 0) game.onPlayerKilled(game.player.pos.clone());
                    this.meleeCooldown = 600;
                }
            }
            return; // handled boss behavior for wave 10
        }
        if (game.gameMode === 'brotato' && game.player) {
            // Always focus player
            const toPlayer = game.player.pos.minusNew(this.pos);
            this.targetDir = toPlayer.normalise();
            // Wave-scaled chase boost: starts mild, ramps with wave
            const wave = Math.max(1, game.waveNumber || 1);
            const chaseMult = 1 + Math.min(0.20, (wave - 1) * 0.01); // up to +20%
            let speed = this.getSpeed() * chaseMult;
            // If center focus is disabled, skip all inward/center steering and corner-eject logic
            let suppressRole = false;
            if (!game.disableCenterFocus) {
                // Forced inward lock right after spawn to prevent wall-sliding into corners
                try {
                    if (this._forceInwardUntil && Date.now() < this._forceInwardUntil) {
                        const z = game.playZone || { x:0, y:0, width:game.worldSize.width, height:game.worldSize.height };
                        const center = (this._inwardCenter && this._inwardCenter.x != null) ? this._inwardCenter : (game.player ? game.player.pos : new Vector2(z.x + z.width*0.5, z.y + z.height*0.5));
                        const toC = center.minusNew(this.pos).normalise();
                        this.targetDir = toC;
                        // Remove any outward components close to edges
                        const m2 = Math.max(28, (this.size||15) + 12);
                        if (this.pos.x < z.x + m2 && this.targetDir.x < 0) this.targetDir.x = 0;
                        if (this.pos.x > z.x + z.width - m2 && this.targetDir.x > 0) this.targetDir.x = 0;
                        if (this.pos.y < z.y + m2 && this.targetDir.y < 0) this.targetDir.y = 0;
                        if (this.pos.y > z.y + z.height - m2 && this.targetDir.y > 0) this.targetDir.y = 0;
                        // Re-normalize; if zeroed (corner), fallback to center direction
                        let mag = Math.hypot(this.targetDir.x, this.targetDir.y);
                        if (mag < 1e-3) {
                            const toC2 = center.minusNew(this.pos).normalise();
                            this.targetDir = toC2;
                        } else {
                            this.targetDir.x /= mag; this.targetDir.y /= mag;
                        }
                    }
                } catch {}
                // Early post-spawn and near-wall strong inward steering
                try {
                    const z = game.playZone || { x:0, y:0, width:game.worldSize.width, height:game.worldSize.height };
                    const cx = z.x + z.width * 0.5, cy = z.y + z.height * 0.5;
                    const toC = new Vector2(cx - this.pos.x, cy - this.pos.y).normalise();
                    const mStrong = Math.max(38, (this.size||15) + 18);
                    const nearV = (this.pos.x < z.x + mStrong) || (this.pos.x > z.x + z.width - mStrong);
                    const nearH = (this.pos.y < z.y + mStrong) || (this.pos.y > z.y + z.height - mStrong);
                    const sinceSpawn = Date.now() - (this.spawnedAt || Date.now());
                    if (nearV || nearH) {
                        this.targetDir = new Vector2(this.targetDir.x * 0.3 + toC.x * 0.7, this.targetDir.y * 0.3 + toC.y * 0.7).normalise();
                    }
                    if (sinceSpawn < 2500) {
                        const dot = this.targetDir.x * toC.x + this.targetDir.y * toC.y;
                        if (dot < 0.25) {
                            this.targetDir = new Vector2(this.targetDir.x * 0.15 + toC.x * 0.85, this.targetDir.y * 0.15 + toC.y * 0.85).normalise();
                            speed *= 1.05;
                        }
                    }
                } catch {}
                // Aggressive early failsafe and corner-eject window
                try {
                    const sinceSpawn = Date.now() - (this.spawnedAt || Date.now());
                    if (sinceSpawn < 2200) {
                        const z = game.playZone || { x:0, y:0, width:game.worldSize.width, height:game.worldSize.height };
                        const mSnap = Math.max(36, (this.size||15) + 16);
                        const cx = z.x + z.width * 0.5, cy = z.y + z.height * 0.5;
                        const toC = new Vector2(cx - this.pos.x, cy - this.pos.y).normalise();
                        let snapped = false;
                        if (this.pos.x < z.x + mSnap) { this.pos.x = z.x + mSnap + 2; snapped = true; }
                        if (this.pos.x > z.x + z.width - mSnap) { this.pos.x = z.x + z.width - mSnap - 2; snapped = true; }
                        if (this.pos.y < z.y + mSnap) { this.pos.y = z.y + mSnap + 2; snapped = true; }
                        if (this.pos.y > z.y + z.height - mSnap) { this.pos.y = z.y + z.height - mSnap - 2; snapped = true; }
                        if (snapped) {
                            this.targetDir = toC;
                            const minNormal = this.getSpeed ? this.getSpeed() * 0.7 : 90;
                            this.velocity = toC.multiplyNew(minNormal);
                            this._cornerEjectUntil = Date.now() + 700;
                        }
                    }
                } catch {}
                // Determine if we should suppress role behaviors while escaping edges
                try {
                    const z = game.playZone || { x:0, y:0, width:game.worldSize.width, height:game.worldSize.height };
                    const sinceSpawn2 = Date.now() - (this.spawnedAt || Date.now());
                    const mBand = Math.max(36, (this.size||15) + 16);
                    const nearWallBand = (this.pos.x < z.x + mBand) || (this.pos.x > z.x + z.width - mBand) || (this.pos.y < z.y + mBand) || (this.pos.y > z.y + z.height - mBand);
                    suppressRole = nearWallBand || sinceSpawn2 < 2200 || (this._cornerEjectUntil && Date.now() < this._cornerEjectUntil);
                    if (suppressRole) {
                        const cx = z.x + z.width * 0.5, cy = z.y + z.height * 0.5;
                        const toC = new Vector2(cx - this.pos.x, cy - this.pos.y).normalise();
                        this.targetDir = toC;
                    }
                } catch {}
            }
            // Shooter evasion dash (after wave 10): occasionally dodge incoming player bullets
            try {
                const canDashRole = (this.role === 'shooter');
                const waveOk = (game.waveNumber || 1) >= 10;
                if (canDashRole && waveOk) {
                    if (this._dashCooldown == null) this._dashCooldown = 0;
                    if (this._dashUntil && Date.now() < this._dashUntil) {
                        // During dash: override steering with stored dash dir and speed boost
                        const dashDir = this._dashDir || this.targetDir;
                        this.targetDir = dashDir;
                        // Increase speed during dash; stronger after wave 11
                        try {
                            const w = Math.max(1, game.waveNumber || 1);
                            const dashMul = (w >= 11) ? 2.6 : 2.0;
                            if (typeof speed === 'number') speed *= dashMul;
                        } catch {}
                    } else {
                        // Look for a nearby incoming projectile from the player (or player's turrets)
                        this._dashUntil = 0; // reset flag if expired
                        this._dashDir = null;
                        this._dashCooldown = Math.max(0, this._dashCooldown - dt);
                        if (this._dashCooldown <= 0 && Array.isArray(game.projectiles)) {
                            const nowT = Date.now();
                            const w = Math.max(1, game.waveNumber || 1);
                            const dangerRadius = (w >= 11) ? 300 : 230;
                            let dangerProj = null;
                            for (let i = 0; i < game.projectiles.length; i++) {
                                const p = game.projectiles[i];
                                if (!p || !p.pos || !p.vel) continue;
                                // owner is player or from turret
                                if (!(p.owner === game.player || p.fromTurret)) continue;
                                const toMe = this.pos.minusNew(p.pos);
                                const dist = toMe.magnitude();
                                if (dist > dangerRadius) continue;
                                const v = p.vel;
                                const vMag = Math.hypot(v.x, v.y) || 1;
                                const dir = new Vector2(v.x / vMag, v.y / vMag);
                                // If projectile is heading towards us: dot(toMe, v) < 0 means approaching
                                const approaching = (toMe.x * dir.x + toMe.y * dir.y) < -0.2;
                                if (!approaching) continue;
                                dangerProj = p; break;
                            }
                            if (dangerProj) {
                                const w2 = Math.max(1, game.waveNumber || 1);
                                const chance = (w2 >= 11) ? 0.50 : 0.28;
                                if (Math.random() < chance) {
                                // Perpendicular dash away from projectile path, choose side away from player if possible
                                const v = dangerProj.vel;
                                const vMag = Math.hypot(v.x, v.y) || 1;
                                const fwd = new Vector2(v.x / vMag, v.y / vMag);
                                let left = new Vector2(-fwd.y, fwd.x);
                                let right = new Vector2(fwd.y, -fwd.x);
                                if (game.player) {
                                    const toPlayer = game.player.pos.minusNew(this.pos);
                                    // Prefer the side that increases distance to player (kiting feel)
                                    const leftAway = (left.x * toPlayer.x + left.y * toPlayer.y) < 0;
                                    this._dashDir = leftAway ? left : right;
                                } else {
                                    this._dashDir = (Math.random() < 0.5) ? left : right;
                                }
                                const dur = (w2 >= 11) ? 280 : 200;
                                this._dashUntil = Date.now() + dur; // short dash window
                                const base = (w2 >= 11) ? 1600 : 2200;
                                const span = (w2 >= 11) ? 800 : 1200;
                                this._dashCooldown = base + Math.random() * span; // shorter cooldown after 11
                                }
                            }
                        }
                    }
                }
            } catch {}
            // Distance-keeping (kiting/spacing) disabled for all bots as requested
            // Ranged attack for shooter-type enemies (suppressed during edge escape)
            try {
                if (!suppressRole && this.isRanged && game.player) {
                    // Strategic attack windows for wave >= 11: cycle ATTACK -> PAUSE -> ATTACK ...
                    try {
                        const w = Math.max(1, game.waveNumber || 1);
                        if (w >= 11) {
                            if (this._attackPhaseUntil == null) this._attackPhaseUntil = 0;
                            if (!this._attackPhase || Date.now() > this._attackPhaseUntil) {
                                // toggle phase
                                if (this._attackPhase === 'attack') {
                                    this._attackPhase = 'pause';
                                    // pause 1000–1600ms
                                    this._attackPhaseUntil = Date.now() + (1000 + Math.random()*600);
                                } else {
                                    this._attackPhase = 'attack';
                                    // attack 1600–2200ms
                                    this._attackPhaseUntil = Date.now() + (1600 + Math.random()*600);
                                    // optional: small aim bias reset could happen here
                                }
                            }
                        } else {
                            // pre-11 waves: default to continuous attack phase
                            this._attackPhase = 'attack';
                            this._attackPhaseUntil = Date.now() + 999999;
                        }
                    } catch {}
                    if (this.shootCooldown == null) this.shootCooldown = 400 + Math.random()*300;
                    this.shootCooldown -= dt;
                    const toP = game.player.pos.minusNew(this.pos);
                    const dist = Math.max(1e-3, toP.magnitude());
                    const inRange = dist <= ((this.kiteRange||260) + 100);
                    const canShootPhase = (!this._attackPhase || this._attackPhase === 'attack');
                    if (canShootPhase && this.shootCooldown <= 0 && inRange) {
                        const dir = toP.divideNew(dist);
                        const speedP = 360 * (game.projectileSpeedMult || 1);
                        const baseDmg = (game.weaponDamage != null) ? game.weaponDamage : 12;
                        const wNow = Math.max(1, game.waveNumber || 1);
                        const allowBurst = (wNow >= 11);
                        if (allowBurst && Math.random() < 0.25) {
                            // 2–3 shot burst with small spread
                            const shots = (Math.random() < 0.5) ? 2 : 3;
                            const spread = 0.16;
                            const ang0 = Math.atan2(dir.y, dir.x);
                            if (shots === 2) {
                                for (let i = 0; i < 2; i++) {
                                    const ang = ang0 + (i === 0 ? -spread*0.4 : spread*0.4);
                                    const d = new Vector2(Math.cos(ang), Math.sin(ang));
                                    const spawn = this.pos.plusNew(d.multiplyNew((this.size||15) + 6));
                                    const proj = new Projectile(spawn, d.multiplyNew(speedP), this, { damage: Math.max(1, Math.floor(baseDmg * 0.45)) });
                                    game.projectiles.push(proj);
                                }
                            } else {
                                for (let i = -1; i <= 1; i++) {
                                    const ang = ang0 + i * (spread * 0.5);
                                    const d = new Vector2(Math.cos(ang), Math.sin(ang));
                                    const spawn = this.pos.plusNew(d.multiplyNew((this.size||15) + 6));
                                    const proj = new Projectile(spawn, d.multiplyNew(speedP), this, { damage: Math.max(1, Math.floor(baseDmg * 0.45)) });
                                    game.projectiles.push(proj);
                                }
                            }
                            this.shootCooldown = 1050 + Math.random()*550;
                        } else {
                            // Single shot (waves <= 10 always single)
                            const spawn = this.pos.plusNew(dir.multiplyNew((this.size||15) + 6));
                            const proj = new Projectile(spawn, dir.multiplyNew(speedP), this, { damage: Math.max(1, Math.floor(baseDmg * 0.5)) });
                            game.projectiles.push(proj);
                            this.shootCooldown = 850 + Math.random()*450;
                        }
                    }
                    // Close-range tactical retreat dash disabled to avoid distance-keeping
                }
            } catch {}
            this.velocity = this.targetDir.multiplyNew(speed);
            // Near-wall handling: always prevent outward push AND reduce tangential sliding; add slight inward normal.
            try {
                const z = game.playZone || { x:0, y:0, width:game.worldSize.width, height:game.worldSize.height };
                const m2 = Math.max(24, (this.size||15) + 10);
                const nearLeft = (this.pos.x < z.x + m2);
                const nearRight = (this.pos.x > z.x + z.width - m2);
                const nearTop = (this.pos.y < z.y + m2);
                const nearBottom = (this.pos.y > z.y + z.height - m2);
                // Zero outward component
                if (nearLeft && this.velocity.x < 0) this.velocity.x = 0;
                if (nearRight && this.velocity.x > 0) this.velocity.x = 0;
                if (nearTop && this.velocity.y < 0) this.velocity.y = 0;
                if (nearBottom && this.velocity.y > 0) this.velocity.y = 0;
                // Inject a small inward normal and damp tangential to avoid edge magnet without center bias
                const minNormal = (this.getSpeed ? this.getSpeed() : 120) * 0.25;
                if (nearLeft)  { this.velocity.x = Math.max(this.velocity.x,  minNormal); this.velocity.y *= 0.6; }
                if (nearRight) { this.velocity.x = Math.min(this.velocity.x, -minNormal); this.velocity.y *= 0.6; }
                if (nearTop)   { this.velocity.y = Math.max(this.velocity.y,  minNormal); this.velocity.x *= 0.6; }
                if (nearBottom){ this.velocity.y = Math.min(this.velocity.y, -minNormal); this.velocity.x *= 0.6; }
            } catch {}
            this.pos.plusEq(this.velocity.multiplyNew(dt/1000));
        } else {
            if (now > this.changeDirAt) {
                // Occasionally steer towards player or away
                let bias = new Vector2(Math.random()-0.5, Math.random()-0.5);
                if (game.player) {
                    const toPlayer = game.player.pos.minusNew(this.pos);
                    if (game.player.size > this.size + 6) {
                        // flee
                        bias = new Vector2(-toPlayer.x, -toPlayer.y);
                        this.state = 'fleeing';
                    } else if (game.player.size + 6 < this.size) {
                        // hunt
                        bias = toPlayer;
                        this.state = 'hunting';
                    } else {
                        // neutral -> gently bias toward player to avoid idle gaps (weaker bias)
                        this.state = 'wandering';
                        bias = toPlayer.multiplyNew(0.45);
                    }
                }
                this.targetDir = bias.normalise();
                // Retarget more frequently to feel more reactive
                this.changeDirAt = now + 500 + Math.random()*900;
            }
            // move
            const speed = this.getSpeed();
            this.velocity = this.targetDir.multiplyNew(speed);
            this.pos.plusEq(this.velocity.multiplyNew(dt/1000));
        }
        // keep inside play area (playZone if defined, else worldSize)
        {
            const z = game.playZone || { x:0, y:0, width:game.worldSize.width, height:game.worldSize.height };
            this.pos.x = Math.max(z.x + this.size, Math.min(z.x + z.width - this.size, this.pos.x));
            this.pos.y = Math.max(z.y + this.size, Math.min(z.y + z.height - this.size, this.pos.y));
        }

        // General de-stuck: if bot hugs edges and barely moves, nudge toward center with slight jitter.
        // Also damp outward velocity components when clamped to walls to avoid sliding into corners.
        try {
            const z = game.playZone || { x:0, y:0, width:game.worldSize.width, height:game.worldSize.height };
            const minX = z.x + this.size, maxX = z.x + z.width - this.size;
            const minY = z.y + this.size, maxY = z.y + z.height - this.size;
            // If clamped against walls, damp outward velocity
            if (this.pos.x === minX && this.velocity.x < 0) this.velocity.x *= -0.3;
            if (this.pos.x === maxX && this.velocity.x > 0) this.velocity.x *= -0.3;
            if (this.pos.y === minY && this.velocity.y < 0) this.velocity.y *= -0.3;
            if (this.pos.y === maxY && this.velocity.y > 0) this.velocity.y *= -0.3;

            const m = Math.max(18, (this.size||15) + 6);
            const nearEdge = (this.pos.x <= z.x + m) || (this.pos.x >= z.x + z.width - m)
                          || (this.pos.y <= z.y + m) || (this.pos.y >= z.y + z.height - m);
            const moved = this.pos.minusNew(this._lastPos).magnitude();
            if (nearEdge && moved < 0.6) {
                this._stuckAccum += dt;
            } else {
                this._stuckAccum = Math.max(0, this._stuckAccum - dt*0.5);
            }
            if (this._stuckAccum > 600) {
                // Nudge toward center and add jitter to break symmetry
                const cx = z.x + z.width * 0.5, cy = z.y + z.height * 0.5;
                const toC = new Vector2(cx - this.pos.x, cy - this.pos.y).normalise();
                const jitter = new Vector2((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6);
                this.targetDir = new Vector2(toC.x + jitter.x, toC.y + jitter.y).normalise();
                // If in a deep corner, push stronger
                const nearCorner = (this.pos.x <= z.x + m*0.7 || this.pos.x >= z.x + z.width - m*0.7) && (this.pos.y <= z.y + m*0.7 || this.pos.y >= z.y + z.height - m*0.7);
                const pushAmt = nearCorner ? 10 : 3;
                this.pos.x = Math.max(minX+2, Math.min(maxX-2, this.pos.x + toC.x * pushAmt));
                this.pos.y = Math.max(minY+2, Math.min(maxY-2, this.pos.y + toC.y * pushAmt));
                // Give a tiny temporary inward velocity to break symmetry
                this.velocity = this.targetDir.multiplyNew((this.getSpeed ? this.getSpeed() : 120) * 0.8);
                if (nearCorner) this._cornerEjectUntil = Date.now() + 800;
                this._stuckAccum = 0;
            }
            this._lastPos = this.pos.clone();
        } catch {}

        this.shootCooldown -= dt;
        this.meleeCooldown -= dt;
        // Archetype periodic abilities (no distance-keeping introduced)
        try {
            const w = Math.max(1, game.waveNumber||1);
            // Mutant: roll a random buff every few seconds
            if (this.role === 'mutant') {
                if (!this._mutantNextRoll || Date.now() >= this._mutantNextRoll) {
                    const choices = ['speed','damage','armor'];
                    const pick = choices[Math.floor(Math.random()*choices.length)];
                    this._mutantBuff = pick;
                    this._mutantBuffUntil = Date.now() + 3500;
                    this._mutantNextRoll = Date.now() + (3000 + Math.random()*2000);
                }
                if (this._mutantBuff && Date.now() < (this._mutantBuffUntil||0)) {
                    if (this._mutantBuff === 'speed') this.speedMult = Math.min((this.speedMult||1)*1.15, 1.15*(this.speedMult||1));
                    if (this._mutantBuff === 'damage') this.meleeDmg = Math.max(this.meleeDmg||8, 10);
                    if (this._mutantBuff === 'armor') this.staggerResist = Math.min(0.85, Math.max(0.6, (this.staggerResist||0.6)+0.1));
                }
            }
            // Blood Mage: periodic small AoE pulse around self (waves >= 11)
            if (this.role === 'bloodmage' && w >= 11) {
                this._bloodPulseCd = (this._bloodPulseCd||0) - dt;
                if (this._bloodPulseCd <= 0) {
                    this._bloodPulseCd = 2000 + Math.random()*600;
                    const p = game.player;
                    if (p) {
                        const d = p.pos.minusNew(this.pos).magnitude();
                        if (d < 140) {
                            const armor = p.armor||0;
                            let dmg = 8;
                            if (armor > 0) dmg = Math.max(1, dmg - Math.floor(armor*0.5));
                            const maxHP = p.maxHP||100;
                            p.hp = Math.max(0, (p.hp!=null?p.hp:maxHP) - dmg);
                            game.playPlayerHurt();
                            if (p.hp <= 0) game.onPlayerKilled(p.pos.clone());
                        }
                    }
                }
            }
        } catch {}
        if (game.player) {
            const toPlayer = game.player.pos.minusNew(this.pos);
            const d = toPlayer.magnitude();
            if (game.gameMode === 'brotato') {
                // Melee hit if close
                if (d < 28 && this.meleeCooldown <= 0) {
                    // Ignore damage during spawn protection
                    if (game.player.spawnProtectedUntil && Date.now() < game.player.spawnProtectedUntil) {
                        this.meleeCooldown = 200; // small grace to avoid constant checks
                        return;
                    }
                    // base melee dmg reduced by player armor
                    let dmg = (typeof this.meleeDmg === 'number') ? this.meleeDmg : 8;
                    const armor = game.player.armor || 0;
                    if (armor > 0) dmg = Math.max(1, dmg - armor);
                    const maxHP = game.player.maxHP || 100;
                    game.player.hp = Math.max(0, (game.player.hp != null ? game.player.hp : maxHP) - dmg);
                    // SFX: player hurt (melee)
                    game.playPlayerHurt();
                    if (game.player.hp <= 0) game.onPlayerKilled(game.player.pos.clone());
                    // Archetype on-hit effects
                    try {
                        // Parasite: lifesteal 50% of dealt damage
                        if (this.role === 'parasite' && this.maxHP) {
                            this.hp = Math.min(this.maxHP, (this.hp||this.maxHP) + Math.round(dmg*0.5));
                        }
                        // Juggernaut: knockback player and apply brief slow
                        if (this.role === 'juggernaut') {
                            const dir = toPlayer.divideNew(Math.max(1, d));
                            game.player.pos.plusEq(dir.multiplyNew(24));
                            game.player.slowedUntil = Date.now() + 450;
                            game.player.slowFactor = 0.7;
                        }
                        // Overcharged: small splash damage around impact (non-stacking)
                        if (this.role === 'overcharged') {
                            let splash = 4;
                            let pHP = game.player.hp;
                            game.player.hp = Math.max(0, pHP - splash);
                            if (pHP !== game.player.hp) game.playPlayerHurt();
                            if (game.player.hp <= 0) game.onPlayerKilled(game.player.pos.clone());
                        }
                        // Berserker: rage on hit -> brief speed burst
                        if (this.role === 'berserker') {
                            this._rageUntil = Date.now() + 800;
                            this.speedMult = (this.speedMult||1) * 1.12;
                        }
                    } catch {}
                    this.meleeCooldown = 600; // ms
                }
                // Ranged archetypes: allow from wave >= 5 without kiting
                const wave = Math.max(1, game.waveNumber||1);
                const allowShooting = (wave >= 5) && (this.role === 'shooter' || this.role === 'sniper' || this.role === 'bloodmage');
                if (allowShooting && this.shootCooldown <= 0) {
                    // Sniper: windup then fire a fast, high-damage shot at long range
                    if (this.role === 'sniper' && d < 1200) {
                        const now = Date.now();
                        if (!this._sniperWindup) {
                            this._sniperWindup = now + 600; // telegraph window
                            // store aim direction for laser
                            const dir = toPlayer.divideNew(Math.max(1, d));
                            this._sniperAimAngle = Math.atan2(dir.y, dir.x);
                            this._sniperLaserUntil = this._sniperWindup; // draw laser until windup ends
                            this.shootCooldown = 100; // keep checking
                        } else if (now >= this._sniperWindup) {
                            const dir = toPlayer.divideNew(Math.max(1, d));
                            const angle = Math.atan2(dir.y, dir.x);
                            const speed = 900;
                            const spawn = this.pos.plusNew(dir.multiplyNew((this.size||12) + 6));
                            const proj = new Projectile(spawn, dir.multiplyNew(speed), this);
                            proj.damage = 26;
                            proj.isSniper = true;
                            game.projectiles.push(proj);
                            this._sniperWindup = 0;
                            // set muzzle flash for brief moment
                            this._muzzleFlashUntil = Date.now() + 120;
                            this._sniperAimAngle = angle;
                            this.shootCooldown = 1800 + Math.random()*800;
                        }
                    }
                    // Blood Mage: radial burst of slow projectiles (waves >= 11)
                    else if (this.role === 'bloodmage' && wave >= 11) {
                        const shots = 6;
                        for (let i=0;i<shots;i++) {
                            const ang = (i/shots) * Math.PI*2;
                            const dir = new Vector2(Math.cos(ang), Math.sin(ang));
                            const vel = dir.multiplyNew(320);
                            const spawn = this.pos.plusNew(dir.multiplyNew((this.size||12)+4));
                            const proj = new Projectile(spawn, vel, this);
                            proj.damage = 9;
                            game.projectiles.push(proj);
                        }
                        this.shootCooldown = 2200 + Math.random()*600;
                    }
                    // Generic ranged (e.g., converted shooters)
                    else if (this.role === 'shooter' && d < 700) {
                        const dir = toPlayer.divideNew(Math.max(1, d));
                        const spread = 0.035;
                        const angle = Math.atan2(dir.y, dir.x) + (Math.random()-0.5)*spread;
                        const dirSpread = new Vector2(Math.cos(angle), Math.sin(angle));
                        const vel = dirSpread.multiplyNew(420);
                        const spawn = this.pos.plusNew(dirSpread.multiplyNew((this.size||12)+4));
                        game.projectiles.push(new Projectile(spawn, vel, this));
                        this.shootCooldown = 900 + Math.random()*600;
                    }
                }
            } else {
                // Classic behavior: occasional shooting when close enough
                const wave = Math.max(1, game.waveNumber||1);
                const allowShooting = (wave >= 5) && (this.role === 'shooter' || this.role === 'sniper' || this.role === 'bloodmage');
                if (d < 700 && this.shootCooldown <= 0 && allowShooting) {
                    const dir = toPlayer.divideNew(Math.max(1, d));
                    const spread = 0.05;
                    const angle = Math.atan2(dir.y, dir.x) + (Math.random()-0.5)*spread;
                    const dirSpread = new Vector2(Math.cos(angle), Math.sin(angle));
                    const vel = dirSpread.multiplyNew(420);
                    game.projectiles.push(new Projectile(this.pos.clone(), vel, this));
                    const baseCd = 700 + Math.random()*600;
                    this.shootCooldown = baseCd + (this.state === 'fleeing' ? 300 : 0);
                }
            }
        }
    }
}

class Tower {
    constructor(pos) {
        this.pos = pos;
        this.range = 350;
        this.cooldown = 0;
        this.fireDelay = 900; // ms
    }
    update(game, dt) {
        this.cooldown -= dt;
        if (this.cooldown > 0) return;
        // find target (player preferred else nearest bot)
        let target = null;
        let minD = Infinity;
        const tryTarget = (entity) => {
            if (!entity) return;
            // ignore player during spawn protection
            if (entity === game.player && game.player.spawnProtectedUntil && Date.now() < game.player.spawnProtectedUntil) return;
            const d = this.pos.minusNew(entity.pos).magnitude();
            if (d < this.range && d < minD) { minD = d; target = entity; }
        };
        tryTarget(game.player);
        (game.aiBots||[]).forEach(b=>tryTarget(b));
        if (target) {
            const dir = target.pos.minusNew(this.pos).normalise();
            const vel = dir.multiplyNew(420);
            game.projectiles.push(new Projectile(this.pos.clone(), vel));
            this.cooldown = this.fireDelay;
        }
    }
}

class Projectile {
    constructor(pos, velocity, owner=null, opts={}) {
        this.pos = pos;
        this.velocity = velocity;
        this.life = 2000; // ms
        this.hit = false;
        this.owner = owner;
        // Combat properties
        this.damage = (opts && opts.damage != null) ? opts.damage : 12;
        this.isFiery = !!(opts && opts.isFiery);
        this.burnDps = (opts && opts.burnDps) || 0;
        this.burnDuration = (opts && opts.burnDuration) || 0;
    }
    update(dt) {
        this.life -= dt;
        this.pos.plusEq(this.velocity.multiplyNew(dt/1000));
        // Enforce walls: despawn when outside playZone/world
        try {
            const g = (typeof window !== 'undefined') ? window.game : null;
            if (g) {
                const z = g.playZone || { x:0, y:0, width:(g.worldSize && g.worldSize.width)||2000, height:(g.worldSize && g.worldSize.height)||2000 };
                if (this.pos.x < z.x || this.pos.x > z.x + z.width || this.pos.y < z.y || this.pos.y > z.y + z.height) {
                    this.life = 0;
                }
            }
        } catch {}
        return this.life <= 0;
    }
}

class Glowling {
    constructor(pos, settings) {
        this.pos = pos;
        this.velocity = new Vector2(0, 0);
        this.size = 15;
        this.baseSize = 15;
        this.name = settings.name;
        this.element = settings.element;
        this.color = settings.color;
        this.shape = settings.shape;
        
        this.elementEnergy = 0;
        this.inElementZone = false;
        this.abilityActive = false;
        this.speedBoost = 1;
        this.maneuverBoost = 1;
        this.huntingBoost = 1;
        this.waterZone = null;
        this.slowedUntil = 0;
        this.slowFactor = 1;
        // Health
        this.maxHP = 120;
        this.hp = this.maxHP;

        // Core combat stats
        this.armor = 0;                // flat damage reduction
        this.regen = 0;                // HP per second
        this.critChance = 0;           // 0..1
        this.critDamageMult = 1.0;     // bonus multiplier part used as (1 + critDamageMult)
        this.pierceChance = 0;         // 0..1 chance to not be consumed on hit
        this.onKillHeal = 0;           // flat heal on kill
        this.auraDps = 0;              // DPS to nearby enemies
        this.auraRadius = 0;           // radius for aura
    }
    
    grow(amount) {
        this.size += amount * 0.5;
        this.size = Math.min(this.size, 100); // Max size limit
    }
    
    addElementEnergy(amount) {
        this.elementEnergy += amount;
        this.elementEnergy = Math.min(this.elementEnergy, 100);
    }
    
    getSpeed() {
        const baseSpeed = Math.max(50, 150 - this.size * 2);
        let finalSpeed = baseSpeed * this.speedBoost;
        // Global +50% player speed-up
        finalSpeed *= 1.5;
        
        // Apply slowing effect if active
        if (this.slowedUntil && Date.now() < this.slowedUntil) {
            finalSpeed *= this.slowFactor;
        }
        
        // Apply hunting boost for fire element
        if (this.huntingBoost && this.huntingBoost > 1) {
            finalSpeed *= this.huntingBoost;
        }
        
        return finalSpeed;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    // Set default element selection (color/shape selection UI removed)
    try {
        const el = document.querySelector('.element-btn[data-element="fire"]');
        if (el) el.classList.add('selected');
    } catch(_) {}
    window.game = new GlowlingsGame();
});
