import React from 'react';
import { Card, CardBody, Chip } from '@nextui-org/react';
import { Icon } from '@iconify/react';

interface AccountTypeDisplayProps {
  userType: string;
}

export const AccountTypeDisplay: React.FC<AccountTypeDisplayProps> = ({ userType }) => {
  const getAccountTypeInfo = () => {
    switch (userType) {
      case 'freelancer':
        return {
          label: 'Freelancer',
          description: 'You can find work and offer services to clients',
          icon: 'solar:case-round-bold',
          color: 'primary' as const,
        };
      case 'client':
        return {
          label: 'Client',
          description: 'You can post jobs and hire talented freelancers',
          icon: 'solar:buildings-bold',
          color: 'secondary' as const,
        };
      case 'both':
        return {
          label: 'Freelancer & Client',
          description: 'You can both post jobs and work as a freelancer',
          icon: 'solar:user-hands-bold',
          color: 'success' as const,
        };
      default:
        return {
          label: 'Unknown',
          description: 'Account type not set',
          icon: 'solar:question-circle-bold',
          color: 'default' as const,
        };
    }
  };

  const accountInfo = getAccountTypeInfo();

  return (
    <Card className="glass-card">
      <CardBody className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon icon={accountInfo.icon} className="text-2xl text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-white">
                {accountInfo.label}
              </h3>
              <Chip color={accountInfo.color} size="sm" variant="flat">
                Active
              </Chip>
            </div>
            <p className="text-gray-300 text-sm">
              {accountInfo.description}
            </p>
            
            {userType === 'freelancer' && (
              <div className="mt-4 p-3 bg-warning/10 rounded-lg">
                <p className="text-sm text-warning flex items-start gap-2">
                  <Icon icon="solar:info-circle-bold" className="text-lg mt-0.5" />
                  <span>
                    Your account type is set to Freelancer. This cannot be changed to maintain platform integrity.
                    If you need to hire freelancers, please create a separate client account.
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};