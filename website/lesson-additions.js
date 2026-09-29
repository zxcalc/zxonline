import { diagram, mountRule, mountExercise, originalExerciseIds } from './lesson-diagrams.js';

for (const container of document.querySelectorAll('[data-book-diagram]')) {
  container.innerHTML = diagram(container.dataset.bookDiagram, {
    which: container.dataset.which || 'start',
    label: container.dataset.which === 'goal' ? 'Target diagram' : 'Exercise diagram',
  });
}

// Overview figures keep their existing click-through links. The drawings animate
// as they enter view; replay lives on the artwork inside the lesson deck.
for (const container of document.querySelectorAll('[data-lesson-art]')) {
  const name=container.dataset.lessonArt;
  const interactive=Boolean(container.closest('.deck'));
  if(originalExerciseIds.includes(name)) {
    const variant='pair';
    container.dataset.artKind='exercise';
    mountExercise(container,name,{variant,interactive,label:container.dataset.artLabel});
  } else {
    container.dataset.artKind='rule';
    mountRule(container,name,{interactive});
  }
}

requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
