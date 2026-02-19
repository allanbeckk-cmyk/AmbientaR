
'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CardFooter } from '@/components/ui/card';

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleSaveTheme = () => {
    toast({ title: 'Tema Salvo!', description: `Seu tema foi salvo como ${theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}.` });
  };

  return (
    <div className="space-y-8">
        <RadioGroup
            defaultValue={theme}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            onValueChange={setTheme}
        >
            <div>
                <RadioGroupItem value="light" id="light" className="sr-only" />
                <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    <div className="w-full bg-gray-200 rounded-md p-2">
                        <div className="h-2 w-4/5 rounded-sm bg-gray-400"></div>
                        <div className="h-2 w-full rounded-sm bg-gray-400 mt-2"></div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">Claro</span>
                </Label>
            </div>
            <div>
                <RadioGroupItem value="dark" id="dark" className="sr-only" />
                <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    <div className="w-full bg-gray-900 rounded-md p-2">
                        <div className="h-2 w-4/5 rounded-sm bg-gray-600"></div>
                        <div className="h-2 w-full rounded-sm bg-gray-600 mt-2"></div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">Escuro</span>
                </Label>
            </div>
            <div>
                <RadioGroupItem value="system" id="system" className="sr-only" />
                <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    <div className="w-full bg-gray-200 dark:bg-gray-900 rounded-md p-2">
                        <div className="h-2 w-4/5 rounded-sm bg-gray-400 dark:bg-gray-600"></div>
                        <div className="h-2 w-full rounded-sm bg-gray-400 dark:bg-gray-600 mt-2"></div>
                    </div>
                    <span className="block w-full p-2 text-center font-normal">Sistema</span>
                </Label>
            </div>
        </RadioGroup>
        <CardFooter className="p-0">
            <Button onClick={handleSaveTheme}>Salvar Tema</Button>
        </CardFooter>
    </div>
  );
}
