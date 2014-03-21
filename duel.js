var directions = ["north", "northwest", "west", "southwest", "south", "southeeast", "east", "northeast"];
var xvelocity = [0, 1, 1.4, 1, 0, -1, -1.4, -1];
var yvelocity = [-1.4, -1, 0, 1, 1.4, 1, 0, -1];

var duel = (function(duel) {

	duel.load = function() {
		jaws.assets.add("red-dragonfly.png")
		jaws.assets.add("blue-dragonfly.png")
		jaws.assets.add("player1.png")
		jaws.assets.add("bullet.png")
		jaws.assets.add("player2.png")
		jaws.assets.add("explode.png")
		jaws.assets.add("bomb2.png")
		jaws.assets.add("bomb-timer.png")
	}

	duel.showMenu = function() {
		jaws.start(MenuState, {
			fps : 30,
			width : 1024,
			height : 768
		})
	}

	duel.showShow = function() {
		jaws.start(MenuState, {
			fps : 30,
			width : 1024,
			height : 768
		})
	}

	duel.PlayState = function PlayState(options) {
		this.players = new jaws.SpriteList()
		this.gun = options.gun
		this.mineLauncher = options.mineLauncher

		this.setup = function() {
			jaws.on_keydown("esc", function() {
				jaws.switchGameState(MenuState)
			})
			jaws.preventDefaultKeys(["up", "down", "left", "right", "space", "end", "pagedown"])

			this.players.push(new duel.Player({
				gun : this.gun,
				mineLauncher : this.mineLauncher,
				image : 'blue-dragonfly.png',
				x : 50,
				y : 50,
				players : this.players,
				name : "p1"
			}));
			this.players.push(new duel.Player({
				gun : this.gun,
				mineLauncher : this.mineLauncher,
				image : 'red-dragonfly.png',
				x : 250,
				y : 50,
				players : this.players,
				name : "p2"
			}));
			player1 = this.players[1];
			jaws.on_keyup(["left"], function() {
				player1.turnLeft();
			});
			jaws.on_keyup(["right"], function() {
				player1.turnRight();
			});
			jaws.on_keyup(["down"], function() {
				player1.slower();
			});
			jaws.on_keyup(["up"], function() {
				player1.faster();
			});
			jaws.on_keyup(["end"], function() {
				player1.fire();
			});
			jaws.on_keyup(["pagedown"], function() {
				player1.dropMine();
			});
			player0 = this.players[0];
			jaws.on_keyup(["a"], function() {
				player0.turnLeft();
			});
			jaws.on_keyup(["d"], function() {
				player0.turnRight();
			});
			jaws.on_keyup(["s"], function() {
				player0.slower();
			});
			jaws.on_keyup(["w"], function() {
				player0.faster();
			});
			jaws.on_keyup(["v"], function() {
				player0.fire();
			});
			jaws.on_keyup(["b"], function() {
				player0.dropMine();
			});
		}

		this.update = function() {
			this.players.update()
			fps.innerHTML = jaws.game_loop.fps
		}

		this.draw = function() {
			jaws.clear()
			this.players.draw();
		}
	}

	duel.Cannon = function Cannon(options) {
		this.fire = function(player) {
			return new duel.Bullet({
				image : 'bullet.png',
				x : (player.x + player.vx / player.speed * player.width),
				y : (player.y + player.vy / player.speed * player.height),
				vx : (player.vx * 5),
				vy : (player.vy * 5),
				anchor : 'center'
			});
		}
	}

	duel.MissileLauncher = function MissileLauncher(options) {
		this.fire = function(player, target) {
			return new duel.HeatSeeker({
				image : 'bullet.png',
				x : (player.x + player.vx / player.speed * player.width),
				y : (player.y + player.vy / player.speed * player.height),
				vx : (player.vx * (player.speed)),
				vy : (player.vy * (player.speed)),
				anchor : 'center',
				target : target
			});
		}
	}

	duel.MineLauncher = function MineLauncher(options) {
		this.fire = function(player) {
			return new duel.Mine({
				image : 'bomb2.png',
				x : player.x,
				y : player.y,
				frame_size : 16,
				anchor : 'center'
			})
		}
	}

	duel.Player = function Player(options) {
		if(!(this instanceof arguments.callee))
			return new arguments.callee(options);

		this.vx = 0;
		this.vy = -1;
		this.direction = 0;
		this.speed = 1;
		this.name = options.name;
		this.players = options.players;

		this.bullet = null
		this.mine = null;
		options.anchor = 'center'

		this.gun = options.gun
		this.mineLauncher = options.mineLauncher

		jaws.Sprite.call(this, options)

		this.update = function() {
			this.move(this.vx, this.vy);
			if(this.x > jaws.width)
				this.moveTo(0, this.y);
			else if(this.x < 0)
				this.moveTo(jaws.width, this.y)
			if(this.y > jaws.height)
				this.moveTo(this.x, 0)
			else if(this.y < 0)
				this.moveTo(this.x, jaws.height)
			if(this.bullet && this.bullet.isActive()) {
				this.bullet.update()
				if(this.bullet.isLive()) {
					collisions = jaws.collideOneWithMany(this.bullet, this.players)
					collisions.forEach(function(player) {
						player.explode()
					})
					if(collisions.length > 0)
						this.bullet.explode();
				}

				if(this.bullet.isLive()) {
					collisions = jaws.collideOneWithMany(this.bullet, this.players.map(function(element) {
						return element.mine;
					}).filter(function(element) {
						return element != null;
					}));
					collisions.forEach(function(player) {
						player.explode()
					})
					if(collisions.length > 0)
						this.bullet.explode();
				}

			}

			if(this.mine && this.mine.isActive()) {
				this.mine.update();
				if(this.mine.isLive()) {
					collisions = jaws.collideOneWithMany(this.mine, this.players)
					collisions.forEach(function(player) {
						player.explode()
					})
					if(collisions.length > 0)
						this.mine.explode();
				}
			}
		}

		this.turnLeft = function() {
			this.direction--;
			if(this.direction < 0)
				this.direction = 7;

			this.updateVelocity();
			this.rotate(-45);
		}

		this.turnRight = function() {
			this.direction++;
			if(this.direction > 7)
				this.direction = 0;

			this.updateVelocity();
			this.rotate(45);
		}

		this.slower = function() {
			if(this.speed > -6)
				this.speed--;

			this.updateVelocity();
		}

		this.faster = function() {
			if(this.speed < 6)
				this.speed++;

			this.updateVelocity();
		}

		this.updateVelocity = function() {
			this.vx = xvelocity[this.direction] * this.speed;
			this.vy = yvelocity[this.direction] * this.speed;
		}

		this.explode = function() {
			jaws.log("explode " + this, true);
			this.scale(3 / 4);
			if(this.scale_x < .25)
				jaws.switchGameState(MenuState);
		}

		this.fire = function() {
			if(this.bullet && this.bullet.isActive())
				return;

			if(this.vx == 0 && this.vy == 0)
				return;

			var me = this;
			var target = this.players.filter(function(element) {
				return element != me
			}).shift();
			jaws.log(target.toString(), true);
			this.bullet = this.gun.fire(this, target);
		}

		this.dropMine = function() {
			if(this.mine && this.mine.isActive())
				return;

			jaws.log(this.name + " dropped mine", true);

			this.mine = this.mineLauncher.fire(this);
		}

		this.draw = function() {
			jaws.Sprite.prototype.draw.call(this)
			if(this.bullet && this.bullet.isActive())
				this.bullet.draw();
			if(this.mine && this.mine.isActive())
				this.mine.draw();
		}

		this.toString = function() {
			return this.name + " direction " + directions[this.direction] + " vx " + this.vx + " vy " + this.vy + " scale " + this.scale_x;
		}
		
		this.updateVelocity()
	}
	duel.Player.prototype = jaws.Sprite.prototype

	duel.Ammunition = function Ammunition(options) {
		if(!(this instanceof arguments.callee))
			return new arguments.callee(options);

		this.active = true;
		jaws.Sprite.call(this, options)

		this.explode = function() {
			this.active = false;
			jaws.log("explode " + this, true)
		}

		this.isActive = function() {
			return this.active;
		}

		this.isLive = function() {
			return this.active;
		}
	}
	duel.Ammunition.prototype = jaws.Sprite.prototype

	duel.Bullet = function Bullet(options) {
		if(!(this instanceof arguments.callee))
			return new arguments.callee(options);

		this.vx = options.vx;
		this.vy = options.vy;
		duel.Ammunition.call(this, options)

		this.update = function() {
			if(!this.active)
				return;

			this.x += this.vx
			this.y += this.vy
			if(jaws.isOutsideCanvas(this))
				this.active = false;
		}

		this.toString = function() {
			return "bullet x " + this.x + " y " + this.y + " vx " + this.vx + " vy " + this.vy;
		}
		
		jaws.log(this, true);
	}
	duel.Bullet.prototype = duel.Ammunition.prototype

	duel.HeatSeeker = function HeatSeeker(options) {
		if(!(this instanceof arguments.callee))
			return new arguments.callee(options);

		this.deactivationTime = new Date().getTime() + 4000;
		this.vx = options.vx;
		this.vy = options.vy;
		this.target = options.target;
		duel.Ammunition.call(this, options)

		this.update = function() {
			if(!this.active)
				return;

			if(this.target.x < this.x && this.vx > -7)
				this.vx--;
			if(this.target.x > this.x && this.vx < 7)
				this.vx++;

			if(this.target.y < this.y && this.vy > -7)
				this.vy--;
			if(this.target.y > this.y && this.vy < 7)
				this.vy++;

			this.x += this.vx
			this.y += this.vy
			if(new Date().getTime() - this.deactivationTime > 0)
				this.active = false;
		}

		this.toString = function() {
			return "bullet x " + this.x + " y " + this.y + " vx " + this.vx + " vy " + this.vy;
		}
	}
	duel.HeatSeeker.prototype = duel.Ammunition.prototype

	duel.Mine = function Mine(options) {
		this.animation = new jaws.Animation({
			sprite_sheet : "bomb-timer.png",
			frame_size : [16, 16],
			frame_duration : 100
		})
		this.activationTime = new Date().getTime() + 3000;
		options.image = this.animation.next();
		duel.Ammunition.call(this, options)

		this.update = function() {
			this.setImage(this.animation.next());
			if(this.activationTime && new Date().getTime() - this.activationTime > 0)
				this.activate();
		}

		this.isLive = function() {
			return this.active && this.activationTime == null;
		}

		this.activate = function() {
			jaws.log("activating bomb", true);
			this.animation = new jaws.Animation({
				sprite_sheet : "bomb2.png",
				frame_size : [16, 16],
				frame_duration : 100
			})
			this.activationTime = null;
		}
	}
	duel.Mine.prototype = duel.Ammunition.prototype

	return duel;
})(duel || {});
