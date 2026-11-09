/* SOMDEJ License — pages-mail.js : อีเมลแจ้งเตือน (รายการที่จะส่งวันนี้ · รอบขอสำเนาตั้งต้น · ประวัติการส่ง) */
var KIND_TH = { N1: 'แจ้งครั้งที่ 1', R1: 'เตือนซ้ำ', N2: 'แจ้งครั้งที่ 2', BASE: 'ขอสำเนาตั้งต้น', ACK: 'ตอบรับไฟล์', APPROVED: 'แจ้งอนุมัติ', REJECTED: 'แจ้งส่งกลับ' };
PAGES.mail = function (parts) {
  var tab = parts[0] || 'due';
  var pg = shell('อีเมลแจ้งเตือน', 'ตรวจรายชื่อก่อนส่ง · ส่งอัตโนมัติทุกเช้าเมื่อเปิดใช้งาน (ตั้งค่า › การแจ้งเตือน)');
  pg.innerHTML = '<div class="seg" id="ml-tab"><button data-t="due">วันนี้ระบบจะส่ง</button><button data-t="base">รอบขอสำเนาตั้งต้น</button><button data-t="log">ประวัติการส่ง</button></div><div id="ml-b" class="mt16"></div>';
  var go = function (t) { tab = t; $$('#ml-tab button', pg).forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); }); ({ due: mailDue, base: mailBase, log: mailLog })[t]($('#ml-b', pg)); };
  $$('#ml-tab button', pg).forEach(function (b) { b.onclick = function () { go(b.dataset.t); }; });
  go(tab);
};
function mailDue(el) {
  el.innerHTML = loadingHtml();
  api('mailPreview').then(function (d) {
    var due = d.due, tot = due.N1.length + due.R1.length + due.N2.length;
    var tbl = function (rows, kind) {
      return rows.length ? '<div class="tbl mt8"><table class="t cards"><thead><tr><th>บุคลากร</th><th>ฝ่าย</th><th>วันหมดอายุ</th><th>อีเมล</th></tr></thead><tbody>' + rows.slice(0, 200).map(function (r) {
        return '<tr class="click" data-e="' + r.e + '"><td class="wh"><div class="who">' + avatar(r.n) + '<div><b>' + esc(r.n) + '</b><small>' + esc(r.e) + ' · ' + esc(r.pos) + '</small></div></div></td><td data-l="ฝ่าย" class="small">' + esc(r.d) + '</td><td data-l="หมดอายุ" class="nowrap">' + thDate(r.exp) + ' <span class="tiny muted">' + daysText(r.days) + '</span></td><td data-l="อีเมล" class="small">' + esc(r.em || '-') + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (rows.length > 200 ? '<p class="tiny muted">แสดง 200 จาก ' + rows.length + '</p>' : '') : '<p class="muted small">ไม่มี</p>';
    };
    el.innerHTML = '<div class="note ' + (d.autoSend ? 'ok' : 'warn') + '">' + ic(d.autoSend ? 'check' : 'info') + '<div><b>ส่งอัตโนมัติ: ' + (d.autoSend ? 'เปิดอยู่' : 'ปิดอยู่') + '</b> · แจ้งครั้งที่ 1 ก่อนหมดอายุ ' + d.remindDays[0] + ' วัน' + (d.remindDays[1] ? ' · เตือนซ้ำ ' + d.remindDays[1] + ' วัน' : '') + ' · ครั้งที่ 2 เมื่อหมดอายุ (อัตโนมัติเฉพาะที่หมดไม่เกิน ' + d.autoN2MaxDays + ' วัน)' +
      '<br><span class="small">โควตาอีเมลวันนี้เหลือ ' + nf(d.quota) + ' ฉบับ · ส่งต่อรอบไม่เกิน ' + nf(d.maxPerRun) + '</span></div></div>' +
      '<div class="row mt12"><button class="btn primary" id="ml-run"' + (tot ? '' : ' disabled') + '>' + ic('send') + ' ส่งรายการด้านล่างตอนนี้ (' + tot + ')</button>' + (isSuper() ? '<a class="btn" href="#/settings/notify">' + ic('settings') + ' ตั้งค่าการแจ้งเตือน</a>' : '') + '</div>' +
      '<div class="card mt16"><h3>' + flChip('N2') + ' หมดอายุแล้ว — แจ้งครั้งที่ 2 <span class="sub">' + due.N2.length + ' คน · สำเนาหัวหน้าฝ่าย</span></h3>' + tbl(due.N2) + '</div>' +
      '<div class="card mt16"><h3>' + flChip('N1') + ' ใกล้หมดอายุ — แจ้งครั้งที่ 1 <span class="sub">' + due.N1.length + ' คน</span></h3>' + tbl(due.N1) + '</div>' +
      '<div class="card mt16"><h3>' + flChip('R1') + ' เตือนซ้ำ <span class="sub">' + due.R1.length + ' คน</span></h3>' + tbl(due.R1) + '</div>' +
      '<div class="card mt16"><h3>' + ic('alert') + ' ระบบข้ามไว้ (ต้องดำเนินการเอง)</h3>' +
      '<p class="small"><b>หมดอายุนานเกิน ' + d.autoN2MaxDays + ' วัน (' + due.skip.tooOld.length + ')</b> — ข้อมูลอาจเก่า แนะนำส่ง "ขอสำเนาตั้งต้น" ที่แท็บถัดไป</p>' + tbl(due.skip.tooOld) +
      '<p class="small mt12"><b>ไม่มีอีเมล (' + due.skip.noEmail.length + ')</b> — แก้อีเมลใน HR Connect หรือแจ้งผ่านหัวหน้า</p>' + tbl(due.skip.noEmail) +
      '<p class="small mt12"><b>ไม่พบใน SmartAPI (' + due.skip.notFound.length + ')</b> — อาจพ้นสภาพ ตรวจสอบก่อน</p>' + tbl(due.skip.notFound) + '</div>';
    $$('tr[data-e]', el).forEach(function (tr) { tr.onclick = function () { openPerson(tr.dataset.e); }; });
    $('#ml-run', el).onclick = function () {
      confirmBox('ส่งอีเมลแจ้งเตือน', 'ส่งอีเมลถึงบุคลากร <b>' + tot + '</b> คนตามรายการ (ครั้งที่ 2 ' + due.N2.length + ' · ครั้งที่ 1 ' + due.N1.length + ' · เตือนซ้ำ ' + due.R1.length + ') ใช่หรือไม่', 'ส่งอีเมล').then(function (y) {
        if (!y) return; var b = $('#ml-run', el); busy(b, true, 'กำลังส่ง');
        api('runDailyMail').then(function (r) { toast('ส่งแล้ว ' + (r.sent.N1 + r.sent.R1 + r.sent.N2) + ' ฉบับ' + (r.failed ? ' · ไม่สำเร็จ ' + r.failed : '') + (r.left ? ' · เหลือ ' + r.left + ' (ส่งรอบถัดไป)' : ''), 'ok', 7000); mailDue(el); }).catch(function (e) { busy(b, false); errToast(e); });
      });
    };
  }).catch(function (e) { el.innerHTML = emptyHtml(e.message, 'alert'); });
}
/** รอบขอสำเนาตั้งต้น: เลือกคน (หมดอายุ / ไม่มีข้อมูล) → ส่งครั้งละ 100 */
function mailBase(el) {
  el.innerHTML = loadingHtml();
  var sel = {};
  (S.reg ? Promise.resolve({ rows: S.reg }) : api('getRegistry')).then(function (d) {
    S.reg = d.rows;
    var rows = d.rows.filter(function (r) { return r.tr && r.ps === 'ACTIVE'; });
    el.innerHTML = '<div class="note info">' + ic('info') + '<div><b>ใช้ปรับปรุงทะเบียนให้เป็นปัจจุบันก่อนเปิดส่งอัตโนมัติ</b><br><span class="small">ส่งอีเมลขอสำเนาใบอนุญาตฉบับปัจจุบัน (ไม่ใช่อีเมลแจ้งหมดอายุ) · บุคลากรตอบกลับพร้อมไฟล์ หรืออัปโหลดเอง → เข้าคิวตรวจสอบ · แนะนำเริ่มจากกลุ่ม "หมดอายุแล้ว" และ "ยังไม่มีข้อมูล"</span></div></div>' +
      '<div class="row mt12"><button class="btn primary" id="bs-send" disabled>' + ic('send') + ' ส่งขอสำเนาตั้งต้น (<span id="bs-n">0</span> คน)</button><button class="btn" id="bs-exp">เลือกทุกคนที่หมดอายุ/ไม่มีข้อมูล (ยังไม่เคยขอ)</button><button class="btn ghost" id="bs-clr">ล้างที่เลือก</button></div><div id="bs-list" class="mt16"></div>';
    var cnt = function () { var n = Object.keys(sel).filter(function (k) { return sel[k]; }).length; $('#bs-n', el).textContent = n; $('#bs-send', el).disabled = !n; };
    var lv = listView($('#bs-list', el), rows, { full: true, q: { st: 'EXPIRED' }, select: true, selected: sel, onSelect: cnt });
    $('#bs-exp', el).onclick = function () { rows.forEach(function (r) { if ((r.st === 'EXPIRED' || r.st === 'NODATA') && r.em && !r.base && r.fl !== 'REVIEW') sel[r.e] = true; }); lv.redraw(); cnt(); };
    $('#bs-clr', el).onclick = function () { Object.keys(sel).forEach(function (k) { delete sel[k]; }); lv.redraw(); cnt(); };
    $('#bs-send', el).onclick = function () {
      var emps = Object.keys(sel).filter(function (k) { return sel[k]; }), noMail = emps.filter(function (e) { var r = rows.filter(function (x) { return x.e === e; })[0]; return !r || !r.em; });
      confirmBox('ส่งขอสำเนาตั้งต้น', 'ส่งอีเมลถึง <b>' + emps.length + '</b> คน' + (noMail.length ? '<br><span style="color:var(--exp)">ไม่มีอีเมล ' + noMail.length + ' คน (จะส่งไม่สำเร็จ)</span>' : ''), 'ส่งอีเมล').then(function (y) {
        if (!y) return; var b = $('#bs-send', el); busy(b, true, 'กำลังส่ง'); var sent = 0, failed = 0, i = 0;
        var next = function () {
          if (i >= emps.length) { busy(b, false); toast('ส่งขอสำเนาตั้งต้นแล้ว ' + sent + ' คน' + (failed ? ' · ไม่สำเร็จ ' + failed : ''), 'ok', 7000); S.reg = null; mailBase(el); return; }
          var chunk = emps.slice(i, i + 100); i += 100; b.innerHTML = '<span class="spin" style="width:16px;height:16px;border-width:2px"></span> ' + Math.min(i, emps.length) + '/' + emps.length;
          api('sendNotice', { kind: 'BASE', emps: chunk }).then(function (r) { sent += r.sent; failed += r.failed.length; next(); }).catch(function (e) { busy(b, false); errToast(e); });
        };
        next();
      });
    };
  }).catch(function (e) { el.innerHTML = emptyHtml(e.message, 'alert'); });
}
function mailLog(el) {
  el.innerHTML = loadingHtml();
  api('listMailLog', { limit: 500 }).then(function (rows) {
    var names = {}; (S.reg || []).forEach(function (r) { names[r.e] = r.n; });
    el.innerHTML = rows.length ? '<div class="tbl"><table class="t cards"><thead><tr><th>เวลา</th><th>ชนิด</th><th>ถึง</th><th>ผล</th><th>โดย</th></tr></thead><tbody>' + rows.map(function (m) {
      return '<tr class="click" data-e="' + esc(m.empCode) + '"><td data-l="เวลา" class="nowrap">' + thDate(m.ts, true) + '</td><td data-l="ชนิด">' + esc(KIND_TH[m.kind] || m.kind) + '</td><td data-l="ถึง"><b class="small">' + esc(names[m.empCode] || m.empCode) + '</b><div class="tiny muted">' + esc(m.to) + (m.cc ? ' · สำเนา ' + esc(m.cc) : '') + '</div></td>' +
        '<td data-l="ผล">' + (m.ok === 'TRUE' ? '<span class="chip VALID">ส่งแล้ว</span>' : '<span class="chip EXPIRED">' + esc(m.error || 'ไม่สำเร็จ') + '</span>') + '</td><td data-l="โดย" class="small">' + esc(m.actor) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : emptyHtml('ยังไม่มีการส่งอีเมล', 'mail');
    $$('tr[data-e]', el).forEach(function (tr) { tr.onclick = function () { openPerson(tr.dataset.e); }; });
  }).catch(function (e) { el.innerHTML = emptyHtml(e.message, 'alert'); });
}
