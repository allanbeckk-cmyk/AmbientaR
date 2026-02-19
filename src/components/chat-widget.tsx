
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessagesSquare, X, Trash2, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, setDoc, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import type { AppUser, ChatMessage, Chat } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';


const getChatId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<AppUser | null>(null);
    const [message, setMessage] = React.useState('');
    const [chatId, setChatId] = React.useState<string | null>(null);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [messageToDelete, setMessageToDelete] = React.useState<ChatMessage | null>(null);
    const [unreadCounts, setUnreadCounts] = React.useState<Record<string, number>>({});
    const [isMuted, setIsMuted] = React.useState(false);
    
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        if (user.role === 'admin' || user.role === 'supervisor') {
          return query(collection(firestore, 'users'), where('uid', '!=', user.uid));
        }
        return query(collection(firestore, 'users'), where('role', 'in', ['admin', 'supervisor']));
    }, [firestore, user]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersQuery);
    
    const chatsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'chats'), where('participants', 'array-contains', user.uid));
    }, [firestore, user]);

    React.useEffect(() => {
        if (!firestore || !user) return;
        
        const q = query(collection(firestore, 'chats'), where('participants', 'array-contains', user.uid));

        const unsubscribe = onSnapshot(q, async (chatsSnapshot) => {
            const newUnreadCounts: Record<string, number> = {};
            let totalUnread = 0;

            for (const chatDoc of chatsSnapshot.docs) {
                const chatData = chatDoc.data();
                if (chatData.participants && chatData.participants.includes(user.uid)) {
                    try {
                        const messagesRef = collection(firestore, 'chats', chatDoc.id, 'messages');
                        const unreadQuery = query(messagesRef, where('receiverId', '==', user.uid), where('read', '==', false));
                        const messagesSnapshot = await getDocs(unreadQuery);
                        const count = messagesSnapshot.size;
                        
                        const otherParticipantId = chatData.participants.find((p: string) => p !== user.uid);
                        if (otherParticipantId) {
                            newUnreadCounts[otherParticipantId] = count;
                        }
                        totalUnread += count;
                    } catch (e) {
                         console.warn(`Could not fetch unread count for chat ${chatDoc.id}. This might be due to security rules.`);
                    }
                }
            }
            const currentTotal = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
             if (totalUnread > currentTotal && !isMuted && audioRef.current) {
                audioRef.current.play().catch(e => console.warn("Audio playback failed:", e));
            }
            setUnreadCounts(newUnreadCounts);
        }, (error) => {
             console.error("Error listening to user's chats collection: ", error);
        });

        return () => unsubscribe();
    }, [firestore, user, isMuted, unreadCounts]);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !chatId) return null;
        return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
    }, [firestore, chatId]);
    const { data: messages, isLoading: isLoadingMessages } = useCollection<ChatMessage>(messagesQuery);
    

    React.useEffect(() => {
        if(typeof window !== "undefined") {
            audioRef.current = new Audio('/audio/notification.mp3');
        }
    }, []);
    
     React.useEffect(() => {
        if (isOpen && chatId && messages && firestore && user) {
            const batch = writeBatch(firestore);
            let hasUnread = false;
            messages.forEach(msg => {
                if (msg.receiverId === user.uid && !msg.read) {
                    const msgRef = doc(firestore, 'chats', chatId, 'messages', msg.id);
                    batch.update(msgRef, { read: true });
                    hasUnread = true;
                }
            });
            if (hasUnread) {
                batch.commit().catch(e => console.error("Error marking messages as read:", e));
            }
        }
    }, [isOpen, chatId, messages, firestore, user]);


    const visibleMessages = React.useMemo(() => {
        if (!messages || !user) return [];
        return messages.filter(msg => !msg.deletedFor?.includes(user.uid));
    }, [messages, user]);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visibleMessages]);

    const handleUserSelect = (selected: AppUser) => {
        setSelectedUser(selected);
        if (user) {
            setChatId(getChatId(user.uid, selected.uid));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !selectedUser || !message.trim() || !chatId) return;

        const messageData = {
            senderId: user.uid,
            receiverId: selectedUser.uid,
            text: message,
            timestamp: serverTimestamp(),
            read: false,
        };

        const chatDocRef = doc(firestore, 'chats', chatId);
        const chatData = {
            participants: [user.uid, selectedUser.uid],
            lastMessage: message,
            lastMessageTimestamp: serverTimestamp(),
            lastMessageSenderId: user.uid,
        };

        setMessage(''); // Clear input immediately for better UX

        setDoc(chatDocRef, chatData, { merge: true })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: chatDocRef.path,
                    operation: 'write',
                    requestResourceData: chatData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        
        const messagesColRef = collection(chatDocRef, 'messages');
        addDoc(messagesColRef, messageData)
            .catch(async (serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: messagesColRef.path,
                    operation: 'create',
                    requestResourceData: messageData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };
    
    const openDeleteConfirm = (msg: ChatMessage) => {
        setMessageToDelete(msg);
        setIsAlertOpen(true);
    };

    const handleDeleteMessage = async () => {
        if (!firestore || !user || !messageToDelete || !chatId) return;
        const msgRef = doc(firestore, 'chats', chatId, 'messages', messageToDelete.id);
        
        updateDoc(msgRef, { deletedFor: arrayUnion(user.uid) })
            .then(() => {
                toast({ title: "Mensagem apagada" });
            })
            .catch(async (serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: msgRef.path,
                    operation: 'update',
                    requestResourceData: { deletedFor: [user.uid] },
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsAlertOpen(false);
                setMessageToDelete(null);
            });
    }

    const toggleMute = () => {
        setIsMuted(!isMuted);
        toast({
            title: isMuted ? "Som ativado" : "Som desativado",
            duration: 2000,
        });
    }
    
    const totalUnreadCount = React.useMemo(() => Object.values(unreadCounts).reduce((a, b) => a + b, 0), [unreadCounts]);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    }


    if (!user) return null;

    return (
        <>
            <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
                <Button onClick={toggleOpen} size="icon" className="relative h-14 w-14 rounded-full shadow-lg">
                    {totalUnreadCount > 0 && !isOpen && (
                         <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {totalUnreadCount}
                        </div>
                    )}
                    {isOpen ? <X className="h-6 w-6" /> : <MessagesSquare className="h-6 w-6" />}
                </Button>
            </div>

            {isOpen && (
                 <Card className="fixed bottom-36 right-4 z-50 w-full max-w-sm h-[600px] flex flex-col shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 md:bottom-20">
                    <CardHeader className="flex flex-row items-center justify-between p-2 border-b">
                         <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} className={cn(selectedUser ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle className="text-base font-semibold">Chat Interno</CardTitle>
                        <Button variant="ghost" size="icon" onClick={toggleMute}>
                           {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                    </CardHeader>
                    
                    <div className="flex-1 overflow-hidden grid" style={{gridTemplateColumns: selectedUser ? '0 1fr' : '1fr 0', transition: 'grid-template-columns 300ms ease-in-out'}}>
                        {/* User List */}
                        <ScrollArea className="h-full" style={{gridColumn: 1}}>
                             <div className="p-2">
                                {isLoadingUsers ? (
                                    Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full my-2" />)
                                ) : (
                                    users?.map(u => (
                                        <Button key={u.id} variant='ghost' className="w-full justify-start gap-3 h-14" onClick={() => handleUserSelect(u)}>
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={u.photoURL} alt={u.name} />
                                                <AvatarFallback>{u.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 text-left flex items-center justify-between">
                                                <div className='flex items-center gap-2'>
                                                  <div className="font-medium">{u.name}</div>
                                                  <span className={cn("h-2 w-2 rounded-full", u.isOnline ? 'bg-green-500' : 'bg-red-500')} />
                                                </div>
                                                {unreadCounts[u.uid] > 0 && (
                                                    <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">{unreadCounts[u.uid]}</Badge>
                                                )}
                                            </div>
                                        </Button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                        
                        {/* Chat Area */}
                        <div className="flex flex-col h-full bg-background" style={{gridColumn: 2}}>
                           {selectedUser && (
                            <>
                                <div className="p-2 border-b flex items-center gap-2">
                                    <Avatar className="h-8 w-8"><AvatarImage src={selectedUser.photoURL} alt={selectedUser.name} /><AvatarFallback>{selectedUser.name.substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                                    <h3 className="font-semibold text-sm">{selectedUser.name}</h3>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        {isLoadingMessages && <p className="text-center text-muted-foreground text-xs">Carregando...</p>}
                                        {visibleMessages.map(msg => (
                                            <div key={msg.id} className={cn("flex items-end gap-2 group", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                                                {msg.senderId === user?.uid && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openDeleteConfirm(msg)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                )}
                                                <div className={cn("max-w-[75%] rounded-lg px-3 py-2",  msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                                    <p className="text-sm">{msg.text}</p>
                                                </div>
                                                 {msg.senderId !== user?.uid && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openDeleteConfirm(msg)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                )}
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                                <CardFooter className="p-2 border-t">
                                    <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                                        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Digite sua mensagem..." className="h-9" />
                                        <Button type="submit" size="icon" className="h-9 w-9" disabled={!message.trim()}><Send className="h-4 w-4" /></Button>
                                    </form>
                                </CardFooter>
                            </>
                           )}
                        </div>
                    </div>
                </Card>
            )}
            
            <audio ref={audioRef} src="/audio/notification.mp3" preload="auto"></audio>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta ação irá apagar a mensagem apenas para você. O outro usuário e o administrador ainda poderão vê-la.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteMessage}>Apagar para mim</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    

    
