  document.querySelectorAll('.progress-fill[data-width]').forEach((el) => {
    const width = Number(el.dataset.width) || 0;
    el.style.width = `${Math.max(0, Math.min(100, width))}%`;
  });
  