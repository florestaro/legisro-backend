// Conta Cidadão no site de treino "Cidadão Digital": o jeito de entrar nos serviços do governo pela internet
// (na vida real, a conta gov.br). Criar a conta com o CPF de treino, código por SMS e senha forte; níveis bronze e
// prata (autorizando pelo Banco Escola); Carteira de Trabalho Digital; extrato do INSS; situação do CPF; valores a
// receber. E um site FALSO de "valores esquecidos", para a aula de golpes.
// A conta fica no progresso do aluno ("gov"), para valer de uma aula para a outra. A senha não fica guardada, só um
// resumo dela: se o aluno usar uma senha de verdade por engano, ela não aparece nos arquivos.
window.CE = window.CE || {};

(function () {
  const e = (t) => CE.escapar(String(t == null ? '' : t));
  const link = (url, texto, extra = '') => `<a href="#" data-link="${url}" ${extra}>${texto}</a>`;
  const soDigitos = (t) => String(t || '').replace(/\D/g, '');
  const real = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const DOMINIO = 'cidadaodigital.org.br';
  const CPF_TREINO = '123.456.789-09';
  const resumo = (t) => { let h = 2166136261; for (const c of String(t)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16); };
  const NIVEIS = { bronze: '🥉 Bronze', prata: '🥈 Prata', ouro: '🥇 Ouro' };

  // Dados de treino da Carteira de Trabalho e do INSS (os mesmos para todos os alunos).
  const CONTRATOS = [
    { empresa: 'Mercadinho Bom Preço Ltda', cargo: 'Repositor', entrada: '04/03/2019', saida: '29/07/2022', salario: 1450 },
    { empresa: 'Padaria Pão Quente Ltda', cargo: 'Atendente de padaria', entrada: '01/09/2022', saida: '', salario: 1680 },
  ];
  const CONTRIBUICOES = [
    ['2019', 'Mercadinho Bom Preço Ltda', 10], ['2020', 'Mercadinho Bom Preço Ltda', 12], ['2021', 'Mercadinho Bom Preço Ltda', 12],
    ['2022', 'Mercadinho Bom Preço / Padaria Pão Quente', 11], ['2023', 'Padaria Pão Quente Ltda', 12], ['2024', 'Padaria Pão Quente Ltda', 12],
  ];
  const mesesContribuidos = CONTRIBUICOES.reduce((s, c) => s + c[2], 0);
  const tempo = (m) => `${Math.floor(m / 12)} anos e ${m % 12} meses`;

  // A conta de quem está usando o computador (lida do progresso ao entrar no sistema).
  let dono = null, conta = null, logado = false, cadastro = null, recuperar = null;
  async function guardar() {
    const id = dono, c = conta;
    if (!CE.sessao.usuario || CE.sessao.usuario.id !== id) return;
    await CE.sessao.atualizarProgresso((p) => { p.gov = c; }).catch((er) => CE.avisar(er.message));
  }
  const codigoNovo = () => String(100000 + Math.floor(Math.random() * 900000));
  const celularEscondido = (c) => { const d = soDigitos(c); return d.length >= 4 ? `(${d.slice(0, 2)}) 9****-**${d.slice(-2)}` : 'cadastrado'; };
  // "Celular" de treino: a mensagem com o código aparece num quadro na própria página.
  const sms = (codigo) => `<div class="gv-sms" data-sms-codigo="${codigo}"><b>📱 Nova mensagem (SMS) no seu celular</b>
    <span>CIDADÃO DIGITAL: seu código de confirmação é <b>${codigo}</b>. Não passe este código para ninguém.</span></div>`;

  CE.contaCidadao = {
    async carregar() {
      const id = CE.sessao.usuario && CE.sessao.usuario.id;
      dono = id; conta = null; logado = false; cadastro = null; recuperar = null;
      if (!id) return;
      try { const p = await CE.sessao.progresso(); if (dono === id) conta = p.gov || null; } catch { /* sem conexão: entra sem conta */ }
    },
    conta: () => conta,
    logado: () => logado,
    CPF_TREINO,
    // Na página inicial do Cidadão Digital: quem está na conta, ou o botão para entrar.
    faixa: () => (logado && conta
      ? `<div class="gv-faixa">👤 <b>${e(conta.nome.split(' ')[0])}</b> · Conta ${NIVEIS[conta.nivel]} ${link(`${DOMINIO}/painel`, 'Meus serviços', 'class="cd-botao pequeno" data-gov="painel"')} ${link(`${DOMINIO}/sair`, 'Sair 🚪', 'data-gov="sair"')}</div>`
      : `<div class="gv-faixa">${link(`${DOMINIO}/conta`, '👤 Entrar com a Conta Cidadão', 'class="cd-botao" data-gov="entrar"')}<span>Uma conta só para todos os serviços (na vida real, a conta gov.br).</span></div>`),
    servicos: () => [
      link(`${DOMINIO}/carteira`, '💼<b>Carteira de Trabalho Digital</b><span>Seus empregos com carteira assinada</span>', 'class="cd-servico" data-servico="carteira"'),
      link(`${DOMINIO}/inss`, '👵<b>INSS: extrato de contribuições</b><span>Tempo para a aposentadoria</span>', 'class="cd-servico" data-servico="inss"'),
      link(`${DOMINIO}/cpf`, '🪪<b>Situação do CPF</b><span>Comprovante de inscrição</span>', 'class="cd-servico" data-servico="cpf"'),
      link(`${DOMINIO}/valores`, '💰<b>Valores a receber</b><span>Dinheiro esquecido em bancos</span>', 'class="cd-servico" data-servico="valores"'),
    ].join(''),
  };

  const CAB = `<header class="cd-cabecalho">${link(DOMINIO, '🏛️ Cidadão Digital')}<span>Serviços públicos sem sair de casa (site de treino)</span></header>`;
  const pagina = (titulo, html) => ({ titulo: `${titulo} – Cidadão Digital`, conteudo: `${CAB}<div class="cd-pagina">${CE.contaCidadao.faixa()}${html}</div>` });
  const erro = (t) => (t ? `<p class="bc-erro">❌ ${t}</p>` : '');
  const quadroTreino = `<div class="bc-treino gv-treino"><b>🎓 Para treinar</b><br>Use o CPF de treino: <b>${CPF_TREINO}</b><br>Nunca coloque os seus documentos de verdade num site de treino.</div>`;
  const ERROS = {
    cpf: `Neste site de treino, use o CPF de treino ${CPF_TREINO}.`,
    nome: 'Escreva o nome completo (nome e sobrenome).',
    nascimento: 'Escreva a data de nascimento assim: 25/12/1970.',
    celular: 'Escreva o celular com DDD, por exemplo: (69) 99999-1234.',
    termos: 'Para criar a conta, marque "Li e concordo com os termos de uso".',
    codigo: 'Código errado. Confira os 6 números do SMS.',
    senha: 'A senha precisa ter pelo menos 8 caracteres, com letra MAIÚSCULA, letra minúscula e número.',
    senha2: 'As duas senhas não são iguais.',
    login: 'CPF ou senha incorretos. Confira e tente de novo. Esqueceu? Clique em "Esqueci minha senha".',
    semConta: 'Ainda não existe Conta Cidadão para este CPF.',
  };
  const senhaForte = (s) => s.length >= 8 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s);
  const regrasSenha = `<ul class="gv-regras"><li>Pelo menos 8 caracteres</li><li>Uma letra MAIÚSCULA e uma minúscula</li><li>Pelo menos um número</li><li>Não use a data de nascimento nem o nome</li></ul>`;

  function entrar(busca) {
    return pagina('Entrar', `<h1>👤 Entrar com a Conta Cidadão</h1>
      <form class="cd-form" data-formulario="entrar-cpf">${erro(ERROS[busca.erro])}
        <label>Digite o seu CPF <input name="cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" value="${e(busca.cpf || '')}"></label>
        <button class="cd-botao" type="submit">Continuar</button></form>
      <p>Ainda não tem conta? ${link(`${DOMINIO}/criar`, 'Criar conta', 'class="cd-botao secundario" data-gov="criar"')}</p>${quadroTreino}`);
  }
  // Serviço que precisa da conta: sem entrar, mostra a tela de entrada.
  const precisaEntrar = (busca) => (logado && conta ? null : entrar(busca));

  function abrirGov(caminho, busca) {
    if (caminho === '/conta') return logado && conta ? abrirGov('/painel', busca) : entrar(busca);
    if (caminho === '/conta-senha') {
      return pagina('Entrar', `<h1>👤 Digite a sua senha</h1><p>CPF: <b>${e(busca.cpf)}</b></p>
        <form class="cd-form" data-formulario="entrar-senha">${erro(ERROS[busca.erro])}<input type="hidden" name="cpf" value="${e(busca.cpf)}">
          <label>Senha <input name="senha" type="password" autocomplete="off"></label>
          <button class="cd-botao" type="submit">Entrar</button></form>
        <p>${link(`${DOMINIO}/recuperar`, 'Esqueci minha senha', 'data-gov="recuperar"')}</p>`);
    }
    if (caminho === '/criar') {
      const c = cadastro || {};
      return pagina('Criar conta', `<h1>📝 Criar a sua Conta Cidadão</h1>${quadroTreino}
        <form class="cd-form" data-formulario="criar">${erro(ERROS[busca.erro])}
          <label>CPF <input name="cpf" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" value="${e(c.cpf || '')}"></label>
          <label>Nome completo <input name="nome" autocomplete="off" value="${e(c.nome || '')}"></label>
          <label>Data de nascimento <input name="nascimento" autocomplete="off" placeholder="dd/mm/aaaa" value="${e(c.nascimento || '')}"></label>
          <label>Celular com DDD <input name="celular" inputmode="tel" autocomplete="off" placeholder="(69) 99999-1234" value="${e(c.celular || '')}"></label>
          <label class="gv-termos"><input type="checkbox" name="termos" value="sim"> Li e concordo com os termos de uso</label>
          <button class="cd-botao" type="submit">Continuar</button></form>`);
    }
    if (caminho === '/criar-codigo') {
      if (!cadastro) return abrirGov('/criar', {});
      return pagina('Confirmar celular', `<h1>📱 Confirme o seu celular</h1><p>Mandamos um código por SMS para ${e(celularEscondido(cadastro.celular))}.</p>${sms(cadastro.codigo)}
        <form class="cd-form" data-formulario="codigo">${erro(ERROS[busca.erro])}<label>Código de 6 números <input name="codigo" inputmode="numeric" maxlength="6" autocomplete="off"></label>
        <button class="cd-botao" type="submit">Confirmar</button></form>`);
    }
    if (caminho === '/criar-senha') {
      if (!cadastro || !cadastro.confirmado) return abrirGov('/criar', {});
      return pagina('Criar senha', `<h1>🔑 Crie a sua senha</h1>${regrasSenha}
        <form class="cd-form" data-formulario="criar-senha">${erro(ERROS[busca.erro])}
          <label>Senha <input name="senha" type="password" autocomplete="off"></label>
          <label>Repita a senha <input name="senha2" type="password" autocomplete="off"></label>
          <button class="cd-botao" type="submit">Criar conta</button></form><p class="cd-dica">💡 Anote a senha num lugar seguro, longe do computador.</p>`);
    }
    if (caminho === '/recuperar') {
      if (!conta) return pagina('Recuperar senha', `${erro(ERROS.semConta)}${link(`${DOMINIO}/criar`, 'Criar conta', 'class="cd-botao"')}`);
      if (!recuperar) {
        return pagina('Recuperar senha', `<h1>🔑 Esqueci minha senha</h1><p>Vamos mandar um código por SMS para o celular cadastrado: <b>${e(celularEscondido(conta.celular))}</b>.</p>
          <button class="cd-botao" data-site-acao="mandar-codigo">Mandar código</button>`);
      }
      return pagina('Recuperar senha', `<h1>🔑 Crie uma senha nova</h1>${sms(recuperar.codigo)}${regrasSenha}
        <form class="cd-form" data-formulario="recuperar">${erro(ERROS[busca.erro])}
          <label>Código do SMS <input name="codigo" inputmode="numeric" maxlength="6" autocomplete="off"></label>
          <label>Senha nova <input name="senha" type="password" autocomplete="off"></label>
          <label>Repita a senha nova <input name="senha2" type="password" autocomplete="off"></label>
          <button class="cd-botao" type="submit">Trocar a senha</button></form>`);
    }
    if (caminho === '/sair') {
      return pagina('Você saiu', '<h1>👋 Você saiu da sua conta</h1><p>Sempre saia da conta ao terminar, principalmente em computador de uso coletivo.</p>');
    }
    if (caminho === '/painel') {
      const fora = precisaEntrar(busca);
      if (fora) return fora;
      return pagina('Meus serviços', `<h1>Olá, ${e(conta.nome.split(' ')[0])}!</h1>
        <div class="gv-nivel" data-nivel-conta="${conta.nivel}">Nível da sua conta: <b>${NIVEIS[conta.nivel]}</b> ${conta.nivel === 'bronze' ? link(`${DOMINIO}/nivel`, '⬆️ Aumentar o nível da conta', 'class="cd-botao secundario pequeno" data-gov="nivel"') : ''}</div>
        <div class="cd-servicos">${CE.contaCidadao.servicos()}</div>`);
    }
    if (caminho === '/nivel') {
      const fora = precisaEntrar(busca);
      if (fora) return fora;
      return pagina('Nível da conta', `<h1>⬆️ Nível da conta</h1><p>Quanto mais alto o nível, mais certeza o governo tem de que é você mesmo, e mais serviços você pode usar.</p>
        <table class="bc-tabela gv-niveis"><tr><th>Nível</th><th>Como se consegue</th></tr>
          <tr class="${conta.nivel === 'bronze' ? 'gv-atual' : ''}"><td>${NIVEIS.bronze}</td><td>Só com o cadastro (CPF, dados e celular).</td></tr>
          <tr class="${conta.nivel === 'prata' ? 'gv-atual' : ''}"><td>${NIVEIS.prata}</td><td>Confirmando pelo seu banco, ou pelo reconhecimento do rosto no aplicativo do celular.</td></tr>
          <tr><td>${NIVEIS.ouro}</td><td>Reconhecimento do rosto com a foto da CNH, ou certificado digital.</td></tr></table>
        ${conta.nivel === 'bronze' ? `<h2>Subir para prata agora</h2><p>${link('bancoescola.com.br/autorizar?servico=cidadao', '🏦 Validar pelo meu banco (Banco Escola)', 'class="cd-botao" data-gov="validar-banco"')}</p>
          <p class="cd-dica">Você vai para o SITE DO BANCO. A senha do banco só se digita lá.</p>` : '<p>✅ Sua conta já é prata.</p>'}`);
    }
    if (caminho === '/carteira') {
      const fora = precisaEntrar(busca);
      if (fora) return fora;
      return pagina('Carteira de Trabalho Digital', `<h1>💼 Carteira de Trabalho Digital</h1>
        <p><b>${e(conta.nome)}</b> · CPF ${CPF_TREINO} · Nascimento: ${e(conta.nascimento)}</p>
        <table class="bc-tabela gv-contratos"><thead><tr><th>Empresa</th><th>Cargo</th><th>Entrada</th><th>Saída</th><th>Salário inicial</th></tr></thead><tbody>
        ${CONTRATOS.map((c) => `<tr><td>${c.empresa}</td><td>${c.cargo}</td><td>${c.entrada}</td><td>${c.saida || '<b>Atual</b>'}</td><td>${real(c.salario)}</td></tr>`).join('')}</tbody></table>
        <p class="cd-dica">Confira se todos os seus empregos com carteira assinada estão aqui. Faltou algum? Procure o RH da empresa ou o Ministério do Trabalho.</p>
        <button class="cd-botao" data-site-acao="baixar-carteira">⬇️ Baixar a carteira</button>`);
    }
    if (caminho === '/inss' || caminho === '/inss-simular') {
      const fora = precisaEntrar(busca);
      if (fora) return fora;
      if (conta.nivel === 'bronze') {
        return pagina('INSS', `<h1>👵 INSS: extrato de contribuições</h1><div class="gv-bloqueado" data-precisa-prata>🔒 Este serviço precisa de conta <b>${NIVEIS.prata}</b> ou <b>${NIVEIS.ouro}</b>.<br>A sua conta é ${NIVEIS.bronze}.</div>
          <p>${link(`${DOMINIO}/nivel`, '⬆️ Aumentar o nível da conta', 'class="cd-botao" data-gov="nivel"')}</p>`);
      }
      const simulado = caminho === '/inss-simular';
      return pagina('INSS', `<h1>👵 INSS: extrato de contribuições (CNIS)</h1>
        <table class="bc-tabela"><thead><tr><th>Ano</th><th>Empregador</th><th>Meses contribuídos</th></tr></thead><tbody>
        ${CONTRIBUICOES.map(([a, emp, m]) => `<tr><td>${a}</td><td>${emp}</td><td>${m}</td></tr>`).join('')}</tbody></table>
        <p class="gv-total">Tempo de contribuição: <b data-tempo-contribuicao>${tempo(mesesContribuidos)}</b></p>
        ${simulado ? `<div class="gv-caixa gv-simulacao" data-simulacao><h2>📊 Simulação (de treino)</h2><p>Com ${tempo(mesesContribuidos)} de contribuição, faltam cerca de <b>${tempo(15 * 12 - mesesContribuidos)}</b> para o tempo mínimo de 15 anos.</p>
          <p>A idade também conta. A simulação de verdade fica no site e no aplicativo do INSS ("Meu INSS").</p></div>`
          : `<p><button class="cd-botao" data-site-acao="simular-aposentadoria">📊 Simular aposentadoria</button> <button class="cd-botao secundario" data-site-acao="baixar-extrato">⬇️ Baixar extrato</button></p>`}`);
    }
    if (caminho === '/cpf') {
      const fora = precisaEntrar(busca);
      if (fora) return fora;
      return pagina('Situação do CPF', `<h1>🪪 Situação cadastral do CPF</h1><div class="gv-caixa"><p>CPF: <b>${CPF_TREINO}</b></p><p>Nome: <b>${e(conta.nome)}</b></p>
        <p>Situação: <b class="gv-regular" data-situacao-cpf>REGULAR</b></p></div><button class="cd-botao" data-site-acao="baixar-cpf">⬇️ Baixar comprovante</button>`);
    }
    if (caminho === '/valores') {
      const fora = precisaEntrar(busca);
      if (fora) return fora;
      return pagina('Valores a receber', `<h1>💰 Valores a receber</h1>
        <div class="gv-alerta">⚠️ Este serviço é <b>GRÁTIS</b>. Ninguém cobra taxa para liberar o dinheiro, e o governo <b>nunca</b> manda link por SMS, WhatsApp ou e-mail.</div>
        ${conta.valoresPedidos ? `<div class="gv-caixa" data-valores-pedidos><h2>✅ Pedido feito</h2><p>${real(12.37)} vão cair na chave Pix <b>${e(conta.valoresPedidos)}</b> em até 12 dias úteis.</p></div>`
          : `<p>Você tem <b class="gv-valor">${real(12.37)}</b> para receber de: <b>Banco Escola</b> (tarifa cobrada a mais).</p>
          <form class="cd-form" data-formulario="valores"><label>Para pedir o dinheiro, digite uma chave Pix SUA (CPF, celular ou e-mail) <input name="chave" autocomplete="off"></label>
          <button class="cd-botao" type="submit">Pedir por Pix</button></form>`}`);
    }
    return null;
  }

  // ---------- O site Cidadão Digital ganha a conta (as outras páginas continuam as de antes) ----------
  const original = CE.SITES[DOMINIO];
  CE.SITES[DOMINIO] = {
    ...original,
    abrir(ctx) {
      if (ctx.caminho === '/sair' && logado) { logado = false; CE.emitir('gov:sair'); }
      return abrirGov(ctx.caminho, ctx.busca || {}) || original.abrir(ctx);
    },
    acao(nome, el, ctx) {
      const baixar = (arquivo, nomeArq, conteudo) => {
        CE.sessao.baixarArquivo({ nome: nomeArq, tipo: 'documento', conteudo }, 'internet');
        CE.emitir('navegador:download', { nome: arquivo, site: DOMINIO });
      };
      if (nome === 'mandar-codigo') { recuperar = { codigo: codigoNovo() }; ctx.ir(`${DOMINIO}/recuperar`); return; }
      if (nome === 'simular-aposentadoria') { CE.emitir('gov:simulou', { meses: mesesContribuidos }); ctx.ir(`${DOMINIO}/inss-simular`); return; }
      if (nome === 'baixar-carteira') {
        baixar('carteira', 'Carteira de Trabalho Digital', `<div style="text-align: center;"><b><font size="5">Carteira de Trabalho Digital</font></b></div><div><br></div><div>Nome: ${e(conta.nome)} · CPF ${CPF_TREINO}</div><div><br></div>`
          + CONTRATOS.map((c) => `<div>• ${c.empresa} — ${c.cargo} — de ${c.entrada} ${c.saida ? `a ${c.saida}` : 'até hoje'} — salário inicial ${real(c.salario)}</div>`).join(''));
        CE.emitir('gov:carteira-baixada');
        return;
      }
      if (nome === 'baixar-extrato') baixar('extrato-inss', 'Extrato de contribuições INSS', `<div><b>Extrato de contribuições (treino)</b></div><div>${e(conta.nome)} · Tempo de contribuição: ${tempo(mesesContribuidos)}</div>`);
      if (nome === 'baixar-cpf') baixar('cpf', 'Comprovante de situação do CPF', `<div><b>Comprovante de situação cadastral no CPF (treino)</b></div><div>CPF ${CPF_TREINO} · ${e(conta.nome)} · Situação: REGULAR</div><div>Emitido em ${new Date().toLocaleString('pt-BR')}</div>`);
      if (original.acao) original.acao(nome, el, ctx);
    },
    enviar(formulario, d, ctx) {
      const ir = (caminho, erro, extra = {}) => ctx.ir(`${DOMINIO}${caminho}${erro || Object.keys(extra).length ? '?' + new URLSearchParams({ ...(erro ? { erro } : {}), ...extra }) : ''}`);
      if (formulario === 'entrar-cpf') {
        if (soDigitos(d.cpf) !== soDigitos(CPF_TREINO)) { ir('/conta', 'cpf', { cpf: d.cpf }); return; }
        if (!conta) { ir('/conta', 'semConta', { cpf: d.cpf }); return; }
        ir('/conta-senha', null, { cpf: CPF_TREINO });
        return;
      }
      if (formulario === 'entrar-senha') {
        if (!conta || resumo(d.senha) !== conta.senha) { CE.emitir('gov:login-erro'); ir('/conta-senha', 'login', { cpf: CPF_TREINO }); return; }
        logado = true;
        CE.emitir('gov:login', { nivel: conta.nivel });
        ir('/painel');
        return;
      }
      if (formulario === 'criar') {
        cadastro = { cpf: d.cpf, nome: String(d.nome || '').trim(), nascimento: String(d.nascimento || '').trim(), celular: d.celular };
        const problema = soDigitos(d.cpf) !== soDigitos(CPF_TREINO) ? 'cpf'
          : cadastro.nome.split(/\s+/).length < 2 ? 'nome'
            : !/^\d{2}\/\d{2}\/\d{4}$/.test(cadastro.nascimento) ? 'nascimento'
              : soDigitos(d.celular).length < 10 ? 'celular'
                : !d.termos ? 'termos' : null;
        if (problema) { CE.emitir('gov:cadastro-erro', { campo: problema }); ir('/criar', problema); return; }
        cadastro.codigo = codigoNovo();
        CE.emitir('gov:cadastro-iniciado');
        ir('/criar-codigo');
        return;
      }
      if (formulario === 'codigo') {
        if (!cadastro || soDigitos(d.codigo) !== cadastro.codigo) { ir('/criar-codigo', 'codigo'); return; }
        cadastro.confirmado = true;
        CE.emitir('gov:codigo-confirmado');
        ir('/criar-senha');
        return;
      }
      if (formulario === 'criar-senha') {
        if (!senhaForte(d.senha || '')) { ir('/criar-senha', 'senha'); return; }
        if (d.senha !== d.senha2) { ir('/criar-senha', 'senha2'); return; }
        conta = { nome: cadastro.nome, nascimento: cadastro.nascimento, celular: soDigitos(cadastro.celular), nivel: 'bronze', senha: resumo(d.senha), criadaEm: Date.now() };
        cadastro = null;
        logado = true;
        guardar();
        CE.comemorar('pequena');
        CE.emitir('gov:conta-criada', { nivel: 'bronze' });
        CE.emitir('gov:login', { nivel: 'bronze' });
        ir('/painel');
        return;
      }
      if (formulario === 'recuperar') {
        if (!recuperar || soDigitos(d.codigo) !== recuperar.codigo) { ir('/recuperar', 'codigo'); return; }
        if (!senhaForte(d.senha || '')) { ir('/recuperar', 'senha'); return; }
        if (d.senha !== d.senha2) { ir('/recuperar', 'senha2'); return; }
        conta = { ...conta, senha: resumo(d.senha) };
        recuperar = null;
        guardar();
        CE.avisar('🔑 Senha trocada! Agora entre com a senha nova.');
        CE.emitir('gov:senha-trocada');
        ir('/conta');
        return;
      }
      if (formulario === 'valores') {
        if (String(d.chave || '').trim().length < 5) { CE.avisar('Digite uma chave Pix: CPF, celular ou e-mail.'); return; }
        conta = { ...conta, valoresPedidos: String(d.chave).trim().slice(0, 60) };
        guardar();
        CE.emitir('gov:valores-pedido');
        ir('/valores');
        return;
      }
      if (original.enviar) original.enviar(formulario, d, ctx);
    },
  };

  // ---------- Banco Escola: autorizar o Cidadão Digital (sobe a conta para prata) ----------
  const banco = CE.SITES['bancoescola.com.br'];
  CE.SITES['bancoescola.com.br'] = {
    ...banco,
    abrir(ctx) {
      if (ctx.caminho !== '/autorizar') return banco.abrir(ctx);
      return {
        titulo: 'Autorizar Cidadão Digital – Banco Escola',
        conteudo: `<header class="bc-cabecalho"><span class="bc-logo">🏦 Banco Escola</span><span>Autorização de serviço</span></header>
          <div class="bc-pagina bc-login"><form class="bc-form" data-formulario="autorizar"><h1>Autorizar o Cidadão Digital</h1>
            <p>O <b>Cidadão Digital</b> pediu para o banco confirmar que você é você. Entre na sua conta para autorizar.</p>
            ${ctx.busca && ctx.busca.erro ? '<p class="bc-erro">❌ Agência, conta ou senha incorretas.</p>' : ''}
            <label>Agência <input name="agencia" inputmode="numeric" autocomplete="off"></label>
            <label>Conta <input name="conta" autocomplete="off"></label>
            <label>Senha <input name="senha" type="password" autocomplete="off"></label>
            <button class="bc-botao" type="submit">Autorizar</button></form>
            <aside class="bc-lado"><div class="bc-treino"><b>🎓 Conta de treino</b><br>Agência: <b>${CE.BANCO_TREINO.agencia}</b><br>Conta: <b>${CE.BANCO_TREINO.conta}</b><br>Senha: <b>${CE.BANCO_TREINO.senha}</b></div>
            <div class="bc-dicas"><b>🔒 Confira</b><ul><li>O endereço é <b>bancoescola.com.br</b>, com o cadeado.</li><li>A senha do banco só se digita no site do banco.</li></ul></div></aside></div>`,
      };
    },
    enviar(formulario, d, ctx) {
      if (formulario !== 'autorizar') { banco.enviar(formulario, d, ctx); return; }
      const t = CE.BANCO_TREINO;
      if (soDigitos(d.agencia) !== soDigitos(t.agencia) || soDigitos(d.conta) !== soDigitos(t.conta) || d.senha !== t.senha) { ctx.ir('bancoescola.com.br/autorizar?erro=1'); return; }
      if (!conta) { CE.avisar('Crie a sua Conta Cidadão primeiro.'); ctx.ir(`${DOMINIO}/criar`); return; }
      conta = { ...conta, nivel: 'prata' };
      logado = true;
      guardar();
      CE.comemorar('pequena');
      CE.avisar('🥈 Pronto! Sua Conta Cidadão agora é PRATA.');
      CE.emitir('gov:nivel', { nivel: 'prata', como: 'banco' });
      ctx.ir(`${DOMINIO}/painel`);
    },
  };

  // ---------- Site FALSO de "valores esquecidos" (golpe de treino) ----------
  CE.SITES['cidadaodigital-valores.com'] = {
    dominio: 'cidadaodigital-valores.com', nome: 'Cidadão Digital (FALSO)', icone: '🏛️', seguro: false, golpe: true,
    abrir({ caminho }) {
      if (caminho === '/alerta') {
        return { titulo: 'Atenção: golpe!', conteudo: `<div class="golpe-alerta"><h1>⚠️ Cuidado! Isto era um GOLPE (de treino)</h1>
          <p>Este site imitava o Cidadão Digital, mas o endereço era <b>cidadaodigital-valores.com</b>, e não <b>${DOMINIO}</b>. Na vida real, o site do governo sempre termina com <b>.gov.br</b>.</p>
          <h2>Como perceber:</h2><ul><li>📱 Chegou por SMS ou WhatsApp, com link. O governo não manda link assim.</li><li>⏰ Tinha <b>pressa</b>: "só até hoje".</li>
          <li>💸 Cobrava <b>taxa</b> para liberar o dinheiro. O serviço verdadeiro é grátis.</li><li>🔑 Pedia a senha da conta. Senha só se digita no site oficial.</li><li>🔓 A barra de endereço mostrava <b>"Não seguro"</b>.</li></ul>
          <p><b>Se caiu de verdade:</b> troque a senha da conta na hora, avise o seu banco e faça um boletim de ocorrência.</p>${link('inicio', '🏠 Voltar para a página inicial', 'class="golpe-voltar"')}</div>` };
      }
      return { titulo: 'Cidadão Digital – VALORES ESQUECIDOS', conteudo: `<header class="cd-cabecalho falso"><span>🏛️ Cidadão Digital</span><span>Resgate de valores</span></header>
        <div class="cd-pagina gv-golpe"><h1>🎉 Você tem <span class="gv-valor-golpe">R$ 1.250,00</span> para receber!</h1>
        <p class="bc-erro">⏰ Resgate até HOJE às 23h59 ou o valor volta para o governo!</p>
        <form class="cd-form" data-formulario="resgatar"><label>CPF <input name="cpf" autocomplete="off"></label>
          <label>Senha da sua Conta Cidadão <input name="senha" type="password" autocomplete="off"></label>
          <p>Para liberar, pague a <b>taxa de liberação de R$ 49,90</b> por Pix na próxima tela.</p>
          <button class="cd-botao" type="submit">RESGATAR AGORA</button></form></div>` };
    },
    enviar(_f, _d, ctx) { ctx.caiuNoGolpe(); ctx.ir('cidadaodigital-valores.com/alerta'); },
  };

  CE.INDICE_BUSCA.push(
    { url: `${DOMINIO}/conta`, titulo: 'Conta Cidadão – entrar nos serviços públicos', descricao: 'Uma conta só para Carteira de Trabalho, INSS, CPF e mais (treino da conta gov.br).', palavras: 'gov govbr gov.br conta cidadao entrar login cpf senha governo' },
    { url: `${DOMINIO}/carteira`, titulo: 'Carteira de Trabalho Digital – Cidadão Digital', descricao: 'Veja os seus empregos com carteira assinada e baixe a carteira.', palavras: 'carteira de trabalho digital ctps emprego contrato' },
    { url: `${DOMINIO}/inss`, titulo: 'INSS: extrato de contribuições – Cidadão Digital', descricao: 'Tempo de contribuição e simulação de aposentadoria.', palavras: 'inss aposentadoria extrato cnis contribuicao meu inss' },
    { url: `${DOMINIO}/valores`, titulo: 'Valores a receber – Cidadão Digital', descricao: 'Consulte dinheiro esquecido em bancos. Serviço gratuito.', palavras: 'valores a receber dinheiro esquecido banco' },
  );
})();
