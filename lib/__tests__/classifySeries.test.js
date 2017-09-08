const classifySeries = require('../classifySeries');
const { extractTitle } = classifySeries;

describe('lib/classifySeries#extractTitle', () => {
  it('single-byte space/number', () => {
    const subject = 'テラフォーマーズ 19 (ヤングジャンプコミックスDIGITAL)';
    const expected = 'テラフォーマーズ';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('single-byte space/number/suffix', () => {
    const subject = 'ダンジョン飯 3巻 (HARTA COMIX)';
    const expected = 'ダンジョン飯';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('single-byte no-space/parentheses/number', () => {
    const subject = 'インベスターZ(15)';
    const expected = 'インベスターZ';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('single-byte no-space/symbol/number', () => {
    const subject = 'ログ・ホライズン カナミ、ゴー! イースト!1 (B\'s-LOG COMICS)';
    const expected = 'ログ・ホライズン カナミ、ゴー! イースト!';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('single-byte symbol/space/number', () => {
    const subject = '俺物語!! 13 (マーガレットコミックスDIGITAL)';
    const expected = '俺物語!!';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('double-byte space/number', () => {
    const subject = 'ダーウィンズゲーム　１１ (少年チャンピオン・コミックス)';
    const expected = 'ダーウィンズゲーム';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('double-byte parentheses/number', () => {
    const subject = 'バトルスタディーズ（８） (モーニングコミックス)';
    const expected = 'バトルスタディーズ';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('double-byte symbol/parentheses/number', () => {
    const subject = 'グラゼニ～東京ドーム編～（９） (モーニングコミックス)';
    const expected = 'グラゼニ～東京ドーム編～';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('mix-byte symbol(d)/space(d)/number', () => {
    const subject = 'BTOOOM！　21巻 (バンチコミックス)';
    const expected = 'BTOOOM！';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('mix-byte symbol(d)/space/parantheses(d)/number', () => {
    const subject = '女騎士、経理になる。 (5) (バーズコミックス)';
    const expected = '女騎士、経理になる。';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('mix-byte symbol(target,d)/space(d)/number/suffix', () => {
    const subject = '三成さんは京都を許さない―琵琶湖ノ水ヲ止メヨ―　1巻 (バンチコミックス)';
    const expected = '三成さんは京都を許さない―琵琶湖ノ水ヲ止メヨ';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('mix-byte space(s)/special', () => {
    const subject = '国民クイズ 下';
    const expected = '国民クイズ';
    expect(extractTitle(subject)).toBe(expected);
  });

  it('beginning with numbers', () => {
    const subject = '１９８４年　─まんがで読破─';
    const expected = subject;
    expect(extractTitle(subject)).toBe(expected);
  });
});
