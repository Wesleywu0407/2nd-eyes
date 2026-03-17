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
// Homepage story gallery
// Sticky image + active step sync
// ==========================
(function () {
    const story = document.querySelector("[data-story-gallery]");
    if (!story) return;

    const steps = Array.from(story.querySelectorAll("[data-story-step]"));
    const panels = Array.from(story.querySelectorAll("[data-story-panel]"));
    if (!steps.length || !panels.length) return;

    const mobileMode = window.matchMedia("(max-width: 900px)");

    function setActive(targetId) {
        steps.forEach((step) => {
            const isActive = step.dataset.storyTarget === targetId;
            step.classList.toggle("is-active", isActive);
            step.setAttribute("aria-current", isActive ? "true" : "false");
        });

        panels.forEach((panel) => {
            panel.classList.toggle("is-active", panel.dataset.storyPanel === targetId);
        });
    }

    function setClosestStep() {
        const viewportMid = window.innerHeight * 0.46;
        let closest = steps[0];
        let smallestDistance = Number.POSITIVE_INFINITY;

        steps.forEach((step) => {
            const rect = step.getBoundingClientRect();
            const stepMid = rect.top + rect.height * 0.5;
            const distance = Math.abs(stepMid - viewportMid);

            if (distance < smallestDistance) {
                smallestDistance = distance;
                closest = step;
            }
        });

        setActive(closest.dataset.storyTarget || "0");
    }

    let observer;

    function setupStory() {
        if (observer) {
            observer.disconnect();
        }

        if (mobileMode.matches) {
            setActive("0");
            return;
        }

        observer = new IntersectionObserver(
            (entries) => {
                const visibleEntries = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (!visibleEntries.length) return;
                const targetId =
                    visibleEntries[0].target instanceof HTMLElement
                        ? visibleEntries[0].target.dataset.storyTarget || "0"
                        : "0";
                setActive(targetId);
            },
            {
                root: null,
                rootMargin: "-22% 0px -32% 0px",
                threshold: [0.15, 0.4, 0.65],
            }
        );

        steps.forEach((step) => observer.observe(step));
        setClosestStep();
    }

    setupStory();

    window.addEventListener("resize", () => {
        window.clearTimeout(setupStory._resizeTimer);
        setupStory._resizeTimer = window.setTimeout(() => {
            setupStory();
        }, 120);
    });

    window.addEventListener(
        "scroll",
        () => {
            if (mobileMode.matches) return;
            window.clearTimeout(setClosestStep._scrollTimer);
            setClosestStep._scrollTimer = window.setTimeout(setClosestStep, 50);
        },
        { passive: true }
    );
})();

// ==========================
// Gallery archive reveal
// Soft reveal for archive cards
// ==========================
(function () {
    const gallery = document.querySelector("[data-archive-gallery]");
    if (!gallery) return;

    const cards = Array.from(gallery.querySelectorAll("[data-archive-card]"));
    if (!cards.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReducedMotion.matches) {
        cards.forEach((card) => card.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        {
            root: null,
            rootMargin: "0px 0px -10% 0px",
            threshold: 0.18,
        }
    );

    cards.forEach((card) => observer.observe(card));
})();

// ==========================
// Gallery lightbox
// Opens full image view for archive photos
// ==========================
(function () {
    const gallery = document.querySelector("[data-archive-gallery]");
    const lightbox = document.querySelector("[data-gallery-lightbox]");
    if (!gallery || !lightbox) return;

    const lightboxImage = lightbox.querySelector("[data-lightbox-image]");
    const lightboxCaption = lightbox.querySelector("[data-lightbox-caption]");
    const closeTargets = Array.from(lightbox.querySelectorAll("[data-lightbox-close]"));
    const photoCards = Array.from(gallery.querySelectorAll(".archive-photo"));

    let previousBodyOverflow = "";

    function openLightbox(image, captionText) {
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt || "";
        lightboxCaption.textContent = captionText || image.alt || "";
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");

        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        lightboxImage.src = "";
        lightboxImage.alt = "";
        lightboxCaption.textContent = "";
        document.body.style.overflow = previousBodyOverflow;
    }

    photoCards.forEach((card) => {
        const image = card.querySelector("img");
        const caption = card.querySelector("figcaption");
        if (!image) return;

        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Open image: ${image.alt || "gallery image"}`);

        card.addEventListener("click", () => {
            openLightbox(image, caption?.textContent?.trim() || "");
        });

        card.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            openLightbox(image, caption?.textContent?.trim() || "");
        });
    });

    closeTargets.forEach((target) => {
        target.addEventListener("click", closeLightbox);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !lightbox.classList.contains("is-open")) return;
        closeLightbox();
    });
})();

// ==========================
// Homepage hero title motion
// Uses GSAP + ScrollTrigger on desktop only
// ==========================
(function () {
    const hero = document.querySelector(".home-hero");
    const title = document.querySelector("[data-hero-title]");
    if (!hero || !title) return;

    const lines = Array.from(title.querySelectorAll(".hero-title-line"));
    const lede = document.querySelector(".hero-lede");
    const rule = document.querySelector(".hero-rule");
    const meta = document.querySelector(".hero-meta");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopOnly = window.matchMedia("(min-width: 901px)");

    function clearInlineStyles() {
        [title, rule, lede, meta, ...lines].forEach((element) => {
            if (element) {
                element.style.transform = "";
                element.style.opacity = "";
                element.style.filter = "";
            }
        });
    }

    function playSimpleIntro() {
        clearInlineStyles();
        title.animate(
            [
                {
                    opacity: 0,
                    transform:
                        "perspective(1800px) rotateX(18deg) rotateY(-26deg) rotateZ(1deg) translate3d(-12px, 22px, -24px)",
                },
                {
                    opacity: 1,
                    transform:
                        "perspective(1800px) rotateX(11deg) rotateY(-15deg) rotateZ(0.4deg) translate3d(0, 0, 0)",
                },
            ],
            {
                duration: 1200,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "both",
            }
        );
    }

    function initGsapHero() {
        if (
            typeof window.gsap === "undefined" ||
            typeof window.ScrollTrigger === "undefined" ||
            prefersReducedMotion.matches ||
            !desktopOnly.matches
        ) {
            playSimpleIntro();
            return;
        }

        const existingTrigger = window.ScrollTrigger.getById("home-hero-pin");
        if (existingTrigger) {
            existingTrigger.kill(true);
        }

        window.gsap.registerPlugin(window.ScrollTrigger);
        window.gsap.killTweensOf([title, rule, lede, meta, ...lines]);
        clearInlineStyles();

        const ease = "power3.out";
        const loadTimeline = window.gsap.timeline({
            defaults: { ease },
        });

        loadTimeline
            .set(title, {
                transformPerspective: 1800,
                transformStyle: "preserve-3d",
                transformOrigin: "24% 58%",
            })
            .fromTo(
                title,
                {
                    autoAlpha: 0,
                    rotateX: 20,
                    rotateY: -30,
                    rotateZ: 1.1,
                    x: -16,
                    y: 26,
                    z: -22,
                },
                {
                    autoAlpha: 1,
                    rotateX: 12,
                    rotateY: -18,
                    rotateZ: 0.45,
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 1.3,
                }
            )
            .fromTo(
                [rule, lede, meta],
                {
                    autoAlpha: 0,
                    y: 20,
                },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.95,
                    stagger: 0.08,
                },
                "-=0.9"
            );

        const scrollTimeline = window.gsap.timeline({
            defaults: {
                ease: "none",
            },
            scrollTrigger: {
                id: "home-hero-pin",
                trigger: hero,
                start: "top top",
                end: "+=42%",
                scrub: 1.1,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
            },
        });

        scrollTimeline
            .to(
                title,
                {
                    scale: 0.995,
                    yPercent: -2,
                    rotateX: 0,
                    rotateY: 0,
                    rotateZ: 0,
                    x: 0,
                    transformPerspective: 1800,
                    transformOrigin: "24% 58%",
                },
                0
            )
            .to(
                lines,
                {
                    yPercent: (_, target) => (target.textContent?.trim() === "EYES" ? -1 : 0),
                },
                0
            )
            .to(
                rule,
                {
                    scaleX: 0.9,
                    autoAlpha: 0.72,
                },
                0
            )
            .to(
                lede,
                {
                    y: -10,
                    autoAlpha: 0.7,
                },
                0
            )
            .to(
                meta,
                {
                    y: -8,
                    autoAlpha: 0.62,
                },
                0
            );
    }

    initGsapHero();

    window.addEventListener("resize", () => {
        window.clearTimeout(initGsapHero._resizeTimer);
        initGsapHero._resizeTimer = window.setTimeout(() => {
            initGsapHero();
            if (typeof window.ScrollTrigger !== "undefined") {
                window.ScrollTrigger.refresh();
            }
        }, 180);
    });
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

// ==========================
// Film diary book interactions (Notes page)
// Works with: [data-film-book]
// ==========================
(function () {
    const viewer = document.querySelector("[data-film-book]");
    if (!viewer) return;

    const entries = Array.from(viewer.querySelectorAll(".film-roll-entry")).map((entry) => ({
        name: entry.dataset.rollName || "Untitled roll",
        left: entry.querySelector(".entry-left")?.innerHTML || "",
        right: entry.querySelector(".entry-right")?.innerHTML || "",
    }));

    if (!entries.length) return;

    const book = viewer.querySelector(".journal-book");
    const cover = viewer.querySelector("[data-book-cover]");
    const leftPage = viewer.querySelector("[data-book-page='left']");
    const rightPage = viewer.querySelector("[data-book-page='right']");
    const turn = viewer.querySelector("[data-book-turn]");
    const turnFront = viewer.querySelector("[data-book-turn-front]");
    const turnBack = viewer.querySelector("[data-book-turn-back]");
    const prevButton = viewer.querySelector("[data-book-prev]");
    const nextButton = viewer.querySelector("[data-book-next]");
    const status = viewer.querySelector("[data-book-status]");
    const controls = viewer.querySelector("[data-book-controls]");
    const hint = viewer.querySelector("[data-book-hint]");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMode = window.matchMedia("(max-width: 980px)");

    let currentIndex = 0;
    let isFlipping = false;
    let isOpen = false;
    let isOpening = false;

    function renderSpread(index) {
        const entry = entries[index];
        leftPage.innerHTML = entry.left;
        rightPage.innerHTML = entry.right;
        updateStatus();
    }

    function updateStatus() {
        if (!isOpen && !mobileMode.matches) {
            status.textContent = "Click to open";
        } else {
            status.textContent = `Spread ${currentIndex + 1} of ${entries.length} - ${entries[currentIndex].name}`;
        }

        prevButton.disabled = currentIndex === 0 || (!isOpen && !mobileMode.matches);
        nextButton.disabled =
            currentIndex === entries.length - 1 || (!isOpen && !mobileMode.matches);
    }

    function clearTurnState() {
        turn.classList.remove("is-active", "turn-next", "turn-prev");
        turnFront.innerHTML = "";
        turnBack.innerHTML = "";
        book.classList.remove("is-flipping");
        isFlipping = false;
    }

    function swapWithoutFlip(targetIndex) {
        currentIndex = targetIndex;
        renderSpread(currentIndex);
        book.classList.remove("is-swapping");
        void book.offsetWidth;
        book.classList.add("is-swapping");
        window.setTimeout(() => {
            book.classList.remove("is-swapping");
        }, 320);
    }

    function revealControls() {
        controls.classList.remove("is-hidden");
    }

    function hideHint() {
        hint?.classList.add("is-hidden");
    }

    function openBook() {
        if (isOpen || isOpening) return;

        if (prefersReducedMotion.matches || mobileMode.matches) {
            isOpen = true;
            book.classList.add("is-open", "is-content-visible");
            cover.setAttribute("aria-label", "Film diary open");
            hideHint();
            revealControls();
            updateStatus();
            return;
        }

        isOpening = true;
        hideHint();
        book.classList.add("is-opening");
        cover.setAttribute("aria-label", "Opening film diary");

        window.setTimeout(() => {
            book.classList.add("is-content-visible");
        }, 860);

        window.setTimeout(() => {
            isOpening = false;
            isOpen = true;
            book.classList.remove("is-opening");
            book.classList.add("is-open");
            cover.setAttribute("aria-label", "Film diary open");
            revealControls();
            updateStatus();
        }, 1280);
    }

    function closeBookForDesktop() {
        if (mobileMode.matches) return;
        isOpen = false;
        isOpening = false;
        book.classList.remove("is-open", "is-opening", "is-content-visible");
        controls.classList.add("is-hidden");
        hint?.classList.remove("is-hidden");
        cover.setAttribute("aria-label", "Open film diary");
        updateStatus();
    }

    function completeOpenForMobile() {
        isOpen = true;
        isOpening = false;
        book.classList.add("is-open", "is-content-visible");
        cover.setAttribute("aria-label", "Film diary open");
        hideHint();
        revealControls();
        updateStatus();
    }

    function turnPage(direction) {
        if ((!isOpen && !mobileMode.matches) || isOpening) return;
        if (isFlipping) return;

        const step = direction === "next" ? 1 : -1;
        const targetIndex = currentIndex + step;
        if (targetIndex < 0 || targetIndex >= entries.length) return;

        if (prefersReducedMotion.matches || mobileMode.matches) {
            swapWithoutFlip(targetIndex);
            return;
        }

        isFlipping = true;
        book.classList.add("is-flipping");
        turn.classList.add("is-active", direction === "next" ? "turn-next" : "turn-prev");

        if (direction === "next") {
            turnFront.innerHTML = entries[currentIndex].right;
            turnBack.innerHTML = entries[targetIndex].left;
        } else {
            turnFront.innerHTML = entries[currentIndex].left;
            turnBack.innerHTML = entries[targetIndex].right;
        }

        const onFlipEnd = () => {
            currentIndex = targetIndex;
            renderSpread(currentIndex);
            clearTurnState();
        };

        turn.addEventListener("animationend", onFlipEnd, { once: true });
    }

    function onKeyDown(event) {
        const target = event.target;
        if (
            target instanceof HTMLElement &&
            (target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable)
        ) {
            return;
        }

        if ((event.key === "Enter" || event.key === " ") && !isOpen && !mobileMode.matches) {
            event.preventDefault();
            openBook();
            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            turnPage("next");
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            turnPage("prev");
        }
    }

    function updateLayoutMode() {
        if (mobileMode.matches) {
            completeOpenForMobile();
        } else if (!isOpen) {
            closeBookForDesktop();
        }

        updateStatus();
    }

    function setupTilt() {
        const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");
        if (!supportsHover.matches || prefersReducedMotion.matches) return;

        book.addEventListener("mousemove", (event) => {
            if (!isOpen || isFlipping || mobileMode.matches) return;

            const rect = book.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width;
            const py = (event.clientY - rect.top) / rect.height;
            const rotateY = -5 + (px - 0.5) * 3;
            const rotateX = 8 + (0.5 - py) * 2;
            book.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
                2
            )}deg) rotateZ(-0.35deg) scale(0.705) translateY(-3px)`;
        });

        book.addEventListener("mouseleave", () => {
            book.style.transform = "";
        });
    }

    prevButton.addEventListener("click", () => {
        turnPage("prev");
    });

    nextButton.addEventListener("click", () => {
        turnPage("next");
    });

    cover.addEventListener("click", () => {
        openBook();
    });

    document.addEventListener("keydown", onKeyDown);
    mobileMode.addEventListener("change", updateLayoutMode);

    renderSpread(currentIndex);
    updateLayoutMode();
    setupTilt();
    window.setTimeout(() => {
        book.classList.add("is-settled");
    }, 120);
})();
