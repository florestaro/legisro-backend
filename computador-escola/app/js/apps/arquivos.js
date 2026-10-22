// Arquivos (parecido com o Explorador de Arquivos) e Lixeira: pastas e subpastas, abrir, renomear, copiar,
// recortar, colar, arrastar para outra pasta, pesquisar, pen drive e lixeira.
(function () {
  const TIPOS = {
    pasta: { icone: '📁', nome: 'Pasta' },
    documento: { icone: '📄', app: 'editor', nome: 'Documento de texto' },
    imagem: { icone: '🖼️', app: 'desenho', nome: 'Desenho' },
    planilha: { icone: '📊', app: 'planilha', nome: 'Planilha' },
    pdf: { icone: '📕', app: 'leitor-pdf', nome: 'Documento PDF' },
    apresentacao: { icone: '📽️', app: 'apresentacoes', nome: 'Apresentação' },
    zip: { icone: '🗜️', nome: 'Arquivo compactado (ZIP)' },
  };
  const NOME_LOCAL = { pc: 'Meus Documentos', pendrive: 'Pen drive (E:)', lixeira: 'Lixeira' };
  const { juntar, dentroDe } = CE.caminhos;

  // Área de transferência dos arquivos (vale para todas as janelas do Arquivos).
  CE.areaTransferenciaArquivos = null; // { id, nome, modo: 'copiar' | 'recortar' }

  function criarExplorador(localInicial) {
    return function abrir(corpo, janela, argumento) {
      let lugar = { local: (argumento && argumento.pasta === 'lixeira') ? 'lixeira' : localInicial, pasta: '' };
      let selecionado = null;
      let termo = '';
      let ordem = 'nome'; // Classificar por: nome, data ou tipo (botão direito no espaço vazio)
      const lista = CE.el('div', { class: 'arq-lista', role: 'list' });
      const status = CE.el('div', { class: 'arq-status' });
      const caminho = CE.el('div', { class: 'arq-caminho' });
      const lateral = CE.el('nav', { class: 'arq-lateral' });
      const barra = CE.el('div', { class: 'ferramentas' });
      const busca = CE.el('input', { class: 'arq-busca', placeholder: '🔍 Pesquisar arquivos', 'aria-label': 'Pesquisar arquivos', 'data-acao': 'pesquisar' });

      const avisoErro = (e) => CE.avisar('⚠️ ' + e.message);
      const tudo = () => CE.sessao.arquivos();
      const compat = (l) => (l.local === 'pc' && !l.pasta ? 'documentos' : l.local === 'lixeira' ? 'lixeira' : l.local === 'pendrive' && !l.pasta ? 'pendrive' : `${l.local}:${l.pasta}`);

      function irPara(novo) {
        if (novo.local === 'pendrive' && !CE.pendrive.conectado) { CE.avisar('O pen drive não está conectado.'); return; }
        lugar = { local: novo.local, pasta: novo.pasta || '' };
        selecionado = null;
        termo = '';
        busca.value = '';
        desenhar();
        CE.emitir('pasta:aberta', { pasta: compat(lugar), local: lugar.local, caminho: lugar.pasta });
      }

      function subir() {
        if (!lugar.pasta) return;
        const partes = lugar.pasta.split('/');
        partes.pop();
        irPara({ local: lugar.local, pasta: partes.join('/') });
      }

      function abrirItem(item) {
        if (!item) return;
        if (item.tipo === 'pasta') { irPara({ local: item.local || 'pc', pasta: juntar(item.pasta, item.nome) }); return; }
        if (item.tipo === 'zip') { verZip(item); return; }
        CE.janelas.abrir(TIPOS[item.tipo].app, { arquivo: item });
      }

      // ---------- Compactar (ZIP) ----------
      async function compactar() {
        if (!selecionado) return;
        const r = await CE.sessao.compactar(selecionado.id);
        if (!r) return;
        CE.avisar(`🗜️ "${r.zip.nome}" criado com ${r.arquivos} arquivo${r.arquivos === 1 ? '' : 's'} dentro. Ficou menor e é um arquivo só: ótimo para mandar por e-mail!`);
        selecionado = null;
        desenhar();
      }
      async function extrair(zip = selecionado) {
        if (!zip || zip.tipo !== 'zip') { CE.avisar('Selecione um arquivo compactado (🗜️) para extrair.'); return; }
        const pasta = await CE.sessao.extrair(zip.id);
        if (!pasta) return;
        CE.avisar(`📂 Arquivos extraídos para a pasta "${pasta.nome}".`);
        selecionado = null;
        desenhar();
      }
      function verZip(zip) {
        let itens = [];
        try { itens = JSON.parse(zip.conteudo || '{}').itens || []; } catch { itens = []; }
        CE.emitir('arquivo:zip-aberto', { nome: zip.nome, itens: itens.length });
        const fundo = CE.el('div', { class: 'dialogo-fundo' },
          CE.el('div', { class: 'dialogo' },
            CE.el('p', {}, `🗜️ ${zip.nome} — o que tem dentro:`),
            CE.el('div', { class: 'arq-zip-lista' }, ...itens.map((i) => CE.el('div', {}, `${(TIPOS[i.tipo] || TIPOS.documento).icone} ${i.pasta ? i.pasta + '/' : ''}${i.nome}`))),
            CE.el('p', { class: 'ed-dica' }, 'Para usar os arquivos, primeiro EXTRAIA (tire de dentro do ZIP).'),
            CE.el('div', { class: 'dialogo-botoes' },
              CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Fechar'),
              CE.el('button', { class: 'botao', 'data-acao': 'extrair-tudo', onclick: () => { fundo.remove(); extrair(zip); } }, '📂 Extrair tudo'))));
        document.body.append(fundo);
      }

      // Um nome que ainda não existe nesta pasta: "Nova pasta", "Nova pasta (2)"... (como o Windows faz).
      async function nomeLivre(base) {
        const aqui = (await tudo()).filter((a) => !a.naLixeira && (a.local || 'pc') === lugar.local && (a.pasta || '') === lugar.pasta).map((a) => a.nome.toLowerCase());
        if (!aqui.includes(base.toLowerCase())) return base;
        let n = 2;
        while (aqui.includes(`${base} (${n})`.toLowerCase())) n++;
        return `${base} (${n})`;
      }

      async function novaPasta() {
        const nome = await CE.perguntar('Qual o nome da nova pasta?', await nomeLivre('Nova pasta'));
        if (!nome) return;
        try { await CE.sessao.criarPasta(nome, lugar.local, lugar.pasta); desenhar(); } catch (e) { avisoErro(e); }
      }

      // Botão direito › Novo › Documento de texto ou Planilha: cria o arquivo vazio aqui e pergunta o nome.
      const NOVOS = { documento: ['Novo documento', ''], planilha: ['Nova planilha', JSON.stringify({ celulas: {}, larguras: {} })] };
      async function novoArquivo(tipo) {
        const [base, conteudo] = NOVOS[tipo];
        const nome = await CE.perguntar(`Qual o nome do novo ${TIPOS[tipo].nome.toLowerCase()}?`, await nomeLivre(base));
        if (!nome || !nome.trim()) return;
        const limpo = nome.trim().replace(/[\\/]/g, '-');
        if ((await nomeLivre(limpo)) !== limpo) { CE.avisar(`Já existe um arquivo chamado "${limpo}" aqui. Escolha outro nome.`); return; }
        const criado = await CE.sessao.salvarArquivo({ nome: limpo, tipo, conteudo, local: lugar.local, pasta: lugar.pasta });
        CE.emitir('arquivo:novo', { nome: limpo, tipo, local: lugar.local, pasta: lugar.pasta });
        selecionado = criado;
        desenhar();
      }

      // Botão direito › Enviar para › Pen drive: copia para a raiz do pen drive.
      async function enviarParaPendrive(item) {
        if (!CE.pendrive.conectado) { CE.avisar('Conecte o pen drive primeiro (ícone 🔌 na barra de tarefas).'); return; }
        try {
          await CE.sessao.copiarArquivo(item.id, 'pendrive', '');
          CE.avisar(`💾 "${item.nome}" foi copiado para o Pen drive (E:).`);
          CE.emitir('arquivo:enviado', { nome: item.nome, tipo: item.tipo, para: 'pendrive' });
        } catch (e) { avisoErro(e); }
      }

      const tamanhoDe = (a, todos) => {
        const bytes = a.tipo === 'pasta'
          ? todos.filter((x) => !x.naLixeira && (x.local || 'pc') === (a.local || 'pc') && dentroDe(x.pasta || '', juntar(a.pasta, a.nome))).reduce((s, x) => s + String(x.conteudo || '').length, 0)
          : String(a.conteudo || '').length;
        return bytes < 1024 ? `${bytes} bytes` : bytes < 1024 * 1024 ? `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB` : `${(bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
      };
      const ondeFica = (local, pasta) => ['Este Computador', NOME_LOCAL[local], ...(pasta ? pasta.split('/') : [])].join(' › ');
      const quando = (t) => (t ? new Date(t).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }) : '—');

      async function propriedades(a) {
        const todos = await tudo();
        const local = a.local || 'pc';
        let conteudo = null;
        if (a.tipo === 'pasta') {
          const dentro = todos.filter((x) => !x.naLixeira && (x.local || 'pc') === local && dentroDe(x.pasta || '', juntar(a.pasta, a.nome)));
          const pastas = dentro.filter((x) => x.tipo === 'pasta').length;
          conteudo = `${dentro.length - pastas} arquivo${dentro.length - pastas === 1 ? '' : 's'}, ${pastas} pasta${pastas === 1 ? '' : 's'}`;
        }
        CE.mostrarPropriedades(a.nome, TIPOS[a.tipo].icone, [
          ['Tipo', TIPOS[a.tipo].nome],
          a.tipo !== 'pasta' && TIPOS[a.tipo].app ? ['Abre com', CE.app(TIPOS[a.tipo].app) ? CE.app(TIPOS[a.tipo].app).nome : '—'] : null,
          ['Local', a.naLixeira ? 'Lixeira' : ondeFica(local, a.pasta || '')],
          ['Tamanho', tamanhoDe(a, todos)],
          conteudo ? ['Contém', conteudo] : null,
          ['Criado em', quando(a.criadoEm)],
          a.naLixeira ? ['Excluído em', quando(a.excluidoEm)] : ['Modificado em', quando(a.alteradoEm)],
        ], 'arquivo');
      }

      async function propriedadesDoLugar() {
        const todos = await tudo();
        const dentro = todos.filter((x) => !x.naLixeira && (x.local || 'pc') === lugar.local && (!lugar.pasta || dentroDe(x.pasta || '', lugar.pasta)));
        CE.mostrarPropriedades(lugar.pasta ? lugar.pasta.split('/').pop() : NOME_LOCAL[lugar.local], lugar.local === 'pendrive' ? '💾' : '📁', [
          ['Local', ondeFica(lugar.local, lugar.pasta)],
          ['Contém', `${dentro.filter((x) => x.tipo !== 'pasta').length} arquivo(s), ${dentro.filter((x) => x.tipo === 'pasta').length} pasta(s)`],
          lugar.local === 'pendrive' ? ['Espaço', 'Pen drive de treino de 8 GB (quase todo livre)'] : null,
        ], 'pasta');
      }

      // ---------- Menus do botão direito ----------
      const op = (id, rotulo, icone, acao, extra = {}) => ({ id, rotulo, icone, acao, ...extra });
      function menuDoItem(e, a) {
        if (lugar.local === 'lixeira') {
          CE.menuContexto.abrir(e, 'lixeira', [
            op('restaurar', 'Restaurar', '↩️', () => restaurarItem(a), { negrito: true }),
            '-',
            op('excluir', 'Excluir', '❌', () => apagarItem(a), { atalho: 'Delete' }),
            '-',
            op('propriedades', 'Propriedades', 'ℹ️', () => propriedades(a)),
          ], a.nome);
          return;
        }
        const local = a.local || 'pc';
        CE.menuContexto.abrir(e, 'arquivos', [
          op('abrir', 'Abrir', '📂', () => abrirItem(a), { negrito: true }),
          a.tipo === 'zip' ? op('extrair', 'Extrair tudo...', '📂', () => extrair(a)) : null,
          '-',
          op('recortar', 'Recortar', '✂️', () => guardar('recortar'), { atalho: 'Ctrl+X' }),
          op('copiar', 'Copiar', '📋', () => guardar('copiar'), { atalho: 'Ctrl+C' }),
          a.tipo === 'pasta' && CE.areaTransferenciaArquivos ? op('colar-na-pasta', 'Colar', '📌', () => colarEm({ local, pasta: juntar(a.pasta, a.nome) }), { atalho: 'Ctrl+V' }) : null,
          '-',
          op('excluir', 'Excluir', '🗑️', excluir, { atalho: 'Delete' }),
          op('renomear', 'Renomear', '✏️', renomear, { atalho: 'F2' }),
          '-',
          op('enviar-para', 'Enviar para', '📤', null, { submenu: [
            op('enviar-pendrive', 'Pen drive (E:)', '💾', () => enviarParaPendrive(a), { desativado: !CE.pendrive.conectado || local === 'pendrive', dica: CE.pendrive.conectado ? '' : 'Conecte o pen drive primeiro' }),
            a.tipo !== 'zip' ? op('enviar-zip', 'Pasta compactada (zipada)', '🗜️', compactar) : null,
          ] }),
          '-',
          op('propriedades', 'Propriedades', 'ℹ️', () => propriedades(a)),
        ], a.nome);
      }

      function menuDoEspacoVazio(e) {
        if (lugar.local === 'lixeira') {
          CE.menuContexto.abrir(e, 'lixeira', [
            op('esvaziar-lixeira', 'Esvaziar Lixeira', '🧹', esvaziar),
            '-',
            submenuClassificar(),
            op('atualizar', 'Atualizar', '🔄', () => desenhar()),
          ]);
          return;
        }
        const area = CE.areaTransferenciaArquivos;
        CE.menuContexto.abrir(e, 'arquivos-vazio', [
          submenuClassificar(),
          op('atualizar', 'Atualizar', '🔄', () => desenhar()),
          '-',
          op('colar', area ? `Colar "${area.nome}"` : 'Colar', '📌', colar, { atalho: 'Ctrl+V', desativado: !area || !!termo }),
          '-',
          op('novo', 'Novo', '✨', null, { desativado: !!termo, submenu: [
            op('nova-pasta', 'Pasta', '📁', novaPasta),
            '-',
            op('novo-documento', 'Documento de texto', '📄', () => novoArquivo('documento')),
            op('nova-planilha', 'Planilha', '📊', () => novoArquivo('planilha')),
          ] }),
          '-',
          op('propriedades', 'Propriedades', 'ℹ️', propriedadesDoLugar),
        ]);
      }

      function submenuClassificar() {
        const por = (id, rotulo) => op('classificar-' + id, rotulo, '', () => { ordem = id; desenhar(); CE.emitir('arquivos:classificados', { por: id }); }, { marcado: ordem === id });
        return op('classificar', 'Classificar por', '⇅', null, { submenu: [por('nome', 'Nome'), por('data', 'Data de modificação'), por('tipo', 'Tipo')] });
      }

      async function restaurarItem(a) { await CE.sessao.restaurarArquivo(a.id); CE.avisar(`"${a.nome}" foi restaurado.`); selecionado = null; desenhar(); }
      async function apagarItem(a) {
        if (!await CE.confirmar(`Apagar "${a.nome}" para sempre? Não dá para desfazer.`)) return;
        await CE.sessao.apagarDeVez(a.id); selecionado = null; desenhar();
      }
      async function esvaziar() {
        const itens = (await tudo()).filter((a) => a.naLixeira && (!a.grupoLixeira || a.grupoLixeira === a.id));
        if (!itens.length) { CE.avisar('A Lixeira já está vazia.'); return; }
        if (!await CE.confirmar('Esvaziar a lixeira? Todos os arquivos dela serão apagados para sempre.')) return;
        await CE.sessao.esvaziarLixeira(); selecionado = null; desenhar();
      }

      async function renomear() {
        if (!selecionado) return;
        const nome = await CE.perguntar('Qual o novo nome?', selecionado.nome);
        if (nome && nome !== selecionado.nome) { await CE.sessao.renomearArquivo(selecionado.id, nome); desenhar(); }
      }

      async function excluir() {
        if (!selecionado) return;
        const oQue = selecionado.tipo === 'pasta' ? `a pasta "${selecionado.nome}" (e tudo o que tem dentro)` : `"${selecionado.nome}"`;
        if (await CE.confirmar(`Mandar ${oQue} para a lixeira?`)) {
          await CE.sessao.removerArquivo(selecionado.id);
          CE.avisar(`"${selecionado.nome}" foi para a lixeira.`);
          selecionado = null;
          desenhar();
        }
      }

      function guardar(modo) {
        if (!selecionado) return;
        CE.areaTransferenciaArquivos = { id: selecionado.id, nome: selecionado.nome, modo };
        CE.avisar(modo === 'copiar' ? `📋 "${selecionado.nome}" copiado. Agora vá até a pasta de destino e clique em Colar.` : `✂️ "${selecionado.nome}" recortado. Vá até a pasta de destino e clique em Colar.`);
        CE.emitir(modo === 'copiar' ? 'arquivo:copiado-area' : 'arquivo:recortado', { nome: selecionado.nome, tipo: selecionado.tipo });
        desenhar();
      }

      async function colar() { if (lugar.local !== 'lixeira') await colarEm(lugar); }
      // Colar aqui ou dentro de uma pasta (botão direito na pasta › Colar).
      async function colarEm(destino) {
        const area = CE.areaTransferenciaArquivos;
        if (!area) return;
        try {
          if (area.modo === 'copiar') await CE.sessao.copiarArquivo(area.id, destino.local, destino.pasta);
          else { await CE.sessao.moverArquivo(area.id, destino.local, destino.pasta); CE.areaTransferenciaArquivos = null; }
          CE.emitir('arquivo:colado', { nome: area.nome, modo: area.modo, local: destino.local, pasta: destino.pasta });
          desenhar();
        } catch (e) { avisoErro(e); }
      }

      async function soltarEm(destino, idArrastado) {
        if (!idArrastado) return;
        const item = (await tudo()).find((a) => a.id === idArrastado);
        if (!item || ((item.local || 'pc') === destino.local && (item.pasta || '') === destino.pasta)) return;
        try {
          // Arrastar para outro lugar (pen drive <-> computador) copia; dentro do mesmo lugar, move. Igual ao Windows.
          if ((item.local || 'pc') !== destino.local) {
            await CE.sessao.copiarArquivo(item.id, destino.local, destino.pasta);
            CE.avisar(`📋 "${item.nome}" copiado para ${NOME_LOCAL[destino.local]}${destino.pasta ? ' › ' + destino.pasta.split('/').join(' › ') : ''}.`);
          } else {
            await CE.sessao.moverArquivo(item.id, destino.local, destino.pasta);
          }
          CE.emitir('arquivo:arrastado', { nome: item.nome, local: destino.local, pasta: destino.pasta });
          desenhar();
        } catch (e) { avisoErro(e); }
      }

      function alvoDeSoltura(el, destino) {
        el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('soltar-aqui'); });
        el.addEventListener('dragleave', () => el.classList.remove('soltar-aqui'));
        el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('soltar-aqui'); if (destino) soltarEm(destino, e.dataTransfer.getData('text/plain')); });
      }

      const botao = (acao, rotulo, funcao, sempre = false) => {
        const b = CE.el('button', { class: 'ferramenta texto', 'data-acao': acao, onclick: funcao }, rotulo);
        b.dataset.precisaSelecao = sempre ? '' : 'sim';
        return b;
      };

      function desenharLateral(todos) {
        const pastasDe = (local, pai) => todos.filter((a) => !a.naLixeira && a.tipo === 'pasta' && (a.local || 'pc') === local && (a.pasta || '') === pai)
          .sort((a, b) => a.nome.localeCompare(b.nome));
        const ramo = (local, pai, nivel) => pastasDe(local, pai).flatMap((p) => {
          const destino = { local, pasta: juntar(pai, p.nome) };
          const el = CE.el('button', {
            class: 'arq-pasta sub' + (lugar.local === local && lugar.pasta === destino.pasta ? ' ativa' : ''),
            'data-pasta': `${local}:${destino.pasta}`, style: `padding-left:${12 + nivel * 16}px`, onclick: () => irPara(destino),
          }, `📁 ${p.nome}`);
          alvoDeSoltura(el, destino);
          return [el, ...ramo(local, destino.pasta, nivel + 1)];
        });
        const raiz = (local, rotulo, dataPasta) => {
          const el = CE.el('button', { class: 'arq-pasta' + (lugar.local === local && (!lugar.pasta || local === 'lixeira') ? ' ativa' : ''), 'data-pasta': dataPasta, onclick: () => irPara({ local, pasta: '' }) }, rotulo);
          if (local !== 'lixeira') alvoDeSoltura(el, { local, pasta: '' });
          // Botão direito na lateral: abrir; no pen drive, "Ejetar"; na Lixeira, "Esvaziar Lixeira".
          el.addEventListener('contextmenu', (e) => CE.menuContexto.abrir(e, 'arquivos-lateral', [
            op('abrir', 'Abrir', '📂', () => irPara({ local, pasta: '' }), { negrito: true }),
            local === 'pendrive' ? '-' : null,
            local === 'pendrive' ? op('ejetar', 'Ejetar', '⏏️', () => { if (lugar.local === 'pendrive') irPara({ local: 'pc', pasta: '' }); CE.pendrive.remover(); }) : null,
            local === 'lixeira' ? '-' : null,
            local === 'lixeira' ? op('esvaziar-lixeira', 'Esvaziar Lixeira', '🧹', esvaziar) : null,
          ].filter(Boolean), local));
          return el;
        };
        const naLixeira = todos.filter((a) => a.naLixeira && a.grupoLixeira === a.id).length + todos.filter((a) => a.naLixeira && !a.grupoLixeira).length;
        const itens = [raiz('pc', '🖥️ Meus Documentos', 'documentos'), ...ramo('pc', '', 1)];
        if (CE.pendrive.conectado) {
          itens.push(raiz('pendrive', '💾 Pen drive (E:)', 'pendrive'), ...ramo('pendrive', '', 1),
            CE.el('button', { class: 'arq-ejetar', 'data-acao': 'remover-pendrive', onclick: () => { if (lugar.local === 'pendrive') irPara({ local: 'pc', pasta: '' }); CE.pendrive.remover(); } }, '⏏️ Remover com segurança'));
        }
        const lixeiraEl = raiz('lixeira', `🗑️ Lixeira${naLixeira ? ` (${naLixeira})` : ''}`, 'lixeira');
        alvoDeSoltura(lixeiraEl, null);
        lixeiraEl.addEventListener('drop', async (e) => {
          const id = e.dataTransfer.getData('text/plain');
          if (id) { await CE.sessao.removerArquivo(id); desenhar(); }
        });
        itens.push(lixeiraEl);
        lateral.replaceChildren(...itens);
      }

      async function desenhar() {
        if (lugar.local === 'pendrive' && !CE.pendrive.conectado) lugar = { local: 'pc', pasta: '' };
        const todos = await tudo();
        desenharLateral(todos);
        const naLixeira = lugar.local === 'lixeira';
        let itens;
        if (termo) {
          const t = termo.toLowerCase();
          // A pesquisa procura em todo lugar (computador e pen drive conectado), menos na lixeira.
          itens = todos.filter((a) => !a.naLixeira && ((a.local || 'pc') === 'pc' || CE.pendrive.conectado) && a.nome.toLowerCase().includes(t));
        } else if (naLixeira) {
          itens = todos.filter((a) => a.naLixeira && (!a.grupoLixeira || a.grupoLixeira === a.id));
        } else {
          itens = todos.filter((a) => !a.naLixeira && (a.local || 'pc') === lugar.local && (a.pasta || '') === lugar.pasta);
        }
        const comparar = {
          nome: (a, b) => a.nome.localeCompare(b.nome),
          data: (a, b) => (b.alteradoEm || 0) - (a.alteradoEm || 0) || a.nome.localeCompare(b.nome),
          tipo: (a, b) => TIPOS[a.tipo].nome.localeCompare(TIPOS[b.tipo].nome) || a.nome.localeCompare(b.nome),
        }[ordem];
        itens.sort((a, b) => (a.tipo === 'pasta') === (b.tipo === 'pasta') ? comparar(a, b) : a.tipo === 'pasta' ? -1 : 1);
        if (selecionado && !itens.some((a) => a.id === selecionado.id)) selecionado = null;

        janela.definirTitulo(termo ? `Pesquisa: ${termo}` : lugar.pasta ? lugar.pasta.split('/').pop() : NOME_LOCAL[lugar.local]);
        caminho.replaceChildren(...[
          lugar.pasta && !naLixeira ? CE.el('button', { class: 'arq-subir', 'data-acao': 'subir', title: 'Voltar uma pasta', onclick: subir }, '⬆️') : null,
          CE.el('span', {}, termo ? `Resultados da pesquisa por "${termo}"` : ['Este Computador', NOME_LOCAL[lugar.local], ...(lugar.pasta ? lugar.pasta.split('/') : [])].join(' › ')),
        ].filter(Boolean));

        const area = CE.areaTransferenciaArquivos;
        const grupo = naLixeira
          ? [botao('restaurar', '↩️ Restaurar', async () => { await CE.sessao.restaurarArquivo(selecionado.id); CE.avisar(`"${selecionado.nome}" foi restaurado.`); selecionado = null; desenhar(); }),
            botao('apagar', '❌ Apagar de vez', async () => {
              if (!await CE.confirmar(`Apagar "${selecionado.nome}" para sempre? Não dá para desfazer.`)) return;
              await CE.sessao.apagarDeVez(selecionado.id); selecionado = null; desenhar();
            }),
            itens.length ? botao('esvaziar', '🧹 Esvaziar lixeira', async () => {
              if (!await CE.confirmar('Esvaziar a lixeira? Todos os arquivos dela serão apagados para sempre.')) return;
              await CE.sessao.esvaziarLixeira(); selecionado = null; desenhar();
            }, true) : null]
          : [botao('nova-pasta', '📁 Nova pasta', novaPasta, true),
            botao('abrir', '📂 Abrir', () => abrirItem(selecionado)),
            botao('renomear', '✏️ Renomear', renomear),
            botao('copiar', '📋 Copiar', () => guardar('copiar')),
            botao('recortar', '✂️ Recortar', () => guardar('recortar')),
            botao('colar', `📌 Colar${area ? ` "${area.nome}"` : ''}`, colar, true),
            botao('excluir', '🗑️ Excluir', excluir),
            botao('compactar', '🗜️ Compactar', compactar),
            botao('extrair', '📂 Extrair', () => extrair())];
        barra.replaceChildren(CE.el('div', { class: 'ferramentas-grupo' }, ...grupo), CE.el('div', { class: 'ferramentas-grupo arq-busca-grupo' }, busca));
        barra.querySelectorAll('[data-precisa-selecao="sim"]').forEach((b) => { b.disabled = !selecionado; });
        const botaoColar = barra.querySelector('[data-acao="colar"]');
        if (botaoColar) botaoColar.disabled = !area;
        const botaoExtrair = barra.querySelector('[data-acao="extrair"]');
        if (botaoExtrair) botaoExtrair.disabled = !(selecionado && selecionado.tipo === 'zip');

        if (!itens.length) {
          lista.replaceChildren(CE.el('p', { class: 'arq-vazio' }, termo ? 'Nenhum arquivo encontrado com esse nome.' : naLixeira
            ? 'A lixeira está vazia. Os arquivos que você excluir vêm para cá e podem ser restaurados.'
            : 'Esta pasta está vazia. Os documentos que você salvar ou colar aparecem aqui.'));
          status.textContent = '0 itens';
          return;
        }
        lista.replaceChildren(...itens.map((a) => {
          const item = CE.el('button', {
            class: 'arq-item' + (selecionado && selecionado.id === a.id ? ' selecionado' : '') + (area && area.id === a.id && area.modo === 'recortar' ? ' recortado' : ''),
            role: 'listitem', 'data-arquivo': a.nome, 'data-tipo': a.tipo, draggable: naLixeira ? 'false' : 'true',
          },
            CE.el('span', { class: 'arq-icone' }, TIPOS[a.tipo].icone),
            CE.el('span', { class: 'arq-nome' }, a.nome, termo ? CE.el('small', {}, ` — ${NOME_LOCAL[a.local || 'pc']}${a.pasta ? ' › ' + a.pasta.split('/').join(' › ') : ''}`) : null),
            CE.el('span', { class: 'arq-data' }, new Date(naLixeira ? a.excluidoEm : a.alteradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })),
            CE.el('span', { class: 'arq-tipo' }, TIPOS[a.tipo].nome),
          );
          const selecionar = () => {
            selecionado = a;
            lista.querySelectorAll('.arq-item').forEach((i) => i.classList.remove('selecionado'));
            item.classList.add('selecionado');
            barra.querySelectorAll('[data-precisa-selecao="sim"]').forEach((b) => { b.disabled = false; });
            const ext = barra.querySelector('[data-acao="extrair"]');
            if (ext) ext.disabled = a.tipo !== 'zip';
            status.textContent = `"${a.nome}" selecionado`;
            CE.emitir('arquivo:selecionado', { nome: a.nome, tipo: a.tipo, pasta: compat(lugar), local: a.local || 'pc', caminho: a.pasta || '' });
          };
          item.addEventListener('click', selecionar);
          // Botão direito: seleciona o item e mostra o menu dele.
          item.addEventListener('contextmenu', (e) => { if (!selecionado || selecionado.id !== a.id) selecionar(); menuDoItem(e, a); });
          item.addEventListener('dblclick', () => { if (!naLixeira) abrirItem(a); });
          item.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'copyMove'; });
          if (a.tipo === 'pasta' && !naLixeira) alvoDeSoltura(item, { local: a.local || 'pc', pasta: juntar(a.pasta, a.nome) });
          return item;
        }));
        status.textContent = `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`;
      }

      // Atalhos de teclado do Explorador.
      corpo.addEventListener('keydown', (e) => {
        if (e.target === busca) return;
        const ctrl = e.ctrlKey || e.metaKey;
        const tecla = e.key.toLowerCase();
        const atalho = (nome, funcao) => { e.preventDefault(); funcao(); CE.emitir('atalho:usado', { atalho: nome, app: 'arquivos' }); };
        if (ctrl && tecla === 'c') atalho('Ctrl+C', () => guardar('copiar'));
        else if (ctrl && tecla === 'x') atalho('Ctrl+X', () => guardar('recortar'));
        else if (ctrl && tecla === 'v') atalho('Ctrl+V', colar);
        else if (e.key === 'Delete' && lugar.local !== 'lixeira') atalho('Delete', excluir);
        else if (e.key === 'F2') atalho('F2', renomear);
        else if (e.key === 'Enter' && selecionado && lugar.local !== 'lixeira') atalho('Enter', () => abrirItem(selecionado));
        else if (e.key === 'Backspace') atalho('Backspace', subir);
      });
      lista.addEventListener('contextmenu', (e) => { if (!e.defaultPrevented && !e.target.closest('.arq-item')) menuDoEspacoVazio(e); });
      busca.addEventListener('input', () => {
        termo = busca.value.trim();
        selecionado = null;
        desenhar();
        if (termo) CE.emitir('arquivos:pesquisa', { termo });
      });

      corpo.classList.add('arquivos');
      corpo.append(
        barra,
        CE.el('div', { class: 'arq-principal' },
          lateral,
          CE.el('div', { class: 'arq-conteudo' },
            caminho,
            CE.el('div', { class: 'arq-cabecalho' }, CE.el('span', {}, 'Nome'), CE.el('span', {}, 'Data'), CE.el('span', {}, 'Tipo')),
            lista,
          ),
        ),
        status,
      );
      desenhar();
      const parar = ['arquivo:salvo', 'arquivo:removido', 'arquivo:restaurado', 'arquivo:apagado', 'arquivo:movido', 'arquivo:copiado', 'arquivo:renomeado', 'pasta:criada', 'lixeira:esvaziada', 'pendrive:conectado', 'pendrive:removido']
        .map((ev) => CE.ouvir(ev, () => desenhar()));
      return {
        receber(arg) {
          if (arg && arg.pasta === 'lixeira') irPara({ local: 'lixeira', pasta: '' });
          else if (arg && arg.local) irPara({ local: arg.local, pasta: arg.caminho || '' });
        },
        aoFechar() { parar.forEach((f) => f()); return true; },
      };
    };
  }

  CE.TIPOS_ARQUIVO = TIPOS;
  CE.registrarApp({ id: 'arquivos', nome: 'Arquivos', icone: '📁', largura: 860, altura: 520, abrir: criarExplorador('pc') });
  CE.registrarApp({ id: 'lixeira', nome: 'Lixeira', icone: '🗑️', largura: 760, altura: 460, abrir: criarExplorador('lixeira') });
})();
