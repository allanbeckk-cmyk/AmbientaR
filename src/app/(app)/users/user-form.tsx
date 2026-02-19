
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, EyeOff, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, UserRole } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { logUserAction } from '@/lib/audit-log';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const baseSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  role: z.enum(['admin', 'client', 'technical', 'sales', 'financial', 'gestor', 'supervisor', 'diretor_fauna']),
  status: z.enum(['active', 'inactive']),
  cpf: z.string().optional(),
  cnpjs: z.array(z.object({ value: z.string().min(14, "O CNPJ deve ser válido.") })).optional(),
  dataNascimento: z.date().optional(),
  photoURL: z.string().optional(),
});

const createFormSchema = baseSchema.extend({
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
}).refine(data => data.role !== 'client' || (data.cpf || (data.cnpjs && data.cnpjs.length > 0)), {
    message: 'Para o perfil "Cliente", é obrigatório informar o CPF ou pelo menos um CNPJ.',
    path: ['cpf'],
});

const editFormSchema = baseSchema.extend({
    password: z.string().optional().refine(val => val === '' || !val || val.length >= 6, {
        message: "A senha deve ter pelo menos 6 caracteres se for alterada.",
        path: ["password"],
    })
}).refine(data => data.role !== 'client' || (data.cpf || (data.cnpjs && data.cnpjs.length > 0)), {
    message: 'Para o perfil "Cliente", é obrigatório informar o CPF ou pelo menos um CNPJ.',
    path: ['cpf'],
});


type UserFormValues = z.infer<typeof createFormSchema>;

interface UserFormProps {
  currentUser?: AppUser | null;
  onSuccess?: () => void;
}

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'client', label: 'Cliente' },
  { value: 'technical', label: 'Técnico' },
  { value: 'sales', label: 'Vendas' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'gestor', label: 'Gestor Ambiental' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'diretor_fauna', label: 'Diretor de Fauna' },
];

export function UserForm({ currentUser, onSuccess }: UserFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [dataNascimentoInput, setDataNascimentoInput] = React.useState(
    currentUser?.dataNascimento ? format(new Date(currentUser.dataNascimento), 'dd/MM/yyyy') : ''
  );
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  const currentSchema = currentUser ? editFormSchema : createFormSchema;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      role: currentUser?.role || 'client',
      status: currentUser?.status || 'active',
      password: '',
      cpf: currentUser?.cpf || '',
      cnpjs: currentUser?.cnpjs?.map(c => ({ value: c })) || [],
      dataNascimento: currentUser?.dataNascimento ? new Date(currentUser.dataNascimento) : undefined,
      photoURL: currentUser?.photoURL || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "cnpjs",
  });
  
  const selectedRole = form.watch('role');


  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); 
    
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    form.setValue('cpf', value, { shouldValidate: true });
  };
  
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let value = e.target.value.replace(/\D/g, '');

    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');

    form.setValue(`cnpjs.${index}.value`, value, { shouldValidate: true });
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
    if (value.length > 10) value = value.slice(0, 10);
    setDataNascimentoInput(value);

    if (value.length === 10) {
      const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
      if (!isNaN(parsedDate.getTime())) {
        form.setValue('dataNascimento', parsedDate, { shouldValidate: true });
      } else {
        form.setError('dataNascimento', { type: 'manual', message: 'Data inválida' });
      }
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    form.setValue('dataNascimento', date, { shouldValidate: true });
    if (date) {
      setDataNascimentoInput(format(date, 'dd/MM/yyyy'));
    }
  }

  async function onSubmit(values: UserFormValues) {
    setLoading(true);

    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const cnpjsArray = values.cnpjs?.map(c => c.value) || [];

    if (currentUser) {
      // --- Update existing user logic ---
      const userRef = doc(firestore, 'users', currentUser.id);
      const updateData: Partial<AppUser> = {
        name: values.name,
        email: values.email,
        role: values.role,
        status: values.status,
        cpf: values.cpf || '',
        cnpjs: cnpjsArray,
        photoURL: values.photoURL || '',
        dataNascimento: values.dataNascimento?.toISOString() || '',
      };

      updateDoc(userRef, updateData)
        .then(() => {
          toast({
            title: 'Usuário atualizado!',
            description: 'As informações do usuário foram salvas com sucesso.',
          });
          logUserAction(firestore, auth, 'update_user', { userId: currentUser.id, userName: values.name });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });

    } else {
        // --- Create new user logic ---
        if (!values.password) {
            toast({ variant: 'destructive', title: 'Senha obrigatória' });
            setLoading(false);
            return;
        }

        try {
            // Check if email already exists in Firestore
            const usersRef = collection(firestore, "users");
            const emailQuery = query(usersRef, where("email", "==", values.email));
            const querySnapshot = await getDocs(emailQuery);

            if (!querySnapshot.empty) {
                toast({
                    variant: 'destructive',
                    title: 'E-mail já em uso',
                    description: 'Este e-mail já está cadastrado. Por favor, utilize um e-mail diferente.',
                });
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const newFirebaseUser = userCredential.user;
            
            const newUserId = newFirebaseUser.uid;
            
            const userDocData: Omit<AppUser, 'id'> = {
                uid: newUserId,
                name: values.name,
                email: values.email,
                role: values.role,
                status: values.status,
                cpf: values.cpf || '',
                cnpjs: cnpjsArray,
                photoURL: values.photoURL || '',
                dataNascimento: values.dataNascimento?.toISOString() || '',
                isOnline: false,
            };

            await setDoc(doc(firestore, 'users', newUserId), userDocData);
            logUserAction(firestore, auth, 'create_user', { newUserId: newUserId, newUserName: values.name });
            toast({
              title: 'Usuário criado!',
              description: `As informações de ${values.name} foram salvas com sucesso.`,
            });
            
            form.reset();
            onSuccess?.();

        } catch (error: any) {
             toast({
              variant: 'destructive',
              title: 'Oh, não! Algo deu errado.',
              description: error.code === 'auth/email-already-in-use'
                ? 'Este e-mail já está em uso por outra conta. Por favor, utilize um e-mail diferente.'
                : (error.message || 'Não foi possível criar o usuário na autenticação.'),
            });
        } finally {
            setLoading(false);
        }
    }
  }

  return (
    <>
        <Form {...form}>
            <form id="user-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome do usuário" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} disabled={!!currentUser} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <div className="relative">
                            <FormControl>
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={currentUser ? 'Deixe em branco para não alterar' : '••••••••'}
                                {...field}
                            />
                            </FormControl>
                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
                            </Button>
                        </div>
                        <FormDescription>{currentUser ? 'Deixe em branco para não alterar a senha.' : 'A senha deve ter pelo menos 6 caracteres.'}</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nível de Acesso</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um nível" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    {selectedRole !== 'admin' && (
                    <FormField
                        control={form.control}
                        name="dataNascimento"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Data de Nascimento (Opcional)</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <div className="relative">
                                        <FormControl>
                                            <Input 
                                                placeholder="DD/MM/AAAA"
                                                value={dataNascimentoInput}
                                                onChange={handleDateInputChange}
                                            />
                                        </FormControl>
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={handleDateSelect}
                                        initialFocus
                                        captionLayout="dropdown-buttons"
                                        fromYear={1930}
                                        toYear={new Date().getFullYear()}
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    )}
                    {form.watch('role') === 'client' && (
                    <div className='space-y-4 rounded-md border p-4'>
                        <h3 className="text-sm font-medium">Documentos de Vinculação (Cliente)</h3>
                        <p className='text-sm text-muted-foreground'>Vincule este usuário a um ou mais empreendedores através do CPF ou CNPJ.</p>
                        <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                                <Input placeholder="000.000.000-00" {...field} onChange={handleCpfChange} maxLength={14} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div>
                        <Label>CNPJs</Label>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 mt-2">
                            <FormField
                                control={form.control}
                                name={`cnpjs.${index}.value`}
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                    <Input placeholder="00.000.000/0000-00" {...field} onChange={(e) => handleCnpjChange(e, index)} maxLength={18} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar CNPJ
                        </Button>
                        </div>
                    </div>
                    )}
                    <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Status</FormLabel>
                            <FormDescription>
                            Usuários inativos não podem acessar o sistema.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value === 'active'}
                            onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onSuccess}>
                    Cancelar
                    </Button>
                    <Button form="user-form" type="submit" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 
                      'Salvar'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    </>
  );
}
