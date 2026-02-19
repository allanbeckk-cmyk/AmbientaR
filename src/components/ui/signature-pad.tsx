
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  onSignatureEnd: (signatureDataUrl: string) => void;
  initialDataUrl?: string | null;
}

export const SignaturePad = React.forwardRef<
  HTMLCanvasElement,
  SignaturePadProps
>(({ onSignatureEnd, initialDataUrl }, ref) => {
  const internalRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  // Combine refs if an external ref is provided
  React.useImperativeHandle(ref, () => internalRef.current as HTMLCanvasElement);

  const getCanvas = () => internalRef.current;
  const getContext = () => getCanvas()?.getContext('2d');

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = getCanvas();
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (event.nativeEvent instanceof MouseEvent) {
      return { x: event.nativeEvent.clientX - rect.left, y: event.nativeEvent.clientY - rect.top };
    }
    if (event.nativeEvent instanceof TouchEvent) {
      return { x: event.nativeEvent.touches[0].clientX - rect.left, y: event.nativeEvent.touches[0].clientY - rect.top };
    }
    return null;
  }

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in event.nativeEvent) {
      event.preventDefault(); // Impede o scroll no toque
    }
    const ctx = getContext();
    const coords = getCoordinates(event);
    if (ctx && coords) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    }
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
     if ('touches' in event.nativeEvent) {
      event.preventDefault(); // Impede o scroll no toque
    }
    const ctx = getContext();
    const coords = getCoordinates(event);
    if (ctx && coords) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    const canvas = getCanvas();
    if (isDrawing && canvas) {
      onSignatureEnd(canvas.toDataURL());
    }
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
      const canvas = getCanvas();
      const ctx = getContext();
      if(canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          onSignatureEnd('');
      }
  }

  React.useEffect(() => {
    const canvas = getCanvas();
    const ctx = getContext();
    if (canvas && ctx) {
      // Set canvas size based on its container
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      // Set drawing styles
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if(initialDataUrl) {
          const img = new Image();
          img.onload = () => {
              ctx.drawImage(img, 0, 0);
          }
          img.src = initialDataUrl;
      }
    }
  }, [initialDataUrl]);

  return (
    <div className="relative w-full h-48 border rounded-md bg-white">
      <canvas
        ref={internalRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full cursor-crosshair touch-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={clearCanvas}
      >
        <Eraser className="h-4 w-4" />
        <span className="sr-only">Limpar Assinatura</span>
      </Button>
    </div>
  );
});
SignaturePad.displayName = 'SignaturePad';
