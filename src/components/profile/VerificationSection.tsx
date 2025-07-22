import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Select, SelectItem, Image, Chip } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { VerificationService } from '../../services/firebase-services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface VerificationSectionProps {
  userData: any;
}

export const VerificationSection: React.FC<VerificationSectionProps> = ({ userData }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState<'national_id' | 'passport' | 'driver_license'>('passport');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string>('');
  const [verification, setVerification] = useState<any>(null);

  const documentTypes = [
    { value: 'national_id', label: t('verification.nationalId') },
    { value: 'passport', label: t('verification.passport') },
    { value: 'driver_license', label: t('verification.driverLicense') }
  ];

  useEffect(() => {
    fetchVerificationStatus();
  }, [user]);

  const fetchVerificationStatus = async () => {
    if (!user) return;
    
    try {
      const result = await VerificationService.getUserVerification(user.uid);
      if (result.success && result.verification) {
        setVerification(result.verification);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('verification.invalidFileType'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('verification.fileTooLarge'));
      return;
    }

    setDocumentFile(file);
    setDocumentPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user || !documentFile) {
      toast.error(t('verification.selectDocument'));
      return;
    }

    setLoading(true);

    try {
      // Upload document to secure storage
      const timestamp = Date.now();
      const fileName = `verification_${user.uid}_${timestamp}_${documentFile.name}`;
      const storageRef = ref(storage, `verifications/${user.uid}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, documentFile);
      const documentUrl = await getDownloadURL(snapshot.ref);

      // Submit verification request
      const verificationData = {
        userId: user.uid,
        userEmail: user.email!,
        userName: userData?.displayName || 'Unknown',
        documentType,
        documentUrl
      };

      const result = await VerificationService.submitVerification(verificationData);
      
      if (result.success) {
        toast.success(t('verification.submitted'));
        setVerification(result.verificationId);
        setDocumentFile(null);
        setDocumentPreview('');
      } else {
        toast.error(t('verification.submitError'));
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error(t('verification.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'lucide:check-circle';
      case 'rejected': return 'lucide:x-circle';
      case 'pending': return 'lucide:clock';
      default: return 'lucide:help-circle';
    }
  };

  return (
    <Card className="glass-effect border-none">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{t('verification.title')}</h2>
          {userData?.isVerified && (
            <Chip
              startContent={<Icon icon="lucide:shield-check" />}
              color="success"
              variant="flat"
            >
              {t('verification.verified')}
            </Chip>
          )}
        </div>

        {verification ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Icon 
                  icon={getStatusIcon(verification.status)} 
                  className={`text-2xl ${
                    verification.status === 'approved' ? 'text-green-500' :
                    verification.status === 'rejected' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}
                />
                <div>
                  <p className="font-medium text-white">
                    {t(`verification.status.${verification.status}`)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {t('verification.documentType')}: {t(`verification.${verification.documentType}`)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {t('verification.submitted')}: {verification.submittedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </p>
                </div>
              </div>
              <Chip
                color={getStatusColor(verification.status)}
                variant="flat"
                size="sm"
              >
                {t(`verification.status.${verification.status}`)}
              </Chip>
            </div>

            {verification.status === 'rejected' && verification.rejectionReason && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <Icon icon="lucide:alert-circle" className="text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-400 mb-1">{t('verification.rejected')}</p>
                    <p className="text-sm text-gray-300">{verification.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {verification.status === 'rejected' && (
              <Button
                color="secondary"
                variant="flat"
                onPress={() => setVerification(null)}
                startContent={<Icon icon="lucide:refresh-cw" />}
              >
                {t('verification.resubmit')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <Icon icon="lucide:info" className="text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-400 mb-1">{t('verification.whyVerify')}</p>
                  <p className="text-sm text-gray-300">{t('verification.benefits')}</p>
                </div>
              </div>
            </div>

            <Select
              label={t('verification.selectDocumentType')}
              selectedKeys={[documentType]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as typeof documentType;
                setDocumentType(selected);
              }}
              variant="bordered"
              classNames={{
                trigger: "bg-gray-900/50 border-gray-600 text-white",
                value: "text-white",
                listbox: "bg-gray-900",
                popoverContent: "bg-gray-900",
              }}
            >
              {documentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload">
                <Button
                  as="span"
                  variant="bordered"
                  startContent={<Icon icon="lucide:upload" />}
                  className="cursor-pointer"
                >
                  {t('verification.uploadDocument')}
                </Button>
              </label>
            </div>

            {documentPreview && (
              <div className="relative">
                <Image
                  src={documentPreview}
                  alt="Document preview"
                  className="w-full max-w-md rounded-lg"
                />
                <Button
                  isIconOnly
                  color="danger"
                  variant="solid"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setDocumentFile(null);
                    setDocumentPreview('');
                  }}
                >
                  <Icon icon="lucide:x" />
                </Button>
              </div>
            )}

            {documentFile && (
              <Button
                color="secondary"
                size="lg"
                onPress={handleSubmit}
                isLoading={loading}
                startContent={<Icon icon="lucide:send" />}
              >
                {t('verification.submit')}
              </Button>
            )}

            <div className="text-sm text-gray-400">
              <p>{t('verification.requirements')}</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t('verification.requirement1')}</li>
                <li>{t('verification.requirement2')}</li>
                <li>{t('verification.requirement3')}</li>
              </ul>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};