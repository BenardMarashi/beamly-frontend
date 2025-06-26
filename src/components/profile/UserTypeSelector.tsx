import React, { useState } from 'react';
import { RadioGroup, Radio, Button, Card, CardBody } from '@nextui-org/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const UserTypeSelector: React.FC = () => {
  const { user } = useAuth();
  const [userType, setUserType] = useState<string>('freelancer');
  const [loading, setLoading] = useState(false);

  const updateUserType = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        userType: userType,
        updatedAt: new Date()
      });
      
      toast.success('Account type updated successfully!');
    } catch (error) {
      console.error('Error updating user type:', error);
      toast.error('Failed to update account type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardBody className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Account Type</h3>
        <p className="text-gray-300 mb-4">
          Choose how you want to use Beamly:
        </p>
        
        <RadioGroup
          value={userType}
          onValueChange={setUserType}
          className="mb-6"
        >
          <Radio value="freelancer" description="Find work and offer services">
            Freelancer
          </Radio>
          <Radio value="client" description="Post jobs and hire freelancers">
            Client
          </Radio>
          <Radio value="both" description="Both post jobs and work as a freelancer">
            Both (Freelancer & Client)
          </Radio>
        </RadioGroup>
        
        <Button
          color="secondary"
          onPress={updateUserType}
          isLoading={loading}
          isDisabled={loading}
          className="w-full"
        >
          Update Account Type
        </Button>
      </CardBody>
    </Card>
  );
};