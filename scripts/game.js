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
let coundownText;

function preload() {
  this.load.image('player', 'assets/images/player.png');
  this.load.image('enemy', 'assets/images/enemy.png');
  this.load.image('skull', 'assets/images/human-skull.png');
}

function create() {
  player = this.add.sprite(400, 300, 'player');
  cursors = this.input.keyboard.createCursorKeys();

  scoreText = this.add.text(16, 16, `Lifetime Score: ${score}`, { fontSize: '32px', fill: '#fff' });
  coundownText = this.add.text(16, 50, '', { fontSize: '24px', fill: '#ffcc00' });

  this.time.delayedCall(1000, () => {
    spawnEnemy(this);
  });
}

function update() {
  if (cursors.left.isDown) player.x -=2;
  if (cursors.right.isDown) player.x +=2;
  if (cursors.up.isDown) player.y -=2;
  if (cursors.down.isDown) player.y +=2;

  if(enemy && !enemyKilled &&Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y) < 32) {
    killEnemy(this);
  }
}

new Phaser.Game(config);

function spawnEnemy(scene) {
  let x, y;
  do {
    x = Phaser.Math.Between(0, config.width);
    y = Phaser.Math.Between(0, config.height);
  } while (Math.abs(x - player.x) < 200 || Math.abs(y - player.y) < 200);

  enemy = scene.add.sprite(x, y, 'enemy');
  enemyKilled = false;

  // Start countdown
  let timeLeft = roundTime/1000;
  coundownText.setText(`Time Left: ${timeLeft}s`);

  timerEvent = scene.time.delayedCall(roundTime, () => {
    if (!enemyKilled) {
      score = Math.max(0, score - 10);
      scoreText.setText(`Lifetime Score: ${score}`);
      
      // Replace player sprite with skull
      const x = player.x;
      const y = player.y;
      player.destroy();
      player = scene.add.sprite(x, y, 'skull');
  
      showGameOver(scene);
    }
  });
  

  // Countdown timer
  scene.time.addEvent({
    delay: 1000,
    repeat: timeLeft - 1,
    callback: () => {
      timeLeft --;
      coundownText.setText(`Time Left: ${timeLeft}s`);
    },    
  });

  // Speed up future rounds
  roundTime = Math.max(minTime, roundTime - 1000);
}

function killEnemy(scene) {
  enemyKilled = true;
  enemy.setTint(0xff0000);

  if (timerEvent) {
    timerEvent.remove(false);
  }

  score += 10;
  scoreText.setText(`Lifetime Score: ${score}`);
  coundownText.setText('');
  
  scene.time.delayedCall(1000, () => {
    showGameOver(scene);
  });
}

function showGameOver(scene) {
  gameOverText = scene.add.text(400, 300, 'Game Over', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
  playAgainButton = scene.add.text(400, 350, 'Play Again', { fontSize: '24px', fill: '#fff000' }).setOrigin(0.5);
  playAgainButton.setInteractive();
  playAgainButton.on('pointerdown', () => {
    scene.scene.restart();
  });
}