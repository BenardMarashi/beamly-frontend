// src/components/ImageCropper.tsx
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Slider } from '@nextui-org/react';
import { Icon } from '@iconify/react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
}

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// iPad detection utility
const isIPad = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * FIXED: Corrected cropping function
 * The previous version used putImageData incorrectly, causing the cropped image
 * to be dislocated to the corner. This version uses drawImage properly.
 */
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: CroppedArea,
  rotation = 0
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // iPad-specific optimizations
  const isIPadDevice = isIPad();
  const MAX_OUTPUT_SIZE = isIPadDevice ? 1024 : 2048;
  const JPEG_QUALITY = isIPadDevice ? 0.8 : 0.92;

  // Calculate the bounding box of the rotated image
  const rotRad = (rotation * Math.PI) / 180;
  const bBoxWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

  // Set canvas size to the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Fill with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Translate to center, rotate, then translate back
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw the image
  ctx.drawImage(image, 0, 0);

  // Now extract the cropped area
  // The pixelCrop coordinates are relative to the rotated image's bounding box
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Failed to create cropped context');
  }

  // Limit output size for memory efficiency
  const outputWidth = Math.min(pixelCrop.width, MAX_OUTPUT_SIZE);
  const outputHeight = Math.min(pixelCrop.height, MAX_OUTPUT_SIZE);
  
  croppedCanvas.width = outputWidth;
  croppedCanvas.height = outputHeight;

  // Fill with white background
  croppedCtx.fillStyle = 'white';
  croppedCtx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);

  // FIXED: Use drawImage to extract the cropped region correctly
  // This is the key fix - we draw from the rotated canvas to the output canvas
  // using the crop coordinates as the source rectangle
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,           // source x - where to start clipping
    pixelCrop.y,           // source y - where to start clipping
    pixelCrop.width,       // source width - width of the clipped image
    pixelCrop.height,      // source height - height of the clipped image
    0,                     // destination x - where to place on output canvas
    0,                     // destination y - where to place on output canvas
    outputWidth,           // destination width - scale to fit
    outputHeight           // destination height - scale to fit
  );

  // Clean up the intermediate canvas
  canvas.width = 0;
  canvas.height = 0;

  // Convert to blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        // Clean up
        croppedCanvas.width = 0;
        croppedCanvas.height = 0;

        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
};

export const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onCropCompleteHandler = useCallback((_: any, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setLoading(true);
    setError(null);
    
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
      onClose();
    } catch (error: any) {
      console.error('Error cropping image:', error);
      setError(error.message || 'Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal opens
  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError(null);
    onClose();
  };

  // Limit zoom for iPad
  const maxZoom = isIPad() ? 2 : 3;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="3xl"
      classNames={{
        base: "bg-background/95 backdrop-blur-md",
        header: "border-b border-divider",
        body: "py-6",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Crop Profile Photo</h3>
          <p className="text-sm text-default-500">Adjust your photo to fit perfectly</p>
        </ModalHeader>
        <ModalBody>
          {error && (
            <div className="mb-4 p-3 bg-danger-50 text-danger rounded-lg">
              {error}
            </div>
          )}
          
          <div className="relative h-[400px] w-full bg-default-100 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteHandler}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              cropShape="round"
              showGrid={false}
              maxZoom={maxZoom}
            />
          </div>
          
          <div className="space-y-4 mt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Zoom</label>
                <span className="text-sm text-default-500">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                size="sm"
                step={0.01}
                minValue={1}
                maxValue={maxZoom}
                value={zoom}
                onChange={(value) => setZoom(value as number)}
                classNames={{
                  base: "max-w-full",
                  track: "bg-default-200",
                  filler: "bg-primary",
                }}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Rotation</label>
                <span className="text-sm text-default-500">{rotation}°</span>
              </div>
              <Slider
                size="sm"
                step={1}
                minValue={0}
                maxValue={360}
                value={rotation}
                onChange={(value) => setRotation(value as number)}
                classNames={{
                  base: "max-w-full",
                  track: "bg-default-200",
                  filler: "bg-primary",
                }}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="danger" 
            variant="light" 
            onPress={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSave}
            isLoading={loading}
            disabled={loading || !!error}
            startContent={!loading && <Icon icon="lucide:check" />}
          >
            {loading ? 'Processing...' : 'Save Photo'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImageCropper;