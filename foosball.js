var ack = require('ac-koa').require('hipchat'),
	pkg = require('./package.json'),
	app = ack(pkg),
	_ = require("lodash");

var addon = app.addon()
	  .hipchat()
	  .allowRoom(true)
	  .scopes('send_notification'),
	currentPlayers = [],
	currentOpenGame = false,
	sendOptions = { format: 'text' };
	

	addon.webhook('room_message', /^--.+/, function *() {
		console.log(this.content);
		var msg = this.content;
		if (/^--new$/i.test(msg)) {
			if (!currentOpenGame) {
				currentPlayers = [];
				currentOpenGame = true;
				currentPlayers.push(this.sender);
				yield this.roomClient.sendNotification('@here ' + this.sender.name + ' just started a new game. Message "--Y" to join the game.', sendOptions);
			} else {
				yield this.roomClient.sendNotification('@' + this.sender.mention_name + ' there is already an open game waiting for ' + (4 - currentPlayers.length) + 'player(s), use --hard-new command to force a new game. Use --y to join the game.', sendOptions);
			}
		}
		if (/^--hard-new$/i.test(msg)) {
			currentPlayers = [];
			currentPlayers.push(this.sender);
			currentOpenGame = true;
			yield this.roomClient.sendNotification('@here ' + this.sender.name + ' just forced a new game. Message "--Y" to join the game.', sendOptions);
		}
		if (/^(?:--y|y|\+1)$/i.test(msg)) {
			var self = this;
			if (!currentOpenGame) {
				yield this.roomClient.sendNotification('@' + this.sender.mention_name + ' There is no open game, use "--new" to begin a new game.', sendOptions);
			} else {
				if (currentPlayers.length > 0 && currentPlayers.filter(function(i) { return i.id === self.sender.id; }).length > 0) {
					yield this.roomClient.sendNotification("@" + this.sender.mention_name + " ..you're already signed up for the current game.");
					return;
				}
				currentPlayers.push(this.sender);
				if (currentPlayers.length == 4) {
					var players = currentPlayers.map(function(i) { return '@' + i.mention_name; });
					players.sort(function() {return .5 - Math.random();});
					currentPlayers = [];
					currentOpenGame = false;
					yield this.roomClient.sendNotification('Game On!  ' + players.slice(0,2).join(" & ") + " - Vs - " + players.slice(2,4).join(" & "), _.extend({ color:'green' }, sendOptions));
				} else {
					yield this.roomClient.sendNotification('@' + this.sender.mention_name + ', you are now in the game. Waiting on ' + (4 - currentPlayers.length) + " player(s)", sendOptions);	
				}
			}
		}
		if (/^--n$/i.test(msg)) {
			var self = this;
			if (currentOpenGame) {
				for (var i=0; i < currentPlayers.length; i++) {
					if (currentPlayers[i].id === this.sender.id) {
						console.log("Removing player: " + this.sender.name);
						currentPlayers.splice(i,1);
						if (currentPlayers.length >= 1) {
							yield this.roomClient.sendNotification('@' + this.sender.mention_name + ', you are now REMOVED from the game.', sendOptions);
						} else {
							yield this.roomClient.sendNotification('@' + this.sender.mention_name + ', you are now REMOVED from the game. There are no other players, Game closed.', sendOptions);
							currentOpenGame = false;
						}
						break;
					}
				}
			}
		}
		if (/^--status$/i.test(msg)) {
			if (!currentOpenGame) {
				yield this.roomClient.sendNotification("No current game.");
			} else {
				var playersStr = currentPlayers.map(function(i) { return i.name;  }).join(", ");
				yield this.roomClient.sendNotification("Game currently needs " + (4 - currentPlayers.length) + " more player. Players in are: " + playersStr, sendOptions);
			}
		}
		if (/^--help$/i.test(msg)) {
			var helpMsg = "Foosball referee, available commands.\n";
			helpMsg += "--new     Begins a new game\n";
			helpMsg += "--hard-new   Forces new game to reset current state\n";
			helpMsg += "--y       Joins an open game\n";
			helpMsg += "--n       Removes user from current game if you previously joined.\n";
			helpMsg += "--status  Status of current game being organised.\n";
			helpMsg += "--help    This message!";
			yield this.roomClient.sendNotification(helpMsg, sendOptions);
		}
	});

app.listen();
