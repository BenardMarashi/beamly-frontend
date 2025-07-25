import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardBody, 
  Input, 
  Textarea, 
  Button, 
  Avatar,
  Select,
  SelectItem,
  Chip,
  Progress
} from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { PageHeader } from "./page-header";

interface ProfileManagementPageProps {
  isDarkMode?: boolean;
}

interface ProfileData {
  displayName: string;
  bio: string;
  skills: string[];
  hourlyRate: number;
  location: string;
  experienceLevel: string;
  portfolio: string;
  languages: string[];
}

export const ProfileManagementPage: React.FC<ProfileManagementPageProps> = ({
  isDarkMode: _isDarkMode = true
}) => {
  // Note: isDarkMode is passed from parent but we're using theme context
  // This prop is kept for backward compatibility but not used internally
  
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: "",
    bio: "",
    skills: [],
    hourlyRate: 0,
    location: "",
    experienceLevel: "intermediate",
    portfolio: "",
    languages: ["English"]
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  useEffect(() => {
    calculateProfileCompletion();
  }, [profileData]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData({
          displayName: data.displayName || "",
          bio: data.bio || "",
          skills: data.skills || [],
          hourlyRate: data.hourlyRate || 0,
          location: data.location || "",
          experienceLevel: data.experienceLevel || "intermediate",
          portfolio: data.portfolio || "",
          languages: data.languages || ["English"]
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const calculateProfileCompletion = () => {
    const fields = [
      profileData.displayName,
      profileData.bio,
      profileData.skills.length > 0,
      profileData.hourlyRate > 0,
      profileData.location,
      profileData.portfolio
    ];
    
    const completedFields = fields.filter(field => field).length;
    const completion = Math.round((completedFields / fields.length) * 100);
    setProfileCompletion(completion);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...profileData,
        updatedAt: new Date()
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill && !profileData.skills.includes(newSkill)) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill]
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Profile Management"
        subtitle="Complete your profile to attract more clients"
      />

      {/* Profile Completion */}
      <Card className="glass-effect mb-6">
        <CardBody className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Profile Completion</h3>
            <span className="text-2xl font-bold text-beamly-secondary">{profileCompletion}%</span>
          </div>
          <Progress 
            value={profileCompletion} 
            color={profileCompletion === 100 ? "success" : "warning"}
            className="mb-2"
          />
          <p className="text-sm text-gray-400">
            {profileCompletion === 100 
              ? "Great! Your profile is complete."
              : "Complete your profile to increase visibility and attract more clients."}
          </p>
        </CardBody>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass-effect">
          <CardBody className="p-8">
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <Avatar
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${profileData.displayName}&background=0F43EE&color=fff`}
                  className="w-24 h-24"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Profile Picture</h3>
                  <Button
                    variant="flat"
                    color="primary"
                    startContent={<Icon icon="lucide:upload" />}
                  >
                    Upload New Photo
                  </Button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Display Name"
                  placeholder="Enter your display name"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  variant="bordered"
                  classNames={{
                    inputWrapper: "bg-white/5"
                  }}
                />
              </div>

              {/* Bio */}
              <Textarea
                label="Professional Bio"
                placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                variant="bordered"
                minRows={4}
                classNames={{
                  inputWrapper: "bg-white/5"
                }}
              />

              {/* Professional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="number"
                  label="Hourly Rate (USD)"
                  placeholder="0"
                  value={profileData.hourlyRate.toString()}
                  onChange={(e) => setProfileData({ ...profileData, hourlyRate: parseInt(e.target.value) || 0 })}
                  variant="bordered"
                  classNames={{
                    inputWrapper: "bg-white/5"
                  }}
                  startContent={<Icon icon="lucide:dollar-sign" />}
                />
                
                <Select
                  label="Experience Level"
                  selectedKeys={[profileData.experienceLevel]}
                  onChange={(e) => setProfileData({ ...profileData, experienceLevel: e.target.value })}
                  variant="bordered"
                  classNames={{
                    trigger: "bg-gray-900/50 border-gray-600 text-white",
                    value: "text-white",
                    listbox: "bg-gray-900",
                    popoverContent: "bg-gray-900",
                  }}
                >
                  <SelectItem key="entry" value="entry">Entry Level</SelectItem>
                  <SelectItem key="intermediate" value="intermediate">Intermediate</SelectItem>
                  <SelectItem key="expert" value="expert">Expert</SelectItem>
                </Select>
              </div>

              {/* Skills */}
              <div>
                <label className="text-white font-medium mb-2 block">Skills</label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "bg-white/5"
                    }}
                  />
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={addSkill}
                    isIconOnly
                  >
                    <Icon icon="lucide:plus" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill) => (
                    <Chip
                      key={skill}
                      onClose={() => removeSkill(skill)}
                      variant="flat"
                      color="primary"
                    >
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Portfolio */}
              <Input
                label="Portfolio URL"
                placeholder="https://your-portfolio.com"
                value={profileData.portfolio}
                onChange={(e) => setProfileData({ ...profileData, portfolio: e.target.value })}
                variant="bordered"
                classNames={{
                  inputWrapper: "bg-white/5"
                }}
                startContent={<Icon icon="lucide:link" />}
              />

              {/* Save Button */}
              <div className="flex justify-end gap-4">
                <Button variant="flat">
                  Cancel
                </Button>
                <Button
                  color="secondary"
                  className="text-beamly-third"
                  onPress={handleUpdateProfile}
                  isLoading={loading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};