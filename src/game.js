/* *****************************************************************************
================================ MAIN GAME CLASS ===============================
***************************************************************************** */

// globals for canvas context and the width and height of the canvas
var ctx, WIDTH, HEIGHT;
// minimum radius for a circle to be visible using the arc method
var CIRCLE_THRESHOLD = 1.12;

// static global function that gets a random integer between min and max
var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function Game(c, w, h) {
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
    this.astronaut_img.src = 'img/astronaut.png';

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
        console.log(index, element.src);
    });
    console.log(this.asteroids_img);

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
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#FFF';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeRect(0, 0, WIDTH, HEIGHT);
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
};

// draw astronaut picture and start button
Game.prototype.drawStartMenu = function () {
    ctx.beginPath();

    // Start Game button
    ctx.lineWidth = '4';
    ctx.strokeStyle = this.buttonColor;
    ctx.rect(WIDTH / 3, (HEIGHT / 7) * 5 - 20, WIDTH / 3, HEIGHT / 6);
    ctx.stroke();

    ctx.font = '42px Monaco';
    ctx.fillStyle = this.buttonColor;
    ctx.fillText('START GAME', WIDTH / 3 + 32, (HEIGHT / 7) * 5.55);

    ctx.drawImage(
        this.astronaut_img,
        WIDTH / 3,
        HEIGHT / 7,
        WIDTH / 3,
        WIDTH / 3
    );
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
                ctx.fillRect(star.x, star.y, pixelSize, pixelSize);
            }
        }
    }
};

// draw asteroids
Game.prototype.drawAsteroids = function () {
    for (var i = 0; i < this.asteroids.length; i++) {
        var asteroid = this.asteroids[i];

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
    for (var i = 0; i < this.goodies.length; i++) {
        var goodie = this.goodies[i];
        ctx.drawImage(this.goodie_img, goodie.x, goodie.y, 75, 75);
    }
};

// draw spaceship with current offset
Game.prototype.drawSpaceship = function () {
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
    ctx.drawImage(this.lifes_img[this.lifes], 40, 40, 150, 50);
    ctx.font = '40px Monaco';
    ctx.fillText(Math.floor(this.meters).toString() + 'm', WIDTH - 180, 75);
    ctx.fillText(this.numOfGoodies, WIDTH / 2 - 40, 79);
    ctx.drawImage(this.goodie_img, WIDTH / 2, 34, 60, 60);
};

// draw game over message, current score, highscore and restart button
Game.prototype.drawGameOverScreen = function () {
    ctx.beginPath();

    // Start Game button
    ctx.lineWidth = '4';
    ctx.strokeStyle = this.buttonColor;
    ctx.rect(WIDTH / 3, (HEIGHT / 7) * 5 - 20, WIDTH / 3, HEIGHT / 6);
    ctx.stroke();

    ctx.font = '42px Monaco';
    ctx.fillStyle = this.buttonColor;
    ctx.fillText('     RESTART  ', WIDTH / 3 + 25, (HEIGHT / 7) * 5.55);

    ctx.font = '80px Monaco';
    ctx.fillStyle = 'white';
    ctx.fillText('GAME OVER', WIDTH / 3 - 60, 180);

    ctx.font = '30px Monaco';
    ctx.fillText(
        'Your Score:     ' +
            String(parseInt(this.meters)) +
            'm    and    ' +
            String(this.numOfGoodies) +
            ' stars',
        WIDTH / 4,
        340
    );

    ctx.font = '30px Monaco';
    ctx.fillText(
        'Highscore :     ' +
            String(parseInt(this.highscoreMeters)) +
            'm    and    ' +
            String(this.highscoreGoodies) +
            ' stars',
        WIDTH / 4,
        410
    );
};
