(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const startBtn = document.getElementById("start-btn");

  const W = canvas.width;
  const H = canvas.height;

  const STATE = { MENU: "menu", PLAYING: "playing", DEAD: "dead" };
  const GRAVITY = 1500;
  const FLAP = -460;
  const PIPE_GAP = 170;
  const PIPE_SPACING = 240;
  const PIPE_SPEED = 170;
  const PIPE_WIDTH = 70;
  const COIN_RADIUS = 12;
  const GROUND_H = 70;

  const BEST_KEY = "dragon_best_v1";

  const game = {
    state: STATE.MENU,
    t: 0,
    last: 0,
    score: 0,
    best: parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0,
    dragon: null,
    pipes: [],
    coins: [],
    particles: [],
    clouds: [],
    mountains: [],
    spawnX: 0,
  };

  function resetWorld() {
    game.t = 0;
    game.score = 0;
    game.pipes = [];
    game.coins = [];
    game.particles = [];
    game.spawnX = W + 80;
    game.dragon = {
      x: W * 0.28,
      y: H * 0.45,
      vy: 0,
      r: 18,
      rot: 0,
      flapPhase: 0,
      alive: true,
    };
    for (let i = 0; i < 3; i++) {
      spawnPipePair(game.spawnX + i * PIPE_SPACING);
    }
    scoreEl.textContent = "0";
    bestEl.textContent = String(game.best);
  }

  function spawnPipePair(x) {
    const margin = 70;
    const minTop = margin;
    const maxTop = H - GROUND_H - PIPE_GAP - margin;
    const topH = minTop + Math.random() * (maxTop - minTop);
    game.pipes.push({
      x,
      topH,
      gap: PIPE_GAP,
      width: PIPE_WIDTH,
      passed: false,
    });
    if (Math.random() < 0.55) {
      game.coins.push({
        x: x + PIPE_WIDTH / 2,
        y: topH + PIPE_GAP / 2,
        r: COIN_RADIUS,
        spin: 0,
        taken: false,
      });
    }
    game.spawnX = x + PIPE_SPACING;
  }

  function initBackground() {
    game.clouds = [];
    for (let i = 0; i < 6; i++) {
      game.clouds.push({
        x: Math.random() * W,
        y: 40 + Math.random() * (H * 0.45),
        s: 0.6 + Math.random() * 0.9,
        v: 8 + Math.random() * 14,
      });
    }
    game.mountains = [];
    for (let i = 0; i < 8; i++) {
      game.mountains.push({
        x: i * 90 + Math.random() * 30,
        h: 90 + Math.random() * 80,
        w: 140 + Math.random() * 80,
      });
    }
  }

  function flap() {
    if (game.state === STATE.MENU) {
      startGame();
      return;
    }
    if (game.state === STATE.DEAD) {
      return;
    }
    if (!game.dragon.alive) return;
    game.dragon.vy = FLAP;
    game.dragon.flapPhase = 0;
    spawnFlapPuff();
  }

  function spawnFlapPuff() {
    const d = game.dragon;
    for (let i = 0; i < 5; i++) {
      game.particles.push({
        x: d.x - 14,
        y: d.y + 6,
        vx: -40 - Math.random() * 60,
        vy: 20 + Math.random() * 40,
        life: 0.6,
        age: 0,
        r: 4 + Math.random() * 3,
        c: "rgba(255,255,255,0.6)",
      });
    }
  }

  function spawnDeathBurst(x, y) {
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 220;
      game.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.9,
        age: 0,
        r: 3 + Math.random() * 4,
        c: i % 2 ? "#ffcc4d" : "#e74c3c",
      });
    }
  }

  function spawnCoinSparkle(x, y) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 140;
      game.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.5,
        age: 0,
        r: 2 + Math.random() * 2,
        c: "#ffe27a",
      });
    }
  }

  function startGame() {
    resetWorld();
    game.state = STATE.PLAYING;
    overlay.classList.add("hidden");
  }

  function gameOver() {
    if (game.state !== STATE.PLAYING) return;
    game.state = STATE.DEAD;
    game.dragon.alive = false;
    spawnDeathBurst(game.dragon.x, game.dragon.y);
    if (game.score > game.best) {
      game.best = game.score;
      localStorage.setItem(BEST_KEY, String(game.best));
      bestEl.textContent = String(game.best);
    }
    setTimeout(() => {
      overlayTitle.textContent = "Опять в полёт?";
      overlayText.innerHTML =
        "Очки: <b>" +
        game.score +
        "</b> · Рекорд: <b>" +
        game.best +
        "</b><br />Нажми <b>Пробел</b> или кнопку, чтобы попробовать снова.";
      startBtn.textContent = "Заново";
      overlay.classList.remove("hidden");
    }, 700);
  }

  function update(dt) {
    game.t += dt;

    for (const c of game.clouds) {
      c.x -= c.v * dt;
      if (c.x < -80) {
        c.x = W + 40;
        c.y = 40 + Math.random() * (H * 0.45);
        c.s = 0.6 + Math.random() * 0.9;
      }
    }

    if (game.state !== STATE.PLAYING) {
      if (game.state === STATE.DEAD) {
        updateParticles(dt);
      }
      if (game.state === STATE.MENU) {
        const d = game.dragon;
        d.flapPhase += dt * 8;
        d.y = H * 0.45 + Math.sin(game.t * 2.2) * 14;
        d.rot = Math.sin(game.t * 2.2) * 0.15;
      }
      return;
    }

    const d = game.dragon;
    d.vy += GRAVITY * dt;
    d.y += d.vy * dt;
    d.flapPhase += dt * 18;
    d.rot = Math.max(-0.5, Math.min(1.1, d.vy / 600));

    for (const p of game.pipes) {
      p.x -= PIPE_SPEED * dt;
    }
    while (game.pipes.length && game.pipes[0].x + PIPE_WIDTH < -10) {
      game.pipes.shift();
    }
    if (game.pipes.length && game.pipes[game.pipes.length - 1].x < game.spawnX - PIPE_SPACING) {
      spawnPipePair(game.pipes[game.pipes.length - 1].x + PIPE_SPACING);
    }

    for (const c of game.coins) {
      c.x -= PIPE_SPEED * dt;
      c.spin += dt * 6;
    }
    game.coins = game.coins.filter((c) => c.x > -20 && !c.taken);

    for (const p of game.pipes) {
      if (!p.passed && p.x + PIPE_WIDTH < d.x) {
        p.passed = true;
        game.score += 1;
        scoreEl.textContent = String(game.score);
      }
    }

    for (const c of game.coins) {
      if (c.taken) continue;
      const dx = c.x - d.x;
      const dy = c.y - d.y;
      if (dx * dx + dy * dy < (c.r + d.r) * (c.r + d.r)) {
        c.taken = true;
        game.score += 2;
        scoreEl.textContent = String(game.score);
        spawnCoinSparkle(c.x, c.y);
      }
    }

    if (collides()) {
      gameOver();
    }

    if (d.y - d.r < 0) {
      d.y = d.r;
      d.vy = 0;
    }
    if (d.y + d.r > H - GROUND_H) {
      d.y = H - GROUND_H - d.r;
      gameOver();
    }

    updateParticles(dt);
  }

  function updateParticles(dt) {
    for (const p of game.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
    }
    game.particles = game.particles.filter((p) => p.age < p.life);
  }

  function collides() {
    const d = game.dragon;
    for (const p of game.pipes) {
      if (d.x + d.r < p.x || d.x - d.r > p.x + p.width) continue;
      const inTop = d.y - d.r < p.topH;
      const inBottom = d.y + d.r > p.topH + p.gap;
      if (inTop || inBottom) return true;
    }
    return false;
  }

  function draw() {
    drawBackground();
    drawPipes();
    drawCoins();
    drawGround();
    drawDragon();
    drawParticles();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#5a8bff");
    g.addColorStop(0.55, "#9fc1ff");
    g.addColorStop(1, "#fdd9a1");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const sunX = W - 80;
    const sunY = 90;
    const sg = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 90);
    sg.addColorStop(0, "rgba(255,255,255,0.95)");
    sg.addColorStop(0.4, "rgba(255,221,140,0.55)");
    sg.addColorStop(1, "rgba(255,221,140,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(sunX - 90, sunY - 90, 180, 180);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const c of game.clouds) drawCloud(c.x, c.y, c.s);

    ctx.save();
    for (const m of game.mountains) {
      ctx.fillStyle = "rgba(40,60,120,0.55)";
      ctx.beginPath();
      const baseY = H - GROUND_H - 20;
      ctx.moveTo(m.x, baseY);
      ctx.lineTo(m.x + m.w / 2, baseY - m.h);
      ctx.lineTo(m.x + m.w, baseY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCloud(x, y, s) {
    ctx.beginPath();
    ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
    ctx.arc(x + 18 * s, y - 6 * s, 14 * s, 0, Math.PI * 2);
    ctx.arc(x + 30 * s, y + 2 * s, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 14 * s, y + 6 * s, 14 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPipes() {
    for (const p of game.pipes) {
      drawPipe(p.x, 0, p.width, p.topH, true);
      drawPipe(p.x, p.topH + p.gap, p.width, H - GROUND_H - (p.topH + p.gap), false);
    }
  }

  function drawPipe(x, y, w, h, capBottom) {
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, "#4f3520");
    grad.addColorStop(0.4, "#7a5230");
    grad.addColorStop(0.6, "#8a5e36");
    grad.addColorStop(1, "#3d2817");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x + 6, y, 4, h);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + w - 12, y, 3, h);

    const capH = 18;
    const capW = w + 10;
    const capX = x - 5;
    const capY = capBottom ? y + h - capH : y;
    const cg = ctx.createLinearGradient(capX, 0, capX + capW, 0);
    cg.addColorStop(0, "#3d2817");
    cg.addColorStop(0.5, "#9a6a3e");
    cg.addColorStop(1, "#3d2817");
    ctx.fillStyle = cg;
    ctx.fillRect(capX, capY, capW, capH);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(capX, capY + capH - 3, capW, 3);
  }

  function drawCoins() {
    for (const c of game.coins) {
      if (c.taken) continue;
      const sx = Math.abs(Math.cos(c.spin));
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(sx * 0.6 + 0.4, 1);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, c.r);
      g.addColorStop(0, "#fff6c0");
      g.addColorStop(0.6, "#ffcc4d");
      g.addColorStop(1, "#b8860b");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(120, 80, 0, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(120, 80, 0, 0.85)";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", 0, 1);
      ctx.restore();
    }
  }

  function drawGround() {
    const y = H - GROUND_H;
    const g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, "#3aa843");
    g.addColorStop(0.25, "#2e8a37");
    g.addColorStop(1, "#1d5d24");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, GROUND_H);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    const offset = (game.t * PIPE_SPEED) % 24;
    for (let x = -offset; x < W; x += 24) {
      ctx.fillRect(x, y + 8, 12, 4);
    }

    ctx.fillStyle = "#7a4a22";
    ctx.fillRect(0, H - 10, W, 10);
  }

  function drawDragon() {
    const d = game.dragon;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(2, 22, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7be07b";
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(-30, -10, -34, -2);
    ctx.quadraticCurveTo(-30, 4, -22, 6);
    ctx.closePath();
    ctx.fill();

    const wingFlap = Math.sin(d.flapPhase) * 0.6;
    ctx.save();
    ctx.translate(-2, -2);
    ctx.rotate(wingFlap - 0.2);
    const wg = ctx.createLinearGradient(0, -22, 0, 4);
    wg.addColorStop(0, "#a6f0a6");
    wg.addColorStop(1, "#3fb84a");
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-6, -22, 14, -18);
    ctx.quadraticCurveTo(20, -8, 6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    const bg = ctx.createLinearGradient(0, -18, 0, 18);
    bg.addColorStop(0, "#86e88a");
    bg.addColorStop(1, "#2f9c3a");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#fff6c2";
    ctx.beginPath();
    ctx.ellipse(2, 6, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#86e88a";
    ctx.beginPath();
    ctx.arc(20, -4, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.stroke();

    ctx.fillStyle = "#3fb84a";
    ctx.beginPath();
    ctx.moveTo(15, -16);
    ctx.lineTo(20, -22);
    ctx.lineTo(22, -14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, -16);
    ctx.lineTo(28, -22);
    ctx.lineTo(28, -12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(24, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0e1d3b";
    ctx.beginPath();
    ctx.arc(25, -6, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffcc4d";
    ctx.beginPath();
    ctx.moveTo(30, -2);
    ctx.lineTo(36, 0);
    ctx.lineTo(30, 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();

    ctx.fillStyle = "#3fb84a";
    for (let i = -10; i <= 10; i += 7) {
      ctx.beginPath();
      ctx.moveTo(i, -16);
      ctx.lineTo(i + 3, -22);
      ctx.lineTo(i + 6, -16);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawParticles() {
    for (const p of game.particles) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop(ts) {
    if (!game.last) game.last = ts;
    let dt = (ts - game.last) / 1000;
    game.last = ts;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function onInput(e) {
    if (e) {
      if (e.type === "keydown") {
        if (e.code !== "Space" && e.code !== "ArrowUp" && e.key !== " ") return;
        e.preventDefault();
      } else {
        e.preventDefault();
      }
    }
    flap();
  }

  window.addEventListener("keydown", onInput);
  canvas.addEventListener("mousedown", onInput);
  canvas.addEventListener("touchstart", onInput, { passive: false });
  startBtn.addEventListener("click", () => {
    startGame();
  });

  initBackground();
  resetWorld();
  game.state = STATE.MENU;
  bestEl.textContent = String(game.best);
  requestAnimationFrame(loop);
})();
