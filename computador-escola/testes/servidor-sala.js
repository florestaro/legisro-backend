// Testes do servidor da sala de aula (sem tela, só Node): sessões, limites de senha, e-mail, aulas e gravação segura.
//   npm run teste:servidor
// Usa uma pasta de dados temporária e a porta 47199 (mude com PORTA_TESTE).
const fs = require('fs'); const os = require('os'); const path = require('path');
const APP = path.join(__dirname, '..');
const PORTA = Number(process.env.PORTA_TESTE || 47199);
const PASTA = fs.mkdtempSync(path.join(os.tmpdir(), 'computador-escola-teste-servidor-'));
fs.writeFileSync(path.join(PASTA, 'sala.json'), JSON.stringify({ modo: 'servidor', codigo: '135790', porta: PORTA }));
const dados = require(APP + '/src/armazenamento'); dados.iniciar(PASTA);
const { criarCanais } = require(APP + '/src/canais');
const { criarSala } = require(APP + '/src/sala');
let falhas = 0; const ok = (c, m) => { console.log((c ? '✔ ' : '✘ ') + m); if (!c) falhas++; };
const URL = `http://127.0.0.1:${PORTA}/api`;
const pedir = async (canal, args = [], token = null, codigo = '135790') => {
  const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-sala': codigo }, body: JSON.stringify({ canal, args, token }) });
  return { status: r.status, ...(await r.json()) };
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let sala = criarSala({ pastaDados: PASTA, canais: criarCanais(dados) }); sala.iniciar(); await espera(300);
  const prof = await pedir('usuarios:primeiro-instrutor', [{ nome: 'Prof', segredo: '1234' }]); const tp = prof.token;
  const alunos = [];
  for (const nome of ['Ana', 'Bia', 'Caio', 'Duda']) alunos.push((await pedir('usuarios:criar', [{ nome, segredo: '1111' }], tp)).valor);
  const [ana, bia, caio, duda] = alunos;
  const entrar = async (u, senha = '1111', token = null) => pedir('sessao:entrar', [u.id, senha], token);

  // 1) Reinício do programa do instrutor: as sessões continuam
  const sAna = await entrar(ana); const tAna = sAna.token;
  await pedir('dados:salvar', ['progresso:' + ana.id, { licoes: { a: { concluida: true } } }], tAna);
  sala.parar(); await espera(200);
  sala = criarSala({ pastaDados: PASTA, canais: criarCanais(dados) }); sala.iniciar(); await espera(300);
  const depois = await pedir('dados:ler', ['progresso:' + ana.id, {}], tAna);
  ok(depois.ok && depois.valor.licoes.a.concluida, 'instrutor fechou e abriu o programa: a Ana continua dentro e lê o progresso');
  const gravouDepois = await pedir('dados:salvar', ['progresso:' + ana.id, { licoes: { a: { concluida: true }, b: { concluida: true } } }], tAna);
  ok(gravouDepois.ok, 'e continua gravando');

  // 2) Mesmo aluno em outro computador: o primeiro sai e recebe o motivo
  const sAna2 = await entrar(ana); const tAna2 = sAna2.token;
  const velho = await pedir('dados:ler', ['progresso:' + ana.id, {}], tAna);
  ok(!velho.ok && velho.semSessao && /outro computador/.test(velho.erro), 'Ana entrou em outro computador: o primeiro sai da conta — "' + velho.erro + '"');
  ok((await pedir('dados:ler', ['progresso:' + ana.id, {}], tAna2)).ok, 'o computador novo continua funcionando');
  // instrutor pode estar em dois computadores
  const tp2 = (await pedir('sessao:entrar', [prof.valor.id, '1234'])).token;
  ok((await pedir('usuarios:listar', [], tp)).ok && (await pedir('sala:turma', [], tp)).ok && (await pedir('sala:turma', [], tp2)).ok, 'o instrutor pode estar em dois computadores ao mesmo tempo');

  // 3) Aluno removido
  const tDuda = (await entrar(duda)).token;
  await pedir('usuarios:remover', [duda.id], tp);
  const removido = await pedir('dados:ler', ['progresso:' + duda.id, {}], tDuda);
  ok(!removido.ok && removido.semSessao && /removida/.test(removido.erro), 'aluno removido pelo instrutor sai na hora — "' + removido.erro + '"');

  const tCaio = (await entrar(caio)).token;
  // 4) Limite de senhas erradas com pedidos em paralelo
  const erradas = await Promise.all(Array.from({ length: 20 }, () => entrar(bia, 'errada')));
  const conferidas = erradas.filter((r) => /incorreta/.test(r.erro)).length, barradas = erradas.filter((r) => /Muitas tentativas/.test(r.erro)).length;
  ok(conferidas <= 8 && barradas >= 12, `20 senhas erradas ao mesmo tempo: ${conferidas} conferidas, ${barradas} barradas pelo limite`);
  const certaDepois = await entrar(bia);
  ok(!certaDepois.ok && /Muitas tentativas/.test(certaDepois.erro), 'depois do limite, até a senha certa espera um minuto');
  // Vários computadores saindo pelo mesmo endereço: a turma inteira entrando junta não é barrada.
  const turma = [];
  for (let k = 0; k < 20; k++) turma.push((await pedir('usuarios:criar', [{ nome: 'Turma ' + k, segredo: '1111' }], tp)).valor);
  const juntos = await Promise.all(turma.map((u) => entrar(u)));
  ok(juntos.every((r) => r.ok), `20 alunos entrando ao mesmo tempo pelo mesmo endereço: ${juntos.filter((r) => r.ok).length} entraram`);
  const outraConta = await entrar(caio, 'errada');
  ok(/incorreta/.test(outraConta.erro), 'o limite da Bia não bloqueia a senha do Caio');

  // 5) Pedido grande demais: resposta com explicação
  const grande = await pedir('dados:salvar', ['arquivos:' + ana.id, [{ conteudo: 'x'.repeat(26 * 1024 * 1024) }]], tAna2);
  ok(grande.status === 413 && /grande demais/.test(grande.erro) && /Lixeira/.test(grande.erro), 'mais de 25 MB: resposta 413 explicando o que fazer');

  // 6) E-mail: mesmo endereço ao mesmo tempo
  const [r1, r2] = await Promise.all([
    pedir('dados:salvar', ['email:' + ana.id, { conta: { endereco: 'turma@correio.escola', nome: 'Ana' }, mensagens: [] }], tAna2),
    pedir('dados:salvar', ['email:' + caio.id, { conta: { endereco: 'turma@correio.escola', nome: 'Caio' }, mensagens: [] }], tCaio),
  ]);
  ok([r1, r2].filter((r) => r.ok).length === 1 && /em uso/.test((r1.ok ? r2 : r1).erro), 'duas pessoas pedindo o mesmo endereço ao mesmo tempo: só uma fica com ele');
  const quemFicou = r1.ok ? ana : caio, outro = r1.ok ? caio : ana, tQuem = r1.ok ? tAna2 : tCaio, tOutro = r1.ok ? tCaio : tAna2;
  await pedir('dados:salvar', ['email:' + outro.id, { conta: { endereco: 'outro@correio.escola', nome: outro.nome }, mensagens: [] }], tOutro);
  const contatos = (await pedir('email:contatos', [], tOutro)).valor;
  ok(contatos.length === 1 && contatos[0].endereco === 'turma@correio.escola', 'contatos vêm do índice de endereços: ' + JSON.stringify(contatos));

  // 7) Mensagem chegando enquanto o dono grava a caixa (cópia antiga)
  const antiga = (await pedir('dados:ler', ['email:' + quemFicou.id, {}], tQuem)).valor;
  const ent = await pedir('email:entregar', [{ para: 'turma@correio.escola', assunto: 'Chegou no meio', texto: 'oi' }], tOutro);
  antiga.mensagens.push({ id: 'local1', pasta: 'enviados', assunto: 'minha', em: Date.now() });
  await pedir('dados:salvar', ['email:' + quemFicou.id, antiga], tQuem);
  const final = (await pedir('dados:ler', ['email:' + quemFicou.id, {}], tQuem)).valor;
  ok(ent.ok && ent.valor.entregue && final.mensagens.some((m) => m.assunto === 'Chegou no meio') && final.mensagens.some((m) => m.id === 'local1'), 'mensagem entregue durante a gravação não some (e a gravação também vale)');
  // 8) email:novas devolve só o que falta
  const novas = (await pedir('email:novas', [['local1']], tQuem)).valor;
  ok(novas.length === 1 && novas[0].assunto === 'Chegou no meio', 'email:novas devolve só as mensagens que a tela não tem');
  const forjada = await pedir('email:entregar', [{ para: 'turma@correio.escola', assunto: 'x', anexos: [{ nome: 'a', conteudo: 'y'.repeat(11 * 1024 * 1024) }] }], tOutro);
  ok(!forjada.ok && /10 MB/.test(forjada.erro), 'anexos acima de 10 MB são recusados com explicação');

  // Dois instrutores criando aulas ao mesmo tempo: nenhuma some
  const prof2 = (await pedir('usuarios:criar', [{ nome: 'Prof Dois', segredo: '4321', papel: 'instrutor' }], tp)).valor;
  const tp3 = (await pedir('sessao:entrar', [prof2.id, '4321'])).token;
  await Promise.all([
    pedir('aulas:gravar', [{ id: 'prof-a', titulo: 'Aula A', passos: [{ tipo: 'info', texto: 'a' }] }], tp),
    pedir('aulas:gravar', [{ id: 'prof-b', titulo: 'Aula B', passos: [{ tipo: 'info', texto: 'b' }] }], tp3),
  ]);
  await pedir('aulas:gravar', [{ id: 'prof-a', titulo: 'Aula A (editada)', passos: [{ tipo: 'info', texto: 'a2' }] }], tp);
  await pedir('aulas:apagar', ['prof-b'], tp3);
  await pedir('aulas:gravar', [{ id: 'prof-c', titulo: 'Aula C', passos: [{ tipo: 'info', texto: 'c' }] }], tp3);
  const aulas = (await pedir('aulas:listar', [], tAna2)).valor.map((x) => x.titulo);
  ok(JSON.stringify(aulas) === JSON.stringify(['Aula A (editada)', 'Aula C']), 'dois instrutores criando, editando e apagando aulas: nenhuma some — ' + aulas.join(', '));
  ok(/Apenas o instrutor/.test((await pedir('aulas:gravar', [{ id: 'x', titulo: 'x', passos: [] }], tAna2)).erro), 'aluno não grava aula');
  // 10) Senha trocada: as outras sessões daquela conta saem; quem trocou a própria continua
  const tIntruso = (await pedir('sessao:entrar', [prof2.id, '4321'])).token;
  ok((await pedir('usuarios:listar', [], tIntruso)).ok, 'alguém entrou com a senha do instrutor 2');
  await pedir('usuarios:trocar-senha', [prof2.id, 'nova99'], tp3);
  const intruso = await pedir('usuarios:criar', [{ nome: 'Invasor', segredo: '1111' }], tIntruso);
  ok(!intruso.ok && intruso.semSessao && /senha desta conta foi trocada/.test(intruso.erro), 'senha trocada: a sessão de quem pegou a senha acaba — "' + intruso.erro + '"');
  ok((await pedir('usuarios:listar', [], tp3)).ok, 'quem trocou a própria senha continua dentro');
  sala.parar(); await espera(200); sala = criarSala({ pastaDados: PASTA, canais: criarCanais(dados) }); sala.iniciar(); await espera(300);
  ok(!(await pedir('usuarios:listar', [], tIntruso)).ok || !(await pedir('sala:turma', [], tIntruso)).ok, 'e não volta depois de reabrir o programa');
  ok((await pedir('sala:turma', [], tp3)).ok, 'o instrutor que trocou a senha continua dentro depois de reabrir');
  // 11) Limite por computador com pedidos ao mesmo tempo em várias contas
  const contas30 = turma.slice(0, 10).concat(alunos.filter(Boolean).slice(0, 2));
  const rajada = await Promise.all(contas30.flatMap((u) => Array.from({ length: 8 }, () => pedir('sessao:entrar', [u.id, 'errada']))));
  const conferidasIp = rajada.filter((r) => /incorreta/.test(r.erro)).length;
  ok(conferidasIp <= 40, `${rajada.length} senhas erradas ao mesmo tempo em ${contas30.length} contas: só ${conferidasIp} conferidas (limite de 40 por computador)`);
  // 12) Caixa cheia: a entrega é recusada com explicação; apagar de vez libera espaço
  const tTurma0 = juntos[0].token, tTurma1 = juntos[1].token;
  await pedir('dados:salvar', ['email:' + turma[0].id, { conta: { endereco: 'cheia@correio.escola', nome: 'Turma 0' }, mensagens: [] }], tTurma0);
  await pedir('dados:salvar', ['email:' + turma[1].id, { conta: { endereco: 'manda@correio.escola', nome: 'Turma 1' }, mensagens: [] }], tTurma1);
  const anexo9 = [{ nome: 'grande.png', tipo: 'imagem', conteudo: 'z'.repeat(9 * 1024 * 1024) }];
  const entregas = [];
  for (let k = 0; k < 3; k++) entregas.push(await pedir('email:entregar', [{ para: 'cheia@correio.escola', assunto: 'Grande ' + k, anexos: anexo9 }], tTurma1));
  ok(entregas[0].ok && entregas[1].ok && !entregas[2].ok && /está cheia/.test(entregas[2].erro), 'caixa quase cheia: a terceira entrega de 9 MB é recusada — "' + (entregas[2].erro || '') + '"');
  const cheia = (await pedir('dados:ler', ['email:' + turma[0].id, {}], tTurma0)).valor;
  const leve = { ...cheia, mensagens: [] }; // a tela apagou as duas de vez
  const apagou = await pedir('dados:salvar', ['email:' + turma[0].id, { ...leve, apagadas: cheia.mensagens.map((m) => m.id) }], tTurma0);
  const depoisApagar = (await pedir('dados:ler', ['email:' + turma[0].id, {}], tTurma0)).valor;
  ok(apagou.ok && depoisApagar.mensagens.length === 0 && !('apagadas' in depoisApagar), 'apagar de vez na Lixeira tira as mensagens da caixa no instrutor (e elas não voltam)');
  ok((await pedir('email:entregar', [{ para: 'cheia@correio.escola', assunto: 'Depois', anexos: anexo9 }], tTurma1)).ok, 'depois de apagar, a caixa volta a receber');
  // 13) Mensagem do instrutor nos dois formatos (computador de aluno com a versão anterior)
  await pedir('sala:mensagem', ['Atenção turma'], tp);
  const pres = (await pedir('sala:presenca', [{}], tTurma0)).valor;
  ok(Array.isArray(pres.mensagens) && pres.mensagens.length === 1 && pres.mensagem && pres.mensagem.texto === 'Atenção turma', 'presença devolve "mensagens" e também "mensagem" (versão anterior)');
  // 14) Dados antigos com endereço repetido: os dois continuam mandando e-mail
  fs.writeFileSync(path.join(PASTA, `email-${turma[2].id}.json`), JSON.stringify({ conta: { endereco: 'repetido@correio.escola', nome: 'Turma 2' }, mensagens: [] }));
  fs.writeFileSync(path.join(PASTA, `email-${turma[3].id}.json`), JSON.stringify({ conta: { endereco: 'repetido@correio.escola', nome: 'Turma 3' }, mensagens: [] }));
  sala.parar(); await espera(200); sala = criarSala({ pastaDados: PASTA, canais: criarCanais(dados) }); sala.iniciar(); await espera(300);
  const [e2, e3] = await Promise.all([juntos[2], juntos[3]].map((j) => pedir('email:entregar', [{ para: 'manda@correio.escola', assunto: 'oi' }], j.token)));
  ok(e2.ok && e3.ok && e2.valor.entregue && e3.valor.entregue, 'dois alunos com o mesmo endereço (dados antigos): os dois continuam mandando e-mail');
  // 15) Senha trocada enquanto a senha antiga era conferida: não entra
  const confAntiga = dados.entrar(turma[4].id, '1111');
  dados.trocarSenha(turma[4].id, 'outra1');
  const corrida = await confAntiga.then(() => 'entrou').catch((e) => e.message);
  ok(/incorreta/.test(corrida), 'senha trocada no meio da conferência: a senha antiga não entra — ' + corrida);
  // 16) Sessão guardada sem a versão da senha (versão anterior) também sai quando a senha é trocada
  const tVelha = (await pedir('sessao:entrar', [turma[5].id, '1111'])).token;
  sala.parar(); await espera(200);
  const arqS = path.join(PASTA, 'sala-sessoes.json');
  fs.writeFileSync(arqS, JSON.stringify(JSON.parse(fs.readFileSync(arqS, 'utf8')).map(([t, x]) => [t, t === tVelha ? { ...x, versaoSenha: undefined } : x])));
  sala = criarSala({ pastaDados: PASTA, canais: criarCanais(dados) }); sala.iniciar(); await espera(300);
  ok((await pedir('aulas:listar', [], tVelha)).ok, 'sessão guardada sem a versão da senha continua valendo depois de reabrir');
  await pedir('usuarios:trocar-senha', [turma[5].id, 'nova55'], tp);
  const velha = await pedir('aulas:listar', [], tVelha);
  ok(!velha.ok && /senha desta conta foi trocada/.test(velha.erro), 'e sai quando a senha é trocada');
  // 17) Trocar a própria senha fica guardado: reabrir o programa não põe a pessoa para fora
  await pedir('usuarios:trocar-senha', [prof.valor.id, 'prof99'], tp);
  sala.parar(); await espera(200); sala = criarSala({ pastaDados: PASTA, canais: criarCanais(dados) }); sala.iniciar(); await espera(300);
  ok((await pedir('sala:turma', [], tp)).ok, 'trocou a própria senha e o programa reabriu: continua dentro');
  // 18) Caixa não passa de 20 MB por gravação direta; diminuir sempre passa
  const tT6 = (await pedir('sessao:entrar', [turma[6].id, '1111'])).token;
  const grandeCaixa = { conta: { endereco: 'grande@correio.escola', nome: 'T6' }, mensagens: [{ id: 'g1', pasta: 'enviados', anexos: [{ conteudo: 'q'.repeat(21 * 1024 * 1024) }] }] };
  const recusada = await pedir('dados:salvar', ['email:' + turma[6].id, grandeCaixa], tT6);
  ok(!recusada.ok && /caixa de e-mail está cheia/.test(recusada.erro), 'gravar uma caixa acima de 20 MB é recusado com explicação');
  // 9) Arquivo de usuários estragado: usa a cópia de reserva
  const antes = dados.listarUsuarios().length;
  fs.writeFileSync(path.join(PASTA, 'usuarios.json'), '{ estragado');
  ok(dados.listarUsuarios().length === antes, `usuarios.json estragado: a cópia de reserva mantém as ${antes} contas`);
  await pedir('usuarios:criar', [{ nome: 'Eva', segredo: '1111' }], tp);
  ok(dados.listarUsuarios().length === antes + 1, 'um cadastro novo depois disso não apaga ninguém');
  const sobra = fs.readdirSync(PASTA).filter((f) => f.endsWith('.tmp'));
  ok(!sobra.length, 'nenhum .tmp esquecido');
  sala.parar();
  console.log('FALHAS', falhas);
  if (!falhas) fs.rmSync(PASTA, { recursive: true, force: true }); else console.log('Dados do teste em', PASTA);
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
