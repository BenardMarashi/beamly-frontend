import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Chip
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { ProposalService } from "../services/firebase-services";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme-context";

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    clientId: string;
    clientName: string;
    budgetMin: number;
    budgetMax: number;
    budgetType: string;
  };
  onSuccess?: () => void;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  job,
  onSuccess
}) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    coverLetter: "",
    proposedRate: "",
    estimatedDuration: "",
    attachments: [] as File[]
  });
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const validateForm = () => {
    if (!formData.coverLetter.trim()) {
      return "Please write a cover letter";
    }
    if (!formData.proposedRate || parseFloat(formData.proposedRate) <= 0) {
      return "Please enter a valid rate";
    }
    if (!formData.estimatedDuration.trim()) {
      return "Please provide an estimated duration";
    }
    
    const rate = parseFloat(formData.proposedRate);
    if (job.budgetType === "fixed") {
      if (rate > job.budgetMax * 1.5) {
        return "Your proposed rate is significantly higher than the budget";
      }
    } else {
      if (rate > job.budgetMax * 1.5) {
        return "Your hourly rate is significantly higher than the budget";
      }
    }
    
    return null;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (!user) {
      setError("You must be logged in to apply");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const proposalData = {
        jobId: job.id,
        jobTitle: job.title,
        clientId: job.clientId,
        clientName: job.clientName,
        freelancerId: user.uid,
        freelancerName: user.displayName || "Anonymous",
        freelancerPhotoURL: user.photoURL || "",
        coverLetter: formData.coverLetter,
        proposedRate: parseFloat(formData.proposedRate),
        estimatedDuration: formData.estimatedDuration,
        budgetType: job.budgetType,
        status: "pending"
      };
      
      const result = await ProposalService.submitProposal(proposalData);
      
      if (result.success) {
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          coverLetter: "",
          proposedRate: "",
          estimatedDuration: "",
          attachments: []
        });
      } else {
        setError("Failed to submit application. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("An error occurred while submitting your application.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Apply for Job
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {job.title}
            </p>
          </ModalHeader>
          
          <ModalBody>
            <div className="space-y-4">
              {/* Budget Info */}
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Client's Budget:
                  </span>
                  <Chip color="secondary" variant="flat">
                    {job.budgetType === "fixed" 
                      ? `$${job.budgetMin}`
                      : `$${job.budgetMin} - $${job.budgetMax}/hr`
                    }
                  </Chip>
                </div>
              </div>
              
              {/* Cover Letter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Cover Letter *
                </label>
                <Textarea
                  placeholder="Explain why you're the best fit for this job..."
                  value={formData.coverLetter}
                  onValueChange={(value) => handleInputChange("coverLetter", value)}
                  variant="bordered"
                  minRows={8}
                  className={isDarkMode ? "bg-white/10" : ""}
                  isRequired
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tip: Mention relevant experience, approach to the project, and why you're interested
                </p>
              </div>
              
              {/* Proposed Rate */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Proposed {job.budgetType === "fixed" ? "Total Price" : "Hourly Rate"} *
                </label>
                <Input
                  type="number"
                  placeholder={job.budgetType === "fixed" ? "Enter total price" : "Enter hourly rate"}
                  value={formData.proposedRate}
                  onValueChange={(value) => handleInputChange("proposedRate", value)}
                  variant="bordered"
                  startContent="$"
                  className={isDarkMode ? "bg-white/10" : ""}
                  isRequired
                />
              </div>
              
              {/* Estimated Duration */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Estimated Duration *
                </label>
                <Input
                  placeholder="e.g., 2 weeks, 1 month"
                  value={formData.estimatedDuration}
                  onValueChange={(value) => handleInputChange("estimatedDuration", value)}
                  variant="bordered"
                  className={isDarkMode ? "bg-white/10" : ""}
                  isRequired
                />
              </div>
              
              {/* Attachments */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Attachments (Optional)
                </label>
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                  isDarkMode ? 'border-white/20' : 'border-gray-300'
                }`}>
                  <Icon icon="lucide:upload" className="mx-auto text-3xl mb-2 text-gray-400" />
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Drag and drop files or click to browse
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    PDF, DOC, DOCX up to 10MB
                  </p>
                </div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <Icon icon="lucide:alert-circle" />
                    {error}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onClose}
              isDisabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="secondary"
              className="text-beamly-third"
              isLoading={loading}
              isDisabled={loading}
            >
              Submit Application
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};