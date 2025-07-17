const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 480;
canvas.height = 640;

let keys = { left: false, right: false };
let score = 0;
let bullets = [];
let enemies = [];
let turrets = [];
let gameOver = false;
let waves = [];
let currentWave = 0;
let waveInProgress = false;
let waveTextTimer = 0;
let waveText = "";
let enemyBullets = [];
let turretsLimit = 4;
let turretId = 0;
let stage = 1;
let waveStartTime = 0;
let gameStartTime = Date.now();
let warningShown = false;

const player = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 60,
  width: 30,
  height: 30,
  speed: 4,
  lastShotTime: 0,
};

const turretImage = new Image();
turretImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAdCAYAAAAitp5aAAAAAXNSR0IArs4c6QAAAMZJREFUSEvtlYENgzAMhN/koRaSPcTocUo2g9jsEzyiFwYxUVKpGixTyCPkScFFkbxgZmHdlxFc58rJZfCJzryGLU3DIJzm1jYmo7fuwvCNRuLBxaq2xLeM47fdBI7HJg7Qhx2wTiX0fgNMeDGmjZkgh2ytBAkZm0cY7V+Bw4bRJnRxWDDGpmpZnMNZivBoMzv8RtGV1VfTE2trRr8NGwhKXrJgwnmAAAAAElFTkSuQmCC";

function spawnEnemy(x, y, hp, line = 1, isBoss = false) {
  enemies.push({
    x,
    y,
    width: 24,
    height: 24,
    speed: isBoss ? 0.5 : 1,
    hp,
    maxHp: hp,
    line,
    lastLineShift: Date.now(),
    isBoss,
  });
}

function fireBullet(from, angle = 270, speed = 5) {
  bullets.push({
    x: from.x + from.width / 2,
    y: from.y,
    width: 4,
    height: 8,
    speed,
    angle,
    fromTurret: from.isTurret || false,
  });
}

function updateBullets() {
  bullets = bullets.filter((b) => b.y > -10 && b.y < canvas.height + 10);
  bullets.forEach((b) => {
    b.x += Math.cos((b.angle * Math.PI) / 180) * b.speed;
    b.y += Math.sin((b.angle * Math.PI) / 180) * b.speed;
  });
}

function updateEnemies() {
  const now = Date.now();
  enemies.forEach((e) => {
    e.y += e.speed;

    if (e.y < canvas.height / 2 && now - e.lastLineShift > 1000) {
      const shift = Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
      if (shift !== 0 && e.line + shift >= 0 && e.line + shift <= 2) {
        e.line += shift;
        e.x = 60 + e.line * 120;
      }
      e.lastLineShift = now;
    }

    bullets.forEach((b) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        e.hp -= 1;
        b.y = -100;
      }
    });
  });

  enemies = enemies.filter((e) => {
    if (e.hp <= 0) {
      score += e.isBoss ? 500 : 10;
      return false;
    }
    if (e.y > canvas.height) {
      gameOver = true;
      return false;
    }
    return true;
  });
}

function drawPlayer() {
  ctx.fillStyle = "#0f0";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawBullets() {
  ctx.fillStyle = "#fff";
  bullets.forEach((b) => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });
}

function drawEnemies() {
  enemies.forEach((e) => {
    ctx.fillStyle = e.isBoss ? "#f0f" : "#f00";
    ctx.fillRect(e.x, e.y, e.width, e.height);

    ctx.fillStyle = "#000";
    ctx.fillRect(e.x, e.y - 10, e.width, 5);
    ctx.fillStyle = "#0f0";
    const hpBar = (e.hp / e.maxHp) * e.width;
    ctx.fillRect(e.x, e.y - 10, hpBar, 5);
  });
}

function drawTurrets() {
  turrets.forEach((t) => {
    ctx.drawImage(turretImage, t.x, t.y, t.width, t.height);
  });
}

function updateTurrets() {
  turrets.forEach((t) => {
    if (Date.now() - t.lastShot > 300) {
      fireBullet(t, 225);
      fireBullet(t, 315);
      t.lastShot = Date.now();
      t.ammo -= 2;
    }
  });
  turrets = turrets.filter((t) => t.ammo > 0);
}

function handlePlayerMovement() {
  if (keys.left && player.x > 0) player.x -= player.speed;
  if (keys.right && player.x < canvas.width - player.width) player.x += player.speed;
}

function drawUI() {
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Stage: ${stage}`, 380, 20);

  if (waveTextTimer > 0) {
    ctx.font = "24px Arial";
    ctx.fillText(waveText, canvas.width / 2 - 80, canvas.height / 2);
    waveTextTimer--;
  }

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 90, canvas.height / 2);
  }
}

function createWave(stage) {
  let waveConfig = [];
  if (stage === 1) {
    waveConfig = [
      { count: 3, enemies: 12, hp: 3 },
      { count: 4, enemies: 14, hp: 4, boss: true },
    ];
  }
  return waveConfig;
}

function spawnWave() {
  if (currentWave >= waves.length) {
    waveText = "面クリア！";
    waveTextTimer = 120;
    setTimeout(() => {
      stage++;
      currentWave = 0;
      waves = createWave(stage);
      waveInProgress = false;
    }, 3000);
    return;
  }

  const wave = waves[currentWave];
  waveText = `敵集団来襲！Wave ${currentWave + 1}`;
  waveTextTimer = 60;

  let delay = 0;
  for (let i = 0; i < wave.count; i++) {
    setTimeout(() => {
      const line = i % 3;
      for (let j = 0; j < wave.enemies / wave.count; j++) {
        const hp = wave.hp + (wave.boss && i === wave.count - 1 ? 20 : 0);
        const isBoss = wave.boss && i === wave.count - 1;
        spawnEnemy(60 + line * 120, -j * 40, hp, line, isBoss);
      }

      if (wave.boss && i === wave.count - 1 && !warningShown) {
        waveText = "WARNING！！";
        waveTextTimer = 60;
        warningShown = true;
      }
    }, i * 2000);
  }

  currentWave++;
  waveInProgress = true;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameOver) {
    handlePlayerMovement();

    if (Date.now() - player.lastShotTime > 80) {
      fireBullet(player);
      player.lastShotTime = Date.now();
    }

    updateBullets();
    updateEnemies();
    updateTurrets();

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawTurrets();
    drawUI();

    if (!waveInProgress && enemies.length === 0) {
      spawnWave();
    }
  }

  requestAnimationFrame(gameLoop);
}

document.getElementById("leftBtn").addEventListener("touchstart", () => keys.left = true);
document.getElementById("leftBtn").addEventListener("touchend", () => keys.left = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => keys.right = true);
document.getElementById("rightBtn").addEventListener("touchend", () => keys.right = false);
document.getElementById("setBtn").addEventListener("click", () => {
  if (score >= 500 && turrets.length < turretsLimit) {
    const side = turrets.length % 2 === 0 ? 0 : canvas.width - 24;
    const y = canvas.height - 80 - 40 * Math.floor(turrets.length / 2);
    turrets.push({
      x: side,
      y,
      width: 24,
      height: 24,
      ammo: 1000,
      lastShot: 0,
      isTurret: true,
    });
    score -= 500;
  }
});

waves = createWave(stage);
gameLoop();
