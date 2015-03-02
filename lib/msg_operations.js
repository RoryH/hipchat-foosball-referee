module.exports = function() {
  var _ = require('lodash'),
      util = require('util'),
      initGameState = {
        currentPlayers: [],
        currentOpenGame: false
      },
      gameStates = {},
      sendOptions = { format: 'html' },
      commands;

  function getRoomGameState(roomId) {
    if (!gameStates[roomId]) {
      gameStates[roomId] = _.clone(initGameState, true);
    }

    return gameStates[roomId];
  }

  function isUserInCurrentGame(userObj, roomId) {
    var gameState = getRoomGameState(roomId);
    return !!_.find(gameState.currentPlayers, function(player) {
      return player.id === userObj.id;
    });
  }

  commands = {
      newgame : {
        regex: /^--new$/i,
        msgs: {
          started_game: '%s just started a new game. Message "--y" to join the game.',
          game_exists: '%s there is already an open game waiting for %d player(s), use --hard-new command to force a new game. Use --y to join the game.'
        },
        handler: function*() {
          var gameState = getRoomGameState(this.room.id);
          if (!gameState.currentOpenGame) {
            gameState.currentPlayers = [];
            gameState.currentOpenGame = true;
            gameState.currentPlayers.push(this.sender);
            yield this.roomClient.sendNotification(util.format(commands.newgame.msgs.started_game, this.sender.name), sendOptions);
          } else {
            yield this.roomClient.sendNotification(util.format(commands.newgame.msgs.game_exists, '@' + this.sender.mention_name, 4 - gameState.currentPlayers.length), sendOptions);
          }
        }
      },
      hardnew: {
        regex: /^--hard-new$/i,
        msgs: {
          new_game_forced: '%s just forced a new game. Message "--y" to join the game.'
        },
        handler: function* () {
          var gameState = getRoomGameState(this.room.id);
          gameState.currentPlayers = [];
          gameState.currentPlayers.push(this.sender);
          gameState.currentOpenGame = true;
          yield this.roomClient.sendNotification(util.format(commands.hardnew.msgs.new_game_forced, this.sender.name), sendOptions);
        }
      },
      status: {
        regex: /^--status$/i,
        msgs: {
          no_game: 'No current game.',
          game_state: 'Game currently needs %d more player(s). Players in are: %s'
        },
        handler: function* () {
          var gameState = getRoomGameState(this.room.id);
          if (!gameState.currentOpenGame) {
            yield this.roomClient.sendNotification('No current game.');
          } else {
            var playersStr = gameState.currentPlayers.map(function(i) { return i.name;  }).join(', ');
            yield this.roomClient.sendNotification(util.format(commands.status.msgs.game_state, (4 - gameState.currentPlayers.length), playersStr), sendOptions);
          }
        }
      },
      help: {
        regex: /^--help$/i,
        handler: function* () {
          var helpMsg = '<table>';
          helpMsg += '<tr><th colspan="2">Foosball referee, available commands.</th></tr>';
          helpMsg += '<tr><td><b> --new </b></td><td> Begins a new game</td></tr>';
          helpMsg += '<tr><td><b> --hard-new </b></td><td> Forces new game to reset current state </td></tr>';
          helpMsg += '<tr><td><b> --y </b></td><td> Add yourself to the open game </td></tr>';
          helpMsg += '<tr><td><b> --y @user </b></td><td> Adds @user to the open game </td></tr>';
          helpMsg += '<tr><td><b> --n </b></td><td> Removes yourself from the current game. </td></tr>';
          helpMsg += '<tr><td><b> --n @user </b></td><td> Removes @user from current game. </td></tr>';
          helpMsg += '<tr><td><b> --status </b></td><td> Status of current game being organised. </td></tr>';
          helpMsg += '<tr><td><b> --help </b></td><td> This message! </td></tr>';
          helpMsg += '</table>';
          yield this.roomClient.sendNotification(helpMsg, sendOptions);
        }
      },
      joingame: {
        regex: /^--y(?:\s+(@\w+)\s*)?$/i,
        msgs: {
          no_open_game: '%s there is no open game, use "--new" to begin a new game.',
          already_in_game: '%s is already signed up for the current game.',
          invalid_add_syntax: '%s bad syntax for adding another player. Use "--y @mention_name"',
          not_in_game: '%s, you need to be in the game to add or remove players.',
          player_added: '%s has added %s to the game.',
          game_on: 'Game On!  %s - Vs - %s',
          player_added_self: '%s you are now in the game. Waiting on %d player(s).'
        },
        handler: function* () {
          var gameState = getRoomGameState(this.room.id),
              self = this,
              newPlayer;
          if (!gameState.currentOpenGame) {
            yield this.roomClient.sendNotification(util.format(commands.joingame.msgs.no_open_game, '@' + this.sender.mention_name), sendOptions);
          } else {
            //console.log('In game: ' + isUserInCurrentGame(this.sender, this.room.id));
            if (arguments.length > 0 && !_.isUndefined(arguments[0])) {   //adding another user to the game.
              newPlayer = arguments[0];
              if (!/^@\w+/i.test(newPlayer)) {
                yield this.roomClient.sendNotification(util.format(commands.joingame.msgs.invalid_add_syntax, '@' + this.sender.mention_name));
                return;
              } else if (!isUserInCurrentGame(this.sender, this.room.id)) {
                yield this.roomClient.sendNotification(util.format(commands.joingame.msgs.not_in_game, '@' + this.sender.mention_name));
                return;
              } else {
                newPlayer = newPlayer.substr(1);
                var roomMembers = yield this.roomClient.getRoomMembers();

                newPlayer = _.find(roomMembers.items, function(member) {
                  return member.mention_name.toLowerCase() === newPlayer.toLowerCase();
                });
              }
            } else {
              newPlayer = this.sender;
            }

            if (gameState.currentPlayers.length > 0 && gameState.currentPlayers.filter(function(i) { return i.id === newPlayer.id; }).length > 0) {
              yield this.roomClient.sendNotification(util.format(commands.joingame.msgs.already_in_game, '@' + newPlayer.mention_name));
              return;
            }

            if (this.sender.id !== newPlayer.id) {
              console.log(util.format(commands.joingame.msgs.player_added, '@' + this.sender.mention_name, '@' + newPlayer.mention_name));
              yield this.roomClient.sendNotification(util.format(commands.joingame.msgs.player_added, '@' + this.sender.mention_name, '@' + newPlayer.mention_name), sendOptions);
            }

            gameState.currentPlayers.push(newPlayer);

            if (gameState.currentPlayers.length == 4) {
              var players = gameState.currentPlayers.map(function(i) { return '@' + i.mention_name; });
              players.sort(function() {return 0.5 - Math.random();});
              gameState.currentOpenGame = false;
              yield this.roomClient.sendNotification(util.format(commands.joingame.msgs.game_on, players.slice(0,2).join(' & '), players.slice(2,4).join(' & ')), _.extend({ color:'green' }, sendOptions));
            } else {
              yield this.roomClient.sendNotification(util.format(commands.joingame.msgs.player_added_self,'@' + newPlayer.mention_name, 4 - gameState.currentPlayers.length), sendOptions);
            }
          }
        }
      },
      leavegame: {
        regex: /^--n(?:\s+(@\w+)\s*)?$/i,
        msgs: {
          invalid_remove_syntax: '%s, bad syntax for removing another player. Use \'--n @mention_name\'',
          not_in_game: '%s, you need to be in the game to add or remove players.',
          removed_player: '%s , you are now REMOVED from the game.',
          removed_player_game_closed: '%s , you are now REMOVED from the game. There are no other players, Game closed.',
          other_player_removal_notice: '%s just removed %s from the game.'
        },
        handler: function* () {
          var gameState = getRoomGameState(this.room.id);
          if (gameState.currentPlayers.length > 0) {    //check number of players... as we want to allow players leave after a game is setup.
            var playerToRemove;
            if (arguments.length > 0 && !_.isUndefined(arguments[0])) {
              if (!/^@\w+/i.test(arguments[0])) {
                yield this.roomClient.sendNotification(util.format(commands.leavegame.msgs.invalid_remove_syntax, '@' + this.sender.mention_name));
                return;
              }

              if (!isUserInCurrentGame(this.sender, this.room.id)) {
                yield this.roomClient.sendNotification(util.format(commands.leavegame.msgs.not_in_game, '@' + this.sender.mention_name));
                return;
              }

              playerToRemove = arguments[0].substr(1);
              var roomMembers = yield this.roomClient.getRoomMembers();

              playerToRemove = _.find(roomMembers.items, function(member) {
                return member.mention_name.toLowerCase() === playerToRemove.toLowerCase();
              });
            } else {
              playerToRemove = this.sender;
            }

            for (var i=0; i < gameState.currentPlayers.length; i++) {
              if (gameState.currentPlayers[i].id === playerToRemove.id) {

                if (playerToRemove.id !== this.sender.id) {
                  yield this.roomClient.sendNotification(util.format(commands.leavegame.msgs.other_player_removal_notice, '@' + this.sender.mention_name, '@' + playerToRemove.mention_name), sendOptions);
                  //game opened again as player left
                  gameState.currentOpenGame = true;
                }

                gameState.currentPlayers.splice(i,1);
                if (gameState.currentPlayers.length >= 1) {
                  yield this.roomClient.sendNotification(util.format(commands.leavegame.msgs.removed_player, '@' + playerToRemove.mention_name), sendOptions);
                } else {
                  yield this.roomClient.sendNotification(util.format(commands.leavegame.msgs.removed_player_game_closed, '@' + this.sender.mention_name), sendOptions);
                  gameState.currentOpenGame = false;
                }
                break;
              }
            }
          }
        }
      }
    };


  return {
    getGameState: function(roomId) {
      return gameStates[roomId];
    },
    commands: commands,
    resetGameState: function(roomId) {
      //used in unit tests
      gameStates[roomId] = _.clone(initGameState, true);
    }
  };
}();