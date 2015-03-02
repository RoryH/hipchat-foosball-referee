describe('Message Operations (lib/msg_operations) API', function() {
  var msgOps = require('../lib/msg_operations'),
      expect = require('chai').expect,
      helpers = require('./test_helpers');

  before(function() {});

  it ('should expose expected API', function() {
    expect(msgOps.commands).to.be.a.object;
    expect(msgOps.getGameState).to.be.a.function;
    expect(msgOps.getGameState).to.be.a.object;
    expect(helpers.getDummyApi).to.be.a.function;
    expect(helpers.getDummyApi()).to.be.a.object;
  });
});