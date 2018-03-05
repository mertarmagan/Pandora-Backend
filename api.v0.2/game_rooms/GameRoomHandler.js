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
        "createRoom": function (gameID, roomObj) {
            let gameRoomID;
            if(Rooms.size >= 1)
              gameRoomID = Rooms.roomList[Rooms.size-1].gameRoomID + 1;
            else
              gameRoomID = 1;
            roomObj['gameID']     = gameID;
            // TODO Is there a better solution to id?
            roomObj['gameRoomID'] = gameRoomID;
            roomObj['users']      = [];
            roomObj['active']     =  false;
            Rooms.roomList.push(roomObj);
            Rooms.size = Rooms.size + 1;
            synchronize();
            return { success: true, gameRoomID: gameRoomID };
        },
        "deleteRoom": function (roomObj) {
            roomObj['gameRoomID'] = Rooms.size; // TODO Is there a better solution to id?
            Rooms.roomList[Rooms.size] = roomObj;
            Rooms.size = Rooms.size + 1;
            synchronize();
        },
        "addUserToGameRoom": function (gameRoomID , user) {
            Rooms.roomList.forEach(function (room) {
                if(room['gameRoomID'] === gameRoomID){
                    room.users.push(user);
                }
            });
            synchronize();
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
        "wasPlaying": function (connID) {
            let check = false;
            for(var i=0; i<Rooms.size; i++){
                for(var j=0; j<Rooms.roomList[i].length; j++){
                    if(Rooms.roomList[i].users[j].connID === connID){
                        check = true;
                        break;
                    }
                }
            }

            return { success: true, boolean: check };
        }
    }
}();
