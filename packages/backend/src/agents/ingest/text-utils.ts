const DROP_TAGS = [
  'script',
  'style',
  'noscript',
  'svg',
  'math',
  'iframe',
  'canvas',
  'header',
  'footer',
  'nav',
  'aside',
  'form',
  'button',
  'input',
  'select',
  'option',
  'label',
  'dialog',
  'video',
  'audio',
  'picture',
  'source',
  'track',
  'link',
  'meta',
  'title',
];

const BLOCK_BREAK_TAGS = [
  'p',
  'br',
  'hr',
  'li',
  'ul',
  'ol',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'tr',
  'td',
  'th',
  'section',
  'article',
  'main',
  'div',
];

const NOISE_PATTERNS: RegExp[] = [
  // intercom/licenças/fonts/menus
  /This Font Software is licensed under the SIL Open Font License.*$/gim,
  /Copyright \(c\).*?Intercom.*?Reserved Font Name.*$/gim,
  /Passar para o conteúdo principal/gi,
  /Portugu[eê]s do Brasil/gi,
  /Central de Ajuda da InfinitePay/gi,
  /\b(Sum[áa]rio|Menu|Navega[çc][ãa]o|Artigos relacionados)\b/gi,
  /Instagram|TikTok|YouTube|Facebook|Twitter|Blog/gi,
  /Pesquisar artigos\.\.\./gi,
  // emojis de navegação e UI comuns
  /🔒|🔔|⚙️|📖|📦|📍/g,
];

function stripTags(html: string, tag: string): string {
  const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi');
  const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
  return html.replace(re, '').replace(selfClosing, '');
}

function replaceWithBreaks(html: string, tag: string): string {
  const open = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  const close = new RegExp(`<\\/${tag}>`, 'gi');
  return html.replace(open, '\n').replace(close, '\n');
}

export function htmlToCleanText(html: string): string {
  let s = html;

  // 1) remove comentários
  s = s.replace(/<!--([\s\S]*?)-->/g, ' ');

  // 2) remove tags inteiras que não interessam
  for (const t of DROP_TAGS) s = stripTags(s, t);

  // 3) quebra de linha em blocos relevantes
  for (const t of BLOCK_BREAK_TAGS) s = replaceWithBreaks(s, t);

  // 4) tira quaisquer marcas HTML remanescentes
  s = s.replace(/<[^>]+>/g, ' ');

  // 5) normaliza espaços
  s = s.replace(/\u00a0/g, ' '); // &nbsp;
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/ *\n+ */g, '\n');

  // 6) remove “ruídos” conhecidos
  for (const re of NOISE_PATTERNS) s = s.replace(re, ' ');

  // 7) colapsa linhas vazias em excesso
  s = s
    .split('\n')
    .map((ln) => ln.trim())
    .filter((ln, idx, arr) => !(ln.length === 0 && arr[idx - 1]?.length === 0))
    .join('\n');

  // 8) limpa espaços finais
  s = s
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return s;
}

// chunk simples com overlap
export function chunkString(
  text: string,
  size: number,
  overlap: number,
): string[] {
  const out: string[] = [];
  if (!text || size <= 0) return out;

  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + size);
    out.push(text.slice(i, end));
    if (end === text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return out;
}
