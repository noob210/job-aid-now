import React, { useEffect, useRef, useState } from 'react';
import { Video, Square, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FaceVerificationProps {
  onVideoChange: (video: File | null) => void;
  video: File | null;
}

type StepKey = 'front' | 'left' | 'right';

const steps: { key: StepKey; title: string; description: string; duration: number }[] = [
  { key: 'front', title: 'Face Forward', description: 'Look directly at the camera', duration: 3000 },
  { key: 'left', title: 'Turn Left', description: 'Turn your head to the left', duration: 3000 },
  { key: 'right', title: 'Turn Right', description: 'Turn your head to the right', duration: 3000 },
];

const FaceVerification = ({ onVideoChange, video }: FaceVerificationProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepKey>('front');
  const [progress, setProgress] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const progressIntervalRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start camera automatically so users can see themselves immediately
  useEffect(() => {
    const start = async () => {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        setStream(ms);
        if (videoRef.current) videoRef.current.srcObject = ms;
      } catch (e) {
        console.error('Camera access denied:', e);
      }
    };
    start();

    return () => {
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    if (!stream) return;

    setIsRecording(true);
    setChunks([]);
    setProgress(0);
    setCurrentStep('front');

    const preferredTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const mimeType = preferredTypes.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || 'video/webm';

    const mr = new MediaRecorder(stream, { mimeType });
    mr.ondataavailable = (e) => {
      if (e.data?.size > 0) setChunks((prev) => [...prev, e.data]);
    };
    mr.onstop = () => {
      if (chunks.length === 0) return;
      const blob = new Blob(chunks, { type: mimeType });
      const file = new File([blob], 'face-verification.webm', { type: mimeType });
      onVideoChange(file);
    };

    setMediaRecorder(mr);
    mr.start();
    runStep(0);
  };

  const runStep = (index: number) => {
    if (index >= steps.length) {
      stopRecording();
      return;
    }

    const step = steps[index];
    setCurrentStep(step.key);
    setProgress(0);

    const startAt = performance.now();
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = window.setInterval(() => {
      const pct = Math.min(100, ((performance.now() - startAt) / step.duration) * 100);
      setProgress(pct);
    }, 50);

    window.setTimeout(() => {
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      runStep(index + 1);
    }, step.duration);
  };

  const stopRecording = () => {
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    setIsRecording(false);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  };

  const retake = () => {
    onVideoChange(null);
    setProgress(0);
    setCurrentStep('front');
    setChunks([]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Face Verification</h3>
        <p className="text-sm text-muted-foreground">
          Record a short video while following the prompts (front, left, right)
        </p>
      </div>

      <Card className="mx-auto max-w-md">
        <CardContent className="p-6">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4 relative">
            {stream && !video ? (
              <>
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {isRecording && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                    <div className="text-white text-center mb-4">
                      <h4 className="text-lg font-semibold">
                        {steps.find((s) => s.key === currentStep)?.title}
                      </h4>
                      <p className="text-sm">
                        {steps.find((s) => s.key === currentStep)?.description}
                      </p>
                    </div>
                    <div className="w-3/4 mb-2">
                      <Progress value={progress} className="bg-white/20" />
                    </div>
                    <div className="text-white text-xs">
                      Step {steps.findIndex((s) => s.key === currentStep) + 1} of {steps.length}
                    </div>
                  </div>
                )}
              </>
            ) : video ? (
              <div className="w-full h-full flex items-center justify-center bg-green-50">
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-700">Video recorded successfully</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            {!isRecording && !video && (
              <Button onClick={startRecording} className="w-full">
                <Video className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button onClick={stopRecording} variant="destructive" className="w-full">
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}

            {video && (
              <Button onClick={retake} variant="outline" className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Video
              </Button>
            )}
          </div>

          {!video && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium">Instructions:</h4>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li>1. Face the camera directly for 3 seconds</li>
                <li>2. Turn your head to the left for 3 seconds</li>
                <li>3. Turn your head to the right for 3 seconds</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FaceVerification;
