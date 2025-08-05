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
        toast.error('Please login to post projects');
        navigate('/login');
      } else if (!canPostProjects) {
        toast.error('Only freelancers can post projects');
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
    { value: "web-development", label: "Web Development" },
    { value: "mobile-development", label: "Mobile Development" },
    { value: "ui-ux-design", label: "UI/UX Design" },
    { value: "graphic-design", label: "Graphic Design" },
    { value: "content-writing", label: "Content Writing" },
    { value: "digital-marketing", label: "Digital Marketing" },
    { value: "data-science", label: "Data Science" },
    { value: "machine-learning", label: "Machine Learning" },
    { value: "blockchain", label: "Blockchain" },
    { value: "game-development", label: "Game Development" },
    { value: "devops", label: "DevOps" },
    { value: "other", label: "Other" }
  ];
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Project title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Project description is required";
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    if (formData.skills.length === 0) {
      newErrors.skills = "Add at least one skill";
    }
    if (imageFiles.length === 0 && formData.images.length === 0) {
      newErrors.images = "Add at least one project image";
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
      toast.error('Maximum 10 images allowed');
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large (max 5MB)`);
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
            toast.error(`Failed to upload ${file.name}`);
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
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
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload images first
      const uploadedImageUrls = await uploadImages();
      
      if (imageFiles.length > 0 && uploadedImageUrls.length === 0) {
        toast.error('Failed to upload images');
        setLoading(false);
        return;
      }
      
      // Create project data
      const projectData = {
        freelancerId: user!.uid,
        freelancerName: userData?.displayName || 'Unknown',
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
        
        toast.success('Project posted successfully!');
        navigate(`/profile/${user!.uid}?tab=portfolio`);
      } else {
        toast.error('Failed to post project');
      }
    } catch (error) {
      console.error('Error posting project:', error);
      toast.error('Failed to post project');
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
    toast.success('Draft saved locally');
  };
  
  const loadDraft = () => {
    const savedDraft = localStorage.getItem('projectDraft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setFormData(draft);
      toast.success('Draft loaded');
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
        toast((t) => (
          <div className="flex items-center gap-2">
            <span>You have a saved draft from {savedDate.toLocaleDateString()}</span>
            <Button size="sm" color="primary" onClick={() => {
              loadDraft();
              toast.dismiss(t.id);
            }}>
              Load
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
          <h1 className="text-3xl font-bold">Post a Project</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="form-section">
              <CardBody className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Basic Information
                </h2>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter your project title"
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
                    Project Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Describe your project in detail..."
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
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Select
                    placeholder="Select a category"
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
                    Client/Company Name
                  </label>
                  <Input
                    placeholder="e.g., ABC Company"
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
                    Project Duration
                  </label>
                  <Input
                    placeholder="e.g., 3 months"
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
                  Skills & Technologies
                </h2>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    Add Skills <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Type a skill and press Enter"
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
                    Add Technologies
                  </label>
                  <Input
                    placeholder="Type a technology and press Enter"
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
                      Your Role
                    </label>
                    <Input
                      placeholder="e.g., Full Stack Developer"
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
                      Team Size
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
                  Project Details
                </h2>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    Challenges
                  </label>
                  <Textarea
                    placeholder="What challenges did you face in this project?"
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
                    Solution
                  </label>
                  <Textarea
                    placeholder="How did you solve these challenges?"
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
                    Impact/Results
                  </label>
                  <Textarea
                    placeholder="What was the impact or results of your project?"
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
                    Client Testimonial
                  </label>
                  <Textarea
                    placeholder="Add a testimonial from your client (optional)"
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
                  Project Images
                </h2>
                
                <div className="form-field">
                  <label className="text-white text-sm font-medium mb-2 block">
                    Upload Images <span className="text-red-500">*</span>
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
                          Click to upload images (max 10)
                        </p>
                        <p className="text-xs text-default-400">
                          PNG, JPG, GIF up to 5MB each
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
                              <Tooltip content="Set as thumbnail">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color={formData.thumbnailUrl === preview ? "success" : "primary"}
                                  variant="solid"
                                  onPress={() => setFormData({ ...formData, thumbnailUrl: preview })}
                                >
                                </Button>
                              </Tooltip>
                              <Tooltip content="Remove">
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
                                Thumbnail
                              </Chip>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-default-500">
                      {imagePreviews.length > 0 && 
                        `${imagePreviews.length} image${imagePreviews.length > 1 ? 's' : ''} selected. Click the star icon to set thumbnail.`
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
                Cancel
              </Button>
              
              <div className="flex gap-2">
                <Button
                  type="submit"
                  color="primary"
                  isLoading={loading || uploadingImages}
                  className="bg-beamly-secondary text-beamly-primary font-semibold"
                >
                  {uploadingImages ? 'Uploading Images...' : 'Post Project'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};