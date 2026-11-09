/* SOMDEJ License — pages-dash.js : แดชบอร์ด (ผู้ดูแล = ทั้ง รพ. · หัวหน้า = ฝ่ายตน) · บุคลากรในฝ่าย (หัวหน้า) */
PAGES.dash = function () {
  var scope = isAdmin() ? 'ทั้งโรงพยาบาล' : (S.me.scopes || []).map(function (s) { return s.scope; }).join(', ');
  var pg = shell('ภาพรวมใบประกอบวิชาชีพ', 'ข้อมูล ณ ' + thDateFull(today()) + ' · ' + esc(scope), isAdmin() ? '<a class="btn" href="#/registry">' + ic('users') + ' ทะเบียน</a>' : '<a class="btn" href="#/team">' + ic('users') + ' บุคลากรในฝ่าย</a>');
  pg.innerHTML = '<div class="grid g4">' + '<div class="card" style="height:150px"></div>'.repeat(4) + '</div>' + loadingHtml();
  api('getDashboard').then(function (d) { renderDash(pg, d); }).catch(function (e) { pg.innerHTML = emptyHtml(e.message, 'alert'); });
};
function goList(q) { location.hash = (isAdmin() ? '#/registry/' : '#/team/') + q; }
function renderDash(pg, d) {
  var k = d.k, sd = d.soonDays;
  var kpis = [
    ['soon', 'clock', k.SOON, 'ใกล้หมดอายุ (ภายใน ' + Math.round(sd / 30) + ' เดือน)', 'ภายใน 30 วัน <b style="color:var(--exp)">' + nf(k.SOON30) + '</b> ราย', 'st=SOON'],
    ['exp' + (k.EXPIRED ? ' pulse' : ''), 'alert', k.EXPIRED, 'หมดอายุแล้ว', 'ต้องติดตามเร่งด่วน', 'st=EXPIRED'],
    ['rev', 'inbox', k.pending, 'เอกสารรอตรวจสอบ', 'บุคลากรส่งสำเนาฉบับใหม่แล้ว', isAdmin() ? '' : 'fl=REVIEW'],
    ['ok', 'check', k.VALID + k.LIFETIME, 'ปกติ', 'ตลอดชีพ ' + nf(k.LIFETIME) + ' · ยังไม่มีข้อมูล ' + nf(k.NODATA), 'st=VALID']
  ];
  var segs = [['VALID', 'ปกติ', 'var(--ok)'], ['SOON', 'ใกล้หมดอายุ', 'var(--soon)'], ['EXPIRED', 'หมดอายุแล้ว', 'var(--exp)'], ['LIFETIME', 'ตลอดชีพ', 'var(--life)'], ['NODATA', 'ยังไม่มีข้อมูล', 'var(--nodata)']];
  var tot = Math.max(1, segs.reduce(function (a, s) { return a + (k[s[0]] || 0); }, 0)), circ = 2 * Math.PI * 70, off = 0;
  var circles = segs.map(function (s) { var len = (k[s[0]] || 0) / tot * circ, el = '<circle cx="90" cy="90" r="70" stroke="' + s[2] + '" stroke-dasharray="0 ' + circ + '" stroke-dashoffset="' + (-off) + '" data-len="' + len + '"/>'; off += len; return el; }).join('');
  var mx = Math.max.apply(null, d.months.map(function (m) { return m.n; }).concat([1]));
  var profs = Object.keys(d.byProf).map(function (id) { return [id, d.byProf[id]]; }).sort(function (a, b) { return (b[1].EXPIRED * 1000 + b[1].SOON * 10 + b[1].n / 1000) - (a[1].EXPIRED * 1000 + a[1].SOON * 10 + a[1].n / 1000); }).slice(0, 10);
  var divs = Object.keys(d.byDiv).map(function (id) { return [id, d.byDiv[id]]; }).sort(function (a, b) { return (b[1].EXPIRED + b[1].SOON) - (a[1].EXPIRED + a[1].SOON) || b[1].n - a[1].n; });
  var flows = [['NONE', 'ยังไม่ดำเนินการ'], ['BASE', 'ขอสำเนาตั้งต้น'], ['N1', 'แจ้งครั้งที่ 1'], ['R1', 'เตือนซ้ำ'], ['N2', 'แจ้งครั้งที่ 2'], ['REVIEW', 'รอตรวจสอบ'], ['REJECTED', 'ส่งกลับแก้ไข'], ['DONE', 'ต่ออายุแล้ว']];
  var stack = function (v) { return '<div class="stack">' + ['VALID', 'LIFETIME', 'SOON', 'EXPIRED', 'NODATA'].map(function (s) { return '<i style="background:' + ST_COLOR[s] + '" data-w="' + ((v[s] || 0) / v.n * 100) + '"></i>'; }).join('') + '</div>'; };
  pg.innerHTML =
    '<div class="grid g4">' + kpis.map(function (x, i) { return '<div class="card kpi ' + x[0] + ' rise" style="animation-delay:' + i * .05 + 's" data-go="' + x[5] + '"><div class="ic" style="background:color-mix(in srgb, currentColor 14%, transparent)">' + ic(x[1]) + '</div><div class="v" data-n="' + x[2] + '">0</div><div class="l">' + x[3] + '</div><div class="s">' + x[4] + '</div></div>'; }).join('') + '</div>' +
    '<div class="grid gA mt16">' +
    '<div class="card rise" style="animation-delay:.2s"><h3>' + ic('chart') + ' สัดส่วนสถานะ<span class="sub">ต้องติดตาม ' + nf(k.tracked) + ' จาก ' + nf(k.staff) + ' คน</span></h3><div class="row" style="justify-content:center;gap:24px"><div class="donut"><svg width="180" height="180" viewBox="0 0 180 180"><circle cx="90" cy="90" r="70" stroke="var(--line)"/>' + circles + '</svg><div class="mid"><b data-n="' + k.tracked + '">0</b><span>ต้องติดตาม</span></div></div>' +
    '<div class="legend">' + segs.map(function (s) { return '<div data-go="st=' + s[0] + '"><i style="background:' + s[2] + '"></i>' + s[1] + '<b>' + nf(k[s[0]] || 0) + '</b></div>'; }).join('') + '</div></div>' +
    (k.noEmail ? '<div class="note warn mt12">' + ic('mail') + '<div>ไม่มีอีเมลในทะเบียน ' + nf(k.noEmail) + ' คน — ระบบส่งแจ้งเตือนไม่ได้ (แก้อีเมลใน HR Connect)</div></div>' : '') + '</div>' +
    '<div class="card rise" style="animation-delay:.25s"><h3>' + ic('clock') + ' จะหมดอายุใน 12 เดือนข้างหน้า<span class="sub">คน/เดือน · ส้ม = ช่วงแจ้งเตือน</span></h3><div class="bars">' + d.months.map(function (m, i) {
      var y = +m.ym.slice(0, 4) + 543, mo = +m.ym.slice(5, 7);
      return '<div class="b" title="' + TH_MONF[mo - 1] + ' ' + y + ': ' + m.n + ' คน"><span class="v">' + (m.n || '') + '</span><div class="col ' + (m.n ? (i < Math.ceil(sd / 30) ? 'hot' : '') : 'zero') + '" data-h="' + (m.n / mx * 100) + '"></div><span class="m">' + TH_MON[mo - 1] + '</span></div>';
    }).join('') + '</div></div></div>' +
    '<div class="grid gB mt16">' +
    '<div class="card rise" style="animation-delay:.3s"><h3>' + ic('alert') + ' ต้องดำเนินการด่วน<span class="sub">หมดอายุ / เหลือ ≤ 60 วัน (' + nf(d.urgentTotal) + ')</span></h3><div class="ulist">' + (d.urgent.length ? d.urgent.map(function (u) {
      return '<div class="it" data-emp="' + u.e + '">' + avatar(u.n) + '<div class="grow"><b class="small">' + esc(u.n) + '</b><div class="tiny muted">' + esc(profName(u.prof)) + ' · ' + esc(FL_TH[u.fl] || '') + '</div></div><div class="dd" style="color:' + (u.days < 0 ? 'var(--exp)' : 'var(--soon)') + '">' + daysText(u.days) + '<div class="tiny muted">' + thDate(u.exp) + '</div></div></div>';
    }).join('') : emptyHtml('ไม่มีรายการเร่งด่วน', 'check')) + '</div></div>' +
    '<div class="card rise" style="animation-delay:.35s"><h3>' + ic('badge') + ' แยกตามวิชาชีพ</h3><div class="grid" style="gap:11px">' + profs.map(function (x) {
      var v = x[1]; return '<div data-go="prof=' + x[0] + '" style="cursor:pointer"><div class="row between small"><span>' + esc(profName(x[0])) + '</span><span class="muted">' + nf(v.n) + ' คน' + (v.EXPIRED ? ' · <b style="color:var(--exp)">หมด ' + v.EXPIRED + '</b>' : '') + (v.SOON ? ' · <b style="color:var(--soon)">ใกล้ ' + v.SOON + '</b>' : '') + '</span></div>' + stack(v) + '</div>';
    }).join('') + '</div></div>' +
    '<div class="card rise" style="animation-delay:.4s"><h3>' + ic('send') + ' สถานะการติดตาม</h3><div class="pipe">' + flows.map(function (f) { return '<div data-go="fl=' + f[0] + '"><b data-n="' + (d.flow[f[0]] || 0) + '">0</b><span>' + f[1] + '</span></div>'; }).join('') + '</div>' +
    '<div class="note info mt12">' + ic('info') + '<div class="small">ใบรับรองอื่น ๆ ในทะเบียน ' + nf(d.certs.total) + ' ฉบับ' + (d.certs.warn ? ' · ใกล้/หมดอายุ <b>' + d.certs.warn + '</b>' : '') + '</div></div></div></div>' +
    (divs.length > 1 ? '<div class="card mt16 rise" style="animation-delay:.45s"><h3>' + ic('building') + ' แยกตามฝ่าย/หน่วยงานที่ปฏิบัติงาน</h3><div class="tbl" style="box-shadow:none;border:0"><table class="t cards"><thead><tr><th>ฝ่าย</th><th class="right">ต้องติดตาม</th><th class="right">ปกติ</th><th class="right">ใกล้หมดอายุ</th><th class="right">หมดอายุ</th><th class="right">ไม่มีข้อมูล</th><th style="width:30%">สัดส่วน</th></tr></thead><tbody>' +
      divs.map(function (x) { var v = x[1]; return '<tr class="click" data-go="d=' + encodeURIComponent(x[0]) + '"><td class="wh"><b>' + esc(x[0]) + '</b></td><td data-l="ต้องติดตาม" class="right num">' + v.n + '</td><td data-l="ปกติ" class="right num">' + ((v.VALID || 0) + (v.LIFETIME || 0)) + '</td><td data-l="ใกล้หมดอายุ" class="right num" style="color:var(--soon)">' + (v.SOON || '') + '</td><td data-l="หมดอายุ" class="right num" style="color:var(--exp)">' + (v.EXPIRED || '') + '</td><td data-l="ไม่มีข้อมูล" class="right num">' + (v.NODATA || '') + '</td><td data-l="สัดส่วน">' + stack(v) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' : '');
  countUp(pg);
  requestAnimationFrame(function () { setTimeout(function () {
    $$('.donut circle[data-len]', pg).forEach(function (c) { c.setAttribute('stroke-dasharray', c.dataset.len + ' ' + (circ - c.dataset.len)); });
    $$('.col[data-h]', pg).forEach(function (c) { c.style.height = c.dataset.h + '%'; });
    $$('.stack i[data-w]', pg).forEach(function (c) { c.style.width = c.dataset.w + '%'; });
  }, 60); });
  $$('[data-go]', pg).forEach(function (el) { el.onclick = function () { var q = el.dataset.go; if (!q) return (location.hash = '#/review'); goList(q); }; });
  $$('[data-emp]', pg).forEach(function (el) { el.onclick = function () { if (isAdmin()) openPerson(el.dataset.emp); else goList('q=' + el.dataset.emp); }; });
}

/* ---------------------------------------------------------------- บุคลากรในฝ่าย (หัวหน้า · ดูอย่างเดียว) */
PAGES.team = function (parts) {
  var pg = shell('บุคลากรในฝ่าย', 'ดูอย่างเดียว · ' + esc((S.me.scopes || []).map(function (s) { return s.scope; }).join(', ')) + ' · ไม่แสดงเลขที่ใบอนุญาตและสำเนาเอกสาร', '<button class="btn" id="t-x">' + ic('download') + ' Excel</button>');
  pg.innerHTML = loadingHtml();
  api('teamList').then(function (d) {
    S.team = d.rows;
    listView(pg, d.rows, { full: false, q: parseQ(parts[0]), onRow: null });
    $('#t-x').onclick = function () { exportRows(S.team.filter(function (r) { return r.tr; }), false, 'บุคลากรในฝ่าย'); };
  }).catch(function (e) { pg.innerHTML = emptyHtml(e.message, 'alert'); });
};
function parseQ(s) { var o = {}; String(s || '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) o[a[0]] = decodeURIComponent(a[1] || ''); }); return o; }

/** รายการบุคลากร + ตัวกรอง (ใช้ทั้งทะเบียนผู้ดูแลและหัวหน้า) */
function listView(pg, rows, opt) {
  var q = opt.q || {}, F = { text: q.q || '', st: q.st || '', fl: q.fl || '', prof: q.prof || '', d: q.d || '', scope: q.scope || 'tr', page: 1 };
  var profs = {}, divs = {}; rows.forEach(function (r) { if (r.prof) profs[r.prof] = 1; if (r.d) divs[r.d] = 1; });
  pg.innerHTML = '<div class="filters"><div class="search">' + ic('search') + '<input class="inp" id="f-q" placeholder="ค้นหาชื่อ / รหัส / ตำแหน่ง' + (opt.full ? ' / เลขที่ใบอนุญาต' : '') + '" value="' + esc(F.text) + '"></div>' +
    '<select class="inp" id="f-prof" style="width:auto"><option value="">ทุกวิชาชีพ</option>' + Object.keys(profs).sort(function (a, b) { return profName(a).localeCompare(profName(b), 'th'); }).map(function (p) { return '<option value="' + p + '"' + (p === F.prof ? ' selected' : '') + '>' + esc(profName(p)) + '</option>'; }).join('') + '</select>' +
    '<select class="inp" id="f-d" style="width:auto;max-width:260px"><option value="">ทุกฝ่าย</option>' + Object.keys(divs).sort().map(function (p) { return '<option' + (p === F.d ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select>' +
    '<select class="inp" id="f-fl" style="width:auto"><option value="">ทุกสถานะติดตาม</option>' + Object.keys(FL_TH).map(function (k) { return '<option value="' + k + '"' + (k === F.fl ? ' selected' : '') + '>' + FL_TH[k] + '</option>'; }).join('') + '</select></div>' +
    '<div class="fchips" id="f-st"></div><div class="tbl" id="f-tbl"></div>' + (opt.below || '');
  var chips = [['', 'ทั้งหมด'], ['SOON', 'ใกล้หมดอายุ'], ['EXPIRED', 'หมดอายุแล้ว'], ['NODATA', 'ยังไม่มีข้อมูล'], ['VALID', 'ปกติ'], ['LIFETIME', 'ตลอดชีพ'], ['PEND', 'รอตรวจ']];
  var scopes = opt.full ? [['tr', 'ต้องติดตาม'], ['all', 'บุคลากรทั้งหมด'], ['nt', 'ไม่ต้องมีใบประกอบ'], ['left', 'พ้นสภาพ/ไม่พบ']] : [['tr', 'ต้องติดตาม'], ['all', 'ทั้งหมด']];
  var base = function () { return rows.filter(function (r) { if (F.scope === 'tr') return r.tr; if (F.scope === 'nt') return !r.tr && r.ps === 'ACTIVE'; if (F.scope === 'left') return r.ps !== 'ACTIVE'; return true; }); };
  var match = function (r) {
    if (F.st === 'PEND' ? !r.pend : F.st && r.st !== F.st) return false;
    if (F.fl && r.fl !== F.fl) return false; if (F.prof && r.prof !== F.prof) return false; if (F.d && r.d !== F.d) return false;
    if (F.text) { var t = F.text.toLowerCase(); if ((r.n + ' ' + r.e + ' ' + r.pos + ' ' + (r.no || '') + ' ' + (r.u || '')).toLowerCase().indexOf(t) < 0) return false; }
    return true;
  };
  var draw = function () {
    var b = base();
    $('#f-st', pg).innerHTML = scopes.map(function (s) { return '<button data-sc="' + s[0] + '" class="' + (F.scope === s[0] ? 'on' : '') + '">' + s[1] + '</button>'; }).join('') + '<span style="width:12px"></span>' +
      chips.map(function (c) { var n = b.filter(function (r) { return c[0] === 'PEND' ? r.pend : !c[0] || r.st === c[0]; }).length; return '<button data-st="' + c[0] + '" class="' + (F.st === c[0] ? 'on' : '') + '">' + c[1] + '<em>' + nf(n) + '</em></button>'; }).join('');
    $$('[data-sc]', pg).forEach(function (x) { x.onclick = function () { F.scope = x.dataset.sc; F.page = 1; draw(); }; });
    $$('[data-st]', pg).forEach(function (x) { x.onclick = function () { F.st = x.dataset.st; F.page = 1; draw(); }; });
    var list = b.filter(match).sort(function (a, c) { var da = a.days == null ? 1e9 : a.days, dc = c.days == null ? 1e9 : c.days; return (a.st === 'NODATA') - (c.st === 'NODATA') || da - dc || String(a.n).localeCompare(String(c.n), 'th'); });
    S.listView = list;
    var size = 50, pages = Math.max(1, Math.ceil(list.length / size)); if (F.page > pages) F.page = pages;
    var show = list.slice((F.page - 1) * size, F.page * size);
    $('#f-tbl', pg).innerHTML = list.length ? '<table class="t cards"><thead><tr>' + (opt.select ? '<th><input type="checkbox" id="f-all"></th>' : '') + '<th>บุคลากร</th><th>วิชาชีพ' + (opt.full ? ' / เลขที่' : '') + '</th><th>ฝ่ายที่ปฏิบัติงาน</th><th>วันหมดอายุ</th><th>สถานะ</th><th>การติดตาม</th>' + (opt.full ? '<th>อีเมล</th>' : '') + '</tr></thead><tbody>' + show.map(function (r) {
      return '<tr class="' + (opt.onRow ? 'click' : '') + '" data-e="' + r.e + '">' + (opt.select ? '<td class="wh"><input type="checkbox" class="f-sel" value="' + r.e + '"' + (opt.selected && opt.selected[r.e] ? ' checked' : '') + '></td>' : '') +
        '<td class="wh"><div class="who">' + avatar(r.n) + '<div><b>' + esc(r.n || '-') + '</b><small>' + esc(r.e) + ' · ' + esc(r.pos) + (r.ps !== 'ACTIVE' ? ' · <span style="color:var(--exp)">' + PS_TH[r.ps] + '</span>' : '') + '</small></div></div></td>' +
        '<td data-l="วิชาชีพ">' + esc(profName(r.prof)) + (opt.full && r.no ? '<div class="tiny muted">' + esc(r.no) + '</div>' : '') + (r.oth ? '<div class="tiny muted">+ ใบรับรอง ' + r.oth + (r.othWarn ? ' (⚠ ' + r.othWarn + ')' : '') + '</div>' : '') + '</td>' +
        '<td data-l="ฝ่าย"><span class="small">' + esc(r.d || '-') + '</span></td><td data-l="หมดอายุ" class="nowrap">' + (r.st === 'LIFETIME' ? 'ตลอดชีพ' : thDate(r.exp)) + '</td>' +
        '<td data-l="สถานะ">' + stChip(r.st, r.days) + '</td><td data-l="ติดตาม">' + flChip(r.fl) + (r.pend ? ' <span class="chip PENDING">รอตรวจ ' + r.pend + '</span>' : '') + '</td>' +
        (opt.full ? '<td data-l="อีเมล">' + (r.em ? ic('check') : '<span class="chip gray">ไม่มี</span>') + '</td>' : '') + '</tr>';
    }).join('') + '</tbody></table><div class="pager">แสดง ' + ((F.page - 1) * size + 1) + '–' + Math.min(F.page * size, list.length) + ' จาก ' + nf(list.length) + ' คน <button class="btn sm" id="pg-p"' + (F.page < 2 ? ' disabled' : '') + '>‹</button> หน้า ' + F.page + '/' + pages + ' <button class="btn sm" id="pg-n"' + (F.page >= pages ? ' disabled' : '') + '>›</button></div>' : emptyHtml('ไม่พบรายการตามตัวกรอง', 'search');
    if ($('#pg-p', pg)) { $('#pg-p', pg).onclick = function () { F.page--; draw(); }; $('#pg-n', pg).onclick = function () { F.page++; draw(); }; }
    if (opt.onRow) $$('tr[data-e]', pg).forEach(function (tr) { tr.onclick = function (e) { if (e.target.tagName === 'INPUT') return; opt.onRow(tr.dataset.e); }; });
    if (opt.select) {
      $$('.f-sel', pg).forEach(function (c) { c.onchange = function () { opt.selected[c.value] = c.checked; if (opt.onSelect) opt.onSelect(); }; });
      $('#f-all', pg).onchange = function () { var on = this.checked; list.forEach(function (r) { opt.selected[r.e] = on; }); draw(); if (opt.onSelect) opt.onSelect(); };
    }
  };
  $('#f-q', pg).oninput = debounce(function () { F.text = this.value.trim(); F.page = 1; draw(); }, 200);
  $('#f-prof', pg).onchange = function () { F.prof = this.value; F.page = 1; draw(); };
  $('#f-d', pg).onchange = function () { F.d = this.value; F.page = 1; draw(); };
  $('#f-fl', pg).onchange = function () { F.fl = this.value; F.page = 1; draw(); };
  draw();
  return { redraw: draw, F: F };
}
