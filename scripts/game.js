const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: { preload, create, update },
};

let player, cursors, enemy;
let gameOverText, playAgainButton;

function preload() {
  this.load.image('player', 'assets/images/player.png');
  this.load.image('enemy', 'assets/images/enemy.png');
}

function create() {
  player = this.add.sprite(400, 300, 'player');
  cursors = this.input.keyboard.createCursorKeys();

  this.time.delayedCall(1000, () => {
    spawnEnemy(this);
  });
}

function update() {
  if (cursors.left.isDown) player.x -=2;
  if (cursors.right.isDown) player.x +=2;
  if (cursors.up.isDown) player.y -=2;
  if (cursors.down.isDown) player.y +=2;

  if(enemy && Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y) < 32) {
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
}

function killEnemy(scene) {
  enemy.setTint(0xff0000);
  
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