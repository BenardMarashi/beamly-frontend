import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Input, Textarea, Select, SelectItem, Chip, Spinner } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Project } from '../../types/firestore.types';
import { toast } from 'react-hot-toast';

export const ProjectEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  const categories = [
    t('projectEdit.categories.webDevelopment'),
    t('projectEdit.categories.mobileDevelopment'),
    t('projectEdit.categories.uiUxDesign'),
    t('projectEdit.categories.graphicDesign'),
    t('projectEdit.categories.dataScience'),
    t('projectEdit.categories.machineLearning'),
    t('projectEdit.categories.devops'),
    t('projectEdit.categories.other')
  ];

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    if (!id) return;

    try {
      const projectDoc = await getDoc(doc(db, 'projects', id));
      
      if (projectDoc.exists()) {
        const projectData = {
          id: projectDoc.id,
          ...projectDoc.data()
        } as Project;
        
        // Check if user owns this project
        if (projectData.freelancerId !== user?.uid) {
          toast.error(t('projectEdit.errors.noPermission'));
          navigate('/portfolio');
          return;
        }
        
        setProject(projectData);
        setTitle(projectData.title);
        setDescription(projectData.description);
        setCategory(projectData.category);
        setSkills(projectData.skills || []);
        setLiveUrl(projectData.liveUrl || '');
        setGithubUrl(projectData.githubUrl || '');
        setImages(projectData.images || []);
      } else {
        toast.error(t('projectEdit.errors.notFound'));
        navigate('/portfolio');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error(t('projectEdit.errors.loadFailed'));
      navigate('/portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );
    
    if (validFiles.length !== files.length) {
      toast.error(t('projectEdit.errors.invalidFiles'));
    }
    
    setNewImages([...newImages, ...validFiles]);
  };

  const handleRemoveImage = (index: number) => {
    const newImagesList = [...images];
    newImagesList.splice(index, 1);
    setImages(newImagesList);
  };

  const handleRemoveNewImage = (index: number) => {
    const newImagesList = [...newImages];
    newImagesList.splice(index, 1);
    setNewImages(newImagesList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !category || skills.length === 0) {
      toast.error(t('projectEdit.errors.fillRequired'));
      return;
    }

    if (images.length + newImages.length === 0) {
      toast.error(t('projectEdit.errors.addImage'));
      return;
    }

    setSaving(true);

    try {
      // Upload new images
      const uploadedImageUrls: string[] = [];
      
      for (const file of newImages) {
        const fileName = `projects/${user?.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedImageUrls.push(url);
      }

      // Update project
      await updateDoc(doc(db, 'projects', id!), {
        title: title.trim(),
        description: description.trim(),
        category,
        skills,
        liveUrl: liveUrl.trim(),
        githubUrl: githubUrl.trim(),
        images: [...images, ...uploadedImageUrls],
        updatedAt: new Date()
      });

      toast.success(t('projectEdit.success.updated'));
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(t('projectEdit.errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner color="secondary" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass-effect border border-white/10">
            <CardBody className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">
                {t('projectEdit.title')}
              </h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('projectEdit.projectTitle')} *
                  </label>
                  <Input
                    placeholder={t('projectEdit.projectTitlePlaceholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    variant="bordered"
                    size="lg"
                    classNames={{
                      input: "text-white placeholder:text-gray-500",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 focus-within:!border-beamly-secondary"
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('projectEdit.projectDescription')} *
                  </label>
                  <Textarea
                    placeholder={t('projectEdit.projectDescriptionPlaceholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    minRows={5}
                    variant="bordered"
                    size="lg"
                    classNames={{
                      input: "text-white placeholder:text-gray-500",
                      inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 focus-within:!border-beamly-secondary"
                    }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('projectEdit.selectCategory')} *
                  </label>
                  <Select
                    placeholder={t('projectEdit.chooseCategory')}
                    selectedKeys={category ? [category] : []}
                    onChange={(e) => setCategory(e.target.value)}
                    variant="bordered"
                    size="lg"
                    classNames={{
                      trigger: "bg-white/5 border-white/20 hover:border-white/30 data-[open=true]:border-beamly-secondary text-white",
                      value: "text-white",
                      popoverContent: "bg-beamly-third",
                      listbox: "bg-beamly-third"
                    }}
                  >
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-white">
                        {cat}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('projectEdit.technologiesUsed')} *
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder={t('projectEdit.addSkillPlaceholder')}
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      variant="bordered"
                      size="lg"
                      classNames={{
                        input: "text-white placeholder:text-gray-500",
                        inputWrapper: "bg-white/5 border-white/20 hover:border-white/30 focus-within:!border-beamly-secondary"
                      }}
                    />
                    <Button
                      color="secondary"
                      onPress={handleAddSkill}
                      isIconOnly
                      size="lg"
                      className="min-w-unit-12 h-12"
                    >
                      <Icon icon="lucide:plus" className="text-xl" />
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      {skills.map((skill, index) => (
                        <Chip
                          key={index}
                          onClose={() => handleRemoveSkill(skill)}
                          variant="flat"
                          className="bg-beamly-secondary/20 text-white"
                        >
                          {skill}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>

                {/* Images Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('projectEdit.projectImages')} *
                  </label>
                  
                  {/* Existing Images */}
                  {images.length > 0 && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
                      <p className="text-xs text-gray-400 mb-3">{t('projectEdit.currentImages')}</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {images.map((image, index) => (
                          <div key={index} className="relative group aspect-square">
                            <img
                              src={image}
                              alt={`Project ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 p-1.5 bg-red-500/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Icon icon="lucide:x" className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images Preview */}
                  {newImages.length > 0 && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
                      <p className="text-xs text-gray-400 mb-3">{t('projectEdit.newImages')}</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {newImages.map((file, index) => (
                          <div key={index} className="relative group aspect-square">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewImage(index)}
                              className="absolute top-1 right-1 p-1.5 bg-red-500/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Icon icon="lucide:x" className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Icon icon="lucide:upload" className="text-lg" />
                    <span>{t('projectEdit.addImages')}</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
                  <Button
                    variant="flat"
                    onPress={() => navigate(`/projects/${id}`)}
                    size="lg"
                    className="w-full sm:w-auto bg-white/10 text-white"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    color="secondary"
                    isLoading={saving}
                    size="lg"
                    className="w-full sm:w-auto font-semibold"
                  >
                    {t('projectEdit.saveChanges')}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectEditPage;