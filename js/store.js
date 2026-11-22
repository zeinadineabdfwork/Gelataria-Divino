/* Divino · armazenamento partilhado (site + admin) via localStorage.
   Para produção, troque get()/save() por chamadas a uma API/base de dados. */
(function () {
  const KEY = 'divino.v1';
  const F = (id, name, c, price, bits) => ({ id, name, c, price, bits, on: true });
  const M = (id, title, items) => ({ id, title, items: items.map(([n, p]) => ({ n, p, on: true })) });

  const FLAVORS = [
    F('maracuja', 'Maracujá', '#FFC61A', 120, '#3b2a00'), F('morango', 'Morango', '#FF4D7E', 120, '#c8123f'),
    F('chocolate', 'Chocolate', '#6A3B24', 130, '#2b140a'), F('baunilha', 'Baunilha', '#FFF0C4', 100, '#d9a441'),
    F('manga', 'Manga', '#FF9A1F', 130, '#e06b00'), F('pistachio', 'Pistáchio', '#9AD65B', 150, '#6a4a2a'),
    F('coco', 'Coco', '#F6F2E8', 110, '#d9cdb5'), F('limao', 'Limão', '#D4F23A', 110, '#8fb000'),
    F('menta', 'Menta c/ Choc', '#5FE8C9', 140, '#2b140a'), F('frutos', 'Frutos Silvestres', '#9250E0', 140, '#4b1d8f'),
    F('caramelo', 'Caramelo', '#E8A24A', 130, '#8a4d10'), F('oreo', 'Oreo', '#CFC5BC', 140, '#1c1c1c')
  ];

  const MENU = [
    M('gelados', 'Gelados', [['1 bola', 120], ['2 bolas', 180], ['3 bolas', 220]]),
    M('milkshakes', 'Milkshakes', [['Baunilha', 220], ['Chocomint', 290], ['Nutella', 220], ['Óreo', 300]]),
    M('batidos', 'Batidos', [['Tropical', 310], ['Banana e Aveia', 350], ['Banana Divino', 350], ['Divino', 390]]),
    M('sobremesas', 'Sobremesas', [['Panquecas c/ Nutella', 320], ['Panquecas de Banana e Aveia c/ Nutella', 350], ['Crepe de Chocolate', 230], ['Papa de Aveia', 330], ['Oreo Frito', 330], ['Waffle c/ Gelado', 350], ['Waffle Manteiga e Mel', 280]]),
    M('pastelaria', 'Pastelaria', [['Pastel de Natas', 80], ['Palmier', 80], ['Croissant Simples', 100], ['Croissant c/ Chocolate', 130], ['CupCake', 150]]),
    M('sumos', 'Sumos Naturais', [['Especial', 300], ['Verão Ardente', 300], ['Cocopine', 300], ['Da Terra', 300], ['Melancia Doce', 300], ['A Nossa Paixão', 300], ['Doce de Banana', 300], ['Doce de Manga', 300], ['A Nossa Laranja', 300], ['Laranja Divina', 300], ['Limonada', 300], ['Coco Divinal', 300], ['Flower Lemonada', 320]]),
    M('tostas', 'Tostas e Sandes', [['Tosta Mista', 250], ['Tosta de Atum', 250], ['Tosta de Fiambre', 210], ['Tosta de Queijo', 210], ['Tosta de Frango', 250], ['Sandes de Fiambre', 180], ['Sandes de Queijo', 180], ['Sandes de Ovo', 180], ['Sandes Mista', 250]]),
    M('omeletes', 'Omeletes', [['Simples', 150], ['de Queijo', 200], ['de Atum', 250], ['de Frango', 250], ['Mista', 230]]),
    M('refeicoes', 'Pregos e Hambúrgueres', [['Prego no Pão', 200], ['Prego no Prato', 350], ['Prego Especial', 500], ['Hambúrguer Simples', 170], ['Hambúrguer Completo', 350], ['Hambúrguer Especial', 400]]),
    M('quentes', 'Bebidas Quentes', [['Café Expresso', 80], ['Capuccino', 130], ['Chocolate Quente', 130], ['Mochaccino', 130], ['Chafé Longo', 90], ['Chás Selecionados', 90]]),
    M('bebidas', 'Refrigerantes e Água', [['Coca-Cola / Sprite', 80], ['Fanta Uva', 80], ['Sparleta', 80], ['Água', 65], ['Água Tónica', 80], ['General', 80]]),
    M('detox', 'Detox', [['Pequeno', 140], ['Médio', 250], ['Grande', 300]])
  ];

  const CONT = { copo: { name: 'Copo', price: 0, on: true }, cone: { name: 'Cone', price: 20, on: true }, wafer: { name: 'Wafer', price: 30, on: true } };

  function demo() { // 21 dias de pedidos fictícios para o painel de BI
    let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const wf = [.9, 1.7, 1.4, 1, 1.2, .5, .8, .7, .6, .9, 1.1, .7];
    const pick = (w) => { let t = r() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { t -= w[i]; if (t <= 0) return i; } return 0; };
    const hw = [1, 2, 3, 3, 4, 5, 7, 8, 8, 6, 4, 3, 2, 1, 1]; // 8h..22h
    const out = []; const now = Date.now();
    for (let d = 20; d >= 0; d--) {
      const day = new Date(now - d * 864e5), wk = day.getDay(); const n = 3 + Math.floor(r() * 5) + (wk === 0 || wk === 6 ? 5 : 0);
      for (let i = 0; i < n; i++) {
        const cont = ['copo', 'cone', 'wafer'][pick([35, 40, 25])]; const k = 1 + pick([5, 4, 2, 1]);
        const items = Array.from({ length: k }, () => { const f = FLAVORS[pick(wf)]; return { id: f.id, name: f.name, price: f.price }; });
        const t = new Date(day); t.setHours(8 + pick(hw), Math.floor(r() * 60), 0, 0);
        if (t.getTime() > now) continue;
        out.push({ id: t.getTime() + i, t: t.getTime(), cont, items, total: CONT[cont].price + items.reduce((a, b) => a + b.price, 0), status: 'entregue', demo: true });
      }
    }
    return out.sort((a, b) => b.t - a.t);
  }

  const seed = () => ({ open: true, pin: '1234', wa: '258840000000', flavors: FLAVORS.map(f => ({ ...f })), containers: JSON.parse(JSON.stringify(CONT)), menu: JSON.parse(JSON.stringify(MENU)), orders: demo() });

  const DB = {
    get() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.flavors) return d; } catch (e) { } const d = seed(); DB.save(d); return d; },
    save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } },
    reset() { const d = seed(); DB.save(d); return d; },
    on(fn) { addEventListener('storage', e => { if (e.key === KEY) fn(); }); },
    mt: n => Math.round(n).toLocaleString('pt-PT') + ' MT'
  };
  window.DB = DB;
})();
