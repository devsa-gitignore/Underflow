const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const LATIN_REGEX = /[A-Za-z]/;

const directWordMap = {
  aarti: 'आरती',
  patel: 'पटेल',
  pooja: 'पूजा',
  rahul: 'राहुल',
  sunita: 'सुनीता',
  meena: 'मीना',
  kishan: 'किशन',
  ramesh: 'रमेश',
  sita: 'सीता',
  gita: 'गीता',
  anil: 'अनिल',
  vikram: 'विक्रम',
  neha: 'नेहा',
  sharma: 'शर्मा',
  kumar: 'कुमार',
  kumari: 'कुमारी',
  joshi: 'जोशी',
  rao: 'राव',
  singh: 'सिंह',
  gupta: 'गुप्ता',
  lal: 'लाल',
  parmar: 'परमार',
  dev: 'देव',
  blitz: 'ब्लिट्ज',
  taro: 'तारो',
};

const consonantMap = {
  ksh: 'क्ष',
  chh: 'छ',
  tch: 'च',
  dny: 'ज्ञ',
  gny: 'ज्ञ',
  shr: 'श्र',
  ph: 'फ',
  bh: 'भ',
  dh: 'ध',
  th: 'थ',
  gh: 'घ',
  kh: 'ख',
  ch: 'च',
  jh: 'झ',
  sh: 'श',
  ng: 'ङ',
  ny: 'ञ',
  tr: 'त्र',
  gy: 'ज्ञ',
  q: 'क',
  x: 'क्स',
  c: 'क',
  k: 'क',
  g: 'ग',
  j: 'ज',
  t: 'ट',
  d: 'द',
  n: 'न',
  p: 'प',
  b: 'ब',
  m: 'म',
  y: 'य',
  r: 'र',
  l: 'ल',
  v: 'व',
  w: 'व',
  s: 'स',
  h: 'ह',
  f: 'फ',
  z: 'ज़',
};

const independentVowels = {
  ai: 'ऐ',
  au: 'औ',
  aa: 'आ',
  ee: 'ई',
  ii: 'ई',
  oo: 'ऊ',
  uu: 'ऊ',
  a: 'अ',
  i: 'इ',
  e: 'ए',
  u: 'उ',
  o: 'ओ',
};

const vowelSigns = {
  ai: 'ै',
  au: 'ौ',
  aa: 'ा',
  ee: 'ी',
  ii: 'ी',
  oo: 'ू',
  uu: 'ू',
  a: '',
  i: 'ि',
  e: 'े',
  u: 'ु',
  o: 'ो',
};

function getVowelToken(word, index) {
  const tokens = ['ai', 'au', 'aa', 'ee', 'ii', 'oo', 'uu', 'a', 'i', 'e', 'u', 'o'];
  return tokens.find((token) => word.startsWith(token, index)) || '';
}

function getConsonantToken(word, index) {
  const tokens = Object.keys(consonantMap).sort((a, b) => b.length - a.length);
  return tokens.find((token) => word.startsWith(token, index)) || '';
}

function transliterateLatinWord(word) {
  const lower = word.toLowerCase();
  if (directWordMap[lower]) return directWordMap[lower];

  let result = '';
  let index = 0;

  while (index < lower.length) {
    const char = lower[index];

    if (!/[a-z]/.test(char)) {
      result += word[index];
      index += 1;
      continue;
    }

    const vowelToken = getVowelToken(lower, index);
    if (vowelToken) {
      result += independentVowels[vowelToken];
      index += vowelToken.length;
      continue;
    }

    const consonantToken = getConsonantToken(lower, index);
    if (!consonantToken) {
      result += word[index];
      index += 1;
      continue;
    }

    const consonant = consonantMap[consonantToken];
    index += consonantToken.length;

    const nextVowel = getVowelToken(lower, index);
    if (nextVowel) {
      result += consonant + vowelSigns[nextVowel];
      index += nextVowel.length;
    } else {
      result += consonant;
    }
  }

  return result;
}

export function translatePersonName(name, language) {
  if (language !== 'hi') return name;

  return name
    .split(/(\s+|-)/)
    .map((part) => {
      if (!LATIN_REGEX.test(part) || DEVANAGARI_REGEX.test(part)) return part;
      return transliterateLatinWord(part);
    })
    .join('');
}

export function translateWardLabel(ward, language) {
  if (language !== 'hi') return ward;
  return ward.replace(/^Ward/i, 'वार्ड');
}
