/// <reference path="JSGame/scripts/Game.ts"/>
/// <reference path="JSGame/scripts/Color.ts"/>

class MovingBlock extends JSGame.Item {
    public hspeed: number;
    public vspeed: number;

    constructor(game: JSGame.Game, creation_code?: (self: MovingBlock) => void) {
        super(game, creation_code);
        this.width = 100;
        this.height = 100;
        this.hspeed = 0;
        this.vspeed = 0;
    }

    public create(): void {
        super.create();
        this.hspeed = 5;
        this.vspeed = 2;
        this.color = JSGame.Color.random();
    }
    public step(): void {
        super.step();
        this.x += this.hspeed;
        this.y += this.vspeed;
        let swapH = (this.hspeed > 0 && this.x + this.width > this.game.width) || (this.hspeed < 0 && this.x < 0),
            swapV = (this.vspeed > 0 && this.y + this.height > this.game.height) || (this.vspeed < 0 && this.y < 0);
        if (swapH || swapV) {
            this.instance_destroy();
            let bounced = this.game.instance_create(MovingBlock, this.x, this.y);
            bounced.hspeed = swapH ? -this.hspeed : this.hspeed;
            bounced.vspeed = swapV ? -this.vspeed : this.vspeed;
        }
    }
}
class MovingCircle extends MovingBlock {
    constructor(game: JSGame.Game, creation_code?: (self: MovingCircle) => void) {
        super(game, creation_code);
        this.width = 50;
        this.is_circle = true;
    }

    public create(): void {
        super.create();
        this.hspeed = 10;
        this.vspeed = 10;
    }
    public step(): void {
        let swapH = false,
            swapV = false;
        if (this.game.place_meeting(this, this.x + this.hspeed, this.y + this.vspeed, MovingBlock)) {
            swapH = true;
            swapV = true;
        } else {
            this.x += this.hspeed;
            this.y += this.vspeed;
        }
        swapH = swapH ? true : (this.hspeed > 0 && this.x + this.width > this.game.width) || (this.hspeed < 0 && this.x < 0);
        swapV = swapV ? true : (this.vspeed > 0 && this.y + this.width > this.game.height) || (this.vspeed < 0 && this.y < 0);
        if (swapH || swapV) {
            this.instance_destroy();
            let bounced = this.game.instance_create(MovingCircle, this.x, this.y);
            bounced.hspeed = swapH ? -this.hspeed : this.hspeed;
            bounced.vspeed = swapV ? -this.vspeed : this.vspeed;
        }
    }
}
class Person extends JSGame.Item {
    public speed: number;

    constructor(game: JSGame.Game, creation_code?: (self: Person) => void) {
        super(game, creation_code);
        this.width = 50;
        this.height = 50;
        this.color = JSGame.Colors.c_red;
        this.speed = 0;
    }

    public create(): void {
        super.create();
        this.speed = 5;
    }
    public step(): void {
        let lr = +this.game.input.keyboard_check(JSGame.ord('D')) - +this.game.input.keyboard_check(JSGame.ord('A')),
            ud = +this.game.input.keyboard_check(JSGame.ord('S')) - +this.game.input.keyboard_check(JSGame.ord('W'));
        this.x = Math.max(0, Math.min(this.x + this.speed * lr, this.game.width - this.width));
        this.y = Math.max(0, Math.min(this.y + this.speed * ud, this.game.height - this.height));
    }
}

window.addEventListener("load", (_) => {
    let game: JSGame.Game = new JSGame.Game();
    game.instance_add(MovingBlock, 0, 0, function(self: MovingBlock) {
        self.x = (game.width - self.width) * 0.5;
        self.y = (game.height - self.height) * 0.5;
    });
    game.instance_add(MovingCircle, 0, 0);
    game.instance_add(Person, 0, 0);
    game.run();
});