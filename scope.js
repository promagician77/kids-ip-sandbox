(function () {
'use strict';
var $ = function (id) { return document.getElementById(id) };

// tabs
document.querySelector('.tabs').addEventListener('click', function (e) {
  var b = e.target.closest('[role=tab]'); if (!b) return;
  document.querySelectorAll('[role=tab]').forEach(function (t) { t.setAttribute('aria-selected', String(t === b)) });
  document.querySelectorAll('.panel').forEach(function (p) { p.hidden = p.id !== b.dataset.tab });
});

// ---------------- estimator ----------------
// Indicative unit costs for a small senior team (USD). Refined after the IP brief.
var OPTS = [
  { k: 'loc', label: 'Play locations', help: 'rooms or places, like home and garden', type: 'num', min: 1, max: 6, def: 2 },
  { k: 'chars', label: 'Playable characters', help: 'from your IP, rigged and animated', type: 'num', min: 2, max: 8, def: 4 },
  { k: 'dens', label: 'Things to play with per location', type: 'seg', opts: [['light', '~10'], ['std', '~20'], ['rich', '~30']], def: 'std' },
  { k: 'prog', label: 'Progression', type: 'seg', opts: [['none', 'Free play'], ['stickers', 'Sticker book'], ['loop', 'Grow & collect']], def: 'loop' },
  { k: 'audio', label: 'Voice & sound', type: 'seg', opts: [['sfx', 'Sound effects'], ['voice', '+ Character voices'], ['narr', '+ Narrated guide']], def: 'voice' },
  { k: 'lang', label: 'Languages', type: 'seg', opts: [['1', '1'], ['5', '5'], ['10', '10']], def: '1' },
  { k: 'money', label: 'How it earns', type: 'seg', opts: [['premium', 'Paid app'], ['packs', 'Free + room packs'], ['sub', 'Subscription']], def: 'packs' },
  { k: 'cloud', label: 'Accounts & cloud save', type: 'seg', opts: [['no', 'No (device only)'], ['yes', 'Yes']], def: 'no' }
];
var PRESETS = {
  lean: { loc: 1, chars: 2, dens: 'light', prog: 'stickers', audio: 'sfx', lang: '1', money: 'premium', cloud: 'no' },
  rec: { loc: 2, chars: 4, dens: 'std', prog: 'loop', audio: 'voice', lang: '1', money: 'packs', cloud: 'no' },
  big: { loc: 4, chars: 6, dens: 'rich', prog: 'loop', audio: 'narr', lang: '5', money: 'packs', cloud: 'yes' }
};
var S = Object.assign({}, PRESETS.rec);

function estimate(s) {
  var dens = { light: 0.65, std: 1, rich: 1.4 }[s.dens];
  var art = s.loc * 2000 * dens + s.chars * 1500 + 1200;           // locations, characters, UI kit
  var eng = 5000 + s.loc * 1000 * dens;                              // core sandbox, save, gate, plus per-location interactions
  eng += { none: 0, stickers: 1000, loop: 2500 }[s.prog];
  eng += { premium: 400, packs: 1800, sub: 2800 }[s.money];
  if (s.cloud === 'yes') eng += 4000;
  var audio = { sfx: 1200, voice: 3200, narr: 4200 }[s.audio];
  var loc = { '1': 0, '5': 1800, '10': 4000 }[s.lang] * (s.audio === 'sfx' ? 0.5 : 1);
  var sub = art + eng + audio + loc, qa = sub * 0.10, pm = sub * 0.06, total = sub + qa + pm;
  var weeks = Math.round(3 + s.loc * 1.8 * dens + s.chars * 0.5 + { none: 0, stickers: 0.5, loop: 1.5 }[s.prog] + (s.cloud === 'yes' ? 2 : 0) + (s.lang === '10' ? 1 : 0) + 2);
  var parts = [['Art & animation', art, '#FF8FAB'], ['Engineering', eng, '#4FC3F7'], ['Sound & voice', audio, '#C77DFF'], ['Localization', loc, '#FFB703'], ['QA & kids compliance', qa, '#8BD46E'], ['Production', pm, '#90A4AE']].filter(function (p) { return p[1] > 0 });
  var drivers = [];
  drivers.push(['Characters', s.chars * 1500, s.chars + ' characters, each rigged with a set of animations']);
  drivers.push(['Locations', s.loc * (2000 + 1000) * dens, s.loc + ' location' + (s.loc > 1 ? 's' : '') + ' full of things to touch']);
  drivers.push(['Voice', audio, s.audio === 'sfx' ? 'sound effects only' : 'character voices' + (s.audio === 'narr' ? ' plus a narrated guide' : '')]);
  if (s.cloud === 'yes') drivers.push(['Accounts', 4000, 'logins mean parental consent flows (COPPA)']);
  if (loc) drivers.push(['Languages', loc, s.lang + ' languages']);
  drivers.sort(function (a, b) { return b[1] - a[1] });
  var team = ['Game designer & producer (me)', 'Unity developer', '2D artist & animator'];
  if (s.chars >= 5 || s.loc >= 4) team.push('Second artist');
  team.push(s.audio === 'sfx' ? 'Sound designer (part-time)' : 'Sound designer & voice director');
  team.push('QA with kid playtests (part-time)');
  return { total: total, low: total * 0.85, high: total * 1.15, weeks: weeks, parts: parts, drivers: drivers.slice(0, 3), team: team };
}
var money = function (n) { return '$' + (Math.round(n / 500) * 500).toLocaleString('en-US') };

function renderControls() {
  $('controls').innerHTML = OPTS.map(function (o) {
    var ctl = o.type === 'num'
      ? '<div class="num"><button data-k="' + o.k + '" data-d="-1" aria-label="fewer">−</button><b>' + S[o.k] + '</b><button data-k="' + o.k + '" data-d="1" aria-label="more">+</button></div>'
      : '<div class="seg">' + o.opts.map(function (x) { return '<button data-k="' + o.k + '" data-v="' + x[0] + '" aria-pressed="' + (S[o.k] === x[0]) + '">' + x[1] + '</button>' }).join('') + '</div>';
    return '<div class="ctl"><div><b>' + o.label + '</b>' + (o.help ? '<small>' + o.help + '</small>' : '') + '</div>' + ctl + '</div>' }).join('') }
function renderOut() {
  var e = estimate(S);
  $('estCost').textContent = money(e.low) + ' – ' + money(e.high);
  $('estWeeks').textContent = 'about ' + e.weeks + ' weeks to launch';
  $('bars').innerHTML = '<div class="stack">' + e.parts.map(function (p) { return '<i style="flex:' + p[1] + ';background:' + p[2] + '" title="' + p[0] + '"></i>' }).join('') + '</div><div class="legend">' + e.parts.map(function (p) { return '<span><i style="background:' + p[2] + '"></i>' + p[0] + ' <b>' + money(p[1]) + '</b></span>' }).join('') + '</div>';
  $('drivers').innerHTML = e.drivers.map(function (d) { return '<li><b>' + d[0] + '</b> · ' + d[2] + ' <span>' + money(d[1]) + '</span></li>' }).join('');
  $('team').innerHTML = e.team.map(function (t) { return '<span>' + t + '</span>' }).join('');
  renderStages(e.weeks) }
$('controls').addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b) return; var k = b.dataset.k, o = OPTS.filter(function (x) { return x.k === k })[0];
  if (b.dataset.d) S[k] = Math.max(o.min, Math.min(o.max, S[k] + +b.dataset.d)); else S[k] = b.dataset.v;
  document.querySelectorAll('[data-preset]').forEach(function (p) { p.classList.remove('on') }); renderControls(); renderOut() });
document.querySelectorAll('[data-preset]').forEach(function (b) { b.addEventListener('click', function () { S = Object.assign({}, PRESETS[b.dataset.preset]); document.querySelectorAll('[data-preset]').forEach(function (p) { p.classList.toggle('on', p === b) }); renderControls(); renderOut() }) });

// ---------------- stages ----------------
function renderStages(total) {
  var prod = Math.max(3, total - 2 - 2 - 2);
  var st = [['Discovery', 2, 'IP deep-dive, play loops, v1 scope locked', '#FFB703'], ['Playable slice', 2, 'One room, two characters, your art style, tested with kids', '#FF8FAB'],
    ['Production', prod, 'All locations and characters, builds every two weeks', '#4FC3F7'], ['Polish & compliance', 2, 'Kid playtests, Kids Category and Families checks, store review', '#8BD46E']];
  var sum = st.reduce(function (a, s) { return a + s[1] }, 0), start = 0;
  $('stages').innerHTML = '<div class="gantt">' + st.map(function (s) { var l = start / sum * 100, w = s[1] / sum * 100; start += s[1];
    return '<div class="grow-row"><div class="gl"><b>' + s[0] + '</b><small>' + s[2] + '</small></div><div class="gtrack"><i style="left:' + l + '%;width:' + w + '%;background:' + s[3] + '">' + s[1] + ' wk</i></div></div>' }).join('') + '</div><p class="fine">Then soft launch in one or two countries, and updates with new rooms and seasonal items.</p>' }

// ---------------- kids-safe tab ----------------
$('money').innerHTML = [
  ['Paid app', 'One price, everything included.', 'Simplest to approve and to explain to parents. Lower reach.', 'Easiest'],
  ['Free + room packs', 'One location free, more to buy. The model Toca Boca World uses.', 'Best reach. Purchases behind a grown-up gate, no pressure timers.', 'Recommended'],
  ['Subscription', 'Monthly access to everything.', 'Steady income, but needs a steady stream of new content.', 'Later']
].map(function (m) { return '<div class="m' + (m[3] === 'Recommended' ? ' rec' : '') + '"><span class="tag">' + m[3] + '</span><h3>' + m[0] + '</h3><p>' + m[1] + '</p><small>' + m[2] + '</small></div>' }).join('');
$('risks').innerHTML = [
  ['IP approvals', 'Each art round waits on your sign-off. Agreeing a 48-hour turnaround keeps the schedule.'],
  ['Art throughput', 'Characters and rooms cost the most. A playable slice proves the style before full production.'],
  ['Older tablets', 'Many kids play on hand-me-down devices. I test on low-end Android tablets from the slice onward.'],
  ['Store review', 'Kids apps get extra scrutiny. Analytics and SDK choices are set at the start, not fixed at the end.']
].map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>' }).join('');
$('grow').innerHTML = [
  ['New rooms as content', 'Locations load as separate content, so a new room ships without rebuilding the game.'],
  ['Characters as data', 'Adding a character from your IP means art plus a data file, not new code.'],
  ['Seasonal items', 'Holiday decorations and surprises switch on by date, the way Explore Daniel’s Neighborhood changes with the seasons.'],
  ['More platforms later', 'Unity builds for Switch and desktop when the IP is ready for it.']
].map(function (r) { return '<div><b>' + r[0] + '</b><span>' + r[1] + '</span></div>' }).join('');

renderControls(); renderOut();
var h = (location.hash || '').slice(1); if (h && $(h)) document.querySelector('[data-tab="' + h + '"]') && document.querySelector('[data-tab="' + h + '"]').click();
})();
