const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const leftBtn = document.getElementById("leftButton");
const rightBtn = document.getElementById("rightButton");
const placeTurretBtn = document.getElementById("placeTurretButton");
const pauseBtn = document.getElementById("pauseButton");

const gameOverDiv = document.getElementById("gameOver");
const finalScoreText = document.getElementById("finalScore");
const finalTimeText = document.getElementById("finalTime");
const warningText = document.getElementById("warningText");
const waveText = document.getElementById("waveText");

let isPaused = false;
let isGameOver = false;
let score = 0;
let startTime = Date.now();
let player, bullets, enemies, turrets;
let currentStage = 0;
let currentWave = 0;
let waveActive = false;
let groupIndex = 0;
let bossSpawned = false;
let finalBossSpawned = false;
let turretLimit = 4;
let turretAmmo = 1000;
let autoShootInterval;
let leftHeld = false;
let rightHeld = false;

const lineX = [80, 160, 240];

const stages = [
  {
    waves: [
      { groups: 3, enemyHp: 1, boss: false },
      { groups: 4, enemyHp: 1, boss: "big" }
    ],
    finalBoss: { hp: 100, size: 100 }
  }
];

function showWarning(text, duration = 2000) {
  warningText.textContent = text;
  warningText.classList.remove("hidden");
  warningText.style.left = "-300px";
  warningText.style.transition = "left 2s linear";
  setTimeout(() => {
    warningText.style.left = "100%";
  }, 50);
  setTimeout(() => {
    warningText.classList.add("hidden");
    warningText.style.transition = "";
    warningText.style.left = "50%";
  }, duration + 500);
}

function showWaveStart(waveNum) {
  waveText.textContent = `敵集団来襲！ Wave ${waveNum + 1}`;
  waveText.classList.remove("hidden");
  setTimeout(() => waveText.classList.add("hidden"), 2000);
}

function spawnEnemyGroup(count, hp) {
  const line = Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: lineX[line],
      y: -i * 25,
      hp,
      lineIndex: line,
      size: 20
    });
  }
}

function spawnBoss(type) {
  let size = 20, hp = 5;
  if (type === "small") { size = 40; hp = 10; }
  else if (type === "mid") { size = 60; hp = 20; }
  else if (type === "big") { size = 80; hp = 40; }

  enemies.push({
    x: canvas.width / 2 - size / 2,
    y: -size,
    hp,
    size,
    lineIndex: 1
  });
  showWarning("脅威接近中");
  bossSpawned = true;
}

function spawnFinalBoss() {
  if (finalBossSpawned) return;
  const fb = stages[currentStage].finalBoss;
  showWarning("WARNING!!");
  setTimeout(() => {
    enemies.push({
      x: canvas.width / 2 - fb.size / 2,
      y: -fb.size,
      hp: fb.hp,
      size: fb.size,
      lineIndex: 1
    });
    finalBossSpawned = true;
  }, 2000);
}

function startNextWave() {
  const wave = stages[currentStage].waves[currentWave];
  if (!wave) return;

  waveActive = true;
  groupIndex = 0;
  bossSpawned = false;

  showWaveStart(currentWave);

  const groupInterval = setInterval(() => {
    if (!waveActive) {
      clearInterval(groupInterval);
      return;
    }

    if (groupIndex < wave.groups) {
      spawnEnemyGroup(10, wave.enemyHp);
      groupIndex++;
    } else {
      clearInterval(groupInterval);
      if (wave.boss && !bossSpawned) {
        setTimeout(() => spawnBoss(wave.boss), 1500);
      }
    }
  }, 2000);
}

function updateWaveProgress() {
  const wave = stages[currentStage].waves[currentWave];
  const totalWaves = stages[currentStage].waves.length;

  if (waveActive && enemies.length === 0 && groupIndex >= wave.groups && (!wave.boss || bossSpawned)) {
    currentWave++;
    waveActive = false;

    if (currentWave < totalWaves) {
      setTimeout(startNextWave, 2000);
    } else {
      if (!finalBossSpawned && enemies.length === 0) {
        spawnFinalBoss();
      }
    }
  }

  if (finalBossSpawned && enemies.length === 0 && !isGameOver) {
    setTimeout(() => {
      alert("面クリア！");
      restartGame();
    }, 1000);
  }
}

function shootBullet(fromX, fromY, dx = 0, dy = -5) {
  bullets.push({ x: fromX, y: fromY, dx, dy });
}

function startAutoShooting() {
  if (autoShootInterval) clearInterval(autoShootInterval);
  autoShootInterval = setInterval(() => {
    if (!isPaused && !isGameOver) {
      shootBullet(player.x + 10, player.y);
    }
  }, 80);
}

function stopAutoShooting() {
  if (autoShootInterval) clearInterval(autoShootInterval);
}

function initGame() {
  player = { x: 160, y: 580, speed: 4 };
  bullets = [];
  enemies = [];
  turrets = [];
  score = 0;
  startTime = Date.now();
  isGameOver = false;
  waveActive = false;
  currentWave = 0;
  bossSpawned = false;
  finalBossSpawned = false;
  gameOverDiv.classList.add("hidden");
  startNextWave();
  startAutoShooting();
}

function update() {
  if (isPaused || isGameOver) return;

  if (leftHeld) player.x -= player.speed;
  if (rightHeld) player.x += player.speed;

  bullets.forEach(b => { b.x += b.dx; b.y += b.dy; });
  bullets = bullets.filter(b => b.y > -10 && b.y < canvas.height && b.x > -10 && b.x < canvas.width);

  enemies.forEach(e => {
    e.y += 1;
    if (e.y < canvas.height / 2 && Math.random() < 0.01) {
      if (Math.random() < 0.5 && e.lineIndex > 0) e.lineIndex--;
      else if (e.lineIndex < 2) e.lineIndex++;
      e.x = lineX[e.lineIndex];
    }
  });

  bullets.forEach(bullet => {
    enemies.forEach(e => {
      const size = e.size || 20;
      if (bullet.x > e.x && bullet.x < e.x + size && bullet.y > e.y && bullet.y < e.y + size) {
        e.hp--; bullet.hit = true;
        if (e.hp <= 0) { score += 10; e.dead = true; }
      }
    });
  });

  bullets = bullets.filter(b => !b.hit);
  enemies = enemies.filter(e => !e.dead);

  enemies.forEach(e => {
    const size = e.size || 20;
    if (e.y + size >= player.y && Math.abs(player.x - e.x) < size) gameOver();
  });

  turrets.forEach(t => {
    t.cooldown--;
    if (t.ammo > 0 && t.cooldown <= 0) {
      shootBullet(t.x, t.y, -2, -4);
      shootBullet(t.x, t.y, 2, -4);
      t.cooldown = 20;
      t.ammo--;
    }
  });

  updateWaveProgress();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.fillRect(player.x, player.y, 20, 20);

  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 8));

  ctx.fillStyle = "red";
  enemies.forEach(e => {
    let size = e.size || 20;
    ctx.fillRect(e.x, e.y, size, size);
    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    ctx.fillText(`HP:${e.hp}`, e.x, e.y - 2);
    ctx.fillStyle = "red";
  });

  ctx.fillStyle = "cyan";
  turrets.forEach(t => ctx.fillRect(t.x, t.y, 10, 10));

  ctx.fillStyle = "white";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Time: ${Math.floor((Date.now() - startTime) / 1000)}s`, 10, 40);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function gameOver() {
  isGameOver = true;
  stopAutoShooting();
  finalScoreText.textContent = `スコア: ${score}`;
  finalTimeText.textContent = `生存時間: ${Math.floor((Date.now() - startTime) / 1000)}秒`;
  gameOverDiv.classList.remove("hidden");
}

function restartGame() {
  initGame();
}

leftBtn.addEventListener("touchstart", () => { leftHeld = true; });
leftBtn.addEventListener("touchend", () => { leftHeld = false; });
rightBtn.addEventListener("touchstart", () => { rightHeld = true; });
rightBtn.addEventListener("touchend", () => { rightHeld = false; });

placeTurretBtn.onclick = () => {
  if (score >= 500 && turrets.length < turretLimit) {
    const tx = turrets.length % 2 === 0 ? 40 : canvas.width - 50;
    const ty = canvas.height - 100 - Math.floor(turrets.length / 2) * 40;
    turrets.push({ x: tx, y: ty, ammo: turretAmmo, cooldown: 0 });
    score -= 500;
  }
};

pauseBtn.onclick = () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶️" : "⏸";
};

initGame();
loop();
