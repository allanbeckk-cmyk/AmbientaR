'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { HelpCircle, Filter, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';


const calculoOptions = [
    "Amostragem", "Florística", "Diversidade", "Agregação", "Estruturas",
    "ViAmpliado", "Est. Diamétrica", "An. Qualitativa",
    "Valoração", "Experimentação", "Agrupamento"
];

function AmostragemCalculator({onClose}: {onClose: () => void}) {
    return (
        <div className="bg-background rounded-lg border h-full flex flex-col">
             <div className="flex items-start justify-between p-4 border-b">
                 <Tabs defaultValue="casual-simples" className="w-full">
                    <TabsList>
                        <TabsTrigger value="casual-simples">Casual Simples</TabsTrigger>
                        <TabsTrigger value="curva-coletora">Curva Coletora</TabsTrigger>
                    </TabsList>
                    <div className="p-6 flex-1 overflow-auto">
                        <TabsContent value="casual-simples" className="mt-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="casas-decimais">Casas decimais</Label>
                                        <Input id="casas-decimais" type="number" defaultValue={5} className="mt-1 w-24" />
                                    </div>
                                    <div className="p-4 border rounded-md space-y-4">
                                        <h3 className="font-medium">Parâmetros da Amostragem</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="area-total">Área total do inventário (ha)</Label>
                                                <Input id="area-total" type="number" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="erro">Erro (%)</Label>
                                                <Input id="erro" type="number" />
                                            </div>
                                        </div>
                                         <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="probabilidade">Nível de Probabilidade (%)</Label>
                                                <Input id="probabilidade" type="number" defaultValue={90} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Parâmetro</Label>
                                                <Select defaultValue="N">
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="N">N</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 border rounded-md space-y-4">
                                        <h3 className="font-medium">Volume</h3>
                                         <div className="flex items-center space-x-2">
                                            <Checkbox id="por-especie" />
                                            <Label htmlFor="por-especie" className="font-normal">Por Espécie</Label>
                                        </div>
                                        <div>
                                            <Label>Fórmula</Label>
                                            <div className="p-2 bg-muted rounded-md text-sm mt-1">
                                                PI * (D^2) * HT / 40000
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 border rounded-md space-y-4">
                                        <h3 className="font-medium">Apresentar árvores</h3>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="considerar-fuste" />
                                            <Label htmlFor="considerar-fuste" className="font-normal">Considerar cada fuste como um indivíduo</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="arvore-adulta" defaultChecked />
                                            <Label htmlFor="arvore-adulta" className="font-normal">Árvore Adulta</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="arvore-regeneracao" />
                                            <Label htmlFor="arvore-regeneracao" className="font-normal">Árvore de Regeneração</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="curva-coletora" className="mt-0">
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Label htmlFor="casas-decimais-curva">Casas decimais</Label>
                                        <Input id="casas-decimais-curva" type="number" defaultValue={5} className="mt-1 w-24" />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id="exibir-nome-simplificado" />
                                        <Label htmlFor="exibir-nome-simplificado" className="font-normal">Exibir nome científico simplificado</Label>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-md space-y-2">
                                    <Label>Apresentar árvores</Label>
                                    <div className="flex flex-col space-y-2 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="arvore-adulta-curva" defaultChecked />
                                            <Label htmlFor="arvore-adulta-curva" className="font-normal">Árvore Adulta</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="arvore-regeneracao-curva" />
                                            <Label htmlFor="arvore-regeneracao-curva" className="font-normal">Árvore de Regeneração</Label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <Label>Método de ordenação</Label>
                                    <Select defaultValue="parcelas">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="parcelas">Parcelas</SelectItem>
                                            <SelectItem value="aleatorio">Aleatório</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
                <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

export default function CalculadoraPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { firestore } = useFirebase();
  const [selectedCalculo, setSelectedCalculo] = React.useState<string | null>(null);

  const projectDocRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const { data: project, isLoading } = useDoc<InventoryProject>(projectDocRef);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center gap-4">
            {isLoading ? <Skeleton className="h-6 w-48" /> : <h1 className="text-xl font-semibold">{project?.nome || 'Carregando...'} &gt; Calculadora</h1>}
        </div>
      </header>
      <main className="flex-1 overflow-hidden flex">
        {/* Left Sidebar for Calculation Selection */}
        <div className="w-64 bg-background p-4 flex flex-col border-r">
            <h2 className="text-lg font-semibold mb-4 px-2">Seletor de cálculo</h2>
            <div className="flex flex-col gap-1">
                {calculoOptions.map(option => (
                    <Button 
                        key={option} 
                        variant={selectedCalculo === option ? "secondary" : "ghost"}
                        className="justify-start"
                        onClick={() => setSelectedCalculo(option)}
                    >
                        {option}
                    </Button>
                ))}
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 bg-muted/30">
            {selectedCalculo === 'Amostragem' ? (
               <AmostragemCalculator onClose={() => setSelectedCalculo(null)} />
            ) : selectedCalculo ? (
                <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg bg-background">
                    <p className="text-muted-foreground">Interface para "{selectedCalculo}" em construção.</p>
                </div>
            ) : (
                 <div className="flex items-start justify-start pt-2">
                    <p className="text-muted-foreground">Selecione um cálculo na lista à esquerda.</p>
                </div>
            )}
        </div>
      </main>
       <footer className="flex items-center justify-between p-4 border-t bg-background">
            <div className="flex gap-2">
                 <Button variant="outline"><HelpCircle className="mr-2 h-4 w-4" />Ajuda</Button>
                 <Button variant="outline"><Filter className="mr-2 h-4 w-4" />Filtros</Button>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelectedCalculo(null)}>Cancelar</Button>
                <Button>Calcular</Button>
            </div>
       </footer>
    </>
  );
}
