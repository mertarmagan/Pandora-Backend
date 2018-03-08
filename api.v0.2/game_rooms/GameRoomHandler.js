var fs = require('fs');
const uuidv4 = require('uuid/v4');

module.exports['GameRoomHandler'] = function () {
    let roomData = fs.readFileSync('./game_rooms/rooms.json');
    let Rooms = JSON.parse(roomData);
    // let LoginHandler = require("./../LoginHandler").LoginHandler;
    let roomList = Rooms.roomList;
    let size     = Rooms.roomList.length;

    function synchronize(){
        fs.writeFileSync('./game_rooms/rooms.json', JSON.stringify(Rooms, null, 2));
    }

    function generateGRID() {
        return uuidv4();
    }

    return {
        "createRoom": function (gameID) {
            let roomObj = {};

            roomObj['gameID']     = gameID;
            roomObj['gameRoomID'] = generateGRID();
            roomObj['users']      = [];
            roomObj['active']     = false;
            roomObj['status']     = "init";

            Rooms.roomList.push(roomObj);
            Rooms.size += 1;
            synchronize();
            return roomObj;
        },
        "deleteRoom": function (gameRoomID) {
            Rooms.roomList = Rooms.roomList.filter(function (room) {
               return room.gameRoomID !== gameRoomID
            });
            Rooms.size -= 1;
            synchronize();
            return Rooms.roomList;
        },
        "deleteAllRooms": function () {
            Rooms.roomList = [];
            Rooms.size = 0;
            synchronize();
            return Rooms.roomList;
        },
        "duplicateUser": function (username, gameRoomID) {
            for(let i=0; i<Rooms.size; i++){
                if(roomList[i].gameRoomID === gameRoomID){
                    for(let j=0; j<roomList[i].users.length; j++){
                        if(roomList[i].users[j].username === username.toUpperCase()) {
                            return true;
                        }
                    }
                    break;
                }
            }
            return false;
        },
        "addUserToGameRoom": function (gameRoomID , username) {
            let thisRoom = {};
            let isExist = this.duplicateUser(username, gameRoomID);
            Rooms.roomList.forEach(function (room) {
                if(room['gameRoomID'] === gameRoomID){
                    if(!isExist){
                        console.log("user added");
                        room.users.push({ username: username.toUpperCase(), ready: false });
                        thisRoom = room;
                    } else {
                        thisRoom = null;
                    }
                }
            }, thisRoom);
            synchronize();
            return thisRoom;
        },
        "deleteUserFromGameRoom": function(gameRoomID, username){
            let thisRoom = {};
            Rooms.roomList.forEach(function (room) {
                if(room['gameRoomID'] === gameRoomID){
                    room.users = room.users.filter(function (user) {
                        return user.username !== username.toUpperCase()
                    });
                    thisRoom = room;
                }
            }, thisRoom);
            synchronize();
            return thisRoom;
        },
        "isGameRoomActive": function (gameRoomID) {
            for(let i=0; i<size; i++){
        		if(Rooms.roomList[i].gameRoomID === gameRoomID){
        			return roomList[i].active;
        		}
        	}
        },
        "setGameRoomActive": function (gameRoomID, boolean) {
            let success = false;
            Rooms.roomList.forEach(function (room) {
                if(room['gameRoomID'] === gameRoomID){
                    room['active'] = boolean;
                    success = true;
                }
            });
            synchronize();
            return success;
        },
        "setUserReady": function (gameRoomID, username, ready) {
            let thisRoom = {};
            for(let i=0; i<Rooms.roomList.length; i++){
        		if(Rooms.roomList[i].gameRoomID === gameRoomID){
        			for(let j=0; j<Rooms.roomList[i].users.length; j++){
        				if(Rooms.roomList[i].users[j].username === username.toUpperCase()) {
        					Rooms.roomList[i].users[j].ready = ready;
        					break;
        				}
        			}
        			thisRoom = Rooms.roomList[i];
        			break;
        		}
        	}
            synchronize();
            return thisRoom;
        },
        "getActiveRooms": function () {
            let activeGameRooms = [];
            for(let i=0; i<Rooms.size; i++)
        		if(Rooms.roomList[i].active === true)
                   activeGameRooms.push(Rooms.roomList[i]);
            return activeGameRooms;
        },
        "getAllRooms": function () {
            return Rooms.roomList;
        },
        "wasPlaying": function (username) {
            for(let i=0; i<Rooms.size; i++)
                for(let j=0; j<Rooms.roomList[i].users.length; j++)
                    if(Rooms.roomList[i].users[j].username === username.toUpperCase())
                        return true;
            return false;
        }
    }
}();
