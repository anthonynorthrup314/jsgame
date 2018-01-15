/// <reference path="JSGame/scripts/Game.ts"/>
class App extends JSGame.Game {
    run() {
        console.log("Launching");
        super.run();
    }
}
window.addEventListener("load", (_) => {
    var app = new App();
    app.run();
});
//# sourceMappingURL=app.js.map