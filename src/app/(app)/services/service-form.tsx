
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Service } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { logUserAction } from '@/lib/audit-log';

const formSchema = z.object({
  name: z.string().min(3, 'O nome do serviço é obrigatório.'),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, 'O custo deve ser um valor positivo.').optional(),
  price: z.coerce.number().positive('O preço deve ser um valor positivo.'),
});

type FormValues = z.infer<typeof formSchema>;

interface ServiceFormProps {
  currentItem?: Service | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const formatCurrencyBRL = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

const CurrencyInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { onChange: (value: number) => void; value: number }>(
    ({ value, onChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState(formatCurrencyBRL(value || 0));

        React.useEffect(() => {
            setDisplayValue(formatCurrencyBRL(value || 0));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            onChange(numericValue);
            setDisplayValue(formatCurrencyBRL(numericValue));
        };
        
        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            setDisplayValue(formatCurrencyBRL(numericValue));
        };

        return <Input ref={ref} value={displayValue} onChange={handleChange} onBlur={handleBlur} {...props} />;
    }
);
CurrencyInput.displayName = "CurrencyInput";


export function ServiceForm({ currentItem, onSuccess, onCancel }: ServiceFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentItem?.name || '',
      description: currentItem?.description || '',
      cost: currentItem?.cost || 0,
      price: currentItem?.price || 0,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore || !auth) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = { ...values };

    if (currentItem) {
      const itemRef = doc(firestore, 'services', currentItem.id);
      updateDoc(itemRef, dataToSave)
        .then(() => {
          toast({ title: 'Serviço atualizado!', description: 'As informações foram salvas com sucesso.' });
          logUserAction(firestore, auth, 'update_service', { serviceId: currentItem.id, serviceName: values.name });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: itemRef.path, operation: 'update', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const itemsCollectionRef = collection(firestore, 'services');
      addDoc(itemsCollectionRef, dataToSave)
        .then((docRef) => {
          toast({ title: 'Serviço criado!', description: 'O novo serviço foi adicionado com sucesso.' });
          logUserAction(firestore, auth, 'create_service', { serviceId: docRef.id, serviceName: values.name });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: itemsCollectionRef.path, operation: 'create', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Serviço</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Elaboração de RCA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva o que está incluso no serviço." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Custo (R$)</FormLabel>
                    <FormControl>
                    <CurrencyInput placeholder="R$ 0,00" value={field.value || 0} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Preço de Venda (R$)</FormLabel>
                    <FormControl>
                    <CurrencyInput placeholder="R$ 0,00" value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
