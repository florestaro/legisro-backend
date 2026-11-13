// Gestão Fácil: o "sistema da empresa" (um ERP simples, como os que os escritórios usam), para o curso de
// Assistente Administrativo. Painel, clientes, produtos e estoque, vendas com recibo, financeiro (contas a pagar e
// a receber, fluxo de caixa), protocolo de documentos, RH (ponto, holerite e admissão) e relatórios para a Planilha.
// Os dados ficam no computador do instrutor (dados "empresa:<aluno>"): o aluno acha a empresa dele em qualquer PC.
window.CE = window.CE || {};

(function () {
  const DIA = 86400000;
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const agora = () => (CE.config ? CE.config.agora() : new Date());
  const hoje = () => iso(agora());
  const daqui = (n) => iso(new Date(agora().getTime() + n * DIA));
  const br = (s) => (s ? s.split('-').reverse().join('/') : '');
  const reais = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (t) => Number(String(t == null ? '' : t).replace(/\s/g, '').replace(/R\$/i, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0;
  const so = (t) => String(t || '').replace(/\D/g, '');
  const SETORES = ['Financeiro', 'Compras', 'Vendas', 'Recursos Humanos', 'Diretoria'];
  const PAGAMENTOS = [['dinheiro', '💵 Dinheiro'], ['pix', '💠 Pix'], ['debito', '💳 Cartão de débito'], ['credito', '💳 Cartão de crédito'], ['boleto', '🧾 Boleto (30 dias, a prazo)']];
  const DOCS_ADMISSAO = [['ctps', 'Carteira de Trabalho Digital'], ['rg', 'RG (identidade)'], ['cpf', 'CPF'], ['residencia', 'Comprovante de residência'], ['pis', 'Número do PIS'],
    ['banco', 'Dados da conta para o salário'], ['foto', 'Foto 3x4'], ['aso', 'Exame admissional (ASO)']];
  const DIAS_SEMANA = [['seg', 'Segunda'], ['ter', 'Terça'], ['qua', 'Quarta'], ['qui', 'Quinta'], ['sex', 'Sexta']];

  function empresaInicial() {
    const d = daqui;
    return {
      versao: 1, nome: 'Loja Bom Preço Ltda', cnpj: '12.345.678/0001-90', caixaInicial: 5000,
      seq: { venda: 1002, protocolo: 0, pedido: 0, cliente: 3, conta: 8 },
      clientes: [
        { id: 'c1', nome: 'Mercadinho Boa Vista', doc: '23.456.789/0001-12', tel: '(69) 3224-5566', email: 'compras@boavista.com.br', cidade: 'Porto Velho' },
        { id: 'c2', nome: 'Clínica Bem Viver', doc: '34.567.890/0001-23', tel: '(69) 3221-7788', email: 'adm@bemviver.com.br', cidade: 'Porto Velho' },
        { id: 'c3', nome: 'Maria Aparecida dos Santos', doc: '234.567.891-20', tel: '(69) 99876-5432', email: 'maria.santos@correio.escola', cidade: 'Candeias do Jamari' },
      ],
      produtos: [
        { cod: 'P001', nome: 'Ventilador de mesa', estoque: 12, minimo: 5, preco: 150, custo: 95, fornecedor: 'Distribuidora Norte' },
        { cod: 'P002', nome: 'Panela de pressão', estoque: 3, minimo: 6, preco: 80, custo: 48, fornecedor: 'Utilidades Brasil' },
        { cod: 'P003', nome: 'Liquidificador', estoque: 8, minimo: 4, preco: 120, custo: 75, fornecedor: 'Distribuidora Norte' },
        { cod: 'P004', nome: 'Ferro de passar', estoque: 2, minimo: 4, preco: 90, custo: 55, fornecedor: 'Distribuidora Norte' },
        { cod: 'P005', nome: 'Jogo de copos (6 peças)', estoque: 20, minimo: 8, preco: 35, custo: 18, fornecedor: 'Utilidades Brasil' },
        { cod: 'P006', nome: 'Garrafa térmica', estoque: 15, minimo: 6, preco: 45, custo: 25, fornecedor: 'Utilidades Brasil' },
      ],
      vendas: [
        { numero: 1001, data: d(-3), cliente: 'Mercadinho Boa Vista', itens: [{ cod: 'P005', nome: 'Jogo de copos (6 peças)', qtd: 10, preco: 35 }], desconto: 0, total: 350, pagamento: 'boleto', vendedor: 'Ana Paula Ribeiro' },
        { numero: 1002, data: d(-1), cliente: 'Consumidor final', itens: [{ cod: 'P001', nome: 'Ventilador de mesa', qtd: 2, preco: 150 }], desconto: 0, total: 300, pagamento: 'pix', vendedor: 'Ana Paula Ribeiro' },
      ],
      contas: [
        { id: 'k1', tipo: 'pagar', descricao: 'Aluguel da loja', pessoa: 'Imobiliária Centro', vencimento: d(5), valor: 2500, categoria: 'Aluguel', paga: false },
        { id: 'k2', tipo: 'pagar', descricao: 'Conta de energia', pessoa: 'Energia Rondônia S.A.', vencimento: d(-2), valor: 480.3, categoria: 'Energia', paga: false },
        { id: 'k3', tipo: 'pagar', descricao: 'Internet e telefone', pessoa: 'Conecta Telecom', vencimento: d(10), valor: 129.9, categoria: 'Telefone', paga: false },
        { id: 'k4', tipo: 'pagar', descricao: 'NF 4380 — mercadorias', pessoa: 'Distribuidora Norte', vencimento: d(-10), valor: 1890, categoria: 'Fornecedores', paga: true, pagaEm: d(-10) },
        { id: 'k5', tipo: 'receber', descricao: 'Venda 1001 (boleto)', pessoa: 'Mercadinho Boa Vista', vencimento: d(27), valor: 350, categoria: 'Vendas', paga: false },
        { id: 'k6', tipo: 'receber', descricao: 'Venda 0998 (boleto)', pessoa: 'Clínica Bem Viver', vencimento: d(-1), valor: 450, categoria: 'Vendas', paga: false },
        { id: 'k7', tipo: 'receber', descricao: 'Venda 1002 (Pix)', pessoa: 'Consumidor final', vencimento: d(-1), valor: 300, categoria: 'Vendas', paga: true, pagaEm: d(-1) },
      ],
      // Documentos que chegaram e estão na mesa, esperando o protocolo.
      entrada: [
        { id: 'd1', tipo: 'Ofício', origem: 'Prefeitura de Porto Velho', assunto: 'Convite para a Feira do Emprego' },
        { id: 'd2', tipo: 'Nota fiscal', origem: 'Distribuidora Norte', assunto: 'NF 4512 — ventiladores e ferros de passar' },
        { id: 'd3', tipo: 'Currículo', origem: 'João Pedro Silva', assunto: 'Vaga de vendedor' },
      ],
      protocolo: [], pedidos: [], movimentos: [],
      funcionarios: [
        { id: 'f1', nome: 'Ana Paula Ribeiro', cargo: 'Vendedora', salario: 1850, admissao: '2023-03-01', docs: Object.fromEntries(DOCS_ADMISSAO.map(([k]) => [k, true])) },
        { id: 'f2', nome: 'Bruno Carvalho', cargo: 'Estoquista', salario: 1700, admissao: '2022-08-15', docs: Object.fromEntries(DOCS_ADMISSAO.map(([k]) => [k, true])), ponto: null },
        { id: 'f3', nome: 'Carla Menezes', cargo: 'Auxiliar administrativa', salario: 1650, admissao: d(7), docs: { rg: true, cpf: true } },
      ],
    };
  }

  // ---------- Contas de RH ----------
  const minutos = (h) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(h || '').trim()); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  function horasDoDia(marcas) {
    const [e1, s1, e2, s2] = (marcas || []).map(minutos);
    let total = 0;
    if (e1 != null && s1 != null && s1 > e1) total += s1 - e1;
    if (e2 != null && s2 != null && s2 > e2) total += s2 - e2;
    return total / 60;
  }
  function resumoPonto(ponto) {
    const dias = DIAS_SEMANA.map(([k]) => horasDoDia(ponto && ponto[k]));
    const horas = Math.round(dias.reduce((a, b) => a + b, 0) * 100) / 100;
    const extras = Math.round(dias.reduce((a, h) => a + Math.max(0, h - 8), 0) * 100) / 100;
    return { dias, horas, extras };
  }
  // INSS progressivo (tabela de treino, parecida com a de 2025) e o holerite simplificado.
  const FAIXAS_INSS = [[1518, 0.075], [2793.88, 0.09], [4190.83, 0.12], [8157.41, 0.14]];
  function inss(bruto) {
    let resto = bruto, anterior = 0, total = 0;
    for (const [teto, aliquota] of FAIXAS_INSS) {
      const parte = Math.min(resto, teto - anterior);
      if (parte <= 0) break;
      total += parte * aliquota; resto -= parte; anterior = teto;
    }
    return Math.round(total * 100) / 100;
  }
  function holerite(f) {
    const extras = f.ponto ? resumoPonto(f.ponto).extras : 0;
    const valorHora = f.salario / 220;
    const he = Math.round(valorHora * 1.5 * extras * 100) / 100;
    const bruto = Math.round((f.salario + he) * 100) / 100;
    const desconto = inss(bruto);
    return { salario: f.salario, extras, he, bruto, inss: desconto, liquido: Math.round((bruto - desconto) * 100) / 100, fgts: Math.round(bruto * 0.08 * 100) / 100 };
  }

  // ---------- Dados ----------
  let empresa = null, dono = null, carregando = null;
  async function garantir() {
    const u = CE.sessao.usuario;
    if (!u) throw new Error('Ninguém entrou no sistema.');
    if (empresa && dono === u.id) return empresa;
    if (carregando && dono === u.id) return carregando;
    dono = u.id;
    const vale = CE.sessao.marca();
    carregando = CE.api.chamar('dados:ler', `empresa:${u.id}`, null).then((e) => {
      if (!vale()) throw new Error('Quem abriu o sistema já saiu.');
      empresa = e && e.versao ? e : empresaInicial();
      carregando = null;
      return empresa;
    });
    return carregando;
  }
  function salvar() {
    if (!empresa || !CE.sessao.usuario || CE.sessao.usuario.id !== dono) return Promise.resolve();
    const copia = JSON.parse(JSON.stringify(empresa));
    return CE.sessao.registrarGravacao(CE.api.chamar('dados:salvar', `empresa:${dono}`, copia).catch((e) => CE.avisar('⚠️ ' + e.message)));
  }

  const vencida = (c) => !c.paga && c.vencimento < hoje();
  const produto = (cod) => empresa.produtos.find((p) => p.cod === cod);
  const baixo = () => empresa.produtos.filter((p) => p.estoque < p.minimo);
  function fluxo() {
    const pagas = empresa.contas.filter((c) => c.paga);
    const entradas = pagas.filter((c) => c.tipo === 'receber').reduce((s, c) => s + c.valor, 0);
    const saidas = pagas.filter((c) => c.tipo === 'pagar').reduce((s, c) => s + c.valor, 0);
    const saldo = Math.round((empresa.caixaInicial + entradas - saidas) * 100) / 100;
    const limite = daqui(30);
    const aReceber = empresa.contas.filter((c) => !c.paga && c.tipo === 'receber' && c.vencimento <= limite).reduce((s, c) => s + c.valor, 0);
    const aPagar = empresa.contas.filter((c) => !c.paga && c.tipo === 'pagar' && c.vencimento <= limite).reduce((s, c) => s + c.valor, 0);
    return { entradas, saidas, saldo, aReceber, aPagar, previsto: Math.round((saldo + aReceber - aPagar) * 100) / 100 };
  }

  // Salva um documento (recibo, pedido) na pasta "Gestão Fácil" de Meus Documentos.
  async function salvarDocumento(nome, html) {
    await CE.sessao.garantirPasta('Gestão Fácil', 'pc', '');
    return CE.sessao.salvarArquivo({ nome, tipo: 'documento', conteudo: html, local: 'pc', pasta: 'Gestão Fácil' });
  }
  // Planilha a partir de linhas (a 1ª é o título, em negrito) e células extras (fórmulas).
  function planilha(linhas, extras = {}, larguras = {}) {
    const celulas = {};
    linhas.forEach((linha, l) => linha.forEach((v, c) => {
      if (v === '' || v == null) return;
      celulas[CE.formulas.endereco(c, l)] = { v: String(v), f: l === 0 ? { negrito: true, fundo: '#dbe8fb' } : {} };
    }));
    Object.entries(extras).forEach(([ref, cel]) => { celulas[ref] = typeof cel === 'object' ? cel : { v: String(cel), f: {} }; });
    return JSON.stringify({ celulas, larguras, graficos: [], condicionais: [] });
  }

  const telasAbertas = new Set();
  CE.gestao = {
    garantir,
    dados: () => (empresa ? JSON.parse(JSON.stringify(empresa)) : null),
    holerite, resumoPonto, inss,
    reiniciar() { empresa = null; dono = null; carregando = null; },
    // Para as aulas: garante que algo exista na empresa (um documento na mesa, uma conta...), salva e redesenha.
    async preparar(alterar) {
      const e = await garantir();
      if (alterar(e) !== false) { await salvar(); telasAbertas.forEach((f) => f()); }
    },
    DOCUMENTOS_MESA: {
      oficio: { id: 'd1', tipo: 'Ofício', origem: 'Prefeitura de Porto Velho', assunto: 'Convite para a Feira do Emprego' },
      nota: { id: 'd2', tipo: 'Nota fiscal', origem: 'Distribuidora Norte', assunto: 'NF 4512 — ventiladores e ferros de passar' },
      curriculo: { id: 'd3', tipo: 'Currículo', origem: 'João Pedro Silva', assunto: 'Vaga de vendedor' },
    },
  };

  CE.registrarApp({
    id: 'gestao', nome: 'Gestão Fácil', icone: '🗂️', largura: 1000, altura: 640,
    abrir(corpo, janela, argumento) {
      let aba = (argumento && argumento.aba) || 'inicio';
      let busca = '';
      let carrinho = []; // itens da venda que está sendo montada
      const lateral = CE.el('nav', { class: 'gf-lateral' });
      const conteudo = CE.el('div', { class: 'gf-conteudo' });
      corpo.classList.add('gestao-app');
      corpo.append(lateral, conteudo);
      const ABAS = [['inicio', '🏠', 'Painel'], ['clientes', '👥', 'Clientes'], ['estoque', '📦', 'Produtos e estoque'], ['vendas', '🧾', 'Vendas'],
        ['financeiro', '💰', 'Financeiro'], ['protocolo', '📑', 'Protocolo'], ['rh', '👔', 'Funcionários (RH)'], ['relatorios', '📤', 'Relatórios']];
      const irAba = (id) => { aba = id; busca = ''; desenhar(); CE.emitir('gestao:aba', { aba: id }); };
      const titulo = (t, sub) => [CE.el('h2', {}, t), sub ? CE.el('p', { class: 'gf-sub' }, sub) : null];
      const tabela = (cab, linhas, attr = {}) => CE.el('table', { class: 'gf-tabela', ...attr }, CE.el('thead', {}, CE.el('tr', {}, ...cab.map((c) => CE.el('th', {}, c)))),
        CE.el('tbody', {}, ...(linhas.length ? linhas : [CE.el('tr', {}, CE.el('td', { colspan: String(cab.length), class: 'gf-vazio' }, 'Nada por aqui.'))])));
      const botao = (rotulo, acao, onclick, classe = '') => CE.el('button', { class: 'botao ' + classe, 'data-gf-acao': acao, onclick }, rotulo);
      const mudou = () => { salvar(); desenhar(); };
      // Formulário numa janelinha: campos [{ nome, rotulo, valor, tipo, opcoes }] -> promessa com os valores.
      function formulario(tituloForm, campos, { textoOk = 'Salvar', validar } = {}) {
        return new Promise((resolver) => {
          const els = {};
          const erro = CE.el('p', { class: 'login-erro em-claro' });
          const linhas = campos.map((c) => {
            const el = c.opcoes
              ? CE.el('select', { class: 'campo', 'data-gf-campo': c.nome }, ...c.opcoes.map(([v, r]) => CE.el('option', { value: v, selected: String(v) === String(c.valor) }, r)))
              : CE.el('input', { class: 'campo', 'data-gf-campo': c.nome, type: c.tipo || 'text', value: c.valor == null ? '' : c.valor, placeholder: c.dica || '' });
            els[c.nome] = el;
            return CE.el('label', { class: 'gf-campo' }, c.rotulo, el);
          });
          const fechar = (v) => { fundo.remove(); resolver(v); };
          const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo gf-dialogo' },
            CE.el('h3', {}, tituloForm), ...linhas, erro,
            CE.el('div', { class: 'dialogo-botoes' },
              CE.el('button', { class: 'botao secundario', onclick: () => fechar(null) }, 'Cancelar'),
              CE.el('button', { class: 'botao', 'data-gf-acao': 'confirmar', onclick: () => {
                const v = Object.fromEntries(Object.entries(els).map(([k, el]) => [k, el.value.trim()]));
                const problema = validar && validar(v);
                if (problema) { erro.textContent = problema; return; }
                fechar(v);
              } }, textoOk))));
          document.body.append(fundo);
          const primeiro = Object.values(els)[0];
          if (primeiro) primeiro.focus();
        });
      }

      // ---------- Painel ----------
      function telaInicio() {
        const mes = hoje().slice(0, 7);
        const doMes = empresa.vendas.filter((v) => v.data.slice(0, 7) === mes);
        const atrasadas = empresa.contas.filter(vencida);
        const semana = empresa.contas.filter((c) => !c.paga && c.tipo === 'pagar' && c.vencimento >= hoje() && c.vencimento <= daqui(7));
        const f = fluxo();
        const cartao = (icone, rotulo, valor, sub, ir, alerta) => CE.el('button', { class: 'gf-cartao' + (alerta ? ' alerta' : ''), 'data-gf-cartao': ir, onclick: () => irAba(ir) },
          CE.el('span', { class: 'gf-cartao-icone' }, icone), CE.el('small', {}, rotulo), CE.el('b', {}, valor), CE.el('small', {}, sub));
        return [...titulo(`🏠 ${empresa.nome}`, `CNPJ ${empresa.cnpj} · Hoje é ${br(hoje())}`),
          CE.el('div', { class: 'gf-cartoes' },
            cartao('🧾', 'Vendas do mês', reais(doMes.reduce((s, v) => s + v.total, 0)), `${doMes.length} venda(s)`, 'vendas'),
            cartao('⏰', 'Contas atrasadas', String(atrasadas.length), reais(atrasadas.reduce((s, c) => s + c.valor, 0)), 'financeiro', atrasadas.length > 0),
            cartao('📅', 'A pagar em 7 dias', String(semana.length), reais(semana.reduce((s, c) => s + c.valor, 0)), 'financeiro'),
            cartao('📦', 'Estoque baixo', String(baixo().length), baixo().map((p) => p.nome).join(', ').slice(0, 40) || 'Tudo certo', 'estoque', baixo().length > 0),
            cartao('📑', 'Documentos na mesa', String(empresa.entrada.length), `${empresa.protocolo.filter((p) => p.situacao !== 'Arquivado').length} em andamento`, 'protocolo', empresa.entrada.length > 0),
            cartao('💰', 'Saldo do caixa', reais(f.saldo), `Previsto em 30 dias: ${reais(f.previsto)}`, 'financeiro')),
          CE.el('p', { class: 'gf-dica' }, '💡 Clique num quadro para ir direto ao assunto. O painel mostra o que precisa de atenção hoje: é a primeira tela que o assistente administrativo olha de manhã.')];
      }

      // ---------- Clientes ----------
      function telaClientes() {
        const t = busca.toLowerCase();
        const lista = empresa.clientes.filter((c) => !t || [c.nome, c.doc, c.cidade, c.email].join(' ').toLowerCase().includes(t));
        const campoBusca = CE.el('input', { class: 'campo gf-busca', placeholder: '🔍 Procurar cliente', value: busca, 'data-gf-campo': 'busca' });
        campoBusca.addEventListener('input', () => { busca = campoBusca.value; const pos = campoBusca.selectionStart; desenhar(); const n = conteudo.querySelector('[data-gf-campo="busca"]'); n.focus(); n.setSelectionRange(pos, pos); });
        return [...titulo('👥 Clientes', '🔒 LGPD: os dados dos clientes são protegidos por lei. Use só para o atendimento e não passe para ninguém.'),
          CE.el('div', { class: 'gf-barra' }, campoBusca, botao('➕ Novo cliente', 'novo-cliente', () => editarCliente())),
          tabela(['Nome', 'CPF / CNPJ', 'Telefone', 'E-mail', 'Cidade', ''], lista.map((c) => CE.el('tr', { 'data-gf-cliente': c.nome },
            CE.el('td', {}, c.nome), CE.el('td', {}, c.doc), CE.el('td', {}, c.tel), CE.el('td', {}, c.email), CE.el('td', {}, c.cidade),
            CE.el('td', {}, CE.el('button', { class: 'botao pequeno secundario', 'data-gf-acao': 'editar-cliente', onclick: () => editarCliente(c) }, '✏️'))))) ];
      }
      async function editarCliente(c) {
        const v = await formulario(c ? `✏️ ${c.nome}` : '➕ Novo cliente', [
          { nome: 'nome', rotulo: 'Nome completo ou razão social', valor: c && c.nome },
          { nome: 'doc', rotulo: 'CPF (11 números) ou CNPJ (14 números)', valor: c && c.doc, dica: '000.000.000-00' },
          { nome: 'tel', rotulo: 'Telefone', valor: c && c.tel, dica: '(69) 99999-0000' },
          { nome: 'email', rotulo: 'E-mail', valor: c && c.email },
          { nome: 'cidade', rotulo: 'Cidade', valor: c && c.cidade },
        ], { validar: (v) => {
          if (v.nome.length < 3) return 'Escreva o nome completo.';
          if (![11, 14].includes(so(v.doc).length)) return 'O CPF tem 11 números e o CNPJ tem 14. Confira.';
          if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return 'O e-mail precisa ter @ e ponto.';
          if (empresa.clientes.some((x) => x !== c && so(x.doc) === so(v.doc))) return 'Já existe um cliente com esse CPF/CNPJ.';
          return '';
        } });
        if (!v) return;
        const d = so(v.doc);
        v.doc = d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        if (c) Object.assign(c, v); else empresa.clientes.push({ id: 'c' + (++empresa.seq.cliente), ...v });
        mudou();
        CE.emitir('gestao:cliente', { acao: c ? 'editado' : 'novo', nome: v.nome, doc: v.doc, tipo: d.length === 11 ? 'cpf' : 'cnpj' });
      }

      // ---------- Estoque ----------
      function telaEstoque() {
        return [...titulo('📦 Produtos e estoque', 'Em vermelho: estoque abaixo do mínimo (hora de comprar). Toda mercadoria que chega entra com a nota fiscal.'),
          CE.el('div', { class: 'gf-barra' },
            botao('📥 Entrada de mercadoria', 'entrada-estoque', () => entradaEstoque()),
            botao('🛒 Pedido de compra (itens em falta)', 'pedido-compra', () => pedidoCompra(), 'secundario'),
            botao('➕ Novo produto', 'novo-produto', () => novoProduto(), 'secundario')),
          tabela(['Código', 'Produto', 'Estoque', 'Mínimo', 'Preço', 'Fornecedor'], empresa.produtos.map((p) => CE.el('tr', { class: p.estoque < p.minimo ? 'gf-baixo' : '', 'data-gf-produto': p.cod },
            CE.el('td', {}, p.cod), CE.el('td', {}, p.nome), CE.el('td', { class: 'gf-num' }, String(p.estoque)), CE.el('td', { class: 'gf-num' }, String(p.minimo)),
            CE.el('td', { class: 'gf-num' }, reais(p.preco)), CE.el('td', {}, p.fornecedor)))),
          empresa.pedidos.length ? CE.el('h3', {}, '🛒 Pedidos de compra') : null,
          empresa.pedidos.length ? tabela(['Nº', 'Data', 'Fornecedor', 'Itens', 'Situação'], empresa.pedidos.map((pd) => CE.el('tr', { 'data-gf-pedido': String(pd.numero) },
            CE.el('td', {}, String(pd.numero).padStart(3, '0')), CE.el('td', {}, br(pd.data)), CE.el('td', {}, pd.fornecedor), CE.el('td', {}, pd.itens.map((i) => `${i.qtd}× ${i.nome}`).join(', ')), CE.el('td', {}, pd.situacao)))) : null];
      }
      async function entradaEstoque() {
        const v = await formulario('📥 Entrada de mercadoria (com nota fiscal)', [
          { nome: 'cod', rotulo: 'Produto', opcoes: empresa.produtos.map((p) => [p.cod, `${p.cod} — ${p.nome}`]) },
          { nome: 'qtd', rotulo: 'Quantidade que chegou', tipo: 'number' },
          { nome: 'nota', rotulo: 'Número da nota fiscal', dica: 'Ex.: 4512' },
        ], { validar: (v) => (!(Number(v.qtd) > 0) ? 'Escreva a quantidade.' : !so(v.nota) ? 'Escreva o número da nota fiscal (está no papel da nota).' : '') });
        if (!v) return;
        const p = produto(v.cod);
        p.estoque += Math.round(Number(v.qtd));
        empresa.movimentos.push({ data: hoje(), cod: p.cod, qtd: Math.round(Number(v.qtd)), tipo: 'entrada', doc: `NF ${so(v.nota)}` });
        empresa.pedidos.filter((pd) => pd.situacao === 'Enviado' && pd.itens.some((i) => i.cod === p.cod)).forEach((pd) => { pd.situacao = 'Recebido'; });
        mudou();
        CE.emitir('gestao:estoque', { acao: 'entrada', cod: p.cod, nome: p.nome, quantidade: Math.round(Number(v.qtd)), estoque: p.estoque, nota: so(v.nota) });
        CE.avisar(`📥 ${v.qtd} × ${p.nome} entraram no estoque (agora: ${p.estoque}).`);
      }
      async function pedidoCompra() {
        const faltam = baixo();
        if (!faltam.length) { CE.avisar('Nenhum produto abaixo do mínimo. Não precisa comprar agora.'); return; }
        const porFornecedor = {};
        faltam.forEach((p) => { (porFornecedor[p.fornecedor] = porFornecedor[p.fornecedor] || []).push({ cod: p.cod, nome: p.nome, qtd: p.minimo * 2 - p.estoque, custo: p.custo }); });
        const v = await formulario('🛒 Pedido de compra', [{ nome: 'fornecedor', rotulo: 'Fornecedor', opcoes: Object.keys(porFornecedor).map((f) => [f, `${f} (${porFornecedor[f].map((i) => `${i.qtd}× ${i.nome}`).join(', ')})`]) }], { textoOk: 'Gerar pedido' });
        if (!v) return;
        const itens = porFornecedor[v.fornecedor];
        const pd = { numero: ++empresa.seq.pedido, data: hoje(), fornecedor: v.fornecedor, itens, situacao: 'Enviado' };
        empresa.pedidos.push(pd);
        mudou();
        const total = itens.reduce((s, i) => s + i.qtd * i.custo, 0);
        const html = `<div style="text-align: center;"><b><font size="5">PEDIDO DE COMPRA Nº ${String(pd.numero).padStart(3, '0')}</font></b></div><div><br></div>
          <div><b>De:</b> ${empresa.nome} — CNPJ ${empresa.cnpj}</div><div><b>Para:</b> ${CE.escapar(pd.fornecedor)}</div><div><b>Data:</b> ${br(pd.data)}</div><div><br></div>
          <table class="tabela-doc"><tbody><tr><td><b>Código</b></td><td><b>Produto</b></td><td><b>Quantidade</b></td><td><b>Valor unitário</b></td><td><b>Total</b></td></tr>
          ${itens.map((i) => `<tr><td>${i.cod}</td><td>${CE.escapar(i.nome)}</td><td>${i.qtd}</td><td>${reais(i.custo)}</td><td>${reais(i.qtd * i.custo)}</td></tr>`).join('')}
          <tr><td></td><td></td><td></td><td><b>Total</b></td><td><b>${reais(total)}</b></td></tr></tbody></table><div><br></div>
          <div>Prazo de entrega: 7 dias. Pagamento: boleto 30 dias.</div><div><br></div><div>Atenciosamente,</div><div>Setor de Compras — ${empresa.nome}</div>`;
        const nome = `Pedido de compra ${String(pd.numero).padStart(3, '0')} - ${pd.fornecedor}`;
        await salvarDocumento(nome, html);
        CE.emitir('gestao:pedido', { numero: pd.numero, fornecedor: pd.fornecedor, itens: itens.length, total, documento: nome });
        CE.avisar(`🛒 Pedido salvo em Meus Documentos › Gestão Fácil: "${nome}". Agora é mandar para o fornecedor (por e-mail, como anexo).`);
      }
      async function novoProduto() {
        const v = await formulario('➕ Novo produto', [
          { nome: 'nome', rotulo: 'Nome do produto' }, { nome: 'preco', rotulo: 'Preço de venda (R$)', dica: '0,00' }, { nome: 'custo', rotulo: 'Custo (R$)', dica: '0,00' },
          { nome: 'estoque', rotulo: 'Estoque inicial', tipo: 'number', valor: '0' }, { nome: 'minimo', rotulo: 'Estoque mínimo', tipo: 'number', valor: '1' },
          { nome: 'fornecedor', rotulo: 'Fornecedor', valor: 'Distribuidora Norte' },
        ], { validar: (v) => (v.nome.length < 3 ? 'Escreva o nome do produto.' : !(num(v.preco) > 0) ? 'Escreva o preço.' : '') });
        if (!v) return;
        const cod = 'P' + String(empresa.produtos.length + 1).padStart(3, '0');
        empresa.produtos.push({ cod, nome: v.nome, preco: num(v.preco), custo: num(v.custo), estoque: Math.round(Number(v.estoque) || 0), minimo: Math.round(Number(v.minimo) || 0), fornecedor: v.fornecedor });
        mudou();
        CE.emitir('gestao:produto', { acao: 'novo', cod, nome: v.nome });
      }

      // ---------- Vendas ----------
      function telaVendas() {
        const total = carrinho.reduce((s, i) => s + i.qtd * i.preco, 0);
        const selProduto = CE.el('select', { class: 'campo', 'data-gf-campo': 'venda-produto' }, ...empresa.produtos.map((p) => CE.el('option', { value: p.cod }, `${p.nome} — ${reais(p.preco)} (estoque ${p.estoque})`)));
        const qtd = CE.el('input', { class: 'campo pequeno', type: 'number', min: '1', value: '1', 'data-gf-campo': 'venda-qtd' });
        const cliente = CE.el('select', { class: 'campo', 'data-gf-campo': 'venda-cliente' }, CE.el('option', { value: 'Consumidor final' }, 'Consumidor final (sem cadastro)'), ...empresa.clientes.map((c) => CE.el('option', { value: c.nome }, c.nome)));
        const pagamento = CE.el('select', { class: 'campo', 'data-gf-campo': 'venda-pagamento' }, ...PAGAMENTOS.map(([v, r]) => CE.el('option', { value: v }, r)));
        const desconto = CE.el('input', { class: 'campo pequeno', 'data-gf-campo': 'venda-desconto', value: '0', title: 'Desconto em %' });
        const erro = CE.el('p', { class: 'login-erro em-claro' });
        return [...titulo('🧾 Vendas', 'Monte a venda: escolha o produto e a quantidade e clique em "Adicionar". Depois o cliente, a forma de pagamento e "Finalizar venda".'),
          CE.el('div', { class: 'gf-venda' },
            CE.el('div', { class: 'gf-barra' }, selProduto, qtd, botao('➕ Adicionar', 'adicionar-item', () => {
              const p = produto(selProduto.value), q = Math.round(Number(qtd.value));
              if (!(q > 0)) { erro.textContent = 'Quantidade inválida.'; return; }
              const ja = carrinho.find((i) => i.cod === p.cod);
              if ((ja ? ja.qtd : 0) + q > p.estoque) { erro.textContent = `Estoque insuficiente: só tem ${p.estoque} ${p.nome}.`; CE.emitir('gestao:sem-estoque', { cod: p.cod }); desenharErro(); return; }
              if (ja) ja.qtd += q; else carrinho.push({ cod: p.cod, nome: p.nome, qtd: q, preco: p.preco });
              CE.emitir('gestao:item', { cod: p.cod, qtd: q });
              desenhar();
            })),
            tabela(['Produto', 'Qtd', 'Preço', 'Total', ''], carrinho.map((i, k) => CE.el('tr', { 'data-gf-item': i.cod }, CE.el('td', {}, i.nome), CE.el('td', { class: 'gf-num' }, String(i.qtd)),
              CE.el('td', { class: 'gf-num' }, reais(i.preco)), CE.el('td', { class: 'gf-num' }, reais(i.qtd * i.preco)),
              CE.el('td', {}, CE.el('button', { class: 'botao pequeno secundario', onclick: () => { carrinho.splice(k, 1); desenhar(); } }, '✕'))))),
            CE.el('div', { class: 'gf-barra' }, CE.el('label', { class: 'gf-campo' }, 'Cliente', cliente), CE.el('label', { class: 'gf-campo' }, 'Pagamento', pagamento), CE.el('label', { class: 'gf-campo' }, 'Desconto (%)', desconto)),
            CE.el('p', { class: 'gf-total', 'data-gf-total': String(total) }, `Subtotal: ${reais(total)}`), erro,
            botao('✅ Finalizar venda', 'finalizar-venda', () => {
              erro.textContent = '';
              if (!carrinho.length) { erro.textContent = 'Adicione pelo menos um produto.'; return; }
              if (pagamento.value === 'boleto' && cliente.value === 'Consumidor final') { erro.textContent = 'Venda a prazo (boleto) só para cliente cadastrado: cadastre o cliente antes.'; return; }
              const pct = Math.min(Math.max(num(desconto.value), 0), 30);
              if (num(desconto.value) > 30) { erro.textContent = 'Desconto acima de 30% precisa de autorização do gerente.'; return; }
              finalizarVenda(cliente.value, pagamento.value, pct);
            })),
          CE.el('h3', {}, 'Vendas registradas'),
          tabela(['Nº', 'Data', 'Cliente', 'Pagamento', 'Total', ''], empresa.vendas.slice().reverse().map((v) => CE.el('tr', { 'data-gf-venda': String(v.numero) },
            CE.el('td', {}, String(v.numero)), CE.el('td', {}, br(v.data)), CE.el('td', {}, v.cliente), CE.el('td', {}, (PAGAMENTOS.find((x) => x[0] === v.pagamento) || ['', v.pagamento])[1]),
            CE.el('td', { class: 'gf-num' }, reais(v.total)), CE.el('td', {}, CE.el('button', { class: 'botao pequeno secundario', 'data-gf-acao': 'recibo', title: 'Emitir o recibo desta venda', onclick: () => recibo(v) }, '🧾 Recibo')))))];
        function desenharErro() { /* o texto do erro já está na tela */ }
      }
      function finalizarVenda(cliente, pagamento, pct) {
        const bruto = carrinho.reduce((s, i) => s + i.qtd * i.preco, 0);
        const total = Math.round(bruto * (1 - pct / 100) * 100) / 100;
        const v = { numero: ++empresa.seq.venda, data: hoje(), cliente, itens: carrinho, desconto: pct, total, pagamento, vendedor: CE.sessao.usuario.nome };
        empresa.vendas.push(v);
        carrinho.forEach((i) => { produto(i.cod).estoque -= i.qtd; empresa.movimentos.push({ data: hoje(), cod: i.cod, qtd: i.qtd, tipo: 'saida', doc: `Venda ${v.numero}` }); });
        const prazo = pagamento === 'boleto';
        empresa.contas.push({ id: 'k' + (++empresa.seq.conta), tipo: 'receber', descricao: `Venda ${v.numero} (${prazo ? 'boleto' : (PAGAMENTOS.find((x) => x[0] === pagamento) || ['', pagamento])[1].slice(2).trim()})`, pessoa: cliente,
          vencimento: prazo ? daqui(30) : hoje(), valor: total, categoria: 'Vendas', paga: !prazo, pagaEm: prazo ? null : hoje() });
        carrinho = [];
        mudou();
        CE.emitir('gestao:venda', { numero: v.numero, cliente, total, pagamento, prazo, itens: v.itens.length, desconto: pct, produtos: v.itens.map((i) => i.cod) });
        CE.avisar(`✅ Venda ${v.numero} registrada: ${reais(total)}.${prazo ? ' Como é a prazo, entrou em Contas a receber (vence em 30 dias).' : ''}`);
      }
      async function recibo(v) {
        const html = `<div style="text-align: center;"><b><font size="6">RECIBO</font></b></div><div style="text-align: center;">Venda nº ${v.numero}</div><div><br></div>
          <div style="text-align: right;"><b>Valor: ${reais(v.total)}</b></div><div><br></div>
          <div style="text-align: justify;">Recebemos de <b>${CE.escapar(v.cliente)}</b> a quantia de <b>${reais(v.total)}</b>, referente à compra de: ${v.itens.map((i) => `${i.qtd} ${CE.escapar(i.nome)}`).join('; ')}${v.desconto ? ` (com ${v.desconto}% de desconto)` : ''}. Forma de pagamento: ${(PAGAMENTOS.find((x) => x[0] === v.pagamento) || ['', v.pagamento])[1].slice(2).trim()}.</div><div><br></div>
          <div>Porto Velho, ${br(v.data)}.</div><div><br></div><div style="text-align: center;">_______________________________________</div>
          <div style="text-align: center;">${empresa.nome} — CNPJ ${empresa.cnpj}</div>`;
        const nome = `Recibo da venda ${v.numero}`;
        try {
          const arquivo = await salvarDocumento(nome, html);
          CE.emitir('gestao:recibo', { venda: v.numero, nome, cliente: v.cliente, total: v.total });
          CE.avisar(`🧾 Recibo salvo em Meus Documentos › Gestão Fácil. Abrindo no Editor para imprimir…`);
          if (arquivo) CE.janelas.abrir('editor', { arquivo });
        } catch (e) { CE.avisar('⚠️ ' + e.message); }
      }

      // ---------- Financeiro ----------
      function telaFinanceiro() {
        const f = fluxo();
        const linha = (c) => CE.el('tr', { class: vencida(c) ? 'gf-baixo' : c.paga ? 'gf-pago' : '', 'data-gf-conta': c.descricao },
          CE.el('td', {}, c.tipo === 'pagar' ? '🔴 Pagar' : '🟢 Receber'), CE.el('td', {}, c.descricao), CE.el('td', {}, c.pessoa), CE.el('td', {}, br(c.vencimento)),
          CE.el('td', { class: 'gf-num' }, reais(c.valor)), CE.el('td', {}, c.paga ? `✅ ${c.tipo === 'pagar' ? 'Paga' : 'Recebida'} em ${br(c.pagaEm)}` : vencida(c) ? '⏰ ATRASADA' : 'Em aberto'),
          CE.el('td', {}, c.paga ? '' : CE.el('button', { class: 'botao pequeno', 'data-gf-acao': 'baixa', onclick: () => baixa(c) }, c.tipo === 'pagar' ? '💸 Pagar' : '💰 Receber')));
        const ordem = (a, b) => (a.paga - b.paga) || a.vencimento.localeCompare(b.vencimento);
        return [...titulo('💰 Financeiro', 'Contas a pagar e a receber. "Dar baixa" é registrar que a conta foi paga (ou recebida). Atrasadas aparecem em vermelho.'),
          CE.el('div', { class: 'gf-cartoes pequenos', 'data-gf-fluxo': String(f.saldo) },
            CE.el('div', { class: 'gf-cartao' }, CE.el('small', {}, 'Saldo do caixa hoje'), CE.el('b', {}, reais(f.saldo))),
            CE.el('div', { class: 'gf-cartao' }, CE.el('small', {}, 'A receber (30 dias)'), CE.el('b', {}, reais(f.aReceber))),
            CE.el('div', { class: 'gf-cartao' }, CE.el('small', {}, 'A pagar (30 dias)'), CE.el('b', {}, reais(f.aPagar))),
            CE.el('div', { class: 'gf-cartao' + (f.previsto < 0 ? ' alerta' : '') }, CE.el('small', {}, 'Previsto em 30 dias'), CE.el('b', {}, reais(f.previsto)))),
          CE.el('div', { class: 'gf-barra' }, botao('➕ Nova conta a pagar', 'nova-pagar', () => novaConta('pagar')), botao('➕ Nova conta a receber', 'nova-receber', () => novaConta('receber'), 'secundario'),
            botao('📈 Fluxo de caixa', 'fluxo', () => { CE.emitir('gestao:fluxo', { saldo: f.saldo, previsto: f.previsto }); CE.avisar(`📈 Fluxo de caixa: entraram ${reais(f.entradas)}, saíram ${reais(f.saidas)}. Saldo: ${reais(f.saldo)}. Previsto em 30 dias: ${reais(f.previsto)}.`); }, 'secundario')),
          tabela(['Tipo', 'Descrição', 'Pessoa / empresa', 'Vencimento', 'Valor', 'Situação', ''], empresa.contas.slice().sort(ordem).map(linha))];
      }
      async function novaConta(tipo) {
        const v = await formulario(tipo === 'pagar' ? '➕ Nova conta a pagar' : '➕ Nova conta a receber', [
          { nome: 'descricao', rotulo: 'Descrição', dica: tipo === 'pagar' ? 'Ex.: NF 4512 — mercadorias' : 'Ex.: Serviço de entrega' },
          { nome: 'pessoa', rotulo: tipo === 'pagar' ? 'Fornecedor / quem recebe' : 'Cliente / quem paga' },
          { nome: 'vencimento', rotulo: 'Vencimento', tipo: 'date', valor: daqui(15) },
          { nome: 'valor', rotulo: 'Valor (R$)', dica: '0,00' },
          { nome: 'categoria', rotulo: 'Categoria', opcoes: (tipo === 'pagar' ? ['Fornecedores', 'Aluguel', 'Energia', 'Telefone', 'Salários', 'Impostos', 'Outros'] : ['Vendas', 'Serviços', 'Outros']).map((x) => [x, x]) },
        ], { validar: (v) => (v.descricao.length < 3 ? 'Escreva a descrição.' : !v.pessoa ? 'Escreva o nome.' : !v.vencimento ? 'Escolha o vencimento.' : !(num(v.valor) > 0) ? 'Escreva o valor.' : '') });
        if (!v) return;
        const c = { id: 'k' + (++empresa.seq.conta), tipo, descricao: v.descricao, pessoa: v.pessoa, vencimento: v.vencimento, valor: num(v.valor), categoria: v.categoria, paga: false };
        empresa.contas.push(c);
        mudou();
        CE.emitir('gestao:conta', { acao: 'nova', tipo, descricao: c.descricao, pessoa: c.pessoa, valor: c.valor, vencimento: c.vencimento, categoria: c.categoria });
      }
      async function baixa(c) {
        const atrasada = vencida(c);
        if (!await CE.confirmar(`${c.tipo === 'pagar' ? 'Registrar o PAGAMENTO' : 'Registrar o RECEBIMENTO'} de "${c.descricao}" (${reais(c.valor)})?${atrasada ? ' Atenção: está atrasada, pode ter multa e juros.' : ''}`)) return;
        c.paga = true; c.pagaEm = hoje();
        mudou();
        CE.emitir('gestao:baixa', { tipo: c.tipo, descricao: c.descricao, valor: c.valor, atrasada, pessoa: c.pessoa });
      }

      // ---------- Protocolo ----------
      function telaProtocolo() {
        return [...titulo('📑 Protocolo de documentos', 'Todo documento que chega ganha um NÚMERO de protocolo: assim ninguém perde o papel e dá para saber onde ele está.'),
          CE.el('h3', {}, `📥 Na mesa, esperando registro (${empresa.entrada.length})`),
          tabela(['Tipo', 'De', 'Assunto', ''], empresa.entrada.map((d) => CE.el('tr', { 'data-gf-entrada': d.tipo },
            CE.el('td', {}, d.tipo), CE.el('td', {}, d.origem), CE.el('td', {}, d.assunto),
            CE.el('td', {}, CE.el('button', { class: 'botao pequeno', 'data-gf-acao': 'registrar', onclick: () => registrar(d) }, '📑 Registrar'))))),
          CE.el('h3', {}, 'Livro de protocolo'),
          tabela(['Protocolo', 'Data', 'Tipo', 'De', 'Assunto', 'Setor', 'Situação', ''], empresa.protocolo.map((p) => CE.el('tr', { 'data-gf-protocolo': p.numero, 'data-gf-tipo': p.situacao === 'Arquivado' ? '' : p.tipo },
            CE.el('td', {}, CE.el('b', {}, p.numero)), CE.el('td', {}, br(p.data)), CE.el('td', {}, p.tipo), CE.el('td', {}, p.origem), CE.el('td', {}, p.assunto), CE.el('td', {}, p.setor || '—'),
            CE.el('td', {}, p.situacao + (p.arquivo ? ` (${p.arquivo})` : '')),
            CE.el('td', {}, p.situacao === 'Arquivado' ? '' : CE.el('span', { class: 'gf-acoes' },
              CE.el('button', { class: 'botao pequeno secundario', 'data-gf-acao': 'encaminhar', onclick: () => encaminhar(p) }, '➡️ Encaminhar'),
              CE.el('button', { class: 'botao pequeno secundario', 'data-gf-acao': 'arquivar', onclick: () => arquivar(p) }, '🗄️ Arquivar'))))))];
      }
      function registrar(d) {
        const ano = agora().getFullYear();
        const p = { numero: `${ano}/${String(++empresa.seq.protocolo).padStart(4, '0')}`, data: hoje(), tipo: d.tipo, origem: d.origem, assunto: d.assunto, setor: '', situacao: 'Recebido', historico: [{ data: hoje(), acao: 'Recebido' }] };
        empresa.protocolo.push(p);
        empresa.entrada = empresa.entrada.filter((x) => x !== d);
        mudou();
        CE.emitir('gestao:protocolo', { acao: 'registrar', numero: p.numero, tipo: p.tipo });
        CE.avisar(`📑 Protocolo ${p.numero}. Escreva esse número no canto do papel: é a "identidade" do documento.`);
      }
      async function encaminhar(p) {
        const v = await formulario(`➡️ Encaminhar o protocolo ${p.numero}`, [{ nome: 'setor', rotulo: 'Para qual setor?', opcoes: SETORES.map((s) => [s, s]) }], { textoOk: 'Encaminhar' });
        if (!v) return;
        p.setor = v.setor; p.situacao = `Encaminhado ao ${v.setor}`; p.historico.push({ data: hoje(), acao: `Encaminhado ao ${v.setor}` });
        mudou();
        CE.emitir('gestao:protocolo', { acao: 'encaminhar', numero: p.numero, tipo: p.tipo, setor: v.setor });
      }
      async function arquivar(p) {
        const v = await formulario(`🗄️ Arquivar o protocolo ${p.numero}`, [{ nome: 'local', rotulo: 'Onde ficou guardado? (pasta ou caixa)', valor: `Caixa ${p.tipo} ${agora().getFullYear()}` }],
          { textoOk: 'Arquivar', validar: (v) => (v.local.length < 3 ? 'Escreva onde o documento foi guardado.' : '') });
        if (!v) return;
        p.situacao = 'Arquivado'; p.arquivo = v.local; p.historico.push({ data: hoje(), acao: `Arquivado em ${v.local}` });
        mudou();
        CE.emitir('gestao:protocolo', { acao: 'arquivar', numero: p.numero, tipo: p.tipo, local: v.local });
      }

      // ---------- RH ----------
      let rhAba = 'lista', rhFunc = 'f2';
      function telaRh() {
        const f = empresa.funcionarios.find((x) => x.id === rhFunc) || empresa.funcionarios[0];
        const abas = CE.el('div', { class: 'gt-abas gf-abas' }, ...[['lista', '👔 Funcionários'], ['ponto', '⏱️ Ponto da semana'], ['holerite', '💵 Holerite'], ['admissao', '📋 Admissão']].map(([a, r]) => CE.el('button', {
          class: 'gt-aba' + (rhAba === a ? ' ativa' : ''), 'data-gf-rh': a, onclick: () => { rhAba = a; desenhar(); CE.emitir('gestao:rh', { aba: a }); } }, r)));
        const escolher = CE.el('select', { class: 'campo', 'data-gf-campo': 'funcionario', onchange: (e) => { rhFunc = e.target.value; desenhar(); } }, ...empresa.funcionarios.map((x) => CE.el('option', { value: x.id, selected: x.id === f.id }, `${x.nome} — ${x.cargo}`)));
        let parte = [];
        if (rhAba === 'lista') {
          parte = [tabela(['Nome', 'Cargo', 'Salário', 'Admissão'], empresa.funcionarios.map((x) => CE.el('tr', { 'data-gf-funcionario': x.nome }, CE.el('td', {}, x.nome), CE.el('td', {}, x.cargo), CE.el('td', { class: 'gf-num' }, reais(x.salario)), CE.el('td', {}, br(x.admissao)))))];
        } else if (rhAba === 'ponto') {
          const campos = {};
          const linhas = DIAS_SEMANA.map(([k, nome]) => CE.el('tr', {}, CE.el('td', {}, nome), ...[0, 1, 2, 3].map((i) => {
            const c = CE.el('input', { class: 'campo gf-hora', type: 'time', 'data-gf-ponto': `${k}-${i}`, value: (f.ponto && f.ponto[k] && f.ponto[k][i]) || '' });
            (campos[k] = campos[k] || [])[i] = c;
            return CE.el('td', {}, c);
          }), CE.el('td', { class: 'gf-num' }, f.ponto ? `${horasDoDia(f.ponto[k]).toLocaleString('pt-BR')} h` : '')));
          const r = f.ponto ? resumoPonto(f.ponto) : null;
          parte = [CE.el('div', { class: 'gf-barra' }, escolher),
            CE.el('p', { class: 'gf-dica' }, 'Copie os horários da folha de ponto (entrada, saída para o almoço, volta do almoço e saída). A jornada é de 8 horas por dia: o que passar disso é hora extra.'),
            tabela(['Dia', 'Entrada', 'Saída almoço', 'Volta almoço', 'Saída', 'Horas'], linhas),
            r ? CE.el('p', { class: 'gf-total', 'data-gf-ponto-total': `${r.horas}|${r.extras}` }, `Total da semana: ${r.horas.toLocaleString('pt-BR')} horas · Horas extras: ${r.extras.toLocaleString('pt-BR')}`) : null,
            botao('💾 Salvar ponto', 'salvar-ponto', () => {
              f.ponto = Object.fromEntries(DIAS_SEMANA.map(([k]) => [k, campos[k].map((c) => c.value)]));
              const res = resumoPonto(f.ponto);
              mudou();
              CE.emitir('gestao:ponto', { funcionario: f.nome, horas: res.horas, extras: res.extras });
            })];
        } else if (rhAba === 'holerite') {
          const h = holerite(f);
          parte = [CE.el('div', { class: 'gf-barra' }, escolher),
            CE.el('div', { class: 'gf-holerite', 'data-gf-holerite': String(h.liquido) },
              CE.el('h3', {}, `Holerite — ${f.nome} (${f.cargo})`),
              tabela(['Descrição', 'Proventos', 'Descontos'], [
                CE.el('tr', {}, CE.el('td', {}, 'Salário base'), CE.el('td', { class: 'gf-num' }, reais(h.salario)), CE.el('td', {}, '')),
                CE.el('tr', {}, CE.el('td', {}, `Horas extras (${h.extras.toLocaleString('pt-BR')} h com 50%)`), CE.el('td', { class: 'gf-num' }, reais(h.he)), CE.el('td', {}, '')),
                CE.el('tr', {}, CE.el('td', {}, 'INSS (desconto do salário)'), CE.el('td', {}, ''), CE.el('td', { class: 'gf-num' }, reais(h.inss))),
              ]),
              CE.el('p', { class: 'gf-total' }, `Salário bruto: ${reais(h.bruto)} · Salário LÍQUIDO (o que cai na conta): ${reais(h.liquido)}`),
              CE.el('p', { class: 'gf-dica' }, `FGTS do mês: ${reais(h.fgts)} (8% — a empresa deposita, NÃO é descontado do funcionário).`)),
            botao('👁️ Conferi o holerite', 'conferir-holerite', () => CE.emitir('gestao:holerite', { funcionario: f.nome, liquido: h.liquido, bruto: h.bruto, inss: h.inss, extras: h.extras }), 'secundario')];
        } else {
          const docs = f.docs || {};
          const faltam = DOCS_ADMISSAO.filter(([k]) => !docs[k]);
          parte = [CE.el('div', { class: 'gf-barra' }, escolher),
            CE.el('p', { class: 'gf-dica' }, 'Antes do primeiro dia de trabalho, o RH confere os documentos. Marque cada um que a pessoa entregou.'),
            CE.el('div', { class: 'pc-checklist' }, ...DOCS_ADMISSAO.map(([k, nome]) => CE.el('label', { class: 'pc-check', 'data-gf-doc': k },
              CE.el('input', { type: 'checkbox', checked: !!docs[k], onchange: (e) => {
                f.docs = { ...(f.docs || {}), [k]: e.target.checked };
                const resta = DOCS_ADMISSAO.filter(([d]) => !f.docs[d]).length;
                mudou();
                CE.emitir('gestao:admissao', { funcionario: f.nome, documento: k, completo: resta === 0, faltam: resta });
              } }), CE.el('span', {}, nome)))),
            CE.el('p', { class: 'gf-total', 'data-gf-admissao': String(faltam.length) }, faltam.length ? `Faltam ${faltam.length} documento(s).` : '✅ Documentação completa: pode começar a trabalhar!')];
        }
        return [...titulo('👔 Funcionários (RH)', 'Departamento pessoal: ponto, holerite e admissão.'), abas, ...parte];
      }

      // ---------- Relatórios ----------
      function telaRelatorios() {
        const rel = (id, icone, nome, descricao) => CE.el('div', { class: 'cfg-app', 'data-gf-relatorio': id },
          CE.el('span', { class: 'cfg-app-icone' }, icone), CE.el('div', {}, CE.el('b', {}, nome), CE.el('small', {}, descricao)),
          botao('📊 Exportar para a Planilha', `exportar-${id}`, () => exportar(id)));
        return [...titulo('📤 Relatórios', 'Exporte os dados para a Planilha: lá dá para fazer gráfico, tabela dinâmica e imprimir.'),
          CE.el('div', { class: 'cfg-lista' },
            rel('vendas', '🧾', 'Vendas do mês', 'Número, data, cliente, vendedor, pagamento e total (com a soma).'),
            rel('estoque', '📦', 'Posição do estoque', 'Produtos, quantidades, mínimo, situação e valor em estoque.'),
            rel('contas', '💰', 'Contas a pagar e a receber', 'Todas as contas, com vencimento e situação.'))];
      }
      async function exportar(id) {
        let nome, conteudo;
        const mes = hoje().slice(0, 7);
        if (id === 'vendas') {
          const vs = empresa.vendas.filter((v) => v.data.slice(0, 7) === mes);
          const linhas = [['Nº', 'Data', 'Cliente', 'Vendedor', 'Pagamento', 'Total'], ...vs.map((v) => [v.numero, br(v.data), v.cliente, v.vendedor, (PAGAMENTOS.find((x) => x[0] === v.pagamento) || ['', v.pagamento])[1].slice(2).trim(), String(v.total).replace('.', ',')])];
          const n = linhas.length;
          nome = `Relatório de vendas ${mes.split('-').reverse().join('-')}`;
          // O total fica separado da tabela por uma linha vazia (assim o filtro e a tabela dinâmica não pegam o total).
          conteudo = planilha(linhas, { [`E${n + 2}`]: { v: 'Total', f: { negrito: true } }, [`F${n + 2}`]: { v: `=SOMA(F2:F${n})`, f: { negrito: true, formato: 'moeda' } } }, { C: 190, D: 150, E: 120 });
        } else if (id === 'estoque') {
          const linhas = [['Código', 'Produto', 'Estoque', 'Mínimo', 'Preço', 'Situação', 'Valor em estoque'], ...empresa.produtos.map((p) => [p.cod, p.nome, p.estoque, p.minimo, String(p.preco).replace('.', ',')])];
          const extras = {};
          empresa.produtos.forEach((p, i) => { const l = i + 2; extras[`F${l}`] = `=SE(C${l}<D${l};"COMPRAR";"OK")`; extras[`G${l}`] = { v: `=C${l}*E${l}`, f: { formato: 'moeda' } }; });
          const n = empresa.produtos.length + 1;
          extras[`F${n + 2}`] = { v: 'Total', f: { negrito: true } }; extras[`G${n + 2}`] = { v: `=SOMA(G2:G${n})`, f: { negrito: true, formato: 'moeda' } };
          nome = 'Posição do estoque';
          conteudo = planilha(linhas, extras, { B: 190, G: 130 });
        } else {
          const linhas = [['Tipo', 'Descrição', 'Pessoa', 'Vencimento', 'Valor', 'Situação'], ...empresa.contas.map((c) => [c.tipo === 'pagar' ? 'Pagar' : 'Receber', c.descricao, c.pessoa, br(c.vencimento), String(c.valor).replace('.', ','), c.paga ? 'Paga' : vencida(c) ? 'Atrasada' : 'Em aberto'])];
          nome = 'Contas a pagar e a receber';
          conteudo = planilha(linhas, {}, { B: 200, C: 170, D: 100 });
        }
        try {
          await CE.sessao.garantirPasta('Gestão Fácil', 'pc', '');
          const arquivo = await CE.sessao.salvarArquivo({ nome, tipo: 'planilha', conteudo, local: 'pc', pasta: 'Gestão Fácil' });
          CE.emitir('gestao:exportado', { relatorio: id, nome });
          CE.avisar(`📊 "${nome}" foi para Meus Documentos › Gestão Fácil. Abrindo na Planilha…`);
          if (arquivo) CE.janelas.abrir('planilha', { arquivo });
        } catch (e) { CE.avisar('⚠️ ' + e.message); }
      }

      const TELAS = { inicio: telaInicio, clientes: telaClientes, estoque: telaEstoque, vendas: telaVendas, financeiro: telaFinanceiro, protocolo: telaProtocolo, rh: telaRh, relatorios: telaRelatorios };
      function desenhar() {
        if (!empresa || !corpo.isConnected) return;
        lateral.replaceChildren(CE.el('div', { class: 'gf-marca' }, '🗂️ Gestão Fácil'), ...ABAS.map(([id, icone, nome]) => CE.el('button', { class: 'gf-item' + (id === aba ? ' ativo' : ''), 'data-gf-aba': id, onclick: () => irAba(id) }, CE.el('span', {}, icone), nome)));
        conteudo.replaceChildren(...TELAS[aba]().filter(Boolean));
        janela.definirTitulo(empresa.nome);
      }
      telasAbertas.add(desenhar);
      garantir().then(() => { desenhar(); CE.emitir('gestao:aberto', {}); }).catch((e) => conteudo.replaceChildren(CE.el('p', {}, '⚠️ ' + e.message)));
      return { receber(arg) { if (arg && arg.aba) irAba(arg.aba); }, aoFechar() { telasAbertas.delete(desenhar); return true; } };
    },
  });
})();
