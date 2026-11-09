/* SOMDEJ License — app.js : แกนกลาง (เรียกหลังบ้าน · เข้าสู่ระบบด้วยบัญชี HR Connect · โครงหน้า · เส้นทาง · UI กลาง)
 * เลขรุ่นต้องตรงกับ Config.gs และ version.json */
var SL_BUILD = '2569-11-09.1';
var SL_API_BUILD = '2569-11-09.1';

var S = { token: null, boot: null, me: null, route: '', brand: null, reg: null };
var ST_TH = { VALID: 'ปกติ', SOON: 'ใกล้หมดอายุ', EXPIRED: 'หมดอายุแล้ว', LIFETIME: 'ตลอดชีพ', NOEXP: 'ไม่มีวันหมดอายุ', NODATA: 'ยังไม่มีข้อมูล' };
var ST_IC = { VALID: 'check', SOON: 'clock', EXPIRED: 'alert', LIFETIME: 'infinity', NOEXP: 'check', NODATA: 'help' };
var FL_TH = { NONE: 'ยังไม่ดำเนินการ', BASE: 'ขอสำเนาตั้งต้นแล้ว', N1: 'แจ้งครั้งที่ 1', R1: 'เตือนซ้ำแล้ว', N2: 'แจ้งครั้งที่ 2', REVIEW: 'รอตรวจสอบ', REJECTED: 'ส่งกลับแก้ไข', DONE: 'ต่ออายุแล้ว' };
var SUB_TH = { PENDING: 'รอตรวจสอบ', APPROVED: 'อนุมัติ', REJECTED: 'ส่งกลับแก้ไข' };
var CH_TH = { WEB: 'อัปโหลดทางเว็บ', EMAIL: 'ตอบกลับอีเมล', ADMIN: 'ผู้ดูแลแนบให้' };
var PS_TH = { ACTIVE: 'ปฏิบัติงาน', NOTFOUND: 'ไม่พบใน SmartAPI', LEFT: 'พ้นสภาพ' };
var MODE_TH = { REQUIRED: 'ต้องมี', IF_HAS: 'เฉพาะผู้ที่มีเลขที่', NONE: 'ไม่ต้องมี' };
var ST_COLOR = { VALID: 'var(--ok)', SOON: 'var(--soon)', EXPIRED: 'var(--exp)', LIFETIME: 'var(--life)', NOEXP: 'var(--life)', NODATA: 'var(--nodata)' };

/* =================================================================== ตัวช่วย */
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function nf(n) { return (+n || 0).toLocaleString('th-TH'); }
var TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
var TH_MONF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
function thDate(iso, time) {
  var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return '-';
  var s = (+m[3]) + ' ' + TH_MON[+m[2] - 1] + ' ' + (+m[1] + 543);
  return time && m[4] ? s + ' ' + m[4] + ':' + m[5] + ' น.' : s;
}
function thDateFull(iso) { var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? (+m[3]) + ' ' + TH_MONF[+m[2] - 1] + ' ' + (+m[1] + 543) : '-'; }
function today() { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
function nowStamp() { var d = new Date(), z = function (n) { return ('0' + n).slice(-2); }; return (d.getFullYear() + 543) + z(d.getMonth() + 1) + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()); }
function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
/** วันที่จากช่องกรอก: รับ yyyy-mm-dd (input date) หรือ วว/ดด/ปปปป พ.ศ. → yyyy-mm-dd ค.ศ. */
function toYmd(v) {
  var s = String(v || '').trim(); if (!s) return '';
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/), y, mo, d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; } else { m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/); if (!m) return ''; d = +m[1]; mo = +m[2]; y = +m[3]; }
  if (y > 2400) y -= 543;
  var dt = new Date(Date.UTC(y, mo - 1, d)); if (dt.getUTCMonth() !== mo - 1) return '';
  return y + '-' + ('0' + mo).slice(-2) + '-' + ('0' + d).slice(-2);
}
function hasRole(r) { return S.me && S.me.roles.indexOf(r) >= 0; }
function isSuper() { return hasRole('SUPER'); }
function isAdmin() { return hasRole('SUPER') || hasRole('ADMIN'); }
function isHead() { return hasRole('HEAD'); }
function profName(id) { var p = (S.boot && S.boot.professions || []).filter(function (x) { return x.id === id; })[0]; return p ? p.name : (id || '-'); }
function prof(id) { return (S.boot && S.boot.professions || []).filter(function (x) { return x.id === id; })[0] || null; }
function docType(id) { return (S.boot && S.boot.docTypes || []).filter(function (x) { return x.id === id; })[0] || { id: id, name: id }; }
var AV_COL = ['#0F766E', '#0B3B37', '#B45309', '#1d5fa8', '#6d3fc7', '#0e7490', '#9d174d', '#4d7c0f'];
function avatar(name, size) {
  var n = String(name || '?').replace(/^(นาย|นางสาว|นาง|น\.ส\.|ว่าที่ร้อยตรี(หญิง)?|ดร\.|รศ\.|ผศ\.|ศ\.|นพ\.|พญ\.|ทพ\.|ทพญ\.|ภก\.|ภญ\.|พว\.|พ\.ต\.)+\s*/, '').trim();
  var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return '<div class="av" style="background:' + AV_COL[h % AV_COL.length] + (size ? ';width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size / 2.4) + 'px' : '') + '">' + esc(n.charAt(0) || '?') + '</div>';
}
function daysText(days) { return days == null ? '' : days < 0 ? 'เลยมา ' + nf(-days) + ' วัน' : 'อีก ' + nf(days) + ' วัน'; }

/* =================================================================== ไอคอน */
var ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  badge: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.6-1.8 2-2.8 3.5-2.8s2.9 1 3.5 2.8M15 9h3M15 13h3"/>',
  cert: '<circle cx="12" cy="9" r="6"/><path d="m8.5 13.5-1.5 7.5 5-3 5 3-1.5-7.5"/><path d="m9.8 9 1.5 1.5 3-3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.2 4.4 2 5 5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 6 9 7 9-7"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>', plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  infinity: '<path d="M7 9a3 3 0 1 0 0 6c2.5 0 7.5-6 10-6a3 3 0 1 1 0 6c-2.5 0-7.5-6-10-6Z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M15 8l2 2"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  sl: '<rect x="3.5" y="3" width="17" height="18" rx="2.5"/><path d="M8 8h8M8 12h5"/><circle cx="15.5" cy="16" r="2.4"/><path d="m14 18-1 3 2.5-1 2.5 1-1-3"/>'
};
function ic(name, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'; }
function stChip(st, days) { return '<span class="chip ' + st + '">' + ic(ST_IC[st] || 'info') + ST_TH[st] + (days != null && (st === 'SOON' || st === 'EXPIRED') ? ' · ' + daysText(days) : '') + '</span>'; }
function flChip(fl) { return '<span class="chip ' + (fl || 'NONE') + '">' + esc(FL_TH[fl || 'NONE']) + '</span>'; }

/* =================================================================== เครือข่าย */
var NET = { active: 0, queue: [], MAX: 4 };
function netSlot() { return new Promise(function (res) { if (NET.active < NET.MAX) { NET.active++; res(); } else NET.queue.push(res); }); }
function netDone() { var n = NET.queue.shift(); if (n) n(); else NET.active = Math.max(0, NET.active - 1); }
function isRead(a) { return /^(get|list|bootstrap|branding|ping|my|team|mailPreview|export)/.test(a); }
function fetchOnce(action, payload) {
  if (window.SL_MOCK) return window.SL_MOCK(action, S.token, payload || {});
  if (!window.API_URL || /ใส่ลิงก์/.test(window.API_URL)) return Promise.reject(new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ config.js'));
  return fetch(window.API_URL, { method: 'POST', redirect: 'follow', credentials: 'omit', cache: 'no-store', body: JSON.stringify({ action: action, token: S.token, payload: payload || {} }) })
    .then(function (r) { return r.text(); })
    .then(function (t) { if (String(t).trim().charAt(0) === '<') { var e = new Error('เซิร์ฟเวอร์ Google ไม่ว่างชั่วคราว กรุณาลองใหม่'); e.busy = true; throw e; } return JSON.parse(t); },
      function () { var e = new Error('เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต'); e.net = true; throw e; });
}
function api(action, payload) {
  var waits = [700, 1600, 3200], tries = 0, read = isRead(action);
  var attempt = function () {
    return netSlot().then(function () { return fetchOnce(action, payload); }).then(function (x) { netDone(); return x; }, function (e) {
      netDone(); if (read && tries < waits.length && (e.busy || e.net)) { var w = waits[tries++]; return new Promise(function (r) { setTimeout(r, w); }).then(attempt); } throw e;
    });
  };
  return attempt().then(function (res) {
    if (!res.ok) { if (res.error === 'SESSION_EXPIRED') { logout(true); throw new Error('หมดเวลาการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่'); } throw new Error(res.error || 'เกิดข้อผิดพลาด'); }
    return res.data;
  });
}

/* =================================================================== UI กลาง */
function toast(msg, type, ms) {
  var box = $('#toasts'), el = document.createElement('div');
  el.className = 'toast ' + (type || ''); el.innerHTML = ic(type === 'err' ? 'alert' : type === 'ok' ? 'check' : 'info') + '<div>' + esc(msg) + '</div>';
  box.appendChild(el);
  setTimeout(function () { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 320); }, ms || (type === 'err' ? 6000 : 3200));
}
function errToast(e) { toast(e && e.message ? e.message : String(e), 'err'); }
function modal(opts) {
  var bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog"><div class="mh"><h3>' + (opts.title || '') + '</h3><button class="btn ghost icon sm" data-x aria-label="ปิด">' + ic('x') + '</button></div><div class="mb">' + (opts.body || '') + '</div>' + (opts.buttons && opts.buttons.length ? '<div class="mf"></div>' : '') + '</div>';
  document.body.appendChild(bg);
  var close = function () { bg.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); };
  var onKey = function (e) { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('[data-x]', bg).onclick = close;
  bg.addEventListener('mousedown', function (e) { if (e.target === bg && !opts.sticky) close(); });
  var mf = $('.mf', bg);
  (opts.buttons || []).forEach(function (b) {
    var btn = document.createElement('button'); btn.className = 'btn ' + (b.cls || ''); btn.innerHTML = b.label; if (b.id) btn.id = b.id;
    btn.onclick = function () {
      var r = b.onClick ? b.onClick(close, bg, btn) : null;
      if (r && r.then) { busy(btn, true); r.then(function (v) { busy(btn, false); if (v !== false) close(); }, function (e) { busy(btn, false); errToast(e); }); }
      else if (r !== false) close();
    };
    mf.appendChild(btn);
  });
  if (opts.onOpen) opts.onOpen(bg, close);
  return { el: bg, close: close };
}
function confirmBox(title, body, okLabel, cls) {
  return new Promise(function (res) { var done = false; modal({ title: title, body: '<div>' + body + '</div>', buttons: [{ label: 'ยกเลิก' }, { label: okLabel || 'ยืนยัน', cls: cls || 'primary', onClick: function () { done = true; res(true); } }], onClose: function () { if (!done) res(false); } }); });
}
function promptBox(title, label, opts) {
  opts = opts || {};
  return new Promise(function (res) {
    var done = false;
    modal({ title: title, body: (opts.html || '') + '<label class="f">' + label + '</label><textarea class="inp" id="pb-in" placeholder="' + esc(opts.placeholder || '') + '">' + esc(opts.value || '') + '</textarea>',
      buttons: [{ label: 'ยกเลิก' }, { label: opts.ok || 'ยืนยัน', cls: opts.cls || 'primary', onClick: function () { var v = $('#pb-in').value.trim(); if (opts.required !== false && !v) { toast('กรุณากรอก' + label, 'warn'); return false; } done = true; res(v); } }],
      onClose: function () { if (!done) res(null); } });
  });
}
function drawer(html, onOpen) {
  closeDrawer();
  var bg = document.createElement('div'); bg.className = 'drawer-bg'; bg.id = 'drawer-bg';
  var d = document.createElement('aside'); d.className = 'drawer'; d.id = 'drawer'; d.innerHTML = html;
  document.body.appendChild(bg); document.body.appendChild(d);
  bg.onclick = closeDrawer;
  if (onOpen) onOpen(d);
  return d;
}
function closeDrawer() { var a = $('#drawer'), b = $('#drawer-bg'); if (a) a.remove(); if (b) b.remove(); }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('.modal-bg')) closeDrawer(); });
function loadingHtml(t) { return '<div class="loading"><span class="spin"></span>' + esc(t || 'กำลังโหลด…') + '</div>'; }
function emptyHtml(t, icon) { return '<div class="empty">' + ic(icon || 'info') + '<div>' + esc(t) + '</div></div>'; }
function busy(btn, on, label) { if (!btn) return; if (on) { btn._h = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin" style="width:16px;height:16px;border-width:2px"></span>' + (label ? ' ' + label : ''); } else { btn.disabled = false; if (btn._h) btn.innerHTML = btn._h; } }
/** ตัวเลขนับขึ้น */
function countUp(root) {
  $$('[data-n]', root).forEach(function (el) {
    var t = +el.dataset.n, t0 = performance.now(), dur = 900;
    (function f(now) { var p = Math.min((now - t0) / dur, 1); el.textContent = nf(Math.round(t * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(f); })(t0);
  });
}
/** พลุฉลองเมื่ออนุมัติ */
function confetti() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var cv = document.createElement('canvas'); cv.id = 'cf'; document.body.appendChild(cv);
  var ctx = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
  var cols = ['#0F766E', '#0B3B37', '#5eead4', '#B45309', '#15803D'], ps = [];
  for (var i = 0; i < 140; i++) ps.push({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .55, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 4, s: Math.random() * 8 + 4, c: cols[i % 5], r: Math.random() * 6, vr: (Math.random() - .5) * .4 });
  var f = 0; (function step() { ctx.clearRect(0, 0, cv.width, cv.height); ps.forEach(function (p) { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); }); if (++f < 120) requestAnimationFrame(step); else cv.remove(); })();
}
/** อ่านไฟล์ → {name, mime, b64} · รูปใหญ่ย่อเหลือด้านยาว 2000px (JPEG) เพื่อส่งเร็ว */
function readFile(file) {
  return new Promise(function (res, rej) {
    if (!file) return rej(new Error('กรุณาเลือกไฟล์'));
    var mime = (file.type || '').toLowerCase();
    if (!/^(application\/pdf|image\/(jpeg|png|heic|heif|webp))$/.test(mime)) return rej(new Error('รับเฉพาะไฟล์ PDF หรือรูปภาพ (JPG/PNG)'));
    var max = (S.boot && S.boot.settings.fileMax) || 8388608;
    var fr = new FileReader();
    fr.onload = function () {
      var url = fr.result;
      if (/^image\/(jpeg|png|webp)$/.test(mime) && file.size > 900000) {
        var img = new Image();
        img.onload = function () {
          var k = Math.min(1, 2000 / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          var out = c.toDataURL('image/jpeg', .85);
          res({ name: file.name.replace(/\.\w+$/, '') + '.jpg', mime: 'image/jpeg', b64: out.split(',')[1], size: Math.round(out.length * .75) });
        };
        img.onerror = function () { rej(new Error('อ่านรูปไม่ได้')); }; img.src = url; return;
      }
      if (file.size > max) return rej(new Error('ไฟล์ใหญ่เกิน ' + Math.round(max / 1048576) + ' MB'));
      res({ name: file.name, mime: mime, b64: String(url).split(',')[1], size: file.size });
    };
    fr.onerror = function () { rej(new Error('อ่านไฟล์ไม่ได้')); };
    fr.readAsDataURL(file);
  });
}
/** แสดงไฟล์จาก base64 ในกรอบ */
function showFileIn(el, f) {
  var bin = atob(f.b64), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  var url = URL.createObjectURL(new Blob([arr], { type: f.mime }));
  el.innerHTML = /^image\//.test(f.mime) ? '<img src="' + url + '" alt="สำเนาเอกสาร">' : '<iframe src="' + url + '" title="สำเนาเอกสาร"></iframe>';
  return url;
}
function openFile(q) {
  var m = modal({ title: 'สำเนาเอกสาร', wide: true, body: '<div class="preview" id="fv">' + loadingHtml('กำลังเปิดไฟล์…') + '</div><div class="row mt12" id="fv-a"></div>' });
  api('getFile', q).then(function (f) {
    var url = showFileIn($('#fv', m.el), f);
    $('#fv-a', m.el).innerHTML = '<a class="btn sm" href="' + url + '" download="' + esc(f.name) + '">' + ic('download') + ' ดาวน์โหลด</a><a class="btn sm" href="' + url + '" target="_blank" rel="noopener">' + ic('eye') + ' เปิดแท็บใหม่</a>';
  }).catch(function (e) { $('#fv', m.el).innerHTML = emptyHtml(e.message, 'alert'); });
}

/* =================================================================== ธีมสว่าง/มืด */
function applyTheme(t) { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; try { localStorage.setItem('sl_theme', t || ''); } catch (e) { } }
function isDark() { var t = document.documentElement.dataset.theme; return t ? t === 'dark' : (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
function toggleTheme() { applyTheme(isDark() ? 'light' : 'dark'); $$('.th-btn').forEach(function (b) { b.innerHTML = ic(isDark() ? 'sun' : 'moon'); }); }
(function () { try { var t = localStorage.getItem('sl_theme'); if (t) applyTheme(t); } catch (e) { } })();

/* =================================================================== เข้าสู่ระบบ (บัญชี HR Connect) */
function saveSession() { try { localStorage.setItem('sl_token', S.token || ''); } catch (e) { } }
function logout(silent) {
  if (!silent && S.token) api('logout').catch(function () { });
  S.token = null; S.boot = null; S.me = null; S.reg = null;
  try { localStorage.removeItem('sl_token'); } catch (e) { }
  closeDrawer();
  renderLogin(silent ? 'expired' : '');
}
function afterLogin(d) {
  S.token = d.token; saveSession(); applyBoot(d.boot);
  if (!location.hash || location.hash.length < 3) location.hash = '#/' + homeRoute();
  route();
}
function applyBoot(b) { S.boot = b; S.me = b.me; }
function homeRoute() { return isAdmin() ? 'dash' : 'me'; }
function trySso(onFail) {
  var h = null; try { h = localStorage.getItem('hrc_token'); } catch (e) { }
  if (!h) return onFail();
  $('#app').innerHTML = '<div class="boot"><div class="lg"><span class="spin"></span><span>กำลังเข้าต่อจาก HR Connect…</span></div></div>';
  S.token = null;
  api('ssoLogin', { hrc: h }).then(afterLogin).catch(function (e) { onFail(e.message); });
}
function renderLogin(mode, msg) {
  var b = S.brand || {}, hrc = b.hrcUrl || 'https://hr-somdej.github.io/hr-connect/';
  $('#app').innerHTML = '<div class="login"><div class="art"><div class="org"><img src="logo.jpg" alt=""><div>' + esc(b.deptName || 'ฝ่ายทรัพยากรบุคคล') + '<br>' + esc(b.orgName || 'โรงพยาบาลสมเด็จพระบรมราชเทวี ณ ศรีราชา') + '</div></div>' +
    '<div><div class="row"><div class="brand" style="padding:0"><div class="logo">' + ic('sl') + '</div></div><span class="chip" style="background:rgba(255,255,255,.14);color:#fff">SOMDEJ License</span></div>' +
    '<h1>ใบประกอบวิชาชีพ<br><em>ไม่หมดอายุโดยไม่รู้ตัว</em></h1><p>ติดตามใบอนุญาตประกอบวิชาชีพและใบรับรองของบุคลากรทุกระดับ แจ้งเตือนล่วงหน้าทางอีเมล ส่งสำเนาฉบับใหม่ได้ทันที และ HR ตรวจสอบก่อนบันทึกทุกครั้ง</p></div>' +
    '<div class="feats"><div>' + ic('mail') + '<b>แจ้งเตือนล่วงหน้า</b>180 และ 90 วันก่อนหมดอายุ</div><div>' + ic('upload') + '<b>ส่งสำเนาง่าย</b>ตอบกลับอีเมล หรืออัปโหลด</div><div>' + ic('shield') + '<b>ตรวจก่อนอนุมัติ</b>ทะเบียนถูกต้องเป็นมาตรฐาน</div></div></div>' +
    '<div class="form"><div class="box"><h2>เข้าสู่ระบบ</h2><p class="muted">ใช้บัญชีเดียวกับ SOMDEJ HR Connect</p>' +
    (mode === 'expired' ? '<div class="note warn mt12">' + ic('info') + '<div>หมดเวลาการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่</div></div>' : '') +
    (msg ? '<div class="note warn mt12">' + ic('info') + '<div>' + esc(msg) + '</div></div>' : '') +
    (b.announcement ? '<div class="note info mt12">' + ic('info') + '<div>' + esc(b.announcement) + '</div></div>' : '') +
    '<div class="card mt16"><a class="btn green block lg" href="' + esc(hrc) + '">' + ic('login') + ' เข้าผ่าน HR Connect</a><p class="tiny muted center mt8">เข้า HR Connect แล้วกดเมนู "ใบประกอบวิชาชีพของฉัน" ระบบจะเข้าต่อให้เอง</p>' +
    '<div class="orline">หรือกรอกที่นี่</div>' +
    '<div class="field"><label class="f" for="l-emp">รหัสพนักงาน</label><input class="inp" id="l-emp" inputmode="numeric" maxlength="7" autocomplete="username" placeholder="เลข 7 หลัก"></div>' +
    '<div class="field" id="l-pwf"><label class="f" for="l-pw">รหัสผ่าน HR Connect</label><input class="inp" id="l-pw" type="password" autocomplete="current-password"></div>' +
    '<div class="field hide" id="l-cidf"><label class="f" for="l-cid">เลขบัตรประชาชน 13 หลัก</label><input class="inp" id="l-cid" inputmode="numeric" maxlength="17" autocomplete="off"><div class="help">สำหรับผู้ที่ยังไม่เคยตั้งรหัสผ่านใน HR Connect · ระบบไม่บันทึกเลขบัตร</div></div>' +
    '<button class="btn primary block lg" id="l-go">' + ic('login') + ' เข้าสู่ระบบ</button>' +
    '<div class="row between mt12 small"><a href="#" id="l-sw">ยังไม่เคยตั้งรหัสผ่าน? ใช้เลขบัตรประชาชน</a><a href="' + esc(hrc) + '">ลืมรหัสผ่าน</a></div></div>' +
    '<p class="tiny muted mt12">' + ic('info') + ' ติดต่อ ' + esc(b.deptName || 'ฝ่ายทรัพยากรบุคคล') + ' โทร ' + esc(b.supportPhone || '23400 - 23419') + ' · รุ่น ' + SL_BUILD + '</p><div id="l-api" class="tiny muted"></div></div></div></div>';
  var cid = false;
  $('#l-sw').onclick = function (e) { e.preventDefault(); cid = !cid; $('#l-pwf').classList.toggle('hide', cid); $('#l-cidf').classList.toggle('hide', !cid); this.textContent = cid ? 'ใช้รหัสผ่าน HR Connect' : 'ยังไม่เคยตั้งรหัสผ่าน? ใช้เลขบัตรประชาชน'; };
  var go = function () {
    var btn = $('#l-go'); busy(btn, true, 'กำลังตรวจสอบ'); S.token = null;
    api('login', cid ? { empCode: $('#l-emp').value.trim(), cid: $('#l-cid').value } : { empCode: $('#l-emp').value.trim(), password: $('#l-pw').value })
      .then(afterLogin).catch(function (e) { busy(btn, false); errToast(e); });
  };
  $('#l-go').onclick = go;
  $('#l-pw').onkeydown = $('#l-cid').onkeydown = function (e) { if (e.key === 'Enter') go(); };
  $('#l-emp').onkeydown = function (e) { if (e.key === 'Enter') (cid ? $('#l-cid') : $('#l-pw')).focus(); };
  api('ping').then(function (p) { $('#l-api').innerHTML = '<span class="dot ok"></span> เชื่อมต่อระบบแล้ว (หลังบ้าน ' + esc(p.build) + ')'; }).catch(function (e) { $('#l-api').innerHTML = '<span class="dot danger"></span> ' + esc(e.message); });
}

/* =================================================================== โครงหน้า + เมนู */
function navItems() {
  var L = [{ sec: 'ของฉัน' }, { r: 'me', t: 'ใบประกอบและใบรับรองของฉัน', i: 'badge', m: 'ของฉัน' }];
  if (isAdmin()) {
    L.push({ sec: 'ภาพรวม' }, { r: 'dash', t: 'แดชบอร์ด', i: 'chart', m: 'ภาพรวม' });
    L.push({ sec: 'งานผู้ดูแล' }, { r: 'registry', t: 'ทะเบียนบุคลากร', i: 'users', m: 'ทะเบียน' }, { r: 'review', t: 'ตรวจสอบเอกสาร', i: 'inbox', m: 'ตรวจ', badge: (S.boot && S.boot.pending) || 0 },
      { r: 'mail', t: 'อีเมลแจ้งเตือน', i: 'mail' }, { r: 'io', t: 'นำเข้า / ส่งออก Excel', i: 'layers' });
    L.push({ sec: 'ระบบ' }, { r: 'settings', t: 'ตั้งค่า', i: 'settings' }, { r: 'audit', t: 'ประวัติการใช้งาน', i: 'history' });
  } else if (isHead()) {
    L.push({ sec: 'หัวหน้าฝ่าย/หน่วย' }, { r: 'dash', t: 'แดชบอร์ดฝ่าย', i: 'chart', m: 'ภาพรวม' }, { r: 'team', t: 'บุคลากรในฝ่าย', i: 'users', m: 'ในฝ่าย' });
  }
  L.push({ sec: 'ช่วยเหลือ' }, { r: 'help', t: 'วิธีใช้ & คำถามที่พบบ่อย', i: 'help', m: 'วิธีใช้' });
  return L;
}
function shell(title, sub, actions) {
  var app = $('#app');
  if (!$('.shell', app)) {
    app.innerHTML = '<div class="shell"><aside class="side"><div class="brand"><div class="logo">' + ic('sl') + '</div><div><b>SOMDEJ License</b><span>ติดตามใบประกอบวิชาชีพ<br>รพ.สมเด็จฯ ณ ศรีราชา</span></div></div><nav class="nav" id="nav"></nav>' +
      '<div class="me"><b>' + esc(S.me.name || S.me.empCode) + '</b>' + esc(S.me.rolesTh.filter(function (r) { return r !== 'บุคลากร' || S.me.roles.length === 1; }).join(' · ')) +
      '<div class="row mt8"><button class="btn th-btn" id="b-th" title="สลับโหมดสว่าง/มืด">' + ic(isDark() ? 'sun' : 'moon') + '</button><a class="btn" href="' + esc((S.boot.app || {}).hrcUrl || '#') + '">' + ic('link') + ' HR Connect</a><button class="btn" id="b-out">' + ic('logout') + ' ออก</button></div>' +
      '<div class="tiny" style="opacity:.6;margin-top:8px">รุ่น ' + SL_BUILD + '</div></div></aside>' +
      '<main class="main"><div class="mobile-top"><div class="logo">' + ic('sl') + '</div><b>License</b><button class="btn th-btn" id="m-th">' + ic(isDark() ? 'sun' : 'moon') + '</button><button class="btn" id="m-out" aria-label="ออกจากระบบ">' + ic('logout') + '</button></div><div id="topbar" class="topbar"></div><div id="page"></div></main></div><nav class="bottomnav" id="bnav"></nav>';
    $('#b-out').onclick = function () { logout(); };
    $('#m-out').onclick = function () { confirmBox('ออกจากระบบ', 'ต้องการออกจากระบบหรือไม่', 'ออกจากระบบ').then(function (y) { if (y) logout(); }); };
    $$('.th-btn').forEach(function (b) { b.onclick = toggleTheme; });
  }
  renderNav();
  $('#topbar').innerHTML = '<div class="grow"><h1>' + title + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div><div class="row noprint">' + (actions || '') + '<button class="btn helpbtn" data-help="' + S.route + '" title="วิธีใช้หน้านี้">?</button></div>';
  $('[data-help]', $('#topbar')).onclick = function () { if (window.showHelp) showHelp(S.route); };
  return $('#page');
}
function renderNav() {
  var r = S.route, items = navItems();
  $('#nav').innerHTML = items.map(function (x) { return x.sec ? '<div class="sec">' + x.sec + '</div>' : '<a href="#/' + x.r + '" class="' + (r === x.r ? 'on' : '') + '">' + ic(x.i) + '<span>' + x.t + '</span>' + (x.badge ? '<em class="badge">' + x.badge + '</em>' : '') + '</a>'; }).join('');
  var mob = items.filter(function (x) { return x.r && x.m; }).slice(0, 5);
  $('#bnav').innerHTML = mob.map(function (x) { return '<a href="#/' + x.r + '" class="' + (r === x.r ? 'on' : '') + '">' + ic(x.i) + '<span>' + x.m + (x.badge ? ' (' + x.badge + ')' : '') + '</span></a>'; }).join('');
  $('#bnav').style.display = mob.length > 1 ? '' : 'none';
}
function refreshBadge() { api('bootstrap').then(function (b) { applyBoot(b); renderNav(); }).catch(function () { }); }

/* =================================================================== เส้นทาง */
var PAGES = {};
function route() {
  if (!S.token || !S.me) return;
  closeDrawer();
  var h = (location.hash || '').replace(/^#\/?/, ''), parts = h.split('/'), name = parts[0] || homeRoute();
  var allowed = navItems().filter(function (x) { return x.r; }).map(function (x) { return x.r; });
  if (allowed.indexOf(name) < 0) name = homeRoute();
  S.route = name;
  window.scrollTo(0, 0);
  try { (PAGES[name] || PAGES[homeRoute()])(parts.slice(1)); } catch (e) { console.error(e); errToast(e); }
}
window.addEventListener('hashchange', route);

/* =================================================================== เริ่มระบบ */
function checkVersion() {
  fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
    if (v.build && v.build !== SL_BUILD && !$('#vbar')) {
      var d = document.createElement('div'); d.id = 'vbar'; d.className = 'note info'; d.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:150;box-shadow:var(--shadow-lg)';
      d.innerHTML = ic('refresh') + '<div>มีรุ่นใหม่ (' + esc(v.build) + ') <a href="#" onclick="location.reload(true);return false">กดเพื่อโหลดใหม่</a></div>'; document.body.appendChild(d);
    }
  }).catch(function () { });
}
function registerSW() { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () { }); }
function start() {
  registerSW();
  try { S.token = localStorage.getItem('sl_token') || null; } catch (e) { }
  var done = function () { var bs = $('#bootsplash'); if (bs) bs.remove(); };
  api('branding').then(function (b) { S.brand = b; }).catch(function () { }).then(function () {
    if (!S.token) { done(); return trySso(function (m) { renderLogin('', m); }); }
    return api('bootstrap').then(function (b) {
      applyBoot(b); done();
      if (b.app && b.app.build !== SL_API_BUILD && isAdmin()) setTimeout(function () { toast('หลังบ้านเป็นรุ่น ' + b.app.build + ' แต่หน้าเว็บต้องการรุ่น ' + SL_API_BUILD + ' — กรุณา Deploy Apps Script รุ่นใหม่', 'warn', 9000); }, 800);
      route();
    }).catch(function () { done(); S.token = null; trySso(function (m) { renderLogin('', m); }); });
  });
  setInterval(checkVersion, 600000);
}
document.addEventListener('DOMContentLoaded', start);
