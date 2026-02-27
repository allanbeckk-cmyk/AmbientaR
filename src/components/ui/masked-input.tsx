
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { maskCpf, maskCnpj, maskCpfCnpj, maskPhone } from '@/lib/masks';

type MaskType = 'cpf' | 'cnpj' | 'cpfCnpj' | 'phone';

const maskFunctions: Record<MaskType, (v: string) => string> = {
  cpf: maskCpf,
  cnpj: maskCnpj,
  cpfCnpj: maskCpfCnpj,
  phone: maskPhone,
};

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value = '', onChange, onBlur, ...props }, ref) => {
    const applyMask = maskFunctions[mask];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyMask(e.target.value);
      onChange?.(masked);
    };

    return (
      <Input
        ref={ref}
        value={applyMask(value)}
        onChange={handleChange}
        onBlur={onBlur}
        {...props}
      />
    );
  }
);
MaskedInput.displayName = 'MaskedInput';
