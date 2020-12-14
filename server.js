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
  // position
  socket.on("pos", ({ target, pos }) => {
    io.to(target).emit("pos", pos);
  });
});
function updateUsers() {
  io.clients((err, clients) => {
    if (err) console.log(err);
    console.log("number of users: " + clients.length);
    console.log("client list: " + clients);
    io.emit("clients", clients);
  });
}
const listener = server.listen(port, () => {
  console.log(`Server is listening on port ${listener.address().port}`);
});
