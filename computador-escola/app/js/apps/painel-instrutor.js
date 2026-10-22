// Painel do Instrutor: cadastrar alunos, organizar turmas e acompanhar o progresso.
(function () {
  const AVATARES = ['🙂', '😀', '😎', '🤓', '🦊', '🐱', '🐶', '🐼', '🦁', '🐸', '🌻', '⭐', '🚀', '⚽', '🎵', '🌈'];

  CE.registrarApp({
    id: 'instrutor',
    nome: 'Painel do Instrutor',
    icone: '🧑‍🏫',
    largura: 920,
    altura: 600,
    soInstrutor: true,
    abrir(corpo) {
      corpo.classList.add('painel');
      let aba = 'progresso';
      const estadoExtras = { turma: '', periodo: 'mes', curso: '' }; // turma/período/curso escolhidos nas abas novas

      async function formularioNovo(aoSalvar) {
        let avatar = AVATARES[0];
        const nome = CE.el('input', { class: 'campo', placeholder: 'Nome do aluno' });
        const turma = CE.el('input', { class: 'campo', placeholder: 'Turma (ex.: Manhã, Turma A)', list: 'lista-turmas' });
        const senha = CE.el('input', { class: 'campo', placeholder: 'Senha (mínimo 4 números ou letras)' });
        const papel = CE.el('select', { class: 'campo' }, CE.el('option', { value: 'aluno' }, 'Aluno'), CE.el('option', { value: 'instrutor' }, 'Instrutor'));
        const crianca = CE.el('input', { type: 'checkbox', id: 'cadastro-crianca' });
        const erro = CE.el('p', { class: 'login-erro' });
        const turmas = [...new Set((await CE.api.chamar('usuarios:listar')).map((u) => u.turma).filter(Boolean))];
        const avatares = CE.el('div', { class: 'painel-avatares' }, ...AVATARES.map((a) => CE.el('button', {
          class: 'painel-avatar' + (a === avatar ? ' ativo' : ''),
          onclick: (e) => { avatar = a; avatares.querySelectorAll('button').forEach((b) => b.classList.remove('ativo')); e.currentTarget.classList.add('ativo'); },
        }, a)));
        const salvar = async () => {
          try {
            await CE.api.chamar('usuarios:criar', { nome: nome.value, turma: turma.value.trim(), segredo: senha.value, papel: papel.value, avatar, crianca: crianca.checked });
            CE.avisar(`${nome.value} cadastrado!`);
            nome.value = ''; senha.value = ''; erro.textContent = '';
            await aoSalvar();
            nome.focus();
          } catch (e) { erro.textContent = e.message; }
        };
        return CE.el('div', { class: 'painel-form' },
          CE.el('h3', {}, 'Cadastrar aluno'),
          CE.el('datalist', { id: 'lista-turmas' }, ...turmas.map((t) => CE.el('option', { value: t }))),
          nome, turma, senha, papel,
          CE.el('label', { class: 'painel-check', for: 'cadastro-crianca' }, crianca, ' Criança (até 12 anos): metas de digitação menores'),
          CE.el('p', {}, 'Escolha uma figura (ajuda as crianças a acharem o próprio nome):'),
          avatares, erro,
          CE.el('button', { class: 'botao', onclick: salvar }, 'Cadastrar'),
        );
      }

      async function tabelaAlunos() {
        const usuarios = (await CE.api.chamar('usuarios:listar')).sort((a, b) => (a.turma + a.nome).localeCompare(b.turma + b.nome));
        return CE.el('table', { class: 'painel-tabela' },
          CE.el('thead', {}, CE.el('tr', {}, ...['', 'Nome', 'Turma', 'Tipo', ''].map((t) => CE.el('th', {}, t)))),
          CE.el('tbody', {}, ...usuarios.map((u) => CE.el('tr', {},
            CE.el('td', {}, u.avatar), CE.el('td', {}, u.nome), CE.el('td', {}, u.turma || '—'),
            CE.el('td', {}, u.papel === 'instrutor' ? 'Instrutor' : u.crianca ? 'Aluno (criança)' : 'Aluno'),
            CE.el('td', { class: 'painel-acoes' },
              CE.el('button', { class: 'botao secundario pequeno', onclick: async () => {
                const nova = await CE.perguntar(`Nova senha para ${u.nome}:`);
                if (!nova) return;
                try { await CE.api.chamar('usuarios:trocar-senha', u.id, nova); CE.avisar('Senha trocada!'); } catch (e) { CE.avisar(e.message); }
              } }, '🔑 Trocar senha'),
              u.papel === 'aluno' ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'liberar-aulas', title: 'Liberar aulas fora da ordem do curso',
                onclick: () => CE.painelExtras.liberarAulas(u, desenhar) }, '🔓 Liberar aulas') : null,
              u.id !== CE.sessao.usuario.id ? CE.el('button', { class: 'botao secundario pequeno', onclick: async () => {
                if (!await CE.confirmar(`Remover ${u.nome}? O progresso dele não será mais mostrado.`)) return;
                await CE.api.chamar('usuarios:remover', u.id);
                desenhar();
              } }, '🗑️ Remover') : null,
            ),
          ))),
        );
      }

      async function tabelaProgresso() {
        const alunos = (await CE.api.chamar('usuarios:listar')).filter((u) => u.papel === 'aluno').sort((a, b) => (a.turma + a.nome).localeCompare(b.turma + b.nome));
        if (!alunos.length) return CE.el('p', {}, 'Nenhum aluno cadastrado ainda. Vá na aba "Alunos" para cadastrar.');
        const provasDig = CE.DIGITACAO.lista.filter((e) => e.prova);
        const totalDig = CE.DIGITACAO.lista.length;
        const linhas = await Promise.all(alunos.map(async (u) => {
          const p = await CE.sessao.progresso(u.id);
          const r = CE.curso.resumo(p);
          const dig = p.digitacao || {};
          const aprovadosDig = CE.DIGITACAO.lista.filter((e) => dig[e.id] && dig[e.id].aprovado);
          const proximoDig = CE.DIGITACAO.lista.find((e) => !(dig[e.id] && dig[e.id].aprovado));
          const melhorPpm = Math.max(0, ...CE.DIGITACAO.lista.map((e) => (dig[e.id] && dig[e.id].ppm) || 0));
          const medalhas = Object.keys(p.medalhas || {}).length;
          return CE.el('tr', {},
            CE.el('td', {}, `${u.avatar} ${u.nome}`),
            CE.el('td', {}, u.turma || '—'),
            CE.el('td', {}, r.proxima ? `${r.nivelAtual.icone} ${r.proxima.titulo}` : '✅ Tudo concluído'),
            CE.el('td', {}, CE.el('div', { class: 'painel-barra', title: `${r.aprovadas} de ${r.total}` },
              CE.el('div', { style: `width:${Math.round((r.aprovadas / r.total) * 100)}%` })), ` ${r.aprovadas}/${r.total}`),
            CE.el('td', {}, r.media != null ? `${r.media}%` : '—'),
            CE.el('td', {}, proximoDig ? proximoDig.titulo : '✅ Tudo concluído', CE.el('br'), CE.el('small', {}, `${aprovadosDig.length}/${totalDig} aprovados`)),
            CE.el('td', {}, melhorPpm ? `${melhorPpm} ppm` : '—'),
            CE.el('td', { class: 'painel-celula' }, ...provasDig.map((e) => CE.el('span', { title: e.titulo }, dig[e.id] && dig[e.id].aprovado ? '🏅' : '·'))),
            CE.el('td', { class: 'painel-celula' }, medalhas ? `🏅 ${medalhas}` : '—'),
          );
        }));
        return CE.el('div', { class: 'painel-rolagem' }, CE.el('table', { class: 'painel-tabela' },
          CE.el('thead', {}, CE.el('tr', {}, ...['Aluno', 'Turma', 'Aula atual', 'Informática', 'Média', 'Digitação (exercício atual)', 'Melhor velocidade', 'Provas de digitação', 'Medalhas'].map((t) => CE.el('th', {}, t)))),
          CE.el('tbody', {}, ...linhas),
        ), CE.el('p', { class: 'painel-legenda' }, 'Média = acertos nas perguntas das aulas. ppm = palavras por minuto. Provas de digitação: Iniciante, Intermediário e Avançado.'));
      }

      // ---------- Sala ao vivo ----------
      let timerSala = null;
      const tempo = (s) => (s < 15 ? 'agora' : `há ${s} s`);
      const tempoLongo = (s) => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} min`);
      async function salaAoVivo() {
        const [st, rede] = await Promise.all([CE.api.chamar('sala:turma'), CE.api.chamar('sala:ler')]);
        // Quem apertou "🙋 Não entendi" aparece primeiro (quem pediu há mais tempo, antes).
        const alunos = st.alunos.filter((a) => a.usuario.papel !== 'instrutor')
          .sort((a, b) => (b.ajudaHa != null) - (a.ajudaHa != null) || (b.ajudaHa || 0) - (a.ajudaHa || 0) || a.usuario.nome.localeCompare(b.usuario.nome));
        const pedindo = alunos.filter((a) => a.ajudaHa != null).length;
        const aviso = rede.modo === 'servidor'
          ? CE.el('p', { class: 'painel-legenda' }, `🧑‍🏫 Este é o computador do instrutor. Nos computadores dos alunos, em "🖧 Rede da sala", use o endereço `, CE.el('b', {}, rede.ips.join(' ou ') || '—'), ' e o código ', CE.el('b', { 'data-codigo-sala': '' }, rede.codigo), '.')
          : rede.modo === 'aluno' ? CE.el('p', { class: 'painel-legenda' }, `Ligado ao computador do instrutor (${rede.servidor}).`)
            : CE.el('p', { class: 'painel-legenda painel-alerta' }, '🖥️ Este computador está sozinho: aqui aparece só quem está nele. Para ver a sala inteira ao vivo, deixe este computador como "Computador do INSTRUTOR" e os outros como "Computador de ALUNO" (botão "🖧 Rede da sala" na tela de entrada).');
        return CE.el('div', { class: 'painel-sala' },
          CE.el('div', { class: 'painel-sala-acoes' },
            CE.el('button', { class: 'botao' + (st.pausada ? '' : ' secundario'), 'data-acao': 'pausar-sala', onclick: async () => { await CE.api.chamar('sala:pausar', !st.pausada); CE.emitir('instrutor:pausou', { pausada: !st.pausada }); atualizarSala(); } },
              st.pausada ? '▶️ Liberar as telas' : '⏸️ Pausar todas as telas'),
            CE.el('button', { class: 'botao secundario', 'data-acao': 'mensagem-sala', onclick: async () => {
              const texto = await CE.perguntar('Mensagem para todos os alunos:', '');
              if (texto == null) return;
              await CE.api.chamar('sala:mensagem', texto);
              CE.avisar(texto.trim() ? '📢 Mensagem enviada para a turma.' : 'Mensagem apagada.');
              CE.emitir('instrutor:mensagem', { texto });
              atualizarSala();
            } }, '📢 Mandar mensagem'),
            CE.el('span', { class: 'painel-sala-total', 'data-online': alunos.length }, `🟢 ${alunos.length} aluno${alunos.length === 1 ? '' : 's'} agora`),
            pedindo ? CE.el('span', { class: 'painel-sala-total ajuda', 'data-pedindo-ajuda': pedindo }, `🙋 ${pedindo} pedindo ajuda`) : null),
          st.mensagem ? CE.el('p', { class: 'painel-legenda' }, `Última mensagem: "${st.mensagem.texto}"`) : null,
          alunos.length ? CE.el('div', { class: 'painel-cartoes' }, ...alunos.map((a) => CE.el('div', { class: 'painel-cartao' + (a.ajudaHa != null ? ' pediu-ajuda' : a.ha > 25 ? ' parado' : ''), 'data-aluno-online': a.usuario.nome },
            CE.el('div', { class: 'painel-cartao-topo' }, CE.el('span', { class: 'login-avatar' }, a.usuario.avatar), CE.el('div', {}, CE.el('b', {}, a.usuario.nome), CE.el('small', {}, `💻 ${a.pc}${a.usuario.turma ? ' · ' + a.usuario.turma : ''}`))),
            a.ajudaHa != null ? CE.el('p', { class: 'painel-cartao-ajuda' }, `🙋 Não entendeu — pediu ajuda ${a.ajudaHa < 15 ? 'agora' : `há ${tempoLongo(a.ajudaHa)}`}`) : null,
            CE.el('p', {}, a.atividade.licao ? `📘 ${a.atividade.licao} — passo ${a.atividade.passo}` : '📘 Fora de aula'),
            CE.el('p', {}, a.atividade.app),
            CE.el('small', {}, `Atualizado ${tempo(a.ha)}`))))
            : CE.el('p', {}, 'Nenhum aluno conectado agora.'),
          aviso);
      }
      async function atualizarSala() {
        if (aba !== 'sala' || !corpo.isConnected) { clearInterval(timerSala); return; }
        const nova = await salaAoVivo();
        const area = corpo.querySelector('.painel-sala');
        // Com a turma inteira, a lista rola: a atualização mantém a rolagem onde o instrutor deixou.
        if (area) { const rolagem = area.scrollTop; area.replaceWith(nova); nova.scrollTop = rolagem; }
      }

      // ---------- Criar aulas (sem programar) ----------
      const ICONES_AULA = ['📌', '📝', '📊', '🌐', '📧', '🖱️', '⌨️', '🎨', '💡', '⭐', '🧩', '🏆'];
      const TIPOS_PASSO = { info: '💬 Explicação', quiz: '❓ Pergunta', tarefa: '🎯 Tarefa' };
      let rascunho = null; // a aula que está sendo criada ou editada
      const novaAula = () => ({ id: 'prof-' + Date.now().toString(36), titulo: '', icone: '📌', descricao: '', conclusao: '', passos: [{ tipo: 'info', texto: '' }] });
      const novoPasso = (tipo) => (tipo === 'quiz' ? { tipo, pergunta: '', opcoes: ['', '', ''], correta: 0 } : tipo === 'tarefa' ? { tipo, acao: 'abrir', parametro: 'editor', texto: '' } : { tipo, texto: '' });
      // Campo ligado a uma propriedade do rascunho.
      const ligado = (tag, obj, chave, atributos = {}) => {
        const e = CE.el(tag, { class: 'campo', ...atributos });
        e.value = obj[chave] == null ? '' : obj[chave];
        e.addEventListener('input', () => { obj[chave] = e.value; });
        e.addEventListener('change', () => { obj[chave] = e.value; });
        return e;
      };
      function validar(a) {
        if (!a.titulo.trim()) return 'Escreva o título da aula.';
        if (!a.passos.length) return 'A aula precisa ter pelo menos um passo.';
        for (const [i, p] of a.passos.entries()) {
          const n = `Passo ${i + 1}: `;
          if (p.tipo === 'info' && !String(p.texto).trim()) return n + 'escreva a explicação.';
          if (p.tipo === 'quiz') {
            if (!String(p.pergunta).trim()) return n + 'escreva a pergunta.';
            const preenchidas = p.opcoes.filter((o) => String(o).trim());
            if (preenchidas.length < 2) return n + 'escreva pelo menos duas respostas.';
            if (!String(p.opcoes[p.correta] || '').trim()) return n + 'marque qual é a resposta certa.';
          }
          if (p.tipo === 'tarefa') {
            const t = CE.aulasProfessor.TAREFAS[p.acao];
            if (!t) return n + 'escolha a tarefa.';
            if (t.campo && !String(p.parametro || '').trim()) return n + `preencha "${t.campo}".`;
          }
        }
        return null;
      }
      function cartaoPasso(p, i) {
        const r = rascunho;
        const mover = (d) => { const j = i + d; if (j < 0 || j >= r.passos.length) return; [r.passos[i], r.passos[j]] = [r.passos[j], r.passos[i]]; desenhar(); };
        const corpoPasso = [];
        if (p.tipo === 'info') corpoPasso.push(ligado('textarea', p, 'texto', { 'data-campo': 'texto', rows: '3', placeholder: 'O que o Professor Virtual vai explicar (ele lê em voz alta).' }));
        if (p.tipo === 'quiz') {
          corpoPasso.push(ligado('input', p, 'pergunta', { 'data-campo': 'pergunta', placeholder: 'A pergunta' }));
          p.opcoes.forEach((_o, k) => corpoPasso.push(CE.el('label', { class: 'painel-opcao' },
            CE.el('input', { type: 'radio', name: `correta-${r.id}-${i}`, 'data-campo': `correta-${k}`, checked: Number(p.correta) === k, title: 'Esta é a resposta certa', onchange: () => { p.correta = k; } }),
            ligado('input', p.opcoes, k, { 'data-campo': `opcao-${k}`, placeholder: `Resposta ${'ABC'[k]}${k === 2 ? ' (opcional)' : ''}` }))));
          corpoPasso.push(CE.el('small', {}, 'Marque a bolinha da resposta certa.'));
        }
        if (p.tipo === 'tarefa') {
          const T = CE.aulasProfessor.TAREFAS;
          const t = T[p.acao] || {};
          corpoPasso.push(CE.el('select', { class: 'campo', 'data-campo': 'acao', onchange: (e) => { p.acao = e.target.value; const nt = T[p.acao]; p.parametro = nt.opcoes ? nt.opcoes()[0][0] : ''; desenhar(); } },
            ...Object.entries(T).map(([id, x]) => CE.el('option', { value: id, selected: id === p.acao }, x.nome))));
          if (t.opcoes) corpoPasso.push(CE.el('label', { class: 'painel-campo' }, t.campo, CE.el('select', { class: 'campo', 'data-campo': 'parametro', onchange: (e) => { p.parametro = e.target.value; } },
            ...t.opcoes().map(([v, rotulo]) => CE.el('option', { value: v, selected: v === p.parametro }, rotulo)))));
          else if (t.campo) corpoPasso.push(CE.el('label', { class: 'painel-campo' }, t.campo, ligado('input', p, 'parametro', { 'data-campo': 'parametro' })));
          corpoPasso.push(CE.el('label', { class: 'painel-campo' }, 'Instrução para o aluno (opcional: se ficar vazio, o Professor explica sozinho)', ligado('input', p, 'texto', { 'data-campo': 'texto' })));
        }
        return CE.el('div', { class: `painel-passo passo-${p.tipo}`, 'data-passo': i },
          CE.el('div', { class: 'painel-passo-topo' }, CE.el('b', {}, `Passo ${i + 1} · ${TIPOS_PASSO[p.tipo]}`),
            CE.el('button', { class: 'ferramenta', title: 'Subir', onclick: () => mover(-1) }, '⬆️'),
            CE.el('button', { class: 'ferramenta', title: 'Descer', onclick: () => mover(1) }, '⬇️'),
            CE.el('button', { class: 'ferramenta', title: 'Apagar este passo', 'data-acao': 'apagar-passo', onclick: () => { r.passos.splice(i, 1); desenhar(); } }, '🗑️')),
          ...corpoPasso);
      }
      async function criarAulas() {
        const lista = await CE.aulasProfessor.carregar();
        if (!rascunho) {
          return CE.el('div', { class: 'painel-criar' },
            CE.el('p', { class: 'painel-legenda' }, 'Crie aulas extras sem programar: explicações, perguntas e tarefas. Elas aparecem para todos os alunos em Aulas › 📌 Do professor.'),
            CE.el('button', { class: 'botao', 'data-acao': 'nova-aula', onclick: () => { rascunho = novaAula(); desenhar(); } }, '➕ Nova aula'),
            lista.length ? CE.el('div', { class: 'painel-aulas' }, ...lista.map((a) => CE.el('div', { class: 'painel-aula', 'data-aula': a.titulo },
              CE.el('span', { class: 'aula-icone' }, a.icone), CE.el('div', {}, CE.el('b', {}, a.titulo), CE.el('small', {}, `${a.passos.length} passo${a.passos.length === 1 ? '' : 's'}${a.descricao ? ' · ' + a.descricao : ''}`)),
              CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'testar-aula', onclick: () => CE.professor.comecarLicao(a.id) }, '▶ Testar'),
              CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'editar-aula', onclick: () => { rascunho = JSON.parse(JSON.stringify(a)); desenhar(); } }, '✏️ Editar'),
              CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'apagar-aula', onclick: async () => {
                if (!await CE.confirmar(`Apagar a aula "${a.titulo}"?`)) return;
                await CE.aulasProfessor.apagar(a.id);
                desenhar();
              } }, '🗑️')))) : CE.el('p', {}, 'Nenhuma aula criada ainda.'));
        }
        const r = rascunho;
        const erro = CE.el('p', { class: 'login-erro' });
        return CE.el('div', { class: 'painel-criar' },
          CE.el('div', { class: 'painel-duas-colunas' },
            CE.el('label', { class: 'painel-campo' }, 'Título da aula', ligado('input', r, 'titulo', { 'data-campo': 'titulo-aula', placeholder: 'Ex.: Fazendo uma lista de compras' })),
            CE.el('label', { class: 'painel-campo' }, 'Descrição curta', ligado('input', r, 'descricao', { 'data-campo': 'descricao-aula', placeholder: 'Ex.: Usar a planilha para somar as compras' }))),
          CE.el('div', { class: 'painel-icones' }, CE.el('span', {}, 'Figura:'), ...ICONES_AULA.map((ic) => CE.el('button', { class: 'painel-avatar' + (r.icone === ic ? ' ativo' : ''), 'data-icone-aula': ic, onclick: () => { r.icone = ic; desenhar(); } }, ic))),
          ...r.passos.map(cartaoPasso),
          CE.el('div', { class: 'painel-sala-acoes' },
            CE.el('button', { class: 'botao secundario', 'data-acao': 'add-info', onclick: () => { r.passos.push(novoPasso('info')); desenhar(); } }, '➕ Explicação'),
            CE.el('button', { class: 'botao secundario', 'data-acao': 'add-quiz', onclick: () => { r.passos.push(novoPasso('quiz')); desenhar(); } }, '➕ Pergunta'),
            CE.el('button', { class: 'botao secundario', 'data-acao': 'add-tarefa', onclick: () => { r.passos.push(novoPasso('tarefa')); desenhar(); } }, '➕ Tarefa')),
          CE.el('label', { class: 'painel-campo' }, 'Mensagem do final da aula', ligado('input', r, 'conclusao', { 'data-campo': 'conclusao-aula', placeholder: 'Ex.: Parabéns! Agora você sabe fazer a sua lista de compras.' })),
          erro,
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => { rascunho = null; desenhar(); } }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-acao': 'salvar-aula', onclick: async () => {
              const problema = validar(r);
              if (problema) { erro.textContent = problema; return; }
              r.autor = CE.sessao.usuario.nome;
              try { await CE.aulasProfessor.gravar(r); } catch (e) { erro.textContent = e.message; return; }
              CE.avisar(`✅ Aula "${r.titulo}" salva! Ela já aparece para os alunos em Aulas › Do professor.`);
              CE.emitir('instrutor:aula-salva', { titulo: r.titulo, passos: r.passos.length });
              rascunho = null;
              desenhar();
            } }, '💾 Salvar aula')));
      }

      async function desenhar() {
        clearInterval(timerSala);
        const abas = CE.el('div', { class: 'painel-abas' },
          ...[['progresso', '📊 Progresso da turma'], ['sala', '🖥️ Sala ao vivo'], ['trava', '🧩 Onde a turma trava'], ['certificados', '📜 Certificados e relatório'], ['criar', '📝 Criar aulas'], ['alunos', '👥 Alunos']].map(([id, rotulo]) =>
            CE.el('button', { class: 'chip' + (aba === id ? ' ativo' : ''), 'data-aba': id, onclick: () => { aba = id; desenhar(); } }, rotulo)));
        if (aba === 'sala') {
          corpo.replaceChildren(abas, await salaAoVivo());
          timerSala = setInterval(atualizarSala, 3000);
          return;
        }
        if (aba === 'criar') {
          // Guarda a posição da rolagem para o editor não "pular" a cada mudança.
          const antes = corpo.querySelector('.painel-criar');
          const rolagem = antes ? antes.scrollTop : 0;
          const area = await criarAulas();
          corpo.replaceChildren(abas, area);
          area.scrollTop = rolagem;
          return;
        }
        if (aba === 'trava' || aba === 'certificados') {
          const antes = corpo.querySelector('.painel-rolagem.extras');
          const rolagem = antes ? antes.scrollTop : 0;
          const tela = aba === 'trava' ? await CE.painelExtras.ondeTrava(estadoExtras, desenhar) : await CE.painelExtras.certificadosERelatorio(estadoExtras, desenhar);
          const area = CE.el('div', { class: 'painel-rolagem extras' }, tela);
          corpo.replaceChildren(abas, area);
          area.scrollTop = rolagem;
          return;
        }
        const conteudo = aba === 'progresso'
          ? [await tabelaProgresso()]
          : await (async () => {
            const lista = CE.el('div', { class: 'painel-rolagem' }, await tabelaAlunos());
            const atualizarLista = async () => lista.replaceChildren(await tabelaAlunos());
            return [CE.el('div', { class: 'painel-duas-colunas' }, await formularioNovo(atualizarLista), lista)];
          })();
        corpo.replaceChildren(abas, ...conteudo);
      }

      desenhar();
      return { aoFechar() { clearInterval(timerSala); return true; } };
    },
  });
})();
