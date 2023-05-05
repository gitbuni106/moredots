// Define the Dot class with the necessary methods for the Physics Worker
class Dot {
  constructor(x, y, mass, radius, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx || 0;
    this.vy = vy || 0;
    this.mass = mass;
    this.radius = radius;
  }

  static fromPlainObject(obj) {
    const dot = new Dot(obj.x, obj.y, obj.mass, obj.radius, obj.vx, obj.vy);
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

const G =0.0000000000667; // Gravitational constant

function calculateGravitationalForce(dot, centralObject) {
  const dx = centralObject.x - dot.x;
  const dy = centralObject.y - dot.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const force = (G * dot.mass * centralObject.mass) / (distance * distance);

  return {
    fx: (force * dx) / distance,
    fy: (force * dy) / distance,
  };
}

self.onmessage = (event) => {
  const dots = event.data.dots.map(Dot.fromPlainObject);
  const centralObject = event.data.centralObject;

  // Perform physics calculations and update the positions and velocities of the dots
  dots.forEach((dot, index) => {
    const centralForce = calculateGravitationalForce(dot, centralObject);
    let netForce = { fx: centralForce.fx, fy: centralForce.fy };

    dots.forEach((otherDot, otherIndex) => {
      if (index !== otherIndex) {
        const dotForce = calculateGravitationalForce(dot, otherDot);
        netForce.fx += dotForce.fx;
        netForce.fy += dotForce.fy;
      }
    });

    const dx = centralObject.x - dot.x;
    const dy = centralObject.y - dot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate the tangential velocity for elliptical motion
    const tangentialVelocity = Math.sqrt(G * centralObject.mass / distance);

    // Set the initial velocity components for each dot
    dot.vx = dot.vx || (-dy * tangentialVelocity / distance);
    dot.vy = dot.vy || (dx * tangentialVelocity / distance);

    // Update the dot's velocity and position
    dot.vx += netForce.fx / dot.mass;
    dot.vy += netForce.fy / dot.mass;
    dot.x += dot.vx;
    dot.y += dot.vy;
  });

for (let i = 0; i < dots.length; i++) {
  for (let j = i + 1; j < dots.length; j++) {
    handleCollision(dots[i], dots[j]);
  }
}

// Send the updated plain objects back to the main thread
self.postMessage({ dots: dots.map(dot => dot.toPlainObject()) });

// Add the handleCollision function
function handleCollision(dot1, dot2) {
  const dx = dot2.x - dot1.x;
  const dy = dot2.y - dot1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = dot1.radius + dot2.radius;

  if (distance < minDistance) {
    // Calculate the collision angle
    const collisionAngle = Math.atan2(dy, dx);

    // Calculate the velocity components in the rotated coordinate system
    const v1xRot = dot1.vx * Math.cos(collisionAngle) + dot1.vy * Math.sin(collisionAngle);
    const v1yRot = -dot1.vx * Math.sin(collisionAngle) + dot1.vy * Math.cos(collisionAngle);
    const v2xRot = dot2.vx * Math.cos(collisionAngle) + dot2.vy * Math.sin(collisionAngle);
    const v2yRot = -dot2.vx * Math.sin(collisionAngle) + dot2.vy * Math.cos(collisionAngle);

    // Calculate the final velocities in the rotated coordinate system
    const v1xRotFinal = ((dot1.mass - dot2.mass) * v1xRot + 2 * dot2.mass * v2xRot) / (dot1.mass + dot2.mass);
    const v2xRotFinal = (2 * dot1.mass * v1xRot - (dot1.mass - dot2.mass) * v2xRot) / (dot1.mass + dot2.mass);

    // Convert the final velocities back to the original coordinate system
    dot1.vx = v1xRotFinal * Math.cos(-collisionAngle) + v1yRot * Math.sin(-collisionAngle);
    dot1.vy = -v1xRotFinal * Math.sin(-collisionAngle) + v1yRot * Math.cos(-collisionAngle);
    dot2.vx = v2xRotFinal * Math.cos(-collisionAngle) + v2yRot * Math.sin(-collisionAngle);
    dot2.vy = -v2xRotFinal * Math.sin(-collisionAngle) + v2yRot * Math.cos(-collisionAngle);

    // Separate the dots to prevent overlap
    const overlap = minDistance - distance;
    const separationVector = {
      x: (overlap * dx) / distance,
      y: (overlap * dy) / distance,
    };

    dot1.x -= separationVector.x / 2;
    dot1.y -= separationVector.y / 2;
    dot2.x += separationVector.x / 2;
    dot2.y += separationVector.y / 2;
  }
}
}