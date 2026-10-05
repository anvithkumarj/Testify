/* =====================================================
   TESTIFY: app.js
   1. Helpers            2. Seed data
   3. Spatial effects    4. Anti-cheat
   5. Router & nav       6. Pages
      - landing  - auth  - dash  - create  - exam  - result
   7. Boot
   ===================================================== */


/* =====================================================
   1. HELPERS
   ===================================================== */

/* DOM shortcuts */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* localStorage wrapper (all keys prefixed with "tf_") */
const DB = {
  get: (k, d) => {
    try { return JSON.parse(localStorage.getItem('tf_' + k)) ?? d }
    catch { return d }
  },
  set: (k, v) => localStorage.setItem('tf_' + k, JSON.stringify(v))
};

/* ids & current session */
const uid = () => Math.random().toString(36).slice(2, 9);
const me = () => DB.get('session', null);

/* shuffle an array */
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

/* escape text before putting it into HTML */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* toast message */
const toast = m => {
  const t = $('#toast');
  t.textContent = m;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2600);
};

/* seconds -> m:ss */
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;


/* =====================================================
   2. SEED DATA (demo exam, created on first visit)
   ===================================================== */
if (!DB.get('exams')) DB.set('exams', [{
  id: 'demo',
  title: 'Web Fundamentals',
  mins: 5,
  by: 'Testify',
  qs: [
    { q: 'Which CSS property creates a 3D perspective?', o: ['perspective', 'depth', 'z-index', 'layer'], a: 0 },
    { q: 'localStorage saves values as…', o: ['Objects', 'Strings', 'Blobs', 'Buffers'], a: 1 },
    { q: 'Which tag holds a page\'s metadata?', o: ['<body>', '<head>', '<meta-data>', '<section>'], a: 1 },
    { q: 'Type the HTML tag for the largest heading.', t: 1, a: 'h1' }
  ]
}]);


/* =====================================================
   3. SPATIAL EFFECTS: cursor glow, parallax orbs, card tilt
   ===================================================== */

/* glow follows cursor, orbs drift opposite, hero stage rotates */
addEventListener('pointermove', e => {
  const x = e.clientX, y = e.clientY;
  $('#glow').style.transform = `translate(${x}px,${y}px)`;
  $$('.orb').forEach((o, i) => o.style.transform = `translate(${(x / innerWidth - .5) * -60 * (i + 1)}px,${(y / innerHeight - .5) * -60 * (i + 1)}px)`);
  const st = $('.stage');
  if (st) {
    st.style.setProperty('--ry', (x / innerWidth - .5) * 24 + 'deg');
    st.style.setProperty('--rx', (y / innerHeight - .5) * -18 + 'deg');
  }
});

/* 3D tilt on every .tilt card (re-run after each page render) */
function tilt() {
  $$('.tilt').forEach(el => {
    el.onpointermove = e => {
      const r = el.getBoundingClientRect(),
        x = (e.clientX - r.left) / r.width - .5,
        y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateZ(8px)`;
    };
    el.onpointerleave = () => el.style.transform = '';
  });
}


/* =====================================================
   4. ANTI-CHEAT: no copy/paste/context menu during an exam
   ===================================================== */
['copy', 'cut', 'paste', 'contextmenu'].forEach(ev =>
  document.addEventListener(ev, e => { if (window.inExam) e.preventDefault() })
);


/* =====================================================
   5. ROUTER & NAVIGATION
   ===================================================== */

/* route name -> page function */
const routes = { '': landing, auth, dash, create, exam, result };

/* top navigation bar (changes with login state / role) */
function nav() {
  const u = me();
  $('#nav').innerHTML = `<span class="logo" onclick="location.hash='#/'">Testify</span><div>${u ? `<a href="#/dash">Dashboard</a>${u.role == 'instructor' ? '<a href="#/create">New exam</a>' : ''}<a id="out">Log out (${esc(u.name.split(' ')[0])})</a>` : '<a href="#/auth">Log in</a>'}</div>`;
  if (u) $('#out').onclick = () => { DB.set('session', null); location.hash = '#/' };
}

/* runs on every hash change: guard, reset, render */
function go() {
  clearInterval(window.tm);
  window.inExam = 0;
  const [r, p] = location.hash.slice(2).split('/');
  if (['dash', 'create', 'exam', 'result'].includes(r) && !me()) return location.hash = '#/auth';
  nav();
  const a = $('#app');
  a.style.animation = 'none';
  a.offsetHeight;
  a.style.animation = '';
  a.innerHTML = '';
  (routes[r || ''] || landing)(a, p);
  tilt();
}
addEventListener('hashchange', go);


/* =====================================================
   6. PAGES
   ===================================================== */

/* ---------- 6.1 LANDING ---------- */
function landing(a) {
  a.innerHTML = `<section class="hero"><div><h1>Take exams in a room that feels alive.</h1><p class="mut">Timed tests, instant grading, and honest results. Built for students, instructors and hiring teams.</p><div class="row"><button class="btn" onclick="location.hash='#/${me() ? 'dash' : 'auth'}'">${me() ? 'Open dashboard' : 'Get started'}</button><button class="btn2" onclick="location.hash='#/auth'">I have an account</button></div></div>
<div class="stage"><div class="glass" style="--z:0px;inset:30px 20px 30px 20px;margin:0"><h3>Question 3 of 10</h3><p class="mut">Which CSS property creates depth?</p><br><div class="opt sel">perspective</div><div class="opt">z-index</div></div>
<div class="chip" style="--z:90px;top:0;right:0">⏱ 12:48 left</div><div class="chip" style="--z:130px;bottom:10px;left:-10px">Score 92% ✓</div><div class="chip" style="--z:60px;bottom:90px;right:-10px">3 flagged</div></div></section>
<div class="grid">${[['Real exam conditions', 'Countdown timer, shuffled questions, and tab-switch warnings.'], ['Instant results', 'Auto-graded with a question-by-question review.'], ['Build in minutes', 'Instructors write MCQ and short-answer exams and publish them at once.']].map(f => `<div class="glass tilt"><h3>${f[0]}</h3><p class="mut">${f[1]}</p></div>`).join('')}</div>`;
}


/* ---------- 6.2 AUTH (log in / sign up) ---------- */
function auth(a) {
  let mode = 'in', role = 'student';

  const draw = () => {
    a.innerHTML = `<section class="glass tilt narrow"><h2>${mode == 'in' ? 'Welcome back' : 'Create your account'}</h2>
${mode == 'up' ? `<input id="n" placeholder="Full name"><div class="seg">${['student', 'instructor'].map(r => `<button data-r="${r}" class="${r == role ? 'on' : ''}">${r}</button>`).join('')}</div>` : ''}
<input id="e" type="email" placeholder="Email"><input id="p" type="password" placeholder="Password (min 4 characters)"><button class="btn" id="go" style="width:100%">${mode == 'in' ? 'Log in' : 'Sign up'}</button>
<p class="mut" style="margin-top:14px">${mode == 'in' ? 'New here?' : 'Already registered?'} <a href="#/auth" id="sw" style="color:var(--b)">${mode == 'in' ? 'Create an account' : 'Log in'}</a></p></section>`;
    tilt();

    /* role selector */
    $$('.seg button').forEach(b => b.onclick = () => {
      role = b.dataset.r;
      $$('.seg button').forEach(x => x.classList.toggle('on', x == b));
    });

    /* switch between log in / sign up */
    $('#sw').onclick = e => { e.preventDefault(); mode = mode == 'in' ? 'up' : 'in'; draw() };

    /* submit */
    $('#go').onclick = () => {
      const e = $('#e').value.trim().toLowerCase(),
        p = $('#p').value,
        us = DB.get('users', []);
      if (!e || p.length < 4) return toast('Enter an email and a password of 4+ characters.');

      if (mode == 'up') {
        const n = $('#n').value.trim();
        if (!n) return toast('Add your name.');
        if (us.some(u => u.e == e)) return toast('That email is already registered.');
        const u = { id: uid(), n, e, p: btoa(p), role };
        DB.set('users', [...us, u]);
        DB.set('session', { id: u.id, name: n, role });
      }
      else {
        const u = us.find(u => u.e == e && u.p == btoa(p));
        if (!u) return toast('Email or password is wrong.');
        DB.set('session', { id: u.id, name: u.n, role: u.role });
      }

      toast('Welcome to Testify');
      location.hash = '#/dash';
    };
  };

  draw();
}


/* ---------- 6.3 DASHBOARD (student view / instructor view) ---------- */
function dash(a) {
  const u = me(),
    ex = DB.get('exams', []),
    rs = DB.get('results', []),
    mine = rs.filter(r => r.uid == u.id);

  /* --- student --- */
  if (u.role == 'student') {
    const avg = mine.length ? Math.round(mine.reduce((s, r) => s + r.pct, 0) / mine.length) : 0;
    a.innerHTML = `<h2>Hi ${esc(u.name.split(' ')[0])}, pick an exam</h2><div class="stats"><div class="glass"><b>${mine.length}</b>taken</div><div class="glass"><b>${avg}%</b>average</div><div class="glass"><b>${ex.length}</b>available</div></div>
<div class="grid">${ex.map(e => `<div class="glass tilt"><h3>${esc(e.title)}</h3><p class="mut">${e.qs.length} questions · ${e.mins} min · by ${esc(e.by)}</p><br><button class="btn" onclick="location.hash='#/exam/${e.id}'">Start exam</button></div>`).join('')}</div>
<br><h2>Your results</h2>${mine.length ? mine.slice().reverse().map(r => `<div class="glass tilt bar"><div><h3>${esc(r.exam)}</h3><span class="mut">${new Date(r.at).toLocaleString()}</span></div><div class="row"><span class="pill">${r.pct}%</span><button class="btn2" onclick="location.hash='#/result/${r.id}'">Review</button></div></div>`).join('') : '<p class="mut">No attempts yet. Start an exam above.</p>'}`;
  }

  /* --- instructor --- */
  else {
    const my = ex.filter(e => e.by == u.name),
      att = rs.filter(r => my.some(e => e.id == r.eid));
    a.innerHTML = `<div class="bar"><h2>Instructor desk</h2><button class="btn" onclick="location.hash='#/create'">+ New exam</button></div><div class="stats"><div class="glass"><b>${my.length}</b>exams</div><div class="glass"><b>${att.length}</b>attempts</div><div class="glass"><b>${att.length ? Math.round(att.reduce((s, r) => s + r.pct, 0) / att.length) : 0}%</b>class average</div></div>
<h2>Your exams</h2>${my.length ? my.map(e => `<div class="glass tilt bar"><div><h3>${esc(e.title)}</h3><span class="mut">${e.qs.length} questions · ${e.mins} min · ${rs.filter(r => r.eid == e.id).length} attempts</span></div><button class="btn2" data-d="${e.id}">Delete</button></div>`).join('') : '<p class="mut">Nothing published yet. Create your first exam.</p>'}
<br><h2>Recent attempts</h2>${att.length ? att.slice(-8).reverse().map(r => `<div class="glass bar"><span>${esc(r.name)} · ${esc(r.exam)}</span><span class="pill">${r.pct}% ${r.flags ? '· ' + r.flags + ' warnings' : ''}</span></div>`).join('') : '<p class="mut">Attempts will show up here.</p>'}`;

    /* delete exam */
    $$('[data-d]').forEach(b => b.onclick = () => {
      if (confirm('Delete this exam?')) {
        DB.set('exams', ex.filter(e => e.id != b.dataset.d));
        toast('Exam deleted');
        go();
      }
    });
  }
}


/* ---------- 6.4 CREATE EXAM (instructors only) ---------- */
function create(a) {
  if (me().role != 'instructor') return location.hash = '#/dash';

  a.innerHTML = `<section class="glass narrow" style="max-width:720px"><h2>Create an exam</h2><input id="t" placeholder="Exam title"><input id="m" type="number" min="1" value="10" placeholder="Minutes"><div id="qs"></div><div class="row"><button class="btn2" data-k="mcq">+ Multiple choice</button><button class="btn2" data-k="txt">+ Short answer</button></div><br><button class="btn" id="save">Publish exam</button></section>`;

  /* add one question block (mcq or short answer) */
  const add = k => {
    const d = document.createElement('div'),
      n = uid();
    d.className = 'qb';
    d.dataset.k = k;
    d.innerHTML = `<input class="q" placeholder="Question">${k == 'mcq' ? [0, 1, 2, 3].map(i => `<label class="oi"><input type="radio" name="r${n}" value="${i}" ${i ? '' : 'checked'}><input class="o" placeholder="Option ${i + 1}${i ? '' : ' (mark the correct one with the dot)'}"></label>`).join('') : '<input class="ans" placeholder="Correct answer (not case sensitive)">'}`;
    $('#qs').append(d);
  };
  $$('[data-k]').forEach(b => b.onclick = () => add(b.dataset.k));
  add('mcq');

  /* validate + publish */
  $('#save').onclick = () => {
    const t = $('#t').value.trim(),
      qs = $$('.qb').map(d => {
        const q = $('.q', d).value.trim();
        if (!q) return null;
        if (d.dataset.k == 'mcq') {
          const o = $$('.o', d).map(x => x.value.trim());
          if (o.some(x => !x)) return null;
          return { q, o, a: +$('input[type=radio]:checked', d).value };
        }
        const an = $('.ans', d).value.trim();
        return an ? { q, t: 1, a: an } : null;
      });
    if (!t || !qs.length || qs.includes(null)) return toast('Add a title and complete every question.');
    DB.set('exams', [...DB.get('exams', []), { id: uid(), title: t, mins: +$('#m').value || 10, by: me().name, qs }]);
    toast('Published');
    location.hash = '#/dash';
  };
}


/* ---------- 6.5 EXAM (take an exam) ---------- */
function exam(a, id) {
  const ex = DB.get('exams', []).find(e => e.id == id);
  if (!ex) return location.hash = '#/dash';

  /* exam state */
  const qs = shuffle(ex.qs).map(q => q.t ? q : { ...q, ix: shuffle(q.o.map((_, i) => i)) });
  let i = 0, ans = {}, flag = {}, left = ex.mins * 60, warn = 0, done = false;

  /* intro screen */
  a.innerHTML = `<section class="glass narrow tilt"><h2>${esc(ex.title)}</h2><p class="mut">${qs.length} questions · ${ex.mins} minutes. Leaving this tab three times submits automatically. Copy and paste are disabled.</p><br><button class="btn" id="begin">Begin exam</button></section>`;

  /* start: fullscreen + timer */
  $('#begin').onclick = () => {
    window.inExam = 1;
    document.documentElement.requestFullscreen?.().catch(() => { });
    window.tm = setInterval(() => {
      left--;
      const t = $('#time');
      if (t) {
        t.textContent = fmt(left);
        $('#arc').style.strokeDashoffset = 276.5 * (1 - left / (ex.mins * 60));
      }
      if (left <= 0) submit();
    }, 1000);
    draw();
  };

  /* tab-switch warnings (3 strikes = auto-submit) */
  document.onvisibilitychange = () => {
    if (window.inExam && document.hidden && !done) {
      warn++;
      toast(`Warning ${warn} of 3: stay on this tab.`);
      if (warn >= 3) submit();
    }
  };

  /* render current question */
  function draw() {
    const q = qs[i];
    a.innerHTML = `<div class="glass bar"><div><h3>${esc(ex.title)}</h3><span class="mut">Question ${i + 1} of ${qs.length}</span></div><div class="ring"><svg width="110" height="110"><circle cx="55" cy="55" r="44" stroke="#ffffff18"/><circle id="arc" cx="55" cy="55" r="44" stroke="#22d3ee" stroke-dasharray="276.5" style="stroke-dashoffset:${276.5 * (1 - left / (ex.mins * 60))}"/></svg><b id="time">${fmt(left)}</b></div></div>
<section class="glass"><h2>${esc(q.q)}</h2>${q.t ? `<input id="tx" placeholder="Type your answer" value="${esc(ans[i] || '')}">` : q.ix.map(k => `<div class="opt ${ans[i] === k ? 'sel' : ''}" data-k="${k}" tabindex="0">${esc(q.o[k])}</div>`).join('')}
<div class="row" style="margin-top:14px"><button class="btn2" id="pv" ${i ? '' : 'disabled'}>Back</button><button class="btn2" id="fl">${flag[i] ? 'Unflag' : 'Flag for review'}</button>${i < qs.length - 1 ? '<button class="btn" id="nx">Next</button>' : '<button class="btn" id="fin">Submit exam</button>'}</div></section>
<div class="glass dots">${qs.map((_, k) => `<button class="dot ${ans[k] !== undefined && ans[k] !== '' ? 'done' : ''} ${flag[k] ? 'flag' : ''} ${k == i ? 'cur' : ''}" data-j="${k}">${k + 1}</button>`).join('')}</div>`;

    /* answer selection */
    $$('.opt').forEach(o => {
      o.onclick = () => { ans[i] = +o.dataset.k; draw() };
      o.onkeydown = e => { if (e.key == 'Enter') o.click() };
    });
    if ($('#tx')) $('#tx').oninput = e => ans[i] = e.target.value;

    /* navigation + flag + submit */
    $('#pv').onclick = () => { i--; draw() };
    $('#fl').onclick = () => { flag[i] = !flag[i]; draw() };
    if ($('#nx')) $('#nx').onclick = () => { i++; draw() };
    if ($('#fin')) $('#fin').onclick = () => {
      const m = qs.filter((_, k) => ans[k] === undefined || ans[k] === '').length;
      if (!m || confirm(`${m} unanswered. Submit anyway?`)) submit();
    };
    $$('.dot').forEach(d => d.onclick = () => { i = +d.dataset.j; draw() });
  }

  /* grade + save result */
  function submit() {
    if (done) return;
    done = true;
    clearInterval(window.tm);
    window.inExam = 0;
    document.onvisibilitychange = null;
    document.fullscreenElement && document.exitFullscreen();

    let s = 0;
    const rv = qs.map((q, k) => {
      const y = ans[k],
        ok = q.t ? String(y || '').trim().toLowerCase() == q.a.toLowerCase() : y === q.a;
      if (ok) s++;
      return { q: q.q, you: y === undefined || y === '' ? '(no answer)' : q.t ? y : q.o[y], ok, right: q.t ? q.a : q.o[q.a] };
    });

    const u = me(),
      r = { id: uid(), eid: ex.id, exam: ex.title, uid: u.id, name: u.name, score: s, total: qs.length, pct: Math.round(s / qs.length * 100), rv, flags: warn, secs: ex.mins * 60 - Math.max(left, 0), at: Date.now() };
    DB.set('results', [...DB.get('results', []), r]);
    location.hash = '#/result/' + r.id;
  }
}


/* ---------- 6.6 RESULT (score, review, certificate) ---------- */
function result(a, id) {
  const r = DB.get('results', []).find(x => x.id == id);
  if (!r) return location.hash = '#/dash';

  const msg = r.pct >= 80 ? 'Outstanding work.' : r.pct >= 50 ? 'Solid pass. Review the misses below.' : 'Not there yet. The review shows where to focus.';

  a.innerHTML = `<section class="glass bar tilt"><div><h2>${esc(r.exam)}</h2><p class="mut">${msg}</p><div class="row" style="margin-top:12px"><span class="pill">${r.score}/${r.total} correct</span><span class="pill">${fmt(r.secs)} used</span>${r.flags ? `<span class="pill">${r.flags} warnings</span>` : ''}</div></div>
<div class="ring" style="width:150px;height:150px"><svg width="150" height="150" viewBox="0 0 110 110"><circle cx="55" cy="55" r="44" stroke="#ffffff18"/><circle cx="55" cy="55" r="44" stroke="${r.pct >= 50 ? '#34d399' : '#ff5c93'}" stroke-dasharray="276.5" stroke-dashoffset="${276.5 * (1 - r.pct / 100)}"/></svg><b style="font-size:2rem">${r.pct}%</b></div></section>
<section class="glass"><h2>Question review</h2>${r.rv.map(v => `<div class="rv ${v.ok ? '' : 'bad'}"><b>${esc(v.q)}</b><br><span class="mut">You: ${esc(v.you)}${v.ok ? '' : ` · Correct: ${esc(v.right)}`}</span></div>`).join('')}</section>
<section class="glass row"><button class="btn" onclick="location.hash='#/dash'">Back to dashboard</button>${r.pct >= 50 ? '<button class="btn2" onclick="print()">Print certificate</button>' : ''}</section>
<div class="cert"><h1>Certificate of Achievement</h1><h2>${esc(r.name)}</h2><p>passed <b>${esc(r.exam)}</b> with ${r.pct}%</p><p>${new Date(r.at).toLocaleDateString()} · Testify</p></div>`;
}


/* =====================================================
   7. BOOT
   ===================================================== */
go();
