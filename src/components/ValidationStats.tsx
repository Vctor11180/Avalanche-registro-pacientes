import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Shield, Clock } from 'lucide-react';

interface ValidationStatsProps {
  totalPermissions: number;
  activePermissions: number;
  expiredPermissions: number;
  expiringSoonPermissions: number;
  duplicatePermissions: number;
}

const ValidationStats: React.FC<ValidationStatsProps> = ({
  totalPermissions,
  activePermissions,
  expiredPermissions,
  expiringSoonPermissions,
  duplicatePermissions
}) => {
  const getStatusColor = (type: 'active' | 'expired' | 'expiring' | 'duplicate') => {
    switch (type) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'expired':
        return 'text-red-600 dark:text-red-400';
      case 'expiring':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'duplicate':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (type: 'active' | 'expired' | 'expiring' | 'duplicate') => {
    switch (type) {
      case 'active':
        return <CheckCircle className="h-5 w-5" />;
      case 'expired':
        return <XCircle className="h-5 w-5" />;
      case 'expiring':
        return <AlertTriangle className="h-5 w-5" />;
      case 'duplicate':
        return <Shield className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Estadísticas de Validación
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className={`flex items-center justify-center mb-2 ${getStatusColor('active')}`}>
            {getStatusIcon('active')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {activePermissions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Activos
          </div>
        </div>

        <div className="text-center">
          <div className={`flex items-center justify-center mb-2 ${getStatusColor('expiring')}`}>
            {getStatusIcon('expiring')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {expiringSoonPermissions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Expiran Pronto
          </div>
        </div>

        <div className="text-center">
          <div className={`flex items-center justify-center mb-2 ${getStatusColor('expired')}`}>
            {getStatusIcon('expired')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {expiredPermissions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Expirados
          </div>
        </div>

        <div className="text-center">
          <div className={`flex items-center justify-center mb-2 ${getStatusColor('duplicate')}`}>
            {getStatusIcon('duplicate')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {duplicatePermissions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Duplicados
          </div>
        </div>
      </div>

      {/* Barra de progreso de salud */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Salud del Sistema
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round((activePermissions / totalPermissions) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(activePermissions / totalPermissions) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Alertas */}
      {(expiredPermissions > 0 || expiringSoonPermissions > 0 || duplicatePermissions > 0) && (
        <div className="mt-4 space-y-2">
          {expiredPermissions > 0 && (
            <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span>{expiredPermissions} permiso(s) expirado(s) requieren atención</span>
            </div>
          )}
          
          {expiringSoonPermissions > 0 && (
            <div className="flex items-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{expiringSoonPermissions} permiso(s) expiran pronto</span>
            </div>
          )}
          
          {duplicatePermissions > 0 && (
            <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
              <Shield className="h-4 w-4" />
              <span>{duplicatePermissions} permiso(s) duplicado(s) detectado(s)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationStats;
