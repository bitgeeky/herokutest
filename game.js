/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var util = require("util"),					// Utility resources (logging, object inspection, etc)
	Player = require("./Player").Player,	// Player class
	Ball = require("./Ball").Ball;

/**************************************************
** GAME VARIABLES
**************************************************/
var socket,		// Socket controller
	players;	// Array of connected players
var oneball = new Ball(10,10);
var express = require('express');
var app = express.createServer();
app.configure(function(){
	 app.use(express.static(__dirname + '/public'));
	app.set('views', __dirname);
	app.set('view engine', 'jade');	
});
app.get('/', function (req, res) {
  res.render('index', { layout: false });
});

var io = require('socket.io');
var fs = require('fs'), path = require('path');
var http = require('http') , url = require('url');


/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Create an empty array to store players
	players = [];

	// Set up Socket.IO to listen on port 3000
	app.listen(Number(process.env.PORT));
	socket = io.listen(app);
	console.log(socket);
	// Configure Socket.IO
	socket.configure(function() {
		// Only use WebSockets
		socket.set("transports", ["xhr-polling"]); 
    socket.set("polling duration", 20); 
	//	socket.set("transports", ["websocket"]);

		// Restrict log output
	//	socket.set("log level", 2);
	});

	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	socket.sockets.on("connection", onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
	util.log("New player has connected: "+client.id);

	client.on("disconnect", onClientDisconnect);

	client.on("new player", onNewPlayer);

	client.on("move player", onMovePlayer);
	client.on("move ball", onMoveBall);
};

function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);

	var removePlayer = playerById(this.id);

	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	players.splice(players.indexOf(removePlayer), 1);

	this.broadcast.emit("remove player", {id: this.id});
};

function onNewPlayer(data) {
	var newPlayer = new Player(data.x, data.y);
	newPlayer.id = this.id;

	this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});

	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
	};
		
	players.push(newPlayer);
};
function onMovePlayer(data) {
	var movePlayer = playerById(this.id);

	if (!movePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	movePlayer.setX(data.x);
	movePlayer.setY(data.y);

	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
};
function onMoveBall(data){
	oneball.setX(data.x);
	oneball.setY(data.y);	
	this.broadcast.emit("move ball", {x: oneball.getX(), y: oneball.getY()});
//	console.log("values recieved in server and emitted");
};

/**************************************************
** GAME HELPER FUNCTION
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	};
	
	return false;
};

init();
