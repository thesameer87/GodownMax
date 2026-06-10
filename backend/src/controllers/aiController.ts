import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createError } from '../utils/errors';

// ── Gemini API helper ──────────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-2.5-flash'; // current active production model

async function callGemini(prompt: string, jsonMode = false): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw createError('GEMINI_API_KEY not configured in .env', 500);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: jsonMode ? 0.2 : 0.7,
      maxOutputTokens: 1024,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw createError(`Gemini error: ${err?.error?.message || res.statusText}`, 502);
  }

  const data: any = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const tokens: number = data.usageMetadata?.totalTokenCount || 0;
  return { text, tokens };
}

async function callGeminiChat(
  history: { role: string; content: string }[],
  systemPrompt: string
): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw createError('GEMINI_API_KEY not configured in .env', 500);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  // Gemini uses 'user' / 'model' roles (not 'assistant')
  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw createError(`Gemini error: ${err?.error?.message || res.statusText}`, 502);
  }

  const data: any = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const tokens: number = data.usageMetadata?.totalTokenCount || 0;
  return { text, tokens };
}

function safeParseJSON(text: string): any {
  try {
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { error: 'Could not parse AI response', raw: text.slice(0, 300) };
  }
}

// ── Shared inventory context ───────────────────────────────────────────────────
const getInventoryContext = async () => {
  const [totalProducts, products, orders] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { inventoryItems: true },
      take: 50,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      include: { items: { include: { product: true } } },
    }),
  ]);

  const stockData = products.map(p => ({
    name: p.name,
    sku: p.sku,
    stock: p.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    minLevel: p.minStockLevel,
    reorderPoint: p.reorderPoint,
    costPrice: p.costPrice,
    sellingPrice: p.sellingPrice,
  }));

  const salesData = orders.flatMap(o =>
    o.items.map(i => ({ product: i.product.name, qty: i.quantity, unitPrice: i.unitPrice, total: i.total, date: o.createdAt }))
  );

  return { totalProducts, stockData, salesData };
};

// ── Controllers ────────────────────────────────────────────────────────────────

export const aiChat = async (req: Request, res: Response) => {
  const { message, history = [] } = req.body;
  const userId = (req as any).userId;

  const context = await getInventoryContext();

  const systemPrompt = `You are GodownMax AI, an intelligent inventory management assistant.
You have access to the following current database context:
- Total active products: ${context.totalProducts}
- Stock levels (sample): ${JSON.stringify(context.stockData.slice(0, 20))}
- Recent sales last 30 days (sample): ${JSON.stringify(context.salesData.slice(0, 20))}

All monetary values are in Indian Rupees (INR). ALWAYS format currency using the ₹ symbol (e.g., ₹1,50,000) and Indian number formatting.
Be concise, data-driven, and actionable. Format numbers clearly.`;

  const fullHistory = [...history.slice(-10), { role: 'user', content: message }];
  const { text: reply, tokens } = await callGeminiChat(fullHistory, systemPrompt);

  await prisma.aIReport.create({
    data: { userId, type: 'CHAT', query: message, result: { reply }, model: GEMINI_MODEL, tokensUsed: tokens },
  });

  res.json({ success: true, data: { reply, tokensUsed: tokens } });
};

export const demandPrediction = async (req: Request, res: Response) => {
  const { productId, days = 30 } = req.body;
  const userId = (req as any).userId;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { inventoryItems: true },
  });
  if (!product) throw createError('Product not found', 404);

  const orders = await prisma.orderItem.findMany({
    where: {
      productId,
      order: { type: 'SALES', createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    },
  });

  const totalStock = product.inventoryItems.reduce((s, i) => s + i.quantity, 0);
  const totalSold = orders.reduce((s, o) => s + o.quantity, 0);

  const prompt = `Analyze demand for product "${product.name}" (SKU: ${product.sku}).
Data (last 90 days): units sold=${totalSold}, avg daily=${(totalSold / 90).toFixed(2)}, current stock=${totalStock}, reorder point=${product.reorderPoint}.
Forecast next ${days} days. Return JSON ONLY:
{"predictedDemand":<number>,"reorderQty":<number>,"stockoutDate":"<YYYY-MM-DD or null>","confidence":<0-100>,"insights":"<string>","dailyForecast":<number>}`;

  const { text, tokens } = await callGemini(prompt, true);
  const prediction = safeParseJSON(text);

  await prisma.aIReport.create({
    data: {
      userId, type: 'DEMAND_PREDICTION',
      query: `Product: ${product.name}, Days: ${days}`,
      result: prediction, model: GEMINI_MODEL, tokensUsed: tokens,
    },
  });

  res.json({ success: true, data: { product: { id: product.id, name: product.name, sku: product.sku }, prediction } });
};

export const restockSuggestions = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { inventoryItems: true, supplier: { select: { name: true } } },
  });

  const lowStock = products
    .map(p => ({
      id: p.id, name: p.name, sku: p.sku,
      totalStock: p.inventoryItems.reduce((s, i) => s + i.quantity, 0),
      reorderPoint: p.reorderPoint,
      reorderQuantity: p.reorderQuantity,
      supplier: p.supplier?.name || 'Unknown',
    }))
    .filter(p => p.totalStock <= p.reorderPoint);

  if (lowStock.length === 0) {
    return res.json({ success: true, data: { suggestions: [], summary: 'All products have sufficient stock.' } });
  }

  const prompt = `Provide restock recommendations for these low-stock products: ${JSON.stringify(lowStock.slice(0, 20))}
Return JSON ONLY:
{"suggestions":[{"id":"<id>","name":"<name>","priority":"HIGH|MEDIUM|LOW","recommendedQty":<number>,"daysUntilStockout":<number>,"action":"<string>"}],"summary":"<string>"}`;

  const { text, tokens } = await callGemini(prompt, true);
  const suggestions = safeParseJSON(text);

  await prisma.aIReport.create({
    data: { userId, type: 'RESTOCK_SUGGESTIONS', result: suggestions, model: GEMINI_MODEL, tokensUsed: tokens },
  });

  res.json({ success: true, data: suggestions });
};

export const salesForecast = async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  const userId = (req as any).userId;

  const days = period === '90d' ? 90 : period === '7d' ? 7 : 30;

  const orders = await prisma.order.findMany({
    where: {
      type: 'SALES', status: 'DELIVERED',
      createdAt: { gte: new Date(Date.now() - days * 3 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'asc' },
  });

  const dailyRevenue: Record<string, number> = {};
  orders.forEach(o => {
    const date = o.createdAt.toISOString().split('T')[0];
    dailyRevenue[date] = (dailyRevenue[date] || 0) + o.total;
  });

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const prompt = `Forecast sales revenue for next ${days} days.
Historical daily revenue: ${JSON.stringify(dailyRevenue)}
Total orders: ${orders.length}, Total revenue: ₹${totalRevenue.toFixed(2)}
Return JSON ONLY:
{"forecastedRevenue":<number>,"growthRate":<percent number>,"dailyForecast":<avg per day>,"confidenceInterval":"<$X-$Y>","seasonalFactors":"<string>","insights":"<string>"}`;

  const { text, tokens } = await callGemini(prompt, true);
  const forecast = safeParseJSON(text);

  await prisma.aIReport.create({
    data: { userId, type: 'SALES_FORECAST', query: `Period: ${period}`, result: forecast, model: GEMINI_MODEL, tokensUsed: tokens },
  });

  res.json({ success: true, data: forecast });
};

export const naturalLanguageQuery = async (req: Request, res: Response) => {
  const { query } = req.body;
  const userId = (req as any).userId;

  const context = await getInventoryContext();

  const prompt = `You are a stock management analyst. Answer this query using the data below.
Query: "${query}"
Data: totalProducts=${context.totalProducts}, stockLevels=${JSON.stringify(context.stockData.slice(0, 30))}, recentSales=${JSON.stringify(context.salesData.slice(0, 30))}

IMPORTANT: All financial data is in Indian Rupees. ALWAYS format currency outputs using the ₹ symbol (e.g., ₹1,50,000).
Return JSON ONLY:
{"answer":"<clear answer>","data":<relevant array or null>,"chartType":"bar|line|pie|null","recommendations":["<rec1>","<rec2>"]}`;

  const { text, tokens } = await callGemini(prompt, true);
  const result = safeParseJSON(text);

  await prisma.aIReport.create({
    data: { userId, type: 'NL_QUERY', query, result, model: GEMINI_MODEL, tokensUsed: tokens },
  });

  res.json({ success: true, data: result });
};

export const inventoryOptimization = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { inventoryItems: true },
    take: 50,
  });

  const inventoryData = products.map(p => ({
    name: p.name, sku: p.sku,
    stock: p.inventoryItems.reduce((s, i) => s + i.quantity, 0),
    minLevel: p.minStockLevel, maxLevel: p.maxStockLevel,
    costPrice: p.costPrice, reorderPoint: p.reorderPoint,
  }));

  const totalValue = inventoryData.reduce((s, p) => s + p.stock * p.costPrice, 0);

  const prompt = `Analyze this inventory for optimization opportunities.
Data: ${JSON.stringify(inventoryData)}, totalValue: ₹${totalValue.toFixed(2)}
Return JSON ONLY:
{"overstocked":["<name>"],"understocked":["<name>"],"deadStock":["<name>"],"totalPotentialSavings":<number>,"abcAnalysis":{"A":["<name>"],"B":["<name>"],"C":["<name>"]},"recommendations":["<rec1>","<rec2>","<rec3>"]}`;

  const { text, tokens } = await callGemini(prompt, true);
  const optimization = safeParseJSON(text);

  await prisma.aIReport.create({
    data: {
      userId, type: 'INVENTORY_OPTIMIZATION',
      result: { ...optimization, totalInventoryValue: totalValue },
      model: GEMINI_MODEL, tokensUsed: tokens,
    },
  });

  res.json({ success: true, data: { ...optimization, totalInventoryValue: totalValue } });
};
