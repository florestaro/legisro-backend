// "Cobrinha da Turma": a janela do jogo das cobrinhas. Abre pelo prédio da Cobrinha na Praça Escola (🐍, entre a
// horta e a estação). A arena anda no computador do instrutor (regras em app/js/cobrinha-regras.js): esta janela só
// manda para onde o mouse aponta e se está acelerando (10 vezes por segundo, com a janela na frente) e desenha o que
// volta, suavizando o movimento entre uma resposta e outra. O professor abre ou fecha a arena, liga os robôs e pode
// assistir à arena inteira. Tem o mesmo jeito (e o mesmo visual) do Agar da Turma (app/js/apps/agar.js).
window.CE = window.CE || {};

(function () {
  const RITMO = 100, RITMO_ATRAS = 400, RITMO_LONGE = 1000, RITMO_ESPERA = 2000;
  const CORES_COMIDA = Array.from({ length: 12 }, (_, i) => `hsl(${i * 30}, 85%, 58%)`);
  const EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  const numero = (n) => Math.round(Number(n) || 0).toLocaleString('pt-BR');
  const DICAS = [
    'Para pegar alguém, passe na frente da cabeça dele: quem bate a cabeça no seu corpo é que perde.',
    'Acelerar gasta tamanho: use só para fugir ou para cortar a frente de alguém.',
    'Quando uma cobrinha morre, ela vira um monte de comida. Corra para pegar!',
    'Cobrinha grande pode dar a volta em outra e ir fechando o círculo.',
    'Pequeno, fique longe das cabeças das outras cobrinhas e das paredes.',
    'Cabeça com cabeça: a cobrinha menor é que perde.',
  ];

  CE.registrarApp({
    id: 'cobrinha', nome: 'Cobrinha da Turma', icone: '🐍', semIcone: true, largura: 1060, altura: 690,
    abrir(corpo) {
      corpo.classList.add('ag-app', 'cb-app');
      const usuario = CE.sessao.usuario;
      const instrutor = !!usuario && usuario.papel === 'instrutor';
      const janelaEl = () => corpo.closest('.janela');
      let fechou = false, tela = 'entrada', estado = null, ultimo = null, emCurso = false, ultimaRede = 0;
      let turmaEscolhida = null, turmas = [], recado = null, chaveEntrada = '', chaveRanking = '', dicaN = Math.floor(Math.random() * DICAS.length);
      let mundo = 3000, dpr = 1;
      const mouse = { x: 0, y: 0, mexeu: false };
      const acelera = { tecla: false, mouse: false, botao: false };
      const cam = { x: 1500, y: 1500, s: 1 };
      const tamanho = { w: 800, h: 500 };
      const cobras = new Map(); // id -> { pts (mostrados), alvo (os que chegaram), r, nome, avatar, cor, robo, minha, turbo }

      // ---------- A tela ----------
      const massaEl = CE.el('strong', { 'data-cobrinha': 'tamanho' }, '—');
      const posicaoEl = CE.el('span', { class: 'ag-pos', 'data-cobrinha': 'posicao' });
      const botaoTurbo = CE.el('button', { class: 'botao secundario pequeno ag-so-jogando', type: 'button', 'data-acao': 'acelerar', title: 'Segure para acelerar (tecla Espaço ou o botão do mouse)' }, '⚡ Acelerar ', CE.el('kbd', {}, 'Espaço'));
      botaoTurbo.addEventListener('pointerdown', (e) => { e.preventDefault(); acelera.botao = true; });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) botaoTurbo.addEventListener(ev, () => { acelera.botao = false; focarArena(); });
      const topo = CE.el('div', { class: 'ag-topo ag-fora' },
        CE.el('span', { class: 'ag-marca' }, '🐍 Cobrinha da Turma'),
        CE.el('span', { class: 'ag-massa' }, 'Tamanho: ', massaEl), posicaoEl,
        CE.el('span', { class: 'ag-espaco' }), botaoTurbo,
        CE.el('button', { class: 'botao secundario pequeno', type: 'button', 'data-acao': 'sair-arena', onclick: () => sairDaArena() }, '🚪 Sair da arena'));
      const canvas = CE.el('canvas', { class: 'ag-tela', tabindex: '0', 'aria-label': 'Arena da Cobrinha da Turma: mova o mouse para guiar a sua cobrinha' });
      const ranking = CE.el('div', { class: 'ag-ranking', 'data-cobrinha': 'ranking', hidden: true });
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
          CE.el('h2', {}, '🐍 Cobrinha da Turma'),
          CE.el('p', { class: 'ag-lema' }, 'Você é uma cobrinha. Coma as bolinhas para ficar comprida e faça as outras baterem em você!'),
          CE.el('ul', { class: 'ag-como' },
            CE.el('li', {}, CE.el('span', { class: 'ag-ic' }, '🖱️'), CE.el('span', {}, CE.el('b', {}, 'Mova o mouse: '), 'a cobrinha vai para onde a setinha aponta. Não precisa clicar.')),
            CE.el('li', {}, CE.el('kbd', {}, 'Espaço'), CE.el('span', {}, CE.el('b', {}, 'Segure para acelerar '), '(ou segure o botão do mouse). Acelerando, a cobrinha vai ficando menor.')),
            CE.el('li', {}, CE.el('span', { class: 'ag-ic' }, '💥'), CE.el('span', {}, 'Quem ', CE.el('b', {}, 'bate a cabeça no corpo'), ' de outra cobrinha perde e vira comida. Passe na frente dos outros!'))),
          recado ? CE.el('p', { class: 'ag-recado', 'data-cobrinha': 'recado' }, recado) : null,
          fechada
            ? CE.el('p', { class: 'ag-fechada' }, '🔒 A arena está fechada agora. Quando o professor abrir, o botão Jogar acende.')
            : CE.el('p', { class: 'ag-gente', 'data-cobrinha': 'gente' }, quem),
          e.recorde ? CE.el('p', { class: 'ag-recorde' }, `🏆 Recorde da arena: ${e.recorde.avatar} ${e.recorde.nome}, tamanho ${numero(e.recorde.massa)}`) : null,
          instrutor ? painelProfessor(e) : null,
          CE.el('div', { class: 'ag-botoes' },
            instrutor ? CE.el('button', { class: 'botao secundario grande', type: 'button', 'data-acao': 'assistir-cobrinha', onclick: () => entrar(true) }, '👀 Assistir à arena inteira') : null,
            CE.el('button', { class: 'botao grande', type: 'button', 'data-acao': 'jogar-cobrinha', disabled: fechada, onclick: () => entrar(false) }, '▶ Jogar'))));
        capa.hidden = false;
      }
      function painelProfessor(e) {
        const salas = (e.salas || []).slice().sort((a, b) => b.gente - a.gente);
        if (turmaEscolhida === null) turmaEscolhida = salas.length ? salas[0].turma : (turmas[0] || '');
        const opcoes = new Map();
        for (const s of salas) opcoes.set(s.turma, `${s.turma || 'Sem turma'}: ${s.gente === 1 ? '1 aluno jogando' : `${s.gente} alunos jogando`}`);
        for (const t of turmas) if (!opcoes.has(t)) opcoes.set(t, `${t || 'Sem turma'}: ninguém jogando`);
        if (!opcoes.has(turmaEscolhida)) opcoes.set(turmaEscolhida, `${turmaEscolhida || 'Sem turma'}: ninguém jogando`);
        const sel = CE.el('select', { class: 'campo', 'data-campo': 'turma-cobrinha', onchange: () => { turmaEscolhida = sel.value; } },
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
          marca('robos', 'Robôs completam a arena (até 8 cobrinhas)', e.robos),
          CE.el('label', { class: 'ag-opcao' }, 'Arena da turma: ', sel),
          CE.el('p', { class: 'ag-nota' }, 'Cada turma tem a sua arena. Fechar tira os alunos na hora; você continua assistindo. Para projetar no quadro, use "Assistir".'));
      }
      async function configurar(d) {
        try {
          estado = await CE.api.chamar('cobrinha:configurar', d);
          if (d.aberta !== undefined) CE.avisar(d.aberta ? '🐍 Arena aberta: os alunos já podem jogar.' : '🔒 Arena fechada: os alunos saíram.');
          if (d.robos !== undefined) CE.avisar(d.robos ? '🐊 Robôs ligados: completam a arena até 8 cobrinhas.' : 'Robôs desligados: só gente na arena.');
        } catch (e) { CE.avisar(e.message); }
        if (!fechou && tela === 'entrada') telaEntrada();
      }
      async function atualizarEstado(novoRecado) {
        if (novoRecado !== undefined) recado = novoRecado;
        try {
          estado = await CE.api.chamar('cobrinha:estado');
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
        const chave = JSON.stringify([estado.aberta, estado.robos, estado.gente, estado.recorde, estado.salas, estado.robosNaArena, recado]);
        const mexendo = capa.contains(document.activeElement) && document.activeElement.tagName === 'SELECT';
        if (tela !== 'entrada' || (chave !== chaveEntrada && !mexendo)) { chaveEntrada = chave; telaEntrada(); }
      }

      // ---------- Entrar, sair e morrer ----------
      async function entrar(assistir) {
        try {
          const r = await CE.api.chamar('cobrinha:entrar', instrutor ? { turma: turmaEscolhida || '', assistir: !!assistir } : {});
          if (fechou) return;
          cobras.clear(); chaveRanking = '';
          tela = 'jogo'; recado = null;
          capa.hidden = true; capa.replaceChildren();
          topo.classList.remove('ag-fora');
          topo.classList.toggle('ag-assistindo', !!r.eu.espectador);
          ranking.hidden = false;
          mouse.mexeu = false;
          receber(r);
          cam.x = r.eu.x; cam.y = r.eu.y;
          if (r.eu.espectador) cam.s = Math.min(tamanho.w, tamanho.h) / (mundo + 120);
          focarArena();
          CE.emitir('cobrinha:entrou', { assistir: !!assistir });
        } catch (e) {
          CE.avisar(e.message);
          atualizarEstado();
        }
      }
      async function sairDaArena() {
        if (tela === 'entrada') { CE.janelas.fechar('cobrinha'); return; }
        await CE.api.chamar('cobrinha:sair').catch(() => {});
        cobras.clear(); ultimo = null;
        atualizarEstado(null);
      }
      function mostrarMorte(eu) {
        tela = 'morreu';
        const q = eu.mortoPor;
        dicaN = (dicaN + 1) % DICAS.length;
        capa.replaceChildren(CE.el('div', { class: 'ag-cartao ag-morte', 'data-tela': 'morreu' },
          CE.el('div', { class: 'ag-rosto', 'aria-hidden': 'true' }, '💥'),
          CE.el('h2', {}, q ? `Você bateu na cobrinha de ${q.avatar} ${q.nome}${q.robo ? ' (robô)' : ''}!` : 'Você bateu!'),
          CE.el('p', {}, `Seu maior tamanho: ${numero(eu.melhor)}`, eu.abates ? ` · ${eu.abates === 1 ? '1 cobrinha bateu' : `${eu.abates} cobrinhas bateram`} em você.` : ''),
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
          cobras.clear(); ultimo = null;
          if (tela !== 'entrada') atualizarEstado(r.fechada ? '🔒 O professor fechou a arena.' : 'Você saiu da arena. Clique em Jogar para voltar.');
          return;
        }
        ultimo = r; mundo = r.mundo || mundo;
        const vistas = new Set();
        for (const [id, nome, avatar, cor, robo, raio, turbo, pts] of r.c) {
          let c = cobras.get(id);
          if (!c) { c = { pts: pts.slice() }; cobras.set(id, c); }
          // Cresceu ou diminuiu: os gomos novos aparecem já no lugar.
          if (c.pts.length !== pts.length) { const velhos = c.pts; c.pts = pts.slice(); for (let i = 0; i < Math.min(velhos.length, pts.length); i++) c.pts[i] = velhos[i]; }
          Object.assign(c, { alvo: pts, r: raio, nome, avatar, cor, robo, turbo, minha: id === r.euId });
          if (c.rMostrado === undefined) c.rMostrado = raio;
          vistas.add(id);
        }
        for (const id of [...cobras.keys()]) if (!vistas.has(id)) cobras.delete(id);
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
          CE.el('h3', {}, '🏆 Os maiores'),
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
      canvas.addEventListener('mousedown', (ev) => { posMouse(ev); focarArena(); if (ev.button === 0) acelera.mouse = true; });
      canvas.addEventListener('mouseup', () => { acelera.mouse = false; });
      canvas.addEventListener('mouseleave', () => { acelera.mouse = false; });
      canvas.addEventListener('touchstart', (ev) => { if (ev.touches[0]) posMouse(ev.touches[0]); }, { passive: true });
      canvas.addEventListener('touchmove', (ev) => { if (ev.touches[0]) posMouse(ev.touches[0]); }, { passive: true });
      // Espaço só vale com a janela do jogo na frente (e ninguém digitando num campo).
      function teclaDesce(ev) {
        if (fechou || tela !== 'jogo' || !ultimo || ultimo.eu.espectador || ev.code !== 'Space') return;
        const j = janelaEl();
        if (!j || !j.classList.contains('ativa') || j.classList.contains('minimizada')) return;
        if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
        ev.preventDefault(); acelera.tecla = true;
      }
      function teclaSobe(ev) { if (ev.code === 'Space') acelera.tecla = false; }
      document.addEventListener('keydown', teclaDesce);
      document.addEventListener('keyup', teclaSobe);
      const soltouTudo = () => { acelera.tecla = false; acelera.mouse = false; acelera.botao = false; };
      window.addEventListener('blur', soltouTudo);
      const acelerando = () => acelera.tecla || acelera.mouse || acelera.botao;
      function alvoNoMundo() {
        if (!mouse.mexeu) return null; // ainda não mexeu: a cobrinha segue reto
        return { x: cam.x + (mouse.x - tamanho.w / 2) / cam.s, y: cam.y + (mouse.y - tamanho.h / 2) / cam.s };
      }

      // ---------- Conversa com o computador do instrutor ----------
      async function rede() {
        if (emCurso || fechou) return;
        emCurso = true;
        try {
          if (tela === 'entrada') { await atualizarEstado(); return; }
          const alvo = alvoNoMundo();
          const d = { vw: Math.round(tamanho.w / 2 / cam.s + 80), vh: Math.round(tamanho.h / 2 / cam.s + 80) };
          if (alvo) { d.x = Math.round(alvo.x); d.y = Math.round(alvo.y); }
          if (acelerando()) d.acelerar = true;
          const r = await CE.api.chamar('cobrinha:jogar', d);
          if (fechou) return;
          aviso.hidden = true;
          receber(r);
        } catch (e) {
          aviso.textContent = `⚠️ ${e.message || 'Sem conexão com o computador do instrutor.'}`;
          aviso.hidden = false;
        } finally { emCurso = false; }
      }

      // ---------- Desenho ----------
      function caminho(pts) {
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2], pts[pts.length - 1]);
        for (let i = pts.length - 4; i >= 0; i -= 2) ctx.lineTo(pts[i], pts[i + 1]);
      }
      function desenharCobra(c) {
        const r = Math.max(c.rMostrado, 3 / cam.s), p = c.pts;
        if (p.length < 2) return;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (c.turbo) { caminho(p); ctx.strokeStyle = `hsla(${c.cor}, 90%, 70%, .45)`; ctx.lineWidth = r * 2 + 10; ctx.stroke(); }
        caminho(p); ctx.strokeStyle = `hsl(${c.cor}, 70%, 55%)`; ctx.lineWidth = r * 2; ctx.stroke();
        // As listras (gomos)
        caminho(p); ctx.setLineDash([r * 0.9, r * 0.9]); ctx.strokeStyle = `hsl(${c.cor}, 70%, 42%)`; ctx.lineWidth = r * 1.1; ctx.stroke(); ctx.setLineDash([]);
        // A cabeça, com os olhos olhando para a frente
        const hx = p[0], hy = p[1], a = p.length >= 4 ? Math.atan2(p[1] - p[3], p[0] - p[2]) : 0;
        ctx.beginPath(); ctx.arc(hx, hy, r * 1.08, 0, Math.PI * 2); ctx.fillStyle = `hsl(${c.cor}, 72%, 58%)`; ctx.fill();
        ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.strokeStyle = c.minha ? '#0b3d6e' : `hsl(${c.cor}, 65%, 35%)`; ctx.stroke();
        for (const lado of [-1, 1]) {
          const ex = hx + Math.cos(a + lado * 0.65) * r * 0.55, ey = hy + Math.sin(a + lado * 0.65) * r * 0.55;
          ctx.beginPath(); ctx.arc(ex, ey, r * 0.32, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.beginPath(); ctx.arc(ex + Math.cos(a) * r * 0.12, ey + Math.sin(a) * r * 0.12, r * 0.16, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill();
        }
        // O nome em cima da cabeça, sempre do mesmo tamanho na tela (de longe, só os alunos)
        if (c.robo && r * cam.s < 5) return;
        const fl = 13 / cam.s, y = hy - r * 1.1 - 4 / cam.s;
        ctx.font = `700 ${fl}px "Segoe UI", Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.lineWidth = fl * 0.25; ctx.strokeStyle = 'rgba(255, 255, 255, .9)'; ctx.fillStyle = c.minha ? '#0b3d6e' : '#222';
        ctx.strokeText(`${c.nome}`, hx, y); ctx.fillText(`${c.nome}`, hx, y);
        ctx.font = `${fl * 1.1}px ${EMOJI}`; ctx.fillText(c.avatar, hx, y - fl * 1.15);
      }
      function desenhar() {
        const { w, h } = tamanho;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#eef3ea'; ctx.fillRect(0, 0, w, h);
        if (!ultimo) return;
        ctx.save();
        ctx.translate(w / 2, h / 2); ctx.scale(cam.s, cam.s); ctx.translate(-cam.x, -cam.y);
        const g = 60, x0 = Math.max(0, Math.floor((cam.x - w / 2 / cam.s) / g) * g), x1 = Math.min(mundo, cam.x + w / 2 / cam.s);
        const y0 = Math.max(0, Math.floor((cam.y - h / 2 / cam.s) / g) * g), y1 = Math.min(mundo, cam.y + h / 2 / cam.s);
        ctx.beginPath();
        for (let x = x0; x <= x1; x += g) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
        for (let y = y0; y <= y1; y += g) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
        ctx.strokeStyle = '#dbe5d3'; ctx.lineWidth = 1 / cam.s; ctx.stroke();
        ctx.strokeStyle = '#d64541'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, mundo, mundo);
        for (const [x, y, r, c] of ultimo.f) {
          ctx.beginPath(); ctx.arc(x, y, Math.max(r, 1.5 / cam.s), 0, Math.PI * 2);
          ctx.fillStyle = c >= 0 ? CORES_COMIDA[c % 12] : `hsl(${-c - 1}, 75%, 55%)`; ctx.fill();
        }
        // As menores por baixo, as maiores por cima; a sua sempre por cima de todas.
        const lista = [...cobras.values()].sort((a, b) => (a.minha - b.minha) || (a.r - b.r));
        for (const c of lista) desenharCobra(c);
        ctx.restore();
        const m = 110, ox = 10, oy = h - m - 10;
        ctx.fillStyle = 'rgba(11, 61, 110, .35)'; ctx.fillRect(ox, oy, m, m);
        ctx.strokeStyle = 'rgba(255, 255, 255, .7)'; ctx.lineWidth = 1; ctx.strokeRect(ox + 0.5, oy + 0.5, m - 1, m - 1);
        ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(ox + (cam.x / mundo) * m, oy + (cam.y / mundo) * m, 4, 0, Math.PI * 2); ctx.fill();
      }

      // ---------- Laço: suaviza os corpos, move a câmera, desenha e conversa com o instrutor ----------
      let antes = performance.now(), quadroId = 0;
      function quadro(agora) {
        if (fechou) return;
        const dt = Math.min(0.05, (agora - antes) / 1000); antes = agora;
        const k = 1 - Math.exp(-dt * 12);
        let minha = null;
        for (const c of cobras.values()) {
          const p = c.pts, a = c.alvo;
          if (a) for (let i = 0; i < p.length && i < a.length; i++) p[i] += (a[i] - p[i]) * k;
          c.rMostrado += (c.r - c.rMostrado) * k;
          if (c.minha) minha = c;
        }
        if (ultimo) {
          const esp = ultimo.eu.espectador;
          const cx = esp ? mundo / 2 : minha ? minha.pts[0] : ultimo.eu.x, cy = esp ? mundo / 2 : minha ? minha.pts[1] : ultimo.eu.y;
          const kc = Math.min(1, k * 2);
          cam.x += (cx - cam.x) * kc; cam.y += (cy - cam.y) * kc;
          const base = Math.min(tamanho.w, tamanho.h);
          const zoom = esp ? base / (mundo + 120) : Math.max(0.2, Math.min(1.6, (base / 900) * 1.35 / (1 + Math.sqrt(ultimo.eu.massa || 20) / 30)));
          cam.s += (zoom - cam.s) * Math.min(1, k * 0.6);
        }
        const j = janelaEl();
        const minimizada = !!j && j.classList.contains('minimizada');
        const ativa = !!j && j.classList.contains('ativa');
        if (!minimizada) desenhar();
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
          document.removeEventListener('keydown', teclaDesce);
          document.removeEventListener('keyup', teclaSobe);
          window.removeEventListener('blur', soltouTudo);
          CE.api.chamar('cobrinha:sair').catch(() => {});
          return true;
        },
      };
    },
  });
})();
