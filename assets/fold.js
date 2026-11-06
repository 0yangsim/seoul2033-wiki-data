
/* 나무위키식 제목 접기/펼치기 + #s-N 앵커 이동 (앱 WebView에서도 그대로 사용 가능)
   구조: <div class="fold-h" data-level="N">제목</div><div class="fold-b">본문</div> 이 순서대로 나열 */
(function () {
  var blocks = [].slice.call(document.querySelectorAll('.fold-h, .fold-b'));
  function lvl(el) { return parseInt(el.getAttribute('data-level'), 10); }
  function apply() {
    var hide = null;
    blocks.forEach(function (el) {
      if (el.classList.contains('fold-h')) {
        if (hide !== null && lvl(el) <= hide) hide = null;
        el.style.display = hide !== null ? 'none' : '';
        if (hide === null && el.classList.contains('collapsed')) hide = lvl(el);
        var hd0 = el.querySelector('h1,h2,h3,h4,h5,h6');   // 나무위키 CSS: .wiki-heading.wiki-heading-folded → 흐림+아이콘 변경
        if (hd0) { hd0.classList.add('wiki-heading'); hd0.classList.toggle('wiki-heading-folded', el.classList.contains('collapsed')); }
      } else {
        el.style.display = hide !== null ? 'none' : '';
      }
    });
  }
  blocks.forEach(function (el) {
    if (!el.classList.contains('fold-h')) return;
    el.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (a && !(a.id && /^s-/.test(a.id))) return;   // 일반 링크는 그대로 동작
      e.preventDefault();
      el.classList.toggle('collapsed');
      apply();
    });
  });
  // ---- 각주 팝업 (나무위키처럼 클릭하면 말풍선으로 내용 표시) ----
  var pop = null;
  function closePop() { if (pop) { if (pop._arrow) pop._arrow.remove(); pop.remove(); pop = null; } }
  function showFootnote(a) {
    closePop();
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    var tgt = document.getElementById(id);
    var entry = tgt && tgt.parentElement;
    var dark = !!document.querySelector('.theseed-dark-mode');
    // 나무위키(vue-final-modal): 반투명 검정 오버레이(0.5) + 가운데 창 + 아래 전체폭 버튼. 창 배경: 라이트 흰색 / 다크 rgb(45,47,52)
    var overlay = document.createElement('div');
    overlay.className = 'fn-overlay';
    overlay.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:10000;background:rgba(0,0,0,.5);' +
      'display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
    var box = document.createElement('div');
    box.className = 'fn-popup';
    box.style.cssText = 'width:min(45rem,100%);max-height:80vh;display:flex;flex-direction:column;overflow:hidden;' +
      'border-radius:6px;box-sizing:border-box;color:inherit;background:' + (dark ? 'rgb(45,47,52)' : '#fff') + ';' +
      'box-shadow:rgba(0,0,0,.4) 0 20px 60px -2px';
    var body = document.createElement('div');
    body.style.cssText = 'padding:1rem;overflow:auto;line-height:1.6;word-break:break-word';
    if (entry) body.innerHTML = entry.innerHTML;
    else body.textContent = a.getAttribute('title') || '';
    if (!body.textContent.trim()) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = '닫기';
    btn.style.cssText = 'width:100%;border:0;border-top:1px solid ' + (dark ? 'rgb(17,17,17)' : '#eee') + ';padding:.7rem;cursor:pointer;' +
      'font:inherit;color:inherit;background:' + (dark ? 'rgb(39,41,45)' : '#fafafa');
    btn.addEventListener('click', closePop);
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) closePop(); });
    box.appendChild(body); box.appendChild(btn); overlay.appendChild(box);
    document.body.appendChild(overlay);
    pop = overlay;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });
  function openTo(id) {            // #s-N 로 이동할 때 접힌 상위 제목을 펼친다
    if (!id) return;
    var t = document.getElementById(id);
    if (!t) return;
    var holder = t.closest('.fold-h, .fold-b');
    if (!holder) return;
    var idx = blocks.indexOf(holder), need = holder.classList.contains('fold-h') ? lvl(holder) : 99;
    for (var i = idx; i >= 0; i--) {
      var b = blocks[i];
      if (b.classList.contains('fold-h') && lvl(b) < need) { b.classList.remove('collapsed'); need = lvl(b); }
    }
    if (holder.classList.contains('fold-h')) holder.classList.remove('collapsed');
    apply();
    t.scrollIntoView();
  }
  window.addEventListener('hashchange', function () { openTo(decodeURIComponent(location.hash.slice(1))); });
  document.addEventListener('click', function (e) {          // 목차 등 #앵커 클릭
    if (pop && !pop.contains(e.target)) closePop();
    var fa = e.target.closest && e.target.closest('a[href^="#fn-"]');
    if (fa && !(pop && pop.contains(fa))) { e.preventDefault(); e.stopPropagation(); showFootnote(fa); return; }
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    if (pop && pop.contains(a)) closePop();
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (/^(s-|fn-|rfn-)/.test(id) || document.getElementById(id)) { e.preventDefault(); openTo(id); history.replaceState(null, '', '#' + id); }
  });
  apply();
  if (location.hash) openTo(decodeURIComponent(location.hash.slice(1)));
})();
