import { Game } from './game.js';

// create canvas and append canvas to container on the page
var canvas = document.createElement('canvas');
canvas.tabIndex = '1';
var ctx = canvas.getContext('2d');
var container = document.getElementById('gameCanvasContainer');
container.appendChild(canvas);

// set globals
const WIDTH = 1000,
    HEIGHT = 800;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// gets canvas offset with respect to its position on the browser window
const canvasOffsetX = (window.screen.availWidth - WIDTH) / 2;
const canvasOffsetY = 10;

// saves state of currently pressed keys (formart: keyCode = Boolean)
var keyState = {};

/* *****************************************************************************
=================================== MAIN LOOP ==================================
***************************************************************************** */

var main = function () {
    var now = Date.now();
    var delta = (now - then) / 1000;

    if (game.running) {
        if (keyState[37]) game.spaceshipOffset -= 4 * game.speedBoost;
        if (keyState[39]) game.spaceshipOffset += 4 * game.speedBoost;

        game.update(delta);
        game.render();

        if (game.crash) {
            if (game.lifes <= 0) {
                game.isGameOver = true;
            }

            if (game.crashFramesCounter == 0) {
                game.spaceship_img.src = 'img/spaceship_hurt.png';
            }

            game.crashFramesCounter += 1;

            if (game.crashFramesCounter >= 300) {
                game.crashFramesCounter = 0;
                game.crash = false;
                game.spaceship_img.src = 'img/spaceship.png';
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

// move offeset of spaceship if arrow keys are pressed or resets ship if edges
// are reached
window.addEventListener(
    'keydown',
    function (e) {
        if (
            !game.inBounds(
                WIDTH / 2 - 10 + game.spaceshipOffset + 50,
                HEIGHT - 150
            ) ||
            !game.inBounds(
                WIDTH / 2 - 10 + game.spaceshipOffset - 50,
                HEIGHT - 150
            )
        ) {
            if (game.spaceshipOffset > 0)
                game.spaceshipOffset -= 12 * game.speedBoost;
            else game.spaceshipOffset += 12 * game.speedBoost;
            return;
        }
        keyState[e.keyCode || e.which] = true;
    },
    true
);

// reset key state to false if key is released
window.addEventListener(
    'keyup',
    function (e) {
        keyState[e.keyCode || e.which] = false;
    },
    true
);

// checks if start game or restart game buttons are pressed
window.addEventListener(
    'mouseup',
    function (e) {
        e.preventDefault();
        e.stopPropagation();

        const x = e.clientX - canvasOffsetX;
        const y = e.clientY - canvasOffsetY;

        if (
            x < (WIDTH / 3) * 2 &&
            x > WIDTH / 3 &&
            y > (HEIGHT / 7) * 5 - 20 &&
            y < (HEIGHT / 7) * 5 - 20 + HEIGHT / 6 &&
            (game.isInStartMenu || game.isGameOver)
        ) {
            game.startNewGame();
        }
    },
    true
);

// hover effects on buttons
window.addEventListener(
    'mousemove',
    function (e) {
        e.preventDefault();
        e.stopPropagation();

        const x = e.clientX - canvasOffsetX;
        const y = e.clientY - canvasOffsetY;

        if (
            x < (WIDTH / 3) * 2 &&
            x > WIDTH / 3 &&
            y > (HEIGHT / 7) * 5 - 20 &&
            y < (HEIGHT / 7) * 5 - 20 + HEIGHT / 6
        ) {
            game.buttonColor = 'red';
        } else {
            game.buttonColor = 'white';
        }
    },
    true
);
