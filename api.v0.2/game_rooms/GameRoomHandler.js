var fs = require('fs');

module.exports['GameRoomHandler'] = function () {
    var roomData = fs.readFileSync('./game_rooms/rooms.json');
    var Rooms = JSON.parse(roomData);

    function synchronize(){
        fs.writeFileSync('./game_rooms/rooms.json', JSON.stringify(Rooms, null, 2));
    }

    return {
        "roomList": Rooms.roomList,
        "size": Rooms.size,
        "createRoom": function (gameID, UIDkey, roomObj) {
            let gameRoomID;
            if(LoginHandler.validateKey(UIDkey))
                return { gameRoom: {}};

            if(Rooms.size >= 1)
              gameRoomID = Rooms.roomList[Rooms.size-1].gameRoomID + 1;
            else
              gameRoomID = 1;
            roomObj['gameID']     = gameID;
            // TODO Is there a better solution to id?
            roomObj['gameRoomID'] = gameRoomID;
            roomObj['users']      = [];
            roomObj['active']     =  false;
            roomObj['status']     = "init";
            Rooms.roomList.push(roomObj);
            Rooms.size = Rooms.size + 1;
            synchronize();
            return { gameRoom: roomObj };
        },
        "deleteRoom": function (roomObj) {
            roomObj['gameRoomID'] = Rooms.size; // TODO Is there a better solution to id?
            Rooms.roomList[Rooms.size] = roomObj;
            Rooms.size = Rooms.size + 1;
            synchronize();
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
            Rooms.roomList.forEach(function (room) {
                if(room.gameRoomID === gameRoomID)
                    room.users.map(function (user) {
                        if(user.username !== username){
                            return user;
                        }
                    })
            });
            synchronize();
        },
        "isGameRoomActive": function (gameRoomID) {
            for(var i=0; i<size; i++){
        		if(roomList[i].gameRoomID === gameRoomID){
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
        "setUserReady": function (username, ready, gameRoomID) {
            for(var i=0; i<size; i++){
        		if(Rooms.roomList[i].gameRoomID === gameRoomID){
        			for(var j=0; j<Rooms.roomList[i].users.length; j++){
        				if(Rooms.roomList[i].users[j].username === username) {
        					Rooms.roomList[i].users[j].ready = ready;
        					break;
        				}
        			}
        			break;
        		}
        	}
            synchronize();
            return true;
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
