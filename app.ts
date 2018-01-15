/// <reference path="JSGame/scripts/Game.ts"/>

class App extends JSGame.Game {
    public run(): void {
        console.log("Launching");
        super.run();
    }
}

window.addEventListener("load", (_) => {
    var app: App = new App();
    app.run();
});