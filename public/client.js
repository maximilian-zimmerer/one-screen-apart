const socket = io();
touchServer = false;
const status = $(".status");

socket.on("connect", () => {
  myID = socket.id;
  console.log("1. my id: " + socket.id);
});
socket.on("clients", (clients) => {
  userCount = clients.length;
  myIndex = clients.indexOf(myID);
  targetID = myIndex % 2 == 0 ? clients[myIndex + 1] : clients[myIndex - 1];
  targetID
    ? status.html("You're connected.")
    : status.html("Waiting for a friend...");
  // console.log("2. clients: " + clients);
  // console.log("3. target: " + targetID);
});
socket.on("pos", (pos) => {
  serverAttractor.update(pos.x, pos.y);
  touchServer = true;
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  // mouse clientAttractor
  clientAttractor = new Attractor(width / 2, height / 2, 30, 255);
  serverAttractor = new Attractor(width / 2, height / 2, 30, 100);
  // border repellers
  let topLeft = createVector(0, 0);
  let topRight = createVector(windowWidth, 0);
  let bottomLeft = createVector(0, windowHeight);
  let topMiddle = createVector(windowWidth / 2, 0);
  let middleLeft = createVector(0, windowHeight / 2);
  let bottomRight = createVector(windowWidth, windowHeight);
  let middleRight = createVector(windowWidth, windowHeight / 2);
  let bottomMiddle = createVector(windowWidth / 2, windowHeight);
  repellers = [
    topLeft,
    topRight,
    bottomLeft,
    topMiddle,
    middleLeft,
    bottomRight,
    middleRight,
    bottomMiddle,
  ];
  // particles
  for (var i = 0; i < 500; i++) {
    particles.push(new Particle(width / 2, height / 2));
  }
}
function draw() {
  background(color("#1e1e1e"));
  // particles
  for (var i = 0; i < particles.length; i++) {
    // client attractor
    if (mouseIsPressed) {
      particles[i].magnetise(clientAttractor.pos, overlap(), factorClient);
    }
    // server attractor
    if (targetID && touchServer) {
      particles[i].magnetise(serverAttractor.pos, overlap(), factorServer);
    } else {
      serverAttractor.update(width / 2, height / 2);
    }
    // repel from repellers
    for (var j = 0; j < repellers.length; j++) {
      particles[i].magnetise(repellers[j], true, 1);
    }
    particles[i].update();
    particles[i].show();
  }
  // client attractor events
  if (mouseIsPressed) {
    factorClient = 2;
    clientAttractor.update(mouseX, mouseY);
    clientAttractor.show();
    if (targetID) clientAttractor.send();
  } else {
    factorClient = 0;
    clientAttractor.update(width / 2, height / 2);
  }
  // server attractor events
  if (targetID && touchServer) {
    factorServer = 2;
    serverAttractor.show();
  } else {
    factorServer = 0;
  }
  // global events
  if (targetID && mouseIsPressed && touchServer) {
    distance = clientAttractor.pos.dist(serverAttractor.pos);
  }
  // server inactivity
  touchServer = false;
}
function overlap() {
  return distance < 50 && mouseIsPressed && touchServer;
}
function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}
