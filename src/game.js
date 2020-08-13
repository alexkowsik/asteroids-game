/*================================================*/
/* Main Game Class */
/*================================================*/

var ctx, WIDTH, HEIGHT;
var CIRCLE_THRESHOLD = 1.12; // minimum radius for a circle to be visible using 
                             // the arc method


// static global function that gets a random integer between min and max
var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function Game(c, w, h) {
    ctx = c;
    WIDTH = w;
    HEIGHT = h;

    this.running = true;
    this.gameOver = false;
    this.FPS = 60; // for setInterval fallback only
    this.started = false;
    this.inStartMenu = false;
    this.buttonColor = "white";
    this.crash = false;
    this.crashFramesCounter = 0;
    this.lifes = 3;
    this.meters = 0;

    this.speedBoost = 1;  // gradually increasing over time
    this.speedGain = 1.0002 // factor with which the game gets faster every time

    this.bgLayers = [];
    this.numBgLayers = 12;
    this.baseStarNum = 16;
    this.baseStarRadius = 1.5;
    this.baseStarSpeed = {
        x: 0,
        y: 100
    };

    this.DeltaX = 0;  // offset to starting point of spaceship
    this.astronaut_img = new Image();
    this.astronaut_img.src = "img/astronaut.png";
    this.spaceship_img = new Image();
    this.spaceship_img.src = "img/spaceship.png";
    this.asteroids_img = [null, null, null].map(_ => new Image());

    this.lifes_img = [null, null, null, null].map(_ => new Image());
    this.lifes_img.forEach((element, index) => {
        element.src = "img/lifes_" + String(index) + ".png";
    });

    this.goodies = []
    this.goodieProb = 0.005;
    this.collected_goodies = 0;
    this.goodie_img = new Image();
    this.goodie_img.src = "img/goodie.png";

	this.asteroidsProb = 0.01;
	this.asteroids = [];
	this.asteroidSpeed = {
        x: 0,
        y: 250
    };
    this.asteroids_img.forEach((element, index) => {
        element.src = "img/asteroid" + String(index + 1) + ".png";
    });
};

/*
 * Initialize star field
 * stars divided into layers
 * layers have different speeds
 * stars in faster layers are larger
 */
Game.prototype.initBackground = function() {
    this.bgLayers = [];

    for (var i = this.numBgLayers; i > 0; --i) {
        var stars = [];

        for (var j = 0; j < this.baseStarNum * i; j++) {
            var star = {
                x: getRandomInt(0, WIDTH),
                y: getRandomInt(0, HEIGHT),
                radius: Math.round(this.baseStarRadius / i * 100) / 100,
                speed: {
                    x: Math.round(this.baseStarSpeed.x / i * 100) / 20,
                    y: Math.round(this.baseStarSpeed.y / i * 100) / 20 
                }
            };
            stars.push(star);
        }
        this.bgLayers.push(stars);
    }
};

Game.prototype.inBounds = function(x, y) {
    return ((x > 0 && x < WIDTH) && (y > 0 && y < HEIGHT));
};

Game.prototype.update = function(delta) {
    if (!this.started) {
        this.started = true;
        this.inStartMenu = true;
        this.initBackground();
        console.log("Game started");
    } 
    else if (this.inStartMenu || this.gameOver) {
        this.moveStars(delta);
    } 
    else {
        this.meters += 1/3;
        this.moveStars(delta);
        this.spawnAsteroidWithProb();
        this.spawnGoodieWithProb();
        this.moveAsteroids(delta);
        this.moveGoodies(delta);

        if (this.collisionTest()) {
            this.crash = true;
            this.crashFramesCounter = 0;
            this.speedBoost = 1.0
            this.lifes -= 1;
        }

        this.speedBoost *= this.speedGain
    }
};

Game.prototype.moveStars = function(delta) {
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

Game.prototype.spawnAsteroidWithProb = function() {
    if (Math.random() < this.asteroidsProb) {
        var asteroid = {
            x: getRandomInt(0, WIDTH),
            y: -50,
            speed: {
                x: this.asteroidSpeed.x,
                y: this.asteroidSpeed.y
            },
            scale: Math.random() * (1.25 - 0.75) + 0.75,
            type: Math.floor(Math.random() * 3) + 1  		
        }
        this.asteroids.push(asteroid);		
    }
};

Game.prototype.spawnGoodieWithProb = function() {
    if (Math.random() < this.goodieProb) {
        var goodie = {
            x: getRandomInt(0, WIDTH),
            y: -50,
            speed: {
                x: this.asteroidSpeed.x,
                y: this.asteroidSpeed.y
            }		
        }
        this.goodies.push(goodie);
    }
};

Game.prototype.moveAsteroids = function(delta) {
    for (var i = 0; i < this.asteroids.length; i++) {
        var asteroid = this.asteroids[i];

        if(this.inBounds(asteroid.x, asteroid.y)) {
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

Game.prototype.moveGoodies = function(delta) {
    for (var i = 0; i < this.goodies.length; i++) {
        var goodie = this.goodies[i];

        if(this.inBounds(goodie.x, goodie.y)) {
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

Game.prototype.collisionTest = function() {
    var flag = false;

    // Check for collison with asteroids
    this.asteroids.forEach((asteroid, index) => {
        // x/y cordinates of upper left corner of the spaceship
        var x = WIDTH / 2 - 60 + this.DeltaX; 
        var y = HEIGHT - 200;

        x += 25 // tolerance area
        y += 30

        if ((x > asteroid.x)
            && ((asteroid.x + 90 * asteroid.scale) > x)) {
                if (((asteroid.y + 90 * asteroid.scale) > y)
                    && ((asteroid.y + 90 * asteroid.scale) < y + 140)) {
                    this.asteroids.splice(index, 1);
                    flag = true;
                }
        }

        else if (((x + 60) < (asteroid.x + 90 * asteroid.scale))
            && ((asteroid.x) < (x  + 60))) {
                if (((asteroid.y + 90 * asteroid.scale) > y) 
                    && ((asteroid.y + 90 * asteroid.scale) < y + 140)) {
                    this.asteroids.splice(index, 1);
                    flag = true;
                }
        }
    });

    // Check for collison with goodies
    this.goodies.forEach((goodie, index) => {
        // x/y cordinates of upper left corner of the spaceship
        var x = WIDTH / 2 - 60 + this.DeltaX; 
        var y = HEIGHT - 200;

        if ((x > goodie.x)
            && ((goodie.x + 90) > x)) {
                if (((goodie.y + 90) > y)
                    && ((goodie.y + 90) < y + 160)) {
                    this.goodies.splice(index, 1);
                    this.collected_goodies += 1
                }
        }

        else if (((x + 105) < (goodie.x + 90))
            && (goodie.x < (x + 105))) {
                if (((goodie.y + 90) > y) 
                    && ((goodie.y + 90) < y + 160)) {
                    this.goodies.splice(index, 1);
                    this.collected_goodies += 1
                }
        }

        // goodie has a smaller width, so this edge case has to be checked
        // (goodie is right in front of spaceship)
        else if (((x + 105) > (goodie.x + 90))
            && (goodie.x > x)) {
                if (((goodie.y + 90) > y) 
                    && ((goodie.y + 90) < y + 160)) {
                    this.goodies.splice(index, 1);
                    this.collected_goodies += 1
                }
        }
    });
    return flag;
};

Game.prototype.render = function() {
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#FFF";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#FFF";

    this.drawStars();

    if (this.inStartMenu) {
        this.drawStartMenu();
    }
    else if (this.gameOver) {
        this.drawGameOverScreen();
    }
    else {
        this.drawAsteroids();
        this.drawGoodies();
        this.drawSpaceship();
        this.drawHUD();
    }
};

Game.prototype.drawStartMenu = function() {
    ctx.beginPath();

    // Start Game button
    ctx.lineWidth = "4";
    ctx.strokeStyle = this.buttonColor;
    ctx.rect(WIDTH/3, HEIGHT/7 * 5 - 20, WIDTH/3, HEIGHT/6);
    ctx.stroke();

    ctx.font = "42px Arial";
    ctx.fillStyle = this.buttonColor;
    ctx.fillText("START GAME", WIDTH/3 + 25, HEIGHT/7 * 5.55);

    ctx.drawImage(this.astronaut_img, WIDTH/3, HEIGHT/7, WIDTH/3, WIDTH/3);
};

Game.prototype.drawStars = function() {
    for (var i = 0; i < this.bgLayers.length; i++) {
        for (var j = 0; j < this.bgLayers[ i ].length; j++) {
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

Game.prototype.drawAsteroids = function() {
    for (var i = 0; i < this.asteroids.length; i++) {
        var asteroid = this.asteroids[i];

        ctx.drawImage(this.asteroids_img[asteroid.type - 1], 
                      asteroid.x, asteroid.y, 
                      90 * asteroid.scale, 90 * asteroid.scale);
    }
};

Game.prototype.drawGoodies = function() {
    for (var i = 0; i < this.goodies.length; i++) {
        var goodie = this.goodies[i];
        ctx.drawImage(this.goodie_img, goodie.x, goodie.y, 90, 90);
    }
};

Game.prototype.drawSpaceship = function() {
  ctx.drawImage(this.spaceship_img, 
                WIDTH / 2 - 60 + this.DeltaX, 
                HEIGHT - 200, 105, 153);
};

Game.prototype.drawHUD = function() {
    ctx.drawImage(this.lifes_img[this.lifes], 
        40, 40, 150, 50);
    ctx.font = "40px Arial";
    ctx.fillText(Math.floor(this.meters).toString() + "m", 
                 WIDTH - 180, 75);
    ctx.fillText(this.collected_goodies, WIDTH / 2 - 40, 79);
    ctx.drawImage(this.goodie_img,
                  WIDTH / 2, 34, 60, 60);
}
 
Game.prototype.moveSpaceship = function(e) {
	e.preventDefault();	

    if (!(this.inBounds(WIDTH / 2 - 10 + this.DeltaX + 50, 
                        HEIGHT - 150)) ||
        !(this.inBounds(WIDTH / 2 - 10 + this.DeltaX - 50, 
                        HEIGHT - 150))) {
		if (this.DeltaX > 0) {
			this.DeltaX -= 10 * this.speedBoost;
		} else {
			this.DeltaX += 10 * this.speedBoost;
		}
		return;
	}

    switch(e.keyCode) {
        case 37:
            this.DeltaX -= 10 * this.speedBoost;
            break;
        case 39:
            this.DeltaX += 10 * this.speedBoost;
            break;
    }
};
