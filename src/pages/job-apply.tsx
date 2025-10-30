import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Spinner,
  Chip,
  Progress
} from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { doc, getDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ProposalService } from '../services/firebase-services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { fns } from '../lib/firebase';

interface Job {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientRating?: number;
  clientJobsPosted?: number;
  clientCountry?: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: 'fixed' | 'hourly';
  skills: string[];
  experienceLevel: string;
  projectDuration: string;
  status: string;
  category: string;
  postedAt: any;
  proposals?: number;
}

interface AttachmentFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

export const JobApplyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Proposal limit state
  const [proposalLimit, setProposalLimit] = useState<{
    canSubmit: boolean;
    remaining: number;
    isPro: boolean;
  }>({ canSubmit: true, remaining: 5, isPro: false });
  const [checkingLimit, setCheckingLimit] = useState(false);
  
  const [formData, setFormData] = useState({
    coverLetter: "",
    proposedRate: "",
    estimatedDuration: ""
  });
  
  const isDarkMode = true; // You can get this from your theme context

  // Check if user is a freelancer
  const isFreelancer = userData?.userType === 'freelancer' || userData?.userType === 'both';

  useEffect(() => {
    if (!user) {
      toast.error('Please login to apply for jobs');
      navigate('/login');
      return;
    }
    
    if (!isFreelancer) {
      toast.error('Only freelancers can apply for jobs');
      navigate('/browse-jobs');
      return;
    }

    if (id) {
      fetchJob();
      checkProposalLimit();
    }
  }, [id, user, isFreelancer]);

  const fetchJob = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', id));
      if (jobDoc.exists()) {
        const jobData = { id: jobDoc.id, ...jobDoc.data() } as Job;
        
        if (jobData.status !== 'open') {
          toast.error('This job is no longer accepting applications');
          navigate('/looking-for-work');
          return;
        }
        
        setJob(jobData);
        setFormData(prev => ({
          ...prev,
          proposedRate: jobData.budgetType === 'fixed' 
            ? jobData.budgetMin.toString() 
            : jobData.budgetMin.toString()
        }));
      } else {
        toast.error('Job not found');
        navigate('/looking-for-work');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
      navigate('/looking-for-work');
    } finally {
      setLoading(false);
    }
  };

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

  // Handle input change
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Validate form
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
    if (job) {
      if (job.budgetType === "fixed") {
        if (rate > job.budgetMax * 1.5) {
          return t('jobApplication.errors.rateTooHigh');
        }
      } else {
        if (rate > job.budgetMax * 1.5) {
          return t('jobApplication.errors.hourlyRateTooHigh');
        }
      }
    }
    
    return null;
  }, [formData, job, t]);

  // Process file
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

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newAttachments: AttachmentFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const processedFile = processFile(files[i]);
      if (processedFile) {
        newAttachments.push(processedFile);
      }
    }
    
    if (newAttachments.length + attachments.length > 3) {
      toast.error(t('jobApplication.errors.maxAttachments'));
      return;
    }
    
    setAttachments([...attachments, ...newAttachments]);
  }, [attachments, processFile, t]);

  // Upload attachments
  const uploadAttachments = async (): Promise<string[]> => {
    if (attachments.length === 0) return [];
    
    const urls: string[] = [];
    const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    let uploadedSize = 0;
    
    for (const attachment of attachments) {
      const timestamp = Date.now();
      const safeName = attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `proposals/${user?.uid}/${timestamp}_${safeName}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = uploadBytesResumable(storageRef, attachment.file);
      
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            uploadedSize += snapshot.bytesTransferred;
            const progress = Math.round((uploadedSize / totalSize) * 100);
            setUploadProgress(progress);
          },
          reject,
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            urls.push(url);
            resolve();
          }
        );
      });
    }
    
    return urls;
  };

  // Submit application
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposalLimit.canSubmit) {
      setError(t('jobApplication.errors.limitReached'));
      setTimeout(() => navigate('/billing'), 2000);
      return;
    }
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (!user || !job) {
      setError(t('jobApplication.errors.notLoggedIn'));
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Check for existing proposal
      const existingProposalCheck = await ProposalService.checkExistingProposal(job.id, user.uid);
      if (existingProposalCheck.success && existingProposalCheck.exists) {
        throw new Error(t('jobApplication.errors.alreadyApplied'));
      }
      
      // Upload attachments
      const attachmentUrls = await uploadAttachments();
      
      // Submit proposal
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
        
        // Update proposal limit if not pro
        if (!userData?.isPro && result.data.remaining !== undefined) {
          setProposalLimit(prev => ({
            ...prev,
            remaining: result.data.remaining,
            current: result.data.newProposalCount
          }));
        }
        
        // Navigate to proposals page
        navigate('/proposals');
      } else {
        setError(t('jobApplication.errors.submitFailed'));
      }
    } catch (err: any) {
      console.error("Error submitting application:", err);
      
      const errorMessage = err.message || t('jobApplication.errors.errorOccurred');
      
      if (errorMessage.includes('reached your monthly limit')) {
        setError(t('jobApplication.errors.limitReached'));
        setTimeout(() => navigate('/billing'), 2000);
      } else if (errorMessage.includes('already applied')) {
        setError(t('jobApplication.errors.alreadyApplied'));
      } else if (errorMessage.includes('complete your profile')) {
        setTimeout(() => {
          navigate('/settings');
          toast.error(t('jobApplication.errors.completeProfileFirst'));
        }, 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }, [
    proposalLimit.canSubmit,
    validateForm,
    user,
    job,
    formData,
    uploadAttachments,
    userData,
    navigate,
    t
  ]);

  // Format budget display
  const budgetDisplay = useMemo(() => {
    if (!job) return '';
    return job.budgetType === "fixed" 
      ? `€${job.budgetMin.toLocaleString()}`
      : `€${job.budgetMin} - €${job.budgetMax}/hr`;
  }, [job]);

  if (loading || checkingLimit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="glass-effect">
          <CardBody className="text-center p-8">
            <h2 className="text-xl font-semibold text-white mb-4">Job not found</h2>
            <Button color="secondary" onPress={() => navigate('/looking-for-work')}>
              Browse Jobs
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beamly-third">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="light"
              startContent={<Icon icon="lucide:arrow-left" />}
              onPress={() => navigate(`/job/${job.id}`)}
              className="text-white mb-4"
            >
              {t('jobApplication.backToJobDetails')}
            </Button>
            <h1 className="text-3xl font-bold text-white mb-2">{t('jobApplication.title')}</h1>
            <h2 className="text-xl text-beamly-secondary">{job.title}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job Summary Sidebar */}
            <Card className="glass-effect border-none lg:col-span-1 h-fit">
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('jobApplication.jobSummary')}</h3>
                
                <div className="space-y-4">
                  {/* Client Info */}
                  <div>
                    <span className="text-gray-400 text-sm">{t('jobApplication.client')}:</span>
                    <p className="text-white font-medium">{job.clientName}</p>
                  </div>
                  
                  {/* Budget */}
                  <div>
                    <span className="text-gray-400 text-sm">{t('jobApplication.clientBudget')}:</span>
                    <Chip 
                      color="secondary" 
                      variant="flat"
                      className="mt-1"
                    >
                      {budgetDisplay}
                    </Chip>
                  </div>
                  
                  {/* Experience Level */}
                  <div>
                    <span className="text-gray-400 text-sm">{t('jobApplication.experienceLevel')}:</span>
                    <p className="text-white">{job.experienceLevel}</p>
                  </div>
                  
                  {/* Duration */}
                  <div>
                    <span className="text-gray-400 text-sm">{t('jobApplication.duration')}:</span>
                    <p className="text-white">{job.projectDuration}</p>
                  </div>
                  
                  {/* Skills */}
                  <div>
                    <span className="text-gray-400 text-sm block mb-2">{t('jobApplication.requiredSkills')}:</span>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          size="sm"
                          variant="flat"
                          className="bg-white/10 text-white"
                        >
                          {skill}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Proposal Limit Info */}
                  {!checkingLimit && !proposalLimit.isPro && proposalLimit.remaining >= 0 && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      proposalLimit.remaining <= 2 
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'bg-blue-500/10 border border-blue-500/30'
                    }`}>
                      <div className="flex items-start gap-3">
                        <Icon 
                          icon={proposalLimit.remaining <= 2 ? "lucide:alert-triangle" : "lucide:info"} 
                          className={`mt-0.5 ${
                            proposalLimit.remaining <= 2 
                              ? 'text-amber-500' 
                              : 'text-blue-400'
                          }`}
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-medium mb-1 ${
                            proposalLimit.remaining <= 2 
                              ? 'text-amber-500' 
                              : 'text-blue-400'
                          }`}>
                            {t('jobApplication.proposalLimit')}
                          </p>
                          <p className="text-sm text-gray-300">
                            {proposalLimit.remaining > 0 
                              ? t('jobApplication.proposalsRemaining', { count: proposalLimit.remaining })
                              : t('jobApplication.monthlyLimitReached')}
                          </p>
                          {proposalLimit.remaining <= 2 && proposalLimit.remaining > 0 && (
                            <Button
                              size="sm"
                              color="warning"
                              variant="flat"
                              className="mt-2 w-full"
                              startContent={<Icon icon="lucide:crown" />}
                              onPress={() => navigate('/billing')}
                            >
                              {t('jobApplication.upgradeForUnlimited')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Can't Submit Warning */}
                  {!proposalLimit.canSubmit && (
                    <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="flex items-start gap-3">
                        <Icon icon="lucide:x-circle" className="text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-500 mb-1">
                            {t('jobApplication.monthlyLimitReachedTitle')}
                          </p>
                          <p className="text-sm text-gray-300 mb-3">
                            {t('jobApplication.freeUserLimit')}
                          </p>
                          <Button
                            color="secondary"
                            size="sm"
                            className="w-full"
                            onPress={() => navigate('/billing')}
                            startContent={<Icon icon="lucide:crown" />}
                          >
                            {t('jobApplication.upgradeToPro')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Application Form */}
            <Card className="glass-effect border-none lg:col-span-2">
              <CardBody className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Cover Letter */}
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      {t('jobApplication.coverLetter')} *
                    </label>
                    <Textarea
                      placeholder={t('jobApplication.coverLetterPlaceholder')}
                      value={formData.coverLetter}
                      onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                      minRows={8}
                      maxRows={15}
                      variant="bordered"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
                      }}
                    />
                  </div>

                  {/* Proposed Rate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white font-medium mb-2 block">
                        {t('jobApplication.proposedRate')} *
                      </label>
                      <Input
                        type="number"
                        placeholder={job.budgetType === "fixed" ? t('jobApplication.totalAmount') : t('jobApplication.hourlyRate')}
                        value={formData.proposedRate}
                        onChange={(e) => handleInputChange('proposedRate', e.target.value)}
                        startContent={<span className="text-gray-400">€</span>}
                        endContent={
                          <span className="text-gray-400 text-sm">
                            {job.budgetType === "hourly" ? "/hr" : "total"}
                          </span>
                        }
                        variant="bordered"
                        classNames={{
                          input: "text-white",
                          inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
                        }}
                      />
                    </div>

                    {/* Estimated Duration */}
                    <div>
                      <label className="text-white font-medium mb-2 block">
                        {t('jobApplication.estimatedDuration')} *
                      </label>
                      <Input
                        placeholder={t('jobApplication.durationPlaceholder')}
                        value={formData.estimatedDuration}
                        onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                        variant="bordered"
                        classNames={{
                          input: "text-white",
                          inputWrapper: "bg-white/5 border-white/20 hover:border-white/30"
                        }}
                      />
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      {t('jobApplication.attachments')}
                    </label>
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        variant="bordered"
                        onPress={() => fileInputRef.current?.click()}
                        startContent={<Icon icon="lucide:upload" />}
                        className="text-white border-white/20 hover:border-white/30"
                        isDisabled={attachments.length >= 3}
                      >
                        {t('jobApplication.addAttachment')} ({attachments.length}/3)
                      </Button>
                      
                      {/* Attachment List */}
                      {attachments.length > 0 && (
                        <div className="space-y-2">
                          {attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                            >
                              <div className="flex items-center gap-3">
                                <Icon
                                  icon={attachment.type.startsWith('image/') ? 'lucide:image' : 'lucide:file-text'}
                                  className="text-beamly-secondary"
                                />
                                <div>
                                  <p className="text-white text-sm">{attachment.name}</p>
                                  <p className="text-gray-400 text-xs">
                                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                isIconOnly
                                variant="light"
                                onPress={() => setAttachments(attachments.filter((_, i) => i !== index))}
                                size="sm"
                                className="text-red-400 hover:text-red-300"
                              >
                                <Icon icon="lucide:x" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <Progress
                      value={uploadProgress}
                      color="secondary"
                      className="mb-4"
                      label={t('jobApplication.uploadingAttachments')}
                    />
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm flex items-center gap-2 text-red-400">
                        <Icon icon="lucide:alert-circle" />
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      color="secondary"
                      size="lg"
                      className="flex-1 font-semibold"
                      isLoading={submitting}
                      isDisabled={submitting || !proposalLimit.canSubmit}
                    >
                      {!proposalLimit.canSubmit 
                        ? t('jobApplication.limitReachedButton')
                        : t('jobApplication.submitApplication')}
                    </Button>
                    <Button
                      variant="bordered"
                      size="lg"
                      className="text-white border-white/20 hover:border-white/30"
                      onPress={() => navigate(`/job/${job.id}`)}
                      isDisabled={submitting}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JobApplyPage;