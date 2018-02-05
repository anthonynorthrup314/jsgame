namespace JSGame {
    export class Color {
        private red: number;
        private green: number;
        private blue: number;
        private str: string;
        private int: number;

        public get as_string() {
            return this.str;
        }

        public get as_int() {
            return this.int;
        }

        constructor(red: number, green: number, blue: number) {
            this.red = Math.max(0, Math.min(Math.round(red), 255));
            this.green = Math.max(0, Math.min(Math.round(green), 255));
            this.blue = Math.max(0, Math.min(Math.round(blue), 255));
            this.str = `rgb(${this.red},${this.green},${this.blue})`;
            this.int = (this.blue << 16) + (this.green << 8) + this.red;
        }

        public static random(min: number = 0, max: number = 255): Color {
            return new Color(
                min + Math.floor(Math.random() * (max - min + 1)),
                min + Math.floor(Math.random() * (max - min + 1)),
                min + Math.floor(Math.random() * (max - min + 1))
            );
        }

        public static from_int(int: number): Color {
            int = Math.max(0, Math.min(Math.round(int), 0xFFFFFF));
            return new Color(int & 0xFF, (int >> 8) & 0xFF, (int >> 16) & 0xFF);
        }

        public merge(other: Color, amount: number): Color {
            return new Color(
                this.red * (1.0 - amount) + other.red * amount,
                this.green * (1.0 - amount) + other.green * amount,
                this.blue * (1.0 - amount) + other.blue * amount
            );
        }

        public multiply(other: Color): Color {
            return new Color(
                this.red * other.red / 255.0,
                this.green * other.green / 255.0,
                this.blue * other.blue / 255.0
            );
        }
    }

    export namespace Colors {
        /* Standard Game Maker colors
         * https://docs.yoyogames.com/source/dadiospice/002_reference/drawing/colour%20and%20blending/index.html
         * Game Maker stores as #BBGGRR for some reason
         */
        export let c_aqua: Color = Color.from_int(16776960);
        export let c_black: Color = Color.from_int(0);
        export let c_blue: Color = Color.from_int(16711680);
        export let c_dkgray: Color = Color.from_int(4210752);
        export let c_fuchsia: Color = Color.from_int(16711935);
        export let c_gray: Color = Color.from_int(8421504);
        export let c_green: Color = Color.from_int(32768);
        export let c_lime: Color = Color.from_int(65280);
        export let c_ltgray: Color = Color.from_int(12632256);
        export let c_maroon: Color = Color.from_int(128);
        export let c_navy: Color = Color.from_int(8388608);
        export let c_olive: Color = Color.from_int(32896);
        export let c_orange: Color = Color.from_int(4235519);
        export let c_purple: Color = Color.from_int(8388736);
        export let c_red: Color = Color.from_int(255);
        export let c_silver: Color = Color.from_int(12632256);
        export let c_teal: Color = Color.from_int(8421376);
        export let c_white: Color = Color.from_int(16777215);
        export let c_yellow: Color = Color.from_int(65535);
    }
}