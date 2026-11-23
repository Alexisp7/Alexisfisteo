(() => {
  const viewer = document.getElementById('pdf-viewer');
  if (!viewer || !viewer.showModal) return;
  const frame = viewer.querySelector('iframe');
  const title = document.getElementById('pdf-title');
  const download = viewer.querySelector('[download]');
  const direct = viewer.querySelector('[data-pdf-direct]');
  let trigger;
  document.querySelectorAll('.document-group a[href$=".pdf"]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      const name = link.firstElementChild.textContent.trim();
      title.textContent = name;
      frame.title = 'Visor PDF: ' + name;
      download.href = direct.href = link.href;
      frame.src = 'pdf-visor.html?file=' + encodeURIComponent(new URL(link.href).pathname);
      viewer.showModal();
      document.documentElement.classList.add('pdf-open');
    });
  });
  viewer.querySelector('[data-pdf-close]').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    if (event.target === viewer) {
      const r = viewer.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) viewer.close();
    }
  });
  viewer.addEventListener('close', () => {
    frame.src = 'about:blank';
    document.documentElement.classList.remove('pdf-open');
    if (trigger?.isConnected) trigger.focus({preventScroll:true});
  });
})();
