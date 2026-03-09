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

// ==========================
// 3D tilt cards/photos (Notes page)
// Works with: [data-tilt]
// ==========================
(function () {
    const items = document.querySelectorAll("[data-tilt]");
    if (!items.length) return;

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouchOnly = window.matchMedia("(pointer: coarse)").matches;
    if (prefersReducedMotion || isTouchOnly) return;

    const MAX_TILT = 10;
    const RESET = "perspective(1400px) rotateX(0deg) rotateY(0deg) translateZ(0)";

    items.forEach((item) => {
        function onMove(event) {
            const rect = item.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width;
            const py = (event.clientY - rect.top) / rect.height;
            const rotateY = (px - 0.5) * MAX_TILT * 2;
            const rotateX = (0.5 - py) * MAX_TILT * 2;

            item.style.transform = `perspective(1400px) rotateX(${rotateX.toFixed(
                2
            )}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`;
        }

        function onLeave() {
            item.style.transform = RESET;
        }

        item.addEventListener("mousemove", onMove);
        item.addEventListener("mouseleave", onLeave);
    });
})();

// ==========================
// Custom cursor (desktop only)
// Active state on clickable elements
// ==========================
(function () {
    const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!supportsFinePointer.matches || prefersReducedMotion.matches) return;

    const clickableSelector =
        "a, button, .btn, [role='button'], input[type='button'], input[type='submit'], input[type='reset']";

    document.documentElement.classList.add("has-custom-cursor");

    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    document.body.appendChild(cursor);

    document.addEventListener("mousemove", (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
        cursor.classList.add("is-visible");
    });

    document.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-visible");
    });

    document.addEventListener("mouseover", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        cursor.classList.toggle("is-active", Boolean(target.closest(clickableSelector)));
    });

    document.addEventListener("mouseout", (event) => {
        const related = event.relatedTarget;
        if (!(related instanceof Element)) {
            cursor.classList.remove("is-active");
            return;
        }
        cursor.classList.toggle("is-active", Boolean(related.closest(clickableSelector)));
    });
})();
