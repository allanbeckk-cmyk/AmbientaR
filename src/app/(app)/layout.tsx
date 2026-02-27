
'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  Leaf,
  Bell,
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Users,
  Recycle,
  SearchCheck,
} from 'lucide-react';
import type { AppUser, Notification, CompanySettings } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useFirebase, useAuth, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import ChatWidget from '@/components/chat-widget';
import { UpgradeButton } from '@/components/upgrade-dialog';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import NavContent from '@/components/nav-content';
import { SidebarDebugger } from '@/components/sidebar-debugger';


const LogoIcon = () => (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
        <Leaf className="h-5 w-5" />
    </div>
);


const AppLayoutClient = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isInitialized } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const { firestore } = useFirebase();
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoLoading, setLogoLoading] = React.useState(true);
  const { isMobile, setOpenMobile } = useSidebar();


  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/notifications`), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const brandingDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'companySettings', 'branding');
  }, [firestore]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);
  const { data: brandingData } = useDoc<CompanySettings>(brandingDocRef);

  React.useEffect(() => {
    async function fetchLogoUrl() {
      setLogoLoading(true);
      if (brandingData?.logoUsage === 'system_wide') {
        const path = brandingData.systemLogoSource === 'watermark'
          ? brandingData.watermarkImageUrl
          : brandingData.headerImageUrl;

        if (path) {
          try {
            if (path.startsWith('https://')) {
              setLogoUrl(path);
            } else {
              const storage = getStorage();
              const storageRef = ref(storage, path);
              const url = await getDownloadURL(storageRef);
              setLogoUrl(url);
            }
          } catch (error) {
            console.error("Error fetching logo URL for layout:", error);
            setLogoUrl(null);
          }
        } else {
          setLogoUrl(null);
        }
      } else {
        setLogoUrl(null);
      }
      setLogoLoading(false);
    }

    fetchLogoUrl();
  }, [brandingData]);
  
  const showCustomLogo = !logoLoading && logoUrl;

  const unreadCount = React.useMemo(() => {
    return notifications?.filter(n => !n.isRead).length || 0;
  }, [notifications]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!firestore || !user) return;
    if (notification.isRead) return;

    const notifRef = doc(firestore, `users/${user.uid}/notifications`, notification.id);
    await updateDoc(notifRef, { isRead: true });
  };
  
  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification);
    if(notification.link) {
      router.push(notification.link);
    }
  }


  React.useEffect(() => {
    setLoading(false); // Remove artificial loading state
  }, [pathname]);

  React.useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
  }, [user, isInitialized, router]);

  // Se ainda não inicializou (Firebase demorando), redireciona para login após 3s para evitar loading infinito
  React.useEffect(() => {
    if (isInitialized || !user) return;
    const t = setTimeout(() => router.replace('/login'), 3000);
    return () => clearTimeout(t);
  }, [isInitialized, user, router]);

  if (!isInitialized || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Leaf className="w-12 h-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        </div>
    );
  }
  
  const mobileNavItems = [
    { href: '/', label: 'Painel', icon: LayoutDashboard },
    { href: '/calendar', label: 'Agenda', icon: Calendar },
    { href: '/inspections', label: 'Fiscalização', icon: SearchCheck },
    { href: '/licenses', label: 'Gestão', icon: Recycle },
  ];
  
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  return (
    <div className="flex h-screen w-full flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
             <div className="flex items-center gap-2">
                 <div className="md:hidden">
                    <SidebarTrigger />
                </div>
                 <Link href="/" className="flex items-center gap-3">
                    {showCustomLogo ? (
                        <Image src={logoUrl!} alt="Logo" width={120} height={28} className="object-contain" />
                    ) : (
                        <>
                            <LogoIcon />
                            <div>
                                <h2 className="text-lg font-bold leading-tight text-foreground">
                                    AmbientaR
                                </h2>
                                <p className="text-xs text-muted-foreground">Gestão Ambiental Inteligente</p>
                            </div>
                        </>
                    )}
                 </Link>
             </div>
             
             <div className="flex items-center gap-2 sm:gap-4">
               <UpgradeButton />
               <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="icon" className="relative">
                           <Bell className="w-5 h-5"/>
                           {unreadCount > 0 && (
                               <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/90"></span>
                               </span>
                           )}
                           <span className="sr-only">Notificações</span>
                       </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent className="w-80" align="end">
                       <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       {notifications && notifications.length > 0 ? (
                           notifications.map(notification => (
                               <DropdownMenuItem key={notification.id} 
                                   className={cn("flex-col items-start gap-1 cursor-pointer", notification.isRead && "text-muted-foreground")}
                                   onClick={() => handleNotificationClick(notification)}
                               >
                                   <div className="font-medium">{notification.title}</div>
                                   <div className="text-xs">{notification.description}</div>
                               </DropdownMenuItem>
                           ))
                       ) : (
                           <div className="p-4 text-center text-sm text-muted-foreground">
                               Nenhuma notificação nova.
                           </div>
                       )}
                   </DropdownMenuContent>
               </DropdownMenu>
 
               <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="flex items-center gap-2 p-1 h-auto">
                         <Avatar className="h-8 w-8">
                           {user.photoURL && <AvatarImage src={user.photoURL} alt={user.name} />}
                           <AvatarFallback>{user.name ? user.name.substring(0,2).toUpperCase() : ''}</AvatarFallback>
                         </Avatar>
                         <div className="hidden flex-col text-sm text-left md:flex">
                             <span className="font-semibold">{user.name}</span>
                         </div>
                       </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuLabel>
                       <p>{user.name}</p>
                       <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                     </DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                       <Link href="/users">Gerenciar Usuários</Link>
                     </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                       <Link href="/settings">Configurações</Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={logout} className="text-destructive">
                       <LogOut className="mr-2 h-4 w-4"/>
                       Sair
                     </DropdownMenuItem>
                   </DropdownMenuContent>
               </DropdownMenu>
             </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
             <Sidebar>
                 <SidebarContent>
                     <NavContent />
                 </SidebarContent>
             </Sidebar>
             <main className="flex-1 overflow-auto">
               {loading && <Progress value={100} className="absolute top-0 left-0 right-0 h-1 animate-page-load-progress z-50" />}
               <div key={pathname} className="animate-page-fade-in relative h-full">
                 {children}
               </div>
             </main>
        </div>
         
         <ChatWidget />
 
         {/* Bottom Navbar for Mobile */}
         <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-40">
           <div className="flex justify-around items-center h-full">
             {mobileNavItems.map((item) => (
               <Link key={item.href} href={item.href} passHref>
                 <div className={cn(
                   "flex flex-col items-center justify-center gap-1 w-16 h-full text-muted-foreground",
                   pathname === item.href && "text-primary"
                 )} onClick={handleLinkClick}>
                   <item.icon className="h-5 w-5" />
                   <span className="text-xs">{item.label}</span>
                 </div>
               </Link>
             ))}
           </div>
         </div>

         {/* Debugger pormenorizado: menu e submenu da barra lateral (dev ou ?debug=1) */}
         <Suspense fallback={null}>
           <SidebarDebugger />
         </Suspense>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppLayoutClient>{children}</AppLayoutClient>
        </SidebarProvider>
    )
}
