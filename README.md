# Stock News Intel (es-CO)

MVP de inteligencia de noticias bursátiles en español (Colombia). Consultas un ticker (p. ej. `AAPL`), ves el **precio**, las **rachas** de 7 y 30 sesiones, **noticias puntuadas 1–10** por impacto (empresa + macro) y una **recomendación**: invertir / mantener / reducir / retirar.

## Cómo correr

```bash
cd stock-news-intel
cp .env.example .env.local   # opcional: pega solo 2 keys
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Build de producción:

```bash
npm run build && npm start
```

## Demo sin claves

Sin `OPENAI_API_KEY` ni `BENZINGA_API_KEY` la app funciona igual:

- **Precio**: Yahoo Finance (gratis, sin key). Si falla la red, cae a serie demo.
- **Noticias**: proveedor mock con titulares realistas (ES/EN) para `AAPL`, `NVDA`, `TSLA`, `MSFT` + macro.
- **Score y recomendación**: heurística determinista que filtra scores &lt; 5 y devuelve JSON estructurado.

En la UI verás badges de proveedores (Yahoo / mock / heuristic). También: `GET /api/health`.

## Conectar keys (barato)

Solo necesitas **pegar 2 keys** en `.env.local` (el resto ya tiene defaults baratos).

```bash
cp .env.example .env.local
# edita .env.local y pega las keys
```

### 1) OpenAI (scoring + recomendación)

1. Crea cuenta en [platform.openai.com](https://platform.openai.com/).
2. Ve a **API keys** → Create new secret key → copia la key.
3. En `.env.local`:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

**Costo esperado:** con `gpt-4o-mini` y uso personal ligero (unas decenas de análisis al día) suele quedar en **centavos a pocos USD/mes**. Sin key, la app usa heurística gratis.

### 2) Benzinga Basic (noticias reales)

1. Regístrate en [Benzinga APIs](https://www.benzinga.com/apis/) / portal de desarrolladores.
2. Activa el plan **Basic** (free tier) — alcanza para **headlines + teasers**.
3. En `.env.local`:

```env
BENZINGA_API_KEY=tu_token_aqui
```

La app llama a la News API con `displayOutput=headline` (compatible con Basic). **No hace falta** el plan premium: body completo / feeds avanzados se cotizan con ventas de Benzinga y no son necesarios para este MVP.

### Resumen de variables

| Variable | ¿Obligatoria? | Efecto si falta |
|----------|---------------|-----------------|
| `OPENAI_API_KEY` | No | Heurística demo |
| `OPENAI_MODEL` | No (default `gpt-4o-mini`) | — |
| `BENZINGA_API_KEY` | No | Noticias mock |

Si una integración falla en runtime, hay fallback automático a demo/heurística. **Nunca subas `.env.local`** (está en `.gitignore`).

## Arquitectura: dos pasos de IA

```
Ticker
  ├─ price-service     → precio + rachas 7d/30d (cierres diarios)
  ├─ news provider     → Benzinga | mock
  ├─ company-context   → perfiles curados (AAPL, NVDA, TSLA, MSFT) + genérico
  │
  ├─ PASO 1 news-scorer
  │    · Contexto de empresa (modelo, fortalezas, dependencias, rivales, proveedores)
  │    · Score 1–10 + dirección + company|macro + explicación
  │    · Descarta score < 5
  │
  └─ PASO 2 recommendation
       · Entrada: noticias filtradas + precio/rachas + perfil
       · Salida: invertir | mantener | reducir | retirar + rationale + confidence
```

### Módulos clave

| Ruta | Rol |
|------|-----|
| `src/lib/price/price-service.ts` | Yahoo Finance + rachas |
| `src/lib/news/provider.ts` | Facade Benzinga / demo |
| `src/lib/news/benzinga.ts` | Cliente Benzinga (Basic headline/teaser) |
| `src/lib/news/mock.ts` | Titulares demo |
| `src/lib/company-context.ts` | Perfiles curados |
| `src/lib/openai-config.ts` | `OPENAI_MODEL` default + flags de keys |
| `src/lib/scoring/*` | Score OpenAI / heurística |
| `src/lib/recommendation/*` | Recomendación OpenAI / heurística |
| `src/app/api/analyze/route.ts` | API GET `?ticker=` |
| `src/app/api/health/route.ts` | Estado de proveedores (sin secrets) |
| `src/components/*` | UI en español |

## API

- `GET /api/analyze?ticker=AAPL` → JSON con `price`, `news[]`, `recommendation`, `meta`.
- `GET /api/health` → qué proveedores están activos (Yahoo/mock/heuristic vs Benzinga/OpenAI).

## Trabajo futuro

- Backtest de scores vs retornos siguientes N días
- Alertas (email/Telegram) cuando score ≥ umbral
- Portafolio multi-ticker y agregación de sesgo
- Filings (10-K/10-Q) y transcripts de earnings como contexto
- Cache Redis / rate limits y más perfiles curados

## Aviso

Esto es un **MVP educativo**. No es asesoría financiera ni una recomendación de inversión regulada.

## Licencia

Uso privado / educativo del autor del repositorio.
