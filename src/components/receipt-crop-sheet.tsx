'use client';

import React from 'react';
import ReactCrop, { type Crop, type PixelCrop as RICPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReceiptCropSheetProps {
  open: boolean;
  imageDataUri: string | null;
  onCancel: () => void;
  onConfirm: (croppedDataUri: string) => void;
}

function CropBody({
  imageDataUri,
  onCancel,
  onConfirm,
}: Omit<ReceiptCropSheetProps, 'open'>) {
  const [crop, setCrop] = React.useState<Crop>({
    unit: '%',
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  });
  const [completedCrop, setCompletedCrop] = React.useState<RICPixelCrop | undefined>();
  const imgRef = React.useRef<HTMLImageElement>(null);

  const handleConfirmCrop = async () => {
    if (!imageDataUri) return;
    if (completedCrop?.width && completedCrop.height && imgRef.current) {
      const img = imgRef.current;
      // displayed-pixel crop → natural-pixel crop (canvas operates on natural resolution)
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const naturalCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };
      const { getCroppedImg } = await import('@/lib/crop');
      const result = await getCroppedImg(imageDataUri, naturalCrop);
      onConfirm(result);
    } else {
      onConfirm(imageDataUri);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-center overflow-auto rounded-md border border-dashed border-border bg-muted/30 p-2">
        {imageDataUri && (
          <ReactCrop
            crop={crop}
            onChange={(_, percent) => setCrop(percent)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageDataUri}
              alt="receipt"
              style={{ maxHeight: '60vh', width: 'auto' }}
            />
          </ReactCrop>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          className="h-11 w-full bg-accent font-code text-[0.65rem] uppercase tracking-[0.15em] text-accent-foreground hover:bg-accent/90"
          onClick={handleConfirmCrop}
        >
          Use photo
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full border-dashed font-code text-[0.65rem] uppercase tracking-[0.15em]"
          onClick={() => imageDataUri && onConfirm(imageDataUri)}
        >
          Use full image
        </Button>
        <Button
          variant="ghost"
          className="h-11 w-full font-code text-[0.65rem] uppercase tracking-[0.15em]"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function ReceiptCropSheet({ open, imageDataUri, onCancel, onConfirm }: ReceiptCropSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
        <SheetContent side="bottom" className="h-[88svh] flex flex-col rounded-t-lg">
          <SheetHeader className="mb-2 shrink-0">
            <SheetTitle className="sr-only">Crop receipt</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <CropBody imageDataUri={imageDataUri} onCancel={onCancel} onConfirm={onConfirm} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Crop receipt</DialogTitle>
        </DialogHeader>
        <CropBody imageDataUri={imageDataUri} onCancel={onCancel} onConfirm={onConfirm} />
      </DialogContent>
    </Dialog>
  );
}
