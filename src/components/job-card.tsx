import React from "react";
import { Card, CardBody, Chip, Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

interface JobCardProps {
  job: any;
  isDarkMode?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({ job, isDarkMode = true }) => {
  const navigate = useNavigate();

  const formatBudget = () => {
    if (job.budgetType === 'fixed') {
      return `${job.budgetMin}`;
    }
    return `${job.budgetMin}-${job.budgetMax}/hr`;
  };

  return (
    <Card 
      isPressable
      onPress={() => navigate(`/jobs/${job.id}`)}
      className={isDarkMode ? 'glass-effect' : ''}
    >
      <CardBody>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-white line-clamp-2">{job.title}</h3>
          <Chip
            color="secondary"
            size="sm"
            variant="flat"
          >
            {formatBudget()}
          </Chip>
        </div>

        <p className="text-gray-400 text-sm line-clamp-3 mb-4">
          {job.description}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <Avatar
            src={job.clientPhotoURL || `https://i.pravatar.cc/150?u=${job.clientId}`}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-white">{job.clientName || 'Client'}</p>
            <div className="flex items-center gap-1">
              <Icon icon="lucide:star" className="text-yellow-500 text-xs" />
              <span className="text-xs text-gray-400">{job.clientRating || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills?.slice(0, 3).map((skill: string, index: number) => (
            <Chip
              key={index}
              size="sm"
              variant="flat"
              className="bg-white/10"
            >
              {skill}
            </Chip>
          ))}
          {job.skills?.length > 3 && (
            <Chip
              size="sm"
              variant="flat"
              className="bg-white/10"
            >
              +{job.skills.length - 3}
            </Chip>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Posted {job.postedAt || 'recently'}</span>
          <span>{job.proposalCount || 0} proposals</span>
        </div>
      </CardBody>
    </Card>
  );
};