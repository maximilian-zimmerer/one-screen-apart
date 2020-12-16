col = 128;
padding = 10;
factorBounds = 1;
particlesMin = 300;
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
  if (!hasTouch()) socket.disconnect(); // disconnect desktops
});
socket.on("clients", (clients) => {
  clearInterval(sender); // clear interval before initiating
  userCount = clients.length;
  myIndex = clients.indexOf(myID);
  targetID = myIndex % 2 == 0 ? clients[myIndex + 1] : clients[myIndex - 1];
  // console.log("targetID: " + targetID);
  toggleStatus(); // show & hide status
  resetParticles(); // reset particles on disconnect
  if (userCount < 2) counter.fadeOut(); // hide user count safety
  sender = setInterval(sendLocation, 1000); // send location interval
});
socket.on("pos", (pos) => {
  serverAttractor.update(pos.x, pos.y);
  touchServer = true;
});
socket.on("loc", (loc) => {
  // console.log("recieved!");
  distance = getDistance(myLocation.lat, myLocation.lon, loc.lat, loc.lon); // calculate distance
  counter.html(Math.round(distance * 100) / 100 + "km"); // update counter
  counter.fadeIn(); // show counter
});
function setup() {
  canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.parent("canvas-wrapper");
  // set up attractors
  clientAttractor = new Attractor(width / 2, height / 2, 60, 255);
  serverAttractor = new Attractor(width / 2, height / 2, 60, 100);
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
  // particles
  for (var i = 0; i < particles.length; i++) {
    // client attractor
    if (mouseIsPressed)
      particles[i].magnetise(clientAttractor.pos, overlap(), factorClient);
    // server attractor
    if (touchServer)
      particles[i].magnetise(serverAttractor.pos, overlap(), factorServer);
    // repellers
    for (var j = 0; j < repellers.length; j++) {
      particles[i].magnetise(repellers[j], true, factorBounds);
    }
    // overlap event
    if (overlap()) {
      particles[i].overlap(clientAttractor, maxDistance);
      factorBounds = 0.5; // lower border attraction
    } else {
      particles[i].color = col; // reset color
      factorBounds = 1; // reset border attraction
    }
    particles[i].update();
    particles[i].show();
  }
  // add particles
  if (overlap())
    particles.push(
      new Particle(
        random(random(padding, 20), random(width - 20, width - padding)),
        random(random(padding, 20), random(height - 20, height - padding)),
        col
      )
    );
  if (particles.length > particlesMax) particles.splice(0, 1); // delete first particle if limit is reached
  touchServer = false; // server mouse inactivity
}
function overlap() {
  distance = clientAttractor.pos.dist(serverAttractor.pos);
  return distance < clientAttractor.width && mouseIsPressed && touchServer;
  // return distance < clientAttractor.width; // // testing
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
  // calculate max distance
  let corner1 = createVector(0, 0);
  let corner2 = createVector(window.innerWidth, window.innerHeight);
  maxDistance = corner1.dist(corner2);
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
      // fallback
    } else if ("orientation" in window) {
      hasTouchScreen = true;
    } else {
      // agent sniffing fallback
      var UA = navigator.userAgent;
      hasTouchScreen =
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}
function resetParticles() {
  if (particles.length > particlesMin) particles.length = particlesMin;
}
// location
function getLocation() {
  navigator.geolocation
    ? navigator.geolocation.getCurrentPosition((position) => {
        myLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        // console.log("location acquired.");
      })
    : console.log("Can't get location.");
}
function sendLocation() {
  if (targetID && myLocation) {
    // console.log("sent!");
    socket.emit("loc", { target: targetID, loc: myLocation });
  } else if (targetID && !myLocation) {
    // console.log("waiting for location.");
  } else if (!targetID && myLocation) {
    // console.log("waiting for targetID.");
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
    loader.removeClass("blink"); // remove blinker class
    status.fadeOut(() => {
      status.html("Connected");
      status.fadeIn();
    });
  } else {
    counter.fadeOut(); // fade counter
    loader.addClass("blink"); // add blinker class
    status.fadeOut(() => {
      status.html("Searching");
      status.fadeIn();
    });
  }
}
