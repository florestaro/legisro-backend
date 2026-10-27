// Sites de treino da aula de vídeo falso (deepfake): uma rede de vídeos com um anúncio falso de um apresentador
// (inventado), o site do "investimento" (golpe) e a notícia do Jornal do Bairro desmentindo o vídeo.
window.CE = window.CE || {};

(function () {
  const link = (url, texto, extra = '') => `<a href="#" data-link="${url}" ${extra}>${texto}</a>`;
  const FALA = 'Olá, aqui é o Carlos Mendes. Descobri um investimento que paga muito: você coloca duzentos reais e recebe cinco mil em sete dias. Clique no link e garanta a sua vaga!';
  const estado = (e) => (e.videos = e.videos || { assistiu: false, denunciou: false, denunciando: false });

  CE.SITES['vejaagora.com.br'] = {
    dominio: 'vejaagora.com.br', nome: 'VejaAgora', icone: '▶️', seguro: true,
    abrir({ estado: e }) {
      const v = estado(e);
      const player = v.assistiu
        ? `<div class="va-video tocando"><div class="va-rosto" aria-hidden="true">🧑‍💼</div><p class="va-legenda">"${FALA}"</p>
            <ul class="va-sinais"><li>👄 A boca não acompanha a fala</li><li>🤖 A voz é meio robótica</li><li>👀 Quase não pisca</li></ul></div>`
        : `<div class="va-video"><div class="va-rosto" aria-hidden="true">🧑‍💼</div><button class="va-play" data-site-acao="assistir">▶ Assistir</button></div>`;
      const denuncia = v.denunciou
        ? '<p class="va-denunciado" data-denunciado>⚑ Obrigado! Vamos analisar este anúncio.</p>'
        : v.denunciando
          ? `<div class="va-motivos"><b>Por que você está denunciando?</b>${['Golpe ou fraude', 'Conteúdo enganoso', 'Não gostei'].map((m) => `<button class="va-motivo" data-site-acao="motivo" data-motivo="${m}">${m}</button>`).join('')}</div>`
          : '<button class="va-acao" data-site-acao="denunciar">⚑ Denunciar</button>';
      return {
        titulo: 'VejaAgora – vídeos',
        conteudo: `<header class="va-cabecalho"><b>▶️ VejaAgora</b><span>Vídeos para todo mundo</span></header>
          <div class="va-feed">
            <article class="va-post"><div class="va-autor">🍳 <b>Cozinha da Vó Lurdes</b></div><div class="va-video simples">🥘</div><p>Galinhada de domingo em 30 minutos!</p></article>
            <article class="va-post patrocinado" data-post="carlos"><div class="va-autor">📺 <b>Carlos Mendes Oficial</b> <small>· Patrocinado</small></div>
              ${player}
              <p><b>"Invista R$ 200 e receba R$ 5.000 em 7 dias!"</b> Vagas limitadas, só hoje!</p>
              <div class="va-acoes">${link('investimento-garantido.net', 'Quero investir →', 'class="va-acao forte" data-anuncio="investimento"')}${denuncia}</div>
              <div class="va-comentarios"><b>Comentários</b>
                <p>👵 <b>Dona Cida:</b> Será que é verdade? Ele é tão sério na TV...</p>
                <p>👨 <b>Rafael:</b> Cuidado, gente! ${link('jornaldobairro.com.br/noticia/video-falso', 'Jornal do Bairro: é falso!', 'data-noticia-video')}</p></div></article>
            <article class="va-post"><div class="va-autor">🌳 <b>Rondônia Natureza</b></div><div class="va-video simples">🐆</div><p>Onça-pintada aparece na beira do rio Madeira.</p></article>
          </div>`,
      };
    },
    acao(nome, el, ctx) {
      const v = estado(ctx.estado);
      if (nome === 'assistir') {
        v.assistiu = true;
        CE.voz.falar(FALA, { velocidade: 1.05, tom: 0.6 });
        CE.emitir('ia:video-assistido');
      }
      if (nome === 'denunciar') v.denunciando = true;
      if (nome === 'motivo') {
        v.denunciando = false;
        if (el.dataset.motivo === 'Não gostei') { CE.avisar('Este anúncio é golpe! Escolha "Golpe ou fraude".'); } else {
          v.denunciou = true;
          CE.emitir('ia:denunciou', { motivo: el.dataset.motivo });
        }
      }
      ctx.ir('vejaagora.com.br');
    },
  };

  CE.SITES['investimento-garantido.net'] = {
    dominio: 'investimento-garantido.net', nome: 'Investimento Garantido (FALSO)', icone: '💸', seguro: false, golpe: true,
    abrir({ caminho }) {
      if (caminho === '/alerta') {
        return { titulo: 'Atenção: golpe!', conteudo: `<div class="golpe-alerta"><h1>⚠️ Cuidado! Isto era um GOLPE (de treino)</h1>
          <p>O vídeo do "Carlos Mendes" era falso, feito com inteligência artificial. Ninguém transforma R$ 200 em R$ 5.000 em 7 dias.</p>
          <h2>Como perceber:</h2><ul><li>💰 Promessa de dinheiro fácil e rápido.</li><li>⏰ Pressa: "vagas limitadas, só hoje".</li><li>🎭 Famoso pedindo dinheiro num anúncio.</li><li>🔓 Site com "Não seguro" na barra de endereço.</li></ul>
          ${link('inicio', '🏠 Voltar para a página inicial', 'class="golpe-voltar"')}</div>` };
      }
      return { titulo: 'Investimento Garantido – vagas limitadas', conteudo: `<div class="cd-pagina gv-golpe"><h1>💸 Investimento Garantido</h1><p class="bc-erro">⏰ Últimas 3 vagas! Retorno de 2.400% em 7 dias.</p>
        <form class="cd-form" data-formulario="investir"><label>Nome <input name="nome" autocomplete="off"></label><label>CPF <input name="cpf" autocomplete="off"></label>
        <p>Faça um Pix de <b>R$ 200,00</b> para começar.</p><button class="cd-botao" type="submit">QUERO MINHA VAGA</button></form></div>` };
    },
    enviar(_f, _d, ctx) { ctx.caiuNoGolpe(); ctx.ir('investimento-garantido.net/alerta'); },
  };

  CE.INDICE_BUSCA.push({ url: 'vejaagora.com.br', titulo: 'VejaAgora – vídeos', descricao: 'Vídeos de receitas, natureza e notícias.', palavras: 'video videos assistir carlos mendes' });
})();
