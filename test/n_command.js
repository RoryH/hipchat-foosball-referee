describe('Message Operations (lib/msg_operations) --n command', function() {
  var msgOps = require('../lib/msg_operations'),
      sinon = require('sinon-es6'),
      expect = require('chai').expect,
      _ = require('lodash'),
      helpers = require('./test_helpers'),
      context,
      wrappedSpy;

  before(function() {
    context = _.clone(helpers.getDummyApi());
    msgOps.resetGameState(context.room.id);
  });

  beforeEach(function() {
    wrappedSpy = sinon.spy();
    context.roomClient.sendNotification = function* () { wrappedSpy.apply(this, arguments); };
    var gs = msgOps.getGameState(context.room.id);
    gs.currentOpenGame = true;
    gs.currentPlayers.push(helpers.getUserNotInGame(gs));
  });

  it ('should remove user from the existing game, and close current game', function*() {
    var msg = '--n',
        cmdMatch = _.find(msgOps.commands, function(cmd) {
          return cmd.regex.test(msg);
        }),
        matches = msg.match(cmdMatch.regex);

    context.sender = helpers.getUserInGame(msgOps.getGameState(context.room.id));

    yield cmdMatch.handler.apply(context, matches.slice(1));

    expect(wrappedSpy.called).to.be.true;

    var spyCall = wrappedSpy.getCall(0),
        msgRe = new RegExp(helpers.regexifyMessage(msgOps.commands.leavegame.msgs.removed_player_game_closed));

    expect(msgRe.test(spyCall.args[0])).to.be.true;
    expect(_.contains(_.pluck(msgOps.getGameState(context.room.id).currentPlayers, 'id'), context.sender.id)).to.be.false;
    expect(msgOps.getGameState(context.room.id).currentPlayers).to.have.length(0);
  });

  it ('should remove user from the existing game', function*() {
      var msg = '--n',
          cmdMatch = _.find(msgOps.commands, function(cmd) {
            return cmd.regex.test(msg);
          }),
          matches = msg.match(cmdMatch.regex);

      var gs = msgOps.getGameState(context.room.id);
      gs.currentPlayers.push(helpers.getUserNotInGame(gs));

      context.sender = helpers.getUserInGame(msgOps.getGameState(context.room.id));

      yield cmdMatch.handler.apply(context, matches.slice(1));

      expect(wrappedSpy.called).to.be.true;

      var spyCall = wrappedSpy.getCall(0),
          msgRe = new RegExp(helpers.regexifyMessage(msgOps.commands.leavegame.msgs.removed_player));

      expect(msgRe.test(spyCall.args[0])).to.be.true;
      expect(_.contains(_.pluck(msgOps.getGameState(context.room.id).currentPlayers, 'id'), context.sender.id)).to.be.false;
      expect(msgOps.getGameState(context.room.id).currentPlayers).to.have.length(1);
    });

});