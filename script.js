const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = { x: 160, y: 560, width: 40, height: 40, speed: 3 };
let keys = { left: false, right: false };
let bullets = [];
let turrets = [];
let enemies = [];
let score = 0;
let isGameOver = false;
let wave = 0;
let inWave = false;
let turretPoints = 0;
let messageOverlay = document.getElementById("messageOverlay");
let messageText = document.getElementById("messageText");
let closeMessage = document.getElementById("closeMessage");

function showMessage(text, callback) {
  messageText.textContent = text;
  messageOverlay.classList.remove("hidden");
  closeMessage.onclick = () => {
    messageOverlay.classList.add("hidden");
    if (callback) callback();
  };
}

function spawnEnemyLine(line) {
  const xPositions = [60, 160, 260]; // left, center, right
  const baseX = xPositions[line];
  for (let i = 0; i < 5; i++) {
    enemies.push({
      x: baseX - 15,
      y: -60 - i * 50,
      width: 30,
      height: 30,
      speed: 1,
      hp: 3,
      line: line
    });
  }
}

function startWave() {
  wave++;
  inWave = true;
  showMessage(`敵集団来襲！Wave ${wave}`, () => {
    for (let i = 0; i < wave + 1; i++) {
      const line = Math.floor(Math.random() * 3);
      spawnEnemyLine(line);
    }
  });
}

function update() {
  if (isGameOver) return;

  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  bullets.forEach((b, i) => {
    b.y -= b.speed;
    if (b.y < -10) bullets.splice(i, 1);
  });

  enemies.forEach((e, i) => {
    e.y += e.speed;
    if (e.hp <= 0) {
      enemies.splice(i, 1);
      turretPoints += 10;
    } else if (
      e.y + e.height >= player.y &&
      e.x < player.x + player.width &&
      e.x + e.width > player.x
    ) {
      gameOver();
    } else if (e.y > canvas.height) {
      gameOver();
    }
  });

  bullets.forEach((b) => {
    enemies.forEach((e) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        e.hp -= 1;
        b.y = -100; // Remove bullet
      }
    });
  });

  if (enemies.length === 0 && inWave) {
    inWave = false;
    if (wave === 2) {
      showMessage("WARNING！！", () => {
        spawnBoss();
      });
    } else {
      setTimeout(startWave, 1000);
    }
  }
}

function spawnBoss() {
  enemies.push({
    x: 110,
    y: -80,
    width: 80,
    height: 80,
    speed: 0.5,
    hp: 50,
    line: 1
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Bullets
  ctx.fillStyle = "yellow";
  bullets.forEach((b) => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  // Enemies
  enemies.forEach((e) => {
    ctx.fillStyle = e.hp > 10 ? "red" : "orange";
    ctx.fillRect(e.x, e.y, e.width, e.height);
    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    ctx.fillText(e.hp, e.x + 5, e.y + 15);
  });

  // Score
  ctx.fillStyle = "white";
  ctx.font = "14px sans-serif";
  ctx.fillText(`P: ${turretPoints}`, 10, 20);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

setInterval(() => {
  if (!isGameOver) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 5
    });
  }
}, 80);

document.getElementById("leftButton").addEventListener("touchstart", () => {
  keys.left = true;
});
document.getElementById("leftButton").addEventListener("touchend", () => {
  keys.left = false;
});
document.getElementById("rightButton").addEventListener("touchstart", () => {
  keys.right = true;
});
document.getElementById("rightButton").addEventListener("touchend", () => {
  keys.right = false;
});

document.getElementById("placeTurretButton").addEventListener("click", () => {
  if (turretPoints >= 500 && turrets.length < 4) {
    turrets.push({ x: player.x, y: player.y - 20, bullets: 1000 });
    turretPoints -= 500;
  }
});

function gameOver() {
  isGameOver = true;
  showMessage("GAME OVER");
}

startWave();
loop();
