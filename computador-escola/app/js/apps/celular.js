// Celular simulado: um smartphone de treino dentro do computador. Tela de bloqueio com PIN, Mensagens (como o
// WhatsApp, com grupo, fotos, áudio, encaminhar e checar boato), Telefone (ligações de verdade e golpe da falsa
// central), Banco (Pix com conferência do nome, QR Code, limite noturno, cartão), Câmera e Galeria (enviar foto para o
// computador), Loja de apps com permissões, Ajustes (Wi-Fi, letra, bloqueio, duas etapas, atualização) e SMS.
// As aulas disparam "cenários" (CE.celular.cenario('falso-parente')): mensagens e ligações chegam como na vida real.
// Tudo fica no progresso do aluno (p.celular), no computador do instrutor: o aluno acha o celular em qualquer PC.
window.CE = window.CE || {};

(function () {
  const CONTATOS = {
    maria: { nome: 'Maria (filha)', avatar: '👩', tel: '(69) 99876-5432' },
    familia: { nome: 'Família', avatar: '👨‍👩‍👧', grupo: true },
    rosa: { nome: 'Tia Rosa', avatar: '👵', tel: '(69) 99111-2233' },
    carlos: { nome: 'Sr. Carlos (trabalho)', avatar: '👨‍💼', tel: '(69) 3222-1100' },
    golpista: { nome: '+55 11 98888-1234', avatar: '👤', tel: '+55 11 98888-1234', desconhecido: true },
    promo: { nome: '+55 21 97777-0000', avatar: '👤', tel: '+55 21 97777-0000', desconhecido: true },
  };
  const AGENDA_TEL = ['maria', 'rosa', 'carlos'];
  const CENTRAL_OFICIAL = '4004-0001';
  const CHAVES_PIX = {
    '69998765432': { nome: 'Maria Clara Souza', banco: 'Banco Escola', contato: 'maria' },
    '11988881234': { nome: 'Pedro Henrique Lima', banco: 'Banco Rápido S.A.', golpe: 'falso-parente' },
    'padaria@paoquente.com.br': { nome: 'Padaria Pão Quente Ltda', banco: 'Banco Escola' },
    '76801000000150': { nome: 'Energia Rondônia S.A.', banco: 'Banco Escola' },
  };
  const QR_CODES = [
    { id: 'padaria', titulo: 'Padaria Pão Quente', icone: '🥖', valor: 23.5, chave: 'padaria@paoquente.com.br', texto: 'Pague com Pix: aponte a câmera para o QR Code no balcão.' },
    { id: 'luz', titulo: 'Conta de luz (QR Code no boleto)', icone: '💡', valor: 145.8, chave: '76801000000150', texto: 'O QR Code fica no canto do boleto.' },
  ];
  const LOJA = [
    { id: 'lanterna', nome: 'Lanterna', icone: '🔦', dev: 'Sistema do celular', nota: 4.6, baixados: '100 mi', permissoes: ['câmera (só o flash)'], descricao: 'Liga a luz do flash.' },
    { id: 'lanterna-super', nome: 'LANTERNA SUPER TURBO 2000', icone: '💡', dev: 'Mega Apps Grátis', nota: 2.1, baixados: '12 mil', suspeito: true,
      permissoes: ['seus contatos', 'suas mensagens SMS', 'sua localização', 'o microfone', 'a câmera'], descricao: 'A lanterna MAIS FORTE do mundo!!! Grátis!!!' },
    { id: 'jogo', nome: 'Fazendinha Feliz', icone: '🐔', dev: 'Jogos Divertidos Ltda', nota: 4.1, baixados: '5 mi', permissoes: ['pede ao abrir'], descricao: 'Cuide da sua fazenda. Tem propagandas.' },
    { id: 'mapas', nome: 'Mapas', icone: '🗺️', dev: 'Sistema do celular', nota: 4.5, baixados: '1 bi', permissoes: ['localização (quando usar)'], descricao: 'Mapas e como chegar.' },
    { id: 'carteira', nome: 'Carteira Digital (gov)', icone: '🪪', dev: 'Governo Federal ✔', nota: 4.3, baixados: '50 mi', permissoes: ['câmera (para ler documentos)'], descricao: 'Documentos digitais oficiais.' },
  ];
  // Pedidos de permissão que alguns apps fazem ao abrir.
  const PEDIDOS = { jogo: ['contatos', 'microfone'], mapas: ['localização'] };
  const CENAS = {
    bolo: { nome: 'Bolo', emoji: '🎂', fundo: ['#ffe2c6', '#f4b58a'], mesa: '#a0673b' },
    paisagem: { nome: 'Rio Madeira', emoji: '🌳', fundo: ['#8fd3ff', '#3a8fd6'], mesa: '#3d8b40', sol: true },
    cachorro: { nome: 'Cachorro', emoji: '🐶', fundo: ['#f6f1d9', '#d7c78f'], mesa: '#9c7a4f' },
    flor: { nome: 'Flor', emoji: '🌻', fundo: ['#c9f0d3', '#7cc88f'], mesa: '#5a9b5f' },
    prato: { nome: 'Almoço', emoji: '🍲', fundo: ['#fff1d6', '#ffd38a'], mesa: '#b07a3a' },
    documento: { nome: 'Documento', emoji: '🪪', fundo: ['#e7ecf3', '#c4ceda'], mesa: '#8794a5' },
  };
  const ORDEM_CENAS = ['bolo', 'paisagem', 'cachorro', 'flor', 'prato', 'documento'];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const so = (t) => String(t || '').replace(/\D/g, '');
  const reais = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hora = (t) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const inicial = () => ({
    pin: '', letra: 'media', brilho: 90, wifi: true, aviao: false, duasEtapas: false, atualizado: false,
    apps: [], permissoes: {}, conversas: {}, lidas: {}, bloqueados: [], denunciados: [], sms: [], chamadas: [],
    banco: { senha: '', saldo: 1250, limiteNoite: 1000, cartaoBloqueado: false, extrato: [{ id: 'e1', desc: 'Salário', valor: 1250, em: Date.now() - 86400000 * 3 }] },
    galeria: [{ id: 'g1', cena: 'paisagem', em: Date.now() - 86400000 * 2 }, { id: 'g2', cena: 'flor', em: Date.now() - 86400000 }],
    cenarios: {},
  });

  // ---------- Estado (no progresso do aluno) ----------
  let estado = null, dono = null, carregando = null;
  let bloqueado = true; // o celular começa bloqueado a cada entrada no sistema
  let chamada = null; // ligação acontecendo agora
  const ouvintes = new Set(); // telas abertas que precisam redesenhar
  const avisarTelas = () => ouvintes.forEach((f) => { try { f(); } catch { /* tela fechada */ } });

  async function garantir() {
    const u = CE.sessao.usuario;
    if (!u) throw new Error('Ninguém entrou no sistema.');
    if (estado && dono === u.id) return estado;
    if (carregando && dono === u.id) return carregando;
    dono = u.id;
    const vale = CE.sessao.marca();
    carregando = CE.sessao.progresso().then((p) => {
      if (!vale()) throw new Error('Quem abriu o celular já saiu.');
      estado = { ...inicial(), ...(p.celular || {}) };
      estado.banco = { ...inicial().banco, ...(estado.banco || {}) };
      carregando = null;
      return estado;
    });
    return carregando;
  }
  function salvar() {
    if (!estado || !CE.sessao.usuario || CE.sessao.usuario.id !== dono) return Promise.resolve();
    const copia = JSON.parse(JSON.stringify(estado));
    return CE.sessao.atualizarProgresso((p) => { p.celular = copia; }).catch(() => {});
  }

  // ---------- Fotos (desenhadas na hora: guardamos só qual cena foi fotografada) ----------
  const cacheFotos = {};
  function imagemDe(item) {
    const chave = item.cena + (item.dados ? JSON.stringify(item.dados) : '');
    if (cacheFotos[chave]) return cacheFotos[chave];
    const c = document.createElement('canvas'); c.width = 480; c.height = 360;
    const x = c.getContext('2d');
    if (item.cena === 'comprovante') {
      x.fillStyle = '#fff'; x.fillRect(0, 0, 480, 360);
      x.fillStyle = '#0a7d3a'; x.fillRect(0, 0, 480, 70);
      x.fillStyle = '#fff'; x.font = 'bold 26px Arial'; x.fillText('✔ Pix enviado', 24, 46);
      x.fillStyle = '#222'; x.font = '20px Arial';
      const d = item.dados || {};
      [['Valor', reais(d.valor)], ['Para', d.nome || ''], ['Banco', d.banco || ''], ['Data', new Date(d.em || Date.now()).toLocaleString('pt-BR')], ['Código', d.codigo || '']]
        .forEach(([r, v], i) => { x.fillStyle = '#666'; x.fillText(r, 24, 115 + i * 48); x.fillStyle = '#111'; x.fillText(v, 150, 115 + i * 48); });
    } else {
      const cena = CENAS[item.cena] || CENAS.paisagem;
      const g = x.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, cena.fundo[0]); g.addColorStop(1, cena.fundo[1]);
      x.fillStyle = g; x.fillRect(0, 0, 480, 360);
      if (cena.sol) { x.fillStyle = '#ffd84d'; x.beginPath(); x.arc(400, 70, 38, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = cena.mesa; x.fillRect(0, 270, 480, 90);
      if (item.cena === 'documento') {
        x.fillStyle = '#f7f3e6'; x.fillRect(90, 70, 300, 190); x.strokeStyle = '#6b7b8c'; x.lineWidth = 3; x.strokeRect(90, 70, 300, 190);
        x.fillStyle = '#2a4d6e'; x.font = 'bold 16px Arial'; x.fillText('CARTEIRA DE IDENTIDADE', 120, 100);
        x.fillStyle = '#b00'; x.font = 'bold 14px Arial'; x.fillText('DOCUMENTO DE TREINO', 160, 250);
        x.font = '64px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; x.fillText('🙂', 110, 200);
        x.fillStyle = '#333'; x.font = '14px Arial'; ['Nome: FULANO DE TAL', 'RG: 00.000.000-0', 'Nasc.: 01/01/1980'].forEach((t, i) => x.fillText(t, 200, 150 + i * 26));
      } else {
        x.font = '170px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(cena.emoji, 240, 200);
      }
    }
    cacheFotos[chave] = c.toDataURL('image/jpeg', 0.82);
    return cacheFotos[chave];
  }

  // ---------- Conversas ----------
  const conversa = (id) => (estado.conversas[id] = estado.conversas[id] || []);
  const naoLidas = (id) => (estado.conversas[id] || []).filter((m) => m.de !== 'eu' && m.em > (estado.lidas[id] || 0)).length;
  const totalNaoLidas = () => Object.keys(estado.conversas).filter((id) => !estado.bloqueados.includes(id)).reduce((s, id) => s + naoLidas(id), 0);
  let conversaAberta = null; // a conversa na tela agora (as mensagens dela já chegam lidas)

  function chegou(id, dados) {
    if (estado.bloqueados.includes(id)) return null;
    const m = { id: uid(), de: id, em: Date.now(), ...dados };
    conversa(id).push(m);
    estado.conversas[id] = estado.conversas[id].slice(-80);
    if (conversaAberta === id) estado.lidas[id] = m.em;
    salvar();
    const c = CONTATOS[id] || { nome: id };
    if (conversaAberta !== id) {
      notificar(`💬 ${c.nome}${dados.autor ? ` (${dados.autor})` : ''}`, dados.texto || (dados.foto ? '📷 Foto' : ''), { tela: 'conversa', id });
    }
    CE.emitir('celular:mensagem-recebida', { conversa: id, texto: dados.texto || '', golpe: dados.golpe || null, boato: !!dados.boato });
    avisarTelas();
    return m;
  }
  // Mensagens que chegam um pouquinho depois (como numa conversa de verdade); só se o mesmo aluno continua.
  function depois(ms, f) {
    const g = CE.sessao.geracao;
    setTimeout(() => { if (CE.sessao.geracao === g && CE.sessao.usuario && CE.sessao.usuario.id === dono) f(); }, ms);
  }
  let notificacao = null; // { titulo, texto, ir } — aparece no alto da tela do celular
  function notificar(titulo, texto, ir) {
    notificacao = { titulo, texto, ir, em: Date.now() };
    if (!CE.janelas.estaAberta('celular')) CE.avisar(`📱 ${titulo}: ${String(texto).slice(0, 60)}`);
    setTimeout(() => { if (notificacao && Date.now() - notificacao.em >= 5500) { notificacao = null; avisarTelas(); } }, 6000);
  }

  // Respostas automáticas dos contatos.
  function responder(id, m) {
    const t = (m.texto || '').toLowerCase();
    if (id === 'maria') {
      const texto = m.foto ? 'Que lindo! 😍 Ficou ótimo!' : m.audio ? 'Ouvi o áudio! 👍'
        : /troc|n[uú]mero|golpe/.test(t) ? 'Eu não troquei de número não! 😱 Se alguém pediu dinheiro dizendo que é eu, é GOLPE. Bloqueia!'
          : /comprovante|pix|mandei/.test(t) ? 'Recebi o Pix, obrigada! ❤️' : 'Que bom! ❤️';
      depois(1400, () => chegou('maria', { texto }));
    } else if (id === 'golpista') {
      depois(1400, () => chegou('golpista', { texto: 'Faz o Pix logo, por favor, é urgente!! 😢 Amanhã te devolvo.', golpe: 'falso-parente' }));
    } else if (id === 'rosa' && estado.cenarios.codigo && !estado.cenarios.codigoResolvido) {
      if (so(m.texto).includes('482913')) {
        estado.cenarios.codigoResolvido = 'caiu';
        CE.emitir('celular:golpe-caiu', { tipo: 'codigo' });
        depois(1200, () => chegou('rosa', { texto: 'Obrigada! 😈 (Era golpe: com esse código, o golpista entrou na sua conta do Zap e agora pede dinheiro para os seus contatos. Ative a verificação em duas etapas!)', golpe: 'codigo' }));
      } else depois(1400, () => chegou('rosa', { texto: 'Por favor, querida, é rapidinho, me passa o código 🙏', golpe: 'codigo' }));
    } else if (id === 'carlos') {
      depois(1400, () => chegou('carlos', { texto: 'Obrigado! Até amanhã.' }));
    }
  }

  // ---------- Cenários que as aulas disparam ----------
  const CENARIOS = {
    'boas-vindas'() {
      chegou('maria', { texto: 'Oi! Tudo bem por aí? 😊' });
      chegou('familia', { autor: 'Tia Rosa', texto: 'Bom dia, família! ☀️' });
    },
    foto() { chegou('maria', { texto: 'Fez aquele bolo? Manda uma foto! 🎂' }); },
    boato() {
      chegou('familia', { autor: 'Tia Rosa', boato: true, texto: 'URGENTE!!! A partir de amanhã o Zap vai cobrar R$ 5,00 por mensagem!!! Compartilhe com 10 grupos para a sua conta não ser cobrada!!! 😱😱' });
    },
    'falso-parente'() {
      chegou('golpista', { texto: 'Oi! Sou eu, a Maria. Troquei de número, salva esse aqui 📱', golpe: 'falso-parente' });
      depois(1500, () => chegou('golpista', { texto: 'Preciso de um favor urgente: pagar uma conta de R$ 850,00, o app do meu banco travou. Faz um Pix pra essa chave? Amanhã te devolvo 🙏 Chave: 11988881234', golpe: 'falso-parente' }));
    },
    'central-falsa'() {
      sms('28392', 'BANCO ESCOLA: compra de R$ 2.890,00 APROVADA no seu cartão final 4521. Não reconhece? Ligue AGORA: 0800 999 1234', 'central-falsa');
      depois(5000, () => ligacaoRecebida('central-falsa'));
    },
    promocao() {
      chegou('promo', { texto: '🎁 PARABÉNS!!! Você foi sorteado(a) e ganhou uma AIR FRYER! Retire hoje, só até meia-noite:', link: 'promo-premios-brasil.net/retirar', golpe: 'link' });
      sms('Correios', 'CORREIOS: sua encomenda está RETIDA. Pague a taxa de R$ 9,90 para liberar a entrega: correios-taxa-entrega.com', 'link', 'correios-taxa-entrega.com');
    },
    codigo() {
      estado.cenarios.codigo = true;
      sms('Zap', 'Zap: seu código de confirmação é 482-913. NÃO compartilhe este código com ninguém.');
      depois(1800, () => chegou('rosa', { texto: 'Oi, querida! Te mandei um código de 6 números sem querer 😅 Me passa ele aqui rapidinho?', golpe: 'codigo' }));
    },
    chefe() { chegou('carlos', { texto: 'Bom dia! A reunião de amanhã é às 9h, na sala 2. Pode confirmar?' }); },
  };
  function sms(de, texto, golpe = null, link = null) {
    const m = { id: uid(), de, texto, em: Date.now(), golpe, link, lida: false };
    estado.sms = [...estado.sms, m].slice(-40);
    salvar();
    notificar(`✉️ SMS de ${de}`, texto, { tela: 'sms' });
    CE.emitir('celular:sms', { de, texto, golpe });
    avisarTelas();
  }

  // ---------- Ligações ----------
  const ROTEIROS = {
    'central-falsa': {
      de: '0800 999 1234', nome: 'Central de Segurança', golpe: true,
      falas: ['Boa tarde! Aqui é da Central de Segurança do Banco Escola. Identificamos uma compra de dois mil, oitocentos e noventa reais no seu cartão.',
        'Para cancelar a compra agora, eu preciso que você me confirme a SENHA do cartão e o código que vai chegar por SMS.'],
      opcoes: [['senha', '🔢 Falar a senha'], ['desligar', '📵 Desligar e ligar para o banco']],
    },
    oficial: {
      de: CENTRAL_OFICIAL, nome: 'Banco Escola (central oficial)',
      falas: ['Banco Escola, boa tarde! Conferi aqui: NÃO existe nenhuma compra de dois mil e oitocentos reais no seu cartão. Está tudo certo.',
        'Lembre: o banco nunca liga pedindo senha, código ou para você fazer Pix. Se ligarem, desligue e ligue você para o número do verso do cartão.'],
      opcoes: [['desligar', '📵 Desligar']],
    },
    maria: {
      de: CONTATOS.maria.tel, nome: 'Maria (filha)',
      falas: ['Alô! Oi! Não, eu não troquei de número, estou com o mesmo celular de sempre.', 'Se alguém mandou mensagem dizendo que é eu e pedindo dinheiro, é golpe! Bloqueia e denuncia esse número.'],
      opcoes: [['desligar', '📵 Desligar']],
    },
    rosa: {
      de: CONTATOS.rosa.tel, nome: 'Tia Rosa', opcoes: [['desligar', '📵 Desligar']],
      get falas() {
        return estado && estado.cenarios.codigo
          ? ['Alô, querida! Código? Eu não mandei código nenhum! Ai meu Deus, devem ter clonado o meu Zap!', 'Ainda bem que você ligou e não passou o código. Vou avisar a família.']
          : ['Alô, querida! Que bom que ligou! Estou bem, e você?'];
      },
    },
    carlos: { de: CONTATOS.carlos.tel, nome: 'Sr. Carlos', falas: ['Alô, bom dia! Pode falar.'], opcoes: [['desligar', '📵 Desligar']] },
    golpista: { de: CONTATOS.golpista.tel, nome: '+55 11 98888-1234', falas: ['(Ninguém atende. O número da mensagem não é da sua filha.)'], opcoes: [['desligar', '📵 Desligar']] },
    falso0800: {
      de: '0800 999 1234', nome: '0800 999 1234', golpe: true,
      falas: ['Central de Segurança, boa tarde. Para cancelar a compra, me passe a senha do cartão e o código que chegou por SMS.'],
      opcoes: [['senha', '🔢 Falar a senha'], ['desligar', '📵 Desligar']],
    },
  };
  function tocar() {
    try {
      if (CE.config && (CE.config.atual.mudo || !CE.config.atual.volume)) return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.5].forEach((t) => { const o = ctx.createOscillator(), g = ctx.createGain(); g.gain.value = 0.05; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3); });
    } catch { /* sem som */ }
  }
  function ligacaoRecebida(roteiro) {
    chamada = { roteiro, fase: 'tocando', fala: 0, recebida: true, em: Date.now() };
    tocar();
    if (!CE.janelas.estaAberta('celular')) CE.janelas.abrir('celular');
    CE.emitir('celular:tocando', { roteiro, de: ROTEIROS[roteiro].de });
    avisarTelas();
  }
  function ligarPara(numero) {
    const n = so(numero);
    const roteiro = n === so(CENTRAL_OFICIAL) ? 'oficial' : n === so(CONTATOS.maria.tel) ? 'maria' : n === so(CONTATOS.rosa.tel) ? 'rosa'
      : n === so(CONTATOS.carlos.tel) ? 'carlos' : n === so(CONTATOS.golpista.tel) || n === '11988881234' ? 'golpista' : n === '08009991234' ? 'falso0800' : null;
    estado.chamadas = [...estado.chamadas, { numero, feita: true, em: Date.now() }].slice(-30);
    salvar();
    CE.emitir('celular:ligou', { numero, oficial: roteiro === 'oficial', contato: ['maria', 'rosa', 'carlos'].includes(roteiro) ? roteiro : null });
    if (estado.aviao) { CE.avisar('✈️ O modo avião está ligado: não dá para ligar.'); return; }
    chamada = roteiro ? { roteiro, fase: 'chamando', fala: 0, recebida: false, em: Date.now() } : { roteiro: null, numero, fase: 'chamando', fala: 0 };
    avisarTelas();
    depois(1600, () => {
      if (!chamada || chamada.fase !== 'chamando') return;
      if (!chamada.roteiro) { chamada = { ...chamada, fase: 'fim', texto: 'Número não atende ou não existe.' }; avisarTelas(); return; }
      atender();
    });
  }
  function atender() {
    if (!chamada) return;
    chamada.fase = 'falando'; chamada.fala = 0;
    const r = ROTEIROS[chamada.roteiro];
    if (chamada.recebida) {
      estado.chamadas = [...estado.chamadas, { numero: r.de, recebida: true, em: Date.now() }].slice(-30);
      salvar();
      CE.emitir('celular:ligacao', { roteiro: chamada.roteiro, acao: 'atendeu', golpe: !!r.golpe });
    }
    CE.voz.falar(r.falas.join(' '));
    avisarTelas();
  }
  function encerrar(acao) {
    if (!chamada) return;
    const r = chamada.roteiro ? ROTEIROS[chamada.roteiro] : null;
    if (acao === 'senha' && r && r.golpe) {
      CE.emitir('celular:golpe-caiu', { tipo: 'central-falsa' });
      CE.emitir('celular:ligacao', { roteiro: chamada.roteiro, acao: 'senha', golpe: true });
      chamada = { ...chamada, fase: 'fim', texto: '😱 Era golpe! Com a senha e o código, o golpista faz compras e Pix no seu nome. O banco NUNCA pede senha por telefone. Ligue para o número do verso do cartão e bloqueie o cartão.' };
    } else {
      CE.emitir('celular:ligacao', { roteiro: chamada.roteiro, acao: acao === 'recusar' ? 'recusou' : 'desligou', golpe: !!(r && r.golpe) });
      if (r && r.golpe) CE.emitir('celular:golpe-evitado', { tipo: 'central-falsa' });
      chamada = null;
    }
    CE.voz.parar();
    avisarTelas();
  }

  // ---------- Pix ----------
  function pixPara(chave) {
    const k = String(chave || '').trim().toLowerCase();
    return CHAVES_PIX[k] || CHAVES_PIX[so(k)] || null;
  }
  function pagar({ chave, valor, mensagem }) {
    const r = pixPara(chave);
    const v = Math.round(Number(valor) * 100) / 100;
    if (!r) throw new Error('Chave Pix não encontrada. Confira se digitou certo.');
    if (!(v > 0)) throw new Error('Escreva o valor.');
    if (v > estado.banco.saldo) throw new Error('Saldo insuficiente.');
    const h = (CE.config ? CE.config.agora() : new Date()).getHours();
    if ((h >= 20 || h < 6) && v > estado.banco.limiteNoite) throw new Error(`Das 20h às 6h, o seu limite de Pix é ${reais(estado.banco.limiteNoite)}.`);
    estado.banco.saldo = Math.round((estado.banco.saldo - v) * 100) / 100;
    const codigo = 'E' + uid().toUpperCase().slice(0, 10);
    estado.banco.extrato = [...estado.banco.extrato, { id: uid(), desc: `Pix para ${r.nome}`, valor: -v, em: Date.now(), codigo }].slice(-40);
    salvar();
    CE.emitir('celular:pix', { chave, nome: r.nome, valor: v, golpe: r.golpe || null, mensagem: mensagem || '' });
    if (r.golpe) CE.emitir('celular:golpe-caiu', { tipo: r.golpe });
    if (r.contato === 'maria') depois(1500, () => chegou('maria', { texto: `Recebi o Pix de ${reais(v)}, obrigada! ❤️` }));
    return { ...r, valor: v, codigo, em: Date.now() };
  }

  // ---------- API para as aulas ----------
  CE.celular = {
    CONTATOS, CENTRAL_OFICIAL, CHAVES_PIX,
    async carregar() { estado = null; dono = null; bloqueado = true; chamada = null; conversaAberta = null; try { await garantir(); } catch { /* sem sessão */ } },
    reiniciar() { estado = null; dono = null; bloqueado = true; chamada = null; conversaAberta = null; notificacao = null; },
    garantir,
    estado: () => (estado ? JSON.parse(JSON.stringify(estado)) : null),
    bloqueado: () => bloqueado,
    chamada: () => (chamada ? { ...chamada } : null),
    imagemDe,
    // Dispara um cenário (uma vez por aluno, a não ser que a aula peça de novo).
    async cenario(nome, { repetir = false } = {}) {
      await garantir();
      if (!CENARIOS[nome]) return;
      if (estado.cenarios[nome] && !repetir) return;
      estado.cenarios[nome] = Date.now();
      if (repetir) {
        // Para treinar de novo: quem foi bloqueado na vez anterior volta, com a conversa limpa.
        delete estado.cenarios.codigoResolvido;
        const envolvidos = { 'falso-parente': ['golpista'], promocao: ['promo'], codigo: ['rosa'] }[nome] || [];
        estado.bloqueados = estado.bloqueados.filter((id) => !envolvidos.includes(id));
        envolvidos.forEach((id) => { if (CONTATOS[id].desconhecido) estado.conversas[id] = []; });
        if (nome === 'promocao') estado.sms = estado.sms.filter((m) => m.de !== 'Correios');
      }
      CENARIOS[nome]();
      salvar();
    },
    // Abre o celular já desbloqueado numa tela (usado pelas aulas que não são sobre o desbloqueio).
    desbloquear() { bloqueado = false; avisarTelas(); },
  };

  // ---------- O programa ----------
  CE.registrarApp({
    id: 'celular', nome: 'Celular', icone: '📱', largura: 420, altura: 760,
    abrir(corpo, janela, argumento) {
      let pilha = [{ tela: 'inicio' }];
      let folha = null; // menu que sobe de baixo (ações da mensagem, escolher conversa...)
      const aparelho = CE.el('div', { class: 'cel-aparelho' });
      const telaEl = CE.el('div', { class: 'cel-tela' });
      const barraStatus = CE.el('div', { class: 'cel-status' });
      const brilho = CE.el('div', { class: 'cel-brilho' });
      const navegacao = CE.el('div', { class: 'cel-nav' },
        CE.el('button', { class: 'cel-nav-botao', 'data-acao': 'cel-voltar', title: 'Voltar', onclick: () => voltar() }, '◀'),
        CE.el('button', { class: 'cel-nav-botao', 'data-acao': 'cel-inicio', title: 'Tela inicial', onclick: () => irInicio() }, '⬤'),
        CE.el('button', { class: 'cel-nav-botao', 'data-acao': 'cel-energia', title: 'Botão de energia: bloqueia a tela', onclick: () => { bloqueado = true; folha = null; desenhar(); CE.emitir('celular:bloqueou'); } }, '⏻'));
      aparelho.append(barraStatus, telaEl, brilho, navegacao);
      corpo.classList.add('celular-app');
      corpo.append(aparelho);

      const atual = () => pilha[pilha.length - 1];
      const ir = (tela, extra = {}) => {
        pilha.push({ tela, ...extra }); folha = null; desenhar();
        if (tela === 'conversa') CE.emitir('celular:conversa', { conversa: extra.id });
        if (tela === 'foto') { const f = estado.galeria.find((x) => x.id === extra.id); CE.emitir('celular:foto-aberta', { cena: f ? f.cena : null }); }
      };
      function voltar() {
        if (folha) { folha = null; desenhar(); return; }
        // Dentro de um app com partes (Banco, Ajustes), o voltar vai para o começo do app.
        const a = atual();
        if (a.parte && a.parte !== 'inicio') { a.parte = 'inicio'; a.dados = {}; desenhar(); CE.emitir('celular:voltar', { tela: a.tela }); return; }
        if (pilha.length > 1) pilha.pop();
        desenhar();
        CE.emitir('celular:voltar', { tela: atual().tela });
      }
      function irInicio() { pilha = [{ tela: 'inicio' }]; folha = null; desenhar(); CE.emitir('celular:inicio'); }
      function abrirApp(app) { ir(app); CE.emitir('celular:app', { app }); }

      // ---------- Partes comuns ----------
      const topo = (titulo, ...acoes) => CE.el('div', { class: 'cel-app-topo' },
        CE.el('button', { class: 'cel-voltar', 'data-acao': 'cel-voltar-topo', title: 'Voltar', onclick: voltar }, '←'),
        CE.el('b', {}, titulo), ...acoes);
      const item = (icone, titulo, sub, onclick, extra = {}) => CE.el('button', { class: 'cel-item', onclick, ...extra },
        CE.el('span', { class: 'cel-item-icone' }, icone), CE.el('span', { class: 'cel-item-texto' }, CE.el('b', {}, titulo), sub ? CE.el('small', {}, sub) : ''));
      const alternar = (rotulo, ligado, campo, aoMudar) => CE.el('label', { class: 'cel-alternar' },
        CE.el('span', {}, rotulo), CE.el('input', { type: 'checkbox', checked: ligado, 'data-campo': campo, onchange: (e) => aoMudar(e.target.checked) }), CE.el('span', { class: 'cel-trilho' }));

      // ---------- Telas ----------
      const TELAS = {
        inicio() {
          const apps = [['mensagens', '💬', 'Zap'], ['telefone', '📞', 'Telefone'], ['sms', '✉️', 'SMS'], ['banco', '🏦', 'Banco'], ['camera', '📷', 'Câmera'],
            ['galeria', '🖼️', 'Galeria'], ['loja', '🛍️', 'Loja'], ['ajustes', '⚙️', 'Ajustes'],
            ...estado.apps.map((id) => { const a = LOJA.find((x) => x.id === id); return [id, a.icone, a.nome.split(' ')[0]]; })];
          const contador = (id) => (id === 'mensagens' ? totalNaoLidas() : id === 'sms' ? estado.sms.filter((m) => !m.lida).length : 0);
          return [CE.el('div', { class: 'cel-relogio-inicio' }, hora(Date.now())),
            CE.el('div', { class: 'cel-grade' }, ...apps.map(([id, icone, nome]) => CE.el('button', { class: 'cel-icone', 'data-cel-app': id,
              onclick: () => { if (LOJA.some((a) => a.id === id)) { ir('appInstalado', { app: id }); CE.emitir('celular:app', { app: id }); } else abrirApp(id); } },
              CE.el('span', { class: 'cel-icone-img' }, icone, contador(id) ? CE.el('b', { class: 'cel-bolinha' }, String(contador(id))) : ''), CE.el('small', {}, nome))))];
        },
        // ----- Mensagens -----
        mensagens() {
          const ids = Object.keys(estado.conversas).filter((id) => (estado.conversas[id] || []).length && !estado.bloqueados.includes(id))
            .sort((a, b) => ultimaEm(b) - ultimaEm(a));
          return [topo('💬 Zap'),
            CE.el('div', { class: 'cel-lista' }, ...(ids.length ? ids.map((id) => {
              const ult = estado.conversas[id][estado.conversas[id].length - 1];
              const c = CONTATOS[id];
              return CE.el('button', { class: 'cel-conversa' + (naoLidas(id) ? ' nova' : ''), 'data-conversa': id, onclick: () => ir('conversa', { id }) },
                CE.el('span', { class: 'cel-avatar' }, c.avatar),
                CE.el('span', { class: 'cel-item-texto' }, CE.el('b', {}, c.nome), CE.el('small', {}, `${ult.de === 'eu' ? 'Você: ' : ult.autor ? ult.autor + ': ' : ''}${ult.texto || (ult.foto ? '📷 Foto' : ult.audio ? '🎤 Áudio' : '')}`.slice(0, 48))),
                CE.el('span', { class: 'cel-hora' }, hora(ult.em), naoLidas(id) ? CE.el('b', { class: 'cel-bolinha' }, String(naoLidas(id))) : ''));
            }) : [CE.el('p', { class: 'cel-vazio' }, 'Nenhuma conversa ainda.')]))];
        },
        conversa({ id }) {
          const c = CONTATOS[id];
          conversaAberta = id;
          const msgs = estado.conversas[id] || [];
          const ultimaMsg = msgs.length ? msgs[msgs.length - 1].em : 0;
          if (ultimaMsg && estado.lidas[id] !== ultimaMsg) { estado.lidas[id] = ultimaMsg; salvar(); }
          const campo = CE.el('input', { class: 'cel-campo', 'data-campo': 'cel-mensagem', placeholder: 'Mensagem', autocomplete: 'off' });
          const enviar = () => {
            const texto = campo.value.trim();
            if (!texto) return;
            mandar(id, { texto });
            campo.value = '';
          };
          campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); enviar(); } });
          const bloqueadoAqui = estado.bloqueados.includes(id);
          const lista = CE.el('div', { class: 'cel-mensagens' }, ...msgs.map((m) => CE.el('div', { class: 'cel-balao' + (m.de === 'eu' ? ' meu' : '') + (m.golpe ? ' suspeito' : ''), 'data-msg': m.id, 'data-msg-texto': (m.texto || '').slice(0, 40), onclick: () => { folha = { tipo: 'mensagem', id, msg: m.id }; desenhar(); } },
            m.autor ? CE.el('small', { class: 'cel-autor' }, m.autor) : '',
            m.foto ? CE.el('img', { class: 'cel-foto-msg', src: imagemDe(m.foto), alt: 'Foto' }) : '',
            m.audio ? CE.el('span', { class: 'cel-audio' }, '▶ 🎤 ━━━━━ 0:0' + m.audio) : '',
            m.texto ? CE.el('span', {}, m.texto) : '',
            m.link ? CE.el('a', { class: 'cel-link', 'data-cel-link': m.link, onclick: (e) => { e.stopPropagation(); abrirLink(m.link, m.golpe); } }, m.link) : '',
            m.encaminhada ? CE.el('small', { class: 'cel-encaminhada' }, '➡️ Encaminhada') : '',
            CE.el('small', { class: 'cel-hora-msg' }, hora(m.em) + (m.de === 'eu' ? ' ✓✓' : '')))));
          setTimeout(() => { lista.scrollTop = lista.scrollHeight; }, 0);
          return [topo(`${c.avatar} ${c.nome}`, CE.el('button', { class: 'cel-topo-acao', 'data-acao': 'cel-menu-conversa', title: 'Mais opções', onclick: () => { folha = { tipo: 'conversa', id }; desenhar(); } }, '⋮')),
            c.desconhecido && !bloqueadoAqui ? CE.el('div', { class: 'cel-alerta-desconhecido' }, '⚠️ Este número não está nos seus contatos.',
              CE.el('div', {}, CE.el('button', { class: 'botao pequeno secundario', 'data-acao': 'cel-bloquear', onclick: () => bloquear(id, true) }, '🚫 Bloquear e denunciar'))) : '',
            lista,
            bloqueadoAqui ? CE.el('p', { class: 'cel-vazio' }, '🚫 Você bloqueou este contato.') : CE.el('div', { class: 'cel-escrever' },
              CE.el('button', { class: 'cel-botao-redondo', 'data-acao': 'cel-anexar', title: 'Mandar foto', onclick: () => { folha = { tipo: 'anexar', id }; desenhar(); } }, '📎'),
              campo,
              CE.el('button', { class: 'cel-botao-redondo', 'data-acao': 'cel-audio', title: 'Gravar áudio', onclick: () => mandar(id, { audio: 3 + Math.floor(Math.random() * 6) }) }, '🎤'),
              CE.el('button', { class: 'cel-botao-redondo verde', 'data-acao': 'cel-enviar', title: 'Enviar', onclick: enviar }, '➤'))];
        },
        // ----- Telefone -----
        telefone({ aba = 'teclado', numero = '' }) {
          const visor = CE.el('div', { class: 'cel-visor', 'data-visor': '' }, numero || ' ');
          const teclar = (d) => { atual().numero = (atual().numero || '') + d; visor.textContent = atual().numero; };
          const abas = CE.el('div', { class: 'cel-abas' }, ...[['teclado', '⌨️ Teclado'], ['recentes', '🕘 Recentes'], ['contatos', '👥 Contatos']].map(([a, r]) => CE.el('button', {
            class: 'cel-aba' + (a === aba ? ' ativa' : ''), 'data-aba-tel': a, onclick: () => { atual().aba = a; desenhar(); } }, r)));
          if (aba === 'contatos') {
            return [topo('📞 Telefone'), abas, CE.el('div', { class: 'cel-lista' }, ...AGENDA_TEL.map((id) => item(CONTATOS[id].avatar, CONTATOS[id].nome, CONTATOS[id].tel, () => ligarPara(CONTATOS[id].tel), { 'data-contato-tel': id })),
              item('🏦', 'Banco Escola (central)', `${CENTRAL_OFICIAL} — o número do verso do cartão`, () => ligarPara(CENTRAL_OFICIAL), { 'data-contato-tel': 'banco' }))];
          }
          if (aba === 'recentes') {
            return [topo('📞 Telefone'), abas, CE.el('div', { class: 'cel-lista' }, ...(estado.chamadas.length ? estado.chamadas.slice().reverse().map((ch) => item(ch.recebida ? '↙️' : '↗️', ch.numero, `${ch.recebida ? 'Recebida' : 'Feita'} · ${hora(ch.em)}`, () => ligarPara(ch.numero)))
              : [CE.el('p', { class: 'cel-vazio' }, 'Nenhuma ligação ainda.')]))];
          }
          return [topo('📞 Telefone'), abas, visor,
            CE.el('div', { class: 'cel-teclado' }, ...'123456789*0#'.split('').map((d) => CE.el('button', { class: 'cel-tecla', 'data-discar': d, onclick: () => teclar(d) }, d))),
            CE.el('div', { class: 'cel-teclado-acoes' },
              CE.el('button', { class: 'cel-botao-redondo grande', 'data-acao': 'cel-apagar-digito', title: 'Apagar', onclick: () => { atual().numero = (atual().numero || '').slice(0, -1); visor.textContent = atual().numero || ' '; } }, '⌫'),
              CE.el('button', { class: 'cel-botao-redondo grande verde', 'data-acao': 'cel-ligar', title: 'Ligar', onclick: () => { if (atual().numero) ligarPara(atual().numero); } }, '📞'))];
        },
        // ----- SMS -----
        sms() {
          estado.sms.forEach((m) => { m.lida = true; });
          return [topo('✉️ SMS'), CE.el('div', { class: 'cel-lista' }, ...(estado.sms.length ? estado.sms.slice().reverse().map((m) => CE.el('div', { class: 'cel-sms' + (m.golpe ? ' suspeito' : ''), 'data-sms-de': m.de },
            CE.el('b', {}, m.de), CE.el('small', {}, hora(m.em)), CE.el('p', {}, m.texto),
            m.link ? CE.el('a', { class: 'cel-link', 'data-cel-link': m.link, onclick: () => abrirLink(m.link, m.golpe) }, m.link) : '',
            m.golpe ? CE.el('button', { class: 'botao pequeno secundario', 'data-acao': 'cel-apagar-sms', onclick: () => {
              estado.sms = estado.sms.filter((x) => x !== m); salvar();
              CE.emitir('celular:sms-apagado', { de: m.de, golpe: m.golpe }); CE.emitir('celular:golpe-evitado', { tipo: m.golpe }); desenhar();
            } }, '🗑️ Apagar (golpe)') : ''))
            : [CE.el('p', { class: 'cel-vazio' }, 'Nenhuma mensagem SMS.')]))];
        },
        // ----- Navegador do celular (só para os links das mensagens) -----
        navegador({ url, golpe }) {
          const campos = CE.el('div', { class: 'cel-site-form' },
            CE.el('input', { class: 'cel-campo', placeholder: 'CPF', 'data-campo': 'site-cpf' }),
            CE.el('input', { class: 'cel-campo', placeholder: 'Número do cartão', 'data-campo': 'site-cartao' }),
            CE.el('input', { class: 'cel-campo', placeholder: 'Senha', type: 'password', 'data-campo': 'site-senha' }));
          return [topo('🌐 ' + url),
            CE.el('div', { class: 'cel-site' + (golpe ? ' falso' : '') },
              CE.el('div', { class: 'cel-site-endereco' }, '⚠️ Não seguro · ' + url),
              CE.el('h3', {}, /correios/.test(url) ? '📦 Encomenda retida' : '🎁 Resgate o seu prêmio!'),
              CE.el('p', {}, /correios/.test(url) ? 'Para liberar a entrega, informe os dados do cartão para pagar a taxa de R$ 9,90.' : 'Para receber a Air Fryer, confirme os seus dados e pague só o frete de R$ 19,90.'),
              campos,
              CE.el('button', { class: 'botao', 'data-acao': 'site-enviar', onclick: () => {
                const preencheu = [...campos.querySelectorAll('input')].some((i) => i.value.trim());
                if (!preencheu) { CE.avisar('Preencha os campos (ou melhor: feche esta página!).'); return; }
                CE.emitir('celular:golpe-caiu', { tipo: 'link', url });
                CE.avisar('😱 Era um site FALSO! Os dados foram para golpistas. Bloqueie o cartão pelo app do banco agora e troque as senhas.');
                voltar();
              } }, 'Confirmar'),
              CE.el('p', { class: 'cel-dica-golpe' }, '💡 Dica: endereço estranho, pressa ("só até meia-noite") e pedido de dados do cartão = golpe. Clique em ← para sair sem digitar nada.'))];
        },
        // ----- Banco -----
        banco({ parte = 'inicio', dados = {} }) {
          const b = estado.banco;
          if (!b.senha) {
            const s1 = CE.el('input', { class: 'cel-campo', type: 'password', inputmode: 'numeric', maxlength: '4', 'data-campo': 'banco-senha-nova', placeholder: '4 números' });
            const s2 = CE.el('input', { class: 'cel-campo', type: 'password', inputmode: 'numeric', maxlength: '4', 'data-campo': 'banco-senha-repetir', placeholder: 'Repita os 4 números' });
            const erro = CE.el('p', { class: 'cel-erro' });
            return [topo('🏦 Banco Escola'), CE.el('div', { class: 'cel-banco-caixa' },
              CE.el('h3', {}, 'Crie a senha do aplicativo'),
              CE.el('p', {}, 'Escolha 4 números que só você saiba. Nada de 1234, 0000 ou a data do seu aniversário!'), s1, s2, erro,
              CE.el('button', { class: 'botao', 'data-acao': 'banco-criar-senha', onclick: () => {
                const v = so(s1.value);
                if (v.length !== 4) { erro.textContent = 'A senha precisa ter 4 números.'; return; }
                if (/^(\d)\1{3}$/.test(v) || '0123456789'.includes(v) || '9876543210'.includes(v)) { erro.textContent = 'Senha fácil demais (números repetidos ou em sequência). Escolha outra.'; return; }
                if (v !== so(s2.value)) { erro.textContent = 'As duas senhas não estão iguais.'; return; }
                b.senha = v; salvar(); entrouNoBanco = true;
                CE.emitir('celular:banco-senha', { criada: true });
                desenhar();
              } }, 'Criar senha'))];
          }
          if (!entrouNoBanco) {
            const s = CE.el('input', { class: 'cel-campo', type: 'password', inputmode: 'numeric', maxlength: '4', 'data-campo': 'banco-senha', placeholder: 'Senha do app' });
            const erro = CE.el('p', { class: 'cel-erro' });
            const entrar = () => {
              if (so(s.value) !== b.senha) { erro.textContent = 'Senha errada.'; CE.emitir('celular:banco-entrou', { ok: false }); return; }
              entrouNoBanco = true; CE.emitir('celular:banco-entrou', { ok: true }); desenhar();
            };
            s.addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
            return [topo('🏦 Banco Escola'), CE.el('div', { class: 'cel-banco-caixa' }, CE.el('h3', {}, '🔒 Digite a sua senha'), s, erro,
              CE.el('button', { class: 'botao', 'data-acao': 'banco-entrar', onclick: entrar }, 'Entrar'))];
          }
          const voltarBanco = () => { atual().parte = 'inicio'; atual().dados = {}; desenhar(); };
          if (parte === 'pix') return [topo('🏦 Pix'), ...telaPix(dados, voltarBanco)];
          if (parte === 'qr') {
            return [topo('🏦 Pagar com QR Code'), CE.el('p', { class: 'cel-dica' }, '📷 Aponte a câmera para o QR Code (clique no QR Code que você quer ler):'),
              CE.el('div', { class: 'cel-lista' }, ...QR_CODES.map((q) => CE.el('button', { class: 'cel-qr', 'data-qr': q.id, onclick: () => {
                CE.emitir('celular:qr-lido', { qr: q.id, valor: q.valor });
                atual().parte = 'pix'; atual().dados = { chave: q.chave, valor: q.valor, passo: 'conferir', qr: q.id }; desenhar();
              } }, CE.el('span', { class: 'cel-qr-codigo' }, '▚▞▚\n▞▚▞\n▚▞▚'), CE.el('span', { class: 'cel-item-texto' }, CE.el('b', {}, `${q.icone} ${q.titulo}`), CE.el('small', {}, `${q.texto} Valor: ${reais(q.valor)}`)))))];
          }
          if (parte === 'extrato') {
            return [topo('🏦 Extrato'), CE.el('div', { class: 'cel-lista' }, ...b.extrato.slice().reverse().map((e) => CE.el('div', { class: 'cel-extrato', 'data-extrato': e.desc },
              CE.el('span', {}, e.desc, CE.el('small', {}, new Date(e.em).toLocaleDateString('pt-BR'))), CE.el('b', { class: e.valor < 0 ? 'saida' : 'entrada' }, reais(e.valor)))))];
          }
          if (parte === 'cartao') {
            return [topo('🏦 Cartão'), CE.el('div', { class: 'cel-cartao' + (b.cartaoBloqueado ? ' bloqueado' : '') },
              CE.el('b', {}, 'BANCO ESCOLA'), CE.el('span', {}, '•••• •••• •••• 4521'), CE.el('small', {}, b.cartaoBloqueado ? '🔒 BLOQUEADO' : 'Cartão de treino')),
            alternar('🔒 Bloquear o cartão (perdeu, foi roubado ou caiu em golpe)', b.cartaoBloqueado, 'cartao-bloqueado', (v) => { b.cartaoBloqueado = v; salvar(); CE.emitir('celular:cartao', { bloqueado: v }); desenhar(); }),
            CE.el('div', { class: 'cel-verso', 'data-verso-cartao': '' }, '📞 Central de atendimento (está no verso do cartão): ', CE.el('b', {}, CENTRAL_OFICIAL)),
            CE.el('p', { class: 'cel-dica' }, 'Só ligue para o número que está no VERSO do cartão ou no app. Número que chega por SMS pode ser de golpista.')];
          }
          if (parte === 'limites') {
            return [topo('🏦 Limites do Pix'), CE.el('p', { class: 'cel-dica' }, 'De noite (das 20h às 6h) acontecem muitos golpes e sequestros-relâmpago. Deixe um limite BAIXO para a noite.'),
              CE.el('div', { class: 'cel-lista' }, ...[200, 500, 1000].map((v) => CE.el('button', { class: 'cel-item' + (b.limiteNoite === v ? ' escolhido' : ''), 'data-limite': String(v), onclick: () => {
                b.limiteNoite = v; salvar(); CE.emitir('celular:limite', { valor: v }); CE.avisar(`Limite do Pix à noite: ${reais(v)}.`); desenhar();
              } }, CE.el('span', { class: 'cel-item-icone' }, b.limiteNoite === v ? '🔘' : '⚪'), CE.el('span', { class: 'cel-item-texto' }, CE.el('b', {}, `Até ${reais(v)} à noite`)))))];
          }
          return [topo('🏦 Banco Escola', CE.el('button', { class: 'cel-topo-acao', 'data-acao': 'banco-sair', title: 'Sair do app do banco', onclick: () => { entrouNoBanco = false; desenhar(); } }, 'Sair')),
            CE.el('div', { class: 'cel-saldo', 'data-saldo': String(b.saldo) }, CE.el('small', {}, 'Saldo disponível'), CE.el('b', {}, reais(b.saldo))),
            CE.el('div', { class: 'cel-banco-botoes' }, ...[['pix', '💠', 'Pix'], ['qr', '▚', 'Pagar QR Code'], ['extrato', '📄', 'Extrato'], ['cartao', '💳', 'Cartão'], ['limites', '🛡️', 'Limites']]
              .map(([p, i, r]) => CE.el('button', { class: 'cel-banco-botao', 'data-banco': p, onclick: () => { atual().parte = p; atual().dados = {}; desenhar(); CE.emitir('celular:banco', { parte: p }); } }, CE.el('span', {}, i), CE.el('small', {}, r))))];
        },
        // ----- Câmera e galeria -----
        camera({ cena = 'bolo' }) {
          const i = ORDEM_CENAS.indexOf(cena);
          const trocar = (d) => { atual().cena = ORDEM_CENAS[(i + d + ORDEM_CENAS.length) % ORDEM_CENAS.length]; desenhar(); };
          return [topo('📷 Câmera'), CE.el('div', { class: 'cel-visor-camera', 'data-cena-atual': cena }, CE.el('img', { src: imagemDe({ cena }), alt: CENAS[cena].nome }), CE.el('span', { class: 'cel-cena-nome' }, CENAS[cena].nome)),
            CE.el('div', { class: 'cel-camera-botoes' },
              CE.el('button', { class: 'cel-botao-redondo', 'data-acao': 'cena-anterior', title: 'Apontar para outra coisa', onclick: () => trocar(-1) }, '◀'),
              CE.el('button', { class: 'cel-disparador', 'data-acao': 'cel-fotografar', title: 'Tirar foto', onclick: () => {
                const f = { id: uid(), cena, em: Date.now() };
                estado.galeria = [...estado.galeria, f].slice(-30); salvar();
                CE.emitir('celular:foto', { cena });
                CE.avisar('📸 Foto tirada! Ela está na Galeria.');
              } }, ''),
              CE.el('button', { class: 'cel-botao-redondo', 'data-acao': 'cena-seguinte', title: 'Apontar para outra coisa', onclick: () => trocar(1) }, '▶')),
            CE.el('p', { class: 'cel-dica' }, 'Use ◀ ▶ para apontar a câmera para outra coisa. O botão redondo tira a foto.')];
        },
        galeria() {
          return [topo('🖼️ Galeria'), CE.el('div', { class: 'cel-galeria' }, ...estado.galeria.slice().reverse().map((f) => CE.el('button', { class: 'cel-miniatura', 'data-foto': f.cena, 'data-foto-id': f.id, onclick: () => ir('foto', { id: f.id }) },
            CE.el('img', { src: imagemDe(f), alt: f.cena === 'comprovante' ? 'Comprovante' : (CENAS[f.cena] || {}).nome || 'Foto' }))))];
        },
        foto({ id }) {
          const f = estado.galeria.find((x) => x.id === id);
          if (!f) { setTimeout(voltar, 0); return []; }
          return [topo('🖼️ Foto'), CE.el('img', { class: 'cel-foto-grande', src: imagemDe(f), alt: 'Foto' }),
            CE.el('div', { class: 'cel-foto-acoes' },
              CE.el('button', { class: 'botao', 'data-acao': 'foto-compartilhar', onclick: () => { folha = { tipo: 'compartilhar', foto: f.id }; desenhar(); } }, '➤ Compartilhar'),
              CE.el('button', { class: 'botao secundario', 'data-acao': 'foto-computador', title: 'Mandar a foto para Meus Documentos (como se ligasse o cabo USB)', onclick: () => fotoParaComputador(f) }, '💻 Para o computador'),
              CE.el('button', { class: 'botao secundario', 'data-acao': 'foto-apagar', onclick: async () => {
                if (!await CE.confirmar('Apagar esta foto?')) return;
                estado.galeria = estado.galeria.filter((x) => x !== f); salvar(); CE.emitir('celular:foto-apagada', { cena: f.cena }); voltar();
              } }, '🗑️'))];
        },
        // ----- Loja de apps -----
        loja() {
          return [topo('🛍️ Loja de apps'), CE.el('p', { class: 'cel-dica' }, 'Antes de instalar, veja quem fez o app, a nota, quantas pessoas baixaram e o que ele quer acessar.'),
            CE.el('div', { class: 'cel-lista' }, ...LOJA.map((a) => CE.el('div', { class: 'cel-loja-app', 'data-loja-app': a.id },
              CE.el('span', { class: 'cel-avatar' }, a.icone),
              CE.el('span', { class: 'cel-item-texto' }, CE.el('b', {}, a.nome), CE.el('small', {}, `${a.dev} · ⭐ ${String(a.nota).replace('.', ',')} · ${a.baixados} downloads`), CE.el('small', {}, a.descricao)),
              estado.apps.includes(a.id)
                ? CE.el('button', { class: 'botao pequeno secundario', 'data-acao': 'desinstalar', onclick: () => {
                  estado.apps = estado.apps.filter((x) => x !== a.id); delete estado.permissoes[a.id]; salvar(); CE.emitir('celular:desinstalado', { app: a.id }); desenhar();
                } }, 'Desinstalar')
                : CE.el('button', { class: 'botao pequeno', 'data-acao': 'instalar', onclick: () => { folha = { tipo: 'instalar', app: a.id }; desenhar(); CE.emitir('celular:instalar-pedido', { app: a.id, suspeito: !!a.suspeito }); } }, 'Instalar'))))];
        },
        appInstalado({ app }) {
          const a = LOJA.find((x) => x.id === app);
          const pedidos = (PEDIDOS[app] || []).filter((p) => estado.permissoes[app] == null || estado.permissoes[app][p] == null);
          if (pedidos.length && !folha) setTimeout(() => { if (atual().tela === 'appInstalado' && !folha) { folha = { tipo: 'permissao', app, permissao: pedidos[0] }; desenhar(); } }, 0);
          const conteudo = app === 'lanterna' || app === 'lanterna-super' ? CE.el('button', { class: 'cel-lanterna' + (lanternaLigada ? ' ligada' : ''), 'data-acao': 'lanterna', onclick: () => { lanternaLigada = !lanternaLigada; CE.emitir('celular:lanterna', { ligada: lanternaLigada }); desenhar(); } }, lanternaLigada ? '🔦 Desligar' : '🔦 Ligar')
            : app === 'jogo' ? CE.el('div', { class: 'cel-jogo' }, '🐔🌽🐄', CE.el('p', {}, 'Sua fazenda está crescendo!'), CE.el('small', {}, 'Propaganda: BAIXE O LANTERNA SUPER TURBO!!!'))
              : app === 'mapas' ? CE.el('div', { class: 'cel-mapa' }, '🗺️', CE.el('p', {}, estado.permissoes.mapas && estado.permissoes.mapas['localização'] ? '📍 Você está aqui: Centro, Porto Velho.' : 'Sem acesso à localização: digite o endereço.'))
                : CE.el('div', { class: 'cel-carteira' }, '🪪', CE.el('p', {}, 'Documento digital de treino.'));
          return [topo(`${a.icone} ${a.nome}`), conteudo];
        },
        // ----- Ajustes -----
        ajustes({ parte = 'inicio' }) {
          const ir2 = (p) => { atual().parte = p; desenhar(); CE.emitir('celular:ajuste', { parte: p }); };
          if (parte === 'rede') {
            return [topo('⚙️ Wi‑Fi e rede'),
              alternar('✈️ Modo avião', estado.aviao, 'cel-aviao', (v) => { estado.aviao = v; salvar(); CE.emitir('celular:aviao', { ligado: v }); desenhar(); }),
              alternar('📶 Wi‑Fi', estado.wifi && !estado.aviao, 'cel-wifi', (v) => { estado.wifi = v; if (v) estado.aviao = false; salvar(); CE.emitir('celular:wifi', { ligado: v }); desenhar(); }),
              CE.el('p', { class: 'cel-dica' }, estado.wifi && !estado.aviao ? '✅ Conectado a "Casa_Silva" 🔒' : 'Sem Wi‑Fi: o celular usa os dados móveis (o pacote de internet do chip).')];
          }
          if (parte === 'tela') {
            return [topo('⚙️ Tela e letra'),
              CE.el('label', { class: 'cel-alternar' }, CE.el('span', {}, '☀️ Brilho'), CE.el('input', { type: 'range', min: '20', max: '100', value: estado.brilho, 'data-campo': 'cel-brilho', onchange: (e) => { estado.brilho = Number(e.target.value); salvar(); CE.emitir('celular:brilho', { valor: estado.brilho }); desenhar(); } })),
              CE.el('p', {}, 'Tamanho da letra:'),
              CE.el('div', { class: 'cel-letras' }, ...[['pequena', 'A'], ['media', 'A'], ['grande', 'A']].map(([t, r], i) => CE.el('button', { class: 'cel-letra-opcao' + (estado.letra === t ? ' escolhida' : ''), 'data-letra': t, style: `font-size:${14 + i * 6}px`,
                onclick: () => { estado.letra = t; salvar(); CE.emitir('celular:letra', { tamanho: t }); desenhar(); } }, r)))];
          }
          if (parte === 'seguranca') {
            const p1 = CE.el('input', { class: 'cel-campo', type: 'password', inputmode: 'numeric', maxlength: '6', 'data-campo': 'pin-novo', placeholder: 'PIN de 4 a 6 números' });
            const erro = CE.el('p', { class: 'cel-erro' });
            return [topo('⚙️ Bloqueio de tela'),
              CE.el('p', {}, estado.pin ? '🔒 O celular está protegido com PIN.' : '⚠️ O celular está SEM bloqueio: quem pegar o seu celular entra em tudo.'),
              p1, erro,
              CE.el('button', { class: 'botao', 'data-acao': 'salvar-pin', onclick: () => {
                const v = so(p1.value);
                if (v.length < 4) { erro.textContent = 'O PIN precisa ter de 4 a 6 números.'; return; }
                if (/^(\d)\1+$/.test(v) || '0123456789'.includes(v)) { erro.textContent = 'PIN fácil demais. Escolha outro.'; return; }
                estado.pin = v; salvar(); CE.emitir('celular:pin', { definido: true, digitos: v.length }); CE.avisar('🔒 PIN salvo! Agora o celular pede o PIN para desbloquear.'); desenhar();
              } }, estado.pin ? 'Trocar o PIN' : 'Criar PIN'),
              estado.pin ? CE.el('button', { class: 'botao secundario', 'data-acao': 'bloquear-agora', onclick: () => { bloqueado = true; folha = null; desenhar(); CE.emitir('celular:bloqueou'); } }, '⏻ Bloquear agora para testar') : ''];
          }
          if (parte === 'zap') {
            const p1 = CE.el('input', { class: 'cel-campo', type: 'password', inputmode: 'numeric', maxlength: '6', 'data-campo': 'pin-zap', placeholder: 'PIN de 6 números' });
            const erro = CE.el('p', { class: 'cel-erro' });
            return [topo('⚙️ Zap: duas etapas'),
              CE.el('p', {}, estado.duasEtapas ? '✅ Verificação em duas etapas LIGADA. Mesmo que alguém pegue o código do SMS, não entra no seu Zap sem este PIN.' : 'Com a verificação em duas etapas, o Zap pede um PIN de 6 números que só você sabe. É a melhor proteção contra o golpe do código.'),
              estado.duasEtapas ? '' : p1, erro,
              estado.duasEtapas ? '' : CE.el('button', { class: 'botao', 'data-acao': 'ativar-duas-etapas', onclick: () => {
                const v = so(p1.value);
                if (v.length !== 6) { erro.textContent = 'O PIN do Zap tem 6 números.'; return; }
                estado.duasEtapas = true; salvar(); CE.emitir('celular:duas-etapas', { ativada: true }); desenhar();
              } }, 'Ativar')];
          }
          if (parte === 'permissoes') {
            const instalados = estado.apps.map((id) => LOJA.find((a) => a.id === id));
            return [topo('⚙️ Permissões dos apps'), CE.el('p', { class: 'cel-dica' }, 'Veja o que cada app pode acessar. Na dúvida, desligue: o app pede de novo quando precisar.'),
              ...(instalados.length ? instalados.flatMap((a) => {
                const perms = Object.entries(estado.permissoes[a.id] || {});
                return [CE.el('h4', { class: 'cel-sub' }, `${a.icone} ${a.nome}`), ...(perms.length ? perms.map(([perm, v]) => alternar(perm, v, `perm-${a.id}-${perm}`, (novo) => {
                  estado.permissoes[a.id][perm] = novo; salvar(); CE.emitir('celular:permissao', { app: a.id, permissao: perm, permitido: novo, pelosAjustes: true }); desenhar();
                })) : [CE.el('small', { class: 'cel-dica' }, 'Nenhuma permissão dada.')])];
              }) : [CE.el('p', { class: 'cel-vazio' }, 'Nenhum app instalado pela loja.')])];
          }
          if (parte === 'atualizacao') {
            return [topo('⚙️ Atualização do sistema'), CE.el('div', { class: 'cel-banco-caixa' },
              estado.atualizado ? CE.el('p', {}, '✅ O celular está atualizado (versão 14, com as correções de segurança de novembro).')
                : atualizando != null ? CE.el('div', {}, CE.el('p', {}, `Instalando… ${atualizando}%`), CE.el('div', { class: 'cfg-progresso' }, CE.el('div', { style: `width:${atualizando}%` })))
                  : CE.el('div', {}, CE.el('p', {}, '🔄 Atualização disponível: versão 14 (correções de segurança). Use o Wi‑Fi e deixe a bateria acima de 50%.'),
                    CE.el('button', { class: 'botao', 'data-acao': 'atualizar-celular', onclick: () => {
                      atualizando = 0;
                      const passo = () => { atualizando += 25; if (atualizando >= 100) { atualizando = null; estado.atualizado = true; salvar(); CE.emitir('celular:atualizado'); } else setTimeout(passo, 250); desenhar(); };
                      passo();
                    } }, 'Baixar e instalar')))];
          }
          return [topo('⚙️ Ajustes'), CE.el('div', { class: 'cel-lista' },
            item('📶', 'Wi‑Fi e rede', estado.aviao ? 'Modo avião ligado' : estado.wifi ? 'Conectado' : 'Desligado', () => ir2('rede'), { 'data-ajuste': 'rede' }),
            item('🔤', 'Tela e letra', `Letra ${estado.letra === 'grande' ? 'grande' : estado.letra === 'pequena' ? 'pequena' : 'média'}`, () => ir2('tela'), { 'data-ajuste': 'tela' }),
            item('🔒', 'Bloqueio de tela', estado.pin ? 'PIN ligado' : 'Sem bloqueio ⚠️', () => ir2('seguranca'), { 'data-ajuste': 'seguranca' }),
            item('💬', 'Zap: verificação em duas etapas', estado.duasEtapas ? 'Ligada' : 'Desligada ⚠️', () => ir2('zap'), { 'data-ajuste': 'zap' }),
            item('🛡️', 'Permissões dos apps', `${estado.apps.length} app(s) instalado(s)`, () => ir2('permissoes'), { 'data-ajuste': 'permissoes' }),
            item('🔄', 'Atualização do sistema', estado.atualizado ? 'Atualizado' : 'Atualização disponível', () => ir2('atualizacao'), { 'data-ajuste': 'atualizacao' }))];
        },
      };
      let entrouNoBanco = false, lanternaLigada = false, atualizando = null;
      const ultimaEm = (id) => { const l = estado.conversas[id] || []; return l.length ? l[l.length - 1].em : 0; };

      function telaPix(dados, voltarBanco) {
        const b = estado.banco;
        if (dados.passo === 'comprovante') {
          const c = dados.comprovante;
          return [CE.el('div', { class: 'cel-comprovante', 'data-comprovante': '' }, CE.el('h3', {}, '✅ Pix enviado!'), CE.el('p', {}, `${reais(c.valor)} para ${c.nome}`), CE.el('small', {}, `${c.banco} · ${new Date(c.em).toLocaleString('pt-BR')} · ${c.codigo}`)),
            CE.el('button', { class: 'botao', 'data-acao': 'salvar-comprovante', onclick: () => {
              estado.galeria = [...estado.galeria, { id: uid(), cena: 'comprovante', em: Date.now(), dados: { valor: c.valor, nome: c.nome, banco: c.banco, em: c.em, codigo: c.codigo } }].slice(-30);
              salvar(); CE.emitir('celular:comprovante', { valor: c.valor, nome: c.nome }); CE.avisar('🧾 Comprovante salvo na Galeria.');
            } }, '🧾 Salvar o comprovante na galeria'),
            CE.el('button', { class: 'botao secundario', 'data-acao': 'pix-fim', onclick: voltarBanco }, 'Voltar ao início')];
        }
        if (dados.passo === 'conferir') {
          const r = pixPara(dados.chave);
          const senha = CE.el('input', { class: 'cel-campo', type: 'password', inputmode: 'numeric', maxlength: '4', 'data-campo': 'pix-senha', placeholder: 'Senha do app' });
          const erro = CE.el('p', { class: 'cel-erro' });
          return [CE.el('div', { class: 'cel-banco-caixa', 'data-pix-conferir': r.nome },
            CE.el('h3', {}, 'Confira antes de pagar'),
            CE.el('p', {}, 'Valor: ', CE.el('b', { 'data-pix-valor': '' }, reais(dados.valor))),
            CE.el('p', { class: 'cel-pix-nome' }, 'Para: ', CE.el('b', { 'data-pix-nome': '' }, r.nome)),
            CE.el('p', {}, `Banco: ${r.banco}`),
            CE.el('p', { class: 'cel-dica' }, '👀 O nome é de quem você conhece? Se o nome for de outra pessoa, CANCELE.'),
            senha, erro,
            CE.el('div', { class: 'cel-botoes-lado' },
              CE.el('button', { class: 'botao secundario', 'data-acao': 'pix-cancelar', onclick: () => {
                CE.emitir('celular:pix-cancelado', { chave: dados.chave, nome: r.nome, golpe: r.golpe || null });
                if (r.golpe) CE.emitir('celular:golpe-evitado', { tipo: r.golpe, pix: true });
                CE.avisar(r.golpe ? '👏 Muito bem! O nome não era o da sua filha: era golpe. Agora bloqueie e denuncie o número.' : 'Pix cancelado.');
                voltarBanco();
              } }, 'Cancelar'),
              CE.el('button', { class: 'botao', 'data-acao': 'pix-confirmar', onclick: () => {
                if (so(senha.value) !== b.senha) { erro.textContent = 'Senha errada.'; return; }
                try { const c = pagar({ chave: dados.chave, valor: dados.valor, mensagem: dados.mensagem }); atual().dados = { passo: 'comprovante', comprovante: c }; desenhar(); } catch (e) { erro.textContent = e.message; }
              } }, 'Pagar')))];
        }
        const chave = CE.el('input', { class: 'cel-campo', 'data-campo': 'pix-chave', placeholder: 'Celular, CPF, e-mail ou chave aleatória', value: dados.chave || '' });
        const valor = CE.el('input', { class: 'cel-campo', 'data-campo': 'pix-valor', inputmode: 'decimal', placeholder: 'Valor (ex.: 50,00)', value: dados.valor ? String(dados.valor).replace('.', ',') : '' });
        const erro = CE.el('p', { class: 'cel-erro' });
        return [CE.el('div', { class: 'cel-banco-caixa' },
          CE.el('h3', {}, '💠 Fazer um Pix'), CE.el('label', {}, 'Chave Pix', chave), CE.el('label', {}, 'Valor', valor), erro,
          CE.el('p', { class: 'cel-dica' }, `Saldo: ${reais(b.saldo)}`),
          CE.el('button', { class: 'botao', 'data-acao': 'pix-continuar', onclick: () => {
            const v = Number(String(valor.value).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
            if (!pixPara(chave.value)) { erro.textContent = 'Chave Pix não encontrada. Confira se digitou certo.'; return; }
            if (!(v > 0)) { erro.textContent = 'Escreva o valor.'; return; }
            CE.emitir('celular:pix-chave', { chave: chave.value, nome: pixPara(chave.value).nome });
            atual().dados = { chave: chave.value, valor: v, passo: 'conferir' }; desenhar();
          } }, 'Continuar'))];
      }

      // ---------- Ações ----------
      function mandar(id, dados) {
        const m = { id: uid(), de: 'eu', em: Date.now(), ...dados };
        conversa(id).push(m);
        estado.conversas[id] = estado.conversas[id].slice(-80);
        estado.lidas[id] = m.em;
        salvar();
        CE.emitir('celular:mensagem-enviada', { conversa: id, texto: dados.texto || '', foto: dados.foto ? dados.foto.cena : null, audio: !!dados.audio, encaminhada: !!dados.encaminhada, boato: !!dados.boato });
        responder(id, m);
        desenhar();
      }
      function bloquear(id, denunciar) {
        if (!estado.bloqueados.includes(id)) estado.bloqueados.push(id);
        if (denunciar && !estado.denunciados.includes(id)) estado.denunciados.push(id);
        salvar();
        const golpe = (estado.conversas[id] || []).find((m) => m.golpe);
        CE.emitir('celular:bloqueado', { conversa: id, denunciado: !!denunciar, golpe: golpe ? golpe.golpe : null });
        if (golpe) CE.emitir('celular:golpe-evitado', { tipo: golpe.golpe, bloqueou: true });
        CE.avisar(denunciar ? '🚫 Contato bloqueado e denunciado. Ele não consegue mais mandar mensagens.' : '🚫 Contato bloqueado.');
        folha = null;
        irInicio(); abrirApp('mensagens');
      }
      function abrirLink(url, golpe) {
        CE.emitir('celular:link', { url, golpe: golpe || null });
        ir('navegador', { url, golpe });
      }
      async function fotoParaComputador(f) {
        try {
          const pasta = 'Fotos do celular';
          await CE.sessao.garantirPasta(pasta, 'pc', '');
          const lista = await CE.sessao.arquivos();
          let n = lista.filter((a) => a.pasta === pasta && a.tipo === 'imagem' && !a.naLixeira).length + 1;
          const nomeBase = f.cena === 'comprovante' ? 'Comprovante Pix' : `Foto ${(CENAS[f.cena] || {}).nome || 'do celular'}`;
          let nome = nomeBase;
          while (lista.some((a) => a.pasta === pasta && a.nome === nome && !a.naLixeira)) nome = `${nomeBase} ${++n}`;
          await CE.sessao.salvarArquivo({ nome, tipo: 'imagem', conteudo: imagemDe(f), local: 'pc', pasta });
          CE.emitir('celular:foto-computador', { nome, cena: f.cena });
          CE.avisar(`💻 A foto "${nome}" foi para Meus Documentos › ${pasta}.`);
        } catch (e) { CE.avisar('⚠️ ' + e.message); }
      }

      // ---------- Folhas (menus que sobem de baixo) ----------
      function desenharFolha() {
        if (!folha) return null;
        const fechar = () => { folha = null; desenhar(); };
        const opcao = (icone, rotulo, acao, attr) => CE.el('button', { class: 'cel-folha-opcao', 'data-folha': attr, onclick: acao }, `${icone} ${rotulo}`);
        let conteudo = [];
        if (folha.tipo === 'mensagem') {
          const m = (estado.conversas[folha.id] || []).find((x) => x.id === folha.msg);
          if (!m) { folha = null; return null; }
          conteudo = [
            m.de !== 'eu' && m.texto ? opcao('🔎', 'Pesquisar se é verdade', () => {
              CE.emitir('celular:checou', { boato: !!m.boato, texto: m.texto });
              folha = { tipo: 'checagem', boato: !!m.boato, id: folha.id, msg: m.id }; desenhar();
            }, 'checar') : null,
            opcao('➡️', 'Encaminhar', () => { folha = { tipo: 'encaminhar', id: folha.id, msg: m.id }; desenhar(); }, 'encaminhar'),
            opcao('🗑️', 'Apagar para mim', () => {
              estado.conversas[folha.id] = estado.conversas[folha.id].filter((x) => x !== m); salvar();
              CE.emitir('celular:mensagem-apagada', { boato: !!m.boato, golpe: m.golpe || null }); fechar();
            }, 'apagar'),
          ];
        } else if (folha.tipo === 'checagem') {
          conteudo = [CE.el('div', { class: 'cel-checagem' + (folha.boato ? ' falso' : ''), 'data-checagem': folha.boato ? 'falso' : 'sem-registro' },
            CE.el('b', {}, folha.boato ? '🔎 Agência de checagem: FALSO' : '🔎 Nenhuma notícia sobre isso'),
            CE.el('p', {}, folha.boato ? 'O Zap não vai cobrar por mensagem. É uma corrente falsa que circula desde 2015. Não encaminhe: avise com carinho quem mandou.' : 'Não achamos nada sobre isso. Na dúvida, não encaminhe.')),
          opcao('✅', 'Não encaminhar', () => { CE.emitir('celular:nao-encaminhou', { boato: folha.boato }); fechar(); }, 'nao-encaminhar')];
        } else if (folha.tipo === 'encaminhar') {
          const m = (estado.conversas[folha.id] || []).find((x) => x.id === folha.msg);
          conteudo = [CE.el('b', {}, 'Encaminhar para:'), ...['familia', 'maria', 'carlos', 'rosa'].filter((c) => c !== folha.id).map((c) => opcao(CONTATOS[c].avatar, CONTATOS[c].nome, () => {
            folha = null; mandar(c, { texto: m.texto, foto: m.foto, encaminhada: true, boato: !!m.boato });
            CE.emitir('celular:encaminhou', { boato: !!m.boato, para: c });
          }, `encaminhar-${c}`))];
        } else if (folha.tipo === 'conversa') {
          conteudo = [opcao('🚫', 'Bloquear e denunciar', () => bloquear(folha.id, true), 'bloquear-denunciar'), opcao('🔕', 'Só bloquear', () => bloquear(folha.id, false), 'bloquear'),
            opcao('🧹', 'Apagar a conversa', () => { estado.conversas[folha.id] = []; salvar(); CE.emitir('celular:conversa-apagada', { conversa: folha.id }); folha = null; voltar(); }, 'apagar-conversa')];
        } else if (folha.tipo === 'anexar') {
          conteudo = [CE.el('b', {}, 'Escolha a foto:'), CE.el('div', { class: 'cel-galeria pequena' }, ...estado.galeria.slice().reverse().map((f) => CE.el('button', { class: 'cel-miniatura', 'data-anexar-foto': f.cena, onclick: () => {
            const id = folha.id; folha = null; mandar(id, { foto: { cena: f.cena, dados: f.dados } });
          } }, CE.el('img', { src: imagemDe(f), alt: f.cena })))) ];
        } else if (folha.tipo === 'compartilhar') {
          const f = estado.galeria.find((x) => x.id === folha.foto);
          conteudo = [CE.el('b', {}, 'Mandar a foto para:'), ...['maria', 'familia', 'carlos', 'rosa'].map((c) => opcao(CONTATOS[c].avatar, CONTATOS[c].nome, () => {
            folha = null; pilha = [{ tela: 'inicio' }, { tela: 'mensagens' }, { tela: 'conversa', id: c }]; mandar(c, { foto: { cena: f.cena, dados: f.dados } });
          }, `compartilhar-${c}`))];
        } else if (folha.tipo === 'instalar') {
          const a = LOJA.find((x) => x.id === folha.app);
          conteudo = [CE.el('div', { class: 'cel-instalar' + (a.suspeito ? ' suspeito' : ''), 'data-instalar': a.id }, CE.el('b', {}, `Instalar ${a.icone} ${a.nome}?`),
            CE.el('p', {}, 'Este app vai poder acessar:'), CE.el('ul', {}, ...a.permissoes.map((p) => CE.el('li', {}, p))),
            a.suspeito ? CE.el('p', { class: 'cel-erro' }, '⚠️ Uma lanterna não precisa dos seus contatos, SMS e localização!') : ''),
          CE.el('div', { class: 'cel-botoes-lado' },
            CE.el('button', { class: 'botao secundario', 'data-acao': 'cancelar-instalacao', onclick: () => { CE.emitir('celular:instalacao-cancelada', { app: a.id, suspeito: !!a.suspeito }); fechar(); } }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-acao': 'confirmar-instalacao', onclick: () => {
              if (!estado.apps.includes(a.id)) estado.apps.push(a.id);
              if (!PEDIDOS[a.id]) estado.permissoes[a.id] = Object.fromEntries(a.permissoes.filter((p) => !/pede ao abrir/.test(p)).map((p) => [p, true]));
              salvar(); CE.emitir('celular:instalado', { app: a.id, suspeito: !!a.suspeito });
              CE.avisar(a.suspeito ? '😬 Instalado… e ele ganhou acesso aos seus contatos e SMS. Desinstale!' : `✅ ${a.nome} instalado! O ícone está na tela inicial.`);
              fechar();
            } }, 'Instalar'))];
        } else if (folha.tipo === 'permissao') {
          const a = LOJA.find((x) => x.id === folha.app);
          const decidir = (v) => {
            estado.permissoes[a.id] = { ...(estado.permissoes[a.id] || {}), [folha.permissao]: v };
            salvar(); CE.emitir('celular:permissao', { app: a.id, permissao: folha.permissao, permitido: v });
            const resta = (PEDIDOS[a.id] || []).find((p) => estado.permissoes[a.id][p] == null);
            folha = resta ? { tipo: 'permissao', app: a.id, permissao: resta } : null; desenhar();
          };
          conteudo = [CE.el('div', { class: 'cel-permissao', 'data-pedido-permissao': folha.permissao }, CE.el('b', {}, `Permitir que ${a.icone} ${a.nome} acesse ${folha.permissao === 'localização' ? 'a sua localização' : `o seu ${folha.permissao === 'contatos' ? 'catálogo de contatos' : folha.permissao}`}?`),
            CE.el('p', { class: 'cel-dica' }, a.id === 'mapas' ? 'Um mapa precisa saber onde você está para mostrar o caminho.' : 'Pense: um jogo de fazenda precisa disso?')),
          CE.el('div', { class: 'cel-botoes-lado' },
            CE.el('button', { class: 'botao secundario', 'data-acao': 'cel-negar', onclick: () => decidir(false) }, 'Não permitir'),
            CE.el('button', { class: 'botao', 'data-acao': 'cel-permitir', onclick: () => decidir(true) }, a.id === 'mapas' ? 'Só enquanto usa o app' : 'Permitir'))];
        }
        return CE.el('div', { class: 'cel-folha-fundo', onclick: (e) => { if (e.target === e.currentTarget) fechar(); } }, CE.el('div', { class: 'cel-folha', 'data-folha-tipo': folha.tipo }, ...conteudo.filter(Boolean)));
      }

      // ---------- Tela de bloqueio e ligação ----------
      function telaBloqueio() {
        const agora = CE.config ? CE.config.agora() : new Date();
        if (!estado.pin || !mostrarPin) {
          return [CE.el('button', { class: 'cel-bloqueio', 'data-acao': 'cel-desbloquear', onclick: () => {
            if (estado.pin) { mostrarPin = true; digitado = ''; desenhar(); return; }
            bloqueado = false; desenhar(); CE.emitir('celular:desbloqueado', { comPin: false });
          } }, CE.el('div', { class: 'cel-bloqueio-hora' }, agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
            CE.el('div', { class: 'cel-bloqueio-data' }, agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })),
            totalNaoLidas() ? CE.el('div', { class: 'cel-bloqueio-aviso' }, `💬 ${totalNaoLidas()} mensagem(ns) nova(s)`) : '',
            CE.el('div', { class: 'cel-bloqueio-dica' }, estado.pin ? '🔒 Toque para digitar o PIN' : '🔓 Toque para desbloquear'))];
        }
        const visor = CE.el('div', { class: 'cel-pin-visor', 'data-pin-visor': '' }, '●'.repeat(digitado.length) || 'Digite o PIN');
        const tecla = (d) => {
          digitado += d;
          if (digitado.length >= estado.pin.length) {
            if (digitado === estado.pin) { bloqueado = false; mostrarPin = false; digitado = ''; CE.emitir('celular:desbloqueado', { comPin: true }); desenhar(); return; }
            CE.emitir('celular:pin-errado'); digitado = ''; visor.textContent = '❌ PIN errado'; return;
          }
          visor.textContent = '●'.repeat(digitado.length);
        };
        return [CE.el('div', { class: 'cel-pin' }, CE.el('p', {}, '🔒 Digite o PIN'), visor,
          CE.el('div', { class: 'cel-teclado' }, ...'123456789 0 '.split('').map((d) => (d === ' ' ? CE.el('span', {}) : CE.el('button', { class: 'cel-tecla', 'data-tecla': d, onclick: () => tecla(d) }, d)))),
          CE.el('button', { class: 'cel-esqueci', 'data-acao': 'cel-esqueci-pin', onclick: async () => {
            if (!await CE.confirmar('Esqueceu o PIN? No celular de verdade, você recupera pela sua conta (Google ou Apple) ou numa loja autorizada. Aqui no treino, o PIN vai ser apagado. Continuar?')) return;
            estado.pin = ''; salvar(); mostrarPin = false; digitado = ''; bloqueado = false; CE.emitir('celular:pin-apagado'); desenhar();
          } }, 'Esqueci o PIN'))];
      }
      let mostrarPin = false, digitado = '';
      function telaLigacao() {
        const r = chamada.roteiro ? ROTEIROS[chamada.roteiro] : { nome: chamada.numero, de: chamada.numero };
        if (chamada.fase === 'tocando') {
          return [CE.el('div', { class: 'cel-ligacao tocando', 'data-ligacao': 'tocando' }, CE.el('div', { class: 'cel-ligacao-avatar' }, '📞'), CE.el('b', {}, r.de), CE.el('small', {}, 'Ligação recebida…'),
            CE.el('div', { class: 'cel-botoes-lado' },
              CE.el('button', { class: 'cel-botao-redondo grande vermelho', 'data-acao': 'cel-recusar', title: 'Recusar', onclick: () => encerrar('recusar') }, '📵'),
              CE.el('button', { class: 'cel-botao-redondo grande verde', 'data-acao': 'cel-atender', title: 'Atender', onclick: atender }, '📞')))];
        }
        if (chamada.fase === 'chamando') return [CE.el('div', { class: 'cel-ligacao', 'data-ligacao': 'chamando' }, CE.el('div', { class: 'cel-ligacao-avatar' }, '📞'), CE.el('b', {}, r.nome), CE.el('small', {}, 'Chamando…'),
          CE.el('button', { class: 'cel-botao-redondo grande vermelho', 'data-acao': 'cel-desligar', onclick: () => { chamada = null; desenhar(); } }, '📵'))];
        if (chamada.fase === 'fim') return [CE.el('div', { class: 'cel-ligacao', 'data-ligacao': 'fim' }, CE.el('b', {}, 'Ligação encerrada'), CE.el('p', {}, chamada.texto || ''),
          CE.el('button', { class: 'botao', 'data-acao': 'cel-fechar-ligacao', onclick: () => { chamada = null; desenhar(); } }, 'OK'))];
        return [CE.el('div', { class: 'cel-ligacao falando', 'data-ligacao': 'falando' }, CE.el('div', { class: 'cel-ligacao-avatar' }, r.golpe ? '🕵️' : '🙂'), CE.el('b', {}, r.nome), CE.el('small', {}, r.de),
          CE.el('div', { class: 'cel-falas' }, ...r.falas.map((f) => CE.el('p', { class: 'cel-fala' }, `🗣️ "${f}"`))),
          CE.el('div', { class: 'cel-opcoes-ligacao' }, ...r.opcoes.map(([id, rotulo]) => CE.el('button', { class: 'botao' + (id === 'desligar' ? ' vermelho' : ' secundario'), 'data-opcao-ligacao': id, onclick: () => encerrar(id) }, rotulo))))];
      }

      // ---------- Desenho ----------
      function desenhar() {
        if (!estado || !corpo.isConnected) return;
        aparelho.className = `cel-aparelho letra-${estado.letra}`;
        brilho.style.opacity = String((100 - estado.brilho) / 140);
        const agora = CE.config ? CE.config.agora() : new Date();
        barraStatus.replaceChildren(CE.el('span', {}, agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
          CE.el('span', { 'data-status-rede': estado.aviao ? 'aviao' : estado.wifi ? 'wifi' : 'dados' }, estado.aviao ? '✈️' : estado.wifi ? '📶 Wi‑Fi' : '📶 4G', ' 🔋 85%'));
        if (conversaAberta && atual().tela !== 'conversa') conversaAberta = null;
        let partes;
        if (chamada) partes = telaLigacao();
        else if (bloqueado) partes = telaBloqueio();
        else partes = (TELAS[atual().tela] || TELAS.inicio)(atual());
        telaEl.dataset.tela = chamada ? 'ligacao' : bloqueado ? 'bloqueio' : atual().tela;
        const aviso = notificacao && !chamada && !bloqueado && !(notificacao.ir && notificacao.ir.tela === atual().tela && notificacao.ir.id === atual().id)
          ? CE.el('button', { class: 'cel-notificacao', 'data-notificacao': '', onclick: () => { const ir = notificacao.ir; notificacao = null; if (ir) { pilha = ir.tela === 'conversa' ? [{ tela: 'inicio' }, { tela: 'mensagens' }, ir] : [{ tela: 'inicio' }, ir]; } desenhar(); if (ir && ir.tela === 'conversa') CE.emitir('celular:conversa', { conversa: ir.id }); } },
            CE.el('b', {}, notificacao.titulo), CE.el('small', {}, String(notificacao.texto).slice(0, 70))) : null;
        telaEl.replaceChildren(...partes.filter(Boolean), aviso || '', desenharFolha() || '');
        janela.definirTitulo(bloqueado ? 'bloqueado' : '');
      }

      ouvintes.add(desenhar);
      const relogio = setInterval(() => { if (bloqueado && !chamada && !mostrarPin) desenhar(); }, 20000);
      garantir().then(() => {
        if (!estado.cenarios['boas-vindas']) CE.celular.cenario('boas-vindas');
        if (argumento && argumento.tela) { pilha = [{ tela: 'inicio' }, { tela: argumento.tela, ...(argumento.extra || {}) }]; }
        desenhar();
      }).catch((e) => { telaEl.replaceChildren(CE.el('p', { class: 'cel-vazio' }, e.message)); });
      CE.emitir('celular:aberto', {});
      return {
        receber(arg) { if (arg && arg.tela) { pilha = [{ tela: 'inicio' }, { tela: arg.tela, ...(arg.extra || {}) }]; folha = null; desenhar(); } },
        aoFechar() { ouvintes.delete(desenhar); clearInterval(relogio); conversaAberta = null; entrouNoBanco = false; if (chamada && chamada.fase === 'falando') { chamada = null; CE.voz.parar(); } return true; },
      };
    },
  });
})();
