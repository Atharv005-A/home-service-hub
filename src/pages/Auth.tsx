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
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [step, setStep] = useState<AuthStep>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
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
        // Phone OTP via Twilio edge function
        const cleanedPhone = phone.replace(/\D/g, '');
        
        const validation = phoneSchema.safeParse(cleanedPhone);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        // Format with India country code
        const formatted = formatIndianPhone(cleanedPhone);
        setFormattedPhone(formatted);

        // Call our custom SMS OTP edge function
        const { data, error } = await supabase.functions.invoke('send-sms-otp', {
          body: { phone: formatted },
        });

        if (error) {
          console.error('SMS OTP error:', error);
          toast.error(error.message || 'Failed to send OTP');
          setIsLoading(false);
          return;
        }

        if (data?.error) {
          toast.error(data.error);
          setIsLoading(false);
          return;
        }

        toast.success('OTP sent to your phone!');
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
      if (authMethod === 'email') {
        // Email OTP verification via Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email',
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (!profile) {
            setIsNewUser(true);
            setStep('signup-details');
          } else {
            toast.success('Welcome back!');
          }
        }
      } else {
        // Phone OTP verification via our edge function
        const { data, error } = await supabase.functions.invoke('verify-sms-otp', {
          body: { 
            phone: formattedPhone,
            otp: otp,
          },
        });

        if (error) {
          console.error('Verify OTP error:', error);
          // Try to parse error response
          try {
            const errorData = await error.context?.json?.();
            if (errorData?.error) {
              toast.error(errorData.error);
            } else {
              toast.error('Failed to verify OTP. Please try again.');
            }
          } catch {
            toast.error('Failed to verify OTP. Please try again.');
          }
          setIsLoading(false);
          return;
        }

        if (data?.error) {
          toast.error(data.error);
          setIsLoading(false);
          return;
        }

        if (data?.success) {
          if (data.isNewUser) {
            setIsNewUser(true);
            setStep('signup-details');
          } else {
            // For existing users, we need to sign them in
            // The edge function should have created a session
            toast.success('Welcome back!');
            
            // Refresh the session to pick up the user
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              redirectBasedOnRole(session.user.id);
            } else {
              // Try to sign in with magic link if we got an access token
              if (data.accessToken) {
                await supabase.auth.verifyOtp({
                  token_hash: data.accessToken,
                  type: 'magiclink',
                });
              }
            }
          }
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
      
      // For phone auth, we might not have a user yet, so we create one
      let userId = user?.id;
      
      if (!userId && authMethod === 'phone') {
        // User was created by edge function, need to sign them in
        const { data, error } = await supabase.functions.invoke('verify-sms-otp', {
          body: { 
            phone: formattedPhone,
            otp: otp,
          },
        });
        
        if (data?.userId) {
          userId = data.userId;
        }
      }

      if (!userId) {
        throw new Error('No user found. Please try again.');
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          name: signupData.name,
          email: email || `phone_${formattedPhone.replace(/\+/g, "")}@servxpert.app`,
          phone: formattedPhone || signupData.phone,
        }, { onConflict: 'user_id' });

      if (profileError) console.error('Profile error:', profileError);

      // Set user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: selectedRole,
        }, { onConflict: 'user_id' });

      if (roleError) console.error('Role error:', roleError);

      // If worker, create worker profile
      if (selectedRole === 'worker') {
        const { error: workerError } = await supabase
          .from('worker_profiles')
          .upsert({
            user_id: userId,
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Home className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                Serv<span className="text-muted-foreground">Xpert</span>
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
                  Enter the 6-digit code sent to {authMethod === 'email' ? email : formattedPhone || phone}
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
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted">
                <TabsTrigger value="phone" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
              </TabsList>

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
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(value);
                      }}
                      className="pl-12 h-12 text-lg"
                      maxLength={10}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Enter 10-digit mobile number</p>
                </div>

                <Button 
                  onClick={handleSendOtp} 
                  className="w-full h-12 text-base" 
                  size="lg" 
                  disabled={isLoading || phone.length !== 10}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Get OTP'
                  )}
                </Button>
              </TabsContent>

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
                      className="pl-10 h-12 text-lg"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSendOtp} 
                  className="w-full h-12 text-base" 
                  size="lg" 
                  disabled={isLoading || !email}
                >
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
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                onClick={handleVerifyOtp} 
                className="w-full h-12 text-base" 
                size="lg" 
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the code?{' '}
                <button
                  onClick={handleSendOtp}
                  className="text-foreground font-medium hover:underline"
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
                    className="h-12"
                  />
                </div>

                {authMethod === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number (optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="9876543210"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className="pl-12 h-12"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCompleteSignup} 
                className="w-full h-12 text-base" 
                size="lg" 
                disabled={isLoading}
              >
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
            {authMethod === 'phone' ? (
              <Phone className="h-24 w-24 mx-auto opacity-80" />
            ) : (
              <Mail className="h-24 w-24 mx-auto opacity-80" />
            )}
          </div>
          <h2 className="font-display text-3xl font-bold mb-4">
            {step === 'input' && 'Quick & Secure Login'}
            {step === 'otp' && 'One-Time Password'}
            {step === 'signup-details' && 'Almost There!'}
          </h2>
          <p className="text-primary-foreground/70">
            {step === 'input' && 'No password needed. We\'ll send you a verification code to sign in securely.'}
            {step === 'otp' && 'Enter the 6-digit code we sent you to verify your identity.'}
            {step === 'signup-details' && 'Just a few more details and you\'ll be ready to go!'}
          </p>
        </div>
      </div>
    </div>
  );
}
