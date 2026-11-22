/* Divino · cardápio, estado da loja e utilitários */
window.$ = (s, r = document) => r.querySelector(s);
window.toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); };

(function () {
  const BG = ['#FFF5FA', '#EFFBF9', '#FFF9DD', '#F4ECFF'];
  function render() {
    const db = DB.get();
    $('#closed').hidden = db.open;
    $('#menuGrid').innerHTML = db.menu.map((c, i) => `<article class="mcat" style="--bg:${BG[i % 4]}"><h3>${c.title}</h3><ul>${c.items.map(it => `<li class="${it.on ? '' : 'out'}"><span>${it.n}</span><b>${DB.mt(it.p)}</b></li>`).join('')}</ul></article>`).join('');
  }
  render();
  DB.on(render); // atualiza se o admin mudar algo noutra aba
  window.renderMenu = render;
})();
