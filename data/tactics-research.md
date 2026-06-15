# Pesquisa de táticas reais (presets `REAL_CURRENT_RESEARCH`)

Pesquisa feita em **2026-06** para configurar a tática inicial de cada seleção.
Confiança **média** (táticas evoluem; baseado em análises de 2025/26). Edite os
perfis em `src/data/researchedTactics.ts` ou crie novos para outras seleções.

## Brasil — Carlo Ancelotti (4-3-3 / 4-2-3-1)
Compacto e organizado sem bola; em posse move a bola rápido, minimiza toques e
progride pelo **meio** para acessar os **pontas no espaço**. Vertical **com
critério** (passe progressivo + ataque ao espaço), **não chutão**. Controle de
jogo (mais medido que o Brasil "só individualidade").
- `buildUpStyle: balanced`, `longBallFrequency: 0.32`, `progressivePassBias: 0.75`
- `pressingIntensity: 0.58`, `defensiveLineHeight: 0.55`, `tempo: 0.72`
- Transição ofensiva: acelerar e atacar o espaço pelos pontas.

Fontes:
- https://worldsoccertalk.com/world-cup/brazil-2026-world-cup-preview-squad-breakdown-key-player-and-tactical-analysis/
- https://tacticalfootballanalysis.com/carlo-ancelotti-tactics-brazil-2026-world-cup-tactical-analysis/
- https://totalfootballanalysis.com/data-analysis/carlo-ancelotti-brazil-data-analysis-statistics

## Argentina — Lionel Scaloni (4-3-3 → 4-4-2 sem bola)
Posse e controle com jogo **relacional** (muita movimentação/liberdade). Sem bola
vira 4-4-2 compacto com **contra-pressão intensa**. Domina as **transições**:
após recuperar, ataca vertical priorizando o **canal central**.
- `buildUpStyle: short`, `longBallFrequency: 0.28`, `progressivePassBias: 0.70`
- `pressingIntensity: 0.78`, `counterPressing: 0.82`, `attackFocus: center`
- Transição defensiva: contra-pressão imediata, fecha linhas de passe.

Fontes:
- https://www.squawka.com/en/features/tactical-analysis-argentina-most-interesting-national-team-2026-world-cup/
- https://the-footballanalyst.com/argentina-lionel-scaloni-tactical-analysis/
- https://mbpschool.com/en/argentina-national-team-tactical-analysis/

## Leva 1 da Copa (overalls reais EA FC 26 — fcratings, 2026-06)
Confiança **média**. Os overalls são reais; os perfis táticos abaixo vêm de
conhecimento geral do estilo de cada seleção (não de artigo dedicado por técnico).
Elenco = melhor XI por posição dos dados (não é a convocação oficial exata).

- **França** (Deschamps): sólida/pragmática, letal em transição com Mbappé/Dembélé. `france-18`.
- **Inglaterra** (Tuchel): posse e controle, pontas decisivos, metódica. `england-14`.
- **Espanha** (de la Fuente): tiki-taka, posse altíssima, pressão alta, falso 9. `spain-45`.
- **Portugal** (R. Martínez): posse criativa, meio técnico, ofensiva. `portugal-38`.

Fontes (ratings): https://www.fcratings.com/nations/{france-18,england-14,spain-45,portugal-38}

> Faltam 42 seleções (Copa tem 48) — serão adicionadas em levas. Onde um elenco
> não tiver uma posição nos dados, o seletor encaixa o defensor/volante melhor
> ranqueado (nunca um atacante), nunca inventando overall.

> ⚠️ Uso de teste local. Para build pública, trocar nomes/dados por
> fictícios/licenciados.
