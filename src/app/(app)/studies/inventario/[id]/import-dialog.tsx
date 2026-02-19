
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/stepper';
import { Upload, FileCode, SearchX, Leaf, Fence, Check, AlertCircle, ChevronsRight, ChevronsLeft, ArrowLeftRight, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';


const steps = [
    { label: "Carregar Arquivo", icon: Upload },
    { label: "Associar", icon: FileCode },
    { label: "Inconsistências", icon: SearchX },
    { label: "Lista de Espécies", icon: Leaf },
    { label: "Lista de Parcelas", icon: Fence },
    { label: "Conferir Informações", icon: Check },
];

const softwareColumns = [
    "Nome", "Parcela", "Área da Parcela", "Alt. Comercial", "Alt. Total", "CAP", "DAP",
    "Cód. Classe Reg.", "Cód. Espécie", "Comp. Copa", "Família"
];


interface ImportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ isOpen, onOpenChange }: ImportDialogProps) {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [workbook, setWorkbook] = React.useState<XLSX.WorkBook | null>(null);
    const [sheetNames, setSheetNames] = React.useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = React.useState<string>('');
    const [sheetHeaders, setSheetHeaders] = React.useState<string[]>([]);
    const [sheetData, setSheetData] = React.useState<any[]>([]);
    
    const [selectedPlanilhaColumn, setSelectedPlanilhaColumn] = React.useState<string | null>(null);
    const [selectedSoftwareColumn, setSelectedSoftwareColumn] = React.useState<string | null>(null);
    const [associations, setAssociations] = React.useState<Record<string, string>>({});


    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });
                setWorkbook(wb);
                setSheetNames(wb.SheetNames);
                if(wb.SheetNames.length > 0) {
                    const firstSheet = wb.SheetNames[0];
                    setSelectedSheet(firstSheet);
                    processSheet(wb, firstSheet);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };
    
    const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) return;
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (jsonData.length > 0) {
            const headers = (jsonData[0] as string[]).filter(h => h); // Filter out empty headers
            setSheetHeaders(headers);
            const data = jsonData.slice(1).map(row => {
                const rowData: { [key: string]: any } = {};
                headers.forEach((header, index) => {
                    rowData[header] = row[index];
                });
                return rowData;
            });
            setSheetData(data);
        } else {
            setSheetHeaders([]);
            setSheetData([]);
        }
    }
    
    const handleSheetChange = (sheetName: string) => {
        setSelectedSheet(sheetName);
        if (workbook) {
            processSheet(workbook, sheetName);
        }
    }


    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleNext = () => {
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleDownloadTemplate = () => {
        const headers = [
            "Parcela", "Área da Parcela", "Núm. Árvore", "Nome Científico", 
            "Nome Comum", "Família", "CAP", "Alt. Total", "Alt. Comercial"
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "IMPORTAR");
        XLSX.writeFile(wb, "ModeloDePlanilhaParaImportacao.xlsx");
    };
    
    const handleAssociate = () => {
        if (selectedPlanilhaColumn && selectedSoftwareColumn) {
            setAssociations(prev => ({ ...prev, [selectedPlanilhaColumn]: selectedSoftwareColumn }));
            setSelectedPlanilhaColumn(null);
            setSelectedSoftwareColumn(null);
        }
    };

    const handleAutoAssociate = () => {
        const newAssociations: Record<string, string> = {};
        const availableSoftwareCols = [...softwareColumns];

        sheetHeaders.forEach(planilhaCol => {
            const matchIndex = availableSoftwareCols.findIndex(softwareCol => softwareCol.toLowerCase() === planilhaCol.toLowerCase());
            if (matchIndex > -1) {
                newAssociations[planilhaCol] = availableSoftwareCols[matchIndex];
                availableSoftwareCols.splice(matchIndex, 1);
            }
        });
        setAssociations(prev => ({...prev, ...newAssociations}));
    };

    const handleRemoveAssociation = (planilhaColumn: string) => {
        setAssociations(prev => {
            const newAssocs = { ...prev };
            delete newAssocs[planilhaColumn];
            return newAssocs;
        });
    };

    const unassociatedPlanilhaCols = sheetHeaders.filter(h => !Object.keys(associations).includes(h));
    const unassociatedSoftwareCols = softwareColumns.filter(sc => !Object.values(associations).includes(sc));


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Importar Planilha</DialogTitle>
                    <DialogDescription>
                        Siga os passos para importar os dados da sua planilha para o sistema.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="p-6">
                    <Stepper currentStep={currentStep} steps={steps.map(s => s.label)} icons={steps.map(s => s.icon)} />
                </div>

                <div className="flex-1 overflow-hidden px-6 pb-6">
                   <div className="p-6 border rounded-md h-full flex flex-col">
                        {currentStep === 0 && (
                            <>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Arquivo escolhido:</h3>
                                        <div className="flex items-center gap-4">
                                            <Button variant="outline" size="lg" className="h-16 w-16" onClick={handleUploadClick}>
                                                <Upload className="h-8 w-8" />
                                            </Button>
                                            <div>
                                                <p className="text-sm">{fileName || "Clique no botão ao lado para escolher um arquivo excel."}</p>
                                                <p className="text-xs text-muted-foreground">O arquivo não deve conter mais de 10000 linhas.</p>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".xls,.xlsx"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Planilha escolhida:</h3>
                                        <Select disabled={!fileName} value={selectedSheet} onValueChange={handleSheetChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Escolha a aba da planilha" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sheetNames.map(name => (
                                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="mt-4 flex-1 border rounded-md overflow-hidden flex flex-col">
                                     <div className="p-2 bg-muted border-b text-sm font-medium">Dados da Planilha</div>
                                      <ScrollArea className="flex-1">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {sheetHeaders.map(header => <TableHead key={header}>{header}</TableHead>)}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sheetData.length > 0 ? (
                                                    sheetData.slice(0, 100).map((row, rowIndex) => (
                                                        <TableRow key={rowIndex}>
                                                            {sheetHeaders.map(header => (
                                                                <TableCell key={header}>{row[header]}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={sheetHeaders.length || 1} className="h-48 text-center">
                                                            {fileName ? "Sem dados para mostrar nesta aba." : "Aguardando arquivo..."}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                     </ScrollArea>
                                </div>
                            </>
                        )}
                        {currentStep === 1 && (
                             <div className="flex flex-col h-full gap-4">
                                <div className="grid grid-cols-2 gap-6">
                                     <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Atenção</AlertTitle>
                                        <AlertDescription>
                                            Sua tabela deverá ter, pelo menos, as seguintes colunas:
                                            <ul className="list-disc pl-5 mt-1">
                                                <li>Parcela</li>
                                                <li>Número da Árvore</li>
                                                <li>Nome Comum (ou pelo menos uma informação da espécie)</li>
                                            </ul>
                                            O limite de caracteres para os campos nome científico, nome comum e família é de 250.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="p-4 border rounded-md text-sm space-y-4">
                                        <div>
                                            <Label>Eu possuo CAP ou DAP?</Label>
                                            <RadioGroup defaultValue="cap" className="flex items-center space-x-4 mt-1">
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="cap" id="cap" /><Label htmlFor="cap" className='font-normal'>CAP</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="dap" id="dap" /><Label htmlFor="dap" className='font-normal'>DAP</Label></div>
                                            </RadioGroup>
                                        </div>
                                         <div className="flex items-center space-x-2 pt-2">
                                            <Checkbox id="calculate-dap" />
                                            <Label htmlFor="calculate-dap" className='font-normal'>Calcular automaticamente o DAP</Label>
                                        </div>
                                         <div className="mt-4">
                                            <Label>Unidade do CAP/DAP</Label>
                                            <Select defaultValue="cm">
                                                <SelectTrigger className="mt-1 h-9"><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cm">Centímetro</SelectItem>
                                                    <SelectItem value="m">Metro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                               
                                <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-4 overflow-hidden pt-4">
                                    <div className="flex flex-col gap-2">
                                        <Label>Colunas da Planilha</Label>
                                        <ScrollArea className="border rounded-md flex-1 h-48">
                                            <div className="p-2">
                                                {unassociatedPlanilhaCols.map(header => (
                                                    <div key={header} onClick={() => setSelectedPlanilhaColumn(header)} className={cn("p-1.5 rounded-sm cursor-pointer text-sm", selectedPlanilhaColumn === header && 'bg-primary text-primary-foreground')}>
                                                        {header}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                    
                                     <div className="flex flex-col gap-2 justify-center">
                                        <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAutoAssociate}><ChevronsRight className="mr-2 h-4 w-4"/> Auto Associar</Button>
                                        <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAssociate}><ArrowLeftRight className="mr-2 h-4 w-4"/> Associar</Button>
                                        <Button variant="secondary" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => selectedPlanilhaColumn && handleRemoveAssociation(selectedPlanilhaColumn)}><ChevronsLeft className="mr-2 h-4 w-4"/> Remover Associação</Button>
                                    </div>

                                     <div className="flex flex-col gap-2">
                                        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                                            <div>
                                                <Label>Colunas do Software</Label>
                                                <ScrollArea className="border rounded-md mt-2 h-40">
                                                    <div className="p-2">
                                                        {unassociatedSoftwareCols.map(col => (
                                                            <div key={col} onClick={() => setSelectedSoftwareColumn(col)} className={cn("p-1.5 rounded-sm cursor-pointer text-sm", selectedSoftwareColumn === col && 'bg-primary text-primary-foreground')}>
                                                                {col}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label>Campos Associados</Label>
                                                <ScrollArea className="border rounded-md mt-2 h-40">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Planilha</TableHead>
                                                                <TableHead>Software</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {Object.entries(associations).map(([planilhaCol, softwareCol]) => (
                                                                <TableRow key={planilhaCol} onClick={() => handleRemoveAssociation(planilhaCol)} className='cursor-pointer'>
                                                                    <TableCell>{planilhaCol}</TableCell>
                                                                    <TableCell>{softwareCol}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                            {Object.keys(associations).length === 0 && (
                                                                <TableRow>
                                                                    <TableCell colSpan={2} className="text-center text-xs text-muted-foreground h-24">
                                                                        Sem associações
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentStep > 1 && (
                             <div className="flex items-center justify-center h-full text-muted-foreground">
                                {steps[currentStep].label} (em construção)
                             </div>
                        )}
                   </div>
                </div>

                <DialogFooter className="p-4 border-t bg-muted/50 justify-between">
                    <div>
                        <Button variant="secondary">Ajuda</Button>
                        <Button variant="secondary" className="ml-2" onClick={handleDownloadTemplate}>Baixar planilha modelo</Button>
                    </div>
                    <div>
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                        {currentStep > 0 && <Button variant="outline" className="ml-2" onClick={handleBack}>Voltar</Button>}
                        <Button className="ml-2" onClick={handleNext}>Prosseguir</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
