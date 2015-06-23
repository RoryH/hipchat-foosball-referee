var ack = require('ac-koa').require('hipchat'),
  pkg = require('./package.json'),
  app = ack(pkg),
  _ = require('lodash');

var addon = app.addon()
      .hipchat()
      .allowRoom(true)
      .scopes(['send_notification','view_room']),
    msgOps = require('./lib/msg_operations.js');



  addon.webhook('room_message', /^--.+/, function *() {
    var msg = this.content,
        cmdMatch = _.find(msgOps.commands, function(cmd) {
          return cmd.regex.test(msg);
        });

    if (cmdMatch) {
      var matches = msg.match(cmdMatch.regex);
      yield cmdMatch.handler.apply(this, matches.slice(1));
    }
  });

app.listen();
