import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

interface SignupDialogProps {
  children?: React.ReactNode;
  redirectPath?: string;
}

export function SignupDialog({ children }: SignupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { signInWithGoogle, loading } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      toast({
        title: "Signing up with Google...",
        description: "You will be redirected shortly",
      });
    } else {
      toast({
        title: "Google sign-up failed",
        description: result.error || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || <Button>Sign up</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create your account</DialogTitle>
          <DialogDescription>
            Sign up with Google to start using Qzzly. Email/password sign up is not supported.
          </DialogDescription>
        </DialogHeader>
        <Button 
          type="button" 
          variant="outline" 
          className="w-full mt-2" 
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}
