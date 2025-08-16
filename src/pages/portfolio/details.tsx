import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip, Image, Spinner } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types/firestore.types';
import { toast } from 'react-hot-toast';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [freelancerName, setFreelancerName] = useState<string>('');

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
        const data = projectDoc.data();
        const projectData = {
          id: projectDoc.id,
          ...data,
          freelancerId: data.freelancerId || data.userId,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        } as Project;
        
        setProject(projectData);
        
        // Fetch freelancer name for better UX (only if not the owner)
        if (projectData.freelancerId && projectData.freelancerId !== user?.uid) {
          try {
            const userDoc = await getDoc(doc(db, 'users', projectData.freelancerId));
            if (userDoc.exists()) {
              setFreelancerName(userDoc.data().displayName || 'Freelancer');
            }
          } catch (error) {
            console.error('Error fetching freelancer info:', error);
          }
        }
      } else {
        toast.error('Project not found');
        // Go back to previous page if project not found
        navigate(-1);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    if (!project) return;

    try {
      await deleteDoc(doc(db, 'projects', project.id));
      toast.success('Project deleted successfully');
      
      // Navigate back to portfolio after deletion
      navigate('/portfolio');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner color="secondary" size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl text-white mb-4">Project not found</h1>
        <Button 
          color="secondary" 
          onPress={() => navigate(-1)}
        >
          Go Back
        </Button>
      </div>
    );
  }

  const isOwner = user?.uid === project.freelancerId;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header with Conditional Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="flat"
            startContent={<Icon icon="lucide:arrow-left" />}
            onPress={() => {
              if (isOwner) {
                // Owner goes back to their portfolio management page
                navigate('/portfolio');
              } else if (project.freelancerId) {
                // Visitors go back to the freelancer's profile
                navigate(`/freelancer/${project.freelancerId}`);
              } else {
                // Fallback - go back to previous page
                navigate(-1);
              }
            }}
          >
            {isOwner 
              ? 'Back to Portfolio' 
              : `Back to ${freelancerName ? `${freelancerName}'s` : ''} Profile`
            }
          </Button>
          
          {isOwner && (
            <div className="flex gap-2">
              <Button
                color="secondary"
                startContent={<Icon icon="lucide:edit" />}
                onPress={() => navigate(`/projects/${project.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                color="danger"
                startContent={<Icon icon="lucide:trash" />}
                onPress={handleDelete}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Project Content */}
        <Card className="bg-white/5 backdrop-blur-lg border border-white/10">
          <CardBody className="p-8">
            {/* Title and Category */}
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-white">{project.title}</h1>
              {project.category && (
                <Chip size="lg" variant="flat" className="bg-primary/20 text-primary">
                  {project.category}
                </Chip>
              )}
            </div>

            {/* Images Gallery */}
            {project.images && project.images.length > 0 && (
              <div className="mb-8">
                <div className="relative aspect-video mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={project.images[currentImageIndex]}
                    alt={`${project.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image Navigation */}
                  {project.images.length > 1 && (
                    <>
                      <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === 0 ? project.images.length - 1 : prev - 1
                        )}
                      >
                        <Icon icon="lucide:chevron-left" className="w-6 h-6" />
                      </button>
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === project.images.length - 1 ? 0 : prev + 1
                        )}
                      >
                        <Icon icon="lucide:chevron-right" className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail strip */}
                {project.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {project.images.map((image, index) => (
                      <button
                        key={index}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                          index === currentImageIndex 
                            ? 'border-primary' 
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* Technologies */}
            {project.skills && project.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">Technologies Used</h2>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill, index) => (
                    <Chip key={index} size="md" variant="flat" className="bg-white/10">
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Details (if available) */}
            {(project.client || project.duration || project.role) && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {project.client && (
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Client</h3>
                    <p className="text-white">{project.client}</p>
                  </div>
                )}
                {project.duration && (
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Duration</h3>
                    <p className="text-white">{project.duration}</p>
                  </div>
                )}
                {project.role && (
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Role</h3>
                    <p className="text-white">{project.role}</p>
                  </div>
                )}
              </div>
            )}

            {/* Challenges & Solutions (if available) */}
            {(project.challenges || project.solution || project.impact) && (
              <div className="mb-8 space-y-4">
                {project.challenges && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Challenges</h3>
                    <p className="text-gray-300">{project.challenges}</p>
                  </div>
                )}
                {project.solution && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Solution</h3>
                    <p className="text-gray-300">{project.solution}</p>
                  </div>
                )}
                {project.impact && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Impact</h3>
                    <p className="text-gray-300">{project.impact}</p>
                  </div>
                )}
              </div>
            )}

            {/* Client Testimonial (if available) */}
            {project.testimonial && (
              <div className="mb-8 p-4 bg-white/5 rounded-lg border-l-4 border-primary">
                <h3 className="text-lg font-semibold text-white mb-2">Client Testimonial</h3>
                <p className="text-gray-300 italic">"{project.testimonial}"</p>
              </div>
            )}

            {/* Links */}
            {(project.liveUrl || project.githubUrl || project.demoUrl) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">Links</h2>
                <div className="flex flex-wrap gap-4">
                  {project.liveUrl && (
                    <Button
                      color="primary"
                      startContent={<Icon icon="lucide:external-link" />}
                      onPress={() => window.open(project.liveUrl, '_blank')}
                    >
                      View Live Demo
                    </Button>
                  )}
                  {project.githubUrl && (
                    <Button
                      color="default"
                      variant="flat"
                      startContent={<Icon icon="lucide:github" />}
                      onPress={() => window.open(project.githubUrl, '_blank')}
                    >
                      View Source Code
                    </Button>
                  )}
                  {project.demoUrl && (
                    <Button
                      color="secondary"
                      variant="flat"
                      startContent={<Icon icon="lucide:play-circle" />}
                      onPress={() => window.open(project.demoUrl, '_blank')}
                    >
                      Watch Demo
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-sm text-gray-500 border-t border-white/10 pt-4">
              <p>Created: {project.createdAt?.toLocaleDateString()}</p>
              {project.updatedAt && (
                <p>Last updated: {project.updatedAt.toLocaleDateString()}</p>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProjectDetailsPage;