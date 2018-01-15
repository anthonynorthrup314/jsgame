var JSGame;
(function (JSGame) {
    class Game {
        constructor(elementId) {
            this.createElements(elementId);
            this.ctx = this.canvas.getContext("2d");
        }
        createElements(elementId) {
            // Find/create root
            if (elementId === undefined) {
                // Create a new element if no ID specified
                this.root = document.createElement("div");
            }
            else {
                // Search for the specified ID
                let root = document.getElementById(elementId);
                if (root === null) {
                    throw new DOMException(`Could not find element '${elementId}'`);
                }
                else if (root instanceof HTMLDivElement) {
                    // Found and correct type
                    this.root = root;
                }
                else {
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
        run() {
            // TODO: Something
            return;
        }
    }
    JSGame.Game = Game;
})(JSGame || (JSGame = {}));
//# sourceMappingURL=Game.js.map