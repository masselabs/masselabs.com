/*
  MASSE LABS
  Single masse ball with curved proof-like trails.
*/

(function () {
  'use strict';

  const canvas = document.getElementById('c');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const ripples = document.getElementById('ripples');
  let dpr = window.devicePixelRatio || 1;
  let W = 0;
  let H = 0;

  const RAIL = 10;
  const R = 10;
  const trails = [];
  let activeTrail = null;

  const ball = {
    x: 0,
    y: 0,
    speed: 0,
    angle: 0,
    spin: 0,
    spinDecay: 0.986,
    friction: 0.996,
    moving: false,
    pulse: 0,
    rotation: 0,
  };

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!ball.x || !ball.y) initBall();
  }

  function initBall() {
    ball.x = W * 0.15;
    ball.y = H * 0.25;
  }

  function rndColor() {
    const colors = [
      'rgba(245,166,35,',
      'rgba(229,75,60,',
      'rgba(255,255,255,',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function createRipple(x, y) {
    if (!ripples) return;
    const el = document.createElement('div');
    el.className = 'ripple';
    el.style.cssText = `left:${x - 40}px;top:${y - 40}px;width:80px;height:80px;border:1px solid rgba(255,255,255,0.24)`;
    ripples.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  document.addEventListener('click', (event) => {
    const dx = event.clientX - ball.x;
    const dy = event.clientY - ball.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 20) return;

    ball.angle = Math.atan2(dy, dx);
    ball.speed = Math.min(dist * 0.04, 10);
    ball.spin = (0.02 + Math.random() * 0.04) * (Math.random() > 0.5 ? 1 : -1);
    ball.moving = true;

    activeTrail = {
      points: [{ x: ball.x, y: ball.y }],
      color: rndColor(),
      birth: Date.now(),
    };
    trails.push(activeTrail);
    createRipple(event.clientX, event.clientY);
  });

  function updateBall() {
    if (!ball.moving) {
      ball.pulse += 0.02;
      return;
    }

    ball.angle += ball.spin;
    ball.spin *= ball.spinDecay;
    ball.speed *= ball.friction;
    ball.x += Math.cos(ball.angle) * ball.speed;
    ball.y += Math.sin(ball.angle) * ball.speed;
    ball.rotation += ball.speed * 0.05;

    if (activeTrail) activeTrail.points.push({ x: ball.x, y: ball.y });

    const lo = RAIL + R;
    const hiX = W - RAIL - R;
    const hiY = H - RAIL - R;

    if (ball.x < lo) {
      ball.x = lo;
      ball.angle = Math.PI - ball.angle;
      ball.speed *= 0.92;
      ball.spin *= -0.72;
    }
    if (ball.x > hiX) {
      ball.x = hiX;
      ball.angle = Math.PI - ball.angle;
      ball.speed *= 0.92;
      ball.spin *= -0.72;
    }
    if (ball.y < lo) {
      ball.y = lo;
      ball.angle = -ball.angle;
      ball.speed *= 0.92;
      ball.spin *= -0.72;
    }
    if (ball.y > hiY) {
      ball.y = hiY;
      ball.angle = -ball.angle;
      ball.speed *= 0.92;
      ball.spin *= -0.72;
    }

    if (ball.speed < 0.1) {
      ball.speed = 0;
      ball.spin = 0;
      ball.moving = false;
      activeTrail = null;
    }
  }

  function drawTable() {
    const g = ctx.createRadialGradient(W * 0.45, H * 0.4, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#1a4a7a');
    g.addColorStop(0.35, '#153f6a');
    g.addColorStop(0.7, '#11345a');
    g.addColorStop(1, '#071625');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.012;
    ctx.fillStyle = '#fff';
    for (let y = 0; y < H; y += 4) {
      for (let x = y % 8 === 0 ? 0 : 2; x < W; x += 4) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#081e38';
    ctx.fillRect(0, 0, W, RAIL);
    ctx.fillRect(0, H - RAIL, W, RAIL);
    ctx.fillRect(0, 0, RAIL, H);
    ctx.fillRect(W - RAIL, 0, RAIL, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(RAIL, RAIL, W - RAIL * 2, H - RAIL * 2);
  }

  function drawTrails() {
    const now = Date.now();
    for (let t = trails.length - 1; t >= 0; t--) {
      const trail = trails[t];
      const age = (now - trail.birth) / 1000;
      const fade = Math.max(0, 1 - age / 13);
      if (fade <= 0) {
        trails.splice(t, 1);
        continue;
      }

      const pts = trail.points;
      if (pts.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        ctx.quadraticCurveTo(
          pts[i].x,
          pts[i].y,
          (pts[i].x + pts[i + 1].x) / 2,
          (pts[i].y + pts[i + 1].y) / 2
        );
      }

      ctx.strokeStyle = trail.color + fade * 0.15 + ')';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = trail.color + fade * 0.42 + ')';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,' + fade * 0.18 + ')';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  function drawBall() {
    const scale = ball.moving ? 1 : 1 + Math.sin(ball.pulse) * 0.04;
    const r = R * scale;

    const glow = ball.moving
      ? 0.08 + Math.min(ball.speed / 12, 0.15)
      : 0.05 + Math.sin(ball.pulse) * 0.03;
    const og = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, r * 6);
    og.addColorStop(0, `rgba(245,166,35,${glow + 0.08})`);
    og.addColorStop(0.3, 'rgba(245,166,35,0.03)');
    og.addColorStop(1, 'rgba(245,166,35,0)');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r * 6, 0, Math.PI * 2);
    ctx.fill();

    if (ball.speed > 2) {
      const len = Math.min(ball.speed * 4, 50);
      const nx = Math.cos(ball.angle);
      const ny = Math.sin(ball.angle);
      const mg = ctx.createLinearGradient(ball.x, ball.y, ball.x - nx * len, ball.y - ny * len);
      mg.addColorStop(0, `rgba(245,166,35,${Math.min(ball.speed / 25, 0.15)})`);
      mg.addColorStop(1, 'rgba(245,166,35,0)');
      ctx.strokeStyle = mg;
      ctx.lineWidth = r * 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ball.x - nx * len, ball.y - ny * len);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.ellipse(ball.x + 2, ball.y + 4, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ball.x, ball.y);
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

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.rotate(ball.rotation);
    ctx.fillStyle = 'rgba(160,80,0,0.18)';
    const dr = r * 0.08;
    ctx.beginPath(); ctx.arc(r * 0.4, 0, dr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.35, dr, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -r * 0.45, dr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.28, -r * 0.33, r * 0.3, r * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function frame() {
    updateBall();
    drawTable();
    drawTrails();
    drawBall();
    requestAnimationFrame(frame);
  }

  resize();
  initBall();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);

  const phrases = [
    'proven, never exposed.',
    'verified without custody.',
    'private by architecture.',
    'for mobile, dApps, and agents.',
    'by design, not by trust.',
  ];
  const typed = document.getElementById('typed');
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let pause = 0;

  function typeLoop() {
    if (!typed) return;
    if (pause > 0) {
      pause--;
      setTimeout(typeLoop, 30);
      return;
    }

    const phrase = phrases[phraseIndex];
    if (!deleting) {
      charIndex++;
      typed.textContent = phrase.slice(0, charIndex);
      if (charIndex >= phrase.length) {
        pause = 100;
        deleting = true;
      }
      setTimeout(typeLoop, 45 + Math.random() * 40);
      return;
    }

    charIndex--;
    typed.textContent = phrase.slice(0, charIndex);
    if (charIndex <= 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      pause = 15;
    }
    setTimeout(typeLoop, 22);
  }

  setTimeout(typeLoop, 1200);
})();
