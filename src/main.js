/* *****************************************************************************
================================ MAIN GAME CLASS ===============================
***************************************************************************** */

// Timer in minutes for how long the player can play the game
const ALLOWED_PLAYING_TIME = 999999999;

// globals for canvas context and the width and height of the canvas
var ctx, WIDTH, HEIGHT;
// minimum radius for a circle to be visible using the arc method
var CIRCLE_THRESHOLD = 1.12;

// static global function that gets a random integer between min and max
var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function Game(c, w, h) {
    ctx = c;
    WIDTH = w;
    HEIGHT = h;

    this.running = true;
    this.isGameOver = false;
    this.isInStartMenu = false;
    this.started = false;
    this.crash = false; // singals crash to main loop so images can be adjusted
    this.crashFramesCounter = 0;

    this.lifes = 3;
    this.meters = 0;

    // highscores for distance and collectables
    this.highscoreMeters = 0;
    this.highscoreGoodies = 0;

    // multiplier for initial speeds, gradually increasing over time
    this.speedBoost = 1;
    // speedup factor (multiplied to speedBoost at every iteration of the loop)
    this.speedGain = 1.0002;

    // stars background, has different "layers" of stars (with different speeds)
    this.bgLayers = [];
    this.numBgLayers = 10;
    this.baseStarNum = 14;
    this.baseStarRadius = 1.8;
    this.baseStarSpeed = {
        x: 0,
        y: 100,
    };

    // offset to starting point of spaceship in the middle
    this.spaceshipOffset = 0;

    // loads astronaut picture from the start menu of the game
    this.astronaut_img = new Image();
    this.astronaut_img.src = 'img/outer_space.png';

    // loads spaceship, lifes and asteroids images
    this.spaceship_img = new Image();
    this.spaceship_img.src = 'img/spaceship.png';
    this.spaceshipHurt_img = new Image();
    this.spaceshipHurt_img.src = 'img/spaceship_hurt.png';
    this.spaceshipUsed = this.spaceship_img;

    this.asteroids_img = Array(8)
        .fill(null)
        .map((_) => new Image());
    this.asteroids_img.forEach((element, index) => {
        element.src = 'img/asteroid' + String(index + 1) + '.png';
    });

    this.lifes_img = [null, null, null, null].map((_) => new Image());
    this.lifes_img.forEach((element, index) => {
        element.src = 'img/lifes_' + String(index) + '.png';
    });

    // collectable "goodies" (stars in this case)
    this.goodies = [];
    this.goodieProb = 0.005;
    this.numOfGoodies = 0;
    this.goodie_img = new Image();
    this.goodie_img.src = 'img/goodie.png';

    // asteroids spawning parameters
    this.asteroidsProb = 0.01;
    this.asteroids = [];
    this.asteroidSpeed = {
        x: 0,
        y: 250,
    };

    this.buttonColor = 'white';

    this.time_on_start = undefined;
}

/*
 * Initialize star field stars divided into layers.
 * Layers have different speeds and stars in faster layers are larger.
 */
Game.prototype.initBackground = function () {
    this.bgLayers = [];

    for (var i = this.numBgLayers; i > 0; --i) {
        var stars = [];

        for (var j = 0; j < this.baseStarNum * i; j++) {
            var star = {
                x: getRandomInt(0, WIDTH),
                y: getRandomInt(0, HEIGHT),
                radius: Math.round((this.baseStarRadius / i) * 100) / 100,
                speed: {
                    x: Math.round((this.baseStarSpeed.x / i) * 100) / 20,
                    y: Math.round((this.baseStarSpeed.y / i) * 100) / 20,
                },
            };
            stars.push(star);
        }
        this.bgLayers.push(stars);
    }
};

// Checks if (x, y) is on the canvas
Game.prototype.inBounds = function (x, y) {
    return x > 0 && x < WIDTH && y > 0 && y < HEIGHT;
};

// Checks if the allowed time span has elapsed since the game started
Game.prototype.timeIsUp = function() {
    var elapsedTime = (new Date).getTime() - this.time_on_start;

    if (elapsedTime > 60000 * ALLOWED_PLAYING_TIME) {
        return true;
    }

    return false;
};

Game.prototype.showTimeUpScreenAndLogout = function() {
    $("#timeUpText").show();
    $("#gameCanvasContainer").hide();

    setTimeout(function () {
        $("#timeUpText").fadeOut(1000, function () { 
            window.location.replace('../logout.php');
         });
    }, 3000);
};

// resets all parameters to start a fresh game, also saves highscores
Game.prototype.startNewGame = function () {
    this.running = true;
    this.isGameOver = false;
    this.started = true;
    this.isInStartMenu = false;
    this.crash = false;
    this.crashFramesCounter = 0;
    this.lifes = 3;
    this.speedBoost = 1;
    this.bgLayers = [];
    this.spaceshipOffset = 0;
    this.goodies = [];
    this.asteroids = [];
    this.spaceshipUsed = this.spaceship_img;

    if (this.meters > this.highscoreMeters) {
        this.highscoreMeters = this.meters;
        this.highscoreGoodies = this.numOfGoodies;
    }

    this.meters = 0;
    this.numOfGoodies = 0;

    // starts the 'timer' on the first game
    if (this.time_on_start === undefined) {
        this.time_on_start = (new Date).getTime();
    }

    this.initBackground();
};

/* ================================= UPDATE ================================= */

Game.prototype.update = function (delta) {
    // starts the game and initializes the background with the stars
    if (!this.started) {
        this.started = true;
        this.isInStartMenu = true;
        this.initBackground();
        console.log('Game started');
    }
    // only the background has to be updated when in start menu or end screen
    else if (this.isInStartMenu || this.isGameOver) {
        // redirects to logout if allowed time is up
        if (game.timeIsUp()) {
            game.running = false;
            game.showTimeUpScreenAndLogout();
        }

        this.moveStars(delta);
    }
    // during the game, update everything and spawn new asteroids and goodies
    else {
        this.meters += 1 / 3;
        this.moveStars(delta);
        this.spawnAsteroidWithProb();
        this.spawnGoodieWithProb();
        this.moveAsteroids(delta);
        this.moveGoodies(delta);

        // check for collision with asteroids and goodies if a collision with an
        // asteroid occured, reset the game speed and lose one life
        if (this.collisionTest()) {
            this.crash = true;
            this.speedBoost = 1.0;
            this.lifes -= 1;
        }

        // make the game faster
        this.speedBoost *= this.speedGain;
    }
};

// move stars according to their speed and respawn stars that reach the bottom
Game.prototype.moveStars = function (delta) {
    for (var i = 0; i < this.bgLayers.length; i++) {
        for (var j = 0; j < this.bgLayers[i].length; j++) {
            var star = this.bgLayers[i][j];

            if (this.inBounds(star.x, star.y)) {
                // move star
                star.x += star.speed.x * delta * this.speedBoost;
                star.y += star.speed.y * delta * this.speedBoost;
            } else {
                // reset and respawn star at the top
                star.x = getRandomInt(0, WIDTH);
                star.y = 1;
            }
        }
    }
};

// spawn new asteroids with given probability
Game.prototype.spawnAsteroidWithProb = function () {
    if (Math.random() < this.asteroidsProb) {
        var asteroid = {
            x: getRandomInt(0, WIDTH),
            y: -50,
            speed: {
                x: this.asteroidSpeed.x,
                y: this.asteroidSpeed.y,
            },
            scale: Math.random() * (1.25 - 0.75) + 0.75,
            type: Math.floor(Math.random() * 7) + 1,
        };
        this.asteroids.push(asteroid);
    }
};

// spawn new goodies with given probability
Game.prototype.spawnGoodieWithProb = function () {
    if (Math.random() < this.goodieProb) {
        var goodie = {
            x: getRandomInt(0, WIDTH),
            y: -50,
            speed: {
                x: this.asteroidSpeed.x,
                y: this.asteroidSpeed.y,
            },
        };
        this.goodies.push(goodie);
    }
};

// move asteroids according to their speeds and destroy asteroids that reached
// the bottom
Game.prototype.moveAsteroids = function (delta) {
    for (var i = 0; i < this.asteroids.length; i++) {
        var asteroid = this.asteroids[i];

        if (this.inBounds(asteroid.x, asteroid.y)) {
            // move asteroid
            asteroid.x += asteroid.speed.x * delta * this.speedBoost;
            asteroid.y += asteroid.speed.y * delta * this.speedBoost;
        } else {
            // arbitrary treshhold
            if (asteroid.y > 80) {
                this.asteroids.splice(i, 1);
            } else {
                // move asteroid
                asteroid.x += asteroid.speed.x * delta * this.speedBoost;
                asteroid.y += asteroid.speed.y * delta * this.speedBoost;
            }
        }
    }
};

// move goodies according to their speeds and destroy goodies that reached the
// bottom
Game.prototype.moveGoodies = function (delta) {
    for (var i = 0; i < this.goodies.length; i++) {
        var goodie = this.goodies[i];

        if (this.inBounds(goodie.x, goodie.y)) {
            // move asteroid
            goodie.x += goodie.speed.x * delta * this.speedBoost;
            goodie.y += goodie.speed.y * delta * this.speedBoost;
        } else {
            // arbitrary treshhold
            if (goodie.y > 80) {
                this.goodies.splice(i, 1);
            } else {
                // move asteroid
                goodie.x += goodie.speed.x * delta * this.speedBoost;
                goodie.y += goodie.speed.y * delta * this.speedBoost;
            }
        }
    }
};

// returns true if a collision with an asteroid occured, otherwise false
Game.prototype.collisionTest = function () {
    var crashedWithAsteroid = false;

    // Check for collison with asteroids
    this.asteroids.forEach((asteroid, index) => {
        // x/y cordinates of upper left corner of the spaceship (hardcoded)
        var x = WIDTH / 2 - 60 + this.spaceshipOffset;
        var y = HEIGHT - 200;

        // tolerance area
        x += 25;
        y += 30;

        if (x > asteroid.x && asteroid.x + 90 * asteroid.scale > x) {
            if (
                asteroid.y + 90 * asteroid.scale > y &&
                asteroid.y + 90 * asteroid.scale < y + 140
            ) {
                this.asteroids.splice(index, 1);
                crashedWithAsteroid = true;
            }
        } else if (
            x + 60 < asteroid.x + 90 * asteroid.scale &&
            asteroid.x < x + 60
        ) {
            if (
                asteroid.y + 90 * asteroid.scale > y &&
                asteroid.y + 90 * asteroid.scale < y + 140
            ) {
                this.asteroids.splice(index, 1);
                crashedWithAsteroid = true;
            }
        }
    });

    if (crashedWithAsteroid) {
        this.crashFramesCounter = 0;
        return true;
    }

    // Check for collison with goodies
    this.goodies.forEach((goodie, index) => {
        // x/y cordinates of upper left corner of the spaceship
        var x = WIDTH / 2 - 60 + this.spaceshipOffset;
        var y = HEIGHT - 200;

        if (x > goodie.x && goodie.x + 90 > x) {
            if (goodie.y + 90 > y && goodie.y + 90 < y + 160) {
                this.goodies.splice(index, 1);
                this.numOfGoodies += 1;
            }
        } else if (x + 105 < goodie.x + 90 && goodie.x < x + 105) {
            if (goodie.y + 90 > y && goodie.y + 90 < y + 160) {
                this.goodies.splice(index, 1);
                this.numOfGoodies += 1;
            }
        }

            // goodie is right in front of spaceship
        // (goodie has a smaller width, so this edge case has to be checked)
        else if (x + 105 > goodie.x + 90 && goodie.x > x) {
            if (goodie.y + 90 > y && goodie.y + 90 < y + 160) {
                this.goodies.splice(index, 1);
                this.numOfGoodies += 1;
            }
        }
    });

    return false;
};

/* ================================== DRAW ================================== */

// draws start menu, game over screen or the game (stars, asteroids, goodies,
// spaceship, HUD)
Game.prototype.render = function () {
    ctx.beginPath();
    ctx.fillStyle = '#151515';
    ctx.strokeStyle = '#FFF';
    ctx.fillRect(-1, -1, WIDTH + 5, HEIGHT + 5);
    ctx.strokeRect(-1, -1, WIDTH + 5, HEIGHT + 5);
    ctx.fillStyle = '#FFF';
    
    this.drawStars();
    
    if (this.isInStartMenu) {
        this.drawStartMenu();
    } else if (this.isGameOver) {
        this.drawGameOverScreen();
    } else {
        this.drawAsteroids();
        this.drawGoodies();
        this.drawSpaceship();
        this.drawHUD();
    }
    ctx.stroke();
};

// draw astronaut picture and start button
Game.prototype.drawStartMenu = function () {
    ctx.beginPath();

    // Start Game button
    ctx.lineWidth = '2';
    ctx.strokeStyle = this.buttonColor;
    ctx.rect(WIDTH / 3, (HEIGHT / 7) * 2 - 20, WIDTH / 3, HEIGHT / 6);
    
    ctx.font = '42px poppins';
    ctx.fillStyle = this.buttonColor;
    ctx.fillText('Start Game', WIDTH / 3 + 42, (HEIGHT / 7) * 2.55);
    
    ctx.drawImage(
        this.astronaut_img,
        0,
        0,
        WIDTH,
        HEIGHT
        );
    ctx.stroke();
};

// draw the background with the star layers
Game.prototype.drawStars = function () {
    for (var i = 0; i < this.bgLayers.length; i++) {
        for (var j = 0; j < this.bgLayers[i].length; j++) {
            var star = this.bgLayers[i][j];

            if (star.radius >= CIRCLE_THRESHOLD) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI, false);
                ctx.fill();
            } else {
                // circles cannot be seen below this point.
                // cheaper to render square pixels instead.
                // increasing the size for pixels makes sure
                // there's depth of field and stars are visible
                var pixelSize = star.radius * 3;
                ctx.beginPath();
                ctx.fillRect(star.x, star.y, pixelSize, pixelSize);
            }
        }
    }
};

// draw asteroids
Game.prototype.drawAsteroids = function () {
    for (var i = 0; i < this.asteroids.length; i++) {
        var asteroid = this.asteroids[i];

        ctx.beginPath();
        ctx.drawImage(
            this.asteroids_img[asteroid.type - 1],
            asteroid.x,
            asteroid.y,
            90 * asteroid.scale,
            90 * asteroid.scale
        );
    }
};

// draw goodies
Game.prototype.drawGoodies = function () {
    ctx.beginPath();
    for (var i = 0; i < this.goodies.length; i++) {
        var goodie = this.goodies[i];
        ctx.drawImage(this.goodie_img, goodie.x, goodie.y, 75, 75);
    }
};

// draw spaceship with current offset
Game.prototype.drawSpaceship = function () {
    ctx.beginPath();
    ctx.drawImage(
        this.spaceshipUsed,
        WIDTH / 2 - 60 + this.spaceshipOffset,
        HEIGHT - 200,
        105,
        153
    );
};

// draw HUD with lifes, number of collected goodies and distance in meters
Game.prototype.drawHUD = function () {
    ctx.beginPath();
    ctx.drawImage(this.lifes_img[this.lifes], 40, 40, 150, 50);
    ctx.font = '40px poppins';
    ctx.fillText(Math.floor(this.meters).toString() + 'm', WIDTH - 180, 75);
    ctx.fillText(this.numOfGoodies, WIDTH / 2 - 40, 79);
    ctx.drawImage(this.goodie_img, WIDTH / 2, 34, 60, 60);
};

// draw game over message, current score, highscore and restart button
Game.prototype.drawGameOverScreen = function () {
    ctx.beginPath();

    // Start Game button
    ctx.lineWidth = '2';
    ctx.strokeStyle = this.buttonColor;
    ctx.rect(WIDTH / 3, (HEIGHT / 7) * 5 - 20, WIDTH / 3, HEIGHT / 6);
    
    ctx.font = '42px poppins';
    ctx.fillStyle = this.buttonColor;
    ctx.fillText('RESTART  ', WIDTH / 3 + 80, (HEIGHT / 7) * 5.55);
    
    ctx.font = '80px poppins';
    ctx.fillStyle = '#fa6498';
    ctx.fillText('GAME OVER', WIDTH / 3 - 60, 180);
    
    ctx.font = '30px poppins';
    ctx.fillStyle = 'white';
    ctx.fillText(
        'Your Score:     ' +
        String(parseInt(this.meters)) +
        'm    and    ' +
        String(this.numOfGoodies) +
        ' stars',
        WIDTH / 4,
        340
        );
        
        ctx.font = '30px poppins';
        ctx.fillText(
            'Highscore :     ' +
            String(parseInt(this.highscoreMeters)) +
            'm    and    ' +
            String(this.highscoreGoodies) +
            ' stars',
            WIDTH / 4,
            410
            );
    ctx.stroke();
};
        

// create canvas and append canvas to container on the page
canvas = document.createElement('canvas');
canvas.tabIndex = '1';
ctx = canvas.getContext('2d');
canvas.style.border = 'none';
container = document.getElementById('gameCanvasContainer');
container.appendChild(canvas);

// set globals
WIDTH = 1000;
HEIGHT = 768;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// saves state of currently pressed keys (formart: keyCode = Boolean)
var keyState = {};
var last_event = undefined;

/* *****************************************************************************
=================================== MAIN LOOP ==================================
***************************************************************************** */

var main = function () {
    var now = Date.now();
    var delta = (now - then) / 1000;

    if (game.running) {
        correctSpaceshipPosition();
        if (keyState[37]) game.spaceshipOffset -= 4 * game.speedBoost;
        if (keyState[39]) game.spaceshipOffset += 4 * game.speedBoost;

        game.update(delta);
        game.render();

        if (game.crash) {
            if (game.lifes <= 0) {
                game.isGameOver = true;
            }

            if (game.crashFramesCounter == 0) {
                game.spaceshipUsed = game.spaceshipHurt_img;
            }

            game.crashFramesCounter += 1;

            if (game.crashFramesCounter >= 300) {
                game.crashFramesCounter = 0;
                game.crash = false;
                game.spaceshipUsed = game.spaceship_img;
            }
        }
    }
    then = now;
    animationFrame(main);
};

/* *****************************************************************************
================================== MAIN SETUP ==================================
***************************************************************************** */

var then = Date.now();
var game = new Game(ctx, WIDTH, HEIGHT);

const animationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    null;

if (animationFrame !== null) {
    animationFrame(main, canvas);
}

/* *****************************************************************************
================================ EVENT HANDLING ================================
***************************************************************************** */

// returns position of touch press or mouse cursor
function getClickPosition(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    var x, y;

    if (
        e.type == 'touchstart' ||
        e.type == 'touchmove' ||
        e.type == 'touchend' ||
        e.type == 'touchcancel'
    ) {
        var touch = e.touches[0] || e.changedTouches[0];
        x = touch.pageX - rect.left;
        y = touch.pageY - rect.top;
    } else if (
        e.type == 'mousedown' ||
        e.type == 'mouseup' ||
        e.type == 'mousemove' ||
        e.type == 'mouseover' ||
        e.type == 'mouseout' ||
        e.type == 'mouseenter' ||
        e.type == 'mouseleave'
    ) {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }

    return { x, y };
}

// handle button click
function clickButton(e) {
    e.preventDefault();
    e.stopPropagation();

    const { x, y } = getClickPosition(canvas, e);

    if (
        (game.isInStartMenu) && (
            x < (WIDTH / 3) * 2 &&
            x > WIDTH / 3 &&
            y > (HEIGHT / 7) * 2 - 20 &&
            y < (HEIGHT / 7) * 2 - 20 + HEIGHT / 6 &&
            (game.isInStartMenu || game.isGameOver)
        ) || (
        (game.isGameOver) && (
            x < (WIDTH / 3) * 2 &&
            x > WIDTH / 3 &&
            y > (HEIGHT / 7) * 5 - 20 &&
            y < (HEIGHT / 7) * 5 - 20 + HEIGHT / 6 &&
            (game.isInStartMenu || game.isGameOver)
        )
        )
    ) {
        game.startNewGame();
    }
}

// move spaceship away from the edges if it goes over them
function correctSpaceshipPosition() {
    if (
        !game.inBounds(
            WIDTH / 2 - 10 + game.spaceshipOffset + 50,
            HEIGHT - 150
        ) ||
        !game.inBounds(WIDTH / 2 - 10 + game.spaceshipOffset - 50, HEIGHT - 150)
    ) {
        if (game.spaceshipOffset > 0) game.spaceshipOffset = WIDTH / 2 - 40;
        else game.spaceshipOffset = -WIDTH / 2 + 60;
    }

    if (last_event == undefined) {
        return;
    }

    var { x, _ } = getClickPosition(canvas, last_event);

    if (x > WIDTH / 2 + game.spaceshipOffset - 1) {
        keyState[37] = false;
        keyState[39] = true;
    } else if (x < WIDTH / 2 + game.spaceshipOffset + 1) {
        keyState[37] = true;
        keyState[39] = false;
    } else {
        keyState[37] = false;
        keyState[39] = false;
    }
}

function handleTouchControls(e) {
    e.preventDefault();
    last_event = e;

    if (game.isInStartMenu) {
        clickButton(e);
        return;
    }

    if (game.isGameOver && e.type != 'touchmove') {
        clickButton(e);
        return;
    }
};

// move offeset of spaceship if arrow keys are pressed or resets ship if edges
// are reached
canvas.addEventListener(
    'keydown',
    function (e) {
        keyState[e.keyCode || e.which] = true;
    },
    true
);

// same for touch controls
canvas.addEventListener(
    'touchstart',
    handleTouchControls,
    true
);

canvas.addEventListener(
    'touchmove',
    handleTouchControls,
    true
);

// reset key state to false if key is released
canvas.addEventListener(
    'keyup',
    function (e) {
        e.preventDefault();
        keyState[e.keyCode || e.which] = false;
    },
    true
);

// same for touch controls
canvas.addEventListener(
    'touchend',
    function (e) {
        last_event = undefined;
        keyState[37] = false;
        keyState[39] = false;
    },
    true
);

// checks if start game or restart game buttons are pressed
canvas.addEventListener('mouseup', clickButton, true);

// hover effects on buttons
canvas.addEventListener(
    'mousemove',
    function (e) {
        e.preventDefault();
        e.stopPropagation();

        const { x, y } = getClickPosition(canvas, e);

        if (
            (game.isInStartMenu) && (
                x < (WIDTH / 3) * 2 &&
                x > WIDTH / 3 &&
                y > (HEIGHT / 7) * 2 - 20 &&
                y < (HEIGHT / 7) * 2 - 20 + HEIGHT / 6 &&
                (game.isInStartMenu || game.isGameOver)
            ) || (
            (game.isGameOver) && (
                x < (WIDTH / 3) * 2 &&
                x > WIDTH / 3 &&
                y > (HEIGHT / 7) * 5 - 20 &&
                y < (HEIGHT / 7) * 5 - 20 + HEIGHT / 6 &&
                (game.isInStartMenu || game.isGameOver)
            )
            )
        ) {
            game.buttonColor = '#fa6498';
        } else {
            game.buttonColor = 'white';
        }
    },
    true
);
