/* 同一張鈔票 互動學習站 — 前端程式
   - 有 SCRIPT_URL：資料經 Google Apps Script 寫入 Google Sheet
   - 沒有 SCRIPT_URL：示範模式，資料存在本機瀏覽器 */
(() => {
  'use strict';
  const CFG = window.FQ_CONFIG || {};
  const C = window.FQ;
  const LIVE = !!String(CFG.SCRIPT_URL || '').trim();
  const WS_METHODS = { 1: [3, 4], 2: [7], 3: [6], 4: [1, 2, 5] };
  const app = document.getElementById('app');
  let timer = null;

  // ---------- 小工具 ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 部分瀏覽器不允許 */ } }
  };
  const art = k => `art/${k}.jpg`;
  const icon = (k, cls = '') => `<img class="ic ${cls}" src="${art(k)}" alt="">`;
  const user = () => store.get('fq_user', null);
  const done = () => store.get('fq_done', {});

  // ---------- 示範模式後端（邏輯與 Code.gs 相同）----------
  const Demo = {
    db() { return store.get('fq_demo', { W1: [], W2: [], W3: [], W4: [], votes: [], walls: [], open: { 1: true, 2: true, 3: true, 4: true } }); },
    save(d) { store.set('fq_demo', d); },
    strip(r) { const o = Object.assign({}, r); delete o['暱稱']; return o; },
    handle(q) {
      const d = this.db(); const now = new Date().toISOString();
      const mine = r => String(r['組別']) === String(q.group) && r['暱稱'] === q.nick;
      switch (q.action) {
        case 'config': return { ok: true, open: d.open };
        case 'submit': {
          const t = d[q.sheet]; const row = Object.assign({ '時間': now, '組別': q.group, '暱稱': q.nick }, q.data);
          const i = t.findIndex(mine); if (i >= 0) t[i] = row; else t.push(row);
          this.save(d); return { ok: true };
        }
        case 'vote': {
          const row = { '時間': now, '堂': q.lesson, '投票': q.poll, '階段': q.phase, '組別': q.group, '暱稱': q.nick, '選擇': q.choice };
          const i = d.votes.findIndex(v => mine(v) && v['投票'] === q.poll && v['階段'] === q.phase);
          if (i >= 0) d.votes[i] = row; else d.votes.push(row);
          this.save(d); return { ok: true };
        }
        case 'wall':
          d.walls.push({ '時間': now, '堂': q.lesson, '牆': q.wall, '組別': q.group, '暱稱': q.nick, '內容': String(q.text).slice(0, 200) });
          this.save(d); return { ok: true };
        case 'summary': {
          const L = String(q.lesson);
          return { ok: true, rows: d['W' + L].map(this.strip), votes: d.votes.filter(v => String(v['堂']) === L).map(this.strip), walls: d.walls.filter(w => String(w['堂']) === L).map(this.strip) };
        }
        case 'mine': {
          const out = { ok: true, walls: d.walls.filter(mine), votes: d.votes.filter(mine) };
          ['W1', 'W2', 'W3', 'W4'].forEach(k => { out[k] = d[k].find(mine) || null; });
          return out;
        }
      }
      return { ok: false, error: '未知的操作' };
    }
  };

  // ---------- 連接 Google Apps Script ----------
  async function api(q) {
    if (!LIVE) return Demo.handle(q);
    try {
      let r;
      if (['config', 'summary', 'mine'].includes(q.action)) {
        const u = new URL(CFG.SCRIPT_URL);
        Object.keys(q).forEach(k => u.searchParams.set(k, q[k]));
        r = await fetch(u.toString());
      } else {
        // 用 text/plain 送出，避免瀏覽器的 CORS 預檢
        r = await fetch(CFG.SCRIPT_URL, { method: 'POST', body: JSON.stringify(q) });
      }
      return await r.json();
    } catch (e) {
      return { ok: false, error: '連線失敗，請檢查網絡後再試。' };
    }
  }
  const withUser = q => { const u = user(); return Object.assign({ group: u.group, nick: u.nick }, q); };

  // ---------- 版面 ----------
  function shell(body, opts = {}) {
    const u = user();
    const nav = opts.noNav ? '' : `<nav class="nav">
      ${[['home', '🏠', '首頁'], ['footprint', '👣', '我的足跡'], ['parents', '👪', '家長角落']].map(([h, i, t]) =>
        `<a href="#/${h}" class="${opts.on === h ? 'on' : ''}"><i>${i}</i>${t}</a>`).join('')}</nav>`;
    app.innerHTML = `
      <header class="top"><a href="#/home">同一張鈔票</a><span class="sp"></span>
        ${u && !opts.noUser ? `<button class="chip" id="who">第${esc(u.group)}組｜${esc(u.nick)}</button>` : ''}</header>
      ${LIVE ? '' : '<div class="demo">示範模式：資料只存在這部裝置。連接 Google Sheet 後會自動轉為正式模式。</div>'}
      <main class="wrap ${opts.wide ? 'wide' : ''}">${body}</main>${nav}`;
    const who = $('#who');
    if (who) who.onclick = () => { store.set('fq_user', null); location.hash = '#/login'; route(); };
    window.scrollTo(0, 0);
  }

  // ---------- 登入 ----------
  function pageLogin() {
    const groups = Array.from({ length: CFG.GROUPS || 4 }, (_, i) => i + 1);
    shell(`
      <section class="hero"><div class="t"><h1>${esc(C.title)}</h1><p>${esc(C.mainline)}</p></div><img src="${art('kids')}" alt=""></section>
      <section class="card"><h2>👋 開始之前</h2>
        <p class="muted">只需要組別和暱稱，不用填真實姓名。</p>
        <div class="field"><label>我的組別</label><select id="g"><option value="">請選擇</option>${groups.map(g => `<option value="${g}">第 ${g} 組</option>`).join('')}</select></div>
        <div class="field"><label>我的暱稱</label><input class="in" id="nk" maxlength="12" placeholder="例如：小松鼠"></div>
        <div class="err" id="er"></div>
        <button class="btn full" id="go">進入學習站</button>
      </section>`, { noNav: true, noUser: true });
    $('#go').onclick = () => {
      const g = $('#g').value, n = $('#nk').value.replace(/^[=+\-@]+/, '').trim();
      if (!g || !n) { $('#er').textContent = '請選擇組別並輸入暱稱。'; return; }
      store.set('fq_user', { group: g, nick: n });
      if (location.hash === '#/home') route(); else location.hash = '#/home';
    };
  }

  // ---------- 首頁 ----------
  function badgesHtml(d) {
    const got = new Set(); Object.keys(d).forEach(w => (WS_METHODS[w] || []).forEach(m => got.add(m)));
    return { n: got.size, html: `<div class="badges">${[1, 2, 3, 4, 5, 6, 7].map(m => `<span title="${C.methods[m].name}">${icon('g' + m, got.has(m) ? '' : 'off')}</span>`).join('')}</div>` };
  }
  async function pageHome() {
    const d = done(); const b = badgesHtml(d);
    shell(`
      <section class="hero"><div class="t"><h1>${esc(C.title)}</h1><p>${esc(C.mainline)}</p></div><img src="${art('kids')}" alt=""></section>
      <section class="card" style="--c:var(--g);--cb:var(--gb)"><h2>🌱 我的七法徽章（${b.n}／7）</h2>${b.html}
        <p class="muted" style="margin-top:6px">完成每一堂的工作紙，就會解鎖該堂的綠色理財法徽章。</p></section>
      <div id="lessons">${[1, 2, 3, 4].map(n => lessonCard(n, d, true)).join('')}</div>
      <div class="gold">「${esc(C.motto)}」</div>`, { on: 'home' });
    const cfg = await api({ action: 'config' });
    if (cfg.ok) $('#lessons').innerHTML = [1, 2, 3, 4].map(n => lessonCard(n, d, !!cfg.open[n])).join('');
    // 同步已提交紀錄（換裝置也能看到徽章）
    const m = await api(withUser({ action: 'mine' }));
    if (m.ok) {
      const nd = {}; [1, 2, 3, 4].forEach(n => { if (m['W' + n]) nd[n] = true; });
      store.set('fq_done', Object.assign(d, nd));
    }
  }
  function lessonCard(n, d, open) {
    const L = C.lessons[n];
    const tag = d[n] ? '✓ 完成' : open ? '進入 ›' : '🔒';
    return `<a class="lesson-card ${L.cls} ${open ? '' : 'locked'}" href="#/lesson/${n}"><img src="${art('m' + n)}" alt="">
      <div class="tx"><b>${n}. ${esc(L.title)}</b><small>${esc(L.domain)}｜${esc(L.ws)}</small></div><span class="tag">${tag}</span></a>`;
  }

  // ---------- 單元頁 ----------
  function banner(n, sub) {
    const L = C.lessons[n];
    return `<section class="ban"><div class="t"><span class="no">第 ${n} 堂｜${esc(L.domain)}</span><h1>${esc(sub || L.title)}</h1><p>${esc(L.en)}</p></div><img src="${art('m' + n)}" alt=""></section>`;
  }
  async function pageLesson(n) {
    const L = C.lessons[n]; if (!L) return pageHome();
    const polls = Object.entries(C.polls).filter(([, p]) => p.lesson === n);
    const walls = Object.entries(C.walls).filter(([, w]) => w.lesson === n);
    shell(`<div class="${L.cls}">
      ${banner(n)}
      <section class="card"><h2><span class="n">1</span>今堂四個概念</h2>
        <div class="grid2">${L.nodes.map(([a, b]) => `<div class="node"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div></section>
      <section class="card"><h2><span class="n">2</span>今堂綠色理財法</h2>
        ${L.methods.map(m => `<div class="method">${icon('g' + m)}<div><b>${esc(C.methods[m].name)}</b><br><span>${esc(C.methods[m].q)}</span></div></div>`).join('')}</section>
      ${n === 4 ? '<section class="card"><h2>📌 我在第 1 堂寫的 $100 便利貼</h2><div id="mynote" class="muted">載入中…</div></section>' : ''}
      ${polls.map(([id, p]) => pollBlock(id, p)).join('')}
      ${walls.map(([id, w]) => wallBlock(id, w)).join('')}
      <a class="btn c full" style="display:block;text-align:center;text-decoration:none" href="#/ws/${n}">📝 填寫 ${esc(L.ws)}</a>
      <div class="gold">「${esc(L.gold)}」</div></div>`);
    bindLesson(n);
  }
  function pollBlock(id, p) {
    return `<section class="card" data-poll="${id}"><h2>🗳 投票</h2><p style="font-weight:700">${esc(p.q)}</p>
      ${p.phases.map(ph => `<div class="field"><div class="muted">${p.phases.length > 1 ? esc(ph) + '投票' : ''}</div>
        ${p.options.map(o => `<button class="opt" data-ph="${esc(ph)}" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`).join('')}
      <div class="pres" style="margin-top:10px"></div></section>`;
  }
  function wallBlock(id, w) {
    return `<section class="card" data-wall="${id}"><h2>🗒 留言牆</h2><p style="font-weight:700">${esc(w.q)}</p>
      <div class="row field"><input class="in" style="flex:1" maxlength="80" placeholder="寫下你的想法"><button class="btn sm c">貼上</button></div>
      <div class="err"></div><div class="wall"></div><button class="btn sm ghost refresh" style="margin-top:10px">↻ 更新</button></section>`;
  }
  async function bindLesson(n) {
    const u = user();
    const myVotes = store.get('fq_votes', {});
    const load = async () => {
      const s = await api({ action: 'summary', lesson: n });
      if (!s.ok) return;
      $$('[data-wall]').forEach(el => {
        const items = s.walls.filter(w => w['牆'] === el.dataset.wall).slice(-60).reverse();
        $('.wall', el).innerHTML = items.length ? items.map(w => `<div class="note">${esc(w['內容'])}<small>第${esc(w['組別'])}組</small></div>`).join('') : '<span class="muted">還沒有留言，做第一個吧！</span>';
      });
      $$('[data-poll]').forEach(el => {
        const p = C.polls[el.dataset.poll];
        const voted = p.phases.some(ph => myVotes[el.dataset.poll + '|' + ph]);
        if (!voted) { $('.pres', el).innerHTML = '<span class="muted">投票後可以看到全班結果。</span>'; return; }
        $('.pres', el).innerHTML = p.phases.map(ph => {
          const vs = s.votes.filter(v => v['投票'] === el.dataset.poll && v['階段'] === ph);
          if (!vs.length) return '';
          return `<div class="muted" style="margin-top:6px">${p.phases.length > 1 ? esc(ph) + '：' : ''}全班 ${vs.length} 票</div>` +
            p.options.map(o => { const c = vs.filter(v => v['選擇'] === o).length; return `<div class="brow"><span>${esc(o)}</span><div class="bar"><i style="width:${Math.round(c / vs.length * 100)}%"></i></div><span>${c} 票</span></div>`; }).join('');
        }).join('');
      });
    };
    $$('[data-poll]').forEach(el => {
      const id = el.dataset.poll;
      $$('.opt', el).forEach(b => {
        if (myVotes[id + '|' + b.dataset.ph] === b.dataset.o) b.classList.add('on');
        b.onclick = async () => {
          const r = await api(withUser({ action: 'vote', lesson: n, poll: id, phase: b.dataset.ph, choice: b.dataset.o }));
          if (!r.ok) { $('.pres', el).innerHTML = `<p class="err">${esc(r.error || '投票失敗，請再試。')}</p>`; return; }
          $$(`.opt[data-ph="${b.dataset.ph}"]`, el).forEach(x => x.classList.remove('on')); b.classList.add('on');
          myVotes[id + '|' + b.dataset.ph] = b.dataset.o; store.set('fq_votes', myVotes); load();
        };
      });
    });
    $$('[data-wall]').forEach(el => {
      const inp = $('input', el), er = $('.err', el);
      $('.btn.c', el).onclick = async () => {
        const t = inp.value.trim();
        if (!t) { er.textContent = '請先寫下內容。'; return; }
        er.textContent = '';
        const r = await api(withUser({ action: 'wall', lesson: n, wall: el.dataset.wall, text: t }));
        if (!r.ok) { er.textContent = r.error || '貼上失敗'; return; }
        inp.value = ''; load();
      };
      inp.oninput = () => { er.textContent = ''; };
      $('.refresh', el).onclick = load;
    });
    if (n === 4) {
      const m = await api(withUser({ action: 'mine' }));
      const notes = m.ok ? m.walls.filter(w => w['牆'] === 'L1_100') : [];
      $('#mynote').innerHTML = notes.length ? `<div class="wall">${notes.map(w => `<div class="note">${esc(w['內容'])}</div>`).join('')}</div>` : '找不到第 1 堂的便利貼（可能用了另一個暱稱）。';
    }
    load();
  }

  // ---------- 工作紙 ----------
  const draftKey = n => `fq_draft_${n}_${user().group}_${user().nick}`;
  function saveDraft(n, extra) {
    const f = {}; $$('#ws [name]').forEach(el => { f[el.name] = el.type === 'checkbox' ? el.checked : el.type === 'radio' ? (el.checked ? el.value : f[el.name]) : el.value; });
    store.set(draftKey(n), Object.assign(f, extra || {}));
  }
  function loadDraft(n) {
    const f = store.get(draftKey(n), {});
    $$('#ws [name]').forEach(el => {
      if (!(el.name in f)) return;
      if (el.type === 'checkbox') el.checked = !!f[el.name];
      else if (el.type === 'radio') el.checked = f[el.name] === el.value;
      else el.value = f[el.name];
    });
    return f;
  }
  const radio = (name, opts) => opts.map(o => `<label class="pill"><input type="radio" name="${name}" value="${esc(o)}">${esc(o)}</label>`).join('');
  const sel = (name, opts, ph = '請選擇') => `<select name="${name}"><option value="">${ph}</option>${opts.map(o => `<option>${esc(o)}</option>`).join('')}</select>`;

  function pageWS(n) {
    const L = C.lessons[n]; if (!L) return pageHome();
    const forms = { 1: formW1, 2: formW2, 3: formW3, 4: formW4 };
    shell(`<div class="${L.cls}">${banner(n, L.ws)}
      <p class="muted" style="margin-top:8px">所有金額均為課堂模擬。填寫中的內容會自動儲存在這部裝置。</p>
      <form id="ws" onsubmit="return false">${forms[n].html()}</form>
      <div class="err" id="wserr"></div>
      <button class="btn c full" id="send">提交到 Google Sheet ➜</button>
      <div id="wsok"></div>
      <div class="gold">「${esc(L.gold)}」</div></div>`);
    const f = loadDraft(n);
    forms[n].bind && forms[n].bind(f);
    $('#ws').addEventListener('input', () => { $('#wserr').textContent = ''; forms[n].calc && forms[n].calc(); saveDraft(n, forms[n].extra && forms[n].extra()); });
    $('#ws').addEventListener('change', () => { forms[n].calc && forms[n].calc(); saveDraft(n, forms[n].extra && forms[n].extra()); });
    forms[n].calc && forms[n].calc();
    $('#send').onclick = async () => {
      const res = forms[n].collect();
      if (res.error) { $('#wserr').textContent = res.error; return; }
      $('#send').disabled = true; $('#send').textContent = '提交中…';
      const r = await api(withUser({ action: 'submit', sheet: 'W' + n, data: res.data }));
      $('#send').disabled = false; $('#send').textContent = '再次提交（會更新之前的答案）';
      if (!r.ok) { $('#wserr').textContent = r.error || '提交失敗，請再試。'; return; }
      const d = done(); d[n] = true; store.set('fq_done', d);
      $('#wsok').innerHTML = `<div class="okmsg">已提交！你解鎖了徽章：</div><div class="badges" style="margin-top:8px">${WS_METHODS[n].map(m => icon('g' + m)).join('')}</div>`;
      $('#wsok').scrollIntoView({ behavior: 'smooth' });
    };
  }

  // W1《我的 $100》
  const W1 = (() => {
    let r100 = C.useCards.slice(), r50 = C.useCards.slice();
    const list = (id, arr) => `<ol class="rank" id="${id}">${arr.map((c, i) => `<li><b>${i + 1}</b><span>${esc(c)}</span><button type="button" data-l="${id}" data-i="${i}" data-d="-1" aria-label="上移">▲</button><button type="button" data-l="${id}" data-i="${i}" data-d="1" aria-label="下移">▼</button></li>`).join('')}</ol>`;
    return {
      html: () => `
        <section class="card"><h2><span class="n">1</span>6 張用途卡</h2>
          <div class="scroll"><table class="tbl"><tr><th>用途卡</th><th>價格（模擬）</th><th>為甚麼值得？</th></tr>
          ${C.useCards.map((c, i) => `<tr><td class="l">${esc(c)}</td><td><input class="in" type="number" min="0" name="p${i}" placeholder="$"></td>
            <td><label class="pill"><input type="checkbox" name="u${i}">有用</label><label class="pill"><input type="checkbox" name="m${i}">重要</label></td></tr>`).join('')}</table></div></section>
        <section class="card"><h2><span class="n">2</span>排出最值得的次序</h2>
          <div class="grid2"><div><label>有 $100 時</label><div id="w100"></div></div><div><label>只得 $50 時</label><div id="w50"></div></div></div>
          <div class="field"><label>只得 $50 時，我最先刪去</label>${sel('cut', C.useCards)}</div>
          <div class="field"><label>因為</label><input class="in" name="cutWhy"></div></section>
        <section class="card"><h2><span class="n">3</span>壞了的水樽：修，還是換？</h2>
          ${radio('fix', ['修', '換'])}
          <div class="field"><label>理由</label><textarea name="fixWhy"></textarea></div>
          <div class="method">${icon('g3')}${icon('g4')}<div><b>用到盡：</b>${esc(C.methods[3].q)}<br><b>先修再換：</b>${esc(C.methods[4].q)}</div></div></section>
        <section class="card"><h2><span class="n">4</span>我的一句</h2>
          <div class="field"><label>價格是…</label><input class="in" name="price"></div>
          <div class="field"><label>價值是…</label><input class="in" name="value"></div></section>`,
      bind(f) {
        if (Array.isArray(f.r100)) r100 = f.r100; if (Array.isArray(f.r50)) r50 = f.r50;
        const draw = () => { $('#w100').innerHTML = list('r100', r100); $('#w50').innerHTML = list('r50', r50); };
        draw();
        $('#ws').addEventListener('click', e => {
          const b = e.target.closest('button[data-l]'); if (!b) return;
          const arr = b.dataset.l === 'r100' ? r100 : r50, i = +b.dataset.i, j = i + (+b.dataset.d);
          if (j < 0 || j >= arr.length) return;
          [arr[i], arr[j]] = [arr[j], arr[i]]; draw(); saveDraft(1, { r100, r50 });
        });
      },
      extra: () => ({ r100, r50 }),
      collect() {
        const v = n => ($(`#ws [name="${n}"]`) || {}).value || '';
        const fix = ($('#ws [name="fix"]:checked') || {}).value;
        if (!fix) return { error: '請選擇水樽要「修」還是「換」。' };
        if (!v('price').trim() || !v('value').trim()) return { error: '請完成「我的一句」。' };
        return { data: {
          '$100排序': r100.join(' > '), '$50排序': r50.join(' > '),
          '價格': C.useCards.map((c, i) => `${c}:${v('p' + i) || '-'}`).join('；'),
          '值得理由': C.useCards.map((c, i) => `${c}:${[$(`#ws [name="u${i}"]`).checked ? '有用' : '', $(`#ws [name="m${i}"]`).checked ? '重要' : ''].filter(Boolean).join('+') || '-'}`).join('；'),
          '最先刪去': v('cut'), '刪去原因': v('cutWhy'), '修或換': fix, '修換理由': v('fixWhy'), '價格是': v('price'), '價值是': v('value')
        } };
      }
    };
  })();

  // W2《我的技能成長》
  const W2 = {
    html: () => `
      <section class="card"><h2><span class="n">1</span>小店收支表</h2>
        <div class="scroll"><table class="tbl"><tr><th>輪次</th><th>任務收入</th><th>技能卡支出</th><th>淨收入</th></tr>
        ${[1, 2].map(r => `<tr><td class="l">第${r === 1 ? '一' : '二'}輪</td><td><input class="in" type="number" min="0" name="in${r}"></td>
          <td><input class="in" type="number" min="0" name="out${r}" value="0"></td><td id="net${r}">0</td></tr>`).join('')}</table></div>
        <p style="margin-top:8px">兩輪相差：<b id="diff">0</b> 代幣</p>
        <div class="field"><label>第二輪賺得更多／更少，是因為</label><textarea name="why"></textarea></div>
        <div class="field"><label>我們付出了甚麼才賺到？</label><input class="in" name="effort"></div></section>
      <section class="card"><h2><span class="n">2</span>這份工作為別人解決了甚麼問題？</h2>
        ${[1, 2].map(i => `<div class="grid2" style="margin-top:8px"><input class="in" name="job${i}" placeholder="工作"><input class="in" name="time${i}" placeholder="要付出的時間">
          <input class="in" name="skill${i}" placeholder="需要的技能"><input class="in" name="solve${i}" placeholder="解決的問題"></div>`).join('<hr style="border:0;border-top:1.5px dashed #c9d1de;margin-top:10px">')}</section>
      <section class="card"><h2><span class="n">3</span>我的技能成長計劃</h2>
        <div class="field"><label>我想提升的技能</label><input class="in" name="myskill"></div>
        <div class="field"><label>我的第一步</label><input class="in" name="step"></div>
        <div class="field"><label>另一組介紹的「最值得學的技能」</label><input class="in" name="other"></div>
        <div class="method">${icon('g7')}<div><b>投向未來：</b>${esc(C.methods[7].q)}</div></div></section>`,
    calc() {
      const v = n => num(($(`#ws [name="${n}"]`) || {}).value);
      const n1 = v('in1') - v('out1'), n2 = v('in2') - v('out2');
      $('#net1').textContent = n1; $('#net2').textContent = n2; $('#diff').textContent = n2 - n1;
      $('#net1').className = n1 < 0 ? 'neg' : ''; $('#net2').className = n2 < 0 ? 'neg' : '';
    },
    collect() {
      const v = n => ($(`#ws [name="${n}"]`) || {}).value || '';
      if (v('in1') === '' || v('in2') === '') return { error: '請填寫兩輪的任務收入。' };
      if (!v('myskill').trim() || !v('step').trim()) return { error: '請填寫想提升的技能和第一步。' };
      const n1 = num(v('in1')) - num(v('out1')), n2 = num(v('in2')) - num(v('out2'));
      return { data: {
        '第一輪收入': num(v('in1')), '第一輪支出': num(v('out1')), '第一輪淨收入': n1,
        '第二輪收入': num(v('in2')), '第二輪支出': num(v('out2')), '第二輪淨收入': n2, '收入差額': n2 - n1,
        '原因': v('why'), '付出': v('effort'),
        '工作分析': [1, 2].map(i => v('job' + i) ? `${v('job' + i)}（時間:${v('time' + i)}｜技能:${v('skill' + i)}｜解決:${v('solve' + i)}）` : '').filter(Boolean).join('；'),
        '想提升的技能': v('myskill'), '第一步': v('step'), '另一組技能': v('other')
      } };
    }
  };

  // W3《SMART 儲蓄表》
  const W3 = {
    html: () => `
      <section class="card"><h2><span class="n">1</span>我的 SMART 目標</h2>
        <div class="row"><span>在</span><input class="in" style="width:70px" type="number" min="1" name="weeks" value="8"><span>星期內儲 $</span>
          <input class="in" style="width:90px" type="number" min="1" name="goal"><span>，用來</span><input class="in" style="flex:1;min-width:160px" name="use"></div>
        <div class="field">${[['S', '具體'], ['M', '可量度'], ['A', '做得到'], ['R', '相關'], ['T', '有期限']].map(([a, b]) => `<label class="pill"><input type="checkbox" name="s${a}"><b>${a}</b> ${b}</label>`).join('')}</div>
        <p class="muted">儲蓄夥伴互查：每符合一項就打 ✓</p></section>
      <section class="card"><h2><span class="n">2</span>八星期收支記錄（每週收入 $20）</h2>
        <div class="scroll"><table class="tbl" style="min-width:620px"><tr><th>週</th><th>儲蓄</th><th>消費</th><th>緊急儲備</th><th>結餘</th><th>事件卡</th><th>我的決定</th></tr>
        ${[1, 2, 3, 4, 5, 6, 7, 8].map(w => `<tr><td>${w}</td>${['sv', 'sp', 'em'].map(k => `<td><input class="in" type="number" min="0" name="${k}${w}"></td>`).join('')}
          <td id="bal${w}">20</td><td><input class="in" style="min-width:110px" name="ev${w}"></td><td>${sel('dc' + w, ['儲', '花', '用緊急儲備'], '—')}</td></tr>`).join('')}</table></div>
        <p style="margin-top:10px">累積儲蓄 <b id="tsv">$0</b>｜消費 <b id="tsp">$0</b>｜緊急儲備 <b id="tem">$0</b>｜達標率 <b id="rate">0%</b></p>
        <div class="bar" style="margin-top:6px"><i id="rbar" style="width:0"></i></div></section>
      <section class="card"><h2><span class="n">3</span>一次「忍住不買」的理由</h2><textarea name="hold"></textarea>
        <div class="method">${icon('g6')}<div><b>省下要存：</b>${esc(C.methods[6].q)}</div></div></section>`,
    sums() {
      const v = n => num(($(`#ws [name="${n}"]`) || {}).value);
      let sv = 0, sp = 0, em = 0; const bal = {};
      for (let w = 1; w <= 8; w++) { sv += v('sv' + w); sp += v('sp' + w); em += v('em' + w); bal[w] = 20 - v('sv' + w) - v('sp' + w) - v('em' + w); }
      const goal = v('goal'); const rate = goal > 0 ? Math.round(sv / goal * 100) : 0;
      return { sv, sp, em, bal, goal, rate };
    },
    calc() {
      const s = W3.sums();
      for (let w = 1; w <= 8; w++) { const el = $('#bal' + w); el.textContent = s.bal[w]; el.className = s.bal[w] < 0 ? 'neg' : ''; }
      $('#tsv').textContent = '$' + s.sv; $('#tsp').textContent = '$' + s.sp; $('#tem').textContent = '$' + s.em;
      $('#rate').textContent = s.rate + '%'; $('#rbar').style.width = Math.min(100, s.rate) + '%';
    },
    collect() {
      const v = n => ($(`#ws [name="${n}"]`) || {}).value || '';
      const s = W3.sums();
      if (!(s.goal > 0) || !v('use').trim()) return { error: '請寫好 SMART 目標的金額和用途。' };
      const neg = Object.keys(s.bal).filter(w => s.bal[w] < 0);
      if (neg.length) return { error: `第 ${neg.join('、')} 週的結餘是負數，請再檢查。` };
      const dc = [1, 2, 3, 4, 5, 6, 7, 8].map(w => v('dc' + w));
      return { data: {
        '目標週數': num(v('weeks')), '目標金額': s.goal, '目標用途': v('use'),
        'SMART': ['S', 'M', 'A', 'R', 'T'].filter(a => $(`#ws [name="s${a}"]`).checked).join(''),
        '每週紀錄': [1, 2, 3, 4, 5, 6, 7, 8].map(w => `第${w}週 儲${num(v('sv' + w))} 花${num(v('sp' + w))} 急${num(v('em' + w))}${v('ev' + w) ? ' 事件:' + v('ev' + w) : ''}${v('dc' + w) ? ' 決定:' + v('dc' + w) : ''}`).join('；'),
        '累積儲蓄': s.sv, '消費合計': s.sp, '緊急合計': s.em, '達標率': s.rate,
        '儲次數': dc.filter(x => x === '儲').length, '花次數': dc.filter(x => x === '花').length, '緊急次數': dc.filter(x => x === '用緊急儲備').length,
        '忍住不買理由': v('hold')
      } };
    }
  };

  // W4《買／不買／等等看》
  const W4 = {
    html: () => `
      <section class="card"><h2><span class="n">1</span>貨比三家表</h2>
        ${C.scenarios.map((s, i) => `<div class="node" style="margin-top:10px"><b>${esc(s)}</b>
          <div class="grid2" style="margin-top:6px"><div><label>需要？想要？</label>${sel('cat' + i, ['需要', '想要', '可以等等'])}</div>
          <div><label>可否借或共用？</label>${sel('borrow' + i, ['可以', '不可以'])}</div></div>
          <div class="row field">${['A', 'B', 'C'].map(k => `<div style="flex:1;min-width:80px"><label>店 ${k}</label><input class="in" type="number" min="0" name="${k}${i}" placeholder="$"></div>`).join('')}</div>
          <p class="muted" id="low${i}"></p>
          <div class="field"><label>我的決定</label><div>${radio('dec' + i, ['買', '不買', '等等看'])}</div></div></div>`).join('')}
        <div class="field"><label>條件改變時，我的答案在甚麼時候改變了？</label>${sel('change', ['已有一個', '朋友不在場', '24 小時後', '沒有改變'])}</div>
        <div class="method">${icon('g1')}${icon('g2')}${icon('g5')}<div><b>想一想：</b>${esc(C.methods[1].q)}<br><b>比一比：</b>${esc(C.methods[2].q)}<br><b>借換共享：</b>${esc(C.methods[5].q)}</div></div></section>
      <section class="card"><h2><span class="n">2</span>我的購買前三問</h2>
        ${[1, 2, 3].map(i => `<div class="field"><input class="in" name="q${i}" placeholder="第 ${i} 問"></div>`).join('')}</section>
      <section class="card"><h2><span class="n">3</span>四堂足跡：我的一個生活原則</h2>
        <div class="path">${C.path.map((t, i) => `<div>${icon('p' + (i + 1))}${esc(t)}</div>`).join('')}</div>
        <textarea name="rule" style="margin-top:10px" placeholder="我的生活原則"></textarea></section>`,
    calc() {
      C.scenarios.forEach((s, i) => {
        const ps = ['A', 'B', 'C'].map(k => ({ k, v: ($(`#ws [name="${k}${i}"]`) || {}).value })).filter(x => x.v !== '');
        if (!ps.length) { $('#low' + i).textContent = ''; return; }
        const m = ps.reduce((a, b) => num(b.v) < num(a.v) ? b : a);
        $('#low' + i).textContent = `最便宜：店 ${m.k}（$${num(m.v)}）。但最便宜就最值得嗎？`;
      });
    },
    collect() {
      const v = n => ($(`#ws [name="${n}"]`) || {}).value || '';
      const data = {};
      for (let i = 0; i < C.scenarios.length; i++) {
        const s = C.scenarios[i]; const dec = ($(`#ws [name="dec${i}"]:checked`) || {}).value;
        if (!dec) return { error: `請為「${s}」作出決定。` };
        const ps = ['A', 'B', 'C'].map(k => v(k + i)).filter(x => x !== '').map(num);
        Object.assign(data, { [`${s}_分類`]: v('cat' + i), [`${s}_最低價`]: ps.length ? Math.min(...ps) : '', [`${s}_借用`]: v('borrow' + i), [`${s}_決定`]: dec });
      }
      if (![1, 2, 3].every(i => v('q' + i).trim())) return { error: '請寫好購買前三問。' };
      if (!v('rule').trim()) return { error: '請寫下你的一個生活原則。' };
      return { data: Object.assign(data, { '答案改變於': v('change'), '購買前三問1': v('q1'), '購買前三問2': v('q2'), '購買前三問3': v('q3'), '生活原則': v('rule') }) };
    }
  };
  const formW1 = W1, formW2 = W2, formW3 = W3, formW4 = W4;

  // ---------- 我的足跡 ----------
  async function pageFootprint() {
    shell(`<section class="hero"><div class="t"><h1>👣 我的四堂足跡</h1><p>${esc(C.motto)}</p></div><img src="${art('kids')}" alt=""></section>
      <section class="card"><h2>最終，我們希望學生…</h2><div class="path">${C.path.map((t, i) => `<div>${icon('p' + (i + 1))}${esc(t)}</div>`).join('')}</div></section>
      <div id="fp"><p class="muted" style="margin-top:14px">載入中…</p></div>`, { on: 'footprint' });
    const m = await api(withUser({ action: 'mine' }));
    if (!m.ok) { $('#fp').innerHTML = `<p class="err">${esc(m.error)}</p>`; return; }
    const show = { 1: r => `價格是 ${esc(r['價格是'])}，價值是 ${esc(r['價值是'])}。`, 2: r => `我想提升：${esc(r['想提升的技能'])}｜第一步：${esc(r['第一步'])}`,
      3: r => `目標：$${esc(r['目標金額'])} ${esc(r['目標用途'])}｜達標率 ${esc(r['達標率'])}%`, 4: r => `生活原則：${esc(r['生活原則'])}` };
    $('#fp').innerHTML = [1, 2, 3, 4].map(n => {
      const L = C.lessons[n], r = m['W' + n];
      return `<section class="card ${L.cls}"><h2><span class="n">${n}</span>${esc(L.title)}</h2>${r ? `<p>${show[n](r)}</p>` : `<p class="muted">還沒有提交 ${esc(L.ws)}。</p>`}</section>`;
    }).join('');
  }

  // ---------- 家長角落 ----------
  function pageParents() {
    const P = C.parents; const groups = Array.from({ length: CFG.GROUPS || 4 }, (_, i) => i + 1);
    shell(`<section class="hero"><div class="t"><h1>👪 家長角落</h1><p>給父母的話</p></div><img src="${art('kids')}" alt=""></section>
      <section class="card"><h2>給父母的話</h2><p>${esc(P.intro)}</p>
        ${P.tips.map(([a, b]) => `<div class="node" style="margin-top:8px;--cl:#FFF5D6;--c:#B5651D"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}
        <p style="margin-top:10px">${esc(P.end)}</p></section>
      <section class="card"><h2>看看孩子寫了甚麼</h2>
        <div class="row"><select id="pg" style="width:auto">${groups.map(g => `<option value="${g}">第 ${g} 組</option>`).join('')}</select>
          <input class="in" id="pn" style="flex:1" placeholder="孩子的暱稱"><button class="btn sm" id="pgo">查看</button></div><div id="pres"></div></section>
      <section class="card"><h2>延伸讀物</h2>${P.books.map(([a, b]) => `<p style="margin-top:6px"><b>${esc(a)}</b>：${esc(b)}</p>`).join('')}</section>
      <div class="gold">「${esc(C.motto)}」</div>`, { on: 'parents' });
    $('#pgo').onclick = async () => {
      const nick = $('#pn').value.trim(); if (!nick) { $('#pres').innerHTML = '<p class="err">請輸入孩子的暱稱。</p>'; return; }
      const m = await api({ action: 'mine', group: $('#pg').value, nick });
      const w4 = m.ok && m.W4, w3 = m.ok && m.W3;
      $('#pres').innerHTML = (w3 || w4) ? `${w3 ? `<p style="margin-top:10px"><b>儲蓄目標：</b>$${esc(w3['目標金額'])} ${esc(w3['目標用途'])}（達標率 ${esc(w3['達標率'])}%）</p>` : ''}
        ${w4 ? `<p><b>購買前三問：</b></p><ol style="margin-left:20px">${[1, 2, 3].map(i => `<li>${esc(w4['購買前三問' + i])}</li>`).join('')}</ol><p><b>生活原則：</b>${esc(w4['生活原則'])}</p>` : ''}`
        : '<p class="muted" style="margin-top:10px">暫時未有紀錄，請確認組別和暱稱。</p>';
    };
  }

  // ---------- 導師大屏 ----------
  function pageTeacher(n) {
    n = C.lessons[n] ? +n : 1;
    const L = C.lessons[n];
    shell(`<div class="${L.cls}">
      <div class="tabs">${[1, 2, 3, 4].map(i => `<button class="${i === n ? 'on' : ''}" onclick="location.hash='#/teacher/${i}'">第 ${i} 堂</button>`).join('')}
        <button onclick="document.getElementById('qrbox').hidden=!document.getElementById('qrbox').hidden">QR 碼</button></div>
      <div id="qrbox" hidden><div id="qr"></div><p class="muted">${esc(location.href.split('#')[0])}</p></div>
      ${banner(n, '導師控制台｜' + L.title)}
      <p class="muted" style="margin-top:6px">每 ${CFG.REFRESH_SECONDS || 10} 秒自動更新｜<span id="ts"></span></p>
      <div class="tgrid" id="tg"></div></div>`, { noNav: true, noUser: true, wide: true });
    loadQR();
    const tick = async () => {
      const s = await api({ action: 'summary', lesson: n });
      if (!s.ok) { $('#tg').innerHTML = `<p class="err">${esc(s.error)}</p>`; return; }
      $('#ts').textContent = '最後更新 ' + new Date().toLocaleTimeString();
      $('#tg').innerHTML = teacherPanels(n, s);
    };
    tick(); timer = setInterval(tick, (CFG.REFRESH_SECONDS || 10) * 1000);
  }
  function loadQR() {
    const draw = () => { try { $('#qr').innerHTML = ''; new window.QRCode($('#qr'), { text: location.href.split('#')[0], width: 220, height: 220 }); } catch (e) { /* 沒有網絡時略過 */ } };
    if (window.QRCode) return draw();
    const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; sc.onload = draw; document.head.appendChild(sc);
  }
  const bars = (items, max, unit = '') => items.map(([label, val, shown]) => `<div class="brow"><span>${esc(label)}</span><div class="bar"><i style="width:${max > 0 ? Math.max(0, Math.min(100, Math.round(val / max * 100))) : 0}%"></i></div><span>${esc(shown != null ? shown : val + unit)}</span></div>`).join('');
  const box = (title, inner) => `<section class="card" style="margin-top:0">${title ? `<h2>${title}</h2>` : ''}${inner}</section>`;
  const byGroup = rows => { const g = {}; rows.forEach(r => { (g[r['組別']] = g[r['組別']] || []).push(r); }); return g; };
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

  function teacherPanels(n, s) {
    const out = []; const G = CFG.GROUPS || 4; const groups = Array.from({ length: G }, (_, i) => String(i + 1));
    const bg = byGroup(s.rows);
    out.push(box(`📝 ${esc(C.lessons[n].ws)} 提交`, `<div class="big">${s.rows.length}</div>${bars(groups.map(g => ['第' + g + '組', (bg[g] || []).length, (bg[g] || []).length + ' 份']), Math.max(1, ...groups.map(g => (bg[g] || []).length)))}`));
    Object.entries(C.polls).filter(([, p]) => p.lesson === n).forEach(([id, p]) => {
      out.push(box('🗳 ' + esc(p.q), p.phases.map(ph => {
        const vs = s.votes.filter(v => v['投票'] === id && v['階段'] === ph);
        return `${p.phases.length > 1 ? `<p class="muted">${esc(ph)}（${vs.length} 票）</p>` : `<p class="muted">${vs.length} 票</p>`}` + bars(p.options.map(o => { const c = vs.filter(v => v['選擇'] === o).length; return [o, c, c + ' 人']; }), Math.max(1, vs.length));
      }).join('')));
    });
    if (n === 1) {
      const rk = key => C.useCards.map(c => { const a = s.rows.map(r => String(r[key] || '').split(' > ').indexOf(c) + 1).filter(x => x > 0); const m = avg(a); return [c, a.length ? 7 - m : 0, a.length ? '第 ' + m.toFixed(1) : '—']; }).sort((a, b) => b[1] - a[1]);
      out.push(box('💰 $100 平均排序（越長＝越被重視）', bars(rk('$100排序'), 6)));
      out.push(box('💵 只得 $50 時的平均排序', bars(rk('$50排序'), 6)));
      const fx = ['修', '換'].map(o => [o, s.rows.filter(r => r['修或換'] === o).length]);
      out.push(box('🔧 壞了的水樽：修還是換？', bars(fx.map(([o, c]) => [o, c, c + ' 人']), Math.max(1, s.rows.length))));
    }
    if (n === 2) {
      const it = groups.map(g => { const r = bg[g] || []; return [g, avg(r.map(x => num(x['第一輪淨收入']))), avg(r.map(x => num(x['第二輪淨收入'])))]; });
      const mx = Math.max(1, ...it.map(x => Math.max(x[1], x[2])));
      out.push(box('🏪 各組小店淨收入（第一輪／第二輪）', it.map(([g, a, b]) => `<p class="muted" style="margin-top:6px">第${g}組</p>` + bars([['第一輪', a, a.toFixed(0)], ['第二輪', b, b.toFixed(0)]], mx)).join('')));
      out.push(box('💡 想提升的技能', `<div class="wall">${s.rows.map(r => `<div class="note">${esc(r['想提升的技能'])}<small>第${esc(r['組別'])}組</small></div>`).join('')}</div>`));
    }
    if (n === 3) {
      out.push(box('🐷 各組平均達標率', bars(groups.map(g => { const a = avg((bg[g] || []).map(r => num(r['達標率']))); return ['第' + g + '組', a, Math.round(a) + '%']; }), 100)));
      const t = k => s.rows.reduce((x, r) => x + num(r[k]), 0); const tot = t('儲次數') + t('花次數') + t('緊急次數');
      out.push(box('📩 事件卡決定統計', bars([['儲', t('儲次數')], ['花', t('花次數')], ['用緊急儲備', t('緊急次數')]].map(([a, b]) => [a, b, b + ' 次']), Math.max(1, tot))));
    }
    if (n === 4) {
      out.push(box('🛍 買／不買／等等看', C.scenarios.map(sc => `<p class="muted" style="margin-top:6px">${esc(sc)}</p>` + bars(['買', '不買', '等等看'].map(o => { const c = s.rows.filter(r => r[sc + '_決定'] === o).length; return [o, c, c + ' 人']; }), Math.max(1, s.rows.length))).join('')));
      out.push(box('🌱 生活原則（匿名）', `<div class="wall">${s.rows.map(r => `<div class="note">${esc(r['生活原則'])}<small>第${esc(r['組別'])}組</small></div>`).join('')}</div>`));
    }
    Object.entries(C.walls).filter(([, w]) => w.lesson === n).forEach(([id, w]) => {
      let items = s.walls.filter(x => x['牆'] === id).slice(-60).reverse();
      if (id === 'L3_hold') items = items.concat(s.rows.filter(r => r['忍住不買理由']).map(r => ({ '內容': r['忍住不買理由'], '組別': r['組別'] })));
      out.push(box('🗒 ' + esc(w.q), `<div class="wall">${items.map(x => `<div class="note">${esc(x['內容'])}<small>第${esc(x['組別'])}組</small></div>`).join('') || '<span class="muted">未有留言</span>'}</div>`));
    });
    return out.join('');
  }

  // ---------- 路由 ----------
  function route() {
    if (timer) { clearInterval(timer); timer = null; }
    const [page, arg] = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
    if (page === 'teacher') return pageTeacher(arg);
    if (page === 'parents') return pageParents();
    if (!user()) return pageLogin();
    if (page === 'lesson') return pageLesson(+arg);
    if (page === 'ws') return pageWS(+arg);
    if (page === 'footprint') return pageFootprint();
    if (page === 'login') { location.hash = '#/home'; return; }
    return pageHome();
  }
  window.addEventListener('hashchange', route);
  route();
})();
