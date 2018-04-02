var fs = require('fs');
const uuidv4 = require('uuid/v4');

module.exports['GameRoomHandler'] = function() {
  let roomData = fs.readFileSync('./game_rooms/rooms.json');
  let Rooms = JSON.parse(roomData);
  // let LoginHandler = require("./../LoginHandler").LoginHandler;
  let roomList = Rooms.roomList ? Rooms.roomList : [];
  let size = Rooms.roomList ? Rooms.roomList.length : 0;


  function synchronize() {
    /*
    let saveRooms = roomList.slice();
    saveRooms.forEach(function (room) {
        room.users.forEach(function (user) {
            delete user.connection;
        })
    });
    let saveRooms2 = {
        roomList: saveRooms,
        size: saveRooms.length
    };
    fs.writeFileSync('./game_rooms/rooms.json', JSON.stringify(saveRooms2, null, 2));
    */
  }

  function generateGRID() {
    return uuidv4();
  }

  return {
    "Rooms": Rooms,
      "RoomStatuses": [],
    "createRoom": function(gameID) {
      console.log(Rooms);
      let roomObj = {};

      roomObj['gameID'] = gameID;
      roomObj['gameRoomID'] = generateGRID();
      roomObj['users'] = [];
      roomObj['active'] = false;
      roomObj['status'] = "init";

      Rooms.roomList.push(roomObj);
      Rooms.size += 1;
      synchronize();
      return roomObj;
    },
    "setRoomWaiting": function (gameRoomID) {
        Rooms.roomList.forEach(function (gameRoom) {
            if(gameRoom.gameRoomID == gameRoomID){
              gameRoom.status = "waiting"
            }
        });
        synchronize()
    },
    "setRoomStarted": function (gameRoomID) {
        Rooms.roomList.forEach(function (gameRoom) {
            if(gameRoom.gameRoomID == gameRoomID){
                gameRoom.status = "started"
            }
        });
        synchronize()
    },
    "findRoomWithStatus": function (status) {
        return Rooms.roomList.filter(function (room) {
            return room.status === status
        })
    },
    "deleteRoom": function(gameRoomID) {
      Rooms.roomList = Rooms.roomList.filter(function(room) {
        return room.gameRoomID !== gameRoomID
      });
      Rooms.size -= 1;
      synchronize();
      return Rooms.roomList;
    },
    "deleteAllRooms": function() {
      Rooms.roomList = [];
      Rooms.size = 0;
      synchronize();
      return Rooms.roomList;
    },
    "duplicateUser": function(username, gameRoomID) {
      for (let i = 0; i < Rooms.size; i++) {
        if (roomList[i].gameRoomID === gameRoomID) {
          for (let j = 0; j < roomList[i].users.length; j++) {
            if (roomList[i].users[j].username === username.toUpperCase()) {
              return true;
            }
          }
          break;
        }
      }
      return false;
    },
    "addUserToGameRoom": function(gameRoomID, username, connection) {
      let thisRoom = {};
      let isExist = this.duplicateUser(username, gameRoomID);
      Rooms.roomList.forEach(function(room) {
        if (room['gameRoomID'] === gameRoomID) {
          if (!isExist) {
            console.log("user added");
            if(room.users.length === 0){
                console.log("connection check", connection);
                room.users.push({
                    username: username.toUpperCase(),
                    ready: false,
                    connection: connection,
                    isAdmin: true
                });
                thisRoom = room;
            } else {
                console.log("connection check", connection);
                room.users.push({
                    username: username.toUpperCase(),
                    ready: false,
                    connection: connection
                });
                thisRoom = room;
            }
          } else {
            thisRoom = null;
          }
        }
      }, thisRoom);
      synchronize();
      console.log("room state felan");
      console.log(thisRoom);
      return thisRoom;
    },
    "deleteUserFromGameRoom": function(gameRoomID, username) {
      let thisRoom = {};
      Rooms.roomList.forEach(function(room) {
        if (room['gameRoomID'] === gameRoomID) {
          room.users = room.users.filter(function(user) {
            return user.username !== username.toUpperCase()
          });
          thisRoom = room;
        }
      }, thisRoom);
      synchronize();
      return thisRoom;
    },
    "startGame": function(gameRoomID) {
      let thisRoom = {};
      Rooms.roomList.forEach(function(room) {
        if (room['gameRoomID'] === gameRoomID) {
          room.active = true;
          room['status'] = "active";
          thisRoom = room;
        }
      }, thisRoom);
      console.log("Backend on its track.. ", thisRoom);
      synchronize();
      return thisRoom;
    },
    "isGameRoomActive": function(gameRoomID) {
      for (let i = 0; i < size; i++) {
        if (Rooms.roomList[i].gameRoomID === gameRoomID) {
          return roomList[i].active;
        }
      }
    },
    "setGameRoomActive": function(gameRoomID, boolean) {
      let success = false;
      Rooms.roomList.forEach(function(room) {
        if (room['gameRoomID'] === gameRoomID) {
          room['active'] = boolean;
          success = true;
        }
      });
      synchronize();
      return success;
    },
    "setUserReady": function(gameRoomID, username, ready) {
      let thisRoom = {};
      for (let i = 0; i < Rooms.roomList.length; i++) {
        if (Rooms.roomList[i].gameRoomID === gameRoomID) {
          for (let j = 0; j < Rooms.roomList[i].users.length; j++) {
            if (Rooms.roomList[i].users[j].username === username.toUpperCase()) {
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
    "getActiveRooms": function() {
      let activeGameRooms = [];
      for (let i = 0; i < Rooms.size; i++)
        if (Rooms.roomList[i].active === true)
          activeGameRooms.push(Rooms.roomList[i]);
      return activeGameRooms;
    },
    "getAllRooms": function() {
      return Rooms.roomList;
    },
    "getRoom": function (gameRoomID) {
          return Rooms.roomList.find(function (room) {
              return room.gameRoomID === gameRoomID
          })
    },
    "getRoomConnections": function (gameRoomID) {
        return Rooms.roomList.map(function (room) {
            return room.users.map(function (user) {
                return user.connection
            })
        })
    },
    "wasPlaying": function(username) {
      for (let i = 0; i < Rooms.size; i++)
        for (let j = 0; j < Rooms.roomList[i].users.length; j++)
          if (Rooms.roomList[i].users[j].username === username.toUpperCase())
            return true;
      return false;
    },
    "isAdmin": function (gameRoomID, username) {
        var flag = false;
        Rooms.roomList.forEach(function (room) {
            if(room.gameRoomID === gameRoomID) {
              console.log("room bulduk admine bakacaz");
              room.users.forEach(function (user) {
                console.log(user);
                console.log(username);
                if(user.username.toUpperCase() === username.toUpperCase()) {
                    if (user.isAdmin) {
                        console.log("admini bulduk oyna devam");
                        flag = true
                    }
                    else {
                      console.log("patladık" , user);
                    }
                }
              }.bind(this))
            }
        }.bind(this));

        console.log("flag", flag);
        return flag;

    },
    "notifyRoom": function (gameRoomID, messageType, payloadName, paylaod) {
        Rooms.roomList.forEach(function (room) {
            if(room.gameRoomID === gameRoomID){
              room.users.forEach(function (user) {
                  user.connection.send(JSON.stringify({
                      type: messageType,

                  }))
              })
            }
        })
    }
  }
}();