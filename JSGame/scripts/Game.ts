/// <reference path="./Color.ts" />

if (!window.requestAnimationFrame) {
    let prefixes = ["webkit", "moz", "o", "ms"];
    for (let prefix in prefixes) {
      window.requestAnimationFrame = window.requestAnimationFrame || window[prefix + "RequestAnimationFrame"];
      window.cancelAnimationFrame = window.cancelAnimationFrame || window[prefix + "CancelAnimationFrame"];
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback: FrameRequestCallback) {
        return window.setTimeout(callback, 1000.0 / 60.0);
      };
      window.cancelAnimationFrame = function(requestId: number) {
        window.clearTimeout(requestId);
      };
    }
  }
  if (!window.performance || !window.performance.now)
    window.performance.now = function() {
        return Date.now();
    };

namespace JSGame {
    export class Game {
        private root: HTMLDivElement;
        private canvas: HTMLCanvasElement;
        protected _ctx: CanvasRenderingContext2D;
        public get ctx() {
            return this._ctx;
        }

        // Game size info
        public get width(): number { return this.canvas.width; }
        public get height(): number { return this.canvas.height; }

        // Viewport info
        protected aspectRatio: number | null;
        private _view_xport: number;
        public get view_xport(): number { return this._view_xport; }
        private _view_yport: number;
        public get view_yport(): number { return this._view_yport; }
        private _view_wport: number;
        public get view_wport(): number { return this._view_wport; }
        private _view_hport: number;
        public get view_hport(): number { return this._view_hport; }

        // Timing info
        private frameRequest: number | null;
        private frameTime: number;
        private frameDelta: number;

        // Game info
        private running: boolean;
        private items: Array<Item>;

        constructor(elementId?: string) {
            // Setup canvas
            this.createElements(elementId);
            this._ctx = this.canvas.getContext("2d");

            // Setup resize listener
            window.addEventListener("resize", this.resize.bind(this));

            // Timing
            this.frameRequest = null;
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
            } else {
                // Search for the specified ID
                let root: HTMLElement = document.getElementById(elementId);
                if (root === null) {
                    throw new DOMException(`Could not find element '${elementId}'`);
                } else if (root instanceof HTMLDivElement) {
                    // Found and correct type
                    this.root = <HTMLDivElement>root;
                } else {
                    throw new DOMException("Target element wasn't a DIV");
                }
            }
            // Add class to root
            this.root.classList.add("JSGame");
            // Create canvas and add to root
            this.canvas = document.createElement("canvas");
            this.root.appendChild(this.canvas);
            // Add root to body if created
            if (elementId === undefined) {
                document.body.appendChild(this.root);
            }
        }

        private resize(): void {
            // Get size available
            let width: number = Math.max(10, window.innerWidth - 10),
                height: number = Math.max(10, window.innerHeight - 10);
            
            // Resize canvas
            this.canvas.width = width;
            this.canvas.height = height;

            // Setup viewport
            if (this.aspectRatio === null) {
                // Just use canvas size
                this._view_xport = this._view_yport = 0;
                this._view_wport = width;
                this._view_hport = height;
            } else {
                // Fix the viewport in the middle of the canvas
                let aspectRatio: number = width / height;
                this._view_wport = (aspectRatio > this.aspectRatio) ? this.aspectRatio * height : width;
                this._view_hport = (aspectRatio < this.aspectRatio) ? width / this.aspectRatio : height;
                this._view_xport = width / 2 - this._view_wport / 2;
                this._view_yport = height / 2 - this._view_hport / 2;
            }
        }
        
        public run(): void {
            // Resize the canvas to fit the window
            this.resize();

            // Creation event
            for (let item of this.items) {
                item.create();
                if (item.creation_code)
                    item.creation_code(item);
            }

            // Setup tick
            this.frameTime = performance.now();
            this.frameRequest = requestAnimationFrame(this.tick.bind(this));
        }

        private tick(time: number): void {
             // Calculate delta time
            var time = window.performance.now(),
                delta = (time - this.frameTime) * 0.001;
            this.frameTime = time;

            // Limit to 60 FPS
            var sixtieth = 1.0 / 60.0;
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
            var length = this.items.length,
                i = 0,
                del = function() {
                    this.items[i].destroy();
                    this.items.splice(i, 1);
                    i--;
                    length--;
                }.bind(this);
            for (var i = 0; i < length; i++) {
                if (this.items[i].is_alive)
                this.items[i].step_begin();
                if (!this.items[i].is_alive)
                del();
            }
            for (var i = 0; i < length; i++) {
                if (this.items[i].is_alive)
                this.items[i].step();
                if (!this.items[i].is_alive)
                del();
            }
            for (var i = 0; i < length; i++) {
                if (this.items[i].is_alive)
                this.items[i].step_end();
                if (!this.items[i].is_alive)
                del();
            }
            // Clean up
            length = this.items.length;
            for (var i = 0; i < length; i++)
                if (!this.items[i].is_alive)
                del();
        }

        private draw(): void {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.save();

            // Draw viewport
            this._ctx.save();
            this._ctx.fillStyle = (this.aspectRatio !== null) ? "darkgreen" : "darkred";
            this._ctx.fillRect(this.view_xport, this.view_yport, this.view_wport, this.view_hport);
            this._ctx.restore();

            var sorted = Helpers.sort_by_depth(this.items);
            for (var item of sorted)
                if (item.visible)
                item.draw_begin();
            for (var item of sorted)
                if (item.visible)
                item.draw();
            for (var item of sorted)
                if (item.visible)
                item.draw_end();

            this.ctx.restore();
        }

        public instance_add<T extends Item>(cls: new (game: Game, creation_code?: (self: T) => void) => T, x: number, y: number, creation_code?: (self: T) => void): T {
            if (this.running)
                throw new Error("Can not add instance after starting, use instance_create instead");
            var item = new cls(this, creation_code);
            item.x = x;
            item.y = y;
            this.items.push(item);
            return item;
        }
        public instance_create<T extends Item>(cls: new (game: Game, creation_code?: (self: T) => void) => T, x: number, y: number): T {
            var item = new cls(this);
            item.x = x;
            item.y = y;
            this.items.push(item);
            item.create();
            return item;
        }

        public get_by_id<T extends Item>(id: number): T {
            var L = 0,
                R = this.items.length - 1;
            while (L <= R) {
                var m = (L + R) * 0.5,
                    item = this.items[m];
                if (item.id < id)
                L = m + 1;
                else if (item.id > id)
                R = m - 1;
                else // item.id == id
                return <T>item;
            }
            return null;
        }

        public position_empty(x: number, y: number): boolean {
            for (var other of this.items)
                if (other.contains_point(x, y))
                    return false;
            return true;
        }
        public position_meeting<T extends Item>(x: number, y: number, cls: new (game: Game, creation_code?: (self: T) => void) => T): boolean {
            for (var other of this.items)
                if (other instanceof cls)
                    if (other.contains_point(x, y))
                        return false;
            return true;
        }
        public place_empty<T extends Item>(item: T, x: number, y: number): boolean {
            for (var other of this.items)
                if (item.id != other.id && item.is_colliding_at(other, x, y))
                    return false;
            return true;
        }
        public place_meeting<T1 extends Item, T2 extends Item>(item: T1, x: number, y: number, cls: new (game: Game, creation_code?: (self: T2) => void) => T2): boolean {
            for (var other of this.items)
                if (other instanceof cls)
                    if (item.id != other.id && item.is_colliding_at(other, x, y))
                        return true;
            return false;
        }
    }

    export class Item {
        protected game: Game;
        private static next_id: number = 1;
        private _id: number;
        public get id() {
            return this._id;
        }
        private _is_alive: boolean;
        public get is_alive() {
            return this._is_alive;
        }
        public x: number;
        public y: number;
        public width: number;
        public height: number;
        public color: Color;
        public is_circle: boolean;
        public visible: boolean;
        public depth: number;
        private _creation_code?: (self: Item) => void;
        public get creation_code() {
            return this._creation_code;
        }

        constructor(game: Game, creation_code?: (self: Item) => void) {
            this.game = game;
            this._id = Item.next_id++;
            this._is_alive = true;
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
            this.color = Colors.c_black;
            this.is_circle = false;
            this.visible = true;
            this.depth = 0;
            this._creation_code = creation_code;
        }

        public create(): void {}
        public destroy(): void {}
        public step(): void {}
        public step_begin(): void {}
        public step_end(): void {}
        public draw(): void {
            this.draw_self();
        }
        public draw_begin(): void {}
        public draw_end(): void {}
        private draw_self(): void {
            this.game.ctx.fillStyle = this.color.as_string;
            if (this.is_circle) {
                this.game.ctx.beginPath();
                this.game.ctx.arc(this.x + this.width * 0.5, this.y + this.width * 0.5, this.width * 0.5, 0, 2 * Math.PI, true);
                this.game.ctx.fill();
            } else
                this.game.ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        public instance_destroy(): void {
            this._is_alive = false;
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

    namespace Helpers {
        export function sort_by_depth(items: Array<Item>): Array<Item> {
            if (items.length === 0)
                return new Array<Item>();
            let result = new Array<Item>(),
                lowest: number = items[0].depth,
                highest: number = items[0].depth,
                map = new Map<number, Array<Item>>();
            // Split into arrays of equal depth
            for (let item of items) {
                let depth = item.depth;
                lowest = (depth < lowest) ? depth : lowest;
                highest = (depth > highest) ? depth : highest;
                if (!map.has(depth))
                    map.set(depth, new Array<Item>());
                map.get(depth).push(item);
            }
            // Concat in reverse depth order
            for (let i = highest; i >= lowest; i--)
                if (map.has(i))
                    for (let item of map.get(i))
                        result.push(item);
            return result;
        }
    }

    namespace Collisions {
        export function circle_circle(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
            let dx = x2 - x1,
                dy = y2 - y1;
            return dx * dx + dy * dy <= (r1 + r2) * (r1 + r2);
        }
        export function circle_point(x1: number, y1: number, r1: number, x2: number, y2: number): boolean {
            let dx = x2 - x1,
                dy = y2 - y1;
            return dx * dx + dy * dy <= r1 * r1;
        }
        export function circle_rect(x1: number, y1: number, r1: number, x2: number, y2: number, w2: number, h2: number): boolean {
            // Voronoi Regions (modified)
            if (x1 <= x2) { // Left
                if (y1 <= y2) // Top left
                    return circle_point(x2, y2, r1, x1, y1);
                else if (y1 >= y2 + h2) // Bottom left
                    return circle_point(x2, y2 + h2, r1, x1, y1);
                else // Center left
                    return x1 + r1 >= x2;
            } else if (x1 >= x2 + w2) { // Right
                if (y1 <= y2) // Top right
                    return circle_point(x2 + w2, y2, r1, x1, y1);
                else if (y1 >= y2 + h2) // Bottom right
                    return circle_point(x2 + w2, y2 + h2, r1, x1, y1);
                else // Center right
                    return x1 - r1 <= x2 + w2;
            } else // Middle
                return y1 + r1 >= y2 && y1 - r1 <= y2 + h2;
        }
        export function point_point(x1: number, y1: number, x2: number, y2: number): boolean {
            return x1 == x2 && y1 == y2;
        }
        export function point_rect(x1: number, y1: number, x2: number, y2: number, w2: number, h2: number): boolean {
            return x1 >= x2 && x1 <= x2 + w2 && y1 >= y2 && y1 <= y2 + h2;
        }
        export function rect_rect(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
            // Calculate bounds
            let xmin = Math.min(x1, x2),
                xmax = Math.max(x1 + w1, x2 + w2),
                ymin = Math.min(y1, y2),
                ymax = Math.max(y1 + h1, y2 + h2);
            // Separating Axis Theorem (modified)
            return (xmax - xmin <= w1 + w2) && (ymax - ymin <= h1 + h2);
        }
    }
}
