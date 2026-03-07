// ==========================
// Set current year in footer
// ==========================
(function () {
    const year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }
})();

// ==========================
// Horizontal Scroll (wheel -> horizontal)
// Works with: #hscroll + .hscroll-track
// ==========================
(function () {
    const viewport = document.getElementById("hscroll");
    if (!viewport) return;

    const track = viewport.querySelector(".hscroll-track");
    if (!track) return;

    let x = 0;
    let targetX = 0;
    let rafId = null;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function getMaxScroll() {
        const totalWidth = track.scrollWidth;
        const viewportWidth = viewport.clientWidth;
        return Math.min(0, viewportWidth - totalWidth);
    }

    function render() {
        x += (targetX - x) * 0.12;
        track.style.transform = `translate3d(${x}px, 0, 0)`;

        if (Math.abs(targetX - x) < 0.5) {
            x = targetX;
            track.style.transform = `translate3d(${x}px, 0, 0)`;
            rafId = null;
            return;
        }

        rafId = requestAnimationFrame(render);
    }

    function onWheel(event) {
        const delta =
            Math.abs(event.deltaX) > Math.abs(event.deltaY)
                ? event.deltaX
                : event.deltaY;

        event.preventDefault();

        const speed = 1.2;
        targetX = clamp(targetX - delta * speed, getMaxScroll(), 0);

        if (!rafId) {
            rafId = requestAnimationFrame(render);
        }
    }

    viewport.addEventListener("wheel", onWheel, { passive: false });

    window.addEventListener("resize", () => {
        targetX = clamp(targetX, getMaxScroll(), 0);
        x = clamp(x, getMaxScroll(), 0);
        track.style.transform = `translate3d(${x}px, 0, 0)`;
    });
})();
