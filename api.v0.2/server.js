// Initial variables in the server
var connectedUsers = {}
var guestID = 1;
var adminExist = false;
var gameRoomID = 0;

console.log("Server is starting..");

// Importing libraries
var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var logger = require('morgan');

var app = express();

var PORT = 3000;
var server = app.listen(PORT, listening);

function listening() {
	console.log("Listening on port: "+ PORT);
}

// To publish html files from "public" file
app.use(express.static("public"));
// To track each GET/POST/.. commands on the server
app.use(logger('dev'));
// Configuring body-parser library to be useful
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Admin Login
app.post('/api/loginAdmin', loginAdmin);
function loginAdmin(req, res) {
	var reply;
	var password;

	var data = fs.readFileSync("./admin/pass.json");
	var passObject = JSON.parse(data);
	var storedPass = passObject.password;

	var body = req.body;

	if(body.password === undefined){
		reply = {
			message: "Wrong input!"
		}
		res.status(400).send(reply);
	}	else {
		var inputPass = body.password;

		if(!adminExist && inputPass === storedPass) {
			adminExist = true;
			reply = {
				message: "Done(admin)!"
			}
			res.status(200).send(reply);
		} else {
			reply = {
				message: "Invalid password or admin already exists!"
			}
			res.status(400).send(reply);
		}
	}
}

// Guest Login
app.post('/api/loginGuest', loginGuest);
function loginGuest(req, res) {
	var reply = {
		message: "Done(guest)!"
	};
	res.status(200).send(reply);
}

// Get Connection ID for Admin
app.get('/api/getConnIdAdmin', getConnIdAdmin);
function getConnIdAdmin(req, res) {
	var reply;
	var adminID = 1;
	connectedUsers[adminID] = "Admin";
	reply = {
		connID: adminID
	}
	res.status(200).send(reply);
}

// Get Connection ID for Guest
app.get('/api/getConnIdGuest', getConnIdGuest);
function getConnIdGuest(req, res) {
	var reply;
	guestID++;
	connectedUsers[guestID] = "Guest";
	reply = {
		connID: guestID
	}
	res.status(200).send(reply);
}

// Create Game Room
app.post('/api/createRoom', createRoom);
function createRoom(req, res) {
	/*
		roomsObj: rooms.json'daki bütün Object
		roomList: rooms.json içindeki roomsList property'si
		roomData: yeni eklenecek datanın objesi(roomList'e girecek)
		size: rooms.json'daki global size
		gameRoomID: roomsList'teki son objenin id'si + 1
	*/
	var reply;

	var body = req.body;
	// Checking the input
	if(body.gameID === undefined){
		reply = {
			message: "Wrong input!"
		}
		res.status(400).send(reply);
	}	else {
		gameRoomID++;
		var roomData = {};
		var inputGameID = Number(body.gameID);

		//console.log(JSON.stringify(roomData));
		var data = fs.readFileSync('./game_rooms/rooms.json');
		var roomsObj = JSON.parse(data);
		var roomList = roomsObj.roomList;
		var size = roomsObj.size;
		size++;

		//console.log(gameRoomID);

		// Updating global size!
		roomsObj.size = size;
		roomData.gameID = inputGameID;

		if(size > 1){
			var newID = roomList[size-2].gameRoomID + 1;
			roomData.gameRoomID = newID;
		} else {
			roomData.gameRoomID = size;
		}

		roomData.users = [];
		roomData.active = false;

		roomList.push(roomData);

		fs.writeFileSync('./game_rooms/rooms.json', JSON.stringify(roomsObj, null, 2), finished);
		function finished(err){
			console.log("Data can't be written!");
		}

		reply = {
			gameRoomID: roomData.gameRoomID
		}
		res.status(200).send(reply);
	}
}

// Get Active rooms
app.get('/api/getActiveRooms', getActiveRooms);
function getActiveRooms(req, res) {
	var reply;

	var data = fs.readFileSync('./game_rooms/rooms.json');
	var roomsObj = JSON.parse(data);
	var roomList = roomsObj.roomList;
	var size = roomsObj.size;

	var activeGameRooms = [];

	for(var i=0; i<size; i++) {
		if(roomList[i].active === true){
			activeGameRooms.push(roomList[i]);
		}
	}

	if(activeGameRooms.length > 0){
		reply = {
			"activeGameRooms": activeGameRooms
		};
		res.status(200).send(reply);
	} else {
		reply = {
			"message": "No active game room!"
		};
		res.status(404).send(reply);
	}
}

app.post('/api/enterGameRoom', enterGameRoom);
function enterGameRoom(req, res) {
	var reply;
	var body = req.body;

	if(body.connID === undefined || body.username === undefined || body.gameRoomID === undefined){
		reply = {
			message: "Wrong input type!"
		}
		res.status(400).send(reply);
		return;
	}
	var inputConnID = Number(body.connID);
	var inputUsername = String(body.username);
	var inputGameRoomID = Number(body.gameRoomID);
	inputUsername = inputUsername.toUpperCase();

	var data = fs.readFileSync('./game_rooms/rooms.json');
	var roomsObj = JSON.parse(data);
	var roomList = roomsObj.roomList;
	var size = roomsObj.size;
	var found = false;
	var userObj = {};
	var i;

	for(i=0; i<size; i++) {
		if(roomList[i].gameRoomID === inputGameRoomID){
			//console.log("AAA " + roomList[i].users.length);
			for(var j=0; j<roomList[i].users.length; j++){
				if(roomList[i].users[j].username === inputUsername){
					reply = {
						message: "User already exists!"
					}
					res.status(406).send(reply);
					return;
				}
			}
		 	userObj.connID = inputConnID;
		 	userObj.username = inputUsername;
			userObj.ready = false;
		 	roomList[i].users.push(userObj);
		 	found = true;
		 	break;
		}
	}

	// TODO: Check if the user who wants to enter has a same connID with someone else!

	if(found){
		reply = roomList[i];

		fs.writeFileSync('./game_rooms/rooms.json', JSON.stringify(roomsObj, null, 2), finished);
		function finished(err){
			console.log("Data can't be written!");
		}

		res.status(200).send(reply);
	} else {
		reply = {
			message: "Game room does not exist!"
		}
		res.status(404).send(reply);
	}
}

// Control Game Room in Progress
app.post('/api/isGameRoomActive', isGameRoomActive);
function isGameRoomActive(req, res) {
	var reply;
	var body = req.body;

	if(body.gameRoomID === undefined){
		reply = {
			message: "Wrong input type!"
		}
		res.status(400).send(reply);
		return;
	}

	var data = fs.readFileSync('./game_rooms/rooms.json');
	var roomsObj = JSON.parse(data);
	var roomList = roomsObj.roomList;
	var size = roomsObj.size;
	var found = false;
	var status;

	var inputGameRoomID = Number(body.gameRoomID);

	for(var i=0; i<size; i++){
		if(roomList[i].gameRoomID === inputGameRoomID){
			found = true;
			status = roomList[i].active;
		}
	}

	if(found){
		reply = {
			message: status
		}
		res.status(200).send(reply);
	} else {
		reply = {
			message: "Game room does not exist!"
		}
		res.status(404).send(reply);
	}
}

// Make Player Ready
app.post('/api/makePlayerReady', makePlayerReady);
function makePlayerReady(req, res) {
	var reply;
	var body = req.body;

	if(body.connID === undefined || body.username === undefined ||
					body.readyStatus === undefined || body.gameRoomID === undefined) {
		reply = {
			message: "Wrong input type!"
		}
		res.status(400).send(reply);
		return;
	}

	var inputConnID = Number(body.connID);
	var inputUsername = String(body.username);
	var inputStatus = body.readyStatus.toLowerCase();
	var inputGameRoomID = Number(body.gameRoomID);

	if(inputStatus === "true")
		inputStatus = true;
	else if(inputStatus === "false")
		inputStatus = false;
	
	inputUsername = inputUsername.toUpperCase();

	var data = fs.readFileSync('./game_rooms/rooms.json');
	var roomsObj = JSON.parse(data);
	var roomList = roomsObj.roomList;
	var size = roomsObj.size;

	var found = false;

	for(var i=0; i<size; i++){
		if(roomList[i].gameRoomID === inputGameRoomID){
			found = true;
			for(var j=0; j<roomList[i].users.length; j++){
				console.log(roomList[i].users[j].username + "-" + inputUsername);
				if(roomList[i].users[j].username === inputUsername) {
					roomList[i].users[j].ready = inputStatus;
					console.log(inputStatus);
					break;
				}
			}
			break;
		}
	}

	// TODO: Check if the user is trying to be ready for an inactive game!
	// TODO: Check if the user is trying to be ready for a game that he is not joined!

	if(found){
		fs.writeFileSync('./game_rooms/rooms.json', JSON.stringify(roomsObj, null, 2), finished);
		function finished(err){
			console.log("Data can't be written!");
		}
		reply = {
			message: "Done!"
		}
		res.status(200).send(reply);
	} else {
		reply = {
			message: "Game room does not exist!"
		}
		res.status(404).send(reply);
	}
}

// Check if the user is Admin
app.post('/api/isAdmin', isAdmin);
function isAdmin(req, res) {
	var reply;
	var body = req.body;
	var adminID = 1;
	var check;

	if(body.connID === undefined){
		reply = {
			message: "Wrong input type!"
		}
		res.status(400).send(reply);
		return;
	}

	var inputConnID = Number(body.connID);

	if(inputConnID === adminID)
		check = true;
	else {
		check = false;
	}

	reply = {
		message: check
	}
	res.status(200).send(reply);
}
