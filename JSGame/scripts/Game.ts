/// <reference path="./Character.ts" />
/// <reference path="./Color.ts" />
/// <reference path="./Sprite.ts" />

namespace JSGame {
    export class Game {
        private root: HTMLDivElement;
        private canvas: HTMLCanvasElement;
        protected ctx: CanvasRenderingContext2D;

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

        constructor(elementId?: string) {
            // Setup canvas
            this.createElements(elementId);
            this.ctx = this.canvas.getContext("2d");

            // Setup resize listener
            window.addEventListener("resize", this.resize.bind(this));
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

        private tick(time: number): void {
            // Calculate delta
            let delta: number = time - this.frameTime;

            // Update previous time
            this.frameTime = time;

            // Update and draw
            this.update(delta);
            this.draw();
            this.test();

            // Request next frame
            this.frameRequest = requestAnimationFrame(this.tick.bind(this));
        }
        
        public run(): void {
            // Resize the canvas to fit the window
            this.resize();

            // Setup tick
            this.frameTime = performance.now();
            this.frameRequest = requestAnimationFrame(this.tick.bind(this));
        }

        private update(dt: number): void {

        }

        private draw(): void {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.save();
            this.ctx.fillStyle = (this.aspectRatio !== null) ? "darkgreen" : "darkred";
            this.ctx.fillRect(this.view_xport, this.view_yport, this.view_wport, this.view_hport);
            this.ctx.fillStyle = "white";
            this.ctx.textBaseline = "top";
            this.ctx.fillText(`Viewport: ${Math.round(this.view_wport)} by ${Math.round(this.view_hport)} @ (${Math.round(this.view_xport)}, ${Math.round(this.view_yport)})`, this.view_xport, this.view_yport);
            this.ctx.restore();
        }

        private test(): void {
            let asdf: Sprite = new Sprite(Colors.c_blue, 200, 100);
            asdf.xoffset = 70;
            asdf.yoffset = 0;
            asdf.kind = SpriteKind.Diamond;
            
            let a123: Character = new Character(this.view_xport, this.view_yport, asdf);
            a123.x += 20;
            a123.y += 20;
            a123.angle = 0;

            if (a123.contains(this.view_xport + 30, this.view_yport + 30))
                a123.color = Colors.c_purple;

            a123.draw(this.ctx);
        }
    }
}
