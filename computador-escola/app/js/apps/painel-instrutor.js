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
        const erro = CE.el('p', { class: 'login-erro' });
        const turmas = [...new Set((await CE.api.chamar('usuarios:listar')).map((u) => u.turma).filter(Boolean))];
        const avatares = CE.el('div', { class: 'painel-avatares' }, ...AVATARES.map((a) => CE.el('button', {
          class: 'painel-avatar' + (a === avatar ? ' ativo' : ''),
          onclick: (e) => { avatar = a; avatares.querySelectorAll('button').forEach((b) => b.classList.remove('ativo')); e.currentTarget.classList.add('ativo'); },
        }, a)));
        const salvar = async () => {
          try {
            await CE.api.chamar('usuarios:criar', { nome: nome.value, turma: turma.value.trim(), segredo: senha.value, papel: papel.value, avatar });
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
            CE.el('td', {}, u.papel === 'instrutor' ? 'Instrutor' : 'Aluno'),
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
        const linhas = await Promise.all(alunos.map(async (u) => {
          const p = await CE.sessao.progresso(u.id);
          const licoes = CE.LICOES.map((l) => p.licoes && p.licoes[l.id] && p.licoes[l.id].concluida);
          const dig = Object.values(p.digitacao || {});
          const melhorPpm = dig.length ? Math.max(...dig.map((d) => d.ppm)) : 0;
          const estrelas = dig.reduce((s, d) => s + d.estrelas, 0);
          return CE.el('tr', {},
            CE.el('td', {}, `${u.avatar} ${u.nome}`),
            CE.el('td', {}, u.turma || '—'),
            ...licoes.map((ok, i) => CE.el('td', { class: 'painel-celula', title: CE.LICOES[i].titulo }, ok ? '✅' : '·')),
            CE.el('td', {}, `${dig.length}/${CE.exerciciosDigitacao.length} · ${estrelas}★`),
            CE.el('td', {}, melhorPpm ? `${melhorPpm} ppm` : '—'),
          );
        }));
        return CE.el('div', { class: 'painel-rolagem' }, CE.el('table', { class: 'painel-tabela' },
          CE.el('thead', {}, CE.el('tr', {},
            CE.el('th', {}, 'Aluno'), CE.el('th', {}, 'Turma'),
            ...CE.LICOES.map((l) => CE.el('th', { class: 'painel-celula', title: l.titulo }, l.icone)),
            CE.el('th', {}, 'Digitação'), CE.el('th', {}, 'Melhor velocidade'),
          )),
          CE.el('tbody', {}, ...linhas),
        ), CE.el('p', { class: 'painel-legenda' }, 'Passe o mouse sobre os ícones para ver o nome de cada aula. ppm = palavras por minuto.'));
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
