/*
// Disabled legacy enhanced implementation to avoid conflicts with core glowlings.js
// Guarded legacy block commented out to prevent parse/runtime conflicts
// Glowlings Game - Complete implementation
class GlowlingsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
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
        
        // Input handling
        this.mouse = new Vector2(0, 0);
        this.keys = {};
        
        // Camera
        this.camera = new Vector2(0, 0);
        this.worldSize = { width: 2000, height: 2000 };
        
        // Element abilities
        this.abilityReady = true;
        this.abilityCooldown = 0;
        this.abilityDuration = 0;
        
        // AI opponents
        this.aiPlayers = [];
        this.maxAIPlayers = 8;
        
        // Enhanced visual effects
        this.backgroundParticles = [];
        this.explosionEffects = [];
        
        this.setupEventListeners();
        this.initializeWorld();
        this.initializeAI();
        this.initializeBackgroundEffects();
        this.gameLoop();
    }
    // Settings tabs: switch visible panel by data-tab
    if (!window.__settingsTabsSetup){
      window.__settingsTabsSetup = true;
      function applyBasicSettingsLabels(){
        try{
          const g = window.game;
          const t = (k, fb)=>{ try{ return (g && typeof g.t==='function') ? g.t(k) : fb; }catch(_){ return fb; } };
          const apTab = document.querySelector('#settingsTabs .settings-tab-btn[data-tab="appearance"]');
          const apH3  = document.querySelector('#settingsTab-appearance h3');
          const crTab = document.querySelector('#settingsTabs .settings-tab-btn[data-tab="credits"]');
          const crH3  = document.querySelector('#settingsTab-credits h3');
          const crTxt = document.querySelector('#settingsTab-credits [data-lang="creditsText"]');
          if (apTab) apTab.textContent = t('appearance', apTab.textContent||'Appearance');
          if (apH3)  apH3.textContent  = t('appearance', apH3.textContent||'Appearance');
          if (crTab) crTab.textContent = t('credits', crTab.textContent||'Credits');
          if (crH3)  crH3.textContent  = t('credits', crH3.textContent||'Credits');
          if (crTxt) crTxt.textContent = t('creditsText', crTxt.textContent||'Everything developed by Batuhan Berk.');
        }catch(_){ }
      }
      // Builds overlay: open/close (mirror strong behavior)
      (function(){
        const overlay = document.getElementById('buildsOverlay');
        if(!overlay) return;
        function hardHide(id){ try{ const el=document.getElementById(id); if(el){ el.style.display='none'; el.style.visibility=''; el.style.opacity=''; el.style.pointerEvents=''; el.style.zIndex=''; } }catch(_){ } }
        function hideAllOverlays(){
          ['gameOverScreen','inGameMenu','shopOverlay','settingsOverlay','elementSelectOverlay','charactersOverlay','buildsOverlay','cutsceneOverlay','howToOverlay','consumableBar','touchControls','startScreen']
            .forEach(hardHide);
          ['ui','gameUI','timer','debugOverlay','statsPanel'].forEach(hardHide);
        }
        function renderTabsInit(){
          try{
            const buttons = Array.from(overlay.querySelectorAll('.tab-btn'));
            const sections = {
              fire: overlay.querySelector('#tab-fire'),
              water: overlay.querySelector('#tab-water'),
              air: overlay.querySelector('#tab-air')
            };
            const activate = (key)=>{
              buttons.forEach(b=> b.classList.toggle('active', b.dataset.tab===key));
              Object.keys(sections).forEach(k=> sections[k] && sections[k].classList.toggle('active', k===key));
              try{ history.replaceState(null, '', '#'+key); }catch(_){ }
            };
            buttons.forEach(b=>{ if(!b.__bound){ b.addEventListener('click', ()=> activate(b.dataset.tab)); b.__bound=true; }});
            const initial = (location.hash||'').replace('#','');
            if(['fire','water','air'].includes(initial)) activate(initial); else activate('fire');
          }catch(_){ }
        }
        window.openBuildsOverlay = function(){
          try{
            hideAllOverlays();
            try { if (overlay.parentElement !== document.body) document.body.appendChild(overlay); } catch(_){ }
            overlay.style.display = 'flex';
            overlay.style.visibility = 'visible';
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
            overlay.style.zIndex = '10050';
            renderTabsInit();
            // Ensure visible against external toggles
            let tries = 10;
            const tick = ()=>{
              try{
                const cs = window.getComputedStyle(overlay);
                if (cs.display === 'none' || cs.visibility === 'hidden') overlay.style.display = 'flex';
              }catch(_){ }
              if(--tries>0) setTimeout(tick, 30);
            };
            setTimeout(tick, 30);
          }catch(_){ }
        };
        window.closeBuildsOverlay = function(){
          try{
            overlay.style.display = 'none';
            overlay.style.visibility = '';
            overlay.style.opacity = '';
            overlay.style.pointerEvents = '';
            overlay.style.zIndex = '';
          }catch(_){ }
        };
      })();
      applyBasicSettingsLabels();
      function bindTabs(){
        try{
          const show = (tab)=>{
            // Map panels fresh each call to handle DOM mutations
            const panels = {
              appearance: document.getElementById('settingsTab-appearance'),
              audio: document.getElementById('settingsTab-audio'),
              language: document.getElementById('settingsTab-language'),
              credits: document.getElementById('settingsTab-credits'),
            };
            Object.keys(panels).forEach(k=>{ const el = panels[k]; if (el) el.style.display = (k===tab)? 'block':'none'; });
            const btns = Array.from(document.querySelectorAll('.settings-tab-btn'));
            btns.forEach(b=> b.classList.toggle('active', b.getAttribute('data-tab')===tab));
          };
          // Save to window for delegated handler (inline onclick)
          window.__showSettingsTab = show;
          window.__switchSettingsTab = show;
          // Initialize default
          show('appearance');
        }catch(_){ }
      }
      bindTabs();
      // Delegated click handler for any future tab buttons
      document.addEventListener('click', (e)=>{
        const t = e.target && (e.target.closest ? e.target.closest('.settings-tab-btn') : null);
        if (!t) return;
        try{ e.preventDefault(); const tab = t.getAttribute('data-tab') || 'appearance'; if (window.__showSettingsTab) window.__showSettingsTab(tab); }catch(_){ }
      }, true);
      try{
        const so = document.getElementById('settingsOverlay');
        if (so){
          const mo = new MutationObserver(()=>{ try{ bindTabs(); }catch(_){ } });
          mo.observe(so, {subtree:true, childList:true});
        }
      }catch(_){ }
      // Fullscreen toggle wiring
      (function setupFullscreen(){
        function isFS(){ try{ return !!(document.fullscreenElement || document.webkitFullscreenElement); }catch(_){ return false; } }
        function setChip(){
          try{
            const g = window.game;
            const onTxt = (g&&g.t)? g.t('on') : 'On';
            const offTxt = (g&&g.t)? g.t('off') : 'Off';
            const on = isFS();
            const chip = document.getElementById('fullscreenState');
            if (chip){ chip.textContent = on ? onTxt : offTxt; chip.classList.remove('on','off'); chip.classList.add(on?'on':'off'); }
            const btn = document.getElementById('fullscreenToggleBtn');
            if (btn){ btn.setAttribute('aria-pressed', String(on)); }
          }catch(_){ }
        }
        function applyFSClass(){
          try{
            const on = isFS();
            if (on) document.documentElement.classList.add('fs'); else document.documentElement.classList.remove('fs');
            window.dispatchEvent(new Event('resize'));
            setTimeout(()=> window.dispatchEvent(new Event('resize')), 50);
          }catch(_){ }
        }
        function stabilizeHud(){
          const isShopOpen = !!(document && document.body && document.body.classList && document.body.classList.contains('shop-open'));
          try{
            const bar = document.getElementById('consumableBar');
            if (bar){
              if (!isShopOpen){
                try{ if (window.game && typeof window.game.detachConsumableBarFromShop==='function') window.game.detachConsumableBarFromShop(); }catch(_){ }
                bar.classList.remove('attached-to-shop');
                bar.style.top = '';
                bar.style.bottom = (window.innerHeight<=800? '96px':'18px');
                bar.style.left = '50%';
                bar.style.transform = 'translateX(-50%)';
                bar.style.position = 'fixed';
                bar.style.zIndex = '';
              }
            }
          }catch(_){ }
          // Cooldown HUD: leave to CSS if present; only clear accidental top pinning
          try{
            document.querySelectorAll('.ability-cooldown').forEach(el=>{
              if (el && el.style && el.style.top){ el.style.top = ''; }
            });
          }catch(_){ }
        }
        window.__toggleFullscreen = async function(){
          try{
            const wantOn = !isFS();
            try{ location.hash = wantOn ? '#__fs_on' : '#__fs_off'; }catch(_){ }
            if (!wantOn){
              const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen; if (fn){ try{ await fn.call(document); }catch(_){ } }
            } else {
              const el = document.documentElement;
              const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen; if (fn){ try{ await fn.call(el); }catch(_){ } }
            }
          }catch(_){ }
          setChip();
          applyFSClass();
          stabilizeHud();
        };
        try{ document.addEventListener('fullscreenchange', ()=>{ setChip(); applyFSClass(); stabilizeHud(); }, {passive:true}); }catch(_){ }
        // Prevent ESC from exiting DOM fullscreen in renderer (Electron); in browsers this may not be fully preventable
        try{
          const escBlock = (e)=>{
            try{
              const isEsc = (e.key==='Escape' || e.code==='Escape' || e.keyCode===27);
              if (isEsc && (document.fullscreenElement || document.webkitFullscreenElement)){
                e.preventDefault && e.preventDefault();
                e.stopImmediatePropagation && e.stopImmediatePropagation();
                e.stopPropagation && e.stopPropagation();
              }
            }catch(_){ }
          };
          document.addEventListener('keydown', escBlock, true);
          document.addEventListener('keyup', escBlock, true);
        }catch(_){ }
        // Initial sync and bind
        try{
          const fb = document.getElementById('fullscreenToggleBtn');
          if (fb && !fb.__bound){ fb.addEventListener('click', (e)=>{ try{ e.preventDefault(); }catch(_){ } window.__toggleFullscreen && window.__toggleFullscreen(); }, true); fb.__bound = true; }
        }catch(_){ }
        setTimeout(()=>{ setChip(); stabilizeHud(); }, 0);
        try{ window.addEventListener('resize', ()=> stabilizeHud()); }catch(_){ }
        try{ window.addEventListener('orientationchange', ()=> stabilizeHud()); }catch(_){ }
        try{ if (window.visualViewport) window.visualViewport.addEventListener('resize', ()=> stabilizeHud(), {passive:true}); }catch(_){ }
      })();
    }

    // Gamepad (controller) support: non-invasive poller that feeds window.game
    if (!window.__gamepadLoopSetup){
      window.__gamepadLoopSetup = true;
      const state = { prevBtns: [], usingPad: false };
      const DEAD = 0.25;
      function pressed(btn){
        if (!btn) return false; return (typeof btn === 'object') ? (btn.pressed || btn.value > 0.5) : (btn > 0.5);
      }
      function sign(x){ return (x>DEAD)?1:(x<-DEAD)?-1:0; }
      function loop(){
        try{
          const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
          const gp = pads[0] || null; // single-pad support for now
          const g = window.game;
          if (gp && g && g.gameState === 'playing'){
            state.usingPad = true;
            const axX = gp.axes && gp.axes.length>0 ? gp.axes[0] : 0;
            const axY = gp.axes && gp.axes.length>1 ? gp.axes[1] : 0;
            const dx = sign(axX), dy = sign(axY);
            // Map to WASD-style flags (mutually compatible with keyboard)
            try{
              g.keys = g.keys || {};
              g.keys.w = (dy < 0);
              g.keys.s = (dy > 0);
              g.keys.a = (dx < 0);
              g.keys.d = (dx > 0);
            }catch(_){ }
            // Buttons (Standard mapping): A(0)=dodge, X(2)/Y(3)=ability, Start(9)=pause
            const btns = gp.buttons || [];
            function edge(i){ const now = pressed(btns[i]); const was = !!state.prevBtns[i]; state.prevBtns[i] = now; return now && !was; }
            // A -> dodge
            if (edge(0)) { try{ if (!g.paused) g.triggerDodge && g.triggerDodge(); }catch(_){ } }
            // X or Y -> ability
            if (edge(2) || edge(3)) { try{ if (!g.paused) g.useAbility && g.useAbility(); }catch(_){ } }
            // Start -> pause toggle
            if (edge(9)) { try{ g.togglePause && g.togglePause(); }catch(_){ } }
            // TODO: Right stick aim mapping if needed (axes[2], axes[3])
          }
        }catch(_){ }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
      // If any gamepad connects, mark as usingPad
      try{ window.addEventListener('gamepadconnected', ()=>{ state.usingPad = true; }); }catch(_){ }
    }
    // Bind Graphics/Performance controls from settingsOverlay
    if (!window.__graphicsBindSetup){
      window.__graphicsBindSetup = true;
      const g = ()=> window.game;
      const byId = (id)=> document.getElementById(id);
      const loadNum = (k, d)=>{ try{ const v = parseFloat(localStorage.getItem(k)); return isFinite(v)? v : d; }catch(_){ return d; } };
      const loadBool = (k, d)=>{ try{ const v = localStorage.getItem(k); return (v===null)? d : (v==='true'); }catch(_){ return d; } };
      const save = (k, v)=>{ try{ localStorage.setItem(k, String(v)); }catch(_){ } };

      // Fullscreen toggle
      const fsBtn = byId('fullscreenToggleBtn');
      const fsState = byId('fullscreenState');
      function fsSync(){
        try{
          const on = !!document.fullscreenElement;
          if (fsState){ fsState.textContent = on ? 'On' : 'Off'; fsState.classList.remove('on','off'); fsState.classList.add(on?'on':'off'); }
          if (fsBtn){ fsBtn.setAttribute('aria-pressed', String(on)); }
          // Do not override canvas size; core glowlings.js handles responsive scaling
          // Restore overlay visibility if it was open before
          try{
            const so = document.getElementById('settingsOverlay');
            if (so && window.__fsPrevOverlayVisible){ so.style.display = 'block'; }
          }catch(_){ }
          try{ window.dispatchEvent(new Event('resize')); }catch(_){ }
          // Attempt to notify game core about size change
          try{
            const g = window.game;
            if (g){
              if (typeof g.resize === 'function') g.resize();
              else if (typeof g.onResize === 'function') g.onResize();
              else if (typeof g.handleResize === 'function') g.handleResize();
            }
          }catch(_){ }
          // Force a frame after entering fullscreen to ensure menu/canvas repaint
          try{
            requestAnimationFrame(()=>{
              requestAnimationFrame(()=>{
                const g = window.game;
                try{
                  if (g && typeof g.render === 'function') g.render();
                  else if (g && typeof g.draw === 'function') g.draw();
                  else if (g && typeof g.requestRender === 'function') g.requestRender();
                }catch(_){ }
                // Also force-ensure common UI containers are visible
                try{
                  const ids = ['ui','settingsOverlay','inGameMenu','menu','mainMenu'];
                  ids.forEach(id=>{ const el = document.getElementById(id); if (el){ el.style.visibility='visible'; if (getComputedStyle(el).display==='none') el.style.display='block'; el.style.zIndex = String(Math.max(10020, parseInt(getComputedStyle(el).zIndex)||0)); }});
                }catch(_){ }
              });
            });
          }catch(_){ }
        }catch(_){ }
      }
      function fsToggle(){
        try{
          if (!document.fullscreenElement){
            // Use document fullscreen so UI siblings remain visible
            const el = document.documentElement || document.body;
            try{ document.body && document.body.focus && document.body.focus(); }catch(_){ }
            // remember if settings overlay is open to restore after FS
            try{ const so = document.getElementById('settingsOverlay'); window.__fsPrevOverlayVisible = !!(so && so.style.display !== 'none'); }catch(_){ }
            let p = el.requestFullscreen ? el.requestFullscreen() : (el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : (el.msRequestFullscreen ? el.msRequestFullscreen() : null));
            if (p && typeof p.catch==='function') p.catch(()=>{});
          } else {
            let p = document.exitFullscreen ? document.exitFullscreen() : (document.webkitExitFullscreen ? document.webkitExitFullscreen() : (document.msExitFullscreen ? document.msExitFullscreen() : null));
            if (p && typeof p.catch==='function') p.catch(()=>{});
          }
          setTimeout(fsSync, 120);
        }catch(_){ }
      }
      // Global wrappers for inline onclick
      try{ window.__toggleFullscreen = function(){ fsToggle(); }; }catch(_){ }
      // Delegated click in case button is re-rendered
      document.addEventListener('click', (e)=>{ const el = e.target && e.target.closest && e.target.closest('#fullscreenToggleBtn'); if (el){ e.preventDefault(); fsToggle(); } }, true);
      if (fsBtn && !fsBtn.__bound){ fsBtn.addEventListener('click', fsToggle, true); fsBtn.__bound = true; fsSync(); }
      try{ document.addEventListener('fullscreenchange', fsSync); document.addEventListener('webkitfullscreenchange', fsSync); document.addEventListener('msfullscreenchange', fsSync); }catch(_){ }

      // Removed FPS cap selector and enforcement

      // FPS HUD toggle + updater
      const fpsBtn = byId('fpsInfoToggleBtn');
      const fpsState = byId('fpsInfoState');
      function fpsSync(){
        try{
          const on = loadBool('fpsInfoOn', false);
          if (fpsBtn) fpsBtn.setAttribute('aria-pressed', String(!!on));
          if (fpsState){ fpsState.textContent = on ? L('on','On') : L('off','Off'); fpsState.classList.remove('on','off'); fpsState.classList.add(on?'on':'off'); }
          const hud = document.getElementById('fpsHud'); if (hud) hud.style.display = on ? 'block' : 'none';
        }catch(_){ }
      }
      function fpsToggle(){ try{ const cur = loadBool('fpsInfoOn', false); save('fpsInfoOn', !cur); fpsSync(); }catch(_){ } }
      try{ window.__toggleFpsInfo = function(){ fpsToggle(); }; }catch(_){ }
      // Delegated click for FPS toggle
      document.addEventListener('click', (e)=>{ const el = e.target && e.target.closest && e.target.closest('#fpsInfoToggleBtn'); if (el){ e.preventDefault(); fpsToggle(); } }, true);
      if (fpsBtn && !fpsBtn.__bound){ fpsBtn.addEventListener('click', fpsToggle, true); fpsBtn.__bound = true; fpsSync(); }
      // Create HUD if missing
      (function ensureFpsHud(){
        let hud = document.getElementById('fpsHud');
        if (!hud){
          hud = document.createElement('div');
          hud.id = 'fpsHud';
          hud.style.position = 'fixed';
          hud.style.top = '8px';
          hud.style.left = '8px';
          hud.style.zIndex = '2147483640';
          hud.style.padding = '4px 6px';
          hud.style.border = '1px solid rgba(203,213,225,0.35)';
          hud.style.borderRadius = '6px';
          hud.style.background = 'rgba(2,6,23,0.65)';
          hud.style.color = '#e2e8f0';
          hud.style.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace';
          hud.style.display = 'none';
          hud.textContent = 'FPS: --';
          document.body.appendChild(hud);
        }
        fpsSync();
      })();
      // Update FPS HUD: prefer game's own FPS (reflects cap), fallback to measured frames
      if (!window.__fpsHudLoop){
        window.__fpsHudLoop = true;
        let last = performance.now(); let frames = 0; let acc = 0;
        function tick(){
          const now = performance.now(); const dt = now - last; last = now; frames++; acc += dt;
          let showFps = null;
          try { const g = window.game; if (g && typeof g.fps === 'number' && isFinite(g.fps)) showFps = Math.round(g.fps); } catch(_){ }
          if (showFps == null && acc >= 500){ // fallback: update twice per second from measured frames
            showFps = Math.round((frames * 1000) / acc);
            frames = 0; acc = 0;
          }
          if (showFps != null){
            try{ const hud = document.getElementById('fpsHud'); if (hud) hud.textContent = 'FPS: ' + showFps; }catch(_){ }
          }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
      // Resync chips when overlay opens (style/class changes)
      try{
        const so = document.getElementById('settingsOverlay');
        if (so){
          const attrObs = new MutationObserver(()=>{ try{ fsSync(); fpsSync(); }catch(_){ } });
          attrObs.observe(so, { attributes:true, attributeFilter:['style','class'] });
        }
      }catch(_){ }

      // UI scale (persist only)
      // Removed: UI scale, particle density, flash effects
    }
    // ESC handling: when in gameplay, open settings overlay as in-game menu and prevent main menu toggles
    if(!window.__escSetup){
      const escBlocker = (e)=>{
        const isEsc = (e.code === 'Escape') || (e.key === 'Escape') || (e.keyCode === 27) || (e.which === 27);
        if(!isEsc) return;
        try{
          const g = window.game;
          // Consider both our in-game menu and any settings overlay as "menu open"
          const ov = document.getElementById('settingsOverlay');
          const ovOpen = !!(ov && (ov.style.display && ov.style.display !== 'none'));
          const igm = document.getElementById('inGameMenu');
          const igmOpen = !!(igm && (igm.style.display && igm.style.display !== 'none'));
          const bodyMenuOpen = !!(document.body && document.body.classList && document.body.classList.contains('menu-open'));
          const menuOpen = ovOpen || igmOpen || bodyMenuOpen;
          const inGameplay = !!(g && g.inWave);
          if (inGameplay || menuOpen) {
            // Block downstream listeners (including any main menu toggles)
            try { e.preventDefault(); } catch(_){ }
            try { if (e.stopImmediatePropagation) e.stopImmediatePropagation(); else e.stopPropagation(); } catch(_){ }
            if (e.type === 'keydown' && (inGameplay || menuOpen)) {
              // Delegate to game's own pause toggler so inGameMenu logic stays consistent
              try { g.togglePause && g.togglePause(); } catch(_){ }
              // Immediately force-hide start screen in case any late handler tried to show it
              try { const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'none'; } catch(_){ }
            }
          }
        }catch(_){ }
      };
      // Capture-phase listeners to guarantee swallowing
      window.addEventListener('keydown', escBlocker, true);
      window.addEventListener('keyup', escBlocker, true);
      window.__escSetup = true;
    }

    // Crash/Telemetry Guard: capture errors and keep a small ring buffer in localStorage
    if (!window.__errorGuardSetup) {
      try {
        const KEY = 'elementist_errors';
        const MAX = 40; // keep last 40 error entries
        const readBuf = () => {
          try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
        };
        const writeBuf = (arr) => { try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX))); } catch {} };
        const pushErr = (obj) => { const buf = readBuf(); buf.push(obj); writeBuf(buf); };
        window.getElementistErrors = () => readBuf();
        window.clearElementistErrors = () => { try { localStorage.removeItem(KEY); } catch {} };
        window.addEventListener('error', (e) => {
          try {
            pushErr({
              ts: new Date().toISOString(),
              type: 'error',
              msg: String(e?.message||'unknown'),
              src: String(e?.filename||''),
              line: e?.lineno||0,
              col: e?.colno||0,
              stack: String(e?.error?.stack||'')
            });
          } catch {}
        });
        window.addEventListener('unhandledrejection', (e) => {
          try {
            const reason = e?.reason;
            pushErr({
              ts: new Date().toISOString(),
              type: 'unhandledrejection',
              msg: String(reason?.message || reason || 'unknown'),
              stack: String(reason?.stack||'')
            });
          } catch {}
        });
      } catch {}
      window.__errorGuardSetup = true;
    }

    // Audio persistence: read from localStorage and apply to game + bgm element (music) and SFX (sound)
    function applyGlobalAudioFromStorage(){
      try{
        const musicFlag = localStorage.getItem('musicMuted');
        const soundFlag = localStorage.getItem('soundMuted');
        const volFlag = localStorage.getItem('volume'); // master volume
        const musicVolFlag = localStorage.getItem('musicVolume');
        const musicMuted = (musicFlag === 'true');
        const soundMuted = (soundFlag === 'true');
        let masterVolume = parseFloat(volFlag);
        if (!isFinite(masterVolume)) masterVolume = 1.0;
        masterVolume = Math.max(0, Math.min(1, masterVolume));
        let musicVolume = parseFloat(musicVolFlag);
        if (!isFinite(musicVolume)) musicVolume = masterVolume;
        musicVolume = Math.max(0, Math.min(1, musicVolume));
        // Apply to bgm (force constant 40% volume regardless of settings)
        try {
          const bgm = document.getElementById('bgm');
          if (bgm) {
            bgm.muted = musicMuted;
            bgm.volume = 0.4; // lock BGM to 40%
            if (musicMuted) { try{ bgm.pause(); }catch(_){} }
            else { try{ const p = bgm.play(); if (p && typeof p.catch==='function') p.catch(()=>{}); }catch(_){} }
          }
        } catch(_){ }
        // Also apply volume to any SFX <audio> tags if present (bgm excluded)
        try { document.querySelectorAll('audio').forEach(a=>{ try{ if(a.id==='bgm') return; a.volume = masterVolume; }catch(_){ } }); } catch(_){ }
        // Apply to game settings if available
        const g = window.game;
        if (g && g.settings) {
          g.settings.musicMuted = musicMuted;
          g.settings.soundMuted = soundMuted;
          // unify to master/music volumes used by core game
          g.settings.masterVolume = masterVolume;
          g.settings.musicVolume = musicVolume;
          g.settings.volume = masterVolume; // keep for compatibility
          try { g.musicMuted = !!musicMuted; } catch(_){ }
          try { g.muted = !!soundMuted; } catch(_){ }
          try { g.volume = masterVolume; } catch(_){ }
          try { g.applyAudioSettings && g.applyAudioSettings(); } catch(_){ }
          try { g.saveSettings && g.saveSettings(); } catch(_){ }
          // Update UI chips and aria-pressed for both main menu and in-game if present
          const onTxt = (g && typeof g.t==='function') ? g.t('on') : 'On';
          const offTxt = (g && typeof g.t==='function') ? g.t('off') : 'Off';
          function chip(id, on){ try{ const el = document.getElementById(id); if(el){ el.textContent = on ? onTxt : offTxt; el.classList.remove('on','off'); el.classList.add(on?'on':'off'); } }catch(_){ } }
          function press(id, on){ try{ const b = document.getElementById(id); if(b){ b.setAttribute('aria-pressed', String(!!on)); } }catch(_){ } }
          const soundOn = !soundMuted; const musicOn = !musicMuted;
          chip('soundState', soundOn); chip('soundStateIngame', soundOn);
          chip('musicState', musicOn); chip('musicStateIngame', musicOn);
          press('soundToggleBtn', soundOn); press('soundToggleIngame', soundOn);
          press('musicToggleBtn', musicOn); press('musicToggleIngame', musicOn);
          // Sync all volume sliders/labels in DOM (main menu and in-game)
          try {
            document.querySelectorAll('#volumeRange, #masterVolume').forEach(inp => { if (inp && inp.value !== String(masterVolume)) inp.value = String(masterVolume); });
            document.querySelectorAll('#musicVolumeRange, #musicVolume').forEach(inp => { if (inp && inp.value !== String(musicVolume)) inp.value = String(musicVolume); });
          } catch(_){ }
          try {
            const pctM = Math.round(masterVolume * 100);
            const pctMu = Math.round(musicVolume * 100);
            const masterLbls = [document.getElementById('volumeValue'), document.getElementById('masterVolumeVal')].filter(Boolean);
            const musicLbls = [document.getElementById('musicVolumeVal'), document.getElementById('musicVolumeValueIngame')].filter(Boolean);
            masterLbls.forEach(l => l.textContent = pctM + '%');
            musicLbls.forEach(l => l.textContent = pctMu + '%');
          } catch(_){ }
        }
      }catch(_){ }
    }

    // Apply persistence when game becomes available
    (function waitGame(){
      if (window.game) {
        applyGlobalAudioFromStorage();
        // Removed FPS cap persistence/enforcement
        try{
          const g = window.game;
          const hideStartUIs = ()=>{
          try{
            const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'none';
            const el = document.getElementById('elementSelectOverlay'); if (el && g.gameState==='playing') el.style.display = 'none';
          }catch(_){ }
        };
        hideStartUIs();
        // Wrap togglePause to enforce hiding start screen after pause/resume
        if (!g.__origTogglePause && typeof g.togglePause === 'function'){
          g.__origTogglePause = g.togglePause.bind(g);
          g.togglePause = function(){
            const r = this.__origTogglePause();
            try{
              const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'none';
            }catch(_){ }
            return r;
          };
        }
        // Periodic guard while playing
        if (!window.__noStartGuard){
          window.__noStartGuard = setInterval(()=>{
            try{ if (window.game && window.game.gameState==='playing') { const ss = document.getElementById('startScreen'); if (ss) ss.style.display='none'; } }catch(_){ }
          }, 500);
        }
          hideStartUIs();
          // Wrap togglePause to enforce hiding start screen after pause/resume
          if (!g.__origTogglePause && typeof g.togglePause === 'function'){
            g.__origTogglePause = g.togglePause.bind(g);
            g.togglePause = function(){
              const r = this.__origTogglePause();
              try{
                const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'none';
              }catch(_){ }
              return r;
            };
          }
          // Periodic guard while playing
          if (!window.__noStartGuard){
            window.__noStartGuard = setInterval(()=>{
              try{ if (window.game && window.game.gameState==='playing') { const ss = document.getElementById('startScreen'); if (ss) ss.style.display='none'; } }catch(_){ }
            }, 500);
          }
        }catch(_){ }
      }
      else setTimeout(waitGame, 200);
    })();

    // Prefer direct bindings instead of document-level delegation to avoid double toggles
    window.__useDirectAudioBinding = true;
    if(!window.__musicPersistSetup){
      document.addEventListener('click', (e)=>{
        if (window.__useDirectAudioBinding) return; // guard: direct binding will handle
        const t = e.target;
        if (!t) return;
        const btn = (t.id === 'musicToggleBtn') ? t : t.closest && t.closest('#musicToggleBtn');
        if (btn){
          setTimeout(()=>{
            try{
              const g = window.game; if (g && g.settings){ localStorage.setItem('musicMuted', String(!!g.settings.musicMuted)); }
              applyGlobalAudioFromStorage();
            }catch(_){ }
          }, 0);
        }
      }, true);
      window.__musicPersistSetup = true;
    }
    if(!window.__soundPersistSetup){
      document.addEventListener('click', (e)=>{
        if (window.__useDirectAudioBinding) return; // guard: direct binding will handle
        const t = e.target; if (!t) return;
        const btn = (t.id === 'soundToggleBtn') ? t : (t.closest && t.closest('#soundToggleBtn'));
        if (btn){
          setTimeout(()=>{
            try{
              const g = window.game; if (g && g.settings){ localStorage.setItem('soundMuted', String(!!g.settings.soundMuted)); }
              applyGlobalAudioFromStorage();
            }catch(_){ }
          }, 0);
        }
      }, true);
      window.__soundPersistSetup = true;
    }
    // Bind unified volume sliders (both main menu and in-game share the same storage key)
    function bindVolumeSliders(){
      try{
        document.querySelectorAll('#volumeRange').forEach(inp => {
          if (inp.__bound) return;
          const onSlide = (e)=>{
            try{
              const v = Math.max(0, Math.min(1, parseFloat(inp.value)));
              localStorage.setItem('volume', String(v));
              // Apply immediately
              try {
                const g = window.game; if (g){
                  g.settings = g.settings||{};
                  g.settings.volume = v;
                  g.settings.masterVolume = v;
                  g.volume = v;
                  g.applyAudioSettings && g.applyAudioSettings();
                  g.saveSettings && g.saveSettings();
                }
              } catch(_){ }
              try { document.querySelectorAll('audio').forEach(a=>{ if(a && a.id!=='bgm') a.volume = v; }); } catch(_){ }
              // Mirror to all other sliders and labels
              try { document.querySelectorAll('#volumeRange, #masterVolume').forEach(o=>{ if(o!==inp) o.value = String(v); }); } catch(_){ }
              try {
                const pct = Math.round(v*100);
                const lbls = [document.getElementById('volumeValue'), document.getElementById('masterVolumeVal')].filter(Boolean);
                lbls.forEach(l=> l.textContent = pct+'%');
              } catch(_){ }
            }catch(_){ }
          };
          inp.addEventListener('input', onSlide, true);
          inp.addEventListener('change', onSlide, true);
          inp.__bound = true;
        });
      }catch(_){ }
    }
    bindVolumeSliders();
    try{ const igm = document.getElementById('inGameMenu'); if(igm){ const mo2 = new MutationObserver(()=>bindVolumeSliders()); mo2.observe(igm, {subtree:true, childList:true}); } }catch(_){ }

    // Bind in-game music volume slider
    function bindMusicVolumeSliders(){
      try{
        document.querySelectorAll('#musicVolumeRange').forEach(inp => {
          if (inp.__bound) return;
          const onSlide = ()=>{
            try{
              const v = Math.max(0, Math.min(1, parseFloat(inp.value)));
              localStorage.setItem('musicVolume', String(v));
              // Apply immediately only to music path
              try {
                const g = window.game; if (g){
                  g.settings = g.settings||{};
                  g.settings.musicVolume = v;
                  g.applyAudioSettings && g.applyAudioSettings();
                  g.saveSettings && g.saveSettings();
                }
              } catch(_){ }
              try { const bgm = document.getElementById('bgm'); if (bgm) bgm.volume = 0.4; } catch(_){ }
              // Mirror to main menu music slider and labels
              try { document.querySelectorAll('#musicVolume, #musicVolumeRange').forEach(o=>{ if(o!==inp) o.value = String(v); }); } catch(_){ }
              try {
                const pct = Math.round(v*100);
                const lbls = [document.getElementById('musicVolumeVal'), document.getElementById('musicVolumeValueIngame')].filter(Boolean);
                lbls.forEach(l=> l.textContent = pct+'%');
              } catch(_){ }
            }catch(_){ }
          };
          inp.addEventListener('input', onSlide, true);
          inp.addEventListener('change', onSlide, true);
          inp.__bound = true;
        });
      }catch(_){ }
    }
    bindMusicVolumeSliders();
    try{ const igm2 = document.getElementById('inGameMenu'); if(igm2){ const mo3 = new MutationObserver(()=>bindMusicVolumeSliders()); mo3.observe(igm2, {subtree:true, childList:true}); } }catch(_){ }

    // Bind MAIN MENU sliders to the same storage/logic so both panels work in parallel
    function bindMainMenuVolumeSliders(){
      try{
        const mv = document.getElementById('masterVolume');
        const mvLbl = document.getElementById('masterVolumeVal');
        if (mv && !mv.__bound){
          const onMaster = ()=>{
            try{
              const v = Math.max(0, Math.min(1, parseFloat(mv.value)));
              localStorage.setItem('volume', String(v));
              try { const g = window.game; if (g){ g.settings = g.settings||{}; g.settings.masterVolume = v; g.settings.volume = v; g.volume = v; g.applyAudioSettings && g.applyAudioSettings(); g.saveSettings && g.saveSettings(); } } catch(_){ }
              try { document.querySelectorAll('#volumeRange, #masterVolume').forEach(o=>{ if (o!==mv) o.value = String(v); }); } catch(_){ }
              try { const pct = Math.round(v*100); if (mvLbl) mvLbl.textContent = pct+'%'; const vv = document.getElementById('volumeValue'); if (vv) vv.textContent = pct+'%'; } catch(_){ }
              try { document.querySelectorAll('audio').forEach(a=>{ if(a && a.id!=='bgm') a.volume = v; }); } catch(_){ }
            }catch(_){ }
          };
          mv.addEventListener('input', onMaster, true);
          mv.addEventListener('change', onMaster, true);
          mv.__bound = true;
        }
        const muc = document.getElementById('musicVolume');
        const mucLbl = document.getElementById('musicVolumeVal');
        if (muc && !muc.__bound){
          const onMusic = ()=>{
            try{
              const v = Math.max(0, Math.min(1, parseFloat(muc.value)));
              localStorage.setItem('musicVolume', String(v));
              try { const g = window.game; if (g){ g.settings = g.settings||{}; g.settings.musicVolume = v; g.applyAudioSettings && g.applyAudioSettings(); g.saveSettings && g.saveSettings(); } } catch(_){ }
              try { const bgm = document.getElementById('bgm'); if (bgm) bgm.volume = v; } catch(_){ }
              try { document.querySelectorAll('#musicVolume, #musicVolumeRange').forEach(o=>{ if (o!==muc) o.value = String(v); }); } catch(_){ }
              try { const pct = Math.round(v*100); if (mucLbl) mucLbl.textContent = pct+'%'; const igLbl = document.getElementById('musicVolumeValueIngame'); if (igLbl) igLbl.textContent = pct+'%'; } catch(_){ }
            }catch(_){ }
          };
          muc.addEventListener('input', onMusic, true);
          muc.addEventListener('change', onMusic, true);
          muc.__bound = true;
        }
      }catch(_){ }
    }
    bindMainMenuVolumeSliders();
    // Rebind when settings overlay changes
    try{ const so = document.getElementById('settingsOverlay'); if(so){ const mo4 = new MutationObserver(()=>{ bindMainMenuVolumeSliders(); try{ applyGlobalAudioFromStorage(); }catch(_){ } }); mo4.observe(so, {subtree:true, childList:true, attributes:true}); } }catch(_){ }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
*/

// Minimal augmentation-only hooks (safe)
(function(){
  function onReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  onReady(()=>{
    // minimal localization helper using existing game.t(key)
    function L(key, fallback){
      try{ const g = window.game; return (g && typeof g.t==='function') ? g.t(key) : fallback; }catch(_){ return fallback; }
    }
    function applyLangToSettings(){
      try{
        document.querySelectorAll('#settingsOverlay [data-lang]').forEach(el=>{
          const k = el.getAttribute('data-lang'); if (!k) return;
          el.textContent = L(k, el.textContent);
        });
        const fpsSel = document.getElementById('fpsCapSelect');
        if (fpsSel && fpsSel.options && fpsSel.options.length){
          const opt0 = fpsSel.options[0]; if (opt0 && opt0.getAttribute('data-lang')==='unlimited') opt0.textContent = L('unlimited', opt0.textContent);
        }
      }catch(_){ }
    }
    applyLangToSettings();
    // In-game pause menu audio bindings and UI sync (active)
    if (!window.__ingameAudioSetup){
      const textOf = (g, key, fallback)=>{ try{ return (g && typeof g.t==='function') ? g.t(key) : fallback; }catch(_){ return fallback; } };
      const setChip = (id, on)=>{
        try{
          const el = document.getElementById(id);
          const g = window.game;
          if (!el) return;
          const onTxt = textOf(g, 'on', 'On');
          const offTxt = textOf(g, 'off', 'Off');
          el.textContent = on ? onTxt : offTxt;
          el.classList.remove('on','off');
          el.classList.add(on ? 'on' : 'off');
        }catch(_){ }
      };
      const setPressed = (id, pressed)=>{
        try{ const btn = document.getElementById(id); if (btn) btn.setAttribute('aria-pressed', String(!!pressed)); }catch(_){ }
      };
      const syncAudioChips = ()=>{
        try{
          const g = window.game; const s = (g && g.settings) || {};
          // Determine actual runtime mute states, falling back to settings
          const soundMuted = (typeof (g && g.muted) === 'boolean') ? !!g.muted : !!s.soundMuted;
          const soundOn = !soundMuted;
          setChip('soundState', soundOn);
          setChip('soundStateIngame', soundOn);
          // aria-pressed should reflect ON state
          setPressed('soundToggleBtn', soundOn);
          setPressed('soundToggleIngame', soundOn);
          // For music, also consider the bgm element if present
          let musicMuted;
          try {
            const bgm = document.getElementById('bgm');
            musicMuted = (typeof (g && g.musicMuted) === 'boolean') ? !!g.musicMuted : (bgm && typeof bgm.muted === 'boolean' ? !!bgm.muted : !!s.musicMuted);
          } catch(_){ musicMuted = (typeof (g && g.musicMuted) === 'boolean') ? !!g.musicMuted : !!s.musicMuted; }
          const musicOn = !musicMuted;
          setChip('musicState', musicOn);
          setChip('musicStateIngame', musicOn);
          // aria-pressed should reflect ON state
          setPressed('musicToggleBtn', musicOn);
          setPressed('musicToggleIngame', musicOn);
        }catch(_){ }
      };
      // simple debounce to avoid double toggles from multiple events
      let __lastToggleTs = 0;
      function __debounceToggle(e){
        const now = Date.now();
        if (now - __lastToggleTs < 250) return true; // ignore
        __lastToggleTs = now;
        return false;
      }
      function toggleSoundFromUI(e){
        if (e && e.__audioHandled) return; // already handled upstream
        if (__debounceToggle(e)) { try{ e && e.preventDefault && e.preventDefault(); }catch(_){} return; }
        try{
          const g = window.game; if(!g) return;
          const s = g.settings || (g.settings = {});
          s.soundMuted = !s.soundMuted;
          try { g.muted = !!s.soundMuted; } catch(_){ }
          try{ g.saveSettings && g.saveSettings(); }catch(_){ }
          try{ g.applyAudioSettings && g.applyAudioSettings(); }catch(_){ }
          try{ localStorage.setItem('soundMuted', String(!!s.soundMuted)); }catch(_){ }
          // Fallback: mute/unmute any SFX <audio> elements if game doesn't manage them
          try {
            document.querySelectorAll('audio').forEach(a=>{
              // Don't touch bgm here; sound toggle is for SFX
              if (a.id === 'bgm') return;
              a.muted = !!s.soundMuted;
            });
          } catch(_){ }
          // Re-apply to keep all UI in sync
          try{ applyGlobalAudioFromStorage && applyGlobalAudioFromStorage(); }catch(_){ }
          syncAudioChips();
        }catch(_){ }
        try{ if(e){ e.__audioHandled = true; e.preventDefault(); e.stopPropagation(); } }catch(_){ }
      }
      function toggleMusicFromUI(e){
        if (e && e.__audioHandled) return; // already handled upstream
        if (__debounceToggle(e)) { try{ e && e.preventDefault && e.preventDefault(); }catch(_){} return; }
        try{
          const g = window.game; if(!g) return;
          const s = g.settings || (g.settings = {});
          s.musicMuted = !s.musicMuted;
          try { g.musicMuted = !!s.musicMuted; } catch(_){ }
          try{ g.saveSettings && g.saveSettings(); }catch(_){ }
          try{ g.applyAudioSettings && g.applyAudioSettings(); }catch(_){ }
          try{ g.applyMusicMute && g.applyMusicMute(); }catch(_){ }
          try{ localStorage.setItem('musicMuted', String(!!s.musicMuted)); }catch(_){ }
          try{
            const bgm = document.getElementById('bgm');
            if (bgm) {
              bgm.muted = !!s.musicMuted;
              if (s.musicMuted) {
                try { bgm.pause(); } catch(_){}
              } else {
                // ensure music resumes when unmuted
                try { const p = bgm.play(); if (p && typeof p.catch === 'function') p.catch(()=>{}); } catch(_){}
              }
            }
          }catch(_){ }
          syncAudioChips();
        }catch(_){ }
        try{ if(e){ e.__audioHandled = true; e.preventDefault(); e.stopPropagation(); } }catch(_){ }
      }
      // Direct bindings to avoid any shadow DOM/overlay interception issues
      function bindIngameButtons(){
        try{
          const sb = document.getElementById('soundToggleIngame');
          const mb = document.getElementById('musicToggleIngame');
          if(sb && !sb.__bound){
            sb.addEventListener('click', toggleSoundFromUI, true);
            sb.__bound = true;
          }
          if(mb && !mb.__bound){
            mb.addEventListener('click', toggleMusicFromUI, true);
            mb.__bound = true;
          }
        }catch(_){ }
      }
      function bindMainMenuAudioButtons(){
        try{
          const sb = document.getElementById('soundToggleBtn');
          const mb = document.getElementById('musicToggleBtn');
          if(sb && !sb.__bound){ sb.addEventListener('click', toggleSoundFromUI, true); sb.__bound = true; }
          if(mb && !mb.__bound){ mb.addEventListener('click', toggleMusicFromUI, true); mb.__bound = true; }
        }catch(_){ }
      }
      bindIngameButtons();
      bindMainMenuAudioButtons();
      // Keep rebinding in case the menu is re-rendered
      const mo = new MutationObserver(()=>{ bindIngameButtons(); bindMainMenuAudioButtons(); });
      try{ const igm = document.getElementById('inGameMenu'); if(igm) {
        mo.observe(igm, {subtree:true, childList:true});
        // When menu visibility changes to shown, sync sliders/chips from storage
        const syncOnOpen = ()=>{
          try{
            const cs = window.getComputedStyle(igm);
            if (cs.display !== 'none' && cs.visibility !== 'hidden') {
              try { applyGlobalAudioFromStorage && applyGlobalAudioFromStorage(); } catch(_){ }
              try { syncAudioChips && syncAudioChips(); } catch(_){ }
              // Explicitly mirror slider values and labels from persisted values
              try {
                const clamp01 = (x)=>{ x=parseFloat(x); return isFinite(x)? Math.max(0, Math.min(1, x)) : 1; };
                let v = clamp01(localStorage.getItem('volume'));
                let mvRaw = localStorage.getItem('musicVolume');
                let mv = (isFinite(parseFloat(mvRaw)) ? clamp01(mvRaw) : v);
                try { document.querySelectorAll('#volumeRange, #masterVolume').forEach(inp => { if (inp) inp.value = String(v); }); } catch(_){ }
                try { document.querySelectorAll('#musicVolumeRange, #musicVolume').forEach(inp => { if (inp) inp.value = String(mv); }); } catch(_){ }
                const pctV = Math.round(v*100) + '%';
                const pctMV = Math.round(mv*100) + '%';
                try { const el = document.getElementById('volumeValue'); if (el) el.textContent = pctV; } catch(_){ }
                try { const el = document.getElementById('masterVolumeVal'); if (el) el.textContent = pctV; } catch(_){ }
                try { const el = document.getElementById('musicVolumeValueIngame'); if (el) el.textContent = pctMV; } catch(_){ }
                try { const el = document.getElementById('musicVolumeVal'); if (el) el.textContent = pctMV; } catch(_){ }
              } catch(_){ }
              try { applyGlobalAudioFromStorage && applyGlobalAudioFromStorage(); } catch(_){ }
              try { syncAudioChips && syncAudioChips(); } catch(_){ }
            } else {
              // no-op
            }
          }catch(_){ }
        };
        // Observe style changes to detect show/hide
        const m2 = new MutationObserver(()=>syncOnOpen());
        m2.observe(igm, { attributes:true, attributeFilter:['style','class'] });
        // Initial sync
        try{ applyGlobalAudioFromStorage && applyGlobalAudioFromStorage(); }catch(_){ }
        try{ syncAudioChips && syncAudioChips(); }catch(_){ }
      }} catch(_){ }
      // Ensure inGameMenu accepts pointer events
      try{ const igm = document.getElementById('inGameMenu'); if(igm){ igm.style.pointerEvents = 'all'; } }catch(_){ }

      // Expose global fallback used by inline onclick in HTML
      try{ window.__ingameAudioClick = function(which){ if(which==='sound') toggleSoundFromUI(); else if(which==='music') toggleMusicFromUI(); }; }catch(_){ }

      // Remove document-level click handler to avoid duplicate toggles; button-level click is sufficient
      if (!window.__ingameAudioSync){ window.__ingameAudioSync = setInterval(syncAudioChips, 400); }
      setTimeout(syncAudioChips, 0);
      window.__ingameAudioSetup = true;
    }
    // Install F8 hotkey immediately (independent of game readiness)
    if(!window.__f8Setup){ window.__f8Setup = true; }
    // Install F1 hotkey: cycle 5 -> 10 -> 15 -> 20 (boss waves)
    if(!window.__f1Setup){
      window.addEventListener('keydown', (e)=>{
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.isComposing) return;
        const isF1 = (e.code === 'F1') || (e.key === 'F1') || (e.keyCode === 112) || (e.which === 112);
        if(isF1){
          try{ e.preventDefault(); }catch(_){ }
          try{
            const seq = [5,10,15,20];
            const idx = (window.__f1Idx|0) % seq.length;
            const target = seq[idx];
            window.__f1Idx = (idx + 1) % seq.length;
            const doJump = ()=>{ try{ window.game && window.game.jumpToWave && window.game.jumpToWave(target); }catch(_){ } };
            if(window.game && typeof window.game.jumpToWave === 'function'){
              console.debug('[Glowlings] F1 -> jumpToWave(%d)', target);
              doJump();
            } else {
              console.debug('[Glowlings] F1 pressed but game not ready. Deferring jump to wave', target);
              let retries = 25; // ~5s
              const tick = ()=>{
                if(window.game && typeof window.game.jumpToWave === 'function'){ doJump(); return; }
                if(--retries > 0) setTimeout(tick, 200);
              };
              setTimeout(tick, 200);
            }
          }catch(_){ }
        }
      });
      window.__f1Setup = true;
    }
    // Install F9 hotkey immediately (independent of game readiness)
    if(!window.__f9Setup){ window.__f9Setup = true; }
    // Defer other patches until game is available (glowlings.js constructs it later)
    function installDevBindings(){
      if (window.__jumpWaveSetup) return true;
      const g = window.game;
      if(!g) return false;

    // Consumable effects are handled centrally in glowlings.html; no duplicate listeners here.

    // Shield collision patch
    try{
      const proto = g?.constructor?.prototype;
      if(proto && typeof proto.checkAICollisions === 'function' && !proto.__shieldPatched){
        const orig = proto.checkAICollisions;
        proto.checkAICollisions = function(){
          const before = this.gameState === 'playing';
          orig.apply(this, arguments);
          if(before && this.gameState !== 'playing' && window.__buffs?.shield?.charges > 0){
            window.__buffs.shield.charges -= 1;
            this.gameState = 'playing';
            try{ if(this.player){ this.player.size = Math.max(10, this.player.size * 0.85); } }catch(_){ }
          }
        };
        proto.__shieldPatched = true;
      }
    }catch(_){ }

    // Dev hotkey: Jump directly to a specific wave (F8 -> Wave 6)
    try{
      if(!g.jumpToWave){
        g.jumpToWave = function(to){
          const n = Math.max(1, to|0);
          // Reset current state minimally and start target wave
          this.inWave = false;
          this.intermissionTimer = 0;
          this.aiBots = [];
          this.projectiles = [];
          // Prepare so startNextWave lands on desired wave
          this.waveNumber = n - 1;
          if (typeof this.startNextWave === 'function') this.startNextWave();
          // Ensure UI reflects new wave
          if (typeof this.updateWaveTimerUI === 'function') this.updateWaveTimerUI();
        };
      }
      // If there was a pending jump queued before install, fulfill it now
      try {
        if (window.__pendingJumpWave && typeof g.jumpToWave === 'function') {
          const to = window.__pendingJumpWave|0; delete window.__pendingJumpWave;
          console.info('[Glowlings] Fulfilling pending jump to wave', to);
          g.jumpToWave(to);
        }
      } catch(_){}
      // (F8 binding installed earlier when DOM was ready)
    }catch(_){ }
      return true;
    }
    // Expose manual helpers for console
    window.jump6 = function(){ try{ window.game && window.game.jumpToWave && window.game.jumpToWave(6); }catch(_){ } };
    window.jump11 = function(){ try{ window.game && window.game.jumpToWave && window.game.jumpToWave(11); }catch(_){ } };
    // Try now; if not ready, poll briefly until game is present
    if(!installDevBindings()){
      const tm = setInterval(()=>{ if(installDevBindings()) clearInterval(tm); }, 200);
      // Safety: stop polling after 10s
      setTimeout(()=>clearInterval(tm), 10000);
    }
    try{ console.info('[Glowlings] Dev jump-to-wave hotkey ready (F8).'); }catch(_){ }

    // Characters overlay: open/close + icon render
    try{
      let __charactersBound = false;

      function drawIcon(canvas){
        if(!canvas) return;
        const role = canvas.getAttribute('data-role') || 'rush';
        const shape = canvas.getAttribute('data-shape') || 'circle';
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0,0,w,h);
        ctx.save();
        ctx.translate(w/2, h/2);
        // Scale drawings proportionally to the canvas size (baseline ~80px)
        // This ensures offscreen renders with larger size truly draw bigger visuals.
        const __base = 80;
        const __scale = Math.max(0.1, Math.min(4, Math.min(w, h) / __base));
        // In Characters menu only (non-offscreen, real menu canvas), shrink all EXCEPT role==='rush' by 1.5x
        const isOffscreen = !!(canvas && canvas.dataset && canvas.dataset.offscreen === '1');
        const isMenuCanvas = !isOffscreen && !!(canvas && canvas.classList && canvas.classList.contains('char-icon'));
        const isRushRole = String(canvas.getAttribute('data-role') || '').toLowerCase() === 'rush';
        const menuFactor = (isMenuCanvas && !isRushRole) ? (1/1.5) : 1; // 0.666...
        const __totalScale = __scale * menuFactor;
        ctx.scale(__totalScale, __totalScale);
        // common glow
        function glowCircle(r, inner, outer){
          const g = ctx.createRadialGradient(0,0, r*0.2, 0,0, r);
          g.addColorStop(0, inner);
          g.addColorStop(1, outer);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        }
        function drawTriangle(size){
          ctx.beginPath();
          ctx.moveTo(-size, size*0.8);
          ctx.lineTo(size, 0);
          ctx.lineTo(-size, -size*0.8);
          ctx.closePath();
          ctx.fill();
        }
        function drawSquare(size){
          ctx.beginPath();
          ctx.rect(-size, -size, size*2, size*2);
          ctx.fill();
        }
        function drawBolt(size){
          ctx.beginPath();
          ctx.moveTo(-size*0.3, -size);
          ctx.lineTo(size*0.2, -size*0.1);
          ctx.lineTo(-size*0.1, -size*0.1);
          ctx.lineTo(size*0.3, size);
          ctx.lineTo(-size*0.2, size*0.1);
          ctx.lineTo(size*0.1, size*0.1);
          ctx.closePath();
          ctx.fill();
        }

        // base color per role
        const colors = {
          rush:'#ff4444', fast:'#ff6666', shooter:'#ffa500', sniper:'#bf00ff', bloodmage:'#cc1133', berserker:'#ff2244', juggernaut:'#b3b3b3', overcharged:'#44ddff', parasite:'#55ff88', mutant:'#aaffee'
        };
        const base = colors[role] || '#ff8888';
        // subtle background glow
        glowCircle(34, base+'44', '#00000000');
        ctx.fillStyle = base;

        // draw shape body
        switch(shape){
          case 'triangle-fast': ctx.save(); ctx.scale(0.9,0.7); drawTriangle(20); ctx.restore(); break;
          case 'triangle': drawTriangle(20); break;
          case 'square': drawSquare(16); break;
          case 'bolt': drawBolt(18); break;
          case 'long-rifle':
            // body
            ctx.beginPath(); ctx.arc(-6,0,10,0,Math.PI*2); ctx.fill();
            // barrel
            ctx.fillRect(6,-2,20,4);
            // scope
            ctx.fillRect(2,-5,8,3);
            break;
          case 'spider':
            // core
            ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = base;
            for(let i=0;i<6;i++){ const a = (i/6)*Math.PI*2; ctx.beginPath(); ctx.moveTo(Math.cos(a)*10, Math.sin(a)*10); ctx.lineTo(Math.cos(a)*18, Math.sin(a)*18); ctx.stroke(); }
            break;
          case 'amoeba':
            ctx.beginPath();
            for(let i=0;i<12;i++){
              const a = (i/12)*Math.PI*2; const r = 12 + Math.sin(i*1.7)*3;
              const x = Math.cos(a)*r, y = Math.sin(a)*r;
              i===0? ctx.moveTo(x,y) : ctx.lineTo(x,y);
            }
            ctx.closePath(); ctx.fill();
            break;
          default: // circle
            ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
        }

        // role accents
        if(role==='sniper'){
          ctx.strokeStyle = '#bf00ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(34,0); ctx.stroke();
        } else if(role==='bloodmage'){
          ctx.strokeStyle = 'rgba(255,60,90,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.stroke();
        } else if(role==='overcharged'){
          ctx.strokeStyle = 'rgba(68,221,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.stroke();
        } else if(role==='berserker'){
          ctx.strokeStyle = 'rgba(255,34,68,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-18,14); ctx.lineTo(-4,4); ctx.stroke();
        } else if(role==='juggernaut'){
          ctx.strokeStyle = 'rgba(179,179,179,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,16,16,0,Math.PI); ctx.stroke();
        } else if(role==='parasite'){
          ctx.fillStyle = 'rgba(120,255,160,0.25)'; ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
        } else if(role==='mutant'){
          // subtle inner hue
          glowCircle(16, base+'55', '#0000');
        }

        ctx.restore();
      }

      function renderAllIcons(){
        document.querySelectorAll('#charactersOverlay .char-icon').forEach(drawIcon);
      }
      // Expose for external calls
      window.renderAllCharacterIcons = function(){ try{ renderAllIcons(); }catch(_){ } };

      // Offscreen renderer to draw the same icon visuals onto any 2D ctx (used in-game)
      // roleOrShape: e.g., 'rush', 'fast', 'shooter', or shape id like 'circle','triangle','square','long-rifle','bolt','spider','amoeba','triangle-fast'
      // size: pixel size of square icon region to blit
      (function(){
        const cache = new Map(); // key: `${keyShape}|${size}|${dpr}` -> canvas
        function makeKey(shape, size, dpr){ return `${shape}|${size}|${dpr}`; }
        function renderOffscreen(shape, size, dpr){
          const cv = document.createElement('canvas');
          cv.width = Math.max(8, Math.floor(size * dpr));
          cv.height = Math.max(8, Math.floor(size * dpr));
          // Prepare dataset so existing drawIcon can render consistently
          try {
            cv.className = 'char-icon';
            cv.dataset.shape = shape;
            cv.dataset.offscreen = '1';
            // Heuristic role from shape to let drawIcon pick styling cues
            const roleGuess = (
              shape.includes('triangle') ? 'shooter' :
              shape.includes('square') ? 'juggernaut' :
              shape.includes('bolt') ? 'overcharged' :
              shape.includes('spider') ? 'parasite' :
              shape.includes('rifle') ? 'sniper' :
              shape.includes('amoeba') ? 'mutant' :
              shape.includes('circle') ? 'rush' : 'rush'
            );
            cv.dataset.role = roleGuess;
          } catch(_){ }
          try { drawIcon(cv); } catch(_){ }
          return cv;
        }
        window.drawCharacterIconOnCtx = function(ctx, roleOrShape, x, y, size){
          try{
            const raw = String(roleOrShape || 'circle').toLowerCase();
            const parts = raw.split('|');
            const shape = parts[0];
            const isInGame = parts.includes('ingame');
            const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
            // In-game scaling:
            // - Desktop: 2x for all
            // - Mobile: Rush (circle) 3x, others 2x
            // Non in-game: 1x
            const isMobile = (("ontouchstart" in window) || (navigator.maxTouchPoints > 0)) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
            const isRushCircleShape = shape === 'circle';
            let factor = 1;
            if (isInGame) {
              if (isMobile) {
                factor = isRushCircleShape ? 3 : 2;
              } else {
                factor = 2;
              }
            }
            const drawSize = Math.max(8, Math.round(size * factor));
            const key = makeKey(shape, drawSize, dpr);
            let cv = cache.get(key);
            if(!cv){
              cv = renderOffscreen(shape, drawSize, dpr);
              cache.set(key, cv);
              // simple cache cap
              if(cache.size > 64){
                const first = cache.keys().next().value; cache.delete(first);
              }
            }
            const w = drawSize; const h = drawSize;
            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(cv, Math.round(x - w/2), Math.round(y - h/2), w, h);
            ctx.restore();
            return true;
          }catch(_){ return false; }
        }
      })();

      // Removed hard-coded Turkish overrides to respect current language

      // Helper to refresh headings and icons when overlay opens
      window.refreshCharactersOverlay = function(){
        try{
          const overlay = document.getElementById('charactersOverlay');
          if(!overlay) return;
          const title = overlay.querySelector('[data-lang="charactersTitle"]');
          const sub = overlay.querySelector('[data-lang="charactersSubtitle"]');
          if(title && (!title.textContent || title.textContent.trim().length === 0)) title.textContent = 'Karakterler';
          if(sub && (!sub.textContent || sub.textContent.trim().length === 0)) sub.textContent = 'Temelden zora tüm düşman arketiplerinin görseli ve açıklaması.';
          // Re-render icons; also nudge canvases to ensure size is respected
          overlay.querySelectorAll('.char-icon').forEach(cv => { try{ cv.width = cv.width; }catch(_){ } });
          renderAllIcons();
          setTimeout(()=>{ try{ renderAllIcons(); }catch(_){ } }, 30);
        }catch(_){ }
      };

      const overlay = document.getElementById('charactersOverlay');
      if(overlay){
        // Global helpers
        window.openCharactersOverlay = function(){
          try{
            // Ensure overlay is a direct child of body (escape parent stacking contexts)
            try { if (overlay.parentElement !== document.body) document.body.appendChild(overlay); } catch(_){ }
            // Hide start screen so it cannot sit on top
            try { const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'none'; } catch(_){ }
            // Apply strong, topmost, full-screen styles with !important
            try {
              overlay.style.setProperty('position','fixed','important');
              overlay.style.setProperty('inset','0','important');
              overlay.style.setProperty('left','0','important');
              overlay.style.setProperty('top','0','important');
              overlay.style.setProperty('width','100vw','important');
              overlay.style.setProperty('height','100vh','important');
              overlay.style.setProperty('display','block','important');
              overlay.style.setProperty('visibility','visible','important');
              overlay.style.setProperty('opacity','1','important');
              overlay.style.setProperty('pointer-events','all','important');
              overlay.style.setProperty('z-index','2147483647','important');
            } catch(_){
              overlay.style.display = 'block';
              overlay.style.visibility = 'visible';
              overlay.style.opacity = '1';
              overlay.style.pointerEvents = 'all';
              overlay.style.zIndex = '2147483647';
            }
            // Mark open time to suppress immediate backdrop-close from same click
            try { window.__charactersOverlayOpenedAt = Date.now(); } catch(_){ }
            renderAllIcons();
            try{ window.refreshCharactersOverlay && window.refreshCharactersOverlay(); }catch(_){ }
            // Ensure visible against external toggles
            let tries = 10;
            const tick = ()=>{
              try{
                const cs = window.getComputedStyle(overlay);
                if(cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none'){
                  try {
                    overlay.style.setProperty('display','block','important');
                    overlay.style.setProperty('visibility','visible','important');
                    overlay.style.setProperty('pointer-events','all','important');
                    overlay.style.setProperty('z-index','2147483647','important');
                  } catch(_){
                    overlay.style.display = 'block';
                    overlay.style.visibility = 'visible';
                    overlay.style.pointerEvents = 'all';
                    overlay.style.zIndex = '2147483647';
                  }
                }
              }catch(_){ }
              if(--tries > 0) setTimeout(tick, 30);
            };
            setTimeout(tick, 30);
          }catch(_){ }
        };
        window.closeCharactersOverlay = function(){
          try{
            overlay.style.display = 'none';
            overlay.style.visibility = '';
            overlay.style.opacity = '';
            overlay.style.pointerEvents = '';
          }catch(_){ }
          // Restore start menu only if we are in main menu, not during gameplay
          try{
            const ss = document.getElementById('startScreen');
            const g = window.game;
            const inMenu = !g || g.gameState === 'menu';
            if (ss && inMenu) ss.style.display = 'block';
          }catch(_){ }
        };
        // ESC to close
        document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') window.closeCharactersOverlay(); });
        // Backdrop click to close (only if clicked outside inner box)
        overlay.addEventListener('click', (e)=>{
          try{
            // Ignore clicks that occur immediately after opening (same user click)
            const t0 = window.__charactersOverlayOpenedAt || 0;
            if (Date.now() - t0 < 200) return;
          }catch(_){ }
          if(e.target === overlay) window.closeCharactersOverlay();
        });
      }
      // Builds overlay: open/close (mirror strong behavior)
      try{
        const builds = document.getElementById('buildsOverlay');
        if(builds){
          window.openBuildsOverlay = function(){
            try{
              try { if (builds.parentElement !== document.body) document.body.appendChild(builds); } catch(_){ }
              try { const ss = document.getElementById('startScreen'); if (ss) ss.style.display = 'none'; } catch(_){ }
              try {
                builds.style.setProperty('position','fixed','important');
                builds.style.setProperty('inset','0','important');
                builds.style.setProperty('left','0','important');
                builds.style.setProperty('top','0','important');
                builds.style.setProperty('width','100vw','important');
                builds.style.setProperty('height','100vh','important');
                builds.style.setProperty('display','block','important');
                builds.style.setProperty('visibility','visible','important');
                builds.style.setProperty('opacity','1','important');
                builds.style.setProperty('pointer-events','all','important');
                builds.style.setProperty('z-index','2147483647','important');
              } catch(_){
                builds.style.display = 'block';
                builds.style.visibility = 'visible';
                builds.style.opacity = '1';
                builds.style.pointerEvents = 'all';
                builds.style.zIndex = '2147483647';
              }
              // Mark open time
              try { window.__buildsOverlayOpenedAt = Date.now(); } catch(_){ }
              // Ensure visible against external toggles
              let tries = 10;
              const tick = ()=>{
                try{
                  const cs = window.getComputedStyle(builds);
                  if(cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none'){
                    try {
                      builds.style.setProperty('display','block','important');
                      builds.style.setProperty('visibility','visible','important');
                      builds.style.setProperty('pointer-events','all','important');
                      builds.style.setProperty('z-index','2147483647','important');
                    } catch(_){
                      builds.style.display = 'block';
                      builds.style.visibility = 'visible';
                      builds.style.pointerEvents = 'all';
                      builds.style.zIndex = '2147483647';
                    }
                  }
                }catch(_){ }
                if(--tries > 0) setTimeout(tick, 30);
              };
              setTimeout(tick, 30);
            }catch(_){ }
          };
          window.closeBuildsOverlay = function(){
            try{
              builds.style.display = 'none';
              builds.style.visibility = '';
              builds.style.opacity = '';
              builds.style.pointerEvents = '';
            }catch(_){ }
            // Restore start menu when builds overlay closes only if in main menu
            try{
              const ss = document.getElementById('startScreen');
              const g = window.game;
              const inMenu = !g || g.gameState === 'menu';
              if (ss && inMenu) ss.style.display = 'block';
            }catch(_){ }
          };
          // ESC to close
          try{
            const bOv = document.getElementById('buildsOverlay');
            if (bOv){
              document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') window.closeBuildsOverlay(); });
              // Backdrop click to close only when clicking the backdrop itself
              bOv.addEventListener('click', (e)=>{
                try{
                  const t0 = window.__buildsOverlayOpenedAt || 0;
                  if (Date.now() - t0 < 200) return;
                }catch(_){ }
                if(e.target === bOv) window.closeBuildsOverlay();
              });
            }
          }catch(_){ }
        }
      }catch(_){ }

      // Back to Menu: defensive cleanup then navigate to index.html
      (function bindBackToMenu(){
        function hardHide(id){ try{ const el = document.getElementById(id); if(el){ el.style.display='none'; el.style.visibility='hidden'; el.style.opacity='0'; el.style.pointerEvents='none'; } }catch(_){ }
        }
        function exitFullscreen(){
          try{ if (document.fullscreenElement){ const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen; if (fn){ const p = fn.call(document); if(p&&p.catch) p.catch(()=>{}); } } }catch(_){ }
        }
        function pauseAllMedia(){
          try{ document.querySelectorAll('audio, video').forEach(m=>{ try{ if(m.pause) m.pause(); m.muted = true; }catch(_){ } }); }catch(_){ }
        }
        function tryStopGame(){
          try{
            const g = window.game;
            if(!g) return;
            if(typeof g.stop === 'function') g.stop();
            if(typeof g.stopGame === 'function') g.stopGame();
            if(typeof g.endGame === 'function') g.endGame();
            if(typeof g.dispose === 'function') g.dispose();
            if(typeof g.destroy === 'function') g.destroy();
            if(typeof g.teardown === 'function') g.teardown();
            if(g.rafId) { try{ cancelAnimationFrame(g.rafId); }catch(_){ } }
            g.gameState = 'menu';
          }catch(_){ }
        }
        function clearIntervals(){
          try{ if(window.__ingameAudioSync){ clearInterval(window.__ingameAudioSync); window.__ingameAudioSync = null; } }catch(_){ }
          try{ if(window.__noStartGuard){ clearInterval(window.__noStartGuard); window.__noStartGuard = null; } }catch(_){ }
        }
        function resetBodyClasses(){
          try{ document.body && document.body.classList && ['playing','menu-open','shop-open'].forEach(c=>document.body.classList.remove(c)); }catch(_){ }
        }
        function hideAllOverlays(){
          ['gameOverScreen','inGameMenu','shopOverlay','settingsOverlay','elementSelectOverlay','charactersOverlay','buildsOverlay','cutsceneOverlay','howToOverlay','consumableBar','touchControls','startScreen']
            .forEach(hardHide);
          ['ui','gameUI','timer','debugOverlay','statsPanel'].forEach(hardHide);
        }
        function goHome(){
          try{ location.href = 'index.html'; }catch(_){ try{ window.location.assign('index.html'); }catch(__){} }
        }
        function backToMenu(){
          tryStopGame();
          clearIntervals();
          pauseAllMedia();
          exitFullscreen();
          resetBodyClasses();
          hideAllOverlays();
          try{ setTimeout(goHome, 0); }catch(_){ goHome(); }
        }
        function bind(id){
          try{
            const btn = document.getElementById(id);
            if(btn && !btn.__backBound){ btn.addEventListener('click', (e)=>{ try{ e.preventDefault(); e.stopPropagation(); }catch(_){ } backToMenu(); }, true); btn.__backBound = true; }
          }catch(_){ }
        }
        bind('backToMenuBtn');
        bind('backToMenuIngameBtn');
      })();

      }catch(_){ }

  });
})();
