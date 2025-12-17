import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const applicationSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['Male', 'Female', 'Other']),
    nationality: z.string().min(2, 'Nationality is required'),
    aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar number must be 12 digits'),
    phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
    email: z.string().email('Invalid email address'),
    address: z.object({
      street: z.string().min(5, 'Street address is required'),
      city: z.string().min(2, 'City is required'),
      state: z.string().min(2, 'State is required'),
      pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
      district: z.string().min(2, 'District is required')
    })
  }),
  educationalInfo: z.object({
    tenthBoard: z.string().min(2, '10th board is required'),
    tenthSchool: z.string().min(2, '10th school name is required'),
    tenthYear: z.string().regex(/^\d{4}$/, 'Year must be 4 digits'),
    tenthPercentage: z.number().min(0).max(100, 'Percentage must be between 0-100'),
    twelfthBoard: z.string().min(2, '12th board is required'),
    twelfthSchool: z.string().min(2, '12th school name is required'),
    twelfthYear: z.string().regex(/^\d{4}$/, 'Year must be 4 digits'),
    twelfthPercentage: z.number().min(0).max(100, 'Percentage must be between 0-100'),
    preferredStream: z.enum(['Engineering', 'Medical', 'Arts', 'Commerce', 'Science'])
  }),
  familyInfo: z.object({
    fatherName: z.string().min(2, 'Father name is required'),
    fatherOccupation: z.string().min(2, 'Father occupation is required'),
    fatherIncome: z.number().min(0, 'Income must be positive'),
    motherName: z.string().min(2, 'Mother name is required'),
    motherOccupation: z.string().min(2, 'Mother occupation is required'),
    motherIncome: z.number().min(0, 'Income must be positive'),
    siblings: z.number().min(0, 'Number of siblings must be positive'),
    familyType: z.enum(['Nuclear', 'Joint'])
  }),
  financialInfo: z.object({
    annualFamilyIncome: z.number().min(0, 'Annual income must be positive'),
    bankDetails: z.object({
      accountNumber: z.string().min(8, 'Account number must be at least 8 digits'),
      ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
      bankName: z.string().min(2, 'Bank name is required'),
      branchName: z.string().min(2, 'Branch name is required')
    })
  })
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  onSubmit: (data: ApplicationFormData) => void;
  isLoading?: boolean;
}

type StepFieldName = keyof ApplicationFormData;

const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSubmit, isLoading = false }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    mode: 'onChange'
  });

  const steps = [
    'personalInfo.title',
    'educationalInfo.title',
    'familyInfo.title',
    'financialInfo.title',
    'documents.title'
  ];

  const handleFileUpload = (fieldName: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  const onSubmitForm = async (data: ApplicationFormData) => {
    const formData = new FormData();
    
    // Add form data
    formData.append('applicationData', JSON.stringify(data));
    
    // Add uploaded files
    Object.entries(uploadedFiles).forEach(([fieldName, file]) => {
      formData.append(fieldName, file);
    });

    onSubmit(data);
  };

  const nextStep = async () => {
    const stepFields = getStepFields(currentStep);
    const isValid = await trigger(stepFields as StepFieldName[]);
    
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepFields = (step: number): StepFieldName[] => {
    switch (step) {
      case 0:
        return ['personalInfo'];
      case 1:
        return ['educationalInfo'];
      case 2:
        return ['familyInfo'];
      case 3:
        return ['financialInfo'];
      default:
        return [];
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('application.personalInfo.title')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.personalInfo.fullName')} *
                </label>
                <input
                  {...register('personalInfo.fullName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('application.personalInfo.fullName')}
                />
                {errors.personalInfo?.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.personalInfo.dateOfBirth')} *
                </label>
                <input
                  {...register('personalInfo.dateOfBirth')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.personalInfo?.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.personalInfo.gender')} *
                </label>
                <select
                  {...register('personalInfo.gender')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('common.select')}</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.personalInfo?.gender && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.gender.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.personalInfo.phone')} *
                </label>
                <input
                  {...register('personalInfo.phone')}
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234567890"
                />
                {errors.personalInfo?.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.personalInfo.email')} *
                </label>
                <input
                  {...register('personalInfo.email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="student@example.com"
                />
                {errors.personalInfo?.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.personalInfo.aadharNumber')} *
                </label>
                <input
                  {...register('personalInfo.aadharNumber')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234 5678 9012"
                />
                {errors.personalInfo?.aadharNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.aadharNumber.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.personalInfo.address.street')} *
                </label>
                <textarea
                  {...register('personalInfo.address.street')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address, landmark"
                />
                {errors.personalInfo?.address?.street && (
                  <p className="text-red-500 text-xs mt-1">{errors.personalInfo.address.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.personalInfo.address.city')} *
                  </label>
                  <input
                    {...register('personalInfo.address.city')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                  {errors.personalInfo?.address?.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.personalInfo.address.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.personalInfo.address.district')} *
                  </label>
                  <input
                    {...register('personalInfo.address.district')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="District"
                  />
                  {errors.personalInfo?.address?.district && (
                    <p className="text-red-500 text-xs mt-1">{errors.personalInfo.address.district.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.personalInfo.address.state')} *
                  </label>
                  <input
                    {...register('personalInfo.address.state')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                  />
                  {errors.personalInfo?.address?.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.personalInfo.address.state.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.personalInfo.address.pincode')} *
                  </label>
                  <input
                    {...register('personalInfo.address.pincode')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123456"
                  />
                  {errors.personalInfo?.address?.pincode && (
                    <p className="text-red-500 text-xs mt-1">{errors.personalInfo.address.pincode.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('application.educationalInfo.title')}</h3>
            
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">10th Standard</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.educationalInfo.tenthBoard')} *
                  </label>
                  <input
                    {...register('educationalInfo.tenthBoard')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CBSE, State Board, etc."
                  />
                  {errors.educationalInfo?.tenthBoard && (
                    <p className="text-red-500 text-xs mt-1">{errors.educationalInfo.tenthBoard.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.educationalInfo.tenthSchool')} *
                  </label>
                  <input
                    {...register('educationalInfo.tenthSchool')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="School name"
                  />
                  {errors.educationalInfo?.tenthSchool && (
                    <p className="text-red-500 text-xs mt-1">{errors.educationalInfo.tenthSchool.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.educationalInfo.tenthYear')} *
                  </label>
                  <input
                    {...register('educationalInfo.tenthYear')}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2023"
                  />
                  {errors.educationalInfo?.tenthYear && (
                    <p className="text-red-500 text-xs mt-1">{errors.educationalInfo.tenthYear.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.educationalInfo.tenthPercentage')} *
                  </label>
                  <input
                    {...register('educationalInfo.tenthPercentage', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="85.50"
                  />
                  {errors.educationalInfo?.tenthPercentage && (
                    <p className="text-red-500 text-xs mt-1">{errors.educationalInfo.tenthPercentage.message}</p>
                  )}
                </div>
              </div>

              <h4 className="text-md font-medium text-gray-800">12th Standard</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.educationalInfo.twelfthBoard')} *
                  </label>
                  <input
                    {...register('educationalInfo.twelfthBoard')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CBSE, State Board, etc."
                  />
                  {errors.educationalInfo?.twelfthBoard && (
                    <p className="text-red-500 text-xs mt-1">{errors.educationalInfo.twelfthBoard.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.educationalInfo.twelfthSchool')} *
                  </label>
                  <input
                    {...register('educationalInfo.twelfthSchool')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="School name"
                  />
                  {errors.educationalInfo?.twelfthSchool && (
                    <p className="text-red-500 text-xs mt-1">{errors.educationalInfo.twelfthSchool.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.educationalInfo.twelfthYear')} *
                  </label>
                  <input
                    {...register('educationalInfo.twelfthYear')}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2025"
                  />
                  {errors.educationalInfo?.twelfthYear && (
                    <p className="text-red-500 text-xs mt-1">{errors.educationalInfo.twelfthYear.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.educationalInfo.twelfthPercentage')} *
                  </label>
                  <input
                    {...register('educationalInfo.twelfthPercentage', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="88.75"
                  />
                  {errors.educationalInfo?.twelfthPercentage && (
                    <p className="text-red-500 text-xs mt-1">{errors.educationalInfo.twelfthPercentage.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.educationalInfo.preferredStream')} *
                </label>
                <select
                  {...register('educationalInfo.preferredStream')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('common.select')}</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Medical">Medical</option>
                  <option value="Arts">Arts</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Science">Science</option>
                </select>
                {errors.educationalInfo?.preferredStream && (
                  <p className="text-red-500 text-xs mt-1">{errors.educationalInfo.preferredStream.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('application.familyInfo.title')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.familyInfo.fatherName')} *
                </label>
                <input
                  {...register('familyInfo.fatherName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Father's full name"
                />
                {errors.familyInfo?.fatherName && (
                  <p className="text-red-500 text-xs mt-1">{errors.familyInfo.fatherName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.familyInfo.fatherOccupation')} *
                </label>
                <input
                  {...register('familyInfo.fatherOccupation')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Father's occupation"
                />
                {errors.familyInfo?.fatherOccupation && (
                  <p className="text-red-500 text-xs mt-1">{errors.familyInfo.fatherOccupation.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.familyInfo.fatherIncome')} (₹) *
                </label>
                <input
                  {...register('familyInfo.fatherIncome', { valueAsNumber: true })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Annual income"
                />
                {errors.familyInfo?.fatherIncome && (
                  <p className="text-red-500 text-xs mt-1">{errors.familyInfo.fatherIncome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.familyInfo.motherName')} *
                </label>
                <input
                  {...register('familyInfo.motherName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mother's full name"
                />
                {errors.familyInfo?.motherName && (
                  <p className="text-red-500 text-xs mt-1">{errors.familyInfo.motherName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.familyInfo.motherOccupation')} *
                </label>
                <input
                  {...register('familyInfo.motherOccupation')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mother's occupation"
                />
                {errors.familyInfo?.motherOccupation && (
                  <p className="text-red-500 text-xs mt-1">{errors.familyInfo.motherOccupation.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.familyInfo.motherIncome')} (₹) *
                </label>
                <input
                  {...register('familyInfo.motherIncome', { valueAsNumber: true })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Annual income"
                />
                {errors.familyInfo?.motherIncome && (
                  <p className="text-red-500 text-xs mt-1">{errors.familyInfo.motherIncome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.familyInfo.siblings')} *
                </label>
                <input
                  {...register('familyInfo.siblings', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number of siblings"
                />
                {errors.familyInfo?.siblings && (
                  <p className="text-red-500 text-xs mt-1">{errors.familyInfo.siblings.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.familyInfo.familyType')} *
                </label>
                <select
                  {...register('familyInfo.familyType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('common.select')}</option>
                  <option value="Nuclear">Nuclear</option>
                  <option value="Joint">Joint</option>
                </select>
                {errors.familyInfo?.familyType && (
                  <p className="text-red-500 text-xs mt-1">{errors.familyInfo.familyType.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('application.financialInfo.title')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('application.financialInfo.annualFamilyIncome')} (₹) *
                </label>
                <input
                  {...register('financialInfo.annualFamilyIncome', { valueAsNumber: true })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Total annual family income"
                />
                {errors.financialInfo?.annualFamilyIncome && (
                  <p className="text-red-500 text-xs mt-1">{errors.financialInfo.annualFamilyIncome.message}</p>
                )}
              </div>

              <h4 className="text-md font-medium text-gray-800">Bank Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.financialInfo.bankDetails.accountNumber')} *
                  </label>
                  <input
                    {...register('financialInfo.bankDetails.accountNumber')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Bank account number"
                  />
                  {errors.financialInfo?.bankDetails?.accountNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.financialInfo.bankDetails.accountNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.financialInfo.bankDetails.ifscCode')} *
                  </label>
                  <input
                    {...register('financialInfo.bankDetails.ifscCode')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ABCD0123456"
                  />
                  {errors.financialInfo?.bankDetails?.ifscCode && (
                    <p className="text-red-500 text-xs mt-1">{errors.financialInfo.bankDetails.ifscCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.financialInfo.bankDetails.bankName')} *
                  </label>
                  <input
                    {...register('financialInfo.bankDetails.bankName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Bank name"
                  />
                  {errors.financialInfo?.bankDetails?.bankName && (
                    <p className="text-red-500 text-xs mt-1">{errors.financialInfo.bankDetails.bankName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('application.financialInfo.bankDetails.branchName')} *
                  </label>
                  <input
                    {...register('financialInfo.bankDetails.branchName')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Branch name"
                  />
                  {errors.financialInfo?.bankDetails?.branchName && (
                    <p className="text-red-500 text-xs mt-1">{errors.financialInfo.bankDetails.branchName.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('application.documents.title')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.documents.photo')} *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('photo', e.target.files[0])}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="text-gray-600">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Click to upload photo</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                      </div>
                    </label>
                    {uploadedFiles.photo && (
                      <p className="mt-2 text-sm text-green-600">✓ {uploadedFiles.photo.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.documents.signature')} *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('signature', e.target.files[0])}
                      className="hidden"
                      id="signature-upload"
                    />
                    <label htmlFor="signature-upload" className="cursor-pointer">
                      <div className="text-gray-600">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Click to upload signature</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                      </div>
                    </label>
                    {uploadedFiles.signature && (
                      <p className="mt-2 text-sm text-green-600">✓ {uploadedFiles.signature.name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.documents.tenthMarksheet')} *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('tenthMarksheet', e.target.files[0])}
                      className="hidden"
                      id="tenth-marksheet-upload"
                    />
                    <label htmlFor="tenth-marksheet-upload" className="cursor-pointer">
                      <div className="text-gray-600">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Click to upload 10th marksheet</p>
                        <p className="text-xs text-gray-400">PDF, JPG, PNG up to 5MB</p>
                      </div>
                    </label>
                    {uploadedFiles.tenthMarksheet && (
                      <p className="mt-2 text-sm text-green-600">✓ {uploadedFiles.tenthMarksheet.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('application.documents.twelfthMarksheet')} *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('twelfthMarksheet', e.target.files[0])}
                      className="hidden"
                      id="twelfth-marksheet-upload"
                    />
                    <label htmlFor="twelfth-marksheet-upload" className="cursor-pointer">
                      <div className="text-gray-600">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">Click to upload 12th marksheet</p>
                        <p className="text-xs text-gray-400">PDF, JPG, PNG up to 5MB</p>
                      </div>
                    </label>
                    {uploadedFiles.twelfthMarksheet && (
                      <p className="mt-2 text-sm text-green-600">✓ {uploadedFiles.twelfthMarksheet.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Additional Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Income Certificate
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('incomeCertificate', e.target.files[0])}
                      className="hidden"
                      id="income-certificate-upload"
                    />
                    <label htmlFor="income-certificate-upload" className="cursor-pointer text-sm text-gray-600">
                      Click to upload
                    </label>
                    {uploadedFiles.incomeCertificate && (
                      <p className="mt-1 text-xs text-green-600">✓ {uploadedFiles.incomeCertificate.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Community Certificate
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('communityCertificate', e.target.files[0])}
                      className="hidden"
                      id="community-certificate-upload"
                    />
                    <label htmlFor="community-certificate-upload" className="cursor-pointer text-sm text-gray-600">
                      Click to upload
                    </label>
                    {uploadedFiles.communityCertificate && (
                      <p className="mt-1 text-xs text-green-600">✓ {uploadedFiles.communityCertificate.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('application.title')}</h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">{t('application.success.message')}</p>
          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          {renderStepContent()}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-2 rounded-md font-medium ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('common.cancel')}
          </button>

          <div className="space-x-3">
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-medium"
              >
                {isLoading ? t('common.loading') : t('application.submit')}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;