(function () {
  const SHOW_GOAL_TEXT = "See Goal";
  const HIDE_GOAL_TEXT = "Hide Goal";
  const SLIDE_PROGRESS_KEY = "zx-online:max-unlocked-slide";

  function readMaxUnlockedSlide() {
    const value = Number(window.localStorage.getItem(SLIDE_PROGRESS_KEY));
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  function writeMaxUnlockedSlide(index) {
    window.localStorage.setItem(SLIDE_PROGRESS_KEY, String(Math.max(0, index)));
  }

  function setGoalVisible(root, visible) {
    const goalLabel = root.querySelector(".zx-goal-label");
    const goalCanvas = root.querySelector(".zx-goal-canvas");
    const openButton = root.querySelector(".zx-open-canvas");

    if (goalLabel instanceof HTMLElement) {
      goalLabel.hidden = !visible;
    }

    if (goalCanvas instanceof HTMLElement) {
      goalCanvas.hidden = !visible;
    }

    if (openButton instanceof HTMLButtonElement) {
      openButton.textContent = visible ? HIDE_GOAL_TEXT : SHOW_GOAL_TEXT;
      openButton.setAttribute("aria-expanded", String(visible));
    }

    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  function openExercise(root) {
    const canvasShell = root.querySelector(".zx-canvas-embed-shell");
    const iframe = root.querySelector(".zx-canvas-frame");
    const openButton = root.querySelector(".zx-open-canvas");

    if (!(canvasShell instanceof HTMLElement) || !(iframe instanceof HTMLIFrameElement)) {
      return;
    }

    if (!iframe.getAttribute("src")) {
      iframe.setAttribute("src", iframe.dataset.src || "");
    }

    root.classList.add("is-canvas-open");

    if (openButton instanceof HTMLButtonElement) {
      openButton.textContent = SHOW_GOAL_TEXT;
      openButton.setAttribute("aria-expanded", "false");
    }

    canvasShell.hidden = false;
    setGoalVisible(root, false);
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  document.querySelectorAll("[data-zx-exercise]").forEach((root) => {
    const openButton = root.querySelector(".zx-open-canvas");

    root.addEventListener("zx-exercise-open-request", () => {
      if (!root.classList.contains("is-canvas-open")) {
        openExercise(root);
      }
    });

    openButton?.addEventListener("click", () => {
      if (root.classList.contains("is-canvas-open")) {
        const goalCanvas = root.querySelector(".zx-goal-canvas");
        setGoalVisible(root, goalCanvas instanceof HTMLElement && goalCanvas.hidden);
        return;
      }

      openExercise(root);
    });
  });

  const gameSlideTargets = Array.from(document.querySelectorAll("[data-game-slide]"));

  function maxGameSlide() {
    return gameSlideTargets.reduce((maxSlide, target) => {
      const gameSlide = Number(target.dataset.gameSlide);
      return Number.isInteger(gameSlide) ? Math.max(maxSlide, gameSlide) : maxSlide;
    }, 0);
  }

  function syncGameSlideLinks() {
    const maxUnlockedSlide = readMaxUnlockedSlide();

    gameSlideTargets.forEach((target) => {
      const gameSlide = Number(target.dataset.gameSlide);
      const isUnlocked = Number.isInteger(gameSlide) && gameSlide <= maxUnlockedSlide;

      target.classList.toggle("is-game-link", isUnlocked);

      if (isUnlocked) {
        target.setAttribute("role", "link");
        target.setAttribute("tabindex", "0");
        target.setAttribute("aria-label", "Open this exercise in the game");
      } else {
        target.removeAttribute("role");
        target.removeAttribute("tabindex");
        target.removeAttribute("aria-label");
      }
    });
  }

  gameSlideTargets.forEach((target) => {
    const gameSlide = Number(target.dataset.gameSlide);

    function openGameSlide() {
      if (!Number.isInteger(gameSlide) || gameSlide > readMaxUnlockedSlide()) {
        return;
      }

      window.location.href = `slides.html#slide-${gameSlide}`;
    }

    target.addEventListener("click", openGameSlide);
    target.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      openGameSlide();
    });
  });

  syncGameSlideLinks();

  document.querySelectorAll("[data-progress-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.progressAction === "unlock-all") {
        writeMaxUnlockedSlide(maxGameSlide());
      } else if (button.dataset.progressAction === "start-over") {
        writeMaxUnlockedSlide(0);
      }

      syncGameSlideLinks();
    });
  });

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (!message || message.type !== "zx-online:lesson-solved") {
      return;
    }

    const selector = `[data-zx-exercise][data-lesson-id="${message.lessonId}"]`;
    document.querySelectorAll(selector).forEach((root) => {
      root.classList.add("is-resolved");
    });

    window.dispatchEvent(
      new CustomEvent("zx-exercise-resolved", {
        detail: { lessonId: message.lessonId },
      })
    );
  });
})();
