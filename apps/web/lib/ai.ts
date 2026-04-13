const AI_ENGINE_URL = process.env.AI_ENGINE_URL!;
const AI_ENGINE_SECRET = process.env.AI_ENGINE_SECRET!;

const headers = {
  'Content-Type': 'application/json',
  'X-Secret': AI_ENGINE_SECRET,
};

export async function callAIEngine<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${AI_ENGINE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI Engine error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}
