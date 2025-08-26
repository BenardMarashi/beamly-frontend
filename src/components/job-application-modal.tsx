import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
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

// Memoized Attachment Item Component
const AttachmentItem = memo(({ 
  attachment, 
  onRemove, 
  isDarkMode 
}: {
  attachment: AttachmentFile;
  onRemove: () => void;
  isDarkMode: boolean;
}) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${
    isDarkMode ? 'bg-[#010b29] border border-white/10' : 'bg-gray-50 border border-gray-200'
  }`}>
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
          {attachment.type.startsWith('image/') && ` • Image`}
        </p>
      </div>
    </div>
    <Button
      size="sm"
      variant="light"
      isIconOnly
      onPress={onRemove}
      className={isDarkMode ? 'text-red-400 hover:bg-red-400/20' : 'text-red-500 hover:bg-red-50'}
    >
      <Icon icon="lucide:x" className="text-lg" />
    </Button>
  </div>
));

// Memoized Proposal Limit Info Component
const ProposalLimitInfo = memo(({ 
  proposalLimit, 
  isDarkMode, 
  onUpgrade,
  t
}: {
  proposalLimit: any;
  isDarkMode: boolean;
  onUpgrade: () => void;
  t: any;
}) => (
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
            onPress={onUpgrade}
          >
            <Icon icon="lucide:crown" className="mr-1" />
            {t('jobApplication.upgradeForUnlimited')}
          </Button>
        )}
      </div>
    </div>
  </div>
));

export const JobApplicationModal: React.FC<JobApplicationModalProps> = memo(({
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
  
  const USE_IMAGE_CROPPER = false;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Memoize input change handler
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Memoize validation function
  const validateForm = useCallback(() => {
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
        return t('jobApplication.errors.rateTooHigh');
      }
    } else {
      if (rate > job.budgetMax * 1.5) {
        return t('jobApplication.errors.hourlyRateTooHigh');
      }
    }
    
    return null;
  }, [formData, job, t]);

  // Memoize budget display
  const budgetDisplay = useMemo(() => {
    return job.budgetType === "fixed" 
      ? `€${job.budgetMin.toLocaleString()}`
      : `€${job.budgetMin} - €${job.budgetMax}/hr`;
  }, [job]);

  // Handle resize effect
  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      setViewportHeight(currentHeight);
      
      const heightDifference = window.screen.height - currentHeight;
      setIsKeyboardVisible(heightDifference > 150);
    };

    handleResize();
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Check proposal limit when modal opens
  useEffect(() => {
    if (isOpen && user) {
      checkProposalLimit();
    }
  }, [isOpen, user]);

  const checkProposalLimit = useCallback(async () => {
    if (!user) return;
    
    setCheckingLimit(true);
    try {
      const checkLimit = httpsCallable(fns, 'checkProposalLimit');
      const result = await checkLimit() as any;
      setProposalLimit(result.data);
      
      if (!result.data.canSubmit) {
        setError(t('jobApplication.errors.limitReached'));
      }
    } catch (error) {
      console.error('Error checking proposal limit:', error);
      setProposalLimit({ canSubmit: true, remaining: -1, isPro: false });
    } finally {
      setCheckingLimit(false);
    }
  }, [user, t]);

  // Memoize input focus handler
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!modalBodyRef.current) return;
    
    setTimeout(() => {
      const target = e.target as HTMLElement;
      const modalBody = modalBodyRef.current;
      
      if (modalBody && target) {
        const targetRect = target.getBoundingClientRect();
        const modalRect = modalBody.getBoundingClientRect();
        const targetTop = targetRect.top - modalRect.top + modalBody.scrollTop;
        
        modalBody.scrollTo({
          top: targetTop - 100,
          behavior: 'smooth'
        });
      }
    }, 300);
  }, []);

  // Memoize file processing function
  const processFile = useCallback((file: File): AttachmentFile | null => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
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
      return null;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('jobApplication.errors.fileTooLarge', { fileName: file.name }));
      return null;
    }
    
    return {
      file,
      name: file.name,
      size: file.size,
      type: file.type
    };
  }, [t]);

  // Optimized file select handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newAttachments: AttachmentFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const processedFile = processFile(files[i]);
      if (processedFile) {
        newAttachments.push(processedFile);
        const fileType = processedFile.type.startsWith('image/') ? 'image' : 'document';
        toast.success(t(`jobApplication.success.${fileType}Added`, { fileName: processedFile.name }));
      }
    }
    
    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile, t]);
  
  // Memoize remove attachment handler
  const removeAttachment = useCallback((index: number) => {
    const removedFile = attachments[index];
    setAttachments(prev => prev.filter((_, i) => i !== index));
    toast.success(t('jobApplication.success.fileRemoved', { fileName: removedFile.name }));
  }, [attachments, t]);
  
  // Memoize drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const syntheticEvent = {
        target: { files },
        currentTarget: { files }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleFileSelect(syntheticEvent);
    }
  }, [handleFileSelect]);
  
  // Memoize upload attachments function
  const uploadAttachments = useCallback(async (): Promise<string[]> => {
    if (!user || attachments.length === 0) return [];
    
    const urls: string[] = [];
    
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      try {
        const fileName = `${Date.now()}_${attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, `proposals/${user.uid}/${fileName}`);
        
        const uploadTask = uploadBytesResumable(storageRef, attachment.file);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
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
      }
    }
    
    setUploadProgress(0);
    return urls;
  }, [user, attachments, t]);
  
  // Memoize submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposalLimit.canSubmit) {
      setError(t('jobApplication.errors.limitReached'));
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
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        throw new Error(t('jobApplication.errors.profileNotFound'));
      }
      
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
      
      try {
        const existingProposalCheck = await ProposalService.checkExistingProposal(job.id, user.uid);
        if (existingProposalCheck.success && existingProposalCheck.exists) {
          throw new Error(t('jobApplication.errors.alreadyApplied'));
        }
      } catch (checkError: any) {
        console.warn('Could not check for existing proposal:', checkError);
      }
      
      const attachmentUrls = await uploadAttachments();
      
      if (!job.id || !job.clientId) {
        throw new Error(t('jobApplication.errors.jobInfoIncomplete'));
      }
      
      const submitProposalFn = httpsCallable(fns, 'submitProposal');
      
      const proposalData = {
        jobId: job.id,
        coverLetter: formData.coverLetter,
        proposedRate: parseFloat(formData.proposedRate),
        estimatedDuration: formData.estimatedDuration,
        attachments: attachmentUrls,
      };
      
      const result = await submitProposalFn(proposalData) as any;
      
      if (result.data?.success) {
        toast.success(t('jobApplication.success.submitted'));
        
        if (!userData.isPro && result.data.remaining !== undefined) {
          setProposalLimit(prev => ({
            ...prev,
            remaining: result.data.remaining,
            current: result.data.newProposalCount
          }));
        }
        
        setTimeout(() => {
          checkProposalLimit();
        }, 2000);
        
        onSuccess?.();
        onClose();
        
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
      
      const errorMessage = err.message || t('jobApplication.errors.errorOccurred');
      
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
  }, [
    proposalLimit.canSubmit,
    validateForm,
    user,
    formData,
    job,
    uploadAttachments,
    checkProposalLimit,
    onSuccess,
    onClose,
    navigate,
    t
  ]);

  // Memoize modal style
  const modalStyle = useMemo(() => ({
    maxHeight: isKeyboardVisible 
      ? `${viewportHeight * 0.6}px`
      : window.innerWidth < 640 
        ? `${viewportHeight}px`
        : '90vh'
  }), [isKeyboardVisible, viewportHeight]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="full"
        scrollBehavior="inside"
        classNames={{
          wrapper: "p-0 m-0",
          base: `m-0 sm:m-4 ${
            isKeyboardVisible 
              ? 'h-[60vh] max-h-[60vh]'
              : 'h-full sm:h-auto sm:max-h-[90vh]'
          }`,
          body: "p-4 overflow-y-auto overflow-x-hidden",
          header: "border-b border-gray-200 dark:border-gray-700 flex-shrink-0",
          footer: "border-t border-gray-200 dark:border-gray-700 flex-shrink-0",
          closeButton: "right-4 top-4 z-10"
        }}
        style={modalStyle}
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
            
            <ModalBody className={`${isDarkMode ? "bg-beamly-third" : ""} py-6`}>
              <div 
                ref={modalBodyRef}
                onTouchMove={(e) => e.stopPropagation()}
                className="h-full"
              >
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
                        {budgetDisplay}
                      </Chip>
                    </div>
                  </div>
                  
                  {/* Proposal Limit Info */}
                  {!checkingLimit && !proposalLimit.isPro && (
                    <ProposalLimitInfo
                      proposalLimit={proposalLimit}
                      isDarkMode={isDarkMode}
                      onUpgrade={() => {
                        onClose();
                        navigate('/billing');
                      }}
                      t={t}
                    />
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
                      onFocus={handleInputFocus}
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
                      inputMode="decimal"
                      placeholder={job.budgetType === "fixed" ? t('jobApplication.enterTotalPrice') : t('jobApplication.enterHourlyRate')}
                      value={formData.proposedRate}
                      onValueChange={(value) => handleInputChange("proposedRate", value)}
                      onFocus={handleInputFocus}
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
                      onFocus={handleInputFocus}
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
                      {t('jobApplication.attachments')}
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
                      onClick={() => fileInputRef.current?.click()}
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
                    
                    <div className="mt-2 text-center">
                      <Button
                        variant="flat"
                        size="sm"
                        className={isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : ''}
                        onPress={() => fileInputRef.current?.click()}
                      >
                        <Icon icon="lucide:folder-open" className="mr-2" />
                        {t('jobApplication.browseFiles')}
                      </Button>
                    </div>
                    
                    {/* Attachment List */}
                    {attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachments.map((attachment, index) => (
                          <AttachmentItem
                            key={`${attachment.name}-${index}`}
                            attachment={attachment}
                            onRemove={() => removeAttachment(index)}
                            isDarkMode={isDarkMode}
                          />
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
              </div>
            </ModalBody>
            
            <ModalFooter className={`${isDarkMode ? "bg-beamly-third" : ""} ${isKeyboardVisible ? 'pb-2' : 'pb-4'}`}>
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
    </>
  );
});