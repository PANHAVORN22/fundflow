-- Update the Magic Link email template to send OTP instead
-- This needs to be done in Supabase Dashboard under Authentication > Email Templates
-- But we can prepare the database for OTP flow

-- The email template should be changed to:
-- Subject: Your Fundflow verification code
-- Body: 
-- <h2>Welcome to Fundflow!</h2>
-- <p>Your verification code is: <strong>{{ .Token }}</strong></p>
-- <p>Enter this code in the app to complete your registration.</p>
-- <p>This code will expire in 1 hour.</p>

-- Ensure our existing tables and functions work with OTP flow
-- (No changes needed to existing schema for OTP)
