import React, { useState, useEffect } from 'react';
import { Card, CardBody, RadioGroup, Radio, Button } from '@nextui-org/react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Icon } from '@iconify/react';

export const UserTypeUpdater: React.FC = () => {
  const { user } = useAuth();
  const [currentUserType, setCurrentUserType] = useState<string>('');
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserType();
    }
  }, [user]);

  const fetchUserType = async () => {
    if (!user) return;
    
    setFetching(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userType = userData.userType || 'both';
        setCurrentUserType(userType);
        setSelectedUserType(userType);
      }
    } catch (error) {
      console.error('Error fetching user type:', error);
      toast.error('Failed to load account type');
    } finally {
      setFetching(false);
    }
  };

  const updateUserType = async () => {
    if (!user || selectedUserType === currentUserType) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        userType: selectedUserType,
        updatedAt: serverTimestamp()
      });
      
      setCurrentUserType(selectedUserType);
      toast.success('Account type updated successfully!');
      
      // Reload the page to reflect changes in navigation
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating user type:', error);
      toast.error('Failed to update account type');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card className="glass-card">
        <CardBody className="p-6">
          <div className="flex items-center justify-center py-8">
            <Icon icon="svg-spinners:12-dots-scale-rotate" className="text-4xl text-primary" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardBody className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Icon icon="solar:user-id-bold" className="text-primary" />
          Account Type
        </h3>
        
        <p className="text-gray-300 mb-6">
          Choose how you want to use Beamly. This determines what features you can access.
        </p>
        
        <RadioGroup
          value={selectedUserType}
          onValueChange={setSelectedUserType}
          className="mb-6"
        >
          <Radio 
            value="freelancer" 
            description="Find work and offer your services to clients"
            classNames={{
              base: "max-w-full",
              label: "text-white",
              description: "text-gray-400"
            }}
          >
            <div className="flex items-center gap-2">
              <Icon icon="solar:case-round-bold" className="text-lg" />
              Freelancer
            </div>
          </Radio>
          
          <Radio 
            value="client" 
            description="Post jobs and hire talented freelancers"
            classNames={{
              base: "max-w-full",
              label: "text-white",
              description: "text-gray-400"
            }}
          >
            <div className="flex items-center gap-2">
              <Icon icon="solar:buildings-bold" className="text-lg" />
              Client
            </div>
          </Radio>
          
          <Radio 
            value="both" 
            description="Switch between posting jobs and working as a freelancer"
            classNames={{
              base: "max-w-full",
              label: "text-white",
              description: "text-gray-400"
            }}
          >
            <div className="flex items-center gap-2">
              <Icon icon="solar:user-hands-bold" className="text-lg" />
              Both (Freelancer & Client)
            </div>
          </Radio>
        </RadioGroup>
        
        {currentUserType && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-gray-300">
              Current account type: <span className="font-semibold text-primary">{
                currentUserType === 'freelancer' ? 'Freelancer' :
                currentUserType === 'client' ? 'Client' :
                'Both (Freelancer & Client)'
              }</span>
            </p>
          </div>
        )}
        
        <Button
          color="primary"
          onPress={updateUserType}
          isLoading={loading}
          isDisabled={loading || selectedUserType === currentUserType}
          className="w-full"
          size="lg"
        >
          {selectedUserType === currentUserType ? 'No Changes' : 'Update Account Type'}
        </Button>
        
        <div className="mt-4 p-4 bg-warning/10 rounded-lg">
          <p className="text-sm text-warning flex items-start gap-2">
            <Icon icon="solar:info-circle-bold" className="text-lg mt-0.5" />
            <span>
              Changing your account type will update what features you can access. 
              You can change this anytime from your settings.
            </span>
          </p>
        </div>
      </CardBody>
    </Card>
  );
};