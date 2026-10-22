// Treino do Teclado: o aluno aperta qualquer tecla e o programa mostra o nome dela e para que serve.
// Tem também uma caixa para escrever e ver o efeito de Enter, Backspace, Shift, Caps Lock e acentos.
(function () {
  const EXPLICA = {
    Enter: ['Enter', 'Pula para a linha de baixo quando você escreve. Também confirma, como um "OK".'],
    Backspace: ['Backspace (apagar)', 'Apaga a letra que está ANTES do cursor (à esquerda).'],
    Delete: ['Delete', 'Apaga a letra que está DEPOIS do cursor (à direita). Também apaga arquivos selecionados.'],
    ' ': ['Barra de espaço', 'Coloca um espaço entre as palavras. É a tecla mais comprida.'],
    Shift: ['Shift', 'Segure junto com uma letra para fazer letra MAIÚSCULA, ou junto com um número para fazer o símbolo de cima.'],
    CapsLock: ['Caps Lock', 'Liga e desliga o modo de escrever TUDO EM MAIÚSCULAS. Uma luzinha no teclado mostra quando está ligado.'],
    Tab: ['Tab', 'Pula para o próximo campo de um formulário ou faz um recuo no texto.'],
    Escape: ['Esc', 'Cancela ou fecha alguma coisa, como um menu ou uma tela cheia.'],
    ArrowUp: ['Seta para cima', 'Move o cursor uma linha para cima.'],
    ArrowDown: ['Seta para baixo', 'Move o cursor uma linha para baixo.'],
    ArrowLeft: ['Seta para a esquerda', 'Move o cursor uma letra para a esquerda.'],
    ArrowRight: ['Seta para a direita', 'Move o cursor uma letra para a direita.'],
    Control: ['Ctrl (Control)', 'Usada junto com outras teclas para atalhos. Ex.: Ctrl + S salva o documento.'],
    Alt: ['Alt', 'Usada em atalhos. Ex.: Alt + Tab troca de janela.'],
    AltGraph: ['Alt Gr', 'Faz o terceiro símbolo de algumas teclas, como o / e o ?.'],
    Meta: ['Tecla Windows', 'Abre o menu Iniciar.'],
    OS: ['Tecla Windows', 'Abre o menu Iniciar.'],
    Home: ['Home', 'Leva o cursor para o começo da linha.'],
    End: ['End', 'Leva o cursor para o fim da linha.'],
    PageUp: ['Page Up', 'Sobe uma página inteira.'],
    PageDown: ['Page Down', 'Desce uma página inteira.'],
    Insert: ['Insert', 'Liga e desliga o modo de escrever por cima das letras.'],
    NumLock: ['Num Lock', 'Liga e desliga os números do teclado numérico (à direita).'],
    Dead: ['Tecla de acento', 'Aperte o acento e depois a letra: ´ + a = á, ~ + a = ã.'],
  };
  const LAYOUT = [
    [['Escape', 'Esc'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'], ['Backspace', '⟵ Backspace', 'largo2']],
    [['Tab', 'Tab ⇥', 'largo'], ['q'], ['w'], ['e'], ['r'], ['t'], ['y'], ['u'], ['i'], ['o'], ['p'], ['Delete', 'Delete', 'largo']],
    [['CapsLock', 'Caps Lock', 'largo2'], ['a'], ['s'], ['d'], ['f'], ['g'], ['h'], ['j'], ['k'], ['l'], ['ç'], ['Enter', 'Enter ↵', 'largo2']],
    [['Shift', '⇧ Shift', 'largo3'], ['z'], ['x'], ['c'], ['v'], ['b'], ['n'], ['m'], [','], ['.'], ['ArrowUp', '↑'], ['Shift', '⇧ Shift', 'largo']],
    [['Control', 'Ctrl', 'largo'], ['Meta', '⊞'], ['Alt', 'Alt'], [' ', 'Espaço', 'espaco'], ['AltGraph', 'Alt Gr'], ['ArrowLeft', '←'], ['ArrowDown', '↓'], ['ArrowRight', '→']],
  ];

  CE.registrarApp({
    id: 'teclas',
    nome: 'Treino do Teclado',
    icone: '🎹',
    largura: 900,
    altura: 600,
    abrir(corpo) {
      const nome = CE.el('div', { class: 'tc-nome' }, 'Aperte uma tecla');
      const explica = CE.el('p', { class: 'tc-explica' }, 'Clique aqui dentro e aperte qualquer tecla do teclado. Eu digo o nome dela e para que ela serve.');
      const capsAviso = CE.el('div', { class: 'tc-caps', hidden: true }, '🔠 Caps Lock LIGADO: tudo sai em maiúsculas');
      const teclado = CE.el('div', { class: 'tc-teclado' }, ...LAYOUT.map((linha) => CE.el('div', { class: 'tc-linha' },
        ...linha.map(([tecla, rotulo, classe]) => CE.el('span', { class: 'tc-tecla ' + (classe || ''), 'data-tecla': tecla.toLowerCase() }, rotulo || tecla.toUpperCase())))));
      const caixa = CE.el('textarea', { class: 'tc-caixa', placeholder: 'Escreva aqui para testar as teclas...', spellcheck: 'false', 'aria-label': 'Caixa para escrever' });

      function acender(tecla) {
        teclado.querySelectorAll('.tc-tecla').forEach((t) => t.classList.remove('apertada'));
        teclado.querySelectorAll(`.tc-tecla[data-tecla="${CSS.escape(tecla.toLowerCase())}"]`).forEach((t) => t.classList.add('apertada'));
      }

      // Escuta o teclado todo enquanto esta janela for a ativa (assim funciona mesmo sem clicar dentro dela),
      // menos quando o aluno está escrevendo em outro campo, como a pergunta ao professor.
      function aoApertar(e) {
        const janelaAtiva = CE.janelas.ativa();
        if (!corpo.contains(e.target) && (!janelaAtiva || janelaAtiva.id !== 'teclas' || e.target.closest('input, textarea, select'))) return;
        const tecla = e.key === 'Esc' ? 'Escape' : e.key;
        if (tecla === 'Tab') e.preventDefault();
        if (e.target !== caixa && [' ', 'ArrowUp', 'ArrowDown', 'Enter'].includes(tecla)) e.preventDefault();
        const info = EXPLICA[tecla] || (tecla.length === 1
          ? [/\d/.test(tecla) ? `Número ${tecla}` : /\p{L}/u.test(tecla) ? `Letra ${tecla.toUpperCase()}` : `Símbolo ${tecla}`, tecla !== tecla.toLowerCase() ? 'Letra maiúscula!' : 'Escreve este caractere na tela.']
          : [tecla, 'Uma tecla especial.']);
        nome.textContent = info[0];
        explica.textContent = info[1];
        acender(tecla.length === 1 ? tecla.toLowerCase() : tecla);
        capsAviso.hidden = !(e.getModifierState && e.getModifierState('CapsLock'));
        CE.emitir('tecla:apertada', { tecla, shift: e.shiftKey, ctrl: e.ctrlKey, caps: !capsAviso.hidden });
      }
      document.addEventListener('keydown', aoApertar);
      caixa.addEventListener('input', () => CE.emitir('teclas:texto', { texto: caixa.value }));

      corpo.classList.add('treino-teclas');
      corpo.tabIndex = 0;
      corpo.append(CE.el('div', { class: 'tc-topo' }, nome, explica, capsAviso), teclado, caixa);
      setTimeout(() => corpo.focus(), 50);
      return { aoFechar() { document.removeEventListener('keydown', aoApertar); return true; } };
    },
  });
})();
