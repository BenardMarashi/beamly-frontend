import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip, Image, Spinner, Modal, ModalContent, ModalBody } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Project } from '../../types/firestore.types';
import { toast } from 'react-hot-toast';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [freelancerName, setFreelancerName] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);

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
              setFreelancerName(userDoc.data().displayName || t('common.freelancer'));
            }
          } catch (error) {
            console.error('Error fetching freelancer info:', error);
          }
        }
      } else {
        toast.error(t('projectDetails.errors.notFound'));
        // Go back to previous page if project not found
        navigate(-1);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error(t('projectDetails.errors.loadFailed'));
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('projectDetails.confirmDelete'))) return;
    if (!project) return;

    try {
      await deleteDoc(doc(db, 'projects', project.id));
      toast.success(t('projectDetails.success.deleted'));
      
      // Navigate back to portfolio after deletion
      navigate('/portfolio');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(t('projectDetails.errors.deleteFailed'));
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
        <h1 className="text-2xl text-white mb-4">{t('projectDetails.notFound')}</h1>
        <Button 
          color="secondary" 
          onPress={() => navigate(-1)}
        >
          {t('common.goBack')}
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
              ? t('projectDetails.backToPortfolio') 
              : t('projectDetails.backToProfile', { name: freelancerName || '' })}
          </Button>
          
          {isOwner && (
            <div className="flex gap-2">
              <Button
                color="secondary"
                startContent={<Icon icon="lucide:edit" />}
                onPress={() => navigate(`/projects/${project.id}/edit`)}
              >
                {t('common.edit')}
              </Button>
              <Button
                color="danger"
                startContent={<Icon icon="lucide:trash" />}
                onPress={handleDelete}
              >
                {t('common.delete')}
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
                <div 
                    className="relative aspect-video mb-4 rounded-lg overflow-hidden cursor-pointer group bg-black/10"
                    onClick={() => setIsZoomed(true)}
                  >
                  <Image
                    src={project.images[currentImageIndex]}
                    alt={`${project.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {/* Image Navigation */}
                  {project.images.length > 1 && (
                    <>
                      <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => 
                            prev === 0 ? project.images.length - 1 : prev - 1
                          )
                        }}
                      >
                        <Icon icon="lucide:chevron-left" className="w-6 h-6" />
                      </button>
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => 
                            prev === project.images.length - 1 ? 0 : prev + 1
                          )
                        }}
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
              <h2 className="text-xl font-semibold text-white mb-3">{t('projectDetails.description')}</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* Technologies */}
            {project.skills && project.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">{t('projectDetails.technologiesUsed')}</h2>
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
                    <h3 className="text-sm text-gray-400 mb-1">{t('projectDetails.client')}</h3>
                    <p className="text-white">{project.client}</p>
                  </div>
                )}
                {project.duration && (
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">{t('projectDetails.duration')}</h3>
                    <p className="text-white">{project.duration}</p>
                  </div>
                )}
                {project.role && (
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">{t('projectDetails.role')}</h3>
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
                    <h3 className="text-lg font-semibold text-white mb-2">{t('projectDetails.challenges')}</h3>
                    <p className="text-gray-300">{project.challenges}</p>
                  </div>
                )}
                {project.solution && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t('projectDetails.solution')}</h3>
                    <p className="text-gray-300">{project.solution}</p>
                  </div>
                )}
                {project.impact && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t('projectDetails.impact')}</h3>
                    <p className="text-gray-300">{project.impact}</p>
                  </div>
                )}
              </div>
            )}

            {/* Client Testimonial (if available) */}
            {project.testimonial && (
              <div className="mb-8 p-4 bg-white/5 rounded-lg border-l-4 border-primary">
                <h3 className="text-lg font-semibold text-white mb-2">{t('projectDetails.clientTestimonial')}</h3>
                <p className="text-gray-300 italic">"{project.testimonial}"</p>
              </div>
            )}

            {/* Links */}
            {(project.liveUrl || project.githubUrl || project.demoUrl) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-3">{t('projectDetails.links')}</h2>
                <div className="flex flex-wrap gap-4">
                  {project.liveUrl && (
                    <Button
                      color="primary"
                      startContent={<Icon icon="lucide:external-link" />}
                      onPress={() => window.open(project.liveUrl, '_blank')}
                    >
                      {t('projectDetails.viewLiveDemo')}
                    </Button>
                  )}
                  {project.githubUrl && (
                    <Button
                      color="default"
                      variant="flat"
                      startContent={<Icon icon="lucide:github" />}
                      onPress={() => window.open(project.githubUrl, '_blank')}
                    >
                      {t('projectDetails.viewSourceCode')}
                    </Button>
                  )}
                  {project.demoUrl && (
                    <Button
                      color="secondary"
                      variant="flat"
                      startContent={<Icon icon="lucide:play-circle" />}
                      onPress={() => window.open(project.demoUrl, '_blank')}
                    >
                      {t('projectDetails.watchDemo')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-sm text-gray-500 border-t border-white/10 pt-4">
              <p>{t('projectDetails.created')}: {project.createdAt?.toLocaleDateString()}</p>
              {project.updatedAt && (
                <p>{t('projectDetails.lastUpdated')}: {project.updatedAt.toLocaleDateString()}</p>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>
      {/* Add this Zoom Modal */}
      <Modal 
        isOpen={isZoomed} 
        onClose={() => setIsZoomed(false)}
        size="full"
        hideCloseButton={true}
        classNames={{
          wrapper: "bg-black/90",
          base: "bg-transparent shadow-none",
          body: "p-0 pt-20",
          closeButton: "text-white hover:bg-white/20 text-2xl p-2 z-50"
        }}
      >
        <ModalContent>
          <ModalBody className="flex items-center justify-center min-h-screen relative">
            <button
              className="fixed top-24 right-6 p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all"
              onClick={() => setIsZoomed(false)}
            >
              <Icon icon="lucide:x" className="w-6 h-6" />
            </button>
            {project?.images && (
              <>
                <img
                  src={project.images[currentImageIndex]}
                  alt={`${project.title} - Image ${currentImageIndex + 1}`}
                  className="max-w-full max-h-[85vh] object-contain"
                />
                
                {project.images.length > 1 && (
                  <>
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? project.images.length - 1 : prev - 1
                      )}
                    >
                      <Icon icon="lucide:chevron-left" className="w-8 h-8" />
                    </button>
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === project.images.length - 1 ? 0 : prev + 1
                      )}
                    >
                      <Icon icon="lucide:chevron-right" className="w-8 h-8" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                      {currentImageIndex + 1} / {project.images.length}
                    </div>
                  </>
                )}
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProjectDetailsPage;