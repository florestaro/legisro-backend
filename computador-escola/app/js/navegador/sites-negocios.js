// Sites de treino de dinheiro e negócios (nível Avançado):
//  • Banco Escola: fatura do cartão de crédito (pagar o total, o mínimo ou parcelar) e simulador de empréstimo com CET;
//  • creditojaaprovado.com: site FALSO de empréstimo (golpe da taxa antecipada);
//  • Feira Online: anunciar um produto com foto e preço, e o comprador do "comprovante falso";
//  • Portal do Empreendedor: abrir o MEI (grátis), baixar o certificado e pagar o DAS do mês no banco.
// Os anúncios e o MEI ficam no progresso do aluno ("feira" e "mei"): valem de uma aula para a outra e em qualquer
// computador da sala.
window.CE = window.CE || {};

(function () {
  const e = (t) => CE.escapar(String(t == null ? '' : t));
  const link = (url, texto, extra = '') => `<a href="#" data-link="${url}" ${extra}>${texto}</a>`;
  const real = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const lerValor = (t) => Number(String(t == null ? '' : t).replace(/[R$\s.]/g, '').replace(',', '.'));
  const soDigitos = (t) => String(t || '').replace(/\D/g, '');
  const BANCO = 'bancoescola.com.br', FEIRA = 'feiraonline.com.br', MEI = 'empreendedor.org.br', GOLPE = 'creditojaaprovado.com';

  // ---------- O que fica guardado no progresso do aluno ----------
  let dono = null, feira = { anuncios: [] }, mei = null;
  const guardar = (campo, valor) => {
    const id = dono;
    if (!CE.sessao.usuario || CE.sessao.usuario.id !== id) return Promise.resolve();
    return CE.sessao.atualizarProgresso((p) => { p[campo] = valor; }).catch((er) => CE.avisar(er.message));
  };
  CE.negocios = {
    async carregar() {
      const id = CE.sessao.usuario && CE.sessao.usuario.id;
      dono = id; feira = { anuncios: [] }; mei = null; rascunho = {}; conversa = {};
      if (!id) return;
      try { const p = await CE.sessao.progresso(); if (dono === id) { feira = p.feira && Array.isArray(p.feira.anuncios) ? p.feira : { anuncios: [] }; mei = p.mei || null; } } catch { /* sem conexão */ }
    },
    anuncios: () => feira.anuncios,
    mei: () => mei,
    // Para as aulas: um anúncio pronto (se o aluno ainda não tem) e a conversa com o comprador começando de novo.
    async garantirAnuncio() {
      if (feira.anuncios.length) return;
      const foto = CE.celular ? await miniatura(CE.celular.imagemDe({ cena: 'bolo' })) : null;
      feira = { ...feira, anuncios: [{ id: `a${Date.now().toString(36)}`, titulo: 'Bolo de pote de chocolate', preco: 12, categoria: 'Comida', descricao: 'Bolo de pote de chocolate com brigadeiro, 250 ml. Entrego no bairro.', foto, em: Date.now(), visitas: 7 }] };
      await guardar('feira', feira);
    },
    reiniciarConversa() { conversa = {}; },
    // A fatura do cartão volta a esperar o pagamento (para treinar de novo).
    novaFatura() { if (CE.navegadorEstado && CE.navegadorEstado.banco) delete CE.navegadorEstado.banco.fatura; },
  };

  // ======================= Banco Escola: cartão e empréstimo =======================
  const FATURA = { total: 1000, minimo: 150, juros: 14.5, parcelas: 12, parcela: 128.75, vencimento: '10/12' };
  const CREDITO = {
    pessoal: { nome: 'Crédito pessoal', taxa: 6.5, cet: 8.2, para: 'qualquer pessoa com conta' },
    consignado: { nome: 'Consignado (desconta no salário ou na aposentadoria)', taxa: 1.8, cet: 2.1, para: 'aposentados, pensionistas e servidores' },
    especial: { nome: 'Cheque especial', taxa: 8, cet: 8.4, para: 'já vem na conta: é o mais caro' },
  };
  // Parcela fixa (tabela Price) com o CET ao mês.
  const parcelaDe = (valor, n, cet) => { const i = cet / 100; return (valor * i) / (1 - (1 + i) ** -n); };
  const banco = CE.SITES[BANCO];
  const estadoBanco = (estado) => (estado.banco || {});
  const novosNoMenu = `${link(`${BANCO}/cartao`, '💳 Cartão', 'data-banco="cartao"')}${link(`${BANCO}/emprestimo`, '💸 Empréstimo', 'data-banco="emprestimo"')}`;
  const menu = `<nav class="bc-menu">${link(`${BANCO}/conta`, '🏠 Início', 'data-banco="inicio"')}${link(`${BANCO}/extrato`, '📄 Extrato', 'data-banco="extrato"')}${link(`${BANCO}/pix`, '💠 Pix', 'data-banco="pix"')}${link(`${BANCO}/boleto`, '🧾 Pagar boleto', 'data-banco="boleto"')}${novosNoMenu}</nav>`;
  const cabeca = `<header class="bc-cabecalho"><span class="bc-logo">🏦 Banco Escola</span><span>Olá, ${CE.BANCO_TREINO.titular}</span>${link(`${BANCO}/sair`, 'Sair 🚪', 'class="bc-sair" data-banco="sair"')}</header>`;
  CE.SITES[BANCO] = {
    ...banco,
    abrir(ctx) {
      const r = banco.abrir(ctx);
      const b = estadoBanco(ctx.estado);
      if (!b.logado) return r;
      if (ctx.caminho === '/cartao') return cartao(b, ctx.busca || {});
      if (ctx.caminho === '/emprestimo') return emprestimo(ctx.busca || {});
      // Nas páginas do banco, o menu ganha Cartão e Empréstimo; na página inicial, os atalhos também.
      if (r && typeof r.conteudo === 'string' && r.conteudo.includes('<nav class="bc-menu">')) r.conteudo = r.conteudo.replace('</nav>', `${novosNoMenu}</nav>`);
      if (r && typeof r.conteudo === 'string' && r.conteudo.includes('<div class="bc-atalhos">')) {
        r.conteudo = r.conteudo.replace('<div class="bc-atalhos">', `<div class="bc-atalhos">${link(`${BANCO}/cartao`, '💳<span>Cartão</span>', 'class="bc-atalho" data-banco="cartao"')}${link(`${BANCO}/emprestimo`, '💸<span>Empréstimo</span>', 'class="bc-atalho" data-banco="emprestimo"')}`);
      }
      return r;
    },
    acao(nome, el, ctx) {
      const b = estadoBanco(ctx.estado);
      if (/^fatura-/.test(nome)) {
        const opcao = nome.slice(7);
        b.fatura = { opcao, em: Date.now() };
        const valor = opcao === 'total' ? FATURA.total : opcao === 'minimo' ? FATURA.minimo : FATURA.parcela;
        if (opcao !== 'parcelar' && typeof b.saldo === 'number') {
          b.saldo -= valor;
          (b.extrato || []).push([new Date().toLocaleDateString('pt-BR').slice(0, 5), `Fatura do cartão (${opcao === 'total' ? 'total' : 'mínimo'})`, -valor]);
        }
        CE.emitir('banco:fatura', { opcao, valor });
        ctx.ir(`${BANCO}/cartao?r=${opcao}`);
        return;
      }
      if (banco.acao) banco.acao(nome, el, ctx);
    },
    enviar(formulario, d, ctx) {
      if (formulario === 'simular-emprestimo') {
        const valor = lerValor(d.valor), parcelas = Math.round(Number(d.parcelas)), tipo = CREDITO[d.tipo] ? d.tipo : 'pessoal';
        if (!(valor >= 100 && valor <= 50000)) { ctx.ir(`${BANCO}/emprestimo?erro=valor`); return; }
        const c = CREDITO[tipo], p = parcelaDe(valor, parcelas, c.cet);
        CE.emitir('banco:emprestimo-simulado', { tipo, valor, parcelas, cet: c.cet, parcela: Math.round(p * 100) / 100, total: Math.round(p * parcelas * 100) / 100 });
        ctx.ir(`${BANCO}/emprestimo?valor=${valor}&parcelas=${parcelas}&tipo=${tipo}`);
        return;
      }
      banco.enviar(formulario, d, ctx);
    },
  };
  function cartao(b, busca) {
    const r = busca.r;
    const resultado = !r ? '' : r === 'total'
      ? `<div class="bc-confirmar ng-bom" data-fatura-resultado="total"><h2>✅ Fatura paga inteira!</h2><p>Você pagou ${real(FATURA.total)} e não paga NENHUM juro. É assim que o cartão vale a pena: só gastar o que dá para pagar no fim do mês.</p></div>`
      : r === 'minimo'
        ? `<div class="bc-confirmar ng-ruim" data-fatura-resultado="minimo"><h2>⚠️ Você pagou só o mínimo</h2><p>Os ${real(FATURA.total - FATURA.minimo)} que faltaram entraram no <b>ROTATIVO</b>, com juros de <b>${FATURA.juros}% ao mês</b>.</p>
          <p>No mês que vem, essa parte já vira <b>${real((FATURA.total - FATURA.minimo) * (1 + FATURA.juros / 100))}</b>. Em um ano pagando só o mínimo, a dívida pode passar de 4 vezes o valor!</p></div>`
        : `<div class="bc-confirmar" data-fatura-resultado="parcelar"><h2>📆 Fatura parcelada</h2><p>${FATURA.parcelas}x de ${real(FATURA.parcela)} = <b>${real(FATURA.parcela * FATURA.parcelas)}</b> no total. Mais barato que o rotativo, mas ainda são ${real(FATURA.parcela * FATURA.parcelas - FATURA.total)} de juros.</p></div>`;
    return { titulo: 'Cartão de crédito – Banco Escola', conteudo: `${cabeca}${menu}<div class="bc-pagina"><h1>💳 Cartão de crédito — fatura de novembro</h1>
      <div class="bc-confirmar ng-fatura"><p>Total da fatura: <b class="bc-valor" data-fatura-total>${real(FATURA.total)}</b></p><p>Pagamento mínimo: <b>${real(FATURA.minimo)}</b></p><p>Vencimento: <b>${FATURA.vencimento}</b></p>
        <p class="ng-letra-miuda">Juros do rotativo (se não pagar tudo): <b>${FATURA.juros}% ao mês</b> · CET: 407% ao ano</p></div>
      ${b.fatura ? '' : `<p>Como você quer pagar?</p><div class="bc-botoes">
        <button class="bc-botao" data-site-acao="fatura-total">Pagar o total (${real(FATURA.total)})</button>
        <button class="bc-botao secundario" data-site-acao="fatura-minimo">Pagar o mínimo (${real(FATURA.minimo)})</button>
        <button class="bc-botao secundario" data-site-acao="fatura-parcelar">Parcelar em ${FATURA.parcelas}x de ${real(FATURA.parcela)}</button></div>`}
      ${resultado}
      <p class="bc-aviso">💡 Regra de ouro do cartão: pague SEMPRE o total da fatura. O rotativo é um dos juros mais caros do Brasil.</p></div>` };
  }
  function emprestimo(busca) {
    const valor = lerValor(busca.valor), parcelas = Number(busca.parcelas), tipo = busca.tipo;
    const tem = valor > 0 && parcelas > 0 && CREDITO[tipo];
    const tabela = tem ? `<table class="bc-tabela ng-credito"><thead><tr><th>Tipo</th><th>Juros ao mês</th><th>CET ao mês</th><th>Parcela</th><th>Total a pagar</th></tr></thead><tbody>
      ${Object.entries(CREDITO).map(([id, c]) => { const p = parcelaDe(valor, parcelas, c.cet); return `<tr class="${id === tipo ? 'ng-escolhido' : ''}" data-credito="${id}"><td>${c.nome}</td><td>${String(c.taxa).replace('.', ',')}%</td><td><b>${String(c.cet).replace('.', ',')}%</b></td><td>${real(p)}</td><td data-total-credito="${id}"><b>${real(p * parcelas)}</b></td></tr>`; }).join('')}
      </tbody></table><p class="ng-letra-miuda">Simulação de ${real(valor)} em ${parcelas}x. CET (Custo Efetivo Total) = juros + tarifas + seguros: é o número para comparar.</p>` : '';
    return { titulo: 'Empréstimo – Banco Escola', conteudo: `${cabeca}${menu}<div class="bc-pagina"><h1>💸 Empréstimo: simule antes de contratar</h1>
      ${busca.erro ? '<p class="bc-erro">❌ Escolha um valor entre R$ 100 e R$ 50.000.</p>' : ''}
      <form class="bc-form" data-formulario="simular-emprestimo"><label>Quanto você precisa? <input name="valor" inputmode="decimal" placeholder="1.000,00" autocomplete="off" value="${tem ? String(valor).replace('.', ',') : ''}"></label>
        <label>Em quantas parcelas? <select name="parcelas">${[6, 12, 24].map((n) => `<option value="${n}" ${n === parcelas ? 'selected' : ''}>${n} parcelas</option>`).join('')}</select></label>
        <label>Tipo de crédito <select name="tipo">${Object.entries(CREDITO).map(([id, c]) => `<option value="${id}" ${id === tipo ? 'selected' : ''}>${c.nome}</option>`).join('')}</select></label>
        <button class="bc-botao" type="submit">Simular</button></form>${tabela}
      <div class="bc-dicas"><b>🧠 Antes de pegar empréstimo</b><ul><li>Precisa mesmo? Dá para juntar dinheiro antes?</li><li>A parcela cabe no orçamento <b>todo mês</b>?</li><li>Compare o <b>CET</b>, não só a parcela.</li><li>Banco <b>nunca</b> pede depósito ou taxa para liberar empréstimo.</li></ul></div></div>` };
  }

  // ======================= Site FALSO de empréstimo =======================
  CE.SITES[GOLPE] = {
    dominio: GOLPE, nome: 'Crédito Já Aprovado (FALSO)', icone: '💸', seguro: false, golpe: true,
    abrir({ caminho }) {
      if (caminho === '/alerta') {
        return { titulo: 'Atenção: golpe!', conteudo: `<div class="golpe-alerta"><h1>⚠️ Isto era um GOLPE (de treino): o golpe do empréstimo</h1>
          <p>O site prometia dinheiro fácil, mas queria que VOCÊ pagasse primeiro uma "taxa". Depois do Pix, o golpista some e o empréstimo nunca chega.</p>
          <h2>Como perceber:</h2><ul><li>💸 Pede <b>taxa, depósito ou "seguro" ANTES</b> de liberar o dinheiro. Banco de verdade desconta do empréstimo, nunca pede antes.</li>
          <li>🙈 "<b>Sem consulta ao SPC/Serasa</b>", "aprovado na hora": promessa boa demais.</li><li>⏰ Pressa: "só hoje".</li><li>🔓 Endereço estranho e "Não seguro" na barra de endereço.</li>
          <li>📱 Chegou por WhatsApp, SMS ou ligação de "correspondente bancário".</li></ul>
          <p><b>Se caiu de verdade:</b> avise o seu banco na hora (o Pix pode ser contestado pelo MED), faça um boletim de ocorrência e guarde as conversas.</p>${link('inicio', '🏠 Voltar para a página inicial', 'class="golpe-voltar"')}</div>` };
      }
      return { titulo: 'CRÉDITO JÁ APROVADO – dinheiro na hora!', conteudo: `<div class="ng-golpe-pagina"><header class="ng-golpe-topo">💸 CRÉDITO JÁ APROVADO</header>
        <h1>Até <span>R$ 10.000</span> na sua conta em 10 minutos!</h1><p class="ng-golpe-faixa">✅ SEM CONSULTA AO SPC/SERASA · ✅ NEGATIVADO PODE · ⏰ SÓ HOJE!</p>
        <form class="ng-golpe-form" data-formulario="pedir-credito"><label>Nome completo <input name="nome" autocomplete="off"></label><label>CPF <input name="cpf" autocomplete="off"></label>
          <label>Quanto você quer? <input name="valor" autocomplete="off" placeholder="R$ 5.000,00"></label>
          <p>Para liberar, pague a <b>TAXA DE CADASTRO de R$ 149,90</b> por Pix. O dinheiro cai em seguida!</p><button type="submit">QUERO MEU DINHEIRO</button></form>
        <p class="ng-golpe-rodape">Correspondente bancário autorizado* · Atendimento só pelo WhatsApp</p></div>` };
    },
    enviar(_f, _d, ctx) { ctx.caiuNoGolpe(); CE.emitir('credito:golpe-caiu'); ctx.ir(`${GOLPE}/alerta`); },
  };

  // ======================= Feira Online =======================
  const EXEMPLOS = [
    { icone: '🚲', titulo: 'Bicicleta aro 26', preco: 350, cidade: 'Porto Velho' }, { icone: '🧊', titulo: 'Geladeira duas portas', preco: 900, cidade: 'Candeias do Jamari' },
    { icone: '🥣', titulo: 'Tacacá na cuia (encomenda)', preco: 18, cidade: 'Porto Velho' }, { icone: '📱', titulo: 'Conserto de celular', preco: 50, cidade: 'Ji-Paraná' },
    { icone: '🛏️', titulo: 'Rede de dormir', preco: 80, cidade: 'Guajará-Mirim' }, { icone: '🎂', titulo: 'Bolo de aniversário (encomenda)', preco: 70, cidade: 'Ariquemes' },
  ];
  const CATEGORIAS = ['Comida', 'Casa', 'Roupas', 'Serviços', 'Eletrônicos', 'Outros'];
  let rascunho = {}; // o anúncio que está sendo escrito (a foto escolhida fica aqui até publicar)
  let conversa = {}; // id do anúncio -> 'recusou' | 'enviou'
  const cabFeira = `<header class="fo-topo">${link(FEIRA, '🛒 Feira Online')}<nav>${link(`${FEIRA}/anunciar`, '📢 Anunciar', 'class="fo-botao" data-feira="anunciar"')}${link(`${FEIRA}/meus`, '📦 Meus anúncios', 'data-feira="meus"')}${link(`${FEIRA}/mensagens`, '💬 Mensagens', 'data-feira="mensagens"')}</nav></header>`;
  const paginaFeira = (titulo, html) => ({ titulo: `${titulo} – Feira Online`, conteudo: `${cabFeira}<div class="fo-pagina">${html}</div>` });
  const cartaoAnuncio = (a, meu) => `<div class="fo-cartao" ${meu ? `data-meu-anuncio="${e(a.titulo)}"` : ''}>${a.foto ? `<img src="${a.foto}" alt="${e(a.titulo)}">` : `<span class="fo-icone">${a.icone || '📦'}</span>`}
    <b>${real(a.preco)}</b><span>${e(a.titulo)}</span><small>${e(a.cidade || 'Porto Velho')}${meu ? ` · ${a.visitas || 0} visitas` : ''}</small></div>`;
  const ultimo = () => feira.anuncios[feira.anuncios.length - 1];
  // A foto vira uma miniatura (o anúncio guarda só ela, não a foto inteira).
  function miniatura(src) {
    return new Promise((resolver) => {
      const img = new Image();
      img.onload = () => { const c = document.createElement('canvas'); const l = 240; c.width = l; c.height = Math.round((img.height / img.width) * l) || l; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); resolver(c.toDataURL('image/jpeg', 0.7)); };
      img.onerror = () => resolver(null);
      img.src = src;
    });
  }
  CE.SITES[FEIRA] = {
    dominio: FEIRA, nome: 'Feira Online', icone: '🛒', seguro: true,
    abrir({ caminho, busca = {} }) {
      if (caminho === '/anunciar') {
        const r = rascunho;
        const erros = { titulo: 'Escreva um título com pelo menos 5 letras (o que é o produto).', preco: 'Escreva o preço, por exemplo 12,00.', descricao: 'Descreva o produto com pelo menos 15 letras (tamanho, sabor, estado...).', foto: 'Anúncio sem foto quase não vende: escolha uma foto do produto.' };
        return paginaFeira('Anunciar', `<h1>📢 Anunciar um produto</h1>${busca.erro ? `<p class="bc-erro">❌ ${erros[busca.erro] || 'Confira os campos.'}</p>` : ''}
          <form class="fo-form" data-formulario="anunciar">
            <label>Título (o que você está vendendo) <input name="titulo" autocomplete="off" maxlength="60" value="${e(r.titulo || '')}"></label>
            <label>Preço (R$) <input name="preco" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${e(r.preco || '')}"></label>
            <label>Categoria <select name="categoria">${CATEGORIAS.map((c) => `<option ${c === r.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
            <label>Descrição <textarea name="descricao" rows="3" maxlength="400">${e(r.descricao || '')}</textarea></label>
            <div class="fo-foto">${r.foto ? `<img src="${r.foto}" alt="Foto escolhida" data-foto-escolhida="${e(r.fotoNome || '')}">` : '<span>📷 Nenhuma foto</span>'}
              <button type="button" class="fo-botao secundario" data-site-acao="escolher-foto">📷 ${r.foto ? 'Trocar a foto' : 'Escolher foto'}</button></div>
            <button class="fo-botao" type="submit">Publicar anúncio</button></form>
          <div class="bc-dicas"><b>💡 Anúncio que vende</b><ul><li>Foto de verdade, com boa luz.</li><li>Título claro e preço certo.</li><li>Na descrição: tamanho, sabor, estado, como entrega.</li><li>Nunca coloque o seu endereço ou documento no anúncio.</li></ul></div>`);
      }
      if (caminho === '/anuncio') {
        const a = feira.anuncios.find((x) => x.id === busca.id);
        if (!a) return paginaFeira('Anúncio', '<p>Anúncio não encontrado.</p>');
        return paginaFeira(a.titulo, `${busca.novo ? `<div class="bc-confirmar ng-bom" data-anuncio-publicado="${e(a.titulo)}"><h2>✅ Anúncio publicado!</h2><p>Em alguns minutos chegam as mensagens dos interessados. ${link(`${FEIRA}/mensagens`, '💬 Ver mensagens (1)', 'class="fo-botao"')}</p></div>` : ''}
          <div class="fo-detalhe">${a.foto ? `<img src="${a.foto}" alt="${e(a.titulo)}">` : ''}<div><h1>${e(a.titulo)}</h1><p class="fo-preco">${real(a.preco)}</p><p>${e(a.descricao)}</p><p class="ft-dica">Categoria: ${e(a.categoria)} · Publicado em ${new Date(a.em).toLocaleDateString('pt-BR')}</p></div></div>`);
      }
      if (caminho === '/meus') {
        return paginaFeira('Meus anúncios', `<h1>📦 Meus anúncios</h1>${feira.anuncios.length ? `<div class="fo-grade">${feira.anuncios.map((a) => cartaoAnuncio(a, true)).join('')}</div>` : `<p>Você ainda não anunciou nada. ${link(`${FEIRA}/anunciar`, '📢 Anunciar agora', 'class="fo-botao"')}</p>`}`);
      }
      if (caminho === '/mensagens') {
        const a = ultimo();
        if (!a) return paginaFeira('Mensagens', '<h1>💬 Mensagens</h1><p>Nenhuma mensagem ainda. Publique um anúncio e espere os interessados!</p>');
        const fim = conversa[a.id];
        return paginaFeira('Mensagens', `<h1>💬 Mensagens sobre "${e(a.titulo)}"</h1><div class="fo-chat" data-chat-comprador>
          <p class="fo-msg"><b>Jorge (comprador):</b> Oi! Ainda tem o(a) ${e(a.titulo)}? Vou querer!</p>
          <p class="fo-msg"><b>Jorge:</b> Já fiz o Pix de ${real(a.preco)}, olha o comprovante 👇</p>
          <div class="fo-comprovante" data-comprovante-falso><b>✔ Pix enviado</b><span>Valor: <b>${real(a.preco)}</b></span><span>Para: VENDEDOR(A) FEIRA ONLINE</span><span>Banco Escola · ${new Date().toLocaleDateString('pt-BR')} 10:22</span><span>ID: E9${Math.abs(a.em % 1e9)}X</span></div>
          <p class="fo-msg"><b>Jorge:</b> Pode mandar agora pelo motoboy? Tô com muita pressa! 🏍️</p>
          ${fim === 'recusou' ? '<p class="fo-msg"><b>Jorge:</b> Ah... então deixa pra lá. 👋</p><p class="fo-saiu">Jorge saiu da conversa.</p><div class="bc-confirmar ng-bom" data-golpe-evitado><b>👏 Você não caiu no golpe do comprovante falso!</b><p>Comprovante se faz em qualquer app de montagem. Pix verdadeiro cai na hora: o que vale é o SEU extrato.</p></div>'
            : fim === 'enviou' ? '<div class="bc-confirmar ng-ruim" data-golpe-caiu><b>😬 O produto foi embora... e o dinheiro nunca chegou.</b><p>O comprovante era falso. Antes de entregar, confira SEMPRE no extrato do seu banco se o dinheiro caiu.</p></div>'
              : `<div class="fo-respostas"><button class="fo-botao secundario" data-site-acao="feira-enviar">📦 Pode deixar, já vou mandar!</button>
                <button class="fo-botao secundario" data-site-acao="feira-conferir">🏦 Vou conferir no meu banco</button>
                <button class="fo-botao" data-site-acao="feira-recusar">❌ O dinheiro ainda não caiu: só envio depois que cair</button></div>`}</div>`);
      }
      return paginaFeira('Compre e venda perto de você', `<h1>🛒 Compre e venda perto de você</h1>
        ${feira.anuncios.length ? `<h2>Seus anúncios</h2><div class="fo-grade">${feira.anuncios.map((a) => cartaoAnuncio(a, true)).join('')}</div>` : ''}
        <h2>Anúncios da região</h2><div class="fo-grade">${EXEMPLOS.map((a) => cartaoAnuncio(a)).join('')}</div>
        <p class="bc-aviso">🔒 Dica de segurança: combine a entrega em lugar movimentado e só entregue depois que o dinheiro cair na SUA conta.</p>`);
    },
    acao(nome, el, ctx) {
      if (nome === 'escolher-foto') {
        const form = el.closest('form');
        if (form) rascunho = { ...rascunho, ...Object.fromEntries(new FormData(form).entries()) };
        CE.escolherArquivo({ mensagem: '📷 Escolha a foto do produto:', filtro: (a) => a.tipo === 'imagem' }).then(async (a) => {
          if (!a) return;
          const foto = await miniatura(a.conteudo);
          if (!foto) { CE.avisar('Não consegui abrir essa foto. Escolha outra.'); return; }
          rascunho = { ...rascunho, foto, fotoNome: a.nome };
          CE.emitir('feira:foto', { nome: a.nome });
          ctx.ir(`${FEIRA}/anunciar`);
        });
        return;
      }
      const a = ultimo();
      if (!a) return;
      if (nome === 'feira-conferir') { CE.emitir('feira:conferir', { titulo: a.titulo }); ctx.ir(`${BANCO}/extrato`); return; }
      if (nome === 'feira-enviar' || nome === 'feira-recusar') {
        conversa[a.id] = nome === 'feira-enviar' ? 'enviou' : 'recusou';
        CE.emitir(nome === 'feira-enviar' ? 'feira:golpe-caiu' : 'feira:golpe-evitado', { titulo: a.titulo, preco: a.preco });
        ctx.ir(`${FEIRA}/mensagens`);
      }
    },
    enviar(formulario, d, ctx) {
      if (formulario !== 'anunciar') return;
      rascunho = { ...rascunho, titulo: d.titulo, preco: d.preco, categoria: d.categoria, descricao: d.descricao };
      const titulo = String(d.titulo || '').trim(), preco = lerValor(d.preco), descricao = String(d.descricao || '').trim();
      const erro = titulo.length < 5 ? 'titulo' : !(preco > 0) ? 'preco' : descricao.length < 15 ? 'descricao' : !rascunho.foto ? 'foto' : null;
      if (erro) { CE.emitir('feira:anuncio-erro', { campo: erro }); ctx.ir(`${FEIRA}/anunciar?erro=${erro}`); return; }
      const anuncio = { id: `a${Date.now().toString(36)}`, titulo: titulo.slice(0, 60), preco, categoria: CATEGORIAS.includes(d.categoria) ? d.categoria : 'Outros', descricao: descricao.slice(0, 400), foto: rascunho.foto, em: Date.now(), visitas: 1 + Math.floor(Math.random() * 20) };
      feira = { ...feira, anuncios: [...feira.anuncios, anuncio].slice(-12) };
      rascunho = {};
      guardar('feira', feira);
      CE.emitir('feira:anuncio', { titulo: anuncio.titulo, preco, categoria: anuncio.categoria, foto: true });
      ctx.ir(`${FEIRA}/anuncio?id=${anuncio.id}&novo=1`);
    },
  };

  // ======================= Portal do Empreendedor (MEI) =======================
  const CNPJ = '12.345.678/0001-90';
  const OCUPACOES = ['Doceira / confeiteira', 'Cabeleireira', 'Costureira', 'Vendedora de cosméticos', 'Eletricista', 'Pedreiro', 'Artesã', 'Marmiteira'];
  const DAS = { valor: 76.9, competencia: '10/2025', vencimento: '20/11/2025', codigo: '85890000000769004012025101200123456789012' };
  CE.BOLETOS_TREINO[DAS.codigo] = { beneficiario: 'Receita Federal — DAS do MEI', valor: DAS.valor, vencimento: DAS.vencimento };
  CE.DAS_MEI = DAS.codigo.replace(/(\d{11})(\d)/g, '$1-$2 ').trim();
  const cabMei = `<header class="em-topo">${link(MEI, '🏪 Portal do Empreendedor')}<span>Site de treino (na vida real: gov.br/mei)</span></header>`;
  const paginaMei = (titulo, html) => ({ titulo: `${titulo} – Portal do Empreendedor`, conteudo: `${cabMei}<div class="cd-pagina">${html}</div>` });
  CE.SITES[MEI] = {
    dominio: MEI, nome: 'Portal do Empreendedor', icone: '🏪', seguro: true,
    abrir({ caminho, busca = {} }) {
      if (caminho === '/formalizar') {
        if (mei) return CE.SITES[MEI].abrir({ caminho: '/painel', busca });
        const erros = { nome: 'Escreva o nome completo.', cpf: 'Use o CPF de treino 123.456.789-09.', ocupacao: 'Escolha a sua ocupação.', bairro: 'Escreva o bairro onde você trabalha.', declaracao: 'Marque a declaração para continuar.' };
        return paginaMei('Formalize-se', `<h1>📝 Abrir o MEI (formalize-se)</h1><p class="gv-alerta">✅ Abrir o MEI é <b>GRÁTIS</b>. Ninguém cobra taxa para abrir. Site que cobra é golpe.</p>${busca.erro ? `<p class="bc-erro">❌ ${erros[busca.erro]}</p>` : ''}
          <form class="cd-form" data-formulario="formalizar">
            <label>Nome completo <input name="nome" autocomplete="off"></label><label>CPF <input name="cpf" autocomplete="off" placeholder="000.000.000-00"></label>
            <label>Ocupação (o que você faz) <select name="ocupacao"><option value="">Escolha...</option>${OCUPACOES.map((o) => `<option>${o}</option>`).join('')}</select></label>
            <label>Bairro onde trabalha <input name="bairro" autocomplete="off"></label>
            <label class="gv-termos"><input type="checkbox" name="declaracao" value="sim"> Declaro que não tenho outra empresa e que vou faturar até R$ 81 mil por ano</label>
            <button class="cd-botao" type="submit">Abrir o MEI</button></form>
          <div class="bc-treino gv-treino"><b>🎓 Para treinar</b><br>CPF de treino: <b>123.456.789-09</b>. Nunca use os seus documentos de verdade num site de treino.</div>`);
      }
      if (caminho === '/painel' || caminho === '/das') {
        if (!mei) return paginaMei('Meu MEI', `<h1>🏪 Meu MEI</h1><p>Você ainda não abriu o MEI.</p><p>${link(`${MEI}/formalizar`, '📝 Formalize-se', 'class="cd-botao" data-mei="formalizar"')}</p>`);
        const boleto = caminho === '/das' && busca.gerar;
        return paginaMei('Meu MEI', `<h1>🏪 Meu MEI</h1><div class="gv-caixa" data-cnpj="${CNPJ}"><p>CNPJ: <b>${CNPJ}</b> (de treino)</p><p>Nome: <b>${e(mei.nome)}</b> · Ocupação: <b>${e(mei.ocupacao)}</b></p>
          <p><button class="cd-botao secundario" data-site-acao="baixar-ccmei">⬇️ Baixar o certificado (CCMEI)</button></p></div>
          <h2>🧾 DAS: o imposto do MEI, todo mês</h2><p>Com o DAS pago em dia, você contribui para o INSS (aposentadoria, auxílio-doença e salário-maternidade) e fica com o CNPJ regular.</p>
          <table class="bc-tabela"><tr><th>Mês</th><th>Valor</th><th>Vence</th></tr><tr><td>${DAS.competencia}</td><td>${real(DAS.valor)}</td><td>${DAS.vencimento}</td></tr></table>
          ${boleto ? `<div class="gv-caixa em-boleto" data-das-gerado><p><b>Código de barras do DAS:</b></p><p class="em-codigo" data-codigo-das>${CE.DAS_MEI}</p>
            <p class="cd-dica">Selecione o código, copie (Ctrl+C) e pague no seu banco em "🧾 Pagar boleto" (cole com Ctrl+V).</p></div>`
            : `<p><button class="cd-botao" data-site-acao="gerar-das">🧾 Gerar o DAS de ${DAS.competencia}</button></p>`}
          <div class="gv-alerta">⚠️ Golpe comum: boleto de "taxa do MEI" ou "anuidade" que chega pelo correio, e-mail ou WhatsApp. O DAS verdadeiro só se gera aqui no Portal.</div>`);
      }
      return paginaMei('MEI', `<h1>🏪 MEI: Microempreendedor Individual</h1><p>Para quem trabalha por conta própria (doceira, cabeleireira, costureira, eletricista...) e quer ter <b>CNPJ</b>, emitir nota fiscal e contribuir para o <b>INSS</b>.</p>
        <ul class="em-lista"><li>💰 Faturamento até <b>R$ 81 mil por ano</b> (R$ 6.750 por mês, em média).</li><li>👤 Pode ter <b>1 empregado</b>.</li><li>🧾 Paga só o <b>DAS</b> por mês (cerca de R$ 76 a R$ 81).</li><li>🆓 Abrir é <b>grátis</b>, pela internet.</li></ul>
        <p>${link(`${MEI}/formalizar`, '📝 Formalize-se (abrir o MEI)', 'class="cd-botao" data-mei="formalizar"')} ${link(`${MEI}/painel`, '🧾 Já sou MEI: pagar o DAS', 'class="cd-botao secundario" data-mei="painel"')}</p>`);
    },
    acao(nome, el, ctx) {
      if (nome === 'gerar-das') { CE.emitir('mei:das-gerado', { valor: DAS.valor }); ctx.ir(`${MEI}/das?gerar=1`); }
      if (nome === 'baixar-ccmei' && mei) {
        CE.sessao.baixarArquivo({ nome: 'Certificado MEI (CCMEI)', tipo: 'pdf', conteudo: `<h1 style="text-align: center;">Certificado da Condição de Microempreendedor Individual</h1><p><br></p><p>Nome: <b>${e(mei.nome)}</b></p><p>CNPJ: <b>${CNPJ}</b></p><p>Ocupação: ${e(mei.ocupacao)}</p><p>Bairro: ${e(mei.bairro)}</p><p>Data de abertura: ${new Date(mei.em).toLocaleDateString('pt-BR')}</p><p><br></p><p style="color: #b00;"><b>DOCUMENTO DE TREINO</b></p>` }, 'internet');
        CE.emitir('mei:certificado');
      }
    },
    enviar(formulario, d, ctx) {
      if (formulario !== 'formalizar') return;
      const nome = String(d.nome || '').trim();
      const erro = nome.split(/\s+/).length < 2 ? 'nome' : soDigitos(d.cpf) !== '12345678909' ? 'cpf' : !OCUPACOES.includes(d.ocupacao) ? 'ocupacao' : String(d.bairro || '').trim().length < 3 ? 'bairro' : !d.declaracao ? 'declaracao' : null;
      if (erro) { ctx.ir(`${MEI}/formalizar?erro=${erro}`); return; }
      mei = { nome: nome.slice(0, 80), ocupacao: d.ocupacao, bairro: String(d.bairro).trim().slice(0, 60), cnpj: CNPJ, em: Date.now() };
      guardar('mei', mei);
      CE.comemorar('pequena');
      CE.emitir('mei:aberto', { ocupacao: mei.ocupacao });
      ctx.ir(`${MEI}/painel`);
    },
  };

  CE.INDICE_BUSCA.push(
    { url: `${BANCO}/emprestimo`, titulo: 'Empréstimo – Banco Escola', descricao: 'Simule crédito pessoal, consignado e cheque especial e compare o CET.', palavras: 'emprestimo credito consignado cet juros banco simular' },
    { url: `${BANCO}/cartao`, titulo: 'Cartão de crédito – Banco Escola', descricao: 'Veja a fatura do cartão e pague com segurança.', palavras: 'cartao credito fatura rotativo minimo' },
    { url: GOLPE, titulo: '💸 CRÉDITO JÁ APROVADO! Dinheiro na hora, sem consulta ao SPC', descricao: 'Até R$ 10.000 em 10 minutos. Negativado pode! Só hoje!', palavras: 'emprestimo credito facil negativado spc serasa dinheiro rapido' },
    { url: FEIRA, titulo: 'Feira Online – compre e venda perto de você', descricao: 'Anuncie produtos e serviços com foto e preço.', palavras: 'vender anunciar anuncio feira compra venda usados marketplace' },
    { url: MEI, titulo: 'Portal do Empreendedor – MEI', descricao: 'Abra o MEI de graça e pague o DAS (site de treino).', palavras: 'mei microempreendedor cnpj das empreendedor formalizar imposto' },
  );
})();
