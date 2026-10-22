// Sites de serviços do dia a dia (de treino): banco, serviços públicos e um site falso de banco.
window.CE = window.CE || {};

(function () {
  const e = (t) => CE.escapar(String(t == null ? '' : t));
  const link = (url, texto, extra = '') => `<a href="#" data-link="${url}" ${extra}>${texto}</a>`;
  const real = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const lerValor = (t) => Number(String(t).replace(/[R$\s.]/g, '').replace(',', '.'));
  const soDigitos = (t) => String(t).replace(/\D/g, '');

  // Conta de treino (mostrada na tela de login do banco).
  const CONTA = { agencia: '0001', conta: '12345-6', senha: '1234', titular: 'Cliente de Treino' };
  // Chaves Pix conhecidas: o banco mostra o NOME de quem vai receber antes de confirmar.
  const CHAVES_PIX = {
    'maria.clara@correio.escola': 'Maria Clara Souza',
    '69999991234': 'Mercadinho Bom Preço Ltda',
    '12345678900': 'João da Silva',
    '69988887777': 'Carlos Pereira Lima',
  };
  // Boletos de treino (o código aparece na 2ª via da conta de água, no Cidadão Digital).
  const BOLETOS = {
    '83650000001250001800001202512340001': { beneficiario: 'Companhia de Águas (treino)', valor: 125.0, vencimento: '10/12/2025' },
  };
  CE.BOLETO_AGUA = '83650000001-2 50001800001-2 02512340001';

  function estadoBanco(estado) {
    if (!estado.banco) {
      estado.banco = {
        logado: false, saldo: 1500, mostrarSaldo: false,
        extrato: [['01/12', 'Salário', 1800], ['02/12', 'Conta de luz', -132.4], ['03/12', 'Mercado', -167.6]],
      };
    }
    return estado.banco;
  }

  const CAB_BANCO = (b) => `<header class="bc-cabecalho"><span class="bc-logo">🏦 Banco Escola</span>${b && b.logado ? `<span>Olá, ${CONTA.titular}</span>${link('bancoescola.com.br/sair', 'Sair 🚪', 'class="bc-sair" data-banco="sair"')}` : '<span>Seu banco de treino</span>'}</header>`;
  const menuBanco = `<nav class="bc-menu">${link('bancoescola.com.br/conta', '🏠 Início', 'data-banco="inicio"')}${link('bancoescola.com.br/extrato', '📄 Extrato', 'data-banco="extrato"')}${link('bancoescola.com.br/pix', '💠 Pix', 'data-banco="pix"')}${link('bancoescola.com.br/boleto', '🧾 Pagar boleto', 'data-banco="boleto"')}</nav>`;

  CE.SITES['bancoescola.com.br'] = {
    dominio: 'bancoescola.com.br', nome: 'Banco Escola', icone: '🏦', seguro: true,
    abrir({ caminho, busca, estado }) {
      const b = estadoBanco(estado);
      // Com a sessão aberta, a página inicial do banco já mostra a conta (como nos bancos de verdade).
      if (!b.logado || caminho === '/sair') {
        if (caminho === '/sair' && b.logado) { b.logado = false; CE.emitir('banco:sair'); }
        return {
          titulo: 'Banco Escola – Acesse sua conta',
          conteudo: `${CAB_BANCO()}<div class="bc-pagina bc-login"><form class="bc-form" data-formulario="login"><h1>Acesse sua conta</h1>
            ${busca.erro ? '<p class="bc-erro">❌ Agência, conta ou senha incorretas. Confira e tente de novo.</p>' : ''}
            <label>Agência <input name="agencia" inputmode="numeric" autocomplete="off"></label>
            <label>Conta <input name="conta" autocomplete="off"></label>
            <label>Senha <input name="senha" type="password" autocomplete="off"></label>
            <button class="bc-botao" type="submit">Entrar</button></form>
            <aside class="bc-lado"><div class="bc-treino"><b>🎓 Conta de treino</b><br>Agência: <b>${CONTA.agencia}</b><br>Conta: <b>${CONTA.conta}</b><br>Senha: <b>${CONTA.senha}</b></div>
            <div class="bc-dicas"><b>🔒 Dicas de segurança</b><ul><li>Confira se o endereço é <b>bancoescola.com.br</b> e se tem o cadeado.</li><li>O banco <b>nunca</b> pede sua senha por e-mail, mensagem ou telefone.</li><li>Ao terminar, clique em <b>Sair</b>.</li></ul></div></aside></div>`,
        };
      }
      if (caminho === '/extrato') {
        return { titulo: 'Extrato – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><h1>📄 Extrato</h1><table class="bc-tabela"><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>
          ${b.extrato.map(([d, t, v]) => `<tr><td>${d}</td><td>${e(t)}</td><td class="${v < 0 ? 'bc-saida' : 'bc-entrada'}">${v < 0 ? '−' : '+'} ${real(Math.abs(v))}</td></tr>`).join('')}</tbody></table>
          <p class="bc-saldo-linha">Saldo atual: <b>${real(b.saldo)}</b></p></div>` };
      }
      if (caminho === '/pix') {
        return { titulo: 'Pix – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><h1>💠 Fazer um Pix</h1><form class="bc-form" data-formulario="pix">
          <label>Chave Pix (CPF, telefone ou e-mail de quem vai receber) <input name="chave" autocomplete="off"></label>
          <label>Valor (R$) <input name="valor" inputmode="decimal" placeholder="0,00" autocomplete="off"></label>
          <button class="bc-botao" type="submit">Continuar</button></form>
          <p class="bc-aviso">⚠️ No próximo passo, CONFIRA o nome de quem vai receber. Pix feito não dá para desfazer!</p></div>` };
      }
      if (caminho === '/pix-confirmar') {
        const nome = CHAVES_PIX[soDigitos(busca.chave).length >= 11 ? soDigitos(busca.chave) : String(busca.chave).toLowerCase().trim()];
        const valor = lerValor(busca.valor);
        if (!nome) return { titulo: 'Pix – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><p class="bc-erro">❌ Chave Pix não encontrada. Confira se digitou certinho.</p>${link('bancoescola.com.br/pix', '← Voltar')}</div>` };
        if (!(valor > 0)) return { titulo: 'Pix – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><p class="bc-erro">❌ Valor inválido.</p>${link('bancoescola.com.br/pix', '← Voltar')}</div>` };
        if (valor > b.saldo) return { titulo: 'Pix – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><p class="bc-erro">❌ Saldo insuficiente.</p>${link('bancoescola.com.br/pix', '← Voltar')}</div>` };
        return { titulo: 'Confirmar Pix – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><h1>Confira os dados do Pix</h1>
          <div class="bc-confirmar"><p>Você vai enviar <b class="bc-valor">${real(valor)}</b> para:</p><p class="bc-recebedor" data-recebedor="${e(nome)}">👤 ${e(nome)}</p><p>Chave: ${e(busca.chave)}</p></div>
          <form class="bc-form" data-formulario="pix-confirmar"><input type="hidden" name="chave" value="${e(busca.chave)}"><input type="hidden" name="valor" value="${valor}"><input type="hidden" name="nome" value="${e(nome)}">
          <label>Digite sua senha para confirmar <input name="senha" type="password" autocomplete="off"></label>
          <div class="bc-botoes"><button type="button" class="bc-botao secundario" data-site-acao="cancelar-pix" data-nome="${e(nome)}">✋ Cancelar</button><button class="bc-botao" type="submit">Confirmar Pix</button></div></form></div>` };
      }
      if (caminho === '/boleto') {
        return { titulo: 'Pagar boleto – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><h1>🧾 Pagar boleto</h1><form class="bc-form" data-formulario="boleto">
          <label>Código de barras (os números embaixo do código) <input name="codigo" class="bc-codigo" autocomplete="off" placeholder="Digite ou cole o código aqui"></label>
          <button class="bc-botao" type="submit">Continuar</button></form><p class="bc-aviso">💡 Dica: em vez de digitar o código, copie (Ctrl+C) e cole aqui (Ctrl+V).</p></div>` };
      }
      if (caminho === '/boleto-confirmar') {
        const boleto = BOLETOS[soDigitos(busca.codigo)];
        if (!boleto) return { titulo: 'Pagar boleto – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><p class="bc-erro">❌ Código de barras inválido. Confira os números.</p>${link('bancoescola.com.br/boleto', '← Tentar de novo')}</div>` };
        return { titulo: 'Confirmar boleto – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><h1>Confira o boleto</h1><div class="bc-confirmar"><p>Beneficiário: <b>${boleto.beneficiario}</b></p><p>Valor: <b class="bc-valor">${real(boleto.valor)}</b></p><p>Vencimento: ${boleto.vencimento}</p></div>
          <form class="bc-form" data-formulario="boleto-confirmar"><input type="hidden" name="codigo" value="${soDigitos(busca.codigo)}"><label>Digite sua senha para confirmar <input name="senha" type="password" autocomplete="off"></label><button class="bc-botao" type="submit">Pagar</button></form></div>` };
      }
      if (caminho === '/comprovante') {
        return { titulo: 'Comprovante – Banco Escola', conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina bc-comprovante"><h1>✅ ${e(busca.tipo === 'boleto' ? 'Boleto pago' : 'Pix enviado')}!</h1><p>Valor: <b>${real(busca.valor)}</b></p><p>Para: <b>${e(busca.para)}</b></p><p>Data: ${new Date().toLocaleString('pt-BR')}</p><p>Autenticação: ${Math.random().toString(36).slice(2, 12).toUpperCase()}</p>
          <button class="bc-botao secundario" data-site-acao="baixar-comprovante" data-tipo="${e(busca.tipo)}" data-valor="${e(busca.valor)}" data-para="${e(busca.para)}">⬇️ Baixar comprovante</button></div>` };
      }
      return {
        titulo: 'Minha conta – Banco Escola',
        conteudo: `${CAB_BANCO(b)}${menuBanco}<div class="bc-pagina"><div class="bc-saldo"><span>Saldo disponível</span><b data-saldo>${b.mostrarSaldo ? real(b.saldo) : 'R$ •••••'}</b>
          <button class="bc-olho" data-site-acao="mostrar-saldo" title="Mostrar ou esconder o saldo">${b.mostrarSaldo ? '🙈 Esconder' : '👁️ Mostrar'}</button></div>
          <div class="bc-atalhos">${link('bancoescola.com.br/pix', '💠<span>Pix</span>', 'class="bc-atalho"')}${link('bancoescola.com.br/boleto', '🧾<span>Pagar boleto</span>', 'class="bc-atalho"')}${link('bancoescola.com.br/extrato', '📄<span>Extrato</span>', 'class="bc-atalho"')}</div></div>`,
      };
    },
    acao(nome, el, ctx) {
      const b = estadoBanco(ctx.estado);
      if (nome === 'mostrar-saldo') { b.mostrarSaldo = !b.mostrarSaldo; if (b.mostrarSaldo) CE.emitir('banco:saldo', { saldo: b.saldo }); ctx.ir('bancoescola.com.br/conta'); }
      if (nome === 'cancelar-pix') { CE.emitir('banco:pix-cancelado', { nome: el.dataset.nome }); CE.avisar('✋ Pix cancelado. Nenhum dinheiro saiu da sua conta.'); ctx.ir('bancoescola.com.br/conta'); }
      if (nome === 'baixar-comprovante') {
        CE.sessao.baixarArquivo({ nome: `Comprovante ${el.dataset.tipo === 'boleto' ? 'de pagamento' : 'Pix'} ${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`, tipo: 'documento',
          conteudo: `<div style="text-align: center;"><b><font size="5">Banco Escola — Comprovante</font></b></div><div><br></div><div>Tipo: ${el.dataset.tipo === 'boleto' ? 'Pagamento de boleto' : 'Pix'}</div><div>Valor: ${real(el.dataset.valor)}</div><div>Para: ${e(el.dataset.para)}</div><div>Data: ${new Date().toLocaleString('pt-BR')}</div>` }, 'internet');
        CE.emitir('navegador:download', { nome: 'comprovante', site: 'bancoescola.com.br' });
      }
    },
    enviar(formulario, d, ctx) {
      const b = estadoBanco(ctx.estado);
      if (formulario === 'login') {
        if (soDigitos(d.agencia) === soDigitos(CONTA.agencia) && soDigitos(d.conta) === soDigitos(CONTA.conta) && d.senha === CONTA.senha) {
          b.logado = true; CE.emitir('banco:login'); ctx.ir('bancoescola.com.br/conta');
        } else { CE.emitir('banco:login-erro'); ctx.ir('bancoescola.com.br?erro=1'); }
      }
      if (formulario === 'pix') ctx.ir(`bancoescola.com.br/pix-confirmar?chave=${encodeURIComponent(d.chave.trim())}&valor=${encodeURIComponent(d.valor)}`);
      if (formulario === 'pix-confirmar') {
        if (d.senha !== CONTA.senha) { CE.avisar('❌ Senha incorreta.'); return; }
        const valor = Number(d.valor);
        b.saldo -= valor;
        b.extrato.push([new Date().toLocaleDateString('pt-BR').slice(0, 5), `Pix para ${d.nome}`, -valor]);
        CE.emitir('banco:pix', { valor, chave: d.chave, nome: d.nome });
        ctx.ir(`bancoescola.com.br/comprovante?tipo=pix&valor=${valor}&para=${encodeURIComponent(d.nome)}`);
      }
      if (formulario === 'boleto') ctx.ir(`bancoescola.com.br/boleto-confirmar?codigo=${soDigitos(d.codigo)}`);
      if (formulario === 'boleto-confirmar') {
        if (d.senha !== CONTA.senha) { CE.avisar('❌ Senha incorreta.'); return; }
        const boleto = BOLETOS[d.codigo];
        b.saldo -= boleto.valor;
        b.extrato.push([new Date().toLocaleDateString('pt-BR').slice(0, 5), `Boleto ${boleto.beneficiario}`, -boleto.valor]);
        CE.emitir('banco:boleto', { valor: boleto.valor, beneficiario: boleto.beneficiario });
        ctx.ir(`bancoescola.com.br/comprovante?tipo=boleto&valor=${boleto.valor}&para=${encodeURIComponent(boleto.beneficiario)}`);
      }
    },
  };
  CE.INDICE_BUSCA.push({ url: 'bancoescola.com.br', titulo: 'Banco Escola – acesse sua conta', descricao: 'Banco de treino: saldo, extrato, Pix e pagamento de boletos com segurança.', palavras: 'banco conta pix boleto saldo extrato pagar' });

  // ================= Site FALSO do banco (para a aula de e-mails falsos) =================
  CE.SITES['bancoescola-seguranca.net'] = {
    dominio: 'bancoescola-seguranca.net', nome: 'Banco Escola (FALSO)', icone: '🏦', seguro: false, golpe: true,
    abrir({ caminho }) {
      if (caminho === '/alerta') {
        return { titulo: 'Atenção: golpe!', conteudo: `<div class="golpe-alerta"><h1>⚠️ Cuidado! Isto era um GOLPE (de treino)</h1>
          <p>Este site imitava o Banco Escola, mas o endereço era <b>bancoescola-seguranca.net</b>, e não <b>bancoescola.com.br</b>. Você chegou aqui por um link de e-mail falso.</p>
          <h2>Como perceber:</h2><ul><li>📧 O e-mail vinha de um endereço estranho e tinha <b>pressa</b> ("será bloqueada em 24 horas").</li><li>🔓 A barra de endereço mostrava <b>"Não seguro"</b>.</li><li>🔑 Pedia senha e código do SMS. O banco <b>NUNCA</b> pede isso.</li></ul>
          <p><b>O certo:</b> nunca clique em links de e-mails assim. Digite você mesmo o endereço do banco ou use o aplicativo oficial. Marque o e-mail como spam.</p>${link('inicio', '🏠 Voltar para a página inicial', 'class="golpe-voltar"')}</div>` };
      }
      return { titulo: 'Banco Escola – Atualização de segurança', conteudo: `<header class="bc-cabecalho falso"><span class="bc-logo">🏦 Banco Escola</span><span>Atualização de segurança</span></header>
        <div class="bc-pagina"><form class="bc-form" data-formulario="roubar"><h1>⚠️ Sua conta será bloqueada!</h1><p class="bc-erro">Confirme seus dados AGORA para evitar o bloqueio.</p>
        <label>Agência <input name="agencia" autocomplete="off"></label><label>Conta <input name="conta" autocomplete="off"></label>
        <label>Senha <input name="senha" type="password" autocomplete="off"></label><label>Código recebido por SMS <input name="codigo" autocomplete="off"></label>
        <button class="bc-botao" type="submit">Desbloquear minha conta</button></form></div>` };
    },
    enviar(_f, _d, ctx) { ctx.caiuNoGolpe(); ctx.ir('bancoescola-seguranca.net/alerta'); },
  };

  // ================= Cidadão Digital (serviços públicos de treino) =================
  const POSTOS = ['Posto de Saúde Centro', 'Posto de Saúde Bairro Novo', 'Unidade Básica Jardim das Flores'];
  const ESPECIALIDADES = ['Clínico geral', 'Dentista', 'Vacinação', 'Pediatria'];
  const proximosDias = () => {
    const dias = [];
    const d = new Date();
    while (dias.length < 5) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) dias.push(d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })); }
    return dias;
  };
  const CAB_CID = `<header class="cd-cabecalho">${link('cidadaodigital.org.br', '🏛️ Cidadão Digital')}<span>Serviços públicos sem sair de casa (site de treino)</span></header>`;

  CE.SITES['cidadaodigital.org.br'] = {
    dominio: 'cidadaodigital.org.br', nome: 'Cidadão Digital', icone: '🏛️', seguro: true,
    abrir({ caminho, busca }) {
      if (caminho === '/agendar') {
        return { titulo: 'Agendar consulta – Cidadão Digital', conteudo: `${CAB_CID}<div class="cd-pagina"><h1>🩺 Agendar consulta no posto de saúde</h1>
          <form class="cd-form" data-formulario="agendar">
            <label>Nome completo <input name="nome" required autocomplete="off"></label>
            <label>Número do Cartão da Saúde <input name="cartao" required autocomplete="off" placeholder="Ex.: 7000 0000 0000 0000"></label>
            <label>Posto de saúde <select name="posto" required><option value="">Escolha...</option>${POSTOS.map((p) => `<option>${p}</option>`).join('')}</select></label>
            <label>Atendimento <select name="especialidade" required><option value="">Escolha...</option>${ESPECIALIDADES.map((p) => `<option>${p}</option>`).join('')}</select></label>
            <label>Dia <select name="dia" required><option value="">Escolha...</option>${proximosDias().map((p) => `<option>${p}</option>`).join('')}</select></label>
            <fieldset><legend>Horário</legend>${['08:00', '09:30', '13:00', '15:30'].map((h) => `<label><input type="radio" name="horario" value="${h}" required> ${h}</label>`).join('')}</fieldset>
            <button class="cd-botao" type="submit">Agendar</button></form>
          <p class="cd-dica">Os campos com caixa precisam ser preenchidos. Use dados inventados: este é um site de treino.</p></div>` };
      }
      if (caminho === '/agendado') {
        return { titulo: 'Agendamento confirmado – Cidadão Digital', conteudo: `${CAB_CID}<div class="cd-pagina cd-confirmado"><h1>✅ Consulta agendada!</h1>
          <p>Protocolo: <b data-protocolo>${e(busca.protocolo)}</b></p><p>${e(busca.especialidade)} — ${e(busca.posto)}</p><p>📅 ${e(busca.dia)} às ${e(busca.horario)}</p>
          <p>Chegue 15 minutos antes e leve um documento com foto e o Cartão da Saúde.</p>
          <button class="cd-botao" data-site-acao="baixar-agendamento" data-protocolo="${e(busca.protocolo)}" data-detalhe="${e(`${busca.especialidade} — ${busca.posto} — ${busca.dia} às ${busca.horario}`)}">⬇️ Baixar comprovante</button></div>` };
      }
      if (caminho === '/agua') {
        return { titulo: '2ª via da conta de água – Cidadão Digital', conteudo: `${CAB_CID}<div class="cd-pagina"><h1>💧 2ª via da conta de água</h1>
          <form class="cd-form" data-formulario="agua"><label>Número da matrícula (está na conta de água) <input name="matricula" autocomplete="off" placeholder="Ex.: 2025-1234"></label><button class="cd-botao" type="submit">Buscar conta</button></form>
          ${busca.erro ? '<p class="bc-erro">❌ Matrícula não encontrada. Para treinar, use a matrícula 2025-1234.</p>' : '<p class="cd-dica">Para treinar, use a matrícula <b>2025-1234</b>.</p>'}</div>` };
      }
      if (caminho === '/agua-boleto') {
        return { titulo: 'Conta de água – Cidadão Digital', conteudo: `${CAB_CID}<div class="cd-pagina"><h1>💧 Conta de água — matrícula 2025-1234</h1>
          <div class="cd-boleto"><p>Companhia de Águas (treino) · Vencimento: <b>10/12/2025</b> · Valor: <b>R$ 125,00</b></p>
          <div class="cd-barras" aria-hidden="true"></div><p class="cd-codigo" data-codigo-boleto>${CE.BOLETO_AGUA}</p></div>
          <p>Para pagar no banco pela internet, <b>selecione o código acima</b> (arraste o mouse por cima), copie com <b>Ctrl+C</b> e cole no banco com <b>Ctrl+V</b>.</p>
          <button class="cd-botao" data-site-acao="baixar-boleto">⬇️ Baixar boleto</button></div>` };
      }
      return {
        titulo: 'Cidadão Digital – serviços públicos',
        conteudo: `${CAB_CID}<div class="cd-pagina"><h1>Como podemos ajudar?</h1><div class="cd-servicos">
          ${link('cidadaodigital.org.br/agendar', '🩺<b>Agendar consulta</b><span>No posto de saúde</span>', 'class="cd-servico" data-servico="agendar"')}
          ${link('cidadaodigital.org.br/agua', '💧<b>2ª via da conta de água</b><span>Boleto para pagar</span>', 'class="cd-servico" data-servico="agua"')}
          ${link('jornaldobairro.com.br/noticia/vacinacao', '💉<b>Campanha de vacinação</b><span>Datas e locais</span>', 'class="cd-servico"')}</div>
          <p class="cd-dica">🔒 Sites de serviços públicos verdadeiros terminam com <b>.gov.br</b>. Este é um site de treino.</p></div>`,
      };
    },
    acao(nome, el) {
      if (nome === 'baixar-agendamento') {
        CE.sessao.baixarArquivo({ nome: `Agendamento ${el.dataset.protocolo}`, tipo: 'documento', conteudo: `<div style="text-align: center;"><b><font size="5">Comprovante de agendamento</font></b></div><div><br></div><div>Protocolo: ${e(el.dataset.protocolo)}</div><div>${e(el.dataset.detalhe)}</div><div>Leve um documento com foto e o Cartão da Saúde.</div>` }, 'internet');
        CE.emitir('navegador:download', { nome: 'agendamento', site: 'cidadaodigital.org.br' });
      }
      if (nome === 'baixar-boleto') {
        CE.sessao.baixarArquivo({ nome: 'Conta de água dezembro', tipo: 'documento', conteudo: `<div><b>Companhia de Águas (treino)</b></div><div>Matrícula 2025-1234 · Vencimento 10/12/2025 · Valor R$ 125,00</div><div><br></div><div>Código de barras:</div><div><b>${CE.BOLETO_AGUA}</b></div>` }, 'internet');
        CE.emitir('navegador:download', { nome: 'boleto', site: 'cidadaodigital.org.br' });
      }
    },
    enviar(formulario, d, ctx) {
      if (formulario === 'agendar') {
        const protocolo = `${new Date().getFullYear()}${String(Math.floor(Math.random() * 900000) + 100000)}`;
        CE.emitir('servico:agendado', { ...d, protocolo });
        const q = new URLSearchParams({ protocolo, especialidade: d.especialidade, posto: d.posto, dia: d.dia, horario: d.horario }).toString();
        ctx.ir(`cidadaodigital.org.br/agendado?${q}`);
      }
      if (formulario === 'agua') {
        if (soDigitos(d.matricula) === '20251234') { CE.emitir('servico:segunda-via', { matricula: d.matricula }); ctx.ir('cidadaodigital.org.br/agua-boleto'); }
        else ctx.ir('cidadaodigital.org.br/agua?erro=1');
      }
    },
  };
  CE.INDICE_BUSCA.push(
    { url: 'cidadaodigital.org.br', titulo: 'Cidadão Digital – serviços públicos', descricao: 'Agende consultas, tire a 2ª via da conta de água e veja campanhas de saúde.', palavras: 'servicos publicos governo agendar consulta posto saude agua segunda via conta' },
    { url: 'cidadaodigital.org.br/agendar', titulo: 'Agendar consulta no posto de saúde – Cidadão Digital', descricao: 'Marque sua consulta pela internet, sem fila.', palavras: 'agendar consulta posto saude medico dentista vacina' },
    { url: 'cidadaodigital.org.br/agua', titulo: '2ª via da conta de água – Cidadão Digital', descricao: 'Emita a segunda via do boleto da conta de água.', palavras: 'agua conta boleto segunda via' },
  );
})();
