// Sites de treino do nível Avançado: Escudo Digital (senhas, duas etapas, golpes, privacidade, boatos),
// Emprega Já (vagas de emprego) e Sala de Reunião (videochamada).
// As páginas que reagem enquanto o aluno digita são montadas como elementos (não como texto).
window.CE = window.CE || {};

(function () {
  const e = (t) => CE.escapar(String(t == null ? '' : t));
  const link = (url, texto, extra = '') => `<a href="#" data-link="${url}" ${extra}>${texto}</a>`;
  const el = CE.el;

  // ---------- Escudo Digital ----------
  const COMUNS = ['123456', '12345678', '123456789', 'senha', 'senha123', 'qwerty', 'abc123', '111111', '000000', 'brasil', 'amor', 'deus', 'familia', 'flamengo', 'corinthians', 'palmeiras', 'futebol', 'teamo', 'iloveyou', '102030'];
  CE.forcaSenha = function (senha) {
    const s = String(senha || '');
    const dicas = [];
    let pontos = 0;
    if (s.length >= 8) pontos++; else dicas.push('Use pelo menos 8 caracteres (melhor 12 ou mais).');
    if (s.length >= 12) pontos++;
    if (/[a-z]/.test(s) && /[A-Z]/.test(s)) pontos++; else dicas.push('Misture letras MAIÚSCULAS e minúsculas.');
    if (/\d/.test(s)) pontos++; else dicas.push('Coloque números.');
    if (/[^A-Za-z0-9]/.test(s)) pontos++; else dicas.push('Coloque símbolos, como ! @ # $ %.');
    const comum = COMUNS.some((c) => s.toLowerCase().includes(c)) || /^(\d)\1+$/.test(s) || /(19|20)\d{2}$/.test(s);
    if (comum) { pontos = Math.min(pontos, 1); dicas.unshift('Evite senhas comuns, sequências, datas e nomes de time: são as primeiras que os bandidos testam.'); }
    const forca = pontos >= 4 ? 'forte' : pontos >= 2 ? 'media' : 'fraca';
    const tempo = { fraca: 'menos de 1 segundo', media: 'algumas horas', forte: 'milhares de anos' }[forca];
    return { pontos, forca, tempo, dicas, tamanho: s.length };
  };

  const CAB_ESCUDO = `<header class="es-cabecalho">${link('escudodigital.org.br', '🛡️ Escudo Digital', 'class="es-logo"')}<nav>${link('escudodigital.org.br/senha', 'Senhas', 'data-escudo="senha"')}${link('escudodigital.org.br/duas-etapas', 'Duas etapas', 'data-escudo="duas-etapas"')}${link('escudodigital.org.br/golpe-ou-nao', 'Golpe ou não?', 'data-escudo="golpe-ou-nao"')}${link('escudodigital.org.br/privacidade', 'Privacidade', 'data-escudo="privacidade"')}${link('escudodigital.org.br/boato', 'Boato ou verdade?', 'data-escudo="boato"')}</nav></header>`;
  const paginaEscudo = (...filhos) => el('div', { class: 'es-site' }, el('div', { html: CAB_ESCUDO }), el('div', { class: 'es-pagina' }, ...filhos));

  function telaSenha() {
    const campo = el('input', { type: 'password', name: 'senha', class: 'es-campo', autocomplete: 'off', placeholder: 'Digite uma senha para testar', 'aria-label': 'Senha para testar' });
    const barra = el('div', { class: 'es-forca' }, el('div'));
    const resultado = el('div', { class: 'es-resultado', 'data-forca': '' });
    const mostrar = el('label', { class: 'es-mostrar' }, el('input', { type: 'checkbox', onchange: (ev) => { campo.type = ev.target.checked ? 'text' : 'password'; } }), ' Mostrar a senha');
    const avaliar = () => {
      const r = CE.forcaSenha(campo.value);
      barra.firstChild.style.width = (campo.value ? Math.max(10, r.pontos * 20) : 0) + '%';
      barra.className = 'es-forca ' + (campo.value ? r.forca : '');
      resultado.dataset.forca = campo.value ? r.forca : '';
      resultado.replaceChildren(...(campo.value ? [
        el('b', {}, { fraca: '🔴 Senha FRACA', media: '🟡 Senha MÉDIA', forte: '🟢 Senha FORTE' }[r.forca]),
        el('p', {}, `Um programa de ladrão levaria ${r.tempo} para descobrir.`),
        r.dicas.length ? el('ul', {}, ...r.dicas.map((d) => el('li', {}, d))) : el('p', {}, '👏 Ótima senha! Agora é só não contar para ninguém e não usar a mesma em todo lugar.'),
      ] : []));
      return r;
    };
    campo.addEventListener('input', avaliar);
    const form = el('form', { class: 'es-form', 'data-formulario': 'testar-senha' },
      campo, mostrar, barra, resultado,
      el('button', { class: 'es-botao', type: 'submit' }, 'Testar a senha'));
    // O teste roda aqui mesmo: a senha nunca sai do computador.
    form.addEventListener('submit', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      const r = avaliar();
      if (campo.value) CE.emitir('seguranca:senha', { forca: r.forca, pontos: r.pontos, tamanho: r.tamanho });
    });
    return paginaEscudo(el('h1', {}, '🔑 Teste a força da sua senha'),
      el('p', {}, 'Dica de ouro: use uma FRASE-SENHA, fácil de lembrar e difícil de adivinhar. Exemplo: ', el('code', {}, 'MinhaGata#Come3Vezes')),
      form,
      el('p', { class: 'es-nota' }, '🔒 Este teste é só de treino e funciona sem internet: a senha não é enviada para lugar nenhum.'));
  }

  function telaDuasEtapas(ctx) {
    const est = ctx.estado.duasEtapas || (ctx.estado.duasEtapas = { ativada: false });
    const caixa = el('div', { class: 'es-passos' });
    let codigo = null;
    const celular = (texto) => {
      document.querySelectorAll('.celular-falso').forEach((x) => x.remove());
      const c = el('div', { class: 'celular-falso', role: 'dialog', 'aria-label': 'Celular' },
        el('div', { class: 'celular-topo' }, '📱 Seu celular'),
        el('div', { class: 'celular-sms', 'data-sms': '' }, el('small', {}, 'SMS · agora'), el('p', {}, texto)),
        el('button', { class: 'celular-fechar', onclick: () => c.remove() }, 'Fechar'));
      document.body.append(c);
    };
    const novoCodigo = () => String(Math.floor(100000 + Math.random() * 900000));
    function passo(n) {
      if (n === 1) {
        caixa.replaceChildren(
          el('p', {}, est.ativada ? '✅ A verificação em duas etapas da sua conta de treino está LIGADA.' : 'Sua conta de treino (Correio) só pede a SENHA. Se alguém descobrir a senha, entra na conta.'),
          est.ativada
            ? el('button', { class: 'es-botao', 'data-acao': 'testar-login', onclick: () => passo(4) }, 'Fazer o teste: entrar na conta')
            : el('button', { class: 'es-botao', 'data-acao': 'ativar-duas-etapas', onclick: () => passo(2) }, 'Ativar a verificação em duas etapas'));
      } else if (n === 2) {
        const tel = el('input', { class: 'es-campo', name: 'telefone', value: '(69) 99999-0000', 'data-campo': 'telefone' });
        caixa.replaceChildren(el('p', {}, 'Passo 1: confirme o número do seu celular. É para ele que vai o código.'), tel,
          el('button', { class: 'es-botao', 'data-acao': 'enviar-codigo', onclick: () => {
            codigo = novoCodigo();
            celular(`Correio: seu código de verificação é ${codigo}. NÃO passe este código para ninguém.`);
            CE.emitir('seguranca:codigo-enviado');
            passo(3);
          } }, 'Enviar código por SMS'));
      } else if (n === 3 || n === 5) {
        const cod = el('input', { class: 'es-campo', name: 'codigo', inputmode: 'numeric', 'data-campo': 'codigo', placeholder: '6 números', autocomplete: 'off' });
        const erro = el('p', { class: 'es-erro' });
        caixa.replaceChildren(el('p', {}, n === 3 ? 'Passo 2: olhe o celular (no canto da tela) e digite o código que chegou.' : 'A senha está certa, mas agora o Correio pede o CÓDIGO que chegou no celular:'), cod, erro,
          el('button', { class: 'es-botao', 'data-acao': 'confirmar-codigo', onclick: () => {
            if (cod.value.replace(/\D/g, '') !== codigo) { erro.textContent = '❌ Código errado. Confira no celular.'; return; }
            document.querySelectorAll('.celular-falso').forEach((x) => x.remove());
            if (n === 3) {
              est.ativada = true;
              CE.emitir('seguranca:2etapas', { ativada: true });
              caixa.replaceChildren(el('p', { class: 'es-ok' }, '🎉 Pronto! Verificação em duas etapas LIGADA. Agora, mesmo que alguém descubra a sua senha, não entra sem o código do SEU celular.'),
                el('button', { class: 'es-botao', 'data-acao': 'testar-login', onclick: () => passo(4) }, 'Fazer o teste: entrar na conta'));
            } else {
              CE.emitir('seguranca:login-2etapas', { ok: true });
              caixa.replaceChildren(el('p', { class: 'es-ok' }, '✅ Entrou! Com a senha E o código. Um ladrão que só tivesse a senha ficaria do lado de fora.'));
            }
          } }, 'Confirmar'));
      } else if (n === 4) {
        const senha = el('input', { class: 'es-campo', type: 'password', name: 'senha', 'data-campo': 'senha', placeholder: 'Qualquer senha (é treino)' });
        caixa.replaceChildren(el('p', {}, 'Entre na conta de treino: digite uma senha qualquer e clique em Entrar.'), senha,
          el('button', { class: 'es-botao', 'data-acao': 'entrar', onclick: () => {
            if (!senha.value) return;
            codigo = novoCodigo();
            celular(`Correio: código de acesso ${codigo}. Se não foi você que tentou entrar, troque a sua senha!`);
            passo(5);
          } }, 'Entrar'));
      }
    }
    passo(1);
    return paginaEscudo(el('h1', {}, '📲 Verificação em duas etapas'),
      el('p', {}, 'Com duas etapas, para entrar na conta é preciso: 1) a SENHA, que você sabe, e 2) um CÓDIGO que chega no seu celular. Ative em todas as contas importantes: e-mail, banco, WhatsApp e redes sociais.'),
      caixa);
  }

  const MENSAGENS = [
    { de: 'SMS · 4004-1234', texto: 'BANCO: sua conta foi BLOQUEADA. Regularize em bit.ly/desbloq-conta em até 1 hora.', golpe: true, porque: 'Banco não manda link encurtado nem ameaça bloquear "em 1 hora". Isso é para você agir sem pensar.' },
    { de: 'WhatsApp · número novo', texto: 'Oi mãe, troquei de número! Pode me fazer um Pix de R$ 800? Depois te explico, é urgente.', golpe: true, porque: 'Golpe do número novo. LIGUE para o número antigo da pessoa antes de mandar qualquer dinheiro.' },
    { de: 'E-mail · pedidos@compracerta.com.br', texto: 'Seu pedido nº 4821 foi entregue. Obrigado por comprar na Compra Certa!', golpe: false, porque: 'É o endereço oficial da loja, não pede dados nem dinheiro e fala de uma compra que você fez.' },
    { de: 'SMS · 29001', texto: 'Parabéns!!! Seu CPF foi sorteado e você ganhou um celular. Pague só o frete de R$ 19,90.', golpe: true, porque: 'Ninguém ganha sorteio sem participar. "Pague só o frete" é o jeito de roubar o seu dinheiro e o seu cartão.' },
    { de: 'SMS · Posto de Saúde', texto: 'Lembrete: sua vacina da gripe está disponível no posto do seu bairro, de 8h às 17h.', golpe: false, porque: 'Só informa, não pede senha, dinheiro nem clique em link.' },
    { de: 'E-mail · receita-federal@gov-regulariza.net', texto: 'Seu CPF será CANCELADO. Baixe o arquivo anexo e atualize seus dados.', golpe: true, porque: 'O governo usa endereços que terminam em .gov.br, e não manda anexo para "atualizar dados". O anexo pode ser vírus.' },
    { de: 'WhatsApp · Vagas Home Office', texto: 'Ganhe R$ 500 por dia curtindo vídeos! Para começar, pague a taxa de cadastro de R$ 50.', golpe: true, porque: 'Emprego de verdade não cobra para você trabalhar. Dinheiro fácil demais é sempre golpe.' },
    { de: 'E-mail · professor@correio.escola', texto: 'Olá! A aula de amanhã começa às 14h. Tragam o pen drive com o trabalho.', golpe: false, porque: 'Remetente conhecido, assunto esperado, nada de pedir dados ou dinheiro.' },
  ];
  function telaGolpeOuNao() {
    let i = 0, acertos = 0;
    const area = el('div', { class: 'es-jogo' });
    function mostrar() {
      if (i >= MENSAGENS.length) {
        CE.emitir('seguranca:quiz-golpe', { acertos, total: MENSAGENS.length });
        area.replaceChildren(el('div', { class: 'es-final', 'data-acertos': acertos },
          el('h2', {}, acertos >= 7 ? '🏆 Detetive de golpes!' : acertos >= 5 ? '👍 Muito bem!' : '💪 Vamos treinar mais'),
          el('p', {}, `Você acertou ${acertos} de ${MENSAGENS.length}.`),
          el('button', { class: 'es-botao', 'data-acao': 'jogar-de-novo', onclick: () => { i = 0; acertos = 0; mostrar(); } }, 'Jogar de novo')));
        return;
      }
      const m = MENSAGENS[i];
      const responder = (disse) => {
        const certo = disse === m.golpe;
        if (certo) acertos++;
        CE.emitir('seguranca:golpe-resposta', { numero: i + 1, certo });
        area.replaceChildren(el('div', { class: 'es-mensagem' }, el('small', {}, m.de), el('p', {}, m.texto)),
          el('div', { class: 'es-explicacao ' + (certo ? 'certo' : 'errado') },
            el('b', {}, `${certo ? '✅ Acertou!' : '❌ Não foi dessa vez.'} ${m.golpe ? 'É GOLPE.' : 'É confiável.'}`), el('p', {}, m.porque),
            el('button', { class: 'es-botao', 'data-acao': 'proxima', onclick: () => { i++; mostrar(); } }, i + 1 < MENSAGENS.length ? 'Próxima mensagem ▶' : 'Ver resultado')));
      };
      area.replaceChildren(el('p', { class: 'es-contador' }, `Mensagem ${i + 1} de ${MENSAGENS.length}`),
        el('div', { class: 'es-mensagem' }, el('small', {}, m.de), el('p', {}, m.texto)),
        el('div', { class: 'es-respostas' },
          el('button', { class: 'es-botao golpe', 'data-resposta': 'golpe', onclick: () => responder(true) }, '🚨 É golpe'),
          el('button', { class: 'es-botao confiavel', 'data-resposta': 'confiavel', onclick: () => responder(false) }, '✅ É confiável')));
    }
    mostrar();
    return paginaEscudo(el('h1', {}, '🕵️ Golpe ou não?'), el('p', {}, 'Leia cada mensagem e decida. Fique de olho em: pressa, ameaça, prêmio, link estranho e pedido de dinheiro ou código.'), area);
  }

  function telaPrivacidade(ctx) {
    const p = ctx.estado.privacidade || (ctx.estado.privacidade = { posts: 'todos', telefone: true, localizacao: true, aniversario: 'todos', marcar: 'todos' });
    const previa = el('div', { class: 'es-previa' });
    const sel = (campo, opcoes) => el('select', { class: 'es-campo', 'data-campo': campo, onchange: (ev) => { p[campo] = ev.target.value; desenharPrevia(); } },
      ...opcoes.map(([v, r]) => el('option', { value: v, selected: p[campo] === v }, r)));
    const chave = (campo, rotulo) => el('label', { class: 'es-chave' }, el('input', { type: 'checkbox', 'data-campo': campo, checked: p[campo], onchange: (ev) => { p[campo] = ev.target.checked; desenharPrevia(); } }), rotulo);
    function desenharPrevia() {
      previa.replaceChildren(el('b', {}, '👀 Como um DESCONHECIDO vê o seu perfil:'),
        el('div', { class: 'es-perfil' }, el('div', { class: 'es-avatar' }, '🙂'), el('div', {}, el('strong', {}, 'Você (treino)'),
          el('p', {}, p.telefone ? '📞 (69) 99999-0000' : '📞 escondido'),
          el('p', {}, p.aniversario === 'todos' ? '🎂 12 de março de 1980' : '🎂 escondido'))),
        el('p', {}, p.posts === 'todos' ? '📸 Foto: "Saindo de férias! Casa vazia por 15 dias 😎"' + (p.localizacao ? ' — 📍 Rua das Flores, 120' : '') : '🔒 As publicações estão escondidas para quem não é amigo.'));
    }
    desenharPrevia();
    return paginaEscudo(el('h1', {}, '🔐 Privacidade nas redes sociais'),
      el('p', {}, 'Esta é a tela de configurações da "Rede Amiga" (de treino). Escolha quem pode ver as suas coisas e veja do lado como um desconhecido enxerga o seu perfil.'),
      el('div', { class: 'es-duas' },
        el('div', { class: 'es-config' },
          el('label', {}, 'Quem pode ver as suas publicações? ', sel('posts', [['todos', '🌎 Todo mundo'], ['amigos', '👥 Só amigos'], ['eu', '🔒 Só eu']])),
          el('label', {}, 'Quem vê o seu aniversário? ', sel('aniversario', [['todos', '🌎 Todo mundo'], ['amigos', '👥 Só amigos']])),
          el('label', {}, 'Quem pode marcar você em fotos? ', sel('marcar', [['todos', '🌎 Todo mundo'], ['amigos', '👥 Só amigos']])),
          chave('telefone', 'Mostrar o meu telefone no perfil'),
          chave('localizacao', 'Mostrar onde eu estou nas publicações'),
          el('button', { class: 'es-botao', 'data-acao': 'salvar-privacidade', onclick: () => {
            const seguro = p.posts !== 'todos' && !p.telefone && !p.localizacao && p.aniversario !== 'todos';
            CE.emitir('seguranca:privacidade', { ...p, seguro });
            CE.avisar(seguro ? '🔐 Perfil protegido! Desconhecidos não veem os seus dados.' : '⚠️ Salvo, mas ainda tem informação aberta para desconhecidos. Veja a prévia ao lado.');
          } }, '💾 Salvar configurações')),
        previa));
  }

  const NOTICIAS = [
    { titulo: 'Água com limão em jejum cura a diabetes, dizem médicos', fonte: 'Corrente de WhatsApp, sem autor e sem data', boato: true, porque: 'Não diz quais médicos, não tem fonte nem data. Diabetes precisa de tratamento com médico de verdade.' },
    { titulo: 'Prefeitura abre inscrições para curso gratuito de informática', fonte: 'Jornal do Bairro · 10/10 · com o endereço e o telefone da prefeitura', boato: false, porque: 'Tem fonte conhecida, data, e dá para confirmar no site ou telefone oficial da prefeitura.' },
    { titulo: 'URGENTE: governo vai cancelar todos os títulos de eleitor amanhã! Compartilhe!', fonte: 'Mensagem encaminhada muitas vezes', boato: true, porque: '"URGENTE" e "compartilhe" são sinais de boato. Notícia assim estaria em todos os jornais e no site do TSE.' },
    { titulo: 'Vacinação contra a gripe começa na segunda-feira nos postos de saúde', fonte: 'Saber Livre e Jornal do Bairro · Secretaria de Saúde', boato: false, porque: 'Mais de um site confiável dá a mesma notícia, com a fonte oficial.' },
    { titulo: 'Cientistas descobrem que o celular carregando à noite explode sozinho', fonte: 'Site "noticiaschocantes.blog", foto sem legenda', boato: true, porque: 'Site desconhecido, título exagerado para dar medo e nenhum cientista citado. Pesquise em outros sites antes de acreditar.' },
    { titulo: 'Escola Estadual divulga calendário das provas do semestre', fonte: 'Site oficial da escola · publicado hoje', boato: false, porque: 'Fonte oficial e data recente.' },
  ];
  function telaBoato() {
    let i = 0, acertos = 0;
    const area = el('div', { class: 'es-jogo' });
    function mostrar() {
      if (i >= NOTICIAS.length) {
        CE.emitir('seguranca:boato', { acertos, total: NOTICIAS.length });
        area.replaceChildren(el('div', { class: 'es-final', 'data-acertos': acertos }, el('h2', {}, acertos >= 5 ? '🏆 Caçador de boatos!' : '💪 Continue treinando'),
          el('p', {}, `Você acertou ${acertos} de ${NOTICIAS.length}. Antes de compartilhar: confira a FONTE, a DATA e procure a notícia em outros sites.`),
          el('button', { class: 'es-botao', 'data-acao': 'jogar-de-novo', onclick: () => { i = 0; acertos = 0; mostrar(); } }, 'Jogar de novo')));
        return;
      }
      const n = NOTICIAS[i];
      const responder = (disse) => {
        const certo = disse === n.boato;
        if (certo) acertos++;
        area.replaceChildren(el('div', { class: 'es-noticia' }, el('h3', {}, n.titulo), el('small', {}, `Fonte: ${n.fonte}`)),
          el('div', { class: 'es-explicacao ' + (certo ? 'certo' : 'errado') }, el('b', {}, `${certo ? '✅ Acertou!' : '❌ Não foi dessa vez.'} ${n.boato ? 'É BOATO.' : 'É VERDADE.'}`), el('p', {}, n.porque),
            el('button', { class: 'es-botao', 'data-acao': 'proxima', onclick: () => { i++; mostrar(); } }, i + 1 < NOTICIAS.length ? 'Próxima notícia ▶' : 'Ver resultado')));
      };
      area.replaceChildren(el('p', { class: 'es-contador' }, `Notícia ${i + 1} de ${NOTICIAS.length}`),
        el('div', { class: 'es-noticia' }, el('h3', {}, n.titulo), el('small', {}, `Fonte: ${n.fonte}`)),
        el('div', { class: 'es-respostas' },
          el('button', { class: 'es-botao golpe', 'data-resposta': 'boato', onclick: () => responder(true) }, '🚫 É boato'),
          el('button', { class: 'es-botao confiavel', 'data-resposta': 'verdade', onclick: () => responder(false) }, '📰 É verdade')));
    }
    mostrar();
    return paginaEscudo(el('h1', {}, '📰 Boato ou verdade?'), el('p', {}, 'Notícia falsa (fake news) espalha medo e mentira. Leia o título e a fonte, e decida.'), area);
  }

  CE.SITES['escudodigital.org.br'] = {
    dominio: 'escudodigital.org.br', nome: 'Escudo Digital', icone: '🛡️', seguro: true,
    abrir(ctx) {
      const telas = { '/senha': telaSenha, '/duas-etapas': telaDuasEtapas, '/golpe-ou-nao': telaGolpeOuNao, '/privacidade': telaPrivacidade, '/boato': telaBoato };
      const titulos = { '/senha': 'Teste de senha', '/duas-etapas': 'Duas etapas', '/golpe-ou-nao': 'Golpe ou não?', '/privacidade': 'Privacidade', '/boato': 'Boato ou verdade?' };
      if (telas[ctx.caminho]) return { titulo: `${titulos[ctx.caminho]} – Escudo Digital`, conteudo: telas[ctx.caminho](ctx) };
      return {
        titulo: 'Escudo Digital – segurança na internet',
        conteudo: `<div class="es-site">${CAB_ESCUDO}<div class="es-pagina"><h1>Proteja-se na internet 🛡️</h1><p>Treinos rápidos para usar a internet com segurança:</p>
          <div class="es-cartoes">
            ${link('escudodigital.org.br/senha', '<span>🔑</span><b>Senha forte</b><small>Teste a força de uma senha</small>', 'class="es-cartao"')}
            ${link('escudodigital.org.br/duas-etapas', '<span>📲</span><b>Duas etapas</b><small>Senha + código no celular</small>', 'class="es-cartao"')}
            ${link('escudodigital.org.br/golpe-ou-nao', '<span>🕵️</span><b>Golpe ou não?</b><small>Jogo das mensagens</small>', 'class="es-cartao"')}
            ${link('escudodigital.org.br/privacidade', '<span>🔐</span><b>Privacidade</b><small>Redes sociais</small>', 'class="es-cartao"')}
            ${link('escudodigital.org.br/boato', '<span>📰</span><b>Boato ou verdade?</b><small>Fake news</small>', 'class="es-cartao"')}
          </div></div></div>`,
      };
    },
  };

  // ---------- Emprega Já (vagas) ----------
  const VAGAS = [
    { id: 'aux-adm', cargo: 'Auxiliar administrativo', empresa: 'Empresa Boa', cidade: 'Porto Velho', area: 'Escritório', salario: 'R$ 1.900', requisitos: ['Ensino médio completo', 'Informática: Editor de Texto, Planilha e e-mail', 'Boa comunicação'], email: 'rh@empresaboa.com.br' },
    { id: 'atendente', cargo: 'Atendente de loja', empresa: 'Compra Certa', cidade: 'Porto Velho', area: 'Comércio', salario: 'R$ 1.650 + comissão', requisitos: ['Gostar de atender pessoas', 'Saber usar computador para cadastrar vendas'], email: 'rh@empresaboa.com.br' },
    { id: 'recepcao', cargo: 'Recepcionista', empresa: 'Clínica Saúde Mais', cidade: 'Ji-Paraná', area: 'Saúde', salario: 'R$ 1.750', requisitos: ['Digitação', 'Agenda no computador', 'Simpatia e organização'], email: 'rh@empresaboa.com.br' },
    { id: 'estoque', cargo: 'Auxiliar de estoque', empresa: 'Mercadinho Bom Preço', cidade: 'Ariquemes', area: 'Comércio', salario: 'R$ 1.600', requisitos: ['Controle de estoque em planilha', 'Organização'], email: 'rh@empresaboa.com.br' },
    { id: 'golpe', cargo: '💰 Trabalhe em casa: ganhe R$ 5.000 por semana!!!', empresa: 'Renda Fácil Online', cidade: 'Qualquer lugar', area: 'Escritório', salario: 'R$ 5.000 por SEMANA', requisitos: ['Nenhuma experiência', 'Pagar a taxa de inscrição de R$ 49,90'], golpe: true },
  ];
  const CAB_VAGAS = `<header class="vg-cabecalho">${link('empregaja.com.br', '💼 Emprega Já', 'class="vg-logo"')}<span>Vagas de emprego de treino em Rondônia</span></header>`;
  CE.SITES['empregaja.com.br'] = {
    dominio: 'empregaja.com.br', nome: 'Emprega Já', icone: '💼', seguro: true,
    abrir({ caminho, busca, estado }) {
      if (caminho === '/vaga') {
        const v = VAGAS.find((x) => x.id === busca.id) || VAGAS[0];
        CE.emitir('vagas:vaga', { vaga: v.id, golpe: !!v.golpe });
        return {
          titulo: `${v.cargo} – Emprega Já`,
          conteudo: `<div class="vg-site">${CAB_VAGAS}<div class="vg-pagina"><p>${link('empregaja.com.br', '← Voltar para as vagas')}</p>
            <h1>${e(v.cargo)}</h1><p class="vg-info">🏢 ${e(v.empresa)} · 📍 ${e(v.cidade)} · 💵 ${e(v.salario)}</p>
            <h3>Requisitos</h3><ul>${v.requisitos.map((r) => `<li>${e(r)}</li>`).join('')}</ul>
            ${v.golpe
              ? `<div class="vg-golpe-aviso">Para garantir a sua vaga, pague a taxa de inscrição AGORA. Restam só 3 vagas!</div><button class="vg-botao" data-site-acao="pagar-taxa">Pagar taxa de R$ 49,90</button>`
              : `<h3>Como se candidatar</h3><p>Mande o seu <b>currículo</b> anexado para <b>${e(v.email)}</b> com o assunto <b>"Currículo – ${e(v.cargo)}"</b>. Ou clique no botão abaixo.</p>
                 ${link(`empregaja.com.br/candidatar?id=${v.id}`, '📨 Candidatar-se a esta vaga', 'class="vg-botao" data-candidatar')}`}
          </div></div>`,
        };
      }
      if (caminho === '/candidatar') {
        const v = VAGAS.find((x) => x.id === busca.id) || VAGAS[0];
        const escolha = el('select', { name: 'curriculo', class: 'vg-campo', 'data-campo': 'curriculo' }, el('option', { value: '' }, 'Carregando seus arquivos…'));
        CE.sessao.arquivos().then((lista) => {
          const docs = lista.filter((a) => !a.naLixeira && (a.tipo === 'documento' || a.tipo === 'pdf'));
          escolha.replaceChildren(el('option', { value: '' }, docs.length ? '— Escolha o arquivo do currículo —' : 'Você ainda não tem documentos salvos'),
            ...docs.map((d) => el('option', { value: d.nome, 'data-tipo': d.tipo }, `${d.tipo === 'pdf' ? '📕' : '📄'} ${d.nome}`)));
        });
        const form = el('form', { class: 'vg-form', 'data-formulario': 'candidatura' },
          el('input', { type: 'hidden', name: 'vaga', value: v.id }),
          el('label', {}, 'Nome completo', el('input', { name: 'nome', class: 'vg-campo', autocomplete: 'off' })),
          el('label', {}, 'E-mail', el('input', { name: 'email', class: 'vg-campo', autocomplete: 'off' })),
          el('label', {}, 'Telefone', el('input', { name: 'telefone', class: 'vg-campo', autocomplete: 'off' })),
          el('label', {}, 'Anexar currículo (dos seus arquivos)', escolha),
          el('button', { class: 'vg-botao', type: 'submit' }, 'Enviar candidatura'));
        return { titulo: 'Candidatura – Emprega Já', conteudo: el('div', { class: 'vg-site', html: CAB_VAGAS }, el('div', { class: 'vg-pagina' }, el('h1', {}, `📨 Candidatura: ${v.cargo}`), el('p', {}, `🏢 ${v.empresa} · 📍 ${v.cidade}`), form)) };
      }
      if (caminho === '/enviado') {
        return { titulo: 'Candidatura enviada – Emprega Já', conteudo: `<div class="vg-site">${CAB_VAGAS}<div class="vg-pagina"><h1>✅ Candidatura enviada!</h1><p>A empresa recebeu o seu currículo. Fique de olho no seu e-mail e no telefone.</p><p>${link('empregaja.com.br', 'Ver outras vagas')}</p></div></div>` };
      }
      if (caminho === '/golpe') {
        return { titulo: 'Atenção – golpe', conteudo: `<div class="golpe-pagina"><div class="golpe-icone">🚨</div><h1>Era um GOLPE!</h1><p>Vaga de emprego de verdade <b>NUNCA cobra taxa</b> para você se candidatar. Salário alto demais, "sem experiência" e pressa ("restam 3 vagas") são sinais de golpe.</p><p>Neste treino nenhum dinheiro saiu. Na vida real, denuncie o anúncio.</p>${link('empregaja.com.br', '← Voltar para as vagas')}</div>` };
      }
      const cidade = busca.cidade || '', area = busca.area || '';
      const lista = VAGAS.filter((v) => (!cidade || v.cidade === cidade) && (!area || v.area === area));
      const opcoes = (lista2, atual) => lista2.map((x) => `<option ${x === atual ? 'selected' : ''}>${e(x)}</option>`).join('');
      if (cidade || area) CE.emitir('vagas:filtro', { cidade, area, resultados: lista.length });
      return {
        titulo: 'Emprega Já – vagas de emprego',
        conteudo: `<div class="vg-site">${CAB_VAGAS}<div class="vg-pagina"><h1>Encontre o seu emprego</h1>
          <form class="vg-filtro" data-formulario="filtro"><label>Cidade <select name="cidade" data-campo="cidade"><option value="">Todas</option>${opcoes(['Porto Velho', 'Ji-Paraná', 'Ariquemes'], cidade)}</select></label>
          <label>Área <select name="area" data-campo="area"><option value="">Todas</option>${opcoes(['Escritório', 'Comércio', 'Saúde'], area)}</select></label><button class="vg-botao" type="submit">🔍 Filtrar</button></form>
          <p>${lista.length} vaga${lista.length === 1 ? '' : 's'} encontrada${lista.length === 1 ? '' : 's'}:</p>
          <div class="vg-lista">${lista.map((v) => link(`empregaja.com.br/vaga?id=${v.id}`, `<b>${e(v.cargo)}</b><span>🏢 ${e(v.empresa)} · 📍 ${e(v.cidade)}</span><span class="vg-salario">💵 ${e(v.salario)}</span>`, `class="vg-vaga${v.golpe ? ' suspeita' : ''}" data-vaga="${v.id}"`)).join('')}</div></div></div>`,
      };
    },
    acao(nome, _el, ctx) {
      if (nome === 'pagar-taxa') { ctx.caiuNoGolpe(); ctx.ir('empregaja.com.br/golpe'); }
    },
    enviar(formulario, d, ctx) {
      if (formulario === 'filtro') ctx.ir(`empregaja.com.br?cidade=${encodeURIComponent(d.cidade || '')}&area=${encodeURIComponent(d.area || '')}`);
      if (formulario === 'candidatura') {
        if (!d.nome || !d.email || !d.curriculo) { CE.avisar('Preencha o nome, o e-mail e escolha o arquivo do currículo.'); return; }
        CE.emitir('vagas:candidatura', { vaga: d.vaga, nome: d.nome, email: d.email, curriculo: d.curriculo });
        ctx.ir('empregaja.com.br/enviado');
      }
    },
  };

  // ---------- Sala de Reunião (videochamada) ----------
  CE.SITES['reuniao.escola'] = {
    dominio: 'reuniao.escola', nome: 'Sala de Reunião', icone: '🎥', seguro: true,
    abrir({ caminho, estado }) {
      const r = estado.reuniao || (estado.reuniao = { camera: false, microfone: false, mao: false, dentro: false, chat: [] });
      if (caminho === '/sala' && r.dentro) return { titulo: 'Reunião: Entrevista de treino', conteudo: telaSala(r) };
      const previa = el('div', { class: 'rn-previa' + (r.camera ? ' ligada' : '') }, r.camera ? '🙂' : '📷 Câmera desligada');
      const botao = (campo, ligado, desligado) => el('button', { class: 'rn-botao' + (r[campo] ? ' ligado' : ''), 'data-alternar': campo, onclick: (ev) => {
        r[campo] = !r[campo];
        ev.currentTarget.classList.toggle('ligado', r[campo]);
        ev.currentTarget.textContent = r[campo] ? ligado : desligado;
        previa.className = 'rn-previa' + (r.camera ? ' ligada' : '');
        previa.textContent = r.camera ? '🙂' : '📷 Câmera desligada';
        CE.emitir(`reuniao:${campo}`, { ligado: r[campo], antes: true });
      } }, r[campo] ? ligado : desligado);
      return {
        titulo: 'Sala de Reunião – entrar',
        conteudo: el('div', { class: 'rn-site' },
          el('h1', {}, '🎥 Entrevista de emprego (treino)'),
          el('p', {}, 'Antes de entrar: ligue a câmera e o microfone, confira se o fundo está arrumado e se o rosto está iluminado.'),
          el('div', { class: 'rn-entrar' }, previa,
            el('div', { class: 'rn-controles' }, botao('camera', '📷 Câmera ligada', '📷 Ligar câmera'), botao('microfone', '🎤 Microfone ligado', '🎤 Ligar microfone'),
              el('button', { class: 'rn-botao principal', 'data-acao': 'entrar-reuniao', 'data-link': 'reuniao.escola/sala', onclick: () => {
                r.dentro = true;
                CE.emitir('reuniao:entrou', { camera: r.camera, microfone: r.microfone });
              } }, 'Entrar na reunião')))),
      };
    },
  };
  function telaSala(r) {
    const chat = el('div', { class: 'rn-chat-lista' });
    const pessoas = el('div', { class: 'rn-grade' });
    const fala = (quem, texto) => { r.chat.push([quem, texto]); desenharChat(); };
    function desenharChat() { chat.replaceChildren(...r.chat.map(([q, t]) => el('p', {}, el('b', {}, q + ': '), t))); chat.scrollTop = chat.scrollHeight; }
    function desenharPessoas() {
      pessoas.replaceChildren(
        el('div', { class: 'rn-pessoa ligada' }, el('span', {}, '👩‍💼'), el('small', {}, 'Ana (Recrutadora)')),
        el('div', { class: 'rn-pessoa' + (r.camera ? ' ligada' : ''), 'data-voce': '' }, el('span', {}, r.camera ? '🙂' : '👤'), el('small', {}, `Você ${r.microfone ? '🎤' : '🔇'}${r.mao ? ' ✋' : ''}`)));
    }
    const alternar = (campo, rotulo) => el('button', { class: 'rn-botao' + (r[campo] ? ' ligado' : ''), 'data-alternar': campo, title: rotulo, onclick: (ev) => {
      r[campo] = !r[campo];
      ev.currentTarget.classList.toggle('ligado', r[campo]);
      desenharPessoas();
      CE.emitir(`reuniao:${campo}`, { ligado: r[campo] });
      if (campo === 'mao' && r[campo]) setTimeout(() => fala('Ana', 'Pode falar! Estou ouvindo você.'), 900);
      if (campo === 'camera' && r[campo]) setTimeout(() => fala('Ana', 'Agora estou vendo você. Ótimo!'), 700);
    } }, rotulo);
    const campoChat = el('input', { class: 'rn-campo', 'data-campo': 'chat', placeholder: 'Escreva uma mensagem…' });
    const enviarChat = () => {
      const t = campoChat.value.trim();
      if (!t) return;
      fala('Você', t);
      campoChat.value = '';
      CE.emitir('reuniao:chat', { texto: t });
      setTimeout(() => fala('Ana', /obrigad/i.test(t) ? 'Eu que agradeço! Entraremos em contato.' : 'Recebi a sua mensagem, obrigada!'), 900);
    };
    campoChat.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); enviarChat(); } });
    if (!r.chat.length) setTimeout(() => { fala('Ana', 'Olá! Seja bem-vindo(a) à entrevista.'); if (!r.camera) fala('Ana', 'Pode ligar a sua câmera, por favor?'); }, 600);
    desenharChat();
    desenharPessoas();
    return el('div', { class: 'rn-site sala' },
      el('div', { class: 'rn-topo' }, el('b', {}, '🎥 Entrevista de treino'), el('span', {}, '⏺ Reunião em andamento')),
      el('div', { class: 'rn-meio' }, pessoas, el('aside', { class: 'rn-chat' }, el('b', {}, '💬 Chat'), chat, el('div', { class: 'rn-chat-enviar' }, campoChat, el('button', { class: 'rn-botao', 'data-acao': 'enviar-chat', onclick: enviarChat }, 'Enviar')))),
      el('div', { class: 'rn-barra' },
        alternar('microfone', '🎤 Microfone'), alternar('camera', '📷 Câmera'), alternar('mao', '✋ Levantar a mão'),
        el('button', { class: 'rn-botao sair', 'data-acao': 'sair-reuniao', 'data-link': 'reuniao.escola', onclick: () => {
          r.dentro = false; r.chat = []; r.mao = false;
          CE.emitir('reuniao:saiu', {});
        } }, '📞 Sair')));
  }

  CE.INDICE_BUSCA.push(
    { url: 'escudodigital.org.br', titulo: 'Escudo Digital – segurança na internet', descricao: 'Teste a força da sua senha, ative a verificação em duas etapas e aprenda a reconhecer golpes e boatos.', palavras: 'senha segura golpe fake news boato privacidade duas etapas segurança' },
    { url: 'escudodigital.org.br/senha', titulo: 'Como criar uma senha forte – Escudo Digital', descricao: 'Teste grátis da força da senha, sem enviar nada para a internet.', palavras: 'senha forte segura criar' },
    { url: 'empregaja.com.br', titulo: 'Emprega Já – vagas de emprego em Rondônia', descricao: 'Vagas de emprego em Porto Velho, Ji-Paraná e Ariquemes. Candidate-se online.', palavras: 'emprego vaga trabalho currículo porto velho rondônia' },
    { url: 'reuniao.escola', titulo: 'Sala de Reunião – videochamada', descricao: 'Treine uma entrevista de emprego por vídeo: câmera, microfone e chat.', palavras: 'videochamada reunião entrevista vídeo câmera' },
  );
})();
