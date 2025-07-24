import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Input, Textarea, Select, SelectItem, Chip, Spinner } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types/firestore.types';
import { toast } from 'react-hot-toast';

const categories = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Graphic Design',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Other'
];

export const ProjectEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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
          toast.error('You do not have permission to edit this project');
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
        toast.error('Project not found');
        navigate('/portfolio');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
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
      toast.error('Some files were skipped. Only images under 5MB are allowed.');
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
      toast.error('Please fill in all required fields');
      return;
    }

    if (images.length + newImages.length === 0) {
      toast.error('Please add at least one image');
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

      toast.success('Project updated successfully!');
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project. Please try again.');
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
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white/5 backdrop-blur-lg border border-white/10">
          <CardBody className="p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Edit Project</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <Input
                label="Project Title"
                placeholder="Enter project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                isRequired
                classNames={{
                  label: "text-gray-300",
                  input: "text-white",
                  inputWrapper: "bg-white/5 border-white/10"
                }}
              />

              {/* Description */}
              <Textarea
                label="Project Description"
                placeholder="Describe your project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minRows={4}
                isRequired
                classNames={{
                  label: "text-gray-300",
                  input: "text-white",
                  inputWrapper: "bg-white/5 border-white/10"
                }}
              />

              {/* Category */}
              <Select
                label="Category"
                placeholder="Select a category"
                selectedKeys={[category]}
                onChange={(e) => setCategory(e.target.value)}
                isRequired
                classNames={{
                  label: "text-gray-300",
                  trigger: "bg-white/5 border-white/10",
                  value: "text-white"
                }}
              >
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </Select>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Technologies Used *
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "bg-white/5 border-white/10"
                    }}
                  />
                  <Button
                    color="secondary"
                    onPress={handleAddSkill}
                    isIconOnly
                  >
                    <Icon icon="lucide:plus" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Chip
                      key={index}
                      onClose={() => handleRemoveSkill(skill)}
                      variant="flat"
                      className="bg-white/10"
                    >
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Images
                </label>
                
                {/* Existing Images */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Project ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-danger/80 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <Icon icon="lucide:x" className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Images Preview */}
                {newImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {newImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-1 right-1 p-1 bg-danger/80 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <Icon icon="lucide:x" className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
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
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                >
                  <Icon icon="lucide:upload" />
                  Add Images
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <Button
                  variant="flat"
                  onPress={() => navigate(`/projects/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="secondary"
                  isLoading={saving}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProjectEditPage;