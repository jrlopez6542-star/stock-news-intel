import type { RecommendationAction } from "../types";

/** Columnas del tablero de señales (UI en español). */
export type BoardColumn = "comprar" | "vender" | "reducir" | "mantener";

export interface BoardActionView {
  column: BoardColumn;
  /** Etiqueta corta en la tarjeta */
  label: string;
  /** Acción interna original */
  sourceAction: RecommendationAction;
}

/**
 * Mapear acciones internas → columnas del desk:
 * invertir→comprar, retirar→vender, reducir→reducir, mantener→mantener.
 */
export function toBoardAction(action: RecommendationAction): BoardActionView {
  switch (action) {
    case "invertir":
      return { column: "comprar", label: "Comprar", sourceAction: action };
    case "retirar":
      return { column: "vender", label: "Vender", sourceAction: action };
    case "reducir":
      return { column: "reducir", label: "Reducir", sourceAction: action };
    case "mantener":
    default:
      return { column: "mantener", label: "Mantener", sourceAction: action };
  }
}

/** Agrupa reducir + vender bajo "lado vendedor" si la UI usa 2 columnas. */
export function isSellSide(column: BoardColumn): boolean {
  return column === "vender" || column === "reducir";
}
