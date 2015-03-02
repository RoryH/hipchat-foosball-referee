describe('Message Operations (lib/msg_operations) --help command', function() {
  var msgOps = require('../lib/msg_operations'),
      sinon = require('sinon-es6'),
      expect = require('chai').expect,
      _ = require('lodash'),
      helpers = require('./test_helpers');

  before(function() {});

  it ('should output help message', function*() {
    var msg = '--help',
        cmdMatch = _.find(msgOps.commands, function(cmd) {
          return cmd.regex.test(msg);
        }),
        matches = msg.match(cmdMatch.regex),
        context = _.clone(helpers.getDummyApi()),
        wrappedSpy = sinon.spy();

    context.roomClient.sendNotification = function* () { wrappedSpy.apply(this, arguments); };
    //cmdMatch.handler.apply(this, matches.slice(1));

    yield cmdMatch.handler.apply(context, matches.slice(1));

    expect(wrappedSpy.called).to.be.true;

    var spyCall = wrappedSpy.getCall(0);
    expect(/Foosball referee, available commands./.test(spyCall.args[0])).to.be.true;

  });
});