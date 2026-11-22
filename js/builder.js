/* Divino · construtor de gelado: drag & drop + three.js */
(() => {
  const MAX = 5, GAP = 1.45, ICON = { copo: '🥤', cone: '🍦', wafer: '🧇' };
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let db = DB.get();
  const state = { cont: null, scoops: [] };
  const fl = id => db.flavors.find(f => f.id === id);
  const stage = $('#stage'), cv = $('#gl');
  const V = (x, y, z) => new THREE.Vector3(x, y, z), R = Math.random;

  /* ---------- cena ---------- */
  const ren = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  ren.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2));
  const S = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, 1, .1, 100);
  S.add(new THREE.HemisphereLight(0xffffff, 0xffb6d5, .95));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 8, 6); S.add(key);
  const p1 = new THREE.PointLight(0xff5fa8, .9, 30); p1.position.set(-5, 3, 3); S.add(p1);
  const p2 = new THREE.PointLight(0x2fd6d0, .9, 30); p2.position.set(5, 2, -2); S.add(p2);
  const G = new THREE.Group(); S.add(G);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, .4, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6 }));
  ped.position.y = -.2; S.add(ped);

  function tex(draw, w, h, rep) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); return t;
  }
  const waffle = rep => tex((x, w, h) => { x.fillStyle = '#EBAE50'; x.fillRect(0, 0, w, h); x.strokeStyle = '#B9751F'; x.lineWidth = 7; for (let k = -128; k < 256; k += 32) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 128, 128); x.moveTo(k + 128, 0); x.lineTo(k, 128); x.stroke(); } }, 128, 128, rep);
  const cupTex = () => tex((x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.font = '800 30px sans-serif'; x.textAlign = 'center'; for (let r = 0; r < 6; r++) { x.fillStyle = r % 2 ? '#FF6FA8' : '#14B5B0'; x.fillText('I ♥ DIVINO  I ♥ DIVINO  I ♥ DIVINO', w / 2 + (r % 2 ? 40 : 0), 34 + r * 42); } }, 512, 256);
  const discTex = () => tex((x, w, h) => { x.fillStyle = '#F2C26B'; x.fillRect(0, 0, w, h); x.strokeStyle = '#D9A04A'; x.lineWidth = 5; for (let k = 0; k < w; k += 26) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, h); x.moveTo(0, k); x.lineTo(w, k); x.stroke(); } x.fillStyle = '#A3098A'; x.font = '800 34px sans-serif'; x.textAlign = 'center'; x.fillText('I ♥ DIVINO', w / 2, h / 2 + 12); }, 256, 256);

  const mat = o => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: .55, side: THREE.DoubleSide, clearcoat: .2 }, o));
  const lathe = (pts, m) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), 48), m);
  const rimOf = (r, y, c) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .08, 12, 48), mat({ color: c })); t.rotation.x = Math.PI / 2; t.position.y = y; return t; };

  const CONT = {
    copo: { base: 1.95, rim: 1.9, mk() { const g = new THREE.Group(); g.add(lathe([[.001, 0], [.85, 0], [.95, .08], [1.28, 1.85], [1.36, 1.92]], mat({ map: cupTex() })), rimOf(1.33, 1.9, 0xffffff)); return g; } },
    cone: { base: 3.15, rim: 2.95, mk() { const g = new THREE.Group(); g.add(lathe([[.001, 0], [1.12, 2.95]], mat({ map: waffle([6, 4]) })), rimOf(1.12, 2.95, 0xC98633)); return g; } },
    wafer: { base: 1.8, rim: 1.65, mk() { const g = new THREE.Group(), m = mat({ map: waffle([8, 3]), emissive: 0xffc040, emissiveIntensity: 0 }); g.userData.m = m; g.add(lathe([[.001, .2], [.7, .2], [1.15, .7], [1.5, 1.35], [1.62, 1.65]], m), rimOf(1.62, 1.65, 0xC98633)); return g; } }
  };
  let contMesh = null; const cs = { sq: 0, sv: 0, w: 0, wv: 0, pulse: 0, ap: 1 };
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .07, 40), [mat({ color: 0xD9A04A }), mat({ map: discTex() }), mat({ color: 0xD9A04A })]);
  disc.visible = false; G.add(disc);

  function mkScoop(f) {
    const g = new THREE.SphereGeometry(1, 48, 36), p = g.attributes.position, v = V();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + .04 * Math.sin(v.x * 4 + v.y * 2.5) * Math.cos(v.z * 4.5 - v.y * 2) + .025 * Math.sin(v.y * 9 + v.x * 3)); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals();
    const m = mat({ color: f.c, roughness: .38, clearcoat: .55, clearcoatRoughness: .3, side: THREE.FrontSide }), s = new THREE.Mesh(g, m);
    const sk = new THREE.Mesh(new THREE.TorusGeometry(.8, .22, 16, 40), m); sk.rotation.x = Math.PI / 2; sk.position.y = -.62; sk.scale.z = .8; s.add(sk);
    const bm = new THREE.MeshStandardMaterial({ color: f.bits, roughness: .6 });
    for (let i = 0; i < 16; i++) { const d = V(R() - .5, R() * .9 - .1, R() - .5).normalize(), b = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), bm); b.position.copy(d).multiplyScalar(1.015); b.scale.setScalar(.05 + R() * .05); s.add(b); }
    return s;
  }

  /* ---------- partículas e efeitos ---------- */
  const parts = [], gS = new THREE.SphereGeometry(1, 10, 8), gB = new THREE.BoxGeometry(1, 1, 1), gO = new THREE.OctahedronGeometry(1), gT = new THREE.TorusGeometry(1, .05, 8, 48);
  function part(geo, color, pos, vel, sz, life, o = {}) {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, transparent: true, roughness: .4, emissive: o.glow ? color : 0, emissiveIntensity: o.glow || 0 }));
    m.position.copy(pos); m.scale.setScalar(sz); G.add(m);
    parts.push({ m, v: vel, life, age: 0, g: o.g === undefined ? 16 : o.g, sp: o.sp || 0, sz, grow: o.grow || 0 }); return m;
  }
  const ring = (y, c, sz, grow, life) => { part(gT, c, V(0, y, 0), V(0, 0, 0), sz, life, { g: 0, grow }).rotation.x = Math.PI / 2; };
  const FX = {
    copo(y, f) { // respingo líquido + bolhas + onda
      for (let i = 0; i < 26; i++) { const a = R() * 6.28, s = 2 + R() * 3; part(gS, f.c, V(Math.cos(a) * .9, y, Math.sin(a) * .9), V(Math.cos(a) * s, 4 + R() * 4, Math.sin(a) * s), .06 + R() * .1, 1); }
      for (let i = 0; i < 8; i++) { const a = R() * 6.28; part(gS, '#ffffff', V(0, y, 0), V(Math.cos(a) * 1.5, 3 + R() * 3, Math.sin(a) * 1.5), .05, 1.1, { g: 4 }); }
      ring(y, f.c, 1.1, 2.2, .8); cs.wv = 2.4 * (R() < .5 ? -1 : 1);
    },
    cone(y) { // migalhas crocantes + poeira de açúcar
      const cr = ['#E1A24A', '#C98633', '#F2C26B'];
      for (let i = 0; i < 24; i++) { const a = R() * 6.28, s = 1.5 + R() * 2.5; part(gB, cr[i % 3], V(Math.cos(a) * 1, y, Math.sin(a) * 1), V(Math.cos(a) * s, 1 + R() * 3, Math.sin(a) * s), .05 + R() * .08, 1.1, { g: 18, sp: 9 }); }
      ring(y, '#E9B567', 1.1, 1.8, .6); cs.wv = 1.3;
    },
    wafer(y) { // estrelas douradas e brilho
      const cl = ['#FFD23F', '#ffffff', '#FF6FA8', '#5FE8C9'];
      for (let i = 0; i < 20; i++) { const a = R() * 6.28, s = 1 + R() * 2.5; part(gO, cl[i % 4], V(Math.cos(a) * .6, y, Math.sin(a) * .6), V(Math.cos(a) * s, 4 + R() * 4, Math.sin(a) * s), .07 + R() * .12, 1.3, { g: 6, sp: 7, glow: .9 }); }
      ring(y, '#FFD23F', 1.3, 2.8, .9); cs.pulse = 1;
    }
  };

  /* ---------- layout e câmera ---------- */
  const cur = { look: 1.8, dist: 10 }, tgt = { look: 1.8, dist: 10 };
  function layout(snap) {
    const k = state.cont, base = k ? CONT[k].base : 1.8, n = state.scoops.length;
    state.scoops.forEach((s, i) => { s.y = base + i * GAP; if (snap && !s.fall) s.m.position.y = s.y; });
    const top = n ? base + (n - 1) * GAP + 1.2 : base + .6, asp = cam.aspect || 1;
    tgt.look = top * .46; tgt.dist = Math.max(8.5, (top + 1.8) / .611 * 1.05, 4.2 / (.611 * asp));
    disc.visible = k === 'wafer' && n > 0; disc.position.set(.55, top - .35, .1); disc.rotation.z = -.55; disc.rotation.x = .3;
    if (snap) { cur.look = tgt.look; cur.dist = tgt.dist; }
  }
  function resize() { const w = stage.clientWidth, h = stage.clientHeight; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); layout(); }
  new ResizeObserver(resize).observe(stage);

  let last = performance.now(), spin = true, vis = true;
  new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(stage);
  function tick(t) {
    requestAnimationFrame(tick); const dt = Math.min(.05, (t - last) / 1000); last = t; if (!vis) return;
    for (const s of state.scoops) {
      if (s.fall) {
        s.vy -= 24 * dt; s.m.position.y += s.vy * dt;
        if (s.m.position.y <= s.y) { s.m.position.y = s.y; if (!s.hit) { s.hit = 1; impact(s); } if (s.vy < -3) s.vy = -s.vy * .28; else { s.fall = false; s.vy = 0; } }
      }
      s.sv += (-170 * s.sq - 9 * s.sv) * dt; s.sq += s.sv * dt; s.m.scale.set(1 + s.sq * .16, 1 - s.sq * .3, 1 + s.sq * .16);
    }
    cs.sv += (-150 * cs.sq - 10 * cs.sv) * dt; cs.sq += cs.sv * dt; cs.wv += (-140 * cs.w - 7 * cs.wv) * dt; cs.w += cs.wv * dt; cs.pulse *= 1 - 3 * dt; cs.ap += (1 - cs.ap) * Math.min(1, dt * 9);
    G.rotation.z = cs.w;
    if (contMesh) { contMesh.scale.set((1 + cs.sq * .04) * cs.ap, (1 - cs.sq * .07) * cs.ap, (1 + cs.sq * .04) * cs.ap); if (contMesh.userData.m) contMesh.userData.m.emissiveIntensity = cs.pulse * .6; }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.age += dt; p.v.y -= p.g * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += p.sp * dt; p.m.rotation.z += p.sp * dt;
      const k = p.age / p.life; p.m.material.opacity = Math.max(0, 1 - k * k); if (p.grow) p.m.scale.setScalar(p.sz * (1 + p.grow * k));
      if (k >= 1) { G.remove(p.m); p.m.material.dispose(); parts.splice(i, 1); }
    }
    if (spin) G.rotation.y += dt * .35;
    cur.look += (tgt.look - cur.look) * Math.min(1, dt * 3); cur.dist += (tgt.dist - cur.dist) * Math.min(1, dt * 3);
    cam.position.set(0, cur.look + 1.4, cur.dist); cam.lookAt(0, cur.look, 0); ren.render(S, cam);
  }
  requestAnimationFrame(tick);
  let dx = null;
  cv.addEventListener('pointerdown', e => { dx = e.clientX; spin = false; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (dx !== null) { G.rotation.y += (e.clientX - dx) * .01; dx = e.clientX; } });
  addEventListener('pointerup', () => { if (dx !== null) { dx = null; spin = true; } });

  /* ---------- ações ---------- */
  function impact(s) { s.sq = 1; s.sv = 0; cs.sq = 1; cs.sv = 0; FX[state.cont](s.i === 0 ? CONT[state.cont].rim : s.y - .8, s.f); }
  function setContainer(k) {
    if (state.cont === k) return;
    if (contMesh) G.remove(contMesh); contMesh = CONT[k].mk(); G.add(contMesh); state.cont = k; cs.ap = 0; layout(true);
    for (let i = 0; i < 14; i++) { const a = R() * 6.28; part(gS, ['#FF6FA8', '#FFD23F', '#14B5B0'][i % 3], V(0, 1, 0), V(Math.cos(a) * 2.5, 3 + R() * 2, Math.sin(a) * 2.5), .09, .9); }
    $('#hint').classList.add('gone'); renderConts(); renderSum();
  }
  function addScoop(f) {
    const m = mkScoop(f), i = state.scoops.length; m.position.set(0, CONT[state.cont].base + i * GAP + 7, 0); m.rotation.y = R() * 6; G.add(m);
    state.scoops.push({ m, f, i, y: 0, vy: -2, fall: true, hit: 0, sq: 0, sv: 0 }); layout(); renderSum();
  }
  function undo() { const s = state.scoops.pop(); if (!s) return; G.remove(s.m); layout(); renderSum(); }
  function clearAll() { while (state.scoops.length) undo(); }
  const price = s => (fl(s.f.id) || s.f).price;
  function renderSum() {
    const L = [], c = state.cont; let tot = 0;
    if (c) { const p = db.containers[c].price; tot += p; L.push(`<li><i style="--c:#14B5B0"></i>${db.containers[c].name}<span>${p ? '+' + p + ' MT' : 'grátis'}</span></li>`); }
    state.scoops.forEach(s => { const ok = (fl(s.f.id) || {}).on; tot += price(s); L.push(`<li><i style="--c:${s.f.c}"></i>${s.f.name}${ok ? '' : ' (indisponível)'}<span>${price(s)} MT</span></li>`); });
    $('#lines').innerHTML = L.join('') || '<li class="empty">Comece por arrastar uma base para a plataforma.</li>'; $('#total').textContent = DB.mt(tot);
  }
  function renderConts() {
    $('#conts').innerHTML = Object.entries(db.containers).map(([k, c]) => `<button class="cont ${c.on ? '' : 'off'} ${state.cont === k ? 'sel' : ''}" data-k="${k}"><em>${ICON[k]}</em>${c.name}<small>${c.price ? '+' + c.price + ' MT' : 'grátis'}</small></button>`).join('');
    $$('.cont').forEach(el => bindDrag(el, 'c', el.dataset.k));
  }
  function renderFlavors() {
    $('#flavors').innerHTML = db.flavors.map(f => `<button class="flavor ${f.on ? '' : 'off'}" data-k="${f.id}" style="--c:${f.c}"><i class="sc"></i><b>${f.name}</b><small>${f.price} MT</small></button>`).join('');
    $$('.flavor').forEach(el => bindDrag(el, 'f', el.dataset.k));
  }
  function refresh() { db = DB.get(); $('#shut').hidden = db.open; renderConts(); renderFlavors(); renderSum(); }

  /* ---------- drag & drop ---------- */
  const inStage = e => { const r = stage.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
  function bindDrag(el, kind, id) {
    const go = e => {
      db = DB.get(); const off = kind === 'f' ? !fl(id).on : !db.containers[id].on;
      if (off) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return toast('Esgotado hoje. Escolha outra opção!'); }
      if (e.type === 'keydown') return drop(kind, id, innerWidth / 2, innerHeight / 2);
      e.preventDefault(); const sx = e.clientX, sy = e.clientY; let g = null, moved = false;
      const mv = ev => {
        if (!g && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
          moved = true; g = document.createElement('div'); g.className = 'ghostchip';
          g.innerHTML = kind === 'f' ? `<i class="sc" style="--c:${fl(id).c}"></i>${fl(id).name}` : `<em>${ICON[id]}</em>${db.containers[id].name}`; document.body.appendChild(g); el.classList.add('lift');
        }
        if (g) { g.style.transform = `translate(${ev.clientX - 46}px,${ev.clientY - 46}px) rotate(-6deg)`; stage.classList.toggle('over', inStage(ev)); }
      };
      const up = ev => {
        removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
        if (g) g.remove(); el.classList.remove('lift'); stage.classList.remove('over');
        if (ev.type === 'pointercancel') return; // rolagem da lista no toque: não adiciona nada
        if (!moved) { const r = stage.getBoundingClientRect(); return drop(kind, id, r.left + r.width / 2, r.top + r.height / 3); }
        if (ev.type === 'pointerup' && inStage(ev)) drop(kind, id, ev.clientX, ev.clientY);
      };
      addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    };
    el.addEventListener('pointerdown', go);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
  }
  function label(x, y, t) { const p = document.createElement('div'); p.className = 'pop'; p.textContent = t; p.style.left = x - 30 + 'px'; p.style.top = y - 20 + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 900); }
  function drop(kind, id, x, y) {
    db = DB.get(); if (!db.open) return toast('A loja está fechada de momento.');
    if (kind === 'c') { setContainer(id); return label(x, y, db.containers[id].name + '!'); }
    if (!state.cont) { stage.classList.remove('flash'); void stage.offsetWidth; stage.classList.add('flash'); return toast('Primeiro escolha o copo, o cone ou o wafer.'); }
    if (state.scoops.length >= MAX) return toast('O máximo é ' + MAX + ' bolas.');
    const f = fl(id); addScoop({ id: f.id, name: f.name, c: f.c, bits: f.bits, price: f.price }); label(x, y, '+' + f.price + ' MT');
  }

  $('#undo').onclick = undo;
  $('#clear').onclick = () => { clearAll(); };
  $('#order').onclick = () => {
    db = DB.get(); const c = state.cont;
    if (!db.open) return toast('A loja está fechada de momento.');
    if (!c || !state.scoops.length) return toast('Escolha uma base e pelo menos uma bola.');
    if (!db.containers[c].on || state.scoops.some(s => !(fl(s.f.id) || {}).on)) return toast('Algum item ficou indisponível. Ajuste o seu gelado.');
    const items = state.scoops.map(s => ({ id: s.f.id, name: s.f.name, price: price(s) })), total = db.containers[c].price + items.reduce((a, b) => a + b.price, 0);
    db.orders.unshift({ id: Date.now(), t: Date.now(), cont: c, items, total, status: 'novo' }); DB.save(db);
    const txt = `Olá Divino! Quero um ${db.containers[c].name} com: ${items.map(i => i.name).join(', ')}. Total: ${DB.mt(total)}.`;
    for (let i = 0; i < 3; i++) setTimeout(() => FX.wafer(CONT[c].rim + 1 + i), i * 150);
    clearAll(); toast('Pedido registado! A abrir o WhatsApp…');
    setTimeout(() => window.open(`https://wa.me/${db.wa}?text=${encodeURIComponent(txt)}`, '_blank'), 900);
  };
  DB.on(refresh); refresh(); resize();
})();
