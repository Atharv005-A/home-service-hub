import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Mail, Phone, Loader2, ArrowLeft, User, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const phoneSchema = z.string()
  .min(10, 'Please enter a valid 10-digit phone number')
  .regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number (10 digits starting with 6-9)');

// Format phone number with India country code
const formatIndianPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  return `+91${cleaned}`;
};

type AuthMethod = 'email' | 'phone';
type AuthStep = 'input' | 'otp' | 'signup-details';
type UserRole = 'customer' | 'worker';

export default function Auth() {
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [step, setStep] = useState<AuthStep>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [signupData, setSignupData] = useState({
    name: '',
    phone: '',
  });

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirectBasedOnRole(session.user.id);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        redirectBasedOnRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const redirectBasedOnRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (roles && roles.length > 0) {
      const role = roles[0].role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'worker') navigate('/worker');
      else navigate('/customer');
    } else {
      navigate('/customer');
    }
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      if (authMethod === 'email') {
        const validation = emailSchema.safeParse(email);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        toast.success('Check your email for the verification code!');
        setStep('otp');
      } else {
        // Clean the phone number (remove any non-digits)
        const cleanedPhone = phone.replace(/\D/g, '');
        
        const validation = phoneSchema.safeParse(cleanedPhone);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        // Format with India country code
        const formattedPhone = formatIndianPhone(cleanedPhone);

        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: {
            shouldCreateUser: true,
          },
        });

        if (error) {
          if (error.message.includes('phone provider') || error.message.includes('Unsupported')) {
            toast.error('Phone SMS is not enabled. Please use email for now or contact support.');
          } else {
            throw error;
          }
          setIsLoading(false);
          return;
        }
        
        // Store formatted phone for verification
        setPhone(formattedPhone);
        toast.success('Check your phone for the verification code!');
        setStep('otp');
      }
    } catch (error: any) {
      console.error('OTP send error:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const verifyOptions = authMethod === 'email' 
        ? { email, token: otp, type: 'email' as const }
        : { phone, token: otp, type: 'sms' as const };

      const { data, error } = await supabase.auth.verifyOtp(verifyOptions);

      if (error) throw error;

      if (data.user) {
        // Check if user has a profile (existing user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!profile) {
          // New user - show signup details
          setIsNewUser(true);
          setStep('signup-details');
        } else {
          toast.success('Welcome back!');
          // Redirect will happen via onAuthStateChange
        }
      }
    } catch (error: any) {
      console.error('OTP verify error:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!signupData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update user metadata with role
      await supabase.auth.updateUser({
        data: {
          name: signupData.name,
          role: selectedRole,
          phone: signupData.phone || phone,
        }
      });

      // The handle_new_user trigger should create the profile and role
      // But let's also manually insert to be safe
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: signupData.name,
          email: user.email || '',
          phone: signupData.phone || phone,
        }, { onConflict: 'user_id' });

      if (profileError) console.error('Profile error:', profileError);

      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: selectedRole,
        }, { onConflict: 'user_id' });

      if (roleError) console.error('Role error:', roleError);

      // If worker, create worker profile
      if (selectedRole === 'worker') {
        const { error: workerError } = await supabase
          .from('worker_profiles')
          .upsert({
            user_id: user.id,
            specializations: [],
          }, { onConflict: 'user_id' });

        if (workerError) console.error('Worker profile error:', workerError);
      }

      toast.success('Account created successfully!');
      
      // Redirect based on role
      if (selectedRole === 'worker') {
        navigate('/worker');
      } else {
        navigate('/customer');
      }
    } catch (error: any) {
      console.error('Signup complete error:', error);
      toast.error(error.message || 'Failed to complete signup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('input');
      setOtp('');
    } else if (step === 'signup-details') {
      setStep('otp');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                <Home className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                Home<span className="text-accent">Fix</span>
              </span>
            </Link>
            
            {step === 'input' && (
              <>
                <h1 className="font-display text-3xl font-bold text-foreground">Welcome</h1>
                <p className="text-muted-foreground mt-2">Sign in or create an account</p>
              </>
            )}
            
            {step === 'otp' && (
              <>
                <h1 className="font-display text-3xl font-bold text-foreground">Verify Code</h1>
                <p className="text-muted-foreground mt-2">
                  Enter the 6-digit code sent to {authMethod === 'email' ? email : phone}
                </p>
              </>
            )}
            
            {step === 'signup-details' && (
              <>
                <h1 className="font-display text-3xl font-bold text-foreground">Complete Profile</h1>
                <p className="text-muted-foreground mt-2">Tell us a bit about yourself</p>
              </>
            )}
          </div>

          {step === 'input' && (
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as AuthMethod)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                </div>

                <Button onClick={handleSendOtp} className="w-full" size="lg" disabled={isLoading || !email}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Continue with Email'
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="phone" className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number (India)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => {
                        // Only allow digits, max 10
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(value);
                      }}
                      className="pl-12"
                      maxLength={10}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Enter 10-digit mobile number (e.g., 9876543210)</p>
                </div>

                <Button onClick={handleSendOtp} className="w-full" size="lg" disabled={isLoading || phone.length !== 10}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Continue with Phone'
                  )}
                </Button>
                
                <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                  Note: SMS OTP requires backend configuration. Use email if phone doesn't work.
                </p>
              </TabsContent>
            </Tabs>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <Button variant="ghost" onClick={handleBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <div className="flex justify-center">
                <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button onClick={handleVerifyOtp} className="w-full" size="lg" disabled={isLoading || otp.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the code?{' '}
                <button
                  onClick={handleSendOtp}
                  className="text-primary font-medium hover:underline"
                  disabled={isLoading}
                >
                  Resend
                </button>
              </p>
            </div>
          )}

          {step === 'signup-details' && (
            <div className="space-y-6">
              <Button variant="ghost" onClick={handleBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>I want to</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={selectedRole === 'customer' ? 'default' : 'outline'}
                      className="h-auto py-4 flex flex-col gap-2"
                      onClick={() => setSelectedRole('customer')}
                    >
                      <User className="h-6 w-6" />
                      <span>Book Services</span>
                    </Button>
                    <Button
                      type="button"
                      variant={selectedRole === 'worker' ? 'default' : 'outline'}
                      className="h-auto py-4 flex flex-col gap-2"
                      onClick={() => setSelectedRole('worker')}
                    >
                      <Briefcase className="h-6 w-6" />
                      <span>Offer Services</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  />
                </div>

                {authMethod === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number (optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleCompleteSignup} className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Signup'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mb-8">
            {authMethod === 'email' ? (
              <Mail className="h-24 w-24 mx-auto text-accent" />
            ) : (
              <Phone className="h-24 w-24 mx-auto text-accent" />
            )}
          </div>
          <h2 className="font-display text-3xl font-bold mb-4">
            {step === 'input' && 'Quick & Secure Login'}
            {step === 'otp' && 'One-Time Password'}
            {step === 'signup-details' && 'Almost There!'}
          </h2>
          <p className="text-primary-foreground/80">
            {step === 'input' && 'No password needed. We\'ll send you a verification code to sign in securely.'}
            {step === 'otp' && 'Enter the 6-digit code we sent you to verify your identity.'}
            {step === 'signup-details' && 'Just a few more details and you\'ll be ready to go!'}
          </p>
        </div>
      </div>
    </div>
  );
}
