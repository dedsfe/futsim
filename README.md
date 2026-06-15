# FutSim 2D — Simulação de futebol tática

Jogo de futebol 2D visto de cima, no estilo da simulação visual do FIFA/Football
Manager, onde você atua como **técnico**: não controla um jogador, define a
**tática** e a vê acontecer em tempo real.

Partida ao vivo: campo, bola com física, 11×11 jogadores com IA por decisão,
placar, cronômetro, gols com reinício, goleiros, e um sistema tático profundo
(coletivo + individual) que altera o comportamento em campo na hora.

## Como rodar

```bash
npm install
npm run dev      # abre em http://localhost:5180
```

Outros comandos:

```bash
npm run build    # build de produção (tsc + vite)
# simulação headless (valida o motor sem render):
npx esbuild scripts/headless.ts --bundle --platform=node --format=esm --outfile=/tmp/h.mjs && node /tmp/h.mjs
```

## Por que TypeScript + Canvas (sem engine)

O valor do projeto está na **IA de decisão e na tática**, não na renderização
(que aqui é só círculos e linhas). Por isso o núcleo (`simulation/`, `ai/`,
`tactics/`, `domain/`) é **TypeScript puro, sem nenhuma dependência de Canvas/DOM**
— testável, portável e fácil de expandir. A camada visual (`rendering/`, `ui/`)
é trocável sem tocar na lógica. O teste headless roda uma partida inteira em
Node justamente porque o motor não conhece o navegador.

## Arquitetura

```
src/
  core/          # matemática (Vec2), constantes do campo, RNG determinístico
  domain/        # entidades: Player, Ball, Team + tipos (atributos, instruções, tática)
  tactics/       # formações, táticas padrão, comandos rápidos
  ai/            # PERCEPÇÃO + DECISÃO + POSICIONAMENTO (cérebro dos jogadores)
  simulation/    # MatchEngine: loop, física, posse, desarmes, gols, tempo, reinício
  rendering/     # Renderer Canvas (campo, jogadores, bola)
  ui/            # HUD (placar/tempo), barra de comandos, painel tático completo
  main.ts        # fiação de tudo + game loop
scripts/
  headless.ts    # roda uma partida sem render para validar o motor
```

### Parte 1 — Motor base (`simulation/MatchEngine.ts`, `domain/`)

- Campo em metros (105×68), render converte para pixels.
- Bola com física de rolamento (atrito), posse, direção (`domain/Ball.ts`).
- Posse: domínio de bola solta por proximidade + atributo de controle;
  interceptações e desarmes emergem disso.
- Placar, cronômetro (1º/2º tempo), gol, **reinício automático** (quem sofre dá
  a saída), tiro de meta, escanteio e lateral simplificados.
- Goleiros com alcance e defesa próprios; jogadores presos aos limites do campo;
  times atacam lados opostos.

### Parte 2 — Inteligência por pontuação (`ai/`)

- `domain/types.ts`: 16 atributos por jogador (velocidade, passe, chute,
  marcação, drible, visão, decisão, finalização, defesa de goleiro, etc.).
- `ai/perception.ts`: pressão sobre um ponto, limpeza da linha de passe, espaço
  livre num cone, vizinhos mais próximos.
- `ai/decisions.ts`: **decisão do portador por nota**. Cada ação possível
  (chutar, passar curto, lançar em profundidade, cruzar, conduzir, driblar,
  inverter o lado, recuar, afastar, segurar) recebe uma pontuação por distância,
  risco, qualidade do jogador, pressão, espaço e tática. A melhor vence — com
  **ruído proporcional à (falta de) "decisão"** do jogador: jogadores ruins
  erram mais passes, domínios e escolhas.
- `ai/positioning.ts`: decisão sem bola (desmarcar, atacar espaço, recompor,
  pressionar, marcar, cobrir, dar amplitude).

### Parte 3 — Tática profunda (`tactics/`, `ui/`)

- **Coletiva** (`domain/types.ts → TeamTactics`): formação, mentalidade, estilo
  de posse, larguras, altura da linha, intensidade/gatilho de pressão,
  compactação, ritmo, agressividade, foco de ataque, saída de bola, tipo de
  marcação, linha de impedimento, liberdade criativa, comportamento ao
  perder/recuperar a bola.
- **Individual** (`PlayerInstructions`): mais avançado/recuado, cortar p/ dentro,
  abrir na linha, ultrapassagem, atacar profundidade, entre linhas, segurar
  posição, proteger área, marcar jogador específico, arriscar/jogar simples,
  chutar/cruzar/driblar mais, etc.
- **A tática vira movimento ao vivo** em `ai/positioning.ts`: a altura da linha
  sobe/desce o bloco, a pressão manda jogadores à bola, o foco desloca o time, o
  ponta que "corta para dentro" ataca o miolo. Nada fica só salvo no menu.
- **Interface**: barra de comandos rápidos (Pressionar, Recuar, Ataque Total,
  Manter Posse, Contra-Atacar, Bola Longa, Explorar Direita/Esquerda, Fechar
  Meio, Marcação Alta/Baixa) + painel lateral para editar formação, sistema
  coletivo e instruções por jogador. Você pode treinar qualquer um dos dois times.

## Dicas de uso

- Botão **"Ver alvos táticos"** desenha a linha de destino de cada jogador —
  ótimo para *ver* a tática agindo (mude a altura da linha ou a pressão e observe
  o bloco reagir).
- Controle de velocidade (1x…12x) no HUD; **Pausar/Retomar** na barra.
- Selecione um jogador no painel para abrir as instruções individuais dele.

## Revisão profunda da IA, regras e comportamento

Esta revisão atacou os problemas de jogabilidade (atacante que não chutava,
toques laterais sem sentido, defesa passiva, falta de regras) e deixou a partida
crível e tática.

### O que mudou — por arquivo

- **`src/ai/shooting.ts` (novo)** — modelo de finalização tipo xG:
  `evaluateShotQuality()`, `isClearChance()`, `getExpectedGoalValue()`. Considera
  distância, ângulo, defensores na linha de chute, defensor mais próximo, posição
  do goleiro, pressão, se está na área e se está cara a cara.
- **`src/ai/decisions.ts`** — reescrito com "intenção de vencer": chance clara de
  gol recebe **bônus enorme** e vence passe lateral; passe para trás vira opção de
  segurança (penalizado quando há saída ofensiva); assistência para companheiro
  melhor posicionado; **bola de saída** para escapar da pressão; chute de fora só
  com chance muito boa; não passa para quem está impedido. Cada decisão gera um
  **log** (`DecisionLog`: ação escolhida, motivo e notas) — ative `engine.debug = true`.
- **`src/ai/defense.ts` (novo)** — `dangerLevel()`, `getNearestDefenderToBall()`,
  `getCoveringDefender()`, `blockShootingLane()`, `blockPassingLaneTarget()`,
  `trackRunnerTarget()`, `tackleSkillEdge()`. Defesa por níveis de perigo.
- **`src/ai/positioning.ts`** — organização defensiva real: **1º defensor pressiona,
  2º cobre**, bloqueio de chute em perigo, fechamento de linhas, acompanhamento de
  infiltração, basculamento e bloco compacto ao defender. Atacantes **seguram a
  linha de impedimento**; zaga/volante seguram para proteger o contra-ataque.
- **`src/simulation/rules.ts` (novo)** — `isOffside()`, `foulChanceOnFailedTackle()`,
  `cardForFoul()` (amarelo/vermelho, DOGSO), `isLastDefender()`.
- **`src/simulation/MatchEngine.ts`** — desarme discreto com chance por timing/força;
  **faltas** com lei da **vantagem**; **cartões** (2º amarelo = vermelho, expulsão
  com 10 em campo); **pênalti** com cobrança e reação do goleiro; **tiro livre** com
  recuo da barreira; **impedimento** apitado no toque; goleiro que **defende** de
  verdade (chutes fortes/colocados ainda entram); cansaço afeta velocidade,
  intensidade, precisão e decisão; estatísticas ampliadas (chutes na área, passes
  para trás, desarmes, interceptações, faltas, impedimentos, pênaltis, cartões, xG,
  ações por tipo).

### Como testar

```bash
# 12 cenários de validação + métricas de uma partida completa:
npx esbuild scripts/scenarios.ts --bundle --platform=node --format=esm --outfile=/tmp/s.mjs && node /tmp/s.mjs
```

Os 12 cenários cobrem os casos pedidos (atacante livre chuta, cara a cara, volante
não chuta à toa, zagueiro pressionado joga seguro, pressão alta, linha baixa, ponta
cortando, lateral apoiando, profundidade, impedimento, pênalti, defensor
pressiona). As métricas (chutes, chutes na área, passes para trás, desarmes,
interceptações, faltas, impedimentos, posse, xG, ações por tipo) confirmam uma
partida com placares realistas, posse equilibrada e regras ativas.

## Tempo/pausa/velocidade e goleiro (sessão 3)

### Parte 1 — Tempo, pausa e continuidade fora da tela

- **`matchSpeedMultiplier`** (1x/2x/5x/10x/20x) é a fonte única de velocidade:
  `simulationDeltaTime = realDeltaTime * matchSpeedMultiplier`. Todo o motor
  (cronômetro, bola, jogadores, IA, regras, eventos, bola parada) roda em tempo
  de simulação — não é só o relógio.
- **Pausa real** (`engine.pause()/resume()/togglePause()`, `paused`): congela
  tempo, bola, jogadores, IA e regras; o estado é preservado.
- **Continuidade fora da tela**: `engine.catchUp(realElapsed)` chamado no
  `visibilitychange` (em `src/main.ts`) avança a partida pelo tempo real perdido
  × velocidade (limite `MAX_CATCHUP_SIM` = 600s de jogo por retorno). Se estiver
  pausado, não avança nada.
- UI: botões de velocidade `1x/2x/5x/10x/20x` + **Pausar/Continuar** no HUD.
- Arquivos: `src/simulation/MatchEngine.ts` (update/catchUp/advance/tick, stoppage
  em tempo de simulação), `src/main.ts`, `src/ui/hud.ts`, `src/ui/quickbar.ts`.

Testar: `npx esbuild scripts/test-time.ts --bundle --platform=node --format=esm --outfile=/tmp/t.mjs && node /tmp/t.mjs`
(valida 1x≈60s, 10x≈600s, escala linear, pausa, fora-da-tela e fora-da-tela+pausado).

### Parte 2 — Goleiro realista

- **`src/ai/goalkeeper.ts`** com estados `HOLD_BALL`, `DISTRIBUTE_SHORT`,
  `DISTRIBUTE_LONG`, `CLEAR_BALL`. O goleiro **nunca conduz/dribla para fora da
  área**: sob pressão afasta; livre e com saída curta toca em zagueiro/lateral;
  time de bola longa → lança; sem saída segura → afasta. "Jogo com os pés"
  (atributo `goalkeeping`) melhora a distribuição, mas ele segue agindo como goleiro.
- Roteado no `MatchEngine` (`owner.isGK ? decideGoalkeeper : decide`).
- Testar nos cenários (`scripts/scenarios.ts`): G1 (pressionado afasta, nunca
  conduz), G2 (livre, saída curta distribui curto), G3 (bola longa lança).

## Individualidade, overall e Brasil × Argentina (sessão 4)

### Parte 3 — Overall, atributos e traits (modelo compacto alinhado ao EA)

- **`src/domain/overall.ts`**: `calculateOverall(attr, role)` (pesos por posição),
  `calculateRoleSuitability`, `getPlayerEffectiveAttributes` (aplica fadiga).
- `Player` ganhou `name`, `overall`, `traits`, `preferredFoot`, `lastDecision`,
  `consistency()` (derivada do overall) e `hasTrait()`.
- **Overall afeta o jogo**: jogadores de overall baixo erram mais a decisão
  (ruído ×`consistencyFactor`) e a execução (erro de passe/chute ×`errMul`).
  Validação: time 86 vs 60 → 27.8 xG / 480 chutes contra 1.0 xG / 11 chutes.
- **Traits** (`Trait` em `types.ts`) influenciam decisões: FINALIZER chuta mais,
  DRIBBLER aceita mais o 1x1, PLAYMAKER/CREATIVE_PASSER buscam passe vertical,
  SPEEDSTER conduz no espaço, LONG_SHOT_TAKER arrisca de fora, INVERTED_WINGER
  corta para dentro, ATTACKING_FULLBACK ultrapassa.

### Parte 4 — Brasil × Argentina com dados reais do EA FC 26 (teste local)

> ⚠️ **Apenas teste local/pessoal.** Não usar nomes/escudos/marcas reais em build
> pública sem licença — trocar por dados fictícios/licenciados.

- **`data/ea-fc-26/manual-brazil-argentina-test.json`**: elencos com **overalls
  reais do EA FC 26** (fonte: fcratings.com, confirmados via web), além de
  posição/clube/pé. Sub-atributos (pace/shooting/…) ficam **ausentes (missing)**
  e são derivados — nenhum overall foi inventado. Há 2 jogadores fictícios
  `MANUAL_TEST` (overall 60/61) para validar a diferença craque × ruim.
- **`src/data/eaFc26Types.ts`**: tipos (`RealPlayerData`, fontes, GK block).
- **`src/data/mapEaFc26.ts`**: `mapEaFc26PlayerToSimulationPlayer` (EA → 16 atributos
  internos + traits), `mapPosition`, `inferTraits`. Usa os 6 stats EA quando
  existirem; senão deriva de overall + função + traits.
- **`src/data/buildNationalTeam.ts`**: seleciona o XI por overall/posição (sem
  improviso absurdo) e aplica estilos: **Brasil 4-3-3 vertical/transição rápida**;
  **Argentina 4-3-3 posse curta + pressão pós-perda**.
- **Modo Copa**: botão **"🏆 Brasil × Argentina (Copa)"** no topo (e "Times
  genéricos" para voltar). Placar/relógio/eventos já existentes servem de narração.

**Como atualizar/editar os ratings**: edite
`data/ea-fc-26/manual-brazil-argentina-test.json` (campo `overall` por jogador;
adicione `pace/shooting/passing/dribbling/defending/physical` se quiser sobrepor a
derivação). `source: "EA_FC_26_IMPORTED"` para dados reais; `"MANUAL_TEST"` para
fictícios. Para build pública, troque por um arquivo fictício/licenciado.

### Parte 5 — Painel/debug e testes

- Painel do jogador mostra nome, overall, time, pé, stamina, atributos-chave,
  **traits**, ação atual e **última decisão + motivo**.
- Testes: `scripts/test-time.ts` (tempo/pausa/velocidade), `scripts/test-copa.ts`
  (elencos reais, estilos diferentes, overall afeta sim, cansaço), e os cenários
  de IA/regras/goleiro em `scripts/scenarios.ts`.

```bash
npx esbuild scripts/test-time.ts --bundle --platform=node --format=esm --outfile=/tmp/t.mjs && node /tmp/t.mjs
npx esbuild scripts/test-copa.ts --bundle --platform=node --format=esm --outfile=/tmp/c.mjs && node /tmp/c.mjs
npx esbuild scripts/scenarios.ts --bundle --platform=node --format=esm --outfile=/tmp/s.mjs && node /tmp/s.mjs
```

### Ainda não feito (próxima rodada)

Prorrogação/pênaltis em mata-mata, narração textual dedicada, overlays de debug
extras (zona/linhas de passe/perigo) além do "Ver alvos táticos", e o modelo de
atributos completo de 50+ itens (hoje compacto, alinhado ao EA).

## Ajustes de comportamento + estatísticas (sessão 5)

- **Decisão com a bola (skill/trait-driven)**: de frente pro gol no terço ofensivo
  NÃO se toca pra trás à toa (bug corrigido); chutão respeita a saída de bola
  (time "curto" só afasta em pânico real); conduzir/segurar a bola vem de
  drible/controle (+ traits DRIBBLER/SPEEDSTER), não de um multiplicador genérico
  de overall. O overall agora é consequência das skills; o QI (atributo "decisão")
  dita a qualidade da escolha.
- **Defesa posicional**: no máximo ~2 jogadores na bola (1 pressiona + 1 apoio) +
  1 cobertura posicional; o resto mantém forma/zona (bloco compacto). Acabou o
  "4 atrás da bola".
- **Painel direito com abas**: **📊 Estatísticas** (placar, AUTORES DOS GOLS com
  minuto, chutes/no gol/na área, posse, xG, acerto de passe, desarmes,
  interceptações, defesas, faltas, impedimentos, pênaltis, cartões — por time) e
  **⚙️ Organização** (o painel tático). Ficha do jogador mostra overall, traits,
  ação atual e última decisão + motivo.

> ⚠️ **Equilíbrio de volume de finalizações ainda instável**: dependendo do
> confronto de formações/qualidade, a partida oscila entre "trava" e "ida e
> volta" (poucos ou muitos chutes). É um problema estrutural do modelo de
> bloco defensivo/posse, não resolvível por ajuste fino de pesos — precisa de
> uma rodada dedicada de redesenho. Os comportamentos pedidos (decisão, goleiro,
> individualidade, regras, tática) estão corretos e cobertos por testes.

## Táticas reais pesquisadas + relógio desacoplado (sessão 6)

### Tática real como preset editável (Partes 1-3)
- `src/data/researchedTactics.ts`: `ResearchedTacticalProfile` genérico (qualquer
  seleção) + `BrazilCurrentRealTactics` e `ArgentinaCurrentRealTactics`. Fontes em
  **`data/tactics-research.md`** (confiança média).
- `applyResearchedProfile()` converte o perfil nos parâmetros do motor. Ao escolher
  **Brasil×Argentina**, cada time começa com a tática real (`source:
  REAL_CURRENT_RESEARCH`) — Brasil vertical/progressivo, Argentina posse +
  contra-pressão. Os `playerRoles` viram instruções (ex.: Di María "corta p/ dentro").
- **Edição livre**: qualquer mudança no painel marca `source = USER_CUSTOM` (e
  `overrides[campo]`); o preset NÃO volta sozinho. O painel mostra a origem da
  tática + `longBallFreq`/`progressivePassBias`.

### Relógio desacoplado da física (Parte 4)
- **`matchClockMultiplier`** (1x/5x/10x/20x/30x) afeta **só** o relógio, a stamina
  e os eventos por tempo. A **física (jogadores/bola/IA) roda sempre em tempo real**
  — não fica "turbo".
  - `physicsDeltaTime = realDeltaTime` · `matchClockDeltaTime = realDeltaTime × mult`.
  - 20x → ~4,5 min reais por jogo, jogadores em velocidade natural, stamina cai como
    se 90 min tivessem passado. **Quanto maior a velocidade, menos lances** (a física
    cobre menos tempo) — 10x é o equilíbrio recomendado.
- Teste: `scripts/test-time.ts` (inclui "relógio 20x sobe 20x, física dos jogadores ~1x").

### Menos lançamento/chutão (Parte 5)
- `shouldAttemptLongBall()` / `shouldClearBall()` em `decisions.ts`: lançamento só
  com contexto (corredor livre + atacante no espaço + passador com qualidade, defesa
  alta, ou emergência) e conforme `longBallFreq`; senão `score *= 0.35`. Chutão só em
  pânico real no próprio terço. Passe progressivo rasteiro é favorecido por
  `progressivePassBias`. Zagueiro/goleiro livres não rifam.

## Regras 100% + início/fim + velocidade (sessão 7)

- **Pontapé inicial correto**: todos no próprio campo, círculo central livre (só o
  cobrador), bola no meio com o time da saída. **2º tempo** sai para quem NÃO
  começou; **fim de jogo** aos 90'.
- **Reinícios verificados** (`scripts/test-rules.ts`, 14/14): lateral para o
  adversário do último toque; **escanteio** para quem atacava (com atacantes
  ocupando a área e alvo do cruzamento marcado); **tiro de meta com o GOLEIRO**;
  **gol** ao cruzar a linha entre as traves; impedimento, falta, pênalti e cartões
  já cobertos. Tudo nos dois lados do campo.
- **Velocidade** começa em **10x** (removidos 1x/5x, que ficavam lentos demais com
  a física em tempo real): 10x / 20x / 30x, padrão 10x.

Rodar a verificação de regras:
```bash
npx esbuild scripts/test-rules.ts --bundle --platform=node --format=esm --outfile=/tmp/r.mjs && node /tmp/r.mjs
```

## Passe longo (sessão 8)

O passe longo errava demais por 3 motivos, agora corrigidos:
1. usava o **mesmo erro angular** do passe curto → ampliado pela distância (errava
   muito longe). Agora o passe longo tem erro angular menor.
2. velocidade **capada em 26 m/s** → caía curto em distâncias grandes. Cap subiu
   p/ ~34 m/s no passe longo (alcança o alvo).
3. usava só `passing`. Agora usa **`passing` + `vision`** (passador bom acerta mais).

Estatística nova: `stats.longPass` / `longPassOk` → conclusão de passe longo ~50%
(real ~45-60%). **Nota:** a conclusão de passe GERAL ainda fica ~53% (real ~80%) —
é o excesso de interceptações/transições do problema estrutural de posse já citado.

## Seleções da Copa + seletor de confronto (sessão 8)

- **Leva 1 de seleções** (overalls reais EA FC 26): **Brasil, Argentina, França,
  Inglaterra, Espanha, Portugal**. Cada uma com tática real pesquisada como ponto
  de partida (editável). Dados em `data/ea-fc-26/squads-batch1.json` +
  `manual-brazil-argentina-test.json`; perfis em `src/data/researchedTactics.ts`.
- **Arquitetura escalável**: `AVAILABLE_NATIONS` + `buildNation(id, side)`. Adicionar
  uma seleção = só dropar o elenco no JSON + um perfil tático. Faltam 42 (Copa tem
  48) — entram em levas.
- **Seletor de confronto** no topo: escolha mandante × visitante entre todas as
  seleções (ou "Genéricos") e clique **▶ Iniciar**.
- Seleção de XI robusta: respeita posições naturais e **alternativas**; quando
  falta uma posição nos dados, encaixa o defensor/volante melhor ranqueado —
  **nunca um atacante na zaga**, e nunca inventa overall.

## Fidelidade dos jogadores: sub-stats reais + traits (sessão 9)

As 6 seleções (Brasil, Argentina, França, Inglaterra, Espanha, Portugal) agora são
fiéis de verdade — chega de atributo "no chute".

### Dado REAL (EA FC 26, fcratings, 2026-06) — `src/data/faceStats.ts`
- Cada jogador tem os **6 face stats reais**: PAC, SHO, PAS, DRI, DEF, PHY.
- **Goleiros** têm os stats de GK reais (DIV, HAN, KIC, REF, SPD, POS).
- O overall continua real e agora serve só para **consistência/decisão**, não para
  inventar os sub-stats.

### Mapeamento correto — `src/data/mapEaFc26.ts`
- PAC→velocidade/aceleração; SHO→finalização/chute; PAS→passe/visão/cruzamento;
  DRI→drible/controle; DEF→marcação/desarme; PHY→força/resistência.
- **GK**: usa stats de goleiro; marcação/finalização/drible ficam baixos
  (goleiro não é zagueiro). Ex.: Maignan marcação **24** (era 90), GK 85.
- **Sem dado real** → fallback conservador por posição (nunca 99). Ex.: Koundé
  pace **84 real** (era 99 inventado).
- GKs sem stats na fonte (Pickford, Diogo Costa, Ederson reserva) → `goalkeeping`
  = overall real + resto conservador (marcado como fallback).

### Traits PERSONALIZADAS dos craques — `KNOWN_TRAITS`
- Mbappé `SPEEDSTER/FINALIZER/ATTACKS_DEPTH/INSIDE_FORWARD`; Yamal
  `DRIBBLER/INVERTED_WINGER/CREATIVE_PASSER`; Pedri `PLAYMAKER/PRESS_RESISTANT/
  BETWEEN_LINES`; Rodri `DEFENSIVE_ANCHOR/DEEP_PLAYMAKER`; Messi
  `PLAYMAKER/BETWEEN_LINES/FREE_ROLE`; Vini, Ronaldo, Bruno, Bellingham, Kane etc.
- Traits viram **comportamento**: cortar p/ dentro, atacar profundidade, chutar de
  longe, pressionar, passe vertical, `PRESS_RESISTANT` perde menos bola sob pressão.

### Validação — `scripts/test-players.ts` (10/10)
Mbappé rápido + profundidade, Yamal corta p/ dentro, Pedri playmaker (não box-to-box
genérico), Rodri âncora, Messi entre linhas, Vini 1x1, Ronaldo finalizador, **GKs
coerentes** (GK alto, marcação/finalização baixas), zagueiro técnico não vira meia,
e **nenhum atributo absurdo** em todo o elenco.

> Próxima leva de seleções só depois disso, conforme combinado (qualidade > quantidade).

## Disputa de bola (sessão 11)

Antes o 50/50 era decidido só por **proximidade** (quem estava mais perto pegava).
Agora é uma **disputa física** de verdade em `resolveLooseBall`:
- Vence quem tem melhor combinação de **força (peso maior) + controle + proximidade**
  (+ um pouco de agressividade e acaso). Físico alto **leva mais o 50/50** —
  validado: Upamecano (físico 84) vence Rodrygo (63) ~98% numa bola dividida.
- **Faltas na disputa**: o desarme já gerava falta no challenge; agora um desafio
  físico colado, com a bola parada, também pode resultar em falta do mais fraco
  (raro, com cooldown pra não acumular). O goleiro tem prioridade na bola ao seu
  alcance.
- Teste: `scripts/test-players.ts` #11 (físico alto > 60% nos 50/50).

> Em velocidade de jogo (10x-20x) as faltas/disputas ficam em níveis realistas
> (~20-35/jogo); no 1x cheio sobem junto com o volume geral (item estrutural).

## Pênaltis e prorrogação (sessão 12)

- **Disputa de pênaltis** (`startShootout`): sequência alternada de 5 cobranças +
  morte súbita, com **decisão antecipada** quando não dá mais pra alcançar.
  Jogadores **posicionados certo** (cobrador na marca, goleiro na linha, demais no
  círculo central); o goleiro do time adversário defende, escolhe um lado e mergulha;
  conversão ~75% (realista). Placar e ✅/❌ por cobrança aparecem no HUD.
- **Botões** no topo: **🥅 Pênaltis** (vai direto pra disputa — dá pra ver na hora)
  e **⏱ Prorrogação** (reabre o jogo, fim em 120').
- Testes: `scripts/test-rules.ts` (vencedor coerente, ≥3 cobranças/lado, prorrogação reabre o jogo).

> **Táticas ficam fixas:** o que você define no painel vive em `team.tactics` e
> persiste durante a partida (só muda se VOCÊ mexer ou usar um comando rápido).
> Trocar o time treinado não apaga os ajustes do outro.

## Próximos passos naturais (não incluídos de propósito)

Cobranças de falta/pênalti, impedimento real, substituições/cansaço por jogo,
narração de eventos, e — sobre o mesmo núcleo — carreira/transferências.
```
