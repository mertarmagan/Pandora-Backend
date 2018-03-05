// Initial variables in the server
var connectedUsers = {}
var guestID = 1;
var adminExist = false;

console.log("Server is starting..");

// Importing libraries
var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var logger = require('morgan');
var cors = require('cors');

var app = express();

var PORT = 3000;
var server = app.listen(PORT, listening);

var wsConnection = require('./ConnectionHandler').ConnectionHandler();
var ErrorHandler = require('./ErrorHandler').ErrorHandler
var GameRoomHandler = require('./game_rooms/GameRoomHandler').GameRoomHandler
var LoginHandler = require('./LoginHandler').LoginHandler

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
app.use(cors());

app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
});

// Admin Login
app.post('/api/loginAdmin', loginAdmin);
function loginAdmin(req, res) {
	var reply;
	var body = req.body;

	let error = ErrorHandler.checkInput(body.password);
	if(error){
		reply = { message: "Wrong input type!" };
		res.status(400).send(reply);
		return;
	}

	var inputPass = body.password;
	let success = LoginHandler.loginAdmin(inputPass);

	if(success) {
		// adminExist = true;
		reply = { message: "Done(admin)!" };
		res.status(200).send(reply);
	} else {
		reply = { message: "Invalid password!" };
		res.status(400).send(reply);
	}
}

// Guest Login
app.post('/api/loginGuest', loginGuest);
function loginGuest(req, res) {
	var reply = { message: "Done(guest)!" };
	res.status(200).send(reply);
}

app.post('/api/setAdminPassword', setAdminPassword);
function setAdminPassword(req, res) {
	var reply;
	var body = req.body;

	let error = ErrorHandler.checkInput(body.newPassword);
	if(error){
		reply = { message: "Wrong input type!" };
		res.status(400).send(reply);
		return;
	}

	var inPassword = body.newPassword;

	let success = LoginHandler.setAdminPassword(inPassword);
	if(success){
		reply = { message: "Done!" };
		res.status(200).send(reply);
	} else {
		reply = { message: "Internal Server Error" };
		res.status(500).send(reply);
	}
}

app.post('/api/setWifiPassword', setWifiPassword);
function setWifiPassword(req, res) {
	var reply;
	var body = req.body;

	let error = ErrorHandler.checkInput(body.newPassword);
	if(error){
		reply = { message: "Wrong input type!" };
		res.status(400).send(reply);
		return;
	}

	var inPassword = body.newPassword;

	let success = LoginHandler.setWifiPassword(inPassword);
	if(success){
		reply = { message: "Done!" };
		res.status(200).send(reply);
	} else {
		reply = { message: "Internal Server Error" };
		res.status(500).send(reply);
	}
}

app.post('/api/setWifiName', setWifiName);
function setWifiName(req, res) {
	var reply;
	var body = req.body;

	let error = ErrorHandler.checkInput(body.newName);
	if(error){
		reply = { message: "Wrong input type!" };
		res.status(400).send(reply);
		return;
	}

	var inName = body.newName;

	let success = LoginHandler.setWifiName(inName);
	if(success){
		reply = { message: "Done!" };
		res.status(200).send(reply);
	} else {
		reply = { message: "Internal Server Error" };
		res.status(500).send(reply);
	}
}

// Get Connection ID for Admin
app.get('/api/getConnIdAdmin', getConnIdAdmin);
function getConnIdAdmin(req, res) {
	// TODO: Need to move its logic to ConnectionHandler (w/ more configuration!)
	var reply;
	var adminID = 1;
	connectedUsers[adminID] = "Admin";
	reply = { connID: adminID };
	res.status(200).send(reply);
}

// Get Connection ID for Guest
app.get('/api/getConnIdGuest', getConnIdGuest);
function getConnIdGuest(req, res) {
	// TODO: Need to move its logic to ConnectionHandler (w/ more configuration!)
	var reply;
	guestID++;
	connectedUsers[guestID] = "Guest";
	reply = {
		connID: guestID
	};
	res.status(200).send(reply);
}

// Create Game Room
app.post('/api/createRoom', createRoom);
function createRoom(req, res) {
	var body = req.body;

	let error = ErrorHandler.checkInput(body.gameID);
	if(error){
		reply = { message: "Wrong input type!" };
		res.status(400).send(reply);
		return;
	}

	var reply;
	var inputGameID = Number(body.gameID);

	let result = GameRoomHandler.createRoom(inputGameID, {});

	if(result['success']){
		reply = { gameRoomID: result['gameRoomID'] };
		res.status(200).send(reply);
	} else {
		reply = { message: "Internal Server Error!" }
		res.status(500).send(reply);
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

app.get('/api/getAllRooms', getAllRooms);
function getAllRooms(req, res) {
	var list = GameRoomHandler.roomList;
	if(list.length > 0){
		response.status(200).send(list);
	}
	else{
		var reply = {	message: "No room exists!" };
		response.status(204).send(reply);
	}
}

app.post('/api/enterGameRoom', enterGameRoom);
function enterGameRoom(req, res) {
	var reply;
	var body = req.body;

	let error = ErrorHandler.checkInput(body.connID, body.username, body.gameRoomID);
	if(error){
		reply = { message: "Wrong input type!" };
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
					reply = { message: "User already exists!" }
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

	let error = ErrorHandler.checkInput(body.gameRoomID);
	if(error){
		reply = { message: "Wrong input type!" };
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
		reply = { message: status };
		res.status(200).send(reply);
	} else {
		reply = { message: "Game room does not exist!" };
		res.status(404).send(reply);
	}
}

// Make Player Ready
app.post('/api/setPlayerReady', setPlayerReady);
function setPlayerReady(req, res) {
	var reply;
	var body = req.body;

	let error = ErrorHandler.checkInput(body.connID, body.username, body.gameRoomID, body.readyStatus);
	if(error){
		reply = { message: "Wrong input type!" };
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

app.post('/api/wasPlaying', wasPlaying);
function wasPlaying(req, res) {
	var reply;
	var body = req.body;

	let error = ErrorHandler.checkInput(body.connID);
	if(error){
		reply = { message: "Wrong input type!" };
		res.status(400).send(reply);
		return;
	}

	var inputConnID = Number(body.connID);

	let result = GameRoomHandler.wasPlaying(inputConnID);

	if(result["success"]){
		reply = { message: result["boolean"] };
		res.status(200).send(reply);
	} else {
		reply = { message: "Internal Server Error!" };
		res.status(500).send(reply);
	}

}

// Check if the user is Admin
app.post('/api/isAdmin', isAdmin);
function isAdmin(req, res) {
	var reply;
	var body = req.body;
	var adminID = 1;
	var check;

	let error = ErrorHandler.checkInput(body.connID);
	if(error){
		reply = { message: "Wrong input type!" };
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

app.post('/api/setGameRoomActive', setGameRoomActive);
function setGameRoomActive(req, res) {
	var body = req.body;

	let error = ErrorHandler.checkInput(body.gameRoomID, body.boolean);
	if(error){
		reply = { message: "Wrong input type!" };
		res.status(400).send(reply);
		return;
	}

	var inputGameRoomID = Number(body.gameRoomID);
	var inputBool = body.boolean;
	var reply;

	var success = GameRoomHandler.setGameRoomActive(inputGameRoomID, inputBool);
	if(success){
		reply = { message: "Done!" };
		res.status(200).send(reply);
	} else {
		reply = {	message: "GameRoomID does not found or connection error!"	};
		res.status(404).send(reply);
	}
}
