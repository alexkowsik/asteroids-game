import { Game } from './game.js';

// create canvas and append canvas to container on the page
var canvas = document.createElement('canvas');
canvas.tabIndex = '1';
var ctx = canvas.getContext('2d');
var container = document.getElementById('gameCanvasContainer');
container.appendChild(canvas);

// set globals
const WIDTH = 1000,
    HEIGHT = 768;
canvas.width = WIDTH;
canvas.height = HEIGHT;

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
        x < (WIDTH / 3) * 2 &&
        x > WIDTH / 3 &&
        y > (HEIGHT / 7) * 5 - 20 &&
        y < (HEIGHT / 7) * 5 - 20 + HEIGHT / 6 &&
        (game.isInStartMenu || game.isGameOver)
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
        if (game.spaceshipOffset > 0)
            game.spaceshipOffset -= 12 * game.speedBoost;
        else game.spaceshipOffset += 12 * game.speedBoost;
        return;
    }
}

// move offeset of spaceship if arrow keys are pressed or resets ship if edges
// are reached
canvas.addEventListener(
    'keydown',
    function (e) {
        correctSpaceshipPosition();
        keyState[e.keyCode || e.which] = true;
    },
    true
);

// same for touch controls
canvas.addEventListener(
    'touchstart',
    function (e) {
        e.preventDefault();
        correctSpaceshipPosition();

        if (game.isInStartMenu) {
            clickButton(e);
            return;
        }

        if (game.isGameOver) {
            clickButton(e);
            return;
        }

        var { x, y } = getClickPosition(canvas, e);

        if (x > WIDTH / 2) {
            keyState[39] = true;
        } else {
            keyState[37] = true;
        }
    },
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
