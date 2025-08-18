-- Update pending_users table to use face video instead of separate photos
ALTER TABLE public.pending_users 
DROP COLUMN IF EXISTS front_face_url,
DROP COLUMN IF EXISTS left_side_url,
DROP COLUMN IF EXISTS right_side_url,
ADD COLUMN IF NOT EXISTS face_video_url TEXT;