const slides = Array.from(document.querySelectorAll(".slide"));
const deck = document.querySelector(".deck");
const header = document.querySelector(".deck-header");
const controls = document.querySelector(".deck-controls");
const backButton = document.querySelector("#back-button");
const nextButton = document.querySelector("#next-button");

let activeIndex = 0;

function activeSlideBlocksNext() {
  const activeSlide = slides[activeIndex];
  return Boolean(activeSlide.querySelector("[data-zx-exercise]:not(.is-resolved)"));
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

function renderSlide() {
  slides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === activeIndex);
  });

  backButton.disabled = activeIndex === 0;
  nextButton.disabled = activeIndex === slides.length - 1 || activeSlideBlocksNext();
  sizeImagesToSlide();
}

backButton.addEventListener("click", () => {
  activeIndex = Math.max(0, activeIndex - 1);
  renderSlide();
});

nextButton.addEventListener("click", () => {
  activeIndex = Math.min(slides.length - 1, activeIndex + 1);
  renderSlide();
});

window.addEventListener("resize", sizeImagesToSlide);
window.addEventListener("load", sizeImagesToSlide);
window.addEventListener("zx-exercise-resolved", renderSlide);

renderSlide();
