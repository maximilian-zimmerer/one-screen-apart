require("dotenv").config();
const sslRedirect = require("heroku-ssl-redirect").default;
const express = require("express");
const http = require("http");

const app = express();
const port = process.env.PORT || 3000;
const base = process.env.BASE || "/";
const server = http.createServer(app);

const socket = require("socket.io");
const io = socket(server);

app.use(sslRedirect());
app.use(express.static("public"));

app.get(base, (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});
io.on("connection", (socket) => {
  updateUsers();
  socket.on("disconnect", () => {
    updateUsers();
  });
  // position
  socket.on("pos", ({ target, pos }) => {
    io.to(target).emit("pos", pos);
  });
  // location
  socket.on("loc", ({ target, loc }) => {
    io.to(target).emit("loc", loc);
  });
});
function updateUsers() {
  io.clients((err, clients) => {
    if (err) console.log(err);
  });
}
const listener = server.listen(port, () => {
  console.log(`Server is listening on port ${listener.address().port}`);
});
