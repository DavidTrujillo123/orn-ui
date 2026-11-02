import type { Labels } from '../theme/labels';

/** A rule's value, optionally with its own message instead of the default label. */
export type InputRuleValue<T> = T | { value: T; message: string };

export interface InputRules {
  /** Fewer characters than this is an error. Message: `labels.minLengthError`. */
  minLength?: InputRuleValue<number>;
  /** More characters than this is an error. Message: `labels.maxLengthError`. */
  maxLength?: InputRuleValue<number>;
  /** The value must match. Message: `labels.patternError`. */
  pattern?: InputRuleValue<RegExp>;
  /**
   * Custom check, run last. Return an error message, or `false` for
   * `labels.patternError`; anything else means valid.
   */
  validate?: (value: string) => string | boolean | null | undefined;
}

function unpack<T>(rule: InputRuleValue<T>): { value: T; message?: string } {
  return typeof rule === 'object' && rule !== null && 'value' in rule && 'message' in rule
    ? (rule as { value: T; message: string })
    : { value: rule as T };
}

/**
 * Error del valor, o undefined si es válido. Orden: obligatorio, largo mínimo,
 * máximo, patrón, validación propia — se muestra un solo error, el primero.
 * Un campo opcional vacío es válido: las demás reglas no corren sobre nada.
 */
export function validateInputValue(
  value: string,
  { required, rules }: { required?: boolean; rules?: InputRules },
  labels: Labels
): string | undefined {
  if (value.trim() === '') return required ? labels.requiredError : undefined;
  if (!rules) return undefined;

  if (rules.minLength !== undefined) {
    const { value: n, message } = unpack(rules.minLength);
    if (value.length < n) return message ?? labels.minLengthError.replace('{n}', String(n));
  }
  if (rules.maxLength !== undefined) {
    const { value: n, message } = unpack(rules.maxLength);
    if (value.length > n) return message ?? labels.maxLengthError.replace('{n}', String(n));
  }
  if (rules.pattern !== undefined) {
    const { value: re, message } = unpack(rules.pattern);
    // Un RegExp con flag `g` guarda lastIndex entre llamadas: se reinicia.
    re.lastIndex = 0;
    if (!re.test(value)) return message ?? labels.patternError;
  }
  if (rules.validate) {
    const result = rules.validate(value);
    if (typeof result === 'string' && result !== '') return result;
    if (result === false) return labels.patternError;
  }
  return undefined;
}
