export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  difficulty: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion(idPrefix: string, text: string, correct: string, wrongs: string[], difficulty: number): Question {
  const options = shuffle([correct, ...wrongs]);
  return {
    id: `${idPrefix}-${Date.now()}-${Math.random()}`,
    text,
    options,
    correctIndex: options.indexOf(correct),
    difficulty,
  };
}

function generateFloor1_3(): Question {
  const type = randInt(0, 2);

  if (type === 0) {
    const base = randInt(2, 5);
    const exp = randInt(2, 3);
    const answer = Math.pow(base, exp);
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = Math.pow(base, randInt(1, 4));
      if (w !== answer) wrongs.add(String(w));
    }
    return makeQuestion("easy", `Se uma caixa se multiplica por ${base} a cada rodada, após ${exp} rodadas ela vale quanto? (${base}^${exp})`, String(answer), [...wrongs], 1);
  }

  if (type === 1) {
    const n = randInt(2, 10);
    const wrongs = ["0", String(n), String(randInt(2, 20))].filter(w => w !== "1");
    while (wrongs.length < 3) wrongs.push(String(randInt(2, 20)));
    return makeQuestion("easy", `Qualquer número elevado a zero resulta em quê? (${n}^0)`, "1", wrongs.slice(0, 3), 1);
  }

  const base = randInt(2, 4);
  const exp = randInt(2, 3);
  const result = Math.pow(base, exp);
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const wb = randInt(2, 5);
    const we = randInt(2, 3);
    const w = Math.pow(wb, we);
    if (w !== result) wrongs.add(`${wb}^${we}`);
  }
  return makeQuestion("easy", `Um quadrado tem lado ${base}. Se sua área fosse elevada ao cubo (${base}²), qual expressão dá o mesmo resultado que ${result}?`, `${base}^${exp}`, [...wrongs], 1);
}

function generateFloor4_6(): Question {
  const type = randInt(0, 2);

  if (type === 0) {
    const base = randInt(2, 4);
    const e1 = randInt(2, 3);
    const e2 = randInt(2, 3);
    const answer = e1 + e2;
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = randInt(2, 8);
      if (w !== answer) wrongs.add(`${base}^${w}`);
    }
    return makeQuestion("mid", `Ao multiplicar potências de mesma base, os expoentes se somam. Quanto é ${base}^${e1} × ${base}^${e2}?`, `${base}^${answer}`, [...wrongs], 2);
  }

  if (type === 1) {
    const base = randInt(2, 4);
    const e1 = randInt(4, 6);
    const e2 = randInt(1, 3);
    const answer = e1 - e2;
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = randInt(1, 8);
      if (w !== answer) wrongs.add(`${base}^${w}`);
    }
    return makeQuestion("mid", `Na divisão de mesma base, subtraímos os expoentes. Quanto é ${base}^${e1} ÷ ${base}^${e2}?`, `${base}^${answer}`, [...wrongs], 2);
  }

  const base = randInt(2, 3);
  const e1 = randInt(2, 3);
  const e2 = randInt(2, 3);
  const answer = Math.pow(base, e1 * e2);
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const w = Math.pow(base, e1 + e2) + randInt(-5, 5);
    if (w !== answer && w > 0) wrongs.add(String(w));
  }
  return makeQuestion("mid", `Potência de potência: multiplicamos os expoentes. Quanto vale (${base}^${e1})^${e2}?`, String(answer), [...wrongs], 2);
}

function generateFloor7_9(): Question {
  const type = randInt(0, 2);

  if (type === 0) {
    const base = randInt(2, 5);
    const exp = randInt(1, 3);
    const answerStr = `1/${Math.pow(base, exp)}`;
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const wb = randInt(2, 6);
      const we = randInt(1, 3);
      const w = `1/${Math.pow(wb, we)}`;
      if (w !== answerStr) wrongs.add(w);
    }
    return makeQuestion("med", `Expoente negativo inverte a base. Quanto é ${base}^(-${exp})?`, answerStr, [...wrongs], 3);
  }

  if (type === 1) {
    const base = randInt(2, 4);
    const exp = randInt(2, 4);
    const val = Math.pow(base, exp);
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = randInt(2, 8);
      if (w !== exp) wrongs.add(String(w));
    }
    return makeQuestion("med", `A quantas vezes precisamos elevar ${base} para obter ${val}? (log${base}(${val}))`, String(exp), [...wrongs], 3);
  }

  const a = randInt(2, 4);
  const b = randInt(2, 4);
  const e = randInt(2, 3);
  const answer = Math.pow(a * b, e);
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const w = Math.pow(a, e) + Math.pow(b, e) + randInt(-10, 10);
    if (w !== answer && w > 0) wrongs.add(String(w));
  }
  return makeQuestion("med", `O produto dentro do parêntese também é elevado. Quanto é (${a}×${b})^${e}?`, String(answer), [...wrongs], 3);
}

function generateFloor10_11(): Question {
  const type = randInt(0, 2);

  if (type === 0) {
    const base = randInt(2, 3);
    const e1 = randInt(2, 4);
    const e2 = randInt(2, 4);
    const answer = `${base}^${e1 + e2}`;
    const wrongs = [
      `${base}^${e1 * e2}`,
      `${base}^${Math.abs(e1 - e2)}`,
      `${base * 2}^${e1 + e2}`,
    ].filter(w => w !== answer);
    while (wrongs.length < 3) wrongs.push(`${base}^${randInt(1, 10)}`);
    return makeQuestion("hard", `Simplificando ${base}^${e1} × ${base}^${e2} como uma única potência, obtemos:`, answer, wrongs.slice(0, 3), 4);
  }

  if (type === 1) {
    const base = randInt(2, 3);
    const outer = randInt(2, 3);
    const inner = randInt(2, 3);
    const answer = outer * inner;
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = randInt(2, 12);
      if (w !== answer) wrongs.add(`${base}^${w}`);
    }
    return makeQuestion("hard", `Aplicando potência de potência em (${base}^${inner})^${outer}, o expoente final é:`, `${base}^${answer}`, [...wrongs], 4);
  }

  const base = randInt(2, 4);
  const exp = randInt(2, 4);
  const mod = randInt(3, 7);
  const val = Math.pow(base, exp);
  const answer = val % mod;
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const w = randInt(0, mod - 1);
    if (w !== answer) wrongs.add(String(w));
  }
  return makeQuestion("hard", `Qual o resto da divisão de ${base}^${exp} por ${mod}?`, String(answer), [...wrongs], 4);
}

function generateFloor12_15(): Question {
  const type = randInt(0, 3);

  if (type === 0) {
    const base = randInt(2, 3);
    const e1 = randInt(3, 5);
    const e2 = randInt(2, 4);
    const answer = e1 * e2;
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = randInt(2, 20);
      if (w !== answer) wrongs.add(`${base}^${w}`);
    }
    return makeQuestion("expert", `Se aplicarmos duas potências consecutivas ((${base}^${e1}))^${e2}, qual o expoente resultante?`, String(answer), [...wrongs], 5);
  }

  if (type === 1) {
    const bases = [2, 3, 5];
    const b1 = bases[randInt(0, 2)];
    const b2 = bases[randInt(0, 2)];
    const e = randInt(2, 4);
    const answer = Math.pow(b1, e) * Math.pow(b2, e);
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = Math.pow(b1 * b2, e) + randInt(-50, 50);
      if (w !== answer && w > 0) wrongs.add(String(w));
    }
    return makeQuestion("expert", `Dois valores crescem exponencialmente com o mesmo expoente. Quanto é ${b1}^${e} × ${b2}^${e}?`, String(answer), [...wrongs], 5);
  }

  if (type === 2) {
    const base = randInt(2, 3);
    const target = randInt(3, 6);
    const answer = Math.pow(base, target);
    const logVal = target;
    const wrongs = new Set<string>();
    while (wrongs.size < 3) {
      const w = randInt(2, 8);
      if (w !== logVal) wrongs.add(String(Math.pow(base, w)));
    }
    return makeQuestion("expert", `Se o logaritmo de x na base ${base} é ${logVal}, qual o valor de x?`, String(answer), [...wrongs], 5);
  }

  const a = randInt(2, 3);
  const b = randInt(2, 3);
  const e1 = randInt(2, 4);
  const e2 = randInt(2, 4);
  const numExp = e1 + e2;
  const denExp = e1;
  const answer = `${a}^${numExp - denExp}×${b}^${e2}`;
  const wrongs = [
    `${a}^${e1}×${b}^${e2}`,
    `${a}^${e2}×${b}^${e1}`,
    `${a * b}^${e2}`,
  ].filter(w => w !== answer);
  while (wrongs.length < 3) wrongs.push(`${a}^${randInt(1, 6)}×${b}^${randInt(1, 6)}`);
  return makeQuestion("expert", `Simplifique a expressão: (${a}^${e1}×${b}^${e2})×${a}^${e2} ÷ ${a}^${e1}`, answer, wrongs.slice(0, 3), 5);
}

export function getQuestionForFloor(floor: number): Question {
  if (floor <= 3) return generateFloor1_3();
  if (floor <= 6) return generateFloor4_6();
  if (floor <= 9) return generateFloor7_9();
  if (floor <= 11) return generateFloor10_11();
  return generateFloor12_15();
}
