export class Color {
    private red: number;
    private green: number;
    private blue: number;
    private str: string;

    public get as_string() {
        return this.str;
    }

    constructor(red: number, green: number, blue: number) {
        this.red = Math.max(0, Math.min(Math.round(red), 255));
        this.green = Math.max(0, Math.min(Math.round(green), 255));
        this.blue = Math.max(0, Math.min(Math.round(blue), 255));
        this.str = `rgb(${this.red},${this.green},${this.blue})`;
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

    //#region Static helpers

    public static random(min: number = 0, max: number = 255): Color {
        return new Color(
            min + Math.floor(Math.random() * (max - min + 1)),
            min + Math.floor(Math.random() * (max - min + 1)),
            min + Math.floor(Math.random() * (max - min + 1))
        );
    }

    /**
     * @param int The color value (Game Maker stores as #BBGGRR for some reason)
     */
    public static from_int(int: number): Color {
        int = Math.max(0, Math.min(Math.round(int), 0xFFFFFF));
        // tslint:disable-next-line: no-bitwise
        return new Color(int & 0xFF, (int >> 8) & 0xFF, (int >> 16) & 0xFF);
    }

    //#endregion
}

/**
 * Standard Game Maker colors
 * @see https://docs.yoyogames.com/source/dadiospice/002_reference/drawing/colour%20and%20blending/index.html
 */
export class Colors {
    private constructor() { }

    public static get c_aqua(): Color { return Color.from_int(16776960); }
    public static get c_black(): Color { return Color.from_int(0); }
    public static get c_blue(): Color { return Color.from_int(16711680); }
    public static get c_dkgray(): Color { return Color.from_int(4210752); }
    public static get c_fuchsia(): Color { return Color.from_int(16711935); }
    public static get c_gray(): Color { return Color.from_int(8421504); }
    public static get c_green(): Color { return Color.from_int(32768); }
    public static get c_lime(): Color { return Color.from_int(65280); }
    public static get c_ltgray(): Color { return Color.from_int(12632256); }
    public static get c_maroon(): Color { return Color.from_int(128); }
    public static get c_navy(): Color { return Color.from_int(8388608); }
    public static get c_olive(): Color { return Color.from_int(32896); }
    public static get c_orange(): Color { return Color.from_int(4235519); }
    public static get c_purple(): Color { return Color.from_int(8388736); }
    public static get c_red(): Color { return Color.from_int(255); }
    public static get c_silver(): Color { return Color.from_int(12632256); }
    public static get c_teal(): Color { return Color.from_int(8421376); }
    public static get c_white(): Color { return Color.from_int(16777215); }
    public static get c_yellow(): Color { return Color.from_int(65535); }
}