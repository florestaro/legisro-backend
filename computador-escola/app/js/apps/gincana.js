// Gincana ao vivo (na rede da sala): o instrutor monta a gincana com perguntas das aulas e tarefas práticas,
// separa as equipes e passa as rodadas; os alunos respondem no computador deles e o placar aparece ao vivo
// (dá para mostrar no projetor). Regras em gincana-regras.js. O mesmo programa serve ao instrutor e ao aluno.
window.CE = window.CE || {};

(function () {
  // Tarefas práticas: o computador do aluno confere sozinho, pelo que ele fez de verdade.
  const TAREFAS = {
    calculadora: { texto: 'Abra a Calculadora', icone: '🧮', evento: 'app:aberto', se: (d) => d.app === 'calculadora' },
    pasta: { texto: 'No Arquivos, crie uma pasta chamada GINCANA', icone: '📁', evento: 'pasta:criada', se: (d) => /gincana/i.test(d.nome) },
    negrito: { texto: 'No Editor de Texto, escreva o seu nome e deixe em NEGRITO', icone: '📝', evento: 'editor:formatado', se: (d) => d.comando === 'bold' && d.ativo && d.selecionado.trim().length > 1 },
    soma: { texto: 'Na Planilha, escreva =15+27 numa célula e aperte Enter', icone: '📊', evento: 'planilha:editada', se: (d) => d.valor === 42 },
    fundo: { texto: 'Troque o fundo da área de trabalho (Configurações › Personalizar)', icone: '🎨', evento: 'config:fundo' },
    email: { texto: 'Mande um e-mail para professor@correio.escola com o assunto GINCANA', icone: '📧', evento: 'email:enviado', se: (d) => /gincana/i.test(d.assunto) },
    foto: { texto: 'No Celular, tire uma foto (Câmera)', icone: '📷', evento: 'celular:foto' },
  };
  const NIVEIS_PERGUNTAS = () => CE.NIVEIS_CURSO.filter((n) => CE.LICOES.some((l) => l.nivel === n.id && l.passos.some((p) => p.quiz)));
  const embaralhar = (lista) => lista.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  // Perguntas sorteadas das aulas do nível escolhido (as opções também são embaralhadas).
  function perguntasDo(nivel, quantas) {
    const todas = CE.LICOES.filter((l) => l.nivel === nivel).flatMap((l) => l.passos.filter((p) => p.quiz).map((p) => p.quiz));
    return embaralhar(todas).slice(0, quantas).map((q) => {
      const opcoes = embaralhar(q.opcoes.map((o, i) => ({ o, certa: i === q.correta })));
      return { tipo: 'pergunta', pergunta: q.pergunta, opcoes: opcoes.map((x) => x.o), correta: opcoes.findIndex((x) => x.certa), limite: 30 };
    });
  }
  const LETRAS = ['A', 'B', 'C', 'D', 'E'];
  CE.gincana = { TAREFAS, perguntasDo };

  CE.registrarApp({
    id: 'gincana', nome: 'Gincana', icone: '🏆', largura: 900, altura: 620,
    abrir(corpo, janela, argumento) {
      corpo.classList.add('gincana-app');
      const instrutor = CE.sessao.usuario && CE.sessao.usuario.papel === 'instrutor';
      let estado = null, timer = null, diferenca = 0, entrando = null;
      const agora = () => Date.now() + diferenca;
      const receber = (r) => { estado = r; if (r) diferenca = r.agora - Date.now(); };
      const restante = () => (estado && estado.rodada ? Math.max(0, Math.ceil((estado.rodada.inicio + estado.rodada.limite * 1000 - agora()) / 1000)) : 0);
      const nomeEquipe = (id) => ((CE.gincanaRegras ? CE.gincanaRegras().EQUIPES : []).find((e) => e[0] === id) || [id, id])[1];

      // ---------- Instrutor: montar a gincana ----------
      async function configurar() {
        clearInterval(timer);
        const turmas = [...new Set((await CE.api.chamar('usuarios:listar').catch(() => [])).filter((u) => u.papel === 'aluno' && u.turma).map((u) => u.turma))].sort();
        const titulo = CE.el('input', { class: 'campo', 'data-campo': 'titulo-gincana', value: 'Gincana da turma' });
        const nivel = CE.el('select', { class: 'campo', 'data-campo': 'nivel-gincana' }, ...NIVEIS_PERGUNTAS().map((n) => CE.el('option', { value: n.id }, `${n.icone} ${n.nome}`)));
        const quantas = CE.el('select', { class: 'campo', 'data-campo': 'perguntas-gincana' }, ...[5, 8, 10].map((n) => CE.el('option', { value: String(n) }, `${n} perguntas`)));
        const tarefas = CE.el('div', { class: 'gc-tarefas' }, ...Object.entries(TAREFAS).map(([id, tf]) => CE.el('label', { class: 'pc-check' }, CE.el('input', { type: 'checkbox', value: id, 'data-tarefa-gincana': id, checked: id === 'calculadora' || id === 'soma' }), CE.el('span', {}, `${tf.icone} ${tf.texto}`))));
        const equipes = CE.el('select', { class: 'campo', 'data-campo': 'equipes-gincana' }, CE.el('option', { value: '0' }, 'Cada um por si'), ...[2, 3, 4].map((n) => CE.el('option', { value: String(n) }, `${n} equipes`)));
        const turma = CE.el('select', { class: 'campo', 'data-campo': 'turma-gincana' }, CE.el('option', { value: '' }, 'Todos os alunos'), ...turmas.map((t) => CE.el('option', { value: t }, `Turma ${t}`)));
        const erro = CE.el('p', { class: 'login-erro' });
        corpo.replaceChildren(CE.el('div', { class: 'gc-config' },
          CE.el('h2', {}, '🏆 Gincana ao vivo'),
          CE.el('p', {}, 'Perguntas sorteadas das aulas e tarefas práticas no computador. Acertar vale 100 pontos e responder rápido dá até 50 de bônus. Os alunos recebem o convite em poucos segundos.'),
          CE.el('label', {}, 'Nome da gincana', titulo), CE.el('label', {}, 'Perguntas do nível', nivel), CE.el('label', {}, 'Quantas perguntas', quantas),
          CE.el('strong', {}, 'Tarefas práticas (entram no meio das perguntas)'), tarefas,
          CE.el('label', {}, 'Equipes', equipes), CE.el('label', {}, 'Quem participa', turma), erro,
          CE.el('button', { class: 'botao grande', 'data-acao': 'abrir-gincana', onclick: async () => {
            erro.textContent = '';
            const perguntas = perguntasDo(nivel.value, Number(quantas.value));
            const escolhidas = [...tarefas.querySelectorAll('input:checked')].map((i) => ({ tipo: 'tarefa', tarefa: i.value, texto: TAREFAS[i.value].texto, limite: 90 }));
            const rodadas = [...perguntas];
            escolhidas.forEach((tf, k) => rodadas.splice(Math.min(rodadas.length, Math.round(((k + 1) * rodadas.length) / (escolhidas.length + 1)) + k), 0, tf));
            try {
              receber(await CE.api.chamar('gincana:criar', { titulo: titulo.value, rodadas, equipes: Number(equipes.value), turma: turma.value }));
              CE.emitir('instrutor:gincana', { acao: 'abriu', rodadas: rodadas.length, equipes: Number(equipes.value) });
              acompanhar();
            } catch (e) { erro.textContent = e.message; }
          } }, 'Abrir a gincana')));
      }

      // ---------- Placar (instrutor e aluno) ----------
      function placar(limite = 20) {
        const lista = estado.participantes.slice(0, limite);
        return CE.el('div', { class: 'gc-placar' },
          estado.equipes.length ? CE.el('div', { class: 'gc-equipes' }, ...estado.equipes.map((e, i) => CE.el('div', { class: `gc-equipe ${e.id}`, 'data-equipe': e.id }, CE.el('b', {}, `${i === 0 && e.pontos > 0 ? '👑 ' : ''}${e.nome}`), CE.el('span', {}, `${e.pontos} pts · ${e.membros} aluno(s)`)))) : '',
          CE.el('ol', { class: 'cor-placar' }, ...lista.map((p) => CE.el('li', { class: 'cor-linha', 'data-participante': p.nome },
            CE.el('span', { class: 'cor-lugar' }, ['🥇', '🥈', '🥉'][p.lugar - 1] || `${p.lugar}º`),
            CE.el('span', { class: 'cor-nome' }, `${p.avatar || ''} ${p.nome}${p.equipe ? ` · ${nomeEquipe(p.equipe).split(' ')[0]}` : ''}`),
            CE.el('span', { class: 'cor-ppm' }, `${p.pontos} pts${estado.fase === 'rodada' && p.respondeu ? ' ✔️' : ''}`)))));
      }
      function cartaoRodada() {
        const r = estado.rodada;
        if (!r) return '';
        const cabeca = CE.el('div', { class: 'gc-rodada-topo' }, CE.el('b', {}, `Rodada ${estado.indice + 1} de ${estado.total}`),
          estado.fase === 'rodada' ? CE.el('span', { class: 'gc-relogio', 'data-gincana-relogio': '' }, `⏱️ ${restante()} s`) : CE.el('span', {}, '⏸️ Tempo encerrado'));
        if (r.tipo === 'tarefa') {
          const tf = TAREFAS[r.tarefa] || { icone: '🏃', texto: r.texto };
          return CE.el('div', { class: 'gc-rodada tarefa', 'data-rodada-tipo': 'tarefa' }, cabeca, CE.el('h2', {}, `🏃 TAREFA: ${tf.icone} ${r.texto || tf.texto}`),
            CE.el('p', {}, `${r.respostas} aluno(s) já fizeram. Quem termina primeiro ganha mais pontos!`));
        }
        return CE.el('div', { class: 'gc-rodada', 'data-rodada-tipo': 'pergunta' }, cabeca, CE.el('h2', {}, r.pergunta),
          CE.el('div', { class: 'gc-opcoes' }, ...r.opcoes.map((o, i) => CE.el('div', { class: 'gc-opcao' + (r.correta === i ? ' certa' : '') }, CE.el('b', {}, LETRAS[i]), ` ${o}`))),
          CE.el('p', {}, estado.fase === 'rodada' ? `${r.respostas} resposta(s) recebida(s).` : `✅ Resposta certa: ${LETRAS[r.correta]}) ${r.opcoes[r.correta]}`));
      }
      function podio() {
        const top = estado.participantes.slice(0, 3);
        return CE.el('div', { class: 'gc-fim' }, CE.el('h2', { 'data-gincana-fim': '' }, '🏆 Fim da gincana!'),
          estado.equipes.length && estado.equipes[0].pontos > 0 ? CE.el('p', { class: 'gc-campea', 'data-equipe-campea': estado.equipes[0].id }, `👑 Equipe campeã: ${estado.equipes[0].nome} com ${estado.equipes[0].pontos} pontos!`) : '',
          top.length ? CE.el('div', { class: 'cor-podio' }, ...top.map((p) => CE.el('div', { class: `cor-podio-lugar l${p.lugar}`, 'data-podio': p.lugar },
            CE.el('span', { class: 'cor-medalha' }, ['🥇', '🥈', '🥉'][p.lugar - 1]), CE.el('b', {}, `${p.avatar || ''} ${p.nome}`), CE.el('small', {}, `${p.pontos} pontos`)))) : '');
      }

      // ---------- Instrutor: ao vivo ----------
      function desenharInstrutor() {
        const f = estado.fase;
        const botoes = CE.el('div', { class: 'cor-botoes' },
          f === 'espera' ? CE.el('button', { class: 'botao grande', 'data-acao': 'comecar-gincana', disabled: !estado.participantes.length || null, onclick: () => acao('gincana:comecar', 'começou') }, '▶ Começar') : '',
          f === 'rodada' ? CE.el('button', { class: 'botao', 'data-acao': 'fechar-rodada', onclick: () => acao('gincana:proxima', 'fechou') }, '⏹ Fechar a rodada') : '',
          f === 'resultado' ? CE.el('button', { class: 'botao grande', 'data-acao': 'proxima-rodada', onclick: () => acao('gincana:proxima', 'próxima') }, estado.indice + 1 < estado.total ? 'Próxima rodada ▶' : '🏆 Ver o pódio') : '',
          f !== 'fim' ? CE.el('button', { class: 'botao secundario', 'data-acao': 'encerrar-gincana', onclick: () => acao('gincana:encerrar', 'encerrou') }, 'Encerrar') : CE.el('button', { class: 'botao', 'data-acao': 'nova-gincana', onclick: () => { estado = null; configurar(); } }, 'Nova gincana'));
        corpo.replaceChildren(CE.el('div', { class: 'gc-ao-vivo' },
          CE.el('div', { class: 'cor-topo' }, CE.el('h2', { 'data-fase-gincana': f }, `🏆 ${estado.titulo}`), botoes),
          f === 'espera' ? CE.el('p', { class: 'gc-espera' }, `⏳ Esperando os alunos entrarem… (${estado.participantes.length} na gincana). Nos computadores deles aparece "🏆 Gincana!": é só clicar em "Entrar".`) : '',
          f === 'fim' ? podio() : cartaoRodada(),
          estado.participantes.length ? placar() : ''));
      }
      async function acao(canal, nome) {
        try { receber(await CE.api.chamar(canal)); CE.emitir('instrutor:gincana', { acao: nome, rodada: estado.indice, fase: estado.fase }); desenhar(); } catch (e) { CE.avisar(e.message); }
      }

      // ---------- Aluno ----------
      // No fim, a participação fica no progresso do aluno (para as medalhas da gincana), uma vez por gincana.
      const registradas = new Set();
      function registrarFim() {
        const eu = estado && estado.eu && estado.participantes.find((p) => p.id === CE.sessao.usuario.id);
        if (!eu || estado.fase !== 'fim' || registradas.has(estado.id)) return;
        registradas.add(estado.id);
        const id = String(estado.id), dono = CE.sessao.usuario.id;
        CE.sessao.atualizarProgresso((p) => {
          if (CE.sessao.usuario.id !== dono) return;
          p.gincanas = p.gincanas || {};
          if (!p.gincanas[id]) p.gincanas[id] = { titulo: estado.titulo, lugar: eu.lugar, pontos: eu.pontos, em: Date.now() };
          const ids = Object.keys(p.gincanas).sort((a, b) => p.gincanas[a].em - p.gincanas[b].em);
          ids.slice(0, Math.max(0, ids.length - 30)).forEach((k) => delete p.gincanas[k]);
        }).then(() => CE.emitir('gincana:terminou', { lugar: eu.lugar, pontos: eu.pontos })).catch(() => {});
      }
      let tarefaOuvida = null; // { rodada, parar }
      function prepararTarefa() {
        const r = estado && estado.rodada;
        const valeTarefa = estado && estado.fase === 'rodada' && r && r.tipo === 'tarefa' && !(estado.eu && estado.eu.resposta);
        if (tarefaOuvida && (!valeTarefa || tarefaOuvida.rodada !== estado.indice)) { tarefaOuvida.parar(); tarefaOuvida = null; }
        if (!valeTarefa || tarefaOuvida) return;
        const tf = TAREFAS[r.tarefa];
        if (!tf) return;
        const rodada = estado.indice, id = estado.id;
        const parar = CE.ouvir(tf.evento, async (d) => {
          if (tf.se && !tf.se(d || {})) return;
          if (tarefaOuvida) { tarefaOuvida.parar(); tarefaOuvida = null; }
          try { receber(await CE.api.chamar('gincana:tarefa', { id, rodada })); CE.avisar('🏆 Tarefa da gincana cumprida!'); CE.emitir('gincana:tarefa-feita', { tarefa: r.tarefa }); desenhar(); } catch (e) { CE.avisar(e.message); }
        });
        tarefaOuvida = { rodada, parar };
      }
      function desenharAluno() {
        const f = estado.fase, r = estado.rodada, eu = estado.eu, minha = eu && eu.resposta;
        let miolo;
        if (!eu && f === 'fim') miolo = podio();
        else if (!eu) {
          // Não está na gincana: de outra turma (só assiste) ou ainda não entrou (botão para entrar).
          const outraTurma = estado.turma && (CE.sessao.usuario.turma || '') !== estado.turma;
          miolo = CE.el('div', { class: 'gc-espera', 'data-gincana-aluno': 'fora' },
            outraTurma ? CE.el('p', {}, `Esta gincana é da turma ${estado.turma}. Na próxima, você participa!`)
              : CE.el('button', { class: 'botao grande', 'data-acao': 'entrar-na-gincana', onclick: async () => {
                try { receber(await CE.api.chamar('gincana:entrar')); CE.emitir('gincana:entrou', { equipe: estado.eu ? estado.eu.equipe : null }); desenhar(); } catch (e) { CE.avisar(e.message); }
              } }, 'Entrar na gincana ▶'));
        } else if (f === 'espera') miolo = CE.el('div', { class: 'gc-espera', 'data-gincana-aluno': 'espera' }, CE.el('h2', {}, '✅ Você está na gincana!'), eu.equipe ? CE.el('p', { class: `gc-minha-equipe ${eu.equipe}` }, `Sua equipe: ${nomeEquipe(eu.equipe)}`) : '', CE.el('p', {}, '⏳ Espere o professor começar.'));
        else if (f === 'fim') miolo = podio();
        else if (r.tipo === 'tarefa') {
          miolo = CE.el('div', { class: 'gc-rodada tarefa', 'data-gincana-aluno': 'tarefa' }, CE.el('div', { class: 'gc-rodada-topo' }, CE.el('b', {}, `Rodada ${estado.indice + 1} de ${estado.total}`), f === 'rodada' ? CE.el('span', { class: 'gc-relogio' }, `⏱️ ${restante()} s`) : ''),
            CE.el('h2', {}, `🏃 ${(TAREFAS[r.tarefa] || {}).icone || ''} ${r.texto}`),
            CE.el('p', {}, minha && minha.feita ? `✅ Feito! +${minha.pontos} pontos.` : f === 'rodada' ? 'Vá fazer a tarefa! Esta janela pode ficar aberta atrás: o computador confere sozinho quando você terminar.' : '⏹ Tempo esgotado.'));
        } else {
          miolo = CE.el('div', { class: 'gc-rodada', 'data-gincana-aluno': 'pergunta' }, CE.el('div', { class: 'gc-rodada-topo' }, CE.el('b', {}, `Rodada ${estado.indice + 1} de ${estado.total}`), f === 'rodada' ? CE.el('span', { class: 'gc-relogio' }, `⏱️ ${restante()} s`) : ''),
            CE.el('h2', {}, r.pergunta),
            CE.el('div', { class: 'gc-opcoes' }, ...r.opcoes.map((o, i) => CE.el('button', {
              class: 'gc-opcao botao-opcao' + (minha && minha.opcao === i ? ' escolhida' : '') + (r.correta === i ? ' certa' : '') + (r.correta != null && minha && minha.opcao === i && i !== r.correta ? ' errada' : ''),
              'data-opcao-gincana': String(i), disabled: !!minha || f !== 'rodada' || null,
              onclick: async () => { try { receber(await CE.api.chamar('gincana:responder', { id: estado.id, rodada: estado.indice, opcao: i })); CE.emitir('gincana:respondeu', { opcao: i }); desenhar(); } catch (e) { CE.avisar(e.message); } },
            }, CE.el('b', {}, LETRAS[i]), ` ${o}`))),
            CE.el('p', { class: 'gc-retorno' }, f === 'rodada' ? (minha ? '⏳ Resposta enviada! Espere o resultado.' : 'Clique na resposta certa. Quanto mais rápido, mais pontos!')
              : minha ? (minha.pontos ? `✅ Acertou! +${minha.pontos} pontos.` : `❌ Não foi dessa vez. A certa era ${LETRAS[r.correta]}.`) : `⏹ Tempo esgotado. A certa era ${LETRAS[r.correta]}.`));
        }
        const eu2 = eu && estado.participantes.find((p) => p.id === CE.sessao.usuario.id);
        corpo.replaceChildren(CE.el('div', { class: 'gc-ao-vivo aluno' },
          CE.el('div', { class: 'cor-topo' }, CE.el('h2', {}, `🏆 ${estado.titulo}`), eu2 && f !== 'espera' ? CE.el('span', { class: 'gc-meus-pontos', 'data-meus-pontos': String(eu2.pontos) }, `${eu2.lugar}º lugar · ${eu2.pontos} pts`) : ''),
          miolo, f !== 'espera' ? placar(10) : ''));
        prepararTarefa();
        registrarFim();
      }

      function desenhar() {
        if (!corpo.isConnected) return;
        if (!estado) { if (instrutor) configurar(); else corpo.replaceChildren(CE.el('div', { class: 'gc-espera' }, CE.el('h2', {}, '🏆 Gincana'), CE.el('p', {}, 'Não tem gincana aberta agora. Quando o professor abrir, aparece um convite na sua tela.'))); return; }
        if (instrutor) desenharInstrutor(); else desenharAluno();
      }
      function acompanhar() {
        clearInterval(timer);
        desenhar();
        let ultima = 0;
        timer = setInterval(async () => {
          if (Date.now() - ultima >= 1000) {
            ultima = Date.now();
            try { const r = await CE.api.chamar('gincana:estado'); if (r && (!estado || r.id === estado.id)) receber(r); } catch { /* tenta de novo */ }
            if (estado) desenhar();
          } else if (estado && estado.fase === 'rodada') {
            const rel = corpo.querySelector('.gc-relogio');
            if (rel) rel.textContent = `⏱️ ${restante()} s`;
          }
        }, 250);
      }
      async function iniciar() {
        let r = await CE.api.chamar('gincana:estado').catch(() => null);
        if (!instrutor && r && r.fase !== 'fim' && !r.eu && (!argumento || argumento.entrar !== false)) {
          entrando = CE.api.chamar('gincana:entrar').catch((e) => { CE.avisar(e.message); return r; });
          r = await entrando;
          CE.emitir('gincana:entrou', { equipe: r && r.eu ? r.eu.equipe : null });
        }
        receber(r);
        if (r) acompanhar(); else desenhar();
      }
      iniciar();
      return {
        receber() { iniciar(); },
        aoFechar() { clearInterval(timer); if (tarefaOuvida) tarefaOuvida.parar(); return true; },
      };
    },
  });
})();
