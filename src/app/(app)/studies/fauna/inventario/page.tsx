'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InventarioFaunaForm } from './inventario-form';
import { useFirebase, errorEmitter } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { FaunaStudy } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { useRouter } from 'next/navigation';

export default function InventarioFaunaPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();

    const handleSave = async (data: Partial<FaunaStudy>, status: 'draft' | 'completed') => {
        if (!firestore) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Serviço de banco de dados indisponível.',
            });
            return;
        }

        const dataToSave = {
            ...data,
            studyType: 'inventario_projeto' as const,
            status, // 'draft' or 'completed'
        };

        try {
            if (data.id) {
                // Update existing document
                const docRef = doc(firestore, 'faunaStudies', data.id);
                await updateDoc(docRef, dataToSave);
                toast({
                    title: 'Projeto Atualizado!',
                    description: `O projeto de inventário foi salvo como ${status === 'draft' ? 'rascunho' : 'concluído'}.`,
                });
            } else {
                // Create new document
                const collectionRef = collection(firestore, 'faunaStudies');
                const docRef = await addDoc(collectionRef, {
                    ...dataToSave,
                    createdAt: serverTimestamp(),
                });
                toast({
                    title: 'Projeto Criado!',
                    description: `O projeto de inventário foi salvo como ${status === 'draft' ? 'rascunho' : 'concluído'}.`,
                });
            }
            // Navigate back to the list page on successful save
            router.push('/studies/fauna');

        } catch (error) {
            console.error("Error saving fauna study: ", error);
            const path = data.id ? `faunaStudies/${data.id}` : 'faunaStudies';
            const permissionError = new FirestorePermissionError({
                path: path,
                operation: data.id ? 'update' : 'create',
                requestResourceData: dataToSave,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar',
                description: 'Não foi possível salvar o projeto. Verifique suas permissões.',
            });
        }
    };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Inventário de Fauna Silvestre Terrestre" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Projeto Técnico</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para gerar o projeto técnico para autorização de manejo de fauna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InventarioFaunaForm currentItem={null} onSave={handleSave} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
