var canvas = document.createElement("canvas", tabindex='1'),
    ctx = canvas.getContext("2d"),
    container = document.getElementById("gameCanvasContainer");

var DEFAULT_WIDTH = 1000, DEFAULT_HEIGHT = 800;
var CIRCLE_THRESHOLD = 1.12; // minimum radius for a circle to be visible using 
                             // the arc method

canvas.width = DEFAULT_WIDTH;
canvas.height = DEFAULT_HEIGHT;
container.appendChild(canvas);

// static global function that gets a random integer between min and max
var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/*==============================*/
/* Main Loop
/*==============================*/
var main = function() {
    var now = Date.now();
    var delta = (now - then) / 1000;
    // delta = Math.min(delta, 0.1);

    if(game.running) {
        game.update(delta);
        game.render();
    }

    then = now;
    animationFrame(main);
};

var then = Date.now();
var game = new Game();

var animationFrame = 
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     || null;

if(animationFrame !== null) {
    animationFrame(main, canvas);
} 


/*================================================*/
/* Main Game Class */
/*================================================*/

function Game() {
    this.running = true;
    this.FPS = 60; // for setInterval fallback only
    this.started = false;
    this.bgLayers = [];
    this.numBgLayers = 12;
    this.baseStarNum = 16;
    this.baseStarRadius = 1.5;
    this.baseStarSpeed = {
        x: 0,
        y: 100
    };
    this.speedBoost = 1;  // gradually increasing over time
    this.speedGain = 1.0002 // factor with which the game gets faster every time
	this.DeltaX = 0;  // offset to starting point of spaceship
	this.asteroidsProb = 0.01;
	this.asteroids = [];
	this.asteroidSpeed = {
        x: 0,
        y: 250
    };
    this.spaceship_img = new Image();
    this.spaceship_img.src = "spaceship.png";
    this.asteroids_img = [null, null, null].map(_ => new Image());
    this.asteroids_img.forEach((element, index) => {
        element.src = "asteroid" + String(index + 1) + ".png";
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
                x: getRandomInt(0, canvas.width),
                y: getRandomInt(0, canvas.height),
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
    return ((x > 0 && x < canvas.width) && (y > 0 && y < canvas.height));
};

Game.prototype.update = function(delta) {
    if (!this.started) {
        this.started = true;
        this.initBackground();
        console.log("Game started");
    } else {
        this.moveStars(delta);
		this.spawnAsteroidsWithProb();
        this.moveAsteroids(delta);
        this.collisionTest();

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
                star.x = getRandomInt(0, canvas.width);
                star.y = 1;
            }
        }
    }
};

Game.prototype.spawnAsteroidsWithProb = function() {
    if (Math.random() < this.asteroidsProb) {
        var asteroid = {
            x: getRandomInt(0, canvas.width),
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

Game.prototype.collisionTest = function() {
    this.asteroids.forEach((asteroid, index) => {
        // x/y cordinates of upper left corner of the spaceship
        x = DEFAULT_WIDTH / 2 - 60 + this.DeltaX; 
        y = DEFAULT_HEIGHT - 200;

        x += 20 // tolerance area
        y += 30

        if ((x > asteroid.x)
            && ((asteroid.x + 90 * asteroid.scale) > x)) {
                if ((asteroid.y + 90 * asteroid.scale) > y) {
                    this.asteroids.splice(index, 1);
                    return true
                }
        }

        if (((x + 65) < (asteroid.x + 90 * asteroid.scale))
            && ((asteroid.x) < (x  + 65))) {
                if ((asteroid.y + 90 * asteroid.scale) > y) {
                    this.asteroids.splice(index, 1);
                    return true
                }
        }
    });
}

Game.prototype.render = function() {
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFF";

    this.drawStars();
	this.drawAsteroids();
	this.drawSpaceship();
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

Game.prototype.drawSpaceship = function() {
  ctx.drawImage(this.spaceship_img, 
                DEFAULT_WIDTH / 2 - 60 + this.DeltaX, 
                DEFAULT_HEIGHT - 200, 105, 153);
};
 
Game.prototype.moveSpaceship = function(e) {
	e.preventDefault();	

    if (!(this.inBounds(DEFAULT_WIDTH / 2 - 10 + this.DeltaX + 50, 
                        DEFAULT_HEIGHT - 150)) ||
        !(this.inBounds(DEFAULT_WIDTH / 2 - 10 + this.DeltaX - 50, 
                        DEFAULT_HEIGHT - 150))) {
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

document.onkeydown = game.moveSpaceship.bind(game);
