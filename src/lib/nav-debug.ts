'use client';

import type { NavItem, NavSubItem } from '@/lib/types';
import { allNavItems } from '@/lib/navigation-config';

export type NavDebugEntry = {
  label: string;
  href?: string;
  depth: number; // 0 = menu principal, 1 = submenu, 2 = sub-submenu
  roles?: string[];
};

export type NavDebugInfo = {
  pathname: string;
  /** Menu principal da barra lateral (ex: "Financeiro", "Cadastro") */
  menuPrincipal: string | null;
  /** Caminho de labels do menu até o item atual (ex: ["Financeiro", "Faturas"] ou ["Gestão Ambiental", "Monitoramento Usos Hídricos/Outorgas", "Monitoramento Manual"]) */
  breadcrumb: string[];
  /** Item de nível mais profundo que corresponde à rota (label + href) */
  submenuAtual: { label: string; href?: string } | null;
  /** Todas as entradas da árvore até o item atual (para exibição pormenorizada) */
  caminhoCompleto: NavDebugEntry[];
  /** Se a rota atual foi encontrada na configuração de navegação */
  encontrado: boolean;
  /** Rota normalizada (sem query string) usada para match */
  pathnameNormalizado: string;
  timestamp: string;
};

function normalizarPathname(pathname: string): string {
  return pathname.split('?')[0] || pathname;
}

function matchPath(current: string, href: string | undefined): boolean {
  if (!href || href.startsWith('/external')) return false;
  const norm = normalizarPathname(current);
  if (norm === href) return true;
  // Rotas dinâmicas: /invoices/123 → match em /invoices
  if (href.endsWith('/') && norm === href.slice(0, -1)) return true;
  if (norm.startsWith(href + '/')) return true;
  return false;
}

function buscarRecursivo(
  pathname: string,
  pathNorm: string,
  items: (NavItem | NavSubItem)[],
  menuPrincipal: string | null,
  breadcrumb: string[],
  caminho: NavDebugEntry[],
  depth: number
): NavDebugInfo | null {
  for (const item of items) {
    const label = item.label;
    const href = 'href' in item ? item.href : undefined;
    const roles = item.roles;
    const entry: NavDebugEntry = { label, href, depth, roles };

    if (href && matchPath(pathNorm, href)) {
      return {
        pathname,
        pathnameNormalizado: pathNorm,
        menuPrincipal,
        breadcrumb: [...breadcrumb, label],
        submenuAtual: { label, href },
        caminhoCompleto: [...caminho, entry],
        encontrado: true,
        timestamp: new Date().toISOString(),
      };
    }

    if ('subItems' in item && item.subItems && item.subItems.length > 0) {
      const novoMenu = depth === 0 ? label : menuPrincipal;
      const resultado = buscarRecursivo(
        pathname,
        pathNorm,
        item.subItems,
        novoMenu,
        [...breadcrumb, label],
        [...caminho, entry],
        depth + 1
      );
      if (resultado) return resultado;
    }
  }
  return null;
}

/**
 * Retorna informações pormenorizadas de debug para a rota atual em relação aos menus da barra lateral.
 */
export function getNavDebugInfo(pathname: string): NavDebugInfo {
  const pathNorm = normalizarPathname(pathname);

  // Itens de primeiro nível: podem ser link direto (href) ou menu com subItems
  for (let i = 0; i < allNavItems.length; i++) {
    const item = allNavItems[i];
    const label = item.label;
    const href = item.href;
    const entry: NavDebugEntry = { label, href, depth: 0, roles: item.roles };

    if (href && matchPath(pathNorm, href)) {
      return {
        pathname,
        pathnameNormalizado: pathNorm,
        menuPrincipal: label,
        breadcrumb: [label],
        submenuAtual: { label, href },
        caminhoCompleto: [entry],
        encontrado: true,
        timestamp: new Date().toISOString(),
      };
    }

    if (item.subItems && item.subItems.length > 0) {
      const resultado = buscarRecursivo(
        pathname,
        pathNorm,
        item.subItems,
        label,
        [label],
        [entry],
        1
      );
      if (resultado) return resultado;
    }
  }

  return {
    pathname,
    pathnameNormalizado: pathNorm,
    menuPrincipal: null,
    breadcrumb: [],
    submenuAtual: null,
    caminhoCompleto: [],
    encontrado: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Lista todos os submenus da barra lateral (para debug): menu principal + cada submenu com href.
 */
export function listarTodosSubmenus(): { menu: string; submenu: string; href: string }[] {
  const lista: { menu: string; submenu: string; href: string }[] = [];

  function walk(items: (NavItem | NavSubItem)[], menuLabel: string, path: string[]) {
    for (const item of items) {
      const label = item.label;
      const href = 'href' in item ? item.href : undefined;
      const fullPath = [...path, label];

      if (href && !href.startsWith('/external')) {
        lista.push({
          menu: menuLabel,
          submenu: fullPath.join(' → '),
          href,
        });
      }
      if ('subItems' in item && item.subItems?.length) {
        const nextMenu = menuLabel || label;
        walk(item.subItems, nextMenu, fullPath);
      }
    }
  }

  for (const item of allNavItems) {
    if (item.href && !item.href.startsWith('/external')) {
      lista.push({ menu: item.label, submenu: item.label, href: item.href });
    }
    if (item.subItems?.length) {
      walk(item.subItems, item.label, [item.label]);
    }
  }
  return lista;
}
