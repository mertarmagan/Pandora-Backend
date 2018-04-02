module.exports = {
  "isLeavingSafe": false,
  "setLeavingSafe": function(boolean) {
    this.isLeavingSafe = boolean;
  },
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
        } else if (message.type === "CREATE_GAME_ROOM") {
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
          console.log("join game request: ", message);
          let newRoomState = GameRoomHandler.addUserToGameRoom(message.gameRoomID, message.username , connection);
          console.log(clients.length);
          clients.forEach(function(client) {
            if (client !== connection)
              client.send(JSON.stringify({
                type: "USER_JOINED",
                room: newRoomState
              }))
          });
          connection.send(JSON.stringify({
            type: "ENTER_GAME_ROOM",
            room: newRoomState
          }));
          /*
          clients = clients.filter(function (client) {
              return client !== connection
          });
          connection.close();
          */
        } else if (message.type === "START_GAME") {
          console.log("Start game request!");
          console.assert(message.gameRoomID !== null);
          console.assert(message.username !== null);
          let newRoomState = GameRoomHandler.startGame(message.gameRoomID);
          clients.forEach(function(client) {
            if (client !== connection)
              client.send(JSON.stringify({
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
            GameRoomHandler.getRoom(message.gameRoomID).users.forEach(function (user) {

                console.log(user);
                user.connection.send(JSON.stringify({
                    type: "GAME_ROOM_CLOSED",
                }))
            });
            GameRoomHandler.deleteRoom(message.gameRoomID);
          } else
            {
              console.log("BİRİ ÇIKTI AMA ADMİN DEĞİL LA");
                let newRoomState = GameRoomHandler.deleteUserFromGameRoom(message.gameRoomID, message.username);
                clients.forEach(function (client) {
                    client.send(JSON.stringify({
                        type: "USER_EXIT",
                        gameRoomID: newRoomState.gameRoomID,
                        room: newRoomState
                    }))
                })
            }
        } else if (message.type === "SET_READY_TRUE") {
          console.assert(message.gameRoomID !== null);
          console.assert(message.username !== null);
          let newRoomState = GameRoomHandler.setUserReady(message.gameRoomID, message.username, true);
          clients.forEach(function(client) {
            client.send(JSON.stringify({
              type: "USER_READY",
              room: newRoomState
            }))
          }, this)
        } else if (message.type === "SET_READY_FALSE") {
          console.assert(message.gameRoomID !== null);
          console.assert(message.username !== null);
          let newRoomState = GameRoomHandler.setUserReady(message.gameRoomID, message.username, false);
          clients.forEach(function(client) {
            client.send(JSON.stringify({
              type: "USER_READY",
              room: newRoomState
            }))
          }, this)
        } else if (message.type === "GET_INITIAL_STATE") {
          console.assert(message.gameRoomID !== null);
          ws.send(JSON.stringify({
            type: "STATE_UPDATE",
            state: GameStateHandler.getGameState(message.gameRoomID)
          }))

        } else if (message.type === "STATE_UPDATE") {
          console.assert(message.state !== null);
          console.assert(message.gameRoomID !== null);
          let newState = GameStateHandler.updateGameState(message.gameRoomID, message.state);
          clients.forEach(function(client) {
            if (connection !== client)
              client.send(JSON.stringify({
                type: "STATE_UPDATE",
                gameRoomID: newState.gameRoomID,
                state: newState
              }))
          })
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
           if(message.isWaiting === true)
             console.log("anan")
        }
        else {
          console.warn("Message did not recognized!")
        }
      });

      let index = clients.push(connection) - 1;
      console.log(clients.length);
      if (this.newConnection)
        this.newConnection(index);

      connection.on('close', function(connection) {
        console.log((new Date()) + " Peer " +
          connection.remoteAddress + " disconnected.");
        clients.splice(index, 1);

        GameRoomHandler.Rooms.roomList.forEach(function (room) {
            room.users.forEach(function (user) {
                if(user.connection === connection){
                  if(room.active){
                    if (user.isAdmin){
                        room.users.forEach(function (user) {
                            user.connection.send(JSON.stringify({
                                type: "USER_DISCONNECTED_GAME",
                                username: user.username,
                                isDecided: 1
                            }))
                        })
                    } else
                      {
                          room.users.forEach(function (user) {
                              user.connection.send(JSON.stringify({
                                  type: "USER_DISCONNECTED_GAME",
                                  username: user.username,
                                  isDecided: 0
                              }))
                          })
                      }
                  } else {
                      if (user.isAdmin){
                          GameRoomHandler.deleteRoom(room.gameRoomID);
                          room.users.forEach(function (user) {
                              user.connection.send(JSON.stringify({
                                  type: "GAME_ROOM_CLOSED",
                              }))
                          })
                      }else {
                          let newRoomState = GameRoomHandler.deleteUserFromGameRoom(room.gameRoomID, user.username);
                          room.users.forEach(function (user) {
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