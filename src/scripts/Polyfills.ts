if (!window.requestAnimationFrame) {
    // Check common prefixes
    const prefixes = ["webkit", "moz", "o", "ms"];
    for (const prefix of prefixes) {
        window.requestAnimationFrame = window.requestAnimationFrame || (window as any)[`${prefix}RequestAnimationFrame`];
        window.cancelAnimationFrame = window.cancelAnimationFrame || (window as any)[`${prefix}CancelAnimationFrame`];
    }

    // Fallback to setTimeout
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (callback: FrameRequestCallback) => {
            return window.setTimeout(callback, 1000.0 / 60.0);
        };
        window.cancelAnimationFrame = (requestId: number) => {
            window.clearTimeout(requestId);
        };
    }
}

if (!window.performance)
    (window as any).performance = {};
if (!window.performance.now)
    window.performance.now = () => {
        return Date.now();
    };