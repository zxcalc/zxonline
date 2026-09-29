(function () {
  const SHOW_GOAL_TEXT = "See Goal";
  const HIDE_GOAL_TEXT = "Hide Goal";
  const SLIDE_PROGRESS_KEY = "zx-online:max-unlocked-slide";
  const ALL_UNLOCKED_KEY = "zx-online:all-slides-unlocked";

  function allSlidesUnlocked() {
    return window.localStorage.getItem(ALL_UNLOCKED_KEY) === "true";
  }

  function notifyProgressChanged() {
    window.dispatchEvent(new CustomEvent("zx-progress-changed"));
  }

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
    window.dispatchEvent(new CustomEvent("zx-exercise-opened", { detail: { lessonId: root.dataset.lessonId } }));
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
      const isUnlocked = Number.isInteger(gameSlide) && (allSlidesUnlocked() || gameSlide <= maxUnlockedSlide);

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

    // In free navigation the footer can move on immediately. Keep the existing
    // goal-panel OK button available for learners who still want to try it.
    document.querySelectorAll("[data-zx-exercise]").forEach((root) => {
      const openButton = root.querySelector(".zx-open-canvas");
      if (!(openButton instanceof HTMLButtonElement)) return;
      if (allSlidesUnlocked() && !root.classList.contains("is-canvas-open")) openButton.style.display = "inline-block";
      else openButton.style.removeProperty("display");
    });
  }

  gameSlideTargets.forEach((target) => {
    const gameSlide = Number(target.dataset.gameSlide);

    function openGameSlide() {
      if (!Number.isInteger(gameSlide) || (!allSlidesUnlocked() && gameSlide > readMaxUnlockedSlide())) {
        return;
      }

      window.location.href = `slides.html#slide-${gameSlide}`;
    }

    target.addEventListener("click", (event) => {
      if (event.target.closest("a, button, input, select, textarea")) return;
      openGameSlide();
    });
    target.addEventListener("keydown", (event) => {
      if (event.target !== target) return;
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
        window.localStorage.setItem(ALL_UNLOCKED_KEY, "true");
        writeMaxUnlockedSlide(maxGameSlide());
      } else if (button.dataset.progressAction === "start-over") {
        window.localStorage.removeItem(ALL_UNLOCKED_KEY);
        writeMaxUnlockedSlide(0);
      }

      syncGameSlideLinks();
      notifyProgressChanged();
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === SLIDE_PROGRESS_KEY || event.key === ALL_UNLOCKED_KEY) {
      syncGameSlideLinks();
      notifyProgressChanged();
    }
  });
  window.addEventListener("zx-progress-changed", syncGameSlideLinks);

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (event.origin !== window.location.origin || !message || message.type !== "zx-online:lesson-solved") {
      return;
    }

    const matching = Array.from(document.querySelectorAll("[data-zx-exercise]")).filter(root => root.dataset.lessonId === message.lessonId && root.querySelector("iframe")?.contentWindow === event.source);
    if (!matching.length) return;
    matching.forEach((root) => {
      root.classList.add("is-resolved");
    });

    window.dispatchEvent(
      new CustomEvent("zx-exercise-resolved", {
        detail: { lessonId: message.lessonId },
      })
    );
  });
})();
