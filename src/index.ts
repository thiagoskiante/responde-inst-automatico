import express, { Request, Response } from 'express';
import { validateEnv } from './env-validator';
import { gerarResposta } from './claude';
import { enviarMensagem } from './instagram';

// Validar variáveis de ambiente antes de qualquer coisa
validateEnv();

const app = express();
app.use(express.json());

// ── Deduplicação de mensagens ──────────────────────────
const processedMessages = new Map<string, number>();
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutos

function isDuplicate(messageId: string): boolean {
  const now = Date.now();

  // Limpar entradas expiradas
  for (const [id, timestamp] of processedMessages) {
    if (now - timestamp > DEDUP_TTL_MS) {
      processedMessages.delete(id);
    }
  }

  if (processedMessages.has(messageId)) {
    return true;
  }

  processedMessages.set(messageId, now);
  return false;
}

// ── Health Check ───────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', bot: 'Responde Inst Automático' });
});

// ── Política de Privacidade ──────────────────────────────
app.get('/privacy', (_req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidade - Responde Inst Automático</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #333; line-height: 1.6; }
    h1 { color: #1a1a1a; }
    h2 { color: #444; margin-top: 30px; }
  </style>
</head>
<body>
  <h1>Política de Privacidade</h1>
  <p><strong>Última atualização:</strong> 11 de março de 2026</p>

  <h2>1. Dados coletados</h2>
  <p>Este aplicativo ("Responde Inst Automático") processa mensagens diretas (DMs) recebidas via Instagram para gerar respostas automáticas. Não armazenamos o conteúdo das mensagens de forma permanente.</p>

  <h2>2. Como usamos os dados</h2>
  <p>As mensagens recebidas são enviadas à API do Claude (Anthropic) exclusivamente para gerar uma resposta. Após o envio da resposta, a mensagem não é retida.</p>

  <h2>3. Compartilhamento</h2>
  <p>Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros, exceto conforme necessário para o funcionamento do serviço (API do Claude para geração de respostas).</p>

  <h2>4. Segurança</h2>
  <p>Utilizamos conexões seguras (HTTPS) e variáveis de ambiente protegidas para armazenar credenciais.</p>

  <h2>5. Seus direitos</h2>
  <p>Você pode solicitar a exclusão de seus dados a qualquer momento entrando em contato conosco ou acessando <a href="/data-deletion">/data-deletion</a>.</p>

  <h2>6. Contato</h2>
  <p>Para dúvidas sobre esta política, entre em contato via DM no Instagram.</p>
</body>
</html>`);
});

// ── Exclusão de Dados ────────────────────────────────────
app.get('/data-deletion', (_req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exclusão de Dados - Responde Inst Automático</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #333; line-height: 1.6; }
    h1 { color: #1a1a1a; }
    h2 { color: #444; margin-top: 30px; }
    .box { background: #f0f8f0; border: 1px solid #4CAF50; border-radius: 8px; padding: 20px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Exclusão de Dados</h1>
  <p><strong>Última atualização:</strong> 11 de março de 2026</p>

  <div class="box">
    <h2>Este app não armazena seus dados</h2>
    <p>O Responde Inst Automático <strong>não armazena</strong> mensagens, dados pessoais ou qualquer informação de forma permanente. As mensagens são processadas em tempo real e descartadas imediatamente após o envio da resposta.</p>
  </div>

  <h2>Como solicitar exclusão</h2>
  <p>Caso deseje confirmar que nenhum dado seu está armazenado, entre em contato via DM no Instagram. Responderemos em até 48 horas.</p>

  <h2>Confirmação</h2>
  <p>Como não retemos dados, não há dados a serem excluídos. Sua privacidade é respeitada por design.</p>
</body>
</html>`);
});

// ── Callback de exclusão de dados (Meta exige POST) ──────
app.post('/data-deletion', (req: Request, res: Response) => {
  const confirmationCode = 'DEL-' + Date.now();
  res.json({
    url: 'https://responde-inst-automatico-production.up.railway.app/data-deletion',
    confirmation_code: confirmationCode,
  });
});

// ── Verificação do Webhook (Meta exige) ────────────────
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado com sucesso!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ── Tipos do Webhook Instagram ─────────────────────────
interface InstagramMessage {
  mid: string;
  text?: string;
  is_echo?: boolean;
}

interface InstagramMessagingEvent {
  sender: { id: string };
  message?: InstagramMessage;
}

interface InstagramEntry {
  messaging?: InstagramMessagingEvent[];
}

interface InstagramWebhookBody {
  object: string;
  entry: InstagramEntry[];
}

// ── Receber Mensagens do Instagram ─────────────────────
app.post('/webhook', (req: Request, res: Response) => {
  // Log do payload bruto para debug
  console.log('📨 Webhook recebido:', JSON.stringify(req.body, null, 2));

  const body = req.body as InstagramWebhookBody;

  // Retornar 200 imediatamente para evitar timeout da Meta
  res.sendStatus(200);

  if (body.object !== 'instagram') {
    console.log('⚠️ Objeto não é instagram:', body.object);
    return;
  }

  for (const entry of body.entry) {
    const messaging = entry.messaging || [];

    for (const event of messaging) {
      // Ignorar mensagens do próprio bot
      if (!event.message || event.message.is_echo) continue;

      // Ignorar mensagens sem texto
      if (!event.message.text) continue;

      const messageId = event.message.mid;
      const senderId = event.sender.id;
      const texto = event.message.text;

      // Deduplicação
      if (isDuplicate(messageId)) {
        console.log(`🔄 Mensagem duplicada ignorada: ${messageId}`);
        continue;
      }

      console.log(`📩 DM recebida de ${senderId}: ${texto}`);

      // Processar de forma assíncrona (não bloqueia o loop)
      processMessage(senderId, texto).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`❌ Erro ao processar mensagem: ${message}`);
      });
    }
  }
});

async function processMessage(
  senderId: string,
  texto: string
): Promise<void> {
  const resposta = await gerarResposta(texto);
  await enviarMensagem(senderId, resposta);
  console.log(`✅ Resposta enviada: ${resposta}`);
}

// ── Iniciar Servidor ───────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
