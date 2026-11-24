// "Agar da Turma": o jogo das bolinhas da Praça Escola (o prédio do Agar, perto da estação). Cada um é uma bolinha
// que segue o mouse: come as bolinhas coloridas do chão para crescer e pode comer quem for bem menor (até 80% do seu
// tamanho); quem é maior come você. Espaço divide a bolinha em duas (mais rápida, mas cada pedaço fica menor) e W
// solta um pouco de massa. O vírus verde de espinhos estoura quem já está grande.
//
// As regras ficam aqui, num lugar só: o computador do instrutor usa no servidor da sala (src/canais.js) e o modo de
// teste no navegador usa em app/js/api.js. A arena anda no computador do instrutor, em passos de 40 ms, sempre que
// alguém manda o mouse (a janela do jogo manda 10 vezes por segundo): ninguém aumenta o próprio tamanho pelo
// computador dele. Cada turma tem a sua arena; com pouca gente, robôs (bichos da Amazônia) completam a arena até 10
// bolinhas. Quem fecha a janela (ou fica 15 s sem dar sinal) sai; a arena sem ninguém some depois de 1 minuto.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else { raiz.CE = raiz.CE || {}; raiz.CE.agarRegras = fabrica(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const MUNDO = 3000;            // a arena: 3000 x 3000 pontos
  const PASSO = 40;              // a arena anda em passos de 40 ms (25 por segundo)
  const PASSOS_MAX = 25;         // depois de muito tempo parada, anda no máximo 1 s de uma vez
  const COMIDA = 800, VIRUS = 8, VIRUS_MASSA = 100;
  const MASSA_INICIAL = 20, MAX_CELULAS = 12;
  const LOTACAO = 10;            // com os robôs ligados, a arena fica com pelo menos 10 bolinhas (gente + robôs)
  const SUMIU = 15000;           // quem não manda nada há 15 s saiu (fechou a janela sem sair, caiu a rede)
  const VAZIA = 60000;           // arena sem ninguém por 1 minuto: some (e os robôs dela param)
  const RENASCER_ROBO = 3000;
  // Os robôs: bichos da Amazônia (só emojis que o Windows 10 desenha).
  const ROBOS = [['Tambaqui', '🐟'], ['Boto', '🐬'], ['Jacaré', '🐊'], ['Arara', '🦜'], ['Onça', '🐆'], ['Sucuri', '🐍'],
    ['Preguiça', '🦥'], ['Jabuti', '🐢'], ['Pirarucu', '🐠'], ['Macaco', '🐒'], ['Sapo', '🐸'], ['Tucano', '🐦']];

  const raio = (m) => Math.sqrt(m) * 4;
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  // Pontos por segundo: a bolinha grande anda mais devagar.
  const velocidade = (m) => 364 * Math.pow(Math.max(1, m), -0.12);

  return function criarAgar(relogio = () => Date.now(), acaso = Math.random) {
    const config = { aberta: true, robos: true };
    const salas = new Map();     // turma -> arena
    const ondeEsta = new Map();  // id do usuário -> turma da arena em que ele está
    let ultimoId = 0;
    const novoId = () => ++ultimoId;
    const sorteio = (a, b) => a + acaso() * (b - a);
    const ehInstrutor = (u) => !!u && u.papel === 'instrutor';
    const turmaDe = (u) => String((u && u.turma) || '').trim().slice(0, 40);
    const exigir = (u) => { if (!u || !u.id) throw new Error('Entre no sistema primeiro.'); };
    // Na arena aparece só o primeiro nome (cabe na bolinha).
    const apelido = (nome) => String(nome || '').trim().split(/\s+/)[0].slice(0, 14) || 'Aluno';
    // A cor de cada aluno é sempre a mesma (sai do id).
    const corDe = (id) => { let h = 7; for (const ch of String(id)) h = (h * 31 + ch.codePointAt(0)) % 3600; return Math.floor(h / 10); };

    const comidaNova = () => ({ x: sorteio(20, MUNDO - 20), y: sorteio(20, MUNDO - 20), m: 1, c: Math.floor(acaso() * 12), vx: 0, vy: 0 });
    const virusNovo = () => ({ x: sorteio(200, MUNDO - 200), y: sorteio(200, MUNDO - 200), m: VIRUS_MASSA, comeu: 0 });
    const celulaNova = (x, y, m) => ({ id: novoId(), x, y, m, vx: 0, vy: 0, juntar: 0 });
    const massaDe = (p) => p.celulas.reduce((t, c) => t + c.m, 0);
    function centro(p) {
      let x = 0, y = 0, t = 0;
      for (const c of p.celulas) { x += c.x * c.m; y += c.y * c.m; t += c.m; }
      return t ? { x: x / t, y: y / t } : { x: p.ultimoX, y: p.ultimoY };
    }
    const humanos = (s) => [...s.jogadores.values()].filter((p) => !p.robo);
    const jogando = (s) => humanos(s).filter((p) => !p.espectador);

    function novaSala(turma) {
      const s = { turma, jogadores: new Map(), comida: [], virus: [], ultimo: relogio(), vazioDesde: null, recorde: null };
      for (let i = 0; i < COMIDA; i++) s.comida.push(comidaNova());
      for (let i = 0; i < VIRUS; i++) s.virus.push(virusNovo());
      salas.set(turma, s);
      return s;
    }
    const jogadorNovo = (dados) => ({
      celulas: [], vivo: false, espectador: false, alvoX: MUNDO / 2, alvoY: MUNDO / 2, ultimoX: MUNDO / 2, ultimoY: MUNDO / 2,
      vw: 900, vh: 600, dividir: false, soltar: false, dividiuEm: 0, soltouEm: 0, melhor: 0, comeu: 0, comidoPor: null,
      ultimoComedor: null, pensarEm: 0, renascerEm: 0, morreuEm: 0, ...dados,
    });
    function jogadorHumano(s, u, agora) {
      const id = 'u:' + u.id;
      let p = s.jogadores.get(id);
      if (!p) {
        p = jogadorNovo({ id, usuarioId: u.id, nome: apelido(u.nome), avatar: String(u.avatar || '🙂').slice(0, 8), cor: corDe(u.id), robo: false, instrutor: ehInstrutor(u), vistoEm: agora });
        s.jogadores.set(id, p);
      }
      return p;
    }
    // Nasce longe das bolinhas grandes (12 tentativas; senão, no lugar mais longe que achou).
    function lugarLivre(s) {
      let melhor = null;
      for (let i = 0; i < 12; i++) {
        const x = sorteio(100, MUNDO - 100), y = sorteio(100, MUNDO - 100);
        let perto = Infinity;
        for (const q of s.jogadores.values()) for (const c of q.celulas) if (c.m > MASSA_INICIAL) perto = Math.min(perto, Math.hypot(c.x - x, c.y - y) - raio(c.m));
        if (perto > 250) return { x, y };
        if (!melhor || perto > melhor.perto) melhor = { x, y, perto };
      }
      return melhor;
    }
    function nascer(s, p, agora) {
      const { x, y } = lugarLivre(s);
      p.celulas = [celulaNova(x, y, MASSA_INICIAL)];
      Object.assign(p, { vivo: true, alvoX: x, alvoY: y, ultimoX: x, ultimoY: y, melhor: MASSA_INICIAL, comeu: 0, comidoPor: null, ultimoComedor: null, dividir: false, soltar: false });
    }
    function tirar(s, p) {
      s.jogadores.delete(p.id);
      if (p.robo) return;
      if (ondeEsta.get(p.usuarioId) === s.turma) ondeEsta.delete(p.usuarioId);
      if (!humanos(s).length && s.vazioDesde == null) s.vazioDesde = relogio(); // saiu o último: conta 1 minuto
    }

    // ---------- Os robôs ----------
    function completarRobos(s, agora) {
      const querem = config.robos ? Math.max(0, LOTACAO - jogando(s).length) : 0;
      const robos = [...s.jogadores.values()].filter((p) => p.robo);
      // Chegou gente (ou o professor desligou os robôs): saem os robôs mortos primeiro, depois os menores.
      if (robos.length > querem) {
        robos.sort((a, b) => (a.vivo - b.vivo) || (massaDe(a) - massaDe(b))).slice(0, robos.length - querem).forEach((r) => tirar(s, r));
        return;
      }
      for (let i = robos.length; i < querem; i++) {
        const usados = new Set([...s.jogadores.values()].filter((p) => p.robo).map((p) => p.nome));
        const [nome, avatar] = ROBOS.find(([n]) => !usados.has(n)) || ROBOS[i % ROBOS.length];
        const p = jogadorNovo({ id: 'r:' + novoId(), nome, avatar, cor: Math.floor(acaso() * 360), robo: true, renascerEm: agora + 250 * i });
        s.jogadores.set(p.id, p);
      }
    }
    // O robô é fraco de propósito (a turma está aprendendo a usar o mouse): anda 15% mais devagar, pensa devagar,
    // foge de quem é maior e só corre atrás de outro robô, nunca de um aluno (se um aluno encostar nele, aí sim
    // pode ser comido). Sem ninguém perto, vai numa das comidas perto dele. Robô muito grande encolhe sozinho.
    const ROBO_LENTO = 0.85, ROBO_GRANDE = 300;
    function pensar(s, p, agora) {
      if (agora < p.pensarEm || !p.celulas.length) return;
      p.pensarEm = agora + sorteio(500, 900);
      const eu = p.celulas.reduce((a, b) => (b.m > a.m ? b : a));
      let perigo = null, dPerigo = Infinity, presa = null, dPresa = Infinity;
      for (const q of s.jogadores.values()) {
        if (q === p || !q.vivo) continue;
        for (const c of q.celulas) {
          const d = Math.hypot(c.x - eu.x, c.y - eu.y);
          if (d > 650) continue;
          if (c.m > eu.m * 1.25 && d < dPerigo) { dPerigo = d; perigo = c; }
          else if (q.robo && c.m * 1.25 < eu.m && d < dPresa && d < 300) { dPresa = d; presa = c; }
        }
      }
      if (perigo && dPerigo < 420) { p.alvoX = eu.x + (eu.x - perigo.x) * 3; p.alvoY = eu.y + (eu.y - perigo.y) * 3; }
      else if (presa) {
        p.alvoX = presa.x; p.alvoY = presa.y;
        if (dPresa < 250 && presa.m * 2.6 < eu.m && p.celulas.length < 3 && acaso() < 0.2) p.dividir = true;
      } else if (acaso() < 0.4) {
        // Às vezes o robô só passeia (assim ele não come tão bem quanto um aluno esperto).
        const a = acaso() * Math.PI * 2;
        p.alvoX = eu.x + Math.cos(a) * 350; p.alvoY = eu.y + Math.sin(a) * 350;
      } else {
        // Uma das 3 comidas mais perto (olhando uma de cada três, para não pesar no computador do instrutor).
        const perto = [];
        for (let i = 0; i < s.comida.length; i += 3) {
          const f = s.comida[i], d = (f.x - eu.x) ** 2 + (f.y - eu.y) ** 2;
          if (perto.length < 3 || d < perto[2].d) { perto.push({ f, d }); perto.sort((a, b) => a.d - b.d); if (perto.length > 3) perto.pop(); }
        }
        const alvo = perto.length ? perto[Math.floor(acaso() * perto.length)].f : null;
        if (alvo) { p.alvoX = alvo.x; p.alvoY = alvo.y; }
      }
      p.alvoX = limitar(p.alvoX, 0, MUNDO); p.alvoY = limitar(p.alvoY, 0, MUNDO);
    }

    // ---------- Dividir, soltar massa e estourar no vírus ----------
    function dividir(p, agora) {
      const novas = [];
      for (const c of p.celulas) {
        if (p.celulas.length + novas.length >= MAX_CELULAS || c.m < 36) continue;
        let dx = p.alvoX - c.x, dy = p.alvoY - c.y, d = Math.hypot(dx, dy);
        if (d < 1) { const a = acaso() * Math.PI * 2; dx = Math.cos(a); dy = Math.sin(a); d = 1; }
        c.m /= 2;
        const n = celulaNova(c.x, c.y, c.m);
        n.vx = dx / d * 900; n.vy = dy / d * 900;
        c.juntar = n.juntar = agora + 10000 + c.m * 8;
        novas.push(n);
      }
      p.celulas.push(...novas);
    }
    function soltar(s, p) {
      for (const c of p.celulas) {
        if (c.m < 35) continue;
        const dx = p.alvoX - c.x, dy = p.alvoY - c.y, d = Math.hypot(dx, dy) || 1;
        const r = raio(c.m);
        c.m -= 14;
        s.comida.push({ x: limitar(c.x + dx / d * (r + 15), 0, MUNDO), y: limitar(c.y + dy / d * (r + 15), 0, MUNDO), m: 12, c: -1 - p.cor, vx: dx / d * 700, vy: dy / d * 700 });
      }
    }
    function estourar(p, c, agora) {
      const pedacos = Math.min(MAX_CELULAS - p.celulas.length, 7);
      if (pedacos <= 0) return;
      const m = c.m / (pedacos + 1);
      c.m = m;
      for (let i = 0; i < pedacos; i++) {
        const a = (i / pedacos) * Math.PI * 2;
        const n = celulaNova(c.x, c.y, m);
        n.vx = Math.cos(a) * 600; n.vy = Math.sin(a) * 600;
        n.juntar = agora + 12000 + m * 8;
        p.celulas.push(n);
      }
      c.juntar = agora + 12000 + m * 8;
    }

    // ---------- Um passo da arena (40 ms) ----------
    function passo(s, agora) {
      const dt = PASSO / 1000;
      for (const p of s.jogadores.values()) {
        if (!p.vivo) { if (p.robo && agora >= p.renascerEm) nascer(s, p, agora); continue; }
        if (p.robo) pensar(s, p, agora);
        if (p.dividir) { dividir(p, agora); p.dividir = false; }
        if (p.soltar) { soltar(s, p); p.soltar = false; }
        const robao = p.robo && massaDe(p) > ROBO_GRANDE;
        for (const c of p.celulas) {
          const r = raio(c.m);
          const dx = p.alvoX - c.x, dy = p.alvoY - c.y, d = Math.hypot(dx, dy);
          const f = Math.min(1, d / (r * 0.6 + 20)); // perto da setinha, vai devagar (não fica tremendo)
          if (d > 1) { const v = velocidade(c.m) * (p.robo ? ROBO_LENTO : 1) * f * dt; c.x += dx / d * v; c.y += dy / d * v; }
          c.x += c.vx * dt; c.y += c.vy * dt;
          const freio = Math.pow(0.86, dt * 30); c.vx *= freio; c.vy *= freio;
          if (c.m > 60) c.m *= 1 - 0.0025 * dt; // quem é grande perde um pouquinho de massa com o tempo
          if (robao) c.m *= 1 - 0.02 * dt; // robô grandão encolhe, mesmo em pedaços (a arena é dos alunos)
          c.x = limitar(c.x, r * 0.5, MUNDO - r * 0.5); c.y = limitar(c.y, r * 0.5, MUNDO - r * 0.5);
        }
        // Os pedaços da mesma pessoa se empurram e, depois de um tempo, se juntam de novo.
        for (let i = 0; i < p.celulas.length; i++) for (let j = i + 1; j < p.celulas.length; j++) {
          const a = p.celulas[i], b = p.celulas[j];
          if (a.m <= 0 || b.m <= 0) continue;
          const ra = raio(a.m), rb = raio(b.m);
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
          if (agora >= a.juntar && agora >= b.juntar) {
            if (d < Math.max(ra, rb) * 0.9) { a.m += b.m; b.m = 0; }
          } else if (d < ra + rb && Math.hypot(a.vx, a.vy) < 150 && Math.hypot(b.vx, b.vy) < 150) {
            const empurra = (ra + rb - d) * 0.25;
            a.x -= dx / d * empurra; a.y -= dy / d * empurra; b.x += dx / d * empurra; b.y += dy / d * empurra;
          }
        }
        p.celulas = p.celulas.filter((c) => c.m > 0);
      }

      // A massa solta ainda andando.
      for (const f of s.comida) {
        if (!f.vx && !f.vy) continue;
        f.x = limitar(f.x + f.vx * dt, 0, MUNDO); f.y = limitar(f.y + f.vy * dt, 0, MUNDO);
        const k = Math.pow(0.85, dt * 30); f.vx *= k; f.vy *= k;
        if (Math.abs(f.vx) + Math.abs(f.vy) < 5) f.vx = f.vy = 0;
      }

      const todas = [];
      for (const p of s.jogadores.values()) if (p.vivo) for (const c of p.celulas) todas.push({ c, p });

      // Comer a comida do chão (e a massa solta).
      for (const { c } of todas) {
        const r = raio(c.m);
        for (let i = s.comida.length - 1; i >= 0; i--) {
          const f = s.comida[i];
          if (Math.abs(f.x - c.x) > r || Math.abs(f.y - c.y) > r) continue;
          if ((f.x - c.x) ** 2 + (f.y - c.y) ** 2 < r * r && c.m > f.m * 1.1) {
            c.m += f.m; s.comida[i] = s.comida[s.comida.length - 1]; s.comida.pop();
          }
        }
      }

      // Vírus: a massa solta alimenta (com 7, nasce outro na direção do tiro); quem é grande e come o vírus estoura.
      for (let vi = s.virus.length - 1; vi >= 0; vi--) {
        const v = s.virus[vi], vr = raio(v.m);
        for (let i = s.comida.length - 1; i >= 0; i--) {
          const f = s.comida[i];
          if (f.m < 10 || (f.x - v.x) ** 2 + (f.y - v.y) ** 2 > vr * vr) continue;
          v.comeu++; s.comida[i] = s.comida[s.comida.length - 1]; s.comida.pop();
          if (v.comeu >= 7) {
            v.comeu = 0;
            const a = Math.atan2(f.vy || 1, f.vx || 1);
            s.virus.push({ x: limitar(v.x + Math.cos(a) * 300, 100, MUNDO - 100), y: limitar(v.y + Math.sin(a) * 300, 100, MUNDO - 100), m: VIRUS_MASSA, comeu: 0 });
          }
        }
        for (const { c, p } of todas) {
          if (c.m <= 0 || c.m < v.m * 1.3) continue;
          const r = raio(c.m);
          if ((c.x - v.x) ** 2 + (c.y - v.y) ** 2 < (r - vr * 0.4) ** 2) { c.m += v.m; s.virus.splice(vi, 1); estourar(p, c, agora); break; }
        }
      }

      // Bolinha come bolinha: precisa ser 25% maior e cobrir a outra.
      for (const A of todas) for (const B of todas) {
        if (A.p === B.p || A.c.m <= 0 || B.c.m <= 0 || A.c.m < B.c.m * 1.25) continue;
        const ra = raio(A.c.m), rb = raio(B.c.m), dx = A.c.x - B.c.x, dy = A.c.y - B.c.y;
        if (Math.abs(dx) > ra || Math.abs(dy) > ra) continue;
        if (dx * dx + dy * dy < (ra - rb * 0.4) ** 2) { A.c.m += B.c.m; B.c.m = 0; B.p.ultimoComedor = A.p; }
      }

      for (const p of s.jogadores.values()) {
        if (!p.vivo) continue;
        p.celulas = p.celulas.filter((c) => c.m > 0);
        if (!p.celulas.length) {
          p.vivo = false; p.morreuEm = agora;
          const quem = p.ultimoComedor;
          p.comidoPor = quem ? { nome: quem.nome, avatar: quem.avatar, robo: !!quem.robo } : null;
          p.ultimoComedor = null;
          if (quem) quem.comeu++;
          if (p.robo) p.renascerEm = agora + RENASCER_ROBO;
          continue;
        }
        const m = massaDe(p);
        if (m > p.melhor) p.melhor = m;
        const ctr = centro(p); p.ultimoX = ctr.x; p.ultimoY = ctr.y;
        if (!p.robo && (!s.recorde || m > s.recorde.massa)) s.recorde = { nome: p.nome, avatar: p.avatar, massa: Math.round(m) };
      }
      while (s.comida.length < COMIDA) s.comida.push(comidaNova());
      if (s.comida.length > COMIDA + 300) s.comida.splice(0, s.comida.length - (COMIDA + 300));
      while (s.virus.length > VIRUS * 2) s.virus.shift();
      while (s.virus.length < VIRUS) s.virus.push(virusNovo());
    }

    // A arena anda até agora (em passos de 40 ms).
    function avancar(s, agora) {
      completarRobos(s, agora);
      let n = Math.floor((agora - s.ultimo) / PASSO);
      if (n <= 0) return;
      if (n > PASSOS_MAX) { s.ultimo = agora - PASSOS_MAX * PASSO; n = PASSOS_MAX; }
      for (let i = 0; i < n; i++) { s.ultimo += PASSO; passo(s, s.ultimo); }
    }
    // Quem sumiu sai; a arena sem ninguém some depois de 1 minuto.
    function limpar(agora) {
      for (const [turma, s] of salas) {
        for (const p of [...s.jogadores.values()]) if (!p.robo && agora - p.vistoEm > SUMIU) tirar(s, p);
        if (humanos(s).length) s.vazioDesde = null;
        else if (s.vazioDesde == null) s.vazioDesde = agora;
        else if (agora - s.vazioDesde > VAZIA) salas.delete(turma);
      }
    }

    // ---------- O que cada computador recebe: só o pedaço da arena que aparece na tela dele ----------
    function ranking(s) {
      return [...s.jogadores.values()].filter((p) => p.vivo).map((p) => ({ p, m: massaDe(p) })).sort((a, b) => b.m - a.m);
    }
    function visao(s, p, agora) {
      const esp = p.espectador;
      const ctr = p.vivo ? centro(p) : { x: p.ultimoX, y: p.ultimoY };
      const cx = esp ? MUNDO / 2 : ctr.x, cy = esp ? MUNDO / 2 : ctr.y;
      const hx = esp ? MUNDO / 2 + 60 : limitar(Number(p.vw) || 900, 300, 2200);
      const hy = esp ? MUNDO / 2 + 60 : limitar(Number(p.vh) || 600, 250, 2200);
      const ve = (x, y, r) => Math.abs(x - cx) < hx + r && Math.abs(y - cy) < hy + r;
      const pessoas = [];
      for (const q of s.jogadores.values()) {
        if (!q.vivo) continue;
        const cs = [];
        for (const c of q.celulas) { const r = raio(c.m); if (ve(c.x, c.y, r)) cs.push([c.id, Math.round(c.x), Math.round(c.y), Math.round(r)]); }
        if (cs.length) pessoas.push([q.id, q.nome, q.avatar, q.cor, q.robo ? 1 : 0, cs]);
      }
      const comida = [];
      for (const f of s.comida) if (ve(f.x, f.y, 12)) comida.push([Math.round(f.x), Math.round(f.y), Math.round(raio(f.m)), f.c]);
      const virus = [];
      for (const v of s.virus) { const r = raio(v.m); if (ve(v.x, v.y, r)) virus.push([Math.round(v.x), Math.round(v.y), Math.round(r)]); }
      const lista = ranking(s);
      const pos = lista.findIndex((x) => x.p === p);
      return {
        agora, mundo: MUNDO, aberta: config.aberta, robos: config.robos, turma: s.turma, euId: p.id,
        eu: { vivo: p.vivo, espectador: esp, massa: Math.round(massaDe(p)), melhor: Math.round(p.melhor), comeu: p.comeu, comidoPor: p.comidoPor, x: Math.round(cx), y: Math.round(cy) },
        p: pessoas, f: comida, v: virus,
        rk: lista.slice(0, 10).map((x) => [x.p.nome, x.p.avatar, Math.round(x.m), x.p.robo ? 1 : 0, x.p === p ? 1 : 0]),
        pos: pos >= 0 ? pos + 1 : null, total: lista.length, gente: jogando(s).length, recorde: s.recorde,
      };
    }

    const api = {
      MUNDO,
      // Antes de entrar: se a arena está aberta, quem já está jogando e o recorde (o instrutor vê todas as arenas).
      estado(usuario) {
        exigir(usuario);
        const agora = relogio();
        limpar(agora);
        const turma = ondeEsta.has(usuario.id) ? ondeEsta.get(usuario.id) : turmaDe(usuario);
        const s = salas.get(turma);
        return {
          aberta: config.aberta, robos: config.robos, mundo: MUNDO, turma, dentro: ondeEsta.has(usuario.id),
          gente: s ? jogando(s).map((p) => ({ nome: p.nome, avatar: p.avatar })) : [],
          robosNaArena: s ? [...s.jogadores.values()].filter((p) => p.robo).length : 0,
          recorde: s ? s.recorde : null,
          salas: ehInstrutor(usuario)
            ? [...salas.values()].map((x) => ({ turma: x.turma, gente: jogando(x).length, robos: [...x.jogadores.values()].filter((p) => p.robo).length, recorde: x.recorde }))
            : undefined,
        };
      },
      // Entrar (ou nascer de novo). O instrutor escolhe a arena de qual turma e pode só assistir (a arena inteira).
      entrar(usuario, d = {}) {
        exigir(usuario);
        const agora = relogio();
        limpar(agora);
        const instrutor = ehInstrutor(usuario);
        if (!config.aberta && !instrutor) throw new Error('A arena está fechada agora. Quando o professor abrir, é só voltar aqui.');
        const turma = instrutor && typeof d.turma === 'string' ? d.turma.trim().slice(0, 40) : turmaDe(usuario);
        const antes = ondeEsta.get(usuario.id);
        if (antes !== undefined && antes !== turma && salas.get(antes)) { const velha = salas.get(antes); const q = velha.jogadores.get('u:' + usuario.id); if (q) tirar(velha, q); }
        const s = salas.get(turma) || novaSala(turma);
        avancar(s, agora);
        const p = jogadorHumano(s, usuario, agora);
        ondeEsta.set(usuario.id, turma);
        p.vistoEm = agora;
        p.espectador = instrutor && !!d.assistir;
        if (p.espectador) { p.celulas = []; p.vivo = false; p.comidoPor = null; } else if (!p.vivo) nascer(s, p, agora);
        completarRobos(s, agora);
        return visao(s, p, agora);
      },
      // A janela do jogo manda o mouse (onde a bolinha deve ir), o tamanho da tela e os botões; recebe a arena.
      jogar(usuario, d = {}) {
        exigir(usuario);
        const agora = relogio();
        limpar(agora);
        const turma = ondeEsta.get(usuario.id);
        const s = turma === undefined ? null : salas.get(turma);
        const p = s && s.jogadores.get('u:' + usuario.id);
        if (!s || !p) return { fora: true, aberta: config.aberta, fechada: !config.aberta && !ehInstrutor(usuario) };
        p.vistoEm = agora;
        if (p.vivo && Number.isFinite(d.x) && Number.isFinite(d.y)) { p.alvoX = limitar(d.x, 0, MUNDO); p.alvoY = limitar(d.y, 0, MUNDO); }
        if (Number.isFinite(d.vw)) p.vw = d.vw;
        if (Number.isFinite(d.vh)) p.vh = d.vh;
        if (d.dividir && p.vivo && agora - p.dividiuEm >= 250) { p.dividir = true; p.dividiuEm = agora; }
        if (d.soltar && p.vivo && agora - p.soltouEm >= 120) { p.soltar = true; p.soltouEm = agora; }
        avancar(s, agora);
        return visao(s, p, agora);
      },
      sair(usuario) {
        if (!usuario) return true;
        const turma = ondeEsta.get(usuario.id);
        const s = turma === undefined ? null : salas.get(turma);
        const p = s && s.jogadores.get('u:' + usuario.id);
        if (p) tirar(s, p);
        ondeEsta.delete(usuario.id);
        return true;
      },
      // Só o instrutor: abrir ou fechar a arena para os alunos e ligar ou desligar os robôs.
      configurar(usuario, d = {}) {
        exigir(usuario);
        if (!ehInstrutor(usuario)) throw new Error('Apenas o instrutor pode fazer isso.');
        if (typeof d.aberta === 'boolean') {
          config.aberta = d.aberta;
          if (!d.aberta) for (const s of salas.values()) for (const p of [...s.jogadores.values()]) if (!p.robo && !p.instrutor) tirar(s, p);
        }
        if (typeof d.robos === 'boolean') { config.robos = d.robos; for (const s of salas.values()) completarRobos(s, relogio()); }
        return api.estado(usuario);
      },
      // Para os testes: a arena de uma turma, por dentro.
      _arena: (turma) => salas.get(String(turma || '')) || null,
    };
    return api;
  };
});
