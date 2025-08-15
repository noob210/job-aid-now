-- Create pending_users table for verification workflow
CREATE TABLE public.pending_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('worker', 'client')),
  phone TEXT,
  front_face_url TEXT,
  left_side_url TEXT,
  right_side_url TEXT,
  id_document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Create policies for pending_users
CREATE POLICY "Users can insert their own pending application" 
ON public.pending_users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own pending application" 
ON public.pending_users 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can view all pending applications" 
ON public.pending_users 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND user_type = 'admin'));

CREATE POLICY "Admins can update pending applications" 
ON public.pending_users 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND user_type = 'admin'));

-- Create storage buckets for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('face-verification', 'face-verification', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('id-documents', 'id-documents', false);

-- Create storage policies for face verification
CREATE POLICY "Users can upload face verification photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'face-verification');

CREATE POLICY "Users can view their own face verification photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'face-verification');

CREATE POLICY "Admins can view all face verification photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'face-verification' AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND user_type = 'admin'));

-- Create storage policies for ID documents
CREATE POLICY "Users can upload ID documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'id-documents');

CREATE POLICY "Users can view their own ID documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'id-documents');

CREATE POLICY "Admins can view all ID documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'id-documents' AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND user_type = 'admin'));

-- Add admin user type to profiles table user_type check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('worker', 'client', 'admin'));

-- Create trigger for pending_users updated_at
CREATE TRIGGER update_pending_users_updated_at
BEFORE UPDATE ON public.pending_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();