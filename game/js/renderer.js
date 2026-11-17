/**
 * Lumaflect: Harmonic Relay - 2D Canvas Renderer
 * Renders glowing vector art, celestial grids, particle bursts, and conduit meshes.
 */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;
    this.starfield = [];
    this.gridTime = 0;
    this.setupResize();
    this.initStarfield();
  }

  setupResize() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
    this.initStarfield();
  }

  initStarfield() {
    this.starfield = [];
    const count = Math.floor((this.width * this.height) / 8000);
    for (let i = 0; i < count; i++) {
      this.starfield.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 2 + 1,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  clear() {
    this.ctx.fillStyle = '#060914';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  renderBackground(dt) {
    this.gridTime += dt;
    const ctx = this.ctx;

    // Ambient radial cosmic glow
    const grad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.5, 50,
      this.width * 0.5, this.height * 0.5, Math.max(this.width, this.height) * 0.7
    );
    grad.addColorStop(0, 'rgba(16, 32, 68, 0.45)');
    grad.addColorStop(0.5, 'rgba(10, 18, 40, 0.25)');
    grad.addColorStop(1, 'rgba(6, 9, 20, 0.05)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle perspective grid
    const gridSize = 64;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(72, 120, 200, 0.06)';
    ctx.beginPath();
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();

    // Twinkling stars
    for (const star of this.starfield) {
      const a = star.alpha * (0.6 + 0.4 * Math.sin(this.gridTime * star.twinkleSpeed + star.twinklePhase));
      ctx.fillStyle = `rgba(226, 234, 252, ${a})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderStrands(strands) {
    const ctx = this.ctx;
    for (const strand of strands) {
      const alpha = Math.max(0, 1 - (strand.age / strand.lifespan));
      const isCyan = strand.polarity === 'cyan';
      const mainColor = isCyan ? `rgba(0, 240, 255, ${alpha})` : `rgba(255, 170, 0, ${alpha})`;
      const glowColor = isCyan ? `rgba(0, 240, 255, ${alpha * 0.4})` : `rgba(255, 170, 0, ${alpha * 0.4})`;

      // Outer wide glow beam
      ctx.lineWidth = 8;
      ctx.strokeStyle = glowColor;
      ctx.beginPath();
      ctx.moveTo(strand.nodeA.x, strand.nodeA.y);
      ctx.lineTo(strand.nodeB.x, strand.nodeB.y);
      ctx.stroke();

      // Sharp central laser line
      ctx.lineWidth = 3;
      ctx.strokeStyle = mainColor;
      ctx.beginPath();
      ctx.moveTo(strand.nodeA.x, strand.nodeA.y);
      ctx.lineTo(strand.nodeB.x, strand.nodeB.y);
      ctx.stroke();

      // Core white filament
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.moveTo(strand.nodeA.x, strand.nodeA.y);
      ctx.lineTo(strand.nodeB.x, strand.nodeB.y);
      ctx.stroke();
    }
  }

  renderNodes(nodes, anchorNode) {
    const ctx = this.ctx;
    for (const node of nodes) {
      const isCyan = node.polarity === 'cyan';
      const primary = isCyan ? '#00f0ff' : '#ffaa00';
      const glow = isCyan ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 170, 0, 0.3)';

      // Outer aura
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 8 + Math.sin(node.rotation * 3) * 3, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Anchor selection highlight if being targeted
      if (anchorNode && anchorNode.id === node.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 14, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Outer geometric ring
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(node.rotation);

      ctx.beginPath();
      ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = primary;
      ctx.stroke();

      // Segmented ticks
      const ticks = 4;
      for (let i = 0; i < ticks; i++) {
        const ang = (i * Math.PI * 2) / ticks;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (node.radius - 5), Math.sin(ang) * (node.radius - 5));
        ctx.lineTo(Math.cos(ang) * (node.radius + 5), Math.sin(ang) * (node.radius + 5));
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      ctx.restore();

      // Inner core orb
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = primary;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }

  renderPulses(pulses) {
    const ctx = this.ctx;
    for (const pulse of pulses) {
      const isCyan = pulse.polarity === 'cyan';
      const col = isCyan ? '#00f0ff' : '#ffaa00';
      const glow = isCyan ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 170, 0, 0.4)';

      // Halo
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Main orb
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();

      // Center bright pip
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }

  renderAnomalies(anomalies) {
    const ctx = this.ctx;
    for (const anom of anomalies) {
      ctx.save();
      ctx.translate(anom.x, anom.y);
      ctx.rotate(anom.angle);

      // Threat aura
      ctx.beginPath();
      ctx.arc(0, 0, anom.radius + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 56, 100, 0.3)';
      ctx.fill();

      // Jagged dark crystal diamond
      ctx.beginPath();
      ctx.moveTo(0, -anom.radius * 1.3);
      ctx.lineTo(anom.radius * 0.9, 0);
      ctx.lineTo(0, anom.radius * 1.3);
      ctx.lineTo(-anom.radius * 0.9, 0);
      ctx.closePath();

      ctx.fillStyle = '#1e050f';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ff3864';
      ctx.stroke();

      // Center void eye
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6b8b';
      ctx.fill();

      ctx.restore();
    }
  }

  renderResonator(player, nearestNode) {
    const ctx = this.ctx;

    // Tether line guide if in proximity to anchorable node
    if (nearestNode) {
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(nearestNode.x, nearestNode.y);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Invulnerability flicker
    if (player.invulnerableTimer > 0) {
      if (Math.floor(player.invulnerableTimer * 20) % 2 === 0) {
        return; // Skip drawing to flash
      }
    }

    const isCyan = player.polarity === 'cyan';
    const primary = isCyan ? '#00f0ff' : '#ffaa00';
    const glow = isCyan ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 170, 0, 0.45)';

    // Outer polar shield bubble
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.shieldRadius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = primary;
    ctx.stroke();

    // Rotating orbital rings
    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.rotate(player.glowAngle);
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Polar satellite nodes
    const sats = 3;
    for (let i = 0; i < sats; i++) {
      const ang = (i * Math.PI * 2) / sats;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * player.radius, Math.sin(ang) * player.radius, 3, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.fill();
    }

    ctx.restore();

    // Resonator core
    ctx.beginPath();
    ctx.arc(player.x, player.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = primary;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  renderParticles(particles) {
    const ctx = this.ctx;
    for (const p of particles) {
      const alpha = Math.max(0, 1 - (p.age / p.lifespan));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace('ALPHA', alpha.toFixed(2));
      ctx.fill();
    }
  }

  renderPopups(popups) {
    const ctx = this.ctx;
    for (const pop of popups) {
      const alpha = Math.max(0, 1 - (pop.age / pop.lifespan));
      ctx.font = `bold ${pop.size}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
      ctx.fillText(pop.text, pop.x + 1, pop.y + 1); // shadow
      ctx.fillStyle = pop.color.replace('ALPHA', alpha.toFixed(2));
      ctx.fillText(pop.text, pop.x, pop.y);
    }
  }
}

window.Renderer = Renderer;
