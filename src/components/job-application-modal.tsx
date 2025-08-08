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
import { doc, getDoc } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ImageCropper } from './ImageCropper';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    clientId: string;
    clientName?: string; // Make clientName optional
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
  
  const [formData, setFormData] = useState({
    coverLetter: "",
    proposedRate: "",
    estimatedDuration: ""
  });
  
  // Image cropper configuration
  // Set to true after importing ImageCropper correctly
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
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    console.log('Files selected:', files.length); // Debug log
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
        toast.error(`${file.name} is not a supported file type`);
        continue;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        continue;
      }
      
      // If it's an image, show the cropper
      const isImage = file.type.startsWith('image/') || 
                     ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                     
      if (isImage) {
        console.log('Processing image file:', file.name);
        
        // For now, add images directly without cropping
        // TODO: Enable this when ImageCropper is working
        if (!USE_IMAGE_CROPPER) {
          newAttachments.push({
            file,
            name: file.name,
            size: file.size,
            type: file.type
          });
          toast.success(`Image "${file.name}" added`);
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
            toast.error('Failed to read image file');
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          toast.error('Error reading image file');
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
        toast.success(`Document "${file.name}" added`);
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
    toast.success(`Removed "${removedFile.name}"`);
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
    
    toast.success(`Image "${croppedFile.name}" cropped and added`);
    
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
        toast.error(`Failed to upload ${attachment.name}`);
        // Continue with other files even if one fails
      }
    }
    
    console.log('All files uploaded, URLs:', urls);
    setUploadProgress(0);
    return urls;
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
      // Get user profile data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        throw new Error('User profile not found. Please complete your profile first.');
      }
      
      // Validate freelancer profile
      if (userData.userType === 'freelancer' || userData.userType === 'both') {
        const missingFields = [];
        if (!userData.displayName?.trim()) missingFields.push('Display Name');
        if (!userData.bio?.trim()) missingFields.push('Bio');
        if (!userData.skills || userData.skills.length === 0) missingFields.push('Skills');
        if (!userData.hourlyRate || userData.hourlyRate <= 0) missingFields.push('Hourly Rate');
        
        if (missingFields.length > 0) {
          throw new Error(`Please complete your profile before applying. Missing: ${missingFields.join(', ')}`);
        }
      }
      
      // Check if user already applied for this job
      try {
        const existingProposalCheck = await ProposalService.checkExistingProposal(job.id, user.uid);
        if (existingProposalCheck.success && existingProposalCheck.exists) {
          throw new Error('You have already applied for this job.');
        }
      } catch (checkError: any) {
        console.warn('Could not check for existing proposal:', checkError);
        // Continue anyway if check fails
      }
      
      // Upload attachments if any
      const attachmentUrls = await uploadAttachments();
      
      // Validate required fields
      if (!job.id || !job.clientId) {
        throw new Error('Job information is incomplete. Please refresh and try again.');
      }
      
      const proposalData = {
        jobId: job.id,
        jobTitle: job.title,
        clientId: job.clientId,
        clientName: job.clientName || "",
        freelancerId: user.uid,
        freelancerName: userData.displayName || user.displayName || "Anonymous",
        freelancerPhotoURL: userData.photoURL || user.photoURL || "",
        freelancerRating: userData.rating || 0,
        coverLetter: formData.coverLetter,
        proposedRate: parseFloat(formData.proposedRate),
        estimatedDuration: formData.estimatedDuration,
        budgetType: job.budgetType,
        attachments: attachmentUrls,
        status: "pending" as const
      };
      
      console.log('Creating proposal with data:', proposalData);
      
      const result = await ProposalService.createProposal(proposalData);
      
      if (result.success) {
        toast.success("Application submitted successfully!");
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
        setError("Failed to submit application. Please try again.");
      }
    } catch (err: any) {
      console.error("Error submitting application:", err);
      console.error("Error details:", {
        code: err.code,
        message: err.message,
        details: err.details
      });
      
      const errorMessage = err.message || "An error occurred while submitting your application.";
      
      // Check if it's a permission error
      if (err.code === 'permission-denied' || errorMessage.includes('Missing or insufficient permissions')) {
        setError("You don't have permission to apply for this job. Please make sure you're logged in and try again.");
      } else {
        setError(errorMessage);
      }
      
      // If profile is incomplete, navigate to settings after a delay
      if (errorMessage.includes('complete your profile')) {
        setTimeout(() => {
          onClose();
          navigate('/settings');
          toast.error("Please complete your profile first");
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
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: isDarkMode ? "dark" : "",
          backdrop: isDarkMode ? "bg-black/80" : "bg-black/50",
          wrapper: isDarkMode ? "" : "",
          body: isDarkMode ? "bg-beamly-third py-6" : "bg-white py-6",
          header: isDarkMode ? "bg-beamly-third border-b border-white/10" : "bg-white border-b border-gray-200",
          footer: isDarkMode ? "bg-beamly-third border-t border-white/10" : "bg-white border-t border-gray-200",
          closeButton: isDarkMode ? "text-white/70 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        }}
      >
        <ModalContent 
          className={isDarkMode ? 'bg-beamly-third' : 'bg-white'}
          style={isDarkMode ? { backgroundColor: '#011241' } : {}}
        >
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Apply for Job
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
                      Client's Budget:
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
                        ? `$${job.budgetMin.toLocaleString()}`
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
                    startContent={<span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>$</span>}
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
                    Estimated Duration *
                  </label>
                  <Input
                    placeholder="e.g., 2 weeks, 1 month"
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
                    Attachments (Optional) {!USE_IMAGE_CROPPER && <span className="text-xs text-yellow-500">(Image cropping disabled)</span>}
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
                      Click to upload or drag and drop
                    </p>
                    <p className={`text-xs mt-1 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      PDF, DOC, DOCX, JPG, PNG, GIF, WEBP up to 10MB
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
                      Browse Files
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
                                {attachment.type.startsWith('image/') && ' • Image'}
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
                        {attachments.length} file{attachments.length !== 1 ? 's' : ''} selected
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
                    label={`Uploading attachments... ${uploadProgress.toFixed(0)}%`}
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
                Cancel
              </Button>
              <Button
                type="submit"
                color="secondary"
                className={isDarkMode ? 'bg-beamly-secondary text-beamly-third font-semibold hover:bg-beamly-secondary/90' : ''}
                isLoading={loading}
                isDisabled={loading}
              >
                Submit Application
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
          zIndex: 100000, // Very high z-index to ensure it's on top
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