minCol = 30;
maxCol = 225;
padding = 10;
factorBounds = 1;
particlesMin = 100;
particlesMax = 500;
touchServer = false;
p5.disableFriendlyErrors = true;

// inititalise firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// access counter object
const db = firebase.firestore();
const dbCounter = db.collection("counter");
const dbCounterID = "0Gbw2CoY5f3SEGKP4EOa";

$(document).ready(() => {
  if (!hasTouch()) {
    particlesMin = 300;
    notification.fadeIn();
    notification.css("display", "flex");
  } else {
    statusWrapper.fadeIn();
    statusWrapper.css("display", "flex");
    getLocation();
  }
  getCounter();
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
  myIndex = clients.indexOf(myID);
  targetID = myIndex % 2 == 0 ? clients[myIndex + 1] : clients[myIndex - 1];
  // console.log("targetID: " + targetID);
  toggleStatus(); // show & hide status
  resetParticles(); // reset particles on disconnect
  if (clients.length < 2) distanceKm.fadeOut(); // hide user count safety
  sender = setInterval(sendLocation, 1000); // send location interval
});
socket.on("pos", (pos) => {
  serverAttractor.update(pos.x, pos.y);
  touchServer = true;
});
socket.on("loc", (loc) => {
  // console.log("recieved!");
  distance = getDistance(myLocation.lat, myLocation.lon, loc.lat, loc.lon); // calculate distance
  distance =
    distance < 100 ? Math.round(distance * 100) / 100 : Math.round(distance); // conditional rounding
  distanceKm.html(distance + "km"); // update counter
  distanceKm.fadeIn(); // show counter
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
    particles.push(new Particle(width / 2, height / 2, minCol, maxCol));
  }
}
function draw() {
  background(color("#1e1e1e"));
  // client attractor events
  if (mouseIsPressed && !toggle) {
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
      if (!once) incrementCounter();
      once = true;
      factorBounds = 0.5; // lower border attraction
      particles[i].maxCol = 225; // set bright max color
      particles[i].mapColor(clientAttractor.pos, maxDistance, true); // map color to attractor
    } else {
      factorBounds = 1; // reset border attraction
      particles[i].maxCol = hasTouch() ? 128 : 225; // set dark max color
    }
    particles[i].mapColor(canvasCenter, maxDistance, hasTouch()); // map color to canvas center
    particles[i].update();
    particles[i].show();
  }
  // add particles
  if (overlap())
    particles.push(
      new Particle(
        random(random(padding, 20), random(width - 20, width - padding)),
        random(random(padding, 20), random(height - 20, height - padding)),
        minCol,
        maxCol
      )
    );
  if (particles.length > particlesMax) particles.splice(0, 1); // delete first particle if limit is reached
  touchServer = false; // server mouse inactivity
}
function overlap() {
  distance = clientAttractor.pos.dist(serverAttractor.pos);
  return distance < clientAttractor.width && mouseIsPressed && touchServer;
  // return distance < clientAttractor.width; // testing
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
  // set canvas center
  canvasCenter = createVector(window.innerWidth / 2, window.innerHeight / 2);
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
    distanceKm.fadeOut(); // fade counter
    loader.addClass("blink"); // add blinker class
    status.fadeOut(() => {
      status.html("Searching");
      status.fadeIn();
    });
  }
}
// firebase
function getCounter() {
  dbCounter
    .doc(dbCounterID)
    .get()
    .then((doc) => {
      touchCounter = doc.data().counter;
      counter.html(`${touchCounter}`);
    })
    .catch((err) => {
      console.error(err);
    });
}
function incrementCounter() {
  touchCounter++;
  counter.html(`${touchCounter}`);
  // update firebase counter
  if (myIndex % 2 != 0)
    dbCounter.doc(dbCounterID).update({
      counter: firebase.firestore.FieldValue.increment(1),
    });
}
