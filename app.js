/* Gymlog — workout tracker. All data lives in this browser's localStorage. */
(() => {
  'use strict';

  const KEY = 'gymlog.v1';
  const LIBRARY = [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-Up',
    'Lat Pulldown', 'Incline Dumbbell Press', 'Dumbbell Curl', 'Triceps Pushdown',
    'Lateral Raise', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Leg Extension',
    'Calf Raise', 'Face Pull', 'Dip', 'Hip Thrust', 'Seated Cable Row',
  ];

  const $ = (sel) => document.querySelector(sel);
  const uid = () => Math.random().toString(36).slice(2, 10);
  const key = (name) => String(name).trim().toLowerCase();
  const num = (v) => parseFloat(String(v).replace(',', '.'));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const fmtDate = (t, withYear) => new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
  const shortDate = (t) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const setText = (s) => fmt(s.w);

  // A routine exercise is a slot with one or more options (alternatives).
  // Each option has its own name (and so its own history), a usual weight and a note.
  const o = (name, w = '', note = '') => ({ name, w: String(w), note });
  const slot = (leaf, ...options) => ({ sets: 3, leaf, options });
  const BACK = 'IR NEPAMIRŠK IŠRIEST STUBURO IR IŠPŪST KRŪTINĖS!!! NESIKUPROK';

  const SPLIT = () => [
    { id: uid(), name: 'Lower A', exercises: [
      slot(false, o('Hamstring Curl', 45), o('Lying Hamstring Curl', 30), o('One-Leg Hamstring Curl (plate machine)', 15, 'Each side')),
      slot(true, o('Hip Thrust (booty builder machine)', 100), o('Hip Thrust (plate-loaded booty builder)', 90)),
      slot(false, o('Cable Kickback', 17.5, 'Cable at 2nd–3rd lowest setting')),
      slot(true, o('Glute Extension', 30)),
      slot(true, o('Step Up', 22.5, 'Weight in the opposite hand')),
      slot(false, o('Hip Abduction', 70), o('Booty Builder Abduction Machine', 17.5, 'Each side')),
      slot(true,
        o('RDL (Smith machine)', 32.5, 'Each barbell side'),
        o('RDL (barbell)', 15, 'Each side'),
        o('Belted Squat Machine', 50, 'Each side. Labiau squatink ir lenk nugarą žemyn'),
        o('One-Leg RDL (other leg on bench)', 30)),
      slot(false,
        o('Barbell Squat', 25, 'Each side'),
        o('One-Leg Seated Leg Press (fixed weights)', 70),
        o('One-Leg Seated Leg Press (plate-loaded)', 45),
        o('Smith Machine Reverse Split Squat', 20, 'Each side'),
        o('Heavy Leg Press', 20, 'Each side'),
        o('Leg Press (fixed weights)', 140)),
      slot(false, o('Ab Crunch Machine', 25), o('Decline Ab Crunch Bench', 7.5, 'Bench on level 5, dumbbell on chest')),
    ] },
    { id: uid(), name: 'Lower B', exercises: [
      { ...slot(false, o('Stair Master', '', 'A few minutes at speed 16')), sets: 1 },
      slot(false, o('Smith Machine Split Squat (front foot on plate)', '', 'Back foot not touching the ground; eventually only the top of the foot on the ground, as far back as possible — the Mike / Renaissance way')),
      slot(false,
        o('Leg Press', 90, 'Each side'),
        o('Leg Press (fixed weights)', 130),
        o('Lying Leg Press', 60, 'Each side'),
        o('Pendulum Squat', 30, 'Each side'),
        o('Sumo Squat (belted booty builder)', 30, 'Each side'),
        o('Hack Squat', 25, 'Each side'),
        o('Lying Leg Press (naujam gyme)', 50, 'Each side')),
      slot(false, o('Glute-Focused Dumbbell Lunge')),
      slot(false, o('Glute-Focused Lunge Walk')),
    ] },
    { id: uid(), name: 'Upper', exercises: [
      slot(true, o('Dumbbell Shoulder Press', 12.5, 'Each hand'), o('Shoulder Press Machine (plate-loaded)', 12.5, 'Each hand')),
      slot(true,
        o('Chest Press Machine', 40, 'Seat on 5'),
        o('Chest Press Machine (plate-loaded)', 15, 'Each side'),
        o('Bench Press', 30),
        o('Dumbbell Bench Press', 7, 'Each hand')),
      slot(true, o('Assisted Pull-Up', 21), o('Lat Pulldown', 45), o('Lat Pulldown (plate-loaded)', 25, 'Each side')),
      slot(true, o('Unilateral Pulldown Machine', 22.5, 'Each hand')),
      slot(true,
        o('Shoulder Fly (dumbbells)', 6, 'Each hand'),
        o('Delt Machine', 20, 'Seat on 6. NEKELK PEČIŲ. LAIKYK JUOS NULEISTUS PER VISĄ RANGE OF MOTION')),
      slot(true, o('Cable Lat Row', 40, BACK), o('Machine Lat Row', 25, 'Each hand. ' + BACK)),
      slot(false, o('Cable Tricep Pushdown', 17.5), o('Tricep Pulldown Machine', 30)),
      slot(true, o('Tricep Dip (pull-up machine)', 17)),
      slot(true,
        o('Dumbbell Bicep Curl', 9, 'Each hand'),
        o('Bicep Curl (front pad)', 15),
        o('Bicep Curl (small wavy barbell)', 20),
        o('Bicep Curl Machine', 12.5)),
      slot(false,
        o('Reverse Fly Machine', 10, 'Seat on 5'),
        o('Face Pull (cable, rope)', 17.5, 'Standing'),
        o('Face Pull (cable, no rope)', 5, 'Standing, holding the cables themselves')),
      slot(false, o('Ab Crunch Machine', 25), o('Decline Ab Crunch Bench', 5, 'Bench on 6, dumbbell on chest')),
    ] },
  ];

  const defaults = () => ({
    units: 'kg',
    seed: 2,
    routines: SPLIT(),
    workouts: [], // finished, oldest first
    active: null,
  });

  const valid = (s) => s && Array.isArray(s.routines) && Array.isArray(s.workouts);

  // Upgrades data saved by the first version (single-name exercises, Push/Pull/Legs starter routines).
  function normalize(s) {
    s.routines.forEach((r) => {
      r.exercises = r.exercises.map((e) => ({ sets: e.sets, leaf: !!e.leaf, options: e.options || [o(e.name)] }));
    });
    if (s.active) s.active.entries.forEach((e) => { if (!e.options) e.options = [o(e.name)]; });
    if (!(s.seed >= 2)) {
      const starter = s.routines.map((r) => r.name).join() === 'Push,Pull,Legs';
      if (starter && !s.workouts.length) s.routines = SPLIT();
      else SPLIT().forEach((r) => { if (!s.routines.some((x) => key(x.name) === key(r.name))) s.routines.push(r); });
      s.seed = 2;
    }
    return s;
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (valid(s)) return normalize(s);
    } catch {}
    return defaults();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  let state = load();
  const ui = { tab: 'workout', draft: null, open: null, exercise: null };

  /* ---------- derived data ---------- */

  // Every finished session of an exercise, oldest first.
  function sessions(name) {
    const k = key(name);
    const out = [];
    for (const w of state.workouts) {
      const sets = w.entries.filter((e) => key(e.name) === k).flatMap((e) => e.sets);
      if (sets.length) out.push({ t: w.finishedAt, sets });
    }
    return out;
  }
  const lastSession = (name) => sessions(name).pop() || null;
  const bestWeight = (name) => Math.max(0, ...sessions(name).flatMap((s) => s.sets.map((x) => x.w)));
  function prevSet(name, i) {
    const last = lastSession(name);
    return last ? last.sets[Math.min(i, last.sets.length - 1)] : null;
  }
  function exerciseNames() {
    const seen = new Map();
    const add = (n) => { if (n && n.trim() && !seen.has(key(n))) seen.set(key(n), n.trim()); };
    state.workouts.forEach((w) => w.entries.forEach((e) => add(e.name)));
    state.routines.forEach((r) => r.exercises.forEach((e) => e.options.forEach((x) => add(x.name))));
    LIBRARY.forEach(add);
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }
  const loggedExercises = () => {
    const seen = new Map();
    state.workouts.forEach((w) => w.entries.forEach((e) => { if (!seen.has(key(e.name))) seen.set(key(e.name), e.name); }));
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  };
  const setCount = (w) => w.entries.reduce((a, e) => a + e.sets.length, 0);
  const duration = (w) => {
    const m = Math.max(1, Math.round((w.finishedAt - w.startedAt) / 60000));
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
  };

  /* ---------- confirm dialog ---------- */

  function ask(msg, ok = 'OK', danger = false) {
    return new Promise((resolve) => {
      const d = $('#dlg');
      $('#dlg-msg').textContent = msg;
      const b = $('#dlg-ok');
      b.textContent = ok;
      b.className = 'btn ' + (danger ? 'danger' : 'primary');
      d.returnValue = '';
      d.onclose = () => resolve(d.returnValue === 'ok');
      d.showModal();
    });
  }

  /* ---------- views ---------- */

  const blankSet = () => ({ w: '', done: false });
  const blankSlot = () => ({ sets: 3, leaf: false, options: [o('')] });
  // The routine option a workout entry is currently set to (usual weight + note).
  const optionOf = (e) => e.options.find((x) => key(x.name) === key(e.name)) || o(e.name);

  function viewWorkout() {
    const a = state.active;
    if (!a) {
      const cards = state.routines.map((r) => {
        const last = [...state.workouts].reverse().find((w) => w.routineId === r.id);
        return `<div class="card row">
          <div class="grow">
            <div class="name">${esc(r.name)}</div>
            <div class="muted ellipsis">${esc(r.exercises.map((e) => e.options[0].name).join(', '))}</div>
            <div class="muted">${last ? 'Last done ' + fmtDate(last.finishedAt) : 'Not done yet'}</div>
          </div>
          <button class="btn primary" data-a="start" data-id="${r.id}">Start</button>
        </div>`;
      }).join('');
      return `<div class="section">Start from a routine</div>
        ${cards || '<div class="card empty">No routines yet. Create one in the Routines tab.</div>'}
        <button class="btn block" data-a="start">Start empty workout</button>`;
    }

    const entries = a.entries.map((e, ei) => {
      const last = lastSession(e.name);
      const best = bestWeight(e.name);
      const opt = optionOf(e);
      const rows = e.sets.map((s, si) => {
        const p = prevSet(e.name, si);
        const isPR = s.done && best > 0 && num(s.w) > best;
        return `<div class="set ${s.done ? 'done' : ''}">
          <span class="n">${si + 1}</span>
          <span class="prev">${p ? setText(p) : '—'}${isPR ? '<span class="pr">PR</span>' : ''}</span>
          <input data-i="w" data-e="${ei}" data-s="${si}" inputmode="decimal" autocomplete="off" aria-label="Weight, set ${si + 1}" placeholder="${p ? fmt(p.w) : opt.w || '0'}" value="${esc(s.w)}">
          <button class="chk" data-a="done" data-e="${ei}" data-s="${si}" aria-label="Mark set ${si + 1} done" aria-pressed="${s.done}">✓</button>
        </div>`;
      }).join('');
      return `<div class="card">
        <div class="row">
          <div class="grow">
            ${e.options.length > 1
              ? `<div class="variant-row">${e.leaf ? '<span>🍃</span>' : ''}<select class="variant" data-i="variant" data-e="${ei}" aria-label="Choose variation">${e.options.map((x) => `<option value="${esc(x.name)}" ${key(x.name) === key(e.name) ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>`
              : `<div class="name">${e.leaf ? '🍃 ' : ''}${esc(e.name)}</div>`}
            ${opt.note ? `<div class="note">${esc(opt.note)}</div>` : ''}
            <div class="muted">${last ? `Last: ${last.sets.map(setText).join(' · ')} ${state.units} (${shortDate(last.t)})` : opt.w ? `Usual: ${esc(opt.w)} ${state.units}` : 'First time logging this'}</div>
          </div>
          <button class="x" data-a="rm-entry" data-e="${ei}" aria-label="Remove ${esc(e.name)}">×</button>
        </div>
        <div class="sets">
          <div class="set-head"><span>#</span><span>Previous</span><span>${state.units}</span><span></span></div>
          ${rows}
        </div>
        <div class="row">
          <button class="btn small ghost" data-a="add-set" data-e="${ei}">+ Add set</button>
          ${e.sets.length > 1 ? `<button class="btn small danger" data-a="rm-set" data-e="${ei}">Remove last set</button>` : ''}
        </div>
      </div>`;
    }).join('');

    return `<div class="workout-bar row">
        <div class="grow">
          <div class="name ellipsis">${esc(a.name)}</div>
          <div class="muted" id="clock"></div>
        </div>
        <button class="btn primary" data-a="finish">Finish</button>
      </div>
      ${entries}
      <div class="card">
        <label class="field-label" for="new-ex">Add exercise</label>
        <div class="add-row">
          <input id="new-ex" list="exercise-list" placeholder="e.g. Bench Press" autocomplete="off">
          <button class="btn" data-a="add-entry">Add</button>
        </div>
      </div>
      <button class="btn danger block" data-a="discard">Discard workout</button>`;
  }

  function viewRoutines() {
    const d = ui.draft;
    if (d) {
      const slots = d.exercises.map((e, i) => `<div class="card">
          <div class="row slot-head">
            <span class="field-label grow" style="margin:0">Exercise ${i + 1}</span>
            <button class="x leaf ${e.leaf ? 'on' : ''}" data-a="d-leaf" data-x="${i}" aria-label="Leaf marker" aria-pressed="${!!e.leaf}">🍃</button>
            <input class="num sets-in" data-i="d-sets" data-x="${i}" inputmode="numeric" aria-label="Sets" value="${esc(e.sets)}">
            <span class="muted">sets</span>
            <button class="x" data-a="d-up" data-x="${i}" aria-label="Move up" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>↑</button>
            <button class="x" data-a="d-rm" data-x="${i}" aria-label="Remove exercise">×</button>
          </div>
          ${e.options.map((x, j) => `<div class="opt">
            <input data-i="d-name" data-x="${i}" data-o="${j}" list="exercise-list" placeholder="${j ? 'Alternative' : 'Exercise'}" autocomplete="off" aria-label="${j ? 'Alternative' : 'Exercise'} name" value="${esc(x.name)}">
            <input class="num" data-i="d-w" data-x="${i}" data-o="${j}" inputmode="decimal" placeholder="${state.units}" autocomplete="off" aria-label="Usual weight" value="${esc(x.w)}">
            ${j ? `<button class="x" data-a="d-alt-rm" data-x="${i}" data-o="${j}" aria-label="Remove alternative">×</button>` : '<span></span>'}
            <input class="opt-note" data-i="d-note" data-x="${i}" data-o="${j}" placeholder="Note (seat, cue…)" autocomplete="off" aria-label="Note" value="${esc(x.note)}">
          </div>`).join('')}
          <button class="btn small ghost" data-a="d-alt-add" data-x="${i}">+ Add alternative</button>
        </div>`).join('');
      return `<div class="card">
          <label class="field-label" for="d-title">Routine name</label>
          <input id="d-title" data-i="d-title" placeholder="e.g. Upper body" autocomplete="off" value="${esc(d.name)}">
        </div>
        ${slots}
        <button class="btn block" data-a="d-add">+ Add exercise</button>
        <div class="row">
          <button class="btn grow" data-a="d-cancel">Cancel</button>
          <button class="btn primary grow" data-a="d-save">Save routine</button>
        </div>
        ${d.id ? '<button class="btn danger block" data-a="d-delete">Delete routine</button>' : ''}`;
    }
    const cards = state.routines.map((r) => `<div class="card row">
        <div class="grow">
          <div class="name">${esc(r.name)}</div>
          <div class="muted">${esc(r.exercises.map((e) => `${e.leaf ? '🍃 ' : ''}${e.options[0].name}${e.options.length > 1 ? ` (+${e.options.length - 1} alt)` : ''}`).join(' · '))}</div>
        </div>
        <button class="btn small" data-a="edit" data-id="${r.id}">Edit</button>
      </div>`).join('');
    return `${cards || '<div class="card empty">No routines yet.</div>'}
      <button class="btn primary block" data-a="new-routine">+ New routine</button>`;
  }

  function viewHistory() {
    if (!state.workouts.length) return '<div class="card empty">No workouts logged yet.<br>Finish one and it shows up here.</div>';
    return [...state.workouts].reverse().map((w) => {
      const open = ui.open === w.id;
      const detail = open ? `<div class="detail">
          ${w.entries.map((e) => `<div><div><b>${esc(e.name)}</b></div><div class="sets-line">${e.sets.map(setText).join(' · ')} ${state.units}</div></div>`).join('')}
          <button class="btn small danger" data-a="del-workout" data-id="${w.id}" style="align-self:flex-start;padding-left:0">Delete workout</button>
        </div>` : '';
      return `<div class="card tap" data-a="toggle" data-id="${w.id}">
        <div class="row">
          <div class="grow"><div class="name ellipsis">${esc(w.name)}</div><div class="muted">${fmtDate(w.finishedAt, true)}</div></div>
          <div class="muted" style="text-align:right">${duration(w)}<br>${setCount(w)} set${setCount(w) === 1 ? '' : 's'}</div>
        </div>${detail}
      </div>`;
    }).join('');
  }


  function chart(points) {
    const W = 320, H = 170, pl = 40, pr = 12, pt = 12, pb = 24;
    const vs = points.map((p) => p.v);
    let lo = Math.min(...vs), hi = Math.max(...vs);
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.12;
    const a = lo - pad, b = hi + pad;
    const x = (i) => (points.length === 1 ? pl + (W - pl - pr) / 2 : pl + ((W - pl - pr) * i) / (points.length - 1));
    const y = (v) => pt + (H - pt - pb) * (1 - (v - a) / (b - a));
    const grid = [lo, (lo + hi) / 2, hi].map((v) => `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 3}" text-anchor="end">${fmt(Math.round(v * 10) / 10)}</text>`).join('');
    const line = points.length > 1 ? `<polyline class="line" points="${points.map((p, i) => `${x(i)},${y(p.v)}`).join(' ')}"/>` : '';
    const dots = points.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p.v)}" r="3.5"><title>${shortDate(p.t)}: ${fmt(p.v)}</title></circle>`).join('');
    const labels = points.length > 1
      ? `<text x="${pl}" y="${H - 6}">${shortDate(points[0].t)}</text><text x="${W - pr}" y="${H - 6}" text-anchor="end">${shortDate(points[points.length - 1].t)}</text>`
      : `<text x="${x(0)}" y="${H - 6}" text-anchor="middle">${shortDate(points[0].t)}</text>`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart">${grid}${line}${dots}${labels}</svg>`;
  }

  function viewProgress() {
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const week = state.workouts.filter((w) => w.finishedAt >= monday.getTime()).length;
    const total = state.workouts.reduce((a, w) => a + setCount(w), 0);
    const tiles = `<div class="tiles">
        <div class="tile"><b>${state.workouts.length}</b><span>Workouts</span></div>
        <div class="tile"><b>${week}</b><span>This week</span></div>
        <div class="tile"><b>${fmt(total)}</b><span>Sets done</span></div>
      </div>`;

    const names = loggedExercises();
    if (!names.length) return tiles + '<div class="card empty">Log a workout to see charts and personal records.</div>';
    if (!ui.exercise || !names.some((n) => key(n) === key(ui.exercise))) ui.exercise = names[0];

    const ss = sessions(ui.exercise);
    const points = ss.map((s) => ({ t: s.t, v: Math.max(...s.sets.map((x) => x.w)) }));
    const top = Math.max(...points.map((p) => p.v));

    const prs = names.map((n) => {
      let best = null;
      for (const s of sessions(n)) for (const x of s.sets) if (!best || x.w > best.w) best = { w: x.w, t: s.t };
      return `<button class="pr-row" data-a="pick" data-name="${esc(n)}"><span class="ellipsis">${esc(n)}</span><span><b>${fmt(best.w)} ${state.units}</b> <span class="muted">${shortDate(best.t)}</span></span></button>`;
    }).join('');

    return `${tiles}
      <div class="card">
        <select data-i="exercise" aria-label="Exercise">${names.map((n) => `<option ${key(n) === key(ui.exercise) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        ${chart(points)}
        <div class="muted" style="margin-top:8px">Top weight per session · Best ${fmt(top)} ${state.units} · ${ss.length} session${ss.length === 1 ? '' : 's'}</div>
      </div>
      <div class="section">Personal records</div>
      <div class="card">${prs}</div>`;
  }

  function viewSettings() {
    return `<div class="card">
        <span class="field-label">Weight unit</span>
        <div class="seg">${['kg', 'lb'].map((u) => `<button data-a="units" data-u="${u}" class="${state.units === u ? 'on' : ''}">${u}</button>`).join('')}</div>
        <p class="muted" style="margin-top:8px">Changes the label only. Logged numbers are not converted.</p>
      </div>
      <div class="card">
        <span class="field-label">Backup</span>
        <p class="muted" style="margin-bottom:10px">Your data is stored only in this browser on this device. Export a backup file now and then.</p>
        <div class="row">
          <button class="btn grow" data-a="export">Export</button>
          <button class="btn grow" data-a="import">Import</button>
        </div>
        <input type="file" id="import-file" accept="application/json,.json" hidden>
      </div>
      <p class="muted" style="text-align:center">${state.workouts.length} workouts · ${state.routines.length} routines</p>`;
  }

  const VIEWS = { workout: viewWorkout, routines: viewRoutines, history: viewHistory, progress: viewProgress, settings: viewSettings };
  const TITLES = { workout: 'Workout', routines: 'Routines', history: 'History', progress: 'Progress', settings: 'Settings' };

  function tick() {
    const c = $('#clock');
    if (!c || !state.active) return;
    const s = Math.floor((Date.now() - state.active.startedAt) / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    c.textContent = (s >= 3600 ? Math.floor(s / 3600) + ':' : '') + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
  }

  function render() {
    $('#title').textContent = ui.tab === 'routines' && ui.draft ? (ui.draft.id ? 'Edit routine' : 'New routine') : TITLES[ui.tab];
    $('#view').innerHTML = VIEWS[ui.tab]();
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
    $('#exercise-list').innerHTML = exerciseNames().map((n) => `<option value="${esc(n)}">`).join('');
    tick();
  }

  /* ---------- actions ---------- */

  const actions = {
    tab(el) { ui.tab = el.dataset.tab; ui.draft = null; window.scrollTo(0, 0); },

    start(el) {
      const r = state.routines.find((x) => x.id === el.dataset.id);
      state.active = {
        id: uid(),
        routineId: r ? r.id : null,
        name: r ? r.name : 'Workout',
        startedAt: Date.now(),
        entries: r ? r.exercises.map((e) => {
          // Default to whichever alternative was done most recently.
          let pick = e.options[0], t = 0;
          for (const x of e.options) { const l = lastSession(x.name); if (l && l.t > t) { t = l.t; pick = x; } }
          return { name: pick.name, leaf: e.leaf, options: e.options, sets: Array.from({ length: Math.max(1, e.sets) }, blankSet) };
        }) : [],
      };
      window.scrollTo(0, 0);
    },
    done(el) {
      const e = state.active.entries[el.dataset.e];
      const s = e.sets[el.dataset.s];
      if (s.done) { s.done = false; return; }
      const p = prevSet(e.name, +el.dataset.s);
      const w = s.w !== '' ? s.w : p ? String(p.w) : optionOf(e).w || '0';
      s.w = String(num(w) >= 0 ? num(w) : 0);
      s.done = true;
    },
    'add-set'(el) { state.active.entries[el.dataset.e].sets.push(blankSet()); },
    'rm-set'(el) { state.active.entries[el.dataset.e].sets.pop(); },
    'add-entry'() {
      const name = $('#new-ex').value.trim();
      if (!name) { $('#new-ex').focus(); return false; }
      const known = exerciseNames().find((n) => key(n) === key(name));
      state.active.entries.push({ name: known || name, leaf: false, options: [o(known || name)], sets: [blankSet(), blankSet(), blankSet()] });
    },
    async 'rm-entry'(el) {
      const e = state.active.entries[el.dataset.e];
      if (e.sets.some((s) => s.done) && !(await ask(`Remove ${e.name} and its logged sets?`, 'Remove', true))) return false;
      state.active.entries.splice(el.dataset.e, 1);
    },
    async finish() {
      const a = state.active;
      const entries = a.entries
        .map((e) => ({ name: e.name, sets: e.sets.filter((s) => s.done).map((s) => ({ w: num(s.w) })) }))
        .filter((e) => e.sets.length);
      if (!entries.length) {
        if (!(await ask('No sets are ticked off yet. Discard this workout?', 'Discard', true))) return false;
        state.active = null;
        return;
      }
      const open = a.entries.reduce((n, e) => n + e.sets.filter((s) => !s.done).length, 0);
      if (open && !(await ask(`${open} set${open === 1 ? ' is' : 's are'} not ticked off and won't be saved. Finish anyway?`, 'Finish'))) return false;
      const w = { id: a.id, routineId: a.routineId, name: a.name, startedAt: a.startedAt, finishedAt: Date.now(), entries };
      state.workouts.push(w);
      state.active = null;
      ui.tab = 'history';
      ui.open = w.id;
      window.scrollTo(0, 0);
    },
    async discard() {
      if (!(await ask('Discard this workout? Nothing from it will be saved.', 'Discard', true))) return false;
      state.active = null;
    },

    'new-routine'() { ui.draft = { id: null, name: '', exercises: [blankSlot()] }; },
    'd-leaf'(el) { const e = ui.draft.exercises[el.dataset.x]; e.leaf = !e.leaf; },
    'd-alt-add'(el) { ui.draft.exercises[el.dataset.x].options.push(o('')); },
    'd-alt-rm'(el) { ui.draft.exercises[el.dataset.x].options.splice(el.dataset.o, 1); },
    edit(el) { ui.draft = JSON.parse(JSON.stringify(state.routines.find((r) => r.id === el.dataset.id))); },
    'd-add'() {
      ui.draft.exercises.push(blankSlot());
      setTimeout(() => { const all = document.querySelectorAll('input[data-i="d-name"]'); if (all.length) all[all.length - 1].focus(); });
    },
    'd-rm'(el) { ui.draft.exercises.splice(el.dataset.x, 1); },
    'd-up'(el) { const i = +el.dataset.x, x = ui.draft.exercises; if (i > 0) [x[i - 1], x[i]] = [x[i], x[i - 1]]; },
    'd-cancel'() { ui.draft = null; },
    'd-save'() {
      const d = ui.draft;
      const exercises = d.exercises
        .map((e) => ({
          sets: Math.min(20, Math.max(1, Math.round(num(e.sets)) || 3)),
          leaf: !!e.leaf,
          options: e.options
            .filter((x) => x.name.trim())
            .map((x) => ({ name: x.name.trim(), w: Number.isFinite(num(x.w)) ? String(num(x.w)) : '', note: x.note.trim() })),
        }))
        .filter((e) => e.options.length);
      if (!d.name.trim()) { $('#d-title').focus(); return false; }
      if (!exercises.length) { const i = document.querySelector('input[data-i="d-name"]'); if (i) i.focus(); else actions['d-add'](); return !i; }
      const r = { id: d.id || uid(), name: d.name.trim(), exercises };
      const at = state.routines.findIndex((x) => x.id === r.id);
      if (at >= 0) state.routines[at] = r; else state.routines.push(r);
      ui.draft = null;
    },
    async 'd-delete'() {
      if (!(await ask(`Delete the routine "${ui.draft.name}"? Logged workouts are kept.`, 'Delete', true))) return false;
      state.routines = state.routines.filter((r) => r.id !== ui.draft.id);
      ui.draft = null;
    },

    toggle(el) { ui.open = ui.open === el.dataset.id ? null : el.dataset.id; },
    async 'del-workout'(el) {
      if (!(await ask('Delete this workout? This cannot be undone.', 'Delete', true))) return false;
      state.workouts = state.workouts.filter((w) => w.id !== el.dataset.id);
    },

    pick(el) { ui.exercise = el.dataset.name; window.scrollTo(0, 0); },

    units(el) { state.units = el.dataset.u; },
    export() {
      const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `gymlog-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return false;
    },
    import() { $('#import-file').click(); return false; },
  };

  document.addEventListener('click', async (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const act = actions[el.dataset.a];
    if (!act) return;
    if (el.dataset.a !== 'toggle') ev.stopPropagation();
    const result = await act(el);
    if (result === false) return; // nothing changed
    save();
    render();
  });

  // Typing updates state in place without re-rendering, so focus is never lost.
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    const d = el.dataset;
    switch (d.i) {
      case 'w': {
        const s = state.active.entries[d.e].sets[d.s];
        s[d.i] = el.value.trim();
        if (s.done) { s.done = false; el.closest('.set').classList.remove('done'); }
        save();
        break;
      }
      case 'd-title': ui.draft.name = el.value; break;
      case 'd-name': ui.draft.exercises[d.x].options[d.o].name = el.value; break;
      case 'd-w': ui.draft.exercises[d.x].options[d.o].w = el.value; break;
      case 'd-note': ui.draft.exercises[d.x].options[d.o].note = el.value; break;
      case 'd-sets': ui.draft.exercises[d.x].sets = el.value; break;
    }
  });

  document.addEventListener('change', async (ev) => {
    const el = ev.target;
    if (el.dataset.i === 'exercise') { ui.exercise = el.value; render(); return; }
    if (el.dataset.i === 'variant') { state.active.entries[el.dataset.e].name = el.value; save(); render(); return; }
    if (el.id === 'import-file' && el.files[0]) {
      let data = null;
      try { data = JSON.parse(await el.files[0].text()); } catch {}
      el.value = '';
      if (!valid(data)) { await ask('That file is not a Gymlog backup.', 'OK'); return; }
      if (!(await ask(`Replace everything here with the backup (${data.workouts.length} workouts, ${data.routines.length} routines)?`, 'Replace', true))) return;
      state = normalize({ ...defaults(), ...data });
      save();
      render();
    }
  });

  // Enter in the "add exercise" field adds it.
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.id === 'new-ex') { ev.preventDefault(); document.querySelector('[data-a="add-entry"]').click(); }
  });

  setInterval(tick, 1000);
  render();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
