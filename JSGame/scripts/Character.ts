/// <reference path="./Color.ts" />
/// <reference path="./Sprite.ts" />

namespace JSGame {
    export class Character { // Since "Object" is reserved
        public x: number;
        public y: number;
        public depth: number;
        public visible: boolean;
        public sprite: Sprite;
        public color: Color;
        public angle: number;
        public xscale: number;
        public yscale: number;

        constructor(x: number, y: number, sprite: Sprite) {
            this.x = x;
            this.y = y;
            this.sprite = sprite;
            this.depth = 0;
            this.visible = true;
            this.color = Colors.c_white;
            this.angle = 0;
            this.xscale = 1.0;
            this.yscale = 1.0;
        }

        public contains(x: number, y: number): boolean {
            // Calculate vector
            var dx = x - this.x,
                dy = y - this.y;

            // Unrotate
            var vc = Math.cos(this.angle * Math.PI / 180.0),
                vs = Math.sin(this.angle * Math.PI / 180.0),
                t = dx * vc - dy * vs;
            dy = dx * vs + dy * vc;
            dx = t;

            // Unscale
            if (this.xscale === 0 || this.yscale === 0)
                return false;
            dx /= this.xscale;
            dy /= this.yscale;

            return this.sprite.contains(dx, dy);
        }

        public draw(ctx: CanvasRenderingContext2D) {
            // Don't draw if invisible
            if (!this.visible)
                return;
            
            // Transform and draw sprite with mask
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(-this.angle * Math.PI / 180.0);
            ctx.scale(this.xscale, this.yscale);
            this.sprite.draw(ctx, this.color);
            this.sprite.drawMask(ctx, Colors.c_black);
            ctx.restore();
        }

        // TODO: Add character collision detection (fast?)
        // TODO: Add bounding rectangle calculation (makes other methods faster)
    }
}