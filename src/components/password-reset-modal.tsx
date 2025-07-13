import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { useTheme } from "../contexts/theme-context";

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      toast.success('Password reset email sent!');
      
      // Keep modal open to show success message
      setTimeout(() => {
        onClose();
        setEmail("");
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    onClose();
    setEmail("");
    setSuccess(false);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Reset Password
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter your email to receive reset instructions
            </p>
          </ModalHeader>
          
          <ModalBody>
            {!success ? (
              <div className="space-y-4">
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onValueChange={setEmail}
                  variant="bordered"
                  startContent={<Icon icon="lucide:mail" className="text-gray-400" />}
                  className={isDarkMode ? "bg-white/10" : ""}
                  isRequired
                />
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="lucide:check" className="text-green-500 text-2xl" />
                </div>
                <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Email Sent!
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Check your inbox for password reset instructions
                </p>
              </div>
            )}
          </ModalBody>
          
          <ModalFooter>
            {!success ? (
              <>
                <Button variant="light" onPress={handleClose}>
                  Cancel
                </Button>
                <Button
                  color="secondary"
                  type="submit"
                  isLoading={loading}
                  disabled={loading}
                >
                  Send Reset Email
                </Button>
              </>
            ) : (
              <Button color="secondary" onPress={handleClose}>
                Close
              </Button>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

// Export a hook to use password reset functionality
export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const sendResetEmail = async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      return true;
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errorMessage = 'Failed to send reset email';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return { sendResetEmail, loading, error, success };
};