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

      async function desenhar() {
        const abas = CE.el('div', { class: 'painel-abas' },
          ...[['progresso', '📊 Progresso da turma'], ['alunos', '👥 Alunos']].map(([id, rotulo]) =>
            CE.el('button', { class: 'chip' + (aba === id ? ' ativo' : ''), onclick: () => { aba = id; desenhar(); } }, rotulo)));
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
    },
  });
})();
