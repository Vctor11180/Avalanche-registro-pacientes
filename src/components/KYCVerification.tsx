import React, { useState } from 'react';
import { UserCheck, FileText, Camera, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

interface KYCData {
  fullName: string;
  dateOfBirth: string;
  nationalId: string;
  email: string;
  phone: string;
  address: string;
  documentType: 'national_id' | 'passport' | 'drivers_license';
  documentNumber: string;
  documentImage: File | null;
  selfieImage: File | null;
}

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

const KYCVerification: React.FC = () => {
  const { user } = useWeb3();
  const [currentStep, setCurrentStep] = useState(0);
  const [kycData, setKycData] = useState<KYCData>({
    fullName: '',
    dateOfBirth: '',
    nationalId: '',
    email: '',
    phone: '',
    address: '',
    documentType: 'national_id',
    documentNumber: '',
    documentImage: null,
    selfieImage: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | 'submitted'>('pending');

  const verificationSteps: VerificationStep[] = [
    {
      id: 'personal_info',
      title: 'Información Personal',
      description: 'Datos básicos de identificación',
      completed: false,
      required: true
    },
    {
      id: 'document_verification',
      title: 'Verificación de Documento',
      description: 'Subir documento de identidad',
      completed: false,
      required: true
    },
    {
      id: 'selfie_verification',
      title: 'Verificación Facial',
      description: 'Foto de rostro para verificación',
      completed: false,
      required: true
    },
    {
      id: 'review_submit',
      title: 'Revisar y Enviar',
      description: 'Revisar información y enviar',
      completed: false,
      required: true
    }
  ];

  const handleInputChange = (field: keyof KYCData, value: string | File) => {
    setKycData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (field: 'documentImage' | 'selfieImage', file: File) => {
    // Validar tipo y tamaño de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert('Por favor, sube una imagen en formato JPEG, PNG o JPG');
      return;
    }

    if (file.size > maxSize) {
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    handleInputChange(field, file);
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Personal Info
        return !!(kycData.fullName && kycData.dateOfBirth && kycData.nationalId && kycData.email);
      case 1: // Document Verification
        return !!(kycData.documentType && kycData.documentNumber && kycData.documentImage);
      case 2: // Selfie Verification
        return !!kycData.selfieImage;
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < verificationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const { updateKYCStatus } = useWeb3();

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Simular envío de verificación KYC
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // En un sistema real, aquí se enviaría a un servicio de verificación
      setVerificationStatus('submitted');
      updateKYCStatus('submitted');
      
      // Simular verificación automática (en producción sería manual o con IA)
      setTimeout(() => {
        setVerificationStatus('approved');
        updateKYCStatus('approved');
      }, 3000);
      
    } catch (error) {
      console.error('Error en verificación KYC:', error);
      setVerificationStatus('rejected');
      updateKYCStatus('rejected');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={kycData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan Pérez García"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={kycData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de Identificación *
                </label>
                <input
                  type="text"
                  value={kycData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345678"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={kycData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="juan.perez@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={kycData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+34 600 123 456"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={kycData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Calle Mayor 123, Madrid"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  value={kycData.documentType}
                  onChange={(e) => handleInputChange('documentType', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="national_id">DNI / Cédula</option>
                  <option value="passport">Pasaporte</option>
                  <option value="drivers_license">Licencia de Conducir</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  value={kycData.documentNumber}
                  onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345678A"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Imagen del Documento *
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('documentImage', e.target.files[0])}
                  className="hidden"
                  id="document-upload"
                  required
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {kycData.documentImage ? (
                      <span className="text-green-600 dark:text-green-400">
                        ✓ {kycData.documentImage.name}
                      </span>
                    ) : (
                      'Haz clic para subir imagen del documento'
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos: JPG, PNG. Máximo 5MB
                  </p>
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Verificación Facial
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sube una foto de tu rostro para verificar tu identidad
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foto de Rostro *
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('selfieImage', e.target.files[0])}
                  className="hidden"
                  id="selfie-upload"
                  required
                />
                <label htmlFor="selfie-upload" className="cursor-pointer">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {kycData.selfieImage ? (
                      <span className="text-green-600 dark:text-green-400">
                        ✓ {kycData.selfieImage.name}
                      </span>
                    ) : (
                      'Haz clic para subir foto de rostro'
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Asegúrate de que tu rostro esté bien iluminado y visible
                  </p>
                </label>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Consejos para una buena foto:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Buena iluminación natural</li>
                    <li>Rostro centrado y visible</li>
                    <li>Sin gafas oscuras ni sombreros</li>
                    <li>Fondo neutro y simple</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Revisar Información
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Nombre:</p>
                  <p className="text-gray-900 dark:text-white">{kycData.fullName}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Fecha de Nacimiento:</p>
                  <p className="text-gray-900 dark:text-white">{kycData.dateOfBirth}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Email:</p>
                  <p className="text-gray-900 dark:text-white">{kycData.email}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Documento:</p>
                  <p className="text-gray-900 dark:text-white">{kycData.documentNumber}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Teléfono:</p>
                  <p className="text-gray-900 dark:text-white">{kycData.phone || 'No proporcionado'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Dirección:</p>
                  <p className="text-gray-900 dark:text-white">{kycData.address || 'No proporcionada'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <p className="font-medium mb-1">Importante:</p>
                  <p>Al enviar esta verificación, confirmas que toda la información proporcionada es verdadera y exacta. 
                  La verificación puede tomar hasta 24 horas.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />;
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />;
      case 'submitted':
        return <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <UserCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'approved':
        return {
          title: 'Verificación Aprobada',
          message: 'Tu identidad ha sido verificada exitosamente. Ya puedes proceder con el registro.',
          color: 'text-green-600 dark:text-green-400'
        };
      case 'rejected':
        return {
          title: 'Verificación Rechazada',
          message: 'Hubo un problema con la verificación. Por favor, intenta nuevamente.',
          color: 'text-red-600 dark:text-red-400'
        };
      case 'submitted':
        return {
          title: 'Verificación Enviada',
          message: 'Tu verificación está siendo procesada. Esto puede tomar hasta 24 horas.',
          color: 'text-yellow-600 dark:text-yellow-400'
        };
      default:
        return {
          title: 'Verificación de Identidad',
          message: 'Completa los pasos para verificar tu identidad antes del registro.',
          color: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  if (!user) {
    return (
      <div className="text-center text-gray-500">
        Conecta tu wallet para iniciar la verificación KYC
      </div>
    );
  }

  if (verificationStatus === 'approved') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="text-center">
          {getStatusIcon()}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
            {getStatusMessage().title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {getStatusMessage().message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continuar con el Registro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getStatusMessage().title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {getStatusMessage().message}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {verificationSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index <= currentStep
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < verificationSteps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Paso {currentStep + 1} de {verificationSteps.length}: {verificationSteps[currentStep].title}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        
        <div className="flex space-x-3">
          {currentStep === verificationSteps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !validateCurrentStep()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Verificación'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!validateCurrentStep()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;
