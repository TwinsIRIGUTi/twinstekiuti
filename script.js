const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = { x: 180, y: 580, width: 20, height: 20, speed: 4 };
let bullets = [];
let enemies = [];
let turrets = [];
let wave = 1;
let subwave = 0;
let waveCleared = false;
let score = 0;
let movingLeft = false;
let movingRight = false;
let nextWaveReady = false;

let enemyLines = [180, 240, 300];

document.getElementById('leftButton').addEventListener('touchstart', () => movingLeft = true);
document.getElementById('leftButton').addEventListener('touchend', () => movingLeft = false);
document.getElementById('rightButton').addEventListener('touchstart', () => movingRight = true);
document.getElementById('rightButton').addEventListener('touchend', () => movingRight = false);

document.getElementById('placeButton').addEventListener('touchstart', () => {
  if (score >= 500 && turrets.length < 4) {
    turrets.push({ x: player.x, y: player.y - 40, bullets: 1000 });
    score -= 500;
  }
});

document.getElementById('dismissButton').addEventListener('click', () => {
  document.getElementById('messageContainer').classList.add('hidden');
  wave++;
  subwave = 0;
  waveCleared = false;
  nextWaveReady = true;
});

function createEnemies(count, isBoss = false) {
  const line = enemyLines[Math.floor(Math.random() * enemyLines.length)];
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: line - 10,
      y: -i * 40,
      width: isBoss ? 40 : 20,
      height: isBoss ? 40 : 20,
      hp: isBoss ? 100 : 10,
      speed: isBoss ? 0.5 : 1
    });
  }
}

function shoot() {
  bullets.push({ x: player.x + 8, y: player.y, speed: 6 });
}

function shootTurrets() {
  for (let turret of turrets) {
    if (turret.bullets > 0) {
      bullets.push({ x: turret.x, y: turret.y, speed: 6 });
      turret.bullets--;
    }
  }
  turrets = turrets.filter(t => t.bullets > 0);
}

function update() {
  if (movingLeft) player.x -= player.speed;
  if (movingRight) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y > 0);

  enemies.forEach(e => e.y += e.speed);

  // 衝突判定
  for (let bullet of bullets) {
    for (let enemy of enemies) {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + 4 > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + 8 > enemy.y
      ) {
        enemy.hp -= 10;
        bullet.y = -10; // 削除対象にする
        if (enemy.hp <= 0) {
          score += 10;
        }
      }
    }
  }

  enemies = enemies.filter(e => e.hp > 0 && e.y < canvas.height);

  // 自機衝突でゲームオーバー（未実装：デモ用）

  // Wave制御
  if (enemies.length === 0 && !waveCleared) {
    subwave++;
    if (wave === 1 && subwave === 1) createEnemies(10);
    else if (wave === 1 && subwave === 2) {
      createEnemies(8);
      setTimeout(() => createEnemies(1, true), 1000);
    } else {
      waveCleared = true;
      document.getElementById('messageContainer').classList.remove('hidden');
    }
  }

  shootTurrets();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 自機
  ctx.fillStyle = 'white';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // 弾
  ctx.fillStyle = 'yellow';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 8));

  // 敵
  ctx.fillStyle = 'red';
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));

  // タレット
  ctx.fillStyle = 'blue';
  turrets.forEach(t => ctx.fillRect(t.x, t.y, 10, 10));

  // スコア
  ctx.fillStyle = 'white';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Wave: ${wave}`, 10, 40);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(shoot, 100); // 連射
gameLoop();
