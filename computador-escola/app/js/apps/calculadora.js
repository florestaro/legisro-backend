// Calculadora simples: bom para treinar cliques e o teclado numérico.
(function () {
  CE.registrarApp({
    id: 'calculadora',
    nome: 'Calculadora',
    icone: '🧮',
    largura: 320,
    altura: 470,
    abrir(corpo) {
      let atual = '0', anterior = null, operacao = null, novoNumero = true;
      const visor = CE.el('div', { class: 'calc-visor', 'aria-live': 'polite' }, '0');
      const conta = CE.el('div', { class: 'calc-conta' });

      const calcular = (a, b, op) => ({ '+': a + b, '−': a - b, '×': a * b, '÷': b === 0 ? NaN : a / b }[op]);
      const mostrar = (n) => (Number.isFinite(n) ? String(Math.round(n * 1e10) / 1e10).replace('.', ',') : 'Não dá para dividir por zero');

      function apertar(t) {
        if (/^\d$/.test(t)) {
          atual = novoNumero || atual === '0' ? t : atual + t;
          novoNumero = false;
        } else if (t === ',') {
          if (novoNumero) { atual = '0,'; novoNumero = false; } else if (!atual.includes(',')) atual += ',';
        } else if (t === 'C') {
          atual = '0'; anterior = null; operacao = null; novoNumero = true; conta.textContent = '';
        } else if (t === '⌫') {
          atual = atual.length > 1 ? atual.slice(0, -1) : '0';
        } else if (['+', '−', '×', '÷'].includes(t)) {
          const valor = parseFloat(atual.replace(',', '.'));
          anterior = operacao && !novoNumero ? calcular(anterior, valor, operacao) : (anterior !== null && novoNumero ? anterior : valor);
          operacao = t; novoNumero = true;
          conta.textContent = `${mostrar(anterior)} ${t}`;
          atual = mostrar(anterior);
        } else if (t === '=' && operacao) {
          const valor = parseFloat(atual.replace(',', '.'));
          const resultado = calcular(anterior, valor, operacao);
          conta.textContent = `${mostrar(anterior)} ${operacao} ${mostrar(valor)} =`;
          CE.emitir('calculadora:resultado', { a: anterior, b: valor, operacao, resultado });
          atual = mostrar(resultado); anterior = null; operacao = null; novoNumero = true;
        }
        visor.textContent = atual;
      }

      const teclas = ['C', '⌫', '÷', '×', '7', '8', '9', '−', '4', '5', '6', '+', '1', '2', '3', '=', '0', ','];
      corpo.classList.add('calculadora');
      corpo.tabIndex = 0;
      corpo.append(conta, visor, CE.el('div', { class: 'calc-teclas' },
        ...teclas.map((t) => CE.el('button', {
          class: 'calc-tecla' + (/\d|,/.test(t) ? '' : ' operacao') + (t === '=' ? ' igual' : '') + (t === '0' ? ' zero' : ''),
          'data-tecla': t, onclick: () => apertar(t),
        }, t))));
      corpo.addEventListener('keydown', (e) => {
        const mapa = { '+': '+', '-': '−', '*': '×', '/': '÷', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', ',': ',', '.': ',' };
        const t = /^\d$/.test(e.key) ? e.key : mapa[e.key];
        if (t) { e.preventDefault(); apertar(t); }
      });
      setTimeout(() => corpo.focus(), 50);
    },
  });
})();
