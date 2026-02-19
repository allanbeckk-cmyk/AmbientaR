
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  useSidebar
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Leaf } from 'lucide-react';
import { useAuth } from '@/firebase';
import type { NavItem, NavSubItem, UserRole } from '@/lib/types';
import { allNavItems } from '@/lib/navigation-config';


function NavContent() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [navItems, setNavItems] = React.useState<NavItem[]>([]);
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      const userRole = user.role;

      const filterItemsByRole = (items: (NavItem | NavSubItem)[]): any[] => {
          return items
            .filter(item => !item.roles || item.roles.includes(userRole))
            .map(item => {
              if ('subItems' in item && item.subItems) {
                  const filteredSubItems = filterItemsByRole(item.subItems);
                  if (filteredSubItems.length === 0 && !item.href) {
                      return null;
                  }
                  return { ...item, subItems: filteredSubItems };
              }
              return item;
          }).filter(item => item !== null);
      };
      
      setNavItems(filterItemsByRole(allNavItems));
    }
  }, [user]);

  function renderSubItems(subItems: NavSubItem[], pathname: string, userRole: UserRole) {
      return subItems
        .filter(subItem => !subItem.roles || subItem.roles.includes(userRole))
        .map((subItem) => {

        if (subItem.subItems && subItem.subItems.length > 0) {
          const visibleSubItems = renderSubItems(subItem.subItems, pathname, userRole);
          if (visibleSubItems.every(item => item === null)) {
              return null;
          }

          return (
            <SidebarMenuItem key={`${subItem.label}-group`} className="w-full">
              <Collapsible>
                  <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                          {subItem.icon && <subItem.icon />}
                          <span>{subItem.label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                      </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <SidebarMenuSub>
                          {visibleSubItems}
                      </SidebarMenuSub>
                  </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          );
        }
        
        const href = subItem.href || '#';
        const linkProps = subItem.external ? { href: href, target: "_blank", rel: "noopener noreferrer" } : { href: href };


        return (
          <SidebarMenuSubButton key={`${href}-${subItem.label}`} asChild isActive={pathname === href} onClick={handleLinkClick}>
             <Link {...linkProps}>
              {subItem.icon && <subItem.icon />}
              <span>{subItem.label}</span>
            </Link>
          </SidebarMenuSubButton>
        );
      }).filter(Boolean);
  }

  return (
      <SidebarMenu>
        {navItems.map((item, index) => (
          <SidebarMenuItem key={index} className="w-full">
            {item.subItems && item.subItems.length > 0 ? (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <item.icon />
                    <span>{item.label}</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {user && renderSubItems(item.subItems, pathname, user.role)}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ) : item.href ? (
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{
                  children: item.label,
                }}
                onClick={handleLinkClick}
              >
                <Link {...(item.href.startsWith('/external') ? { href: item.href } : { href: item.href })}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            ) : null}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
  )
}

export default NavContent;
