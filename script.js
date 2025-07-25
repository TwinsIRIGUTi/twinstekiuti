const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.8;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 40,
  width: 30,
  height: 30,
  speed: 5,
  moveLeft: false,
  moveRight: false
};

const bullets = [];
const turrets = [];
const enemies = [];

let points = 0;
let wave = 0;
let currentGroup = 0;
let waveActive = false;
let bossPending = false;
let gameOver = false;
let showClear = false;

const linesY = [
  canvas.height * 0.1,
  canvas.height * 0.25,
  canvas.height * 0.4
];

document.getElementById("leftButton").addEventListener("touchstart", () => player.moveLeft = true);
document.getElementById("leftButton").addEventListener("touchend", () => player.moveLeft = false);
document.getElementById("rightButton").addEventListener("touchstart", () => player.moveRight = true);
document.getElementById("rightButton").addEventListener("touchend", () => player.moveRight = false);
document.getElementById("setTurretButton").addEventListener("click", () => {
  if (turrets.length < 4 && points >= 500) {
    turrets.push({
      x: player.x - 10 + Math.random() * 20,
      y: canvas.height - 60,
      bullets: 1000
    });
    points -= 500;
  }
});
document.querySelector(".dismiss").addEventListener("click", () => {
  document.querySelector("#clearNotice").style.display = "none";
  nextWave();
});

function spawnEnemyLine(count = 5) {
  const line = linesY[Math.floor(Math.random() * 3)];
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 40),
      y: line - i * 50,
      width: 30,
      height: 30,
      hp: 5,
      speed: 1.2,
      line: line
    });
  }
}

function nextWave() {
  wave++;
  currentGroup = 0;
  waveActive = true;
  bossPending = false;
  showNotice(`敵集団来襲！Wave ${wave}`);
  setTimeout(() => spawnNextGroup(), 1000);
}

function spawnNextGroup() {
  if (wave === 2 && currentGroup === 2 && !bossPending) {
    bossPending = true;
    showWarning();
    setTimeout(() => {
      enemies.push({
        x: canvas.width / 2 - 50,
        y: -100,
        width: 100,
        height: 100,
        hp: 100,
        speed: 0.8,
        line: linesY[1],
        isBoss: true
      });
    }, 2000);
    return;
  }

  if (currentGroup >= 3) {
    waveActive = false;
    showClear = true;
    document.getElementById("clearNotice").style.display = "block";
    return;
  }

  spawnEnemyLine(5 + wave);
  currentGroup++;
}

function showNotice(text) {
  const el = document.getElementById("waveNotice");
  el.textContent = text;
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 1500);
}

function showWarning() {
  const el = document.getElementById("warningText");
  el.textContent = "WARNING！！";
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 2000);
}

function fireBullet() {
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    speed: 6
  });
}

function update() {
  if (gameOver) return;

  if (player.moveLeft) player.x -= player.speed;
  if (player.moveRight) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  bullets.forEach(b => b.y -= b.speed);
  bullets.filter(b => b.y > 0);

  turrets.forEach(t => {
    if (t.bullets > 0 && Date.now() % 100 < 10) {
      bullets.push({ x: t.x, y: t.y, speed: 5 });
      t.bullets--;
    }
  });

  enemies.forEach(e => {
    e.y += e.speed;
    if (Math.abs(e.y - e.line) < 5 && Math.random() < 0.01) {
      // 少しだけライン変更の可能性
      const idx = linesY.indexOf(e.line);
      const delta = Math.random() < 0.5 ? -1 : 1;
      const newIdx = Math.max(0, Math.min(2, idx + delta));
      e.line = linesY[newIdx];
    }
    if (e.y > canvas.height / 2) {
      // 以降は直進のみ
      e.line = e.line;
    }

    // ゲームオーバー判定
    if (
      e.y + e.height >= player.y &&
      e.x < player.x + player.width &&
      e.x + e.width > player.x
    ) {
      gameOver = true;
      document.getElementById("gameOver").style.display = "block";
    }
  });

  // 弾と敵の当たり判定
  bullets.forEach((b, i) => {
    enemies.forEach((e, j) => {
      if (
        b.x < e.x + e.width &&
        b.x > e.x &&
        b.y < e.y + e.height &&
        b.y > e.y
      ) {
        e.hp--;
        bullets.splice(i, 1);
        if (e.hp <= 0) enemies.splice(j, 1);
      }
    });
  });

  // Wave進行
  if (waveActive && enemies.length === 0 && !bossPending) {
    setTimeout(() => spawnNextGroup(), 1000);
  }

  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "red";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));

  ctx.fillStyle = "lime";
  turrets.forEach(t => ctx.fillRect(t.x, t.y, 20, 20));

  enemies.forEach(e => {
    ctx.fillStyle = e.isBoss ? "purple" : "orange";
    ctx.fillRect(e.x, e.y, e.width, e.height);
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(e.hp, e.x + 5, e.y + 15);
  });
}

setInterval(update, 1000 / 60);
setInterval(fireBullet, 80);
nextWave();
