describe('Message Operations (lib/msg_operations) --y command', function() {
  var msgOps = require('../lib/msg_operations'),
      sinon = require('sinon-es6'),
      expect = require('chai').expect,
      _ = require('lodash'),
      helpers = require('./test_helpers'),
      context,
      wrappedSpy;

  before(function() {
    context = _.clone(helpers.getDummyApi());
  });

  beforeEach(function() {
    msgOps.resetGameState(context.room.id);
    wrappedSpy = sinon.spy();
    context.roomClient.sendNotification = function* () { wrappedSpy.apply(this, arguments); };
    var gs = msgOps.getGameState(context.room.id);
    gs.currentOpenGame = true;
    gs.currentPlayers.push(helpers.getUserNotInGame(gs));
  });

  it ('should add user to the existing game', function*() {
    var msg = '--y',
        cmdMatch = _.find(msgOps.commands, function(cmd) {
          return cmd.regex.test(msg);
        }),
        matches = msg.match(cmdMatch.regex);

    context.sender = helpers.getUserNotInGame(msgOps.getGameState(context.room.id));

    yield cmdMatch.handler.apply(context, matches.slice(1));

    expect(wrappedSpy.called).to.be.true;

    var spyCall = wrappedSpy.getCall(0),
        msgRe = new RegExp(helpers.regexifyMessage(msgOps.commands.joingame.msgs.player_added_self));

    expect(msgRe.test(spyCall.args[0])).to.be.true;
    expect(_.contains(_.pluck(msgOps.getGameState(context.room.id).currentPlayers, 'id'), context.sender.id)).to.be.true;
    expect(msgOps.getGameState(context.room.id).currentPlayers).to.have.length(2);
  });

  it ('should tell the user they are already in the game', function*() {
    var msg = '--y',
        cmdMatch = _.find(msgOps.commands, function(cmd) {
          return cmd.regex.test(msg);
        }),
        matches = msg.match(cmdMatch.regex);

    context.sender = helpers.getUserInGame(msgOps.getGameState(context.room.id));

    yield cmdMatch.handler.apply(context, matches.slice(1));

    expect(wrappedSpy.called).to.be.true;

    var spyCall = wrappedSpy.getCall(0),
        msgRe = new RegExp(helpers.regexifyMessage(msgOps.commands.joingame.msgs.already_in_game));

    expect(msgRe.test(spyCall.args[0])).to.be.true;
    expect(_.contains(_.pluck(msgOps.getGameState(context.room.id).currentPlayers, 'id'), context.sender.id)).to.be.true;
    expect(msgOps.getGameState(context.room.id).currentPlayers).to.have.length(1);
  });

  it ('should allow a user in the game add another room member', function*() {
    var addingUser = helpers.getUserNotInGame(context.room.id),
        msg = '--y @' + addingUser.mention_name,
        cmdMatch = _.find(msgOps.commands, function(cmd) {
          return cmd.regex.test(msg);
        }),
        matches = msg.match(cmdMatch.regex);

    context.sender = helpers.getUserInGame(msgOps.getGameState(context.room.id));

    yield cmdMatch.handler.apply(context, matches.slice(1));

    expect(wrappedSpy.called).to.be.true;

    var spyCall = wrappedSpy.getCall(0),
        msgRe = new RegExp(helpers.regexifyMessage(msgOps.commands.joingame.msgs.player_added));

    expect(msgRe.test(spyCall.args[0])).to.be.true;
    expect(_.contains(_.pluck(msgOps.getGameState(context.room.id).currentPlayers, 'id'), addingUser.id)).to.be.true;
    expect(msgOps.getGameState(context.room.id).currentPlayers).to.have.length(2);
  });

});