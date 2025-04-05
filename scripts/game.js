const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: {
    create() {
      const text = this.add.text(400, 300, 'Hello, Phaser!', {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: '#ffffff'
      });

      // Center the origin of the text
      text.setOrigin(0.5, 0.5);
    }
  }
};

new Phaser.Game(config);

  