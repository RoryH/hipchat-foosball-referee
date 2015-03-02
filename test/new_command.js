describe('Message Operations (lib/msg_operations) --new command', function() {
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
  });

  it ('should begin a new game with sender added as player', function*() {
    var msg = '--new',
        cmdMatch = _.find(msgOps.commands, function(cmd) {
          return cmd.regex.test(msg);
        }),
        matches = msg.match(cmdMatch.regex);

    context.sender = helpers.getUserNotInGame(msgOps.getGameState(context.room.id));

    yield cmdMatch.handler.apply(context, matches.slice(1));

    expect(wrappedSpy.called).to.be.true;

    var spyCall = wrappedSpy.getCall(0),
        msgRe = new RegExp(helpers.regexifyMessage(msgOps.commands.newgame.msgs.started_game));

    expect(msgRe.test(spyCall.args[0])).to.be.true;
    expect(_.contains(_.pluck(msgOps.getGameState(context.room.id).currentPlayers, 'id'), context.sender.id)).to.be.true;
    expect(msgOps.getGameState(context.room.id).currentOpenGame).to.be.true;
  });

  it ('should tell a player a game already exists', function*() {
    var msg = '--new',
        cmdMatch = _.find(msgOps.commands, function(cmd) {
          return cmd.regex.test(msg);
        }),
        matches = msg.match(cmdMatch.regex);

    context.sender = helpers.getUserNotInGame(msgOps.getGameState(context.room.id));

    yield cmdMatch.handler.apply(context, matches.slice(1));

    expect(wrappedSpy.called).to.be.true;

    var spyCall = wrappedSpy.getCall(0),
        msgRe = new RegExp(helpers.regexifyMessage(msgOps.commands.newgame.msgs.game_exists));

    expect(msgRe.test(spyCall.args[0])).to.be.true;
    expect(msgOps.getGameState(context.room.id).currentOpenGame).to.be.true;
  });
});