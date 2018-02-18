// Initial variables in the server
var users = {}
var userID = 1;
var adminExist = false;

console.log("Server is starting..");

// Importing libraries
var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");

var app = express();

var PORT = 3000;
var server = app.listen(PORT, listening);

function listening() {
	console.log("listening on port: "+ PORT);
}

// To publish html files from "public" file
app.use(express.static("public"));
// Configuring body-parser library to be useful
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// GET methods
app.get('/users', sendAllUsers);
function sendAllUsers(req, res) {
	res.send(users);
}

app.get('/search/:user', searchUser);
function searchUser(req, res) {
	var username = req.params.user;
	username = username.toUpperCase();
	var reply;
	if(users[username]){
		reply = {
			status: "found",
			user: username,
			id: users[username]
		}
	} else {
		reply = {
			status: "not found",
			user: username
		}
	}

	res.send(reply);
}
/*
// A function for adding a user manually from URL
app.get('/add/:username/:id?', addUser);
function addUser(req, res) {
	var data = req.params;
	var username = data.username;
	var id = Number(data.id);
	var reply;

	if(!id){
		reply = {
			msg: "id is required."
		}
	} else {
		users[username] = id;
		reply = {
			msg: "User added."
		}
	}
	res.send(reply);
}*/

// POST methods
app.post('/adminLogin', adminLogin);
function adminLogin(req, res) {
	var inputPass = req.body.pass;
	var inputName = req.body.username;
	inputName = inputName.toUpperCase();

	var data = fs.readFileSync("./admin/pass.json");
	var passObject = JSON.parse(data);
	var storedPass = passObject.password;
	var reply;
	// Checking whether the username exists!
	var usrExist = checkUsername(inputName);

	if(!adminExist && !usrExist && inputPass === storedPass){
		var adminID = 1; // Admin has a unique ID
		adminExist = true; // Admin is online!
		// Inserting the new username to "users" table
		users[inputName] = adminID;
		reply = {
			success: "true"
		}
	}	else {
		reply = {
			success: "false"
		}
	}
	res.send(reply);
}

app.post('/guestLogin', guestLogin);
function guestLogin(req, res){
	var inputName = req.body.username;
	inputName = inputName.toUpperCase();
	var reply;
	// Checking whether the username exists!
	var usrExist = checkUsername(inputName);

	if(!usrExist){
		userID++;
		// Inserting the new username to users table
		users[inputName] = userID;
		reply = {
			success: "true"
		}
	} else {
		reply = {
			success: "false"
		}
	}
	res.send(reply);
}

// Supplementary methods
function checkUsername(username){
	//var length = Object.keys(users).length;
	//console.log(users[username]);
	if(users[username])
		return true;
	else
		return false;
}
