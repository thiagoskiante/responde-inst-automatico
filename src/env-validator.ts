import 'dotenv/config';

const REQUIRED_VARS = [
  'ANTHROPIC_API_KEY',
  'META_PAGE_ACCESS_TOKEN',
  'META_PAGE_ID',
  'META_VERIFY_TOKEN',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    for (const varName of missing) {
      console.error(
        `❌ Erro: A variável ${varName} não está configurada. Veja o arquivo .env.example`
      );
    }
    process.exit(1);
  }

  console.log('✅ Variáveis de ambiente verificadas com sucesso');
}
