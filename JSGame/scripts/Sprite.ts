namespace JSGame {
    export enum SpriteKind {
        BoundingBox,
        Disk,
        Diamond
    }

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
        public color: string;
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

        constructor(color: string, width: number, height: number) {
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

        public drawMask(ctx: CanvasRenderingContext2D, x: number, y: number) {
            // Calculate bounds
            var bbox = this.GetBbox(),
                left = x - this.xoffset + bbox.left,
                top = y - this.yoffset + bbox.top,
                right = x - this.xoffset + bbox.right,
                bottom = y - this.yoffset + bbox.bottom;
            
            // Draw collision shape
            ctx.save();
            ctx.fillStyle = this.color;
            switch (this.kind) {
                case SpriteKind.Disk:
                    ctx.beginPath();
                    ctx.ellipse(left + this.width / 2, top + this.height / 2, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI, false);
                    ctx.fill();
                    break;
                case SpriteKind.Diamond:
                    ctx.beginPath();
                    ctx.moveTo(right, top + this.height / 2);
                    ctx.lineTo(left + this.width / 2, top);
                    ctx.lineTo(left, top + this.height / 2);
                    ctx.lineTo(left + this.width / 2, bottom);
                    ctx.fill();
                    break;
                default: // bounding box
                    ctx.fillRect(left, top, this.width, this.height);
            }
            ctx.restore();
        }

        public draw(ctx:CanvasRenderingContext2D, x: number, y: number) {
            // Draw rectangle
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.fillRect(x - this.xoffset, y - this.yoffset, this.width, this.height);
            ctx.restore();
        }
    }
}
