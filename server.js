const express = require("express");
const http = require("http");
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
app.use(express.static("public"));

io.on("connection", (socket) => {
  updateUsers();
  socket.on("disconnect", () => {
    updateUsers();
  });
  // custom event
  socket.on("pos", ({ target, pos }) => {
    // console.log("recieved");
    io.to(target).emit("pos", pos);
  });
});

function updateUsers() {
  io.clients((error, clients) => {
    if (error) console.log(errorMessage + "(client count)");
    console.log("number of users: " + clients.length);
    console.log("client list: " + clients);
    io.emit("clients", clients);
  });
}

// listen for requests
const listener = server.listen(port, () => {
  console.log(`Server is listening on port ${listener.address().port}`);
});
