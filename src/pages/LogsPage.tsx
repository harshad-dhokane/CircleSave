import { ArrowRightLeft, ExternalLink, FileText, PiggyBank, Repeat, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { formatAddress } from '@/lib/constants';
import { getStarkZapLogAmountText } from '@/lib/starkzapLogs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LOG_KIND_META = {
  swap: { label: 'Swap', color: '#4ECDC4', icon: ArrowRightLeft },
  dca: { label: 'DCA', color: '#FFE66D', icon: Repeat },
  lending: { label: 'Lending', color: '#96CEB4', icon: PiggyBank },
} as const;

function getStatusClasses(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-[#96CEB4] text-black';
    case 'failed':
      return 'bg-[#FF6B6B] text-white';
    default:
      return 'bg-[#FFE66D] text-black';
  }
}

export function LogsPage() {
  const { logs, clearLogs } = useStarkZapLogs();
  const swapCount = logs.filter((log) => log.kind === 'swap').length;
  const dcaCount = logs.filter((log) => log.kind === 'dca').length;
  const lendingCount = logs.filter((log) => log.kind === 'lending').length;

  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <div className="border-b-[2px] border-black bg-white">
        <div className="page-shell py-8 md:py-9">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 border-[2px] border-black bg-[#DDA0DD] px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em]">
                <FileText className="h-4 w-4" />
                StarkZap Activity
              </div>
              <h1 className="mb-2 text-4xl font-black md:text-5xl">Logs</h1>
              <p className="max-w-3xl text-[15px] leading-relaxed text-black/70 md:text-base">
                Review every StarkZap swap, DCA, and lending transaction in one place, including status and Voyager links.
              </p>
            </div>

            <Button variant="outline" onClick={clearLogs} className="border-[2px] border-black">
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </Button>
          </div>
        </div>
      </div>

      <div className="page-shell space-y-6 py-8 md:py-10">
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Entries', value: logs.length, color: '#DDA0DD' },
            { label: 'Swaps', value: swapCount, color: '#4ECDC4' },
            { label: 'DCA Orders', value: dcaCount, color: '#FFE66D' },
            { label: 'Lending Actions', value: lendingCount, color: '#96CEB4' },
          ].map((item) => (
            <div key={item.label} className="border-[2px] border-black bg-white p-5">
              <div className="mb-3 h-2 w-16 border-[2px] border-black" style={{ backgroundColor: item.color }} />
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-black/60">{item.label}</p>
              <p className="mt-2 text-3xl font-black">{item.value}</p>
            </div>
          ))}
        </section>

        {logs.length > 0 ? (
          <section className="neo-card overflow-hidden p-0">
            <Table className="min-w-[1040px]">
              <TableHeader className="bg-black [&_tr]:border-black">
                <TableRow className="border-black hover:bg-black">
                  <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Type</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Amount</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Summary</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Account</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Provider</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Status</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Updated</TableHead>
                  <TableHead className="px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-white">Voyager</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const meta = LOG_KIND_META[log.kind];
                  const Icon = meta.icon;
                  const amountText = getStarkZapLogAmountText(log);

                  return (
                    <TableRow key={log.id} className="border-black bg-white hover:bg-[#FEFAE0]">
                      <TableCell className="px-4 py-4 align-top">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center border-[2px] border-black"
                            style={{ backgroundColor: meta.color }}
                          >
                            <Icon className="h-4 w-4 text-black" />
                          </div>
                          <div>
                            <p className="font-black">{meta.label}</p>
                            <p className="text-xs uppercase tracking-[0.08em] text-black/50">{log.title}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top text-sm font-black text-black/80">
                        {amountText || 'Pending amount data'}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top">
                        <p className="max-w-[320px] whitespace-normal text-[15px] leading-relaxed text-black/75">{log.summary}</p>
                        {log.error && <p className="mt-2 text-sm font-medium text-red-600">{log.error}</p>}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top text-sm font-bold">{formatAddress(log.account)}</TableCell>
                      <TableCell className="px-4 py-4 align-top text-sm text-black/65">{log.provider}</TableCell>
                      <TableCell className="px-4 py-4 align-top">
                        <span className={`inline-flex border-[2px] border-black px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${getStatusClasses(log.status)}`}>
                          {log.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top text-sm text-black/65">
                        {new Date(log.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top">
                        <a
                          href={log.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-black underline underline-offset-4"
                        >
                          Open
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>
        ) : (
          <div className="neo-card p-12 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-[3px] border-black bg-[#FEFAE0]">
              <FileText className="h-9 w-9" />
            </div>
            <h2 className="mb-3 text-3xl font-black">No StarkZap Logs Yet</h2>
            <p className="mx-auto max-w-2xl text-[15px] leading-relaxed text-black/70">
              Once you submit a swap, DCA, or lending transaction, it will appear here as a row with its current status and explorer link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
