# Documentação — Zaldemy (Memly)

App de aprendizado de idiomas por flashcards, frases e treinos com IA. Frontend em React (SPA), publicado como PWA instalável e também empacotado como app Android nativo via Capacitor. O backend é uma API PHP separada (não está neste repositório), consumida via `fetch`/`axios` em `https://api.zaldemy.com` (produção) ou `https://hml-api.zaldemy.com` (homologação), definida por `VITE_API_URL`.

> Este documento foi gerado a partir da leitura do código-fonte (`src/`). Não há acesso ao repositório do backend, então os efeitos de cada endpoint foram inferidos pelo uso que o frontend faz deles.

## 1. Stack técnica

- **React 19** + **Vite 7** (SPA), roteamento com `react-router-dom` v7.
- **Tailwind CSS** + Bootstrap (ícones) para estilo.
- **Capacitor 8** — empacota o build web como app Android nativo (`android/`), plugin `@capgo/capacitor-social-login` para login Google nativo.
- **vite-plugin-pwa** — gera Service Worker com Workbox (app instalável, cache offline).
- **i18next** — internacionalização (15 idiomas em `src/locales/`).
- **Recharts** — gráficos da tela de métricas.
- Integrações de terceiros client-side: **YouTube Data API**, **OpenLibrary API** + **archive.org** (leitura digital), **Google Identity Services** (login).

## 2. Arquitetura de autenticação

Token tipo Bearer, guardado em `localStorage["token"]`. Todo estado de sessão vive em `AuthContext` ([src/context/AuthContext.jsx](src/context/AuthContext.jsx)):

- `checkAuth()` — chama `GET /controller/me.php` com o token; se `401/403`, limpa o token e desloga. Se a requisição falhar por rede, **mantém** a sessão atual (não desloga por instabilidade de conexão).
- `syncAuth(token)` — usado logo após login/cadastro: grava o token e força um `checkAuth` imediato (não silencioso), garantindo que a navegação para rotas privadas só ocorra depois de confirmar que o usuário está autenticado.
- `logout()` — `POST /controller/logout.php` e limpa o token local.

`AuthGate` ([src/components/AuthGate.jsx](src/components/AuthGate.jsx)) envolve todas as rotas: enquanto carrega, mostra o logo pulsando; se o usuário já está logado e tenta acessar `/`, `/login` ou `/cadastrar`, redireciona automaticamente para `/home` (se onboarding completo) ou `/escolheridioma` (se não).

`PrivateRoute` (em [src/App.jsx](src/App.jsx)) protege as rotas internas: sem usuário → redireciona para `/login`; sem conexão (fora das rotas que funcionam offline: `/home`, `/flashcards`, `/emparelhar`) → mostra tela de status de conexão.

## 3. Fluxo de cadastro (passo a passo)

### 3.1 Cadastro — [src/pages/Cadastro.jsx](src/pages/Cadastro.jsx) (`/cadastrar`)

Formulário: nome, e-mail, senha, confirmar senha (todos obrigatórios, validados no cliente antes do envio).

`POST /controller/auth.php` `{ action: "register", name, email, password, confirm_password }`
→ sucesso: navega para `/verificaremail` passando o e-mail digitado (não loga automaticamente).

Também oferece **cadastro/login com Google**, com três variantes conforme o contexto de execução:

| Contexto | Mecanismo | Arquivo |
|---|---|---|
| App Android nativo (Capacitor) | `SocialLogin.login({provider:'google'})` do plugin `@capgo/capacitor-social-login` | [src/utils/googleNativeAuth.js](src/utils/googleNativeAuth.js) |
| PWA instalado (standalone) | Redirect de página inteira (fluxo implícito OAuth2, `response_type=token`), pois popup não funciona em app instalado | [src/utils/googleRedirectAuth.js](src/utils/googleRedirectAuth.js) |
| Navegador comum | Popup do Google Identity Services (`useGoogleLogin`) | `@react-oauth/google` |

Todas as três convergem para `handleGoogleAccessToken(accessToken)` → `POST /controller/auth.php` `{action:"login_google", token}`. Se o e-mail Google já existir, isso funciona como **login**; se não existir, o backend presumivelmente cria a conta na hora (não há uma tela de "cadastro Google" separada — cadastro e login por Google são o mesmo endpoint/ação).

### 3.2 Verificação de e-mail

1. [src/pages/VerificarEmail.jsx](src/pages/VerificarEmail.jsx) (`/verificaremail`) — tela estática de espera, mostra o e-mail mascarado (`ex***@dominio.com`). Botão "reenviar e-mail" **não está implementado** (função vazia, no-op). Botão "já confirmei" leva para `/login`.
2. O e-mail de verificação enviado pelo backend contém um link para `/emailverificado?token=...`.
3. [src/pages/EmailVerificado.jsx](src/pages/EmailVerificado.jsx) — ao carregar, chama `GET /controller/verify.php?token=...`. Se `success:true`, mostra confirmação e redireciona para `/login` em 3s; se falhar (link inválido/expirado), mostra erro com botão manual para `/login`.

### 3.3 Login — [src/pages/Login.jsx](src/pages/Login.jsx) (`/login`)

`POST /controller/auth.php` `{action:"login", email, password}` → grava token, chama `checkAuth()`, e navega conforme o `step` do usuário (ver seção 3.4).

A tela de login também detecta o contexto de acesso e adapta a UI:
- **Desktop**: mostra um QR code (via `qrcode.react`) para o usuário continuar no celular.
- **Mobile fora do app instalado**: instruções de instalação (Android via `beforeinstallprompt`, iOS via instruções do menu Compartilhar).
- **Navegador in-app** (Instagram/Facebook/TikTok): aviso para abrir no Chrome/Safari, pois o login Google não funciona nesses WebViews.

### 3.4 Onboarding (após primeiro login/cadastro) — semântica do campo `user.step`

O onboarding é controlado por um inteiro `step` retornado pelo backend em `/controller/me.php` e em cada resposta de autenticação. Cada tela de onboarding: (a) se o usuário já passou daquele passo, pula automaticamente para o próximo; (b) ao concluir, atualiza `step` **otimisticamente** no estado local, força um `checkAuth(true)` para resincronizar com o servidor, e navega adiante.

| `step` | Significa | Tela | Ao concluir → |
|---|---|---|---|
| `0` (ou ausente) | Falta escolher idioma nativo | [EscolherIdiomaNativo.jsx](src/pages/EscolherIdiomaNativo.jsx) — `/escolheridioma` | `POST language.php {action:"set_native_language"}` → `step=1` → `/escolheridiomaaprender` |
| `1` | Falta escolher idioma a aprender | [EscolherIdiomaAprender.jsx](src/pages/EscolherIdiomaAprender.jsx) — `/escolheridiomaaprender` | `POST language.php {action:"set_learning_language"}` → `step=2` → `/referenciausuario` |
| `2` | Falta responder "como conheceu o app" | [ReferenciaUsuário.jsx](src/pages/ReferenciaUsuário.jsx) — `/referenciausuario` | `POST canalaquisicao.php {action:"register_channel", rede_social}` → `step=3` → `/home` |
| `> 2` | Onboarding completo | — | Acesso direto a `/home` |

As listas de idiomas vêm de `POST language.php {action:"list_languages"}` (nativo) e `{action:"list_languages_learning"}` (aprendizado) — dropdowns com busca e bandeiras (flagcdn.com).

### 3.5 Esqueci / redefinir senha

- [EsqueciSenha.jsx](src/pages/EsqueciSenha.jsx) (`/esquecisenha`) — `POST auth.php {action:"forgot_password", email}`, mostra confirmação na própria tela (backend envia e-mail com link).
- [RedefinirSenha.jsx](src/pages/RedefinirSenha.jsx) (`/redefinirsenha?token=...`) — sem token na URL, mostra erro e leva de volta para "esqueci senha"; com token, valida senha + confirmação e envia `POST auth.php {action:"reset_password", token, password, confirm_password}`; sucesso → redireciona para `/login` em 3s.

## 4. Fluxo principal do app (pós-onboarding)

### 4.1 Home — [src/pages/Home.jsx](src/pages/Home.jsx) (`/home`)

Dashboard com as categorias de frases do usuário, filtradas pelo par idioma nativo/aprendendo atual (`POST categorias.php {action:"listar-com-quantidade"}`). Cada categoria abre a lista de frases (`/frases/:id`) ou o modal de treino (escolha entre os modos de estudo). Permite criar, editar e excluir categorias. Um heartbeat a cada 60s (`treino.php {action:"retornarTreino"}`) parece disparar processamento de repetição espaçada no backend.

### 4.2 Frases — [src/pages/Frases.jsx](src/pages/Frases.jsx) (`/frases/:id`) e [FrasesGeral.jsx](src/pages/FrasesGeral.jsx) (`/frasesgeral/:id`)

Lista de frases de uma categoria própria (CRUD completo: adicionar, editar, excluir, buscar) ou de uma categoria compartilhada/pública (`frasesgeral`, somente adicionar). Frases têm áudio TTS via `treino.php?action=voice`.

### 4.3 Categorias compartilhadas — [src/pages/listCategorias.jsx](src/pages/listCategorias.jsx) (`/listcategorias`)

Lista paginada (scroll infinito) de categorias públicas de outros usuários (`categorias.php {action:"get_all"}`), com botão para importar (`{action:"adicionar_compartilhado"}`) para a própria conta.

### 4.4 Modos de treino/estudo

Todos recebem `:id` (categoria) e `:mode` na rota, e usam a mesma convenção: `mode` ∈ `learn` | `review` | `traine` decide se a chamada vai para `frases.php` (aprendizado normal) ou `treino.php` (repetição espaçada), com `action: mode`.

| Modo | Tela | Rota | Descrição |
|---|---|---|---|
| Flashcards | [Flashcards.jsx](src/pages/Flashcards.jsx) | `/flashcards/:id/:mode` | Cartão vira automaticamente após 8s, toca áudio nativo/traduzido, usuário marca "lembrei"/"não lembrei" |
| Emparelhar | [Emparelhar.jsx](src/pages/Emparelhar.jsx) | `/emparelhar/:id/:mode` | Jogo de associar frase nativa ↔ traduzida, em lotes de 4 |
| Digitar texto | [DigitarTexto.jsx](src/pages/DigitarTexto.jsx) | `/digitartexto/:id/:mode` | Usuário digita a tradução de memória; diff caractere a caractere destaca erros |
| Treino com IA | [treinoIA.jsx](src/pages/treinoIA.jsx) | `/treinoia` | Gera uma frase nova via IA (`aiController.php`) para praticar |
| Perguntas diárias | [Perguntas.jsx](src/pages/Perguntas.jsx) | `/perguntasia` | Pergunta diária de redação livre, com correção por IA e limite diário |

No modo **`learn`**, as três telas (Digitar Texto → Emparelhar → Flashcards) se encadeiam automaticamente ao final de cada uma, formando uma sequência de aprendizado de uma frase nova.

### 4.5 Leitura digital — [LeituraDigital.jsx](src/pages/LeituraDigital.jsx) + [BookDetails.jsx](src/pages/BookDetails.jsx)

Busca de livros em inglês via API pública da OpenLibrary e leitura embutida via iframe do archive.org — não depende do backend próprio.

### 4.6 Métricas — [Metricas.jsx](src/pages/Metricas.jsx) (`/metricas`)

Gráficos de acerto ao longo do tempo e por categoria (`metricas.php {action:"dashboard"}`), taxa de acerto, streak atual e recorde, detalhamento por frase.

### 4.7 Configurações — [Configuracoes.jsx](src/pages/Configuracoes.jsx) (`/configuracoes`)

Ajuste da quantidade de frases por sessão de aprendizado (1–8), logout, **exclusão de conta** (`configuracoes.php {action:"excluir_conta"}`), links para Termos de Uso e Política de Privacidade.

### 4.8 Cabeçalho — [Header.jsx](src/includes/Header.jsx)

Presente em `/home`, `/metricas`, `/listcategorias`: mostra idioma nativo e um seletor do idioma que está aprendendo (troca via `language.php {action:"update_learning_reference"}`). Menu lateral: FAQ, Contato, Compartilhar app, Configurações, Logout.

## 5. Recursos transversais

- **Offline**: [ConnectionContext.jsx](src/context/ConnectionContext.jsx) expõe `isOnline`/tipo de conexão; [ConnectionStatus.jsx](src/components/ConnectionStatus.jsx) mede latência (ping em `/favicon.ico` a cada 10s) e mostra banners de "offline" ou "conexão lenta".
- **PWA/Service Worker** ([vite.config.js](vite.config.js)): cache de imagens (30 dias), cache do áudio TTS (`treino.php?action=voice`, até 1 ano — por isso os áudios repetidos tocam instantaneamente), demais chamadas de API são `NetworkOnly` (nunca cacheadas).
- **Premium**: [PremiumModal.jsx](src/components/PremiumModal.jsx) é só uma vitrine — o botão "assinar" **não tem ação implementada** ainda. Existe um campo `user.plano` usado em alguns pontos (ex.: liberar Treino IA), e um caminho de TTS premium via ElevenLabs (`elevenlabs.php {action:"stream_audio"}`) que hoje está **restrito a um único usuário de teste** (`user.id === 47`) no código.
- **Analytics**: [analytics.js](src/utils/analytics.js) injeta GA4 e registra `page_view` manualmente a cada troca de rota.
- **Extras sem backend próprio**: [MusicFlashcardFInder.jsx](src/pages/MusicFlashcardFInder.jsx) (busca letras de música via YouTube, salva flashcards só no `localStorage`) e [EnglishVideos.jsx](src/pages/EnglishVideos.jsx) (vídeos de prática de listening).

## 6. Mapa de endpoints da API (por arquivo de controller)

| Controller | Ações (`action`) | Usado em |
|---|---|---|
| `auth.php` | `login`, `login_google`, `register`, `forgot_password`, `reset_password` | Login, Cadastro, EsqueciSenha, RedefinirSenha |
| `me.php` | (sem action, GET com Bearer) | AuthContext |
| `verify.php` | (sem action, GET `?token=`) | EmailVerificado |
| `logout.php` | (sem action, POST com Bearer) | AuthContext |
| `language.php` | `list_languages`, `list_languages_learning`, `set_native_language`, `set_learning_language`, `update_learning_reference` | Onboarding, Header |
| `canalaquisicao.php` | `register_channel` | ReferenciaUsuário |
| `categorias.php` | `listar-com-quantidade`, `excluir_categoria`, `get_all`, `adicionar_compartilhado`, `adicionar_categoria`, `editar_categoria` | Home, listCategorias, modais |
| `frases.php` | `frases`, `frasesgeral`, `add_phrase`, `edit_phrase`, `delete_phrase`, `learn`, `review` | Frases, FrasesGeral, Flashcards/Emparelhar/DigitarTexto |
| `treino.php` | `retornarTreino`, `training_stats`, `update_repeat`, `traine`, `trainee_finish`, `voice` | Home, ModalTreino, telas de treino |
| `libreTranslate.php` | (sem action) | Home (tradução de textos de UI) |
| `aiController.php` | (sem action) | treinoIA |
| `DailyQuestionController.php` | `skip`, (sem action = responder) | Perguntas |
| `metricas.php` | `dashboard`, `listar_frases_metricas` | Metricas |
| `configuracoes.php` | `obter`, `atualizar_quantidade_frases_aprender`, `excluir_conta` | Configuracoes |
| `elevenlabs.php` | `stream_audio` | audioPlayer (restrito a usuário de teste) |

## 7. Observações / pontos de atenção encontrados no código

- Botão "reenviar e-mail" em `VerificarEmail.jsx` está sem implementação (no-op).
- Botão "assinar" do `PremiumModal.jsx` não tem ação associada.
- Caminho de TTS premium (ElevenLabs) está com checagem hardcoded para `user.id === 47`, não uma regra de plano genérica.
- `MusicFlashcardFInder.jsx` salva "flashcards" só em `localStorage`, sem sincronizar com o backend — dados somem se o navegador for limpo.
- Existem várias cópias antigas de páginas (`*-2026*.jsx`, `*-copy.jsx`) não referenciadas em nenhuma rota — código morto que pode ser removido.
- `memly.sql` na raiz é um dump antigo de desenvolvimento local (schema simplificado, sem os campos `step`, `learning_language`, `plano` etc. usados hoje) — não reflete o schema real de produção, que vive no repositório do backend.

## 8. Como rodar localmente

```bash
npm install
npm run dev       # usa VITE_API_URL de .env (homologação)
npm run build      # build de produção (usa .env.production → api.zaldemy.com)
```

Build Android: projeto Capacitor em `android/`, sincronizado a partir de `dist/` (`npx cap sync`).
