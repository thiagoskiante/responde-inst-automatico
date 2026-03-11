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
  const body = req.body as InstagramWebhookBody;

  // Retornar 200 imediatamente para evitar timeout da Meta
  res.sendStatus(200);

  if (body.object !== 'instagram') return;

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
