// Curso livre 🎨 Criação digital (abre depois do nível Intermediário): Editor de Fotos, Desenho Vetorial e Editor
// de Vídeo. Fazer posts, cartazes e vídeos curtos para divulgar um negócio, um evento ou a escola.
(function () {
  const { info, quiz, esperar, abrir, naJanela } = CE.L;
  const ft = (s) => naJanela('fotos', s), vt = (s) => naJanela('vetorial', s), vd = (s) => naJanela('video', s);
  const abrirExemplo = (id, nome) => esperar(`Clique em "📂 Abrir foto" e escolha, nas fotos de exemplo, "${nome}".`, 'fotos:aberta', (d) => d.exemplo === id, {
    destacar: [`.dialogo [data-exemplo="${id}"]`, ft('[data-comando="abrir"]')], mouse: 'esquerdo',
  });
  const salvarFoto = (nome, teste) => esperar(`Clique em "💾 Salvar" e use o nome "${nome}".`, 'fotos:salva', (d) => !teste || teste(d), { destacar: ft('[data-comando="salvar"]'), mouse: 'esquerdo' });

  // ======================= 🌅 Fotos =======================
  CE.adicionarModulo({
    id: 'cri-fotos', nivel: 'cri', titulo: 'Edição de fotos', icone: '🌅',
    licoes: [
      {
        id: 'cri-foto-ajustes', titulo: 'Clarear uma foto escura', icone: '☀️',
        descricao: 'Brilho e contraste: a foto ganha vida.',
        passos: [
          info('Bem-vindo ao curso livre CRIAÇÃO DIGITAL! Aqui você aprende a fazer fotos bonitas, cartazes e vídeos curtos para divulgar um negócio, um evento ou a escola. Começando pelo EDITOR DE FOTOS.', { emoji: '🎨' }),
          abrir('fotos', 'Editor de Fotos'),
          abrirExemplo('escura', 'Foto escura (Rio Madeira ao entardecer)'),
          esperar('A foto ficou escura. À direita, em "Ajustes", arraste o BRILHO para mais de 140%.', 'fotos:ajuste', (d) => d.tipo === 'brilho' && d.valor >= 140, { destacar: ft('[data-ajuste="brilho"]'), mouse: 'arrastar' }),
          esperar('Agora aumente um pouco o CONTRASTE (mais de 110%): as cores ficam mais firmes.', 'fotos:ajuste', (d) => d.tipo === 'contraste' && d.valor >= 110, { destacar: ft('[data-ajuste="contraste"]'), mouse: 'arrastar' }),
          info('Exagerou? O botão ↶ (desfazer) volta o último ajuste. O segredo é o meio-termo: foto clara, mas sem ficar "estourada" (branca demais).'),
          salvarFoto('Rio Madeira clareado', (d) => d.brilho > 100),
          quiz('A foto saiu escura. Eu aumento...', ['O brilho', 'O tamanho', 'O texto'], 0),
        ],
        conclusao: 'Foto escura salva! ☀️',
      },
      {
        id: 'cri-foto-cortar', titulo: 'Girar e cortar para o post', icone: '✂️',
        descricao: 'Foto em pé e no formato quadrado das redes sociais.',
        passos: [
          info('Foto de celular às vezes sai DEITADA. E as redes sociais usam muito o formato QUADRADO (1:1). Vamos arrumar as duas coisas.', { emoji: '✂️' }),
          abrir('fotos', 'Editor de Fotos'),
          abrirExemplo('deitada', 'Foto deitada (cachorro)'),
          esperar('O cachorro está de lado. Clique em "⟳ Girar" até ele ficar em pé.', 'fotos:girar', (d) => d.giro === 90, { destacar: ft('[data-comando="girar"]'), mouse: 'esquerdo' }),
          esperar('Agora clique em "✂️ Cortar" e escolha "Quadrado 1:1 (post de rede social)".', 'fotos:cortar', (d) => d.proporcao === '1:1', { destacar: ['.dialogo [data-corte="1:1"]', ft('[data-comando="cortar"]')], mouse: 'esquerdo' }),
          salvarFoto('Post do cachorro', (d) => d.corte === '1:1' && d.largura === d.altura),
          quiz('Para um post de rede social, o formato mais usado é...', ['Quadrado (1:1)', 'Bem comprido (10:1)'], 0),
        ],
        conclusao: 'Foto em pé e no formato certo! ✂️',
      },
      {
        id: 'cri-foto-texto', titulo: 'Texto e filtro para divulgar', icone: '🔤',
        descricao: 'Escrever o preço na foto e deixar as cores vivas.',
        passos: [
          info('Uma foto para divulgar precisa de uma informação clara: o QUE é e QUANTO custa. Vamos fazer a divulgação do almoço de um restaurante.', { emoji: '🔤' }),
          abrir('fotos', 'Editor de Fotos'),
          abrirExemplo('prato', 'Almoço'),
          esperar('Clique em "🔤 Texto", escreva  Almoço R$ 19,90 , escolha "Embaixo" e clique em "Colocar na foto".', 'fotos:texto', (d) => /19,90/.test(d.texto) && d.posicao === 'baixo', { destacar: [ '.dialogo [data-campo="texto-foto"]', ft('[data-comando="texto"]')], mouse: 'esquerdo' }),
          esperar('Em "Filtros", escolha "Vívido" para as cores ficarem mais fortes.', 'fotos:filtro', (d) => d.filtro === 'vivido', { destacar: ft('[data-filtro="vivido"]'), mouse: 'esquerdo' }),
          salvarFoto('Divulgação do almoço', (d) => d.textos >= 1),
          quiz('Num texto de divulgação, o mais importante é...', ['Ser curto e fácil de ler', 'Ter muitas letras pequenas'], 0),
        ],
        conclusao: 'Divulgação pronta para postar! 🔤',
      },
      {
        id: 'cri-foto-tamanho', titulo: 'Diminuir a foto para mandar', icone: '📐',
        descricao: 'Foto leve chega mais rápido.',
        passos: [
          info('Foto grande demais demora para mandar e enche o celular de quem recebe. Para e-mail, 800 pixels de largura já ficam ótimos. Repare na barra de baixo: ela mostra quantos KB a foto vai ter.', { emoji: '📐' }),
          abrir('fotos', 'Editor de Fotos'),
          abrirExemplo('flor', 'Flor'),
          esperar('À direita, em "📐 Tamanho", escolha "400 px (pequena)" e veja os KB diminuírem lá embaixo.', 'fotos:tamanho', (d) => d.largura === 400, { destacar: ft('[data-comando="tamanho"]'), mouse: 'esquerdo' }),
          salvarFoto('Flor pequena', (d) => d.largura === 400),
          abrir('email', 'E-mail'),
          esperar('Mande a foto "Flor pequena" por e-mail para professor@correio.escola (📎 Anexar).', 'email:enviado', (d) => d.para === 'professor@correio.escola' && (d.nomesAnexos || []).some((n) => /flor pequena/i.test(n)), {
            destacar: naJanela('email', '[data-acao="escrever"]'), mouse: 'esquerdo',
          }),
          quiz('Foto menor (menos pixels)...', ['Fica com o arquivo mais leve', 'Fica mais pesada'], 0),
        ],
        conclusao: 'Foto leve e enviada! 📐',
      },
      {
        id: 'cri-foto-direitos', titulo: 'Direito de imagem e cuidados ao postar', icone: '⚖️',
        descricao: 'Pedir autorização, usar imagens livres e proteger a privacidade.',
        passos: [
          info('Antes de postar, 3 cuidados: 1) FOTO DE PESSOA só com autorização (de criança, dos pais). 2) FOTO DA INTERNET tem dono: use bancos de imagens gratuitos ou as suas próprias fotos. 3) PRIVACIDADE: não poste documentos, endereço, placa do carro ou onde você está AGORA.', { emoji: '⚖️' }),
          quiz('Quero postar a foto de um aluno da turma na página da escola. Eu...', ['Peço autorização (dos pais, se for criança)', 'Posto sem perguntar'], 0),
          quiz('Achei uma foto linda no Google para o meu cartaz. Eu...', ['Uso uma imagem livre (de banco gratuito) ou faço a minha', 'Pego qualquer uma, a internet é de todos'], 0),
          quiz('Qual foto é PERIGOSA postar?', ['A do meu documento ou da frente da minha casa com o número', 'Um bolo que eu fiz'], 0),
          quiz('Postar "estou viajando, a casa está vazia" é...', ['Arriscado: avise só depois que voltar', 'Normal'], 0),
        ],
        conclusao: 'Criação com responsabilidade! ⚖️',
      },
    ],
  });

  // ======================= ✒️ Vetorial =======================
  CE.adicionarModulo({
    id: 'cri-vetor', nivel: 'cri', titulo: 'Desenho vetorial (cartazes e posts)', icone: '✒️',
    licoes: [
      {
        id: 'cri-vet-formas', titulo: 'Formas e cores', icone: '🔷',
        descricao: 'Desenhar retângulo e círculo, mudar a cor e mover.',
        passos: [
          info('No DESENHO VETORIAL (como o Canva), cada coisa é uma FORMA que você pode mudar a qualquer hora: cor, tamanho, lugar. É ótimo para cartazes, posts e logotipos.', { emoji: '✒️' }),
          abrir('vetorial', 'Desenho Vetorial'),
          esperar('Clique em "📄 Novo ▾" e escolha "Post quadrado (1080 × 1080)".', 'vetor:pagina', (d) => d.pagina === 'post', { destacar: ['.dialogo [data-pagina="post"]', vt('[data-comando="novo"]')], mouse: 'esquerdo' }),
          esperar('Na barra da esquerda, clique no RETÂNGULO (▭) e arraste na página para desenhar.', 'vetor:forma', (d) => d.tipo === 'ret', { destacar: vt('[data-ferramenta="ret"]'), mouse: 'arrastar' }),
          esperar('O retângulo está selecionado. À direita, mude a "Cor de dentro (preenchimento)".', 'vetor:propriedade', (d) => d.prop === 'preenchimento', { destacar: vt('[data-prop="preenchimento"]'), mouse: 'esquerdo' }),
          esperar('Agora a ELIPSE (◯): arraste para desenhar um círculo.', 'vetor:forma', (d) => d.tipo === 'elipse', { destacar: vt('[data-ferramenta="elipse"]'), mouse: 'arrastar' }),
          esperar('Com a seta ➚ (selecionar), segure o círculo e arraste para outro lugar.', 'vetor:movido', null, { destacar: vt('[data-ferramenta="selecionar"]'), mouse: 'arrastar' }),
          quiz('No desenho vetorial, depois de desenhar, eu ainda posso...', ['Mudar a cor, o tamanho e o lugar de cada forma', 'Nada: ficou para sempre'], 0),
        ],
        conclusao: 'Suas primeiras formas! 🔷',
      },
      {
        id: 'cri-vet-texto', titulo: 'Texto, camadas e alinhamento', icone: '🔠',
        descricao: 'Título centralizado e o que fica na frente ou atrás.',
        passos: [
          info('Agora o TEXTO. E as CAMADAS: quando uma forma fica por cima da outra, dá para escolher quem fica na FRENTE e quem fica ATRÁS.', { emoji: '🔠' }),
          abrir('vetorial', 'Desenho Vetorial'),
          esperar('Clique na ferramenta T (texto), clique na página e escreva  GRANDE PROMOÇÃO .', 'vetor:forma', (d) => d.tipo === 'texto' && /promo/i.test(d.texto), { destacar: vt('[data-ferramenta="texto"]'), mouse: 'esquerdo' }),
          esperar('À direita, mude o "Tamanho da letra" para 100 (ou mais).', 'vetor:propriedade', (d) => d.prop === 'tamanho' && d.valor >= 100, { destacar: vt('[data-prop="tamanho"]') }),
          esperar('Clique em "↔️ Centralizar" para o título ficar no meio da página.', 'vetor:alinhado', null, { destacar: vt('[data-vt-acao="centralizar"]'), mouse: 'esquerdo' }),
          esperar('Desenhe um retângulo POR CIMA do texto. Ele escondeu o texto? Com o retângulo selecionado, clique em "⬇️ Para trás".', 'vetor:ordem', (d) => d.acao === 'tras', { destacar: [vt('[data-vt-acao="tras"]'), vt('[data-ferramenta="ret"]')], mouse: 'esquerdo' }),
          esperar('Para fazer uma cópia de uma forma, clique em "🗐 Duplicar" (ou Ctrl+D).', 'vetor:duplicado', null, { destacar: vt('[data-vt-acao="duplicar"]'), mouse: 'esquerdo' }),
          quiz('A forma está escondendo o texto. Eu uso...', ['"Para trás" na forma (ou "Para a frente" no texto)', 'Apagar o texto'], 0),
        ],
        conclusao: 'Texto no centro e camadas no lugar! 🔠',
      },
      {
        id: 'cri-vet-cartaz', titulo: 'Cartaz a partir de um modelo', icone: '🎉',
        descricao: 'Modelo pronto, trocar os textos e exportar a imagem.',
        passos: [
          info('Não precisa começar do zero: os MODELOS já vêm prontos. É só trocar os textos. Vamos fazer o cartaz da festa da escola.', { emoji: '🎉' }),
          abrir('vetorial', 'Desenho Vetorial'),
          esperar('Clique em "📄 Novo ▾" e escolha o modelo "🎉 Cartaz de evento".', 'vetor:modelo', (d) => d.modelo === 'cartaz', { destacar: ['.dialogo [data-modelo-vetor="cartaz"]', vt('[data-comando="novo"]')], mouse: 'esquerdo' }),
          esperar('Com a seta ➚, clique no texto "Sábado, 20 de junho, às 18h" e, à direita, troque pelo dia e a hora da SUA festa.', 'vetor:propriedade', (d) => d.prop === 'texto' && d.tipo === 'texto', { destacar: vt('[data-prop="texto"]'), mouse: 'esquerdo' }),
          esperar('Clique em "🖼️ Exportar PNG" e use o nome  Cartaz da festa . (A imagem PNG pode ser impressa ou mandada por e-mail.)', 'vetor:exportado', (d) => /cartaz da festa/i.test(d.nome), { destacar: vt('[data-comando="exportar"]'), mouse: 'esquerdo' }),
          esperar('Salve também o desenho (💾 Salvar), com o nome  Cartaz da festa , para poder mudar depois.', 'arquivo:salvo', (d) => d.tipo === 'vetor', { destacar: vt('[data-comando="salvar"]'), mouse: 'esquerdo' }),
          quiz('Qual a diferença entre "Salvar" e "Exportar PNG"?', ['Salvar guarda o desenho para mudar depois; o PNG é a imagem pronta para usar', 'Nenhuma'], 0),
        ],
        conclusao: 'Cartaz pronto para imprimir! 🎉',
      },
      {
        id: 'cri-vet-pixel', titulo: 'Vetor x pixel: aproximando', icone: '🔍',
        descricao: 'Por que o vetor não "quadricula".',
        passos: [
          info('Uma FOTO (ou o Desenho tipo Paint) é feita de PIXELS: quadradinhos. Aumentando muito, aparecem os quadradinhos. O VETOR é feito de FORMAS calculadas: aumenta sem perder a qualidade. Por isso logotipos e cartazes grandes são feitos em vetor.', { emoji: '🔍' }),
          abrir('vetorial', 'Desenho Vetorial'),
          esperar('Na caixa de zoom (🔍 100%), escolha 400% e veja: as bordas continuam lisinhas!', 'vetor:zoom', (d) => d.zoom === 4, { destacar: vt('[data-comando="zoom"]'), mouse: 'esquerdo' }),
          quiz('Para fazer um logotipo que vai virar faixa grande, o melhor é...', ['Vetor', 'Foto pequena'], 0),
          quiz('Foto ampliada demais fica...', ['Quadriculada (dá para ver os pixels)', 'Mais nítida'], 0),
        ],
        conclusao: 'Agora você entende vetor e pixel! 🔍',
      },
    ],
  });

  // ======================= 🎬 Vídeo =======================
  const contar = () => (CE.videoAtivo ? CE.videoAtivo.itens().length : 0);
  CE.adicionarModulo({
    id: 'cri-video', nivel: 'cri', titulo: 'Edição de vídeo', icone: '🎬',
    licoes: [
      {
        id: 'cri-vid-montar', titulo: 'Montar o vídeo na linha do tempo', icone: '🎞️',
        descricao: 'Clipes em ordem e assistir.',
        passos: [
          info('Um vídeo é montado na LINHA DO TEMPO: as partes ficam uma depois da outra, da esquerda para a direita. Vamos montar um vídeo curto da loja.', { emoji: '🎞️' }),
          abrir('video', 'Editor de Vídeo'),
          esperar('Na coluna "Mídia", clique no ＋ de "Abertura colorida", depois "Fachada da loja" e depois "Produtos na prateleira".', 'video:adicionado', () => contar() >= 3, { destacar: [vd('[data-midia="abertura"]'), vd('[data-midia="loja"]'), vd('[data-midia="produtos"]')], mouse: 'esquerdo' }),
          esperar('Os produtos devem aparecer ANTES da fachada. Clique em "Produtos na prateleira" na linha do tempo e em "◀ Antes".', 'video:movido', (d) => d.fonte === 'produtos' && d.para < d.de, { destacar: [vd('[data-vd-acao="esquerda"]'), vd('[data-item-tipo="clipe"]')], mouse: 'esquerdo' }),
          esperar('Clique em "▶ Assistir" e veja o vídeo.', 'video:play', null, { destacar: vd('[data-comando="play"]'), mouse: 'esquerdo' }),
          quiz('Na linha do tempo, o vídeo passa...', ['Da esquerda para a direita', 'De baixo para cima'], 0),
        ],
        conclusao: 'Seu primeiro vídeo montado! 🎞️',
      },
      {
        id: 'cri-vid-cortar', titulo: 'Cortar e dividir', icone: '✂️',
        descricao: 'Tirar o que sobra e deixar o vídeo curto.',
        passos: [
          info('Vídeo bom é CURTO. Cortar é tirar o começo ou o fim de uma parte. Dividir é partir uma parte em duas (para apagar o pedaço do meio, por exemplo).', { emoji: '✂️' }),
          abrir('video', 'Editor de Vídeo'),
          esperar('Se a linha do tempo estiver vazia, ponha a "Fachada da loja" (＋). Depois clique nela na linha do tempo.', 'video:selecionado', (d) => d.tipo === 'clipe', { destacar: [vd('[data-item-tipo="clipe"]'), vd('[data-midia="loja"]')], mouse: 'esquerdo' }),
          esperar('À direita, em "Termina no segundo", escreva 3 e aperte Enter: o clipe fica com 3 segundos.', 'video:cortado', (d) => d.fim === 3, { destacar: vd('[data-video-fim]') }),
          esperar('Agora arraste a bolinha da barra de tempo (embaixo do vídeo) para o MEIO de uma parte, clique nessa parte e em "✂️ Dividir".', 'video:dividido', null, { destacar: [vd('[data-vd-acao="dividir"]'), vd('[data-campo="video-cursor"]')], mouse: 'arrastar', dica: 'O cursor precisa estar no meio da parte selecionada (não no começo nem no fim).' }),
          esperar('Clique na segunda metade (a parte que ficou depois) e em "🗑️ Apagar".', 'video:apagado', null, { destacar: vd('[data-vd-acao="apagar"]'), mouse: 'esquerdo' }),
          quiz('Para tirar os 2 últimos segundos de um clipe, eu...', ['Mudo onde ele termina (corto o fim)', 'Apago o vídeo inteiro'], 0),
        ],
        conclusao: 'Vídeo enxuto! ✂️',
      },
      {
        id: 'cri-vid-titulo', titulo: 'Título, legenda, transição e música', icone: '🎵',
        descricao: 'O acabamento do vídeo.',
        passos: [
          info('O acabamento: um TÍTULO no começo, LEGENDA (muita gente assiste sem som!), uma TRANSIÇÃO suave e MÚSICA de fundo.', { emoji: '🎵' }),
          abrir('video', 'Editor de Vídeo'),
          esperar('Clique em "＋ Título no começo" e escreva  Loja Bom Preço apresenta .', 'video:titulo', (d) => d.texto.length >= 3, { destacar: vd('[data-acao="adicionar-titulo"]'), mouse: 'esquerdo' }),
          esperar('Clique num clipe da linha do tempo e escreva uma legenda (ex.: Visite a nossa loja!). Aperte Enter.', 'video:legenda', (d) => d.texto.length >= 3, { destacar: [vd('[data-video-legenda]'), vd('[data-item-tipo="clipe"]')] }),
          esperar('Na mesma parte, mude a "Transição" para "Esmaecer".', 'video:transicao', (d) => d.transicao === 'esmaecer', { destacar: vd('[data-video-transicao]'), mouse: 'esquerdo' }),
          esperar('Na coluna da esquerda, em "Música de fundo", escolha "Calma".', 'video:musica', (d) => d.faixa === 'calma', { destacar: vd('[data-comando="musica"]'), mouse: 'esquerdo' }),
          quiz('Por que pôr legenda no vídeo?', ['Muita gente assiste sem som', 'Para o vídeo ficar mais longo'], 0),
        ],
        conclusao: 'Vídeo caprichado! 🎵',
      },
      {
        id: 'cri-vid-exportar', titulo: 'Exportar e compartilhar', icone: '💾',
        descricao: 'Qualidade, tamanho do arquivo e a nuvem.',
        passos: [
          info('EXPORTAR é transformar a montagem num vídeo pronto. Quanto maior a qualidade (720p, 1080p), mais bonito... e mais PESADO o arquivo. Para rede social e celular, 720p é o mais usado.', { emoji: '💾' }),
          abrir('video', 'Editor de Vídeo'),
          esperar('Se a linha do tempo estiver vazia, ponha 2 clipes. Clique em "💾 Exportar vídeo", nome  Vídeo da loja , qualidade 720p, e "Exportar".', 'video:exportado', (d) => /v[ií]deo da loja/i.test(d.nome) && d.qualidade === '720p', {
            destacar: ['.dialogo [data-acao="confirmar-exportar"]', vd('[data-comando="exportar"]')], mouse: 'esquerdo',
          }),
          abrir('nuvem', 'Nuvem'),
          esperar('Mande o "Vídeo da loja" para a nuvem (⬆️ Enviar arquivo). Vídeo é pesado para e-mail: o melhor é mandar o LINK da nuvem.', 'nuvem:enviado', (d) => /v[ií]deo da loja/i.test(d.nome), { destacar: naJanela('nuvem', '[data-acao="enviar-nuvem"]'), mouse: 'esquerdo' }),
          esperar('Compartilhe o vídeo (🔗 Compartilhar) com  chefe@empresaboa.com.br , só para ver.', 'nuvem:compartilhado', (d) => /v[ií]deo da loja/i.test(d.nome), { destacar: naJanela('nuvem', '[data-compartilhar="Vídeo da loja"]'), mouse: 'esquerdo' }),
          quiz('Vídeo grande para mandar a alguém: o melhor é...', ['Mandar o link da nuvem', 'Anexar no e-mail de qualquer jeito'], 0),
          quiz('Qual qualidade deixa o arquivo MAIS pesado?', ['1080p', '480p'], 0),
        ],
        conclusao: 'Vídeo exportado e compartilhado! 💾',
      },
    ],
  });

  // ======================= 🏆 Projeto e prova =======================
  CE.adicionarModulo({
    id: 'cri-final', nivel: 'cri', titulo: 'Projeto, desafio e prova', icone: '🏆',
    licoes: [
      {
        id: 'cri-projeto', titulo: 'Projeto: campanha de divulgação', icone: '📣',
        descricao: 'Post, vídeo e envio para o cliente.',
        passos: [
          info('PROJETO! A Loja Bom Preço quer uma campanha: um POST (imagem) e um VÍDEO curto. Você é a pessoa da criação! Clique em "Continuar".', { emoji: '📣' }),
          esperar('1) Faça o post: no Desenho Vetorial use o modelo "🔥 Post de promoção" (troque o que quiser) e exporte como PNG com o nome  Post da campanha .', 'vetor:exportado', (d) => /post da campanha/i.test(d.nome), { preparar: () => CE.janelas.abrir('vetorial') }),
          esperar('2) Faça o vídeo: no Editor de Vídeo, com pelo menos 3 partes (pode usar o título e as fotos), e exporte com o nome  Vídeo da campanha .', 'video:exportado', (d) => /campanha/i.test(d.nome) && d.itens >= 3, { preparar: () => CE.janelas.abrir('video') }),
          esperar('3) Mande o post para o cliente: e-mail para professor@correio.escola com a imagem "Post da campanha" anexada.', 'email:enviado', (d) => d.para === 'professor@correio.escola' && (d.nomesAnexos || []).some((n) => /post da campanha/i.test(n)), { preparar: () => CE.janelas.abrir('email') }),
          quiz('Na campanha, cada peça tem uma função. O vídeo curto serve para...', ['Chamar a atenção rápido, nas redes sociais', 'Substituir a nota fiscal'], 0),
        ],
        conclusao: 'CAMPANHA ENTREGUE! 📣',
      },
      {
        id: 'cri-desafio', titulo: 'Desafio da criação', icone: '🏅', desafio: true,
        descricao: 'Foto, logotipo e vídeo sozinho.',
        passos: [
          info('Desafio! Faça sozinho. Clique em "Continuar".'),
          esperar('No Editor de Fotos, abra qualquer foto, corte em quadrado 1:1, ponha um texto e salve.', 'fotos:salva', (d) => d.corte === '1:1' && d.textos >= 1),
          esperar('No Desenho Vetorial, use o modelo "Logotipo", troque o nome e exporte o PNG.', 'vetor:exportado'),
          esperar('No Editor de Vídeo, exporte um vídeo com legenda.', 'video:exportado', (d) => d.legendas >= 1),
        ],
        conclusao: 'Desafio vencido! Você é da criação. 🎨',
      },
      {
        id: 'prova-cri', titulo: 'Prova do curso Criação digital', icone: '🏆', prova: true, desafio: true,
        descricao: 'Tarefas e perguntas sobre fotos, vetor e vídeo. Precisa de 70% para passar.',
        passos: [
          info('Chegou a PROVA do curso Criação digital! Faça as tarefas sozinho. Precisa de 70% para passar. Clique em "Continuar".', { emoji: '🏆' }),
          esperar('Tarefa 1: no Editor de Fotos, clareie a "Foto escura" (brilho acima de 100%) e salve.', 'fotos:salva', (d) => d.brilho > 100),
          esperar('Tarefa 2: no Desenho Vetorial, faça um desenho com pelo menos um texto e exporte o PNG.', 'vetor:exportado'),
          esperar('Tarefa 3: no Editor de Vídeo, exporte um vídeo com música.', 'video:exportado', (d) => d.musica && d.musica !== 'nenhuma'),
          quiz('O formato quadrado (1:1) é muito usado em...', ['Posts de rede social', 'Documentos de cartório'], 0),
          quiz('Para clarear uma foto escura, eu aumento...', ['O brilho', 'O tamanho da letra'], 0),
          quiz('O vetor, quando aumenta muito...', ['Continua nítido', 'Fica quadriculado'], 0),
          quiz('O "Exportar PNG" do desenho vetorial gera...', ['Uma imagem pronta para usar', 'Um vídeo'], 0),
          quiz('No vídeo, a legenda ajuda...', ['Quem assiste sem som', 'Só quem tem som alto'], 0),
          quiz('Antes de postar a foto de uma pessoa, eu...', ['Peço autorização', 'Não preciso perguntar'], 0),
          quiz('Vídeo pesado para mandar: o melhor é...', ['O link da nuvem', 'Anexar no e-mail'], 0),
          quiz('Foto para e-mail fica melhor com...', ['Uns 800 pixels de largura', '10.000 pixels'], 0),
        ],
        conclusao: 'PARABÉNS! Você passou na prova do curso Criação digital! 🏆 Peça ao instrutor o seu certificado.',
      },
    ],
  });
})();
