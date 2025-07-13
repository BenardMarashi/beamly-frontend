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
        toast.error(t('postProject.loginRequired'));
        navigate('/login');
      } else if (!canPostProjects) {
        toast.error(t('postProject.freelancersOnly'));
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
      const fileName = `${timestamp}_${index}_${file.name}`;
      const storageRef = ref(storage, `projects/${user!.uid}/${fileName}`);
      
      try {
        const snapshot = await uploadBytes(storageRef, file, {
          contentType: file.type,
          customMetadata: {
            uploadedBy: user!.uid,
            uploadedAt: new Date().toISOString()
          }
        });
        return getDownloadURL(snapshot.ref);
      } catch (error: any) {
        console.error('Upload error for file:', fileName, error);
        // If CORS error, provide fallback
        if (error.code === 'storage/unauthorized' || error.message.includes('CORS')) {
          toast.error(`CORS error uploading ${file.name}. Please configure Firebase Storage CORS.`);
          throw new Error('CORS configuration required. Run: gsutil cors set cors.json gs://beamly-app.appspot.com');
        }
        throw error;
      }
    });
    
    try {
      const urls = await Promise.all(uploadPromises);
      return urls;
    } finally {
      setUploadingImages(false);
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
        
        <form onSubmit={handleSubmit}>
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('postProject.projectDetails')}</h2>
              
              <div className="space-y-4">
                <Input
                  label={t('postProject.projectTitle')}
                  placeholder={t('postProject.titlePlaceholder')}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  isRequired
                />
                
                <Textarea
                  label={t('postProject.projectDescription')}
                  placeholder={t('postProject.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  minRows={6}
                  isRequired
                />
                
                <Select
                  label={t('postProject.category')}
                  placeholder={t('postProject.selectCategory')}
                  selectedKeys={formData.category ? [formData.category] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFormData({ ...formData, category: selected });
                  }}
                  variant="bordered"
                  classNames={{
                    trigger: "bg-gray-900/50 border-gray-600 text-white",
                    value: "text-white",
                    listbox: "bg-gray-900",
                    popoverContent: "bg-gray-900",
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
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('postProject.skillsAndLinks')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">{t('postProject.technologiesUsed')}</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder={t('postProject.addSkill')}
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      variant="bordered"
                      className="text-white"
                    />
                    <Button
                      type="button"
                      color="secondary"
                      isIconOnly
                      onPress={handleAddSkill}
                      isDisabled={!currentSkill.trim() || formData.skills.length >= 10}
                    >
                      <Icon icon="lucide:plus" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map(skill => (
                      <Chip
                        key={skill}
                        onClose={() => handleRemoveSkill(skill)}
                        variant="flat"
                        color="secondary"
                      >
                        {skill}
                      </Chip>
                    ))}
                  </div>
                </div>
                
                <Input
                  label={t('postProject.liveUrl')}
                  placeholder="https://example.com"
                  value={formData.liveUrl}
                  onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  startContent={<Icon icon="lucide:globe" className="text-gray-400" />}
                />
                
                <Input
                  label={t('postProject.githubUrl')}
                  placeholder="https://github.com/username/repo"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  variant="bordered"
                  className="text-white"
                  startContent={<Icon icon="lucide:github" className="text-gray-400" />}
                />
              </div>
            </CardBody>
          </Card>
          
          <Card className="glass-effect border-none mb-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('postProject.projectImages')}</h2>
              <p className="text-gray-400 text-sm mb-4">{t('postProject.imagesDescription')}</p>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                  disabled={imageFiles.length >= 5}
                />
                <label htmlFor="image-upload">
                  <Button
                    as="span"
                    color="secondary"
                    variant="flat"
                    startContent={<Icon icon="lucide:upload" />}
                    className={`cursor-pointer ${imageFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {t('postProject.uploadImages')} ({imageFiles.length}/5)
                  </Button>
                </label>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={preview}
                          alt={`Project image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          isIconOnly
                          color="danger"
                          variant="solid"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onPress={() => handleRemoveImage(index)}
                        >
                          <Icon icon="lucide:x" />
                        </Button>
                        {index === 0 && (
                          <Chip
                            size="sm"
                            color="secondary"
                            className="absolute bottom-2 left-2"
                          >
                            {t('postProject.thumbnail')}
                          </Chip>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
          
          <div className="flex gap-4">
            <Button
              type="button"
              variant="bordered"
              className="flex-1"
              onPress={() => navigate('/dashboard')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              color="primary"
              className="flex-1"
              isLoading={loading || uploadingImages}
            >
              {t('postProject.postProject')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PostProjectPage;