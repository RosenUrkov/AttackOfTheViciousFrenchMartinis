const PLAYER = {
    STARTING_POSITION_X: 400,
    STARTING_POSITION_Y: 404,
    MAX_SPEED: 400,

    HEAD: {
        STARTING_POSITION_X: 396,
        STARTING_POSITION_Y: 360
    }
};

const BAR = {
    BORDER_POSITION_X: 0,
    BORDER_POSITION_Y: 448,
};

const BULLET = {
    SPEED: 400,
    SPACING: 450
};

const MARTINI = {
    whiteMartini: {
        minimumDelay: 1000,
        maximumDelay: 3000,
        initialSpeed: 100,
        explosionSpeed: 12
    },
    redMartini: {
        minimumDelay: 10000,
        maximumDelay: 14000,
        initialSpeed: 100,
        explosionSpeed: 30
    }
};

const GAME_VARIABLES = {
    weaponLevel: 1,
    factorDifficulty: 1,
    score: 250,
    gameOverMessage: 'GAME OVER!',
    repositoryHref: 'https://github.com/FrenchMartiniTM/AttackOfTheViciousFrenchMartinis',
}

class Bartender extends Phaser.Sprite {
    constructor(game, image) {
        super(game, PLAYER.STARTING_POSITION_X, PLAYER.STARTING_POSITION_Y, image);
        this.anchor.setTo(0.5, 0.5);
        this.lives = 3;
        game.physics.enable(this, Phaser.Physics.ARCADE);
        this.body.maxVelocity.setTo(PLAYER.MAX_SPEED, PLAYER.MAX_SPEED);
        game.add.existing(this);
    }

    update() {
        if (this.x > this.game.width - 50) {
            this.x = this.game.width - 50;
        }

        if (this.x < 50) {
            this.x = 50;
        }
    }

    moveLeft() {
        this.body.velocity.x = -PLAYER.MAX_SPEED;
    }

    moveRight() {
        this.body.velocity.x = PLAYER.MAX_SPEED;
    }
}

class Bullet extends Phaser.Sprite {
    constructor(game, image) {
        super(game, 0, 0, image);
        this.anchor.setTo(0.5, 1);
        game.physics.enable(this, Phaser.Physics.ARCADE);
        this.outOfBoundsKill = true;
        this.checkWorldBounds = true;
    }
}

class Weapon extends Phaser.Group {
    constructor(game, bullets) {
        super(game);
        this.game = game;
        this.enableBody = true;
        this.timer = 0,
            this.addMultiple(bullets);
        this.setAll('exists', false);
        this.physicsBodyType = Phaser.Physics.ARCADE;
        game.add.existing(this);
    }

    fireBullet(weaponLevel, player, factorDifficulty) {
        if (this.game.time.now < this.timer) {
            return;
        }

        let bulletsCount = weaponLevel + weaponLevel - 1,
            fireSpeed = bulletsCount * 100,
            angles = [0, 20, -20, 40, -40],
            bullet;

        for (let i = 0; i < bulletsCount; i += 1) {
            bullet = this.getFirstExists(false);
            if (bullet) {
                bullet.reset(player.x, player.y);
                bullet.angle = angles[i];

                this.game.physics.arcade.velocityFromAngle(bullet.angle - 90, BULLET.SPEED, bullet.body.velocity);
                bullet.body.velocity.y = -BULLET.SPEED * factorDifficulty;
            }
            this.timer = game.time.now + ((BULLET.SPACING + fireSpeed) / factorDifficulty);
        }
    }
}

let game;

const gameState = {
    preload,
    create,
    update,
    render
};

var player,
    playerHead,

    bar,
    barborder,

    cursors,
    scoreText,

    weapon,
    bullets = [],

    fireButton,
    whiteExplosions,
    redExplosions,

    whiteMartinis,
    whiteMartiniLaunchTimer,

    redMartinis,
    redMartiniLaunchTimer,

    hearts,
    pauseKey,
    gameOverText,

    fullScreenButton,
    fullScreenKey;

function preload() {
    game.load.image('bar', './assets/images/bar.png');
    game.load.image('player', './assets/images/Bartender_80_88_invert.png');
    game.load.image('bullet', './assets/images/green_olive_15_19.png');
    game.load.image('white-martini', './assets/images/glass_80_115.png');
    game.load.image('red-martini', './assets/images/redmartini.png');
    game.load.spritesheet('white-explosion', './assets/images/explode.png', 133, 95, 6);
    game.load.spritesheet('red-explosion', './assets/images/explode1.png', 128, 128, 16);
    game.load.image('barborder', './assets/images/barborder.png');
    game.load.image('playerhead', './assets/images/playerhead.png');
    game.load.image('paused', './assets/images/paused.png');
    game.load.image('heart', './assets/images/heart.png');
    game.load.image('fullscreen', './assets/images/fullscreen.png');
}

function create() {
    //Alligning the game to the center of the window
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.stage.forcePortrait = true;

    //Setting Arcade Physics system for all objects in the game
    game.physics.startSystem(Phaser.Physics.ARCADE);

    bar = game.add.tileSprite(0, 0, 800, 600, 'bar');
    barborder = game.add.sprite(BAR.BORDER_POSITION_X, BAR.BORDER_POSITION_Y, 'barborder');
    game.physics.enable(barborder, Phaser.Physics.ARCADE);
    barborder.body.immovable = true;
    //barborder.alpha = 0; // uncomment if you want the red line to disappear

    gameOverText = game.add.text(
        game.world.centerX,
        game.world.centerY,
        GAME_VARIABLES.gameOverMessage, { font: '84px Arial', fill: '#fff' }
    );
    gameOverText.anchor.setTo(0.5, 0.5);
    gameOverText.kill();

    scoreText = game.add.text(
        600,
        550,
        'score: ' + GAME_VARIABLES.score, { fontSize: '32px', fill: '#F00' }
    );

    for (let i = 0; i < 10; i += 1) {
        bullets.push(new Bullet(game, 'bullet'));
    }

    weapon = new Weapon(game, bullets);
    player = new Bartender(game, 'player');

    hearts = game.add.group();
    addHearts();

    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    playerHead = game.add.sprite(PLAYER.HEAD.STARTING_POSITION_X, PLAYER.HEAD.STARTING_POSITION_Y, 'playerhead');
    game.physics.enable(playerHead, Phaser.Physics.ARCADE);
    //playerHead.alpha = 0; // uncomment if you want the red line to disappear

    whiteExplosions = getExplosions('white-explosion');
    redExplosions = getExplosions('red-explosion');

    whiteMartinis = getMartinis(killWhiteMartini, 'white-martini');
    redMartinis = getMartinis(killRedMartini, 'red-martini');

    launchWhiteMartini();

    pauseKey = this.input.keyboard.addKey(Phaser.Keyboard.ESC);
    pauseKey.onDown.add(GameManager.togglePause, this);

    game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
    fullScreenButton = game.add.button(game.width - 32, 0, 'fullscreen', GameManager.toggleFullScreen, this);
    fullScreenKey = this.input.keyboard.addKey(Phaser.Keyboard.F);
    fullScreenKey.onDown.add(GameManager.toggleFullScreen, this);
}

function update() {
    player.body.velocity.setTo(0, 0);
    playerHead.body.velocity.setTo(0, 0);

    if (cursors.left.isDown) {
        player.moveLeft();
        playerHead.body.velocity.x = -PLAYER.MAX_SPEED;
    } else if (cursors.right.isDown) {
        player.moveRight();
        playerHead.body.velocity.x = PLAYER.MAX_SPEED;
    }

    if (player.alive && (fireButton.isDown || game.input.activePointer.isDown)) {
        weapon.fireBullet(GAME_VARIABLES.weaponLevel, player, GAME_VARIABLES.factorDifficulty);
    }

    if (player.x > game.width - 50) {
        player.x = game.width - 50;
        playerHead.x = player.x - 3;
    }

    if (player.x < 50) {
        player.x = 50;
        playerHead.x = player.x - 3;
    }

    game.physics.arcade.overlap(playerHead, whiteMartinis, playerCollide, null, this);
    game.physics.arcade.overlap(whiteMartinis, weapon, hitEnemy, null, this);
    game.physics.arcade.overlap(barborder, whiteMartinis, barCollide, null, this);

    game.physics.arcade.overlap(playerHead, redMartinis, playerCollide, null, this);
    game.physics.arcade.overlap(redMartinis, weapon, hitEnemy, null, this);
    game.physics.arcade.overlap(barborder, redMartinis, barCollide, null, this);
}

function render() {

}

function getExplosions(explosionAnimation) {
    const explosionType = game.add.group();
    explosionType.enableBody = true;
    explosionType.physicsBodyType = Phaser.Physics.ARCADE;
    explosionType.createMultiple(30, explosionAnimation);
    explosionType.setAll('anchor.x', 0.5);
    explosionType.setAll('anchor.y', 0.5);
    explosionType.forEach(x => x.animations.add(explosionAnimation));

    return explosionType;
}


function getMartinis(onKill, image) {
    const martinis = game.add.group();
    martinis.enableBody = true;
    martinis.physicsBodyType = Phaser.Physics.ARCADE;
    martinis.createMultiple(5, image); //TODO: can add factor to number of enemies in dependence to difficutly level
    martinis.setAll('anchor.x', 0.5); //places the anchor in the exact middle of the sprite, horizontally and vertically.
    martinis.setAll('anchor.y', 0.5); //places the anchor in the exact middle of the sprite, horizontally and vertically.
    martinis.setAll('scale.x', 0.5);
    martinis.setAll('scale.y', 0.5);
    martinis.setAll('angle', 0);
    martinis.forEach(function (enemy) {
        enemy.body.setSize(enemy.width, enemy.height); //makes the collision more accurate since it can hit lower area
        enemy.events.onKilled.add(onKill);
    });

    return martinis;
}

function playerCollide(playerHead, enemy) {
    hearts.callAll('kill');
    player.kill();
    endGame();
}

function barCollide(bar, enemy) {
    enemy.kill();
    hearts.children.pop().kill();

    player.lives -= 1;
    if (player.lives <= 0) {
        player.kill();
        endGame();
    }
}

function hitEnemy(enemy, bullet) {
    enemy.kill();
    bullet.kill();

    GAME_VARIABLES.score += enemy.key === 'white-martini' ? 10 : 20;
    scoreText.text = 'score: ' + GAME_VARIABLES.score;

    setDifficultyLevel();
}

// events - they can accept only one parameter
function killWhiteMartini(martini) {
    killMartini(martini, whiteExplosions, 'white-explosion', MARTINI.whiteMartini.explosionSpeed);
}

function killRedMartini(martini) {
    killMartini(martini, redExplosions, 'red-explosion', MARTINI.redMartini.explosionSpeed);
}

function killMartini(martini, explosions, animation, speed) {
    const explosion = explosions.getFirstExists(false);
    explosion.reset(martini.body.x + martini.body.halfWidth, martini.body.y + martini.body.halfHeight);
    explosion.body.velocity.y = martini.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play(animation, speed, false, true);
}

function launchWhiteMartini() {
    whiteMartiniLaunchTimer = game.time.events.add(
        game.rnd.integerInRange(MARTINI.whiteMartini.minimumDelay, MARTINI.whiteMartini.maximumDelay),
        launchWhiteMartini
    );
    
    if (!player.alive || game.physics.arcade.isPaused) {
        return;
    }

    const enemy = whiteMartinis.getFirstExists(false);

    if (enemy) {
        enemy.reset(game.rnd.integerInRange(100, game.width - 100), 0);

        enemy.body.velocity.x = 0;
        enemy.body.velocity.y = MARTINI.whiteMartini.initialSpeed;
    }
}

function launchRedMartini() {
    //  Send another wave soon
    redMartiniLaunchTimer = game.time.events.add(
        game.rnd.integerInRange(MARTINI.redMartini.minimumDelay, MARTINI.redMartini.maximumDelay),
        launchRedMartini
    );

    if (!player.alive || game.physics.arcade.isPaused) {
        return;
    }

    let startingX = game.rnd.integerInRange(100, game.width - 100),
        spread = 60,
        frequency = 70,
        verticalSpacing = 70,
        numEnemiesInWave = 5,
        bank;

    for (let i = 0; i < numEnemiesInWave; i++) {
        const enemy = redMartinis.getFirstExists(false);
        if (enemy) {
            enemy.startingX = startingX;
            enemy.reset(game.width / 2, -verticalSpacing * i);
            enemy.body.velocity.y = MARTINI.redMartini.initialSpeed;

            enemy.update = function () {
                this.body.x = this.startingX + Math.sin((this.y) / frequency) * spread;

                bank = Math.cos((this.y + 60) / frequency)
                this.scale.x = 0.5 - Math.abs(bank) / 8;
                this.angle = 0 - bank * 2;
            };
        }
    }
}

function addHearts() {
    for (var i = 0; i < player.lives; i += 1) {
        hearts.create(5 + i * 33, 560, 'heart');
    }
}

function endGame() {
    playerHead.kill();

    game.time.events.remove(redMartiniLaunchTimer);
    game.time.events.remove(whiteMartiniLaunchTimer);

    whiteMartinis.callAll('kill');
    redMartinis.callAll('kill');

    GameManager.addHighscore();
    gameOverText.revive();
    hearts.children = [];

    spaceRestart = fireButton.onDown.addOnce(restart, this);
}

function restart() {
    gameOverText.kill();
    player.alive = true;
    player.reset(PLAYER.STARTING_POSITION_X, PLAYER.STARTING_POSITION_Y);
    playerHead.reset(PLAYER.HEAD.STARTING_POSITION_X, PLAYER.HEAD.STARTING_POSITION_Y);

    resetStartingGameStats();
    launchWhiteMartini();
}

function resetStartingGameStats() {
    resetScore();
    resetLives();
    resetDifficulty();
}

function resetScore() {
    GAME_VARIABLES.score = 0;
    scoreText.text = 'score: ' + GAME_VARIABLES.score;
}

function resetLives() {
    player.lives = 3;
    addHearts();
}

function resetDifficulty() {
    GAME_VARIABLES.factorDifficulty = 1;
    GAME_VARIABLES.weaponLevel = 1;

    MARTINI.whiteMartini.initialSpeed = 100;
    MARTINI.whiteMartini.minimumDelay = 1000;
    MARTINI.whiteMartini.maximumDelay = 3000;

    MARTINI.redMartini.initialSpeed = 50;
    MARTINI.redMartini.minimumDelay = 10000;
    MARTINI.redMartini.maximumDelay = 14000;
}

function setDifficultyLevel() {
    switch (GAME_VARIABLES.score) {
        case 50:
            GAME_VARIABLES.factorDifficulty = 1.1;
            break;
        case 100:
            GAME_VARIABLES.factorDifficulty = 1.2;
            break;
        case 200:
            GAME_VARIABLES.factorDifficulty = 1.4;
            break;
        case 300:
            GAME_VARIABLES.factorDifficulty = 1.6;
            GAME_VARIABLES.weaponLevel = 2;
            launchRedMartini();
            break;
        case 400:
        case 410:
            GAME_VARIABLES.factorDifficulty = 1.8;
            break;
        case 500:
        case 510:
            GAME_VARIABLES.factorDifficulty = 2.0;
            GAME_VARIABLES.weaponLevel = 3;
            break;
        default:
            return;
    }

    (function improveDifficulty() {
        MARTINI.whiteMartini.minimumDelay = 1000 / GAME_VARIABLES.factorDifficulty;
        MARTINI.whiteMartini.maximumDelay = 3000 / GAME_VARIABLES.factorDifficulty;
        MARTINI.whiteMartini.initialSpeed = 100 * GAME_VARIABLES.factorDifficulty;

        MARTINI.redMartini.minimumDelay = 6000 / GAME_VARIABLES.factorDifficulty;
        MARTINI.redMartini.maximumDelay = 10000 / GAME_VARIABLES.factorDifficulty;
        MARTINI.redMartini.initialSpeed = 60 * GAME_VARIABLES.factorDifficulty;
    })();
}

class SvgUtils {
    static createSVG(tag, attrs) {
        let el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (let attr in attrs) {
            el.setAttribute(attr, attrs[attr]);
        }

        return el;
    }
}

class MainMenu {
    constructor(highscores) {
        if (typeof highscores === "undefind") {
            highscores = [];
        }
        this._playerName = "Bartender"
        this._highscores = [
            ["Bartender", 10000],
            ["Bartender", 1000],
            ["Bartender", 100],
            ["Bartender", 10],
            ["Bartender", 0]
        ];
    }

    get playerName() {
        return this._playerName;
    }

    set playerName(value) {
        this._playerName = value;
    }

    updateHighscores(score) {
        this._highscores.push([this._playerName, score]);

        this._highscores.sort(function(a, b) {
            return b[1] - a[1];
        });

        this._highscores.pop();
    }

    load() {
        const buttonLabels = ["Start Game", "Controls", "Highscores", "Credits", "Quit Game"],
            buttonIds = ["start", "controls", "highscores", "credits", "quit"],
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
            buttonHight = 50,
            buttonWidth = 240,
            svgWidth = 800,
            svgHight = 600,
            buttonsStartX = 270,
            buttonsStartY = 210,
            labelsStartX = 270,
            labelsStartY = 250,
            step = 80;
        svg.setAttribute("id", "svgCon");
        svg.setAttribute("width", svgWidth);
        svg.setAttribute("height", svgHight);
        svg.setAttribute("viewBox", "0 0 800 600");
        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/svg");
        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

        const logo = SvgUtils.createSVG("image", {
            "id": "logo",
            "width": 756,
            "height": 152,
            "x": "22",
            "y": "50"
        });
        logo.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "assets/images/logo.png");
        svg.appendChild(logo);

        for (let i = 1; i <= 20; i += 1) {
            const backgroundGlass = SvgUtils.createSVG("image", {
                "class": "background-glass",
                "y": -200,
                "style": "pointer-events: none;",
                "width": 80,
                "height": 115
            });
            if ((i % 3) === 0) {
                backgroundGlass.setAttribute("transform", "rotate(45)");
            }

            if ((i % 2) === 0) {
                backgroundGlass.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "assets/images/glass_80_115.png");
                backgroundGlass.setAttribute("x", "-200");
                const animateX = SvgUtils.createSVG("animate", {
                    "attributeName": "x",
                    "from": (-40 * i) - 100,
                    "to": 900 + (40 * i),
                    "dur": (i % 5) + i + "s",
                    "attributeType": "XML",
                    "repeatCount": "indefinite",
                    "begin": (i % 3) + i + "s"
                });
                backgroundGlass.appendChild(animateX);
            } else {
                backgroundGlass.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "assets/images/redmartini.png");
                backgroundGlass.setAttribute("x", "1000");
                const animateX = SvgUtils.createSVG("animate", {
                    "attributeName": "x",
                    "from": 900 + (40 * i),
                    "to": (-40 * i) - 100,
                    "dur": (i % 6) + i + "s",
                    "attributeType": "XML",
                    "repeatCount": "indefinite",
                    "begin": (i % 3) + i + "s"
                });
                backgroundGlass.appendChild(animateX);
            }

            const animateY = SvgUtils.createSVG("animate", {
                "attributeName": "y",
                "from": -300,
                "to": 1000,
                "dur": (i % 5) + i + "s",
                "attributeType": "XML",
                "repeatCount": "indefinite",
                "begin": (i % 3) + i + "s"
            });
            backgroundGlass.appendChild(animateY);

            svg.appendChild(backgroundGlass);
        }

        for (let i in buttonLabels) {
            const button = SvgUtils.createSVG("rect", {
                "class": "button-menu",
                "width": buttonWidth,
                "height": buttonHight,
                "id": buttonIds[i],
                "rx": "10",
                "ry": "10",
                "x": buttonsStartX,
                "y": i * step + buttonsStartY
            });

            button.addEventListener("click", this.onClick, false);

            const buttonLabel = SvgUtils.createSVG("text", {
                "class": "button-text",
                "x": labelsStartX + buttonWidth / (4 * buttonLabels[i].length),
                "y": i * step + labelsStartY,
                "textLength": (buttonWidth - (buttonWidth / (2 * buttonLabels[i].length) | 0)),
                "lengthAdjust": "spacingAndGlyphs",
                "stroke": "#ff0000",
                "font-family": "Copperplate Gothic Light",
                "font-size": "40px"
            });

            buttonLabel.innerHTML = buttonLabels[i];
            svg.appendChild(buttonLabel);
            svg.appendChild(button);
        }

        let top = document.getElementById("top");
        if (top === null) {
            top = document.createElement("div");
            top.setAttribute("id", "top");
            document.body.appendChild(top);
        }
        top.appendChild(svg);
    }

    onBodyResize() {
        const resizedWidth = this.innerWidth;
        const resizedHeight = this.innerHeight;
        const resizedX = (((resizedWidth - 800) / 2) | 0) < 0 ? 0 : (((resizedWidth - 800) / 2) | 0);
        const resizedY = (((resizedHeight - 600) / 2) | 0) < 0 ? 0 : (((resizedHeight - 600) / 2) | 0);
        const topCon = this.document.getElementById("top");
        if (topCon !== null) {
            topCon.setAttribute("style", "margin-left: " + resizedX + "px; margin-top: " + resizedY + "px;");
        }
    }

    onClick() {
        const targetId = this.id;
        if (targetId === "start") {
            document.getElementById('svgCon').style.display = 'none';
            GameManager.startGame();
        } else if (targetId === "controls" || targetId === "highscores" || targetId === "credits") {
            const svg = document.getElementById("svgCon");
            let infoPanel = SvgUtils.createSVG("rect", {
                "class": "info-panel",
                "width": 600,
                "height": 480,
                "id": "info",
                "rx": "20",
                "ry": "20",
                "x": 100,
                "y": 100
            });

            const buttonHight = 40,
                buttonWidth = 180,
                svgWidth = 800,
                svgHight = 600,
                buttonText = "Close";

            const closeButtonLabel = SvgUtils.createSVG("text", {
                "class": "button-text",
                "x": 320,
                "y": 555,
                "id": "button-label",
                "textLength": (buttonWidth - ((buttonWidth / buttonText.length) | 0)),
                "lengthAdjust": "spacingAndGlyphs",
                "stroke": "#ff0000",
                "font-family": "Copperplate Gothic Light",
                "font-size": "30px"
            });

            closeButtonLabel.innerHTML = buttonText;

            const button = SvgUtils.createSVG("rect", {
                "class": "button-close",
                "width": buttonWidth,
                "height": buttonHight,
                "id": "close",
                "rx": "10",
                "ry": "10",
                "x": 300,
                "y": 520,
            });

            let contents = [];

            button.addEventListener("click", function() {
                const label = document.getElementById("button-label");
                const button = document.getElementById("close");
                const infoPanel = document.getElementById("info");
                label.remove();
                button.remove();
                infoPanel.remove();
                let nicknameInput = document.getElementById("nickname-input");
                contents.forEach(e => e.remove());
                this.removeEventListener("click", function() {});

                if ((nicknameInput !== null) && (nicknameInput.value !== mainMenu.playerName)) {
                    mainMenu.playerName = nicknameInput.value;
                }
            });

            svg.appendChild(infoPanel);
            svg.appendChild(closeButtonLabel);
            svg.appendChild(button);

            if (targetId === "controls") {
                const title = SvgUtils.createSVG("text", {
                    "class": "title-text",
                    "x": 240,
                    "y": 160,
                    "id": "controls-title",
                    "lengthAdjust": "spacingAndGlyphs",
                    "textLength": (2 * buttonWidth - ((buttonWidth / buttonText.length) | 0)),
                    "fill": "#fff",
                    "stroke": "#ff0000",
                    "font-family": "Copperplate Gothic Light",
                    "font-size": "40pt"
                });
                title.innerHTML = "Controls";
                contents.push(title);

                const nicknameInput = SvgUtils.createSVG("foreignObject", {
                    "class": "title-text",
                    "x": 400,
                    "y": 220,
                    "width": 280,
                    "height": 50
                });

                const xmlnsDiv = document.createElement("div");
                xmlnsDiv.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

                const input = document.createElement("input");
                input.setAttribute("type", "text");
                input.setAttribute("id", "nickname-input");
                input.setAttribute("value", mainMenu.playerName);
                xmlnsDiv.appendChild(input);
                nicknameInput.appendChild(xmlnsDiv);
                contents.push(nicknameInput);

                const inputLabel = SvgUtils.createSVG("text", {
                    "class": "title-text",
                    "x": 240,
                    "y": 260,
                    "id": "controls-title",
                    "lengthAdjust": "spacingAndGlyphs",
                    "textLength": (buttonWidth - ((buttonWidth / buttonText.length) | 0)),
                    "fill": "#fff",
                    "stroke": "#ff0000",
                    "font-family": "Copperplate Gothic Light",
                    "font-size": "24pt"
                });
                inputLabel.innerHTML = "Nickname:";
                contents.push(inputLabel);

                const leftArrow = SvgUtils.createSVG("image", {
                    "class": "control-image",
                    "x": 210,
                    "y": 320,
                    "style": "pointer-events: none;"
                });
                leftArrow.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "assets/images/leftArrow.png");
                const leftArrowAnimate = SvgUtils.createSVG("animate", {
                    "attributeName": "opacity",
                    "values": "1;0;1",
                    "dur": "2s",
                    "repeatCount": "indefinite"
                });
                leftArrow.appendChild(leftArrowAnimate);
                contents.push(leftArrow);

                const rightArrow = SvgUtils.createSVG("image", {
                    "class": "control-image",
                    "x": 370,
                    "y": 320,
                    "style": "pointer-events: none;"
                });
                rightArrow.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "assets/images/rightArrow.png");
                const rightArrowAnimate = SvgUtils.createSVG("animate", {
                    "attributeName": "opacity",
                    "values": "0;1;0",
                    "dur": "2s",
                    "repeatCount": "indefinite"
                });
                rightArrow.appendChild(rightArrowAnimate);
                contents.push(rightArrow);

                const movementLabel = SvgUtils.createSVG("text", {
                    "class": "title-text",
                    "x": 480,
                    "y": 350,
                    "id": "controls-title",
                    "lengthAdjust": "spacingAndGlyphs",
                    "fill": "#fff",
                    "stroke": "#ff0000",
                    "font-family": "Copperplate Gothic Light",
                    "font-size": "24pt"
                });
                movementLabel.innerHTML = "Movement";
                contents.push(movementLabel);

                const space = SvgUtils.createSVG("image", {
                    "class": "control-image",
                    "x": 140,
                    "y": 380,
                    "style": "pointer-events: none;"
                });
                space.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "assets/images/space.png");
                const spaceAnimate = SvgUtils.createSVG("animate", {
                    "attributeName": "opacity",
                    "values": "0;1;0",
                    "dur": "1s",
                    "repeatCount": "indefinite"
                });
                space.appendChild(spaceAnimate);
                contents.push(space);

                const attackLabel = SvgUtils.createSVG("text", {
                    "class": "title-text",
                    "x": 500,
                    "y": 410,
                    "id": "controls-title",
                    "lengthAdjust": "spacingAndGlyphs",
                    "fill": "#fff",
                    "stroke": "#ff0000",
                    "font-family": "Copperplate Gothic Light",
                    "font-size": "24pt"
                });
                attackLabel.innerHTML = "Attack";
                contents.push(attackLabel);

                const escImg = SvgUtils.createSVG("image", {
                    "class": "control-image",
                    "x": 290,
                    "y": 440,
                    "style": "pointer-events: none;"
                });
                escImg.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "assets/images/esc.png");
                const escAnimate = SvgUtils.createSVG("animate", {
                    "attributeName": "opacity",
                    "values": "0;1;0",
                    "dur": "3s",
                    "repeatCount": "indefinite"
                });
                escImg.appendChild(escAnimate);
                contents.push(escImg);

                const pauseLabel = SvgUtils.createSVG("text", {
                    "class": "title-text",
                    "x": 440,
                    "y": 470,
                    "id": "controls-title",
                    "lengthAdjust": "spacingAndGlyphs",
                    "fill": "#fff",
                    "stroke": "#ff0000",
                    "font-family": "Copperplate Gothic Light",
                    "font-size": "24pt"
                });
                pauseLabel.innerHTML = "Pause / Menu";
                contents.push(pauseLabel);

                contents.forEach(e => svg.appendChild(e));
            }

            if (targetId === "highscores") {
                const title = SvgUtils.createSVG("text", {
                    "class": "title-text",
                    "x": 240,
                    "y": 160,
                    "id": "controls-title",
                    "lengthAdjust": "spacingAndGlyphs",
                    "textLength": (2 * buttonWidth - ((buttonWidth / buttonText.length) | 0)),
                    "fill": "#fff",
                    "stroke": "#ff0000",
                    "font-family": "Copperplate Gothic Light",
                    "font-size": "40pt"
                });
                title.innerHTML = "Highscores";
                contents.push(title);

                const symbol = SvgUtils.createSVG("symbol", { "id": "text-symbol" });

                for (let i = 0; i < mainMenu._highscores.length; i += 1) {
                    const userText = SvgUtils.createSVG("text", {
                        "class": "highscore-text-username",
                        "x": 140,
                        "y": 250 + (i * 50)
                    });
                    userText.innerHTML = "" + (i + 1) + ". " + mainMenu._highscores[i][0];
                    symbol.appendChild(userText);

                    let scoresText = "" + mainMenu._highscores[i][1];
                    const userScore = SvgUtils.createSVG("text", {
                        "class": "highscore-text-username",
                        "x": 660 - (scoresText.length * 30),
                        "y": 250 + (i * 50)
                    });
                    userScore.innerHTML = scoresText;
                    symbol.appendChild(userScore);
                }
                contents.push(symbol);

                for (let i = 0; i < 5; i += 1) {
                    const use = SvgUtils.createSVG("use", { "class": "text-username-use" });
                    use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#text-symbol");
                    contents.push(use);
                }
            }

            if (targetId === "credits") {
                let paths = ["Arnaudov_St", "bobi_dobroto", "dreadlocker", "gchankov", "ludzhev", "martinboykov", "rosen.urkov"];

                const title = SvgUtils.createSVG("text", {
                    "class": "title-text",
                    "x": 240,
                    "y": 160,
                    "id": "controls-title",
                    "lengthAdjust": "spacingAndGlyphs",
                    "textLength": (2 * buttonWidth - ((buttonWidth / buttonText.length) | 0)),
                    "fill": "#fff",
                    "stroke": "#ff0000",
                    "font-family": "Copperplate Gothic Light",
                    "font-size": "40pt"
                });
                title.innerHTML = "Credits";
                contents.push(title);

                for (let i = 0; i < paths.length; i += 1) {
                    const path = SvgUtils.createSVG("path", { "id": "path" + i });
                    const pathAnimate = SvgUtils.createSVG("animate", {
                        "attributeName": "d",
                        "from": "m280,200 h0",
                        "to": "m280,500 h400",
                        "dur": "24s",
                        "begin": (i * 3) + "s",
                        "repeatCount": "indefinite"
                    });
                    path.appendChild(pathAnimate);
                    contents.push(path);


                    const creditsLine = SvgUtils.createSVG("text", {
                        "fill": "#7FFF00",
                        "font-family": "Copperplate Gothic Light",
                        "font-size": "24pt"
                    });
                    const textPath = SvgUtils.createSVG("textPath");
                    textPath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#path" + i);
                    textPath.innerHTML = paths[i];
                    creditsLine.appendChild(textPath);
                    contents.push(creditsLine);
                }
            }

            contents.forEach(e => svg.appendChild(e));
        } else if (targetId === "quit") {
            window.removeEventListener("load", function() {});
            window.removeEventListener("resize", mainMenu.onBodyResize);
            window.location.href = GAME_VARIABLES.repositoryHref;
        }
    }
}


const mainMenu = new MainMenu();
window.onload = function() {
    mainMenu.load();
    mainMenu.onBodyResize.call(this);
    this.addEventListener("resize", mainMenu.onBodyResize, false);
}

class GameManager {
    static startGame() {
        if (!game) {
            document.getElementById("svgCon").style.display = 'none';
            game = new Phaser.Game(800, 600, Phaser.CANVAS, 'gameContainer', gameState);
        } else {
            GameManager.togglePause();
        }
    }
    static togglePause() {
        game.physics.arcade.isPaused = (game.physics.arcade.isPaused) ? false : true;
        if (game.physics.arcade.isPaused) {
            GameManager.showMenu();
        } else {
            GameManager.removeMenu();
        }
    }
    static toggleFullScreen() {
        if (game.scale.isFullScreen) {
            game.scale.stopFullScreen();
        } else {
            game.scale.startFullScreen(true);
        }
    }

    static addHighscore() {
        mainMenu.updateHighscores(GAME_VARIABLES.score);
    }

    static removeMenu() {
        document.getElementById("svgCon").style.display = 'none';
        document.getElementsByTagName("canvas")[0].style.display = 'block';
    }

    static showMenu() {
        document.getElementsByTagName("canvas")[0].style.display = 'none';
        document.getElementById("svgCon").style.display = 'inline-block';
    }
}