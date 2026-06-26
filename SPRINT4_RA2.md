# Sprint 4 — RA2: Cerimônias e Validação
**Projeto:** BiblioTech — Biblioteca Acadêmica  
**Equipe:** Mateus Conte (Dev) · Pauline (Product Owner)  
**Data:** 19/05/2026

---

## Cerimônias Pré-Sprint

### Refinamento do Backlog

Realizado antes do planejamento para reavaliar e priorizar os itens do backlog com base nos resultados da Sprint 3.

**Itens revisados:**
- Busca avançada de livros (filtro por categoria, autor, disponibilidade)
- Tela de detalhes do livro com avaliações
- Fluxo completo de empréstimo e devolução pelo aluno
- Notificações de prazo de devolução
- Painel do bibliotecário (gestão de empréstimos)
- Correção de lentidão na função `recomendar_livros`
- Correção do bug de banner não carregando em produção

**Resultado do refinamento:**  
Os itens de correção de bug foram promovidos ao topo da fila. A notificação de prazo foi adiada por não ter backend de e-mail configurado ainda.

---

### Planejamento da Sprint 4

**Objetivo da sprint:**  
Estabilizar as funcionalidades existentes (home do aluno, recomendações) e entregar o fluxo de empréstimo completo.

**Itens selecionados para a Sprint 4:**

| # | Item | Responsável | Estimativa |
|---|------|-------------|------------|
| 1 | Corrigir lentidão na `recomendar_livros` | Mateus | 3h |
| 2 | Corrigir bug de banner não carregando | Mateus | 2h |
| 3 | Endpoint `POST /api/emprestimos` | Mateus | 4h |
| 4 | Endpoint `PUT /api/emprestimos/:id/devolver` | Mateus | 3h |
| 5 | Tela de empréstimos ativos do aluno | Mateus | 5h |
| 6 | Tela de detalhes do livro | Mateus | 4h |
| 7 | Refinamento do backlog Sprint 5 | Pauline | 2h |

**Total estimado:** 23h  
**Capacidade disponível:** 24h (reduzida em relação à Sprint 3 para comportar margem de testes)

---

## Cerimônias Pós-Sprint (Sprint 3 — Base para planejamento)

### Revisão da Sprint 3

**Demonstração realizada em:** 15/05/2026  
**Presentes:** Mateus, Pauline

**Funcionalidades entregues e validadas:**
- Home do aluno: BannerCarousel, Seção "Para Você", Mais Lidos, Categorias, Histórico de Leitura, "Por que você leu"
- Seed de banners funcionando (`seed-banners.js`)
- Migration 012 aplicada no banco

**Funcionalidades não entregues:**
- Tela de detalhes do livro (não iniciada — complexidade subestimada)
- Busca avançada (deprioritizada pelo PO durante a sprint)

---

### Retrospectiva da Sprint 3

**O que funcionou bem:**
- Separação clara de responsabilidades entre hooks (`useHome.ts`) e componentes
- Uso do React Query reduziu código de loading/error em ~40%
- Comunicação rápida quando surgiu o bug do banner

**O que não funcionou:**
- A estimativa da tela de detalhes do livro foi otimista; não levou em conta os dados de avaliações
- O bug de lentidão na `recomendar_livros` só foi descoberto em estágio final, atrasando o QA
- Dois componentes da home precisaram de retrabalho por inconsistência visual (PorqueVoceLeuSection, HistoricoLeituraSection)

**Ações de melhoria:**
- Incluir tempo explícito de testes antes do QA final
- Quebrar estimativas de telas novas em subtarefas menores
- Pauline revisar protótipo antes do dev iniciar componentes visuais

---

## Relatório — Dados, Indicadores e Decisões

### 1. Dados Utilizados

Os dados abaixo são referentes à **Sprint 3** e foram usados para planejar a Sprint 4:

| Dado | Valor |
|------|-------|
| Tarefas planejadas | 10 |
| Tarefas concluídas | 7 |
| Bugs encontrados durante a sprint | 3 |
| Tarefas que sofreram atraso | 2 |
| Tarefas com retrabalho | 2 |
| Horas estimadas totais | 28h |
| Horas reais gastas | 31h |

**Bugs identificados:**
1. Função `recomendar_livros` com query lenta (> 2s para alunos com histórico grande)
2. Banner não carregando em produção por caminho de imagem relativo incorreto
3. Token JWT expirado não redirecionando para login em algumas rotas protegidas

---

### 2. Indicadores

#### Indicador 1 — Taxa de Conclusão de Tarefas

**Cálculo:**  
`Tarefas concluídas / Tarefas planejadas × 100`  
`= 7 / 10 × 100 = **70%**`

**Como foi obtido:** Contagem direta das tarefas marcadas como "done" no board ao fim da sprint.

**Para que serve:** Mede a previsibilidade da equipe. Uma taxa abaixo de 80% indica que estamos superestimando capacidade ou subestimando complexidade. Serve de base para ajustar o volume de tarefas nas próximas sprints.

---

#### Indicador 2 — Taxa de Retrabalho

**Cálculo:**  
`Tarefas com retrabalho / Tarefas concluídas × 100`  
`= 2 / 7 × 100 ≈ **28,5%**`

**Como foi obtido:** Identificado nas tarefas que foram reabertas ou que geraram commits de correção após o "done" inicial (HistoricoLeituraSection e PorqueVoceLeuSection).

**Para que serve:** Mede a qualidade da entrega. Uma taxa alta indica falta de critérios de aceitação claros ou ausência de revisão de protótipo antes do desenvolvimento. Ideal manter abaixo de 15%.

---

### 3. Decisões para a Sprint 4

Com base nos dados e indicadores acima, as seguintes decisões foram tomadas:

**1. Reduzir o volume de tarefas de 10 para 7**  
A taxa de conclusão de 70% indica que 10 tarefas está acima da capacidade real da equipe. Trabalhar com 7 tarefas bem definidas aumenta a chance de entrega completa e reduz frustração.

**2. Priorizar correção de bugs antes de novas funcionalidades**  
Os 3 bugs da Sprint 3 estão em produção e afetam diretamente a experiência do aluno. A lentidão nas recomendações e o bug do banner entram nos primeiros dias da Sprint 4.

**3. Pauline revisa protótipo antes do dev iniciar componentes visuais**  
A taxa de retrabalho de 28,5% foi causada principalmente por inconsistência entre o que foi codificado e o esperado pelo PO. A validação visual antecipada evita retrabalho custoso.

**4. Quebrar estimativas de telas novas em subtarefas**  
A tela de detalhes do livro não foi entregue porque a estimativa não considerou avaliações, loading states e responsividade separadamente. A partir desta sprint, telas novas devem ter subtarefas explícitas.

**5. Incluir 1h de testes ao final de cada tarefa de backend**  
O bug da `recomendar_livros` foi descoberto tarde por falta de teste com dados reais. Cada endpoint novo precisa ser testado com dados de volume antes de ir para o QA.

---

*Documento elaborado por: Mateus Conte (Dev) e Pauline (PO)*  
*BiblioTech — Sprint 4 · Maio/2026*
