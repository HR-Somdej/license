/* SOMDEJ License — pages-settings.js : ตั้งค่า (การแจ้งเตือน · แม่แบบอีเมล · ประเภทเอกสาร · วิชาชีพ · ตำแหน่ง · ผู้ดูแล · การเชื่อมต่อ) */
PAGES.settings = function (parts) {
  var tab = parts[0] || 'notify';
  var pg = shell('ตั้งค่า', isSuper() ? 'ผู้ดูแลสูงสุดแก้ได้ทุกหัวข้อ' : 'ผู้ดูแล (HR) แก้ประเภทเอกสารและตำแหน่งได้ · หัวข้ออื่นดูได้อย่างเดียว');
  pg.innerHTML = loadingHtml();
  api('getSettings').then(function (d) {
    S.set = d;
    var tabs = [['notify', 'การแจ้งเตือน'], ['tpl', 'แม่แบบอีเมล'], ['types', 'ประเภทเอกสาร'], ['pos', 'ตำแหน่ง → วิชาชีพ'], ['prof', 'วิชาชีพ'], ['admins', 'ผู้ดูแล'], ['sys', 'การเชื่อมต่อ']];
    pg.innerHTML = '<div class="seg" id="st-tab">' + tabs.map(function (t) { return '<button data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="st-b" class="mt16"></div>';
    var go = function (t) { $$('#st-tab button', pg).forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); }); ST_TABS[t]($('#st-b', pg), d); };
    $$('#st-tab button', pg).forEach(function (b) { b.onclick = function () { history.replaceState(null, '', '#/settings/' + b.dataset.t); go(b.dataset.t); }; });
    go(ST_TABS[tab] ? tab : 'notify');
  }).catch(function (e) { pg.innerHTML = emptyHtml(e.message, 'alert'); });
};
function sInp(k, label, help, type) { var v = S.set.settings[k]; return '<div class="field"><label class="f">' + label + '</label><input class="inp" data-k="' + k + '" type="' + (type || 'text') + '" value="' + esc(v) + '"' + (isSuper() ? '' : ' disabled') + '>' + (help ? '<div class="help">' + help + '</div>' : '') + '</div>'; }
function sTog(k, label, help) { return '<label class="chk"><input type="checkbox" data-k="' + k + '" data-b="1"' + (S.set.settings[k] === 'TRUE' ? ' checked' : '') + (isSuper() ? '' : ' disabled') + '> <span><b>' + label + '</b>' + (help ? '<br><span class="tiny muted">' + help + '</span>' : '') + '</span></label>'; }
function saveSet(el, extra) {
  var o = {}; $$('[data-k]', el).forEach(function (i) { o[i.dataset.k] = i.dataset.b ? (i.checked ? 'TRUE' : 'FALSE') : i.value.trim(); });
  return api('saveSettings', Object.assign({ settings: o }, extra || {})).then(function () { toast('บันทึกการตั้งค่าแล้ว', 'ok'); return api('bootstrap').then(applyBoot); });
}
var ST_TABS = {
  notify: function (el) {
    el.innerHTML = '<div class="grid g2"><div class="card"><h3>' + ic('mail') + ' การส่งอีเมลแจ้งเตือน</h3>' +
      sTog('autoSend', 'ส่งอีเมลแจ้งเตือนอัตโนมัติทุกวัน', 'ปิดไว้ก่อนจนกว่าทะเบียนจะเป็นปัจจุบัน (ใช้ "รอบขอสำเนาตั้งต้น" ก่อน)') +
      sInp('remindDays', 'แจ้งครั้งที่ 1 / เตือนซ้ำ (วันก่อนหมดอายุ)', 'คั่นด้วย , เช่น 180,90 · ไฟล์ HR ระบุ "ยื่นต่ออายุล่วงหน้าประมาณ 6 เดือน"') +
      sInp('autoN2MaxDays', 'ส่งครั้งที่ 2 อัตโนมัติ เฉพาะที่หมดอายุไม่เกิน (วัน)', 'หมดอายุนานกว่านี้ ข้อมูลอาจเก่า — ระบบข้ามไว้ให้ผู้ดูแลตรวจเอง', 'number') +
      sTog('ccHeadOnN2', 'ครั้งที่ 2 ส่งสำเนาหัวหน้าฝ่าย/หน่วย', 'ใช้รายชื่อหัวหน้าและอีเมลจาก HR Connect') +
      sTog('sendAck', 'ตอบรับอัตโนมัติเมื่อได้รับไฟล์') + sTog('mailNotFound', 'ส่งถึงผู้ที่ "ไม่พบใน SmartAPI" ด้วย') +
      sInp('maxPerRun', 'ส่งต่อรอบไม่เกิน (ฉบับ)', 'บัญชี Workspace ส่งได้ประมาณ 1,500 ฉบับ/วัน', 'number') + '</div>' +
      '<div class="card"><h3>' + ic('chart') + ' แดชบอร์ดและผู้รับสรุป</h3>' + sInp('soonDays', '"ใกล้หมดอายุ" = เหลือไม่เกิน (วัน)', 'ตามโจทย์: 90 วัน (3 เดือน)', 'number') +
      sInp('adminEmails', 'อีเมลผู้ดูแลที่รับสรุปเอกสารใหม่', 'คั่นด้วย , · ว่าง = อีเมลบัญชีที่ติดตั้งระบบ (' + esc(S.set.account) + ')') +
      sInp('replyTo', 'ตอบกลับไปที่อีเมล', 'ว่าง = บัญชีที่ติดตั้ง (ต้องเป็นกล่องที่ระบบอ่านไฟล์แนบ) · ไม่แนะนำให้เปลี่ยน') +
      sInp('supportPhone', 'เบอร์ติดต่อ HR') + sInp('announcement', 'ประกาศหน้าเข้าสู่ระบบ') + sTog('maintenance', 'ปิดปรับปรุงระบบชั่วคราว', 'ผู้ดูแลยังเข้าได้') + '</div></div>' +
      (isSuper() ? '<div class="row mt16"><button class="btn primary" id="sv">' + ic('check') + ' บันทึก</button></div>' : '');
    if ($('#sv', el)) $('#sv', el).onclick = function () { var b = this; busy(b, true); saveSet(el).then(function () { busy(b, false); }, function (e) { busy(b, false); errToast(e); }); };
  },
  tpl: function (el, d) {
    var vars = ['ชื่อ', 'เอกสาร', 'วิชาชีพ', 'สภาวิชาชีพ', 'เลขที่', 'วันหมดอายุ', 'เหลือกี่วัน', 'เลยกำหนดกี่วัน', 'ลิงก์', 'ผู้ติดต่อ', 'โรงพยาบาล', 'เหตุผล', 'อ้างอิง'];
    el.innerHTML = '<div class="note info">' + ic('info') + '<div class="small">ตัวแปร: ' + vars.map(function (v) { return '<code>{{' + v + '}}</code>'; }).join(' ') + '<br>ระบบต่อท้ายหัวข้อด้วยรหัสอ้างอิง [SOMDEJ License #R000123] ให้เอง (ใช้รับไฟล์ที่ตอบกลับ) · ลายเซ็นและปุ่มเปิดระบบใส่ให้อัตโนมัติ</div></div>' +
      d.templates.map(function (t) {
        return '<div class="card mt16"><h3>' + esc(t.name) + (t.custom ? ' <span class="chip LIFETIME">แก้ไขแล้ว</span>' : '') + '</h3><div class="field"><label class="f">หัวข้อ</label><input class="inp" id="tp-s-' + t.key + '" value="' + esc(t.subject) + '"' + (isSuper() ? '' : ' disabled') + '></div>' +
          '<div class="field"><label class="f">เนื้อหา</label><textarea class="inp" id="tp-b-' + t.key + '" rows="8"' + (isSuper() ? '' : ' disabled') + '>' + esc(t.body) + '</textarea></div><div class="row">' +
          (isSuper() ? '<button class="btn primary sm" data-sv="' + t.key + '">บันทึก</button>' + (t.custom ? '<button class="btn sm" data-rs="' + t.key + '">คืนค่าเริ่มต้น</button>' : '') : '') + '<button class="btn sm" data-ts="' + t.key + '">' + ic('send') + ' ส่งทดสอบถึงฉัน</button></div></div>';
      }).join('');
    $$('[data-sv]', el).forEach(function (b) { b.onclick = function () { var k = b.dataset.sv; api('saveTemplate', { key: k, subject: $('#tp-s-' + k).value, body: $('#tp-b-' + k).value }).then(function () { toast('บันทึกแม่แบบแล้ว', 'ok'); }).catch(errToast); }; });
    $$('[data-rs]', el).forEach(function (b) { b.onclick = function () { api('saveTemplate', { key: b.dataset.rs, reset: true }).then(function () { toast('คืนค่าเริ่มต้นแล้ว', 'ok'); PAGES.settings(['tpl']); }).catch(errToast); }; });
    $$('[data-ts]', el).forEach(function (b) { b.onclick = function () { promptBox('ส่งอีเมลทดสอบ', 'อีเมลปลายทาง (ว่าง = อีเมลของท่านในทะเบียน)', { required: false }).then(function (v) { if (v !== null) api('testTemplate', { key: b.dataset.ts, to: v }).then(function (r) { toast('ส่งทดสอบไป ' + r.to + ' แล้ว', 'ok'); }).catch(errToast); }); }; });
  },
  types: function (el, d) {
    var CAT = { LICENSE: 'ใบประกอบวิชาชีพ', CERT: 'ใบรับรองทักษะ (มีอายุ)', QUAL: 'วุฒิบัตร/อนุมัติบัตร', TRAINING: 'การอบรม', OTHER: 'อื่น ๆ' };
    el.innerHTML = '<div class="note info">' + ic('info') + '<div class="small">ใบรับรองอื่น ๆ นอกจากใบประกอบวิชาชีพ — ใช้เก็บประวัติและประกันคุณภาพบุคลากร · "แจ้งเตือน" = ใช้รอบอีเมลเดียวกับใบประกอบเมื่อใกล้หมดอายุ</div></div>' +
      '<div class="row mt12"><button class="btn primary" id="dt-add">' + ic('plus') + ' เพิ่มประเภทเอกสาร</button></div><div class="tbl mt12"><table class="t cards"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>หมวด</th><th>มีวันหมดอายุ</th><th>แจ้งเตือน</th><th>บุคลากรเพิ่มเองได้</th><th>สถานะ</th><th></th></tr></thead><tbody>' +
      d.docTypes.map(function (t) { return '<tr><td data-l="รหัส"><code>' + esc(t.id) + '</code></td><td data-l="ชื่อ"><b>' + esc(t.name) + '</b>' + (t.note ? '<div class="tiny muted">' + esc(t.note) + '</div>' : '') + '</td><td data-l="หมวด">' + esc(CAT[t.category] || t.category) + '</td><td data-l="หมดอายุ">' + (t.hasExpiry === 'TRUE' ? '✓' : '-') + '</td><td data-l="แจ้งเตือน">' + (t.remind === 'TRUE' ? '✓' : '-') + '</td><td data-l="เพิ่มเอง">' + (t.staffCanAdd !== 'FALSE' ? '✓' : '-') + '</td><td data-l="สถานะ">' + (t.active === 'FALSE' ? '<span class="chip gray">ปิด</span>' : '<span class="chip VALID">ใช้งาน</span>') + '</td><td class="wh right"><button class="btn sm" data-dt="' + t.id + '">' + ic('edit') + '</button></td></tr>'; }).join('') + '</tbody></table></div>';
    var edit = function (t) {
      t = t || { hasExpiry: 'TRUE', remind: 'FALSE', staffCanAdd: 'TRUE', category: 'CERT' };
      modal({ title: t.id ? 'แก้ไขประเภทเอกสาร' : 'เพิ่มประเภทเอกสาร', body: '<div class="grid g2"><div class="field"><label class="f">รหัส (อังกฤษ)</label><input class="inp" id="dt-id" value="' + esc(t.id || '') + '"' + (t.id ? ' disabled' : '') + ' placeholder="เช่น ECG"></div>' +
        '<div class="field"><label class="f">หมวด</label><select class="inp" id="dt-c">' + Object.keys(CAT).filter(function (k) { return k !== 'LICENSE' || t.id === 'LIC'; }).map(function (k) { return '<option value="' + k + '"' + (k === t.category ? ' selected' : '') + '>' + CAT[k] + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="field"><label class="f">ชื่อ</label><input class="inp" id="dt-n" value="' + esc(t.name || '') + '"></div><div class="field"><label class="f">หมายเหตุ</label><input class="inp" id="dt-no" value="' + esc(t.note || '') + '"></div>' +
        '<label class="chk"><input type="checkbox" id="dt-e"' + (t.hasExpiry === 'TRUE' ? ' checked' : '') + '> มีวันหมดอายุ</label><label class="chk"><input type="checkbox" id="dt-r"' + (t.remind === 'TRUE' ? ' checked' : '') + '> ส่งอีเมลแจ้งเตือนเมื่อใกล้หมดอายุ</label>' +
        '<label class="chk"><input type="checkbox" id="dt-s"' + (t.staffCanAdd !== 'FALSE' ? ' checked' : '') + '> บุคลากรเพิ่มเองได้</label><label class="chk"><input type="checkbox" id="dt-a"' + (t.active !== 'FALSE' ? ' checked' : '') + (t.id === 'LIC' ? ' disabled' : '') + '> เปิดใช้งาน</label>',
        buttons: [{ label: 'ยกเลิก' }, { label: 'บันทึก', cls: 'primary', onClick: function () { return api('saveDocType', { id: t.id || $('#dt-id').value, name: $('#dt-n').value, category: $('#dt-c').value, note: $('#dt-no').value, hasExpiry: $('#dt-e').checked, remind: $('#dt-r').checked, staffCanAdd: $('#dt-s').checked ? 'TRUE' : 'FALSE', active: $('#dt-a').checked ? 'TRUE' : 'FALSE' }).then(function () { toast('บันทึกแล้ว', 'ok'); api('bootstrap').then(applyBoot); PAGES.settings(['types']); }); } }] });
    };
    $('#dt-add', el).onclick = function () { edit(null); };
    $$('[data-dt]', el).forEach(function (b) { b.onclick = function () { edit(d.docTypes.filter(function (t) { return t.id === b.dataset.dt; })[0]); }; });
  },
  pos: function (el, d) {
    var changed = {}, profs = S.boot.professions, q = '';
    el.innerHTML = '<div class="note info">' + ic('info') + '<div class="small">ตำแหน่งจาก HR Connect → วิชาชีพและการติดตามใบประกอบ · "ระบบจัดให้" = จัดอัตโนมัติจากชื่อตำแหน่ง ยังไม่มีผู้ยืนยัน · ตำแหน่ง (จิตอาสา) ไม่ติดตามเสมอ</div></div>' +
      '<div class="filters mt12"><div class="search">' + ic('search') + '<input class="inp" id="ps-q" placeholder="ค้นหาตำแหน่ง"></div><button class="btn primary" id="ps-sv" disabled>' + ic('check') + ' บันทึกที่เปลี่ยน (<span id="ps-n">0</span>)</button></div><div class="tbl" id="ps-t"></div>';
    var draw = function () {
      $('#ps-t', el).innerHTML = '<table class="t cards"><thead><tr><th>ตำแหน่ง</th><th class="right">คน</th><th>วิชาชีพ</th><th>การติดตาม</th></tr></thead><tbody>' + d.positions.filter(function (p) { return !q || p.position.indexOf(q) >= 0; }).map(function (p) {
        var c = changed[p.position] || p;
        return '<tr><td class="wh"><b>' + esc(p.position) + '</b>' + (p.auto === 'TRUE' ? ' <span class="chip gray">ระบบจัดให้</span>' : '') + '</td><td data-l="คน" class="right num">' + nf(p.count) + '</td>' +
          '<td data-l="วิชาชีพ"><select class="inp ps-p" data-p="' + esc(p.position) + '" style="min-width:170px"><option value="">-</option>' + profs.map(function (x) { return '<option value="' + x.id + '"' + (x.id === c.profId ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></td>' +
          '<td data-l="ติดตาม"><select class="inp ps-m" data-p="' + esc(p.position) + '">' + Object.keys(MODE_TH).map(function (k) { return '<option value="' + k + '"' + (k === c.mode ? ' selected' : '') + '>' + MODE_TH[k] + '</option>'; }).join('') + '</select></td></tr>';
      }).join('') + '</tbody></table>';
      $$('.ps-p,.ps-m', el).forEach(function (s) { s.onchange = function () { var pos = s.dataset.p, row = $$('[data-p]', el).filter(function (x) { return x.dataset.p === pos; }); changed[pos] = { position: pos, profId: row[0].value, mode: row[1].value }; $('#ps-n', el).textContent = Object.keys(changed).length; $('#ps-sv', el).disabled = false; }; });
    };
    draw();
    $('#ps-q', el).oninput = debounce(function () { q = this.value.trim(); draw(); }, 200);
    $('#ps-sv', el).onclick = function () { var items = Object.keys(changed).map(function (k) { return changed[k]; }); api('savePositionMap', { items: items }).then(function () { toast('บันทึก ' + items.length + ' ตำแหน่งแล้ว', 'ok'); S.reg = null; PAGES.settings(['pos']); }).catch(errToast); };
  },
  prof: function (el, d) {
    el.innerHTML = '<div class="note info">' + ic('info') + '<div class="small">จากตาราง "ตำแหน่งที่มีใบประกอบ" ของ HR · ลิงก์เว็บสภาวิชาชีพแสดงในหน้าตรวจเอกสาร — กรุณาตรวจลิงก์ก่อนใช้</div></div>' + (isSuper() ? '<div class="row mt12"><button class="btn primary" id="pf-add">' + ic('plus') + ' เพิ่มวิชาชีพ</button></div>' : '') +
      '<div class="tbl mt12"><table class="t cards"><thead><tr><th>วิชาชีพ</th><th>ใบอนุญาต</th><th>หน่วยงานที่ออก</th><th>ต่ออายุ</th><th>ลิงก์ตรวจสอบ</th><th></th></tr></thead><tbody>' + d.professions.map(function (p) {
        return '<tr><td class="wh"><b>' + esc(p.name) + '</b> <code class="tiny">' + esc(p.id) + '</code>' + (p.note ? '<div class="tiny muted">' + esc(p.note) + '</div>' : '') + '</td><td data-l="ใบอนุญาต" class="small">' + esc(p.licenseName) + '</td><td data-l="ผู้ออก" class="small">' + esc(p.council) + '</td><td data-l="ต่ออายุ">' + (p.renew === 'LIFE' ? 'ตลอดชีพ' : '5 ปี') + '</td><td data-l="ลิงก์" class="small">' + (p.verifyUrl ? '<a href="' + esc(p.verifyUrl) + '" target="_blank" rel="noopener">' + esc(p.verifyUrl.replace(/^https?:\/\//, '').slice(0, 30)) + '</a>' : '-') + '</td><td class="wh right">' + (isSuper() ? '<button class="btn sm" data-pf="' + p.id + '">' + ic('edit') + '</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    var edit = function (p) {
      p = p || { renew: 'YEARS5' };
      modal({ title: p.id ? 'แก้ไขวิชาชีพ' : 'เพิ่มวิชาชีพ', body: '<div class="grid g2"><div class="field"><label class="f">รหัส (อังกฤษ)</label><input class="inp" id="pf-id" value="' + esc(p.id || '') + '"' + (p.id ? ' disabled' : '') + '></div><div class="field"><label class="f">ชื่อวิชาชีพ</label><input class="inp" id="pf-n" value="' + esc(p.name || '') + '"></div></div>' +
        '<div class="field"><label class="f">ชื่อใบอนุญาต</label><input class="inp" id="pf-l" value="' + esc(p.licenseName || '') + '"></div><div class="field"><label class="f">หน่วยงานที่ออก (สภาวิชาชีพ)</label><input class="inp" id="pf-c" value="' + esc(p.council || '') + '"></div>' +
        '<div class="grid g2"><div class="field"><label class="f">ต่ออายุ</label><select class="inp" id="pf-r"><option value="YEARS5"' + (p.renew !== 'LIFE' ? ' selected' : '') + '>ทุก 5 ปี</option><option value="LIFE"' + (p.renew === 'LIFE' ? ' selected' : '') + '>ตลอดชีพ</option></select></div><div class="field"><label class="f">ลิงก์เว็บตรวจสอบ</label><input class="inp" id="pf-u" value="' + esc(p.verifyUrl || '') + '" placeholder="https://"></div></div>' +
        '<div class="field"><label class="f">หมายเหตุ</label><input class="inp" id="pf-no" value="' + esc(p.note || '') + '"></div>',
        buttons: [{ label: 'ยกเลิก' }, { label: 'บันทึก', cls: 'primary', onClick: function () { return api('saveProfession', { id: p.id || $('#pf-id').value, name: $('#pf-n').value, licenseName: $('#pf-l').value, council: $('#pf-c').value, renew: $('#pf-r').value, verifyUrl: $('#pf-u').value, note: $('#pf-no').value }).then(function () { toast('บันทึกแล้ว', 'ok'); api('bootstrap').then(applyBoot); PAGES.settings(['prof']); }); } }] });
    };
    if ($('#pf-add', el)) $('#pf-add', el).onclick = function () { edit(null); };
    $$('[data-pf]', el).forEach(function (b) { b.onclick = function () { edit(d.professions.filter(function (p) { return p.id === b.dataset.pf; })[0]); }; });
  },
  admins: function (el) {
    el.innerHTML = loadingHtml();
    api('listAdmins').then(function (list) {
      el.innerHTML = '<div class="note info">' + ic('info') + '<div class="small">ผู้ดูแลเข้าด้วยบัญชี HR Connect และต้องตั้งรหัสผ่านใน HR Connect แล้ว · หัวหน้าฝ่าย/หน่วยอ่านจาก HR Connect อัตโนมัติ (ไม่ต้องเพิ่มที่นี่)</div></div>' +
        (isSuper() ? '<div class="row mt12"><button class="btn primary" id="ad-add">' + ic('plus') + ' เพิ่มผู้ดูแล</button></div>' : '') +
        '<div class="tbl mt12"><table class="t cards"><thead><tr><th>ผู้ดูแล</th><th>บทบาท</th><th>สถานะ</th><th>หมายเหตุ</th><th></th></tr></thead><tbody>' + list.map(function (a) {
          return '<tr><td class="wh"><div class="who">' + avatar(a.name || a.empCode) + '<div><b>' + esc(a.name || '(ยังไม่ซิงก์ชื่อ)') + '</b><small>' + esc(a.empCode) + (a.position ? ' · ' + esc(a.position) : '') + '</small></div></div></td><td data-l="บทบาท">' + (a.role === 'SUPER' ? 'ผู้ดูแลสูงสุด' : 'ผู้ดูแล (HR)') + '</td><td data-l="สถานะ">' + (a.active === 'FALSE' ? '<span class="chip gray">ปิด</span>' : '<span class="chip VALID">ใช้งาน</span>') + '</td><td data-l="หมายเหตุ" class="small">' + esc(a.note || '') + '</td>' +
            '<td class="wh right">' + (isSuper() && !a.fixed ? '<button class="btn sm" data-ae="' + a.empCode + '">' + ic('edit') + '</button><button class="btn sm ghost" data-ad="' + a.empCode + '">' + ic('trash') + '</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      var edit = function (a) {
        a = a || { role: 'ADMIN', active: 'TRUE' };
        modal({ title: a.empCode ? 'แก้ไขผู้ดูแล' : 'เพิ่มผู้ดูแล', body: '<div class="field"><label class="f">รหัสพนักงาน</label><input class="inp" id="ad-e" maxlength="7" inputmode="numeric" value="' + esc(a.empCode || '') + '"' + (a.empCode ? ' disabled' : '') + '></div>' +
          '<div class="field"><label class="f">บทบาท</label><select class="inp" id="ad-r"><option value="ADMIN"' + (a.role === 'ADMIN' ? ' selected' : '') + '>ผู้ดูแล (HR) — ทะเบียน ตรวจเอกสาร ส่งอีเมล นำเข้า/ส่งออก</option><option value="SUPER"' + (a.role === 'SUPER' ? ' selected' : '') + '>ผู้ดูแลสูงสุด — ทุกอย่าง + ตั้งค่า + ผู้ดูแล</option></select></div>' +
          '<div class="field"><label class="f">หมายเหตุ</label><input class="inp" id="ad-n" value="' + esc(a.note || '') + '"></div><label class="chk"><input type="checkbox" id="ad-a"' + (a.active !== 'FALSE' ? ' checked' : '') + '> เปิดใช้งาน</label>',
          buttons: [{ label: 'ยกเลิก' }, { label: 'บันทึก', cls: 'primary', onClick: function () { return api('saveAdmin', { empCode: a.empCode || $('#ad-e').value.trim(), role: $('#ad-r').value, note: $('#ad-n').value, active: $('#ad-a').checked }).then(function (r) { toast(r.warn || 'บันทึกแล้ว', r.warn ? 'warn' : 'ok', 6000); ST_TABS.admins(el); }); } }] });
      };
      if ($('#ad-add', el)) $('#ad-add', el).onclick = function () { edit(null); };
      $$('[data-ae]', el).forEach(function (b) { b.onclick = function () { edit(list.filter(function (a) { return a.empCode === b.dataset.ae; })[0]); }; });
      $$('[data-ad]', el).forEach(function (b) { b.onclick = function () { confirmBox('ถอดสิทธิ์ผู้ดูแล', 'ถอดสิทธิ์รหัส ' + esc(b.dataset.ad) + ' ใช่หรือไม่ (มีผลทันที)', 'ถอดสิทธิ์', 'danger').then(function (y) { if (y) api('deleteAdmin', { empCode: b.dataset.ad }).then(function () { toast('ถอดสิทธิ์แล้ว', 'ok'); ST_TABS.admins(el); }).catch(errToast); }); }; });
    }).catch(function (e) { el.innerHTML = emptyHtml(e.message, 'alert'); });
  },
  sys: function (el, d) {
    var L = d.links, row = function (ok, t, h) { return '<div class="row" style="padding:7px 0;border-bottom:1px solid var(--line)">' + (ok ? '<span class="chip VALID">' + ic('check') + ' ตั้งแล้ว</span>' : '<span class="chip EXPIRED">ยังไม่ตั้ง</span>') + '<div><b class="small">' + t + '</b><div class="tiny muted">' + h + '</div></div></div>'; };
    el.innerHTML = '<div class="grid g2"><div class="card"><h3>' + ic('link') + ' การเชื่อมต่อ (Script Properties)</h3>' +
      row(L.HRC_DB_ID, 'HRC_DB_ID', 'ฐานข้อมูล HR Connect (รายชื่อ · รหัสผ่าน · หัวหน้า)') + row(L.HRC_PW_PEPPER, 'HRC_PW_PEPPER', 'เข้าด้วยรหัสผ่าน HR Connect') + row(L.HRC_TOKEN_SECRET, 'HRC_TOKEN_SECRET', 'เข้าต่อจาก HR Connect อัตโนมัติ') +
      row(L.SMARTAPI, 'SMARTAPI_USER / PASS', 'ตรวจสถานะบุคลากรทุกคืน · เข้าด้วยเลขบัตร') + row(L.FILES_FOLDER_ID, 'FILES_FOLDER_ID', 'โฟลเดอร์เก็บไฟล์ใน Google Drive (สร้างอัตโนมัติ)') +
      '<div class="row mt12">' + (isSuper() ? '<button class="btn" id="sy-t">' + ic('refresh') + ' ทดสอบการเชื่อมต่อ</button>' : '') + '</div><div id="sy-r" class="small mt8"></div></div>' +
      '<div class="card"><h3>' + ic('info') + ' ระบบ</h3><dl class="kv"><dt>รุ่นหลังบ้าน</dt><dd>' + esc(d.build) + '</dd><dt>รุ่นหน้าเว็บ</dt><dd>' + SL_BUILD + '</dd><dt>บัญชีที่ติดตั้ง</dt><dd>' + esc(d.account) + '</dd><dt>โควตาอีเมลวันนี้</dt><dd>' + nf(d.quota) + '</dd></dl>' +
      sInp('webUrl', 'ลิงก์หน้าเว็บระบบนี้') + sInp('hrcUrl', 'ลิงก์ HR Connect') + sInp('apiEmpPath', 'SmartAPI path (emp-info)', 'ตอนนี้ /uat/ · เปลี่ยนเมื่อได้ path production') +
      (isSuper() ? '<div class="row"><button class="btn primary" id="sy-sv">บันทึก</button><button class="btn danger" id="sy-out">ออกจากระบบทุกเครื่อง</button></div>' : '') + '</div></div>';
    if ($('#sy-t', el)) $('#sy-t', el).onclick = function () { var b = this; busy(b, true); api('testApi').then(function (r) { busy(b, false); $('#sy-r', el).innerHTML = '<div>HR Connect: ' + esc(r.hrc) + '</div><div>SmartAPI: ' + esc(r.api) + '</div>'; }).catch(function (e) { busy(b, false); errToast(e); }); };
    if ($('#sy-sv', el)) $('#sy-sv', el).onclick = function () { saveSet(el).catch(errToast); };
    if ($('#sy-out', el)) $('#sy-out', el).onclick = function () { confirmBox('ออกจากระบบทุกเครื่อง', 'ทุกคนต้องเข้าสู่ระบบใหม่ (ใช้เมื่อสงสัยว่ามีการเข้าใช้ไม่ถูกต้อง)', 'ยืนยัน', 'danger').then(function (y) { if (y) api('saveSettings', { settings: {}, bumpSession: true }).then(function () { logout(true); }).catch(errToast); }); };
  }
};
