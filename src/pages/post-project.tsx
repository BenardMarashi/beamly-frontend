import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input, Textarea, Select, SelectItem, Button, Card, CardBody, Chip, Image } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const PostProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, userData, canPostProjects, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
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
  }, [user, userData, canPostProjects, authLoading, navigate, t]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    skills: [] as string[],
    liveUrl: "",
    githubUrl: "",
    images: [] as string[],
    thumbnailUrl: ""
  });
  
  const [currentSkill, setCurrentSkill] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const categories = [
    { value: "web-design", label: t('categories.webDesign') },
    { value: "mobile-app", label: t('categories.mobileApp') },
    { value: "graphic-design", label: t('categories.graphicDesign') },
    { value: "ui-ux", label: t('categories.uiux') },
    { value: "branding", label: t('categories.branding') },
    { value: "video-animation", label: t('categories.videoAnimation') },
    { value: "writing", label: t('categories.writing') },
    { value: "other", label: t('categories.other') }
  ];

  const handleAddSkill = () => {
    if (currentSkill.trim() && formData.skills.length < 10) {
      setFormData({ ...formData, skills: [...formData.skills, currentSkill.trim()] });
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file count
    if (imageFiles.length + files.length > 5) {
      toast.error(t('postProject.maxImages'));
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('postProject.invalidImageType', { name: file.name }));
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('postProject.imageTooLarge', { name: file.name }));
        return false;
      }
      return true;
    });
    
    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles([...imageFiles, ...validFiles]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
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
    const uploadPromises = imageFiles.map(async (file, index) => {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${index}_${sanitizedFileName}`;
      
      try {
        // Use temp path first to avoid CORS issues
        const tempRef = ref(storage, `temp/${user!.uid}/${fileName}`);
        
        // Convert file to array buffer for more reliable upload
        const arrayBuffer = await file.arrayBuffer();
        
        console.log(`Uploading ${fileName} to temp storage...`);
        const snapshot = await uploadBytes(tempRef, arrayBuffer, {
          contentType: file.type || 'application/octet-stream'
        });
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`Successfully uploaded ${fileName}:`, downloadURL);
        return downloadURL;
      } catch (error: any) {
        console.error('Upload error for file:', fileName, error);
        
        // More specific error handling
        if (error.code === 'storage/unauthorized') {
          toast.error(`Authentication required. Please refresh and try again.`);
        } else if (error.code === 'storage/unknown' || error.message?.includes('CORS')) {
          // Fallback: try using the original projects path
          try {
            const projectRef = ref(storage, `projects/${user!.uid}/${fileName}`);
            const arrayBuffer = await file.arrayBuffer();
            const snapshot = await uploadBytes(projectRef, arrayBuffer, {
              contentType: file.type || 'application/octet-stream'
            });
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
          } catch (fallbackError: any) {
            console.error('Fallback upload failed:', fallbackError);
            toast.error(`Upload failed for ${file.name}. Please try with a smaller image.`);
            throw fallbackError;
          }
        } else {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
          throw error;
        }
      }
    });
    
    try {
      const urls = await Promise.all(uploadPromises);
      setUploadingImages(false);
      return urls;
    } catch (error) {
      setUploadingImages(false);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.description || !formData.category) {
      toast.error(t('postProject.fillRequired'));
      return;
    }
    
    if (formData.skills.length === 0) {
      toast.error(t('postProject.addSkills'));
      return;
    }
    
    if (imageFiles.length === 0) {
      toast.error(t('postProject.addImages'));
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload images first
      const imageUrls = await uploadImages();
      
      const projectId = doc(collection(db, 'projects')).id;
      
      const projectData = {
        id: projectId,
        freelancerId: user!.uid,
        freelancerName: userData?.displayName || 'Anonymous',
        freelancerPhotoURL: userData?.photoURL || '',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        skills: formData.skills,
        images: imageUrls,
        thumbnailUrl: imageUrls[0], // First image as thumbnail
        liveUrl: formData.liveUrl,
        githubUrl: formData.githubUrl,
        viewCount: 0,
        likeCount: 0,
        isPublished: true,
        isFeatured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'projects', projectId), projectData);
      
      toast.success(t('postProject.success'));
      navigate('/projects/manage');
    } catch (error) {
      console.error('Error posting project:', error);
      toast.error(t('postProject.error'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-8">{t('postProject.title')}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="glass-effect border-none">
            <CardBody className="p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Project Details</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="w-full">
                  <Input
                    label="Project Title"
                    placeholder="Enter your project title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    variant="bordered"
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500 focus-within:border-white",
                      label: "text-gray-300"
                    }}
                    isRequired
                  />
                </div>
                
                <div className="w-full">
                  <Textarea
                    label="Project Description"
                    placeholder="Describe your project in detail"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    variant="bordered"
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500 focus-within:border-white",
                      label: "text-gray-300"
                    }}
                    minRows={6}
                    isRequired
                  />
                </div>
                
                <div className="w-full">
                  <Select
                    label="Category"
                    placeholder="Select a category"
                    selectedKeys={formData.category ? [formData.category] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setFormData({ ...formData, category: selected });
                    }}
                    variant="bordered"
                    classNames={{
                      trigger: "bg-gray-900/50 border-gray-600 hover:border-gray-500 data-[open=true]:border-white",
                      value: "text-white",
                      label: "text-gray-300",
                      listbox: "bg-gray-900",
                      popoverContent: "bg-gray-900 border border-gray-700",
                    }}
                    isRequired
                  >
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none">
            <CardBody className="p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Skills & Links</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="w-full">
                  <label className="text-sm text-gray-300 mb-3 block font-medium">Technologies Used</label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <Input
                      placeholder="Add a skill (e.g., React, Python)"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      variant="bordered"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500 focus-within:border-white"
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      color="secondary"
                      onPress={handleAddSkill}
                      isDisabled={!currentSkill.trim() || formData.skills.length >= 10}
                      className="sm:w-auto w-full"
                      startContent={<Icon icon="lucide:plus" />}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {formData.skills.map(skill => (
                      <Chip
                        key={skill}
                        onClose={() => handleRemoveSkill(skill)}
                        variant="flat"
                        color="secondary"
                        className="bg-secondary/20 text-white"
                      >
                        {skill}
                      </Chip>
                    ))}
                    {formData.skills.length === 0 && (
                      <p className="text-gray-500 text-sm">Add skills to showcase your expertise</p>
                    )}
                  </div>
                </div>
                
                <div className="w-full">
                  <Input
                    label="Live Demo URL (Optional)"
                    placeholder="https://your-project.com"
                    value={formData.liveUrl}
                    onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                    variant="bordered"
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500 focus-within:border-white",
                      label: "text-gray-300"
                    }}
                    startContent={<Icon icon="lucide:globe" className="text-gray-400" />}
                  />
                </div>
                
                <div className="w-full">
                  <Input
                    label="GitHub Repository (Optional)"
                    placeholder="https://github.com/username/repo"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    variant="bordered"
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-gray-900/50 border-gray-600 hover:border-gray-500 focus-within:border-white",
                      label: "text-gray-300"
                    }}
                    startContent={<Icon icon="lucide:github" className="text-gray-400" />}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none">
            <CardBody className="p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Project Images</h2>
              <p className="text-gray-400 text-sm mb-6">Upload images to showcase your project. First image will be used as thumbnail.</p>
              
              <div className="space-y-6">
                <div className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                    disabled={imageFiles.length >= 5}
                  />
                  <label htmlFor="image-upload" className="block">
                    <Button
                      as="span"
                      color="secondary"
                      variant="flat"
                      startContent={<Icon icon="lucide:upload" />}
                      className={`w-full sm:w-auto cursor-pointer ${imageFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      size="lg"
                    >
                      Upload Images ({imageFiles.length}/5)
                    </Button>
                  </label>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-video bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={preview}
                          alt={`Project image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          isIconOnly
                          color="danger"
                          variant="solid"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onPress={() => handleRemoveImage(index)}
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <Icon icon="lucide:x" />
                        </Button>
                        {index === 0 && (
                          <Chip
                            size="sm"
                            color="secondary"
                            className="absolute bottom-2 left-2 z-10"
                          >
                            Thumbnail
                          </Chip>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {imagePreviews.length === 0 && (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <Icon icon="lucide:image" className="text-gray-500 text-4xl mb-4 mx-auto" />
                    <p className="text-gray-500">No images uploaded yet</p>
                    <p className="text-gray-600 text-sm">Click the upload button to add project images</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              type="button"
              variant="bordered"
              className="flex-1 text-white border-white/30 hover:bg-white/10"
              onPress={() => navigate('/dashboard')}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              className="flex-1"
              isLoading={loading || uploadingImages}
              size="lg"
            >
              {loading || uploadingImages ? 'Posting Project...' : 'Post Project'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PostProjectPage;