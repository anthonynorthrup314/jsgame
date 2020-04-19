import { Color, Colors } from "./Color";

export class Game {
    private root: HTMLDivElement;
    private canvas: HTMLCanvasElement;
    private _ctx: CanvasRenderingContext2D;
    public get ctx() {
        return this._ctx;
    }

    // Game size info
    public get width(): number { return this.canvas.width; }
    public get height(): number { return this.canvas.height; }

    // Timing info
    private frameRequest?: number;
    private frameTime: number;
    private frameDelta: number;

    // Game info
    private _input: InputManager;
    public get input() {
        return this._input;
    }
    private running: boolean;
    private items: Item[];

    constructor(elementId?: string) {
        // Setup canvas
        this.createElements(elementId);
        this._ctx = this.canvas.getContext("2d");

        // Setup resize listener
        window.addEventListener("resize", this.resize.bind(this));

        // Setup input manager
        this._input = new InputManager(this.canvas);

        // Timing
        this.frameRequest = undefined;
        this.frameTime = window.performance.now();
        this.frameDelta = 0.0;

        // Actual game
        this.running = false;
        this.items = new Array<Item>();
    }

    private createElements(elementId: string): void {
        // Find/create root
        if (elementId === undefined) {
            // Create a new element if no ID specified
            this.root = document.createElement("div");
            document.body.appendChild(this.root);
        } else {
            // Search for the specified ID
            const root: HTMLElement = document.getElementById(elementId);
            if (root === null) {
                throw new DOMException(`Could not find element '${elementId}'`);
            } else if (root instanceof HTMLDivElement) {
                // Found and correct type
                this.root = (root as HTMLDivElement);
            } else {
                throw new DOMException("Target element wasn't a DIV");
            }
        }
        // Add class to root
        this.root.classList.add("JSGame");

        // Create canvas and add to root
        this.canvas = document.createElement("canvas");
        this.root.appendChild(this.canvas);
    }

    private resize(): void {
        // Get size available
        const width: number = Math.max(10, window.innerWidth - 10);
        const height: number = Math.max(10, window.innerHeight - 10);

        // Save image
        const imagedata = this.ctx.getImageData(0, 0, this.width, this.height);

        // Resize canvas
        this.canvas.width = width;
        this.canvas.height = height;

        // Restore image
        this.ctx.putImageData(imagedata, 0, 0);
    }

    public run(): void {
        // Resize the canvas to fit the window
        this.resize();

        // Creation event
        for (const item of this.items) {
            item.create();
            if (item.creation_code)
                item.creation_code(item);
        }

        // Setup tick
        this.frameTime = performance.now();
        this.frameRequest = requestAnimationFrame(this.tick.bind(this));
    }

    private tick(): void {
        // Calculate delta time
        const time = window.performance.now();
        const delta = (time - this.frameTime) * 0.001;
        this.frameTime = time;

        // Limit to 60 FPS
        const sixtieth = 1.0 / 60.0;
        this.frameDelta = Math.min(this.frameDelta + delta, 4 * sixtieth);
        while (this.frameDelta >= sixtieth) {
            this.update();
            this.frameDelta -= sixtieth;
        }

        // Draw
        this.draw();

        // Request next frame
        this.frameRequest = requestAnimationFrame(this.tick.bind(this));
    }

    private update(): void {
        this.input.step();

        // step_begin -> step -> step_end
        for (const item of this.items)
            if (item.is_alive)
                item.step_begin();
        for (const item of this.items)
            if (item.is_alive)
                item.step();
        for (const item of this.items)
            if (item.is_alive)
                item.step_end();

        // Remove any dead items
        let length = this.items.length;
        for (let i = 0; i < length; i++)
            if (!this.items[i].is_alive) {
                this.items[i].destroy();
                this.items.splice(i, 1);
                i--;
                length--;
            }
    }

    private draw(): void {
        // Clear the screen
        this._ctx.save();
        this._ctx.fillStyle = "darkgreen";
        this._ctx.fillRect(0, 0, this.width, this.height);
        this._ctx.restore();

        // Prepare for drawing
        this.ctx.save();

        // Draw all the items, sorted by depth
        const sorted = Helpers.sort_by_depth(this.items);
        for (const item of sorted)
            if (item.visible)
                item.draw_begin();
        for (const item of sorted)
            if (item.visible)
                item.draw();
        for (const item of sorted)
            if (item.visible)
                item.draw_end();

        // Cleanup drawing
        this.ctx.restore();
    }

    public instance_add<T extends Item>(cls: new (game: Game, creationCode?: (self: T) => void) => T, x: number, y: number, creationCode?: (self: T) => void): T {
        if (this.running)
            throw new Error("Can not add instance after starting, use instance_create instead");
        const item = new cls(this, creationCode);
        item.x = x;
        item.y = y;
        this.items.push(item);
        return item;
    }
    public instance_create<T extends Item>(cls: new (game: Game, creationCode?: (self: T) => void) => T, x: number, y: number): T {
        const item = new cls(this);
        item.x = x;
        item.y = y;
        this.items.push(item);
        item.create();
        return item;
    }

    public get_by_id<T extends Item>(id: number): T {
        let L = 0;
        let R = this.items.length - 1;

        // Binary search for ID
        while (L <= R) {
            const m = (L + R) * 0.5;
            const item = this.items[m];

            if (item.id < id)
                L = m + 1;
            else if (item.id > id)
                R = m - 1;
            else // item.id === id
                return item as T;
        }
        return null;
    }

    public position_empty(x: number, y: number): boolean {
        for (const other of this.items)
            if (other.contains_point(x, y))
                return false;
        return true;
    }
    public position_meeting<T extends Item>(x: number, y: number, cls: new (game: Game, creationCode?: (self: T) => void) => T): boolean {
        for (const other of this.items)
            if (other instanceof cls)
                if (other.contains_point(x, y))
                    return false;
        return true;
    }
    public place_empty<T extends Item>(item: T, x: number, y: number): boolean {
        for (const other of this.items)
            if (item.id !== other.id && item.is_colliding_at(other, x, y))
                return false;
        return true;
    }
    public place_meeting<T1 extends Item, T2 extends Item>(item: T1, x: number, y: number, cls: new (game: Game, creationCode?: (self: T2) => void) => T2): boolean {
        for (const other of this.items)
            if (other instanceof cls)
                if (item.id !== other.id && item.is_colliding_at(other, x, y))
                    return true;
        return false;
    }
}

export class Item {
    protected game: Game;
    private static nextID: number = 1;
    private _id: number;
    public get id() {
        return this._id;
    }
    private _isAlive: boolean;
    public get is_alive() {
        return this._isAlive;
    }
    public x: number;
    private _xPrev: number;
    public get x_prev() {
        return this._xPrev;
    }
    public y: number;
    private _yPrev: number;
    public get y_prev() {
        return this._yPrev;
    }
    public width: number;
    public height: number;
    public color: Color;
    // tslint:disable-next-line: variable-name
    public is_circle: boolean;
    public visible: boolean;
    public depth: number;
    private _creationCode?: (self: Item) => void;
    public get creation_code() {
        return this._creationCode;
    }

    constructor(game: Game, creationCode?: (self: Item) => void) {
        this.game = game;
        this._id = Item.nextID++;
        this._isAlive = true;
        this.x = 0;
        this._xPrev = 0;
        this.y = 0;
        this._yPrev = 0;
        this.width = 0;
        this.height = 0;
        this.color = Colors.c_black;
        this.is_circle = false;
        this.visible = true;
        this.depth = 0;
        this._creationCode = creationCode;
    }

    // tslint:disable-next-line: no-empty
    public create(): void { }
    // tslint:disable-next-line: no-empty
    public destroy(): void { }
    // tslint:disable-next-line: no-empty
    public step(): void { }
    public step_begin(): void {
        this._xPrev = this.x;
        this._yPrev = this.y;
    }
    // tslint:disable-next-line: no-empty
    public step_end(): void { }
    public draw(): void {
        this.draw_self();
    }
    // tslint:disable-next-line: no-empty
    public draw_begin(): void { }
    // tslint:disable-next-line: no-empty
    public draw_end(): void { }

    protected draw_self(): void {
        this.game.ctx.fillStyle = this.color.as_string;
        if (this.is_circle) {
            this.game.ctx.beginPath();
            this.game.ctx.arc(this.x + this.width * 0.5, this.y + this.width * 0.5, this.width * 0.5, 0, 2 * Math.PI, true);
            this.game.ctx.fill();
        } else
            this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    public instance_destroy(): void {
        this._isAlive = false;
    }
    public contains_point(x: number, y: number): boolean {
        if (this.is_circle)
            return Collisions.circle_point(this.x + this.width * 0.5, this.y + this.width * 0.5, this.width * 0.5, x, y);
        return Collisions.point_rect(x, y, this.x, this.y, this.width, this.height);
    }
    public is_colliding_at(other: Item, x: number, y: number): boolean {
        if (this.is_circle)
            if (other.is_circle)
                return Collisions.circle_circle(
                    x + this.width * 0.5, y + this.width * 0.5, this.width * 0.5,
                    other.x + other.width * 0.5, other.y + other.width * 0.5, other.width * 0.5
                );
            else
                return Collisions.circle_rect(
                    x + this.width * 0.5, y + this.width * 0.5, this.width * 0.5,
                    other.x, other.y, other.width, other.height
                );
        else
            if (other.is_circle)
                return Collisions.circle_rect(
                    other.x + other.width * 0.5, other.y + other.width * 0.5, other.width * 0.5,
                    x, y, this.width, this.height
                );
            else
                return Collisions.rect_rect(
                    x, y, this.width, this.height,
                    other.x, other.y, other.width, other.height
                );
    }
}

class Helpers {
    private constructor() { }

    public static sort_by_depth(items: Item[]): Item[] {
        if (items.length === 0)
            return new Array<Item>();

        const result = new Array<Item>();
        let lowest = items[0].depth;
        let highest = items[0].depth;
        const map = new Map<number, Item[]>();

        // Split into arrays of equal depth
        for (const item of items) {
            const depth = item.depth;
            lowest = (depth < lowest) ? depth : lowest;
            highest = (depth > highest) ? depth : highest;
            if (!map.has(depth))
                map.set(depth, new Array<Item>());
            map.get(depth).push(item);
        }

        // Concat in reverse depth order
        for (let i = highest; i >= lowest; i--)
            if (map.has(i))
                for (const item of map.get(i))
                    result.push(item);

        return result;
    }
}

export class Collisions {
    private constructor() { }

    public static circle_circle(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy <= (r1 + r2) * (r1 + r2);
    }
    public static circle_point(x1: number, y1: number, r1: number, x2: number, y2: number): boolean {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy <= r1 * r1;
    }
    public static circle_rect(x1: number, y1: number, r1: number, x2: number, y2: number, w2: number, h2: number): boolean {
        // Voronoi Regions (modified)
        if (x1 <= x2) { // Left
            if (y1 <= y2) // Top left
                return this.circle_point(x2, y2, r1, x1, y1);
            else if (y1 >= y2 + h2) // Bottom left
                return this.circle_point(x2, y2 + h2, r1, x1, y1);
            else // Center left
                return x1 + r1 >= x2;
        } else if (x1 >= x2 + w2) { // Right
            if (y1 <= y2) // Top right
                return this.circle_point(x2 + w2, y2, r1, x1, y1);
            else if (y1 >= y2 + h2) // Bottom right
                return this.circle_point(x2 + w2, y2 + h2, r1, x1, y1);
            else // Center right
                return x1 - r1 <= x2 + w2;
        } else // Middle
            return y1 + r1 >= y2 && y1 - r1 <= y2 + h2;
    }
    public static point_point(x1: number, y1: number, x2: number, y2: number): boolean {
        return x1 === x2 && y1 === y2;
    }
    public static point_rect(x1: number, y1: number, x2: number, y2: number, w2: number, h2: number): boolean {
        return x1 >= x2 && x1 <= x2 + w2 && y1 >= y2 && y1 <= y2 + h2;
    }
    public static rect_rect(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
        // Calculate bounds
        const xmin = Math.min(x1, x2);
        const xmax = Math.max(x1 + w1, x2 + w2);
        const ymin = Math.min(y1, y2);
        const ymax = Math.max(y1 + h1, y2 + h2);

        // Separating Axis Theorem (modified)
        return (xmax - xmin <= w1 + w2) && (ymax - ymin <= h1 + h2);
    }
}

export class InputManager {
    private canvas: HTMLCanvasElement;

    private keys: Map<number, boolean>;
    private keysPrev: Map<number, boolean>;
    // tslint:disable-next-line: variable-name
    public keyboard_string: string;

    private buttons: Map<number, boolean>;
    private buttonsPrev: Map<number, boolean>;

    private _mouseX: number;
    public get mouse_x() {
        return this._mouseX;
    }
    private _mouseY: number;
    public get mouse_y() {
        return this._mouseY;
    }
    private mouseWheel: number;
    private mouseWheelStep: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.keys = new Map<number, boolean>();
        this.keysPrev = new Map<number, boolean>();
        this.keyboard_string = "";
        this.buttons = new Map<number, boolean>();
        this.buttonsPrev = new Map<number, boolean>();
        this._mouseX = 0;
        this._mouseY = 0;
        this.mouseWheel = 0;
        this.mouseWheelStep = 0;

        document.addEventListener("keydown", this.key_down.bind(this));
        document.addEventListener("keyup", this.key_up.bind(this));
        document.addEventListener("focusout", this.focus_out.bind(this));
        document.addEventListener("mousedown", this.mouse_down.bind(this));
        document.addEventListener("mouseup", this.mouse_up.bind(this));
        document.addEventListener("mosuemove", this.mouse_move.bind(this));
        document.addEventListener("mouseleave", this.mouse_leave.bind(this));
        document.addEventListener("contextmenu", this.context_menu.bind(this));
        document.addEventListener("wheel", this.wheel.bind(this));
    }

    private key_down(ev: KeyboardEvent): boolean {
        this.keys.set(ev.keyCode, true);
        ev.preventDefault();
        return false;
    }
    private key_up(ev: KeyboardEvent): boolean {
        // Keyboard string
        if (ev.key.length === 1)
            this.keyboard_string += ev.key;
        else if (ev.key === "Backspace")
            this.keyboard_string = this.keyboard_string.substring(0, Math.max(0, this.keyboard_string.length - 1));
        else if (ev.key === "Enter")
            this.keyboard_string += "\n";

        // Usual handling
        this.keys.set(ev.keyCode, false);
        ev.preventDefault();

        return false;
    }
    private focus_out(ev: FocusEvent): boolean {
        // Clear all IO
        this.keys.forEach((_, key) => this.keys.set(key, false));
        this.buttons.forEach((_, key) => this.buttons.set(key, false));

        ev.preventDefault();

        return false;
    }
    private mouse_down(ev: MouseEvent): boolean {
        this.keys.set(ev.button, true);
        ev.preventDefault();
        return false;
    }
    private mouse_up(ev: MouseEvent): boolean {
        this.keys.set(ev.button, false);
        ev.preventDefault();
        return false;
    }
    private mouse_move(ev: MouseEvent): boolean {
        const rect = this.canvas.getBoundingClientRect();
        this._mouseX = ev.clientX - rect.left;
        this._mouseY = ev.clientY - rect.top;
        ev.preventDefault();
        return false;
    }
    private mouse_leave(ev: MouseEvent): boolean {
        // Clear all buttons
        this.buttons.forEach((_, key) => this.buttons.set(key, false));
        ev.preventDefault();
        return false;
    }
    private context_menu(ev: MouseEvent): boolean {
        ev.preventDefault();
        return false;
    }
    private wheel(ev: MouseWheelEvent): boolean {
        this.mouseWheel += ev.deltaY;
        ev.preventDefault();
        return false;
    }

    public step(): void {
        // Update keys
        this.keysPrev.clear();
        this.keys.forEach((value, key) => this.keysPrev.set(key, value));

        // Update buttons
        this.buttonsPrev.clear();
        this.buttons.forEach((value, key) => this.buttonsPrev.set(key, value));

        // Update scroll wheel
        this.mouseWheelStep = this.mouseWheel;
        this.mouseWheel = 0;
    }

    public keyboard_check(key: number): boolean {
        if (key === Constants.vk_nokey || key === Constants.vk_anykey) {
            const goal: boolean = key === Constants.vk_anykey;
            let allMatched = true;
            this.keys.forEach(value => allMatched = allMatched && value === goal);
            return allMatched;
        }
        return this.keys.get(key) === true;
    }
    public keyboard_check_pressed(key: number): boolean {
        if (key === Constants.vk_nokey || key === Constants.vk_anykey) {
            let somethingPressed = false;
            this.keys.forEach((value, k) => somethingPressed = somethingPressed || (value && this.keysPrev.get(k) !== true));
            if (somethingPressed)
                return key === Constants.vk_anykey;
            return key === Constants.vk_nokey;
        }
        return this.keys.get(key) === true && this.keysPrev.get(key) !== true;
    }
    public keyboard_check_released(key: number): boolean {
        if (key === Constants.vk_nokey || key === Constants.vk_anykey) {
            let somethingReleased = false;
            this.keys.forEach((value, k) => somethingReleased = somethingReleased || (!value && this.keysPrev.get(k) === true));
            if (somethingReleased)
                return key === Constants.vk_anykey;
            return key === Constants.vk_nokey;
        }
        return this.keys.get(key) !== true && this.keysPrev.get(key) === true;
    }

    public mouse_check_button(numb: number): boolean {
        if (numb === Constants.mb_none || numb === Constants.mb_any) {
            const goal: boolean = numb === Constants.mb_any;
            let allMatched = true;
            this.buttons.forEach(value => allMatched = allMatched && value === goal);
            return allMatched;
        }
        return this.buttons.get(numb) === true;
    }
    public mouse_check_button_pressed(numb: number): boolean {
        if (numb === Constants.mb_none || numb === Constants.mb_any) {
            let somethingPressed = false;
            this.buttons.forEach((value, k) => somethingPressed = somethingPressed || (value && this.buttonsPrev.get(k) !== true));
            if (somethingPressed)
                return numb === Constants.mb_any;
            return numb === Constants.mb_none;
        }
        return this.buttons.get(numb) === true && this.buttonsPrev.get(numb) !== true;
    }
    public mouse_check_button_released(numb: number): boolean {
        if (numb === Constants.mb_none || numb === Constants.mb_any) {
            let somethingReleased = false;
            this.buttons.forEach((value, k) => somethingReleased = somethingReleased || (!value && this.buttonsPrev.get(k) === true));
            if (somethingReleased)
                return numb === Constants.mb_any;
            return numb === Constants.mb_none;
        }
        return this.buttons.get(numb) !== true && this.buttonsPrev.get(numb) === true;
    }

    public mouse_wheel_up(): boolean {
        return this.mouseWheelStep < 0;
    }
    public mouse_wheel_down(): boolean {
        return this.mouseWheelStep > 0;
    }
}

export function ord(letter: string): number {
    return letter.length > 0 ? letter.charCodeAt(0) : Constants.vk_nokey;
}

// tslint:disable: variable-name
export class Constants {
    private constructor() { }

    public static readonly vk_nokey: number = -2;
    public static readonly vk_anykey: number = -1;
    public static readonly vk_left: number = 37;
    public static readonly vk_right: number = 39;
    public static readonly vk_up: number = 38;
    public static readonly vk_down: number = 40;
    public static readonly vk_enter: number = 13;
    public static readonly vk_escape: number = 27;
    public static readonly vk_space: number = 32;
    public static readonly vk_shift: number = 16;
    public static readonly vk_control: number = 17;
    public static readonly vk_alt: number = 18;
    public static readonly vk_backspace: number = 8;
    public static readonly vk_tab: number = 9;
    public static readonly vk_home: number = 36;
    public static readonly vk_end: number = 35;
    public static readonly vk_delete: number = 46;
    public static readonly vk_insert: number = 45;
    public static readonly vk_pageup: number = 33;
    public static readonly vk_pagedown: number = 34;
    public static readonly vk_pause: number = 19;
    // vk_printscreen unsupported
    public static readonly vk_f1: number = 112;
    public static readonly vk_f2: number = 113;
    public static readonly vk_f3: number = 114;
    public static readonly vk_f4: number = 115;
    public static readonly vk_f5: number = 116;
    public static readonly vk_f6: number = 117;
    public static readonly vk_f7: number = 118;
    public static readonly vk_f8: number = 119;
    public static readonly vk_f9: number = 120;
    public static readonly vk_f10: number = 121;
    public static readonly vk_f11: number = 122;
    public static readonly vk_f12: number = 123;
    public static readonly vk_numpad0: number = 96;
    public static readonly vk_numpad1: number = 97;
    public static readonly vk_numpad2: number = 98;
    public static readonly vk_numpad3: number = 99;
    public static readonly vk_numpad4: number = 100;
    public static readonly vk_numpad5: number = 101;
    public static readonly vk_numpad6: number = 102;
    public static readonly vk_numpad7: number = 103;
    public static readonly vk_numpad8: number = 104;
    public static readonly vk_numpad9: number = 105;
    public static readonly vk_multiply: number = 106;
    public static readonly vk_divide: number = 111;
    public static readonly vk_add: number = 107;
    public static readonly vk_subtract: number = 109;
    public static readonly vk_decimal: number = 110;

    public static readonly mb_none: number = -2;
    public static readonly mb_any: number = -1;
    public static readonly mb_left: number = 0;
    public static readonly mb_middle: number = 1;
    public static readonly mb_right: number = 2;
}
// tslint:enable: variable-name