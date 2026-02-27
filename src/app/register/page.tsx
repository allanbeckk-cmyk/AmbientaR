
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
import { Loader2, Leaf, ArrowLeft, ArrowRight, Check, Crown, Star, Zap, Rocket, Gift, MessageSquareMore } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ClientPackage, ClientPackageInfo } from '@/lib/types';

const PACKAGES: ClientPackageInfo[] = [
  {
    id: 'gratuito',
    name: 'Gratuito',
    description: 'Acesso básico para conhecer a plataforma.',
    price: 'R$ 0',
    features: [
      'Acesso ao dashboard básico',
      'Visualização de licenças',
      'Suporte por email',
    ],
  },
  {
    id: 'basico',
    name: 'Básico',
    description: 'Ideal para quem está começando na gestão ambiental.',
    price: 'R$ 49,90/mês',
    features: [
      'Tudo do plano Gratuito',
      'Gestão de licenças ambientais',
      'Calendário de prazos',
      'Relatórios básicos',
    ],
  },
  {
    id: 'intermediario',
    name: 'Intermediário',
    description: 'Para empresas que precisam de mais recursos.',
    price: 'R$ 99,90/mês',
    highlighted: true,
    features: [
      'Tudo do plano Básico',
      'Gestão de condicionantes',
      'Monitoramento ambiental',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
  },
  {
    id: 'avancado',
    name: 'Avançado',
    description: 'Recursos completos para gestão ambiental profissional.',
    price: 'R$ 199,90/mês',
    features: [
      'Tudo do plano Intermediário',
      'Elaboração de estudos ambientais',
      'Análise com Inteligência Artificial',
      'Gestão financeira integrada',
      'Suporte dedicado',
    ],
  },
  {
    id: 'completo',
    name: 'Completo',
    description: 'A solução definitiva para gestão ambiental.',
    price: 'R$ 349,90/mês',
    features: [
      'Acesso a todos os módulos',
      'Análises com IA ilimitadas',
      'CRM e gestão comercial',
      'Geração de PDFs e relatórios',
      'Suporte VIP 24h',
    ],
  },
  {
    id: 'sob_consulta',
    name: 'Sob Consulta',
    description: 'Soluções personalizadas para demandas específicas que vão além da plataforma.',
    price: 'Personalizado',
    features: [
      'Consultoria ambiental dedicada',
      'Assessoria técnica especializada',
      'Projetos sob demanda',
      'Atendimento presencial',
      'Orçamento personalizado',
    ],
  },
];

const PACKAGE_ICONS: Record<ClientPackage, React.ReactNode> = {
  gratuito: <Gift className="h-6 w-6" />,
  basico: <Star className="h-6 w-6" />,
  intermediario: <Zap className="h-6 w-6" />,
  avancado: <Rocket className="h-6 w-6" />,
  completo: <Crown className="h-6 w-6" />,
  sob_consulta: <MessageSquareMore className="h-6 w-6" />,
};

const formSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  phone: z.string().min(10, 'Insira um telefone válido com DDD.'),
  cpf: z.string().min(11, 'Insira um CPF válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  confirmPassword: z.string().min(6, 'Confirme sua senha.'),
  selectedPackage: z.enum(['gratuito', 'basico', 'intermediario', 'avancado', 'completo', 'sob_consulta'], {
    required_error: 'Selecione um pacote.',
  }),
  contractAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os termos do contrato.' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;

function getContractText(packageId: ClientPackage | undefined): string {
  const baseContract = `TERMOS DE USO E CONTRATO DE PRESTAÇÃO DE SERVIÇOS

PIMENTA CONSULTORIA AMBIENTAL, pessoa jurídica de direito privado, doravante denominada CONTRATADA, e o USUÁRIO, pessoa física ou jurídica que realiza o cadastro nesta plataforma, doravante denominado CONTRATANTE, celebram o presente contrato mediante as seguintes cláusulas:

CLÁUSULA 1ª — DO OBJETO
O presente contrato tem por objeto a prestação de serviços de acesso à plataforma AmbientaR — Gestão Ambiental Inteligente, conforme o plano selecionado pelo CONTRATANTE.

CLÁUSULA 2ª — DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se compromete a:
a) Fornecer informações verdadeiras e atualizadas;
b) Manter a confidencialidade de suas credenciais de acesso;
c) Utilizar a plataforma de acordo com a legislação vigente.

CLÁUSULA 3ª — DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se compromete a:
a) Disponibilizar os serviços contratados conforme o plano escolhido;
b) Manter a segurança e a integridade dos dados do CONTRATANTE;
c) Prestar suporte técnico conforme o nível do plano contratado.

CLÁUSULA 4ª — DA PRIVACIDADE E PROTEÇÃO DE DADOS
Os dados pessoais do CONTRATANTE serão tratados em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).`;

  const basicClause = `

CLÁUSULA 5ª — DO CONSENTIMENTO PARA COMUNICAÇÃO COMERCIAL (PLANO BÁSICO)
Ao optar pelo plano Básico, o CONTRATANTE autoriza expressamente a CONTRATADA a acessar seus dados cadastrais (nome, e-mail, telefone e endereço) para fins de:
a) Comunicação sobre serviços de consultoria e assessoria ambiental;
b) Envio de propostas comerciais relacionadas à área ambiental;
c) Contato para oferecimento de serviços complementares.
O CONTRATANTE pode revogar este consentimento a qualquer momento mediante solicitação formal.`;

  const finalClause = `

CLÁUSULA ${packageId === 'basico' ? '6ª' : '5ª'} — DO FORO
Fica eleito o foro da comarca de Belo Horizonte — MG para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato.

Ao assinar abaixo, o CONTRATANTE declara ter lido e concordado com todos os termos deste contrato.`;

  return baseContract + (packageId === 'basico' ? basicClause : '') + finalClause;
}

export default function RegisterPage() {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      password: '',
      confirmPassword: '',
      selectedPackage: undefined,
      contractAccepted: undefined as any,
    },
    mode: 'onChange',
  });

  const selectedPackage = form.watch('selectedPackage');

  const canAdvanceStep1 = () => {
    const { name, email, phone, cpf, password, confirmPassword } = form.getValues();
    return name.length >= 3 && email.includes('@') && phone.length >= 10 && cpf.length >= 11 && password.length >= 6 && confirmPassword === password;
  };

  const canAdvanceStep2 = () => {
    return !!selectedPackage;
  };

  async function onSubmit(values: FormValues) {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Serviços não disponíveis. Tente novamente.' });
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const uid = cred.user.uid;

      await setDoc(doc(firestore, 'users', uid), {
        uid: uid,
        name: values.name,
        email: values.email,
        phone: values.phone,
        cpf: values.cpf,
        cnpjs: [],
        role: 'client',
        status: 'active',
        package: values.selectedPackage,
        contractAcceptedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isOnline: true,
      });

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Bem-vindo ao AmbientaR. Você será redirecionado.',
      });

      router.push('/');
    } catch (error: any) {
      let description = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este e-mail já está cadastrado. Tente fazer login.';
      } else if (error.code === 'auth/weak-password') {
        description = 'A senha deve ter no mínimo 6 caracteres.';
      }
      toast({ variant: 'destructive', title: 'Erro no Cadastro', description });
    } finally {
      setLoading(false);
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all',
              step === s
                ? 'bg-primary text-primary-foreground scale-110'
                : step > s
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {step > s ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <div className={cn('h-0.5 w-8 transition-all', step > s ? 'bg-primary' : 'bg-muted')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Dados Pessoais</CardTitle>
        <CardDescription>Preencha suas informações para criar sua conta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" {...field} />
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
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu-email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(31) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Repita sua senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="button"
          className="w-full"
          onClick={() => setStep(2)}
          disabled={!canAdvanceStep1()}
        >
          Próximo <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Escolha seu Pacote</CardTitle>
        <CardDescription>Selecione o plano que melhor atende às suas necessidades.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="selectedPackage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => field.onChange(pkg.id)}
                      className={cn(
                        'relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md',
                        field.value === pkg.id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50',
                        pkg.highlighted && field.value !== pkg.id && 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                      )}
                    >
                      {pkg.highlighted && (
                        <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
                          Mais Popular
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          field.value === pkg.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {PACKAGE_ICONS[pkg.id]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold">{pkg.name}</h3>
                            <span className="text-sm font-bold text-primary whitespace-nowrap">{pkg.price}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                          <ul className="mt-2 space-y-1">
                            {pkg.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {field.value === pkg.id && (
                        <div className="absolute top-3 right-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3 mt-6">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => setStep(3)}
            disabled={!canAdvanceStep2()}
          >
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Contrato e Assinatura</CardTitle>
        <CardDescription>Leia os termos e assine para concluir seu cadastro.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4 max-h-64 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">
            {getContractText(selectedPackage)}
          </pre>
        </div>

        {selectedPackage === 'basico' && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
              Atenção: No plano Básico, ao aceitar este contrato, você autoriza a Pimenta Consultoria Ambiental
              a acessar seus dados cadastrais para fins de comunicação comercial sobre serviços de consultoria
              e assessoria ambiental. Você pode revogar este consentimento a qualquer momento.
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="contractAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true ? true : undefined)}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm cursor-pointer">
                  Li e aceito os termos do contrato de prestação de serviços.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Concluir Cadastro
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const stepLabels = ['Dados Pessoais', 'Pacote', 'Contrato'];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-green-50/50 dark:to-green-950/20">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center">
          <Link href="/login" className="flex items-center gap-2 text-foreground mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
              <Leaf className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">AmbientaR</h1>
          </Link>
          <p className="text-center text-muted-foreground text-sm">
            Cadastro de Cliente
          </p>
        </div>

        {renderStepIndicator()}

        <p className="text-center text-sm font-medium text-muted-foreground mb-4">
          Etapa {step} de 3 — {stepLabels[step - 1]}
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </form>
        </Form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="underline hover:text-primary transition-colors font-medium">
            Faça login
          </Link>
        </div>
      </div>
      <div className="absolute bottom-6 text-center text-xs text-muted-foreground/80">
        <p>Desenvolvido por Barros e Sá Investimentos</p>
      </div>
    </div>
  );
}
