type Primitive = string | number | boolean | null | undefined;

function appendValue(params: URLSearchParams, key: string, value: Primitive | Primitive[], arrayFormat: 'repeat' | 'brackets') {
  if (value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item === null || item === undefined) return;
      const paramKey = arrayFormat === 'brackets' ? `${key}[]` : key;
      params.append(paramKey, String(item));
    });
    return;
  }

  params.append(key, String(value));
}

export function stringify(
  input: Record<string, Primitive | Primitive[]>,
  options?: { arrayFormat?: 'repeat' | 'brackets' },
) {
  const params = new URLSearchParams();
  const arrayFormat = options?.arrayFormat ?? 'repeat';

  Object.entries(input).forEach(([key, value]) => {
    appendValue(params, key, value, arrayFormat);
  });

  return params.toString();
}

export function parse(query: string) {
  const normalized = query.startsWith('?') ? query.slice(1) : query;
  const params = new URLSearchParams(normalized);
  const result: Record<string, string | string[]> = {};

  params.forEach((value, key) => {
    const normalizedKey = key.endsWith('[]') ? key.slice(0, -2) : key;
    const current = result[normalizedKey];

    if (current === undefined) {
      result[normalizedKey] = value;
      return;
    }

    if (Array.isArray(current)) {
      current.push(value);
      return;
    }

    result[normalizedKey] = [current, value];
  });

  return result;
}

export const formats = {
  default: 'RFC3986',
  formatters: {
    RFC3986: (value: string) => value,
  },
};

const qsCompat = {
  stringify,
  parse,
  formats,
};

export default qsCompat;
