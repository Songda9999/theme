
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.hc-search input[type="search"]');
  if (searchInput && window.innerWidth > 768) searchInput.focus();

  // Smooth scroll for #links (optional)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });
});
