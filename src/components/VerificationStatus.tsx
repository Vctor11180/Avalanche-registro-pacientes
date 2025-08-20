import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, UserCheck } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

interface VerificationStatusProps {
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  onRetry?: () => void;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({ status, onRetry }) => {
  const { user } = useWeb3();

  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />,
          title: 'Verificación Aprobada',
          message: 'Tu identidad ha sido verificada exitosamente. Ya puedes usar todas las funcionalidades del sistema.',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/30',
          borderColor: 'border-green-200 dark:border-green-700'
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />,
          title: 'Verificación Rechazada',
          message: 'Hubo un problema con tu verificación. Por favor, revisa la información y vuelve a intentar.',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/30',
          borderColor: 'border-red-200 dark:border-red-700'
        };
      case 'submitted':
        return {
          icon: <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />,
          title: 'Verificación en Proceso',
          message: 'Tu verificación está siendo procesada. Esto puede tomar hasta 24 horas. Te notificaremos cuando esté lista.',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-200 dark:border-yellow-700'
        };
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />,
          title: 'Verificación Pendiente',
          message: 'Necesitas completar la verificación de identidad antes de poder usar el sistema.',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/30',
          borderColor: 'border-blue-200 dark:border-blue-700'
        };
    }
  };

  const config = getStatusConfig();

  if (!user) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          Conecta tu wallet para ver tu estado de verificación
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <UserCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Estado de Verificación</h2>
            <p className="text-gray-600 dark:text-gray-400">Estado actual de tu verificación KYC</p>
          </div>
        </div>
      </div>

      {/* Status Display */}
      <div className="p-6">
        <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-6 text-center`}>
          {config.icon}
          <h3 className={`text-lg font-semibold mt-4 ${config.color}`}>
            {config.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
            {config.message}
          </p>
        </div>

        {/* User Info */}
        <div className="mt-6 bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Información del Usuario</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Dirección de Wallet:</p>
              <p className="font-mono text-gray-900 dark:text-white break-all">
                {user.address}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Red:</p>
              <p className="text-gray-900 dark:text-white">Arbitrum Sepolia</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center space-x-4">
          {status === 'rejected' && onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar Nuevamente
            </button>
          )}
          
          {status === 'approved' && (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continuar
            </button>
          )}
          
          {status === 'pending' && (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Verificación
            </button>
          )}
        </div>

        {/* Additional Info */}
        {status === 'submitted' && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">¿Qué pasa durante la verificación?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Revisamos la autenticidad de tus documentos</li>
                  <li>Verificamos que la información sea consistente</li>
                  <li>Confirmamos que eres una persona real</li>
                  <li>Validamos que no haya duplicados en el sistema</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-medium mb-1">Posibles razones del rechazo:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Documentos ilegibles o de baja calidad</li>
                  <li>Información inconsistente entre documentos</li>
                  <li>Documentos ya registrados en el sistema</li>
                  <li>Información personal incorrecta</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationStatus;
