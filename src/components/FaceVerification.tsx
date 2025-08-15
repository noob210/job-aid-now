import React, { useRef, useState, useEffect } from 'react';
import { Video, Square, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FaceVerificationProps {
  onVideoChange: (video: File | null) => void;
  video: File | null;
}

type VerificationStep = 'front' | 'left' | 'right' | 'complete';

const FaceVerification = ({ onVideoChange, video }: FaceVerificationProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentStep, setCurrentStep] = useState<VerificationStep>('front');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stepProgress, setStepProgress] = useState(0);
  const [stepTimer, setStepTimer] = useState<NodeJS.Timeout | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const steps = [
    { key: 'front' as const, title: 'Face Forward', description: 'Look directly at the camera', duration: 3000 },
    { key: 'left' as const, title: 'Turn Left', description: 'Turn your head to the left', duration: 3000 },
    { key: 'right' as const, title: 'Turn Right', description: 'Turn your head to the right', duration: 3000 },
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.key === currentStep);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (stepTimer) {
        clearTimeout(stepTimer);
      }
    };
  }, [stream, stepTimer]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const startRecording = async () => {
    if (!stream) return;

    setIsRecording(true);
    setCurrentStep('front');
    setRecordedChunks([]);
    setStepProgress(0);

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const file = new File([blob], 'face-verification.webm', { type: 'video/webm' });
      onVideoChange(file);
      setCurrentStep('complete');
    };

    setMediaRecorder(recorder);
    recorder.start();

    // Start step progression
    progressThroughSteps();
  };

  const progressThroughSteps = () => {
    let stepIndex = 0;
    let progress = 0;

    const stepInterval = setInterval(() => {
      progress += 100 / 30; // 100% over 3 seconds (30 updates)
      setStepProgress(progress);

      if (progress >= 100) {
        progress = 0;
        stepIndex++;
        
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex].key);
        } else {
          clearInterval(stepInterval);
          stopRecording();
        }
      }
    }, 100);

    setStepTimer(stepInterval);
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    if (stepTimer) {
      clearTimeout(stepTimer);
    }
  };

  const retakeVideo = () => {
    setCurrentStep('front');
    setStepProgress(0);
    onVideoChange(null);
    setRecordedChunks([]);
  };

  const getStepInstruction = () => {
    const step = steps.find(s => s.key === currentStep);
    return step ? step.description : '';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Face Verification</h3>
        <p className="text-sm text-muted-foreground">
          Record a video following the face direction prompts for verification
        </p>
      </div>

      <Card className="mx-auto max-w-md">
        <CardContent className="p-6">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4 relative">
            {stream && !video ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {isRecording && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                    <div className="text-white text-center mb-4">
                      <h4 className="text-lg font-semibold">{steps.find(s => s.key === currentStep)?.title}</h4>
                      <p className="text-sm">{getStepInstruction()}</p>
                    </div>
                    <div className="w-3/4 mb-2">
                      <Progress value={stepProgress} className="bg-white/20" />
                    </div>
                    <div className="text-white text-xs">
                      Step {getCurrentStepIndex() + 1} of {steps.length}
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
            {!stream && !video && (
              <Button onClick={startCamera} className="w-full">
                <Video className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            )}

            {stream && !isRecording && !video && (
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
              <Button onClick={retakeVideo} variant="outline" className="w-full">
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