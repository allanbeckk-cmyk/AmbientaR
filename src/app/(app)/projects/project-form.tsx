
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
} from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Project, Empreendedor, AppUser } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormDefault } from './form-default';
import { useRouter } from 'next/navigation';
import { cleanEmptyValues } from '@/lib/utils';
import _ from 'lodash';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const formSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
  userId: z.string().min(1, 'Selecione um usuário cliente responsável.'),
  activity: z.string().min(1, 'A atividade principal é obrigatória.'),
  subActivity: z.string().optional(),
  propertyName: z.string().min(1, "O nome da propriedade é obrigatório."),
  fantasyName: z.string().optional(),
  status: z.enum(['Válida', 'Vencida', 'Em Renovação', 'Suspensa', 'Cancelada', 'Em Andamento']).optional(),
  matricula: z.string().optional(),
  comarca: z.string().optional(),
  address: z.string().optional(),
  numero: z.string().optional(),
  uf: z.string().optional(),
  municipio: z.string().optional(),
  cep: z.string().optional(),
  district: z.string().optional(),
  ownerCondition: z.array(z.string()).optional(),
  geographicLocation: z.object({
    datum: z.enum(['SAD-69', 'WGS-84', 'Córrego Alegre'], { required_error: 'O datum é obrigatório.'}),
    format: z.enum(['Lat/Long', 'UTM'], { required_error: 'O formato da coordenada é obrigatório.'}),
    latLong: z.object({
      lat: z.object({ grau: z.string().optional(), min: z.string().optional(), seg: z.string().optional() }),
      long: z.object({ grau: z.string().optional(), min: z.string().optional(), seg: z.string().optional() }),
    }).optional(),
    utm: z.object({
      x: z.string().optional(),
      y: z.string().optional(),
      fuso: z.enum(['22', '23', '24'], { required_error: 'O fuso é obrigatório.'}),
    }).optional(),
  }).optional(),
}).passthrough();

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  currentItem?: Project | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const getInitialValues = (currentItem?: Project | null): FormValues => {
    const defaults = {
        empreendedorId: '',
        userId: '',
        activity: 'Dados Gerais',
        subActivity: '',
        propertyName: '',
        fantasyName: '',
        status: 'Em Andamento',
        matricula: '',
        comarca: '',
        address: '',
        numero: '',
        uf: '',
        municipio: '',
        cep: '',
        district: '',
        ownerCondition: [],
        geographicLocation: {
            datum: 'WGS-84',
            format: 'UTM',
            latLong: { lat: { grau: '', min: '', seg: '' }, long: { grau: '', min: '', seg: '' } },
            utm: { x: '', y: '', fuso: '23' },
            local: '',
            additionalLocationInfo: '',
            hydrographicBasin: '',
            hydrographicSubBasin: '',
            upgrh: '',
            nearestWaterCourse: '',
        },
        locationalRestrictions: {
            inKarstArea: false,
            inFluvialLacustrineArea: false,
        },
        criteriosDN130: {
            compromissos: [],
            praticasDesenvolvidas: [],
        },
        jobCreation: {},
        projectArea: {},
        atividadesAgricolas: {},
        atividadesFlorestais: {},
    };

    if (currentItem) {
        // Use lodash merge for deep merging, which is generally safe, but ensure defaults are solid
        return _.merge({}, defaults, currentItem);
    }

    return defaults as FormValues;
};


export function ProjectForm({ currentItem, onSuccess, onCancel }: ProjectFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();


  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Empreendedor>(empreendedoresQuery);

  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(currentItem),
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = cleanEmptyValues(values);


    if (currentItem) {
      const docRef = doc(firestore, 'projects', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({
            title: 'Projeto atualizado!',
            description: 'As informações foram salvas com sucesso.',
          });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const collectionRef = collection(firestore, 'projects');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'Projeto criado!',
            description: `O projeto ${values.propertyName} foi adicionado com sucesso.`,
          });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }
  
  const formProps = {
    form,
    clients: clients || [],
    isLoadingClients,
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
           <Tabs defaultValue="default" className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="h-auto flex-wrap justify-start">
                  <TabsTrigger value="default" onClick={() => form.setValue('activity', 'Dados Gerais')}>Dados Gerais</TabsTrigger>
                  <TabsTrigger value="listagem-a" onClick={() => form.setValue('activity', 'LISTAGEM A – ATIVIDADES MINERÁRIAS')}>Listagem A</TabsTrigger>
                  <TabsTrigger value="listagem-b" onClick={() => form.setValue('activity', 'LISTAGEM B – ATIVIDADES INDUSTRIAIS')}>Listagem B</TabsTrigger>
                  <TabsTrigger value="listagem-c" onClick={() => form.setValue('activity', 'LISTAGEM C – INDÚSTRIA QUÍMICA')}>Listagem C</TabsTrigger>
                  <TabsTrigger value="listagem-d" onClick={() => form.setValue('activity', 'LISTAGEM D – INDÚSTRIA ALIMENTÍCIA')}>Listagem D</TabsTrigger>
                  <TabsTrigger value="listagem-e" onClick={() => form.setValue('activity', 'LISTAGEM E – INFRAESTRUTURA')}>Listagem E</TabsTrigger>
                  <TabsTrigger value="listagem-f" onClick={() => form.setValue('activity', 'LISTAGEM F – RESÍDUOS E SERVIÇOS')}>Listagem F</TabsTrigger>
                  <TabsTrigger value="listagem-g" onClick={() => form.setValue('activity', 'LISTAGEM G – AGROSSILVIPASTORIS')}>Listagem G</TabsTrigger>
                  <TabsTrigger value="listagem-h" onClick={() => form.setValue('activity', 'LISTAGEM H – OUTRAS ATIVIDADES')}>Listagem H</TabsTrigger>
              </TabsList>
              <div className="flex-1 mt-4 pr-2 -mr-6 overflow-y-auto">
                   <div className="space-y-4 rounded-md border p-4 mb-4">
                     <h3 className="text-lg font-medium">Responsável pelo Projeto</h3>
                     <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuário Cliente Responsável</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingUsers}>
                               <FormControl>
                                 <SelectTrigger>
                                   <SelectValue placeholder={isLoadingUsers ? "Carregando..." : "Selecione um usuário cliente"} />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                 {users?.filter(u => u.role === 'client').map(user => (
                                   <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                            <FormDescription>Associe este projeto a um usuário cliente para notificações.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                   <TabsContent value="default" className="mt-4">
                       <FormDefault {...formProps} />
                   </TabsContent>
                   <TabsContent value="listagem-a" className="mt-0">
                      <FormDefault {...formProps} />
                   </TabsContent>
                   <TabsContent value="listagem-b" className="mt-0">
                      <FormDefault {...formProps} />
                   </TabsContent>
                   <TabsContent value="listagem-c" className="mt-0">
                      <FormDefault {...formProps} />
                   </TabsContent>
                   <TabsContent value="listagem-d" className="mt-0">
                      <FormDefault {...formProps} />
                   </TabsContent>
                   <TabsContent value="listagem-e" className="mt-0">
                      <FormDefault {...formProps} />
                   </TabsContent>
                   <TabsContent value="listagem-f" className="mt-0">
                      <FormDefault {...formProps} />
                   </TabsContent>
                   <TabsContent value="listagem-g" className="mt-0">
                      <FormDefault {...formProps} />
                   </TabsContent>
                   <TabsContent value="listagem-h" className="mt-0">
                      <FormDefault {...formProps} />
                   </TabsContent>
              </div>
              <div className="flex justify-end space-x-2 pt-4 mt-auto border-t">
                  <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                      Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                      {loading ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                      </>
                      ) : (
                      'Salvar'
                      )}
                  </Button>
              </div>
          </Tabs>
        </form>
      </Form>
    </>
  );
}
