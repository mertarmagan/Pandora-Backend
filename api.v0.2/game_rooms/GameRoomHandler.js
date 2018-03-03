
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
        "createGameRoom": function (roomObj) {
            roomObj['gameRoomID'] = Rooms.size; // TODO Is there a better solution to id?
            Rooms.roomList[Rooms.size] = roomObj;
            Rooms.size = Rooms.size + 1;
            synchronize()
        },
        "addUserToGameRoom": function (gameRoomID , user) {
            Rooms.roomList.forEach(function (room) {
                if(room['gameRoomID'] === gameRoomID){
                    room.users.push(user);
                }
            });
            synchronize()
        },
        "deleteUserFromGameRoom": function(gameRoomID , username){
            Rooms.roomList.forEach(function (room) {
                if(room.gameRoomID === gameRoomID)
                    room.users.map(function (user) {
                        if(user.username !== username){
                            return user
                        }
                    })
            });
            synchronize();
        },
        "setGameRoomActive": function (gameRoomID ,boolean) {
            Rooms.roomList.forEach(function (room) {
                if(room['gameRoomID'] === gameRoomID){
                    room['active'] = boolean
                }
            });
            synchronize();
        }


    }



}();







