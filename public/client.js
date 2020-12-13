touchServer = false;
p5.disableFriendlyErrors = true;

$(document).ready(() => {
  if (!hasTouch()) {
    col = 60;
    notification.fadeIn();
    notification.css("display", "flex");
  } else {
    col = 225;
    statusWrapper.fadeIn();
  }
});
$(window).on("resize", () => {
  setBorder();
});
socket.on("connect", () => {
  myID = socket.id;
  console.log("1. my id: " + socket.id);
  // disconnect if not on mobile
  if (!hasTouch()) socket.disconnect();
});
socket.on("clients", (clients) => {
  userCount = clients.length;
  myIndex = clients.indexOf(myID);
  targetID = myIndex % 2 == 0 ? clients[myIndex + 1] : clients[myIndex - 1];
  targetID
    ? status.html("You're connected.")
    : status.html("Waiting for a friend...");
  // console.log("2. target: " + targetID);
});
socket.on("pos", (pos) => {
  serverAttractor.update(pos.x, pos.y);
  touchServer = true;
});
function setup() {
  canvas = createCanvas(container.offsetWidth, container.offsetHeight);
  canvas.parent("canvas-wrapper");
  // mouse clientAttractor
  clientAttractor = new Attractor(width / 2, height / 2, 60, 255);
  serverAttractor = new Attractor(width / 2, height / 2, 60, 100);
  // border repellers
  setBorder();
  // particles
  for (var i = 0; i < 800; i++) {
    particles.push(new Particle(width / 2, height / 2, col));
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
    // overlap event
    if (overlap()) {
      particles[i].color = random(30, 225);
      factorServer = 1.5;
      factorClient = 1.5;
    } else {
      particles[i].color = col;
      factorServer = 3;
      factorClient = 3;
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
  }
  // server attractor events
  if (touchServer) {
    factorServer = 2;
    serverAttractor.show();
  } else {
    factorServer = 0;
  }
  // server inactivity
  touchServer = false;
}
function overlap() {
  distance = clientAttractor.pos.dist(serverAttractor.pos);
  return distance < clientAttractor.width && mouseIsPressed && touchServer;
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
function hasTouch() {
  let hasTouchScreen = false;
  if ("maxTouchPoints" in navigator) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
  } else if ("msMaxTouchPoints" in navigator) {
    hasTouchScreen = navigator.msMaxTouchPoints > 0;
  } else {
    var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
    if (mQ && mQ.media === "(pointer:coarse)") {
      hasTouchScreen = !!mQ.matches;
      // Fallback
    } else if ("orientation" in window) {
      hasTouchScreen = true;
    } else {
      // Agent Sniffing Fallback
      var UA = navigator.userAgent;
      hasTouchScreen =
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}
