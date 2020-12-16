let col,
  myID,
  canvas,
  sender,
  padding,
  myIndex,
  targetID,
  distance,
  repellers,
  myLocation,
  touchServer,
  maxDistance,
  canvasCenter,
  particlesMin,
  particlesMax;

let topLeft,
  topRight,
  topMiddle,
  middleLeft,
  bottomLeft,
  bottomRight,
  middleRight,
  bottomMiddle;

let particles = [];
let clientAttractor, serverAttractor;
let factorClient, factorServer, factorBounds;

const socket = io();
const status = $(".status");
const loader = $(".loader");
const counter = $(".distance");
const statusWrapper = $(".status-wrapper");
const notification = $(".notification-wrapper");

class Particle {
  constructor(x, y, color) {
    this.color = color;
    this.pos = createVector(x, y);
    this.prev = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.setMag(random(2, 5));
    this.acc = createVector();
    this.g = 10;
  }
  show() {
    strokeWeight(3);
    strokeCap(ROUND);
    stroke(this.color, this.color, this.color);
    line(this.pos.x, this.pos.y, this.prev.x, this.prev.y);
    this.prev.x = this.pos.x;
    this.prev.y = this.pos.y;
  }
  update() {
    this.vel.add(this.acc);
    this.vel.limit(5);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
  magnetise(target, bool, f) {
    let force = p5.Vector.sub(target, this.pos);
    let d = force.magSq();
    d = constrain(d, 60, 150);
    let strength = this.g / d;
    force.setMag(strength);
    bool ? force.mult(f) : force.mult(-f);
    if (d < 60) force.mult(-60);
    this.acc.add(force);
  }
  mapColor(vector, maxDistance) {
    let distance = this.pos.dist(vector);
    let mappedColor = map(distance, maxDistance / 2, 0, 30, 225, true);
    this.color = mappedColor;
  }
}
class Attractor {
  constructor(x, y, w, color) {
    this.pos = createVector(x, y);
    this.color = color;
    this.width = w;
  }
  show() {
    // ellipse
    push();
    noFill();
    strokeWeight(1);
    stroke(this.color);
    ellipse(this.pos.x, this.pos.y, this.width);
    pop();
    // point
    push();
    strokeWeight(3);
    stroke(this.color);
    point(this.pos.x, this.pos.y);
    pop();
  }
  update(x, y) {
    this.pos.x = x;
    this.pos.y = y;
  }
  send() {
    socket.emit("pos", {
      target: targetID,
      pos: { x: this.pos.x, y: this.pos.y },
    });
  }
}
