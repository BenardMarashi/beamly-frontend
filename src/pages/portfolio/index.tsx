import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip, Image, Spinner } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Project } from '../../types/firestore.types';
import { toast } from 'react-hot-toast';

export const PortfolioPage: React.FC = () => {
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
      toast.error('Failed to load your portfolio');
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-white">My Portfolio</h1>
          <Button
            color="secondary"
            size="lg"
            startContent={<Icon icon="lucide:plus" />}
            onPress={() => navigate('/post-project')}
          >
            Add Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-lg border border-white/10">
            <CardBody className="text-center py-12">
              <Icon icon="lucide:folder-open" className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
              <p className="text-gray-400 mb-6">
                Start building your portfolio by adding your first project
              </p>
              <Button
                color="secondary"
                startContent={<Icon icon="lucide:plus" />}
                onPress={() => navigate('/post-project')}
              >
                Add Your First Project
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card 
                      className="bg-white/5 backdrop-blur-lg border border-white/10 h-full cursor-pointer hover:bg-white/10 transition-all"
                      isPressable
                      onPress={() => navigate(`/projects/${project.id}`)}
                    >
                  <CardBody className="p-0">
                    <div className="relative h-48 bg-gradient-to-br from-blue-600/20 to-purple-600/20 overflow-hidden">
                      <Image
                        src={project.images?.[0] || '/placeholder-project.jpg'}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Category chip */}
                        {project.category && (
                          <div className="absolute top-2 right-2">
                            <Chip size="sm" variant="flat" className="bg-black/60 text-white">
                              {project.category}
                            </Chip>
                          </div>
                        )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.skills.slice(0, 3).map((skill, index) => (
                          <Chip 
                            key={index}
                            size="sm" 
                            variant="flat"
                            className="bg-white/10 text-gray-300"
                          >
                            {skill}
                          </Chip>
                        ))}
                        {project.skills.length > 3 && (
                          <Chip 
                            size="sm" 
                            variant="flat"
                            className="bg-white/10 text-gray-300"
                          >
                            +{project.skills.length - 3}
                          </Chip>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-4">
                        <span>
                          Updated {project.updatedAt?.toLocaleDateString?.() || 'Recently'}
                        </span>
                      </div>
                      
                      
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

export default PortfolioPage;