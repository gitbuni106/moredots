window.onload = init;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
class Dot {
  constructor(x, y, mass, radius) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.mass = mass;
    this.radius = radius;
  }

  static fromPlainObject(obj) {
    const dot = new Dot(obj.x, obj.y, obj.mass, obj.radius);
    dot.vx = obj.vx;
    dot.vy = obj.vy;
    return dot;
  }

  toPlainObject() {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      mass: this.mass,
      radius: this.radius,
    };
  }
}

class CentralObject {
  constructor(x, y, mass, radius) {
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.radius = radius;
  }

  toPlainObject() {
    return {
      x: this.x,
      y: this.y,
      mass: this.mass,
      radius: this.radius,
    };
  }
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio;
  const rect = canvas.getBoundingClientRect();

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  ctx.scale(dpr, dpr);

  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
}


const numDots = 10000;
const dots = [];
const exitButton = document.getElementById('stop-button');

function init() {

  // Fetch the JSON data for the dots
  fetch('dots-data.json')
    .then((response) => response.json())
    .then((dotsData) => {
      // Initialize the dots based on the JSON data
      dotsData.forEach((dotData) => {
        const dot = new Dot(dotData.x, dotData.y, dotData.mass, dotData.radius);
        dots.push(dot);
      });
      // Start the game loop after the dots have been initialized



      let GameLoopId;

      gameLoopId = requestAnimationFrame(gameLoop);

    });
}

// the sun is 1.989x10^30kg or 1989000000000000000000000000000
const centralObject = new CentralObject(canvas.width / 2, canvas.height / 2, 190000000000000, 50);

function drawDots() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dots.forEach((dot) => {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#696969';
    ctx.fill();
    ctx.closePath();
  });

  ctx.beginPath();
  ctx.arc(centralObject.x, centralObject.y, centralObject.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'red';
  ctx.fill();
  ctx.closePath();
}

const physicsWorker = new Worker('physics-worker.js');

physicsWorker.onmessage = (event) => {
  const updatedDots = event.data.dots.map(Dot.fromPlainObject);
  dots.length = 0;
  dots.push(...updatedDots);
};

function gameLoop() {
  // Send the current state of the dots and the central object to the Physics Worker
  physicsWorker.postMessage({
    dots: dots.map(dot => dot.toPlainObject()),
    centralObject: centralObject.toPlainObject(),
  });

  // Remove dots that are too far away (5000^2)
  const maxDistance = 7500; // You can adjust this value to your liking
  const remainingDots = dots.filter(dot => !isDotTooFarAway(dot, centralObject, maxDistance));

  // Replace the current dots array with the remaining dots
  dots.length = 0;
  dots.push(...remainingDots);

  drawDots();
  requestAnimationFrame(gameLoop);
}

const exitButtonClickListener = () => {
  cancelAnimationFrame(gameLoopId);
  physicsWorker.terminate();

  // Remove event listener and elements
  exitButton.removeEventListener('click', exitButtonClickListener);
  canvas.remove();
  exitButton.remove();
};

exitButton.addEventListener('click', exitButtonClickListener);