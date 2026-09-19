# Stock News Intel (es-CO)

MVP de inteligencia de noticias bursátiles en español (Colombia). Consultas un ticker (p. ej. `AAPL`), ves el **precio**, las **rachas** de 7 y 30 sesiones, **noticias puntuadas 1–10** por impacto (empresa + macro) y una **recomendación**: invertir / mantener / reducir / retirar.

## Cómo correr

```bash
cd stock-news-intel
cp .env.example .env.local   # opcional: añade claves
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Build de producción:

```bash
npm run build && npm start
```

## Demo sin claves

Sin `OPENAI_API_KEY` ni `BENZINGA_API_KEY` la app funciona con:

- **Precio**: Yahoo Finance (gratis, sin key). Si falla la red, cae a serie demo.
- **Noticias**: proveedor mock con titulares realistas (ES/EN) para `AAPL`, `NVDA`, `TSLA`, `MSFT` + macro.
- **Score y recomendación**: heurística determinista que filtra scores &lt; 5 y devuelve JSON estructurado.

## Con claves (opcional)

Copia `.env.example` → `.env.local`:

| Variable | Efecto |
|----------|--------|
| `OPENAI_API_KEY` | Paso 1 (score) y paso 2 (recomendación) con OpenAI |
| `OPENAI_MODEL` | Modelo (default `gpt-4o-mini`) |
| `BENZINGA_API_KEY` | Noticias reales vía Benzinga News API |

Si una integración falla, hay fallback automático a demo/heurística.

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
| `src/lib/news/benzinga.ts` | Cliente Benzinga |
| `src/lib/news/mock.ts` | Titulares demo |
| `src/lib/company-context.ts` | Perfiles curados |
| `src/lib/scoring/*` | Score OpenAI / heurística |
| `src/lib/recommendation/*` | Recomendación OpenAI / heurística |
| `src/app/api/analyze/route.ts` | API GET `?ticker=` |
| `src/components/*` | UI en español |

## API

`GET /api/analyze?ticker=AAPL` → JSON con `price`, `news[]`, `recommendation`, `meta`.

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
