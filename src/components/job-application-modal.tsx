import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Chip,
  Progress
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { ProposalService } from "../services/firebase-services";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/theme-context";
import { useTranslation } from "react-i18next";
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ImageCropper } from './ImageCropper';
import { httpsCallable } from 'firebase/functions';
import { fns } from '../lib/firebase';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    clientId: string;
    clientName?: string;
    budgetMin: number;
    budgetMax: number;
    budgetType: string;
  };
  onSuccess?: () => void;
}

interface AttachmentFile {
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  job,
  onSuccess
}) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [proposalLimit, setProposalLimit] = useState<{
    canSubmit: boolean;
    remaining: number;
    isPro: boolean;
    current?: number;
  }>({ canSubmit: true, remaining: 5, isPro: false });
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [formData, setFormData] = useState({
    coverLetter: "",
    proposedRate: "",
    estimatedDuration: ""
  });
  
  // Image cropper configuration
  const USE_IMAGE_CROPPER = false;
  
  // Debug effect
  useEffect(() => {
    console.log("ImageCropper state:", {
      showImageCropper,
      hasImage: !!imageToCrop,
      componentExists: typeof ImageCropper !== 'undefined',
      cropperEnabled: USE_IMAGE_CROPPER
    });
  }, [showImageCropper, imageToCrop]);
  
  // Debug attachments
  useEffect(() => {
    console.log("Current attachments:", attachments);
  }, [attachments]);
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const validateForm = () => {
    if (!formData.coverLetter.trim()) {
      return t('jobApplication.errors.coverLetterRequired');
    }
    if (!formData.proposedRate || parseFloat(formData.proposedRate) <= 0) {
      return t('jobApplication.errors.validRateRequired');
    }
    if (!formData.estimatedDuration.trim()) {
      return t('jobApplication.errors.durationRequired');
    }
    
    const rate = parseFloat(formData.proposedRate);
    if (job.budgetType === "fixed") {
      if (rate > job.budgetMax * 1.5) {
        return t('jobApplication.errors.rateToohigh');
      }
    } else {
      if (rate > job.budgetMax * 1.5) {
        return t('jobApplication.errors.hourlyRateTooHigh');
      }
    }
    
    return null;
  };
  
  // Check proposal limit when modal opens
  useEffect(() => {
    if (isOpen && user) {
      checkProposalLimit();
    }
  }, [isOpen, user]);

  const checkProposalLimit = async () => {
    if (!user) return;
    
    setCheckingLimit(true);
    try {
      const checkLimit = httpsCallable(fns, 'checkProposalLimit');
      const result = await checkLimit() as any;
      console.log('Proposal limit check:', result.data);
      setProposalLimit(result.data);
      
      // If user can't submit, show error immediately
      if (!result.data.canSubmit) {
        setError(t('jobApplication.errors.limitReached'));
      }
    } catch (error) {
      console.error('Error checking proposal limit:', error);
      // Don't block submission if check fails
      setProposalLimit({ canSubmit: true, remaining: -1, isPro: false });
    } finally {
      setCheckingLimit(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    console.log('Files selected:', files.length);
    const newAttachments: AttachmentFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Get file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      // Check file type
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!allowedTypes.includes(file.type) && (!fileExtension || !allowedExtensions.includes(fileExtension))) {
        toast.error(t('jobApplication.errors.unsupportedFileType', { fileName: file.name }));
        continue;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('jobApplication.errors.fileTooLarge', { fileName: file.name }));
        continue;
      }
      
      // If it's an image, show the cropper
      const isImage = file.type.startsWith('image/') || 
                     ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                     
      if (isImage) {
        console.log('Processing image file:', file.name);
        
        // For now, add images directly without cropping
        if (!USE_IMAGE_CROPPER) {
          newAttachments.push({
            file,
            name: file.name,
            size: file.size,
            type: file.type
          });
          toast.success(t('jobApplication.success.imageAdded', { fileName: file.name }));
          continue;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('Image loaded, preparing to show cropper');
          const result = e.target?.result as string;
          if (result) {
            setImageToCrop(result);
            setCurrentImageFile(file);
            setShowImageCropper(true);
            console.log('Cropper state set to show');
          } else {
            console.error('Failed to read image data');
            toast.error(t('jobApplication.errors.failedToReadImage'));
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          toast.error(t('jobApplication.errors.errorReadingImage'));
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, add directly
        newAttachments.push({
          file,
          name: file.name,
          size: file.size,
          type: file.type
        });
        toast.success(t('jobApplication.success.documentAdded', { fileName: file.name }));
      }
    }
    
    // Update attachments state once with all new files
    if (newAttachments.length > 0) {
      setAttachments(prev => {
        const updated = [...prev, ...newAttachments];
        console.log(`Added ${newAttachments.length} files, total attachments: ${updated.length}`);
        return updated;
      });
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    console.log(`Processed ${files.length} files`);
  };
  
  const removeAttachment = (index: number) => {
    const removedFile = attachments[index];
    setAttachments(prev => prev.filter((_, i) => i !== index));
    toast.success(t('jobApplication.success.fileRemoved', { fileName: removedFile.name }));
  };
  
  const handleImageCropped = async (croppedBlob: Blob) => {
    if (!currentImageFile) return;
    
    // Create a new file from the cropped blob
    const croppedFile = new File([croppedBlob], currentImageFile.name, {
      type: currentImageFile.type
    });
    
    setAttachments(prev => [...prev, {
      file: croppedFile,
      name: croppedFile.name,
      size: croppedFile.size,
      type: croppedFile.type
    }]);
    
    toast.success(t('jobApplication.success.imageCropped', { fileName: croppedFile.name }));
    
    setShowImageCropper(false);
    setImageToCrop(null);
    setCurrentImageFile(null);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a synthetic event for the file handler
      const syntheticEvent = {
        target: { files },
        currentTarget: { files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleFileSelect(syntheticEvent);
    }
  };
  
  const uploadAttachments = async (): Promise<string[]> => {
    if (!user || attachments.length === 0) return [];
    
    console.log('Starting upload of', attachments.length, 'files');
    const urls: string[] = [];
    
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      try {
        const fileName = `${Date.now()}_${attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, `proposals/${user.uid}/${fileName}`);
        console.log(`Uploading file ${i + 1}/${attachments.length}: ${attachment.name}`);
        
        const uploadTask = uploadBytesResumable(storageRef, attachment.file);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
              console.log(`Upload progress for ${attachment.name}: ${progress.toFixed(0)}%`);
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('File uploaded successfully:', downloadURL);
                urls.push(downloadURL);
                resolve();
              } catch (urlError) {
                console.error('Error getting download URL:', urlError);
                reject(urlError);
              }
            }
          );
        });
      } catch (error) {
        console.error('Error uploading file:', attachment.name, error);
        toast.error(t('jobApplication.errors.failedToUpload', { fileName: attachment.name }));
        // Continue with other files even if one fails
      }
    }
    
    console.log('All files uploaded, URLs:', urls);
    setUploadProgress(0);
    return urls;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check proposal limit first
    if (!proposalLimit.canSubmit) {
      setError(t('jobApplication.errors.limitReached'));
      // Navigate to billing after a delay
      setTimeout(() => {
        onClose();
        navigate('/billing');
        toast.error(t('jobApplication.errors.upgradeToPro'));
      }, 2000);
      return;
    }
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (!user) {
      setError(t('jobApplication.errors.mustBeLoggedIn'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get user profile data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        throw new Error(t('jobApplication.errors.profileNotFound'));
      }
      
      // Validate freelancer profile
      if (userData.userType === 'freelancer' || userData.userType === 'both') {
        const missingFields = [];
        if (!userData.displayName?.trim()) missingFields.push(t('jobApplication.fields.displayName'));
        if (!userData.bio?.trim()) missingFields.push(t('jobApplication.fields.bio'));
        if (!userData.skills || userData.skills.length === 0) missingFields.push(t('jobApplication.fields.skills'));
        if (!userData.hourlyRate || userData.hourlyRate <= 0) missingFields.push(t('jobApplication.fields.hourlyRate'));
        
        if (missingFields.length > 0) {
          throw new Error(t('jobApplication.errors.completeProfile', { fields: missingFields.join(', ') }));
        }
      }
      
      // Check if user already applied for this job
      try {
        const existingProposalCheck = await ProposalService.checkExistingProposal(job.id, user.uid);
        if (existingProposalCheck.success && existingProposalCheck.exists) {
          throw new Error(t('jobApplication.errors.alreadyApplied'));
        }
      } catch (checkError: any) {
        console.warn('Could not check for existing proposal:', checkError);
        // Continue anyway if check fails
      }
      
      // Upload attachments if any
      const attachmentUrls = await uploadAttachments();
      
      // Validate required fields
      if (!job.id || !job.clientId) {
        throw new Error(t('jobApplication.errors.jobInfoIncomplete'));
      }
      
      // UPDATED: Use the Firebase Function directly instead of ProposalService
      const submitProposalFn = httpsCallable(fns, 'submitProposal');
      
      const proposalData = {
        jobId: job.id,
        coverLetter: formData.coverLetter,
        proposedRate: parseFloat(formData.proposedRate),
        estimatedDuration: formData.estimatedDuration,
        attachments: attachmentUrls,
      };
      
      console.log('Submitting proposal with data:', proposalData);
      
      const result = await submitProposalFn(proposalData) as any;
      
      if (result.data?.success) {
        toast.success(t('jobApplication.success.submitted'));
        
        // UPDATED: Update the local state with the new count from the response
        if (!userData.isPro && result.data.remaining !== undefined) {
          setProposalLimit(prev => ({
            ...prev,
            remaining: result.data.remaining,
            current: result.data.newProposalCount
          }));
        }
        
        // Delay the check to ensure Firebase has propagated the changes
        setTimeout(() => {
          checkProposalLimit();
        }, 2000);
        
        onSuccess?.();
        onClose();
        
        // Reset form
        setFormData({
          coverLetter: "",
          proposedRate: "",
          estimatedDuration: ""
        });
        setAttachments([]);
      } else {
        setError(t('jobApplication.errors.submitFailed'));
      }
    } catch (err: any) {
      console.error("Error submitting application:", err);
      console.error("Error details:", {
        code: err.code,
        message: err.message,
        details: err.details
      });
      
      const errorMessage = err.message || t('jobApplication.errors.errorOccurred');
      
      // Check for specific error types
      if (err.code === 'functions/resource-exhausted' || errorMessage.includes('reached your monthly limit')) {
        setError(t('jobApplication.errors.limitReached'));
        setTimeout(() => {
          onClose();
          navigate('/billing');
        }, 2000);
      } else if (err.code === 'functions/already-exists' || errorMessage.includes('already applied')) {
        setError(t('jobApplication.errors.alreadyApplied'));
      } else if (err.code === 'permission-denied' || errorMessage.includes('Missing or insufficient permissions')) {
        setError(t('jobApplication.errors.noPermission'));
      } else {
        setError(errorMessage);
      }
      
      // If profile is incomplete, navigate to settings after a delay
      if (errorMessage.includes('complete your profile')) {
        setTimeout(() => {
          onClose();
          navigate('/settings');
          toast.error(t('jobApplication.errors.completeProfileFirst'));
        }, 2000);
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="full"
        scrollBehavior="inside"
        classNames={{
          wrapper: "p-0 m-0",
          base: "m-0 sm:m-4 max-h-[100dvh] sm:max-h-[90vh]",
          body: "p-4 overflow-y-auto",
          header: "border-b border-gray-200 dark:border-gray-700",
          footer: "border-t border-gray-200 dark:border-gray-700",
          closeButton: "right-4 top-4 z-10"
        }}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut"
              }
            },
            exit: {
              y: 20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn"
              }
            }
          }
        }}
      >
        <ModalContent 
          className={isDarkMode ? 'bg-beamly-third' : 'bg-white'}
          style={isDarkMode ? { backgroundColor: '#011241' } : {}}
        >
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {t('jobApplication.title')}
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {job.title}
              </p>
            </ModalHeader>
            
            <ModalBody className={isDarkMode ? "bg-beamly-third py-6" : "py-6"}>
              <div className="space-y-5">
                {/* Budget Info */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#010b29] border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {t('jobApplication.clientBudget')}:
                    </span>
                    <Chip 
                      color="secondary" 
                      variant="flat"
                      classNames={{
                        base: isDarkMode ? "bg-beamly-secondary/20 text-beamly-secondary border-beamly-secondary/30" : "bg-purple-100 text-purple-700",
                        content: "font-semibold"
                      }}
                    >
                      {job.budgetType === "fixed" 
                        ? `€${job.budgetMin.toLocaleString()}`
                        : `€${job.budgetMin} - €${job.budgetMax}/hr`
                      }
                    </Chip>
                  </div>
                </div>
                
                {/* Proposal Limit Info */}
                {!checkingLimit && !proposalLimit.isPro && (
                  <div className={`p-4 rounded-lg ${
                    proposalLimit.remaining <= 2 
                      ? isDarkMode ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
                      : isDarkMode ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Icon 
                        icon={proposalLimit.remaining <= 2 ? "lucide:alert-triangle" : "lucide:info"} 
                        className={`mt-0.5 ${
                          proposalLimit.remaining <= 2 
                            ? 'text-amber-500' 
                            : isDarkMode ? 'text-blue-400' : 'text-blue-500'
                        }`}
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium mb-1 ${
                          proposalLimit.remaining <= 2 
                            ? 'text-amber-500' 
                            : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {t('jobApplication.proposalLimit')}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {proposalLimit.remaining > 0 
                            ? t('jobApplication.proposalsRemaining', { count: proposalLimit.remaining })
                            : t('jobApplication.monthlyLimitReached')}
                        </p>
                        {proposalLimit.remaining <= 2 && proposalLimit.remaining > 0 && (
                          <Button
                            size="sm"
                            color="warning"
                            variant="flat"
                            className="mt-2"
                            onPress={() => {
                              onClose();
                              navigate('/billing');
                            }}
                          >
                            <Icon icon="lucide:crown" className="mr-1" />
                            {t('jobApplication.upgradeForUnlimited')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Can't Submit Warning */}
                {!proposalLimit.canSubmit && (
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      <Icon icon="lucide:x-circle" className="text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-500 mb-1">
                          {t('jobApplication.monthlyLimitReachedTitle')}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                          {t('jobApplication.freeUserLimit')}
                        </p>
                        <Button
                          color="secondary"
                          size="sm"
                          onPress={() => {
                            onClose();
                            navigate('/billing');
                          }}
                          startContent={<Icon icon="lucide:crown" />}
                        >
                          {t('jobApplication.upgradeToPro')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Cover Letter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {t('jobApplication.coverLetter')} *
                  </label>
                  <Textarea
                    placeholder={t('jobApplication.coverLetterPlaceholder')}
                    value={formData.coverLetter}
                    onValueChange={(value) => handleInputChange("coverLetter", value)}
                    variant="bordered"
                    minRows={8}
                    classNames={{
                      base: isDarkMode ? "dark" : "",
                      input: isDarkMode ? "text-white placeholder:text-gray-500" : "bg-white",
                      inputWrapper: isDarkMode 
                        ? "bg-[#010b29] border-white/20 hover:border-white/30 focus-within:!border-beamly-secondary data-[hover=true]:border-white/30" 
                        : "bg-white border-gray-300 hover:border-gray-400 focus-within:!border-purple-500"
                    }}
                    isRequired
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('jobApplication.coverLetterTip')}
                  </p>
                </div>
                
                {/* Proposed Rate */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {job.budgetType === "fixed" ? t('jobApplication.proposedTotalPrice') : t('jobApplication.proposedHourlyRate')} *
                  </label>
                  <Input
                    type="number"
                    placeholder={job.budgetType === "fixed" ? t('jobApplication.enterTotalPrice') : t('jobApplication.enterHourlyRate')}
                    value={formData.proposedRate}
                    onValueChange={(value) => handleInputChange("proposedRate", value)}
                    variant="bordered"
                    startContent={<span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>€</span>}
                    classNames={{
                      base: isDarkMode ? "dark" : "",
                      input: isDarkMode ? "text-white placeholder:text-gray-500" : "bg-white",
                      inputWrapper: isDarkMode 
                        ? "bg-[#010b29] border-white/20 hover:border-white/30 focus-within:!border-beamly-secondary data-[hover=true]:border-white/30" 
                        : "bg-white border-gray-300 hover:border-gray-400 focus-within:!border-purple-500"
                    }}
                    isRequired
                  />
                </div>
                
                {/* Estimated Duration */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {t('jobApplication.estimatedDuration')} *
                  </label>
                  <Input
                    placeholder={t('jobApplication.durationPlaceholder')}
                    value={formData.estimatedDuration}
                    onValueChange={(value) => handleInputChange("estimatedDuration", value)}
                    variant="bordered"
                    classNames={{
                      base: isDarkMode ? "dark" : "",
                      input: isDarkMode ? "text-white placeholder:text-gray-500" : "bg-white",
                      inputWrapper: isDarkMode 
                        ? "bg-[#010b29] border-white/20 hover:border-white/30 focus-within:!border-beamly-secondary data-[hover=true]:border-white/30" 
                        : "bg-white border-gray-300 hover:border-gray-400 focus-within:!border-purple-500"
                    }}
                    isRequired
                  />
                </div>
                
                {/* Attachments */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {t('jobApplication.attachments')} {!USE_IMAGE_CROPPER && <span className="text-xs text-yellow-500">({t('jobApplication.imageCroppingDisabled')})</span>}
                  </label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload-input"
                  />
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                      console.log('Upload area clicked');
                      fileInputRef.current?.click();
                    }}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                      isDarkMode 
                        ? isDragging 
                          ? 'border-beamly-secondary bg-beamly-secondary/10' 
                          : 'border-white/20 hover:border-beamly-secondary/50 bg-[#010b29] hover:bg-[#010b29]/80'
                        : isDragging
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Icon 
                      icon="lucide:upload-cloud" 
                      className={`mx-auto text-4xl mb-3 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                    />
                    <p className={`text-sm font-medium pointer-events-none ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('jobApplication.uploadDropText')}
                    </p>
                    <p className={`text-xs mt-1 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {t('jobApplication.supportedFormats')}
                    </p>
                  </div>
                  
                  {/* Alternative button if click area doesn't work */}
                  <div className="mt-2 text-center">
                    <Button
                      variant="flat"
                      size="sm"
                      className={isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : ''}
                      onPress={() => {
                        console.log('Button clicked, triggering file input');
                        fileInputRef.current?.click();
                      }}
                    >
                      <Icon icon="lucide:folder-open" className="mr-2" />
                      {t('jobApplication.browseFiles')}
                    </Button>
                  </div>
                  
                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((attachment, index) => (
                        <div 
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isDarkMode ? 'bg-[#010b29] border border-white/10' : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                              <Icon 
                                icon={attachment.type.startsWith('image/') ? 'lucide:image' : 'lucide:file-text'} 
                                className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {attachment.name}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                {attachment.type.startsWith('image/') && ` • ${t('jobApplication.image')}`}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => removeAttachment(index)}
                            className={isDarkMode ? 'text-red-400 hover:bg-red-400/20' : 'text-red-500 hover:bg-red-50'}
                          >
                            <Icon icon="lucide:x" className="text-lg" />
                          </Button>
                        </div>
                      ))}
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {t('jobApplication.filesSelected', { count: attachments.length })}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Upload Progress */}
                {loading && uploadProgress > 0 && (
                  <Progress 
                    value={uploadProgress} 
                    size="sm"
                    color="secondary"
                    className="mb-2"
                    label={t('jobApplication.uploadingAttachments', { progress: uploadProgress.toFixed(0) })}
                    classNames={{
                      indicator: isDarkMode ? "bg-beamly-secondary" : "",
                      track: isDarkMode ? "bg-white/10" : ""
                    }}
                  />
                )}
                
                {/* Error Message */}
                {error && (
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      <Icon icon="lucide:alert-circle" />
                      {error}
                    </p>
                  </div>
                )}
              </div>
            </ModalBody>
            
            <ModalFooter className={isDarkMode ? "bg-beamly-third" : ""}>
              <Button
                variant="flat"
                onPress={onClose}
                isDisabled={loading}
                className={isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : ''}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                color="secondary"
                className={isDarkMode ? 'bg-beamly-secondary text-beamly-third font-semibold hover:bg-beamly-secondary/90' : ''}
                isLoading={loading || checkingLimit}
                isDisabled={loading || checkingLimit || !proposalLimit.canSubmit}
              >
                {!proposalLimit.canSubmit 
                  ? t('jobApplication.limitReachedButton')
                  : checkingLimit 
                    ? t('jobApplication.checking')
                    : t('jobApplication.submitApplication')}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      
      {/* Image Cropper Modal - Only render if component exists and cropper is enabled */}
      {showImageCropper && imageToCrop && ImageCropper && USE_IMAGE_CROPPER && ReactDOM.createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)'
        }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              {showImageCropper && imageToCrop && USE_IMAGE_CROPPER && (
                <ImageCropper
                  isOpen={showImageCropper}
                  imageSrc={imageToCrop}
                  onClose={() => {
                    console.log('Cropping cancelled');
                    setShowImageCropper(false);
                    setImageToCrop(null);
                    setCurrentImageFile(null);
                  }}
                  onCropComplete={handleImageCropped}
                />
              )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};