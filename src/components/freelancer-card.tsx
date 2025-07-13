import React from "react";
import { Card, CardBody, Chip, Avatar, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

interface FreelancerCardProps {
  freelancer: any;
  isDarkMode?: boolean;
}

export const FreelancerCard: React.FC<FreelancerCardProps> = ({ freelancer, isDarkMode = true }) => {
  const navigate = useNavigate();

  return (
    <Card 
      isPressable
      onPress={() => navigate(`/freelancer/${freelancer.id}`)}
      className={isDarkMode ? 'glass-effect' : ''}
    >
      <CardBody>
        <div className="flex items-start gap-4">
          <Avatar
            src={freelancer.photoURL || `https://i.pravatar.cc/150?u=${freelancer.id}`}
            size="lg"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{freelancer.displayName || 'Freelancer'}</h3>
            <p className="text-sm text-gray-400">{freelancer.title || 'Professional Freelancer'}</p>
            
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Icon icon="lucide:star" className="text-yellow-500 text-sm" />
                <span className="text-sm text-white">{freelancer.rating || 0}</span>
              </div>
              <span className="text-sm text-gray-400">
                {freelancer.completedJobs || 0} jobs completed
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-semibold text-white">
              ${freelancer.hourlyRate || 0}/hr
            </p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mt-4 line-clamp-2">
          {freelancer.bio || 'Experienced professional ready to help with your project.'}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          {freelancer.skills?.slice(0, 4).map((skill: string, index: number) => (
            <Chip
              key={index}
              size="sm"
              variant="flat"
              className="bg-white/10"
            >
              {skill}
            </Chip>
          ))}
          {freelancer.skills?.length > 4 && (
            <Chip
              size="sm"
              variant="flat"
              className="bg-white/10"
            >
              +{freelancer.skills.length - 4}
            </Chip>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            color="secondary"
            className="flex-1"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigate(`/freelancer/${freelancer.id}`);
            }}
          >
            View Profile
          </Button>
          <Button
            size="sm"
            variant="bordered"
            className="flex-1"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigate(`/chat?user=${freelancer.id}`);
            }}
          >
            Message
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};