import Anthropic from '@anthropic-ai/sdk';
import { loadSystemPrompt } from './config-loader';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt carregado UMA vez na inicialização
const systemPrompt = loadSystemPrompt();

export async function gerarResposta(mensagem: string): Promise<string> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: mensagem }],
    });

    const firstBlock = response.content[0];
    if (firstBlock.type === 'text') {
      return firstBlock.text;
    }

    return 'Desculpe, não consegui gerar uma resposta no momento.';
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`❌ Erro ao gerar resposta com Claude: ${message}`);
  }
}
