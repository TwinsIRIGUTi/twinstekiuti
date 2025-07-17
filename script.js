const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {};
let player = {
    x: canvas.width / 2,
    y: canvas.height - 120,
    width: 40,
    height: 40,
    speed: 6
};

let bullets = [];
let enemies = [];
let turrets = [];
let turretBullets = [];
let score = 0;
let turretCooldown = 0;
let canPlaceTurret = true;
let autoFire = true;
let lastShotTime = 0;
let gameStarted = false;
let currentStage = 1;
let currentWave = 0;
let currentBlock = 0;
let waveInProgress = false;
let enemyLineYLimit = canvas.height / 2;
let showWaveText = false;
let waveText = "";
let waveTextTimer = 0;
let showWarning = false;
let warningTimer = 0;
let showStageClear = false;
let stageClearDismissed = false;

const MAX_TURRETS = 4;
const TURRET_COST = 500;
const TURRET_AMMO = 1000;
const bulletSpeed = 10;
let bulletPower = 1;
let bulletInterval = 80; // 連射速度強化済

const enemyLineY = [100, 250, 400]; // 3ライン

const waves = {
    1: [
        [ // Wave 1
            { type: "normal", count: 10 },
            { type: "normal", count: 12 },
            { type: "miniBoss", count: 1 },
        ],
        [ // Wave 2
            { type: "normal", count: 12 },
            { type: "normal", count: 14 },
            { type: "miniBoss", count: 1 },
            { type: "boss", count: 1 },
        ]
    ]
};

document.getElementById("leftButton").addEventListener("touchstart", () => keys["ArrowLeft"] = true);
document.getElementById("leftButton").addEventListener("touchend", () => keys["ArrowLeft"] = false);
document.getElementById("rightButton").addEventListener("touchstart", () => keys["ArrowRight"] = true);
document.getElementById("rightButton").addEventListener("touchend", () => keys["ArrowRight"] = false);
document.getElementById("placeTurret").addEventListener("click", () => {
    if (turrets.length < MAX_TURRETS && score >= TURRET_COST && canPlaceTurret) {
        score -= TURRET_COST;
        let x = player.x < canvas.width / 2 ? 20 : canvas.width - 60;
        let yOffset = turrets.filter(t => t.side === (player.x < canvas.width / 2 ? "left" : "right")).length * 60;
        turrets.push({
            x: x,
            y: canvas.height - 200 - yOffset,
            ammo: TURRET_AMMO,
            side: player.x < canvas.width / 2 ? "left" : "right"
        });
    }
});

function drawPlayer() {
    ctx.fillStyle = "white";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawBullets() {
    bullets.forEach(bullet => {
        bullet.y -= bulletSpeed;
        ctx.fillStyle = "yellow";
        ctx.fillRect(bullet.x, bullet.y, 5, 10);
    });
    bullets = bullets.filter(b => b.y > 0);
}

function drawEnemies() {
    enemies.forEach(enemy => {
        enemy.y += enemy.speed;

        if (enemy.y < enemyLineYLimit && Math.random() < 0.01) {
            if (Math.random() < 0.5 && enemy.line > 0) enemy.line--;
            else if (enemy.line < 2) enemy.line++;
            enemy.x = canvas.width / 4 + enemy.line * canvas.width / 4;
        }

        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = "white";
        ctx.fillText(enemy.hp, enemy.x + 5, enemy.y + 15);
    });
}

function drawTurrets() {
    turrets.forEach(turret => {
        if (turret.ammo > 0) {
            turretBullets.push({ x: turret.x + 20, y: turret.y, dx: turret.side === "left" ? 3 : -3, dy: -6 });
            turret.ammo--;
        }
        ctx.fillStyle = "cyan";
        ctx.fillRect(turret.x, turret.y, 40, 40);
    });
    turrets = turrets.filter(t => t.ammo > 0);
}

function drawTurretBullets() {
    turretBullets.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;
        ctx.fillStyle = "lightblue";
        ctx.fillRect(b.x, b.y, 5, 10);
    });
    turretBullets = turretBullets.filter(b => b.y > 0 && b.x > 0 && b.x < canvas.width);
}

function drawUI() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("スコア: " + score, 20, 30);
}

function spawnEnemy(type) {
    let line = Math.floor(Math.random() * 3);
    let x = canvas.width / 4 + line * canvas.width / 4;
    let y = -50;

    if (type === "normal") {
        enemies.push({ x, y, width: 40, height: 40, speed: 1.5, hp: 3, color: "red", line });
    } else if (type === "miniBoss") {
        enemies.push({ x, y, width: 50, height: 50, speed: 1.2, hp: 10, color: "orange", line });
    } else if (type === "boss") {
        showWarning = true;
        warningTimer = 100;
        setTimeout(() => {
            enemies.push({ x, y, width: 80, height: 80, speed: 0.6, hp: 100, color: "purple", line });
        }, 2000);
    }
}

function updateEnemies() {
    enemies.forEach((enemy, ei) => {
        bullets.forEach((bullet, bi) => {
            if (bullet.x < enemy.x + enemy.width && bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height && bullet.y + 10 > enemy.y) {
                enemy.hp -= bulletPower;
                bullets.splice(bi, 1);
                if (enemy.hp <= 0) {
                    enemies.splice(ei, 1);
                    score += 100;
                    bulletPower += 0.1;
                }
            }
        });

        turretBullets.forEach((bullet, bi) => {
            if (bullet.x < enemy.x + enemy.width && bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height && bullet.y + 10 > enemy.y) {
                enemy.hp -= bulletPower;
                turretBullets.splice(bi, 1);
                if (enemy.hp <= 0) {
                    enemies.splice(ei, 1);
                    score += 100;
                    bulletPower += 0.1;
                }
            }
        });

        if (enemy.y > canvas.height) {
            alert("ゲームオーバー！");
            document.location.reload();
        }
    });
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText("タップしてスタート", canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    if (showWaveText) {
        ctx.fillStyle = "yellow";
        ctx.font = "40px bold";
        ctx.fillText(waveText, canvas.width / 2 - 100, canvas.height / 2 - 100);
        waveTextTimer--;
        if (waveTextTimer <= 0) showWaveText = false;
    }

    if (showWarning) {
        ctx.fillStyle = "red";
        ctx.font = "50px bold";
        ctx.fillText("WARNING！！", canvas.width / 2 - 150, canvas.height / 2);
        warningTimer--;
        if (warningTimer <= 0) showWarning = false;
    }

    if (showStageClear && !stageClearDismissed) {
        ctx.fillStyle = "lime";
        ctx.font = "40px bold";
        ctx.fillText("面クリア！", canvas.width / 2 - 80, canvas.height / 2);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("画面タップで次へ", canvas.width / 2 - 70, canvas.height / 2 + 40);
        return;
    }

    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    if (autoFire && Date.now() - lastShotTime > bulletInterval) {
        bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y });
        lastShotTime = Date.now();
    }

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawTurrets();
    drawTurretBullets();
    drawUI();
    updateEnemies();

    if (enemies.length === 0 && waveInProgress) {
        currentBlock++;
        const waveData = waves[currentStage]?.[currentWave];
        if (waveData && waveData[currentBlock]) {
            spawnEnemy(waveData[currentBlock].type);
        } else {
            currentWave++;
            currentBlock = 0;
            waveInProgress = false;

            const nextWave = waves[currentStage]?.[currentWave];
            if (nextWave) {
                waveText = `敵集団来襲！Wave ${currentWave + 1}`;
                waveTextTimer = 100;
                showWaveText = true;
                setTimeout(() => {
                    waveInProgress = true;
                    spawnEnemy(nextWave[0].type);
                }, 2000);
            } else {
                showStageClear = true;
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", () => {
    if (!gameStarted) {
        gameStarted = true;
        waveInProgress = true;
        spawnEnemy(waves[currentStage][0][0].type);
    } else if (showStageClear && !stageClearDismissed) {
        showStageClear = false;
        stageClearDismissed = true;
    }
});

gameLoop();
