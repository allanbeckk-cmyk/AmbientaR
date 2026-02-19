'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getNavDebugInfo, listarTodosSubmenus, type NavDebugInfo } from '@/lib/nav-debug';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bug, ChevronUp, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';

const isDev = process.env.NODE_ENV === 'development';

function logPormenorizado(info: NavDebugInfo) {
  const prefix = '[Sidebar Debug]';
  console.groupCollapsed(`${prefix} ${info.pathname}`);
  console.log('pathname', info.pathname);
  console.log('pathnameNormalizado', info.pathnameNormalizado);
  console.log('menuPrincipal', info.menuPrincipal);
  console.log('breadcrumb', info.breadcrumb);
  console.log('submenuAtual', info.submenuAtual);
  console.log('caminhoCompleto', info.caminhoCompleto);
  console.log('encontrado', info.encontrado);
  console.log('timestamp', info.timestamp);
  console.groupEnd();
}

export function SidebarDebugger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showDebug = isDev || searchParams.get('debug') === '1' || searchParams.get('debug') === 'true';
  const [open, setOpen] = React.useState(false);
  const [listagemCompleta, setListagemCompleta] = React.useState(false);

  const info = React.useMemo(() => getNavDebugInfo(pathname || ''), [pathname]);

  React.useEffect(() => {
    if (!showDebug) return;
    logPormenorizado(info);
  }, [showDebug, info]);

  const todosSubmenus = React.useMemo(() => listarTodosSubmenus(), []);

  if (!showDebug) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-xs font-medium',
              'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20'
            )}
          >
            <span className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-500" />
              Debug Navegação
            </span>
            <span className="truncate text-muted-foreground">
              {info.menuPrincipal && info.submenuAtual
                ? `${info.menuPrincipal} → ${info.submenuAtual.label}`
                : info.encontrado
                  ? info.breadcrumb.join(' → ')
                  : `Rota não mapeada: ${pathname}`}
            </span>
            <ChevronUp className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="max-h-[40vh] overflow-auto border-t p-4 text-xs font-mono space-y-4">
            {/* Resumo da rota atual */}
            <section>
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <FolderTree className="h-3.5 w-3" />
                Rota atual (pormenorizado)
              </h4>
              <table className="w-full border-collapse">
                <tbody>
                  <tr><td className="py-1 pr-2 text-muted-foreground">pathname</td><td className="py-1">{info.pathname}</td></tr>
                  <tr><td className="py-1 pr-2 text-muted-foreground">pathnameNormalizado</td><td className="py-1">{info.pathnameNormalizado}</td></tr>
                  <tr><td className="py-1 pr-2 text-muted-foreground">menuPrincipal</td><td className="py-1">{info.menuPrincipal ?? '—'}</td></tr>
                  <tr><td className="py-1 pr-2 text-muted-foreground">breadcrumb</td><td className="py-1">{info.breadcrumb.length ? info.breadcrumb.join(' → ') : '—'}</td></tr>
                  <tr><td className="py-1 pr-2 text-muted-foreground">submenuAtual</td><td className="py-1">{info.submenuAtual ? `${info.submenuAtual.label} (${info.submenuAtual.href ?? ''})` : '—'}</td></tr>
                  <tr><td className="py-1 pr-2 text-muted-foreground">encontrado</td><td className="py-1">{info.encontrado ? 'Sim' : 'Não'}</td></tr>
                  <tr><td className="py-1 pr-2 text-muted-foreground">timestamp</td><td className="py-1">{info.timestamp}</td></tr>
                </tbody>
              </table>
            </section>

            {/* Caminho completo na árvore */}
            <section>
              <h4 className="font-semibold text-foreground mb-2">Caminho na árvore (cada nível)</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {info.caminhoCompleto.length > 0 ? (
                  info.caminhoCompleto.map((e, i) => (
                    <li key={i}>
                      {'  '.repeat(e.depth)}[{e.depth}] {e.label}
                      {e.href ? ` → ${e.href}` : ''}
                      {e.roles?.length ? ` roles: ${e.roles.join(', ')}` : ''}
                    </li>
                  ))
                ) : (
                  <li>Nenhum item da barra lateral corresponde a esta rota.</li>
                )}
              </ul>
            </section>

            {/* Listagem de todos os submenus */}
            <section>
              <button
                type="button"
                className="text-primary hover:underline mb-2"
                onClick={() => setListagemCompleta((v) => !v)}
              >
                {listagemCompleta ? 'Ocultar' : 'Mostrar'} lista de todos os submenus ({todosSubmenus.length})
              </button>
              {listagemCompleta && (
                <div className="overflow-auto max-h-48 rounded border bg-background/50 p-2">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 pr-2">Menu</th>
                        <th className="text-left py-1 pr-2">Submenu (caminho)</th>
                        <th className="text-left py-1">href</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todosSubmenus.map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1 pr-2">{row.menu}</td>
                          <td className="py-1 pr-2">{row.submenu}</td>
                          <td className="py-1 truncate max-w-[200px]" title={row.href}>{row.href}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
