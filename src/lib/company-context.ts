import type { CompanyProfile } from "./types";

const PROFILES: Record<string, CompanyProfile> = {
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Tecnología / Consumo",
    businessModel:
      "Diseño y venta de hardware premium (iPhone, Mac, iPad, Wearables) con ecosistema de servicios (App Store, iCloud, Apple Music, Apple Pay) de altos márgenes.",
    strengths: [
      "Marca y lealtad de clientes",
      "Ecosistema cerrado de alto valor",
      "Márgenes de servicios en crecimiento",
      "Balance sólido y generación de caja",
    ],
    dependencies: [
      "Cadena de suministro en Asia (ensamble en China/India)",
      "Semiconductores avanzados (TSMC)",
      "Ciclo de renovación del iPhone",
      "Regulación antimonopolio en App Store",
    ],
    competitors: ["MSFT", "GOOGL", "SAMSUNG", "XIAOMI"],
    suppliers: ["TSM", "QCOM", "AVGO", "Foxconn (Hon Hai)"],
    financialNotes:
      "Ingresos concentrados en iPhone; servicios ~20%+ del mix y creciendo. Sensible a demanda en China y a tipos de cambio.",
    keywords: [
      "iphone",
      "apple",
      "app store",
      "tim cook",
      "vision pro",
      "mac",
      "ipad",
      "services",
      "china",
      "tsmc",
    ],
  },
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Semiconductores / IA",
    businessModel:
      "Diseño de GPUs y plataformas de cómputo acelerado para gaming, centros de datos e IA generativa (CUDA, Hopper/Blackwell).",
    strengths: [
      "Liderazgo en GPUs para entrenamiento de IA",
      "Ecosistema CUDA difícil de replicar",
      "Demanda estructural de data centers",
      "Márgenes brutos elevados en datacenter",
    ],
    dependencies: [
      "Fabricación en TSMC (nodos avanzados)",
      "Capex de hyperscalers (MSFT, GOOGL, AMZN, META)",
      "Export controls EE.UU.–China",
      "Competencia de AMD, Google TPU, custom ASICs",
    ],
    competitors: ["AMD", "AVGO", "INTC", "GOOGL (TPU)"],
    suppliers: ["TSM", "ASML (indirecto vía foundries)", "SK Hynix (HBM)"],
    financialNotes:
      "Ingresos dominados por Data Center. Muy sensible a ciclos de CapEx de nube y a restricciones de exportación a China.",
    keywords: [
      "nvidia",
      "gpu",
      "cuda",
      "blackwell",
      "hopper",
      "ai chip",
      "data center",
      "jensen huang",
      "hbm",
      "tsmc",
    ],
  },
  TSLA: {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    sector: "Automóviles eléctricos / Energía",
    businessModel:
      "Fabricación de vehículos eléctricos, software de conducción autónoma (FSD), energía (baterías, solar) y servicios (Supercharger, seguros).",
    strengths: [
      "Marca EV global",
      "Integración vertical (baterías, software)",
      "Red Supercharger",
      "Potencial de robotaxi / Optimus (opción de largo plazo)",
    ],
    dependencies: [
      "Precio del litio y materias primas",
      "Demanda de EV y competencia china",
      "Regulación de conducción autónoma",
      "Narrativa y comunicación del CEO",
    ],
    competitors: ["BYD", "RIVN", "GM", "F", "NIO"],
    suppliers: ["Panasonic", "CATL", "LG Energy", "proveedores de litio"],
    financialNotes:
      "Márgenes automotrices volátiles por guerras de precios. Flujo de caja sensible a volumen de entregas y CapEx de fábricas.",
    keywords: [
      "tesla",
      "elon musk",
      "fsd",
      "model y",
      "model 3",
      "cybertruck",
      "ev",
      "baterías",
      "robotaxi",
      "entregas",
    ],
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    sector: "Software / Nube / IA",
    businessModel:
      "Software empresarial (Office 365, Windows), nube Azure, LinkedIn, gaming (Xbox/Activision) e IA vía OpenAI / Copilot.",
    strengths: [
      "Base instalada empresarial sticky",
      "Azure #2 en nube pública",
      "Integración de IA en productividad",
      "Flujo de caja recurrente (suscripciones)",
    ],
    dependencies: [
      "CapEx en data centers e IA",
      "Asociación / exposición a OpenAI",
      "Competencia AWS y Google Cloud",
      "Ciclo de gasto TI corporativo",
    ],
    competitors: ["AMZN (AWS)", "GOOGL", "ORCL", "CRM"],
    suppliers: ["INTC", "AMD", "NVDA", "operadores de data centers"],
    financialNotes:
      "Azure e Intelligent Cloud impulsan crecimiento. Márgenes altos; CapEx elevado por infraestructura de IA.",
    keywords: [
      "microsoft",
      "azure",
      "copilot",
      "openai",
      "office 365",
      "windows",
      "satya nadella",
      "activision",
      "xbox",
    ],
  },
};

function genericProfile(ticker: string): CompanyProfile {
  const upper = ticker.toUpperCase();
  return {
    ticker: upper,
    name: `${upper} (perfil genérico)`,
    sector: "Desconocido / genérico",
    businessModel:
      "Empresa cotizada sin perfil curado. Se usa un contexto genérico: sensibilidad a tasas, liquidez de mercado, sector y sentimiento de noticias.",
    strengths: ["Liquidez bursátil", "Cobertura mediática variable"],
    dependencies: [
      "Condiciones macro (Fed, inflación)",
      "Sentimiento sectorial",
      "Resultados trimestrales",
    ],
    competitors: [],
    suppliers: [],
    financialNotes:
      "Sin datos financieros curados. El scoreador usa señales de titulares y palabras clave macro.",
    keywords: [upper.toLowerCase()],
  };
}

/** Obtiene el perfil curado o un fallback genérico. */
export function getCompanyProfile(ticker: string): CompanyProfile {
  const key = ticker.trim().toUpperCase();
  return PROFILES[key] ?? genericProfile(key);
}

export function listCuratedTickers(): string[] {
  return Object.keys(PROFILES);
}
