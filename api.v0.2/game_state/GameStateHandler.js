var fs = require('fs');

module.exports['GameStateHandler'] = function GameStateHandler() {
  var gameData = fs.readFileSync('./game_state/game_states.json');
  var GameStates = JSON.parse(gameData);

  if (GameStates === null)
    GameStates = [];


  function synchronize() {
    fs.writeFileSync('./game_state/game_states.json', JSON.stringify(GameStates, null, 2));
  }

  return {
    "gameStateList": GameStates,
    "deleteGameState": function(gameRoomID) {
      GameStates.map(function(game) {
        if (game.gameRoomID !== gameRoomID) {
          return game
        }
      });
      synchronize()
    },
    "updateGameState": function(gameRoomID, newState) {
      var isExisting = false;
      GameStates.forEach(function(game) {
        if (game.gameRoomID === gameRoomID) {
          game.state = newState;
          isExisting = true;
        }
      }, isExisting);
      if (isExisting === false) {
        GameStates.push({
          "gameRoomID": gameRoomID,
          "state": newState
        });
      }
      synchronize();
      return newState;
    },
    "getGameState": function(gameRoomID) {
      var state = {};
      GameStates.forEach(function(game) {
        if (game.gameRoomID === gameRoomID) {
          state = game.state;
        }
      }, state);

      return state;
    }

  }

}();