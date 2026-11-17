/**
 * Lumaflect: Harmonic Relay - Main Game Logic & Loop
 * Pure Vanilla JavaScript implementation with no external frameworks or assets.
 */

(function () {
  'use strict';

  // Game States
  const STATES = {
    TITLE: 'TITLE',
    MANUAL: 'MANUAL',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER',
    VICTORY: 'VICTORY'
  };

  class GameApp {
    constructor() {
      this.state = STATES.TITLE;
      this.canvas = document.getElementById('game-canvas');
      this.renderer = new Renderer(this.canvas);

      // DOM UI Elements
      this.hud = document.getElementById('hud');
      this.integrityBar = document.getElementById('integrity-bar');
      this.integrityVal = document.getElementById('integrity-value');
      this.energyBar = document.getElementById('energy-bar');
      this.energyVal = document.getElementById('energy-value');
      this.waveVal = document.getElementById('wave-value');
      this.polarityIndicator = document.getElementById('polarity-indicator');
      this.scoreVal = document.getElementById('score-value');
      this.multiplierVal = document.getElementById('multiplier-value');

      this.titleScreen = document.getElementById('title-screen');
      this.manualScreen = document.getElementById('manual-screen');
      this.pauseScreen = document.getElementById('pause-screen');
      this.gameoverScreen = document.getElementById('gameover-screen');
      this.victoryScreen = document.getElementById('victory-screen');
      this.titleHighScore = document.getElementById('title-high-score');

      // Final stats UI
      this.finalScore = document.getElementById('final-score');
      this.finalPhase = document.getElementById('final-phase');
      this.finalChain = document.getElementById('final-chain');
      this.finalStrands = document.getElementById('final-strands');
      this.vicScore = document.getElementById('vic-score');
      this.vicRating = document.getElementById('vic-rating');
      this.vicTime = document.getElementById('vic-time');
      this.vicStrands = document.getElementById('vic-strands');

      // Game Entities & State
      this.player = new Entities.Resonator(window.innerWidth / 2, window.innerHeight / 2);
      this.nodes = [];
      this.pulses = [];
      this.strands = [];
      this.anomalies = [];
      this.particles = [];
      this.popups = [];

      this.score = 0;
      this.highScore = this.loadHighScore();
      this.multiplier = 1.0;
      this.maxMultiplierAchieved = 1.0;
      this.multiplierDecayTimer = 0;
      this.totalStrandsFormed = 0;
      this.currentPhase = 1;
      this.maxPhases = 5;
      this.phaseProgress = 0;
      this.phaseTarget = 1000;
      this.gameStartTime = 0;
      this.gameElapsedTime = 0;

      // Anomaly spawn timers
      this.anomalySpawnTimer = 0;
      this.anomalyInterval = 4.5;

      // Input State
      this.input = {
        left: false,
        right: false,
        up: false,
        down: false,
        useMouseAim: true,
        hasMouseMoved: false,
        mouseX: window.innerWidth / 2,
        mouseY: window.innerHeight / 2
      };

      this.lastTimestamp = 0;

      this.bindInputs();
      this.bindUI();
      this.updateTitleHighScore();
      this.spawnPhaseNodes(1);

      // Start animation loop
      requestAnimationFrame((ts) => this.loop(ts));
    }

    loadHighScore() {
      try {
        return parseInt(localStorage.getItem('lumaflect_high_score') || '0', 10);
      } catch (e) {
        return 0;
      }
    }

    saveHighScore(val) {
      if (val > this.highScore) {
        this.highScore = val;
        try {
          localStorage.setItem('lumaflect_high_score', this.highScore.toString());
        } catch (e) {}
      }
    }

    updateTitleHighScore() {
      if (this.titleHighScore) {
        this.titleHighScore.textContent = this.highScore.toLocaleString();
      }
    }

    resetInputs() {
      this.input.left = false;
      this.input.right = false;
      this.input.up = false;
      this.input.down = false;
    }

    bindInputs() {
      window.addEventListener('keydown', (e) => {
        // Prevent default scrolling on game keys
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }

        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.up = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.down = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = true;

        // Avoid repeated keydown actions on held keys
        if (e.repeat) return;

        if (e.code === 'Space') {
          if (this.state === STATES.PLAYING) {
            this.player.togglePolarity();
            this.updatePolarityUI();
          }
        }

        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyE') {
          if (this.state === STATES.PLAYING) {
            this.triggerStrandAnchor();
          }
        }

        if (e.code === 'KeyP' || e.code === 'Escape') {
          this.togglePause();
        }

        if (e.code === 'KeyM') {
          this.toggleMute();
        }

        if (e.code === 'KeyR') {
          if (this.state === STATES.GAMEOVER || this.state === STATES.VICTORY || this.state === STATES.PAUSED) {
            this.startNewGame();
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.up = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.down = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = false;
      });

      // Window blur & visibility change handling: reset direction inputs and pause active play
      window.addEventListener('blur', () => {
        this.resetInputs();
        if (this.state === STATES.PLAYING) {
          this.switchState(STATES.PAUSED);
        }
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.resetInputs();
          if (this.state === STATES.PLAYING) {
            this.switchState(STATES.PAUSED);
          }
        }
      });

      window.addEventListener('mousemove', (e) => {
        this.input.hasMouseMoved = true;
        this.input.mouseX = e.clientX;
        this.input.mouseY = e.clientY;
      });

      this.canvas.addEventListener('mousedown', (e) => {
        if (this.state !== STATES.PLAYING) return;
        if (e.button === 0) {
          // Left click toggles polarity
          this.player.togglePolarity();
          this.updatePolarityUI();
        } else if (e.button === 2) {
          // Right click anchors strand
          e.preventDefault();
          this.triggerStrandAnchor();
        }
      });

      // Disable context menu on canvas
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    bindUI() {
      // Title Screen Buttons
      document.getElementById('btn-start').addEventListener('click', () => {
        window.sound.init();
        this.startNewGame();
      });

      document.getElementById('btn-how-to').addEventListener('click', () => {
        this.switchState(STATES.MANUAL);
      });

      document.getElementById('btn-manual-back').addEventListener('click', () => {
        this.switchState(STATES.TITLE);
      });

      // HUD buttons
      document.getElementById('btn-sound').addEventListener('click', () => {
        this.toggleMute();
      });

      document.getElementById('btn-pause').addEventListener('click', () => {
        this.togglePause();
      });

      // Pause Screen Buttons
      document.getElementById('btn-resume').addEventListener('click', () => {
        this.togglePause();
      });

      document.getElementById('btn-restart-pause').addEventListener('click', () => {
        this.startNewGame();
      });

      document.getElementById('btn-quit-pause').addEventListener('click', () => {
        this.switchState(STATES.TITLE);
      });

      // Game Over Buttons
      document.getElementById('btn-restart-dead').addEventListener('click', () => {
        this.startNewGame();
      });

      document.getElementById('btn-quit-dead').addEventListener('click', () => {
        this.switchState(STATES.TITLE);
      });

      // Victory Buttons
      document.getElementById('btn-restart-vic').addEventListener('click', () => {
        this.startNewGame();
      });

      document.getElementById('btn-quit-vic').addEventListener('click', () => {
        this.switchState(STATES.TITLE);
      });
    }

    switchState(newState) {
      this.state = newState;
      if (newState !== STATES.PLAYING) {
        this.resetInputs();
      }

      // Hide all overlay screens
      this.titleScreen.classList.add('hidden');
      this.manualScreen.classList.add('hidden');
      this.pauseScreen.classList.add('hidden');
      this.gameoverScreen.classList.add('hidden');
      this.victoryScreen.classList.add('hidden');

      if (newState === STATES.TITLE) {
        this.hud.classList.add('hidden');
        this.titleScreen.classList.remove('hidden');
        this.updateTitleHighScore();
      } else if (newState === STATES.MANUAL) {
        this.hud.classList.add('hidden');
        this.manualScreen.classList.remove('hidden');
      } else if (newState === STATES.PLAYING) {
        this.hud.classList.remove('hidden');
      } else if (newState === STATES.PAUSED) {
        this.pauseScreen.classList.remove('hidden');
      } else if (newState === STATES.GAMEOVER) {
        this.gameoverScreen.classList.remove('hidden');
      } else if (newState === STATES.VICTORY) {
        this.victoryScreen.classList.remove('hidden');
      }
    }

    togglePause() {
      if (this.state === STATES.PLAYING) {
        this.switchState(STATES.PAUSED);
      } else if (this.state === STATES.PAUSED) {
        this.switchState(STATES.PLAYING);
      }
    }

    toggleMute() {
      const isMuted = window.sound.toggleMute();
      const soundBtn = document.getElementById('btn-sound');
      if (soundBtn) {
        soundBtn.textContent = isMuted ? '🔇' : '🔊';
        soundBtn.title = isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)';
      }
    }

    startNewGame() {
      this.resetInputs();
      this.score = 0;
      this.multiplier = 1.0;
      this.maxMultiplierAchieved = 1.0;
      this.totalStrandsFormed = 0;
      this.currentPhase = 1;
      this.phaseProgress = 0;
      this.phaseTarget = 1200;
      this.gameStartTime = performance.now();
      this.gameElapsedTime = 0;
      this.anomalySpawnTimer = 0;

      this.player.reset(this.renderer.width / 2, this.renderer.height / 2);
      this.pulses = [];
      this.strands = [];
      this.anomalies = [];
      this.particles = [];
      this.popups = [];

      this.spawnPhaseNodes(this.currentPhase);
      this.updateHUD();
      this.updatePolarityUI();
      this.switchState(STATES.PLAYING);
    }

    spawnPhaseNodes(phase) {
      this.nodes = [];
      const cx = this.renderer.width / 2;
      const cy = this.renderer.height / 2;
      const rx = Math.min(this.renderer.width, this.renderer.height) * 0.32;

      let nodeCount = 3 + phase; // 4 to 8 nodes based on phase
      for (let i = 0; i < nodeCount; i++) {
        const ang = (i * Math.PI * 2) / nodeCount;
        const nx = cx + Math.cos(ang) * rx;
        const ny = cy + Math.sin(ang) * rx;
        const polarity = (i % 2 === 0) ? 'cyan' : 'amber';
        const node = new Entities.HarmonicNode(i + 1, nx, ny, polarity);

        // Escalating behaviors
        if (phase >= 2) {
          node.orbitRadius = 25 + phase * 8;
          node.orbitSpeed = (i % 2 === 0 ? 1 : -1) * (0.2 + phase * 0.08);
          node.pulseInterval = Math.max(1.3, 2.5 - phase * 0.22);
        } else {
          node.pulseInterval = 2.4;
        }

        this.nodes.push(node);
      }
    }

    triggerStrandAnchor() {
      // Find nearest node within anchor radius
      const anchorRadius = 90;
      let nearest = null;
      let minDist = Infinity;

      for (const node of this.nodes) {
        const d = Entities.Vec.dist(this.player.x, this.player.y, node.x, node.y);
        if (d < anchorRadius && d < minDist) {
          minDist = d;
          nearest = node;
        }
      }

      if (!nearest) {
        this.addPopup(this.player.x, this.player.y - 20, 'NO NODE IN RANGE', 'rgba(255, 100, 100, ALPHA)', 12);
        return;
      }

      if (this.player.energy < 25) {
        this.addPopup(this.player.x, this.player.y - 20, 'ENERGY DEPLETED', 'rgba(255, 180, 0, ALPHA)', 12);
        return;
      }

      if (!this.player.tetherAnchorNode) {
        // Anchor first end
        this.player.tetherAnchorNode = nearest;
        window.sound.playTether();
        this.addPopup(nearest.x, nearest.y - 24, 'CONDUIT ANCHORED', 'rgba(0, 240, 255, ALPHA)', 12);
        this.createParticleBurst(nearest.x, nearest.y, '#00f0ff', 12);
      } else {
        if (this.player.tetherAnchorNode.id === nearest.id) {
          // Cannot link node to itself
          return;
        }

        // Link nodeA to nodeB
        const nodeA = this.player.tetherAnchorNode;
        const nodeB = nearest;
        const strandPolarity = this.player.polarity;

        this.strands.push(new Entities.EnergyStrand(nodeA, nodeB, strandPolarity));
        this.player.tetherAnchorNode = null;
        this.player.energy = Math.max(0, this.player.energy - 25);
        this.totalStrandsFormed++;

        window.sound.playTether();
        const pts = Math.round(250 * this.multiplier);
        this.addScore(pts, (nodeA.x + nodeB.x) / 2, (nodeA.y + nodeB.y) / 2, `STRAND LINK +${pts}`);
        this.createParticleBurst((nodeA.x + nodeB.x) / 2, (nodeA.y + nodeB.y) / 2, strandPolarity === 'cyan' ? '#00f0ff' : '#ffaa00', 20);
      }
    }

    addScore(points, x, y, label) {
      this.score += points;
      this.phaseProgress += points;
      this.saveHighScore(this.score);

      if (label && x !== undefined && y !== undefined) {
        this.addPopup(x, y, label, 'rgba(255, 255, 255, ALPHA)', 13);
      }

      // Check phase progression
      if (this.phaseProgress >= this.phaseTarget) {
        this.advancePhase();
      }
    }

    advancePhase() {
      if (this.currentPhase >= this.maxPhases) {
        this.triggerVictory();
        return;
      }

      this.currentPhase++;
      this.phaseProgress = 0;
      this.phaseTarget = 1200 + this.currentPhase * 600;
      window.sound.playPhaseAdvance();

      this.addPopup(this.renderer.width / 2, this.renderer.height / 2, `HARMONIC PHASE ${this.currentPhase} REACHED!`, 'rgba(0, 255, 170, ALPHA)', 22);
      this.createParticleBurst(this.renderer.width / 2, this.renderer.height / 2, '#00ffaa', 30);

      this.spawnPhaseNodes(this.currentPhase);
      this.player.heal(40); // Reward player with health infusion
    }

    triggerVictory() {
      this.switchState(STATES.VICTORY);
      window.sound.playVictory();

      this.gameElapsedTime = (performance.now() - this.gameStartTime) / 1000;
      const mins = Math.floor(this.gameElapsedTime / 60);
      const secs = Math.floor(this.gameElapsedTime % 60);
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      let rating = 'B-RANK';
      if (this.score > 12000 && this.gameElapsedTime < 180) rating = 'S-RANK';
      else if (this.score > 8000) rating = 'A-RANK';

      this.vicScore.textContent = this.score.toLocaleString();
      this.vicRating.textContent = rating;
      this.vicTime.textContent = timeStr;
      this.vicStrands.textContent = this.totalStrandsFormed.toString();
    }

    triggerGameOver() {
      this.switchState(STATES.GAMEOVER);
      window.sound.playGameOver();

      this.finalScore.textContent = this.score.toLocaleString();
      this.finalPhase.textContent = `Phase ${this.currentPhase}`;
      this.finalChain.textContent = `x${this.maxMultiplierAchieved.toFixed(1)}`;
      this.finalStrands.textContent = this.totalStrandsFormed.toString();
    }

    addPopup(x, y, text, color, size) {
      this.popups.push(new Entities.ScorePopup(x, y, text, color, size));
    }

    createParticleBurst(x, y, hexColor, count = 16) {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 120 + 30;
        const vx = Math.cos(ang) * spd;
        const vy = Math.sin(ang) * spd;
        const size = Math.random() * 3 + 1.5;
        const lifespan = Math.random() * 0.5 + 0.3;
        const color = hexColor.startsWith('#')
          ? hexToRgba(hexColor, 'ALPHA')
          : hexColor;
        this.particles.push(new Entities.Particle(x, y, vx, vy, color, size, lifespan));
      }
    }

    updatePolarityUI() {
      const isCyan = this.player.polarity === 'cyan';
      this.polarityIndicator.textContent = isCyan ? 'CYAN [SPACE]' : 'AMBER [SPACE]';
      this.polarityIndicator.className = `polarity-tag ${isCyan ? 'cyan' : 'amber'}`;
    }

    updateHUD() {
      // Health / Integrity
      const pct = Math.max(0, Math.min(100, Math.round((this.player.integrity / this.player.maxIntegrity) * 100)));
      this.integrityBar.style.width = `${pct}%`;
      this.integrityVal.textContent = `${pct}%`;

      if (pct < 25) {
        this.integrityBar.className = 'health-bar-fill critical';
      } else if (pct < 55) {
        this.integrityBar.className = 'health-bar-fill warning';
      } else {
        this.integrityBar.className = 'health-bar-fill';
      }

      // Energy
      const energyPct = Math.max(0, Math.min(100, Math.round(this.player.energy)));
      this.energyBar.style.width = `${energyPct}%`;
      this.energyVal.textContent = `${energyPct}%`;

      // Phase, Score, Multiplier
      this.waveVal.textContent = `PHASE ${this.currentPhase} / ${this.maxPhases}`;
      this.scoreVal.textContent = this.score.toLocaleString();
      this.multiplierVal.textContent = `x${this.multiplier.toFixed(1)}`;
    }

    loop(timestamp) {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1); // Clamp delta time
      this.lastTimestamp = timestamp;

      this.update(dt);
      this.render(dt);

      requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt) {
      if (this.state !== STATES.PLAYING) return;

      const bounds = { width: this.renderer.width, height: this.renderer.height };

      // Update player
      this.player.update(dt, this.input, bounds);

      if (this.player.integrity <= 0) {
        this.triggerGameOver();
        return;
      }

      // Update chain multiplier decay
      this.multiplierDecayTimer += dt;
      if (this.multiplierDecayTimer > 3.0 && this.multiplier > 1.0) {
        this.multiplier = Math.max(1.0, this.multiplier - dt * 0.3);
      }

      // Update nodes & pulse emission
      for (const node of this.nodes) {
        node.update(dt, (emittingNode) => {
          // Emit pulse towards center or outward
          const ang = Math.random() * Math.PI * 2;
          const spd = 120 + this.currentPhase * 15;
          const vx = Math.cos(ang) * spd;
          const vy = Math.sin(ang) * spd;
          this.pulses.push(new Entities.HarmonicPulse(
            emittingNode.x, emittingNode.y, vx, vy, emittingNode.polarity
          ));
        });
      }

      // Update active pulses & collisions
      for (let i = this.pulses.length - 1; i >= 0; i--) {
        const pulse = this.pulses[i];
        pulse.update(dt, bounds);

        if (pulse.dead) {
          this.pulses.splice(i, 1);
          continue;
        }

        // Collision with player resonator
        const d = Entities.Vec.dist(this.player.x, this.player.y, pulse.x, pulse.y);
        if (d < this.player.shieldRadius + pulse.radius) {
          if (pulse.polarity === this.player.polarity) {
            // Harmonious absorption!
            this.multiplier = Math.min(8.0, this.multiplier + 0.2);
            if (this.multiplier > this.maxMultiplierAchieved) {
              this.maxMultiplierAchieved = this.multiplier;
            }
            this.multiplierDecayTimer = 0;

            const pts = Math.round(100 * this.multiplier);
            this.addScore(pts, pulse.x, pulse.y, `+${pts}`);
            this.player.heal(4);
            window.sound.playAbsorb(this.multiplier);
            this.createParticleBurst(pulse.x, pulse.y, pulse.polarity === 'cyan' ? '#00f0ff' : '#ffaa00', 8);
          } else {
            // Discordant collision!
            const hit = this.player.takeDamage(18);
            if (hit) {
              this.multiplier = 1.0;
              this.multiplierDecayTimer = 0;
              this.addPopup(this.player.x, this.player.y - 20, 'POLAR MISMATCH -18%', 'rgba(255, 56, 100, ALPHA)', 13);
              this.createParticleBurst(this.player.x, this.player.y, '#ff3864', 16);
            }
          }
          this.pulses.splice(i, 1);
        }
      }

      // Update strands
      for (let i = this.strands.length - 1; i >= 0; i--) {
        const strand = this.strands[i];
        strand.update(dt);
        if (strand.dead) {
          this.strands.splice(i, 1);
        }
      }

      // Spawn anomalies in Phase 2+
      if (this.currentPhase >= 2) {
        this.anomalySpawnTimer += dt;
        const curInterval = Math.max(1.8, this.anomalyInterval - this.currentPhase * 0.5);
        if (this.anomalySpawnTimer >= curInterval) {
          this.anomalySpawnTimer = 0;
          this.spawnDiscordAnomaly();
        }
      }

      // Update anomalies & strand intersections
      for (let i = this.anomalies.length - 1; i >= 0; i--) {
        const anom = this.anomalies[i];
        anom.update(dt, this.player, bounds);

        if (anom.dead) {
          this.anomalies.splice(i, 1);
          continue;
        }

        // Check intersection with strands
        let cleaved = false;
        for (const strand of this.strands) {
          if (strand.intersects(anom.x, anom.y, anom.radius)) {
            cleaved = true;
            break;
          }
        }

        if (cleaved) {
          window.sound.playCleave();
          this.multiplier = Math.min(8.0, this.multiplier + 0.4);
          const pts = Math.round(400 * this.multiplier);
          this.addScore(pts, anom.x, anom.y, `DISCORD CLEAVED! +${pts}`);
          this.createParticleBurst(anom.x, anom.y, '#00ffaa', 24);
          this.anomalies.splice(i, 1);
          continue;
        }

        // Collision with player
        const distToPlayer = Entities.Vec.dist(this.player.x, this.player.y, anom.x, anom.y);
        if (distToPlayer < this.player.shieldRadius + anom.radius) {
          const hit = this.player.takeDamage(25);
          if (hit) {
            this.multiplier = 1.0;
            this.addPopup(this.player.x, this.player.y - 20, 'DISCORD BREACH -25%', 'rgba(255, 56, 100, ALPHA)', 14);
            this.createParticleBurst(this.player.x, this.player.y, '#ff3864', 20);
          }
          this.anomalies.splice(i, 1);
        }
      }

      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update(dt);
        if (p.dead) this.particles.splice(i, 1);
      }

      // Update popups
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const pop = this.popups[i];
        pop.update(dt);
        if (pop.dead) this.popups.splice(i, 1);
      }

      this.updateHUD();
    }

    spawnDiscordAnomaly() {
      // Spawn at random screen edge
      const edge = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (edge === 0) { // Top
        x = Math.random() * this.renderer.width;
        y = -20;
      } else if (edge === 1) { // Bottom
        x = Math.random() * this.renderer.width;
        y = this.renderer.height + 20;
      } else if (edge === 2) { // Left
        x = -20;
        y = Math.random() * this.renderer.height;
      } else { // Right
        x = this.renderer.width + 20;
        y = Math.random() * this.renderer.height;
      }

      const speed = 75 + this.currentPhase * 16;
      this.anomalies.push(new Entities.DiscordAnomaly(x, y, this.player.x, this.player.y, speed));
    }

    render(dt) {
      this.renderer.clear();
      this.renderer.renderBackground(dt);

      // Render strands
      this.renderer.renderStrands(this.strands);

      // Render nodes
      this.renderer.renderNodes(this.nodes, this.player.tetherAnchorNode);

      // Render pulses
      this.renderer.renderPulses(this.pulses);

      // Render anomalies
      this.renderer.renderAnomalies(this.anomalies);

      // Find nearest node for player tether guide
      let nearestNode = null;
      if (this.state === STATES.PLAYING) {
        let minDist = 90;
        for (const n of this.nodes) {
          const d = Entities.Vec.dist(this.player.x, this.player.y, n.x, n.y);
          if (d < minDist) {
            minDist = d;
            nearestNode = n;
          }
        }
      }

      // Render player resonator
      this.renderer.renderResonator(this.player, nearestNode);

      // Render particles & popups
      this.renderer.renderParticles(this.particles);
      this.renderer.renderPopups(this.popups);
    }
  }

  // Color helper
  function hexToRgba(hex, alphaStr) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alphaStr})`;
  }

  // Launch when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameApp();
  });
})();
