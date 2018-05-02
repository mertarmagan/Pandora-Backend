var fs = require('fs');
const uuidv4 = require('uuid/v4');

module.exports['GameRoomHandler'] = function() {
  let roomData = fs.readFileSync('./game_rooms/rooms.json');
  let Rooms = JSON.parse(roomData);
  let size = Rooms.roomList ? Rooms.roomList.length : 0;


  function synchronize() {
    let saveRooms = Rooms.roomList.map(function (room) {
        return copyRoomWithoutConnections(room)
    });
    let saveRooms2 = {
        roomList: saveRooms,
        size: saveRooms.length
    };
    console.log("saving rooms: " , saveRooms2);
    fs.writeFileSync('./game_rooms/rooms.json', JSON.stringify(saveRooms2, null, 2));
  }

  function generateGRID() {
    return uuidv4();
  }

    function copyRoomWithoutConnections(room) {
        let saveRoom = {};
        saveRoom['gameID'] = room['gameID'];
        saveRoom['gameRoomID'] = room['gameRoomID'];
        saveRoom['users'] = room['users'];
        saveRoom['active'] = room['active'];
        saveRoom['status'] = room['status'];
        return saveRoom
    }

  return {
    "Rooms": Rooms,
      "RoomStatuses": [],
    "createRoom": function(gameID) {
      let roomObj = {};

      roomObj['gameID'] = gameID;
      roomObj['gameRoomID'] = generateGRID();
      roomObj['users'] = [];
      roomObj['usersWithConnections'] = [];
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
      let rooms = Rooms.roomList.map(function (room) {
          return copyRoomWithoutConnections(room)
      });
      Rooms.size -= 1;
      console.log("odayı sildik mi beyler, ", Rooms.roomList);
      synchronize();
      return rooms;
    },
    "deleteAllRooms": function() {
      Rooms.roomList = [];
      Rooms.size = 0;
      synchronize();
      return Rooms.roomList;
    },
    "duplicateUser": function(username, gameRoomID) {
      for (let i = 0; i < Rooms.roomList.length; i++) {
        if (Rooms.roomList[i].gameRoomID === gameRoomID) {
          for (let j = 0; j < Rooms.roomList[i].users.length; j++) {
            if (Rooms.roomList[i].users[j].username === username.toUpperCase()) {
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
      if(isExist){
          return null
      }
      Rooms.roomList.forEach(function(room) {
        if (room['gameRoomID'] === gameRoomID) {
          if (!isExist) {
            if(room.users.length === 0){
                room.users.push({
                    username: username.toUpperCase(),
                    ready: false,
                    isAdmin: true
                });
                room.usersWithConnections.push({
                    username: username.toUpperCase(),
                    ready: false,
                    connection: connection,
                    isAdmin: true
                });
                thisRoom = room;
            } else {
                room.users.push({
                    username: username.toUpperCase(),
                    ready: false
                });
                room.usersWithConnections.push({
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
      return copyRoomWithoutConnections(thisRoom)
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
      synchronize();return copyRoomWithoutConnections(thisRoom)
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
      synchronize();
      return copyRoomWithoutConnections(thisRoom)
    },
    "isGameRoomActive": function(gameRoomID) {
        let flag = false;
        if(Rooms.roomList.length === 0)
            return false;
        Rooms.roomList.forEach(function (room) {
            if(room.gameRoomID === gameRoomID){
                console.log("status buldum: " ,room['status']);
                flag = (room['status'] === "active")
            }
        });
        return flag;
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
      return copyRoomWithoutConnections(thisRoom)
    },
    "getActiveRooms": function() {
      let activeGameRooms = [];
      for (let i = 0; i < Rooms.size; i++)
        if (Rooms.roomList[i].active === true) {
            let activeGameRoom = copyRoomWithoutConnections(Rooms.roomList[i]);
            activeGameRooms.push(activeGameRoom);
        }
      return activeGameRooms;
    },
    "getAllRooms": function() {
        let allRooms = Rooms.roomList.map(function (room) {
            let retRoom = copyRoomWithoutConnections(room);
            return retRoom
        });
      return allRooms;
    },
    "getRoom": function (gameRoomID) {
        let foundRoom = Rooms.roomList.find(function (room) {
          return room.gameRoomID === gameRoomID
        });
        return copyRoomWithoutConnections(foundRoom)
    },
    "getRoomConnections": function (gameRoomID) {
        let foundRoom = Rooms.roomList.find(function (room) {
            return room.gameRoomID === gameRoomID
        });
        if(foundRoom)
            return foundRoom['usersWithConnections'];
        else
            return []

    },
    "wasPlaying": function(username) {
      for (let i = 0; i < Rooms.size; i++)
        for (let j = 0; j < Rooms.roomList[i].users.length; j++)
          if (Rooms.roomList[i].users[j].username === username.toUpperCase())
            return true;
      return false;
    },
    "setWaitingPolicy": function (gameRoomID, decision) {
      Rooms.roomList.forEach(function (room) {
          if(room.gameRoomID === gameRoomID){
              room['waitingPolicy'] = decision
          }
      });
        synchronize()
    },
    "addWaitingUser": function (gameRoomID, username) {
      Rooms.roomList.forEach(function (room) {
          if(room.gameRoomID === gameRoomID) {
              room['WaitingUsers'] ? room['WaitingUsers'].push(username): room['WaitingUsers'] = [username]
          }
      });
        synchronize()
    },
      "deleteWaitingUser": function (gameRoomID, delete_username) {
        let flag = true;
        console.log("target gameroomID: " , gameRoomID);
          Rooms.roomList.forEach(function (room) {
              console.log("current gameRoomID: " , room.gameRoomID);
              console.log("target in foreach gameRoomID: " , gameRoomID);
              console.log("old waiting users", room['WaitingUsers']);
              if(room.gameRoomID === gameRoomID) {
                  room['WaitingUsers'] = room['WaitingUsers'].filter(function (username) {
                      return username.toLowerCase() !== delete_username.toLowerCase()
                  });
                  console.log("new waiting users", room['WaitingUsers']);
                  console.log("new waiting users length", room['WaitingUsers'].length);
                  if(room['WaitingUsers'].length == 0){
                      console.log("bekleyen kalmadı siliyom aq");
                      delete room['WaitingUsers'];
                      flag = true;
                      return true
                  }else {
                      console.log("bekleyen var silmiyom aq");
                      flag = false;
                      return false;
                  }
              }

          });
          synchronize();
          return flag
      },
    "isAdmin": function (gameRoomID, username) {
        var flag = false;
        Rooms.roomList.forEach(function (room) {
            if(room.gameRoomID === gameRoomID) {

              room.users.forEach(function (user) {
                if(user.username.toUpperCase() === username.toUpperCase()) {
                    if (user.isAdmin) {
                        flag = true
                    }
                    else {
                    }
                }
              }.bind(this))
            }
        }.bind(this));
        return flag;
    },
  }
}();