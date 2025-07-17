// Create src/components/forms/FormWrapper.tsx
import React from 'react';
import { Card, CardBody } from '@nextui-org/react';
import { motion } from 'framer-motion';

interface FormWrapperProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormWrapper: React.FC<FormWrapperProps> = ({
  title,
  subtitle,
  children,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`form-container ${className}`}
    >
      <Card className="glass-form border-none">
        <CardBody className="p-6 md:p-8">
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">{title}</h2>
              {subtitle && (
                <p className="text-gray-400 mt-2">{subtitle}</p>
              )}
            </div>
          )}
          <div className="form-field-group">
            {children}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

// Form Field Group Component for consistent spacing
interface FormFieldGroupProps {
  children: React.ReactNode;
  columns?: 1 | 2;
}

export const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  children,
  columns = 1
}) => {
  return (
    <div className={`form-grid ${columns === 2 ? 'form-grid-2' : ''}`}>
      {children}
    </div>
  );
};

// Form Actions Component for consistent button placement
interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'space-between';
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = 'right'
}) => {
  const alignmentClass = align === 'space-between' ? 'space-between' : align;
  
  return (
    <div className={`form-actions ${alignmentClass}`}>
      {children}
    </div>
  );
};