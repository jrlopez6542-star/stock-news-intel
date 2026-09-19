import type { RawNewsItem } from "../types";

type DemoBundle = RawNewsItem[];

function isoDaysAgo(days: number, hour = 14): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const DEMO: Record<string, DemoBundle> = {
  AAPL: [
    {
      id: "aapl-1",
      title: "Apple prepara iPhone más delgado; analistas elevan estimaciones de ASP",
      summary:
        "Reportes de la cadena de suministro indican un modelo más premium con precios más altos, lo que podría impulsar márgenes de hardware.",
      url: "https://example.com/aapl-iphone-thin",
      publishedAt: isoDaysAgo(0, 9),
      source: "Demo Wire",
      tickers: ["AAPL"],
    },
    {
      id: "aapl-2",
      title: "Reguladores de la UE intensifican investigación sobre App Store",
      summary:
        "Bruselas evalúa nuevas multas por prácticas de comisión. Riesgo reputacional y de ingresos de Services.",
      url: "https://example.com/aapl-eu-probe",
      publishedAt: isoDaysAgo(1, 11),
      source: "Demo Regulación",
      tickers: ["AAPL"],
    },
    {
      id: "aapl-3",
      title: "TSMC eleva precios de nodos avanzados; impacto en costos de Apple",
      summary:
        "El foundry líder aumentaría precios 5–8% en 3nm/2nm. Apple es cliente clave; margen de hardware bajo presión.",
      url: "https://example.com/tsmc-pricing",
      publishedAt: isoDaysAgo(2, 8),
      source: "Demo Semis",
      tickers: ["TSM", "AAPL"],
      isMacroHint: false,
    },
    {
      id: "aapl-4",
      title: "Demanda de smartphones en China se estabiliza tras meses débiles",
      summary:
        "Datos de sell-through muestran mejora secuencial en el mercado chino, relevante para el mix de iPhone.",
      url: "https://example.com/china-phones",
      publishedAt: isoDaysAgo(3, 10),
      source: "Demo Asia",
      tickers: ["AAPL"],
    },
    {
      id: "aapl-macro-1",
      title: "Fed mantiene tasas; mercados tech reaccionan con alivio",
      summary:
        "La Reserva Federal deja sin cambios la tasa de referencia. Múltiplos de crecimiento tecnológico suelen beneficiarse de un tono menos restrictivo.",
      url: "https://example.com/fed-hold",
      publishedAt: isoDaysAgo(0, 16),
      source: "Demo Macro",
      tickers: [],
      isMacroHint: true,
    },
    {
      id: "aapl-macro-2",
      title: "Nuevos aranceles a electrónicos importados desde Asia",
      summary:
        "Propuesta de aranceles podría encarecer ensamble y componentes. Fabricantes de consumo con cadena en Asia bajo escrutinio.",
      url: "https://example.com/tariffs-electronics",
      publishedAt: isoDaysAgo(1, 15),
      source: "Demo Comercio",
      tickers: [],
      isMacroHint: true,
    },
    {
      id: "aapl-low",
      title: "Apple lanza fondo de pantalla temático para temporada",
      summary: "Actualización cosmética menor en el sitio de marketing. Sin impacto financiero material.",
      url: "https://example.com/aapl-wallpaper",
      publishedAt: isoDaysAgo(4, 12),
      source: "Demo Lifestyle",
      tickers: ["AAPL"],
    },
  ],
  NVDA: [
    {
      id: "nvda-1",
      title: "Hyperscalers confirman más CapEx en GPUs Blackwell para 2026",
      summary:
        "Microsoft, Google y Meta reiteran inversión en infraestructura de IA. Demanda de NVDA se mantiene fuerte.",
      url: "https://example.com/nvda-capex",
      publishedAt: isoDaysAgo(0, 10),
      source: "Demo Cloud",
      tickers: ["NVDA", "MSFT", "GOOGL", "META"],
    },
    {
      id: "nvda-2",
      title: "EE.UU. endurece controles de exportación de chips de IA a China",
      summary:
        "Nuevas restricciones podrían reducir ventas de NVDA en China, un mercado relevante aunque ya limitado.",
      url: "https://example.com/nvda-export",
      publishedAt: isoDaysAgo(1, 9),
      source: "Demo Geopolítica",
      tickers: ["NVDA"],
      isMacroHint: true,
    },
    {
      id: "nvda-3",
      title: "SK Hynix acelera producción de HBM3E; alivia cuello de botella",
      summary:
        "Mayor oferta de memoria de alto ancho de banda favorece ensambles de GPU de alto rendimiento.",
      url: "https://example.com/hbm-supply",
      publishedAt: isoDaysAgo(2, 14),
      source: "Demo Memoria",
      tickers: ["NVDA"],
    },
    {
      id: "nvda-4",
      title: "AMD presenta MI350; competencia en inferencia se intensifica",
      summary:
        "AMD busca share en inferencia cloud. CUDA sigue siendo barrera, pero precios podrían comprimirse.",
      url: "https://example.com/amd-mi350",
      publishedAt: isoDaysAgo(3, 11),
      source: "Demo Semis",
      tickers: ["AMD", "NVDA"],
    },
    {
      id: "nvda-macro-1",
      title: "Índice de semiconductores sube ante optimismo de IA",
      summary:
        "Rally sectorial en chips impulsado por narrativa de demanda estructural de IA.",
      url: "https://example.com/sox-rally",
      publishedAt: isoDaysAgo(0, 15),
      source: "Demo Sector",
      tickers: [],
      isMacroHint: true,
    },
    {
      id: "nvda-low",
      title: "NVIDIA patrocina conferencia universitaria de gráficos",
      summary: "Evento académico rutinario sin guía financiera nueva.",
      url: "https://example.com/nvda-uni",
      publishedAt: isoDaysAgo(5, 10),
      source: "Demo PR",
      tickers: ["NVDA"],
    },
  ],
  TSLA: [
    {
      id: "tsla-1",
      title: "Tesla reporta entregas por encima del consenso en el trimestre",
      summary:
        "Volumen supera expectativas; el mercado celebra mejora secuencial tras guerra de precios.",
      url: "https://example.com/tsla-deliveries",
      publishedAt: isoDaysAgo(0, 8),
      source: "Demo Autos",
      tickers: ["TSLA"],
    },
    {
      id: "tsla-2",
      title: "China recorta incentivos a vehículos eléctricos",
      summary:
        "Menor subsidio podría enfriar demanda en el mayor mercado EV del mundo.",
      url: "https://example.com/china-ev-subsidy",
      publishedAt: isoDaysAgo(1, 13),
      source: "Demo Política",
      tickers: ["TSLA", "BYD"],
      isMacroHint: true,
    },
    {
      id: "tsla-3",
      title: "Retrasos en aprobación de robotaxi en California",
      summary:
        "Reguladores piden más datos de seguridad. Retrasa narrativa de valorización de FSD/robotaxi.",
      url: "https://example.com/tsla-robotaxi",
      publishedAt: isoDaysAgo(2, 16),
      source: "Demo Regulación",
      tickers: ["TSLA"],
    },
    {
      id: "tsla-4",
      title: "Precio del litio baja 12%; alivio en costos de baterías",
      summary:
        "Caída de materias primas ayuda márgenes de fabricantes EV con alto contenido de batería.",
      url: "https://example.com/lithium-drop",
      publishedAt: isoDaysAgo(3, 9),
      source: "Demo Commodities",
      tickers: [],
      isMacroHint: true,
    },
    {
      id: "tsla-macro-1",
      title: "Petróleo sube tras tensiones en Medio Oriente",
      summary:
        "Energía más cara puede favorecer relatividad de EVs vs combustión a mediano plazo, con volatilidad de corto plazo.",
      url: "https://example.com/oil-spike",
      publishedAt: isoDaysAgo(0, 17),
      source: "Demo Macro",
      tickers: [],
      isMacroHint: true,
    },
    {
      id: "tsla-low",
      title: "Fans comparten merchandising de Cybertruck en redes",
      summary: "Contenido viral sin métricas de ventas nuevas.",
      url: "https://example.com/tsla-merch",
      publishedAt: isoDaysAgo(4, 18),
      source: "Demo Social",
      tickers: ["TSLA"],
    },
  ],
  MSFT: [
    {
      id: "msft-1",
      title: "Azure crece más rápido de lo esperado impulsado por Copilot",
      summary:
        "Guía informal de partners apunta a aceleración de Intelligent Cloud por cargas de IA.",
      url: "https://example.com/msft-azure",
      publishedAt: isoDaysAgo(0, 11),
      source: "Demo Cloud",
      tickers: ["MSFT"],
    },
    {
      id: "msft-2",
      title: "Microsoft aumenta CapEx para data centers de IA",
      summary:
        "Inversión elevada cerca de corto plazo pero posiciona capacidad futura; sensibilidad a retornos de IA.",
      url: "https://example.com/msft-capex",
      publishedAt: isoDaysAgo(1, 10),
      source: "Demo Finanzas",
      tickers: ["MSFT", "NVDA"],
    },
    {
      id: "msft-3",
      title: "OpenAI lanza modelo que refuerza integración con Office",
      summary:
        "Mayor diferenciación de Copilot frente a rivales de productividad.",
      url: "https://example.com/openai-office",
      publishedAt: isoDaysAgo(2, 12),
      source: "Demo IA",
      tickers: ["MSFT"],
    },
    {
      id: "msft-4",
      title: "AWS recorta precios en instancias GPU; guerra de precios cloud",
      summary:
        "Presión competitiva en márgenes de nube e inferencia.",
      url: "https://example.com/aws-gpu-price",
      publishedAt: isoDaysAgo(3, 14),
      source: "Demo Cloud",
      tickers: ["AMZN", "MSFT"],
      isMacroHint: false,
    },
    {
      id: "msft-macro-1",
      title: "Gasto TI empresarial se recupera en encuestas CIO",
      summary:
        "Mejora en presupuestos de software y nube favorece nombres enterprise sticky.",
      url: "https://example.com/cio-spend",
      publishedAt: isoDaysAgo(0, 15),
      source: "Demo Macro",
      tickers: [],
      isMacroHint: true,
    },
    {
      id: "msft-low",
      title: "Microsoft renueva branding de evento para desarrolladores",
      summary: "Cambio cosmético de marketing sin guidance.",
      url: "https://example.com/msft-brand",
      publishedAt: isoDaysAgo(5, 9),
      source: "Demo PR",
      tickers: ["MSFT"],
    },
  ],
};

const GENERIC_MACRO: RawNewsItem[] = [
  {
    id: "gen-macro-1",
    title: "Fed mantiene tasas; volatilidad en índices de crecimiento",
    summary:
      "Política monetaria estable suele apoyar valuaciones de empresas de crecimiento, con matices por sector.",
    url: "https://example.com/fed-generic",
    publishedAt: isoDaysAgo(0, 16),
    source: "Demo Macro",
    tickers: [],
    isMacroHint: true,
  },
  {
    id: "gen-macro-2",
    title: "Tensiones geopolíticas elevan prima de riesgo en mercados",
    summary:
      "Aversión al riesgo puede afectar equities de beta alta independientemente del ticker.",
    url: "https://example.com/geo-risk",
    publishedAt: isoDaysAgo(1, 12),
    source: "Demo Geopolítica",
    tickers: [],
    isMacroHint: true,
  },
];

export function getMockNews(ticker: string): RawNewsItem[] {
  const key = ticker.trim().toUpperCase();
  const company = DEMO[key];
  if (company) return company;
  return [
    {
      id: `${key}-1`,
      title: `${key} en el radar: analistas revisan perspectivas del sector`,
      summary:
        "Cobertura genérica de demo. Sin perfil curado; útil para probar el pipeline de scoreo.",
      url: `https://example.com/${key.toLowerCase()}-outlook`,
      publishedAt: isoDaysAgo(0, 10),
      source: "Demo Wire",
      tickers: [key],
    },
    {
      id: `${key}-2`,
      title: `${key} reportaría resultados la próxima semana`,
      summary:
        "Expectativa de volatilidad alrededor de earnings. Impacto depende de guías y márgenes.",
      url: `https://example.com/${key.toLowerCase()}-earnings`,
      publishedAt: isoDaysAgo(1, 9),
      source: "Demo Earnings",
      tickers: [key],
    },
    ...GENERIC_MACRO,
  ];
}
