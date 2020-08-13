import { Game } from './game.js';


var canvas = document.createElement("canvas");
canvas.tabIndex = '1';
var ctx = canvas.getContext("2d");
var container = document.getElementById("gameCanvasContainer");
container.appendChild(canvas);

const WIDTH = 1000, HEIGHT = 800;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const canvasOffsetX = (window.screen.availWidth - WIDTH) / 2;
const canvasOffsetY = 10;

var keyState = {};


/* *****************************************************************************
=================================== MAIN LOOP ==================================
***************************************************************************** */

var main = function() {
    var now = Date.now();
    var delta = (now - then) / 1000;
    // delta = Math.min(delta, 0.1);

    if(game.running) {

        if (keyState[37])
            game.DeltaX -= 4 * game.speedBoost;
        if (keyState[39])
            game.DeltaX += 4 * game.speedBoost;

        game.update(delta);
        game.render();

        if (game.crash) {
            if (game.lifes <= 0) {
                console.log('Game over');
                game.gameOver = true;
            }

            if (game.crashFramesCounter == 0) {
                game.spaceship_img.src = "img/spaceship_hurt.png";
            }

            game.crashFramesCounter += 1

            if (game.crashFramesCounter >= 300) {
                game.crashFramesCounter = 0;
                game.crash = false;
                game.spaceship_img.src = "img/spaceship.png";
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
    window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     || null;

if (animationFrame !== null) {
    animationFrame(main, canvas);
} 

/* *****************************************************************************
================================ EVENT HANDLING ================================
***************************************************************************** */

window.addEventListener('keydown', function(e) {
    if (!(game.inBounds(WIDTH / 2 - 10 + game.DeltaX + 50, HEIGHT - 150)) 
        || !(game.inBounds(WIDTH / 2 - 10 + game.DeltaX - 50, HEIGHT - 150))) {
        if (game.DeltaX > 0)
            game.DeltaX -= 12 * game.speedBoost;
        else
            game.DeltaX += 12 * game.speedBoost;
        return;
    }

    keyState[e.keyCode || e.which] = true;
}, true);

window.addEventListener('keyup', function(e) {
    keyState[e.keyCode || e.which] = false;
}, true);

window.addEventListener('mouseup', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX - canvasOffsetX;
    const y = e.clientY - canvasOffsetY;

    if ((x < WIDTH/3 * 2) && (x > WIDTH/3) && (y > HEIGHT/7 * 5 - 20) 
        && (y < HEIGHT/7 * 5 - 20 + HEIGHT/6)) {
            game.inStartMenu = false;
    }
}, true);

window.addEventListener('mousemove', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX - canvasOffsetX;
    const y = e.clientY - canvasOffsetY;

    if ((x < WIDTH/3 * 2) && (x > WIDTH/3) && (y > HEIGHT/7 * 5 - 20) 
        && (y < HEIGHT/7 * 5 - 20 + HEIGHT/6)) {
            game.buttonColor = "red";
    }
    else {
        game.buttonColor = "white";
    }
}, true)