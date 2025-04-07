// game_controller.js
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: { preload, create, update },
};

let player, cursors, enemy;
let gameOverText, playAgainButton;
let score = 0;
let scoreText;
let enemyKilled = false;
let roundTime = 10000;
let minTime = 3000;
let timerEvent;
let countdownText;
let enemyVelocity = { x: 1, y: 1 };

// Preload game assets
function preload() {
  this.load.image('player', 'assets/images/player.png');
  this.load.image('enemy', 'assets/images/enemy.png');
  this.load.image('skull', 'assets/images/human-skull.png');
  this.load.audio('bgMusic', 'assets/sounds/icecastle.ogg');
}

// Create game objects and initialize game state
function create() {
  player = this.add.sprite(400, 300, 'player');
  cursors = this.input.keyboard.createCursorKeys();

  scoreText = this.add.text(16, 16, `Lifetime Score: ${score}`, { fontSize: '32px', fill: '#fff' });
  countdownText = this.add.text(16, 50, '', { fontSize: '24px', fill: '#ffcc00' });

  // Delay enemy spawn for a smoother start
  this.time.delayedCall(1000, () => {
    spawnEnemy(this);
  });

  this.bgMusic = this.sound.add('bgMusic');
  this.bgMusic.play({ loop: true });

  // Initialize Arduino controls (dynamically injects the Connect button and status bar)
  ArduinoController.createArduinoControls();
}

// Main game loop: update player movement and enemy behavior
function update() {
  // Access the current Arduino control states via the library getter
  const arduinoControls = ArduinoController.getControls();

  if (cursors.left.isDown || arduinoControls.left) player.x -= 2;
  if (cursors.right.isDown || arduinoControls.right) player.x += 2;
  if (cursors.up.isDown || arduinoControls.up) player.y -= 2;
  if (cursors.down.isDown || arduinoControls.down) player.y += 2;

  // Check for collision with enemy
  if (enemy && !enemyKilled && Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y) < 32) {
    killEnemy(this);
  }

  // Update enemy movement and bounce off walls
  if (enemy && !enemyKilled) {
    enemy.x += enemyVelocity.x;
    enemy.y += enemyVelocity.y;
    if (enemy.x <= 0 || enemy.x >= config.width) {
      enemyVelocity.x *= -1;
    }
    if (enemy.y <= 0 || enemy.y >= config.height) {
      enemyVelocity.y *= -1;
    }
  }
}

// Create the Phaser game instance
new Phaser.Game(config);

// Spawn an enemy in a random location
function spawnEnemy(scene) {
  let x, y;
  do {
    x = Phaser.Math.Between(0, config.width);
    y = Phaser.Math.Between(0, config.height);
  } while (Math.abs(x - player.x) < 200 || Math.abs(y - player.y) < 200);

  enemy = scene.add.sprite(x, y, 'enemy');
  enemyVelocity.x = Phaser.Math.Between(1, 2) * Phaser.Math.RND.sign();
  enemyVelocity.y = Phaser.Math.Between(1, 2) * Phaser.Math.RND.sign();
  enemyKilled = false;

  let timeLeft = roundTime / 1000;
  countdownText.setText(`Time Left: ${timeLeft}s`);

  timerEvent = scene.time.delayedCall(roundTime, () => {
    if (!enemyKilled) {
      score = Math.max(0, score - 10);
      scoreText.setText(`Lifetime Score: ${score}`);
      const x = player.x;
      const y = player.y;
      player.destroy();
      player = scene.add.sprite(x, y, 'skull');
      showGameOver(scene);
    }
  });

  // Countdown timer update
  scene.time.addEvent({
    delay: 1000,
    repeat: timeLeft - 1,
    callback: () => {
      timeLeft--;
      countdownText.setText(`Time Left: ${timeLeft}s`);
    }
  });

  // Speed up future rounds
  roundTime = Math.max(minTime, roundTime - 1000);
}

// Handle enemy elimination and update score
function killEnemy(scene) {
  enemyKilled = true;
  enemy.setTint(0xff0000);

  if (timerEvent) {
    timerEvent.remove(false);
  }

  score += 10;
  scoreText.setText(`Lifetime Score: ${score}`);
  countdownText.setText('');

  scene.time.delayedCall(1000, () => {
    showGameOver(scene);
  });
}

// Display Game Over message and a Play Again option
function showGameOver(scene) {
  gameOverText = scene.add.text(400, 300, 'Game Over', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
  playAgainButton = scene.add.text(400, 350, 'Play Again', { fontSize: '24px', fill: '#fff000' }).setOrigin(0.5);
  playAgainButton.setInteractive();
  playAgainButton.on('pointerdown', () => {
    scene.scene.restart();
  });
  if (scene.bgMusic && scene.bgMusic.stop) {
    scene.bgMusic.stop();
  }
}
