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
import { usePasswordReset } from "../hooks/use-auth";
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
  const { sendResetEmail, loading, error, success } = usePasswordReset();
  const [email, setEmail] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }
    
    const result = await sendResetEmail(email);
    
    if (result) {
      // Keep modal open to show success message
      setTimeout(() => {
        onClose();
        setEmail("");
      }, 3000);
    }
  };
  
  const handleClose = () => {
    onClose();
    setEmail("");
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
                
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-500 text-sm flex items-center gap-2">
                      <Icon icon="lucide:alert-circle" />
                      {error}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="lucide:check" className="text-green-500 text-2xl" />
                </div>
                <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Email Sent!
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Check your inbox for password reset instructions.
                </p>
              </div>
            )}
          </ModalBody>
          
          <ModalFooter>
            {!success ? (
              <>
                <Button
                  variant="flat"
                  onPress={handleClose}
                  isDisabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="secondary"
                  className="text-beamly-third"
                  isLoading={loading}
                  isDisabled={loading || !email}
                >
                  Send Reset Email
                </Button>
              </>
            ) : (
              <Button
                color="secondary"
                className="text-beamly-third"
                onPress={handleClose}
              >
                Close
              </Button>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};