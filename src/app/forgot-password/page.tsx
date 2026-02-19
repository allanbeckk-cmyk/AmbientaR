
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFirebase } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Leaf, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState(false);
  const { auth } = useFirebase();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Serviço',
        description: 'Serviço de autenticação não está disponível.',
      });
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: 'Email Enviado!',
        description: 'Verifique sua caixa de entrada para o link de redefinição de senha.',
      });
      form.reset();
    } catch (error: any) {
      console.error('Password reset error:', error);
      let description = 'Ocorreu um erro. Verifique o e-mail e tente novamente.';
      if (error.code === 'auth/user-not-found') {
        description = 'Nenhum usuário encontrado com este e-mail.';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar Email',
        description,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-green-50/50 dark:to-green-950/20">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center">
            <Link href="/login" className="flex items-center gap-3 text-primary mb-4">
              <Leaf className="w-10 h-10" />
              <h1 className="text-4xl font-bold">AmbientaR</h1>
            </Link>
        </div>
        <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
          <CardHeader>
            <CardTitle className="text-xl">Recuperar Senha</CardTitle>
            <CardDescription>
              Insira seu e-mail para receber um link de redefinição de senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu-email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Email de Recuperação'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
         <div className="mt-6 text-center text-xs">
            <Link href="/login" className="text-muted-foreground underline hover:text-primary transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="h-3 w-3" />
                Voltar para o Login
            </Link>
        </div>
      </div>
       <div className="absolute bottom-6 text-center text-xs text-muted-foreground/80">
        <p>Desenvolvido por Pimenta Consultoria Ambiental</p>
      </div>
    </div>
  );
}
