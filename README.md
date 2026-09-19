# Stock News Intel (es-CO)

Dashboard tipo trading desk: consulta un ticker (p. ej. `AAPL`), ves **precio** (Yahoo Finance), **gráfico de cierres 7/30d**, **rachas**, **noticias reales puntuadas 1–10** (empresa + macro) y una **recomendación**: invertir / mantener / reducir / retirar.

## Cómo correr

```bash
cd stock-news-intel
cp .env.example .env.local   # opcional: pega solo 2 keys
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run build && npm start
```

Producción: [https://stock-news-intel.vercel.app](https://stock-news-intel.vercel.app)

## Datos reales (sin keys)

Sin `OPENAI_API_KEY` ni `BENZINGA_API_KEY` la app sigue usando datos reales cuando es posible:

| Pipeline | Preferido | Fallback |
|----------|-----------|----------|
| **Precio** | Yahoo Finance (chart API + retry/backoff ante 429) | Serie **demo** etiquetada en UI |
| **Noticias** | Yahoo Finance RSS / search (gratis) | **Mock** etiquetado solo si Yahoo falla |
| **Score / reco** | Heurística | — |

Con keys:

- `BENZINGA_API_KEY` → Benzinga preferido; Yahoo como respaldo.
- `OPENAI_API_KEY` → scoring + recomendación con `gpt-4o-mini` (override con `OPENAI_MODEL`).

Badges de proveedores en la UI y `GET /api/health`. Cada análisis expone `meta.priceSource` y `meta.newsProvider`.

## Conectar keys (barato)

```bash
cp .env.example .env.local
```

### 1) OpenAI (scoring + recomendación)

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### 2) Benzinga Basic (opcional)

```env
BENZINGA_API_KEY=tu_token_aqui
```

Compatible con Basic free (`displayOutput=headline`). **Nunca subas `.env.local`**.

## Arquitectura

```
Ticker
  ├─ price-service     → Yahoo chart (+ SDK) con retry → demo
  ├─ news/provider     → Benzinga → Yahoo RSS/search → mock
  ├─ news-scorer       → OpenAI o heurística (filtra score < 5)
  └─ recommender       → OpenAI o heurística (acción + confianza)
```

APIs: `GET /api/analyze?ticker=AAPL` · `GET /api/health`

## Nota

Señales educativas — no constituyen asesoría financiera.
