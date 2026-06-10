(function () {
  const SHOW_GOAL_TEXT = "See Goal";
  const HIDE_GOAL_TEXT = "Hide Goal";

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
    openButton?.addEventListener("click", () => {
      if (root.classList.contains("is-canvas-open")) {
        const goalCanvas = root.querySelector(".zx-goal-canvas");
        setGoalVisible(root, goalCanvas instanceof HTMLElement && goalCanvas.hidden);
        return;
      }

      openExercise(root);
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
