// Playable kids sandbox. Rules it follows: no text for kids, no failing, every tap answers,
// progress through play (no timers), grown-up gate in front of settings and purchases.
(function () {
'use strict';
var NS = 'http://www.w3.org/2000/svg';
var svg = document.getElementById('stage');
function el(tag, attrs, parent, html) { var e = document.createElementNS(NS, tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e }
function pt(ev) { var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()) }
var $ = function (id) { return document.getElementById(id) };

// ---------------- sound (synthesized, no files) ----------------
var ac = null, soundOn = true;
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)() } catch (e) { ac = null } } if (ac && ac.state === 'suspended') ac.resume(); return ac }
function tone(freq, dur, type, vol, when) { var a = audio(); if (!a || !soundOn) return; var t = a.currentTime + (when || 0), o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02) }
var SFX = {
  pop: function () { tone(660, 0.12, 'sine', 0.2); tone(990, 0.1, 'sine', 0.12, 0.05) },
  click: function () { tone(520, 0.07, 'triangle', 0.15) },
  giggle: function () { [880, 1040, 920, 1170, 1000].forEach(function (f, i) { tone(f, 0.08, 'sine', 0.13, i * 0.07) }) },
  chomp: function () { [180, 150, 200].forEach(function (f, i) { tone(f, 0.09, 'square', 0.07, i * 0.12) }) },
  sparkle: function () { [1320, 1568, 1760, 2093].forEach(function (f, i) { tone(f, 0.18, 'sine', 0.08, i * 0.06) }) },
  unlock: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.28, 'triangle', 0.12, i * 0.11) }) },
  nope: function () { tone(330, 0.12, 'triangle', 0.12); tone(262, 0.16, 'triangle', 0.12, 0.1) },
  water: function () { tone(1400 + Math.random() * 400, 0.05, 'sine', 0.04) },
  grow: function () { tone(523, 0.12, 'sine', 0.13); tone(784, 0.16, 'sine', 0.12, 0.08) },
  melody: function () { var n = [523, 587, 659, 784, 880, 784, 659, 587, 523, 659, 784, 1047, 880, 784, 659, 523]; n.forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.11, i * 0.22); if (i % 4 === 0) tone(f / 2, 0.4, 'sine', 0.08, i * 0.22) }) }
};

// ---------------- defs ----------------
var defs = el('defs', {}, svg, `
  <radialGradient id="glow"><stop offset="0" stop-color="#FFF6C9" stop-opacity=".95"/><stop offset=".55" stop-color="#FFE38A" stop-opacity=".35"/><stop offset="1" stop-color="#FFE38A" stop-opacity="0"/></radialGradient>
  <pattern id="wallp" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="#FFF1D2"/><circle cx="17" cy="17" r="5" fill="#FFE3B0"/><circle cx="52" cy="52" r="5" fill="#FFD9E2"/></pattern>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ED8FF"/><stop offset="1" stop-color="#D9F3FF"/></linearGradient>
  <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD3FF"/><stop offset="1" stop-color="#DFF6FF"/></linearGradient>`);

// ---------------- kitchen ----------------
var kitchen = el('g', { id: 'kitchen' }, svg);
el('rect', { x: 0, y: 0, width: 1600, height: 650, fill: 'url(#wallp)' }, kitchen);
el('rect', { x: 0, y: 640, width: 1600, height: 260, fill: '#EDBD82' }, kitchen);
for (var i = 0; i < 6; i++) el('line', { x1: 0, y1: 690 + i * 42, x2: 1600, y2: 690 + i * 42, stroke: '#DCA56A', 'stroke-width': 3 }, kitchen);
el('rect', { x: 0, y: 628, width: 1600, height: 22, fill: '#F6D7A6' }, kitchen);

// garden door
var door = el('g', { class: 'hit', id: 'door' }, kitchen, `
  <path d="M70 640 V350 a85 85 0 0 1 170 0 V640z" fill="#73C9A6" stroke="#4FA884" stroke-width="8"/>
  <path d="M100 620 V360 a55 55 0 0 1 110 0 V620z" fill="none" stroke="#5DB894" stroke-width="6"/>
  <circle cx="212" cy="500" r="11" fill="#FFD166"/>
  <g id="doorLock"><circle cx="155" cy="455" r="44" fill="#FFFFFF" opacity=".92"/><rect x="133" y="452" width="44" height="34" rx="7" fill="#90A4AE"/><path d="M141 452 v-12 a14 14 0 0 1 28 0 v12" stroke="#90A4AE" stroke-width="7" fill="none"/></g>
  <g id="doorSpark" opacity="0"><circle cx="155" cy="300" r="10" fill="#FFD166"/><circle cx="95" cy="380" r="7" fill="#FFD166"/><circle cx="220" cy="390" r="8" fill="#FFD166"/></g>`);

// window
var win = el('g', { class: 'hit', id: 'window' }, kitchen, `
  <rect x="300" y="110" width="350" height="270" rx="24" fill="#FFFFFF"/>
  <rect id="skyRect" x="322" y="132" width="306" height="226" rx="14" fill="url(#sky)"/>
  <g id="sun"><circle cx="540" cy="210" r="44" fill="#FFD43B"/><g stroke="#FFD43B" stroke-width="9" stroke-linecap="round"><line x1="540" y1="146" x2="540" y2="132"/><line x1="604" y1="210" x2="618" y2="210"/><line x1="476" y1="210" x2="462" y2="210"/><line x1="585" y1="165" x2="595" y2="155"/><line x1="495" y1="165" x2="485" y2="155"/></g>
     <ellipse cx="420" cy="300" rx="62" ry="24" fill="#FFFFFF"/><ellipse cx="455" cy="285" rx="40" ry="24" fill="#FFFFFF"/></g>
  <g id="moon" opacity="0"><circle cx="530" cy="215" r="44" fill="#FFF3B0"/><circle cx="552" cy="200" r="40" fill="#2C3E7A" id="moonCut"/>
     <circle cx="380" cy="180" r="5" fill="#FFF"/><circle cx="430" cy="270" r="4" fill="#FFF"/><circle cx="600" cy="320" r="5" fill="#FFF"/><circle cx="360" cy="320" r="3" fill="#FFF"/></g>
  <line x1="475" y1="132" x2="475" y2="358" stroke="#FFFFFF" stroke-width="12"/><line x1="322" y1="245" x2="628" y2="245" stroke="#FFFFFF" stroke-width="12"/>
  <path d="M290 100 h70 q-10 140 30 300 h-100z" fill="#FF8FAB"/><path d="M660 100 h-70 q10 140 -30 300 h100z" fill="#FF8FAB"/>
  <rect x="280" y="90" width="390" height="18" rx="9" fill="#C77DFF"/>`);

// table, chairs, radio
el('g', {}, kitchen, `
  <rect x="905" y="520" width="370" height="30" rx="12" fill="#D18A52"/><rect x="935" y="548" width="22" height="100" rx="8" fill="#B87440"/><rect x="1222" y="548" width="22" height="100" rx="8" fill="#B87440"/>
  <g><rect x="790" y="420" width="22" height="230" rx="8" fill="#5FA8D3"/><rect x="790" y="565" width="110" height="24" rx="10" fill="#7CC0E8"/><rect x="878" y="585" width="18" height="65" rx="7" fill="#5FA8D3"/><rect x="794" y="585" width="18" height="65" rx="7" fill="#5FA8D3"/></g>
  <g><rect x="1395" y="420" width="22" height="230" rx="8" fill="#5FA8D3"/><rect x="1307" y="565" width="110" height="24" rx="10" fill="#7CC0E8"/><rect x="1310" y="585" width="18" height="65" rx="7" fill="#5FA8D3"/><rect x="1395" y="585" width="18" height="65" rx="7" fill="#5FA8D3"/></g>`);
var radio = el('g', { class: 'hit', id: 'radio' }, kitchen, `
  <line x1="1080" y1="438" x2="1120" y2="378" stroke="#546E7A" stroke-width="6" stroke-linecap="round"/><circle cx="1120" cy="376" r="8" fill="#FF6B6B"/>
  <rect x="1010" y="432" width="170" height="92" rx="22" fill="#FF6B6B"/><circle cx="1058" cy="478" r="28" fill="#FFE3E3"/><circle cx="1058" cy="478" r="12" fill="#FF9A9A"/>
  <rect x="1104" y="458" width="56" height="12" rx="6" fill="#FFE3E3"/><rect x="1104" y="482" width="40" height="12" rx="6" fill="#FFE3E3"/>`);

// lamp
var lamp = el('g', { class: 'hit', id: 'lamp' }, kitchen, `
  <ellipse cx="700" cy="640" rx="56" ry="14" fill="#7E57C2"/><rect x="692" y="330" width="16" height="310" rx="8" fill="#9575CD"/>
  <path d="M630 340 L770 340 L740 250 L660 250 Z" fill="#FFB4C6"/><rect x="630" y="334" width="140" height="14" rx="7" fill="#FF8FAB"/>`);

// fridge
var fridge = el('g', { class: 'hit', id: 'fridge' }, kitchen, `
  <rect x="1440" y="200" width="150" height="445" rx="20" fill="#D9F1F7" stroke="#A9D6E2" stroke-width="6"/>
  <g id="fridgeInside" opacity="0"><rect x="1452" y="212" width="126" height="420" rx="12" fill="#FFFFFF"/>
    <line x1="1452" y1="352" x2="1578" y2="352" stroke="#CFE8EF" stroke-width="6"/><line x1="1452" y1="492" x2="1578" y2="492" stroke="#CFE8EF" stroke-width="6"/></g>
  <g id="fridgeDoor"><rect x="1440" y="200" width="150" height="445" rx="20" fill="#E8F7FB" stroke="#A9D6E2" stroke-width="6"/>
    <line x1="1440" y1="330" x2="1590" y2="330" stroke="#A9D6E2" stroke-width="6"/><rect x="1458" y="240" width="12" height="60" rx="6" fill="#90A4AE"/><rect x="1458" y="360" width="12" height="100" rx="6" fill="#90A4AE"/>
    <circle cx="1545" cy="400" r="16" fill="#FFD166"/><rect x="1515" y="430" width="44" height="30" rx="6" fill="#FF8FAB"/></g>`);
var fridgeFood = el('g', { id: 'fridgeFood', opacity: 0 }, kitchen); fridgeFood.style.pointerEvents = 'none';

var floorItems = el('g', {}, kitchen);
var charLayer = el('g', {}, kitchen);
var night = el('rect', { x: 0, y: 0, width: 1600, height: 900, fill: '#1B2559', opacity: 0, 'pointer-events': 'none' }, kitchen);
var lampGlow = el('circle', { cx: 700, cy: 330, r: 330, fill: 'url(#glow)', opacity: 0, 'pointer-events': 'none' }, kitchen);
var fx = el('g', { 'pointer-events': 'none' }, svg);

// ---------------- garden ----------------
var garden = el('g', { id: 'garden', display: 'none' }, svg);
el('g', {}, garden, `
  <rect width="1600" height="900" fill="url(#gsky)"/><circle cx="1350" cy="140" r="70" fill="#FFD43B"/>
  <ellipse cx="300" cy="150" rx="90" ry="34" fill="#FFF"/><ellipse cx="350" cy="130" rx="60" ry="34" fill="#FFF"/><ellipse cx="900" cy="110" rx="80" ry="28" fill="#FFF"/>
  <path d="M0 520 Q300 380 650 500 T1600 470 V900 H0Z" fill="#A6E39A"/><path d="M0 590 Q400 520 800 590 T1600 580 V900 H0Z" fill="#8BD46E"/>
  <g fill="#FFFFFF" stroke="#E2D3B8" stroke-width="4">${Array.from({ length: 16 }, function (_, i) { return '<rect x="' + (20 + i * 100) + '" y="470" width="34" height="140" rx="10"/>' }).join('')}<rect x="0" y="510" width="1600" height="20"/><rect x="0" y="570" width="1600" height="20"/></g>`);
var homeBtn = el('g', { class: 'hit', id: 'homeBtn' }, garden, `<circle cx="120" cy="300" r="74" fill="#FFFFFF"/><path d="M78 305 L120 263 L162 305 V342 H78Z" fill="#FF8FAB"/><rect x="109" y="312" width="22" height="30" fill="#FFF"/>`);
var PATCHES = [{ x: 520, y: 730 }, { x: 820, y: 760 }, { x: 1120, y: 730 }].map(function (p) {
  var g = el('g', { class: 'hit' }, garden); el('ellipse', { cx: p.x, cy: p.y, rx: 130, ry: 48, fill: '#9B6B43' }, g); el('ellipse', { cx: p.x, cy: p.y - 6, rx: 112, ry: 34, fill: '#7E5434' }, g);
  var plant = el('g', {}, g); return Object.assign(p, { g: g, plant: plant, stage: 0, water: 0 }) });
var basket = el('g', {}, garden, `<path d="M1240 760 h180 l-22 100 h-136z" fill="#D9A066"/><path d="M1250 760 q80 -90 160 0" stroke="#B9824E" stroke-width="12" fill="none"/><g id="basketCarrots"></g>`);
var seedHome = { x: 230, y: 760 }, canHome = { x: 1420, y: 640 };
var seed = el('g', { class: 'hit drag' }, garden, `<g transform="translate(-55,-75)"><rect width="110" height="140" rx="14" fill="#FFD166"/><rect x="10" y="10" width="90" height="70" rx="10" fill="#FFF"/><path d="M55 70 v-28 M55 50 q-18 -16 -28 -6 M55 50 q18 -16 28 -6" stroke="#4CAF50" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="36" cy="108" r="6" fill="#8D6E63"/><circle cx="56" cy="114" r="6" fill="#8D6E63"/><circle cx="76" cy="106" r="6" fill="#8D6E63"/></g>`);
var can = el('g', { class: 'hit drag' }, garden, `<g id="canBody"><rect x="-70" y="-50" width="120" height="100" rx="24" fill="#4FC3F7"/><path d="M48 -30 L120 -78 L128 -66 L58 -8 Z" fill="#29B6F6"/><path d="M-70 -20 q-50 10 -40 50 q8 20 40 10" stroke="#29B6F6" stroke-width="14" fill="none"/></g>`);
var drops = el('g', { 'pointer-events': 'none' }, garden);
function place(g, x, y, rot) { g.setAttribute('transform', 'translate(' + x + ',' + y + ')' + (rot ? ' rotate(' + rot + ')' : '')) }
place(seed, seedHome.x, seedHome.y); place(can, canHome.x, canHome.y);

// ---------------- HUD (textless) ----------------
var hud = el('g', {}, svg);
var gear = el('g', { class: 'hit', id: 'gear' }, hud, `<circle cx="62" cy="62" r="38" fill="#FFFFFF" opacity=".85"/><g transform="translate(62,62)" fill="#90A4AE">${[0, 45, 90, 135].map(function (a) { return '<rect x="-6" y="-24" width="12" height="48" rx="4" transform="rotate(' + a + ')"/>' }).join('')}<circle r="15"/><circle r="7" fill="#FFF"/></g>`);
var book = el('g', { class: 'hit', id: 'book' }, hud, `<rect x="1452" y="24" width="120" height="86" rx="18" fill="#FFFFFF" opacity=".92"/><rect x="1474" y="36" width="76" height="40" rx="8" fill="#FF8FAB"/><path d="M1512 44 l6 12 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2z" fill="#FFF"/><g id="bookDots"></g>`);
function renderDots() { var g = $('bookDots'); g.innerHTML = STICKERS.map(function (s, i) { return '<circle cx="' + (1472 + i * 11.4) + '" cy="92" r="4.5" fill="' + (have[s.k] ? '#FFB703' : '#E0E0E0') + '"/>' }).join('') }

// ---------------- characters ----------------
var FRIENDS = [
  { id: 'pip', x: 470, y: 820, art: `
    <ellipse cx="-30" cy="-232" rx="19" ry="58" fill="#8FD3FF" transform="rotate(-8 -30 -232)"/><ellipse cx="30" cy="-232" rx="19" ry="58" fill="#8FD3FF" transform="rotate(8 30 -232)"/>
    <ellipse cx="-30" cy="-228" rx="9" ry="38" fill="#FFC2D4" transform="rotate(-8 -30 -228)"/><ellipse cx="30" cy="-228" rx="9" ry="38" fill="#FFC2D4" transform="rotate(8 30 -228)"/>
    <ellipse cx="-36" cy="-6" rx="30" ry="15" fill="#6CBDEB"/><ellipse cx="36" cy="-6" rx="30" ry="15" fill="#6CBDEB"/>
    <ellipse cx="0" cy="-104" rx="86" ry="102" fill="#8FD3FF"/><ellipse cx="0" cy="-72" rx="54" ry="58" fill="#DDF3FF"/>
    <ellipse cx="-82" cy="-96" rx="17" ry="32" fill="#8FD3FF" transform="rotate(18 -82 -96)"/><ellipse cx="82" cy="-96" rx="17" ry="32" fill="#8FD3FF" transform="rotate(-18 82 -96)"/>`, face: -140 },
  { id: 'momo', x: 1080, y: 840, art: `
    <circle cx="-62" cy="-188" r="28" fill="#FFB38A"/><circle cx="62" cy="-188" r="28" fill="#FFB38A"/><circle cx="-62" cy="-188" r="14" fill="#FF8F70"/><circle cx="62" cy="-188" r="14" fill="#FF8F70"/>
    <ellipse cx="-38" cy="-6" rx="32" ry="15" fill="#F29C70"/><ellipse cx="38" cy="-6" rx="32" ry="15" fill="#F29C70"/>
    <ellipse cx="0" cy="-102" rx="94" ry="98" fill="#FFB38A"/><ellipse cx="0" cy="-60" rx="56" ry="44" fill="#FFE2CF"/>
    <ellipse cx="-90" cy="-90" rx="18" ry="32" fill="#FFB38A" transform="rotate(18 -90 -90)"/><ellipse cx="90" cy="-90" rx="18" ry="32" fill="#FFB38A" transform="rotate(-18 90 -90)"/>
    <ellipse cx="0" cy="-112" rx="34" ry="24" fill="#FFE2CF"/><ellipse cx="0" cy="-120" rx="11" ry="8" fill="#5D4037"/>`, face: -138 }
];
FRIENDS.forEach(function (f) {
  f.g = el('g', { class: 'hit drag friend' }, charLayer);
  f.shadow = el('ellipse', { cx: 0, cy: 0, rx: 80, ry: 14, fill: 'rgba(0,0,0,.12)' }, f.g);
  f.body = el('g', {}, f.g, f.art);
  var y = f.face;
  f.eyesOpen = el('g', {}, f.body, '<circle cx="-30" cy="' + y + '" r="10" fill="#263238"/><circle cx="30" cy="' + y + '" r="10" fill="#263238"/><circle cx="-27" cy="' + (y - 4) + '" r="3.5" fill="#FFF"/><circle cx="33" cy="' + (y - 4) + '" r="3.5" fill="#FFF"/>');
  f.eyesHappy = el('g', { opacity: 0 }, f.body, '<path d="M-42 ' + y + ' q12 -14 24 0 M18 ' + y + ' q12 -14 24 0" stroke="#263238" stroke-width="6" fill="none" stroke-linecap="round"/>');
  el('g', {}, f.body, '<ellipse cx="-52" cy="' + (y + 22) + '" rx="13" ry="8" fill="#FF9EB5" opacity=".75"/><ellipse cx="52" cy="' + (y + 22) + '" rx="13" ry="8" fill="#FF9EB5" opacity=".75"/>');
  var my = f.id === 'momo' ? y + 44 : y + 26;
  f.mouthSmile = el('path', { d: 'M-14 ' + my + ' q14 14 28 0', stroke: '#263238', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, f.body);
  f.mouthOpen = el('ellipse', { cx: 0, cy: my + 6, rx: 16, ry: 14, fill: '#8E2C48', opacity: 0 }, f.body);
  f.squash = 0; f.eat = 0; f.happy = 0; f.sit = null; f.lift = 0;
});
function face(f, kind) { f.eyesOpen.setAttribute('opacity', kind === 'happy' ? 0 : 1); f.eyesHappy.setAttribute('opacity', kind === 'happy' ? 1 : 0);
  f.mouthOpen.setAttribute('opacity', kind === 'open' ? 1 : 0); f.mouthSmile.setAttribute('opacity', kind === 'open' ? 0 : 1) }
var SEATS = [{ x: 845, y: 600 }, { x: 1362, y: 600 }];

// ---------------- food ----------------
var FOOD = {
  apple: '<circle cx="0" cy="0" r="30" fill="#FF5A5F"/><rect x="-3" y="-42" width="6" height="16" rx="3" fill="#6D4C41"/><ellipse cx="13" cy="-34" rx="13" ry="7" fill="#66BB6A"/><ellipse cx="-11" cy="-9" rx="7" ry="10" fill="#FFF" opacity=".5"/>',
  cookie: '<circle r="30" fill="#E0A96D"/><circle cx="-10" cy="-8" r="5" fill="#6D4C41"/><circle cx="10" cy="6" r="5" fill="#6D4C41"/><circle cx="-4" cy="14" r="4" fill="#6D4C41"/><circle cx="12" cy="-12" r="4" fill="#6D4C41"/>',
  milk: '<path d="M-22 -16 L0 -40 L22 -16 V40 H-22Z" fill="#FFFFFF" stroke="#90CAF9" stroke-width="4"/><rect x="-22" y="0" width="44" height="22" fill="#90CAF9"/>',
  carrot: '<path d="M-14 -24 L14 -24 L0 40Z" fill="#FF9F1C"/><path d="M0 -24 q-16 -26 -6 -34 M0 -24 q0 -30 8 -36 M0 -24 q14 -24 20 -22" stroke="#43A047" stroke-width="7" fill="none" stroke-linecap="round"/>'
};
var SLOTS = [{ k: 'apple', x: 1484, y: 300 }, { k: 'cookie', x: 1548, y: 300 }, { k: 'milk', x: 1484, y: 438 }, { k: 'carrot', x: 1548, y: 438 }];
var carrots = 0;
function renderFridgeFood() { fridgeFood.innerHTML = SLOTS.map(function (s) {
  var hide = s.k === 'carrot' && carrots === 0; return hide ? '<g transform="translate(' + s.x + ',' + s.y + ')" opacity=".25"><g transform="scale(.9)">' + FOOD.carrot + '</g></g>' :
    '<g class="hit drag fslot" data-food="' + s.k + '" transform="translate(' + s.x + ',' + s.y + ')"><g transform="scale(.9)">' + FOOD[s.k] + '</g>' + (s.k === 'carrot' ? '<circle cx="24" cy="-30" r="16" fill="#FF6B6B"/><text x="24" y="-24" text-anchor="middle" font-size="18" font-weight="800" fill="#FFF" font-family="Baloo 2,sans-serif">' + carrots + '</text>' : '') + '</g>' }).join('') }

// ---------------- stickers / progress ----------------
var STICKERS = [{ k: 'sun', c: '#FFD43B' }, { k: 'lamp', c: '#FFB4C6' }, { k: 'fridge', c: '#81D4FA' }, { k: 'feed', c: '#FF6B6B' }, { k: 'giggle', c: '#FFB38A' }, { k: 'sit', c: '#7CC0E8' }, { k: 'music', c: '#C77DFF' }, { k: 'harvest', c: '#FF9F1C' }];
var have = {}, unlocked = false;
function award(k) { if (have[k]) return; have[k] = true; renderDots(); SFX.sparkle(); burstAt(1512, 66, '#FFB703', 10);
  bookPop = 1; var n = Object.keys(have).length; if (n >= 4 && !unlocked) unlockGarden(); hideHint() }
function unlockGarden() { unlocked = true; $('doorLock').setAttribute('opacity', 0); setTimeout(SFX.unlock, 350); doorGlow = 1; burstAt(155, 420, '#FFD166', 18) }
var bookPop = 0, doorGlow = 0;

// ---------------- particles ----------------
var parts = [];
function burstAt(x, y, color, n, kind) { for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5;
  var e = kind === 'heart' ? el('path', { d: 'M0 6 C-14 -6 -8 -18 0 -9 C8 -18 14 -6 0 6Z', fill: color }, fx) : kind === 'note' ? el('text', { 'font-size': 44, fill: color, 'font-family': 'Baloo 2,sans-serif' }, fx) : el('circle', { r: 5 + Math.random() * 5, fill: color }, fx);
  if (kind === 'note') e.textContent = Math.random() < 0.5 ? '♪' : '♫';
  parts.push({ e: e, x: x, y: y, vx: Math.cos(a) * sp, vy: kind ? -2 - Math.random() * 3 : Math.sin(a) * sp, life: 1, kind: kind }) } }

// ---------------- interactions ----------------
var night_ = false, lampOn = false, fridgeOpen = false, music = 0;
function toggleNight() { night_ = !night_; $('sun').setAttribute('opacity', night_ ? 0 : 1); $('moon').setAttribute('opacity', night_ ? 1 : 0); $('skyRect').setAttribute('fill', night_ ? '#2C3E7A' : 'url(#sky)'); SFX.click(); award('sun') }
function toggleLamp() { lampOn = !lampOn; SFX.click(); award('lamp') }
function toggleFridge() { fridgeOpen = !fridgeOpen; $('fridgeDoor').setAttribute('transform', fridgeOpen ? 'translate(1440,0) scale(.14,1) translate(-1440,0)' : ''); $('fridgeInside').setAttribute('opacity', fridgeOpen ? 1 : 0); fridgeFood.setAttribute('opacity', fridgeOpen ? 1 : 0); fridgeFood.style.pointerEvents = fridgeOpen ? 'auto' : 'none'; SFX.pop(); award('fridge') }
function playRadio() { if (music > 0) return; music = 3.6; SFX.melody(); award('music') }
function goGarden() { if (!unlocked) { SFX.nope(); doorShake = 1; return } kitchen.setAttribute('display', 'none'); garden.removeAttribute('display'); SFX.pop(); hideHint() }
function goHome() { garden.setAttribute('display', 'none'); kitchen.removeAttribute('display'); renderFridgeFood(); SFX.pop() }
var doorShake = 0;
win.addEventListener('click', function () { toggleNight() });
lamp.addEventListener('click', toggleLamp);
radio.addEventListener('click', playRadio);
fridge.addEventListener('click', function (e) { if (e.target.closest('.fslot')) return; toggleFridge() });
door.addEventListener('click', goGarden);
homeBtn.addEventListener('click', goHome);
gear.addEventListener('click', openGate);
book.addEventListener('click', openBook);

// ---------------- dragging (friends, food, seeds, can) ----------------
var drag = null;
svg.addEventListener('pointerdown', function (ev) { audio();
  var t = ev.target.closest('.drag'); if (!t) return; var p = pt(ev);
  if (t.classList.contains('friend')) { var f = FRIENDS.filter(function (x) { return x.g === t })[0]; drag = { kind: 'friend', f: f, ox: f.x - p.x, oy: f.y - p.y, sx: p.x, sy: p.y, t0: performance.now() }; f.sit = null; f.lift = 1 }
  else if (t.classList.contains('fslot')) { var k = t.getAttribute('data-food'); if (k === 'carrot' && carrots === 0) return; if (k === 'carrot') { carrots--; renderFridgeFood() }
    var g = el('g', { class: 'drag floorfood' }, fx, '<g transform="scale(1.1)">' + FOOD[k] + '</g>'); g.style.pointerEvents = 'none'; drag = { kind: 'food', g: g, food: k, x: p.x, y: p.y, ox: 0, oy: 0 }; SFX.click() }
  else if (t.classList.contains('floorfood')) { var item = floor.filter(function (x) { return x.g === t })[0]; if (!item) return; floor.splice(floor.indexOf(item), 1); fx.appendChild(t); t.style.pointerEvents = 'none'; drag = { kind: 'food', g: t, food: item.food, x: p.x, y: p.y, ox: 0, oy: 0 } }
  else if (t === seed) drag = { kind: 'seed', g: seed, ox: 0, oy: 0 }
  else if (t === can) drag = { kind: 'can', g: can, ox: 0, oy: 0 };
  if (drag) { svg.setPointerCapture(ev.pointerId); ev.preventDefault() } });
svg.addEventListener('pointermove', function (ev) { if (!drag) return; var p = pt(ev);
  if (drag.kind === 'friend') { drag.f.x = Math.max(90, Math.min(1510, p.x + drag.ox)); drag.f.y = Math.max(560, Math.min(880, p.y + drag.oy)) }
  else { drag.x = p.x; drag.y = p.y; place(drag.g, p.x, p.y, drag.kind === 'can' ? -18 : 0) } });
svg.addEventListener('pointerup', function (ev) { if (!drag) return; var d = drag; drag = null; var p = pt(ev);
  if (d.kind === 'friend') { var f = d.f; f.lift = 0; var moved = Math.hypot(p.x - d.sx, p.y - d.sy);
    if (moved < 12 && performance.now() - d.t0 < 400) { f.squash = 1; face(f, 'happy'); f.happy = 1.1; SFX.giggle(); award('giggle'); return }
    var seat = SEATS.filter(function (s) { return Math.hypot(s.x - f.x, s.y - f.y) < 120 && !FRIENDS.some(function (o) { return o !== f && o.sit === s }) })[0];
    if (seat) { f.sit = seat; f.x = seat.x; f.y = seat.y; SFX.pop(); award('sit') } else { f.y = Math.max(700, f.y); SFX.click() } }
  else if (d.kind === 'food') { var eater = FRIENDS.filter(function (f) { return Math.hypot(f.x - d.x, (f.y + f.face + 20) - d.y) < 120 })[0];
    if (eater) { fx.removeChild(d.g); eater.eat = 1.2; SFX.chomp(); setTimeout(function () { burstAt(eater.x, eater.y - 230, '#FF6B9D', 7, 'heart') }, 350); award('feed') }
    else { var fy = Math.max(700, Math.min(870, d.y)); floorItems.appendChild(d.g); d.g.style.pointerEvents = ''; place(d.g, d.x, fy); floor.push({ g: d.g, food: d.food }); SFX.click() } }
  else if (d.kind === 'seed') { var patch = nearPatch(d.x, d.y); if (patch && patch.stage === 0) { patch.stage = 1; drawPlant(patch); SFX.pop() } place(seed, seedHome.x, seedHome.y) }
  else if (d.kind === 'can') { place(can, canHome.x, canHome.y) } });
var floor = [];
function nearPatch(x, y) { return PATCHES.filter(function (p) { return Math.abs(p.x - x) < 140 && Math.abs(p.y - y) < 120 })[0] }
PATCHES.forEach(function (p) { p.g.addEventListener('click', function () { if (p.stage === 4) harvest(p); else if (p.stage === 0) { SFX.click(); p.wig = 1 } }) });
function drawPlant(p) { var x = p.x, y = p.y - 10, s = p.stage, h = '';
  if (s === 1) h = '<circle cx="' + (x - 30) + '" cy="' + y + '" r="8" fill="#5D4037"/><circle cx="' + x + '" cy="' + (y + 6) + '" r="8" fill="#5D4037"/><circle cx="' + (x + 30) + '" cy="' + y + '" r="8" fill="#5D4037"/>';
  if (s === 2) h = '<path d="M' + x + ' ' + y + ' v-40 M' + x + ' ' + (y - 30) + ' q-24 -18 -34 -4 M' + x + ' ' + (y - 30) + ' q24 -18 34 -4" stroke="#43A047" stroke-width="10" fill="none" stroke-linecap="round"/>';
  if (s === 3) h = '<path d="M' + x + ' ' + y + ' v-80 M' + x + ' ' + (y - 50) + ' q-40 -30 -58 -6 M' + x + ' ' + (y - 50) + ' q40 -30 58 -6 M' + x + ' ' + (y - 75) + ' q-20 -30 -30 -10 M' + x + ' ' + (y - 75) + ' q20 -30 30 -10" stroke="#43A047" stroke-width="11" fill="none" stroke-linecap="round"/>';
  if (s === 4) h = '<path d="M' + (x - 26) + ' ' + y + ' L' + (x + 26) + ' ' + y + ' L' + x + ' ' + (y + 30) + 'Z" fill="#FF9F1C"/><path d="M' + x + ' ' + y + ' v-90 M' + x + ' ' + (y - 50) + ' q-46 -34 -64 -6 M' + x + ' ' + (y - 50) + ' q46 -34 64 -6 M' + x + ' ' + (y - 80) + ' q-24 -34 -34 -10 M' + x + ' ' + (y - 80) + ' q24 -34 34 -10" stroke="#2E7D32" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="' + (x + 70) + '" cy="' + (y - 100) + '" r="9" fill="#FFD166"/><circle cx="' + (x - 76) + '" cy="' + (y - 70) + '" r="7" fill="#FFD166"/>';
  p.plant.innerHTML = h }
function harvest(p) { p.stage = 0; p.plant.innerHTML = ''; carrots++; SFX.grow(); burstAt(p.x, p.y - 40, '#FF9F1C', 10); award('harvest');
  $('basketCarrots').innerHTML = Array.from({ length: Math.min(carrots, 6) }, function (_, i) { return '<g transform="translate(' + (1275 + i * 24) + ',' + (752 - (i % 2) * 8) + ') rotate(' + (i * 9 - 20) + ') scale(.7)">' + FOOD.carrot + '</g>' }).join('') }

// ---------------- sticker book overlay ----------------
var bookLayer = null;
function stickerArt(k) { return { sun: '<circle r="34" fill="#FFD43B"/>', lamp: '<path d="M-34 10 L34 10 L22 -30 L-22 -30Z" fill="#FFB4C6"/><rect x="-5" y="10" width="10" height="34" fill="#9575CD"/>', fridge: '<rect x="-24" y="-38" width="48" height="76" rx="10" fill="#81D4FA"/>',
  feed: '<path d="M0 22 C-40 -6 -24 -40 0 -18 C24 -40 40 -6 0 22Z" fill="#FF6B6B"/>', giggle: '<circle r="34" fill="#FFB38A"/><path d="M-18 -6 q8 -10 16 0 M2 -6 q8 -10 16 0" stroke="#263238" stroke-width="5" fill="none"/><path d="M-14 10 q14 14 28 0" stroke="#263238" stroke-width="5" fill="none"/>',
  sit: '<rect x="-30" y="-6" width="60" height="14" rx="6" fill="#7CC0E8"/><rect x="18" y="-40" width="12" height="80" rx="5" fill="#5FA8D3"/><rect x="-28" y="8" width="10" height="32" rx="4" fill="#5FA8D3"/>', music: '<text y="22" text-anchor="middle" font-size="70" fill="#C77DFF" font-family="Baloo 2,sans-serif">♫</text>', harvest: FOOD.carrot }[k] }
function openBook() { SFX.pop(); if (bookLayer) return; bookLayer = el('g', { class: 'hit' }, svg);
  el('rect', { width: 1600, height: 900, fill: 'rgba(38,50,56,.45)' }, bookLayer); el('rect', { x: 340, y: 170, width: 920, height: 560, rx: 40, fill: '#FFF8E7', stroke: '#FFB703', 'stroke-width': 10 }, bookLayer);
  el('line', { x1: 800, y1: 190, x2: 800, y2: 710, stroke: '#FFE1A8', 'stroke-width': 6 }, bookLayer);
  STICKERS.forEach(function (s, i) { var x = 470 + (i % 4) * 220 + (i % 4 > 1 ? 30 : 0), y = 330 + Math.floor(i / 4) * 240;
    var g = el('g', { transform: 'translate(' + x + ',' + y + ')' }, bookLayer); el('circle', { r: 78, fill: have[s.k] ? '#FFFFFF' : '#F1E9D8', stroke: have[s.k] ? s.c : '#E0D6C2', 'stroke-width': 8, 'stroke-dasharray': have[s.k] ? '' : '14 10' }, g);
    var a = el('g', { opacity: have[s.k] ? 1 : 0.18 }, g, stickerArt(s.k)); if (!have[s.k]) a.setAttribute('filter', 'grayscale(1)') });
  bookLayer.addEventListener('click', function () { svg.removeChild(bookLayer); bookLayer = null; SFX.click() }) }

// ---------------- grown-up gate ----------------
var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen'];
function openGate() { SFX.click(); var a = 3 + Math.floor(Math.random() * 6), b = 2 + Math.floor(Math.random() * 7), ans = a + b;
  var opts = [ans, ans + 1, ans - 1, ans + 2].sort(function () { return Math.random() - 0.5 });
  var gEl = $('gate'); gEl.hidden = false;
  gEl.innerHTML = '<div class="gbox"><h3>For grown-ups</h3><p>What is <b>' + WORDS[a] + ' plus ' + WORDS[b] + '</b>?</p><div class="gopts">' + opts.map(function (o) { return '<button data-a="' + o + '">' + o + '</button>' }).join('') + '</div><button class="gclose" data-close>Back to play</button></div>';
  gEl.onclick = function (e) { var b2 = e.target.closest('button'); if (!b2) return; if (b2.hasAttribute('data-close')) { gEl.hidden = true; return }
    if (+b2.dataset.a === ans) grownUps(); else { gEl.innerHTML = '<div class="gbox"><h3>Ask a grown-up</h3><p>That one is for grown-ups.</p><button class="gclose" data-close>Back to play</button></div>' } } }
function grownUps() { var gEl = $('gate');
  gEl.innerHTML = '<div class="gbox wide"><h3>Grown-ups</h3><div class="gset"><button data-act="sound">' + (soundOn ? '🔊 Sound on' : '🔈 Sound off') + '</button><button data-act="unlock"' + (unlocked ? ' disabled' : '') + '>🌱 Unlock the garden now<br><small>demo purchase, no payment</small></button><button data-act="reset">↺ Reset play</button></div><p class="gnote">Purchases, outside links, and settings sit behind this gate. Apple requires a parental gate for apps in the Kids Category.</p><button class="gclose" data-close>Back to play</button></div>';
  gEl.onclick = function (e) { var b2 = e.target.closest('button'); if (!b2) return; if (b2.hasAttribute('data-close')) { gEl.hidden = true; return }
    var act = b2.dataset.act; if (act === 'sound') { soundOn = !soundOn; grownUps() } if (act === 'unlock' && !unlocked) { unlockGarden(); grownUps() } if (act === 'reset') { location.hash = 'play'; location.reload() } } }

// ---------------- design notes ----------------
var NOTES = [
  { x: 30, y: 18, t: 'Every tap answers. No wrong moves, no game over.' },
  { x: 86, y: 22, t: 'Discoveries earn stickers. Progress through play, not timers.' },
  { x: 4.5, y: 16, t: 'Grown-up gate before settings and purchases.' },
  { x: 33, y: 64, t: 'Big targets: each friend is several fingertips wide.' },
  { x: 10, y: 46, t: 'New rooms open through play. Later: room packs behind the gate.' },
  { x: 60, y: 46, t: 'No reading needed. Pictures and sound do the talking.' }];
$('notes').innerHTML = NOTES.map(function (n) { return '<div class="note" style="left:' + n.x + '%;top:' + n.y + '%">' + n.t + '</div>' }).join('');
$('noteslist').innerHTML = NOTES.map(function (n) { return '<li>' + n.t + '</li>' }).join('');
$('notesBtn').addEventListener('click', function () { var on = this.getAttribute('aria-pressed') !== 'true', narrow = window.matchMedia('(max-width: 700px)').matches;
  this.setAttribute('aria-pressed', on); this.textContent = on ? 'Hide design notes' : 'Show design notes'; $('notes').hidden = !on || narrow; $('noteslist').hidden = !on || !narrow });
$('resetBtn').addEventListener('click', function () { location.hash = 'play'; location.reload() });
function hideHint() { $('hint').classList.add('gone') }
svg.addEventListener('pointerdown', function () { setTimeout(hideHint, 1500) }, { once: true });

// ---------------- animation loop ----------------
var last = 0, clock = 0, waterAcc = 0;
function frame(t) { requestAnimationFrame(frame); var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t; clock += dt;
  if (music > 0) { music -= dt; if (Math.random() < dt * 5) burstAt(1060 + Math.random() * 60, 420, ['#C77DFF', '#FF6B9D', '#4FC3F7'][Math.floor(Math.random() * 3)], 1, 'note') }
  FRIENDS.forEach(function (f, i) {
    f.squash = Math.max(0, f.squash - dt * 1.8); f.happy = Math.max(0, f.happy - dt);
    if (f.eat > 0) { f.eat -= dt; face(f, Math.floor(f.eat * 8) % 2 ? 'open' : 'happy'); if (f.eat <= 0) face(f, 'smile') }
    else if (f.happy <= 0) face(f, Math.sin(clock * 1.3 + i * 2) > 0.985 ? 'happy' : 'smile');
    var sq = f.squash * Math.sin(clock * 22) * 0.12, bob = music > 0 ? -Math.abs(Math.sin(clock * 7 + i)) * 22 : Math.sin(clock * 2 + i) * 3, lift = f.lift ? -26 : 0;
    var sitSq = f.sit ? 0.06 : 0;
    f.body.setAttribute('transform', 'translate(0,' + (bob + lift) + ') scale(' + (1 + sq + sitSq) + ',' + (1 - sq - sitSq) + ')');
    f.shadow.setAttribute('opacity', f.sit ? 0 : 1); f.shadow.setAttribute('rx', f.lift ? 60 : 80);
    f.g.setAttribute('transform', 'translate(' + f.x + ',' + f.y + ')');
  });
  var sorted = FRIENDS.slice().sort(function (a, b) { return a.y - b.y }); sorted.forEach(function (f) { charLayer.appendChild(f.g) });
  night.setAttribute('opacity', night_ ? 0.42 : 0); lampGlow.setAttribute('opacity', lampOn ? (night_ ? 0.95 : 0.55) : 0);
  if (bookPop > 0) { bookPop = Math.max(0, bookPop - dt * 3); book.setAttribute('transform', 'translate(1512,66) scale(' + (1 + bookPop * 0.25) + ') translate(-1512,-66)') }
  if (doorShake > 0) { doorShake = Math.max(0, doorShake - dt * 3); door.setAttribute('transform', 'translate(' + Math.sin(clock * 50) * 8 * doorShake + ',0)') }
  if (unlocked) $('doorSpark').setAttribute('opacity', 0.5 + Math.sin(clock * 5) * 0.5);
  // watering: hold the can over a growing patch
  if (drag && drag.kind === 'can') { var p = nearPatch(drag.x, drag.y + 120); if (p && p.stage >= 1 && p.stage < 4) { waterAcc += dt; if (Math.random() < 0.6) { var dd = el('ellipse', { rx: 4, ry: 7, fill: '#4FC3F7' }, drops); parts.push({ e: dd, x: drag.x + 110, y: drag.y - 60, vx: (Math.random() - 0.5) * 2, vy: 6, life: 0.6, kind: 'drop' }); if (Math.random() < 0.3) SFX.water() }
      if (waterAcc > 0.8) { waterAcc = 0; p.stage++; drawPlant(p); SFX.grow(); burstAt(p.x, p.y - 40, '#8BD46E', 6) } } else waterAcc = 0 }
  PATCHES.forEach(function (p) { if (p.wig) { p.wig = Math.max(0, p.wig - dt * 3); p.g.setAttribute('transform', 'translate(' + Math.sin(clock * 40) * 5 * p.wig + ',0)') } });
  parts = parts.filter(function (q) { q.life -= dt * (q.kind === 'note' ? 0.6 : q.kind === 'heart' ? 0.8 : 1.4); if (q.life <= 0) { q.e.remove(); return false }
    q.x += q.vx; q.y += q.vy; if (!q.kind) q.vy += 0.25; if (q.kind === 'drop') q.vy += 0.6;
    q.e.setAttribute('transform', 'translate(' + q.x + ',' + q.y + ')'); q.e.setAttribute('opacity', Math.min(1, q.life * 1.5)); return true });
}
renderFridgeFood(); renderDots(); requestAnimationFrame(frame);
window.SANDBOX = { have: have, state: function () { return { stickers: Object.keys(have), unlocked: unlocked, carrots: carrots, patches: PATCHES.map(function (p) { return p.stage }) } } };
})();
