/* SOMDEJ License — xlsx-io.js : แม่แบบนำเข้า · นำเข้า Excel (อ่านในเบราว์เซอร์) · ส่งออก Excel (ใช้ lib-xlsx.js = SheetJS) */
function thDmy(ymd) { var m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + (+m[1] + 543) : ''; }
function needXlsx() { if (!window.XLSX) throw new Error('กำลังโหลดตัวอ่าน Excel กรุณารอสักครู่แล้วลองใหม่'); }
function saveBook(wb, name) { XLSX.writeFile(wb, 'SOMDEJ-License_' + name + '_' + nowStamp() + '.xlsx'); }
function sheetOf(aoa, widths) { var ws = XLSX.utils.aoa_to_sheet(aoa); if (widths) ws['!cols'] = widths.map(function (w) { return { wch: w }; }); return ws; }

/* ---------------------------------------------------------------- ส่งออก */
function exportRows(rows, full, title) {
  try { needXlsx(); } catch (e) { return errToast(e); }
  var head = ['รหัสพนักงาน', 'ชื่อ-สกุล', 'ตำแหน่ง', 'ฝ่ายที่ปฏิบัติงาน', 'หน่วย', 'วิชาชีพ', 'การติดตาม'].concat(full ? ['เลขที่ใบอนุญาต'] : []).concat(['วันหมดอายุ (พ.ศ.)', 'สถานะ', 'จำนวนวัน (ลบ = เลยมา)', 'สถานะการติดตาม'])
    .concat(full ? ['ขอสำเนาตั้งต้นเมื่อ', 'แจ้งครั้งที่ 1 เมื่อ', 'เตือนซ้ำเมื่อ', 'แจ้งครั้งที่ 2 เมื่อ', 'มีอีเมล', 'สถานะบุคลากร', 'รอตรวจ (ฉบับ)', 'ใบรับรองอื่น (ฉบับ)'] : []);
  var aoa = [[(title || 'ทะเบียนใบประกอบวิชาชีพ') + ' · SOMDEJ License · ' + (S.brand ? S.brand.orgName : '')], ['ส่งออกเมื่อ ' + thDate(new Date().toISOString(), true) + ' โดย ' + (S.me ? S.me.empCode : '') + ' · ' + rows.length + ' รายการ · ข้อมูลส่วนบุคคล ห้ามเผยแพร่'], [], head];
  rows.forEach(function (r) {
    aoa.push([r.e, r.n, r.pos, r.d, r.u, profName(r.prof), MODE_TH[r.mode] || ''].concat(full ? [r.no || ''] : []).concat([r.st === 'LIFETIME' ? 'ตลอดชีพ' : thDmy(r.exp), ST_TH[r.st], r.days == null ? '' : r.days, FL_TH[r.fl] || ''])
      .concat(full ? [thDmy(r.base), thDmy(r.n1), thDmy(r.r1), thDmy(r.n2), r.em ? 'มี' : 'ไม่มี', PS_TH[r.ps] || r.ps, r.pend || '', r.oth || ''] : []));
  });
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetOf(aoa, [11, 28, 26, 28, 18, 18, 14].concat(full ? [16] : []).concat([14, 14, 10, 18]).concat(full ? [12, 12, 12, 12, 8, 14, 8, 8] : [])), 'ทะเบียน');
  saveBook(wb, title || 'ทะเบียน');
}
function exportCerts() {
  try { needXlsx(); } catch (e) { return errToast(e); }
  return api('exportData').then(function (d) {
    var aoa = [['ใบรับรองอื่น ๆ (นอกจากใบประกอบวิชาชีพ) · ส่งออกเมื่อ ' + thDate(new Date().toISOString(), true)], [], ['รหัสพนักงาน', 'ชื่อ-สกุล', 'ตำแหน่ง', 'ฝ่าย', 'ประเภทเอกสาร', 'ชื่อเอกสาร/หลักสูตร', 'หน่วยงานที่ออก', 'เลขที่', 'วันที่ได้รับ (พ.ศ.)', 'วันหมดอายุ (พ.ศ.)', 'สถานะ', 'ที่มา', 'หมายเหตุ']];
    d.certs.forEach(function (c) { aoa.push([c.e, c.n, c.pos, c.d, c.type, c.title, c.issuer, c.no, thDmy(c.iss), thDmy(c.exp), ST_TH[c.st], { IMPORT: 'นำเข้า', STAFF: 'บุคลากรส่ง', ADMIN: 'ผู้ดูแล' }[c.src] || c.src, c.note]); });
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, sheetOf(aoa, [11, 28, 24, 26, 26, 30, 24, 14, 14, 14, 12, 10, 20]), 'ใบรับรองอื่น'); saveBook(wb, 'ใบรับรองอื่น');
  }).catch(errToast);
}

/* ---------------------------------------------------------------- แม่แบบนำเข้า */
var TPL_LIC = ['รหัสพนักงาน', 'ชื่อ-สกุล (ไว้ตรวจ)', 'ตำแหน่ง', 'ฝ่าย', 'วิชาชีพ', 'เลขที่ใบอนุญาต', 'วันที่ออก (วว/ดด/ปปปป พ.ศ.)', 'วันหมดอายุ (วว/ดด/ปปปป พ.ศ.)', 'ตลอดชีพ (ใช่/เว้นว่าง)', 'หมายเหตุ'];
var TPL_CERT = ['รหัสพนักงาน', 'ชื่อ-สกุล (ไว้ตรวจ)', 'รหัสประเภทเอกสาร', 'ชื่อเอกสาร/หลักสูตร', 'หน่วยงานที่ออก', 'เลขที่', 'วันที่ได้รับ (วว/ดด/ปปปป พ.ศ.)', 'วันหมดอายุ (วว/ดด/ปปปป พ.ศ.)', 'หมายเหตุ'];
function downloadTemplate(prefill) {
  try { needXlsx(); } catch (e) { return errToast(e); }
  var go = function (rows) {
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheetOf([['แม่แบบนำเข้า SOMDEJ License · ระบบติดตามใบประกอบวิชาชีพและใบรับรองบุคลากร'], [],
      ['วิธีกรอก'], ['1. แผ่น "ใบประกอบวิชาชีพ" — 1 แถว = 1 คน (ใบประกอบ 1 ใบ/คน) · รหัสพนักงาน 7 หลัก บังคับ'],
      ['2. แผ่น "ใบรับรองอื่น" — 1 แถว = 1 ฉบับ (คนหนึ่งมีได้หลายฉบับ) · รหัสประเภทดูแผ่น "รายการอ้างอิง"'],
      ['3. วันที่กรอกเป็น วว/ดด/ปปปป ปี พ.ศ. เช่น 30/12/2573 หรือใช้รูปแบบวันที่ของ Excel ก็ได้'], ['4. แพทย์ที่ใบอนุญาตตลอดชีพ ใส่ "ใช่" ในช่องตลอดชีพ และเว้นวันหมดอายุ'],
      ['5. ชื่อ/ตำแหน่ง/ฝ่าย ใช้ตรวจทาน · ข้อมูลจริงมาจาก HR Connect · ห้ามเปลี่ยนชื่อหัวคอลัมน์'],
      ['6. นำเข้าที่เมนู "นำเข้า / ส่งออก Excel" · เลือก "เติมเฉพาะช่องที่ยังว่าง" (ปลอดภัย) หรือ "ทับด้วยค่าในไฟล์"'],
      ['7. ไฟล์นี้มีข้อมูลส่วนบุคคล เก็บในโฟลเดอร์จำกัดสิทธิ์ ห้ามส่งต่อหรืออัปโหลดสาธารณะ']], [110]), 'อ่านก่อน');
    var lic = [TPL_LIC].concat((rows || []).map(function (r) { return [r.e, r.n, r.pos, r.d, profName(r.prof), r.no || '', '', r.st === 'LIFETIME' ? '' : thDmy(r.exp), r.st === 'LIFETIME' ? 'ใช่' : '', '']; }));
    if (!rows) lic.push(['5XXXXXX', 'ตัวอย่าง (ลบแถวนี้)', 'พยาบาล', 'ฝ่ายการพยาบาล', 'พยาบาล', '6111000000', '31/12/2568', '30/12/2573', '', '']);
    XLSX.utils.book_append_sheet(wb, sheetOf(lic, [12, 28, 24, 26, 18, 16, 16, 16, 12, 20]), 'ใบประกอบวิชาชีพ');
    XLSX.utils.book_append_sheet(wb, sheetOf([TPL_CERT, ['5XXXXXX', 'ตัวอย่าง (ลบแถวนี้)', 'BLS', 'BLS Provider', 'ศูนย์ฝึกอบรม', '', '15/01/2569', '15/01/2571', '']], [12, 28, 16, 30, 24, 14, 16, 16, 20]), 'ใบรับรองอื่น');
    var ref = [['รหัสประเภทเอกสาร', 'ชื่อ', 'มีวันหมดอายุ', '', 'วิชาชีพ', 'ใบอนุญาต', 'ต่ออายุ']], T = S.boot.docTypes, P = S.boot.professions;
    for (var i = 0; i < Math.max(T.length, P.length); i++) ref.push([T[i] ? T[i].id : '', T[i] ? T[i].name : '', T[i] ? (T[i].hasExpiry === 'TRUE' ? 'มี' : '-') : '', '', P[i] ? P[i].name : '', P[i] ? P[i].licenseName : '', P[i] ? (P[i].renew === 'LIFE' ? 'ตลอดชีพ' : '5 ปี') : '']);
    XLSX.utils.book_append_sheet(wb, sheetOf(ref, [16, 34, 12, 3, 26, 50, 10]), 'รายการอ้างอิง');
    saveBook(wb, rows ? 'แม่แบบพร้อมรายชื่อ' : 'แม่แบบนำเข้า');
  };
  if (!prefill) return go(null);
  return (S.reg ? Promise.resolve(S.reg) : api('getRegistry').then(function (d) { S.reg = d.rows; return d.rows; })).then(function (rows) { go(rows.filter(function (r) { return r.tr || r.mode !== 'NONE'; }).filter(function (r) { return r.ps === 'ACTIVE'; })); }).catch(errToast);
}

/* ---------------------------------------------------------------- อ่านไฟล์นำเข้า */
var IMP_ALIAS = {
  empCode: ['รหัสพนักงาน', 'รหัสเจ้าหน้าที่', 'รหัสบุคลากร', 'รหัส', 'empcode'],
  name: ['ชื่อ-สกุล', 'ชื่อ - สกุล', 'ชื่อ', 'ชื่อสกุล'], position: ['ตำแหน่ง'], division: ['ฝ่าย', 'ฝ่าย/ศูนย์', 'หน่วยงาน'],
  prof: ['วิชาชีพ'], docNo: ['เลขที่ใบอนุญาต', 'เลขใบประกอบ', 'เลขที่ใบประกอบ', 'เลขใบอนุญาต', 'เลขที่'],
  issueDate: ['วันที่ออก', 'วันออกบัตร', 'วันที่ได้รับ', 'วันที่ออกบัตร'], expiryDate: ['วันหมดอายุ', 'วันที่หมดอายุ'], lifetime: ['ตลอดชีพ'], note: ['หมายเหตุ'],
  typeId: ['รหัสประเภทเอกสาร', 'ประเภทเอกสาร'], title: ['ชื่อเอกสาร/หลักสูตร', 'ชื่อเอกสาร', 'หลักสูตร'], issuer: ['หน่วยงานที่ออก', 'ผู้ออก']
};
function headKey(h) {
  var s = String(h || '').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  for (var k in IMP_ALIAS) if (IMP_ALIAS[k].some(function (a) { return s === a.toLowerCase(); })) return k;
  for (var k2 in IMP_ALIAS) if (IMP_ALIAS[k2].some(function (a) { return a.length > 3 && s.indexOf(a.toLowerCase()) === 0; })) return k2;
  return '';
}
function cellYmd(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date) { var y = v.getFullYear(); if (y > 2400) y -= 543; return y + '-' + ('0' + (v.getMonth() + 1)).slice(-2) + '-' + ('0' + v.getDate()).slice(-2); }
  if (typeof v === 'number' && v > 20000 && v < 400000) { var d = new Date(Math.round((v - 25569) * 86400000)); return cellYmd(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  return toYmd(v) || ('?' + v);
}
/** อ่านทุกแผ่นที่มีคอลัมน์รหัสพนักงาน → แถวนำเข้า */
function parseImport(wb) {
  var out = [], skipped = 0, bad = [], sheets = [];
  var profByName = {}; (S.boot.professions || []).forEach(function (p) { profByName[p.name] = p.id; profByName[p.id] = p.id; });
  wb.SheetNames.forEach(function (sn) {
    if (/อ่านก่อน|อ้างอิง/.test(sn)) return;
    var aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: '' });
    var hi = -1, map = [];
    for (var i = 0; i < Math.min(aoa.length, 15); i++) { var m = aoa[i].map(headKey); if (m.indexOf('empCode') >= 0 && (m.indexOf('docNo') >= 0 || m.indexOf('expiryDate') >= 0 || m.indexOf('title') >= 0)) { hi = i; map = m; break; } }
    if (hi < 0) return;
    var isCert = map.indexOf('typeId') >= 0 || /รับรอง/.test(sn), n = 0;
    for (var r = hi + 1; r < aoa.length; r++) {
      var row = aoa[r], o = { _line: sn + ' แถว ' + (r + 1) };
      map.forEach(function (k, j) { if (k) o[k] = row[j]; });
      if (/x/i.test(String(o.empCode)) || /ตัวอย่าง/.test(String(o.name || ''))) continue;   // แถวตัวอย่างในแม่แบบ
      o.empCode = String(o.empCode == null ? '' : o.empCode).replace(/\D/g, '');
      if (!o.empCode) continue;
      if (o.empCode.length !== 7) { bad.push(o._line + ': รหัสพนักงานไม่ใช่ 7 หลัก'); continue; }
      o.docNo = String(o.docNo == null ? '' : o.docNo).trim(); o.title = String(o.title || '').trim();
      o.issueDate = cellYmd(o.issueDate); o.expiryDate = cellYmd(o.expiryDate);
      if (/^\?/.test(o.issueDate) || /^\?/.test(o.expiryDate)) { bad.push(o._line + ': วันที่อ่านไม่ได้ (' + (o.expiryDate.charAt(0) === '?' ? o.expiryDate.slice(1) : o.issueDate.slice(1)) + ')'); continue; }
      o.lifetime = /^(ใช่|y|yes|true|ตลอดชีพ)$/i.test(String(o.lifetime || '').trim());
      if (isCert) { o.typeId = String(o.typeId || 'OTHER').trim().toUpperCase(); if (!o.title && !o.docNo) { skipped++; continue; } }
      else { o.typeId = 'LIC'; if (!o.docNo && !o.expiryDate && !o.lifetime) { skipped++; continue; } }
      if (o.prof) o.profId = profByName[String(o.prof).trim()] || '';
      ['name', 'position', 'division', 'note', 'issuer'].forEach(function (k) { o[k] = String(o[k] == null ? '' : o[k]).trim(); });
      delete o.prof; out.push(o); n++;
    }
    sheets.push(sn + ' (' + n + ')');
  });
  return { rows: out, skipped: skipped, bad: bad, sheets: sheets };
}

PAGES.io = function () {
  var pg = shell('นำเข้า / ส่งออก Excel', 'ข้อมูลตั้งต้นจากไฟล์ HR · รายงานทะเบียน · ทุกไฟล์มีข้อมูลส่วนบุคคล เก็บในโฟลเดอร์จำกัดสิทธิ์');
  pg.innerHTML = '<div class="grid g2"><div class="card rise"><h3>' + ic('download') + ' แม่แบบนำเข้า</h3><p class="small muted">แผ่น "ใบประกอบวิชาชีพ" (1 คน 1 ใบ) และ "ใบรับรองอื่น" (หลายฉบับต่อคน) · วันที่ปี พ.ศ.</p>' +
    '<div class="row"><button class="btn" id="io-t1">' + ic('file') + ' แม่แบบเปล่า</button><button class="btn" id="io-t2">' + ic('users') + ' แม่แบบพร้อมรายชื่อผู้ต้องมีใบประกอบ</button></div>' +
    '<p class="tiny muted mt8">รับไฟล์รายชื่อเดิมของ HR ได้ด้วย (คอลัมน์ รหัสเจ้าหน้าที่ · เลขใบประกอบ · วันหมดอายุ)</p></div>' +
    '<div class="card rise" style="animation-delay:.05s"><h3>' + ic('upload') + ' ส่งออก</h3><div class="row"><button class="btn" id="io-x1">' + ic('download') + ' ทะเบียนใบประกอบ (ทั้งหมด)</button><button class="btn" id="io-x2">' + ic('download') + ' หมดอายุ/ใกล้หมดอายุ</button><button class="btn" id="io-x3">' + ic('download') + ' ใบรับรองอื่น</button></div></div></div>' +
    '<div class="card mt16 rise" style="animation-delay:.1s"><h3>' + ic('layers') + ' นำเข้าข้อมูล</h3><div class="drop" id="io-drop" tabindex="0">' + ic('upload') + '<div><b>เลือกไฟล์ Excel</b> (.xlsx / .xls) หรือลากมาวาง</div><div class="tiny muted">ระบบอ่านไฟล์ในเครื่องของท่าน แล้วส่งเฉพาะข้อมูลที่ใช้ (ไม่ส่งเลขบัตรประชาชน)</div><input type="file" id="io-f" accept=".xlsx,.xls" class="hide"></div><div id="io-p" class="mt16"></div></div>';
  $('#io-t1').onclick = function () { downloadTemplate(false); };
  $('#io-t2').onclick = function () { var b = this; busy(b, true); Promise.resolve(downloadTemplate(true)).then(function () { busy(b, false); }); };
  var withReg = function (fn) { return (S.reg ? Promise.resolve(S.reg) : api('getRegistry').then(function (d) { S.reg = d.rows; return d.rows; })).then(fn).catch(errToast); };
  $('#io-x1').onclick = function () { withReg(function (r) { exportRows(r.filter(function (x) { return x.tr; }), true, 'ทะเบียนใบประกอบ'); }); };
  $('#io-x2').onclick = function () { withReg(function (r) { exportRows(r.filter(function (x) { return x.tr && (x.st === 'EXPIRED' || x.st === 'SOON' || x.st === 'NODATA'); }), true, 'ต้องติดตาม'); }); };
  $('#io-x3').onclick = function () { exportCerts(); };
  var inp = $('#io-f'), dz = $('#io-drop');
  dz.onclick = function () { inp.click(); }; dz.onkeydown = function (e) { if (e.key === 'Enter') inp.click(); };
  dz.ondragover = function (e) { e.preventDefault(); dz.classList.add('on'); }; dz.ondragleave = function () { dz.classList.remove('on'); };
  dz.ondrop = function (e) { e.preventDefault(); dz.classList.remove('on'); if (e.dataTransfer.files[0]) readImport(e.dataTransfer.files[0]); };
  inp.onchange = function () { if (inp.files[0]) readImport(inp.files[0]); inp.value = ''; };
};
function readImport(file) {
  var box = $('#io-p');
  try { needXlsx(); } catch (e) { return errToast(e); }
  box.innerHTML = loadingHtml('กำลังอ่าน ' + file.name + '…');
  var fr = new FileReader();
  fr.onload = function () {
    var res;
    try { res = parseImport(XLSX.read(new Uint8Array(fr.result), { type: 'array', cellDates: true })); } catch (e) { box.innerHTML = '<div class="note err">' + ic('alert') + '<div>อ่านไฟล์ไม่ได้: ' + esc(e.message) + '</div></div>'; return; }
    if (!res.rows.length) { box.innerHTML = '<div class="note warn">' + ic('alert') + '<div>ไม่พบแถวที่นำเข้าได้ · ต้องมีคอลัมน์ "รหัสพนักงาน" และ "เลขที่ใบอนุญาต" หรือ "วันหมดอายุ"' + (res.bad.length ? '<br>' + res.bad.slice(0, 10).map(esc).join('<br>') : '') + '</div></div>'; return; }
    var lic = res.rows.filter(function (r) { return r.typeId === 'LIC'; }), cert = res.rows.length - lic.length;
    var exp = lic.filter(function (r) { return r.expiryDate && r.expiryDate < today(); }).length, life = lic.filter(function (r) { return r.lifetime; }).length;
    var reg = {}; (S.reg || []).forEach(function (r) { reg[r.e] = r; });
    var newP = res.rows.filter(function (r) { return S.reg && !reg[r.empCode]; }).length;
    box.innerHTML = '<div class="grid g4"><div class="card kpi ok"><div class="v">' + nf(lic.length) + '</div><div class="l">ใบประกอบวิชาชีพ</div></div><div class="card kpi rev"><div class="v">' + nf(cert) + '</div><div class="l">ใบรับรองอื่น</div></div><div class="card kpi exp"><div class="v">' + nf(exp) + '</div><div class="l">วันหมดอายุเลยแล้ว</div></div><div class="card kpi nd"><div class="v">' + nf(res.skipped) + '</div><div class="l">แถวไม่มีข้อมูล (ข้าม)</div></div></div>' +
      '<p class="small mt12">ไฟล์ <b>' + esc(file.name) + '</b> · แผ่นที่อ่าน: ' + esc(res.sheets.join(', ')) + ' · ตลอดชีพ ' + life + (S.reg ? ' · รหัสที่ยังไม่มีในทะเบียน ' + newP + ' (จะเพิ่มเป็นบุคลากรจากไฟล์)' : '') + '</p>' +
      (res.bad.length ? '<div class="note warn">' + ic('alert') + '<div><b>แถวที่อ่านไม่ได้ ' + res.bad.length + ' แถว (จะไม่นำเข้า)</b><br><span class="small">' + res.bad.slice(0, 15).map(esc).join('<br>') + (res.bad.length > 15 ? '<br>…' : '') + '</span></div></div>' : '') +
      '<div class="tbl mt12" style="max-height:280px"><table class="t"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>ประเภท</th><th>เลขที่</th><th>หมดอายุ</th></tr></thead><tbody>' + res.rows.slice(0, 30).map(function (r) { return '<tr><td>' + esc(r.empCode) + '</td><td>' + esc(r.name || (reg[r.empCode] || {}).n || '') + '</td><td>' + esc(r.typeId === 'LIC' ? 'ใบประกอบ' : r.typeId + ' ' + r.title) + '</td><td>' + esc(r.docNo) + '</td><td>' + (r.lifetime ? 'ตลอดชีพ' : thDate(r.expiryDate)) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="seg block mt16" id="io-mode"><button data-m="fill" class="on">เติมเฉพาะช่องที่ยังว่าง (แนะนำ)</button><button data-m="overwrite">ทับด้วยค่าในไฟล์</button></div>' +
      '<div class="row mt12"><button class="btn primary lg" id="io-go">' + ic('upload') + ' นำเข้า ' + nf(res.rows.length) + ' รายการ</button></div><div id="io-r" class="mt12"></div>';
    var mode = 'fill';
    $$('#io-mode button').forEach(function (b) { b.onclick = function () { mode = b.dataset.m; $$('#io-mode button').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    $('#io-go').onclick = function () {
      var b = this, rows = res.rows, i = 0, tot = { added: 0, updated: 0, same: 0, people: 0, errors: [] };
      confirmBox('นำเข้าข้อมูล', 'นำเข้า ' + nf(rows.length) + ' รายการ แบบ <b>' + (mode === 'fill' ? 'เติมเฉพาะช่องที่ยังว่าง' : 'ทับด้วยค่าในไฟล์') + '</b> ใช่หรือไม่', 'นำเข้า').then(function (y) {
        if (!y) return; busy(b, true);
        var next = function () {
          if (i >= rows.length) {
            busy(b, false); b.disabled = true; S.reg = null;
            $('#io-r').innerHTML = '<div class="note ok">' + ic('check') + '<div><b>นำเข้าเสร็จ</b> · เพิ่มใหม่ ' + nf(tot.added) + ' · ปรับปรุง ' + nf(tot.updated) + ' · เหมือนเดิม ' + nf(tot.same) + ' · บุคลากรใหม่จากไฟล์ ' + nf(tot.people) + (tot.errors.length ? '<br><span style="color:var(--exp)">ผิดพลาด ' + tot.errors.length + ': ' + tot.errors.slice(0, 10).map(function (e) { return esc(e.line + ' ' + e.error); }).join(' · ') + '</span>' : '') + '</div></div>';
            confetti(); return;
          }
          var chunk = rows.slice(i, i + 300); i += 300; b.innerHTML = '<span class="spin" style="width:16px;height:16px;border-width:2px"></span> ' + Math.min(i, rows.length) + '/' + rows.length;
          api('importRecords', { rows: chunk, mode: mode, fileName: file.name }).then(function (r) { tot.added += r.added; tot.updated += r.updated; tot.same += r.same; tot.people += r.people; tot.errors = tot.errors.concat(r.errors); next(); }).catch(function (e) { busy(b, false); errToast(e); });
        };
        next();
      });
    };
  };
  fr.readAsArrayBuffer(file);
}
