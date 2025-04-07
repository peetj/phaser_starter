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
  let enemyVelocity = { x: 1, y: 1 };
  let port, reader, isConnected = false;
  let serialBuffer = "";
  
  const phaserControls = {
    left: false,
    right: false,
    up: false,
    down: false
  };
  
  const connectButton = document.getElementById("connect-button");
  const statusBar = document.getElementById("status-bar");
  
  connectButton.addEventListener("click", async () => {
    if (!isConnected) {
      try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
  
        const decoder = new TextDecoderStream();
        port.readable.pipeTo(decoder.writable);
        reader = decoder.readable.getReader();
  
        isConnected = true;
        connectButton.textContent = "Disconnect";
        statusBar.textContent = "Status: Connected";
  
        readData();
      } catch (err) {
        console.error("Connection failed:", err);
        alert("Failed to connect.");
      }
    } else {
      try {
        await reader.cancel();
        reader.releaseLock();
        await port.close();
      } catch (err) {
        console.error("Disconnection failed:", err);
      } finally {
        isConnected = false;
        connectButton.textContent = "Connect to Device";
        statusBar.textContent = "Status: Disconnected";
      }
    }
  });
  
  function preload() {
    this.load.image('player', 'assets/images/player.png');
    this.load.image('enemy', 'assets/images/enemy.png');
    this.load.image('skull', 'assets/images/human-skull.png');
  
    this.load.audio('bgMusic', 'assets/sounds/icecastle.ogg');
  
  }
  
  function create() {
    player = this.add.sprite(400, 300, 'player');
    cursors = this.input.keyboard.createCursorKeys();
  
    scoreText = this.add.text(16, 16, `Lifetime Score: ${score}`, { fontSize: '32px', fill: '#fff' });
    coundownText = this.add.text(16, 50, '', { fontSize: '24px', fill: '#ffcc00' });
  
    this.time.delayedCall(1000, () => {
      spawnEnemy(this);
    });
  
    this.bgMusic = this.sound.add('bgMusic');
    this.bgMusic.play({ loop: true }); // loop optional
  }
  
  function update() {
    if (cursors.left.isDown || phaserControls.left) player.x -= 2;
    if (cursors.right.isDown || phaserControls.right) player.x += 2;
    if (cursors.up.isDown || phaserControls.up) player.y -= 2;
    if (cursors.down.isDown || phaserControls.down) player.y += 2;
   
    if(enemy && !enemyKilled &&Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y) < 32) {
      killEnemy(this);
    }
  
    if (enemy && !enemyKilled) {
      enemy.x += enemyVelocity.x;
      enemy.y += enemyVelocity.y;
    
      // Bounce off walls
      if (enemy.x <= 0 || enemy.x >= config.width) {
        enemyVelocity.x *= -1;
      }
      if (enemy.y <= 0 || enemy.y >= config.height) {
        enemyVelocity.y *= -1;
      }
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
    // Random velocity between -2 and 2, avoiding 0
    enemyVelocity.x = Phaser.Math.Between(1, 2) * Phaser.Math.RND.sign();
    enemyVelocity.y = Phaser.Math.Between(1, 2) * Phaser.Math.RND.sign();
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
    if (scene.bgMusic && scene.bgMusic.stop) {
      scene.bgMusic.stop();
    }
    
  }
  
  async function readData() {
    while (isConnected) {
      try {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          serialBuffer += value;
          let lines = serialBuffer.split("\n");
          serialBuffer = lines.pop();
          lines.forEach(line => processSerialInput(line.trim()));
        }
        if (serialBuffer.length > 1000) serialBuffer = "";
      } catch (err) {
        console.error("Read error:", err);
        break;
      }
    }
  }
  
  function processSerialInput(data) {
    const actions = {
      "Left button pressed": () => phaserControls.left = true,
      "Left button released": () => phaserControls.left = false,
      "Right button pressed": () => phaserControls.right = true,
      "Right button released": () => phaserControls.right = false,
      "Thrust button pressed": () => phaserControls.up = true,
      "Thrust button released": () => phaserControls.up = false,
      "Fire button pressed": () => phaserControls.down = true,
      "Fire button released": () => phaserControls.down = false
    };
  
    if (actions[data]) actions[data]();
    else console.warn("Unknown input:", data);
  }
  