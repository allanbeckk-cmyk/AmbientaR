
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

interface AttributeSectionProps {
  title: string;
  headers: string[];
}

const AttributeSection: React.FC<AttributeSectionProps> = ({ title, headers }) => (
  <div className="border rounded-lg p-4 flex flex-col">
    <h3 className="font-semibold mb-2">{title}</h3>
    <div className="flex-grow overflow-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={headers.length} className="h-24 text-center">
              Sem linhas para mostrar
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <div className="flex justify-end gap-2 mt-2">
      <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
        <Plus className="mr-2 h-4 w-4" /> Inserir
      </Button>
      <Button size="sm" variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" /> Excluir
      </Button>
    </div>
  </div>
);

export function AtributosDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Atributos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Atributos de Espécie</DialogTitle>
          <DialogDescription>
            Gerencie os atributos qualitativos, quantitativos e descritivos das espécies.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <AttributeSection title="Variáveis Qualitativas" headers={['Descrição', 'Abreviação', 'Sim/Não']} />
          <AttributeSection title="Classes" headers={['Cód. Classe', 'Descrição']} />
          <AttributeSection title="Variáveis Quantitativas" headers={['Descrição', 'Abreviação']} />
          <AttributeSection title="Variáveis Descritivas" headers={['Descrição']} />
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">
                    Fechar
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
