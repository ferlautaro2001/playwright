import dotenv from 'dotenv';
import { chromium } from '@playwright/test';

dotenv.config({ override: true });

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('Definí DEEPSEEK_API_KEY en .env antes de ejecutar el generador.');
  }

  const baseUrl = process.env.BASE_URL ?? 'http://localhost:4200';
  const configuredModel = process.env.LLM_MODEL ?? 'deepseek:deepseek-chat';
  const apiModel = configuredModel.replace(/^deepseek:/, '');
  const llmBaseUrl = (process.env.LLM_BASE_URL ?? 'https://api.deepseek.com/v1').replace(/\/+$/, '');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    const ariaSnapshot = await page.locator('body').ariaSnapshot();

    const prompt = [
      'Usando el ARIA Snapshot YAML de SushiExpress (/login), generá EXACTAMENTE 3 casos de prueba breves en TypeScript con Playwright:',
      '1 caso positivo, 1 caso negativo y 1 caso de valor límite.',
      'Sé muy conciso para minimizar tokens.',
      '',
      ariaSnapshot,
    ].join('\n');

    const res = await fetch(`${llmBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: apiModel,
        temperature: 0.2,
        max_tokens: 450,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Error de DeepSeek (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };

    console.log('\n=== Casos sugeridos por DeepSeek en tiempo de diseño ===\n');
    console.log(data.choices?.[0]?.message?.content ?? '');
    console.log(`\n[Tokens consumidos: ${data.usage?.total_tokens ?? 'N/D'}]`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
