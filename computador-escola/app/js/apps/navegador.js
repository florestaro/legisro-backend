// Navegador de internet de treino: abas, barra de endereço, voltar/avançar, favoritos e sites offline.
// Os sites ficam em js/navegador/sites.js (CE.SITES). Nada aqui acessa a internet de verdade.
(function () {
  const INICIO = 'inicio';
  const FAVORITOS_PADRAO = ['procura.com.br', 'saberlivre.org', 'jornaldobairro.com.br'];

  // "https://www.Cozinha Facil.com.br/receita/bolo?x=1" -> { dominio, caminho, busca }
  function interpretar(endereco) {
    let texto = String(endereco || '').trim().toLowerCase();
    if (!texto || texto === INICIO) return { dominio: INICIO, caminho: '/', busca: {} };
    texto = texto.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '');
    const [semBusca, consulta = ''] = texto.split('?');
    const barra = semBusca.indexOf('/');
    const dominio = barra === -1 ? semBusca : semBusca.slice(0, barra);
    const caminho = barra === -1 ? '/' : semBusca.slice(barra) || '/';
    const busca = Object.fromEntries(new URLSearchParams(consulta));
    return { dominio, caminho, busca };
  }

  function montar({ dominio, caminho, busca }) {
    if (dominio === INICIO) return INICIO;
    const q = new URLSearchParams(busca).toString();
    return `${dominio}${caminho === '/' ? '' : caminho}${q ? '?' + q : ''}`;
  }

  function exibir(url) {
    if (url === INICIO) return '';
    const { dominio } = interpretar(url);
    const site = CE.SITES[dominio];
    return `${site && !site.seguro ? 'http' : 'https'}://www.${url}`;
  }

  // O estado das compras e dos campos fica guardado enquanto o navegador estiver aberto.
  CE.navegadorEstado = { carrinho: [] };

  CE.registrarApp({
    id: 'navegador',
    nome: 'Navegador',
    icone: '🌐',
    largura: 1000,
    altura: 640,
    abrir(corpo, janela, argumento) {
      const abas = [];
      let atual = null;
      let favoritos = [...FAVORITOS_PADRAO];

      const listaAbas = CE.el('div', { class: 'nav-abas' });
      const campo = CE.el('input', { class: 'nav-endereco', 'aria-label': 'Barra de endereço', spellcheck: 'false', autocomplete: 'off', placeholder: 'Pesquise ou digite um endereço' });
      const cadeado = CE.el('span', { class: 'nav-cadeado' });
      const botaoFavorito = CE.el('button', { class: 'nav-botao', 'data-acao': 'favoritar', title: 'Adicionar aos favoritos', onclick: favoritar }, '☆');
      const barraFavoritos = CE.el('div', { class: 'nav-favoritos' });
      const pagina = CE.el('div', { class: 'nav-pagina', tabindex: '-1' });
      const status = CE.el('div', { class: 'nav-status' });

      const botao = (acao, rotulo, dica, funcao) => CE.el('button', { class: 'nav-botao', 'data-acao': acao, title: dica, onclick: funcao }, rotulo);
      const voltar = botao('voltar', '←', 'Voltar (página anterior)', () => andar(-1));
      const avancar = botao('avancar', '→', 'Avançar', () => andar(1));

      async function carregarFavoritos() {
        const p = await CE.sessao.progresso();
        if (p.navegador && p.navegador.favoritos) favoritos = p.navegador.favoritos;
        desenharFavoritos();
      }

      function desenharFavoritos() {
        barraFavoritos.replaceChildren(CE.el('span', { class: 'nav-favoritos-rotulo' }, '⭐ Favoritos:'), ...favoritos.map((url) => {
          const site = CE.SITES[interpretar(url).dominio];
          return CE.el('button', { class: 'nav-favorito', 'data-favorito': url, onclick: () => ir(url) }, `${site ? site.icone : '🔖'} ${site ? site.nome : url}`);
        }));
      }

      async function favoritar() {
        if (!atual || atual.url === INICIO) return;
        const url = atual.url;
        if (favoritos.includes(url)) {
          favoritos = favoritos.filter((f) => f !== url);
          CE.avisar('Removido dos favoritos.');
        } else {
          favoritos.push(url);
          CE.avisar('⭐ Adicionado aos favoritos!');
          CE.emitir('navegador:favorito', { url, ...interpretar(url) });
        }
        await CE.sessao.atualizarProgresso((p) => { p.navegador = p.navegador || {}; p.navegador.favoritos = favoritos; });
        desenharFavoritos();
        atualizarBarra();
      }

      function novaAba(url = INICIO, emitir = true) {
        const aba = { id: Date.now() + Math.random(), historico: [], indice: -1, url: INICIO, titulo: 'Nova aba' };
        abas.push(aba);
        trocarAba(aba, false);
        ir(url);
        if (emitir) CE.emitir('navegador:aba-nova');
        return aba;
      }

      function trocarAba(aba, emitir = true) {
        atual = aba;
        desenharAbas();
        if (aba.indice >= 0) mostrar(aba.url, false);
        if (emitir) CE.emitir('navegador:aba-trocada', { url: aba.url });
      }

      function fecharAba(aba) {
        sairDaPagina(aba);
        const i = abas.indexOf(aba);
        abas.splice(i, 1);
        CE.emitir('navegador:aba-fechada', { url: aba.url });
        if (!abas.length) { janela.fechar(); return; }
        if (aba === atual) trocarAba(abas[Math.max(0, i - 1)], false);
        else desenharAbas();
      }

      function desenharAbas() {
        listaAbas.replaceChildren(...abas.map((aba) => CE.el('div', { class: 'nav-aba' + (aba === atual ? ' ativa' : ''), 'data-aba': abas.indexOf(aba), onclick: () => aba !== atual && trocarAba(aba) },
          CE.el('span', { class: 'nav-aba-titulo' }, aba.titulo),
          CE.el('button', { class: 'nav-aba-fechar', title: 'Fechar aba', 'data-acao': 'fechar-aba', onclick: (e) => { e.stopPropagation(); fecharAba(aba); } }, '✕'))),
          CE.el('button', { class: 'nav-aba-nova', title: 'Nova aba', 'data-acao': 'nova-aba', onclick: () => novaAba() }, '+'));
      }

      // Sites de golpe: sair da página sem cair no golpe conta como "golpe evitado".
      function sairDaPagina(aba) {
        const anterior = aba && aba.url && interpretar(aba.url);
        const site = anterior && CE.SITES[anterior.dominio];
        if (site && site.golpe && !aba.caiuNoGolpe && anterior.caminho !== '/alerta') CE.emitir('golpe:evitado', { site: anterior.dominio });
        if (aba) aba.caiuNoGolpe = false;
      }

      function resolver(texto) {
        const limpo = String(texto).trim();
        // Sem ponto e com espaço (ou palavra solta que não é site): vira pesquisa, como nos navegadores de verdade.
        if (limpo && !limpo.includes('.') && limpo.toLowerCase() !== INICIO) {
          CE.emitir('navegador:pesquisa', { termo: limpo, onde: 'barra' });
          return montar({ dominio: 'procura.com.br', caminho: '/busca', busca: { q: limpo } });
        }
        return montar(interpretar(limpo));
      }

      function ir(endereco) {
        const url = resolver(endereco);
        sairDaPagina(atual);
        atual.historico = atual.historico.slice(0, atual.indice + 1);
        atual.historico.push(url);
        atual.indice = atual.historico.length - 1;
        mostrar(url);
      }

      function andar(passo) {
        const novo = atual.indice + passo;
        if (novo < 0 || novo >= atual.historico.length) return;
        sairDaPagina(atual);
        atual.indice = novo;
        mostrar(atual.historico[novo]);
        CE.emitir(passo < 0 ? 'navegador:voltou' : 'navegador:avancou', { url: atual.url });
      }

      function atualizarBarra() {
        const { dominio } = interpretar(atual.url);
        const site = CE.SITES[dominio];
        campo.value = exibir(atual.url);
        cadeado.replaceChildren();
        cadeado.className = 'nav-cadeado';
        if (dominio !== INICIO && site) {
          cadeado.classList.add(site.seguro ? 'seguro' : 'inseguro');
          cadeado.textContent = site.seguro ? '🔒' : '⚠️ Não seguro';
          cadeado.title = site.seguro ? 'Conexão segura: os dados vão protegidos.' : 'Este site NÃO é seguro. Não digite senhas nem dados de cartão!';
        }
        voltar.disabled = atual.indice <= 0;
        avancar.disabled = atual.indice >= atual.historico.length - 1;
        botaoFavorito.textContent = favoritos.includes(atual.url) ? '★' : '☆';
        botaoFavorito.classList.toggle('ligado', favoritos.includes(atual.url));
      }

      function mostrar(url, emitir = true) {
        atual.url = url;
        const destino = interpretar(url);
        const site = CE.SITES[destino.dominio];
        const contexto = {
          ...destino, url,
          ir: (u) => ir(u),
          caiuNoGolpe: () => { atual.caiuNoGolpe = true; CE.emitir('golpe:caiu', { site: destino.dominio }); },
          estado: CE.navegadorEstado,
          favoritos,
        };
        let conteudo, titulo;
        if (destino.dominio === INICIO) {
          ({ conteudo, titulo } = CE.paginaInicial(contexto));
        } else if (!site) {
          ({ conteudo, titulo } = CE.paginaNaoEncontrada(contexto));
        } else {
          const r = site.abrir(contexto);
          conteudo = r.conteudo;
          titulo = r.titulo || site.nome;
        }
        atual.titulo = titulo;
        pagina.replaceChildren(typeof conteudo === 'string' ? CE.el('div', { class: 'site', html: conteudo }) : conteudo);
        pagina.scrollTop = 0;
        pagina.dataset.site = destino.dominio;
        janela.definirTitulo(titulo);
        desenharAbas();
        atualizarBarra();
        status.textContent = '';
        if (emitir) CE.emitir('navegador:visitou', { url, dominio: destino.dominio, caminho: destino.caminho, titulo, seguro: !!(site && site.seguro), existe: !!site || destino.dominio === INICIO });
      }

      // Cliques em links e envio de formulários dos sites.
      pagina.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]');
        if (link) {
          e.preventDefault();
          CE.emitir('navegador:link', { url: link.dataset.link });
          if (link.dataset.novaAba !== undefined) novaAba(link.dataset.link); else ir(link.dataset.link);
          return;
        }
        const acao = e.target.closest('[data-site-acao]');
        if (acao) {
          const site = CE.SITES[interpretar(atual.url).dominio];
          if (site && site.acao) site.acao(acao.dataset.siteAcao, acao, { ir, url: atual.url, estado: CE.navegadorEstado, caiuNoGolpe: () => { atual.caiuNoGolpe = true; CE.emitir('golpe:caiu', { site: interpretar(atual.url).dominio }); } });
        }
      });
      pagina.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const dados = Object.fromEntries(new FormData(form));
        const site = CE.SITES[interpretar(atual.url).dominio] || CE.SITES['procura.com.br'];
        if (form.dataset.formulario === 'busca') {
          const termo = (dados.q || '').trim();
          if (!termo) return;
          CE.emitir('navegador:pesquisa', { termo, onde: 'procura' });
          ir(montar({ dominio: 'procura.com.br', caminho: '/busca', busca: { q: termo } }));
          return;
        }
        if (site.enviar) site.enviar(form.dataset.formulario, dados, { ir, url: atual.url, estado: CE.navegadorEstado, caiuNoGolpe: () => { atual.caiuNoGolpe = true; CE.emitir('golpe:caiu', { site: interpretar(atual.url).dominio }); } });
      });
      pagina.addEventListener('mouseover', (e) => {
        const link = e.target.closest('[data-link]');
        status.textContent = link ? exibir(resolver(link.dataset.link)) : '';
      });
      pagina.addEventListener('scroll', () => {
        if (pagina.scrollTop > 0 && pagina.scrollTop + pagina.clientHeight >= pagina.scrollHeight - 30) {
          if (pagina.dataset.rolouFim !== atual.url) {
            pagina.dataset.rolouFim = atual.url;
            CE.emitir('navegador:rolou-fim', { url: atual.url });
          }
        }
      });

      campo.addEventListener('focus', () => campo.select());
      campo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); if (campo.value.trim()) { ir(campo.value); CE.emitir('navegador:digitou-endereco', { texto: campo.value }); pagina.focus(); } }
        if (e.key === 'Escape') { atualizarBarra(); campo.blur(); }
      });

      corpo.classList.add('navegador');
      corpo.append(
        listaAbas,
        CE.el('div', { class: 'nav-barra' },
          voltar, avancar,
          botao('recarregar', '⟳', 'Recarregar a página', () => { mostrar(atual.url, false); CE.emitir('navegador:recarregou', { url: atual.url }); }),
          botao('inicio', '🏠', 'Página inicial', () => { ir(INICIO); CE.emitir('navegador:inicio'); }),
          CE.el('div', { class: 'nav-endereco-caixa' }, cadeado, campo),
          botaoFavorito,
        ),
        barraFavoritos,
        pagina,
        status,
      );
      desenharFavoritos();
      carregarFavoritos();
      novaAba((argumento && argumento.url) || INICIO, false);

      return {
        receber(arg) { if (arg && arg.url) novaAba(arg.url); },
        aoFechar() { abas.forEach((a) => sairDaPagina(a)); return true; },
      };
    },
  });

  CE.navegadorUtil = { interpretar, montar, exibir };
})();
