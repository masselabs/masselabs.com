/* ═══════════════════════════════════════════════════════════
   MASSE LABS — Smooth massé ball with dramatic curved paths
   
   Simple & effective: angle-rotation approach.
   Ball has a velocity angle + speed + spin rate.
   Spin directly rotates the angle each frame → smooth curves.
   No jitter, pure elegance.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  let W, H;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const RAIL = 10;
  const R = 14;

  /* ─── Ball ─── */
  const ball = {
    x: 0, y: 0,
    speed: 0,
    angle: 0,          // direction of travel (radians)
    spin: 0,           // curve rate: how fast the angle rotates (rad/frame)
    spinDecay: 0.985,  // spin gets weaker each frame → curve straightens naturally
    friction: 0.997,   // speed decays slowly → long travel
    moving: false,
    pulse: 0,
    rotation: 0,
  };

  const trails = [];
  let activeTrail = null;
  const sparks = [];

  function initBall() {
    ball.x = W * 0.15;
    ball.y = H * 0.25;
  }
  initBall();
  window.addEventListener('resize', initBall);

  /* ─── Click ─── */
  document.addEventListener('click', (e) => {
    const tx = e.clientX;
    const ty = e.clientY;
    const dx = tx - ball.x;
    const dy = ty - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20) return;

    // Launch toward click point
    ball.angle = Math.atan2(dy, dx);
    ball.speed = Math.min(dist * 0.04, 10);

    // MASSÉ SPIN — this is what creates the curve
    // Random direction, strong enough to be very visible
    ball.spin = (0.02 + Math.random() * 0.04) * (Math.random() > 0.5 ? 1 : -1);

    ball.moving = true;

    activeTrail = { points: [{ x: ball.x, y: ball.y }], color: rndColor(), birth: Date.now() };
    trails.push(activeTrail);

    createRipple(tx, ty);
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      sparks.push({ x: tx, y: ty, vx: Math.cos(a) * (1 + Math.random() * 2.5), vy: Math.sin(a) * (1 + Math.random() * 2.5), life: 1, color: rndColor() });
    }
  });

  function rndColor() {
    return ['rgba(230,57,70,', 'rgba(245,166,35,', 'rgba(255,255,255,', 'rgba(255,200,80,'][Math.floor(Math.random() * 4)];
  }

  function createRipple(x, y) {
    const el = document.createElement('div');
    el.className = 'ripple';
    el.style.cssText = `left:${x-40}px;top:${y-40}px;width:80px;height:80px;border:1.5px solid rgba(255,255,255,0.25)`;
    document.getElementById('ripples').appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  /* ─── Update ─── */
  function updateBall() {
    if (!ball.moving) { ball.pulse += 0.02; return; }

    // CORE MASSÉ PHYSICS:
    // Spin rotates the travel direction → smooth curve
    ball.angle += ball.spin;

    // Spin decays → curve fades into straight line (like real massé)
    ball.spin *= ball.spinDecay;

    // Speed decays
    ball.speed *= ball.friction;

    // Move
    ball.x += Math.cos(ball.angle) * ball.speed;
    ball.y += Math.sin(ball.angle) * ball.speed;

    ball.rotation += ball.speed * 0.05;

    // Trail
    if (activeTrail) activeTrail.points.push({ x: ball.x, y: ball.y });

    // Cushion bounces — reflect angle + inject new spin
    const lo = RAIL + R;
    const hiX = W - RAIL - R;
    const hiY = H - RAIL - R;
    let bounced = false;

    if (ball.x < lo) {
      ball.x = lo;
      ball.angle = Math.PI - ball.angle;
      ball.speed *= 0.92;
      ball.spin = (0.015 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1);
      bounced = true;
    }
    if (ball.x > hiX) {
      ball.x = hiX;
      ball.angle = Math.PI - ball.angle;
      ball.speed *= 0.92;
      ball.spin = (0.015 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1);
      bounced = true;
    }
    if (ball.y < lo) {
      ball.y = lo;
      ball.angle = -ball.angle;
      ball.speed *= 0.92;
      ball.spin = (0.015 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1);
      bounced = true;
    }
    if (ball.y > hiY) {
      ball.y = hiY;
      ball.angle = -ball.angle;
      ball.speed *= 0.92;
      ball.spin = (0.015 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1);
      bounced = true;
    }

    if (bounced) {
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        sparks.push({ x: ball.x, y: ball.y, vx: Math.cos(a) * (0.5 + Math.random() * 2), vy: Math.sin(a) * (0.5 + Math.random() * 2), life: 1, color: 'rgba(255,255,255,' });
      }
    }

    // Stop
    if (ball.speed < 0.1) {
      ball.speed = 0; ball.spin = 0;
      ball.moving = false;
      activeTrail = null;
    }
  }

  function updateSparks() {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.95; s.vy *= 0.95;
      s.life -= 0.03;
      if (s.life <= 0) sparks.splice(i, 1);
    }
  }

  /* ─── Drawing ─── */
  function drawTable() {
    const g = ctx.createRadialGradient(W * 0.45, H * 0.4, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#1a4a7a');
    g.addColorStop(0.35, '#153f6a');
    g.addColorStop(0.7, '#11345a');
    g.addColorStop(1, '#0e3460');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Felt texture
    ctx.globalAlpha = 0.012;
    ctx.fillStyle = '#fff';
    for (let y = 0; y < H; y += 4) {
      for (let x = (y % 8 === 0 ? 0 : 2); x < W; x += 4) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.globalAlpha = 1;

    // Rails
    ctx.fillStyle = '#081e38';
    ctx.fillRect(0, 0, W, RAIL);
    ctx.fillRect(0, H - RAIL, W, RAIL);
    ctx.fillRect(0, 0, RAIL, H);
    ctx.fillRect(W - RAIL, 0, RAIL, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(RAIL, RAIL, W - RAIL * 2, H - RAIL * 2);
  }

  function drawTrails() {
    const now = Date.now();
    for (let t = trails.length - 1; t >= 0; t--) {
      const trail = trails[t];
      const age = (now - trail.birth) / 1000;
      const fade = Math.max(0, 1 - age / 15);
      if (fade <= 0) { trails.splice(t, 1); continue; }

      const pts = trail.points;
      if (pts.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
      }

      // Outer glow
      ctx.strokeStyle = trail.color + (fade * 0.18) + ')';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Core
      ctx.strokeStyle = trail.color + (fade * 0.45) + ')';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // White hot center
      ctx.strokeStyle = 'rgba(255,255,255,' + (fade * 0.22) + ')';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  function drawSparks() {
    for (const s of sparks) {
      ctx.fillStyle = s.color + s.life + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2 * s.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBall() {
    const { x, y } = ball;
    const bScale = ball.moving ? 1 : 1 + Math.sin(ball.pulse) * 0.04;
    const r = R * bScale;

    // Glow
    const gInt = ball.moving ? 0.08 + Math.min(ball.speed / 12, 0.15) : 0.05 + Math.sin(ball.pulse) * 0.03;
    const og = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
    og.addColorStop(0, `rgba(245,166,35,${gInt + 0.08})`);
    og.addColorStop(0.3, 'rgba(245,166,35,0.03)');
    og.addColorStop(1, 'rgba(245,166,35,0)');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(x, y, r * 6, 0, Math.PI * 2);
    ctx.fill();

    // Motion blur
    if (ball.speed > 2) {
      const len = Math.min(ball.speed * 4, 50);
      const nx = Math.cos(ball.angle);
      const ny = Math.sin(ball.angle);
      const mg = ctx.createLinearGradient(x, y, x - nx * len, y - ny * len);
      mg.addColorStop(0, `rgba(245,166,35,${Math.min(ball.speed / 25, 0.15)})`);
      mg.addColorStop(1, 'rgba(245,166,35,0)');
      ctx.strokeStyle = mg;
      ctx.lineWidth = r * 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - nx * len, y - ny * len);
      ctx.stroke();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 4, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball body
    ctx.save();
    ctx.translate(x, y);
    const bg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r);
    bg.addColorStop(0, '#fff5d4');
    bg.addColorStop(0.3, '#f5c842');
    bg.addColorStop(0.65, '#e8a820');
    bg.addColorStop(0.85, '#c8880a');
    bg.addColorStop(1, '#a06800');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Spinning red dots
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.rotate(ball.rotation);
    ctx.fillStyle = 'rgba(160,80,0,0.2)';
    const dr = r * 0.08;
    ctx.beginPath(); ctx.arc(r * 0.4, 0, dr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.35, dr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -r * 0.45, dr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.15, dr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.15, r * 0.4, dr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Specular
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.28, -r * 0.33, r * 0.3, r * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(r * 0.15, r * 0.28, r * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* ─── Loop ─── */
  function frame() {
    updateBall();
    updateSparks();
    drawTable();
    drawTrails();
    drawSparks();
    drawBall();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ─── Typing ─── */
  const phrases = ['artfully engineered.', 'where math becomes magic.', 'proven, never shown.', 'the art of making things invisible.', 'by design, not by trust.'];
  let pi = 0, ci = 0, del = false, pause = 0;
  const typed = document.getElementById('typed');

  function typeLoop() {
    if (pause > 0) { pause--; setTimeout(typeLoop, 30); return; }
    const p = phrases[pi];
    if (!del) {
      ci++;
      typed.textContent = p.slice(0, ci);
      if (ci >= p.length) { pause = 100; del = true; }
      setTimeout(typeLoop, 45 + Math.random() * 40);
    } else {
      ci--;
      typed.textContent = p.slice(0, ci);
      if (ci <= 0) { del = false; pi = (pi + 1) % phrases.length; pause = 15; }
      setTimeout(typeLoop, 22);
    }
  }
  setTimeout(typeLoop, 1200);

})();
