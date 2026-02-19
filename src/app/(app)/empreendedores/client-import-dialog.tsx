
'use client';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import type { Client, Empreendedor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ClientImportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImportSuccess: () => void;
}

export function ClientImportDialog({ isOpen, onOpenChange, onImportSuccess }: ClientImportDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [selectedClients, setSelectedClients] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const isLoading = isLoadingClients || isLoadingEmpreendedores;

  const importableClients = React.useMemo(() => {
    if (!clients || !empreendedores) return [];
    
    const empreendedorCpfCnpjs = new Set(empreendedores.map(e => e.cpfCnpj));
    
    return clients.filter(c => !empreendedorCpfCnpjs.has(c.cpfCnpj));
  }, [clients, empreendedores]);
  
  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  }

  const handleImport = async () => {
    if (!firestore || selectedClients.length === 0) return;
    setLoading(true);

    const clientsToImport = clients?.filter(c => selectedClients.includes(c.id));
    if (!clientsToImport) {
        setLoading(false);
        return;
    }
    
    const batch = writeBatch(firestore);
    const empreendedoresCollectionRef = collection(firestore, 'empreendedores');

    clientsToImport.forEach(client => {
      const newEmpreendedorRef = doc(empreendedoresCollectionRef);
      const newEmpreendedorData: Partial<Empreendedor> = {
          name: client.name,
          email: client.email,
          phone: client.phone,
          cpfCnpj: client.cpfCnpj,
          entityType: Array.isArray(client.entityType) ? client.entityType : (client.entityType ? [client.entityType] : []),
          address: client.address,
          municipio: client.municipio,
          uf: client.uf,
          cep: client.cep,
          sourceClientId: client.id,
      };
      batch.set(newEmpreendedorRef, newEmpreendedorData);
    });

    try {
        await batch.commit();
        toast({
            title: "Importação Concluída",
            description: `${clientsToImport.length} cliente(s) foram importados como empreendedores.`
        });
        setSelectedClients([]);
        onImportSuccess();
    } catch(error) {
        console.error("Error importing clients:", error);
        toast({
            variant: "destructive",
            title: "Erro na Importação",
            description: "Não foi possível importar os clientes. Verifique o console para mais detalhes."
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar Clientes para Empreendedores</DialogTitle>
          <DialogDescription>
            Selecione os clientes que você deseja cadastrar como empreendedores. Clientes já existentes como empreendedores não serão listados.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <ScrollArea className="h-72 w-full rounded-md border">
                <div className="p-4">
                    {isLoading && Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-2">
                             <Skeleton className="h-4 w-4" />
                             <Skeleton className="h-5 w-3/4" />
                        </div>
                    ))}
                    {!isLoading && importableClients.length > 0 ? (
                        importableClients.map(client => (
                            <div key={client.id} className="flex items-center space-x-2 py-2">
                                <Checkbox
                                    id={client.id}
                                    checked={selectedClients.includes(client.id)}
                                    onCheckedChange={() => handleSelectClient(client.id)}
                                />
                                <label
                                    htmlFor={client.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {client.name} <span className="text-xs text-muted-foreground">({client.cpfCnpj})</span>
                                </label>
                            </div>
                        ))
                    ) : !isLoading ? (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
                            <p>Nenhum novo cliente para importar.</p>
                        </div>
                    ) : null}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleImport} disabled={selectedClients.length === 0 || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importar {selectedClients.length > 0 ? `(${selectedClients.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
