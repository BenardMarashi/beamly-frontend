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
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob as Blob);
    }, 'image/jpeg', 0.95);
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

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onCropCompleteHandler = useCallback((_: any, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setLoading(false);
    }
  };

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
                maxValue={3}
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