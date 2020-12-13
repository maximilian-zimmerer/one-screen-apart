const socket = io();
touchServer = false;
const status = $(".status");
const container = document.getElementById("canvas-wrapper");

$(window).on("resize", () => {
  setBorder();
});
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
  canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent("canvas-wrapper");
  // mouse clientAttractor
  clientAttractor = new Attractor(width / 2, height / 2, 30, 255);
  serverAttractor = new Attractor(width / 2, height / 2, 30, 100);
  // border repellers
  setBorder();
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
    if (mouseIsPressed)
      particles[i].magnetise(clientAttractor.pos, overlap(), factorClient);
    // server attractor
    if (touchServer)
      particles[i].magnetise(serverAttractor.pos, overlap(), factorServer);
    // repel from repellers
    for (var j = 0; j < repellers.length; j++) {
      particles[i].magnetise(repellers[j], true, 1);
    }
    overlap()
      ? (particles[i].color = random(100, 225))
      : (particles[i].color = 225);
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
  if (touchServer) {
    factorServer = 2;
    serverAttractor.show();
  } else {
    factorServer = 0;
  }
  // global events
  if (mouseIsPressed && touchServer) {
    distance = clientAttractor.pos.dist(serverAttractor.pos);
  }
  // server inactivity
  touchServer = false;
}
function overlap() {
  return distance < 50 && mouseIsPressed && touchServer;
}
function setBorder() {
  topLeft = createVector(0, 0);
  topRight = createVector(container.offsetWidth, 0);
  bottomLeft = createVector(0, container.offsetHeight);
  topMiddle = createVector(container.offsetWidth / 2, 0);
  middleLeft = createVector(0, container.offsetHeight / 2);
  bottomRight = createVector(container.offsetWidth, container.offsetHeight);
  middleRight = createVector(container.offsetWidth, container.offsetHeight / 2);
  bottomMiddle = createVector(
    container.offsetWidth / 2,
    container.offsetHeight
  );
  repellers = [
    topLeft,
    topRight,
    topMiddle,
    middleLeft,
    middleRight,
    bottomLeft,
    bottomRight,
    bottomMiddle,
  ];
  resizeCanvas(container.offsetWidth, container.offsetHeight);
}
