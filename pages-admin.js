/* SOMDEJ License — pages-admin.js : ทะเบียนบุคลากร · รายละเอียดบุคคล · ตรวจสอบเอกสาร · ประวัติการใช้งาน (ผู้ดูแล) */
PAGES.registry = function (parts) {
  var pg = shell('ทะเบียนบุคลากร', 'ใบอนุญาตประกอบวิชาชีพทุกคน · คลิกชื่อเพื่อดูรายละเอียด ส่งแจ้งเตือน หรือแก้ไข',
    '<button class="btn" id="r-sync" title="ดึงรายชื่อ/อีเมล/ฝ่ายล่าสุดจาก HR Connect และตรวจสถานะกับ SmartAPI">' + ic('refresh') + ' ซิงก์ HR Connect</button><button class="btn" id="r-x">' + ic('download') + ' Excel</button><button class="btn primary" id="r-add">' + ic('plus') + ' เพิ่มรายการ</button>');
  pg.innerHTML = loadingHtml('กำลังโหลดทะเบียน…');
  var load = function () {
    return api('getRegistry').then(function (d) { S.reg = d.rows; listView(pg, d.rows, { full: true, q: parseQ(parts[0]), onRow: openPerson }); }).catch(function (e) { pg.innerHTML = emptyHtml(e.message, 'alert'); });
  };
  load();
  $('#r-x').onclick = function () { exportRows(S.listView || S.reg || [], true, 'ทะเบียนใบประกอบ'); };
  $('#r-sync').onclick = function () {
    var b = this; busy(b, true, 'กำลังซิงก์');
    api('syncPeople', { api: true }).then(function (r) {
      busy(b, false); toast('ซิงก์แล้ว: HR Connect ' + (r.hrc < 0 ? 'ยังไม่เชื่อม' : nf(r.hrc) + ' คน') + ' · ใหม่ ' + r.added + ' · ปรับ ' + r.updated + ' · SmartAPI ' + (r.api === 'ok' ? 'พบ ' + nf(r.active) + ' ไม่พบ ' + nf(r.notFound) : r.api), r.api === 'ok' ? 'ok' : 'warn', 8000); load();
    }).catch(function (e) { busy(b, false); errToast(e); });
  };
  $('#r-add').onclick = function () { promptBox('เพิ่มรายการ', 'รหัสพนักงาน 7 หลัก', { ok: 'ถัดไป' }).then(function (v) { if (v) openPerson(v.replace(/\D/g, '')); }); };
};

/* ---------------------------------------------------------------- รายละเอียดบุคคล */
function openPerson(emp) {
  var d = drawer(loadingHtml('กำลังโหลด…'));
  api('getPerson', { empCode: emp }).then(function (x) { renderPerson(d, x); }).catch(function (e) { d.innerHTML = '<div class="row between"><h3>รหัส ' + esc(emp) + '</h3><button class="btn ghost icon" onclick="closeDrawer()">' + ic('x') + '</button></div>' + emptyHtml(e.message, 'alert'); });
}
function renderPerson(d, x) {
  var p = x.person, lic = x.records.filter(function (r) { return r.typeId === 'LIC'; })[0], others = x.records.filter(function (r) { return r.typeId !== 'LIC'; });
  var pr = prof(x.req.profId);
  d.innerHTML = '<div class="row nw">' + avatar(p.name, 54) + '<div class="grow"><div style="font-size:18px;font-weight:700">' + esc(p.name || '-') + '</div><div class="muted small">' + esc(p.empCode) + ' · ' + esc(p.position || '-') + '</div></div><button class="btn ghost icon" id="pd-x" aria-label="ปิด">' + ic('x') + '</button></div>' +
    '<dl class="kv mt16"><dt>ฝ่ายที่ปฏิบัติงาน</dt><dd>' + esc(p.workDivision || p.division || '-') + (p.workUnit || p.unit ? ' · ' + esc(p.workUnit || p.unit) : '') + '</dd><dt>อีเมล</dt><dd>' + (p.email ? esc(p.email) : '<span style="color:var(--exp)">ไม่มี (แก้ใน HR Connect หรือกด แก้ไขข้อมูล)</span>') + '</dd>' +
    '<dt>สถานะ</dt><dd>' + esc(PS_TH[p.status] || p.status || '-') + (p.apiAt ? ' <span class="tiny muted">(ตรวจ ' + thDate(p.apiAt, true) + ')</span>' : '') + '</dd><dt>ใบประกอบ</dt><dd>' + esc(MODE_TH[x.req.mode]) + (pr ? ' · ' + esc(pr.name) : '') + '</dd>' +
    '<dt>หัวหน้า (สำเนาครั้งที่ 2)</dt><dd class="small">' + (x.heads.length ? esc(x.heads.join(', ')) : '-') + '</dd>' + (p.note ? '<dt>หมายเหตุ</dt><dd>' + esc(p.note) + '</dd>' : '') + '</dl>' +
    '<div class="row mt12"><button class="btn sm" id="pd-ep">' + ic('edit') + ' แก้ไขข้อมูล</button><button class="btn sm" id="pd-up">' + ic('upload') + ' แนบเอกสารแทน</button><button class="btn sm" id="pd-add">' + ic('plus') + ' เพิ่มใบรับรอง</button></div>' +
    '<h3 class="mt24" style="font-size:16px">' + ic('badge') + ' ใบอนุญาตประกอบวิชาชีพ</h3>' + (lic ? recBlock(lic, true) : '<div class="card mt8">' + emptyHtml('ยังไม่มีในทะเบียน', 'help') + '<div class="row" style="justify-content:center"><button class="btn primary sm" data-new="LIC">' + ic('plus') + ' บันทึกใบอนุญาต</button></div></div>') +
    '<div class="row mt12" id="pd-send"><span class="small muted">ส่งอีเมล:</span><button class="btn sm" data-kind="BASE">ขอสำเนาตั้งต้น</button><button class="btn sm" data-kind="N1">ครั้งที่ 1</button><button class="btn sm" data-kind="R1">เตือนซ้ำ</button><button class="btn sm danger" data-kind="N2">ครั้งที่ 2 (หมดอายุ)</button></div>' +
    (others.length ? '<h3 class="mt24" style="font-size:16px">' + ic('cert') + ' ใบรับรองอื่น (' + others.length + ')</h3>' + others.map(function (r) { return recBlock(r, false); }).join('') : '') +
    '<h3 class="mt24" style="font-size:16px">' + ic('inbox') + ' เอกสารที่ส่ง (' + x.submissions.length + ')</h3>' + (x.submissions.length ? x.submissions.map(function (s) {
      return '<div class="card mt8" style="padding:11px 14px"><div class="row"><b class="small">' + esc(s.title || s.typeName) + '</b><span class="chip ' + s.status + '" style="margin-left:auto">' + SUB_TH[s.status] + '</span></div><div class="tiny muted">' + thDate(s.createdAt, true) + ' · ' + esc(CH_TH[s.channel]) + (s.fromEmail ? ' · ' + esc(s.fromEmail) : '') + ' · ' + esc(s.fileName) + '</div>' +
        (s.reason ? '<div class="tiny">' + esc(s.reason) + '</div>' : '') + '<div class="row mt8"><button class="btn sm" data-sf="' + s.id + '">' + ic('eye') + ' เปิดไฟล์</button>' + (s.status === 'PENDING' ? '<a class="btn sm primary" href="#/review/' + s.id + '">ตรวจสอบ</a>' : '') + '</div></div>';
    }).join('') : '<p class="muted small">ยังไม่มี</p>') +
    '<h3 class="mt24" style="font-size:16px">' + ic('mail') + ' อีเมลที่ส่ง</h3>' + (x.mails.length ? '<div class="small">' + x.mails.map(function (m) { return '<div class="row" style="padding:5px 0;border-bottom:1px solid var(--line)"><span class="muted" style="min-width:120px">' + thDate(m.ts, true) + '</span><span>' + esc({ N1: 'แจ้งครั้งที่ 1', R1: 'เตือนซ้ำ', N2: 'แจ้งครั้งที่ 2', BASE: 'ขอสำเนาตั้งต้น', ACK: 'ตอบรับไฟล์', APPROVED: 'แจ้งอนุมัติ', REJECTED: 'แจ้งส่งกลับ' }[m.kind] || m.kind) + '</span>' + (m.ok === 'TRUE' ? '<span class="chip VALID" style="margin-left:auto">ส่งแล้ว</span>' : '<span class="chip EXPIRED" style="margin-left:auto" title="' + esc(m.error) + '">ไม่สำเร็จ</span>') + '</div>'; }).join('') + '</div>' : '<p class="muted small">ยังไม่เคยส่ง</p>');
  var reload = function () { if (!document.getElementById('drawer')) return; openPerson(p.empCode); if (S.route === 'registry') api('getRegistry').then(function (r) { S.reg = r.rows; }); };
  $('#pd-x', d).onclick = closeDrawer;
  $('#pd-ep', d).onclick = function () { personDialog(p, reload); };
  $('#pd-up', d).onclick = function () { uploadDialog({ empCode: p.empCode, typeId: 'LIC', rec: lic || null, done: reload }); };
  $('#pd-add', d).onclick = function () { recordDialog({ empCode: p.empCode, typeId: 'BLS' }, reload); };
  $$('[data-new]', d).forEach(function (b) { b.onclick = function () { recordDialog({ empCode: p.empCode, typeId: 'LIC', profId: x.req.profId }, reload); }; });
  $$('[data-edit]', d).forEach(function (b) { b.onclick = function () { recordDialog(x.records.filter(function (r) { return r.id === b.dataset.edit; })[0], reload, p.empCode); }; });
  $$('[data-del]', d).forEach(function (b) { b.onclick = function () { promptBox('ลบเอกสารออกจากทะเบียน', 'เหตุผลที่ลบ', { ok: 'ลบ', cls: 'danger' }).then(function (v) { if (v) api('deleteRecord', { id: b.dataset.del, reason: v }).then(function () { toast('ลบแล้ว', 'ok'); reload(); }).catch(errToast); }); }; });
  $$('[data-rf]', d).forEach(function (b) { b.onclick = function () { openFile({ recordId: b.dataset.rf }); }; });
  $$('[data-sf]', d).forEach(function (b) { b.onclick = function () { openFile({ subId: b.dataset.sf }); }; });
  $$('[data-kind]', d).forEach(function (b) { b.onclick = function () {
    var k = b.dataset.kind, label = b.textContent;
    if (!p.email) return toast('ไม่มีอีเมลของบุคคลนี้', 'warn');
    confirmBox('ส่งอีเมล: ' + label, 'ส่งถึง <b>' + esc(p.name) + '</b> (' + esc(p.email) + ')' + (k === 'N2' && x.heads.length ? '<br>สำเนาถึงหัวหน้า: ' + esc(x.heads.join(', ')) : ''), 'ส่งอีเมล').then(function (y) {
      if (y) api('sendNotice', { kind: k, emps: [p.empCode] }).then(function (r) { if (r.sent) toast('ส่งอีเมลแล้ว', 'ok'); else toast(r.failed[0] ? r.failed[0].error : 'ส่งไม่สำเร็จ', 'err'); reload(); }).catch(errToast);
    });
  }; });
}
function recBlock(r, isLic) {
  return '<div class="card mt8" style="padding:13px 15px;border-left:4px solid ' + (ST_COLOR[r.st] || 'var(--line)') + ';border-radius:0 var(--radius) var(--radius) 0"><div class="row"><b>' + esc(isLic ? (r.profName || 'ใบอนุญาต') : r.typeName) + '</b>' + stChip(r.st, r.days) + (isLic ? flChip(r.flow) : '') + '</div>' +
    (!isLic && r.title ? '<div class="small">' + esc(r.title) + '</div>' : '') +
    '<div class="small muted">เลขที่ ' + esc(r.docNo || '-') + ' · ออก ' + thDate(r.issueDate) + ' · หมดอายุ ' + (r.lifetime ? 'ตลอดชีพ' : thDate(r.expiryDate)) + (r.issuer ? ' · ' + esc(r.issuer) : '') + '</div>' +
    (isLic && (r.baseAt || r.n1At || r.n2At) ? '<div class="tiny muted">แจ้ง: ' + [r.baseAt && 'ตั้งต้น ' + thDate(r.baseAt), r.n1At && 'ครั้งที่ 1 ' + thDate(r.n1At), r.r1At && 'เตือนซ้ำ ' + thDate(r.r1At), r.n2At && 'ครั้งที่ 2 ' + thDate(r.n2At)].filter(Boolean).join(' · ') + '</div>' : '') +
    '<div class="row mt8"><button class="btn sm" data-edit="' + r.id + '">' + ic('edit') + ' แก้ไข</button>' + (r.hasFile ? '<button class="btn sm" data-rf="' + r.id + '">' + ic('eye') + ' สำเนา</button>' : '') +
    (r.verifyUrl ? '<a class="btn sm ghost" href="' + esc(r.verifyUrl) + '" target="_blank" rel="noopener">' + ic('link') + ' เว็บสภาวิชาชีพ</a>' : '') + '<button class="btn sm ghost" data-del="' + r.id + '" title="ลบ">' + ic('trash') + '</button></div></div>';
}
/** ผู้ดูแลเพิ่ม/แก้เอกสารโดยตรง */
function recordDialog(r, done, emp) {
  r = r || {}; var isNew = !r.id, typeId = r.typeId || 'LIC';
  var types = S.boot.docTypes || [], profs = S.boot.professions || [];
  modal({ title: isNew ? 'บันทึกเอกสารในทะเบียน' : 'แก้ไขเอกสาร', body:
    '<div class="note info">' + ic('info') + '<div class="small">บันทึกโดยผู้ดูแลโดยตรง (ไม่ผ่านคิวตรวจ) · ระบบเก็บประวัติการแก้ไขทุกครั้ง</div></div>' +
    '<div class="grid g2 mt12"><div class="field"><label class="f">ประเภท</label><select class="inp" id="rd-t"' + (isNew ? '' : ' disabled') + '>' + types.map(function (t) { return '<option value="' + t.id + '"' + (t.id === typeId ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field" id="rd-pf"><label class="f">วิชาชีพ</label><select class="inp" id="rd-p"><option value="">-</option>' + profs.map(function (p) { return '<option value="' + p.id + '"' + (p.id === r.profId ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select></div></div>' +
    '<div class="field" id="rd-tf"><label class="f">ชื่อเอกสาร/หลักสูตร</label><input class="inp" id="rd-ti" value="' + esc(r.title || '') + '"></div>' +
    '<div class="grid g2"><div class="field"><label class="f">เลขที่</label><input class="inp" id="rd-no" value="' + esc(r.docNo || '') + '"></div><div class="field"><label class="f">หน่วยงานที่ออก</label><input class="inp" id="rd-is" value="' + esc(r.issuer || '') + '"></div>' +
    '<div class="field"><label class="f">วันที่ออก</label><input class="inp" type="date" id="rd-id" value="' + esc(r.issueDate || '') + '"></div><div class="field"><label class="f">วันหมดอายุ</label><input class="inp" type="date" id="rd-ed" value="' + esc(r.expiryDate || '') + '"><div class="help" id="rd-edt">' + (r.expiryDate ? '= ' + thDateFull(r.expiryDate) : '') + '</div></div></div>' +
    '<label class="chk"><input type="checkbox" id="rd-l"' + (r.lifetime ? ' checked' : '') + '> ตลอดชีพ (ไม่มีวันหมดอายุ)</label>' +
    '<div class="field"><label class="f">หมายเหตุ</label><input class="inp" id="rd-n" value="' + esc(r.note || '') + '"></div>' + (isNew ? '' : '<div class="field"><label class="f">เหตุผลที่แก้ไข *</label><input class="inp" id="rd-r" placeholder="เช่น ตรวจกับเว็บสภาวิชาชีพแล้ว"></div>'),
    buttons: [{ label: 'ยกเลิก' }, { label: ic('check') + ' บันทึก', cls: 'primary', onClick: function () {
      if (!isNew && !$('#rd-r').value.trim()) { toast('กรุณาระบุเหตุผลที่แก้ไข', 'warn'); return false; }
      return api('saveRecord', { id: r.id || '', empCode: r.empCode || emp, typeId: $('#rd-t').value, profId: $('#rd-p').value, title: $('#rd-ti').value, docNo: $('#rd-no').value, issuer: $('#rd-is').value, issueDate: $('#rd-id').value, expiryDate: $('#rd-ed').value, lifetime: $('#rd-l').checked, note: $('#rd-n').value, reason: isNew ? 'เพิ่มโดยผู้ดูแล' : $('#rd-r').value })
        .then(function () { toast('บันทึกแล้ว', 'ok'); if (done) done(); });
    } }],
    onOpen: function (el) {
      var sync = function () { var t = $('#rd-t', el).value; $('#rd-pf', el).classList.toggle('hide', t !== 'LIC'); $('#rd-tf', el).classList.toggle('hide', t === 'LIC'); };
      $('#rd-t', el).onchange = sync; sync();
      $('#rd-ed', el).oninput = function () { $('#rd-edt', el).textContent = this.value ? '= ' + thDateFull(this.value) : ''; };
    } });
}
function personDialog(p, done) {
  modal({ title: 'แก้ไขข้อมูลบุคลากร', body: '<div class="note info">' + ic('info') + '<div class="small">ข้อมูลหลักซิงก์จาก HR Connect ทุกคืน — ควรแก้ที่ HR Connect · อีเมลที่กรอกที่นี่จะถูกแทนเมื่อ HR Connect มีอีเมล</div></div>' +
    '<div class="field mt12"><label class="f">อีเมล</label><input class="inp" id="pe-em" type="email" value="' + esc(p.email || '') + '"></div>' +
    '<div class="field"><label class="f">สถานะ</label><select class="inp" id="pe-st">' + Object.keys(PS_TH).map(function (k) { return '<option value="' + k + '"' + (k === p.status ? ' selected' : '') + '>' + PS_TH[k] + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label class="f">หมายเหตุ</label><input class="inp" id="pe-n" value="' + esc(p.note || '') + '"></div>',
    buttons: [{ label: 'ยกเลิก' }, { label: 'บันทึก', cls: 'primary', onClick: function () { return api('savePerson', { empCode: p.empCode, email: $('#pe-em').value.trim(), status: $('#pe-st').value, note: $('#pe-n').value }).then(function () { toast('บันทึกแล้ว', 'ok'); done(); }); } }] });
}

/* ---------------------------------------------------------------- ตรวจสอบเอกสาร */
PAGES.review = function (parts) {
  var st = 'PENDING';
  var pg = shell('ตรวจสอบเอกสาร', 'ตรวจความถูกต้องของสำเนาที่บุคลากรส่งมา ก่อนอนุมัติและบันทึกลงทะเบียน', '<button class="btn" id="rv-in" title="ดึงไฟล์จากอีเมลตอบกลับตอนนี้">' + ic('mail') + ' ตรวจอีเมลตอนนี้</button>');
  var draw = function () {
    pg.innerHTML = '<div class="seg" id="rv-st"><button data-s="PENDING" class="' + (st === 'PENDING' ? 'on' : '') + '">รอตรวจสอบ</button><button data-s="APPROVED" class="' + (st === 'APPROVED' ? 'on' : '') + '">อนุมัติแล้ว</button><button data-s="REJECTED" class="' + (st === 'REJECTED' ? 'on' : '') + '">ส่งกลับแก้ไข</button></div><div id="rv-list" class="mt16">' + loadingHtml() + '</div>';
    $$('#rv-st button', pg).forEach(function (b) { b.onclick = function () { st = b.dataset.s; draw(); }; });
    var box = $('#rv-list', pg);
    api('listSubmissions', { status: st }).then(function (list) {
      if (!document.body.contains(box)) return;   // ผู้ใช้เปลี่ยนหน้าไปแล้ว
      S.subs = list;
      box.innerHTML = list.length ? '<div class="grid g3">' + list.map(function (s, i) {
        var bad = s.checks.filter(function (c) { return !c.ok; }).length;
        return '<div class="card rise kpi" style="animation-delay:' + Math.min(i, 12) * .03 + 's;color:var(--violet)" data-id="' + s.id + '"><div class="who">' + avatar(s.person.name) + '<div class="grow"><b>' + esc(s.person.name || s.empCode) + '</b><small>' + esc(s.empCode) + ' · ' + esc(s.person.position || '') + '</small></div></div>' +
          '<div class="small mt12" style="color:var(--ink)"><b>' + esc(s.title || s.typeName) + '</b></div><div class="tiny muted">' + ic('file') + ' ' + esc(s.fileName) + ' · ' + esc(CH_TH[s.channel]) + '</div><div class="tiny muted">ได้รับ ' + thDate(s.createdAt, true) + '</div>' +
          '<div class="row mt8">' + (s.status === 'PENDING' ? (bad ? '<span class="chip SOON">' + ic('alert') + ' ข้อควรระวัง ' + bad + '</span>' : '<span class="chip VALID">' + ic('check') + ' ผ่านการตรวจอัตโนมัติ</span>') : '<span class="chip ' + s.status + '">' + SUB_TH[s.status] + '</span><span class="tiny muted">' + thDate(s.reviewedAt, true) + '</span>') + '</div></div>';
      }).join('') + '</div>' : '<div class="card">' + emptyHtml(st === 'PENDING' ? 'ไม่มีเอกสารรอตรวจสอบ' : 'ยังไม่มีรายการ', 'inbox') + '</div>';
      $$('[data-id]', pg).forEach(function (c) { c.onclick = function () { reviewDialog(S.subs.filter(function (s) { return s.id === c.dataset.id; })[0], draw); }; });
      if (parts[0]) { var s0 = list.filter(function (s) { return s.id === parts[0]; })[0]; parts[0] = ''; if (s0) reviewDialog(s0, draw); }
    }).catch(function (e) { box.innerHTML = emptyHtml(e.message, 'alert'); });
  };
  draw();
  $('#rv-in').onclick = function () { var b = this; busy(b, true); api('runInbox').then(function (r) { busy(b, false); toast('ตรวจอีเมล ' + r.threads + ' เรื่อง · รับไฟล์ใหม่ ' + r.files + (r.skipped ? ' · ข้าม ' + r.skipped : ''), 'ok'); draw(); refreshBadge(); }).catch(function (e) { busy(b, false); errToast(e); }); };
};
function reviewDialog(s, done) {
  var cur = s.current, lic = s.typeId === 'LIC', open = s.status === 'PENDING';
  var checks = ['ชื่อ-สกุลในเอกสารตรงกับบุคลากร', lic ? 'เลขที่ใบอนุญาต/วิชาชีพตรงกับเอกสาร' : 'ชื่อหลักสูตร/เอกสารตรงกับที่กรอก', 'มีลายมือชื่อ "รับรองสำเนาถูกต้อง" และวันที่', 'ไฟล์ชัดเจน อ่านออก ไม่ถูกตัดขอบ'];
  var body = '<div class="review"><div><div class="preview" id="rv-f">' + loadingHtml('กำลังเปิดไฟล์…') + '</div><div class="row mt8" id="rv-fa"></div></div><div>' +
    '<div class="who">' + avatar(s.person.name) + '<div><b>' + esc(s.person.name || s.empCode) + '</b><small>' + esc(s.empCode) + ' · ' + esc(s.person.position || '') + ' · ' + esc(s.person.division || '') + '</small></div></div>' +
    '<div class="tiny muted mt8">' + esc(CH_TH[s.channel]) + (s.fromEmail ? ' · ' + esc(s.fromEmail) : '') + ' · ' + thDate(s.createdAt, true) + '</div>' + (s.note ? '<div class="note info mt8">' + ic('mail') + '<div class="small">' + esc(s.note) + '</div></div>' : '') +
    '<h4 class="mt12" style="font-size:14px">ตรวจอัตโนมัติ</h4>' + s.checks.map(function (c) { return '<div class="small" style="padding:3px 0;color:' + (c.ok ? 'var(--ink)' : 'var(--exp)') + '">' + (c.ok ? '✅' : '⚠️') + ' ' + esc(c.t) + '</div>'; }).join('') +
    (cur ? '<div class="cmp mt12"><div><small>ในทะเบียนปัจจุบัน</small><b>' + esc(cur.docNo || '-') + '</b></div><div><small>หมดอายุเดิม</small><b>' + (cur.lifetime ? 'ตลอดชีพ' : thDate(cur.expiryDate)) + '</b></div><div><small>วิชาชีพ</small><b>' + esc(s.profName || cur.profName || '-') + '</b></div><div><small>ผู้ส่งแจ้งหมดอายุ</small><b>' + thDate(s.expiryDate) + '</b></div></div>' : '') +
    (s.verifyUrl ? '<a class="btn sm mt8" href="' + esc(s.verifyUrl) + '" target="_blank" rel="noopener">' + ic('link') + ' ตรวจกับเว็บ' + esc(s.council || 'สภาวิชาชีพ') + '</a>' : '') +
    (open ? '<h4 class="mt12" style="font-size:14px">เช็กลิสต์ผู้ตรวจ (ติ๊กครบก่อนอนุมัติ)</h4>' + checks.map(function (c, i) { return '<label class="chk"><input type="checkbox" class="rv-c" value="' + i + '"> ' + c + '</label>'; }).join('') +
      '<div class="grid g2 mt8">' + (lic ? '' : '<div class="field" style="grid-column:1/-1"><label class="f">ชื่อเอกสาร/หลักสูตร</label><input class="inp" id="rv-ti" value="' + esc(s.title || '') + '"></div>') +
      '<div class="field"><label class="f">เลขที่' + (lic ? 'ใบอนุญาต *' : '') + '</label><input class="inp" id="rv-no" value="' + esc(s.docNo || (cur && cur.docNo) || '') + '"></div>' +
      '<div class="field"><label class="f">วันที่ออก</label><input class="inp" type="date" id="rv-id" value="' + esc(s.issueDate || '') + '"></div>' +
      '<div class="field"><label class="f">วันหมดอายุ (ตามเอกสาร)' + (docType(s.typeId).hasExpiry === 'TRUE' ? ' *' : '') + '</label><input class="inp" type="date" id="rv-ed" value="' + esc(s.expiryDate || '') + '"><div class="help" id="rv-edt">' + (s.expiryDate ? '= ' + thDateFull(s.expiryDate) : '') + '</div></div>' +
      '<div class="field"><label class="f">&nbsp;</label><label class="chk" style="margin:0"><input type="checkbox" id="rv-l"' + (cur && cur.lifetime ? ' checked' : '') + '> ตลอดชีพ</label></div></div>' +
      '<label class="chk"><input type="checkbox" id="rv-old"> ยืนยันใช้วันที่นี้แม้เก่ากว่าในทะเบียน</label>' +
      '<div class="field"><label class="f">หมายเหตุ / เหตุผลที่ส่งกลับ</label><textarea class="inp" id="rv-r" rows="2" placeholder="กรณีส่งกลับ ต้องระบุ เช่น ไม่มีลายเซ็นรับรองสำเนา"></textarea></div>'
      : '<div class="note ' + (s.status === 'APPROVED' ? 'ok' : 'warn') + ' mt12">' + ic('info') + '<div>' + SUB_TH[s.status] + ' โดย ' + esc(s.reviewer) + ' · ' + thDate(s.reviewedAt, true) + (s.reason ? '<br>' + esc(s.reason) : '') + '</div></div>') + '</div></div>';
  var m = modal({ title: (open ? 'ตรวจสอบ: ' : '') + esc(s.title || s.typeName), wide: true, body: body, sticky: open,
    buttons: open ? [{ label: ic('undo') + ' ส่งกลับแก้ไข', cls: 'danger', onClick: function () {
      var r = $('#rv-r').value.trim(); if (!r) { toast('กรุณาระบุเหตุผลที่ส่งกลับ', 'warn'); $('#rv-r').focus(); return false; }
      return api('reviewSubmission', { id: s.id, decision: 'reject', reason: r }).then(function () { toast('ส่งกลับแล้ว แจ้งบุคลากรทางอีเมล', 'ok'); refreshBadge(); done(); });
    } }, { label: ic('check') + ' อนุมัติและบันทึกลงทะเบียน', cls: 'ok', id: 'rv-ok', onClick: function () {
      if ($$('.rv-c').some(function (c) { return !c.checked; })) { toast('กรุณาติ๊กเช็กลิสต์ให้ครบ', 'warn'); return false; }
      var exp = $('#rv-ed').value, life = $('#rv-l').checked;
      return api('reviewSubmission', { id: s.id, decision: 'approve', docNo: $('#rv-no').value.trim(), title: $('#rv-ti') ? $('#rv-ti').value.trim() : '', issueDate: $('#rv-id').value, expiryDate: exp, lifetime: life, allowOlder: $('#rv-old').checked, note: $('#rv-r').value.trim(), checklist: 'ครบ 4 ข้อ' })
        .then(function () { toast('อนุมัติแล้ว · บันทึกลงทะเบียน · แจ้งบุคลากรทางอีเมล', 'ok', 5000); confetti(); refreshBadge(); done(); });
    } }] : [{ label: 'ปิด' }],
    onOpen: function (el) { if ($('#rv-ed', el)) $('#rv-ed', el).oninput = function () { $('#rv-edt', el).textContent = this.value ? '= ' + thDateFull(this.value) : ''; }; } });
  api('getFile', { subId: s.id }).then(function (f) {
    var url = showFileIn($('#rv-f', m.el), f);
    $('#rv-fa', m.el).innerHTML = '<a class="btn sm" href="' + url + '" target="_blank" rel="noopener">' + ic('eye') + ' เปิดแท็บใหม่</a><a class="btn sm" href="' + url + '" download="' + esc(f.name) + '">' + ic('download') + ' ดาวน์โหลด</a>';
  }).catch(function (e) { $('#rv-f', m.el).innerHTML = emptyHtml(e.message, 'alert'); });
}

/* ---------------------------------------------------------------- ประวัติการใช้งาน */
var AUDIT_TH = { LOGIN: 'เข้าสู่ระบบ', SUBMIT: 'ส่งเอกสาร', SUBMIT_CANCEL: 'ยกเลิกเอกสาร', REVIEW_APPROVE: 'อนุมัติ', REVIEW_REJECT: 'ส่งกลับ', RECORD_SAVE: 'แก้ทะเบียน', RECORD_DELETE: 'ลบเอกสาร', IMPORT: 'นำเข้า Excel', EXPORT: 'ส่งออก',
  MAIL_DAILY: 'ส่งอีเมลรายวัน', MAIL_MANUAL: 'ส่งอีเมลเอง', SYNC_PEOPLE: 'ซิงก์บุคลากร', SETTINGS_SAVE: 'ตั้งค่า', ADMIN_SAVE: 'ผู้ดูแล', ADMIN_DELETE: 'ถอดผู้ดูแล', DOCTYPE_SAVE: 'ประเภทเอกสาร', PROF_SAVE: 'วิชาชีพ', POSMAP_SAVE: 'ตำแหน่ง', TPL_SAVE: 'แม่แบบอีเมล', TPL_RESET: 'คืนค่าแม่แบบ', INBOX_FILE: 'รับไฟล์จากอีเมล', INBOX_NOFILE: 'อีเมลไม่มีไฟล์', PERSON_SAVE: 'แก้ข้อมูลบุคคล' };
PAGES.audit = function () {
  var pg = shell('ประวัติการใช้งาน', 'บันทึกการกระทำทั้งหมด 500 รายการล่าสุด (ตรวจสอบย้อนหลังได้)');
  pg.innerHTML = loadingHtml();
  api('listAudit', { limit: 500 }).then(function (rows) {
    pg.innerHTML = '<div class="filters"><div class="search">' + ic('search') + '<input class="inp" id="au-q" placeholder="ค้นหารหัส / การกระทำ / รายละเอียด"></div></div><div class="tbl" id="au-t"></div>';
    var draw = function (q) {
      var list = rows.filter(function (r) { return !q || JSON.stringify(r).toLowerCase().indexOf(q) >= 0 || (AUDIT_TH[r.action] || '').indexOf(q) >= 0; });
      $('#au-t').innerHTML = '<table class="t cards"><thead><tr><th>เวลา</th><th>ผู้กระทำ</th><th>การกระทำ</th><th>เป้าหมาย</th><th>รายละเอียด</th></tr></thead><tbody>' + list.map(function (r) {
        return '<tr><td data-l="เวลา" class="nowrap">' + thDate(r.ts, true) + '</td><td data-l="ผู้กระทำ">' + esc(r.actor) + '</td><td data-l="การกระทำ"><span class="chip gray">' + esc(AUDIT_TH[r.action] || r.action) + '</span></td><td data-l="เป้าหมาย">' + esc(r.target) + '</td><td data-l="รายละเอียด" class="tiny" style="max-width:420px;word-break:break-word">' + esc(String(r.detail).slice(0, 300)) + '</td></tr>';
      }).join('') + '</tbody></table>';
    };
    draw(''); $('#au-q').oninput = debounce(function () { draw(this.value.trim().toLowerCase()); }, 200);
  }).catch(function (e) { pg.innerHTML = emptyHtml(e.message, 'alert'); });
};
