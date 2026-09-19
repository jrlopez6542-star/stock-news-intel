# Stock News Intel (es-CO)

Dashboard tipo trading desk: **tablero Comprar / Vender**, **posición + horizonte** (localStorage), **niveles** (entrada / stop / objetivo / invalidación), **catalizadores**, precio (Yahoo Finance), rachas 7/30, **noticias en español** con score 1–10 y recomendación (comprar · aumentar · mantener · reducir · salir).

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
| **Noticias** | Yahoo Finance RSS ES → EN / search (gratis) | **Mock** etiquetado solo si Yahoo falla |
| **Score / reco** | Heurística (explicaciones en ES; títulos pueden quedar EN) | — |

Con keys:

- `BENZINGA_API_KEY` → Benzinga preferido; Yahoo como respaldo.
- `OPENAI_API_KEY` → scoring + recomendación + **traducción de titulares/resúmenes al español** (`gpt-4o-mini`, override con `OPENAI_MODEL`).

## Tablero Comprar / Vender

Watchlist líquida por defecto: `AAPL, NVDA, TSLA, MSFT, AMZN, GOOGL, META, AMD` (+ ticker actual si no está).

- Columnas: **Comprar** · **Vender** (retirar/reducir) · **Mantener**
- Carga progresiva con concurrencia 3 y barra de progreso
- API batch: `GET /api/board` (caché breve ~90s) o por ticker `GET /api/analyze?ticker=AAPL`

## Conectar keys (barato)

```bash
cp .env.example .env.local
```

### 1) OpenAI (scoring + recomendación + ES)

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
Ticker / Watchlist
  ├─ price-service     → Yahoo chart (+ SDK) con retry → demo
  ├─ news/provider     → Benzinga → Yahoo RSS ES/EN → mock
  ├─ news-scorer       → OpenAI (score + titleEs/summaryEs) o heurística
  ├─ translate-es      → lote EN→ES si hace falta (solo con OpenAI)
  └─ recommender       → OpenAI o heurística → mapa comprar/vender/mantener
```

APIs: `GET /api/analyze?ticker=AAPL` · `GET /api/board` · `GET /api/health`

## Nota

Señales educativas — no constituyen asesoría financiera ni oferta de inversión.
