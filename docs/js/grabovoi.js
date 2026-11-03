/* Barra de códigos Grabovoi de Pedro. Se inyecta sola: crea la franja fija arriba,
   empuja el contenido 36px y baja los encabezados fijos/pegajosos/absolutos.
   Los códigos se pintan con CSS (content:attr(data-t)) para que no formen parte
   del texto indexable. Colores por atributos data-* en la etiqueta <script>. */
(function () {
  var s = document.currentScript || {};
  var d = s.dataset || {};
  var BG = d.bg || 'linear-gradient(90deg,#4C1D95,#6D28D9,#8B5CF6,#6D28D9,#4C1D95)';
  var NUM = d.num || '#fff';
  var DESC = d.desc || 'rgba(255,255,255,.6)';
  var SEP = d.sep || 'rgba(255,255,255,.35)';
  var H = 36;

  var CODES = [
    ['71427321893', 'Abundancia eterna'],
    ['289 471 314917', 'Prosperidad en negocios'],
    ['91688', 'Remover obstáculos'],
    ['4987123184991', 'Rentabilidad máxima'],
    ['318 612 518 714', 'Flujo constante de dinero'],
    ['520', 'Dinero inesperado'],
    ['741', 'Resultados inmediatos'],
    ['8888', 'Protección divina'],
    ['777', 'Suerte universal'],
    ['5207418', 'Dinero viene fácil'],
    ['819 419 714', 'Independencia económica'],
    ['918197185', 'Éxito absoluto'],
    ['719 481 71', 'Materializar planes'],
    ['419 488 71', 'Atraer circunstancias favorables'],
    ['318719 819', 'Auto realización'],
    ['14111963', 'Armonía en el trabajo'],
    ['518 617219 71', 'Rendimiento efectivo']
  ];

  var css =
    '.grabovoi-bar{background:' + BG + ';position:fixed;top:0;left:0;right:0;width:100%;z-index:9000;box-sizing:border-box;height:' + H + 'px;padding:0 12px;overflow:hidden;display:flex;align-items:center;min-width:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
    '.grabovoi-scroll{flex:1;min-width:0;width:100%;overflow:hidden;height:100%}' +
    '.grabovoi-track{display:flex;gap:0;animation:grabScroll 50s linear infinite;width:max-content;align-items:center;height:100%}' +
    '@keyframes grabScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}' +
    '.grabovoi-codes{display:flex;align-items:center}' +
    '.grab-code{display:flex;align-items:center;gap:8px;padding:0 24px}' +
    '.grab-num{font-size:13px;font-weight:600;color:' + NUM + ';letter-spacing:.06em;font-variant-numeric:tabular-nums;white-space:nowrap}' +
    '.grab-desc{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:' + DESC + ';white-space:nowrap}' +
    '.grab-sep{color:' + SEP + ';font-size:16px;line-height:1;flex-shrink:0}' +
    '.grab-num::before,.grab-desc::before,.grab-sep::before{content:attr(data-t)}' +
    '@media (max-width:860px){.grabovoi-codes{gap:12px}.grab-sep{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.grabovoi-track{animation-duration:160s}}';

  function row() {
    var wrap = document.createElement('div');
    wrap.className = 'grabovoi-codes';
    CODES.forEach(function (item, i) {
      if (i > 0) {
        var sep = document.createElement('div');
        sep.className = 'grab-sep';
        sep.setAttribute('data-t', '·');
        wrap.appendChild(sep);
      }
      var code = document.createElement('div');
      code.className = 'grab-code';
      var num = document.createElement('span');
      num.className = 'grab-num';
      num.setAttribute('data-t', item[0]);
      var desc = document.createElement('span');
      desc.className = 'grab-desc';
      desc.setAttribute('data-t', item[1]);
      code.appendChild(num);
      code.appendChild(desc);
      wrap.appendChild(code);
    });
    return wrap;
  }

  function init() {
    if (document.querySelector('.grabovoi-bar')) return;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'grabovoi-bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.setAttribute('role', 'presentation');
    bar.setAttribute('data-nosnippet', '');
    var scroll = document.createElement('div');
    scroll.className = 'grabovoi-scroll';
    var track = document.createElement('div');
    track.className = 'grabovoi-track';
    track.appendChild(row());
    track.appendChild(row());
    scroll.appendChild(track);
    bar.appendChild(scroll);
    document.body.insertBefore(bar, document.body.firstChild);

    // Empuja el contenido y baja los encabezados que estaban pegados arriba.
    var bodyPad = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
    document.body.style.paddingTop = (bodyPad + H) + 'px';
    document.documentElement.style.scrollPaddingTop = H + 'px';
    var heads = document.querySelectorAll('header, .hdr, .header, .topbar, .navbar');
    Array.prototype.forEach.call(heads, function (h) {
      var cs = getComputedStyle(h);
      var top = parseFloat(cs.top);
      if ((cs.position === 'fixed' || cs.position === 'sticky' || cs.position === 'absolute') && (!top || top === 0)) {
        h.style.top = H + 'px';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
