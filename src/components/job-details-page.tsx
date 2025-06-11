import React from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Chip, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";

interface JobDetailsPageProps {
  setCurrentPage: (page: string) => void;
  isDarkMode?: boolean;
}

export const JobDetailsPage: React.FC<JobDetailsPageProps> = ({ setCurrentPage, isDarkMode = true }) => {
  const jobDetails = {
    title: "Senior UI Designer",
    company: "Apple Inc.",
    salary: "$55K - $80K",
    logo: "https://img.heroui.chat/image/ai?w=400&h=300&u=apple-logo",
    jobType: "Full time",
    location: "Remote",
    locationType: "Anywhere",
    description: "Apple is looking for a UI/UX Designer in Marketing to join our fast growing team. This role will report to the Director of UX and work alongside the marketing team to design experiences that help grow our business.",
    responsibilities: [
      "Collaborate with a cross-functional team to develop thoughtful design solutions that are beautiful and pixel-perfect",
      "Create visualizations, site maps, user flows, wireframes, low- to high-fidelity mockups, and prototypes and iterate on designs based on feedback",
      "Translate business requirements into elegant, intuitive, and simple designs",
      "Ensure consistency and quality in the user experience across all platforms",
      "Conduct user research and usability testing to validate design decisions"
    ],
    requirements: [
      "5+ years of experience in UI/UX design",
      "Strong portfolio demonstrating exceptional UI design skills",
      "Proficiency with design tools such as Figma, Sketch, Adobe XD",
      "Experience working in an agile environment",
      "Excellent communication and collaboration skills"
    ],
    benefits: [
      "Competitive salary and equity package",
      "Health, dental, and vision insurance",
      "Unlimited PTO",
      "Remote work flexibility",
      "Professional development budget"
    ],
    postedDate: "2 days ago",
    applicants: 24
  };

  return (
    <div className="min-h-[calc(100vh-64px)] pb-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        <Button
          variant="light"
          startContent={<Icon icon="lucide:arrow-left" />}
          onPress={() => {
            // Use window.history.back() instead of setCurrentPage
            window.history.back();
          }}
          className={isDarkMode ? "text-white" : "text-gray-800"}
        >
          Back
        </Button>
        
        <Card className={`glass-effect border-none mt-4 ${!isDarkMode && 'border border-gray-200'}`}>
          <CardBody className="p-4">
            <div className="flex items-center justify-center mb-4">
              <div className={`w-20 h-20 ${isDarkMode ? 'bg-white/10' : 'bg-gray-50'} rounded-xl flex items-center justify-center`}>
                <img 
                  src={jobDetails.logo} 
                  alt={jobDetails.company}
                  className="w-14 h-14 object-contain"
                />
              </div>
            </div>
            
            <div className="text-center mb-4">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{jobDetails.title}</h1>
              <p className="text-gray-300">{jobDetails.company}</p>
              <p className="text-beamly-secondary font-semibold mt-1">{jobDetails.salary}</p>
            </div>
            
            <div className="flex justify-center gap-2 mb-4">
              <Chip size="sm" className={isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"}>{jobDetails.jobType}</Chip>
              <Chip size="sm" className={isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"}>{jobDetails.location}</Chip>
              <Chip size="sm" className={isDarkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"}>{jobDetails.locationType}</Chip>
            </div>
            
            <div className="flex justify-between items-center mb-2 mt-4">
              <Button
                variant="light"
                className={isDarkMode ? "text-white" : "text-gray-800"}
                startContent={<Icon icon="lucide:bookmark" />}
                // Add safe click handler
                onPress={() => {
                  console.log("Save job button clicked");
                  // No navigation, just a log
                }}
              >
                Save
              </Button>
              <Button
                variant="light"
                className={isDarkMode ? "text-white" : "text-gray-800"}
                startContent={<Icon icon="lucide:share-2" />}
                // Add safe click handler
                onPress={() => {
                  console.log("Share job button clicked");
                  // No navigation, just a log
                }}
              >
                Share
              </Button>
              <Button
                color="secondary"
                className="text-beamly-third font-medium"
                // Replace setCurrentPage with safe click handler
                onPress={() => {
                  console.log("Apply for job button clicked");
                  // No navigation, just a log
                }}
              >
                Apply for Job
              </Button>
            </div>
          </CardBody>
        </Card>
        
        <div className="mt-4 flex gap-2">
          <Button
            color="secondary"
            variant="flat"
            className="flex-1 text-beamly-third font-medium"
            // Add safe click handler
            onPress={() => {
              console.log("Description tab clicked");
              // No navigation, just a log
            }}
          >
            Description
          </Button>
          <Button
            variant="flat"
            className={`flex-1 ${isDarkMode ? 'text-white bg-white/10' : 'text-gray-800 bg-gray-100'}`}
            // Add safe click handler
            onPress={() => {
              console.log("Company tab clicked");
              // No navigation, just a log
            }}
          >
            Company
          </Button>
        </div>
        
        <Card className={`glass-card border-none mt-4 ${!isDarkMode && 'border border-gray-200'}`}>
          <CardBody className="p-4">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>About the Opportunity</h2>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4`}>{jobDetails.description}</p>
            
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>Job Responsibilities</h2>
            <ul className={`list-disc pl-5 mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm space-y-1`}>
              {jobDetails.responsibilities.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>Requirements</h2>
            <ul className={`list-disc pl-5 mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm space-y-1`}>
              {jobDetails.requirements.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>Benefits</h2>
            <ul className={`list-disc pl-5 mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm space-y-1`}>
              {jobDetails.benefits.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            
            <Divider className={`my-4 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
            
            <div className="flex justify-between items-center">
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>Posted {jobDetails.postedDate}</p>
                <p>{jobDetails.applicants} applicants</p>
              </div>
              <Button
                color="secondary"
                className="text-beamly-third font-medium"
                // Replace setCurrentPage with safe click handler
                onPress={() => {
                  console.log("Apply Now button clicked");
                  // No navigation, just a log
                }}
              >
                Apply Now
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};