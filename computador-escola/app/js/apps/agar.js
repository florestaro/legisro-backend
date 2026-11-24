// "Agar da Turma": a janela do jogo das bolinhas. Abre pelo prédio do Agar na Praça Escola (🟢, perto da estação).
// A arena anda no computador do instrutor (regras em app/js/agar-regras.js): esta janela só manda para onde o mouse
// aponta (10 vezes por segundo, com a janela na frente) e desenha o que volta, suavizando o movimento entre uma
// resposta e outra. O professor abre ou fecha a arena para os alunos, liga ou desliga os robôs e pode assistir à
// arena inteira de uma turma (bom para projetar no quadro).
window.CE = window.CE || {};

(function () {
  const RITMO = 100;          // janela na frente: conversa com o computador do instrutor 10 vezes por segundo
  const RITMO_ATRAS = 400;    // atrás de outra janela
  const RITMO_LONGE = 1000;   // minimizada
  const RITMO_ESPERA = 2000;  // na tela de entrada (quem está jogando, se a arena abriu)
  const CORES_COMIDA = Array.from({ length: 12 }, (_, i) => `hsl(${i * 30}, 85%, 58%)`);
  const EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  const numero = (n) => Math.round(Number(n) || 0).toLocaleString('pt-BR');
  // Igual às regras: serve para adiantar a própria bolinha entre uma resposta e outra.
  const velocidade = (m) => 364 * Math.pow(Math.max(1, m), -0.12);
  const DICAS = [
    'Quem é grande anda mais devagar: use o Espaço para dar um pulo e pegar quem está fugindo.',
    'Só divida quando a outra bolinha for bem menor que o seu pedaço (menos da metade de você).',
    'Grandão, cuidado com o vírus verde de espinhos: ele estoura você em vários pedaços.',
    'Solte massa (W) em cima de um vírus: com 7 tiros nasce outro vírus, que sai voando para o lado do tiro.',
    'Fuja para perto da borda quando estiver pequeno: ninguém chega por trás.',
    'Os pedaços se juntam de novo depois de uns 10 segundos.',
  ];

  CE.registrarApp({
    id: 'agar', nome: 'Agar da Turma', icone: '🟢', semIcone: true, largura: 1060, altura: 690,
    abrir(corpo) {
      corpo.classList.add('ag-app');
      const usuario = CE.sessao.usuario;
      const instrutor = !!usuario && usuario.papel === 'instrutor';
      const janelaEl = () => corpo.closest('.janela');
      let fechou = false, tela = 'entrada', estado = null, ultimo = null, emCurso = false, ultimaRede = 0, chegouEm = 0;
      let turmaEscolhida = null, turmas = [], recado = null, chaveEntrada = '', chaveRanking = '', dicaN = Math.floor(Math.random() * DICAS.length);
      let mundo = 3000;
      const pedidos = { dividir: false, soltar: false };
      const mouse = { x: 0, y: 0, mexeu: false };
      const cam = { x: 1500, y: 1500, s: 1 };
      const tamanho = { w: 800, h: 500 };
      let dpr = 1;
      const bolinhas = new Map(); // id da bolinha -> posição mostrada (x, y, r) e a última que chegou (tx, ty, tr)

      // ---------- A tela ----------
      const massaEl = CE.el('strong', { 'data-agar': 'massa' }, '—');
      const posicaoEl = CE.el('span', { class: 'ag-pos', 'data-agar': 'posicao' });
      const topo = CE.el('div', { class: 'ag-topo ag-fora' },
        CE.el('span', { class: 'ag-marca' }, '🟢 Agar da Turma'),
        CE.el('span', { class: 'ag-massa' }, 'Massa: ', massaEl), posicaoEl,
        CE.el('span', { class: 'ag-espaco' }),
        CE.el('button', { class: 'botao secundario pequeno ag-so-jogando', type: 'button', 'data-acao': 'dividir', title: 'Dividir a bolinha em duas (tecla Espaço)', onclick: () => { pedidos.dividir = true; focarArena(); } }, '✂️ Dividir ', CE.el('kbd', {}, 'Espaço')),
        CE.el('button', { class: 'botao secundario pequeno ag-so-jogando', type: 'button', 'data-acao': 'soltar', title: 'Soltar um pouco de massa (tecla W)', onclick: () => { pedidos.soltar = true; focarArena(); } }, '💨 Soltar ', CE.el('kbd', {}, 'W')),
        CE.el('button', { class: 'botao secundario pequeno', type: 'button', 'data-acao': 'sair-arena', onclick: () => sairDaArena() }, '🚪 Sair da arena'));
      const canvas = CE.el('canvas', { class: 'ag-tela', tabindex: '0', 'aria-label': 'Arena do Agar da Turma: mova o mouse para guiar a sua bolinha' });
      const ranking = CE.el('div', { class: 'ag-ranking', 'data-agar': 'ranking', hidden: true });
      const aviso = CE.el('div', { class: 'ag-aviso', role: 'status', hidden: true });
      const capa = CE.el('div', { class: 'ag-capa' });
      const palco = CE.el('div', { class: 'ag-palco' }, canvas, ranking, aviso, capa);
      corpo.append(topo, palco);
      const ctx = canvas.getContext('2d');
      const focarArena = () => canvas.focus({ preventScroll: true });

      function redimensionar() {
        const q = palco.getBoundingClientRect();
        tamanho.w = Math.max(200, Math.round(q.width)); tamanho.h = Math.max(150, Math.round(q.height));
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(tamanho.w * dpr); canvas.height = Math.round(tamanho.h * dpr);
        canvas.style.width = `${tamanho.w}px`; canvas.style.height = `${tamanho.h}px`;
      }
      const observador = new ResizeObserver(redimensionar);
      observador.observe(palco);
      redimensionar();

      // ---------- Entrada: como jogar, quem está jogando e (para o professor) abrir, fechar e assistir ----------
      function telaEntrada() {
        tela = 'entrada';
        topo.classList.add('ag-fora');
        ranking.hidden = true;
        const e = estado || { aberta: true, gente: [] };
        const fechada = !e.aberta && !instrutor;
        const gente = e.gente || [];
        const quem = gente.length
          ? `Jogando agora: ${gente.map((g) => `${g.avatar} ${g.nome}`).join(', ')}${e.robosNaArena ? ` (e ${e.robosNaArena} robôs)` : ''}.`
          : 'Ninguém da sua turma está jogando agora. Entre e chame os colegas!';
        capa.replaceChildren(CE.el('div', { class: 'ag-cartao', 'data-tela': fechada ? 'fechada' : 'entrada' },
          CE.el('h2', {}, '🟢 Agar da Turma'),
          CE.el('p', { class: 'ag-lema' }, 'Você é uma bolinha. Coma as bolinhas coloridas para crescer e fuja de quem é maior!'),
          CE.el('ul', { class: 'ag-como' },
            CE.el('li', {}, CE.el('span', { class: 'ag-ic' }, '🖱️'), CE.el('span', {}, CE.el('b', {}, 'Mova o mouse: '), 'a bolinha vai atrás da setinha. Não precisa clicar.')),
            CE.el('li', {}, CE.el('kbd', {}, 'Espaço'), CE.el('span', {}, CE.el('b', {}, 'Divide '), 'a bolinha em duas: o pedaço da frente dá um pulo. Depois de uns segundos, eles se juntam.')),
            CE.el('li', {}, CE.el('kbd', {}, 'W'), CE.el('span', {}, CE.el('b', {}, 'Solta '), 'um pouco de massa (dá até para ajudar um colega).')),
            CE.el('li', {}, CE.el('span', { class: 'ag-ic' }, '🦠'), CE.el('span', {}, 'Para comer alguém, você precisa ser bem maior. O ', CE.el('b', {}, 'vírus verde de espinhos'), ' estoura quem está grande.'))),
          recado ? CE.el('p', { class: 'ag-recado', 'data-agar': 'recado' }, recado) : null,
          fechada
            ? CE.el('p', { class: 'ag-fechada' }, '🔒 A arena está fechada agora. Quando o professor abrir, o botão Jogar acende.')
            : CE.el('p', { class: 'ag-gente', 'data-agar': 'gente' }, quem),
          e.recorde ? CE.el('p', { class: 'ag-recorde' }, `🏆 Recorde da arena: ${e.recorde.avatar} ${e.recorde.nome}, ${numero(e.recorde.massa)}`) : null,
          instrutor ? painelProfessor(e) : null,
          CE.el('div', { class: 'ag-botoes' },
            instrutor ? CE.el('button', { class: 'botao secundario grande', type: 'button', 'data-acao': 'assistir-agar', onclick: () => entrar(true) }, '👀 Assistir à arena inteira') : null,
            CE.el('button', { class: 'botao grande', type: 'button', 'data-acao': 'jogar-agar', disabled: fechada, onclick: () => entrar(false) }, '▶ Jogar'))));
        capa.hidden = false;
      }
      function painelProfessor(e) {
        const salas = (e.salas || []).slice().sort((a, b) => b.gente - a.gente);
        if (turmaEscolhida === null) turmaEscolhida = salas.length ? salas[0].turma : (turmas[0] || '');
        const opcoes = new Map();
        for (const s of salas) opcoes.set(s.turma, `${s.turma || 'Sem turma'}: ${s.gente === 1 ? '1 aluno jogando' : `${s.gente} alunos jogando`}`);
        for (const t of turmas) if (!opcoes.has(t)) opcoes.set(t, `${t || 'Sem turma'}: ninguém jogando`);
        if (!opcoes.has(turmaEscolhida)) opcoes.set(turmaEscolhida, `${turmaEscolhida || 'Sem turma'}: ninguém jogando`);
        const sel = CE.el('select', { class: 'campo', 'data-campo': 'turma-agar', onchange: () => { turmaEscolhida = sel.value; } },
          ...[...opcoes].map(([v, t]) => CE.el('option', { value: v }, t)));
        sel.value = turmaEscolhida;
        const marca = (campo, rotulo, valor) => {
          const c = CE.el('input', { type: 'checkbox', 'data-campo': campo, onchange: () => configurar({ [campo]: c.checked }) });
          c.checked = !!valor;
          return CE.el('label', { class: 'ag-opcao' }, c, ' ', rotulo);
        };
        return CE.el('div', { class: 'ag-professor' },
          CE.el('h3', {}, '⚙️ Para o professor'),
          marca('aberta', 'Arena aberta para os alunos', e.aberta),
          marca('robos', 'Robôs completam a arena (até 10 bolinhas)', e.robos),
          CE.el('label', { class: 'ag-opcao' }, 'Arena da turma: ', sel),
          CE.el('p', { class: 'ag-nota' }, 'Cada turma tem a sua arena. Fechar tira os alunos na hora; você continua assistindo. Para projetar no quadro, use "Assistir".'));
      }
      async function configurar(d) {
        try {
          estado = await CE.api.chamar('agar:configurar', d);
          if (d.aberta !== undefined) CE.avisar(d.aberta ? '🟢 Arena aberta: os alunos já podem jogar.' : '🔒 Arena fechada: os alunos saíram.');
          if (d.robos !== undefined) CE.avisar(d.robos ? '🐬 Robôs ligados: completam a arena até 10 bolinhas.' : 'Robôs desligados: só gente na arena.');
        } catch (e) { CE.avisar(e.message); }
        if (!fechou && tela === 'entrada') telaEntrada();
      }
      async function atualizarEstado(novoRecado) {
        if (novoRecado !== undefined) recado = novoRecado;
        try {
          estado = await CE.api.chamar('agar:estado');
          if (instrutor && !turmas.length) {
            const lista = await CE.api.chamar('usuarios:listar').catch(() => []);
            turmas = [...new Set((lista || []).filter((u) => u.papel !== 'instrutor').map((u) => String(u.turma || '').trim()))].sort();
          }
        } catch (e) {
          aviso.textContent = `⚠️ ${e.message || 'Sem conexão com o computador do instrutor.'}`; aviso.hidden = false;
          return;
        }
        if (fechou) return;
        aviso.hidden = true;
        // Na entrada, só redesenha se mudou alguma coisa (e não no meio de uma escolha do professor).
        const chave = JSON.stringify([estado.aberta, estado.robos, estado.gente, estado.recorde, estado.salas, estado.robosNaArena, recado]);
        const mexendo = capa.contains(document.activeElement) && document.activeElement.tagName === 'SELECT';
        if (tela !== 'entrada' || (chave !== chaveEntrada && !mexendo)) { chaveEntrada = chave; telaEntrada(); }
      }

      // ---------- Entrar, sair e morrer ----------
      async function entrar(assistir) {
        try {
          const r = await CE.api.chamar('agar:entrar', instrutor ? { turma: turmaEscolhida || '', assistir: !!assistir } : {});
          if (fechou) return;
          bolinhas.clear(); chaveRanking = '';
          tela = 'jogo'; recado = null;
          capa.hidden = true; capa.replaceChildren();
          topo.classList.remove('ag-fora');
          topo.classList.toggle('ag-assistindo', !!r.eu.espectador);
          ranking.hidden = false;
          mouse.mexeu = false;
          receber(r);
          cam.x = r.eu.x; cam.y = r.eu.y;
          if (r.eu.espectador) cam.s = Math.min(tamanho.w, tamanho.h) / (mundo + 120); // assistindo: já abre com a arena inteira
          focarArena();
          CE.emitir('agar:entrou', { assistir: !!assistir });
        } catch (e) {
          CE.avisar(e.message);
          atualizarEstado();
        }
      }
      async function sairDaArena() {
        if (tela === 'entrada') { CE.janelas.fechar('agar'); return; }
        await CE.api.chamar('agar:sair').catch(() => {});
        bolinhas.clear(); ultimo = null;
        atualizarEstado(null);
      }
      function mostrarMorte(eu) {
        tela = 'morreu';
        const q = eu.comidoPor;
        dicaN = (dicaN + 1) % DICAS.length;
        capa.replaceChildren(CE.el('div', { class: 'ag-cartao ag-morte', 'data-tela': 'morreu' },
          CE.el('div', { class: 'ag-rosto', 'aria-hidden': 'true' }, '😵'),
          CE.el('h2', {}, q ? `Você foi comido por ${q.avatar} ${q.nome}${q.robo ? ' (robô)' : ''}!` : 'Você foi comido!'),
          CE.el('p', {}, `Sua maior massa: ${numero(eu.melhor)}`, eu.comeu ? ` · Você comeu ${eu.comeu === 1 ? '1 bolinha' : `${eu.comeu} bolinhas`} de outros jogadores.` : ''),
          CE.el('p', { class: 'ag-dica' }, `💡 ${DICAS[dicaN]}`),
          CE.el('div', { class: 'ag-botoes' },
            CE.el('button', { class: 'botao secundario grande', type: 'button', 'data-acao': 'sair-arena', onclick: () => sairDaArena() }, '🚪 Sair'),
            CE.el('button', { class: 'botao grande', type: 'button', 'data-acao': 'jogar-de-novo', onclick: () => entrar(false) }, '▶ Jogar de novo'))));
        capa.hidden = false;
        const botao = capa.querySelector('[data-acao="jogar-de-novo"]');
        if (botao) botao.focus({ preventScroll: true });
      }

      // ---------- O que chega do computador do instrutor ----------
      function receber(r) {
        if (!r) return;
        if (r.fora) {
          // O professor fechou a arena (ou o computador dele reiniciou): volta para a entrada.
          bolinhas.clear(); ultimo = null;
          if (tela !== 'entrada') atualizarEstado(r.fechada ? '🔒 O professor fechou a arena.' : 'Você saiu da arena. Clique em Jogar para voltar.');
          return;
        }
        const agora = performance.now();
        const passou = (agora - chegouEm) / 1000;
        ultimo = r; chegouEm = agora; mundo = r.mundo || mundo;
        const vistas = new Set();
        for (const [pid, nome, avatar, cor, robo, cs] of r.p) {
          const minha = pid === r.euId;
          for (const [id, x, y, raio] of cs) {
            let b = bolinhas.get(id);
            if (!b) { b = { x, y, r: raio, tx: x, ty: y, vx: 0, vy: 0 }; bolinhas.set(id, b); }
            // A velocidade de cada bolinha dos outros (para continuar andando até a próxima resposta).
            if (passou > 0.03 && passou < 0.5) { b.vx = (x - b.sx) / passou || 0; b.vy = (y - b.sy) / passou || 0; } else { b.vx = 0; b.vy = 0; }
            Object.assign(b, { tx: x, ty: y, sx: x, sy: y, tr: raio, pid, nome, avatar, cor, robo, minha });
            vistas.add(id);
          }
        }
        for (const id of [...bolinhas.keys()]) if (!vistas.has(id)) bolinhas.delete(id);
        massaEl.textContent = r.eu.espectador ? 'assistindo' : numero(r.eu.massa);
        posicaoEl.textContent = r.eu.espectador
          ? `👀 Arena da turma ${r.turma || '(sem turma)'}: ${r.gente === 1 ? '1 aluno' : `${r.gente} alunos`} e ${r.robosVivos === 1 ? '1 robô' : `${r.robosVivos} robôs`}`
          : r.pos ? `${r.pos}º lugar de ${r.total}` : '';
        desenharRanking(r);
        if (!r.eu.vivo && !r.eu.espectador && tela === 'jogo') mostrarMorte(r.eu);
      }
      function desenharRanking(r) {
        const chave = JSON.stringify([r.rk, r.pos, r.recorde]);
        if (chave === chaveRanking) return;
        chaveRanking = chave;
        ranking.replaceChildren(...[
          CE.el('h3', {}, '🏆 Ranking'),
          CE.el('ol', {}, ...r.rk.map(([nome, avatar, massa, robo, eu]) => CE.el('li', { class: `${eu ? 'eu' : ''}${robo ? ' robo' : ''}` },
            CE.el('span', { class: 'ag-rk-nome' }, `${avatar} ${nome}`, robo ? CE.el('small', {}, ' robô') : null),
            CE.el('span', { class: 'ag-rk-massa' }, numero(massa))))),
          r.pos && r.pos > 10 ? CE.el('p', { class: 'eu' }, `Você: ${r.pos}º lugar`) : null,
          r.recorde ? CE.el('p', { class: 'ag-rk-recorde' }, `Recorde: ${r.recorde.avatar} ${r.recorde.nome}, ${numero(r.recorde.massa)}`) : null,
        ].filter(Boolean));
      }

      // ---------- Mouse e teclado ----------
      function posMouse(ev) { const q = canvas.getBoundingClientRect(); mouse.x = ev.clientX - q.left; mouse.y = ev.clientY - q.top; mouse.mexeu = true; }
      canvas.addEventListener('mousemove', posMouse);
      canvas.addEventListener('mousedown', (ev) => { posMouse(ev); focarArena(); });
      canvas.addEventListener('touchstart', (ev) => { if (ev.touches[0]) posMouse(ev.touches[0]); }, { passive: true });
      canvas.addEventListener('touchmove', (ev) => { if (ev.touches[0]) posMouse(ev.touches[0]); }, { passive: true });
      // Espaço e W só valem com a janela do jogo na frente (e ninguém digitando num campo).
      function tecla(ev) {
        if (fechou || tela !== 'jogo' || !ultimo || ultimo.eu.espectador) return;
        const j = janelaEl();
        if (!j || !j.classList.contains('ativa') || j.classList.contains('minimizada')) return;
        if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
        if (ev.code === 'Space') { ev.preventDefault(); if (!ev.repeat) pedidos.dividir = true; } else if (ev.code === 'KeyW') pedidos.soltar = true;
      }
      document.addEventListener('keydown', tecla);
      function alvoNoMundo() {
        if (!mouse.mexeu) return { x: cam.x, y: cam.y };
        return { x: cam.x + (mouse.x - tamanho.w / 2) / cam.s, y: cam.y + (mouse.y - tamanho.h / 2) / cam.s };
      }

      // ---------- Conversa com o computador do instrutor ----------
      async function rede() {
        if (emCurso || fechou) return;
        emCurso = true;
        try {
          if (tela === 'entrada') { await atualizarEstado(); return; }
          const alvo = alvoNoMundo();
          const d = { x: Math.round(alvo.x), y: Math.round(alvo.y), vw: Math.round(tamanho.w / 2 / cam.s + 80), vh: Math.round(tamanho.h / 2 / cam.s + 80) };
          if (pedidos.dividir) d.dividir = true;
          if (pedidos.soltar) d.soltar = true;
          pedidos.dividir = false; pedidos.soltar = false;
          const r = await CE.api.chamar('agar:jogar', d);
          if (fechou) return;
          aviso.hidden = true;
          receber(r);
        } catch (e) {
          aviso.textContent = `⚠️ ${e.message || 'Sem conexão com o computador do instrutor.'}`;
          aviso.hidden = false;
        } finally { emCurso = false; }
      }

      // ---------- Desenho ----------
      function desenharBolinha(b) {
        // Vista de longe (o professor assistindo): a bolinha tem pelo menos 4 pontos na tela e o aluno leva o nome em cima.
        ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(b.r, 4 / cam.s), 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${b.cor}, 72%, 60%)`; ctx.fill();
        ctx.lineWidth = Math.max(2, b.r * 0.07);
        ctx.strokeStyle = b.minha ? '#0b3d6e' : `hsl(${b.cor}, 65%, 38%)`; ctx.stroke();
        if (b.r * cam.s < 9) {
          if (b.robo) return;
          const fl = 12 / cam.s;
          ctx.font = `700 ${fl}px "Segoe UI", Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.lineWidth = fl * 0.25; ctx.strokeStyle = 'rgba(255, 255, 255, .9)'; ctx.fillStyle = '#0b3d6e';
          const y = b.y - Math.max(b.r, 4 / cam.s) - 2 / cam.s;
          ctx.strokeText(`${b.avatar} ${b.nome}`, b.x, y); ctx.fillText(`${b.avatar} ${b.nome}`, b.x, y);
          return;
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(8, b.r * 0.72)}px ${EMOJI}`;
        ctx.fillText(b.avatar, b.x, b.y - b.r * 0.14);
        const fn = Math.max(8, b.r * 0.34);
        ctx.font = `700 ${fn}px "Segoe UI", Arial, sans-serif`;
        ctx.lineWidth = fn * 0.2; ctx.strokeStyle = 'rgba(0, 0, 0, .7)'; ctx.fillStyle = '#fff';
        ctx.strokeText(b.nome, b.x, b.y + b.r * 0.5); ctx.fillText(b.nome, b.x, b.y + b.r * 0.5);
      }
      function desenharVirus(x, y, r) {
        const pontas = 20;
        ctx.beginPath();
        for (let i = 0; i <= pontas * 2; i++) { const a = (i / (pontas * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.1; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        ctx.fillStyle = 'rgba(60, 200, 70, .9)'; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#2a8a2a'; ctx.stroke();
      }
      function desenhar() {
        const { w, h } = tamanho;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#f2f5f7'; ctx.fillRect(0, 0, w, h);
        if (!ultimo) return;
        ctx.save();
        ctx.translate(w / 2, h / 2); ctx.scale(cam.s, cam.s); ctx.translate(-cam.x, -cam.y);
        // Quadriculado e a borda da arena
        const g = 50, x0 = Math.max(0, Math.floor((cam.x - w / 2 / cam.s) / g) * g), x1 = Math.min(mundo, cam.x + w / 2 / cam.s);
        const y0 = Math.max(0, Math.floor((cam.y - h / 2 / cam.s) / g) * g), y1 = Math.min(mundo, cam.y + h / 2 / cam.s);
        ctx.beginPath();
        for (let x = x0; x <= x1; x += g) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
        for (let y = y0; y <= y1; y += g) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
        ctx.strokeStyle = '#dde3e8'; ctx.lineWidth = 1 / cam.s; ctx.stroke();
        ctx.strokeStyle = '#d64541'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, mundo, mundo);
        for (const [x, y, r, c] of ultimo.f) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = c >= 0 ? CORES_COMIDA[c % 12] : `hsl(${-c - 1}, 72%, 55%)`; ctx.fill();
        }
        // As bolinhas, das menores para as maiores; o vírus fica por cima das pequenas e por baixo das grandes.
        const lista = [...bolinhas.values()].sort((a, b) => a.r - b.r);
        let virusFeito = false;
        for (const b of lista) {
          if (!virusFeito && b.r > 62) { for (const [x, y, r] of ultimo.v) desenharVirus(x, y, r); virusFeito = true; }
          desenharBolinha(b);
        }
        if (!virusFeito) for (const [x, y, r] of ultimo.v) desenharVirus(x, y, r);
        ctx.restore();
        // Mapinha no canto: onde a câmera está na arena
        const m = 110, ox = 10, oy = h - m - 10;
        ctx.fillStyle = 'rgba(11, 61, 110, .35)'; ctx.fillRect(ox, oy, m, m);
        ctx.strokeStyle = 'rgba(255, 255, 255, .7)'; ctx.lineWidth = 1; ctx.strokeRect(ox + 0.5, oy + 0.5, m - 1, m - 1);
        ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(ox + (cam.x / mundo) * m, oy + (cam.y / mundo) * m, 4, 0, Math.PI * 2); ctx.fill();
      }

      // ---------- Laço: suaviza, adianta a própria bolinha, move a câmera, desenha e conversa com o instrutor ----------
      let antes = performance.now(), quadroId = 0;
      function quadro(agora) {
        if (fechou) return;
        const dt = Math.min(0.05, (agora - antes) / 1000); antes = agora;
        const k = 1 - Math.exp(-dt * 14);
        const recente = ultimo && agora - chegouEm < 250;
        const vivo = recente && ultimo.eu.vivo;
        const alvo = vivo ? alvoNoMundo() : null;
        let mx = 0, my = 0, mt = 0;
        for (const b of bolinhas.values()) {
          if (b.minha && vivo) {
            const dx = alvo.x - b.tx, dy = alvo.y - b.ty, d = Math.hypot(dx, dy);
            const f = Math.min(1, d / (b.tr * 0.6 + 20));
            if (d > 1) { const v = velocidade((b.tr / 4) ** 2) * f * dt; b.tx += dx / d * v; b.ty += dy / d * v; }
          } else if (recente && !b.minha) { b.tx += b.vx * dt; b.ty += b.vy * dt; }
          b.x += (b.tx - b.x) * k; b.y += (b.ty - b.y) * k; b.r += (b.tr - b.r) * k;
          if (b.minha) { mx += b.x * b.r * b.r; my += b.y * b.r * b.r; mt += b.r * b.r; }
        }
        if (ultimo) {
          const esp = ultimo.eu.espectador;
          const cx = esp ? mundo / 2 : mt ? mx / mt : ultimo.eu.x, cy = esp ? mundo / 2 : mt ? my / mt : ultimo.eu.y;
          const kc = Math.min(1, k * 1.6);
          cam.x += (cx - cam.x) * kc; cam.y += (cy - cam.y) * kc;
          const base = Math.min(tamanho.w, tamanho.h);
          const massa = mt ? mt / 16 : ultimo.eu.massa || 20;
          const zoom = esp ? base / (mundo + 120) : Math.max(0.15, Math.min(2, (base / 900) * 1.6 / (1 + Math.sqrt(massa) / 20)));
          cam.s += (zoom - cam.s) * Math.min(1, k * 0.6);
        }
        const j = janelaEl();
        const minimizada = !!j && j.classList.contains('minimizada');
        const ativa = !!j && j.classList.contains('ativa');
        if (!minimizada) desenhar(); // minimizada, ninguém vê: não gasta o computador do aluno desenhando
        const ritmo = tela === 'entrada' ? RITMO_ESPERA : minimizada ? RITMO_LONGE : ativa ? RITMO : RITMO_ATRAS;
        if (agora - ultimaRede > ritmo) { ultimaRede = agora; rede(); }
        quadroId = requestAnimationFrame(quadro);
      }

      telaEntrada();
      ultimaRede = performance.now();
      atualizarEstado();
      quadroId = requestAnimationFrame(quadro);

      return {
        aoFechar() {
          fechou = true;
          cancelAnimationFrame(quadroId);
          observador.disconnect();
          document.removeEventListener('keydown', tecla);
          CE.api.chamar('agar:sair').catch(() => {});
          return true;
        },
      };
    },
  });
})();
