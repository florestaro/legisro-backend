// Motor de fórmulas da Planilha, no padrão brasileiro do Excel: vírgula decimal, ";" separando argumentos
// e funções em português (SOMA, MÉDIA, MÁXIMO, MÍNIMO, SE, CONT.SE...).
// Funciona tanto na tela quanto no Node (para testes).
(function (raiz) {
  const ERRO = { DIV: '#DIV/0!', NOME: '#NOME?', VALOR: '#VALOR!', REF: '#REF!', CIRC: '#CIRC!', ND: '#N/D' };
  const ehErro = (v) => typeof v === 'string' && v[0] === '#' && (/!|\?$/.test(v) || v === ERRO.ND);

  // ---------- Endereços ----------
  const letraParaNumero = (l) => [...l].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
  const numeroParaLetra = (n) => { let s = ''; n += 1; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
  function lerEndereco(ref) {
    const m = /^\$?([A-Z]{1,2})\$?(\d+)$/.exec(String(ref).toUpperCase());
    return m ? { col: letraParaNumero(m[1]), lin: Number(m[2]) - 1 } : null;
  }
  const endereco = (col, lin) => numeroParaLetra(col) + (lin + 1);
  function celulasDoIntervalo(a, b) {
    const x = lerEndereco(a), y = lerEndereco(b);
    if (!x || !y) return [];
    const lista = [];
    for (let l = Math.min(x.lin, y.lin); l <= Math.max(x.lin, y.lin); l++)
      for (let c = Math.min(x.col, y.col); c <= Math.max(x.col, y.col); c++) lista.push(endereco(c, l));
    return lista;
  }

  // ---------- Números no formato brasileiro ----------
  // "1.234,56" -> 1234.56 · "R$ 10,00" -> 10 · "50%" -> 0.5 · "12" -> 12 · texto -> null
  function lerNumero(texto) {
    let t = String(texto).trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
    if (!t) return null;
    let fator = 1;
    if (t.endsWith('%')) { fator = 0.01; t = t.slice(0, -1); }
    if (!/^[-+]?[\d.,]+$/.test(t) || !/\d/.test(t)) return null;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^[-+]?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    const n = Number(t);
    return Number.isFinite(n) ? n * fator : null;
  }

  // ---------- Leitura da fórmula ----------
  function separar(formula) {
    const fichas = [];
    let i = 0;
    const s = formula;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '"') {
        let j = i + 1, texto = '';
        while (j < s.length && !(s[j] === '"' && s[j + 1] !== '"')) { texto += s[j] === '"' ? (j++, '"') : s[j]; j++; }
        fichas.push({ t: 'texto', v: texto }); i = j + 1; continue;
      }
      const num = /^\d+(,\d+)?/.exec(s.slice(i));
      if (num) { fichas.push({ t: 'num', v: Number(num[0].replace(',', '.')) }); i += num[0].length; continue; }
      const ref = /^\$?[A-Za-z]{1,2}\$?\d+(?![\w(.])/.exec(s.slice(i));
      if (ref) { fichas.push({ t: 'ref', v: ref[0].toUpperCase().replace(/\$/g, '') }); i += ref[0].length; continue; }
      const nome = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9.]*/.exec(s.slice(i));
      if (nome) { fichas.push({ t: 'nome', v: nome[0].toUpperCase() }); i += nome[0].length; continue; }
      const op = /^(<>|<=|>=|[-+*/^&=<>%();:])/.exec(s.slice(i));
      if (op) { fichas.push({ t: 'op', v: op[0] }); i += op[0].length; continue; }
      throw new Error(ERRO.NOME);
    }
    return fichas;
  }

  // Analisador recursivo: comparação < concatenação (&) < soma < produto < potência < sinal < valor.
  function analisar(fichas) {
    let p = 0;
    const olhar = () => fichas[p];
    const ehOp = (v) => olhar() && olhar().t === 'op' && olhar().v === v;
    const pegar = (v) => { if (!ehOp(v)) throw new Error(ERRO.VALOR); p++; };
    function comparacao() {
      let n = concatenacao();
      while (olhar() && olhar().t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(olhar().v)) { const op = fichas[p++].v; n = { op, a: n, b: concatenacao() }; }
      return n;
    }
    function concatenacao() { let n = soma(); while (ehOp('&')) { p++; n = { op: '&', a: n, b: soma() }; } return n; }
    function soma() { let n = produto(); while (ehOp('+') || ehOp('-')) { const op = fichas[p++].v; n = { op, a: n, b: produto() }; } return n; }
    function produto() { let n = potencia(); while (ehOp('*') || ehOp('/')) { const op = fichas[p++].v; n = { op, a: n, b: potencia() }; } return n; }
    function potencia() { let n = sinal(); while (ehOp('^')) { p++; n = { op: '^', a: n, b: sinal() }; } return n; }
    function sinal() {
      if (ehOp('-')) { p++; return { op: 'neg', a: sinal() }; }
      if (ehOp('+')) { p++; return sinal(); }
      let n = valor();
      while (ehOp('%')) { p++; n = { op: '%', a: n }; }
      return n;
    }
    function valor() {
      const f = fichas[p++];
      if (!f) throw new Error(ERRO.VALOR);
      if (f.t === 'num') return { num: f.v };
      if (f.t === 'texto') return { texto: f.v };
      if (f.t === 'ref') {
        if (ehOp(':')) { p++; const fim = fichas[p++]; if (!fim || fim.t !== 'ref') throw new Error(ERRO.REF); return { intervalo: [f.v, fim.v] }; }
        return { ref: f.v };
      }
      if (f.t === 'nome') {
        if (f.v === 'VERDADEIRO' || f.v === 'FALSO') return { bool: f.v === 'VERDADEIRO' };
        pegar('(');
        const args = [];
        if (!ehOp(')')) { args.push(comparacao()); while (ehOp(';')) { p++; args.push(comparacao()); } }
        pegar(')');
        return { funcao: f.v, args };
      }
      if (f.t === 'op' && f.v === '(') { const n = comparacao(); pegar(')'); return n; }
      throw new Error(ERRO.VALOR);
    }
    const arvore = comparacao();
    if (p < fichas.length) throw new Error(ERRO.VALOR);
    return arvore;
  }

  // ---------- Funções ----------
  const numerosDe = (lista) => lista.flat(Infinity).filter((v) => typeof v === 'number');
  function criterio(regra) {
    const m = /^(<>|<=|>=|=|<|>)?(.*)$/.exec(String(regra));
    const op = m[1] || '=', alvo = m[2];
    const n = lerNumero(alvo);
    return (v) => {
      const a = n != null && typeof v === 'number' ? v : String(v).toLowerCase();
      const b = n != null && typeof v === 'number' ? n : String(alvo).toLowerCase();
      return { '=': a === b, '<>': a !== b, '<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b }[op];
    };
  }
  const FUNCOES = {
    SOMA: (a) => numerosDe(a).reduce((s, n) => s + n, 0),
    'MÉDIA': (a) => { const n = numerosDe(a); if (!n.length) throw new Error(ERRO.DIV); return n.reduce((s, x) => s + x, 0) / n.length; },
    'MÁXIMO': (a) => { const n = numerosDe(a); return n.length ? Math.max(...n) : 0; },
    'MÍNIMO': (a) => { const n = numerosDe(a); return n.length ? Math.min(...n) : 0; },
    'CONT.NÚM': (a) => numerosDe(a).length,
    'CONT.VALORES': (a) => a.flat(Infinity).filter((v) => v !== '' && v != null).length,
    ARRED: ([n, casas = 0]) => { const f = 10 ** num(casas); return Math.round(num(n) * f) / f; },
    'CONT.SE': ([intervalo, regra]) => [].concat(intervalo).flat(Infinity).filter(criterio(regra)).length,
    SOMASE: ([intervalo, regra, somar]) => {
      const lista = [].concat(intervalo).flat(Infinity), valores = somar ? [].concat(somar).flat(Infinity) : lista;
      const teste = criterio(regra);
      return lista.reduce((s, v, i) => s + (teste(v) && typeof valores[i] === 'number' ? valores[i] : 0), 0);
    },
    E: (a) => a.flat(Infinity).every(Boolean),
    OU: (a) => a.flat(Infinity).some(Boolean),
    'MÉDIASE': ([intervalo, regra, media]) => {
      const lista = [].concat(intervalo).flat(Infinity), valores = media ? [].concat(media).flat(Infinity) : lista;
      const teste = criterio(regra);
      const n = lista.map((v, i) => (teste(v) && typeof valores[i] === 'number' ? valores[i] : null)).filter((v) => v != null);
      if (!n.length) throw new Error(ERRO.DIV);
      return n.reduce((s, x) => s + x, 0) / n.length;
    },
    // PROCV(valor; tabela; coluna; [aproximado]): procura o valor na 1ª coluna e devolve a coluna pedida da mesma linha.
    PROCV: ([valor, tabela, coluna, aproximado = true]) => {
      const largura = (tabela && tabela.colunas) || 1;
      const c = Math.floor(num(coluna));
      if (!Array.isArray(tabela) || c < 1 || c > largura) throw new Error(ERRO.REF);
      const linhas = [];
      for (let i = 0; i < tabela.length; i += largura) linhas.push(tabela.slice(i, i + largura));
      const igual = (a) => (typeof a === 'string' && typeof valor === 'string' ? a.toLowerCase() === valor.toLowerCase() : a === valor);
      let achou = linhas.find((l) => igual(l[0]));
      if (!achou && aproximado && typeof valor === 'number') {
        const menores = linhas.filter((l) => typeof l[0] === 'number' && l[0] <= valor);
        achou = menores[menores.length - 1];
      }
      if (!achou) throw new Error(ERRO.ND);
      return achou[c - 1];
    },
    CONCATENAR: (a) => a.flat(Infinity).map((v) => textoDe(v)).join(''),
    'MAIÚSCULA': ([t]) => textoDe(t).toUpperCase(),
    'MINÚSCULA': ([t]) => textoDe(t).toLowerCase(),
    'CONT.VAZIO': (a) => a.flat(Infinity).filter((v) => v === '' || v == null).length,
    ABS: ([n]) => Math.abs(num(n)),
    HOJE: () => new Date().toLocaleDateString('pt-BR'),
  };
  const APELIDOS = {
    MEDIA: 'MÉDIA', MAXIMO: 'MÁXIMO', MINIMO: 'MÍNIMO', MAX: 'MÁXIMO', MIN: 'MÍNIMO', 'CONT.NUM': 'CONT.NÚM', ARREDONDAR: 'ARRED',
    MEDIASE: 'MÉDIASE', MAIUSCULA: 'MAIÚSCULA', MINUSCULA: 'MINÚSCULA', CONCAT: 'CONCATENAR',
  };

  function num(v) {
    if (ehErro(v)) throw new Error(v);
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v === '' || v == null) return 0;
    const n = lerNumero(v);
    if (n == null) throw new Error(ERRO.VALOR);
    return n;
  }

  // ---------- Cálculo ----------
  // obterCelula(ref) devolve o valor já calculado da célula (número, texto, booleano ou erro).
  function avaliar(no, obterCelula) {
    if ('num' in no) return no.num;
    if ('texto' in no) return no.texto;
    if ('bool' in no) return no.bool;
    if (no.ref) { const v = obterCelula(no.ref); if (ehErro(v)) throw new Error(v); return v; }
    if (no.intervalo) {
      const lista = celulasDoIntervalo(...no.intervalo).map((r) => { const v = obterCelula(r); if (ehErro(v)) throw new Error(v); return v; });
      const [a, b] = no.intervalo.map(lerEndereco);
      lista.colunas = Math.abs(b.col - a.col) + 1; // o PROCV precisa saber a largura da tabela
      return lista;
    }
    if (no.funcao) {
      const nome = APELIDOS[no.funcao] || no.funcao;
      if (nome === 'SE') {
        const cond = avaliar(no.args[0], obterCelula);
        const ramo = (Array.isArray(cond) ? cond[0] : cond) ? no.args[1] : no.args[2];
        return ramo ? avaliar(ramo, obterCelula) : false;
      }
      const f = FUNCOES[nome];
      if (!f) throw new Error(ERRO.NOME);
      return f(no.args.map((a) => avaliar(a, obterCelula)));
    }
    const a = () => avaliar(no.a, obterCelula), b = () => avaliar(no.b, obterCelula);
    switch (no.op) {
      case 'neg': return -num(a());
      case '%': return num(a()) / 100;
      case '+': return num(a()) + num(b());
      case '-': return num(a()) - num(b());
      case '*': return num(a()) * num(b());
      case '/': { const d = num(b()); if (d === 0) throw new Error(ERRO.DIV); return num(a()) / d; }
      case '^': return num(a()) ** num(b());
      case '&': return `${textoDe(a())}${textoDe(b())}`;
      default: {
        let x = a(), y = b();
        if (typeof x === 'string' && typeof y === 'string') { x = x.toLowerCase(); y = y.toLowerCase(); }
        return { '=': x === y, '<>': x !== y, '<': x < y, '>': x > y, '<=': x <= y, '>=': x >= y }[no.op];
      }
    }
  }

  function calcularFormula(formula, obterCelula) {
    try {
      const v = avaliar(analisar(separar(formula.replace(/^=/, ''))), obterCelula);
      if (Array.isArray(v)) return v[0] ?? 0;
      if (typeof v === 'number' && !Number.isFinite(v)) return ERRO.DIV;
      return v;
    } catch (e) {
      return ehErro(e.message) ? e.message : ERRO.VALOR;
    }
  }

  // Calcula todas as células. entradas: { A1: '10', B1: '=A1*2', ... } -> { A1: 10, B1: 20 }
  function calcularTudo(entradas) {
    const resultado = {};
    const calculando = new Set();
    function obter(ref) {
      if (ref in resultado) return resultado[ref];
      const entrada = entradas[ref];
      if (entrada == null || entrada === '') return '';
      if (String(entrada)[0] !== '=') {
        const n = lerNumero(entrada);
        return (resultado[ref] = n != null ? n : String(entrada));
      }
      if (calculando.has(ref)) return ERRO.CIRC;
      calculando.add(ref);
      const v = calcularFormula(String(entrada), obter);
      calculando.delete(ref);
      return (resultado[ref] = v);
    }
    Object.keys(entradas).forEach(obter);
    return { valores: resultado, obter };
  }

  // Ao copiar uma fórmula para outra célula, as referências "andam" junto (menos as que têm $).
  function ajustarFormula(formula, dLin, dCol) {
    if (String(formula)[0] !== '=') return formula;
    return formula.replace(/("[^"]*")|(\$?)([A-Z]{1,2})(\$?)(\d+)(?![\w(.])/gi, (tudo, texto, fixaCol, col, fixaLin, lin) => {
      if (texto) return texto;
      const c = fixaCol ? letraParaNumero(col.toUpperCase()) : letraParaNumero(col.toUpperCase()) + dCol;
      const l = fixaLin ? Number(lin) - 1 : Number(lin) - 1 + dLin;
      if (c < 0 || l < 0) return ERRO.REF;
      return `${fixaCol}${numeroParaLetra(c)}${fixaLin}${l + 1}`;
    });
  }

  // ---------- Exibição ----------
  const fmt = (n, casas) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  function textoDe(v, formato) {
    if (v === '' || v == null) return '';
    if (typeof v === 'boolean') return v ? 'VERDADEIRO' : 'FALSO';
    if (typeof v !== 'number') return String(v);
    if (formato === 'moeda') return 'R$ ' + fmt(v, 2);
    if (formato === 'porcentagem') return fmt(v * 100, 0) + '%';
    if (formato === 'decimal') return fmt(v, 2);
    return v.toLocaleString('pt-BR', { maximumFractionDigits: 10 });
  }

  const API = { ERRO, lerEndereco, endereco, numeroParaLetra, letraParaNumero, celulasDoIntervalo, lerNumero, calcularFormula, calcularTudo, ajustarFormula, textoDe, ehErro };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else { raiz.CE = raiz.CE || {}; raiz.CE.formulas = API; }
})(typeof window !== 'undefined' ? window : globalThis);
