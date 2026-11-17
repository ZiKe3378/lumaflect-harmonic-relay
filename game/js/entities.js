/**
 * Lumaflect: Harmonic Relay - Entity Definitions
 * Modular OOP entities for Resonator, Nodes, Pulses, Strands, Anomalies, and Particles.
 */

// Helper vector math
const Vec = {
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  distSq: (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2,
  lerp: (a, b, t) => a + (b - a) * t,
  lineIntersectsCircle: (x1, y1, x2, y2, cx, cy, r) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(cx - x1, cy - y1) <= r;
    let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;
    return Math.hypot(cx - nearestX, cy - nearestY) <= r;
  }
};

/**
 * Player Core Resonator
 */
class Resonator {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 16;
    this.shieldRadius = 24;
    this.polarity = 'cyan'; // 'cyan' or 'amber'
    this.maxIntegrity = 100;
    this.integrity = 100;
    this.maxEnergy = 100;
    this.energy = 100;
    this.energyRegenRate = 12; // per second
    this.speed = 340;
    this.friction = 0.86;
    this.invulnerableTimer = 0;
    this.glowAngle = 0;
    this.tetherAnchorNode = null;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.vx = 0;
    this.vy = 0;
    this.polarity = 'cyan';
    this.integrity = 100;
    this.energy = 100;
    this.invulnerableTimer = 0;
    this.tetherAnchorNode = null;
  }

  togglePolarity() {
    this.polarity = this.polarity === 'cyan' ? 'amber' : 'cyan';
    window.sound.playPolaritySwitch(this.polarity);
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return false;
    this.integrity = Math.max(0, this.integrity - amount);
    this.invulnerableTimer = 0.8; // 800ms i-frames
    window.sound.playDamage();
    return true;
  }

  heal(amount) {
    this.integrity = Math.min(this.maxIntegrity, this.integrity + amount);
  }

  update(dt, input, bounds) {
    this.glowAngle += dt * 3.5;

    // Regen energy
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
    }

    // Invulnerability decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Keyboard / direct vector movement
    let ax = 0;
    let ay = 0;
    if (input.left) ax -= 1;
    if (input.right) ax += 1;
    if (input.up) ay -= 1;
    if (input.down) ay += 1;

    if (ax !== 0 && ay !== 0) {
      const mag = Math.SQRT1_2;
      ax *= mag;
      ay *= mag;
    }

    if (ax !== 0 || ay !== 0) {
      this.vx += ax * this.speed * dt * 5;
      this.vy += ay * this.speed * dt * 5;
    } else if (input.useMouseAim && input.hasMouseMoved) {
      // Smooth pursuit toward mouse pointer
      const dx = input.mouseX - this.x;
      const dy = input.mouseY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        const moveStep = Math.min(dist * 6, this.speed);
        this.vx += (dx / dist) * moveStep * dt * 4;
        this.vy += (dy / dist) * moveStep * dt * 4;
      }
    }

    // Velocity integration & friction
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(this.friction, dt * 60);
    this.vy *= Math.pow(this.friction, dt * 60);

    // Keep within bounds
    const pad = this.shieldRadius + 8;
    this.x = Math.max(pad, Math.min(bounds.width - pad, this.x));
    this.y = Math.max(pad + 40, Math.min(bounds.height - pad, this.y));
  }
}

/**
 * Harmonic Energy Node
 */
class HarmonicNode {
  constructor(id, x, y, polarity = 'cyan') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
    this.polarity = polarity;
    this.radius = 22;
    this.pulseInterval = 2.4;
    this.pulseTimer = Math.random() * this.pulseInterval;
    this.rotation = Math.random() * Math.PI * 2;
    this.orbitRadius = 0;
    this.orbitSpeed = 0;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.charge = 1;
    this.pulseRings = [];
  }

  update(dt, pulseCallback) {
    this.rotation += dt * 0.8;

    // Orbital drift if assigned
    if (this.orbitRadius > 0) {
      this.orbitAngle += this.orbitSpeed * dt;
      this.x = this.baseX + Math.cos(this.orbitAngle) * this.orbitRadius;
      this.y = this.baseY + Math.sin(this.orbitAngle) * this.orbitRadius;
    }

    // Pulse timer
    this.pulseTimer += dt;
    if (this.pulseTimer >= this.pulseInterval) {
      this.pulseTimer = 0;
      if (pulseCallback) {
        pulseCallback(this);
      }
    }
  }
}

/**
 * Radiant Pulse
 */
class HarmonicPulse {
  constructor(x, y, vx, vy, polarity) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.polarity = polarity;
    this.radius = 7;
    this.lifespan = 4.2;
    this.age = 0;
    this.dead = false;
  }

  update(dt, bounds) {
    this.age += dt;
    if (this.age >= this.lifespan) {
      this.dead = true;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < -30 || this.x > bounds.width + 30 ||
        this.y < -30 || this.y > bounds.height + 30) {
      this.dead = true;
    }
  }
}

/**
 * Energy Strand (Conduit linking two Harmonic Nodes)
 */
class EnergyStrand {
  constructor(nodeA, nodeB, polarity) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.polarity = polarity;
    this.lifespan = 9.0; // Strands endure for 9 seconds
    this.age = 0;
    this.dead = false;
    this.shimmer = 0;
  }

  update(dt) {
    this.age += dt;
    this.shimmer += dt * 5;
    if (this.age >= this.lifespan) {
      this.dead = true;
    }
  }

  intersects(x, y, radius) {
    return Vec.lineIntersectsCircle(
      this.nodeA.x, this.nodeA.y,
      this.nodeB.x, this.nodeB.y,
      x, y, radius
    );
  }
}

/**
 * Discordant Anomaly (Hostile void shards)
 */
class DiscordAnomaly {
  constructor(x, y, targetX, targetY, speed = 80) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.radius = 12;
    this.dead = false;
    this.angle = 0;

    const angle = Math.atan2(targetY - y, targetX - x);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt, player, bounds) {
    this.angle += dt * 4;

    // Slight homing tendency toward player
    const toPlayerX = player.x - this.x;
    const toPlayerY = player.y - this.y;
    const dist = Math.hypot(toPlayerX, toPlayerY);
    if (dist > 10) {
      const homingFactor = 0.6;
      this.vx += (toPlayerX / dist) * this.speed * homingFactor * dt;
      this.vy += (toPlayerY / dist) * this.speed * homingFactor * dt;

      // Limit max speed
      const curSpeed = Math.hypot(this.vx, this.vy);
      if (curSpeed > this.speed * 1.3) {
        this.vx = (this.vx / curSpeed) * this.speed * 1.3;
        this.vy = (this.vy / curSpeed) * this.speed * 1.3;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < -40 || this.x > bounds.width + 40 ||
        this.y < -40 || this.y > bounds.height + 40) {
      this.dead = true;
    }
  }
}

/**
 * Particle Spark / Burst
 */
class Particle {
  constructor(x, y, vx, vy, color, size, lifespan) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifespan = lifespan;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    if (this.age >= this.lifespan) {
      this.dead = true;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.94;
    this.vy *= 0.94;
  }
}

/**
 * Floating Text Popup (Scores, Multipliers, Alerts)
 */
class ScorePopup {
  constructor(x, y, text, color = '#ffffff', size = 14) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.lifespan = 0.9;
    this.age = 0;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    this.y -= dt * 30; // Float upwards
    if (this.age >= this.lifespan) {
      this.dead = true;
    }
  }
}

// Export to window
window.Entities = {
  Vec,
  Resonator,
  HarmonicNode,
  HarmonicPulse,
  EnergyStrand,
  DiscordAnomaly,
  Particle,
  ScorePopup
};
