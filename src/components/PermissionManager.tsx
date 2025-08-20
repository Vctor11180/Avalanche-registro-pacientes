import React, { useState, useEffect, useCallback } from 'react';
import { Shield, User, Building, Check, X, Clock, Search } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { PermissionType, EntityType, PermissionScope, PERMISSION_TYPE_LABELS, ENTITY_TYPE_LABELS, PERMISSION_SCOPE_LABELS } from '../config/contracts';
import DocumentSelector from './DocumentSelector';
import AddressInfo from './AddressInfo';
import ValidationStats from './ValidationStats';
import { ethers } from 'ethers';

interface Permission {
  entity: string;
  entityType: EntityType;
  permissionType: PermissionType;
  permissionScope: PermissionScope;
  documentIds: number[];
  purpose: string;
  expirationTime: number;
  isActive: boolean;
  timestamp: number;
}

const PermissionManager: React.FC = () => {
  const { user, contracts, provider } = useWeb3();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPermission, setNewPermission] = useState({
    entity: '',
    entityType: EntityType.DOCTOR,
    permissionType: PermissionType.READ,
    permissionScope: PermissionScope.ALL_DOCUMENTS,
    documentIds: [] as number[],
    purpose: '',
    duration: 7 // días
  });
  const [addressError, setAddressError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    entity: string;
    entityType: string;
    permissionType: string;
    purpose: string;
    duration: string;
    general: string;
  }>({
    entity: '',
    entityType: '',
    permissionType: '',
    purpose: '',
    duration: '',
    general: ''
  });
  const [isValidating, setIsValidating] = useState(false);

  const loadPermissions = useCallback(async () => {
    if (!contracts.accessControl) return;
    
    setLoading(true);
    try {
      // En un sistema real, implementarías eventos para obtener todos los permisos
      // Por ahora simulamos algunos permisos
      const mockPermissions: Permission[] = [
        {
          entity: '0xDoctor123...456',
          entityType: EntityType.DOCTOR,
          permissionType: PermissionType.READ,
          permissionScope: PermissionScope.SPECIFIC_DOCUMENTS,
          documentIds: [1, 2, 3],
          purpose: 'Consulta médica de rutina',
          expirationTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
          isActive: true,
          timestamp: Date.now() - 86400000
        },
        {
          entity: '0xInsurance789...012',
          entityType: EntityType.INSURANCE,
          permissionType: PermissionType.READ,
          permissionScope: PermissionScope.ALL_DOCUMENTS,
          documentIds: [],
          purpose: 'Evaluación de cobertura de seguro',
          expirationTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
          isActive: true,
          timestamp: Date.now() - 172800000
        }
      ];
      
      setPermissions(mockPermissions);
    } catch (error) {
      console.error('Error cargando permisos:', error);
    } finally {
      setLoading(false);
    }
  }, [contracts.accessControl]);

  useEffect(() => {
    if (user && contracts.accessControl) {
      loadPermissions();
    }
  }, [user, contracts.accessControl, loadPermissions]);

  // Verificar si ya existe un permiso para esta entidad
  const checkExistingPermission = (entity: string, permissionType: PermissionType): boolean => {
    return permissions.some(permission => 
      permission.entity.toLowerCase() === entity.toLowerCase() && 
      permission.permissionType === permissionType &&
      permission.isActive
    );
  };

  // Verificar balance de la wallet destino
  const checkWalletBalance = async (address: string): Promise<boolean> => {
    try {
      if (!provider) return true; // Si no hay provider, asumimos que está bien
      
      const balance = await provider.getBalance(address);
      const minBalance = ethers.parseEther('0.001'); // Mínimo 0.001 ETH
      
      return balance >= minBalance;
    } catch (error) {
      console.error('Error verificando balance:', error);
      return true; // En caso de error, permitimos continuar
    }
  };

  // Validación completa del formulario
  const validateForm = async (): Promise<boolean> => {
    setIsValidating(true);
    const errors = {
      entity: '',
      entityType: '',
      permissionType: '',
      purpose: '',
      duration: '',
      general: ''
    };

    try {
      // 1. Validar dirección
      if (!newPermission.entity.trim()) {
        errors.entity = 'La dirección de la entidad es requerida';
      } else if (!ethers.isAddress(newPermission.entity)) {
        errors.entity = 'Dirección de wallet inválida';
      } else if (user && newPermission.entity.toLowerCase() === user.address.toLowerCase()) {
        errors.entity = 'No puedes otorgarte permisos a ti mismo';
      } else {
        // Verificar balance de la wallet
        const hasBalance = await checkWalletBalance(newPermission.entity);
        if (!hasBalance) {
          errors.entity = 'La wallet destino tiene balance insuficiente (mínimo 0.001 ETH)';
        }
      }

      // 2. Validar tipo de entidad
      if (!newPermission.entityType) {
        errors.entityType = 'Debes seleccionar un tipo de entidad';
      }

      // 3. Validar tipo de permiso
      if (!newPermission.permissionType) {
        errors.permissionType = 'Debes seleccionar un tipo de permiso';
      }

      // 4. Validar propósito
      if (!newPermission.purpose.trim()) {
        errors.purpose = 'El propósito del permiso es requerido';
      } else if (newPermission.purpose.length < 10) {
        errors.purpose = 'El propósito debe tener al menos 10 caracteres';
      } else if (newPermission.purpose.length > 500) {
        errors.purpose = 'El propósito no puede exceder 500 caracteres';
      }

      // 5. Validar duración
      if (newPermission.duration < 1) {
        errors.duration = 'La duración debe ser al menos 1 día';
      } else if (newPermission.duration > 365) {
        errors.duration = 'La duración no puede exceder 365 días';
      }

      // 6. Validar permisos duplicados
      if (checkExistingPermission(newPermission.entity, newPermission.permissionType)) {
        errors.general = 'Ya existe un permiso activo para esta entidad con el mismo tipo';
      }

      // 7. Validar documentos específicos si es necesario
      if (newPermission.permissionScope === PermissionScope.SPECIFIC_DOCUMENTS) {
        if (newPermission.documentIds.length === 0) {
          errors.general = 'Debes seleccionar al menos un documento para permisos específicos';
        }
      }

      setValidationErrors(errors);
      
      // Verificar si hay errores
      const hasErrors = Object.values(errors).some(error => error !== '');
      
      if (hasErrors) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en validación:', error);
      errors.general = 'Error durante la validación. Intenta nuevamente.';
      setValidationErrors(errors);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const validateAddress = (address: string): boolean => {
    try {
      // Verificar que sea una dirección válida
      if (!ethers.isAddress(address)) {
        setAddressError('Dirección de wallet inválida');
        return false;
      }
      
      // Verificar que no sea la dirección del usuario actual
      if (user && address.toLowerCase() === user.address.toLowerCase()) {
        setAddressError('No puedes otorgarte permisos a ti mismo');
        return false;
      }
      
      setAddressError('');
      return true;
    } catch (error) {
      setAddressError('Error validando la dirección');
      return false;
    }
  };

  const handleAddressChange = (address: string) => {
    setNewPermission({ ...newPermission, entity: address });
    
    // Limpiar errores previos
    setAddressError('');
    setValidationErrors(prev => ({ ...prev, entity: '', general: '' }));
    
    // Validar solo si hay contenido
    if (address.trim()) {
      validateAddress(address);
    }
  };

  const handlePurposeChange = (purpose: string) => {
    setNewPermission({ ...newPermission, purpose });
    
    // Limpiar error previo
    setValidationErrors(prev => ({ ...prev, purpose: '' }));
    
    // Validar en tiempo real
    if (purpose.trim()) {
      if (purpose.length < 10) {
        setValidationErrors(prev => ({ ...prev, purpose: 'El propósito debe tener al menos 10 caracteres' }));
      } else if (purpose.length > 500) {
        setValidationErrors(prev => ({ ...prev, purpose: 'El propósito no puede exceder 500 caracteres' }));
      }
    }
  };

  const handleDurationChange = (duration: number) => {
    setNewPermission({ ...newPermission, duration });
    
    // Limpiar error previo
    setValidationErrors(prev => ({ ...prev, duration: '' }));
    
    // Validar en tiempo real
    if (duration < 1) {
      setValidationErrors(prev => ({ ...prev, duration: 'La duración debe ser al menos 1 día' }));
    } else if (duration > 365) {
      setValidationErrors(prev => ({ ...prev, duration: 'La duración no puede exceder 365 días' }));
    }
  };

  const handleEntityTypeChange = (entityType: EntityType) => {
    setNewPermission({ ...newPermission, entityType });
    setValidationErrors(prev => ({ ...prev, entityType: '' }));
  };

  const handlePermissionTypeChange = (permissionType: PermissionType) => {
    setNewPermission({ ...newPermission, permissionType });
    setValidationErrors(prev => ({ ...prev, permissionType: '' }));
  };

  const handleGrantPermission = async () => {
    if (!contracts.accessControl || !user) return;

    // Validación completa del formulario
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      const expirationTime = Math.floor(Date.now() / 1000) + (newPermission.duration * 24 * 60 * 60);
      
      let tx;
      
      if (newPermission.permissionScope === PermissionScope.SPECIFIC_DOCUMENTS && newPermission.documentIds.length > 0) {
        // Otorgar permiso para documentos específicos
        tx = await contracts.accessControl.grantDocumentAccess(
          newPermission.entity,
          newPermission.permissionType,
          newPermission.documentIds,
          expirationTime,
          newPermission.purpose
        );
      } else {
        // Otorgar permiso general
        tx = await contracts.accessControl.grantAccess(
          newPermission.entity,
          newPermission.permissionType,
          expirationTime,
          newPermission.purpose
        );
      }

      await tx.wait();
      
      // Recargar permisos
      await loadPermissions();
      
      // Limpiar formulario y errores
      setNewPermission({
        entity: '',
        entityType: EntityType.DOCTOR,
        permissionType: PermissionType.READ,
        permissionScope: PermissionScope.ALL_DOCUMENTS,
        documentIds: [],
        purpose: '',
        duration: 7
      });
      setAddressError('');
      setValidationErrors({
        entity: '',
        entityType: '',
        permissionType: '',
        purpose: '',
        duration: '',
        general: ''
      });
      setShowGrantForm(false);
      
    } catch (error: any) {
      console.error('Error otorgando permiso:', error);
      setValidationErrors(prev => ({
        ...prev,
        general: `Error: ${error.reason || error.message}`
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePermission = async (entity: string) => {
    if (!contracts.accessControl || !user) return;

    if (!window.confirm('¿Estás seguro de que quieres revocar este permiso?')) return;

    setLoading(true);
    try {
      const tx = await contracts.accessControl.revokeAccess(entity);
      await tx.wait();
      
      // Recargar permisos
      await loadPermissions();
      
    } catch (error: any) {
      console.error('Error revocando permiso:', error);
      alert(`Error: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    if (!searchTerm) return true;
    
    return permission.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ENTITY_TYPE_LABELS[permission.entityType].toLowerCase().includes(searchTerm.toLowerCase()) ||
           PERMISSION_TYPE_LABELS[permission.permissionType].toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case EntityType.DOCTOR:
        return <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case EntityType.INSURANCE:
        return <Building className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case EntityType.AUDITOR:
        return <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  // Calcular estadísticas de validación
  const calculateValidationStats = () => {
    const now = Date.now();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    
    const activePermissions = permissions.filter(p => p.isActive && !isExpired(p.expirationTime)).length;
    const expiredPermissions = permissions.filter(p => isExpired(p.expirationTime)).length;
    const expiringSoonPermissions = permissions.filter(p => 
      p.isActive && 
      !isExpired(p.expirationTime) && 
      p.expirationTime <= sevenDaysFromNow
    ).length;
    
    // Detectar permisos duplicados (misma entidad, mismo tipo)
    const duplicatePermissions = permissions.filter((permission, index) => {
      return permissions.some((otherPermission, otherIndex) => 
        index !== otherIndex &&
        permission.entity.toLowerCase() === otherPermission.entity.toLowerCase() &&
        permission.permissionType === otherPermission.permissionType &&
        permission.isActive &&
        otherPermission.isActive
      );
    }).length;

    return {
      totalPermissions: permissions.length,
      activePermissions,
      expiredPermissions,
      expiringSoonPermissions,
      duplicatePermissions: Math.floor(duplicatePermissions / 2) // Dividir por 2 porque cada duplicado se cuenta dos veces
    };
  };

  const getPermissionColor = (type: PermissionType) => {
    const colors = {
      [PermissionType.READ]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      [PermissionType.WRITE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      [PermissionType.FULL]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const isExpired = (expirationTime: number) => {
    return expirationTime < Date.now();
  };

  const isExpiringSoon = (expirationTime: number) => {
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return expirationTime - Date.now() < threeDays && !isExpired(expirationTime);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Permisos</h2>
            <p className="text-gray-600 dark:text-gray-400">Controla quién tiene acceso a tus historias clínicas</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowGrantForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          <Shield className="h-5 w-5" />
          <span>Otorgar Permiso</span>
        </button>
      </div>

      {/* Estadísticas de validación */}
      <div className="mb-6">
        <ValidationStats {...calculateValidationStats()} />
      </div>

      {/* Búsqueda */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por dirección, tipo de entidad o tipo de permiso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Permisos Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {permissions.filter(p => p.isActive && !isExpired(p.expirationTime)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expiran Pronto</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {permissions.filter(p => isExpiringSoon(p.expirationTime)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <X className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expirados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {permissions.filter(p => isExpired(p.expirationTime)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de permisos */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando permisos...</p>
          </div>
        ) : filteredPermissions.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {filteredPermissions.map((permission, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getEntityIcon(permission.entityType)}
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white">{permission.entity}</p>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded">
                          {ENTITY_TYPE_LABELS[permission.entityType]}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getPermissionColor(permission.permissionType)}`}>
                          {PERMISSION_TYPE_LABELS[permission.permissionType]}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          {PERMISSION_SCOPE_LABELS[permission.permissionScope]}
                        </span>
                        <span>Otorgado: {formatDate(permission.timestamp)}</span>
                        <span>Expira: {formatDate(permission.expirationTime)}</span>
                      </div>
                      
                      {permission.purpose && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Propósito:</span> {permission.purpose}
                        </div>
                      )}
                      
                      {permission.documentIds.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Documentos:</span> {permission.documentIds.length} documento(s) específico(s)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isExpired(permission.expirationTime) ? (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-full">
                        Expirado
                      </span>
                    ) : isExpiringSoon(permission.expirationTime) ? (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm rounded-full">
                        Expira pronto
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
                        Activo
                      </span>
                    )}

                    {permission.isActive && !isExpired(permission.expirationTime) && (
                      <button
                        onClick={() => handleRevokePermission(permission.entity)}
                        className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        Revocar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Shield className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No se encontraron permisos</p>
          </div>
        )}
      </div>

      {/* Modal para otorgar permiso */}
      {showGrantForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Otorgar Nuevo Permiso</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección de la Entidad *
                </label>
                <input
                  type="text"
                  value={newPermission.entity}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="0x1234... (dirección completa de wallet)"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    addressError 
                      ? 'border-red-300 dark:border-red-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white' 
                      : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                  }`}
                  required
                />
                {addressError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {addressError}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ingresa la dirección completa de la wallet (ej: 0x1234...). No uses nombres ENS.
                </p>
                
                {/* Información sobre direcciones */}
                <AddressInfo 
                  title="¿Cómo obtener una dirección válida?"
                  showCopyButton={true}
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Permiso *
                  </label>
                  <select
                    value={newPermission.permissionType}
                    onChange={(e) => handlePermissionTypeChange(parseInt(e.target.value) as PermissionType)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.permissionType 
                        ? 'border-red-300 dark:border-red-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white' 
                        : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {Object.entries(PERMISSION_TYPE_LABELS).map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                  {validationErrors.permissionType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.permissionType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alcance del Permiso *
                  </label>
                  <select
                    value={newPermission.permissionScope}
                    onChange={(e) => setNewPermission({ 
                      ...newPermission, 
                      permissionScope: parseInt(e.target.value) as PermissionScope,
                      documentIds: parseInt(e.target.value) === PermissionScope.SPECIFIC_DOCUMENTS ? newPermission.documentIds : []
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(PERMISSION_SCOPE_LABELS).map(([scope, label]) => (
                      <option key={scope} value={scope}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duración (días) *
                  </label>
                  <select
                    value={newPermission.duration}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.duration 
                        ? 'border-red-300 dark:border-red-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white' 
                        : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <option value={1}>1 día</option>
                    <option value={7}>7 días</option>
                    <option value={30}>30 días</option>
                    <option value={90}>90 días</option>
                    <option value={365}>1 año</option>
                  </select>
                  {validationErrors.duration && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.duration}
                    </p>
                  )}
                </div>
              </div>

              {/* Propósito del permiso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Propósito del Permiso *
                </label>
                <textarea
                  value={newPermission.purpose}
                  onChange={(e) => handlePurposeChange(e.target.value)}
                  placeholder="Describe el propósito específico para el cual se otorga este permiso..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.purpose 
                      ? 'border-red-300 dark:border-red-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white' 
                      : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
                  }`}
                  required
                />
                {validationErrors.purpose && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.purpose}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {newPermission.purpose.length}/500 caracteres
                </p>
              </div>

              {/* Selector de documentos (solo si es scope específico) */}
              {newPermission.permissionScope === PermissionScope.SPECIFIC_DOCUMENTS && (
                <div>
                  <DocumentSelector
                    selectedDocuments={newPermission.documentIds}
                    onDocumentsChange={(documentIds) => setNewPermission({ ...newPermission, documentIds })}
                    maxSelections={20}
                  />
                </div>
              )}

              {/* Mensaje de error general */}
              {validationErrors.general && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <X className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="text-sm text-red-800 dark:text-red-300">
                      <p className="font-medium mb-1">Error de validación:</p>
                      <p>{validationErrors.general}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-medium mb-1">Información importante:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Una vez otorgado, este permiso permitirá a la entidad acceder según el alcance seleccionado</li>
                      <li>El propósito del permiso quedará registrado en la blockchain para auditoría</li>
                      <li>Puedes revocar el permiso en cualquier momento</li>
                      <li>Los permisos expiran automáticamente según la duración seleccionada</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex space-x-3">
              <button
                onClick={handleGrantPermission}
                disabled={loading || isValidating || !newPermission.entity || !newPermission.purpose || 
                         !!addressError || Object.values(validationErrors).some(error => error !== '')}
                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Otorgando...' : isValidating ? 'Validando...' : 'Otorgar Permiso'}
              </button>
              <button
                onClick={() => setShowGrantForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
