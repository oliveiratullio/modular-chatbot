import * as cheerio from 'cheerio';

export function htmlToCleanText(html: string) {
  const $ = cheerio.load(html);
  $('script,noscript,style,iframe').remove();
  const text = $('body').text();
  return text
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// chunks por roughly ~N caracteres (aprox dos tokens)
export function chunkString(s: string, size = 2800, overlap = 700) {
  const chunks: string[] = [];
  let i = 0;
  while (i < s.length) {
    const end = Math.min(i + size, s.length);
    chunks.push(s.slice(i, end));
    if (end === s.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}
