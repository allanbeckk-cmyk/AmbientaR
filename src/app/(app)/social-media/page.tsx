'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram, Facebook, Linkedin, Link2 } from 'lucide-react';

export default function SocialMediaPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Mídias Sociais" />
      <main className="flex-1 overflow-auto p-4 md:p-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Conectar Contas de Mídia Social</CardTitle>
              <CardDescription>
                Insira suas chaves de API e outras credenciais para agregar seus feeds sociais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="instagram-api" className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-[#E1306C]" />
                  <span>Instagram API Key</span>
                </Label>
                <Input id="instagram-api" placeholder="Cole sua chave de API aqui" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook-api" className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-[#1877F2]" />
                  <span>Facebook App ID</span>
                </Label>
                <Input id="facebook-api" placeholder="Cole seu App ID aqui" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="linkedin-api" className="flex items-center gap-2">
                  <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                  <span>LinkedIn API Key</span>
                </Label>
                <Input id="linkedin-api" placeholder="Cole sua chave de API aqui" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="other-api" className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  <span>Outra URL de Feed (RSS/JSON)</span>
                </Label>
                <Input id="other-api" placeholder="https://exemplo.com/feed.xml" />
              </div>
              <Button className="w-full">
                Salvar e Conectar
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Feed Agregado</CardTitle>
                    <CardDescription>
                        Visualização centralizada das suas últimas postagens.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">O conteúdo das mídias sociais aparecerá aqui.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
