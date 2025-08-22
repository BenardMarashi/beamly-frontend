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

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: CroppedArea,
  rotation = 0
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', {
    // iPad optimization: Use lower memory options
    alpha: false,
    desynchronized: true,
    willReadFrequently: false
  });

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // iPad-specific memory optimization
  const isIPadDevice = isIPad();
  const MAX_CANVAS_SIZE = isIPadDevice ? 2048 : 4096; // Limit canvas size on iPad
  const JPEG_QUALITY = isIPadDevice ? 0.8 : 0.95; // Lower quality on iPad
  
  // Calculate safe canvas size
  const maxSize = Math.min(
    Math.max(image.width, image.height),
    MAX_CANVAS_SIZE
  );
  
  // Reduce safe area calculation for iPad
  const safeAreaMultiplier = isIPadDevice ? 1.5 : 2;
  const safeArea = Math.min(
    safeAreaMultiplier * ((maxSize / 2) * Math.sqrt(2)),
    MAX_CANVAS_SIZE
  );

  // Set canvas size with limits
  canvas.width = Math.min(safeArea, MAX_CANVAS_SIZE);
  canvas.height = Math.min(safeArea, MAX_CANVAS_SIZE);

  // Clear canvas first (helps with memory)
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // Draw image with proper scaling
  const drawWidth = Math.min(image.width, MAX_CANVAS_SIZE);
  const drawHeight = Math.min(image.height, MAX_CANVAS_SIZE);
  
  ctx.drawImage(
    image,
    (canvas.width - drawWidth) / 2,
    (canvas.height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
  
  ctx.restore();

  // Get image data with error handling
  let data;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (error) {
    console.error('Failed to get image data:', error);
    throw new Error('Image processing failed. Please try a smaller image.');
  }

  // Create output canvas with optimized size
  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d', {
    alpha: false,
    desynchronized: true
  });
  
  if (!outputCtx) {
    throw new Error('Failed to create output context');
  }

  // Limit output size for iPad
  const maxOutputSize = isIPadDevice ? 1024 : 2048;
  outputCanvas.width = Math.min(pixelCrop.width, maxOutputSize);
  outputCanvas.height = Math.min(pixelCrop.height, maxOutputSize);

  // Clear output canvas
  outputCtx.fillStyle = 'white';
  outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  // Draw cropped image
  outputCtx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Convert to blob with error handling and cleanup
  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        // Clean up canvases to free memory
        canvas.width = 0;
        canvas.height = 0;
        outputCanvas.width = 0;
        outputCanvas.height = 0;
        
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

  // Limit zoom for iPad
  const maxZoom = isIPad() ? 2 : 3;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
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
            onPress={onClose}
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