// ボタン取得
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const leftBtn = document.getElementById("leftButton");
const rightBtn = document.getElementById("rightButton");
const setBtn = document.getElementById("setButton");
const waveMsg = document.getElementById("waveMessage");
const warningMsg = document.getElementById("warningMessage");
const stageClear = document.getElementById("stageClear");
const nextStageBtn = document.getElementById("nextStageBtn");

let keys = { left: false, right: false };
let player = { x: 160, y: 580, bullets: [], cooldown: 0 };
let enemies = [];
let turrets = [];
let score = 0;
let wave = 0;
let enemyTimer = 0;
let enemyGroup = 0;
let waveConfig = [
  { groups: 3, boss: false },
  { groups: 4, boss: true }
];
let inWave = false;
let waiting = false;
let gameInterval = null;

function startGame() {
  nextWave();
  gameInterval = setInterval(update, 1000 / 60);
}

function showWaveMessage(text) {
  waveMsg.textContent = text;
  waveMsg.style.display = "block";
  setTimeout(() => waveMsg.style.display = "none", 2000);
}

function showWarning() {
  warningMsg.style.display = "block";
  warningMsg.style.animation = "warningMove 3s linear forwards";
  setTimeout(() => warningMsg.style.display = "none", 3000);
}

function spawnEnemyLine() {
  const lineY = -30;
  const lineX = [60, 160, 260][Math.floor(Math.random() * 3)];
  for (let i = 0; i < 6; i++) {
    enemies.push({
      x: lineX,
      y: lineY - i * 40,
      hp: 3,
      type: "normal",
      line: lineX
    });
  }
}

function spawnBoss(type) {
  let hp = type === "big" ? 100 : 20;
  let y = -60;
  let x = 160;
  enemies.push({ x, y, hp, type, line: x });
}

function nextWave() {
  if (wave >= waveConfig.length) {
    showWaveMessage("面クリア！");
    stageClear.style.display = "flex";
    return;
  }

  showWaveMessage(`敵集団来襲！Wave ${wave + 1}`);
  inWave = true;
  enemyGroup = 0;
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // プレイヤー操作
  if (keys.left) player.x -= 3;
  if (keys.right) player.x += 3;
  player.x = Math.max(0, Math.min(canvas.width - 20, player.x));

  // 弾発射
  if (player.cooldown <= 0) {
    player.bullets.push({ x: player.x + 8, y: player.y });
    player.cooldown = 5;
  } else {
    player.cooldown--;
  }

  // 弾更新
  player.bullets.forEach(b => b.y -= 5);
  player.bullets = player.bullets.filter(b => b.y > 0);

  // 描画
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, 20, 20);

  ctx.fillStyle = "lime";
  player.bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 10));

  // 敵更新
  enemies.forEach(e => {
    if (e.type === "normal" || e.type === "mid") {
      e.y += 1;
      if (e.y > 320 && Math.random() < 0.01) {
        e.line += Math.random() < 0.5 ? -100 : 100;
        e.line = Math.max(60, Math.min(260, e.line));
        e.x = e.line;
      }
    } else if (e.type === "big") {
      e.y += 0.3;
    }
  });

  // 敵と弾の当たり判定
  enemies.forEach((e, ei) => {
    player.bullets.forEach((b, bi) => {
      if (Math.abs(e.x - b.x) < 15 && Math.abs(e.y - b.y) < 15) {
        e.hp--;
        player.bullets.splice(bi, 1);
        if (e.hp <= 0) {
          enemies.splice(ei, 1);
          score += 10;
        }
      }
    });
  });

  // 敵描画
  enemies.forEach(e => {
    ctx.fillStyle = e.type === "big" ? "red" : e.type === "mid" ? "orange" : "white";
    ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
    ctx.fillStyle = "yellow";
    ctx.fillText(e.hp, e.x - 6, e.y + 4);
  });

  // Wave進行
  if (inWave) {
    if (enemyTimer <= 0 && enemyGroup < waveConfig[wave].groups) {
      spawnEnemyLine();
      enemyGroup++;
      enemyTimer = 120;
    } else {
      enemyTimer--;
    }

    if (waveConfig[wave].boss && enemyGroup === waveConfig[wave].groups && enemies.length === 0 && !waiting) {
      waiting = true;
      showWarning();
      setTimeout(() => {
        spawnBoss("big");
        waiting = false;
      }, 3000);
    }

    if (enemyGroup >= waveConfig[wave].groups && enemies.length === 0 && !waiting) {
      wave++;
      inWave = false;
      setTimeout(nextWave, 1000);
    }
  }
}

// イベント設定
leftBtn.addEventListener("touchstart", () => keys.left = true);
leftBtn.addEventListener("touchend", () => keys.left = false);
rightBtn.addEventListener("touchstart", () => keys.right = true);
rightBtn.addEventListener("touchend", () => keys.right = false);

setBtn.addEventListener("click", () => {
  // 将来：500スコア消費で砲台設置処理
});

nextStageBtn.addEventListener("click", () => {
  stageClear.style.display = "none";
  wave = 0;
  enemies = [];
  nextWave();
});

startGame();
