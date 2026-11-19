import dotenv from 'dotenv';
import { Locator, Page } from '@playwright/test';

dotenv.config({ override: true });

interface LocatorSuggestion {
  strategy: 'getByRole' | 'getByLabel' | 'getByPlaceholder' | 'getByText';
  role?: Parameters<Page['getByRole']>[0];
  name?: string;
}

function buildLocatorFromSuggestion(page: Page, suggestion: LocatorSuggestion): Locator {
  const targetName = suggestion.name ?? '';
  switch (suggestion.strategy) {
    case 'getByRole':
      return page.getByRole(suggestion.role ?? 'button', { name: targetName });
    case 'getByLabel':
      return page.getByLabel(targetName);
    case 'getByPlaceholder':
      return page.getByPlaceholder(targetName);
    case 'getByText':
      return page.getByText(targetName);
  }
}

function formatSnippet(suggestion: LocatorSuggestion): string {
  const targetName = suggestion.name ?? '';
  if (suggestion.strategy === 'getByRole') {
    return `page.getByRole('${suggestion.role ?? 'button'}', { name: '${targetName}' })`;
  }
  return `page.${suggestion.strategy}('${targetName}')`;
}

async function resolveWithDeepSeek(
  ariaSnapshot: string,
  intent: string
): Promise<LocatorSuggestion> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('Falta la variable DEEPSEEK_API_KEY para ejecutar el self-healing con LLM.');
  }

  const configuredModel = process.env.LLM_MODEL ?? 'deepseek:deepseek-chat';
  const apiModel = configuredModel.replace(/^deepseek:/, '');
  const baseUrl = (process.env.LLM_BASE_URL ?? 'https://api.deepseek.com/v1').replace(/\/+$/, '');

  const prompt = [
    'Sos un asistente experto en Playwright y accesibilidad web.',
    'Un locator de un test E2E falló porque cambió el texto o estructura de la UI.',
    `Intención funcional del paso: "${intent}".`,
    'A partir del siguiente ARIA Snapshot en YAML, identificá el único elemento equivalente.',
    'Respondé EXCLUSIVAMENTE con un JSON válido con esta forma:',
    '{"strategy":"getByRole"|"getByLabel"|"getByPlaceholder"|"getByText","role":"button"|"textbox"|"combobox"|"link","name":"texto exacto"}',
    '',
    'ARIA Snapshot:',
    ariaSnapshot,
  ].join('\n');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: apiModel,
      temperature: 0,
      max_tokens: 150,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error consultando DeepSeek (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek devolvió una respuesta vacía.');
  }

  return JSON.parse(content) as LocatorSuggestion;
}

/**
 * Intenta resolver el locator principal; si falla por timeout ante un cambio en la UI,
 * captura el árbol de accesibilidad en vivo (ariaSnapshot) y consulta a DeepSeek
 * para recuperar un locator semántico equivalente y registrar el parche sugerido.
 */
export async function obtenerLocatorAdaptativo(
  page: Page,
  primaryLocator: Locator,
  intent: string,
  options?: { scopeSelector?: string; timeoutMs?: number }
): Promise<Locator> {
  const timeoutMs = options?.timeoutMs ?? 2_000;
  const scopeSelector = options?.scopeSelector ?? 'form';

  try {
    await primaryLocator.waitFor({ state: 'visible', timeout: timeoutMs });
    return primaryLocator;
  } catch {
    const ariaSnapshot = await page.locator(scopeSelector).ariaSnapshot();
    const suggestion = await resolveWithDeepSeek(ariaSnapshot, intent);
    const healedLocator = buildLocatorFromSuggestion(page, suggestion);
    const snippet = formatSnippet(suggestion);

    await healedLocator.waitFor({ state: 'visible', timeout: 5_000 });

    console.log(`\n[Self-Healing LLM | ${process.env.LLM_MODEL ?? 'deepseek:deepseek-chat'}]`);
    console.log(`  Intención: ${intent}`);
    console.log(`  Locator recuperado: ${snippet}`);
    console.log(`  Parche sugerido para Page Object: actualizar selector -> ${snippet}\n`);

    return healedLocator;
  }
}

export const smartLocatorWithLLM = obtenerLocatorAdaptativo;
