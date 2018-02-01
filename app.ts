/// <reference path="JSGame/scripts/Game.ts"/>
/// <reference path="JSGame/scripts/Sprite.ts"/>

class App extends JSGame.Game {
    constructor() {
        super()
        this.aspectRatio = 16./9.;
    }

    public run(): void {
        console.log("Launching");
        super.run();
    }
}

window.addEventListener("load", (_) => {
    var app: App = new App();
    app.run();
});