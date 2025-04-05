const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: { preload, create, update },
};

let player, cursors;

function preload() {
  this.load.image('player', 'assets/images/player.png');
}

function create() {
  player = this.add.sprite(400, 300, 'player');
  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (cursors.left.isDown) player.x -=2;
  if (cursors.right.isDown) player.x +=2;
  if (cursors.up.isDown) player.y -=2;
  if (cursors.down.isDown) player.y +=2;
}

new Phaser.Game(config);

