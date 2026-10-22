// Correio: e-mail de treino. O aluno cria a conta, lê, responde, encaminha, anexa arquivos, baixa anexos,
// marca spam e aprende a reconhecer e-mails falsos. Mensagens para colegas do mesmo computador chegam de verdade
// na caixa deles; mensagens para os "contatos de treino" recebem resposta automática.
(function () {
  const DOMINIO = 'correio.escola';
  const PASTAS = [['entrada', '📥 Caixa de entrada'], ['enviados', '📤 Enviados'], ['spam', '🚫 Spam'], ['lixeira', '🗑️ Lixeira']];

  function figura(emoji) {
    const tela = document.createElement('canvas');
    tela.width = 320; tela.height = 220;
    const ctx = tela.getContext('2d');
    ctx.fillStyle = '#fff8e6'; ctx.fillRect(0, 0, 320, 220);
    ctx.font = '130px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 160, 120);
    return tela.toDataURL('image/png');
  }

  // Contatos de treino que respondem sozinhos.
  const CONTATOS_TREINO = {
    [`professor@${DOMINIO}`]: {
      nome: 'Professor Virtual',
      responder: (m) => ({ assunto: `Re: ${m.assunto || '(sem assunto)'}`, texto: `Olá! Recebi a sua mensagem${m.anexos.length ? ` e o anexo "${m.anexos[0].nome}"` : ''}. Parabéns, você mandou um e-mail direitinho! 🎉\n\nContinue assim.\nProfessor Virtual` }),
    },
    [`maria.clara@${DOMINIO}`]: {
      nome: 'Maria Clara',
      responder: (m) => ({ assunto: `Re: ${m.assunto || '(sem assunto)'}`, texto: `Oi! Que bom receber notícias suas. ${m.anexos.length ? 'Adorei o arquivo que você mandou!' : ''}\n\nBeijos,\nMaria Clara` }),
    },
    [`tio.ze@${DOMINIO}`]: {
      nome: 'Tio Zé',
      responder: (m) => ({ assunto: `Re: ${m.assunto || '(sem assunto)'}`, texto: `Opa! Recebi sim. ${m.anexos.length ? 'Já abri o anexo, ficou bom!' : 'Que bom que você está aprendendo a usar o e-mail!'}\n\nAbraço do Tio Zé` }),
    },
    'rh@empresaboa.com.br': {
      nome: 'RH Empresa Boa',
      responder: (m) => (m.anexos.length
        ? { assunto: `Re: ${m.assunto || 'Currículo'}`, texto: `Prezado(a) candidato(a),\n\nRecebemos o seu currículo ("${m.anexos[0].nome}"). Agradecemos o interesse em trabalhar conosco! Entraremos em contato se o seu perfil for selecionado.\n\nAtenciosamente,\nRecursos Humanos — Empresa Boa` }
        : { assunto: `Re: ${m.assunto || '(sem assunto)'}`, texto: 'Prezado(a),\n\nRecebemos a sua mensagem, mas o currículo NÃO veio anexado. Por favor, envie novamente com o arquivo anexado (botão 📎 Anexar).\n\nAtenciosamente,\nRecursos Humanos — Empresa Boa' }),
    },
  };

  function mensagensIniciais(conta) {
    const agora = Date.now();
    const m = (minutos, dados) => ({ id: `${agora - minutos}${Math.random().toString(16).slice(2, 6)}`, pasta: 'entrada', lida: false, em: agora - minutos * 60000, para: conta.endereco, anexos: [], ...dados });
    return [
      m(300, { de: `equipe@${DOMINIO}`, deNome: 'Equipe Correio', assunto: 'Bem-vindo ao seu e-mail!', lida: false,
        texto: `Olá, ${conta.nome.split(' ')[0]}!\n\nSua conta ${conta.endereco} está pronta. As mensagens que chegam ficam na Caixa de entrada. As que você manda ficam em Enviados. Propagandas e golpes vão para o Spam.\n\nBom uso!\nEquipe Correio` }),
      m(200, { de: `professor@${DOMINIO}`, deNome: 'Professor Virtual', assunto: 'Responda esta mensagem 😉',
        texto: 'Olá! Eu sou o Professor Virtual. Para treinar, clique em "Responder", escreva uma mensagem curta e clique em "Enviar".\n\nUm abraço!' }),
      m(150, { de: `maria.clara@${DOMINIO}`, deNome: 'Maria Clara', assunto: 'A receita que te falei',
        texto: 'Oi! Segue em anexo a receita de bolo de fubá da minha avó. É só baixar e abrir no Editor de Texto.\n\nBeijos!',
        anexos: [{ nome: 'Receita de bolo de fubá', tipo: 'documento', conteudo: '<div><b><font size="5">Bolo de fubá da vovó</font></b></div><ul><li>3 ovos</li><li>2 xícaras de fubá</li><li>1 xícara de açúcar</li><li>1 xícara de leite</li><li>1/2 xícara de óleo</li><li>1 colher de fermento</li></ul><div>Bata tudo no liquidificador e asse por 40 minutos.</div>' }] }),
      m(100, { de: `tio.ze@${DOMINIO}`, deNome: 'Tio Zé', assunto: 'Foto da festa',
        texto: 'Olha a foto da festa de domingo! Que dia bom.\n\nAbraço,\nTio Zé', anexos: [{ nome: 'Foto da festa', tipo: 'imagem', conteudo: figura('🎉') }] }),
      m(60, { de: 'noticias@jornaldobairro.com.br', deNome: 'Jornal do Bairro', assunto: 'As notícias da semana',
        texto: 'Confira as notícias da semana: campanha de vacinação, feira com novo horário e curso gratuito de informática.', links: [{ texto: 'Ler as notícias no site', url: 'jornaldobairro.com.br' }] }),
      m(30, { de: 'seguranca@bancoescola-seguranca.net', deNome: 'Banco Escola', assunto: 'URGENTE: sua conta será BLOQUEADA em 24 horas', golpe: true,
        texto: 'Prezado cliente,\n\nDetectamos uma movimentação suspeita. Sua conta será BLOQUEADA em 24 horas.\nPara evitar o bloqueio, clique no link abaixo e confirme sua agência, conta, senha e o código que chegar por SMS.\n\nAtenciosamente,\nSegurança Banco Escola', links: [{ texto: 'CLIQUE AQUI PARA DESBLOQUEAR', url: 'bancoescola-seguranca.net' }] }),
      m(10, { pasta: 'spam', de: 'premios@ganhe-premio-agora.net', deNome: 'PRÊMIOS', assunto: '🎁 PARABÉNS!!! Você GANHOU um celular novo!!!', golpe: true,
        texto: 'Você foi sorteado! Clique no link e pague só o frete para receber seu prêmio.', links: [{ texto: 'Resgatar prêmio', url: 'ganhe-premio-agora.net' }] }),
    ];
  }

  const formatarData = (t) => {
    const d = new Date(t);
    return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };
  const validoEmail = (t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);

  CE.registrarApp({
    id: 'email',
    nome: 'E-mail',
    icone: '📧',
    largura: 1000,
    altura: 620,
    abrir(corpo, janela) {
      const chave = `email:${CE.sessao.usuario.id}`;
      let caixa = null;
      let pasta = 'entrada';
      let aberta = null;
      let rascunho = null; // { para, assunto, texto, anexos, resposta, encaminhamento }
      let timer = null;

      const ler = () => CE.api.chamar('dados:ler', chave, { conta: null, mensagens: [] });
      // Antes de gravar, junta as mensagens que colegas mandaram nesse meio-tempo (para nenhuma se perder).
      const gravar = async () => {
        const atual = await ler();
        (atual.mensagens || []).forEach((m) => { if (!caixa.mensagens.some((x) => x.id === m.id)) caixa.mensagens.push(m); });
        await CE.api.chamar('dados:salvar', chave, caixa);
      };

      async function iniciar() {
        caixa = await ler();
        if (!caixa.conta) telaCriarConta(); else desenhar();
        timer = setInterval(verificarNovas, 4000);
      }

      // Mensagens de colegas chegam direto no arquivo da caixa; aqui só conferimos de tempos em tempos.
      async function verificarNovas() {
        if (!caixa || !caixa.conta || !corpo.isConnected) return;
        const atual = await ler();
        const novas = atual.mensagens.filter((m) => !caixa.mensagens.some((x) => x.id === m.id));
        if (!novas.length) return;
        caixa.mensagens.push(...novas);
        novas.forEach((m) => { CE.avisar(`📧 Nova mensagem de ${m.deNome || m.de}: "${m.assunto}"`); CE.emitir('email:recebido', { de: m.de, assunto: m.assunto, colega: true }); });
        if (!rascunho) desenhar();
      }

      // ---------- Criar conta ----------
      function telaCriarConta() {
        const u = CE.sessao.usuario;
        const sugestao = u.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
        const nome = CE.el('input', { class: 'campo', value: u.nome, 'data-campo': 'nome' });
        const usuario = CE.el('input', { class: 'campo', value: sugestao, 'data-campo': 'usuario', 'aria-label': 'Nome de usuário' });
        const senha = CE.el('input', { class: 'campo', type: 'password', 'data-campo': 'senha', placeholder: 'Mínimo de 6 caracteres' });
        const senha2 = CE.el('input', { class: 'campo', type: 'password', 'data-campo': 'senha2' });
        const erro = CE.el('p', { class: 'login-erro em-claro' });
        const previa = CE.el('p', { class: 'em-previa' });
        const atualizarPrevia = () => { previa.textContent = `Seu endereço vai ser: ${usuario.value.trim().toLowerCase() || '...'}@${DOMINIO}`; };
        usuario.addEventListener('input', atualizarPrevia);
        atualizarPrevia();
        const criar = async () => {
          erro.textContent = '';
          const login = usuario.value.trim().toLowerCase();
          if (!/^[a-z0-9][a-z0-9._]{2,24}$/.test(login)) { erro.textContent = 'O nome de usuário deve ter de 3 a 25 letras ou números, sem espaços nem acentos (pode usar ponto).'; return; }
          if (senha.value.length < 6) { erro.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
          if (senha.value !== senha2.value) { erro.textContent = 'As duas senhas não são iguais.'; return; }
          const endereco = `${login}@${DOMINIO}`;
          if (CONTATOS_TREINO[endereco] || !await CE.api.chamar('email:endereco-livre', endereco)) { erro.textContent = 'Esse endereço já está em uso. Escolha outro nome de usuário.'; return; }
          caixa.conta = { endereco, nome: nome.value.trim() || u.nome, criadaEm: Date.now() };
          caixa.mensagens = mensagensIniciais(caixa.conta);
          await gravar();
          CE.comemorar('pequena');
          CE.emitir('email:conta-criada', { endereco });
          desenhar();
        };
        corpo.replaceChildren(CE.el('div', { class: 'em-criar' },
          CE.el('div', { class: 'em-logo' }, '📧 Correio'),
          CE.el('h2', {}, 'Crie a sua conta de e-mail'),
          CE.el('p', {}, 'O e-mail é o seu endereço na internet: serve para receber mensagens, se cadastrar em sites e mandar currículos.'),
          CE.el('label', {}, 'Seu nome', nome),
          CE.el('label', {}, 'Nome de usuário (a primeira parte do endereço)', usuario),
          previa,
          CE.el('label', {}, 'Crie uma senha', senha),
          CE.el('label', {}, 'Repita a senha', senha2),
          erro,
          CE.el('button', { class: 'botao grande', 'data-acao': 'criar-conta', onclick: criar }, 'Criar minha conta'),
          CE.el('p', { class: 'em-aviso' }, '🔒 Dica: use uma senha forte, que só você saiba. Ela é diferente da senha do Computador Escola.'),
        ));
      }

      // ---------- Caixa ----------
      function desenhar() {
        rascunho = null;
        const daPasta = caixa.mensagens.filter((m) => m.pasta === pasta).sort((a, b) => b.em - a.em);
        const naoLidas = (p) => caixa.mensagens.filter((m) => m.pasta === p && !m.lida).length;
        const lateral = CE.el('nav', { class: 'em-lateral' },
          CE.el('button', { class: 'botao em-escrever', 'data-acao': 'escrever', onclick: () => escrever() }, '✏️ Escrever'),
          ...PASTAS.map(([id, rotulo]) => CE.el('button', {
            class: 'em-pasta' + (id === pasta ? ' ativa' : ''), 'data-pasta': id,
            onclick: () => { pasta = id; aberta = null; desenhar(); CE.emitir('email:pasta', { pasta: id }); },
          }, rotulo, naoLidas(id) ? CE.el('b', { class: 'em-contador' }, String(naoLidas(id))) : null)),
          CE.el('div', { class: 'em-conta' }, CE.el('small', {}, 'Sua conta:'), CE.el('span', {}, caixa.conta.endereco)),
        );
        const lista = CE.el('div', { class: 'em-lista' }, ...(daPasta.length ? daPasta.map((m) => CE.el('button', {
          class: 'em-item' + (m.lida ? '' : ' nao-lida') + (aberta && aberta.id === m.id ? ' aberta' : ''), 'data-mensagem': m.assunto,
          onclick: () => abrirMensagem(m),
        },
          CE.el('div', { class: 'em-item-linha' }, CE.el('strong', {}, pasta === 'enviados' ? `Para: ${m.para}` : (m.deNome || m.de)), CE.el('small', {}, formatarData(m.em))),
          CE.el('div', { class: 'em-item-assunto' }, (m.anexos && m.anexos.length ? '📎 ' : '') + (m.assunto || '(sem assunto)')),
          CE.el('div', { class: 'em-item-previa' }, (m.texto || '').slice(0, 70)),
        )) : [CE.el('p', { class: 'arq-vazio' }, 'Nenhuma mensagem nesta pasta.')]));
        const leitura = CE.el('div', { class: 'em-leitura' }, aberta && aberta.pasta === pasta ? telaMensagem(aberta) : CE.el('p', { class: 'em-vazio' }, '📧 Clique numa mensagem para ler.'));
        corpo.replaceChildren(CE.el('div', { class: 'em-principal' }, lateral, lista, leitura));
        janela.definirTitulo(PASTAS.find((p) => p[0] === pasta)[1].slice(3));
      }

      async function abrirMensagem(m) {
        aberta = m;
        if (!m.lida) { m.lida = true; await gravar(); }
        desenhar();
        CE.emitir('email:aberto', { assunto: m.assunto, de: m.de, golpe: !!m.golpe, anexos: (m.anexos || []).length, pasta: m.pasta });
      }

      async function moverPara(m, destino, evento) {
        m.pasta = destino;
        await gravar();
        aberta = null;
        CE.emitir(evento, { assunto: m.assunto, de: m.de, golpe: !!m.golpe });
        desenhar();
      }

      function telaMensagem(m) {
        const acoes = [];
        if (m.pasta !== 'enviados') acoes.push(CE.el('button', { class: 'ferramenta texto', 'data-acao': 'responder', onclick: () => escrever({ para: m.de, assunto: m.assunto.startsWith('Re:') ? m.assunto : `Re: ${m.assunto}`, texto: `\n\n--- Em ${new Date(m.em).toLocaleString('pt-BR')}, ${m.deNome || m.de} escreveu:\n${m.texto}`, resposta: true }) }, '↩️ Responder'));
        acoes.push(CE.el('button', { class: 'ferramenta texto', 'data-acao': 'encaminhar', onclick: () => escrever({ para: '', assunto: `Enc: ${m.assunto}`, texto: `\n\n--- Mensagem encaminhada ---\nDe: ${m.deNome || ''} <${m.de}>\nAssunto: ${m.assunto}\n\n${m.texto}`, anexos: [...(m.anexos || [])], encaminhamento: true }) }, '➡️ Encaminhar'));
        if (m.pasta === 'spam') acoes.push(CE.el('button', { class: 'ferramenta texto', 'data-acao': 'nao-spam', onclick: () => moverPara(m, 'entrada', 'email:nao-spam') }, '✅ Não é spam'));
        else if (m.pasta !== 'enviados' && m.pasta !== 'lixeira') acoes.push(CE.el('button', { class: 'ferramenta texto', 'data-acao': 'spam', onclick: () => moverPara(m, 'spam', 'email:spam') }, '🚫 É spam / golpe'));
        if (m.pasta === 'lixeira') acoes.push(CE.el('button', { class: 'ferramenta texto', 'data-acao': 'restaurar', onclick: () => moverPara(m, 'entrada', 'email:restaurado') }, '↩️ Voltar para a entrada'));
        else acoes.push(CE.el('button', { class: 'ferramenta texto', 'data-acao': 'excluir', onclick: () => moverPara(m, 'lixeira', 'email:excluido') }, '🗑️ Excluir'));
        return CE.el('article', { class: 'em-mensagem' + (m.golpe ? ' golpe' : '') },
          CE.el('div', { class: 'ferramentas' }, CE.el('div', { class: 'ferramentas-grupo' }, ...acoes)),
          CE.el('h2', {}, m.assunto || '(sem assunto)'),
          CE.el('div', { class: 'em-cabecalho' },
            CE.el('div', {}, CE.el('b', {}, 'De: '), `${m.deNome || ''} `, CE.el('span', { class: 'em-endereco', 'data-remetente': m.de }, `<${m.de}>`)),
            CE.el('div', {}, CE.el('b', {}, 'Para: '), m.para),
            CE.el('div', {}, CE.el('b', {}, 'Data: '), new Date(m.em).toLocaleString('pt-BR'))),
          CE.el('div', { class: 'em-texto' }, m.texto),
          m.links && m.links.length ? CE.el('div', { class: 'em-links' }, ...m.links.map((l) => CE.el('button', {
            class: 'em-link', 'data-link-email': l.url,
            onclick: () => { CE.emitir('email:link', { url: l.url, golpe: !!m.golpe }); CE.janelas.abrir('navegador', { url: l.url }); },
          }, l.texto))) : null,
          m.anexos && m.anexos.length ? CE.el('div', { class: 'em-anexos' }, CE.el('b', {}, `📎 ${m.anexos.length} anexo${m.anexos.length > 1 ? 's' : ''}:`),
            ...m.anexos.map((a) => CE.el('div', { class: 'em-anexo' },
              CE.el('span', {}, `${CE.TIPOS_ARQUIVO[a.tipo] ? CE.TIPOS_ARQUIVO[a.tipo].icone : '📄'} ${a.nome}`),
              CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'baixar-anexo', 'data-anexo': a.nome, onclick: async () => {
                await CE.sessao.baixarArquivo(a, 'email');
                CE.emitir('email:anexo-baixado', { nome: a.nome, tipo: a.tipo });
              } }, '⬇️ Baixar')))) : null,
        );
      }

      // ---------- Escrever ----------
      async function escrever(inicial = {}) {
        rascunho = { para: '', assunto: '', texto: '', anexos: [], ...inicial };
        const contatos = Object.entries(CONTATOS_TREINO).map(([endereco, c]) => ({ nome: c.nome, endereco }))
          .concat(await CE.api.chamar('email:contatos').catch(() => []));
        const para = CE.el('input', { class: 'campo', 'data-campo': 'para', value: rascunho.para, list: 'em-contatos', placeholder: 'endereco@exemplo.com', autocomplete: 'off' });
        const assunto = CE.el('input', { class: 'campo', 'data-campo': 'assunto', value: rascunho.assunto, placeholder: 'Sobre o que é a mensagem' });
        const texto = CE.el('textarea', { class: 'campo em-corpo', 'data-campo': 'texto', placeholder: 'Escreva a sua mensagem aqui...' });
        texto.value = rascunho.texto;
        const listaAnexos = CE.el('div', { class: 'em-anexos-novos' });
        const erro = CE.el('p', { class: 'login-erro em-claro' });
        const desenharAnexos = () => listaAnexos.replaceChildren(...rascunho.anexos.map((a, i) => CE.el('span', { class: 'em-chip' },
          `📎 ${a.nome}`, CE.el('button', { title: 'Tirar anexo', onclick: () => { rascunho.anexos.splice(i, 1); desenharAnexos(); } }, '✕'))));
        desenharAnexos();

        async function anexar() {
          const arquivos = (await CE.sessao.arquivos()).filter((a) => !a.naLixeira && a.tipo !== 'pasta');
          const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo largo' },
            CE.el('p', {}, '📎 Escolha o arquivo para anexar:'),
            arquivos.length ? CE.el('div', { class: 'em-escolher' }, ...arquivos.map((a) => CE.el('button', {
              class: 'arq-item', 'data-anexar': a.nome,
              onclick: () => {
                fundo.remove();
                rascunho.anexos.push({ nome: a.nome, tipo: a.tipo, conteudo: a.conteudo });
                desenharAnexos();
                CE.emitir('email:anexo-adicionado', { nome: a.nome, tipo: a.tipo });
              },
            }, CE.el('span', { class: 'arq-icone' }, CE.TIPOS_ARQUIVO[a.tipo].icone), CE.el('span', { class: 'arq-nome' }, a.nome), CE.el('span', { class: 'arq-tipo' }, a.pasta ? `📁 ${a.pasta}` : 'Meus Documentos')))) : CE.el('p', {}, 'Você ainda não tem arquivos salvos.'),
            CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
          document.body.append(fundo);
        }

        async function enviar() {
          erro.textContent = '';
          const destino = para.value.trim().toLowerCase();
          if (!destino) { erro.textContent = 'Escreva o endereço de quem vai receber, no campo "Para".'; return; }
          if (!validoEmail(destino)) { erro.textContent = 'Esse endereço não parece um e-mail. Ele precisa ter @ e um ponto, como maria@correio.escola.'; return; }
          if (!assunto.value.trim() && !await CE.confirmar('A mensagem está sem assunto. Enviar mesmo assim?')) return;
          const mensagem = {
            id: `${Date.now()}${Math.random().toString(16).slice(2, 6)}`, pasta: 'enviados', lida: true, em: Date.now(),
            de: caixa.conta.endereco, deNome: caixa.conta.nome, para: destino,
            assunto: assunto.value.trim(), texto: texto.value, anexos: rascunho.anexos,
          };
          caixa.mensagens.push(mensagem);
          await gravar();
          const info = { para: destino, assunto: mensagem.assunto, texto: mensagem.texto, anexos: mensagem.anexos.length, nomesAnexos: mensagem.anexos.map((a) => a.nome), tiposAnexos: mensagem.anexos.map((a) => a.tipo), resposta: !!rascunho.resposta, encaminhamento: !!rascunho.encaminhamento };
          CE.avisar('📤 Mensagem enviada!');
          CE.emitir('email:enviado', info);
          if (rascunho.resposta) CE.emitir('email:respondido', info);
          if (rascunho.encaminhamento) CE.emitir('email:encaminhado', info);
          pasta = 'enviados'; aberta = null;
          desenhar();
          entregar(mensagem);
        }

        corpo.replaceChildren(CE.el('div', { class: 'em-principal' },
          CE.el('nav', { class: 'em-lateral' }, CE.el('button', { class: 'botao secundario em-escrever', onclick: () => desenhar() }, '← Voltar')),
          CE.el('div', { class: 'em-escrevendo' },
            CE.el('h2', {}, rascunho.resposta ? '↩️ Responder' : rascunho.encaminhamento ? '➡️ Encaminhar' : '✏️ Nova mensagem'),
            CE.el('datalist', { id: 'em-contatos' }, ...contatos.map((c) => CE.el('option', { value: c.endereco }, c.nome))),
            CE.el('label', {}, 'Para', para),
            CE.el('label', {}, 'Assunto', assunto),
            CE.el('label', {}, 'Mensagem', texto),
            listaAnexos, erro,
            CE.el('div', { class: 'dialogo-botoes em-botoes' },
              CE.el('button', { class: 'botao secundario', 'data-acao': 'anexar', onclick: anexar }, '📎 Anexar arquivo'),
              CE.el('button', { class: 'botao secundario', 'data-acao': 'descartar', onclick: () => desenhar() }, 'Descartar'),
              CE.el('button', { class: 'botao', 'data-acao': 'enviar', onclick: enviar }, '📤 Enviar')),
          )));
        (rascunho.para ? texto : para).focus();
        if (rascunho.para) texto.setSelectionRange(0, 0);
      }

      // Entrega: colegas recebem de verdade; contatos de treino respondem; endereço inexistente volta com aviso.
      async function entregar(m) {
        const bot = CONTATOS_TREINO[m.para];
        if (bot) {
          setTimeout(async () => {
            const r = bot.responder(m);
            await receber({ de: m.para, deNome: bot.nome, assunto: r.assunto, texto: r.texto });
          }, 2500);
          return;
        }
        const resultado = await CE.api.chamar('email:entregar', { para: m.para, assunto: m.assunto, texto: m.texto, anexos: m.anexos }).catch(() => ({ entregue: false }));
        if (resultado.entregue) { CE.emitir('email:entregue-colega', { para: m.para, nome: resultado.nome }); return; }
        setTimeout(() => receber({
          de: `sistema@${DOMINIO}`, deNome: 'Sistema de Correio', assunto: `Mensagem não entregue: ${m.assunto || '(sem assunto)'}`, devolvida: true,
          texto: `Não foi possível entregar a sua mensagem para ${m.para}, porque esse endereço não existe.\n\nConfira se o endereço foi digitado certinho, letra por letra, com o @ e os pontos no lugar certo.`,
        }), 1500);
      }

      async function receber(dados) {
        caixa = await ler();
        caixa.mensagens.push({ id: `${Date.now()}${Math.random().toString(16).slice(2, 6)}`, pasta: 'entrada', lida: false, em: Date.now(), para: caixa.conta.endereco, anexos: [], ...dados });
        await gravar();
        CE.avisar(`📧 Nova mensagem de ${dados.deNome}: "${dados.assunto}"`);
        CE.emitir('email:recebido', { de: dados.de, assunto: dados.assunto, devolvida: !!dados.devolvida });
        if (!rascunho && corpo.isConnected) desenhar();
      }

      corpo.classList.add('email');
      iniciar();
      return { aoFechar() { clearInterval(timer); return true; } };
    },
  });
})();
