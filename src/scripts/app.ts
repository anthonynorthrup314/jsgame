import { Color, Colors } from "./JSGame/Color";
import { Game, Item, ord } from "./JSGame/Game";

class MovingBlock extends Item {
    public hspeed: number;
    public vspeed: number;

    constructor(game: Game, creationCode?: (self: MovingBlock) => void) {
        super(game, creationCode);

        this.width = 100;
        this.height = 100;
        this.hspeed = 0;
        this.vspeed = 0;
    }

    public create(): void {
        super.create();

        this.hspeed = 5;
        this.vspeed = 2;
        this.color = Color.random();
    }

    public step(): void {
        super.step();

        // Move
        this.x += this.hspeed;
        this.y += this.vspeed;

        // Bounce off the walls
        let bounced = false;
        if ((this.hspeed > 0 && this.x + this.width > this.game.width) || (this.hspeed < 0 && this.x < 0)) {
            bounced = true;
            this.hspeed *= -1;
        }
        if ((this.vspeed > 0 && this.y + this.height > this.game.height) || (this.vspeed < 0 && this.y < 0)) {
            bounced = true;
            this.vspeed *= -1;
        }

        // Change color when bouncing
        if (bounced)
            this.color = Color.random();

        // Clamp to screen
        this.x = Math.max(0, Math.min(this.x, this.game.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.game.height - this.height));
    }
}
class MovingCircle extends MovingBlock {
    constructor(game: Game, creationCode?: (self: MovingCircle) => void) {
        super(game, creationCode);

        this.width = 50;
        this.height = this.width;
        this.is_circle = true;
    }

    public create(): void {
        super.create();

        this.hspeed = 10;
        this.vspeed = 10;
    }

    public step(): void {
        super.step();

        // Bounce off everything
        const wasColliding = this.game.place_meeting(this, this.x_prev, this.y_prev, Item);
        const swapH = !wasColliding && this.game.place_meeting(this, this.x + this.hspeed, this.y, Item);
        if (swapH)
            this.hspeed *= -1;
        const swapV = !wasColliding && this.game.place_meeting(this, this.x, this.y + this.vspeed, Item);
        if (swapV)
            this.vspeed *= -1;

        // Change the color when bouncing
        if (swapH || swapV)
            this.color = Color.random();
    }
}
class Person extends Item {
    public speed: number;

    constructor(game: Game, creationCode?: (self: Person) => void) {
        super(game, creationCode);

        this.width = 50;
        this.height = 50;
        this.color = Colors.c_red;
        this.speed = 0;
    }

    public create(): void {
        super.create();

        this.speed = 5;
    }
    public step(): void {
        const lr = +this.game.input.keyboard_check(ord('D')) - +this.game.input.keyboard_check(ord('A'));
        this.x = Math.max(0, Math.min(this.x + this.speed * lr, this.game.width - this.width));

        const ud = +this.game.input.keyboard_check(ord('S')) - +this.game.input.keyboard_check(ord('W'));
        this.y = Math.max(0, Math.min(this.y + this.speed * ud, this.game.height - this.height));
    }
}

// Launch the game
(() => {
    // Create the game
    const game: Game = new Game();

    // Add the items
    game.instance_add(MovingBlock, 0, 0, (self: MovingBlock) => {
        self.x = (game.width - self.width) * 0.5;
        self.y = (game.height - self.height) * 0.5;
    });
    game.instance_add(MovingCircle, 0, 0);
    game.instance_add(Person, 0, 0);

    // Start the game
    game.run();
})();