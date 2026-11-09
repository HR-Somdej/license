/* SOMDEJ License — pages-me.js : หน้า "ใบประกอบและใบรับรองของฉัน" (บุคลากรทุกคน) */
function ring(st, days, size) {
  size = size || 76;
  var r = size / 2 - 6, c = 2 * Math.PI * r, col = ST_COLOR[st] || 'var(--nodata)';
  var pct = st === 'VALID' ? Math.min(1, (days || 0) / 1825) : st === 'SOON' ? Math.max(.06, (days || 0) / 365) : st === 'LIFETIME' || st === 'NOEXP' ? 1 : st === 'EXPIRED' ? 1 : 0;
  var center = st === 'LIFETIME' ? '<b>∞</b><span>ตลอดชีพ</span>' : st === 'NOEXP' ? '<b>✓</b><span>ไม่หมดอายุ</span>' : st === 'NODATA' ? '<b>?</b><span>ไม่มีข้อมูล</span>' :
    st === 'EXPIRED' ? '<b style="color:var(--exp)">' + nf(-days) + '</b><span>วันที่เลยมา</span>' : '<b>' + nf(days) + '</b><span>วันคงเหลือ</span>';
  return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg width="' + size + '" height="' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="var(--line)"/>' +
    '<circle class="rg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + col + '" stroke-linecap="round" stroke-dasharray="0 ' + c + '" data-d="' + (pct * c) + ' ' + c + '"/></svg><div class="c">' + center + '</div></div>';
}
function animRings(root) { requestAnimationFrame(function () { setTimeout(function () { $$('circle.rg', root).forEach(function (x) { x.setAttribute('stroke-dasharray', x.dataset.d); }); $$('circle.rg', root).forEach(function (x) { x.style.transition = 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)'; }); }, 40); }); }
var FLOW_STEPS = [['NOTIFY', 'แจ้งเตือน'], ['SEND', 'ส่งสำเนา'], ['REVIEW', 'HR ตรวจสอบ'], ['DONE', 'บันทึกแล้ว']];
function flowSteps(fl) {
  var cur = { NONE: -1, BASE: 0, N1: 0, R1: 0, N2: 0, REJECTED: 1, REVIEW: 2, DONE: 4 }[fl || 'NONE'];
  if (cur == null) cur = -1;
  return '<div class="steps">' + FLOW_STEPS.map(function (s, i) { var c = i < cur ? 'done' : i === cur ? 'cur' : ''; if (cur === 4) c = 'done'; return '<div class="s ' + c + '"><i>' + (c === 'done' ? '✓' : i + 1) + '</i>' + s[1] + '</div>'; }).join('') + '</div>';
}

PAGES.me = function () {
  var pg = shell('ใบประกอบและใบรับรองของฉัน', 'ตรวจสถานะ ส่งสำเนาฉบับใหม่ และเก็บประวัติใบรับรองของท่าน', '<button class="btn primary" id="me-add">' + ic('plus') + ' เพิ่มใบรับรอง</button>');
  pg.innerHTML = loadingHtml();
  $('#me-add').onclick = function () { uploadDialog({}); };
  api('myDocs').then(function (d) { S.my = d; renderMe(pg, d); }).catch(function (e) { pg.innerHTML = emptyHtml(e.message, 'alert'); });
};
function renderMe(pg, d) {
  var lic = d.records.filter(function (r) { return r.typeId === 'LIC'; })[0], others = d.records.filter(function (r) { return r.typeId !== 'LIC'; });
  var q = d.req, pend = d.submissions.filter(function (s) { return s.status === 'PENDING'; });
  var head = '<div class="card rise"><div class="row nw">' + avatar(d.person.name, 52) + '<div class="grow"><div style="font-size:18px;font-weight:700">' + esc(d.person.name || S.me.name) + '</div>' +
    '<div class="muted small">' + esc(d.person.position || '-') + ' · ' + esc(d.person.division || '-') + '</div>' +
    '<div class="tiny muted">อีเมลรับแจ้งเตือน: ' + (d.person.email ? esc(d.person.email) : '<b style="color:var(--exp)">ยังไม่มีในระบบ — แก้ได้ใน HR Connect</b>') + '</div></div></div></div>';
  var licCard;
  if (lic && (lic.docNo || lic.expiryDate || lic.lifetime)) {
    licCard = '<div class="card doc rise" style="animation-delay:.05s"><span class="band" style="background:' + (ST_COLOR[lic.st] || 'var(--line)') + '"></span><div class="head">' + ring(lic.st, lic.days) +
      '<div class="grow"><div class="tiny muted">' + esc(lic.profName || q.profName || 'ใบอนุญาตประกอบวิชาชีพ') + '</div><div style="font-size:17px;font-weight:700">' + esc(lic.licenseName || q.licenseName || 'ใบอนุญาตประกอบวิชาชีพ') + '</div>' +
      '<div class="row mt8">' + stChip(lic.st, lic.days) + (lic.flow && lic.flow !== 'NONE' ? flChip(lic.flow) : '') + '</div></div></div>' +
      '<dl class="kv mt16"><dt>เลขที่ใบอนุญาต</dt><dd>' + esc(lic.docNo || '-') + '</dd><dt>หน่วยงานที่ออก</dt><dd>' + esc(lic.issuer || q.council || '-') + '</dd>' +
      '<dt>วันที่ออก</dt><dd>' + thDateFull(lic.issueDate) + '</dd><dt>วันหมดอายุ</dt><dd>' + (lic.lifetime ? 'ตลอดชีพ' : thDateFull(lic.expiryDate)) + '</dd></dl>' +
      (lic.st === 'SOON' || lic.st === 'EXPIRED' || lic.flow === 'REJECTED' || lic.flow === 'REVIEW' ? flowSteps(lic.flow) : '') +
      (lic.flow === 'REJECTED' ? '<div class="note warn mt8">' + ic('alert') + '<div>HR ส่งกลับให้แก้ไข: ' + esc((d.submissions.filter(function (s) { return s.recordId === lic.id && s.status === 'REJECTED'; })[0] || {}).reason || '') + '</div></div>' : '') +
      (lic.st === 'SOON' || lic.st === 'EXPIRED' ? '<div class="note ' + (lic.st === 'EXPIRED' ? 'err' : 'warn') + ' mt8">' + ic('info') + '<div>' + (lic.st === 'EXPIRED' ? 'ใบอนุญาตหมดอายุแล้ว กรุณาต่ออายุโดยเร็ว' : 'ใกล้หมดอายุ ควรยื่นต่ออายุล่วงหน้า') + ' เมื่อได้ฉบับใหม่ ให้ลงนามรับรองสำเนาถูกต้องแล้วกด "ส่งสำเนาฉบับใหม่"</div></div>' : '') +
      '<div class="row mt16">' + (lic.flow === 'REVIEW' ? '<span class="chip REVIEW">' + ic('clock') + ' ส่งแล้ว รอ HR ตรวจสอบ</span>' : '<button class="btn primary" data-up="' + lic.id + '">' + ic('upload') + ' ส่งสำเนาฉบับใหม่</button>') +
      (lic.hasFile ? '<button class="btn" data-file="' + lic.id + '">' + ic('eye') + ' ดูสำเนาที่บันทึก</button>' : '') + '</div></div>';
  } else if (q.mode === 'REQUIRED' || lic) {
    licCard = '<div class="card doc rise" style="animation-delay:.05s"><span class="band" style="background:var(--nodata)"></span><div class="head">' + ring('NODATA', null) +
      '<div class="grow"><div class="tiny muted">' + esc(q.profName) + '</div><div style="font-size:17px;font-weight:700">' + esc(q.licenseName || 'ใบอนุญาตประกอบวิชาชีพ') + '</div><div class="row mt8">' + stChip('NODATA') + (lic && lic.flow !== 'NONE' ? flChip(lic.flow) : '') + '</div></div></div>' +
      '<p class="muted mt12">ทะเบียนยังไม่มีข้อมูลใบอนุญาตของท่าน กรุณาส่งสำเนาที่ลงนามรับรองสำเนาถูกต้อง เพื่อให้ HR บันทึก</p>' +
      '<button class="btn primary" data-up="' + (lic ? lic.id : 'LIC') + '">' + ic('upload') + ' ส่งสำเนาใบอนุญาต</button></div>';
  } else {
    licCard = '<div class="card rise" style="animation-delay:.05s"><div class="row nw">' + ic('info') + '<div><b>ตำแหน่งของท่านไม่ต้องมีใบอนุญาตประกอบวิชาชีพ</b><div class="muted small">หากท่านมีใบอนุญาตประกอบวิชาชีพ หรือใบรับรองอื่น ๆ สามารถเพิ่มไว้เป็นประวัติได้ที่ "เพิ่มใบรับรอง"</div></div></div>' +
      '<div class="row mt12"><button class="btn" data-up="LIC">' + ic('plus') + ' เพิ่มใบอนุญาตประกอบวิชาชีพ</button></div></div>';
  }
  var oth = '<div class="row between mt24"><h3 style="font-size:17px">' + ic('cert') + ' ใบรับรองและการอบรม (' + others.length + ')</h3><button class="btn sm" id="me-add2">' + ic('plus') + ' เพิ่ม</button></div>' +
    (others.length ? '<div class="grid g3 mt12">' + others.map(function (r, i) {
      return '<div class="card doc rise" style="animation-delay:' + (0.1 + i * .04) + 's"><span class="band" style="background:' + (ST_COLOR[r.st] || 'var(--line)') + '"></span><div class="tiny muted">' + esc(r.typeName) + '</div><div style="font-weight:700">' + esc(r.title || r.typeName) + '</div>' +
        '<div class="small muted">' + esc(r.issuer || '') + (r.docNo ? ' · เลขที่ ' + esc(r.docNo) : '') + '</div><div class="row mt8">' + stChip(r.st, r.days) + '</div>' +
        '<div class="small mt8">' + [r.issueDate ? 'ได้รับ ' + thDate(r.issueDate) : '', r.expiryDate ? 'หมดอายุ ' + thDate(r.expiryDate) : ''].filter(Boolean).join(' · ') + '</div>' +
        '<div class="row mt12">' + (r.flow === 'REVIEW' ? '<span class="chip REVIEW">รอตรวจ</span>' : '<button class="btn sm" data-up="' + r.id + '">' + ic('upload') + ' ส่งฉบับใหม่</button>') + (r.hasFile ? '<button class="btn sm ghost" data-file="' + r.id + '">' + ic('eye') + '</button>' : '') + '</div></div>';
    }).join('') + '</div>' : '<div class="card mt12">' + emptyHtml('ยังไม่มีใบรับรองอื่น · เพิ่มได้ เช่น BLS, ACLS, วุฒิบัตร, ใบรับรองการอบรม', 'cert') + '</div>');
  var hist = '<h3 style="font-size:17px" class="mt24">' + ic('history') + ' เอกสารที่ส่ง' + (pend.length ? ' <span class="chip REVIEW">รอตรวจ ' + pend.length + '</span>' : '') + '</h3>' +
    (d.submissions.length ? '<div class="tbl mt12"><table class="t cards"><thead><tr><th>วันที่ส่ง</th><th>เอกสาร</th><th>ช่องทาง</th><th>ผลการตรวจ</th><th></th></tr></thead><tbody>' + d.submissions.map(function (s) {
      return '<tr><td data-l="วันที่ส่ง">' + thDate(s.createdAt, true) + '</td><td data-l="เอกสาร">' + esc(s.title || s.typeName) + '<div class="tiny muted">' + esc(s.fileName) + '</div></td><td data-l="ช่องทาง">' + esc(CH_TH[s.channel] || s.channel) + '</td>' +
        '<td data-l="ผล"><span class="chip ' + s.status + '">' + SUB_TH[s.status] + '</span>' + (s.reason ? '<div class="tiny muted">' + esc(s.reason) + '</div>' : '') + '</td>' +
        '<td class="right wh">' + (s.hasFile ? '<button class="btn sm ghost" data-sfile="' + s.id + '" title="ดูไฟล์">' + ic('eye') + '</button>' : '') + (s.status === 'PENDING' ? '<button class="btn sm ghost" data-cancel="' + s.id + '">ยกเลิก</button>' : '') + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '<p class="muted">ยังไม่เคยส่งเอกสาร</p>');
  pg.innerHTML = head + '<div class="mt16">' + licCard + '</div>' + oth + hist;
  animRings(pg);
  $('#me-add2').onclick = function () { uploadDialog({}); };
  $$('[data-up]', pg).forEach(function (b) { b.onclick = function () { var id = b.dataset.up; var rec = d.records.filter(function (r) { return r.id === id; })[0]; uploadDialog(rec ? { rec: rec } : { typeId: 'LIC' }); }; });
  $$('[data-file]', pg).forEach(function (b) { b.onclick = function () { openFile({ recordId: b.dataset.file }); }; });
  $$('[data-sfile]', pg).forEach(function (b) { b.onclick = function () { openFile({ subId: b.dataset.sfile }); }; });
  $$('[data-cancel]', pg).forEach(function (b) { b.onclick = function () { confirmBox('ยกเลิกเอกสารที่ส่ง', 'ยกเลิกเอกสารนี้ (HR จะไม่ตรวจ) ใช่หรือไม่', 'ยกเลิกเอกสาร', 'danger').then(function (y) { if (y) api('cancelSubmission', { id: b.dataset.cancel }).then(function () { toast('ยกเลิกแล้ว', 'ok'); PAGES.me(); }).catch(errToast); }); }; });
}

/** ฟอร์มส่งเอกสาร · o: {rec} (ส่งฉบับใหม่ของเอกสารเดิม) หรือ {typeId} (เพิ่มใหม่) · o.empCode = ผู้ดูแลแนบแทน */
function uploadDialog(o) {
  var rec = o.rec || null, typeId = rec ? rec.typeId : (o.typeId || ''), admin = !!o.empCode;
  var types = (S.boot.docTypes || []).filter(function (t) { return admin || t.staffCanAdd !== 'FALSE'; });
  var lic = typeId === 'LIC', reqProf = S.my && S.my.req ? S.my.req : {};
  var file = null;
  var body = '<div class="field"><label class="f">ประเภทเอกสาร</label>' + (rec || typeId === 'LIC' ? '<div><b>' + esc(rec ? (rec.typeId === 'LIC' ? (rec.licenseName || 'ใบอนุญาตประกอบวิชาชีพ') : rec.typeName + (rec.title ? ' — ' + rec.title : '')) : (reqProf.licenseName || 'ใบอนุญาตประกอบวิชาชีพ')) + '</b></div>' :
    '<select class="inp" id="u-type">' + types.filter(function (t) { return t.id !== 'LIC'; }).map(function (t) { return '<option value="' + t.id + '"' + (t.id === typeId ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '<option value="LIC">ใบอนุญาตประกอบวิชาชีพ</option></select>') + '</div>' +
    '<div id="u-tf" class="field' + (lic ? ' hide' : '') + '"><label class="f">ชื่อเอกสาร / หลักสูตร *</label><input class="inp" id="u-title" value="' + esc(rec ? rec.title || '' : '') + '" placeholder="เช่น ACLS Provider, การพยาบาลผู้ป่วยวิกฤต"></div>' +
    '<div class="grid g2"><div class="field"><label class="f">เลขที่' + (lic ? 'ใบอนุญาต *' : ' (ถ้ามี)') + '</label><input class="inp" id="u-no" value="' + esc(rec ? rec.docNo || '' : '') + '"></div>' +
    '<div class="field"><label class="f">หน่วยงานที่ออก</label><input class="inp" id="u-iss" value="' + esc(rec ? rec.issuer || '' : (lic ? reqProf.council || '' : '')) + '"></div>' +
    '<div class="field"><label class="f">วันที่ออก / วันที่ได้รับ</label><input class="inp" type="date" id="u-idate"><div class="help" id="u-idate-th"></div></div>' +
    '<div class="field" id="u-ef"><label class="f">วันหมดอายุ</label><input class="inp" type="date" id="u-edate"><div class="help" id="u-edate-th">ไม่มีวันหมดอายุ ให้เว้นว่าง</div></div></div>' +
    '<div class="drop" id="u-drop" tabindex="0">' + ic('upload') + '<div><b>เลือกไฟล์สำเนา</b> หรือลากไฟล์มาวาง</div><div class="tiny muted">PDF / JPG / PNG ไม่เกิน 8 MB · ถ่ายรูปจากมือถือได้</div><input type="file" id="u-file" accept="application/pdf,image/*" class="hide"></div>' +
    '<div id="u-prev" class="mt12"></div>' +
    '<div class="field mt12"><label class="f">หมายเหตุถึง HR (ถ้ามี)</label><input class="inp" id="u-note" maxlength="300"></div>' +
    (admin ? '' : '<label class="chk"><input type="checkbox" id="u-ok"> ข้าพเจ้ารับรองว่าเป็นสำเนาเอกสารของข้าพเจ้า ลงนามรับรองสำเนาถูกต้องแล้ว และข้อมูลที่กรอกตรงกับเอกสาร</label>');
  modal({ title: rec ? 'ส่งสำเนาฉบับใหม่' : (admin ? 'แนบเอกสารแทนบุคลากร' : 'เพิ่มใบรับรอง / เอกสาร'), body: body, sticky: true,
    buttons: [{ label: 'ยกเลิก' }, { label: ic('send') + ' ส่งให้ HR ตรวจสอบ', cls: 'primary', id: 'u-send', onClick: function () {
      var t = rec ? rec.typeId : ($('#u-type') ? $('#u-type').value : 'LIC');
      if (!file) { toast('กรุณาเลือกไฟล์สำเนา', 'warn'); return false; }
      if (t === 'LIC' && !$('#u-no').value.trim()) { toast('กรุณากรอกเลขที่ใบอนุญาต', 'warn'); return false; }
      if (t !== 'LIC' && !$('#u-title').value.trim()) { toast('กรุณากรอกชื่อเอกสาร/หลักสูตร', 'warn'); return false; }
      if (!admin && !$('#u-ok').checked) { toast('กรุณาติ๊กรับรองความถูกต้อง', 'warn'); return false; }
      var p = { recordId: rec ? rec.id : '', typeId: t, title: $('#u-title').value.trim(), issuer: $('#u-iss').value.trim(), docNo: $('#u-no').value.trim(), issueDate: $('#u-idate').value, expiryDate: $('#u-edate').value, note: $('#u-note').value.trim(), file: file };
      if (admin) p.empCode = o.empCode;
      return api(admin ? 'adminUpload' : 'submitDoc', p).then(function () {
        toast(admin ? 'แนบเอกสารแล้ว เข้าคิวตรวจสอบ' : 'ส่งเอกสารแล้ว HR จะตรวจสอบและแจ้งผลทางอีเมล', 'ok', 5000);
        if (o.done) o.done(); else if (S.route === 'me') PAGES.me();
      });
    } }],
    onOpen: function (el) {
      var setType = function () { var t = $('#u-type', el) ? $('#u-type', el).value : typeId, dt = docType(t); $('#u-tf', el).classList.toggle('hide', t === 'LIC'); $('#u-edate-th', el).textContent = dt.hasExpiry === 'FALSE' ? 'ไม่มีวันหมดอายุ ให้เว้นว่าง' : 'ตามที่ระบุในเอกสาร'; };
      if ($('#u-type', el)) { $('#u-type', el).onchange = setType; }
      setType();
      ['idate', 'edate'].forEach(function (k) { $('#u-' + k, el).oninput = function () { var v = this.value; $('#u-' + k + '-th', el).textContent = v ? '= ' + thDateFull(v) : ''; }; });
      var inp = $('#u-file', el), dz = $('#u-drop', el);
      var pick = function (f) {
        $('#u-prev', el).innerHTML = loadingHtml('กำลังอ่านไฟล์…');
        readFile(f).then(function (x) { file = x; $('#u-prev', el).innerHTML = '<div class="note ok">' + ic('file') + '<div><b>' + esc(x.name) + '</b> · ' + Math.round(x.size / 1024) + ' KB</div></div>' + (/^image\//.test(x.mime) ? '<img src="data:' + x.mime + ';base64,' + x.b64 + '" style="max-height:220px;border-radius:10px;margin-top:8px" alt="">' : ''); })
          .catch(function (e) { file = null; $('#u-prev', el).innerHTML = '<div class="note err">' + ic('alert') + '<div>' + esc(e.message) + '</div></div>'; });
      };
      dz.onclick = function () { inp.click(); }; dz.onkeydown = function (e) { if (e.key === 'Enter') inp.click(); };
      inp.onchange = function () { if (inp.files[0]) pick(inp.files[0]); };
      dz.ondragover = function (e) { e.preventDefault(); dz.classList.add('on'); }; dz.ondragleave = function () { dz.classList.remove('on'); };
      dz.ondrop = function (e) { e.preventDefault(); dz.classList.remove('on'); if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); };
    } });
}
