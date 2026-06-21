const slides = Array.from(document.querySelectorAll(".slide"));
const deck = document.querySelector(".deck");
const header = document.querySelector(".deck-header");
const controls = document.querySelector(".deck-controls");
const backButton = document.querySelector("#back-button");
const nextButton = document.querySelector("#next-button");
const confettiColors = ["#0f886e", "#17a183", "#98bdef", "#e0ffe3", "#222222"];
const slideProgressKey = "zx-online:max-unlocked-slide";

let activeIndex = initialActiveIndex();

function readMaxUnlockedSlide() {
  const value = Number(window.localStorage.getItem(slideProgressKey));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function writeMaxUnlockedSlide(index) {
  const maxUnlocked = Math.max(readMaxUnlockedSlide(), index);
  window.localStorage.setItem(slideProgressKey, String(maxUnlocked));
}

function slideIndexFromHash() {
  const match = window.location.hash.match(/^#slide-(\d+)$/);
  if (!match) {
    return undefined;
  }

  return Number(match[1]);
}

function initialActiveIndex() {
  const requestedIndex = slideIndexFromHash();

  if (requestedIndex === undefined) {
    return 0;
  }

  const maxUnlocked = readMaxUnlockedSlide();
  return Math.max(0, Math.min(requestedIndex, maxUnlocked, slides.length - 1));
}

function updateSlideHash() {
  const nextHash = `#slide-${activeIndex}`;

  if (window.location.hash === nextHash) {
    return;
  }

  window.history.replaceState(null, "", nextHash);
}

function launchNextConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const rect = nextButton.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const duration = 1450;
  const startedAt = performance.now();
  const origin = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };

  canvas.className = "zx-confetti-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);

  function resizeCanvas() {
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  resizeCanvas();

  const particles = Array.from({ length: 84 }, () => {
    const angle = -Math.PI * 0.95 + Math.random() * Math.PI * 0.75;
    const speed = 5 + Math.random() * 8;

    return {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 2,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.32,
      size: 5 + Math.random() * 8,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      drag: 0.985 + Math.random() * 0.01,
      gravity: 0.16 + Math.random() * 0.08,
    };
  });

  function draw(now) {
    const elapsed = now - startedAt;
    const fade = Math.max(0, 1 - elapsed / duration);

    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((particle) => {
      particle.vx *= particle.drag;
      particle.vy = particle.vy * particle.drag + particle.gravity;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;

      context.save();
      context.globalAlpha = fade;
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.62);
      context.restore();
    });

    if (elapsed < duration) {
      window.requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }

  window.requestAnimationFrame(draw);
}

function activeSlideBlocksNext() {
  return Boolean(activeExercise()?.matches(":not(.is-resolved)"));
}

function activeExercise() {
  const activeSlide = slides[activeIndex];
  return activeSlide.querySelector("[data-zx-exercise]");
}

function activeExerciseNeedsOpening() {
  const exercise = activeExercise();
  return Boolean(exercise?.matches(":not(.is-canvas-open):not(.is-resolved)"));
}

function activeSlideIsFinal() {
  return activeIndex === slides.length - 1;
}

function sizeImagesToSlide() {
  const activeSlide = slides[activeIndex];
  const images = Array.from(activeSlide.querySelectorAll("img"));

  if (images.length === 0) {
    return;
  }

  images.forEach((image) => {
    image.style.removeProperty("max-height");
  });

  const deckStyle = getComputedStyle(deck);
  const slideStyle = getComputedStyle(activeSlide);
  const usableHeight =
    window.innerHeight -
    header.offsetHeight -
    controls.offsetHeight -
    parseFloat(deckStyle.paddingTop) -
    parseFloat(deckStyle.paddingBottom) -
    parseFloat(slideStyle.paddingTop) -
    parseFloat(slideStyle.paddingBottom);

  let nonImageHeight = 0;

  Array.from(activeSlide.children).forEach((child) => {
    const childStyle = getComputedStyle(child);
    const verticalMargins = parseFloat(childStyle.marginTop) + parseFloat(childStyle.marginBottom);

    if (child.tagName === "FIGURE") {
      const caption = child.querySelector("figcaption");
      const figureExtras =
        verticalMargins +
        parseFloat(childStyle.paddingTop) +
        parseFloat(childStyle.paddingBottom) +
        parseFloat(childStyle.borderTopWidth) +
        parseFloat(childStyle.borderBottomWidth);

      nonImageHeight += figureExtras + (caption ? caption.offsetHeight : 0);
    } else {
      nonImageHeight += child.offsetHeight + verticalMargins;
    }
  });

  const remainingHeight = usableHeight - nonImageHeight - images.length * 10;
  const maxImageHeight = Math.max(90, Math.floor(remainingHeight / images.length));

  images.forEach((image) => {
    image.style.maxHeight = `${maxImageHeight}px`;
  });
}

function renderSlide(options = {}) {
  slides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === activeIndex);
  });

  writeMaxUnlockedSlide(activeIndex);
  updateSlideHash();

  const wasNextDisabled = nextButton.disabled;
  const nextOpensExercise = activeExerciseNeedsOpening();
  const nextFinishesDeck = activeSlideIsFinal() && !nextOpensExercise && !activeSlideBlocksNext();
  const nextDisabled = !nextOpensExercise && !nextFinishesDeck && activeSlideBlocksNext();

  backButton.disabled = activeIndex === 0;
  nextButton.disabled = nextDisabled;
  nextButton.textContent = nextOpensExercise ? "OK" : nextFinishesDeck ? "Done!" : "Next";
  nextButton.classList.toggle("is-exercise-open-action", nextOpensExercise);
  nextButton.classList.toggle("is-deck-done-action", nextFinishesDeck);
  nextButton.setAttribute(
    "aria-label",
    nextOpensExercise ? "Open exercise canvas" : nextFinishesDeck ? "Return to overview" : "Next slide"
  );

  if (options.celebrateUnlock && wasNextDisabled && !nextDisabled && !nextOpensExercise) {
    launchNextConfetti();
  }

  sizeImagesToSlide();
}

backButton.addEventListener("click", () => {
  activeIndex = Math.max(0, activeIndex - 1);
  renderSlide();
});

nextButton.addEventListener("click", () => {
  if (nextButton.classList.contains("is-deck-done-action")) {
    window.location.href = "index.html";
    return;
  }

  if (nextButton.classList.contains("is-exercise-open-action")) {
    const exercise = activeExercise();
    exercise?.dispatchEvent(new CustomEvent("zx-exercise-open-request"));
    renderSlide();
    return;
  }

  activeIndex = Math.min(slides.length - 1, activeIndex + 1);
  renderSlide();
});

window.addEventListener("resize", sizeImagesToSlide);
window.addEventListener("load", sizeImagesToSlide);
window.addEventListener("zx-exercise-resolved", () => {
  renderSlide({ celebrateUnlock: true });
});

renderSlide();
