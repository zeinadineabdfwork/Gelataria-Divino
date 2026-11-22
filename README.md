# Gelataria Divino

Landing page + construtor 3D de gelado + painel admin.

## Como abrir
1. Descompacte a pasta.
2. Abra um terminal na pasta e corra `python3 -m http.server 8080` (ou use a extensão Live Server do VS Code).
3. Site: http://localhost:8080/index.html — Admin: http://localhost:8080/admin/index.html (PIN inicial **1234**).
É preciso internet para carregar o three.js (cdnjs) e as fontes Google. Para funcionar offline, descarregue `three.min.js` (r128) para `js/` e altere a tag `<script>` em `index.html`.

## Estrutura
- `index.html`: landing (hero, secção Produtos com feedback, construtor, cardápio)
- `js/builder.js`: drag & drop + three.js (bolas, copo/cone/wafer e efeitos de impacto)
- `js/store.js`: dados (sabores, cardápio, pedidos). Usa localStorage: site e admin partilham dados no mesmo navegador
- `admin/`: painel liquid glass (BI, sabores, cardápio, pedidos, ajustes)
- `assets/img/`: imagens e logo melhorada (`logo-original-melhorada.png`, a logo vetorial está inline em `index.html`)

## Para produção
O localStorage serve para demonstração. Para o restaurante usar a sério, troque `DB.get()/DB.save()` em `js/store.js` por chamadas a uma API (Supabase, Firebase ou backend próprio) e proteja o admin com login real (o PIN atual é só no cliente).
O texto do feedback (secção Produtos) é um exemplo: substitua por um depoimento real.

## Dispositivos
Testado em layouts de telemóvel (390px), tablet (820px) e desktop (1366px) sem rolagem horizontal. No telemóvel o painel de sabores fica ao lado do palco 3D; toque num sabor ou arraste-o. O admin usa barra de navegação inferior em ecrãs pequenos.
