/* Divino · painel do restaurante */
(() => {
  let db = DB.get(), tab = (location.hash || '#bi').slice(1), range = 14;
  const $ = (s, r = document) => r.querySelector(s), mt = DB.mt, view = $('#view');
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const save = () => DB.save(db);
  const ST = ['novo', 'preparando', 'pronto', 'entregue', 'cancelado'];
  const DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  /* acesso por PIN */
  const gate = $('#gate'); if (sessionStorage.getItem('dv-auth')) gate.hidden = true;
  $('#pinForm').addEventListener('submit', e => { e.preventDefault(); db = DB.get(); if ($('#pin').value === db.pin) { sessionStorage.setItem('dv-auth', '1'); gate.hidden = true; } else { $('#pinErr').textContent = 'PIN incorreto. Tente outra vez.'; } });

  /* ---------- BI ---------- */
  function stats(days) {
    const now = Date.now(), from = now - days * 864e5, prev = from - days * 864e5, ok = o => o.status !== 'cancelado';
    const cur = db.orders.filter(o => o.t >= from && ok(o)), old = db.orders.filter(o => o.t >= prev && o.t < from && ok(o));
    const sum = a => a.reduce((s, o) => s + o.total, 0);
    const daily = Array.from({ length: days }, (_, i) => { const d = new Date(now - (days - 1 - i) * 864e5); d.setHours(0, 0, 0, 0); const t0 = d.getTime(); return { l: d.getDate() + '/' + (d.getMonth() + 1), v: sum(cur.filter(o => o.t >= t0 && o.t < t0 + 864e5)) }; });
    const fc = {}, cm = { copo: 0, cone: 0, wafer: 0 }, hrs = Array(15).fill(0), wd = Array(7).fill(0);
    cur.forEach(o => { cm[o.cont]++; hrs[Math.min(14, Math.max(0, new Date(o.t).getHours() - 8))]++; wd[new Date(o.t).getDay()] += o.total; o.items.forEach(i => { fc[i.id] = fc[i.id] || { n: 0, rev: 0 }; fc[i.id].n++; fc[i.id].rev += i.price; }); });
    const scoops = cur.reduce((s, o) => s + o.items.length, 0);
    return { cur, rev: sum(cur), prevRev: sum(old), n: cur.length, avg: cur.length ? sum(cur) / cur.length : 0, scoops, daily, fc, cm, hrs, wd };
  }
  function insights(s) {
    const L = [], tot = Object.values(s.fc).reduce((a, b) => a + b.n, 0) || 1;
    const rank = db.flavors.map(f => ({ f, n: (s.fc[f.id] || {}).n || 0 })).sort((a, b) => b.n - a.n);
    if (s.n) {
      L.push(`🏆 <b>${rank[0].f.name}</b> lidera com ${Math.round(rank[0].n / tot * 100)}% das bolas vendidas.`);
      const h = s.hrs.indexOf(Math.max(...s.hrs)) + 8; L.push(`⏰ Horário de pico: <b>${h}h às ${h + 1}h</b>. Reforce a equipa e o stock antes disso.`);
      const bd = s.wd.indexOf(Math.max(...s.wd)); L.push(`📅 Melhor dia da semana: <b>${DAYS[bd]}</b> (${mt(s.wd[bd])} no período).`);
      const ch = s.prevRev ? Math.round((s.rev - s.prevRev) / s.prevRev * 100) : null; if (ch !== null) L.push(`${ch >= 0 ? '📈' : '📉'} Receita ${ch >= 0 ? 'subiu' : 'caiu'} <b>${Math.abs(ch)}%</b> face ao período anterior.`);
      L.push(`🍦 Cada pedido leva em média <b>${(s.scoops / s.n).toFixed(1)} bolas</b>. Um combo de 3 bolas pode subir o ticket médio.`);
    } else L.push('Sem pedidos neste período.');
    const lost = rank.slice(0, 5).filter(r => !r.f.on); if (lost.length) L.push(`⚠️ <b>${lost.map(r => r.f.name).join(', ')}</b> está(ão) indisponível(is) mas está(ão) no top 5. Vendas a perder!`);
    const cold = rank.filter(r => r.f.on).slice(-1)[0]; if (cold && s.n) L.push(`🧊 Pouca saída: <b>${cold.f.name}</b> (${cold.n} bolas). Teste uma promoção ou um combo.`);
    return L;
  }
  function drawLine(cv, vals, labels) {
    const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr);
    const max = Math.max(...vals, 1) * 1.15, pl = 8, pb = 22, step = (w - pl * 2) / Math.max(1, vals.length - 1), Y = v => h - pb - v / max * (h - pb - 12);
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(212,26,168,.45)'); g.addColorStop(1, 'rgba(212,26,168,0)');
    x.beginPath(); vals.forEach((v, i) => x[i ? 'lineTo' : 'moveTo'](pl + i * step, Y(v))); x.strokeStyle = '#A3098A'; x.lineWidth = 3; x.lineJoin = 'round'; x.stroke();
    x.lineTo(pl + (vals.length - 1) * step, h - pb); x.lineTo(pl, h - pb); x.fillStyle = g; x.fill();
    x.fillStyle = '#3a1236'; x.font = '700 11px Nunito'; x.textAlign = 'center'; const k = Math.ceil(vals.length / 8);
    vals.forEach((v, i) => { x.beginPath(); x.arc(pl + i * step, Y(v), 3.5, 0, 7); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = '#A3098A'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#3a1236'; if (i % k === 0) x.fillText(labels[i], pl + i * step, h - 6); });
  }
  function drawBars(cv, vals, labels) {
    const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr);
    const max = Math.max(...vals, 1), bw = w / vals.length;
    vals.forEach((v, i) => { const bh = v / max * (h - 36); const g = x.createLinearGradient(0, h - 22 - bh, 0, h - 22); g.addColorStop(0, '#14B5B0'); g.addColorStop(1, '#5FE8C9'); x.fillStyle = g; x.beginPath(); x.roundRect(i * bw + 4, h - 22 - bh, bw - 8, bh, 8); x.fill(); x.fillStyle = '#3a1236'; x.font = '700 11px Nunito'; x.textAlign = 'center'; x.fillText(labels[i], i * bw + bw / 2, h - 6); if (v) x.fillText(v, i * bw + bw / 2, h - 28 - bh); });
  }

  /* ---------- views ---------- */
  const V = {};
  V.bi = () => {
    const s = stats(range), ch = s.prevRev ? Math.round((s.rev - s.prevRev) / s.prevRev * 100) : 0, tot = Object.values(s.cm).reduce((a, b) => a + b, 0) || 1;
    const rank = db.flavors.map(f => ({ f, n: (s.fc[f.id] || {}).n || 0 })).sort((a, b) => b.n - a.n), mx = Math.max(1, rank[0].n);
    const cols = { copo: '#14B5B0', cone: '#FFB020', wafer: '#FF6FA8' }; let acc = 0;
    const conic = Object.keys(cols).map(k => { const a = acc / tot * 360; acc += s.cm[k]; return `${cols[k]} ${a}deg ${acc / tot * 360}deg`; }).join(',');
    return `<div class="head"><h2>Visão geral</h2><div class="seg">${[7, 14, 21].map(d => `<button data-do="range" data-v="${d}" class="${range === d ? 'on' : ''}">${d} dias</button>`).join('')}</div></div>
    <div class="grid g4">
      <div class="glass card kpi"><small>Receita</small><b>${mt(s.rev)}</b><span class="${ch >= 0 ? 'up' : 'down'}">${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch)}% vs período anterior</span></div>
      <div class="glass card kpi"><small>Pedidos</small><b>${s.n}</b><span>${(s.n / range).toFixed(1)} por dia</span></div>
      <div class="glass card kpi"><small>Ticket médio</small><b>${mt(s.avg)}</b><span>${s.n ? (s.scoops / s.n).toFixed(1) : 0} bolas por pedido</span></div>
      <div class="glass card kpi"><small>Previsão 7 dias</small><b>${mt(s.rev / range * 7)}</b><span>pela média atual</span></div>
    </div>
    <div class="glass card"><h3>Receita por dia</h3><canvas id="cDaily"></canvas></div>
    <div class="grid g2">
      <div class="glass card"><h3>Sabores mais vendidos</h3>${rank.map(r => `<div class="hb"><span>${esc(r.f.name)}</span><div><i style="--c:${r.f.c};width:${r.n / mx * 100}%"></i></div><span>${r.n}</span></div>`).join('')}</div>
      <div class="glass card"><h3>Mix de bases</h3><div class="big"><div class="donut" style="background:conic-gradient(${conic})"></div><div class="legend">${Object.keys(cols).map(k => `<span><i style="background:${cols[k]}"></i>${db.containers[k].name}: ${Math.round(s.cm[k] / tot * 100)}%</span>`).join('')}</div></div>
      <h3 style="margin-top:1.2rem">Pedidos por hora</h3><canvas id="cHours" style="height:170px"></canvas></div>
    </div>
    <div class="glass card"><h3>Insights automáticos</h3><ul class="ins">${insights(s).map(i => `<li>${i}</li>`).join('')}</ul></div>`;
  };
  V.sabores = () => `<div class="head"><h2>Sabores e bases</h2><div><button class="btn" data-do="allon">Disponibilizar todos</button> <button class="btn" data-do="alloff">Esgotar todos</button></div></div>
    <div class="glass card big"><div><h3>Loja ${db.open ? 'aberta' : 'fechada'}</h3><small>Fechada: o site bloqueia o construtor e os pedidos.</small></div><label class="sw"><input type="checkbox" data-a="open" ${db.open ? 'checked' : ''} aria-label="Loja aberta"><span></span></label></div>
    <div class="glass card"><h3>Bases</h3>${Object.entries(db.containers).map(([k, c]) => `<div class="row mn"><b>${c.name}</b><label class="num">+<input type="number" min="0" max="100" step="5" data-a="ct" data-k="${k}" data-f="price" value="${c.price}">MT</label><label class="sw"><input type="checkbox" data-a="ct" data-k="${k}" data-f="on" ${c.on ? 'checked' : ''} aria-label="${c.name} disponível"><span></span></label><span></span></div>`).join('')}</div>
    <div class="glass card"><h3>Sabores (preço de 50 a 150 MT por bola)</h3>${db.flavors.map((f, i) => `<div class="row"><input type="color" data-a="fl" data-i="${i}" data-f="c" value="${f.c}" aria-label="Cor"><input data-a="fl" data-i="${i}" data-f="name" value="${esc(f.name)}" aria-label="Nome"><label class="num"><input type="number" min="50" max="150" step="5" data-a="fl" data-i="${i}" data-f="price" value="${f.price}">MT</label><label class="sw"><input type="checkbox" data-a="fl" data-i="${i}" data-f="on" ${f.on ? 'checked' : ''} aria-label="${esc(f.name)} disponível"><span></span></label><button class="btn dng" data-do="delfl" data-i="${i}" aria-label="Remover">✕</button></div>`).join('')}
    <div class="row" style="margin-top:.6rem"><input id="nfc" type="color" value="#FF6FA8"><input id="nfn" placeholder="Novo sabor"><label class="num"><input id="nfp" type="number" min="50" max="150" step="5" value="120">MT</label><span></span><button class="btn pri" data-do="addfl">+</button></div></div>`;
  V.cardapio = () => `<div class="head"><h2>Cardápio</h2></div>${db.menu.map((c, ci) => `<div class="glass card"><details ${ci < 2 ? 'open' : ''}><summary>${c.title} (${c.items.length})</summary>${c.items.map((it, ii) => `<div class="row mn"><input data-a="mn" data-c="${ci}" data-i="${ii}" data-f="n" value="${esc(it.n)}"><label class="num"><input type="number" min="0" step="5" data-a="mn" data-c="${ci}" data-i="${ii}" data-f="p" value="${it.p}">MT</label><label class="sw"><input type="checkbox" data-a="mn" data-c="${ci}" data-i="${ii}" data-f="on" ${it.on ? 'checked' : ''} aria-label="Disponível"><span></span></label><button class="btn dng" data-do="delit" data-c="${ci}" data-i="${ii}" aria-label="Remover">✕</button></div>`).join('')}
    <div class="row mn"><input id="ni${ci}" placeholder="Novo item"><label class="num"><input id="np${ci}" type="number" min="0" step="5" value="100">MT</label><span></span><button class="btn pri" data-do="addit" data-c="${ci}">+</button></div></details></div>`).join('')}`;
  V.pedidos = () => `<div class="head"><h2>Pedidos</h2><span>${db.orders.filter(o => o.status === 'novo').length} novos</span></div><div class="glass card" style="overflow:auto"><table><tr><th>Quando</th><th>Pedido</th><th>Total</th><th>Estado</th><th></th></tr>${db.orders.slice(0, 60).map(o => `<tr><td>${new Date(o.t).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}${o.demo ? ' <span class="tag demo">demo</span>' : ''}</td><td><b>${db.containers[o.cont] ? db.containers[o.cont].name : o.cont}</b>: ${o.items.map(i => esc(i.name)).join(', ')}</td><td>${mt(o.total)}</td><td><select data-a="or" data-id="${o.id}">${ST.map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><button class="btn dng" data-do="delor" data-id="${o.id}" aria-label="Apagar">✕</button></td></tr>`).join('')}</table></div>`;
  V.ajustes = () => `<div class="head"><h2>Ajustes</h2></div><div class="glass card" style="display:grid;gap:.8rem;max-width:520px"><label>PIN do painel<br><input data-a="set" data-f="pin" value="${esc(db.pin)}"></label><label>WhatsApp para receber pedidos (com indicativo, sem +)<br><input data-a="set" data-f="wa" value="${esc(db.wa)}"></label></div>
    <div class="glass card"><h3>Dados</h3><p>Os dados ficam guardados neste navegador. Para uso real, ligue uma base de dados (veja o README).</p><div style="display:flex;gap:.6rem;flex-wrap:wrap"><button class="btn" data-do="export">Exportar JSON</button><label class="btn">Importar JSON<input id="imp" type="file" accept=".json" hidden></label><button class="btn" data-do="cleardemo">Apagar pedidos demo</button><button class="btn dng" data-do="reset">Repor tudo</button></div></div>`;

  function render() {
    db = DB.get(); if (!V[tab]) tab = 'bi';
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + tab));
    view.innerHTML = V[tab]();
    if (tab === 'bi') { const s = stats(range); drawLine($('#cDaily'), s.daily.map(d => d.v), s.daily.map(d => d.l)); drawBars($('#cHours'), s.hrs, s.hrs.map((_, i) => 8 + i)); }
  }
  addEventListener('hashchange', () => { tab = location.hash.slice(1); render(); });
  addEventListener('resize', () => { if (tab === 'bi') render(); });
  DB.on(render);

  /* ---------- eventos ---------- */
  document.addEventListener('change', e => {
    const t = e.target, a = t.dataset.a; if (!a) return; db = DB.get();
    let v = t.type === 'checkbox' ? t.checked : t.type === 'number' ? +t.value : t.value;
    if (a === 'open') db.open = v;
    if (a === 'fl') { if (t.dataset.f === 'price') v = Math.min(150, Math.max(50, v || 50)); db.flavors[t.dataset.i][t.dataset.f] = v; }
    if (a === 'ct') db.containers[t.dataset.k][t.dataset.f] = v;
    if (a === 'mn') db.menu[t.dataset.c].items[t.dataset.i][t.dataset.f] = v;
    if (a === 'or') db.orders.find(o => o.id === +t.dataset.id).status = v;
    if (a === 'set') db[t.dataset.f] = v;
    save(); render();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-do]'); if (!b) return; db = DB.get(); const d = b.dataset, act = d.do;
    if (act === 'range') range = +d.v;
    if (act === 'allon' || act === 'alloff') db.flavors.forEach(f => f.on = act === 'allon');
    if (act === 'delfl' && confirm('Remover este sabor?')) db.flavors.splice(d.i, 1);
    if (act === 'addfl') { const n = $('#nfn').value.trim(); if (!n) return; db.flavors.push({ id: 'f' + Date.now(), name: n, c: $('#nfc').value, price: Math.min(150, Math.max(50, +$('#nfp').value || 120)), bits: '#ffffff', on: true }); }
    if (act === 'addit') { const n = $('#ni' + d.c).value.trim(); if (!n) return; db.menu[d.c].items.push({ n, p: +$('#np' + d.c).value || 0, on: true }); }
    if (act === 'delit') db.menu[d.c].items.splice(d.i, 1);
    if (act === 'delor') db.orders = db.orders.filter(o => o.id !== +d.id);
    if (act === 'cleardemo') db.orders = db.orders.filter(o => !o.demo);
    if (act === 'reset') { if (!confirm('Repor todos os dados de fábrica?')) return; db = DB.reset(); }
    if (act === 'export') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })); a.download = 'divino-backup.json'; a.click(); return; }
    save(); render();
  });
  document.addEventListener('change', e => {
    if (e.target.id !== 'imp' || !e.target.files[0]) return;
    const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (!d.flavors) throw 0; DB.save(d); render(); } catch (x) { alert('Ficheiro inválido.'); } }; r.readAsText(e.target.files[0]);
  });
  render();
})();
