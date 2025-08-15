import React, { useRef, useState } from 'react';
import { Camera, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FaceVerificationProps {
  onPhotosChange: (photos: { front: File | null; left: File | null; right: File | null }) => void;
  photos: { front: File | null; left: File | null; right: File | null };
}

const FaceVerification = ({ onPhotosChange, photos }: FaceVerificationProps) => {
  const [activePhoto, setActivePhoto] = useState<'front' | 'left' | 'right' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (type: 'front' | 'left' | 'right') => {
    setActivePhoto(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'user';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && activePhoto) {
      onPhotosChange({
        ...photos,
        [activePhoto]: file
      });
    }
    setActivePhoto(null);
  };

  const PhotoCard = ({ type, title, description }: { type: 'front' | 'left' | 'right'; title: string; description: string }) => (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden">
          {photos[type] ? (
            <div className="relative w-full h-full">
              <img
                src={URL.createObjectURL(photos[type]!)}
                alt={`${type} face photo`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 bg-white rounded-full" />
              </div>
            </div>
          ) : (
            <Camera className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handlePhotoCapture(type)}
        >
          <Upload className="w-4 h-4 mr-2" />
          {photos[type] ? 'Retake' : 'Capture'}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Face Verification</h3>
        <p className="text-sm text-muted-foreground">
          Please take 3 photos of your face for verification
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <PhotoCard
          type="front"
          title="Front Face"
          description="Look directly at camera"
        />
        <PhotoCard
          type="left"
          title="Left Side"
          description="Turn head left"
        />
        <PhotoCard
          type="right"
          title="Right Side"
          description="Turn head right"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default FaceVerification;