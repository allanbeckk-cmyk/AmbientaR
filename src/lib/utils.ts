import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanEmptyValues(obj: any): any {
  if (Array.isArray(obj)) {
    return obj
      .map(v => (v && typeof v === 'object') ? cleanEmptyValues(v) : v)
      .filter(v => v !== null && v !== undefined);
  }

  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const cleanedValue = (value && typeof value === 'object') ? cleanEmptyValues(value) : value;

      if (cleanedValue !== null && cleanedValue !== undefined && cleanedValue !== '') {
        // @ts-ignore
        acc[key] = cleanedValue;
      }
      
      return acc;
    }, {});
  }

  return obj;
}


export function numberToWordsBRL(value: number): string {
    const numero = Math.floor(value);
    const centavos = Math.round((value - numero) * 100);

    const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const especiais = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

    function converter(n: number): string {
        if (n === 0) return "";
        if (n < 10) return unidades[n];
        if (n < 20) return especiais[n - 10];
        if (n < 100) return dezenas[Math.floor(n / 10)] + (n % 10 !== 0 ? " e " + unidades[n % 10] : "");
        if (n === 100) return "cem";
        if (n < 1000) return centenas[Math.floor(n / 100)] + (n % 100 !== 0 ? " e " + converter(n % 100) : "");
        if (n < 1000000) {
            const mil = Math.floor(n / 1000);
            return (mil === 1 ? "mil" : converter(mil) + " mil") + (n % 1000 !== 0 ? " e " + converter(n % 1000) : "");
        }
        // Simplified for values > 1 million for brevity
        if (n < 1000000000) {
            const milhao = Math.floor(n / 1000000);
            return (milhao === 1 ? "um milhão" : converter(milhao) + " milhões") + (n % 1000000 !== 0 ? " e " + converter(n % 1000000) : "");
        }
        return "valor muito alto";
    }

    let extenso = "";
    if (numero > 0) {
        extenso = converter(numero);
        extenso += numero === 1 ? " real" : " reais";
    }

    if (centavos > 0) {
        if (numero > 0) extenso += " e ";
        extenso += converter(centavos);
        extenso += centavos === 1 ? " centavo" : " centavos";
    }

    if (numero === 0 && centavos === 0) return "zero reais";

    return extenso.charAt(0).toUpperCase() + extenso.slice(1);
}
