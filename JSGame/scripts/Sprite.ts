/// <reference path="./Color.ts" />

namespace JSGame {
    export enum SpriteKind {
        BoundingBox,
        Disk,
        Diamond
    }

    /* TODO: Decide on just box/circle or add extra shapes. If extra shapes,
     * collision detection will get slow and complicated. Also, possibly
     * random polygon mask specified by points? "Only" need to have polygon to
     * polygon collision to support that (force closed, could be concave).
     */

    export class BoundingBox {
        public left: number;
        public top: number;
        public right: number;
        public bottom: number;

        constructor(left: number, top: number, right: number, bottom: number) {
            this.left = left;
            this.top = top;
            this.right = right;
            this.bottom = bottom;
        }

        public static FromRect(x: number, y: number, width: number, height: number): BoundingBox {
            return new BoundingBox(x, y, x + width, y + height);
        }
    }

    export class Sprite {
        // TODO: Have actual image data
        // TODO: Overhaul variable access
        public color: Color;
        public width: number;
        public height: number;
        public xoffset: number;
        public yoffset: number;
        public kind: SpriteKind;

        public bbox?: BoundingBox;
        private GetBbox(): BoundingBox {
            if (this.bbox != null)
                return this.bbox;
            return BoundingBox.FromRect(0, 0, this.width, this.height);
        }

        constructor(color: Color, width: number, height: number) {
            this.color = color;
            this.width = width;
            this.height = height;
            this.xoffset = 0;
            this.yoffset = 0;
            this.kind = SpriteKind.BoundingBox;
            this.bbox = null;
        }

        public contains(x: number, y: number): boolean {
            // Calculate bounds
            var bbox = this.GetBbox(),
                left = -this.xoffset + bbox.left,
                top = -this.yoffset + bbox.top,
                right = -this.xoffset + bbox.right,
                bottom = -this.yoffset + bbox.bottom;
        
            // Invalid box?
            if (left >= right || top >= bottom)
                return false;
            
            // Outside box?
            if (x < left || x > right || y < top || y > bottom)
                return false;
            
            // Calculate radii
            var xradius = (x + this.xoffset) / (this.width / 2.0) - 1.0,
                yradius = (y + this.yoffset) / (this.height / 2.0) - 1.0;
            
            // Is colliding?
            switch (this.kind) {
                case SpriteKind.Disk:
                    return (Math.pow(xradius, 2) + Math.pow(yradius, 2)) <= 1.0;
                case SpriteKind.Diamond:
                    return (Math.abs(xradius) + Math.abs(yradius)) <= 1.0;
                default: // bounding box
                    return true; // already checked this
            }
        }

        // TODO: Remove drawMask method
        public drawMask(ctx: CanvasRenderingContext2D, color: Color = Colors.c_white) {
            // Calculate bounds
            var bbox = this.GetBbox(),
                left = -this.xoffset + bbox.left,
                top = -this.yoffset + bbox.top,
                right = -this.xoffset + bbox.right,
                bottom = -this.yoffset + bbox.bottom;
            
            // Draw collision shape
            ctx.save();
            ctx.strokeStyle = this.color.multiply(color).as_string;
            switch (this.kind) {
                case SpriteKind.Disk:
                    ctx.beginPath();
                    ctx.ellipse(left + this.width / 2, top + this.height / 2, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI, false);
                    ctx.stroke();
                    break;
                case SpriteKind.Diamond:
                    ctx.beginPath();
                    ctx.moveTo(right, top + this.height / 2);
                    ctx.lineTo(left + this.width / 2, top);
                    ctx.lineTo(left, top + this.height / 2);
                    ctx.lineTo(left + this.width / 2, bottom);
                    ctx.lineTo(right, top + this.height / 2);
                    ctx.stroke();
                    break;
                default: // bounding box
                    ctx.strokeRect(left, top, this.width, this.height);
            }
            ctx.restore();
        }

        public draw(ctx:CanvasRenderingContext2D, color: Color = Colors.c_white) {
            // Draw rectangle
            ctx.save();
            ctx.fillStyle = this.color.multiply(color).as_string;
            ctx.fillRect(-this.xoffset, -this.yoffset, this.width, this.height);
            ctx.restore();
        }

        // TODO: Have more complex drawing methods, draw_sprite_general
        // TODO: Draw image with color blending (possibly difficult)
    }
}
