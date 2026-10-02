declare module "marcjs" {
  /**
   * Campo de controle: [tag, valor]
   * Campo de dados: [tag, indicadores, código, valor, código, valor, ...]
   */
  export type MarcField = string[];

  export class Record {
    leader: string;
    fields: MarcField[];
    append(...fields: MarcField[]): Record;
    as(type: "iso2709" | "marcxml" | "mij" | "text" | "json"): string;
  }

  export const Marc: {
    format(record: Record, type: "iso2709" | "marcxml" | "mij" | "text" | "json"): string;
  };
}
