(function () {
  var t = localStorage.getItem('tracksy_theme') || 'system';
  var d = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.add(d ? 'theme-dark' : 'theme-light');
})();
