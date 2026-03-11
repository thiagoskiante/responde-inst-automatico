import axios, { AxiosError } from 'axios';

const TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.META_PAGE_ID || 'me';
const BASE_URL = 'https://graph.facebook.com/v25.0';

interface MetaMessagePayload {
  recipient: { id: string };
  message: { text: string };
}

interface MetaErrorResponse {
  error?: {
    message: string;
    code: number;
  };
}

export async function enviarMensagem(
  recipientId: string,
  texto: string
): Promise<void> {
  const payload: MetaMessagePayload = {
    recipient: { id: recipientId },
    message: { text: texto },
  };

  try {
    await axios.post(`${BASE_URL}/${PAGE_ID}/messages`, payload, {
      params: { access_token: TOKEN },
    });
  } catch (error: unknown) {
    const metaMessage =
      error instanceof AxiosError
        ? (error.response?.data as MetaErrorResponse | undefined)?.error
            ?.message || error.message
        : String(error);
    console.error(
      `❌ Erro ao enviar mensagem para Instagram: ${metaMessage}`
    );
    throw new Error(`Falha ao enviar mensagem: ${metaMessage}`);
  }
}
