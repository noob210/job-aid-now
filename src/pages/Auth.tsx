import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Briefcase, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import FaceVerification from '@/components/FaceVerification';
import IDVerification from '@/components/IDVerification';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);
  const { signIn } = useAuth();
  const { uploadFile, uploading } = useFileUpload();
  const navigate = useNavigate();

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: '',
    phone: ''
  });

  const [faceVideo, setFaceVideo] = useState<File | null>(null);

  const [idDocument, setIdDocument] = useState<File | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (!error) {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignUpSubmit = async () => {
    if (!faceVideo || !idDocument) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate unique identifier for this application
      const applicationId = crypto.randomUUID();
      
      // Upload face verification video and ID document
      const faceVideoUrl = await uploadFile(faceVideo, 'face-verification', `${applicationId}/face-video`);
      const idUrl = await uploadFile(idDocument, 'id-documents', `${applicationId}/id`);
      
      if (!faceVideoUrl || !idUrl) {
        throw new Error('Failed to upload verification documents');
      }
      
      // Create pending user application
      const { error } = await supabase
        .from('pending_users')
        .insert({
          email: signUpData.email,
          password_hash: signUpData.password, // In production, this should be hashed
          first_name: signUpData.firstName,
          last_name: signUpData.lastName,
          user_type: signUpData.userType,
          phone: signUpData.phone,
          face_video_url: faceVideoUrl,
          id_document_url: idUrl
        });
        
      if (error) {
        throw error;
      }
      
      // Show success message and redirect
      navigate('/', { 
        state: { 
          message: 'Application submitted successfully! Please wait for admin approval.' 
        }
      });
      
    } catch (error: any) {
      console.error('Error submitting application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (signUpStep === 1 && signUpData.password !== signUpData.confirmPassword) {
      return;
    }
    setSignUpStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setSignUpStep(prev => Math.max(prev - 1, 1));
  };

  const isStep1Valid = signUpData.email && signUpData.password && 
                     signUpData.confirmPassword && signUpData.firstName && 
                     signUpData.lastName && signUpData.userType &&
                     signUpData.password === signUpData.confirmPassword;

  const isStep2Valid = faceVideo;
  const isStep3Valid = idDocument;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center mb-4 shadow-mobile">
            <Briefcase className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            JobAid Now
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect workers with opportunities
          </p>
        </div>

        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <div className="space-y-6">
                  {/* Step Indicator */}
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          signUpStep >= step 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {step}
                        </div>
                        {step < 3 && (
                          <div className={`w-8 h-0.5 mx-2 ${
                            signUpStep > step ? 'bg-primary' : 'bg-muted'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Basic Information */}
                  {signUpStep === 1 && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold">Basic Information</h3>
                        <p className="text-sm text-muted-foreground">Let's start with your details</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-firstname">First Name</Label>
                          <Input
                            id="signup-firstname"
                            placeholder="First name"
                            value={signUpData.firstName}
                            onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                            required
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-lastname">Last Name</Label>
                          <Input
                            id="signup-lastname"
                            placeholder="Last name"
                            value={signUpData.lastName}
                            onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                            required
                            className="h-12"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-usertype">I am a...</Label>
                        <Select value={signUpData.userType} onValueChange={(value) => setSignUpData({ ...signUpData, userType: value })}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="worker">
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                Worker - Looking for jobs
                              </div>
                            </SelectItem>
                            <SelectItem value="client">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Client - Need work done
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          required
                          className="h-12"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Phone (Optional)</Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="Your phone number"
                          value={signUpData.phone}
                          onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          required
                          className="h-12"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirm Password</Label>
                        <Input
                          id="signup-confirm"
                          type="password"
                          placeholder="Confirm your password"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          required
                          className="h-12"
                        />
                      </div>
                      
                      <Button 
                        className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground font-medium"
                        disabled={!isStep1Valid}
                        onClick={nextStep}
                      >
                        Next: Face Verification
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Face Verification */}
                  {signUpStep === 2 && (
                    <div className="space-y-4">
                      <FaceVerification
                        video={faceVideo}
                        onVideoChange={setFaceVideo}
                      />
                      
                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          className="flex-1 h-12"
                          onClick={prevStep}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button 
                          className="flex-1 h-12 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground font-medium"
                          disabled={!isStep2Valid}
                          onClick={nextStep}
                        >
                          Next: ID Verification
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: ID Verification */}
                  {signUpStep === 3 && (
                    <div className="space-y-4">
                      <IDVerification
                        idDocument={idDocument}
                        onIDChange={setIdDocument}
                      />
                      
                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          className="flex-1 h-12"
                          onClick={prevStep}
                          disabled={isLoading}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                        <Button 
                          className="flex-1 h-12 bg-gradient-to-r from-accent to-warning hover:opacity-90 text-accent-foreground font-medium"
                          disabled={!isStep3Valid || isLoading || uploading}
                          onClick={handleSignUpSubmit}
                        >
                          {isLoading || uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Submit Application
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;