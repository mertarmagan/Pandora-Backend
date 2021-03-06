let timerID;
module.exports = {
  "ConnectionHandler": function() {
    var webSocketServerPort = 1337;
    var webSocketServer = require('websocket').server;
    var GameStateHandler = require('./game_state/GameStateHandler').GameStateHandler;
    var GameRoomHandler = require('./game_rooms/GameRoomHandler').GameRoomHandler;
    var http = require('http');
    var server = http.createServer(function(request, response) {

    });
    var LoginHandler = require('./LoginHandler').LoginHandler;



    server.listen(webSocketServerPort, function() {
      console.log((new Date()) + " WSServer is listening on port " +
        webSocketServerPort);
    });
    var wsServer = new webSocketServer({
      httpServer: server
    });

    console.log(wsServer.httpServer);
    let clients = [];

    wsServer.on('request', function(ws) {
      console.log((new Date()) + ' Connection from origin ' +
        ws.origin + '.');
      var connection = ws.accept();


      connection.on('message', function(message) {
        message = JSON.parse(message.utf8Data);
        console.log(message);
        if (message.type === "ADMIN_LOGIN") {
          console.assert(message.password !== null);
          let key = LoginHandler.loginAdmin(message.password);
          if (key !== null)
            connection.send(JSON.stringify({
              type: "ADMIN_LOGIN",
              key: key
            }));
          else
            connection.send(JSON.stringify({
              type: "ERROR",
              message: "Wrong Password"
            }));
        }
        else if (message.type === "VALIDATE_KEY"){
          let isValid = LoginHandler.validateKey(message.key);
            connection.send(JSON.stringify({
                type: "VALIDATE_KEY",
                isValid: isValid
            }))
        }
        else if (message.type === "CREATE_GAME_ROOM") {
          console.assert(message.key !== null);
          console.assert(message.gameID !== null);
          if (LoginHandler.validateKey(message.key)) {
            let roomObj = GameRoomHandler.createRoom(message.gameID);
            connection.send(JSON.stringify({
              type: "CREATE_GAME_ROOM",
              gameRoom: roomObj
            }));
              clients.forEach(function (client) {
                if(client !== connection)
                  client.send(JSON.stringify({
                      type: "ROOM_CREATED",
                      gameRoom: roomObj
                  }))
              })
          } else {
            connection.send(JSON.stringify({
              type: "ERROR",
              message: "Game Room couldn't created"
            }))
          }
        } else if (message.type === "DELETE_GAME_ROOM") {
          console.assert(message.key !== null);
          console.assert(message.gameRoomID !== null);
          if (LoginHandler.validateKey(message.key)) {
            let roomList = GameRoomHandler.deleteRoom(message.gameRoomID);
            connection.send(JSON.stringify({
              type: "DELETE_GAME_ROOM",
              roomList: roomList
            }))
          } else {
            connection.send(JSON.stringify({
              type: "ERROR",
              message: "Admin key not valid!"
            }))
          }
        } else if (message.type === "DELETE_ALL_ROOMS") {
          console.assert(message.key !== null);
          if (LoginHandler.validateKey(message.key)) {
            let roomList = GameRoomHandler.deleteAllRooms();
            connection.send(JSON.stringify({
              type: "DELETE_ALL_ROOMS",
              roomList: roomList
            }))
          } else {
            connection.send(JSON.stringify({
              type: "ERROR",
              message: "Couldn't delete all rooms"
            }))
          }
        } else if (message.type === "GET_ACTIVE_GAME_ROOM") {
          let rooms = GameRoomHandler.getActiveRooms();
          connection.send(JSON.stringify({
            type: "GET_ACTIVE_GAME_ROOM",
            roomList: rooms
          }));
        } else if (message.type === "GET_ALL_ROOMS") {
          let rooms = GameRoomHandler.getAllRooms();
          connection.send(JSON.stringify({
            type: "GET_ALL_ROOMS",
            roomList: rooms
          }))
        } else if (message.type === "ENTER_GAME_ROOM") {
          console.assert(message.gameRoomID !== null);
          console.assert(message.username !== null);
          if(GameRoomHandler.isGameRoomActive(message.gameRoomID)) {
              console.log("tekrar girmeye çalışıyoz");
            if(GameRoomHandler.deleteWaitingUser(message.gameRoomID,message.username)){
                GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
                    if(user.username.toUpperCase() === message.username.toUpperCase()){
                        console.log("connectionu updateliyom apla");
                        user.connection = connection;
                        console.log("yeni user connection state'i : " ,user.connection.state)
                    }
                });
                console.log("tekrar girmeye çalışan girdi ve başka bekleyen kalmadı");
                let roomState = GameRoomHandler.getRoom(message.gameRoomID);
                console.log("old timer id: ",this.timerID);
                clearTimeout(timerID);
                console.log("new timer id: ",this.timerID);
                GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
                    user.connection.send(JSON.stringify({
                        type: "CONTINUE_GAME",
                        room: roomState
                    }))
                }.bind(this));
                GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
                    user.connection.send(JSON.stringify({
                        type: "STATE_UPDATE",
                        state: GameStateHandler.getGameState(message.gameRoomID)
                    }))
                }.bind(this))
            }else {
                console.log("tekrar girmeye çalışan girdi ama başka beklenilenler var");
                GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
                    if(user.username.toUpperCase() === message.username.toUpperCase()){
                        console.log("connectionu updateliyom apla");
                        user.connection = connection;
                        console.log("yeni user connection state'i : " ,user.connection.state)
                    }
                });
                let newRoomState = GameRoomHandler.getRoom(message.gameRoomID);
                connection.send(JSON.stringify({
                    type: "CONTINUE_GAME",
                    room: newRoomState
                }));
            }
          } else {
              let newRoomState = GameRoomHandler.addUserToGameRoom(message.gameRoomID, message.username , connection);
              if(newRoomState === null){
                  return
              }
              console.log("adam eklemeye çalışıyorum: " , newRoomState);
              if(newRoomState.gameRoomID !== undefined) {
                  GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
                      console.log("user " + user.username + "'e user girdiğini bildiriyorum :)");
                      if (user.connection != connection) {
                          user.connection.send(JSON.stringify({
                              type: "USER_JOINED",
                              room: newRoomState
                          }))
                      }
                  });
                  connection.send(JSON.stringify({
                      type: "ENTER_GAME_ROOM",
                      room: newRoomState
                  }));
              }
          }
        } else if (message.type === "START_GAME") {
          console.assert(message.gameRoomID !== null);
          console.assert(message.username !== null);
          let newRoomState = GameRoomHandler.startGame(message.gameRoomID);
          GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
              if (user.connection !== connection)
                      user.connection.send(JSON.stringify({
                          type: "START_GAME",
                          room: newRoomState
                      }))
          });
          connection.send(JSON.stringify({
            type: "START_GAME",
            room: newRoomState
          }));
        } else if (message.type === "EXIT_GAME_ROOM") {
          console.assert(message.gameRoomID !== null);
          console.assert(message.username !== null);
          if(GameRoomHandler.isAdmin(message.gameRoomID, message.username)) {
              console.log("BİRİ ÇIKTI VE ADMİN LA");
              GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
                user.connection.send(JSON.stringify({
                    type: "GAME_ROOM_CLOSED",
                }))
            });
            GameRoomHandler.deleteRoom(message.gameRoomID);
          } else
            {
              console.log("BİRİ ÇIKTI AMA ADMİN DEĞİL LA");
              let connections = GameRoomHandler.getRoomConnections(message.gameRoomID);
                let newRoomState = GameRoomHandler.deleteUserFromGameRoom(message.gameRoomID, message.username);
                connections.forEach(function (client) {
                  if(client.connection !== connection) {
                      client.connection.send(JSON.stringify({
                          type: "USER_EXIT",
                          gameRoomID: newRoomState.gameRoomID,
                          room: newRoomState
                      }))
                  }else {
                    client.connection.send(JSON.stringify({
                        type: "ME_EXIT"
                    }))
                  }
                })
            }
        } else if (message.type === "SET_READY_TRUE") {
          console.assert(message.gameRoomID !== null);
          console.assert(message.username !== null);
          let newRoomState = GameRoomHandler.setUserReady(message.gameRoomID, message.username, true);
          GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
              user.connection.send(JSON.stringify({
                  type: "USER_READY",
                  room: newRoomState
              }))
          })
        } else if (message.type === "SET_READY_FALSE") {
            console.assert(message.gameRoomID !== null);
            console.assert(message.username !== null);
            let newRoomState = GameRoomHandler.setUserReady(message.gameRoomID, message.username, false);
            GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
                user.connection.send(JSON.stringify({
                    type: "USER_READY",
                    room: newRoomState
                }))
            })
        } else if (message.type === "GET_INITIAL_STATE") {
          console.assert(message.gameRoomID !== null);
          newState= GameStateHandler.getGameState(message.gameRoomID);
          connection.send(JSON.stringify({
            type: "STATE_UPDATE",
            gameRoomID: newState.gameRoomID,
            state: newState
          }))

        } else if (message.type === "STATE_UPDATE") {
          console.assert(message.state !== null);
          console.assert(message.gameRoomID !== null);
          let newState = GameStateHandler.updateGameState(message.gameRoomID, message.state);
          GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
              if(connection !== user.connection){
                  user.connection.send(JSON.stringify({
                      type: "STATE_UPDATE",
                      gameRoomID: newState.gameRoomID,
                      state: newState
                  }));
              }
          });
          /*
          clients.forEach(function(client) {
            if (connection !== client) {
                client.send(JSON.stringify({
                    type: "STATE_UPDATE",
                    gameRoomID: newState.gameRoomID,
                    state: newState
                }))
            }
          })
          */
        } else if (message.type === "ENTER_GAME") {
          console.assert(message.gameRoomID !== null);
          var newState = GameStateHandler.getGameState(message.gameRoomID);
          if (newState)
            connection.send(JSON.stringify({
              type: "STATE_UPDATE",
              gameRoomID: newState.gameRoomID,
              state: newState
            }))
        }
        else if (message.type === "WAIT_USER"){
            GameRoomHandler.setWaitingPolicy(message.gameRoomID,message.isWaiting);
            timerID = setTimeout(function () {
                GameRoomHandler.getRoomConnections(message.gameRoomID).forEach(function (user) {
                    user.connection.send(JSON.stringify({
                        type: "GAME_ROOM_CLOSED"
                    }))
                });
                GameRoomHandler.deleteRoom(message.gameRoomID);
            }.bind(this), 30000)
        }
        else {
          console.warn("Message did not recognized!")
        }
      });

      let index = clients.push(connection) - 1;
      if (this.newConnection)
        this.newConnection(index);

      connection.on('close', function(connection) {
        console.log((new Date()) + " Peer " +
          connection.remoteAddress + " disconnected.");
        clients.splice(index, 1);

        GameRoomHandler.Rooms.roomList.forEach(function (room) {
            GameRoomHandler.getRoomConnections(room.gameRoomID).forEach(function (user) {
                if(user.connection.state === "closed"){
                  if(room.active){
                    if (user.isAdmin){
                      console.log("admin düşmüş la , oyun da aktifmiş");
                        let connections = GameRoomHandler.getRoomConnections(room.gameRoomID);
                        GameRoomHandler.deleteRoom(room.gameRoomID);
                        connections.forEach(function (user){
                            user.connection.send(JSON.stringify({
                                type: "USER_DISCONNECTED_GAME",
                                username: user.username,
                                isDecided: 1
                            }))
                        });
                        setTimeout(function () {
                            connections.forEach(function (user) {
                                user.connection.send(JSON.stringify({
                                    type: "GAME_ROOM_CLOSED"
                                }))
                            })
                        }.bind(this), 10000)
                    } else
                      {
                          console.log("user düşmüş la, oyun da aktifmiş");
                          GameRoomHandler.addWaitingUser(room.gameRoomID, user.username);
                          if(GameRoomHandler.getRoom(room.gameRoomID)['WaitingPolicy']) {
                              console.log("waiting policy var ve ", GameRoomHandler.getRoom(room.gameRoomID)['WaitingPolicy']);
                          }
                          else {
                              console.log("waiting policy yok");
                              console.log("waiting users ne alemde? ", GameRoomHandler.getWaitingUsers(room.gameRoomID));
                              if (!GameRoomHandler.getRoom(room.gameRoomID)['WaitingUsers']) {
                                  GameRoomHandler.getRoomConnections(room.gameRoomID).forEach(function (user) {
                                      user.connection.send(JSON.stringify({
                                          type: "USER_DISCONNECTED_GAME",
                                          username: GameRoomHandler.getLatestWaitingUser(room.gameRoomID),
                                          isDecided: 0
                                      }))
                                  })
                              }else {
                                  console.log("user düştü ama düşen ilk user bu değil")
                              }
                          }
                      }
                  } else {
                      if (user.isAdmin){
                          console.log("admin düşmüş la, oyun da aktif değilmiş");
                          GameRoomHandler.getRoomConnections(room.gameRoomID).forEach(function (user) {
                              user.connection.send(JSON.stringify({
                                  type: "GAME_ROOM_CLOSED",
                              }))
                          });
                          GameRoomHandler.deleteRoom(room.gameRoomID);
                      }else {
                          console.log("user düşmüş la, oyun da aktif değilmiş");
                          let newRoomState = GameRoomHandler.deleteUserFromGameRoom(room.gameRoomID, user.username);
                          GameRoomHandler.getRoomConnections(room.gameRoomID).forEach(function (user) {
                              user.connection.send(JSON.stringify({
                                  type: "USER_JOINED",
                                  room: newRoomState
                              }))
                          })
                      }
                  }
                }
            })
        })


      }.bind(this));


      connection.send(JSON.stringify({
        type: 'GameStateSocketConnection',
        data: 'Successful'
      }))
    });
  }
};