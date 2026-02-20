
'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { doc, setDoc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { useFirebase, errorEmitter } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Palette, CheckCircle, Folder, Upload, CloudUpload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMemoFirebase, useDoc, useAuth } from '@/firebase';
import type { CompanySettings, TemplateField, AppUser } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AppearanceForm } from './appearance-form';
import { Label } from '@/components/ui/label';
import { BrandingImageUploader } from './branding-uploader';
import { useLocalBranding } from '@/hooks/use-local-branding';

const MicrosoftLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="#F25022" d="M1 1h10v10H1z"/>
        <path fill="#7FBA00" d="M13 1h10v10H13z"/>
        <path fill="#00A4EF" d="M1 13h10v10H1z"/>
        <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
);

const GoogleLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.9999 12.2272C21.9999 11.3926 21.9272 10.5726 21.7863 9.7725H12.2226V14.3835H17.8599C17.6272 15.8617 16.9181 17.1476 15.8181 17.9476V20.8498H19.6454C21.1499 19.2612 21.9999 17.0658 21.9999 14.4135V12.2272Z" fill="#4285F4"/>
        <path d="M12.2226 22.0001C15.1181 22.0001 17.5954 21.0501 19.6454 19.4614L15.8181 16.5591C14.9045 17.1819 13.6817 17.5819 12.2226 17.5819C9.45446 17.5819 7.10446 15.7182 6.24082 13.1364H2.29082V16.0909C4.26355 20.0091 7.91809 22.0001 12.2226 22.0001Z" fill="#34A853"/>
        <path d="M6.24081 13.1364C6.01354 12.5046 5.88172 11.8319 5.88172 11.1364C5.88172 10.4409 6.01354 9.76818 6.23626 9.13636V6.18181H2.29081C1.49081 7.80454 0.999909 9.63181 0.999909 11.5454C0.999909 13.4591 1.49081 15.2864 2.29081 16.9091L6.24081 13.1364Z" fill="#FBBC05"/>
        <path d="M12.2226 5.61818C13.8045 5.61818 15.2272 6.18182 16.3272 7.22727L19.7226 3.83182C17.5908 1.83182 15.1181 1 12.2226 1C7.91809 1 4.26355 2.99091 2.29082 6.90909L6.23626 9.86364C7.10446 7.28182 9.45446 5.61818 12.2226 5.61818Z" fill="#EA4335"/>
    </svg>
);


type TemplateList = {
    field: TemplateField;
    title: string;
};

const rcaListagens: TemplateList[] = [
    { field: 'templatesRcaListagemA', title: 'RCA - Listagem A - Atividades Minerárias' },
    { field: 'templatesRcaListagemB', title: 'RCA - Listagem B - Indústria Metalúrgica' },
    { field: 'templatesRcaListagemC', title: 'RCA - Listagem C - Indústria Química' },
    { field: 'templatesRcaListagemD', title: 'RCA - Listagem D - Indústria Alimentícia' },
    { field: 'templatesRcaListagemE', title: 'RCA - Listagem E - Infraestrutura' },
    { field: 'templatesRcaListagemF', title: 'RCA - Listagem F - Resíduos e Serviços' },
    { field: 'templatesRcaListagemG', title: 'RCA - Listagem G - Agrossilvipastoris' },
];

const pcaListagens: TemplateList[] = [
    { field: 'templatesPcaListagemA', title: 'PCA - Listagem A' },
    { field: 'templatesPcaListagemB', title: 'PCA - Listagem B' },
    { field: 'templatesPcaListagemC', title: 'PCA - Listagem C' },
    { field: 'templatesPcaListagemD', title: 'PCA - Listagem D' },
    { field: 'templatesPcaListagemE', title: 'PCA - Listagem E' },
    { field: 'templatesPcaListagemF', title: 'PCA - Listagem F' },
    { field: 'templatesPcaListagemG', title: 'PCA - Listagem G' },
];

const eiaListagens: TemplateList[] = [
    { field: 'templatesEiaListagemA', title: 'EIA - Listagem A' },
    { field: 'templatesEiaListagemB', title: 'EIA - Listagem B' },
    { field: 'templatesEiaListagemC', title: 'EIA - Listagem C' },
    { field: 'templatesEiaListagemD', title: 'EIA - Listagem D' },
    { field: 'templatesEiaListagemE', title: 'EIA - Listagem E' },
    { field: 'templatesEiaListagemF', title: 'EIA - Listagem F' },
    { field: 'templatesEiaListagemG', title: 'EIA - Listagem G' },
];

const lasRasListagens: TemplateList[] = [
    { field: 'templatesLasRasListagemA', title: 'LAS/RAS - Listagem A' },
    { field: 'templatesLasRasListagemB', title: 'LAS/RAS - Listagem B' },
    { field: 'templatesLasRasListagemC', title: 'LAS/RAS - Listagem C' },
    { field: 'templatesLasRasListagemD', title: 'LAS/RAS - Listagem D' },
    { field: 'templatesLasRasListagemE', title: 'LAS/RAS - Listagem E' },
    { field: 'templatesLasRasListagemF', title: 'LAS/RAS - Listagem F' },
    { field: 'templatesLasRasListagemG', title: 'LAS/RAS - Listagem G' },
];

const outrosTemplates: TemplateList[] = [
    { field: 'templatesFauna', title: 'Fauna' },
    { field: 'templatesInventarioFlorestal', title: 'Inventário Florestal' },
    { field: 'templatesRequerimentoIntervencao', title: 'Requerimento de Intervenção Ambiental' },
    { field: 'templatesPrada', title: 'PRADA' },
    { field: 'templatesPtrf', title: 'PTRF' },
    { field: 'templatesRima', title: 'RIMA' },
    { field: 'templatesOutorgas', title: 'Outorgas' },
    { field: 'templatesSegurancaBarragem', title: 'Segurança de Barragem' },
    { field: 'templatesEstudosCavidades', title: 'Estudos de Cavidades' },
    { field: 'templatesReservaLegal', title: 'Reserva Legal' },
    { field: 'templatesEducacaoAmbiental', title: 'Educação Ambiental' },
    { field: 'templatesProjetoTecnicoBarragem', title: 'Projeto Técnico de Barragem' },
];

const templateGroups = [
    { title: "Relatório de Controle Ambiental (RCA)", templates: rcaListagens },
    { title: "Plano de Controle Ambiental (PCA)", templates: pcaListagens },
    { title: "Estudo de Impacto Ambiental (EIA)", templates: eiaListagens },
    { title: "Relatório Ambiental Simplificado (LAS/RAS)", templates: lasRasListagens },
    { title: "Outros Documentos", templates: outrosTemplates },
];


export default function SettingsPage() {
    const { firestore, user: authUser } = useFirebase();
    const { toast } = useToast();
    
    // State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'template', field?: TemplateField} | null>(null);
    const [currentTemplateList, setCurrentTemplateList] = useState<TemplateField | null>(null);
    
    // Form and Upload states for Templates
    const [newTemplateFile, setNewTemplateFile] = useState<File | null>(null);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [isTemplateLoading, setIsTemplateLoading] = useState(false);

    // Firestore Hooks
    const brandingDocRef = useMemoFirebase(() => (firestore ? doc(firestore, 'companySettings', 'branding') : null), [firestore]);
    const { data: brandingData, isLoading: isLoadingBranding, refetch: refetchBranding } = useLocalBranding();


    // Handlers
    const openDeleteConfirm = (id: string, type: 'template', field?: TemplateField) => {
        setItemToDelete({ id, type, field });
        setIsAlertOpen(true);
    };
    const handleOpenTemplateDialog = (field: TemplateField) => { setCurrentTemplateList(field); setIsTemplateDialogOpen(true); };

    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash === '#identidade-visual') {
            const el = document.getElementById('identidade-visual');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const handleDelete = async () => {
        if (!firestore || !itemToDelete) return;
        if (itemToDelete.type === 'template' && itemToDelete.field && brandingDocRef) {
            const fieldName = itemToDelete.field;
            try {
                const docSnap = await getDoc(brandingDocRef);
                if (docSnap.exists()) {
                    const currentData = docSnap.data();
                    const currentTemplates = currentData[fieldName] || [];
                    const templateToRemove = currentTemplates.find((t: { name: string }) => t.name === itemToDelete!.id);
                    if (templateToRemove) {
                        await updateDoc(brandingDocRef, { [fieldName]: arrayRemove(templateToRemove) });
                        toast({ title: 'Template Removido' });
                    }
                }
            } catch (error) {
                 console.error("Error removing template:", error);
                 toast({ variant: "destructive", title: "Erro ao remover"});
            }
        }
        setIsAlertOpen(false);
        setItemToDelete(null);
    };
    
    const handleSaveBrandingChoice = async (field: 'logoUsage' | 'systemLogoSource', value: 'pdf_only' | 'system_wide' | 'header' | 'watermark') => {
        try {
            const res = await fetch('/api/branding', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value }) });
            if (!res.ok) throw new Error('Falha ao salvar');
            await refetchBranding();
            toast({ title: 'Configuração salva!' });
        } catch (error) {
            console.error('Error saving branding choice:', error);
            toast({ variant: 'destructive', title: 'Erro ao salvar' });
        }
    };

    return (
        <>
        <div className="flex flex-col h-full">
            <PageHeader title="Configurações" />
            <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="grid gap-8 max-w-4xl mx-auto">
                <AppearanceForm />
                {authUser?.role === 'admin' && (
                    <>
                        <Card id="identidade-visual" className="border-primary/50 border-2 scroll-mt-4">
                            <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5"/><span>Identidade Visual</span><Badge className="bg-primary hover:bg-primary/90">Premium</Badge></CardTitle>
                            <CardDescription>Personalize contratos, estudos, ofícios e relatórios com a sua marca. Faça upload do cabeçalho, rodapé e marca d&apos;água; eles serão usados nos PDFs gerados pelo sistema. Se não carregar alguma imagem, o espaço correspondente ficará em branco nos documentos.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isLoadingBranding ? <Skeleton className="h-48 w-full" /> : (
                                    <>
                                        <BrandingImageUploader label="Cabeçalho (Header)" fieldName="headerImageUrl" imageUrl={brandingData?.headerImageUrl ?? null} onUploadComplete={refetchBranding} />
                                        <BrandingImageUploader label="Rodapé (Footer)" fieldName="footerImageUrl" imageUrl={brandingData?.footerImageUrl ?? null} onUploadComplete={refetchBranding} />
                                        <BrandingImageUploader label="Marca d'água (Watermark)" fieldName="watermarkImageUrl" imageUrl={brandingData?.watermarkImageUrl ?? null} onUploadComplete={refetchBranding} />
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-primary/50 border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><span>Uso da Logo da Empresa</span><Badge className="bg-primary hover:bg-primary/90">Premium</Badge></CardTitle>
                                <CardDescription>Decida como a identidade visual da sua empresa será aplicada no sistema.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label>Aplicação do Logo</Label>
                                    <RadioGroup key={`logo-${brandingData?.logoUsage ?? 'pdf_only'}`} defaultValue={brandingData?.logoUsage || 'pdf_only'} onValueChange={(value: 'pdf_only' | 'system_wide') => handleSaveBrandingChoice('logoUsage', value)} className="mt-2 space-y-2">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="pdf_only" id="pdf_only" /><Label htmlFor="pdf_only" className="font-normal">Apenas em documentos PDF (Padrão)</Label></div>
                                        <p className="text-xs text-muted-foreground pl-6">Mantém o logo "AmbientaR" na interface do sistema e usa sua marca apenas nos PDFs.</p>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="system_wide" id="system_wide" /><Label htmlFor="system_wide" className="font-normal">Em todo o sistema (White-label)</Label></div>
                                        <p className="text-xs text-muted-foreground pl-6">Substitui o logo "AmbientaR" pela sua marca em todo o sistema, incluindo login e menus.</p>
                                    </RadioGroup>
                                </div>
                                {brandingData?.logoUsage === 'system_wide' && (
                                    <div className="pt-4 border-t space-y-2">
                                        <Label>Fonte do Logo do Sistema</Label>
                                        <RadioGroup key={`source-${brandingData?.systemLogoSource ?? 'header'}`} defaultValue={brandingData?.systemLogoSource || 'header'} onValueChange={(value: 'header' | 'watermark') => handleSaveBrandingChoice('systemLogoSource', value)} className="mt-2 space-y-2">
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="header" id="source_header" /><Label htmlFor="source_header" className="font-normal">Usar imagem do Cabeçalho</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="watermark" id="source_watermark" /><Label htmlFor="source_watermark" className="font-normal">Usar imagem da Marca d'água</Label></div>
                                        </RadioGroup>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
            </main>
        </div>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isso irá deletar o item permanentemente.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
