factorBounds = 1;
lastLocation = 0.1;
particlesMax = 1500;
touchServer = false;
p5.disableFriendlyErrors = true;

$(document).ready(() => {
  if (!hasTouch()) {
    col = 60;
    particlesMin = 500;
    notification.fadeIn();
    notification.css("display", "flex");
  } else {
    col = 128;
    particlesMin = 100;
    statusWrapper.fadeIn();
    statusWrapper.css("display", "flex");
    getLocation();
  }
});
$(window).on("resize", () => {
  setBorder();
});
socket.on("connect", () => {
  myID = socket.id;
  if (!hasTouch()) socket.disconnect();
});
socket.on("clients", (clients) => {
  userCount = clients.length;
  myIndex = clients.indexOf(myID);
  targetID = myIndex % 2 == 0 ? clients[myIndex + 1] : clients[myIndex - 1];
  // if (userCount < 2) counter.fadeOut();
  sendLocation();
  toggleStatus();
  toggleCounter();
});
socket.on("pos", (pos) => {
  serverAttractor.update(pos.x, pos.y);
  touchServer = true;
});
socket.on("loc", (loc) => {
  if (loc != lastLocation) {
    lastLocation = loc;
    distance =
      getDistance(myLocation.lat, myLocation.lon, loc.lat, loc.lon) + 0.1;
  }
  counter.html(Math.round(distance) + "km");
  toggleCounter();
});
function setup() {
  canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.parent("canvas-wrapper");
  // mouse clientAttractor
  clientAttractor = new Attractor(width / 2, height / 2, 60, 255);
  serverAttractor = new Attractor(width / 2, height / 2, 60, 100);
  // border repellers
  setBorder();
  // particles
  for (var i = 0; i < particlesMin; i++) {
    particles.push(new Particle(width / 2, height / 2, col));
  }
}
function draw() {
  background(color("#1e1e1e"));
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
  // particle objects
  for (var i = 0; i < particles.length; i++) {
    // client attractor
    if (mouseIsPressed)
      particles[i].magnetise(clientAttractor.pos, overlap(), factorClient);
    // server attractor
    if (touchServer)
      particles[i].magnetise(serverAttractor.pos, overlap(), factorServer);
    // repel from repellers
    for (var j = 0; j < repellers.length; j++) {
      particles[i].magnetise(repellers[j], true, factorBounds);
    }
    // overlap event
    if (overlap()) {
      // change color
      particles[i].color = 255;
      factorBounds = 0.5;
    } else {
      particles[i].color = col;
      factorBounds = 1;
    }
    particles[i].update();
    particles[i].show();
  }
  // add new particles
  if (overlap() && particles.length < particlesMax) {
    particles.push(new Particle(random(width), random(height), col));
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
  topRight = createVector(window.innerWidth, 0);
  bottomLeft = createVector(0, window.innerHeight);
  topMiddle = createVector(window.innerWidth / 2, 0);
  middleLeft = createVector(0, window.innerHeight / 2);
  bottomRight = createVector(window.innerWidth, window.innerHeight);
  middleRight = createVector(window.innerWidth, window.innerHeight / 2);
  bottomMiddle = createVector(window.innerWidth / 2, window.innerHeight);
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
  resizeCanvas(window.innerWidth, window.innerHeight);
}
function hasTouch() {
  let hasTouchScreen = false;
  if ("particlesMaxTouchPoints" in navigator) {
    hasTouchScreen = navigator.particlesMaxTouchPoints > 0;
  } else if ("msparticlesMaxTouchPoints" in navigator) {
    hasTouchScreen = navigator.msparticlesMaxTouchPoints > 0;
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
// location
function getLocation() {
  navigator.geolocation
    ? navigator.geolocation.getCurrentPosition((position) => {
        myLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
      })
    : console.log("Can't get location.");
}
function sendLocation() {
  if (targetID && myLocation) {
    setInterval(() => {
      socket.emit("loc", { target: targetID, loc: myLocation });
    }, 500);
  } else {
    setTimeout(sendLocation, 500);
  }
}
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
// jquery
function toggleStatus() {
  if (targetID) {
    loader.removeClass("blink");
    // status.html("Connected");
    status.fadeOut(() => {
      status.html("Connected");
      status.fadeIn();
    });
  } else {
    loader.addClass("blink");
    // status.html("Searching");
    status.fadeOut(() => {
      status.html("Searching");
      status.fadeIn();
    });
  }
}
function toggleCounter() {
  if (distance) {
    counter.fadeIn();
  } else if (!distance || userCount < 2) {
    counter.fadeOut();
  }
}
