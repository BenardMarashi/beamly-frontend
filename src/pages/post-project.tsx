import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Input, 
  Textarea, 
  Select, 
  SelectItem, 
  Button, 
  Card, 
  CardBody, 
  Chip, 
  Image, 
  Spinner,
  Progress,
  Tooltip
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ProjectService, StorageService, firebaseService } from '../services/firebase-services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface LocationState {
  freelancerId?: string;
  freelancerName?: string;
}

export const PostProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, userData, canPostProjects, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Get state from navigation (if coming from freelancer profile)
  const locationState = location.state as LocationState;
  
  // Check permissions on mount
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error(t('postProject.errors.loginRequired'));
        navigate('/login');
      } else if (!canPostProjects) {
        toast.error(t('postProject.errors.onlyFreelancers'));
        navigate('/dashboard');
      }
    }
  }, [user, userData, canPostProjects, authLoading, navigate]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    skills: [] as string[],
    liveUrl: "",
    githubUrl: "",
    demoUrl: "",
    images: [] as string[],
    thumbnailUrl: "",
    client: "",
    duration: "",
    teamSize: 1,
    role: "",
    technologies: [] as string[],
    challenges: "",
    solution: "",
    impact: "",
    testimonial: ""
  });
  
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentTech, setCurrentTech] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const categories = [
    { value: "web-development", label: t('postProject.categories.webDevelopment') },
    { value: "mobile-development", label: t('postProject.categories.mobileDevelopment') },
    { value: "ui-ux-design", label: t('postProject.categories.uiUxDesign') },
    { value: "graphic-design", label: t('postProject.categories.graphicDesign') },
    { value: "content-writing", label: t('postProject.categories.contentWriting') },
    { value: "digital-marketing", label: t('postProject.categories.digitalMarketing') },
    { value: "data-science", label: t('postProject.categories.dataScience') },
    { value: "machine-learning", label: t('postProject.categories.machineLearning') },
    { value: "blockchain", label: t('postProject.categories.blockchain') },
    { value: "game-development", label: t('postProject.categories.gameDevelopment') },
    { value: "devops", label: t('postProject.categories.devops') },
    { value: "other", label: t('postProject.categories.other') }
  ];
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('postProject.errors.titleRequired');
    }
    if (!formData.description.trim()) {
      newErrors.description = t('postProject.errors.descriptionRequired');
    }
    if (!formData.category) {
      newErrors.category = t('postProject.errors.categoryRequired');
    }
    if (formData.skills.length === 0) {
      newErrors.skills = t('postProject.errors.skillsRequired');
    }
    if (imageFiles.length === 0 && formData.images.length === 0) {
      newErrors.images = t('postProject.errors.imagesRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentSkill.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(currentSkill.trim())) {
        setFormData({
          ...formData,
          skills: [...formData.skills, currentSkill.trim()]
        });
        setErrors({ ...errors, skills: "" });
      }
      setCurrentSkill("");
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };
  
  const handleAddTechnology = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTech.trim()) {
      e.preventDefault();
      if (!formData.technologies.includes(currentTech.trim())) {
        setFormData({
          ...formData,
          technologies: [...formData.technologies, currentTech.trim()]
        });
      }
      setCurrentTech("");
    }
  };
  
  const handleRemoveTechnology = (techToRemove: string) => {
    setFormData({
      ...formData,
      technologies: formData.technologies.filter(tech => tech !== techToRemove)
    });
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 10) {
      toast.error(t('postProject.errors.maxImages'));
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('postProject.errors.notImage', { name: file.name }));
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(t('postProject.errors.imageTooLarge', { name: file.name }));
        return false;
      }
      return true;
    });
    
    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles([...imageFiles, ...validFiles]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
    setErrors({ ...errors, images: "" });
  };
  
  const handleRemoveImage = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };
  
  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    
    setUploadingImages(true);
    setUploadProgress(0);
    
    try {
      const uploadedUrls: string[] = [];
      const totalFiles = imageFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = imageFiles[i];
        const progress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(progress);
        
        try {
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const path = `projects/${user!.uid}/${Date.now()}_${i}_${sanitizedFileName}`;
          const result = await StorageService.uploadFile(file, path);
          
          if (result.success && result.downloadURL) {
            uploadedUrls.push(result.downloadURL);
          } else {
            toast.error(t('postProject.errors.uploadFailed', { name: file.name }));
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error(t('postProject.errors.uploadFailed', { name: file.name }));
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(t('postProject.errors.uploadImagesFailed'));
      return [];
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!validateForm()) {
      toast.error(t('postProject.errors.fillRequired'));
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload images first
      const uploadedImageUrls = await uploadImages();
      
      if (imageFiles.length > 0 && uploadedImageUrls.length === 0) {
        toast.error(t('postProject.errors.uploadImagesFailed'));
        setLoading(false);
        return;
      }
      
      // Create project data
      const projectData = {
        freelancerId: user!.uid,
        freelancerName: userData?.displayName || t('common.unknown'),
        freelancerPhotoURL: userData?.photoURL || '',
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        skills: formData.skills,
        images: uploadedImageUrls,
        thumbnailUrl: uploadedImageUrls[0] || '',
        liveUrl: formData.liveUrl.trim(),
        githubUrl: formData.githubUrl.trim(),
        demoUrl: formData.demoUrl.trim(),
        client: formData.client.trim(),
        duration: formData.duration.trim(),
        teamSize: formData.teamSize,
        role: formData.role.trim(),
        technologies: formData.technologies,
        challenges: formData.challenges.trim(),
        solution: formData.solution.trim(),
        impact: formData.impact.trim(),
        testimonial: formData.testimonial.trim()
      };
      
      // Create project
      const result = await ProjectService.createProject(projectData);
      
      if (result.success) {
        // Track analytics event
        await firebaseService.AnalyticsService.trackEvent(user!.uid, 'project_created', {
          projectId: result.projectId,
          category: formData.category,
          skillsCount: formData.skills.length
        });
        
        toast.success(t('postProject.success.posted'));
        navigate(`/profile/${user!.uid}?tab=portfolio`);
      } else {
        toast.error(t('postProject.errors.postFailed'));
      }
    } catch (error) {
      console.error('Error posting project:', error);
      toast.error(t('postProject.errors.postFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveDraft = async () => {
    // Save to localStorage for now
    const draft = {
      ...formData,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('projectDraft', JSON.stringify(draft));
    toast.success(t('postProject.draftSaved'));
  };
  
  const loadDraft = () => {
    const savedDraft = localStorage.getItem('projectDraft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setFormData(draft);
      toast.success(t('postProject.draftLoaded'));
    }
  };
  
  // Check for saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('projectDraft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      const savedDate = new Date(draft.savedAt);
      const hoursSinceSaved = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceSaved < 24) {
        toast((toastInstance) => (
          <div className="flex items-center gap-2">
            <span>{t('postProject.draftAvailable', { date: savedDate.toLocaleDateString() })}</span>
            <Button size="sm" color="primary" onPress={() => {
              loadDraft();
              toast.dismiss(toastInstance.id);
            }}>
              {t('postProject.load')}
            </Button>
          </div>
        ), { duration: 5000 });
      }
    }
  }, []);
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('postProject.title')}</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="form-section">
              <CardBody className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {t('postProject.basicInfo')}
                </h2>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.projectTitle')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder={t('postProject.projectTitlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    isInvalid={!!errors.title}
                    errorMessage={errors.title}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.projectDescription')} <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder={t('postProject.projectDescriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    minRows={4}
                    isInvalid={!!errors.description}
                    errorMessage={errors.description}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.category')} <span className="text-red-500">*</span>
                  </label>
                  <Select
                    placeholder={t('postProject.selectCategory')}
                    selectedKeys={formData.category ? [formData.category] : []}
                    onSelectionChange={(keys) => {
                      setFormData({ ...formData, category: Array.from(keys)[0] as string });
                      setErrors({ ...errors, category: "" });
                    }}
                    isInvalid={!!errors.category}
                    errorMessage={errors.category}
                    classNames={{
                      trigger: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10",
                      value: "text-white"
                    }}
                  >
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.clientCompany')}
                  </label>
                  <Input
                    placeholder={t('postProject.clientCompanyPlaceholder')}
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.projectDuration')}
                  </label>
                  <Input
                    placeholder={t('postProject.projectDurationPlaceholder')}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
              </CardBody>
            </Card>
            
            {/* Skills & Technologies */}
            <Card className="form-section overflow-visible mb-6">
              <CardBody className="space-y-4 overflow-visible pb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {t('postProject.skillsTechnologies')}
                </h2>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.addSkills')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder={t('postProject.addSkillsPlaceholder')}
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyDown={handleAddSkill}
                    isInvalid={!!errors.skills}
                    errorMessage={errors.skills}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                  
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          onClose={() => handleRemoveSkill(skill)}
                          variant="flat"
                          color="primary"
                          className="bg-primary/20"
                        >
                          {skill}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.addTechnologies')}
                  </label>
                  <Input
                    placeholder={t('postProject.addTechnologiesPlaceholder')}
                    value={currentTech}
                    onChange={(e) => setCurrentTech(e.target.value)}
                    onKeyDown={handleAddTechnology}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                  
                  {formData.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.technologies.map((tech, index) => (
                        <Chip
                          key={index}
                          onClose={() => handleRemoveTechnology(tech)}
                          variant="flat"
                          color="secondary"
                          className="bg-secondary/20"
                        >
                          {tech}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label className="text-white text-sm font-medium mb-2 block">
                      {t('postProject.yourRole')}
                    </label>
                    <Input
                      placeholder={t('postProject.yourRolePlaceholder')}
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                      }}
                    />
                  </div>
                  
                  <div className="form-field">
                    <label className="text-white text-sm font-medium mb-2 block">
                      {t('postProject.teamSize')}
                    </label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={formData.teamSize.toString()}
                      onChange={(e) => setFormData({ ...formData, teamSize: parseInt(e.target.value) || 1 })}
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                      }}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Project Details */}
            <Card className="form-section">
              <CardBody className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {t('postProject.projectDetails')}
                </h2>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.challenges')}
                  </label>
                  <Textarea
                    placeholder={t('postProject.challengesPlaceholder')}
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    minRows={3}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.solution')}
                  </label>
                  <Textarea
                    placeholder={t('postProject.solutionPlaceholder')}
                    value={formData.solution}
                    onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                    minRows={3}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.impactResults')}
                  </label>
                  <Textarea
                    placeholder={t('postProject.impactResultsPlaceholder')}
                    value={formData.impact}
                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                    minRows={3}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.clientTestimonial')}
                  </label>
                  <Textarea
                    placeholder={t('postProject.clientTestimonialPlaceholder')}
                    value={formData.testimonial}
                    onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                    minRows={2}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 data-[hover=true]:bg-white/10"
                    }}
                  />
                </div>
              </CardBody>
            </Card>
            
            {/* Project Images */}
            <Card className="form-section">
              <CardBody className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {t('postProject.projectImages')}
                </h2>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    {t('postProject.uploadImages')} <span className="text-red-500">*</span>
                  </label>
                  
                  {errors.images && (
                    <div className="text-danger text-sm mb-2">{errors.images}</div>
                  )}
                  
                  <div className="space-y-4">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={imageFiles.length >= 10}
                    />
                    
                    <label
                      htmlFor="image-upload"
                      className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-default-100 transition-colors ${
                        imageFiles.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
                      } ${errors.images ? 'border-danger' : 'border-default-300'}`}
                    >
                      <div className="text-center">
                        <div className="text-2xl text-default-400 mx-auto mb-2">📤</div>
                        <p className="text-sm text-default-600">
                          {t('postProject.clickToUpload')}
                        </p>
                        <p className="text-xs text-default-400">
                          {t('postProject.fileTypes')}
                        </p>
                      </div>
                    </label>
                    
                    {uploadingImages && (
                      <Progress 
                        value={uploadProgress} 
                        color="primary" 
                        showValueLabel={true}
                        className="mb-4"
                      />
                    )}
                    
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Tooltip content={t('postProject.setAsThumbnail')}>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color={formData.thumbnailUrl === preview ? "success" : "primary"}
                                  variant="solid"
                                  onPress={() => setFormData({ ...formData, thumbnailUrl: preview })}
                                >
                                </Button>
                              </Tooltip>
                              <Tooltip content={t('common.remove')}>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color="danger"
                                  variant="solid"
                                  onPress={() => handleRemoveImage(index)}
                                >
                                </Button>
                              </Tooltip>
                            </div>
                            {formData.thumbnailUrl === preview && (
                              <Chip
                                size="sm"
                                color="success"
                                className="absolute top-2 left-2"
                              >
                                {t('postProject.thumbnail')}
                              </Chip>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-default-500">
                      {imagePreviews.length > 0 && 
                        t('postProject.imagesSelected', { count: imagePreviews.length })
                      }
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Submit Buttons */}
            <div className="form-actions space-between">
              <Button
                variant="flat"
                onClick={() => navigate(-1)}
                isDisabled={loading || uploadingImages}
                className="border-white/20 text-white hover:bg-white/5"
              >
                {t('common.cancel')}
              </Button>
              
              <div className="flex gap-2">
                <Button
                  type="submit"
                  color="primary"
                  isLoading={loading || uploadingImages}
                  className="bg-beamly-secondary text-beamly-primary font-semibold"
                >
                  {uploadingImages ? t('postProject.uploadingImages') : t('postProject.postProjectButton')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};