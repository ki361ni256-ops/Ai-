// 字幕用の文節分け（BudouX＋読みやすさのための結合ルール）。listen.py と listen_frames.mjs の両方で使う
import { createRequire } from 'module';
const { loadDefaultJapaneseParser } = createRequire(import.meta.url)('budoux');
const bx = loadDefaultJapaneseParser();
const KANJI = /[一-鿿々〆ヶ]/;
export function phrases(text) {
  const raw = bx.parse(text);
  const out = [];
  for (const c of raw) {
    const prev = out[out.length - 1];
    if (prev !== undefined) {
      const opened = (prev.match(/[「『（]/g) || []).length > (prev.match(/[」』）]/g) || []).length;
      const join =
        (KANJI.test(prev.slice(-1)) && KANJI.test(c[0])) ||           // 漢字と漢字のあいだでは切らない（本｜当 など）
        (/[」』）]$/.test(prev) && /^[ぁ-ん、。]/.test(c)) ||          // 閉じかっこの直後の助詞・句読点は前につける
        /^[」』）、。？！]/.test(c) ||                                  // 閉じかっこ・句読点で行を始めない
        (opened && (prev.length + c.length) <= 14);                    // 短いかぎかっこの中では切らない
      if (join) { out[out.length - 1] = prev + c; continue; }
    }
    out.push(c);
  }
  return out;
}
// node phrases.mjs < texts.json  → 各文の文節の配列を JSON で出す
if (process.argv[1] && process.argv[1].endsWith('phrases.mjs')) {
  let buf = ''; process.stdin.on('data', d => buf += d).on('end', () => process.stdout.write(JSON.stringify(JSON.parse(buf).map(phrases))));
}
