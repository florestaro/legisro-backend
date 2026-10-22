// Nível 1 — Módulo: Internet (navegador, endereços, pesquisa, abas, compras e golpes).
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela } = CE.L;
  const nav = (seletor) => naJanela('navegador', seletor);

  // Garante que o navegador mostre a página inicial (abre uma aba nova se ele já estiver aberto).
  const naPaginaInicial = () => { if (CE.janelas.estaAberta('navegador')) CE.janelas.abrir('navegador', { url: 'inicio' }); };
  const abrirNavegador = () => abrir('navegador', 'Navegador', { preparar: naPaginaInicial });

  const visitar = (texto, teste, extra = {}) => esperar(texto, 'navegador:visitou', teste, { mouse: 'esquerdo', ...extra });
  const digitarEndereco = (endereco, texto) => visitar(texto || `Clique na barra de endereço lá em cima, apague o que tiver, escreva ${endereco} e aperte Enter.`,
    (d) => d.dominio === endereco, { destacar: nav('.nav-endereco-caixa'), mouse: 'esquerdo', dica: 'Escreva com os pontos, sem espaços. Depois aperte a tecla Enter.' });
  const semAcento = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  CE.adicionarModulo({
    id: 'n1-internet', nivel: 'n1', titulo: 'Internet', icone: '🌐',
    licoes: [
      {
        id: 'net-o-que-e', titulo: 'O que é a internet e o navegador', icone: '🌐',
        descricao: 'Abrir o navegador, clicar em links, voltar e ir para o início.',
        passos: [
          info('A internet é uma rede que liga computadores e celulares do mundo todo. Para visitar sites, usamos um programa chamado NAVEGADOR. Os sites daqui são de treino: funcionam sem internet e você pode explorar sem medo.', { emoji: '🌐' }),
          abrirNavegador(),
          info('Lá em cima fica a BARRA DE ENDEREÇO. Ela mostra em qual site você está, como o endereço de uma casa.', { destacar: nav('.nav-endereco-caixa') }),
          visitar('Na página inicial tem atalhos para alguns sites. Clique no atalho "Saber Livre", uma enciclopédia.', (d) => d.dominio === 'saberlivre.org', { destacar: nav('[data-atalho="saberlivre.org"]') }),
          visitar('Os textos azuis são LINKS: quando a setinha vira uma mãozinha, dá para clicar. Clique no artigo "Internet".', (d) => d.caminho === '/artigo/internet', { destacar: nav('[data-artigo="internet"]') }),
          esperar('Leia um pouco. Para voltar para a página anterior, clique na seta VOLTAR (←), no canto de cima à esquerda.', 'navegador:voltou', null, { destacar: nav('[data-acao="voltar"]'), mouse: 'esquerdo' }),
          esperar('Agora clique na casinha (🏠) para ir para a página inicial.', 'navegador:inicio', null, { destacar: nav('[data-acao="inicio"]'), mouse: 'esquerdo' }),
          quiz('Que programa usamos para visitar sites?', ['O navegador', 'A Calculadora', 'O Desenho'], 0),
          quiz('Quando a setinha do mouse vira uma mãozinha (👆), quer dizer que...', ['Ali tem um link para clicar', 'O computador travou', 'Preciso apertar Enter'], 0),
          quiz('O botão com a seta para a esquerda (←) serve para...', ['Voltar para a página anterior', 'Fechar o navegador', 'Imprimir'], 0),
          fechar('navegador', 'Navegador'),
        ],
        conclusao: 'Parabéns! Você deu os primeiros passos na internet.',
      },
      {
        id: 'net-endereco', titulo: 'Digitando um endereço', icone: '⌨️',
        descricao: 'Ir direto para um site pela barra de endereço e rolar a página.',
        passos: [
          info('Todo site tem um ENDEREÇO, como cozinhafacil.com.br. O ".com.br" quer dizer que é um site do Brasil. Vamos digitar um endereço!', { emoji: '🏠' }),
          abrirNavegador(),
          digitarEndereco('cozinhafacil.com.br'),
          visitar('Você chegou no site de receitas! Clique na receita "Bolo de cenoura".', (d) => d.caminho === '/receita/bolo-de-cenoura', { destacar: nav('[data-receita="bolo-de-cenoura"]') }),
          esperar('A receita é comprida. Gire a RODINHA do mouse para baixo até chegar no fim da receita.', 'navegador:rolou-fim', null, { mouse: 'roda', destacar: nav('.nav-pagina') }),
          visitar('E se a gente errar o endereço? Escreva na barra de endereço, de propósito: cozinhafacio.com.br  (com "o" no final) e aperte Enter.', (d) => d.dominio === 'cozinhafacio.com.br', { destacar: nav('.nav-endereco-caixa') }),
          visitar('O site não foi encontrado, porque uma letra estava errada. Clique na sugestão do endereço certo, em "Você quis dizer".', (d) => d.dominio === 'cozinhafacil.com.br', { destacar: nav('[data-sugestao]') }),
          quiz('Digitei o endereço e apareceu "site não encontrado". O que faço?', ['Confiro se digitei certinho, letra por letra', 'Desligo o computador', 'Desisto da internet'], 0),
          quiz('Depois de escrever o endereço na barra, eu aperto...', ['Enter', 'Esc', 'Caps Lock'], 0),
          fechar('navegador', 'Navegador'),
        ],
        conclusao: 'Muito bem! Agora você sabe ir direto para um site pelo endereço.',
      },
      {
        id: 'net-pesquisa', titulo: 'Pesquisando na internet', icone: '🔍',
        descricao: 'Usar um buscador para achar receitas e informações.',
        passos: [
          info('Quando não sabemos o endereço, usamos um BUSCADOR: escrevemos o que queremos e ele mostra uma lista de sites. O nosso buscador de treino se chama "Procura".', { emoji: '🔍' }),
          abrirNavegador(),
          esperar('Clique na caixa de pesquisa no meio da página, escreva: bolo de cenoura   e aperte Enter.', 'navegador:pesquisa', (d) => /bolo/i.test(d.termo), {
            destacar: nav('.pr-campo'), mouse: 'esquerdo', dica: 'Clique dentro da caixa comprida antes de escrever.',
          }),
          visitar('Estes são os RESULTADOS. Clique no título azul do resultado do "Cozinha Fácil".', (d) => d.dominio === 'cozinhafacil.com.br', { destacar: nav('[data-resultado^="cozinhafacil.com.br"]') }),
          esperar('Achou a receita! Agora volte para os resultados com a seta Voltar (←).', 'navegador:voltou', null, { destacar: nav('[data-acao="voltar"]'), mouse: 'esquerdo' }),
          esperar('Vamos pesquisar outra coisa. Apague o que está na caixa de pesquisa, escreva: capital de Rondônia   e aperte Enter.', 'navegador:pesquisa', (d) => /rond/i.test(semAcento(d.termo)), { destacar: nav('.pr-campo') }),
          visitar('Clique num resultado do "Saber Livre" para ler sobre o assunto.', (d) => d.dominio === 'saberlivre.org', { destacar: nav('[data-resultado^="saberlivre.org"]') }),
          quiz('Segundo o Saber Livre, qual é a capital de Rondônia?', ['Ji-Paraná', 'Porto Velho', 'Vilhena'], 1),
          esperar('Um truque: dá para pesquisar direto na BARRA DE ENDEREÇO. Clique nela, escreva: vacina   e aperte Enter.', 'navegador:pesquisa', (d) => d.onde === 'barra' && /vacina/i.test(d.termo), { destacar: nav('.nav-endereco-caixa'), mouse: 'esquerdo' }),
          quiz('Não sei o endereço do site. Como encontro o que quero?', ['Pesquiso num buscador', 'Adivinho um endereço qualquer', 'Não tem como'], 0),
          quiz('Para pesquisar melhor, eu escrevo...', ['Poucas palavras importantes, como "bolo de cenoura"', 'Uma carta enorme', 'Só uma letra'], 0),
          fechar('navegador', 'Navegador'),
        ],
        conclusao: 'Excelente! Pesquisar é a forma mais usada para achar qualquer coisa na internet.',
      },
      {
        id: 'net-abas', titulo: 'Abas e favoritos', icone: '⭐',
        descricao: 'Abrir várias páginas ao mesmo tempo e guardar sites preferidos.',
        passos: [
          info('As ABAS deixam várias páginas abertas ao mesmo tempo, uma ao lado da outra, lá em cima. E os FAVORITOS guardam os sites que você mais usa.', { emoji: '🗂️' }),
          abrirNavegador(),
          esperar('Clique no botão + lá em cima, ao lado das abas, para abrir uma NOVA ABA.', 'navegador:aba-nova', null, { destacar: nav('[data-acao="nova-aba"]'), mouse: 'esquerdo' }),
          visitar('Na aba nova, clique no atalho "Jornal do Bairro".', (d) => d.dominio === 'jornaldobairro.com.br', { destacar: nav('[data-atalho="jornaldobairro.com.br"]') }),
          visitar('Clique numa notícia para ler.', (d) => d.caminho.startsWith('/noticia/'), { destacar: nav('[data-noticia]') }),
          esperar('Gostou do jornal? Clique na estrela (☆), no fim da barra de endereço, para guardar nos favoritos.', 'navegador:favorito', null, { destacar: nav('[data-acao="favoritar"]'), mouse: 'esquerdo' }),
          esperar('Outro jeito de abrir uma aba, muito usado: volte (←) para a lista de notícias, clique com o botão DIREITO em outra notícia e escolha "Abrir link em uma nova aba".', 'navegador:link', (d) => d.novaAba, {
            destacar: ['.mc-menu [data-opcao="nova-aba"]', nav('[data-noticia]'), nav('[data-acao="voltar"]')], mouse: 'direito', dica: 'Botão da DIREITA em cima do título de uma notícia › "Abrir link em uma nova aba".',
          }),
          esperar('Veja: a página foi para a barra de favoritos, embaixo da barra de endereço. Agora clique na PRIMEIRA aba, lá em cima à esquerda, para trocar de página.', 'navegador:aba-trocada', null, { destacar: nav('.nav-aba[data-aba="0"]'), mouse: 'esquerdo' }),
          esperar('Para fechar uma aba, clique no ✕ dela. Feche uma das abas.', 'navegador:aba-fechada', null, { destacar: nav('.nav-aba-fechar'), mouse: 'esquerdo' }),
          quiz('Para abrir uma nova aba, eu clico...', ['No botão + ao lado das abas', 'No X vermelho da janela', 'No relógio'], 0),
          quiz('Para abrir um link numa aba nova, sem sair da página, eu...', ['Clico nele com o botão direito e escolho "Abrir link em uma nova aba"', 'Desligo o computador', 'Aperto o Esc'], 0),
          quiz('Para guardar um site que uso sempre, eu...', ['Adiciono aos favoritos (☆)', 'Anoto num papel colado na tela', 'Desligo o computador'], 0),
          fechar('navegador', 'Navegador'),
        ],
        conclusao: 'Muito bem! Abas e favoritos deixam a internet muito mais prática.',
      },
      {
        id: 'net-loja', titulo: 'Comprando com segurança', icone: '🛍️',
        descricao: 'Reconhecer uma loja segura e fazer uma compra de treino.',
        passos: [
          info('Antes de comprar pela internet, confira os sinais de uma loja séria: 🔒 cadeado na barra de endereço, endereço conhecido, CNPJ e telefone de contato, e preços normais.', { emoji: '🛍️' }),
          abrirNavegador(),
          digitarEndereco('compracerta.com.br'),
          info('Veja o CADEADO 🔒 do lado do endereço: quer dizer que a conexão é segura. Lá embaixo da página tem CNPJ e telefone. Bons sinais!', { destacar: nav('.nav-cadeado') }),
          visitar('Clique no produto "Fone de ouvido com microfone".', (d) => d.caminho === '/produto/fone', { destacar: nav('[data-produto="fone"]') }),
          esperar('Clique em "Adicionar ao carrinho". O carrinho é como o carrinho do supermercado.', 'loja:carrinho', null, { destacar: nav('[data-site-acao="adicionar"]'), mouse: 'esquerdo' }),
          visitar('O fone está no carrinho! Clique em "Finalizar compra".', (d) => d.caminho === '/finalizar', { destacar: nav('[data-finalizar]') }),
          esperar('Preencha o formulário com dados INVENTADOS (é treino!), escolha Pix ou Boleto e clique em "Confirmar pedido". Dica: clique em cada caixa antes de escrever.', 'loja:compra', null, {
            destacar: nav('.cc-form'), mouse: 'esquerdo', dica: 'Todos os campos precisam ser preenchidos e uma forma de pagamento precisa ser marcada.',
          }),
          quiz('Qual destes é um sinal de site SEGURO?', ['O cadeado 🔒 na barra de endereço', 'Escrito "Não seguro"', 'Preço muito abaixo do normal'], 0),
          quiz('Uma loja séria pede a SENHA do seu cartão?', ['Nunca', 'Sempre', 'Só em promoções'], 0),
          fechar('navegador', 'Navegador'),
        ],
        conclusao: 'Parabéns! Você fez a sua primeira compra de treino com segurança.',
      },
      {
        id: 'net-golpes', titulo: 'Sites falsos e golpes na internet', icone: '🎣',
        descricao: 'Reconhecer anúncios, lojas falsas e prêmios de mentira.',
        passos: [
          info('Na internet também existem sites FALSOS, feitos para roubar dados e dinheiro. Vamos ver alguns de treino, sem perigo nenhum, e aprender a reconhecer.', { emoji: '🎣' }),
          abrirNavegador(),
          digitarEndereco('jornaldobairro.com.br'),
          visitar('Viu o anúncio amarelo piscando à direita, com celular por R$ 99? Clique nele para ver para onde ele leva (aqui é seguro, é treino).', (d) => d.dominio === 'megaofertas-barato.net', { destacar: nav('[data-anuncio="megaofertas"]') }),
          info('Olhe com atenção: a barra de endereço diz "⚠️ Não seguro", o endereço é estranho ("barato.net"), os preços são impossíveis e tem pressa ("acaba em 04:59"). TUDO isso é sinal de golpe!', { destacar: nav('.nav-cadeado') }),
          quiz('Este site da Mega Ofertas é confiável?', ['Sim, os preços são ótimos', 'Não: tem vários sinais de golpe', 'Só se pagar rápido'], 1),
          esperar('Saia deste site sem comprar nada: clique na seta Voltar (←).', ['golpe:evitado', 'golpe:caiu'], (d) => d.site === 'megaofertas-barato.net', { destacar: nav('[data-acao="voltar"]'), mouse: 'esquerdo' }),
          visitar('Agora clique no anúncio roxo "Você foi sorteado!".', (d) => d.dominio === 'ganhe-premio-agora.net', { destacar: nav('[data-anuncio="premio"]') }),
          info('"Parabéns, você ganhou!" Mas você não participou de sorteio nenhum. E ainda pedem uma "taxa" e seus dados. É golpe! O botão verde grande é a armadilha.'),
          esperar('Não clique no botão verde! Clique no linkzinho "Não, obrigado", lá embaixo, ou volte com a seta (←).', ['golpe:evitado', 'golpe:caiu'], (d) => d.site === 'ganhe-premio-agora.net', { destacar: nav('[data-nao-obrigado]'), mouse: 'esquerdo' }),
          quiz('Apareceu "Você ganhou um prêmio, resgate em 5 minutos". O que faço?', ['Resgato rápido', 'Fecho a página: é golpe', 'Mando meus dados para garantir'], 1),
          quiz('Qual destes é sinal de site FALSO?', ['Preço bom demais e pressa', 'Cadeado e CNPJ no rodapé', 'Endereço conhecido'], 0),
          quiz('Um site pede a senha do cartão e o código de trás dele. Você...', ['Não digita e sai do site', 'Digita para ganhar desconto', 'Digita só a senha'], 0),
          fechar('navegador', 'Navegador'),
        ],
        conclusao: 'Excelente! Agora você reconhece sites falsos. Lembre: desconfiar é se proteger.',
      },
      {
        id: 'net-desafio', titulo: 'Desafio da internet', icone: '🏅', desafio: true,
        descricao: 'Pesquisar, abrir, favoritar e ler sozinho.',
        passos: [
          info('Desafio! Use o Navegador sozinho. Clique em "Continuar".'),
          esperar('Abra o Navegador e pesquise: pão de queijo', 'navegador:pesquisa', (d) => /queijo/i.test(d.termo)),
          esperar('Abra a receita de pão de queijo do Cozinha Fácil.', 'navegador:visitou', (d) => d.caminho === '/receita/pao-de-queijo'),
          esperar('Adicione a receita aos favoritos.', 'navegador:favorito', (d) => d.caminho === '/receita/pao-de-queijo'),
          esperar('Agora descubra no Saber Livre quantos planetas tem o Sistema Solar: abra o artigo sobre o Sistema Solar.', 'navegador:visitou', (d) => d.caminho === '/artigo/sistema-solar'),
          quiz('Quantos planetas tem o Sistema Solar?', ['Cinco', 'Oito', 'Doze'], 1),
        ],
        conclusao: 'Desafio vencido! Você navega na internet com autonomia. 🌐',
      },
    ],
  });
})();
