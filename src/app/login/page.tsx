'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { EqualizeLogo } from '@/components/icons';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="size-4">
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.32 1.84-3.6 0-6.5-2.95-6.5-6.5s2.9-6.5 6.5-6.5c1.95 0 3.35.73 4.1 1.5l2.43-2.42C19.2 3.46 16.2.92 12.48.92c-5.17 0-9.4 4.15-9.4 9.25s4.23 9.25 9.4 9.25c2.82 0 4.95-.94 6.62-2.62 1.83-1.83 2.25-4.32 2.25-6.2v-1.1H12.48z" />
    </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
          variant: 'destructive',
          title: 'Missing Fields',
          description: 'Please enter both email and password.',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (error: any) {
      const title = isSignUp ? 'Sign Up Failed' : 'Sign In Failed';
      let description = "An unexpected error occurred. Please try again.";

      switch (error.code) {
        case 'auth/email-already-in-use':
          description = 'This email is already registered. Please sign in or use a different email.';
          break;
        case 'auth/weak-password':
          description = 'The password is too weak. It must be at least 6 characters long.';
          break;
        case 'auth/invalid-email':
          description = 'The email address is not valid. Please enter a valid email.';
          break;
        case 'auth/invalid-credential':
          description = 'Invalid email or password. Please check your credentials and try again.';
          break;
        default:
          description = error.message;
      }
      toast({ variant: 'destructive', title, description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
                <EqualizeLogo className="size-8 text-primary" />
                <CardTitle className="font-headline text-3xl">Equalize</CardTitle>
            </div>
          <CardDescription>
            {isSignUp ? 'Create an account to start splitting expenses.' : 'Sign in to your account.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuthAction}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>
             <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex-col gap-4 pt-4">
            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                </span>
                </div>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={isLoading}>
                <GoogleIcon />
                {isLoading ? 'Redirecting...' : 'Google'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
                {isSignUp ? (
                    <>
                    Already have an account?{' '}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setIsSignUp(false)} disabled={isLoading}>
                        Sign In
                    </Button>
                    </>
                ) : (
                    <>
                    Don&apos;t have an account?{' '}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setIsSignUp(true)} disabled={isLoading}>
                        Sign Up
                    </Button>
                    </>
                )}
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
