import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip, Image, Spinner } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types/firestore.types';
import { toast } from 'react-hot-toast';

export const ManageProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('freelancerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(projectsQuery);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      } as Project));

      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load your projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner color="secondary" size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Projects</h1>
          <Button
            color="secondary"
            size="lg"
            startContent={<Icon icon="lucide:plus" />}
            onPress={() => navigate('/post-project')}
          >
            Post New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="glass-effect border-none">
            <CardBody className="text-center py-12">
              <Icon icon="lucide:folder" className="text-6xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
              <p className="text-gray-400 mb-6">
                Start building your portfolio by posting your first project
              </p>
              <Button
                color="secondary"
                size="lg"
                startContent={<Icon icon="lucide:plus" />}
                onPress={() => navigate('/post-project')}
              >
                Post Your First Project
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="glass-effect border-none hover:scale-105 transition-transform">
                  <CardBody className="p-0">
                    {project.thumbnailUrl && (
                      <Image
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-48 object-cover"
                        radius="none"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white text-lg line-clamp-2">
                          {project.title}
                        </h3>
                        <Chip
                          size="sm"
                          color={project.isPublished ? 'success' : 'warning'}
                          variant="flat"
                        >
                          {project.isPublished ? 'Published' : 'Draft'}
                        </Chip>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.skills.slice(0, 3).map((skill) => (
                          <Chip key={skill} size="sm" variant="flat" color="secondary">
                            {skill}
                          </Chip>
                        ))}
                        {project.skills.length > 3 && (
                          <Chip size="sm" variant="flat" color="default">
                            +{project.skills.length - 3}
                          </Chip>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Icon icon="lucide:eye" />
                            {project.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon icon="lucide:heart" />
                            {project.likeCount}
                          </span>
                        </div>
                        <span>
                          {project.createdAt?.toLocaleDateString?.() || 'Recently'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="flex-1"
                          onPress={() => navigate(`/projects/${project.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="secondary"
                          onPress={() => navigate(`/projects/${project.id}/edit`)}
                        >
                          <Icon icon="lucide:edit" />
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => handleDeleteProject(project.id)}
                        >
                          <Icon icon="lucide:trash" />
                        </Button>
                      </div>
                      
                      {(project.liveUrl || project.githubUrl) && (
                        <div className="flex gap-2 mt-2">
                          {project.liveUrl && (
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              startContent={<Icon icon="lucide:external-link" />}
                              onPress={() => window.open(project.liveUrl, '_blank')}
                            >
                              Live
                            </Button>
                          )}
                          {project.githubUrl && (
                            <Button
                              size="sm"
                              variant="light"
                              color="default"
                              startContent={<Icon icon="lucide:github" />}
                              onPress={() => window.open(project.githubUrl, '_blank')}
                            >
                              Code
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageProjectsPage;