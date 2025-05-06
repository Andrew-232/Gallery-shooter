// Gallery_Shooter.js
// Start screen scene with "Start Game" and "Controls" buttons
class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    // Preloads the background image and button sound
    preload() {
        this.load.image('Background', 'assets/Background.png');
        this.load.audio('buttonClick', 'assets/confirmation_001.ogg');
    }

    // Creates the start screen layout and button behavior
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'Background');

        this.clickSound = this.sound.add('buttonClick');

        this.add.text(width / 2, height / 2 - 100, 'Planet Breaker', {
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const startButton = this.add.text(width / 2, height / 2, 'Start Game', {
            fontSize: '32px',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const controlsButton = this.add.text(width / 2, height / 2 + 60, 'Controls', {
            fontSize: '32px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            this.clickSound.play();
            this.scene.start('Gallery_Shooter');
        });

        controlsButton.on('pointerdown', () => {
            this.clickSound.play();
            this.scene.start('ControlsScene');
        });
    }

    // Scrolling background for visual effect
    update() {
        this.background.tilePositionY -= 1;
    }
}

// Controls scene to show the controls
class ControlsScene extends Phaser.Scene {
    constructor() {
        super('ControlsScene');
    }

    // Loads assets for the controls screen
    preload() {
        this.load.image('Background', 'assets/Background.png');
        this.load.audio('buttonClick', 'assets/confirmation_001.ogg');
    }

    // Creates controls layout and back button
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'Background');
        this.clickSound = this.sound.add('buttonClick');

        this.add.text(width / 2, 80, 'Controls', {
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const controlsText = `
A - Move Left
D - Move Right
SPACE - Fire
ESC - Pause Game
`;

        this.add.text(width / 2, height / 2 - 60, controlsText, {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const backButton = this.add.text(width / 2, height - 100, 'Back', {
            fontSize: '28px',
            fill: '#ff0000',
            backgroundColor: '#ffffff',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backButton.on('pointerdown', () => {
            this.clickSound.play();
            this.scene.start('StartScene');
        });
    }

    // Scrolling background for visual effect
    update() {
        this.background.tilePositionY -= 1;
    }
}

// Main game scene (gallery shooter)
class Gallery_Shooter extends Phaser.Scene {
    constructor() {
        super('Gallery_Shooter');
    }

    // Load all game assets
    preload() {
        this.load.image('Background', 'assets/Background.png');
        this.load.image('PlayerShip', 'assets/PlayerShip.png');
        this.load.image('PlayerProjectile', 'assets/PlayerProjectile.png');
        this.load.image('ShootingEffect', 'assets/ShootingEffect.png');
        for (let i = 0; i <= 9; i++) {
            this.load.image(`Planet${i}`, `assets/planet0${i}.png`);
        }
        this.load.image('Meteor1', 'assets/meteorBrown_med3.png');
        this.load.image('Meteor2', 'assets/meteorBrown_med1.png');
        this.load.audio('explosion', 'assets/explosionCrunch_000.ogg');
        this.load.audio('shoot', 'assets/laserRetro_004.ogg');
    }

    // Create game setup including player, controls, health, enemies, etc.
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'Background');

        this.ship = this.physics.add.image(width / 2, height - 50, 'PlayerShip').setOrigin(0.5, 0.5);

        this.cursors = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.health = 3;
        this.maxHealth = 3;
        this.healthIcons = [];
        for (let i = 0; i < this.maxHealth; i++) {
            let icon = this.add.image(20 + i * 45, 20, 'PlayerShip')
                .setScale(0.4)
                .setOrigin(0.5, 0.5)
                .setDepth(1000);
            this.healthIcons.push(icon);
        }

        this.projectiles = this.physics.add.group();
        this.lastFired = 0;
        this.fireRate = 300;

        this.enemies = this.add.group();
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 1000;
        this.minSpawnInterval = 300;
        this.spawnRateDecrease = 10;         
        this.spawnRateDecreaseInterval = 5000;
        this.spawnRateDecreaseTimer = 0;

        this.enemySpeed = 2;
        this.speedIncreaseTimer = 0;
        this.speedIncreaseInterval = 1000;
        this.speedIncrement = 0.1;

        this.shootSound = this.sound.add('shoot');
        this.explosionSound = this.sound.add('explosion');

        this.score = 0;
        this.scoreText = this.add.text(width - 20, 20, 'Score: 0', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(1, 0).setDepth(1000);
    }

    // Main game loop
    update(time, delta) {
        const width = this.scale.width;
        const height = this.scale.height;

        // Pause game if ESC is pressed
        if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
            this.scene.launch('PauseMenuScene', { from: 'Gallery_Shooter' });
            this.scene.pause();
        }

        this.background.tilePositionY -= this.enemySpeed * 0.5;

        // Moves ship
        if (this.cursors.left.isDown) {
            this.ship.x -= 10;
        } else if (this.cursors.right.isDown) {
            this.ship.x += 10;
        }

        this.ship.x = Phaser.Math.Clamp(this.ship.x, this.ship.width / 2, width - this.ship.width / 2);

        // Fires projectiles
        if (this.cursors.fire.isDown && time > this.lastFired + this.fireRate) {
            let proj = this.add.image(this.ship.x, this.ship.y - this.ship.height / 2, 'PlayerProjectile').setOrigin(0.5, 0.5);
            this.projectiles.add(proj);
            this.lastFired = time;
            this.shootSound.play();

            let effect = this.add.image(this.ship.x, this.ship.y - 30, 'ShootingEffect').setOrigin(0.5, 0.5);
            this.tweens.add({
                targets: effect,
                alpha: 0,
                duration: 25,
                onComplete: () => effect.destroy()
            });
        }

        // Spawns enemies
        this.enemySpawnTimer += delta;
        this.speedIncreaseTimer += delta;
        this.spawnRateDecreaseTimer += delta;

        // Gradually increases spawn rate
        if (this.spawnRateDecreaseTimer > this.spawnRateDecreaseInterval) {
            this.enemySpawnInterval = Math.max(this.minSpawnInterval, this.enemySpawnInterval - this.spawnRateDecrease);
            this.spawnRateDecreaseTimer = 0;
        }

        // Spawn enemy if it's time
        if (this.enemySpawnTimer > this.enemySpawnInterval) {
            let x = Phaser.Math.Between(50, width - 50);
            let planetKey = `Planet${Phaser.Math.Between(0, 9)}`;
            let enemy = this.physics.add.image(x, -50, planetKey).setScale(0.1).setOrigin(0.5, 0.5);
            enemy.type = 'Planet';
            this.enemies.add(enemy);

            this.enemySpawnTimer = 0;
        }

        if (this.speedIncreaseTimer > this.speedIncreaseInterval) {
            this.enemySpeed += this.speedIncrement;
            this.speedIncreaseTimer = 0;
        }

        // Move enemies and handle collisions
        this.enemies.getChildren().forEach((enemy) => {
            enemy.y += this.enemySpeed;

            if (enemy.y > height + 50) {
                enemy.y = -50;
                enemy.x = Phaser.Math.Between(50, width - 50);
            }
        });

        // Projectile and enemy collision check
        this.projectiles.getChildren().forEach((projectile) => {
            this.enemies.getChildren().forEach((enemy) => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(projectile.getBounds(), enemy.getBounds())) {
                    projectile.destroy();
                    this.explosionSound.play();
                    this.score += 10;
                    this.scoreText.setText('Score: ' + this.score);

                    if (enemy.type === 'Planet') {
                        for (let i = 0; i < 3; i++) {
                            let meteorType = Phaser.Math.RND.pick(['Meteor1', 'Meteor2']);
                            let offsetX = Phaser.Math.Between(-100, 100);
                            let offsetY = Phaser.Math.Between(-100, 0);
                            let meteor = this.physics.add.image(enemy.x + offsetX, enemy.y + offsetY, meteorType)
                                .setScale(1)
                                .setOrigin(0.5, 0.5);
                            this.enemies.add(meteor);
                            meteor.type = 'Meteor';
                        }
                    }

                    enemy.destroy();
                }
            });
        });

        // Move projectiles up
        this.projectiles.getChildren().forEach((projectile) => {
            projectile.y -= 15;
            if (projectile.y < -projectile.height / 2) {
                projectile.destroy();
            }
        });

        // Check enemy collision with player
        this.enemies.getChildren().forEach((enemy) => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.ship.getBounds(), enemy.getBounds())) {
                if (!enemy.hitPlayer) {
                    this.takeDamage();
                    this.explosionSound.play();
                    enemy.hitPlayer = true;
                    enemy.destroy();
                }
            }
        });
    }

    // Handles player damage and checks for game over
    takeDamage() {
        if (this.health > 0) {
            this.health--;
            this.healthIcons[this.health].setVisible(false);

            this.tweens.add({
                targets: this.ship,
                alpha: 0,
                duration: 100,
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    this.ship.setAlpha(1);
                }
            });
        }

        if (this.health <= 0) {
            this.scene.start('GameOverScene', { score: this.score });
        }
    }
}

// Game Over screen showing final score and high score
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    // Receive score from gameplay
    init(data) {
        this.finalScore = data.score || 0;
    }

    // Load assets for game over scene
    preload() {
        this.load.image('Background', 'assets/Background.png');
        this.load.audio('buttonClick', 'assets/confirmation_001.ogg');
    }

    // Display score, high score, and restart option
    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'Background');

        // Handle high score
        const storedHighScore = localStorage.getItem('highScore');
        this.highScore = storedHighScore ? parseInt(storedHighScore) : 0;

        if (this.finalScore > this.highScore) {
            this.highScore = this.finalScore;
            localStorage.setItem('highScore', this.highScore);
        }

        this.add.text(width / 2, height / 2 - 120, 'Game Over', {
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 60, `Score: ${this.finalScore}`, {
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 20, `High Score: ${this.highScore}`, {
            fontSize: '24px',
            fill: '#ffff00'
        }).setOrigin(0.5);

        const restartButton = this.add.text(width / 2, height / 2 + 40, 'Restart', {
            fontSize: '32px',
            fill: '#ff0000',
            backgroundColor: '#ffffff',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.clickSound = this.sound.add('buttonClick');

        restartButton.on('pointerdown', () => {
            this.clickSound.play();
            this.scene.start('Gallery_Shooter');
        });
    }

    // Scrolling background
    update(time, delta) {
        this.background.tilePositionY -= 1;
    }
}

// Pause menu scene with Continue and Quit buttons
class PauseMenuScene extends Phaser.Scene {
    constructor() {
        super('PauseMenuScene');
    }

    // Load button sound
    preload() {
        this.load.audio('buttonClick', 'assets/confirmation_001.ogg');
    }

    // Create pause UI with buttons
    create(data) {
        this.clickSound = this.sound.add('buttonClick');
        const width = this.scale.width;
        const height = this.scale.height;

        this.backgroundOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

        this.add.text(width / 2, height / 2 - 100, 'Paused', {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const continueButton = this.add.text(width / 2, height / 2, 'Continue', {
            fontSize: '32px',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const quitButton = this.add.text(width / 2, height / 2 + 60, 'Quit to Menu', {
            fontSize: '32px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        continueButton.on('pointerdown', () => {
            this.clickSound.play();
            this.scene.stop();
            this.scene.resume(data.from);
        });

        quitButton.on('pointerdown', () => {
            this.clickSound.play();
            this.scene.stop(data.from);
            this.scene.stop();
            this.scene.start('StartScene');
        });
    }
}