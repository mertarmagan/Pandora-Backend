var fs = require('fs');

module.exports['GameRoomHandler'] = function () {
    var roomData = fs.readFileSync('./game_rooms/rooms.json');
    var Rooms = JSON.parse(roomData);
    var LoginHandler = require("./../LoginHandler").LoginHandler;

    var roomList = Rooms.roomList;
    var size     = Rooms.roomList.length;

    function synchronize(){
        fs.writeFileSync('./game_rooms/rooms.json', JSON.stringify(Rooms, null, 2));
    }

    return {
        "roomList": Rooms.roomList,
        "size": Rooms.size,
        "createRoom": function (gameID) {
            let roomObj = {};
            let gameRoomID;

            if(Rooms.size >= 1)
              gameRoomID = Rooms.roomList[Rooms.size-1].gameRoomID + 1;
            else
              gameRoomID = 1;
            roomObj['gameID']     = gameID;
            // TODO Is there a better solution to id?
            roomObj['gameRoomID'] = gameRoomID;
            roomObj['users']      = [];
            roomObj['active']     = false;
            roomObj['status']     = "init";

            Rooms.roomList.push(roomObj);
            Rooms.size += 1;
            synchronize();
            return { gameRoom: roomObj };
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
        "addUserToGameRoom": function (gameRoomID , username) {
            let thisRoom = {};
            Rooms.roomList.forEach(function (room) {
                if(room['gameRoomID'] === gameRoomID){
                    thisRoom = room;
                    room.users.push({ username: username, ready: false });
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
                        return user.username !== username
                    });
                    thisRoom = room;
                }
            }, thisRoom);
            synchronize();
            return thisRoom;
        },
        "isGameRoomActive": function (gameRoomID) {
            for(var i=0; i<size; i++){
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
            for(var i=0; i<this.size; i++){
        		if(Rooms.roomList[i].gameRoomID === gameRoomID){
        			for(var j=0; j<Rooms.roomList[i].users.length; j++){
        				if(Rooms.roomList[i].users[j].username === username) {
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
            for(var i=0; i<Rooms.size; i++)
        		if(Rooms.roomList[i].active === true)
                   activeGameRooms.push();
            return { "activeGameRooms": activeGameRooms };
        },
        "getAllRooms": function () {
            return Rooms.roomList;
        },
        "wasPlaying": function (username) {
            for(var i=0; i<Rooms.size; i++)
                for(var j=0; j<Rooms.roomList[i].users.length; j++)
                    if(Rooms.roomList[i].users[j].username === username)
                        return true;
            return false;
        }
    }
}();
