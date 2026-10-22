// Configurações do computador (parecidas com as do Windows): fundo de tela, acessibilidade, data e hora, som,
// instalar e desinstalar programas, antivírus, atualizações, impressoras, backup e informações do computador.
// Tudo é de treino e fica guardado no progresso de cada aluno (p.config).
(function () {
  const fusoLocal = -new Date().getTimezoneOffset() / 60;
  const PADRAO = {
    fundo: 'fundo-azul', zoom: 1, contraste: false, cursorGrande: false, volume: 100, mudo: false,
    fuso: null, automatico: true, ajusteMs: 0, instalados: [],
    impressoras: [{ nome: 'Impressora da sala (treino)', padrao: true }],
    protecao: true, firewall: true, ameaca: false, antivirusEm: null, atualizacoesFeitas: false, ultimoBackup: null,
  };
  const FUSOS = [[-2, 'Fernando de Noronha (UTC−2)'], [-3, 'Brasília, São Paulo, Nordeste (UTC−3)'], [-4, 'Porto Velho, Manaus, Cuiabá (UTC−4)'], [-5, 'Rio Branco, Acre (UTC−5)']];
  const LOJA = [
    { id: 'bloco-notas', nome: 'Bloco de Notas', icone: '🗒️', editora: 'Computador Escola', verificado: true, tamanho: '2 MB', descricao: 'Para anotações rápidas, sem formatação.' },
    { id: 'cronometro', nome: 'Relógio e Cronômetro', icone: '⏱️', editora: 'Computador Escola', verificado: true, tamanho: '3 MB', descricao: 'Relógio, cronômetro e alarme.' },
    { id: 'jogo-memoria', nome: 'Jogo da Memória', icone: '🃏', editora: 'Computador Escola', verificado: true, tamanho: '5 MB', descricao: 'Ache os pares de figuras. Treina o mouse e a memória.' },
    { id: 'acelerador', nome: 'Acelerador de PC TURBO 3000 — GRÁTIS!!!', icone: '🚀', editora: 'Desconhecida', verificado: false, tamanho: '48 MB', descricao: 'Deixa seu computador 1000% mais rápido!!! Instale já e ganhe prêmios!!!', perigoso: true },
  ];
  const ATUALIZACOES = ['Atualização de segurança do sistema (outubro)', 'Atualização do Navegador (correções de segurança)'];
  const IMPRESSORAS_REDE = ['Impressora Sala 2 (rede)', 'Impressora da Secretaria (rede)'];

  let atual = { ...PADRAO };
  let propaganda = null;

  function aplicar() {
    const area = document.getElementById('area-de-trabalho');
    if (area && CE.FUNDOS_TELA) {
      CE.FUNDOS_TELA.forEach((f) => area.classList.remove(f.id));
      area.classList.add(atual.fundo);
    }
    document.body.classList.toggle('alto-contraste', !!atual.contraste);
    document.body.classList.toggle('cursor-grande', !!atual.cursorGrande);
    CE.api.chamar('janela:zoom', atual.zoom || 1);
    CE.voz.definirVolume(atual.mudo ? 0 : atual.volume / 100);
    clearInterval(propaganda);
    if (atual.ameaca && CE.sessao.usuario) propaganda = setInterval(mostrarPropaganda, 40000);
  }

  // O "programa indesejado" fica abrindo propaganda até o antivírus remover.
  function mostrarPropaganda() {
    if (!atual.ameaca || document.querySelector('.propaganda-falsa')) return;
    const caixa = CE.el('div', { class: 'propaganda-falsa', role: 'dialog' },
      CE.el('button', { class: 'propaganda-fechar', 'data-acao': 'fechar-propaganda', title: 'Fechar', onclick: () => caixa.remove() }, '✕'),
      CE.el('strong', {}, '⚠️ SEU PC ESTÁ LENTO!!!'),
      CE.el('p', {}, 'Compre o TURBO 3000 PRO por apenas R$ 199,90 e ganhe um celular!!!'),
      CE.el('button', { class: 'botao', onclick: () => { caixa.remove(); CE.avisar('Não clique em propagandas assim! Isso veio do "Acelerador" que foi instalado. Rode o antivírus em Configurações.'); CE.emitir('config:propaganda-clicada'); } }, 'COMPRAR AGORA'));
    document.body.append(caixa);
    CE.emitir('config:propaganda');
  }

  CE.config = {
    get atual() { return atual; },
    async carregar() {
      const p = await CE.sessao.progresso();
      atual = { ...PADRAO, ...(p.config || {}) };
      aplicar();
      CE.areaTrabalho.atualizar();
    },
    guardar(mudancas) {
      Object.assign(atual, mudancas);
      if (!CE.sessao.usuario) return Promise.resolve();
      return CE.sessao.atualizarProgresso((p) => { p.config = { ...(p.config || {}), ...mudancas }; });
    },
    reiniciar() { atual = { ...PADRAO }; clearInterval(propaganda); document.querySelectorAll('.propaganda-falsa, .celular-falso').forEach((x) => x.remove()); aplicar(); },
    instalado: (id) => (atual.instalados || []).includes(id),
    impressoras: () => [...atual.impressoras].sort((a, b) => (b.padrao ? 1 : 0) - (a.padrao ? 1 : 0)),
    fuso: () => (atual.fuso == null ? fusoLocal : atual.fuso),
    // A hora que o computador mostra (com o fuso e o ajuste manual de treino).
    agora() {
      const base = Date.now() + (atual.automatico ? 0 : atual.ajusteMs || 0);
      return new Date(base + (CE.config.fuso() - fusoLocal) * 3600000);
    },
    mostrarPropaganda,
  };

  // ---------- Programas que dá para instalar ----------
  CE.registrarApp({
    id: 'bloco-notas', nome: 'Bloco de Notas', icone: '🗒️', instalavel: true, largura: 640, altura: 460,
    abrir(corpo, janela, argumento) {
      const area = CE.el('textarea', { class: 'bn-texto', spellcheck: 'false', 'aria-label': 'Texto do Bloco de Notas' });
      let nome = null;
      if (argumento && argumento.arquivo) { nome = argumento.arquivo.nome; area.value = CE.el('div', { html: argumento.arquivo.conteudo || '' }).innerText; }
      corpo.classList.add('bloco-notas');
      corpo.append(
        CE.el('div', { class: 'ferramentas' }, CE.el('div', { class: 'ferramentas-grupo' },
          CE.el('button', { class: 'ferramenta texto', 'data-comando': 'salvar', onclick: async () => {
            nome = nome || await CE.perguntar('Nome da anotação:', 'Anotações');
            if (!nome) return;
            await CE.sessao.salvarArquivo({ nome, tipo: 'documento', conteudo: area.value.split('\n').map((l) => `<div>${CE.escapar(l) || '<br>'}</div>`).join('') });
            janela.definirTitulo(nome);
            CE.avisar(`🗒️ "${nome}" salvo.`);
          } }, '💾 Salvar'))),
        area);
      area.addEventListener('input', () => CE.emitir('notas:texto', { texto: area.value }));
      setTimeout(() => area.focus(), 50);
    },
  });

  CE.registrarApp({
    id: 'cronometro', nome: 'Relógio e Cronômetro', icone: '⏱️', instalavel: true, largura: 520, altura: 440,
    abrir(corpo) {
      let inicio = null, acumulado = 0, timerFim = null;
      const relogio = CE.el('div', { class: 'cr-grande', 'data-relogio': '' });
      const tempo = CE.el('div', { class: 'cr-grande', 'data-cronometro': '' }, '00:00,0');
      const voltas = CE.el('ol', { class: 'cr-voltas' });
      const minutos = CE.el('input', { class: 'campo', type: 'number', min: '1', max: '120', value: '1', 'data-campo': 'minutos' });
      const alarme = CE.el('div', { class: 'cr-alarme' }, '');
      const fmt = (ms) => { const s = ms / 1000; return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')},${Math.floor((ms % 1000) / 100)}`; };
      const decorrido = () => acumulado + (inicio ? Date.now() - inicio : 0);
      const tic = setInterval(() => {
        relogio.textContent = CE.config.agora().toLocaleTimeString('pt-BR');
        tempo.textContent = fmt(decorrido());
        if (timerFim) {
          const resta = timerFim - Date.now();
          alarme.textContent = resta > 0 ? `⏰ Faltam ${fmt(resta).slice(0, 5)}` : '⏰ O tempo acabou!';
          if (resta <= 0) { timerFim = null; CE.avisar('⏰ O alarme tocou!'); CE.emitir('cronometro:alarme'); }
        }
      }, 100);
      const b = (acao, rotulo, f) => CE.el('button', { class: 'botao', 'data-acao': acao, onclick: f }, rotulo);
      corpo.classList.add('cronometro');
      corpo.append(
        CE.el('section', {}, CE.el('h3', {}, '🕒 Relógio'), relogio),
        CE.el('section', {}, CE.el('h3', {}, '⏱️ Cronômetro'), tempo,
          CE.el('div', { class: 'dialogo-botoes' },
            b('iniciar', '▶ Iniciar', () => { if (!inicio) { inicio = Date.now(); CE.emitir('cronometro:iniciado'); } }),
            b('pausar', '⏸ Pausar', () => { if (inicio) { acumulado = decorrido(); inicio = null; CE.emitir('cronometro:pausado', { segundos: acumulado / 1000 }); } }),
            b('volta', '🚩 Volta', () => { voltas.append(CE.el('li', {}, fmt(decorrido()))); }),
            b('zerar', '↺ Zerar', () => { inicio = null; acumulado = 0; voltas.replaceChildren(); })),
          voltas),
        CE.el('section', {}, CE.el('h3', {}, '⏰ Alarme'), CE.el('label', {}, 'Tocar daqui a ', minutos, ' minuto(s) '),
          b('alarme', 'Ligar alarme', () => { timerFim = Date.now() + (Number(minutos.value) || 1) * 60000; CE.emitir('cronometro:alarme-ligado', { minutos: Number(minutos.value) }); }), alarme));
      return { aoFechar() { clearInterval(tic); return true; } };
    },
  });

  CE.registrarApp({
    id: 'jogo-memoria', nome: 'Jogo da Memória', icone: '🃏', instalavel: true, largura: 560, altura: 560,
    abrir(corpo) {
      function novoJogo() {
        const figuras = ['🐶', '🐱', '🦁', '🐸', '🐵', '🦊', '🐼', '🐰'];
        const cartas = [...figuras, ...figuras].map((f) => [Math.random(), f]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
        let abertas = [], pares = 0, jogadas = 0, travado = false;
        const placar = CE.el('p', { class: 'jm-placar' }, 'Jogadas: 0 · Pares: 0 de 8');
        const grade = CE.el('div', { class: 'mem-grade' }, ...cartas.map((f, i) => {
          const carta = CE.el('button', { class: 'mem-carta', 'data-carta': i, 'data-figura': f, 'aria-label': 'Carta virada' }, '❓');
          carta.addEventListener('click', () => {
            if (travado || carta.classList.contains('aberta')) return;
            carta.classList.add('aberta'); carta.textContent = f;
            abertas.push(carta);
            if (abertas.length < 2) return;
            jogadas++;
            const [a, b] = abertas;
            abertas = [];
            if (a.dataset.figura === b.dataset.figura) {
              pares++; a.classList.add('par'); b.classList.add('par');
              if (pares === 8) { CE.comemorar('pequena'); CE.emitir('jogo:memoria', { jogadas }); placar.textContent = `🎉 Você achou todos os pares em ${jogadas} jogadas!`; return; }
            } else {
              travado = true;
              setTimeout(() => { [a, b].forEach((c) => { c.classList.remove('aberta'); c.textContent = '❓'; }); travado = false; }, 800);
            }
            placar.textContent = `Jogadas: ${jogadas} · Pares: ${pares} de 8`;
          });
          return carta;
        }));
        corpo.replaceChildren(CE.el('div', { class: 'mem-topo' }, placar, CE.el('button', { class: 'botao secundario', onclick: novoJogo }, '🔄 Novo jogo')), grade);
      }
      corpo.classList.add('jogo-memoria');
      novoJogo();
    },
  });

  // ---------- O programa Configurações ----------
  CE.registrarApp({
    id: 'configuracoes', nome: 'Configurações', icone: '⚙️', largura: 900, altura: 600,
    abrir(corpo, janela, argumento) {
      let secao = (argumento && argumento.secao) || 'personalizar';
      const conteudo = CE.el('div', { class: 'cfg-conteudo' });
      const lateral = CE.el('nav', { class: 'cfg-lateral' });
      const temporizadores = [];
      const depois = (f, ms) => temporizadores.push(setTimeout(f, ms));
      let estado = { verificando: false, resultado: null, procurando: false, atualizacoes: null, instalando: null, buscandoImpressora: false, encontradas: null };

      const SECOES = [
        ['personalizar', '🎨', 'Personalizar'], ['acessibilidade', '♿', 'Acessibilidade'], ['data-hora', '🕒', 'Data e hora'], ['som', '🔊', 'Som'],
        ['aplicativos', '📦', 'Aplicativos'], ['seguranca', '🛡️', 'Antivírus e segurança'], ['atualizacoes', '🔄', 'Atualizações'],
        ['impressoras', '🖨️', 'Impressoras'], ['backup', '💾', 'Backup'], ['sobre', '💻', 'Sobre o computador'],
      ];
      function ir(id) { secao = id; estado = { ...estado, resultado: null, encontradas: null }; desenhar(); CE.emitir('config:secao', { secao: id }); }
      const titulo = (t, sub) => [CE.el('h2', {}, t), sub ? CE.el('p', { class: 'cfg-sub' }, sub) : null];
      const salvarE = async (mudancas, evento, dados) => { await CE.config.guardar(mudancas); aplicar(); if (evento) CE.emitir(evento, dados); desenhar(); };
      const interruptor = (campo, ligado, rotulo, aoMudar) => CE.el('label', { class: 'cfg-interruptor' },
        CE.el('input', { type: 'checkbox', 'data-campo': campo, checked: ligado, onchange: (e) => aoMudar(e.target.checked) }), CE.el('span', { class: 'cfg-trilho' }), rotulo);
      const barra = (pct) => CE.el('div', { class: 'cfg-progresso' }, CE.el('div', { style: `width:${pct}%` }));

      const TELAS = {
        personalizar() {
          return [...titulo('🎨 Personalizar', 'Escolha a imagem de fundo da área de trabalho.'),
            CE.el('div', { class: 'cfg-fundos' }, ...CE.FUNDOS_TELA.map((f) => CE.el('button', {
              class: `cfg-fundo ${f.id}${atual.fundo === f.id ? ' escolhido' : ''}`, 'data-fundo': f.id, title: f.nome,
              onclick: () => salvarE({ fundo: f.id }, 'config:fundo', { fundo: f.id, nome: f.nome }),
            }, CE.el('span', {}, f.nome))))];
        },
        acessibilidade() {
          return [...titulo('♿ Acessibilidade', 'Deixe o computador mais fácil de ver e de usar.'),
            CE.el('h3', {}, 'Tamanho de tudo na tela'),
            CE.el('div', { class: 'cfg-opcoes' }, ...[[1, '100% (normal)'], [1.15, '115%'], [1.3, '130% (maior)']].map(([z, r]) => CE.el('button', {
              class: 'cfg-opcao' + (atual.zoom === z ? ' escolhido' : ''), 'data-zoom': String(z), onclick: () => salvarE({ zoom: z }, 'config:zoom', { zoom: z }),
            }, r))),
            interruptor('contraste', atual.contraste, 'Cores mais fortes (alto contraste)', (v) => salvarE({ contraste: v }, 'config:contraste', { ligado: v })),
            interruptor('cursor', atual.cursorGrande, 'Setinha do mouse grande', (v) => salvarE({ cursorGrande: v }, 'config:cursor', { grande: v }))];
        },
        'data-hora'() {
          const agora = CE.config.agora();
          const data = CE.el('input', { type: 'date', class: 'campo', 'data-campo': 'data', value: agora.toLocaleDateString('sv-SE') });
          const hora = CE.el('input', { type: 'time', class: 'campo', 'data-campo': 'hora', value: agora.toTimeString().slice(0, 5) });
          return [...titulo('🕒 Data e hora'),
            CE.el('div', { class: 'cfg-relogio', 'data-relogio-config': '' }, agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), CE.el('small', {}, agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))),
            CE.el('label', { class: 'cfg-linha' }, 'Fuso horário ', CE.el('select', { class: 'campo', 'data-campo': 'fuso', onchange: (e) => salvarE({ fuso: Number(e.target.value) }, 'config:fuso', { fuso: Number(e.target.value) }) },
              ...FUSOS.map(([v, r]) => CE.el('option', { value: v, selected: CE.config.fuso() === v }, r)))),
            interruptor('automatico', atual.automatico, 'Acertar a hora automaticamente', (v) => salvarE({ automatico: v, ajusteMs: v ? 0 : atual.ajusteMs }, 'config:hora', { automatico: v })),
            atual.automatico ? null : CE.el('div', { class: 'cfg-linha' }, data, hora, CE.el('button', { class: 'botao', 'data-acao': 'aplicar-hora', onclick: () => {
              const desejada = new Date(`${data.value}T${hora.value || '00:00'}`);
              if (isNaN(desejada)) return;
              const ajusteMs = desejada - Date.now() - (CE.config.fuso() - fusoLocal) * 3600000;
              salvarE({ ajusteMs }, 'config:hora', { automatico: false, hora: hora.value, data: data.value });
              CE.areaTrabalho.atualizar();
            } }, 'Mudar'))];
        },
        som() {
          return [...titulo('🔊 Som', 'O volume vale para a voz do professor.'),
            CE.el('label', { class: 'cfg-linha' }, '🔈', CE.el('input', { type: 'range', min: '0', max: '100', step: '10', value: atual.volume, 'data-campo': 'volume',
              onchange: (e) => salvarE({ volume: Number(e.target.value) }, 'config:volume', { volume: Number(e.target.value) }) }), '🔊', CE.el('b', {}, `${atual.volume}%`)),
            interruptor('mudo', atual.mudo, 'Sem som (mudo)', (v) => salvarE({ mudo: v }, 'config:mudo', { mudo: v })),
            CE.el('button', { class: 'botao', 'data-acao': 'testar-som', onclick: () => {
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const o = ctx.createOscillator(), g = ctx.createGain();
                g.gain.value = atual.mudo ? 0 : (atual.volume / 100) * 0.2;
                o.frequency.value = 660; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.3);
              } catch { /* sem placa de som */ }
              CE.voz.falar('Teste de som. Você está me ouvindo?', { forcar: true });
              CE.emitir('config:som-testado', { volume: atual.volume, mudo: atual.mudo });
            } }, '🔔 Testar o som')];
        },
        aplicativos() {
          const sistema = CE.listarApps().filter((a) => !a.instalavel && !a.soInstrutor && !a.semIcone);
          const instalados = LOJA.filter((p) => CE.config.instalado(p.id));
          return [...titulo('📦 Aplicativos', 'Instale só programas de quem você confia. Programa desconhecido pode trazer vírus e propaganda.'),
            CE.el('h3', {}, 'Instalados por você'),
            instalados.length ? CE.el('div', { class: 'cfg-lista' }, ...instalados.map((p) => CE.el('div', { class: 'cfg-app', 'data-instalado': p.id },
              CE.el('span', { class: 'cfg-app-icone' }, p.icone), CE.el('div', {}, CE.el('b', {}, p.nome), CE.el('small', {}, `${p.editora} · ${p.tamanho}`)),
              CE.el('button', { class: 'botao secundario', 'data-desinstalar': p.id, onclick: () => desinstalar(p) }, 'Desinstalar')))) : CE.el('p', { class: 'cfg-sub' }, 'Nenhum programa instalado ainda.'),
            CE.el('h3', {}, '🛍️ Central de programas (de treino)'),
            CE.el('div', { class: 'cfg-lista' }, ...LOJA.filter((p) => !CE.config.instalado(p.id)).map((p) => CE.el('div', { class: 'cfg-app' + (p.perigoso ? ' suspeito' : ''), 'data-loja': p.id },
              CE.el('span', { class: 'cfg-app-icone' }, p.icone),
              CE.el('div', {}, CE.el('b', {}, p.nome), CE.el('small', {}, `${p.verificado ? '✔️ Editora verificada' : '⚠️ Editora desconhecida'}: ${p.editora} · ${p.tamanho}`), CE.el('small', {}, p.descricao)),
              estado.instalando && estado.instalando.id === p.id ? barra(estado.instalando.pct)
                : CE.el('button', { class: 'botao', 'data-instalar': p.id, onclick: () => instalar(p) }, 'Instalar')))),
            CE.el('details', { class: 'cfg-detalhes' }, CE.el('summary', {}, `Programas do sistema (${sistema.length})`),
              CE.el('div', { class: 'cfg-lista' }, ...sistema.map((a) => CE.el('div', { class: 'cfg-app' }, CE.el('span', { class: 'cfg-app-icone' }, a.icone), CE.el('div', {}, CE.el('b', {}, a.nome), CE.el('small', {}, 'Programa do sistema')))))),
          ];
        },
        seguranca() {
          const dias = atual.antivirusEm ? Math.floor((Date.now() - atual.antivirusEm) / 86400000) : 3;
          const emRisco = !atual.protecao || !atual.firewall || atual.ameaca || dias >= 3;
          return [...titulo('🛡️ Antivírus e segurança'),
            CE.el('div', { class: 'cfg-status ' + (emRisco ? 'risco' : 'ok'), 'data-status-seguranca': emRisco ? 'risco' : 'ok' },
              CE.el('span', {}, emRisco ? '⚠️' : '✅'),
              CE.el('div', {}, CE.el('b', {}, emRisco ? 'Atenção: seu computador precisa de cuidado' : 'Seu computador está protegido'),
                CE.el('small', {}, atual.ameaca ? 'Um programa indesejado foi instalado.' : !atual.protecao ? 'A proteção em tempo real está desligada.' : !atual.firewall ? 'O firewall está desligado.' : dias >= 3 ? `O antivírus está desatualizado (há ${dias} dias).` : 'Antivírus Escudo Escola atualizado.'))),
            interruptor('protecao', atual.protecao, 'Proteção em tempo real (vigia o que é instalado e baixado)', (v) => {
              if (!v) CE.avisar('⚠️ Sem a proteção, programas perigosos podem entrar. Deixe sempre ligada!');
              salvarE({ protecao: v }, 'config:protecao', { ligada: v });
            }),
            interruptor('firewall', atual.firewall, 'Firewall (bloqueia invasões pela rede)', (v) => salvarE({ firewall: v }, 'config:firewall', { ligado: v })),
            CE.el('div', { class: 'cfg-linha' },
              CE.el('button', { class: 'botao', 'data-acao': 'verificar', disabled: !!estado.verificando, onclick: verificar }, '🔍 Verificação rápida'),
              CE.el('button', { class: 'botao secundario', 'data-acao': 'atualizar-antivirus', onclick: () => { salvarE({ antivirusEm: Date.now() }, 'config:antivirus-atualizado'); CE.avisar('🛡️ Antivírus atualizado: ele já conhece os vírus mais novos.'); } }, '🔄 Atualizar o antivírus')),
            estado.verificando ? CE.el('div', {}, CE.el('p', { class: 'cfg-sub' }, `Verificando: ${estado.verificando.arquivo}`), barra(estado.verificando.pct)) : null,
            estado.resultado ? CE.el('div', { class: 'cfg-resultado', 'data-resultado-verificacao': estado.resultado.ameacas },
              estado.resultado.ameacas
                ? [CE.el('p', {}, `🦠 ${estado.resultado.ameacas} ameaça encontrada: "Acelerador de PC TURBO 3000" (programa indesejado que mostra propagandas).`),
                  CE.el('button', { class: 'botao', 'data-acao': 'remover-ameaca', onclick: async () => {
                    await CE.config.guardar({ ameaca: false, instalados: atual.instalados.filter((x) => x !== 'acelerador') });
                    document.querySelectorAll('.propaganda-falsa').forEach((x) => x.remove());
                    aplicar(); CE.areaTrabalho.atualizar();
                    estado.resultado = { ameacas: 0, arquivos: estado.resultado.arquivos, removida: true };
                    CE.emitir('config:ameaca-removida', { nome: 'acelerador' });
                    CE.avisar('✅ Ameaça removida! Seu computador está limpo.');
                    desenhar();
                  } }, '🧹 Remover ameaça')]
                : CE.el('p', {}, `${estado.resultado.removida ? '✅ Ameaça removida. ' : '✅ '}Nenhuma ameaça encontrada em ${estado.resultado.arquivos} itens verificados.`)) : null];
        },
        atualizacoes() {
          const lista = estado.atualizacoes;
          return [...titulo('🔄 Atualizações do sistema', 'As atualizações corrigem falhas de segurança. Instale sempre que aparecerem.'),
            atual.atualizacoesFeitas && !lista ? CE.el('div', { class: 'cfg-status ok' }, CE.el('span', {}, '✅'), CE.el('b', {}, 'Seu sistema está atualizado.')) : null,
            !lista ? CE.el('button', { class: 'botao', 'data-acao': 'procurar-atualizacoes', disabled: estado.procurando, onclick: () => {
              estado.procurando = true; desenhar();
              depois(() => {
                estado.procurando = false;
                estado.atualizacoes = atual.atualizacoesFeitas ? [] : ATUALIZACOES.map((nome) => ({ nome, pct: 0 }));
                CE.emitir('config:atualizacoes', { acao: 'procurou', encontradas: estado.atualizacoes.length });
                desenhar();
              }, 1200);
            } }, estado.procurando ? 'Procurando…' : '🔎 Procurar atualizações') : null,
            lista && !lista.length ? CE.el('p', {}, '✅ Nenhuma atualização nova. Está tudo em dia!') : null,
            lista && lista.length ? CE.el('div', { class: 'cfg-lista' }, ...lista.map((a) => CE.el('div', { class: 'cfg-app' }, CE.el('span', { class: 'cfg-app-icone' }, '🔄'), CE.el('div', {}, CE.el('b', {}, a.nome), a.pct ? barra(a.pct) : CE.el('small', {}, 'Pronta para instalar'))))) : null,
            lista && lista.length && !lista.pronta ? CE.el('button', { class: 'botao', 'data-acao': 'instalar-atualizacoes', disabled: lista.some((a) => a.pct), onclick: () => {
              let pct = 0;
              const passo = () => {
                pct += 25;
                lista.forEach((a) => { a.pct = pct; });
                if (pct >= 100) { lista.pronta = true; CE.emitir('config:atualizacoes', { acao: 'instalou' }); }
                else depois(passo, 350);
                desenhar();
              };
              passo();
            } }, '⬇️ Instalar agora') : null,
            lista && lista.pronta ? CE.el('div', {}, CE.el('p', {}, '✅ Atualizações instaladas. Reinicie o computador para terminar.'),
              CE.el('button', { class: 'botao', 'data-acao': 'reiniciar', onclick: reiniciar }, '🔁 Reiniciar agora')) : null];
        },
        impressoras() {
          return [...titulo('🖨️ Impressoras', 'A impressora PADRÃO é a que já vem escolhida na hora de imprimir.'),
            CE.el('div', { class: 'cfg-lista' }, ...CE.config.impressoras().map((imp) => CE.el('div', { class: 'cfg-app', 'data-impressora': imp.nome },
              CE.el('span', { class: 'cfg-app-icone' }, '🖨️'), CE.el('div', {}, CE.el('b', {}, imp.nome), CE.el('small', {}, imp.padrao ? '⭐ Impressora padrão' : 'Pronta')),
              imp.padrao ? null : CE.el('button', { class: 'botao secundario', 'data-padrao': imp.nome, onclick: () => salvarE({ impressoras: atual.impressoras.map((x) => ({ ...x, padrao: x.nome === imp.nome })) }, 'config:impressora', { acao: 'padrao', nome: imp.nome }) }, 'Tornar padrão'),
              CE.el('button', { class: 'botao secundario', 'data-teste': imp.nome, onclick: () => { CE.avisar(`🖨️ Página de teste enviada para "${imp.nome}".`); CE.emitir('config:impressora', { acao: 'teste', nome: imp.nome }); } }, 'Página de teste'),
              atual.impressoras.length > 1 ? CE.el('button', { class: 'botao secundario', 'data-remover-impressora': imp.nome, title: 'Remover', onclick: () => {
                let lista = atual.impressoras.filter((x) => x.nome !== imp.nome);
                if (!lista.some((x) => x.padrao)) lista = lista.map((x, i) => ({ ...x, padrao: i === 0 }));
                salvarE({ impressoras: lista }, 'config:impressora', { acao: 'removida', nome: imp.nome });
              } }, '🗑️') : null))),
            CE.el('button', { class: 'botao', 'data-acao': 'adicionar-impressora', disabled: estado.buscandoImpressora, onclick: () => {
              estado.buscandoImpressora = true; desenhar();
              depois(() => { estado.buscandoImpressora = false; estado.encontradas = IMPRESSORAS_REDE.filter((n) => !atual.impressoras.some((x) => x.nome === n)); desenhar(); }, 1000);
            } }, estado.buscandoImpressora ? 'Procurando impressoras na rede…' : '➕ Adicionar impressora'),
            estado.encontradas ? CE.el('div', {}, CE.el('p', { class: 'cfg-sub' }, estado.encontradas.length ? 'Impressoras encontradas na rede. Clique para adicionar:' : 'Nenhuma impressora nova encontrada.'),
              ...estado.encontradas.map((n) => CE.el('button', { class: 'cfg-opcao', 'data-impressora-encontrada': n, onclick: () => {
                estado.encontradas = null;
                salvarE({ impressoras: [...atual.impressoras, { nome: n, padrao: false }] }, 'config:impressora', { acao: 'adicionada', nome: n });
                CE.avisar(`🖨️ "${n}" adicionada!`);
              } }, `🖨️ ${n}`))) : null];
        },
        backup() {
          return [...titulo('💾 Backup (cópia de segurança)', 'Se o computador quebrar ou pegar vírus, quem tem backup não perde nada. Faça sempre!'),
            CE.el('div', { class: 'cfg-status ' + (atual.ultimoBackup ? 'ok' : 'risco') }, CE.el('span', {}, atual.ultimoBackup ? '✅' : '⚠️'),
              CE.el('b', {}, atual.ultimoBackup ? `Último backup: ${new Date(atual.ultimoBackup).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : 'Você ainda não fez nenhum backup.')),
            CE.el('p', {}, CE.pendrive.conectado ? '💾 Pen drive conectado.' : '🔌 Conecte o pen drive (botão 🔌 na barra de tarefas) para fazer o backup.'),
            CE.el('button', { class: 'botao', 'data-acao': 'backup', onclick: async () => {
              try {
                const r = await CE.sessao.backupNoPendrive();
                await CE.config.guardar({ ultimoBackup: Date.now() });
                CE.avisar(`💾 Backup feito! ${r.arquivos} arquivo${r.arquivos === 1 ? '' : 's'} copiado${r.arquivos === 1 ? '' : 's'} para a pasta "${r.pasta}" no pen drive.`);
                desenhar();
              } catch (e) { CE.avisar('⚠️ ' + e.message); }
            } }, '💾 Fazer backup no pen drive')];
        },
        sobre() {
          return [...titulo('💻 Sobre o computador'),
            CE.el('table', { class: 'cfg-tabela' }, ...[
              ['Nome do computador', 'PC-ESCOLA'], ['Sistema', 'Computador Escola (Windows de treino)'], ['Processador', 'Intel Core i3 (treino) — o "cérebro" do computador'],
              ['Memória RAM', '4 GB — a memória de trabalho (apaga quando desliga)'], ['Armazenamento', 'Disco de 500 GB — onde os arquivos ficam guardados'],
              ['Usuário', CE.sessao.usuario.nome],
            ].map(([a, b]) => CE.el('tr', {}, CE.el('th', {}, a), CE.el('td', {}, b))))];
        },
      };

      async function instalar(p) {
        if (!p.verificado && !await CE.confirmar(`⚠️ "${p.nome}" é de uma editora DESCONHECIDA e pode ser perigoso. Instalar mesmo assim?`)) {
          CE.emitir('config:instalacao-cancelada', { app: p.id });
          return;
        }
        if (p.perigoso && atual.protecao) {
          CE.avisar('🛡️ O antivírus BLOQUEOU a instalação: esse programa é indesejado (mostra propagandas e deixa o computador lento).');
          CE.emitir('config:bloqueado', { app: p.id, nome: p.nome });
          return;
        }
        estado.instalando = { id: p.id, pct: 0 };
        const passo = async () => {
          estado.instalando.pct += 20;
          if (estado.instalando.pct < 100) { desenhar(); depois(passo, 250); return; }
          estado.instalando = null;
          await CE.config.guardar({ instalados: [...new Set([...atual.instalados, p.id])], ...(p.perigoso ? { ameaca: true } : {}) });
          aplicar();
          CE.areaTrabalho.atualizar();
          CE.emitir('config:instalado', { app: p.id, nome: p.nome, confiavel: !!p.verificado });
          CE.avisar(p.perigoso ? '😬 Instalado... e agora começaram umas propagandas estranhas. Hora de usar o antivírus!' : `✅ "${p.nome}" instalado! O ícone apareceu na área de trabalho.`);
          if (p.perigoso) depois(mostrarPropaganda, 1500);
          desenhar();
        };
        passo();
      }
      async function desinstalar(p) {
        if (!await CE.confirmar(`Desinstalar "${p.nome}"? Ele sai do computador.`)) return;
        if (CE.janelas.estaAberta(p.id)) CE.janelas.fechar(p.id);
        await CE.config.guardar({ instalados: atual.instalados.filter((x) => x !== p.id), ...(p.perigoso ? { ameaca: false } : {}) });
        aplicar();
        CE.areaTrabalho.atualizar();
        CE.emitir('config:desinstalado', { app: p.id, nome: p.nome });
        CE.avisar(`🗑️ "${p.nome}" desinstalado.`);
        desenhar();
      }
      async function verificar() {
        const arquivos = (await CE.sessao.arquivos()).filter((a) => !a.naLixeira);
        const nomes = [...arquivos.map((a) => a.nome), 'Sistema', 'Memória', ...LOJA.filter((p) => CE.config.instalado(p.id)).map((p) => p.nome)];
        estado.resultado = null;
        let i = 0;
        const passo = () => {
          if (i >= nomes.length || i > 12) {
            estado.verificando = false;
            estado.resultado = { ameacas: atual.ameaca ? 1 : 0, arquivos: nomes.length };
            CE.emitir('config:verificacao', estado.resultado);
            desenhar();
            return;
          }
          estado.verificando = { arquivo: nomes[i], pct: Math.round(((i + 1) / Math.min(nomes.length, 13)) * 100) };
          i++;
          desenhar();
          depois(passo, 120);
        };
        passo();
      }
      function reiniciar() {
        const tela = CE.el('div', { class: 'tela-reiniciando' }, CE.el('div', { class: 'carregando' }), CE.el('p', {}, 'Reiniciando… não desligue o computador.'));
        document.body.append(tela);
        CE.emitir('config:reiniciando');
        depois(async () => {
          try {
            await CE.config.guardar({ atualizacoesFeitas: true });
            CE.janelas.fecharTodas();
            CE.avisar('✅ Computador reiniciado e atualizado!');
            CE.emitir('config:reiniciado');
          } catch (e) {
            CE.avisar(`⚠️ Não consegui terminar a atualização: ${e.message}`);
          } finally {
            tela.remove();
          }
        }, 1800);
      }

      function desenhar() {
        lateral.replaceChildren(...SECOES.map(([id, icone, nome]) => CE.el('button', { class: 'cfg-item' + (id === secao ? ' ativo' : ''), 'data-secao': id, onclick: () => ir(id) }, CE.el('span', {}, icone), nome)));
        conteudo.replaceChildren(...TELAS[secao]().flat().filter(Boolean));
      }
      const relogioTic = setInterval(() => { if (secao === 'data-hora' && !conteudo.querySelector('input:focus, select:focus')) { const r = conteudo.querySelector('[data-relogio-config]'); if (r) r.firstChild.textContent = CE.config.agora().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } }, 1000);
      corpo.classList.add('configuracoes');
      corpo.append(lateral, conteudo);
      desenhar();
      CE.emitir('config:secao', { secao });
      return {
        receber(arg) { if (arg && arg.secao) ir(arg.secao); },
        aoFechar() { temporizadores.forEach(clearTimeout); clearInterval(relogioTic); document.querySelectorAll('.tela-reiniciando').forEach((t) => t.remove()); return true; },
      };
    },
  });
})();
