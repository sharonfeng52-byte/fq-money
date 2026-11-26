/**
 * 同一張鈔票 互動學習站 — Google Apps Script 後端
 * 用法：貼到 Google Sheet 的「擴充功能 > Apps Script」，執行一次 setup()，再部署為網頁應用程式。
 */

// 各分頁的欄位（第一行標題）。學生提交新欄位時會自動加在最後。
const SCHEMA = {
  'W1': ['時間', '組別', '暱稱', '$100排序', '$50排序', '價格', '值得理由', '最先刪去', '刪去原因', '修或換', '修換理由', '價格是', '價值是'],
  'W2': ['時間', '組別', '暱稱', '第一輪收入', '第一輪支出', '第一輪淨收入', '第二輪收入', '第二輪支出', '第二輪淨收入', '收入差額', '原因', '付出', '工作分析', '想提升的技能', '第一步', '另一組技能'],
  'W3': ['時間', '組別', '暱稱', '目標週數', '目標金額', '目標用途', 'SMART', '每週紀錄', '累積儲蓄', '消費合計', '緊急合計', '達標率', '儲次數', '花次數', '緊急次數', '忍住不買理由'],
  'W4': ['時間', '組別', '暱稱', '新款波鞋_分類', '新款波鞋_最低價', '新款波鞋_借用', '新款波鞋_決定', '盲盒_分類', '盲盒_最低價', '盲盒_借用', '盲盒_決定',
         '遊戲點數_分類', '遊戲點數_最低價', '遊戲點數_借用', '遊戲點數_決定', '答案改變於', '購買前三問1', '購買前三問2', '購買前三問3', '生活原則'],
  '投票': ['時間', '堂', '投票', '階段', '組別', '暱稱', '選擇'],
  '留言牆': ['時間', '堂', '牆', '組別', '暱稱', '內容'],
  '家長回饋': ['時間', '孩子組別', '孩子暱稱', '先想需要想要_課前', '先想需要想要_現在', '先想需要想要_改變', '訂目標儲錢_課前', '訂目標儲錢_現在', '訂目標儲錢_改變', '珍惜已有_課前', '珍惜已有_現在', '珍惜已有_改變', '明白勞動_課前', '明白勞動_現在', '明白勞動_改變', '和家人傾談_課前', '和家人傾談_現在', '和家人傾談_改變', '滿意度', '會推薦', '最明顯改變', '改善建議', '同意匿名引用']
};
const CONFIG_SHEET = '設定_開放課堂';
const MAX_TEXT = 300;

/** 第一次使用：建立所有分頁、標題、開放課堂設定及匯總表。可重複執行，不會刪除資料。 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMA).forEach(name => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, SCHEMA[name].length).setValues([SCHEMA[name]]).setFontWeight('bold').setBackground('#1F3A68').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
  });
  let cfg = ss.getSheetByName(CONFIG_SHEET);
  if (!cfg) {
    cfg = ss.insertSheet(CONFIG_SHEET, 0);
    cfg.getRange('A1:C1').setValues([['堂', '課題', '開放給學生']]).setFontWeight('bold');
    cfg.getRange('A2:B5').setValues([[1, '100 元的秘密'], [2, '一小時值多少'], [3, '今天不買，換到甚麼'], [4, '想要，等於需要嗎']]);
    cfg.getRange('C2:C5').insertCheckboxes();
    cfg.getRange('C2').setValue(true);
    cfg.getRange('E1').setValue('剔選「開放給學生」= 學生可進入該堂。上課前剔選即可。');
  }
  let sum = ss.getSheetByName('匯總');
  if (!sum) {
    sum = ss.insertSheet('匯總');
    sum.getRange('A1:F1').setValues([['組別', 'W1 提交', 'W2 提交', 'W3 提交', 'W4 提交', 'W3 平均達標率%']]).setFontWeight('bold');
    for (let g = 1; g <= 6; g++) {
      const r = g + 1;
      sum.getRange(r, 1).setValue(g);
      ['W1', 'W2', 'W3', 'W4'].forEach((w, i) => sum.getRange(r, 2 + i).setFormula(`=COUNTIF('${w}'!B:B,A${r})`));
      sum.getRange(r, 6).setFormula(`=IFERROR(ROUND(AVERAGEIF('W3'!B:B,A${r},'W3'!L:L),0),"")`);
    }
  }
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('工作表1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
}

// ---------- 網頁入口 ----------
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'config') return out({ ok: true, open: openLessons() });
    if (p.action === 'summary') return out(summary(String(p.lesson)));
    if (p.action === 'mine') return out(mine(String(p.group), String(p.nick)));
    if (p.action === 'feedbackList') return out({ ok: true, rows: readAll('家長回饋').map(r => { const o = Object.assign({}, r); delete o['孩子暱稱']; return o; }) });
    return out({ ok: true, msg: '同一張鈔票 互動學習站 後端運作中' });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const q = JSON.parse(e.postData.contents);
    // 家長課後評估表：不需要組別或暱稱
    if (q.action === 'feedback') {
      const row = { '時間': new Date(), '孩子組別': clean(q.group || '').slice(0, 4), '孩子暱稱': nickOf(q.nick || '') };
      Object.keys(q.data || {}).forEach(k => { row[clean(k).slice(0, 40)] = cleanVal(q.data[k]); });
      append('家長回饋', row);
      return out({ ok: true });
    }
    if (!q.group || !q.nick) return out({ ok: false, error: '缺少組別或暱稱。' });
    const base = { '組別': String(q.group), '暱稱': nickOf(q.nick) };
    if (q.action === 'submit') {
      if (!/^W[1-4]$/.test(q.sheet)) return out({ ok: false, error: '工作紙名稱不正確。' });
      const row = Object.assign({ '時間': new Date() }, base);
      Object.keys(q.data || {}).forEach(k => { row[clean(k).slice(0, 40)] = cleanVal(q.data[k]); });
      upsert(q.sheet, row, r => r['組別'] === base['組別'] && String(r['暱稱']) === base['暱稱']);
      return out({ ok: true });
    }
    if (q.action === 'vote') {
      const row = Object.assign({ '時間': new Date(), '堂': Number(q.lesson), '投票': clean(q.poll), '階段': clean(q.phase), '選擇': clean(q.choice) }, base);
      upsert('投票', row, r => r['組別'] === base['組別'] && String(r['暱稱']) === base['暱稱'] && r['投票'] === row['投票'] && r['階段'] === row['階段']);
      return out({ ok: true });
    }
    if (q.action === 'wall') {
      const text = clean(q.text).slice(0, 200);
      if (!text) return out({ ok: false, error: '內容是空的。' });
      append('留言牆', Object.assign({ '時間': new Date(), '堂': Number(q.lesson), '牆': clean(q.wall), '內容': text }, base));
      return out({ ok: true });
    }
    return out({ ok: false, error: '未知的操作。' });
  } catch (err) {
    return out({ ok: false, error: '伺服器忙碌，請稍後再試。' });
  } finally {
    lock.releaseLock();
  }
}

// ---------- 讀取 ----------
function openLessons() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET);
  const res = { 1: true, 2: true, 3: true, 4: true };
  if (!sh) return res;
  sh.getRange('A2:C5').getValues().forEach(r => { if (r[0]) res[r[0]] = r[2] === true; });
  return res;
}

function summary(lesson) {
  if (!/^[1-4]$/.test(lesson)) return { ok: false, error: '堂數不正確。' };
  const hide = r => { const o = Object.assign({}, r); delete o['暱稱']; return o; };
  return {
    ok: true,
    rows: readAll('W' + lesson).map(hide),
    votes: readAll('投票').filter(r => String(r['堂']) === lesson).map(hide),
    walls: readAll('留言牆').filter(r => String(r['堂']) === lesson).map(hide)
  };
}

function mine(group, nick) {
  nick = nickOf(nick);
  const me = r => String(r['組別']) === group && String(r['暱稱']) === nick;
  const res = { ok: true, walls: readAll('留言牆').filter(me), votes: readAll('投票').filter(me) };
  ['W1', 'W2', 'W3', 'W4'].forEach(w => { res[w] = readAll(w).find(me) || null; });
  return res;
}

// ---------- 分頁工具 ----------
function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { setup(); sh = ss.getSheetByName(name); }
  return sh;
}

function headers(sh, keys) {
  let h = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String);
  const missing = keys.filter(k => h.indexOf(k) < 0);
  if (missing.length) {
    sh.getRange(1, h.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    h = h.concat(missing);
  }
  return h;
}

function readAll(name) {
  const sh = sheet(name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const data = sh.getRange(1, 1, last, sh.getLastColumn()).getValues();
  const h = data[0].map(String);
  return data.slice(1).map(r => {
    const o = {};
    h.forEach((k, i) => { o[k] = r[i] instanceof Date ? r[i].toISOString() : (k === '組別' ? String(r[i]) : r[i]); });
    return o;
  });
}

function append(name, row) {
  const sh = sheet(name);
  const h = headers(sh, Object.keys(row));
  sh.appendRow(h.map(k => (k in row ? row[k] : '')));
}

function upsert(name, row, match) {
  const sh = sheet(name);
  const h = headers(sh, Object.keys(row));
  const rows = readAll(name);
  const idx = rows.findIndex(match);
  const values = [h.map(k => (k in row ? row[k] : ''))];
  if (idx >= 0) sh.getRange(idx + 2, 1, 1, h.length).setValues(values);
  else sh.appendRow(values[0]);
}

function nickOf(v) { return String(v == null ? '' : v).replace(/^[=+\-@]+/, '').trim().slice(0, 20); }
function clean(v) { return String(v == null ? '' : v).replace(/^[=+\-@]/, "'$&").trim(); }
function cleanVal(v) { return typeof v === 'number' ? v : clean(v).slice(0, MAX_TEXT); }
function out(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
