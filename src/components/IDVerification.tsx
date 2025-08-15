import React, { useRef } from 'react';
import { Upload, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface IDVerificationProps {
  onIDChange: (file: File | null) => void;
  idDocument: File | null;
}

const IDVerification = ({ onIDChange, idDocument }: IDVerificationProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onIDChange(file || null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">ID Verification</h3>
        <p className="text-sm text-muted-foreground">
          Upload a clear photo of your government-issued ID
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Valid ID Document</CardTitle>
          <CardDescription className="text-xs">
            Driver's license, passport, or national ID card
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="aspect-[3/2] bg-muted rounded-lg flex items-center justify-center mb-3 overflow-hidden">
            {idDocument ? (
              <div className="relative w-full h-full">
                <img
                  src={URL.createObjectURL(idDocument)}
                  alt="ID Document"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 bg-white rounded-full" />
                </div>
              </div>
            ) : (
              <FileText className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleUploadClick}
          >
            <Upload className="w-4 h-4 mr-2" />
            {idDocument ? 'Replace Document' : 'Upload ID'}
          </Button>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Ensure all text is clearly visible</p>
        <p>• Photo should be well-lit and in focus</p>
        <p>• Accepted formats: JPG, PNG, PDF</p>
      </div>
    </div>
  );
};

export default IDVerification;