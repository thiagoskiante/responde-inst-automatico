# Responde Inst Automatico

Bot que responde DMs do Instagram automaticamente usando inteligencia artificial (Claude).

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

---

## O que e?

Um bot que responde as mensagens diretas (DMs) do seu Instagram automaticamente, 24 horas por dia, 7 dias por semana. Ele usa a inteligencia artificial do Claude (da Anthropic) para gerar respostas personalizadas.

**Voce NAO precisa saber programar para usar.**

---

## Como funciona?

```
Seguidor envia DM  -->  Servidor recebe  -->  Claude gera resposta  -->  Instagram responde
```

Simples assim. O seguidor manda uma mensagem, o bot entende e responde automaticamente.

---

## Pre-requisitos

Antes de comecar, voce precisa criar contas em 3 lugares (todas sao gratuitas para comecar):

1. **Conta no Instagram** — Tipo Business ou Creator (nao funciona com conta pessoal)
2. **Conta na Anthropic** — Para usar o Claude (a IA que gera as respostas)
3. **Conta na Railway** — Para hospedar o bot na internet (plano gratuito disponivel)
4. **App na Meta Developers** — Para conectar o bot ao Instagram

---

## Configuracao Passo a Passo

### Passo 1 — Criar conta na Anthropic e pegar a API Key

1. Acesse **console.anthropic.com** e crie uma conta
2. No painel, va em **API Keys**
3. Clique em **Create Key**
4. De um nome (ex: `meu-bot-instagram`)
5. **Copie a chave gerada** — ela comeca com `sk-ant-...`

> IMPORTANTE: A chave so aparece uma vez. Copie e salve em um lugar seguro agora.

---

### Passo 2 — Criar o App na Meta Developer

1. Acesse **developers.facebook.com** e faca login com sua conta do Facebook
2. Clique em **Meus Apps** e depois em **Criar App**
3. Selecione o tipo: **Empresa (Business)**
4. Preencha o nome do app (ex: `MeuBotDM`) e seu e-mail
5. Clique em **Criar App**

---

### Passo 3 — Gerar o Token do Instagram

1. No painel do app, clique em **Adicionar produto**
2. Encontre **Instagram** e clique em **Configurar**
3. Selecione **Instagram API with Instagram Login**
4. Em **Usuarios de teste Instagram**, adicione sua conta
5. Acesse **Ferramentas do Graph API Explorer**
6. Gere o token com estas permissoes:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_messaging`
   - `pages_read_engagement`
7. **Copie o Access Token gerado**

---

### Passo 4 — Fazer deploy no Railway

1. Clique no botao **"Deploy on Railway"** no topo desta pagina
2. Se ainda nao tem conta no Railway, crie uma (e gratuito)
3. O Railway vai criar o projeto automaticamente

---

### Passo 5 — Configurar as variaveis de ambiente

No painel do Railway, va na aba **Variables** e adicione estas 3 variaveis:

| Variavel | Valor |
|----------|-------|
| `ANTHROPIC_API_KEY` | A chave que voce copiou no Passo 1 (comeca com `sk-ant-...`) |
| `META_PAGE_ACCESS_TOKEN` | O token que voce copiou no Passo 3 |
| `META_VERIFY_TOKEN` | Escolha uma senha secreta qualquer (ex: `minha-senha-2026`) |

Clique em **Deploy** para aplicar as variaveis.

---

### Passo 6 — Personalizar o bot

Voce tem duas opcoes:

#### Opcao A: Modo Simples (recomendado)

Edite o arquivo `config.txt` na raiz do projeto:

```
NOME_DO_BOT=Ana
PERSONALIDADE=Seja simpatica, direta e profissional.
OBJETIVO=Qualificar leads interessados no meu curso de trafego pago.
LINK_DE_VENDA=https://seulink.com
MENSAGEM_FINAL=Para saber mais, acesse o link acima!
```

Basta trocar os valores pelos seus dados. O bot monta as instrucoes automaticamente.

#### Opcao B: Modo Avancado

Edite o arquivo `prompt.txt` e escreva as instrucoes completas como quiser:

```
Voce e o assistente da Loja XYZ no Instagram.
Quando alguem mandar mensagem, seja simpatico e pergunte como pode ajudar.
Se a pessoa demonstrar interesse em comprar, envie o link: https://lojaxyz.com
Responda sempre em portugues brasileiro.
Maximo 3 frases por resposta.
```

> Se o `prompt.txt` tiver conteudo, ele tem prioridade sobre o `config.txt`.

---

### Passo 7 — Configurar o Webhook na Meta

1. No painel do seu App Meta, va em **Instagram** e depois em **Webhooks**
2. No campo **Callback URL**, cole a URL do seu projeto no Railway + `/webhook`
   - Exemplo: `https://seu-projeto.railway.app/webhook`
3. No campo **Verify Token**, coloque a mesma senha que voce definiu no Passo 5 (`META_VERIFY_TOKEN`)
4. Clique em **Verificar e Salvar**
5. Ative a assinatura para o campo **messages**

> Se tudo estiver certo, voce vera "Webhook verificado com sucesso!" nos logs do Railway.

---

### Passo 8 — Testar

1. Pegue outro celular ou peca para um amigo
2. Envie uma DM para a conta do Instagram conectada
3. Aguarde alguns segundos
4. O bot deve responder automaticamente!

Voce pode acompanhar os logs no painel do Railway para ver as mensagens chegando e as respostas sendo enviadas.

---

## Personalizacao

| Modo | Arquivo | Para quem |
|------|---------|-----------|
| Simples | `config.txt` | Quem quer preencher campos prontos, sem complicacao |
| Avancado | `prompt.txt` | Quem quer controle total sobre o comportamento do bot |

O bot verifica na seguinte ordem: `prompt.txt` primeiro, depois `config.txt`. Se nenhum existir, usa um prompt generico padrao.

---

## Custos

### Claude (IA - Anthropic)

O bot usa o modelo **Claude Haiku**, que e o mais barato:

| Volume de DMs | Custo estimado por mes |
|---------------|----------------------|
| 100 DMs | ~$0,10 USD |
| 1.000 DMs | ~$1,00 USD |
| 10.000 DMs | ~$10,00 USD |

### Railway (hospedagem)

- Plano gratuito: **$5 de credito por mes** (suficiente para projetos pequenos)
- Alternativa gratuita: **Render.com** (com hibernacao — o bot pode demorar para acordar)

---

## Erros Comuns

### 1. "Erro: A variavel X nao esta configurada"

Voce esqueceu de preencher alguma variavel de ambiente no Railway. Veja o Passo 5.

### 2. Webhook nao verifica na Meta

- Confira se a URL termina com `/webhook`
- Confira se o Verify Token e EXATAMENTE igual ao `META_VERIFY_TOKEN` do Railway
- Confira se o servidor esta rodando (veja os logs no Railway)

### 3. Bot nao responde as DMs

- Verifique se a assinatura do campo `messages` esta ativa nos Webhooks da Meta
- Confira se sua conta Instagram e Business ou Creator (nao pessoal)
- Veja os logs no Railway para mensagens de erro

### 4. Resposta demora muito

Isso pode acontecer se o plano gratuito do Railway entrou em hibernacao. A primeira mensagem pode demorar ate 30 segundos. As seguintes serao mais rapidas.

### 5. "Erro ao gerar resposta com Claude"

- Confira se sua chave `ANTHROPIC_API_KEY` esta correta
- Verifique se voce tem credito na Anthropic (console.anthropic.com)

---

## Checklist Final

Antes de considerar o bot pronto, verifique:

- [ ] Conta Instagram e Business ou Creator
- [ ] App criado na Meta Developers
- [ ] Permissao `instagram_manage_messages` aprovada
- [ ] Token do Instagram salvo no Railway (`META_PAGE_ACCESS_TOKEN`)
- [ ] Chave da Anthropic salva no Railway (`ANTHROPIC_API_KEY`)
- [ ] Token de verificacao salvo no Railway (`META_VERIFY_TOKEN`)
- [ ] Webhook configurado e verificado na Meta
- [ ] Assinatura do campo `messages` ativada
- [ ] Bot personalizado (config.txt ou prompt.txt editado)
- [ ] Teste feito: DM enviada e resposta recebida

---

## Suporte

Encontrou algum problema? Abra uma issue neste repositorio descrevendo o erro.

---

Feito com Claude AI + Meta Graph API
