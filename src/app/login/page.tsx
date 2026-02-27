
'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { Leaf } from 'lucide-react';

const LogoIcon = () => (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
        <Leaf className="h-6 w-6" />
    </div>
);

function LoginPageContent() {
  return (
    <div className="w-full max-w-sm animate-fade-in-up">
      <div className="mb-6 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 text-foreground mb-2">
            <LogoIcon />
            <h1 className="text-4xl font-bold text-foreground">
                AmbientaR
            </h1>
        </Link>
        <p className="text-center text-muted-foreground text-sm">
          Gestão Ambiental Inteligente
        </p>
      </div>
      <LoginForm />
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link href="/register" className="underline hover:text-primary transition-colors font-medium text-primary">
          Cadastre-se
        </Link>
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground">
        <Link href="/forgot-password" className="underline hover:text-primary transition-colors">
          Esqueceu a senha?
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-green-50/50 dark:to-green-950/20">
      <Suspense>
        <LoginPageContent />
      </Suspense>
      <div className="absolute bottom-6 text-center text-xs text-muted-foreground/80">
        <p>Barros e Sá Investimentos</p>
      </div>
    </div>
  );
}
