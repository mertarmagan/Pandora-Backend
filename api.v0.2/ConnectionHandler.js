






module.exports ={
    "isLeavingSafe": false,
    "setLeavingSafe": function (boolean) {
        this.isLeavingSafe = boolean;
    },
    "connectionLost": null,
    "newConnection": null,
    "ConnectionHandler": function () {
        var webSocketServerPort = 1337;
        var webSocketServer = require('websocket').server;
        var GameStateHandler = require('./game_state/GameStateHandler').GameStateHandler;
        var http = require('http');
        var server = http.createServer(function (request,response) {

        });


        function htmlEntities(str) {
            return String(str)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
        server.listen(webSocketServerPort, function () {
            console.log((new Date()) + " WSServer is listening on port "
                + webSocketServerPort);
        });
        var wsServer = new webSocketServer({
            httpServer: server
        });

        console.log(wsServer.httpServer);
        var clients = [];

        wsServer.on('request' , function (ws) {
            console.log((new Date()) + ' Connection from origin '
                + ws.origin + '.');
            var connection = ws.accept();
            connection.on('message' ,function (message) {
                message = JSON.parse(message.utf8Data);
                console.log(message);
                if(message.type === "SAVE_STATE") {
                    console.assert(message.state !== null);
                    console.assert(message.gameRoomID !== null);
                    var newState = GameStateHandler.updateGameState(message.gameRoomID , message.state);
                    clients.forEach(function (connection) {
                        connection.send(JSON.stringify({type: "STATE_UPDATED", gameRoomID: message.gameRoomID, state: newState}))
                    })
                }
                else {
                    console.warn("Message did not recognized!")
                }
            });

            var index = clients.push(connection) - 1;
            console.log(clients.length);
            if(this.newConnection)
                this.newConnection(index);

            connection.on('close' , function (connection) {
                console.log((new Date()) + " Peer "
                    + connection.remoteAddress + " disconnected.");
                clients.splice(index, 1);
                if(this.connectionLost)
                    this.connectionLost(index);

            }.bind(this));


            connection.send(JSON.stringify({
                type: 'GameStateSocketConnection',
                data: 'Successful'
            }))
        });
    }
};