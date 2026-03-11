import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

const DEFAULT_PROMPT = `Você é um assistente amigável no Instagram.
Responda de forma educada e útil em português brasileiro.
Caso não saiba a resposta, peça para o usuário entrar em contato com o dono da conta.
Nota: Este bot ainda não foi personalizado. Peça ao dono para editar o arquivo config.txt ou prompt.txt.
Máximo 3 frases por resposta.`;

interface ConfigFields {
  NOME_DO_BOT: string;
  PERSONALIDADE: string;
  OBJETIVO: string;
  LINK_DE_VENDA: string;
  MENSAGEM_FINAL: string;
}

function readFileIfExists(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (content.length === 0) return null;
    // Ignorar arquivos que são apenas comentários
    const nonCommentLines = content
      .split('\n')
      .filter((line) => !line.startsWith('#') && line.trim().length > 0);
    if (nonCommentLines.length === 0) return null;
    return content;
  } catch {
    return null;
  }
}

function parseConfigTxt(content: string): ConfigFields {
  const fields: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed.length === 0) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    fields[key] = value;
  }

  return {
    NOME_DO_BOT: fields['NOME_DO_BOT'] || 'Assistente',
    PERSONALIDADE: fields['PERSONALIDADE'] || 'Seja simpático e profissional.',
    OBJETIVO: fields['OBJETIVO'] || 'Ajudar os seguidores com suas dúvidas.',
    LINK_DE_VENDA: fields['LINK_DE_VENDA'] || '',
    MENSAGEM_FINAL: fields['MENSAGEM_FINAL'] || '',
  };
}

function buildPromptFromConfig(config: ConfigFields): string {
  let prompt = `Você é ${config.NOME_DO_BOT}, assistente no Instagram.
Personalidade: ${config.PERSONALIDADE}
Seu objetivo: ${config.OBJETIVO}`;

  if (config.LINK_DE_VENDA) {
    prompt += `\nLink para compartilhar quando apropriado: ${config.LINK_DE_VENDA}`;
  }

  if (config.MENSAGEM_FINAL) {
    prompt += `\nMensagem de encerramento: ${config.MENSAGEM_FINAL}`;
  }

  prompt += `\nResponda sempre em português brasileiro.\nMáximo 3 frases por resposta.`;

  return prompt;
}

export function loadSystemPrompt(): string {
  // Prioridade 1: prompt.txt (Modo Avançado)
  const promptPath = path.join(PROJECT_ROOT, 'prompt.txt');
  const promptContent = readFileIfExists(promptPath);

  if (promptContent) {
    // Extrair apenas linhas não-comentário como prompt
    const activeLines = promptContent
      .split('\n')
      .filter((line) => !line.startsWith('#'))
      .join('\n')
      .trim();

    if (activeLines.length > 0) {
      console.log('📝 Modo Avançado: prompt.txt carregado');
      return activeLines;
    }
  }

  // Prioridade 2: config.txt (Modo Simples)
  const configPath = path.join(PROJECT_ROOT, 'config.txt');
  const configContent = readFileIfExists(configPath);

  if (configContent) {
    const config = parseConfigTxt(configContent);
    console.log('⚙️ Modo Simples: config.txt carregado');
    return buildPromptFromConfig(config);
  }

  // Prioridade 3: Prompt padrão
  console.log('📋 Modo Padrão: usando prompt genérico');
  return DEFAULT_PROMPT;
}
