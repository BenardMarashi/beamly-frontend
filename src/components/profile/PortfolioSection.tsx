// src/components/profile/PortfolioSection.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Image, Chip } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Project {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  images: string[];
  skills: string[];
  category: string;
  createdAt: any;
  liveUrl?: string;
  githubUrl?: string;
}

interface PortfolioSectionProps {
  freelancerId: string;
  isOwnProfile?: boolean;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ 
  freelancerId, 
  isOwnProfile = false 
}) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [freelancerId]);

  const fetchProjects = async () => {
    try {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('freelancerId', '==', freelancerId),
        where('isPublished', '==', true),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      
      const snapshot = await getDocs(projectsQuery);
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="glass-effect p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Portfolio</h2>
        {isOwnProfile && (
          <Button
            color="secondary"
            size="sm"
            startContent={<Icon icon="lucide:plus" />}
            onPress={() => navigate('/post-project')}
          >
            Add Project
          </Button>
        )}
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Icon 
            icon="lucide:folder-open" 
            className="text-5xl text-gray-400 mx-auto mb-3"
          />
          <p className="text-gray-400">
            {isOwnProfile 
              ? "You haven't posted any projects yet" 
              : "No projects in portfolio yet"}
          </p>
          {isOwnProfile && (
            <Button
              color="secondary"
              variant="flat"
              className="mt-4"
              onPress={() => navigate('/post-project')}
            >
              Post Your First Project
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card 
                key={project.id}
                isPressable
                onPress={() => navigate(`/project/${project.id}`)}
                className="glass-card hover:scale-105 transition-transform"
              >
                <CardBody className="p-0">
                  <div className="relative aspect-video">
                    <Image
                      src={project.thumbnailUrl || project.images?.[0] || '/placeholder-project.jpg'}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Chip size="sm" variant="flat" className="bg-black/60 text-white">
                        {project.category}
                      </Chip>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
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
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          
          {projects.length >= 6 && (
            <div className="text-center mt-6">
              <Button
                variant="light"
                className="text-white"
                onPress={() => navigate(`/freelancer/${freelancerId}/projects`)}
              >
                View All Projects
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};