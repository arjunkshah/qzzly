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

interface LoginDialogProps {
  children?: React.ReactNode;
}

export function LoginDialog({ children }: LoginDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { signInWithGoogle, loading } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      toast({
        title: "Logging in with Google...",
        description: "You will be redirected shortly",
      });
    } else {
      toast({
        title: "Google login failed",
        description: result.error || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="outline">Log in</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Log in to Qzzly</DialogTitle>
          <DialogDescription>
            Log in with Google to access your account. Email/password login is not supported.
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
