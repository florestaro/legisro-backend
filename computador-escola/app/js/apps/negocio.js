// "Do Campo ao Balcão": o jogo de gerenciar a hamburgueria da turma, com a cadeia inteira (roça, pasto, frigorífico,
// transporte, lanchonete e escritório). Abre pelo prédio da lanchonete na Praça Escola (ou pelo convite).
// O professor abre o jogo (modo, nível, funções, como distribuir), acompanha o painel geral e mexe no termômetro
// durante a partida. Cada aluno vê só o seu setor e precisa conversar com os outros. Regras em negocio-regras.js.
window.CE = window.CE || {};

(function () {
  const R = () => (CE.negocioRegras ? CE.negocioRegras() : null);
  const REF = R() || {};
  const FUNCOES = REF.FUNCOES || [];
  const porId = Object.fromEntries(FUNCOES.map((f) => [f.id, f]));
  const dinheiro = (v) => `R$ ${Math.round(Number(v) || 0).toLocaleString('pt-BR')}`;
  const chamar = (canal, ...a) => CE.api.chamar(canal, ...a);
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const nomeF = (id) => (porId[id] ? `${porId[id].icone} ${porId[id].nome}` : id);
  const horaTexto = (h) => { const d = Math.floor(h / 24) + 1, hh = Math.floor(h) % 24; return `dia ${d}, ${hh}h`; };

  CE.registrarApp({
    id: 'negocio', nome: 'Do Campo ao Balcão', icone: '🍔', semIcone: true, largura: 1240, altura: 700,
    abrir(corpo, janela) {
      corpo.classList.add('ng-app');
      const usuario = CE.sessao.usuario;
      const instrutor = usuario && usuario.papel === 'instrutor';
      let estado = null, timer = null, aba = null, empresaVista = null, fechou = false, entrou = false, ultimaChave = '';
      // Os mini-jogos guardam o que está no meio (o pedido do caixa e o lanche do chapeiro).
      const mini = { pedido: null, receita: null, montado: [] };
      // As cenas animadas (negocio-cenas.js): uma de cada tipo, guardada para a animação não recomeçar a cada segundo.
      const cenas = {};
      let detalhesAbertos = false;
      const ctxCena = {
        acao: (f, t, d) => acao(f, t, d),
        pode: (f) => minhasFuncoes().includes(f),
        quem: (f) => { const e = empresaAtual(); return e ? quemFaz(e, f) || nomeF(f) : nomeF(f); },
        nome: nomeF,
        irPara: (f) => { aba = 'f:' + f; desenhar(true); },
        avisar: (m) => CE.avisar(m),
      };
      function cena(tipo, e) {
        if (!CE.negocioCenas) return null;
        if (!cenas[tipo]) cenas[tipo] = CE.negocioCenas.criar(tipo, ctxCena);
        cenas[tipo].atualizar(estado, e);
        return cenas[tipo].el;
      }

      async function atualizar(forcar) {
        if (fechou) return;
        try {
          estado = await chamar('negocio:estado');
          if (estado && !instrutor && !estado.eu && !entrou && estado.estado !== 'fim') { entrou = true; estado = await chamar('negocio:entrar'); }
        } catch (e) { estado = null; }
        desenhar(forcar);
      }
      const acao = (funcao, tipo, dados = {}) => chamar('negocio:acao', { funcao, tipo, empresa: instrutor ? empresaVista : undefined, ...dados })
        .then((r) => { estado = r; desenhar(true); return r; }).catch((e) => { CE.avisar(e.message); throw e; });
      const pedir = (canal, ...a) => chamar(canal, ...a).then((r) => { estado = r; desenhar(true); return r; }).catch((e) => CE.avisar(e.message));

      // ---------- Desenho (sem apagar o que o aluno está digitando) ----------
      function digitando() { const a = document.activeElement; return a && corpo.contains(a) && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName); }
      function desenhar(forcar) {
        if (fechou) return;
        if (!estado) return corpo.replaceChildren(instrutor ? telaConfigurar() : telaAguardando());
        const chave = `${estado.estado}|${estado.modo}|${instrutor}`;
        if (!forcar && digitando() && chave === ultimaChave) { atualizarTopo(); return; }
        ultimaChave = chave;
        if (estado.estado === 'espera') return corpo.replaceChildren(instrutor ? telaEsperaInstrutor() : telaEsperaAluno());
        if (estado.estado === 'fim') return corpo.replaceChildren(telaFim());
        corpo.replaceChildren(telaJogo());
      }

      // ---------- Professor: abrir o jogo ----------
      function telaConfigurar() {
        const sel = (campo, opcoes, valor) => { const s = CE.el('select', { class: 'campo', 'data-campo': campo }, ...opcoes.map(([v, t]) => CE.el('option', { value: v }, t))); s.value = valor; return s; };
        const modo = sel('modo', [['turma', '👥 A turma é uma empresa só (cada um num setor)'], ['cada', '🧍 Cada aluno com a sua empresa (mexe em tudo)']], 'turma');
        const nivel = sel('nivel', REF.NIVEIS.map((n) => [String(n.nivel), `${n.nome} (nível ${n.nivel})`]), '5');
        const dias = sel('dias', [['10', '10 dias (uns 20 min)'], ['20', '20 dias (uns 35 min)'], ['30', '30 dias (uns 50 min)']], '20');
        const distribuicao = sel('distribuicao', [['sortear', '🎲 Sortear as funções'], ['escolher', '✋ Eu escolho quem faz o quê'], ['livre', '🙋 Cada aluno escolhe a sua']], 'sortear');
        const rodizio = sel('rodizio', [['0', 'Sem rodízio'], ['3', 'Trocar de função a cada 3 dias'], ['5', 'A cada 5 dias'], ['10', 'A cada 10 dias']], '0');
        const caixas = FUNCOES.map((f) => CE.el('label', { class: 'pc-check ng-func', title: f.faz }, CE.el('input', { type: 'checkbox', value: f.id, 'data-funcao-ativa': f.id, checked: true }), CE.el('span', {}, `${f.icone} ${f.nome}`)));
        const fase = sel('fase', [['', 'Escolher as funções na mão'], ...REF.FASES.map((f) => [String(f.n), f.nome])], '5');
        fase.addEventListener('change', () => { const f = REF.FASES.find((x) => String(x.n) === fase.value); if (f) caixas.forEach((c) => { const i = c.querySelector('input'); i.checked = f.funcoes.includes(i.value); }); });
        const erro = CE.el('p', { class: 'login-erro' });
        return CE.el('div', { class: 'ng-config' },
          CE.el('h2', {}, '🍔 Do Campo ao Balcão'),
          CE.el('p', {}, 'A hamburgueria da turma, com a cadeia inteira: a roça planta o milho, o pasto engorda o boi, o frigorífico faz o hambúrguer, o caminhão leva e a lanchonete vende. O tempo corre sozinho (a seca chega, o capim cresce e acaba, os clientes vêm); a turma toma as decisões e precisa conversar. A função sem aluno, a IA faz.'),
          CE.el('div', { class: 'ng-config-grade' },
            CE.el('label', {}, 'Como jogar', modo), CE.el('label', {}, 'Nível (dá para mudar durante o jogo)', nivel),
            CE.el('label', {}, 'Duração', dias), CE.el('label', {}, 'Quem faz o quê', distribuicao),
            CE.el('label', {}, 'Rodízio', rodizio), CE.el('label', {}, 'Fase (que setores ficam com a turma)', fase)),
          CE.el('strong', {}, 'Funções com a turma (as desmarcadas, a IA faz):'),
          CE.el('div', { class: 'ng-funcs' }, ...caixas),
          erro,
          CE.el('button', { class: 'botao grande', 'data-acao': 'abrir-negocio', onclick: async () => {
            erro.textContent = '';
            const ativas = caixas.map((c) => c.querySelector('input')).filter((i) => i.checked).map((i) => i.value);
            if (!ativas.length) { erro.textContent = 'Marque pelo menos uma função para a turma.'; return; }
            try { estado = await chamar('negocio:criar', { modo: modo.value, nivel: Number(nivel.value), dias: Number(dias.value), distribuicao: distribuicao.value, rodizio: Number(rodizio.value), ativas }); desenhar(true); }
            catch (e) { erro.textContent = e.message; }
          } }, '🍔 Abrir o jogo para a turma'));
      }
      function telaAguardando() {
        return CE.el('div', { class: 'ng-vazio' }, CE.el('div', { class: 'ng-grande' }, '🍔'), CE.el('h2', {}, 'Do Campo ao Balcão'),
          CE.el('p', {}, 'O professor ainda não abriu o jogo. Quando abrir, você entra por aqui (ou pela lanchonete da Praça Escola).'));
      }
      // ---------- Espera ----------
      function telaEsperaInstrutor() {
        const turma = estado.modo === 'turma';
        const linhas = estado.participantes.map((p) => CE.el('div', { class: 'ng-part', 'data-participante': p.id },
          CE.el('span', { class: 'ng-avatar' }, p.avatar), CE.el('strong', {}, p.nome),
          turma ? CE.el('div', { class: 'ng-chips' }, ...estado.ativas.map((f) => CE.el('button', {
            class: 'chip' + (p.funcoes.includes(f) ? ' ativo' : ''), type: 'button', title: porId[f].faz, 'data-atribuir': f,
            onclick: () => { const nova = p.funcoes.includes(f) ? p.funcoes.filter((x) => x !== f) : [...p.funcoes, f]; pedir('negocio:atribuir', { aluno: p.id, funcoes: nova }); },
          }, porId[f].icone))) : CE.el('span', {}, ' — empresa própria')));
        const ocupadas = new Set(estado.participantes.flatMap((p) => p.funcoes));
        const ia = turma ? estado.ativas.filter((f) => !ocupadas.has(f)) : [];
        return CE.el('div', { class: 'ng-espera' },
          CE.el('h2', {}, '🍔 Do Campo ao Balcão: esperando a turma'),
          CE.el('p', {}, `${turma ? 'A turma é uma empresa só.' : 'Cada aluno com a sua empresa.'} Nível ${estado.nivel} (${estado.nomeNivel}), ${estado.dias} dias. Os alunos entram pela lanchonete da Praça Escola ou pelo convite que aparece na tela.`),
          CE.el('div', { class: 'ng-part-lista' }, ...(linhas.length ? linhas : [CE.el('p', { class: 'ft-dica' }, 'Ninguém entrou ainda...')])),
          turma && ia.length ? CE.el('p', { class: 'ft-dica' }, `Sem aluno (a IA faz): ${ia.map(nomeF).join(', ')}`) : null,
          CE.el('div', { class: 'painel-sala-acoes' },
            turma ? CE.el('button', { class: 'botao secundario', 'data-acao': 'sortear', onclick: () => pedir('negocio:sortear') }, '🎲 Sortear as funções') : null,
            !estado.eu ? CE.el('button', { class: 'botao secundario', 'data-acao': 'entrar-tambem', onclick: () => pedir('negocio:entrar') }, '🙋 Entrar também como jogador') : null,
            CE.el('button', { class: 'botao', 'data-acao': 'comecar-negocio', onclick: () => pedir('negocio:comecar') }, '▶ Começar o jogo'),
            CE.el('button', { class: 'botao secundario', 'data-acao': 'cancelar-negocio', onclick: async () => { await chamar('negocio:encerrar').catch(() => {}); await chamar('negocio:fechar').catch(() => {}); atualizar(true); } }, 'Cancelar')));
      }
      function telaEsperaAluno() {
        const minhas = (estado.eu && estado.eu.funcoes) || [];
        return CE.el('div', { class: 'ng-espera' },
          CE.el('h2', {}, '🍔 Do Campo ao Balcão'),
          CE.el('p', {}, estado.modo === 'turma' ? 'A turma é uma empresa só: cada um cuida de um setor e todos precisam conversar.' : 'Você vai cuidar da sua própria hamburgueria, de tudo.'),
          minhas.length && estado.modo === 'turma' ? CE.el('div', { class: 'ng-minhas' }, CE.el('strong', {}, 'Sua função:'), ...minhas.map((f) => CE.el('div', { class: 'ng-minha' }, CE.el('b', {}, nomeF(f)), CE.el('span', {}, porId[f].faz)))) : null,
          estado.distribuicao === 'livre' && estado.modo === 'turma' ? CE.el('div', {}, CE.el('strong', {}, 'Escolha a sua função:'),
            CE.el('div', { class: 'ng-chips' }, ...estado.livres.map((f) => CE.el('button', { class: 'chip', type: 'button', 'data-escolher-funcao': f, title: porId[f].faz, onclick: () => pedir('negocio:escolher', { funcao: f }) }, nomeF(f))))) : null,
          CE.el('p', { class: 'ng-aguarde' }, '⏳ Esperando o professor começar...'));
      }
      // ---------- Fim ----------
      function telaFim() {
        const r = estado.resultado || [];
        const nomeDe = (id) => (estado.participantes.find((p) => p.id === id) || { nome: '?' }).nome;
        return CE.el('div', { class: 'ng-fim' },
          CE.el('h2', {}, '🏁 Fim do jogo!'),
          ...r.map((x) => CE.el('div', { class: 'ng-result' + (x.saudavel ? ' saudavel' : ''), 'data-resultado': x.empresa },
            CE.el('h3', {}, `${x.saudavel ? '🏅 ' : x.falida ? '🏚️ ' : ''}${x.nome}`),
            CE.el('p', {}, x.saudavel ? 'Selo Empresa Saudável: chegou ao fim com os quatro medidores em pé (50 ou mais)!' : x.falida ? 'A empresa faliu.' : 'Faltou equilibrar: o selo exige os quatro medidores com 50 ou mais.'),
            medidores(x.medidores),
            CE.el('p', {}, `${x.lucro >= 0 ? 'Lucro' : 'Prejuízo'}: ${dinheiro(Math.abs(x.lucro))} (contando o caixa, os bois e o estoque) · ${x.clientes} lanches vendidos · ${x.perdidos} clientes foram embora`),
            instrutor && estado.modo === 'turma' ? CE.el('table', { class: 'ng-tabela' }, CE.el('tr', {}, ...['Aluno', 'Função', 'Ações', 'Lanches na mão', 'Pedidos feitos', 'Pedidos atendidos', 'Mensagens'].map((t) => CE.el('th', {}, t))),
              ...x.membros.map((id) => { const s = (estado.instrutor && estado.instrutor.stats[id]) || {}; const p = estado.participantes.find((q) => q.id === id) || { funcoes: [] };
                return CE.el('tr', {}, CE.el('td', {}, nomeDe(id)), CE.el('td', {}, p.funcoes.map((f) => porId[f].icone).join(' ')), ...['acoes', 'lanches', 'pedidos', 'atendidos', 'mensagens'].map((k) => CE.el('td', {}, String(s[k] || 0)))); })) : null)),
          CE.el('p', { class: 'ft-dica' }, 'Converse com a turma: o que deu certo? Onde a cadeia travou? Quem precisava ter avisado quem?'),
          instrutor ? CE.el('button', { class: 'botao', 'data-acao': 'novo-negocio', onclick: async () => { await chamar('negocio:fechar').catch(() => {}); estado = null; desenhar(true); } }, '🍔 Abrir um jogo novo') : null);
      }
      function medidores(m) {
        const item = (id, icone, nome) => CE.el('div', { class: 'ng-med' + (m[id] <= 30 ? ' baixo' : m[id] >= 65 ? ' alto' : ''), 'data-medidor': id, title: `${nome}: ${m[id]} de 100` },
          CE.el('span', {}, `${icone} ${nome}`), CE.el('div', { class: 'ng-barra' }, CE.el('i', { style: `width:${m[id]}%` })), CE.el('b', {}, String(m[id])));
        return CE.el('div', { class: 'ng-meds' }, item('caixa', '💰', 'Caixa'), item('clientes', '😊', 'Clientes'), item('equipe', '👷', 'Equipe'), item('natureza', '🌳', 'Natureza'));
      }

      // ---------- O jogo ----------
      function empresaAtual() {
        if (instrutor && estado.instrutor) {
          const lista = estado.instrutor.empresas;
          if (!empresaVista || !lista.some((e) => e.id === empresaVista)) empresaVista = lista[0] ? lista[0].id : null;
          return lista.find((e) => e.id === empresaVista) || null;
        }
        return estado.empresa;
      }
      const minhasFuncoes = () => (instrutor ? FUNCOES.map((f) => f.id) : (estado.eu && estado.eu.funcoes) || []);
      let topoEl = null;
      function topo(e) {
        const est = estado.estacao === 'seca' ? `☀️ Seca (a chuva volta no dia ${estado.fimSeca})` : estado.dia < estado.inicioSeca ? `🌧️ Chuva (a seca chega no dia ${estado.inicioSeca})` : '🌧️ Chuva';
        topoEl = CE.el('div', { class: 'ng-topo' },
          CE.el('div', { class: 'ng-relogio', 'data-relogio': '' }, CE.el('strong', {}, `📅 Dia ${estado.dia} de ${estado.dias}`), CE.el('span', {}, `🕗 ${String(estado.hora).padStart(2, '0')}:${String(estado.minuto).padStart(2, '0')}`), CE.el('span', { class: 'ng-estacao ' + estado.estacao }, est),
            estado.estado === 'pausado' ? CE.el('span', { class: 'ng-pausa' }, '⏸ Pausado (reunião)') : null),
          e ? medidores(e.medidores) : null,
          e ? CE.el('div', { class: 'ng-caixa' + (e.caixa < 0 ? ' negativo' : ''), 'data-caixa': '' }, `💰 ${dinheiro(e.caixa)}`, e.emprestimo ? CE.el('small', {}, ` (empréstimo ${dinheiro(e.emprestimo)})`) : null) : null);
        return topoEl;
      }
      function atualizarTopo() { const e = empresaAtual(); if (topoEl && e) topoEl.replaceWith(topo(e)); }
      function telaJogo() {
        const e = empresaAtual();
        const funcs = minhasFuncoes();
        const abas = [...funcs.map((f) => ['f:' + f, nomeF(f)]), ['cadeia', '🗺️ Cadeia'], ['pedidos', `📋 Pedidos${e ? ` (${e.pedidos.filter((p) => p.status === 'aberto' || p.status === 'aceito').length})` : ''}`], ['conversa', '💬 Conversa']];
        if (instrutor) abas.push(['turma', '👥 Turma']);
        if (!aba || !abas.some(([id]) => id === aba)) aba = instrutor ? 'cadeia' : abas[0][0];
        const nav = CE.el('nav', { class: 'ng-abas' }, ...abas.map(([id, rotulo]) => CE.el('button', { class: 'ng-aba' + (aba === id ? ' ativa' : ''), type: 'button', 'data-aba-negocio': id, onclick: () => { aba = id; desenhar(true); } }, rotulo)));
        let painel;
        if (!e) painel = CE.el('p', {}, 'Escolha uma empresa.');
        else if (aba.startsWith('f:')) painel = painelFuncao(aba.slice(2), e);
        else if (aba === 'cadeia') painel = CE.el('div', {}, cena('mundo', e) || '', painelCadeia(e));
        else if (aba === 'pedidos') painel = painelPedidos(e);
        else if (aba === 'conversa') painel = painelConversa(e);
        else painel = painelTurma();
        return CE.el('div', { class: 'ng-jogo' },
          instrutor ? controles() : null,
          topo(e),
          e && e.meta ? CE.el('div', { class: 'ng-meta' }, `🎯 Meta do dia (Diretoria): ${e.meta}`) : null,
          CE.el('div', { class: 'ng-corpo' }, nav, CE.el('main', { class: 'ng-painel', 'data-painel': aba }, painel), lado(e)));
      }
      // Professor: relógio, termômetro, eventos, encerrar
      function controles() {
        const i = estado.instrutor || {};
        const termo = CE.el('input', { type: 'range', min: '1', max: '10', value: String(estado.nivel), 'data-campo': 'termometro', title: 'Termômetro: 1 é o mais fácil, 10 o mais difícil' });
        termo.addEventListener('change', () => pedir('negocio:nivel', Number(termo.value)));
        const evento = CE.el('select', { class: 'campo', 'data-campo': 'evento' }, CE.el('option', { value: '' }, '🎲 Disparar um evento...'),
          ...Object.entries(REF.EVENTOS).map(([id, ev]) => CE.el('option', { value: id }, ev.titulo)),
          CE.el('option', { value: 'desmatar' }, '🌳 Dilema: derrubar a mata'), CE.el('option', { value: 'racao_barata' }, '🌽 Dilema: ração barata'), CE.el('option', { value: 'hora_extra' }, '⏰ Dilema: hora extra'));
        evento.addEventListener('change', () => { if (evento.value) pedir('negocio:evento', { tipo: evento.value, empresa: estado.modo === 'cada' ? empresaVista : undefined }); });
        const votos = i.votos || {};
        const empresas = estado.modo === 'cada' && i.empresas ? CE.el('select', { class: 'campo', 'data-campo': 'empresa', onchange: (ev) => { empresaVista = ev.target.value; desenhar(true); } },
          ...i.empresas.map((x) => CE.el('option', { value: x.id, selected: x.id === empresaVista }, `${x.nome} (${x.medidores.caixa}/${x.medidores.clientes}/${x.medidores.equipe}/${x.medidores.natureza})`))) : null;
        return CE.el('div', { class: 'ng-controles' },
          estado.estado === 'pausado' ? CE.el('button', { class: 'botao', 'data-acao': 'continuar', onclick: () => pedir('negocio:pausar', false) }, '▶ Continuar')
            : CE.el('button', { class: 'botao secundario', 'data-acao': 'pausar', onclick: () => pedir('negocio:pausar', true) }, '⏸ Pausar (reunião)'),
          CE.el('button', { class: 'botao secundario', 'data-acao': 'pular-dia', title: 'Pula até as 8h do dia seguinte', onclick: () => pedir('negocio:pular', { horas: 'amanha' }) }, '⏩ Pular para amanhã'),
          CE.el('button', { class: 'botao secundario' + (estado.acelerar ? ' ativo' : ''), 'data-acao': 'acelerar', onclick: () => pedir('negocio:acelerar', !estado.acelerar) }, estado.acelerar ? '🐢 Velocidade normal' : '🐇 2x mais rápido'),
          CE.el('label', { class: 'ng-termo' }, `🌡️ Nível ${estado.nivel} (${estado.nomeNivel})`, termo),
          i.sugestao ? CE.el('span', { class: 'ng-sugestao', 'data-sugestao': i.sugestao }, i.sugestao === 'subir' ? '💡 Tudo verde há 2 dias: subir o nível?' : '💡 A empresa está sofrendo: baixar o nível?') : null,
          Object.keys(votos).length ? CE.el('span', { class: 'ng-votos', 'data-votos': '' }, `🗳️ 😴 ${votos.facil || 0} · 👍 ${votos.bom || 0} · 🥵 ${votos.dificil || 0}`) : null,
          empresas, evento,
          CE.el('button', { class: 'botao secundario', 'data-acao': 'encerrar-negocio', onclick: async () => { if (await CE.confirmar('Encerrar o jogo agora e mostrar o resultado?')) pedir('negocio:encerrar'); } }, '⏹ Encerrar'));
      }
      // A coluna do Professor Virtual: decisões, eventos e avisos
      function lado(e) {
        if (!e) return CE.el('aside', { class: 'ng-lado' });
        const funcs = minhasFuncoes();
        const dilemas = e.dilemas.filter((d) => instrutor || funcs.includes(d.para) || funcs.includes('diretor'));
        const voto = estado.eu && estado.eu.voto;
        return CE.el('aside', { class: 'ng-lado' },
          ...dilemas.map((d) => CE.el('div', { class: 'ng-dilema', 'data-dilema': d.id },
            CE.el('strong', {}, d.titulo), CE.el('p', {}, d.texto), CE.el('small', {}, `Decisão de: ${nomeF(d.para)}`),
            CE.el('div', { class: 'ng-opcoes' }, ...d.opcoes.map((o) => CE.el('button', { class: 'botao secundario', type: 'button', 'data-escolha': o.id,
              onclick: () => acao(funcs.includes(d.para) ? d.para : funcs.includes('diretor') ? 'diretor' : d.para, 'dilema', { id: d.id, escolha: o.id }).catch(() => {}) }, o.rotulo))))),
          e.eventos.length ? CE.el('div', { class: 'ng-eventos' }, ...e.eventos.map((v) => CE.el('span', { class: 'ng-evento', title: v.texto }, v.titulo))) : null,
          CE.el('div', { class: 'ng-prof' }, CE.el('strong', {}, '👨‍🏫 Professor Virtual'),
            CE.el('ul', { class: 'ng-avisos' }, ...e.avisos.slice().reverse().slice(0, 14).map((a) => CE.el('li', { class: 'ng-aviso ' + a.nivel },
              CE.el('small', {}, horaTexto(a.em) + (a.para ? ` · ${porId[a.para] ? porId[a.para].icone : ''}` : '')), CE.el('span', {}, a.texto))))),
          !instrutor ? CE.el('div', { class: 'ng-voto' }, CE.el('small', {}, 'O jogo está:'),
            ...[['facil', '😴 Fácil'], ['bom', '👍 Bom'], ['dificil', '🥵 Difícil']].map(([v, t]) => CE.el('button', { class: 'chip' + (voto === v ? ' ativo' : ''), type: 'button', 'data-voto': v, onclick: () => pedir('negocio:votar', v) }, t))) : null);
      }

      // ---------- Os painéis de cada função ----------
      const botao = (rotulo, onclick, extra = {}) => CE.el('button', { class: 'botao secundario', type: 'button', onclick, ...extra }, rotulo);
      const barra = (v, max = 100, cls = '') => CE.el('div', { class: 'ng-barra ' + cls }, CE.el('i', { style: `width:${Math.max(0, Math.min(100, (v / max) * 100))}%` }));
      const linha = (...f) => CE.el('div', { class: 'ng-linha' }, ...f);
      const cartao = (titulo, ...f) => CE.el('div', { class: 'ng-cartao' }, CE.el('h4', {}, titulo), ...f);
      const nao = (t) => CE.el('p', { class: 'ft-dica' }, t);
      function cabecalho(f) { return CE.el('div', { class: 'ng-cab' }, CE.el('h3', {}, nomeF(f)), CE.el('p', {}, porId[f].faz)); }
      // Cada função: a cena animada (clique nas coisas) e, embaixo, os detalhes em texto (recolhidos).
      // O caixa e o chapeiro têm o seu trabalho embaixo da cena, sempre à mostra.
      function painelFuncao(f, e) {
        const P = PAINEIS[f];
        const tipo = CE.negocioCenas && CE.negocioCenas.CENA_DA_FUNCAO[f];
        const el = tipo ? cena(tipo, e) : null;
        const corpoP = P ? P(e, f) : nao('...');
        if (!el) return CE.el('div', { class: 'ng-funcao', 'data-funcao': f }, cabecalho(f), corpoP);
        const sempre = f === 'caixa' || f === 'chapeiro';
        const det = CE.el('details', { class: 'ng-detalhes', open: detalhesAbertos }, CE.el('summary', {}, '📋 Mais detalhes e botões'), corpoP);
        det.addEventListener('toggle', () => { detalhesAbertos = det.open; });
        return CE.el('div', { class: 'ng-funcao', 'data-funcao': f },
          CE.el('div', { class: 'ng-cab ng-cab-curto' }, CE.el('h3', {}, nomeF(f)), CE.el('p', {}, `${porId[f].faz} Clique nas coisas da cena!`)),
          el, sempre ? corpoP : det);
      }
      const num = (campo, valor, min, max, passo = 1) => CE.el('input', { class: 'campo ng-num', type: 'number', 'data-campo': campo, value: String(valor), min: String(min), max: String(max), step: String(passo) });
      const PAINEIS = {
        agricultor(e) {
          if (!e.roca) return nao('Sem acesso à roça.');
          const seca = estado.estacao === 'seca';
          return CE.el('div', {},
            CE.el('div', { class: 'ng-grade4' }, ...e.roca.talhoes.map((t, i) => CE.el('div', { class: 'ng-talhao ' + t.estado + (t.foco ? ' fogo' : ''), 'data-talhao': i },
              CE.el('strong', {}, `Talhão ${i + 1}`),
              CE.el('div', { class: 'ng-icone' }, t.foco ? '🔥' : t.estado === 'vazio' ? '🟫' : t.estado === 'pronto' ? '🌽' : '🌱'),
              CE.el('span', {}, t.foco ? 'Pegando fogo!' : t.estado === 'vazio' ? 'Vazio' : t.estado === 'pronto' ? (t.passou ? 'Passou do ponto!' : 'Pronto para colher') : `Crescendo ${t.cresc}%`),
              t.estado === 'crescendo' ? barra(t.cresc) : null,
              t.estado === 'vazio' ? botao('🌱 Plantar (R$ 600)', () => acao('agricultor', 'plantar', { talhao: i }).catch(() => {}), { 'data-plantar': i }) : null,
              t.estado === 'pronto' ? botao('🚜 Colher', () => acao('agricultor', 'colher', { talhao: i }).catch(() => {}), { 'data-colher': i }) : null))),
            cartao('🌽 Silagem guardada', CE.el('p', { class: 'ng-num-grande' }, `${e.roca.silagem} t`), nao('A silagem é o milho picado e guardado: o gado come no cocho quando o capim acaba na seca.')),
            cartao('💧 Irrigação', CE.el('p', {}, e.roca.irrigacao ? 'Ligada (R$ 8 por hora)' : 'Desligada'), botao(e.roca.irrigacao ? 'Desligar' : 'Ligar a irrigação', () => acao('agricultor', 'irrigar', { ligar: !e.roca.irrigacao }).catch(() => {}), { 'data-acao': 'irrigar' }),
              nao(seca ? 'Na seca, sem irrigação o milho cresce bem devagar.' : 'Na chuva não precisa irrigar.')));
        },
        pecuarista(e) {
          if (!e.pasto) return nao('Sem acesso ao pasto.');
          const qtd = num('bezerros', 3, 1, 10);
          return CE.el('div', {},
            e.pasto.embargo ? CE.el('p', { class: 'ng-alerta' }, '⛔ Pasto embargado pelo IBAMA: não pode comprar gado agora.') : null,
            CE.el('div', { class: 'ng-grade4' }, ...e.pasto.piquetes.map((p, i) => CE.el('div', { class: 'ng-piquete' + (i === e.pasto.ativo ? ' ativo' : '') + (p.foco ? ' fogo' : ''), 'data-piquete': i },
              CE.el('strong', {}, `Piquete ${i + 1}${p.novo ? ' (novo)' : ''}`), CE.el('div', { class: 'ng-icone' }, p.foco ? '🔥' : i === e.pasto.ativo ? '🐄' : '🌿'),
              CE.el('span', {}, `Capim: ${p.capim}%`), barra(p.capim, 100, p.capim < 20 ? 'ruim' : ''),
              CE.el('span', {}, `Solo: ${p.solo}%${p.degradado ? ' (cansado!)' : ''}`), barra(p.solo, 100, p.solo < 40 ? 'ruim' : ''),
              p.reforma ? CE.el('small', {}, `🔧 Em reforma até ${horaTexto(p.reforma)}`)
                : i === e.pasto.ativo ? CE.el('small', {}, 'O rebanho está aqui') : botao('Levar o rebanho', () => acao('pecuarista', 'piquete', { i }).catch(() => {}), { 'data-levar-piquete': i }),
              !p.reforma && i !== e.pasto.ativo && p.solo < 85 ? botao('🔧 Reformar (R$ 2.500)', () => acao('pecuarista', 'reformar', { i }).catch(() => {}), { 'data-reformar': i }) : null))),
            linha(cartao('🐂 Rebanho', CE.el('p', {}, `${e.pasto.bois} bois · peso médio ${e.pasto.pesoMedio} arrobas`), CE.el('p', {}, `✅ ${e.pasto.prontos} pronto(s) (18 arrobas) · 🤒 ${e.pasto.doentes} doente(s)`),
              CE.el('div', { class: 'ng-form' }, qtd, botao('Comprar bezerros (R$ 2.200 cada)', () => acao('pecuarista', 'comprar', { qtd: Number(qtd.value) }).catch(() => {}), { 'data-acao': 'comprar-bezerros' }))),
              cartao('🥣 Cocho com silagem', CE.el('p', {}, e.pasto.cocho ? 'Ligado: o gado come silagem quando o capim acaba' : 'Desligado'), e.roca ? CE.el('p', {}, `Silagem na roça: ${e.roca.silagem} t`) : null,
                botao(e.pasto.cocho ? 'Desligar o cocho' : 'Ligar o cocho', () => acao('pecuarista', 'cocho', { ligar: !e.pasto.cocho }).catch(() => {}), { 'data-acao': 'cocho' }),
                botao('🌽 Comprar ração de fora', () => acao('pecuarista', 'racao').catch(() => {}), { 'data-acao': 'racao' }))),
            nao('Rodízio: deixe o rebanho num piquete e troque quando o capim baixar; o outro descansa e cresce de novo (na seca, quase não cresce). Pasto pelado e pisoteado cansa o solo; a reforma (adubo e semente) devolve a força. Clique num boi na cena para ver o nome e separar para o frigorífico.'));
        },
        veterinario(e) {
          if (!e.pasto) return nao('Sem acesso ao pasto.');
          return CE.el('div', {},
            CE.el('div', { class: 'ng-rebanho' }, ...e.pasto.rebanho.map((b) => CE.el('span', { class: 'ng-boi' + (b.doente ? ' doente' : '') + (b.peso >= 18 ? ' pronto' : ''), title: `${b.nome}: ${b.peso} arrobas${b.vacinado ? ', vacinado' : ', sem vacina'}${b.doente ? ', doente' : ''}${b.separado ? ', separado' : ''}` }, b.doente ? '🤒' : b.peso >= 18 ? '🐂' : '🐄', CE.el('small', {}, `${b.nome} ${b.peso}@${b.vacinado ? '💉' : ''}${b.separado ? '🏷️' : ''}`)))),
            linha(cartao('💉 Vacina', CE.el('p', {}, `${e.pasto.semVacina} sem vacina`), botao('Vacinar todos (R$ 40 cada)', () => acao('veterinario', 'vacinar').catch(() => {}), { 'data-acao': 'vacinar' })),
              cartao('🩺 Tratamento', CE.el('p', {}, `${e.pasto.doentes} doente(s)`), botao('Tratar os doentes (R$ 150 cada)', () => acao('veterinario', 'tratar').catch(() => {}), { 'data-acao': 'tratar' })),
              cartao('📄 Guia de transporte (GTA)', CE.el('p', {}, `${e.pasto.prontos} pronto(s) · ${e.pasto.gta} com guia`), botao('Fazer a guia dos prontos (R$ 20 cada)', () => acao('veterinario', 'gta').catch(() => {}), { 'data-acao': 'gta' }))),
            nao('Sem a guia (GTA), o boi não pode viajar. Boi doente sem tratamento morre em 2 dias; o vacinado quase não adoece.'));
        },
        logistica(e) {
          if (!e.caminhao) return nao('Sem acesso ao caminhão.');
          const v = e.caminhao.viagem;
          const qtdB = num('bois-viagem', Math.max(1, Math.min(6, (e.pasto && e.pasto.gta) || 1)), 1, 6);
          const qtdH = num('hamburgueres-viagem', Math.min(1500, (e.frig && e.frig.estoque) || 500), 1, 1500, 50);
          return CE.el('div', {},
            cartao('🚚 O caminhão', v ? CE.el('p', { class: 'ng-viagem' }, `Em viagem: ${v.nome}, levando ${v.carga}. Chega no ${horaTexto(v.chega)}.`) : CE.el('p', {}, 'Parado, esperando viagem.'),
              CE.el('p', {}, `⛽ Combustível: ${e.caminhao.combustivel}%`), barra(e.caminhao.combustivel, 100, e.caminhao.combustivel < 30 ? 'ruim' : ''),
              botao('⛽ Abastecer', () => acao('logistica', 'abastecer').catch(() => {}), { 'data-acao': 'abastecer' }),
              e.caminhao.br364 ? CE.el('p', { class: 'ng-alerta' }, '🚧 BR-364 fechada hoje!') : null),
            linha(cartao('🐂 Pasto → Frigorífico (6 horas)', e.pasto ? CE.el('p', {}, `${e.pasto.gta} boi(s) pronto(s) com guia no pasto`) : null,
              CE.el('div', { class: 'ng-form' }, qtdB, botao('Levar bois', () => acao('logistica', 'viajar', { rota: 'pasto_frig', qtd: Number(qtdB.value) }).catch(() => {}), { 'data-acao': 'viagem-bois', disabled: !!v }))),
              cartao('🍔 Frigorífico → Lanchonete (2 horas)', e.frig ? CE.el('p', {}, `${e.frig.estoque} hambúrgueres na câmara fria`) : null, e.loja ? CE.el('p', {}, `${e.loja.estoque} na lanchonete`) : null,
                CE.el('div', { class: 'ng-form' }, qtdH, botao('Levar hambúrgueres', () => acao('logistica', 'viajar', { rota: 'frig_loja', qtd: Number(qtdH.value) }).catch(() => {}), { 'data-acao': 'viagem-hamb', disabled: !!v })))),
            nao('Um caminhão só: planeje! A lanchonete vende uns 250 hambúrgueres por dia, mais no fim de semana.'));
        },
        frigorifico(e) {
          if (!e.frig) return nao('Sem acesso ao frigorífico.');
          const prod = num('producao', e.frig.producao, 0, 1200, 50);
          return CE.el('div', {},
            linha(cartao('🐂 Bois que chegaram', CE.el('p', { class: 'ng-num-grande' }, String(e.frig.bois)), botao('Processar (R$ 150 por boi)', () => acao('frigorifico', 'abater', { qtd: e.frig.bois }).catch(() => {}), { 'data-acao': 'processar', disabled: !e.frig.bois }), nao('Cada boi dá uns 600 hambúrgueres.')),
              cartao('🥩 Carne para moer', CE.el('p', { class: 'ng-num-grande' }, `${e.frig.carne}`), nao('porções de hambúrguer')),
              cartao('⚙️ Produção por dia', CE.el('div', { class: 'ng-form' }, prod, botao('Salvar', () => acao('frigorifico', 'producao', { qtd: Number(prod.value) }).catch(() => {}), { 'data-acao': 'producao' })), nao('Produziu demais? Vence na câmara.'))),
            cartao(`❄️ Câmara fria (${e.frig.estoque} hambúrgueres)`, CE.el('div', { class: 'ng-lotes' }, ...e.frig.lotes.map((l) => CE.el('span', { class: 'ng-lote' + (l.vencido ? ' vencido' : '') }, `${l.qtd} · vence dia ${l.vence > 90 ? '—' : l.vence}${l.vencido ? ' (VENCIDO)' : ''}`))),
              botao('🗑️ Jogar fora os vencidos', () => acao('frigorifico', 'descartar').catch(() => {}), { 'data-acao': 'descartar' })),
            cartao('🧼 Higiene', CE.el('p', {}, e.frig.higiene ? 'Limpeza diária ligada (R$ 4 por hora)' : 'SEM limpeza: a fiscalização reprova!'), botao(e.frig.higiene ? 'Desligar a limpeza' : 'Ligar a limpeza', () => acao('frigorifico', 'higiene', { ligar: !e.frig.higiene }).catch(() => {}), { 'data-acao': 'higiene' })));
        },
        compras(e) {
          if (!e.loja) return nao('Sem acesso.');
          const qtd = CE.el('select', { class: 'campo', 'data-campo': 'compra' }, ...[300, 600, 1000, 2000].map((n) => CE.el('option', { value: String(n) }, `${n} de cada (R$ ${(n * 3).toLocaleString('pt-BR')})`)));
          qtd.value = '600';
          const contas = (e.escritorio && e.escritorio.contas) || [];
          return CE.el('div', {},
            cartao('🍞 Na lanchonete', CE.el('p', {}, `🍞 ${e.loja.pao} pães · 🧀 ${e.loja.queijo} queijos · 📦 ${e.loja.embalagem} embalagens`), nao('Cada lanche usa 1 de cada. O fornecedor entrega em 14 horas.'),
              CE.el('div', { class: 'ng-form' }, qtd, botao('Comprar', () => acao('compras', 'comprar', { qtd: Number(qtd.value) }).catch(() => {}), { 'data-acao': 'comprar-insumos' })),
              e.escritorio && e.escritorio.compras.length ? CE.el('p', {}, `🚛 A caminho: ${e.escritorio.compras.map((c) => `${c.qtd} (chega ${horaTexto(c.chega)})`).join(', ')}`) : null),
            cartao('🧾 Boletos para conferir', contas.length ? CE.el('ul', { class: 'ng-contas' }, ...contas.map((c) => CE.el('li', { 'data-conta': c.id }, CE.el('span', {}, `${c.nome}: ${dinheiro(c.valor)} (vence dia ${c.vence})${c.suspeita && estado.nivel <= 3 ? ' ⚠️' : ''}`),
              botao('🛡️ Recusar (é golpe)', () => acao('compras', 'recusar', { id: c.id }).catch(() => {}), { 'data-recusar': c.id })))) : nao('Nenhum boleto agora.'),
              nao('Boleto de fornecedor com CNPJ diferente, banco estranho ou urgência demais? Pode ser golpe: confira com o fornecedor antes de o Financeiro pagar.')));
        },
        chapeiro(e) {
          if (!e.loja) return nao('Sem acesso.');
          const receitas = REF.RECEITAS;
          if (!mini.receita) { mini.receita = receitas[Math.floor(Math.random() * receitas.length)]; mini.montado = []; }
          const ings = ['Pão', 'Carne', 'Queijo', 'Alface', 'Tomate', 'Bacon'];
          const certo = mini.montado.every((x, i) => x === mini.receita[i]);
          return CE.el('div', {},
            lojaStatus(e),
            cartao('🔥 Monte o lanche (clique na ordem)', CE.el('p', { class: 'ng-receita' }, mini.receita.join(' → ')),
              CE.el('p', { class: 'ng-montado' + (certo ? '' : ' errado') }, mini.montado.length ? mini.montado.join(' → ') : '(a chapa está vazia)'),
              CE.el('div', { class: 'ng-ings' }, ...ings.map((ing) => CE.el('button', { class: 'chip', type: 'button', 'data-ingrediente': ing, onclick: () => {
                mini.montado.push(ing);
                if (!mini.montado.every((x, i) => x === mini.receita[i])) { mini.montado = []; CE.avisar('Ordem errada! Comece de novo.'); desenhar(true); return; }
                if (mini.montado.length === mini.receita.length) { mini.receita = null; acao('chapeiro', 'lanche').then(() => CE.avisar('🍔 Lanche pronto: um cliente atendido!')).catch(() => {}); return; }
                desenhar(true);
              } }, ing)))),
            nao('Cada lanche montado atende um cliente da fila na hora (sem esperar os atendentes).'));
        },
        caixa(e) {
          if (!e.loja) return nao('Sem acesso.');
          if (!mini.pedido) mini.pedido = REF.CARDAPIO[Math.floor(Math.random() * REF.CARDAPIO.length)];
          const campo = CE.el('input', { class: 'campo', 'data-campo': 'pedido-caixa', placeholder: 'Digite o pedido aqui e aperte Enter', autocomplete: 'off' });
          const enviar = () => {
            if (semAcento(campo.value) !== semAcento(mini.pedido)) { CE.avisar('Pedido digitado errado. Confira as letras!'); campo.select(); return; }
            mini.pedido = null; campo.value = '';
            acao('caixa', 'atender').then(() => { const c = corpo.querySelector('[data-campo="pedido-caixa"]'); if (c) c.focus(); }).catch(() => {});
          };
          campo.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); enviar(); } });
          return CE.el('div', {},
            lojaStatus(e),
            cartao('🧾 Próximo cliente', CE.el('p', { class: 'ng-pedido' }, `"Eu quero um ${mini.pedido}, por favor!"`), CE.el('div', { class: 'ng-form' }, campo, botao('Registrar ✔', enviar, { 'data-acao': 'registrar-pedido' }))),
            nao('Cada pedido digitado certo atende um cliente da fila na hora. Atenção às letras!'));
        },
        gerente(e) {
          if (!e.loja) return nao('Sem acesso.');
          const preco = num('preco', e.loja.preco, 8, 40, 0.5);
          return CE.el('div', {},
            lojaStatus(e),
            linha(cartao('💲 Preço do lanche', CE.el('div', { class: 'ng-form' }, preco, botao('Mudar o preço', () => acao('gerente', 'preco', { valor: Number(preco.value) }).catch(() => {}), { 'data-acao': 'preco' })),
              nao('Mais caro: cada lanche dá mais lucro, mas vêm menos clientes. Acima de R$ 24 a fama cai.')),
              cartao('🚪 Loja', CE.el('p', {}, e.loja.fechada ? '⛔ Fechada (falta de luz, fiscalização ou greve)' : e.loja.aberta ? 'Aberta (10h às 22h)' : 'Fechada por você'),
                botao(e.loja.aberta ? 'Fechar a loja' : 'Abrir a loja', () => acao('gerente', 'abrir', { aberta: !e.loja.aberta }).catch(() => {}), { 'data-acao': 'abrir-loja' }),
                botao(e.loja.promocao ? 'Tirar a promoção' : '🏷️ Promoção (15% mais barato)', () => acao('gerente', 'promocao', { ligar: !e.loja.promocao }).catch(() => {}), { 'data-acao': 'promocao' }))),
            cartao('👷 Quem fica onde', listaEquipe(e, 'gerente'), nao('O caixa registra e a chapa faz o lanche: o mais lento manda (é o gargalo). Equilibre os dois; quem sobrar cuida do salão (a fila aguenta mais e a fama sobe).')));
        },
        marketing(e) {
          const esc = e.escritorio || {};
          return CE.el('div', {},
            painelVozes(e, 'marketing'),
            cartao('📣 Propaganda', esc.marketing ? CE.el('p', {}, `No ar: ${esc.marketing.tipo === 'honesta' ? 'propaganda honesta' : '"100% natural!" (enganosa)'} até ${horaTexto(esc.marketing.ate)}`) : CE.el('p', {}, 'Nenhuma propaganda no ar.'),
              botao('✅ Honesta: "Hambúrguer fresquinho da nossa fazenda" (R$ 1.200, 3 dias, +25% clientes)', () => acao('marketing', 'campanha', { tipo: 'honesta' }).catch(() => {}), { 'data-acao': 'campanha-honesta' }),
              botao('⚠️ Enganosa: "100% natural, sem nada químico!" (R$ 600, 3 dias, +40% clientes)', () => acao('marketing', 'campanha', { tipo: 'enganosa' }).catch(() => {}), { 'data-acao': 'campanha-enganosa' }),
              nao('Propaganda enganosa é contra o Código de Defesa do Consumidor: o PROCON pode multar.')),
            cartao('⭐ Avaliações dos clientes', (esc.avaliacoes || []).length ? CE.el('ul', { class: 'ng-contas' }, ...esc.avaliacoes.map((a) => CE.el('li', { 'data-avaliacao': a.id }, CE.el('span', {}, `${'⭐'.repeat(a.estrelas)} "${a.texto}" (responder até ${horaTexto(a.prazo)})`),
              botao('🙂 Responder com educação e oferecer outro lanche', () => acao('marketing', 'responder', { id: a.id, resposta: 'educada' }).catch(() => {}), { 'data-responder': 'educada' }),
              botao('😠 Responder brigando', () => acao('marketing', 'responder', { id: a.id, resposta: 'grossa' }).catch(() => {}), { 'data-responder': 'grossa' })))) : nao('Nenhuma avaliação esperando resposta.')));
        },
        rh(e) {
          if (!e.loja) return nao('Sem acesso.');
          return CE.el('div', {},
            lojaStatus(e),
            cartao('👷 A equipe', listaEquipe(e, 'rh')),
            linha(cartao('👷 Atendentes', CE.el('p', { class: 'ng-num-grande' }, String(e.loja.atendentes)), CE.el('p', {}, `Treinamento: ${'⭐'.repeat(e.loja.treino) || 'nenhum'}`),
              botao('➕ Contratar (R$ 400)', () => acao('rh', 'contratar').catch(() => {}), { 'data-acao': 'contratar' }), botao('➖ Demitir (R$ 800 de rescisão)', () => acao('rh', 'demitir').catch(() => {}), { 'data-acao': 'demitir' }),
              nao(`Hoje a lanchonete atende uns ${e.loja.capacidade} clientes por hora. Quem está desanimado trabalha mais devagar e, muito triste, pede demissão: elogie! O salário entra na conta da semana.`)),
              cartao('💪 Ânimo da equipe', barra(e.medidores.equipe, 100, e.medidores.equipe < 30 ? 'ruim' : ''), CE.el('p', {}, `${e.medidores.equipe} de 100`),
                botao('🎓 Treinar a equipe (R$ 700)', () => acao('rh', 'treinar').catch(() => {}), { 'data-acao': 'treinar' }),
                botao('⏰ Hora extra paga agora (2 horas, R$ 300)', () => acao('rh', 'horaExtra').catch(() => {}), { 'data-acao': 'hora-extra' }),
                botao('🏖️ Dar uma folga (R$ 500)', () => acao('rh', 'folga').catch(() => {}), { 'data-acao': 'folga' }),
                nao('Abaixo de 10, a equipe entra em greve.'))));
        },
        qualidade(e) {
          const esc = e.escritorio || {};
          return CE.el('div', {},
            cartao('🔥 Focos de queimada', e.queimadas.length ? CE.el('ul', { class: 'ng-contas' }, ...e.queimadas.map((q) => CE.el('li', { 'data-queimada': q.id }, CE.el('span', {}, `${q.onde === 'piquete' ? `Piquete ${q.i + 1} do pasto` : `Talhão ${q.i + 1} da roça`}: apagar até ${horaTexto(q.ate)}`),
              botao('🚒 Apagar o foco (R$ 300)', () => acao('qualidade', 'combater', { id: q.id }).catch(() => {}), { 'data-apagar': q.id })))) : nao('Nenhum foco agora. Na seca, fique de olho!')),
            linha(cartao('📄 Alvará de funcionamento', CE.el('p', {}, esc.alvara ? `Vale até o dia ${esc.alvara}` : 'Vale até o dia 8'), botao('Renovar pelo gov.br (R$ 800)', () => acao('qualidade', 'alvara').catch(() => {}), { 'data-acao': 'alvara' })),
              cartao('🌳 Natureza', barra(e.medidores.natureza, 100, e.medidores.natureza < 40 ? 'ruim' : ''), CE.el('p', {}, `${e.medidores.natureza} de 100`),
                botao('🪓 O pasto está fraco: abrir pasto novo?', () => acao('qualidade', 'desmatar').catch(() => {}), { 'data-acao': 'desmatar' }))),
            nao('A fiscalização confere a higiene do frigorífico, se há produto vencido e o alvará. Na Amazônia, a lei manda guardar a reserva legal de mata.'));
        },
        financeiro(e) {
          const esc = e.escritorio || {};
          const dias = e.dias.slice(-10);
          const max = Math.max(1, ...dias.map((d) => Math.abs(d.lucro)));
          return CE.el('div', {},
            linha(cartao('💰 Caixa', CE.el('p', { class: 'ng-num-grande' + (e.caixa < 0 ? ' negativo' : '') }, dinheiro(e.caixa)), e.emprestimo ? CE.el('p', {}, `Empréstimo: ${dinheiro(e.emprestimo)} (juros de 1% ao dia)`) : null,
              botao('🏦 Pegar R$ 10.000 emprestado', () => acao('financeiro', 'emprestimo', { valor: 10000 }).catch(() => {}), { 'data-acao': 'emprestimo' }),
              e.emprestimo ? botao('Pagar o empréstimo', () => acao('financeiro', 'quitar', { valor: e.emprestimo }).catch(() => {}), { 'data-acao': 'quitar' }) : null),
              cartao('📊 Lucro dos últimos dias', CE.el('div', { class: 'ng-grafico' }, ...dias.map((d) => CE.el('div', { class: 'ng-col' + (d.lucro < 0 ? ' neg' : ''), title: `Dia ${d.dia}: ${dinheiro(d.lucro)}` }, CE.el('i', { style: `height:${Math.round((Math.abs(d.lucro) / max) * 100)}%` }), CE.el('small', {}, String(d.dia))))), dias.length ? null : nao('Aparece no fim do primeiro dia.'))),
            cartao('🧾 Contas a pagar', (esc.contas || []).length ? CE.el('ul', { class: 'ng-contas' }, ...esc.contas.map((c) => CE.el('li', { 'data-conta': c.id, class: c.vence < estado.dia ? 'atrasada' : '' }, CE.el('span', {}, `${c.nome}: ${dinheiro(c.valor)} · vence dia ${c.vence}${c.vence < estado.dia ? ' (ATRASADA: multa de 10%)' : ''}`),
              botao('Pagar', () => acao('financeiro', 'pagar', { id: c.id }).catch(() => {}), { 'data-pagar': c.id })))) : nao('Nenhuma conta para pagar agora.'),
              nao('Salário atrasado desanima a equipe; luz atrasada é cortada. Confira o boleto com Compras antes de pagar!')));
        },
        diretor(e) {
          const meta = CE.el('input', { class: 'campo', 'data-campo': 'meta', placeholder: 'Ex.: nenhum cliente sem lanche no almoço!', value: e.meta || '' });
          return CE.el('div', {},
            cartao('🎯 Meta do dia (todos veem)', CE.el('div', { class: 'ng-form' }, meta, botao('Publicar', () => acao('diretor', 'meta', { texto: meta.value }).catch(() => {}), { 'data-acao': 'meta' }))),
            painelVozes(e, 'diretor'),
            painelCadeia(e),
            nao('As decisões difíceis de todos os setores aparecem para você também, na coluna do Professor Virtual.'));
        },
      };
      const NOME_POSTO = { caixa: '🧾 Caixa', chapa: '🔥 Chapa', salao: '🧹 Salão' };
      const carinha = (a) => (a >= 70 ? '😀' : a >= 45 ? '🙂' : a >= 25 ? '😐' : '😞');
      function listaEquipe(e, f) {
        return CE.el('ul', { class: 'ng-contas' }, ...(e.loja.equipe || []).map((w) => CE.el('li', { 'data-atendente': w.id },
          CE.el('span', {}, `${w.icone} ${w.nome} · ${NOME_POSTO[w.posto]} · ânimo ${w.animo} ${carinha(w.animo)}${w.elogiado ? ' 🏅' : ''}`),
          ...(f === 'gerente' ? Object.keys(NOME_POSTO).filter((p) => p !== w.posto).map((p) => botao(`→ ${NOME_POSTO[p]}`, () => acao('gerente', 'posto', { id: w.id, posto: p }).catch(() => {}), { 'data-posto': p })) : []),
          ...(f === 'rh' ? [botao('🏅 Elogiar (R$ 150)', () => acao('rh', 'elogiar', { id: w.id }).catch(() => {}), { 'data-elogiar': w.id, disabled: !!w.elogiado }), botao('📤 Demitir', () => acao('rh', 'demitir', { id: w.id }).catch(() => {}), { 'data-demitir': w.id })] : []))),
          e.loja.gargalo ? CE.el('li', { class: 'atrasada' }, CE.el('span', {}, e.loja.gargalo === 'chapa' ? '⚠️ A chapa não dá conta (gargalo)' : '⚠️ O caixa não dá conta (gargalo)')) : null);
      }
      const GRUPOS_TXT = REF.GRUPOS || {};
      function painelVozes(e, f) {
        const v = e.vozes || {};
        return cartao('📣 Vozes da cidade', CE.el('ul', { class: 'ng-contas' }, ...Object.entries(GRUPOS_TXT).map(([k, G]) => {
          const prot = (e.protestos || []).find((p) => p.grupo === k);
          return CE.el('li', { 'data-voz': k, class: prot ? 'atrasada' : '' }, CE.el('span', {}, `${G.icone} ${G.nome}: ${v[k] || 0} de 100${prot ? (prot.tipo === 'boicote' ? ' · 🚫 BOICOTE' : ' · ✊ PROTESTANDO') : ''}`),
            barra(v[k] || 0, 100, (v[k] || 0) >= 50 ? 'ruim' : ''),
            (v[k] || 0) >= 30 || prot ? botao('🤝 Conversar (R$ 500)', () => acao(f, 'dialogar', { grupo: k }).catch(() => {}), { 'data-dialogar': k }) : null);
        })), nao('Cada grupo se importa com uma coisa (natureza, comida segura, trabalhadores, vizinhança). Em 80 eles protestam na porta e vêm menos clientes; conversar acalma, mas só resolver o motivo faz parar de vez.'));
      }
      function lojaStatus(e) {
        const l = e.loja;
        return CE.el('div', { class: 'ng-loja' },
          CE.el('span', {}, l.fechada ? '⛔ Fechada' : l.aberta ? '🟢 Aberta' : '🔴 Fechada'),
          CE.el('span', { 'data-fila': String(l.fila) }, `🧍 Fila: ${l.fila}`), CE.el('span', {}, `🍔 ${l.estoque} hambúrgueres`), CE.el('span', {}, `🍞 ${Math.min(l.pao, l.queijo, l.embalagem)} pães/queijos/emb.`),
          CE.el('span', {}, `👷 ${l.atendentes} atendentes${l.horaExtra ? ' (hora extra)' : ''}`), CE.el('span', {}, `💲 ${dinheiro(l.preco)}${l.promocao ? ' (promoção)' : ''}`),
          CE.el('span', {}, `Hoje: ${l.hoje.clientes} vendidos, ${l.hoje.perdidos} foram embora`));
      }
      // A cadeia inteira: cada um vê os números do que é seu (e o resto, só se alguém contar)
      function painelCadeia(e) {
        const etapa = (icone, nome, info, funcoes) => CE.el('div', { class: 'ng-etapa' + (info ? '' : ' oculta') }, CE.el('div', { class: 'ng-icone' }, icone), CE.el('strong', {}, nome),
          CE.el('span', {}, info || '❓ Você não vê este setor: pergunte pela conversa!'), CE.el('small', {}, funcoes.map((f) => quemFaz(e, f)).join(' · ')));
        const seta = () => CE.el('div', { class: 'ng-seta' }, '➜');
        return CE.el('div', { class: 'ng-cadeia', 'data-cadeia': '' },
          etapa('🌾', 'Roça', e.roca && `${e.roca.talhoes.filter((t) => t.estado === 'crescendo').length} talhão(ões) crescendo · ${e.roca.silagem} t de silagem`, ['agricultor']), seta(),
          etapa('🐄', 'Pasto', e.pasto && `${e.pasto.bois} bois · ${e.pasto.prontos} prontos · capim do piquete ${e.pasto.ativo + 1}: ${e.pasto.piquetes[e.pasto.ativo].capim}%`, ['pecuarista', 'veterinario']), seta(),
          etapa('🚚', 'Transporte', e.caminhao && (e.caminhao.viagem ? `Em viagem (${e.caminhao.viagem.nome})` : `Parado · ⛽ ${e.caminhao.combustivel}%`), ['logistica']), seta(),
          etapa('🏭', 'Frigorífico', e.frig && `${e.frig.bois} boi(s) esperando · ${e.frig.estoque} hambúrgueres na câmara`, ['frigorifico']), seta(),
          etapa('🍔', 'Lanchonete', e.loja && `${e.loja.estoque} hambúrgueres · fila ${e.loja.fila} · hoje ${e.loja.hoje.clientes} vendidos`, ['gerente', 'caixa', 'chapeiro']), seta(),
          etapa('🏢', 'Escritório', e.escritorio && `${e.escritorio.contas.length} conta(s) a pagar · ${e.escritorio.avaliacoes.length} avaliação(ões)`, ['financeiro', 'compras', 'marketing', 'rh', 'qualidade']));
      }
      function quemFaz(e, f) {
        if (estado.modo === 'cada') return '';
        const m = (e.membros || estado.participantes).find((p) => (p.funcoes || []).includes(f));
        return `${porId[f].icone} ${m ? m.nome.split(' ')[0] : 'IA'}`;
      }
      function painelPedidos(e) {
        const funcs = minhasFuncoes();
        const sel = (campo, opcoes) => CE.el('select', { class: 'campo', 'data-campo': campo }, ...opcoes.map(([v, t]) => CE.el('option', { value: v }, t)));
        const de = sel('pedido-de', (estado.modo === 'cada' || instrutor ? FUNCOES.map((f) => f.id) : funcs).map((f) => [f, nomeF(f)]));
        const para = sel('pedido-para', FUNCOES.filter((f) => !funcs.includes(f.id) || instrutor || estado.modo === 'cada').map((f) => [f.id, nomeF(f.id)]));
        const item = sel('pedido-item', REF.ITENS_PEDIDO);
        const qtd = num('pedido-qtd', 100, 0, 100000);
        const prazo = sel('pedido-prazo', Array.from({ length: 3 }, (_, i) => estado.dia + i).filter((d) => d <= estado.dias).map((d) => [String(d), d === estado.dia ? `Hoje (dia ${d})` : `Dia ${d}`]));
        const texto = CE.el('input', { class: 'campo', 'data-campo': 'pedido-texto', placeholder: 'Detalhe (ex.: antes do almoço!)' });
        const status = { aberto: '🟡 Aberto', aceito: '🔵 Aceito', recusado: '🔴 Recusado', feito: '🟢 Feito' };
        const lista = e.pedidos.slice().reverse();
        return CE.el('div', { class: 'ng-pedidos' },
          cartao('📝 Fazer um pedido para outro setor', CE.el('div', { class: 'ng-form ng-form-pedido' }, CE.el('label', {}, 'De', de), CE.el('label', {}, 'Para', para), CE.el('label', {}, 'O quê', item), CE.el('label', {}, 'Quantos', qtd), CE.el('label', {}, 'Até', prazo), texto,
            botao('📨 Enviar pedido', () => pedir('negocio:pedido', { de: de.value, para: para.value, item: item.value, qtd: Number(qtd.value), prazo: Number(prazo.value), texto: texto.value }), { 'data-acao': 'enviar-pedido' }))),
          CE.el('ul', { class: 'ng-lista-pedidos' }, ...lista.map((p) => {
            const meu = instrutor || funcs.includes(p.para) || funcs.includes('diretor');
            return CE.el('li', { class: 'ng-ped ' + p.status, 'data-pedido': p.id },
              CE.el('div', {}, CE.el('b', {}, `${nomeF(p.de)} → ${nomeF(p.para)}`), ` ${p.nomeItem}${p.qtd ? `: ${p.qtd}` : ''} até o dia ${p.prazo}`, p.texto ? CE.el('em', {}, ` "${p.texto}"`) : null),
              CE.el('small', {}, `${status[p.status]} · ${p.deNome}${p.respondidoPor ? ` · respondido por ${p.respondidoPor}` : ''}`),
              meu && p.status !== 'feito' && p.status !== 'recusado' ? CE.el('div', { class: 'ng-opcoes' },
                p.status === 'aberto' ? botao('👍 Aceitar', () => pedir('negocio:responder', { id: p.id, status: 'aceito' }), { 'data-responder-pedido': 'aceito' }) : null,
                botao('✅ Feito', () => pedir('negocio:responder', { id: p.id, status: 'feito' }), { 'data-responder-pedido': 'feito' }),
                botao('✋ Não dá', () => pedir('negocio:responder', { id: p.id, status: 'recusado' }), { 'data-responder-pedido': 'recusado' })) : null);
          })));
      }
      function painelConversa(e) {
        const campo = CE.el('input', { class: 'campo', 'data-campo': 'mensagem', placeholder: 'Escreva para a empresa...', maxlength: '200' });
        const para = CE.el('select', { class: 'campo', 'data-campo': 'mensagem-para' }, CE.el('option', { value: '' }, '👥 Para todos'), ...FUNCOES.map((f) => CE.el('option', { value: f.id }, `Só para ${nomeF(f.id)}`)));
        const enviar = () => { if (!campo.value.trim()) return; const t = campo.value; campo.value = ''; pedir('negocio:falar', { texto: t, para: para.value }).then(() => { const c = corpo.querySelector('[data-campo="mensagem"]'); if (c) c.focus(); }); };
        campo.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); enviar(); } });
        const prontas = ['Preciso de hambúrguer na lanchonete!', 'Tem boi pronto?', 'O caminhão pode vir?', 'Vamos guardar silagem para a seca!', 'Pagar as contas!', 'Fila grande aqui!'];
        return CE.el('div', { class: 'ng-conversa' },
          estado.modo === 'cada' && !instrutor ? nao('No modo "cada um com a sua empresa", a conversa é com o professor.') : null,
          CE.el('ul', { class: 'ng-msgs' }, ...e.conversa.map((m) => CE.el('li', { class: m.professor ? 'prof' : '' }, CE.el('small', {}, `${horaTexto(m.em)}${m.para ? ` · para ${nomeF(m.para)}` : ''}`),
            CE.el('b', {}, `${m.avatar} ${m.de}${m.deFuncoes.length ? ` (${m.deFuncoes.map((f) => porId[f].icone).join('')})` : ''}: `), m.texto))),
          CE.el('div', { class: 'ng-chips' }, ...prontas.map((t) => CE.el('button', { class: 'chip', type: 'button', onclick: () => { campo.value = t; campo.focus(); } }, t))),
          CE.el('div', { class: 'ng-form' }, para, campo, botao('Enviar', enviar, { 'data-acao': 'enviar-mensagem' })));
      }
      function painelTurma() {
        const i = estado.instrutor || {};
        const parados = new Set((i.empresas || []).flatMap((x) => x.parado || []));
        return CE.el('div', {},
          CE.el('table', { class: 'ng-tabela' }, CE.el('tr', {}, ...['Aluno', 'Funções', 'Ações', 'Lanches', 'Pedidos', 'Atendidos', 'Mensagens', ''].map((t) => CE.el('th', {}, t))),
            ...estado.participantes.map((p) => { const s = (i.stats || {})[p.id] || {}; return CE.el('tr', { 'data-aluno': p.id }, CE.el('td', {}, `${p.avatar} ${p.nome}`), CE.el('td', {}, p.funcoes.map((f) => porId[f].icone).join(' ') || (estado.modo === 'cada' ? 'tudo' : '—')),
              ...['acoes', 'lanches', 'pedidos', 'atendidos', 'mensagens'].map((k) => CE.el('td', {}, String(s[k] || 0))), CE.el('td', {}, parados.has(p.id) ? '💤 parado há 2 min' : '')); })),
          nao('Na turma-empresa, clique nas funções de cada aluno na tela de espera para trocar. A função sem aluno, a IA faz.'));
      }

      atualizar(true);
      timer = setInterval(() => atualizar(false), 1000);
      return { aoFechar() { fechou = true; clearInterval(timer); Object.values(cenas).forEach((c) => c.destruir()); return true; } };
    },
  });
})();
