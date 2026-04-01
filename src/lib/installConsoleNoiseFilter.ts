import { getExternalIssueNotice } from '@/lib/externalIssues';

let installed = false;
const seenCodes = new Set<string>();

function patchConsoleMethod(method: 'error' | 'warn') {
  const original = console[method].bind(console);

  console[method] = ((...args: unknown[]) => {
    const notice = getExternalIssueNotice(args);

    if (!notice) {
      original(...args);
      return;
    }

    if (seenCodes.has(notice.code)) {
      return;
    }

    seenCodes.add(notice.code);
    original(`[CircleSave] ${notice.title}. ${notice.description}`);
  }) as typeof console[typeof method];
}

export function installConsoleNoiseFilter() {
  if (installed) {
    return;
  }

  installed = true;
  patchConsoleMethod('error');
  patchConsoleMethod('warn');
}
