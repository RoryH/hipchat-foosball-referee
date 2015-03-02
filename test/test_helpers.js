var users = [
  { 'mention_name': 'fecker', 'name': 'Feckin eejit', 'id': 1222 },
  { 'mention_name': 'buster', 'name': 'Buster Benign', 'id': 1223 },
  { 'mention_name': 'mary', 'name': 'Mary Magdeline', 'id': 1224 },
  { 'mention_name': 'jesus', 'name': 'Jesus Christ', 'id': 1225 },
  { 'mention_name': 'georgew', 'name': 'George W Busch', 'id': 1226 },
  { 'mention_name': 'tbabbot', 'name': 'Tony Babbot', 'id': 1227 }
],
_ = require('lodash');
require('regexp-escape');

module.exports = {
  getDummyApi: function() {
    return {
      roomClient: {
        sendNotification: null,
        getRoomMembers: function* () {
          return yield {
            items: users
          };
        }
      },
      room: {
        'id': 'test-room',
        'name': 'Unit Test Room'
      }
    };
  },
  getUserNotInGame: function(gameState) {
    var players = _.pluck(gameState.currentPlayers, 'id'),
        availablePlayers = _.pluck(users, 'id');

    availablePlayers = _.filter(availablePlayers, function(ap) {
      return !_.contains(players, ap);
    });

    if (availablePlayers.length === 0) {
      throw new Error('Unable to find a player not in the current game.');
    }

    return _.where(users, { id: _.sample(availablePlayers, 1)[0]})[0];
  },
  getUserInGame: function(gameState) {
    var players = _.pluck(gameState.currentPlayers, 'id'),
        availablePlayers = _.pluck(users, 'id');

    availablePlayers = _.filter(availablePlayers, function(ap) {
      return _.contains(players, ap);
    });

    if (availablePlayers.length === 0) {
      throw new Error('Unable to find a player in the current game.');
    }

    return _.where(users, { id: _.sample(availablePlayers, 1)[0]})[0];
  },
  regexifyMessage: function(msg) {
    return RegExp.escape(msg).replace(/%[sd]/g,'[^\\s]+');
  }
};