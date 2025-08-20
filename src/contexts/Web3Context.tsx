import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, EntityType } from '../config/contracts';
import { switchToArbitrumSepolia, isCorrectNetwork } from '../config/network';
import { User } from '../types';

interface Web3ContextType {
  user: User | null;
  userType: string | null;
  kycStatus: 'pending' | 'submitted' | 'approved' | 'rejected';
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contracts: {
    accessControl: ethers.Contract | null;
    medicalRecords: ethers.Contract | null;
    auditTrail: ethers.Contract | null;
  };
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateKYCStatus: (status: 'pending' | 'submitted' | 'approved' | 'rejected') => void;
  isLoading: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType>({
  user: null,
  userType: null,
  kycStatus: 'pending',
  provider: null,
  signer: null,
  contracts: {
    accessControl: null,
    medicalRecords: null,
    auditTrail: null,
  },
  connectWallet: async () => {},
  disconnectWallet: () => {},
  updateKYCStatus: () => {},
  isLoading: false,
  error: null,
});

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 debe ser usado dentro de Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<'pending' | 'submitted' | 'approved' | 'rejected'>(() => {
    // Inicializar desde localStorage si existe
    const savedStatus = localStorage.getItem('kyc_status');
    return (savedStatus as 'pending' | 'submitted' | 'approved' | 'rejected') || 'pending';
  });
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contracts, setContracts] = useState({
    accessControl: null as ethers.Contract | null,
    medicalRecords: null as ethers.Contract | null,
    auditTrail: null as ethers.Contract | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManualDisconnect, setIsManualDisconnect] = useState(false);

  // Guardar estado de conexión en localStorage
  const saveConnectionState = (address: string, entityType: number, entityTypeString: string) => {
    const connectionData = {
      address,
      entityType,
      entityTypeString,
      timestamp: Date.now()
    };
    localStorage.setItem('wallet_connection', JSON.stringify(connectionData));
  };

  // Limpiar estado de conexión del localStorage
  const clearConnectionState = () => {
    localStorage.removeItem('wallet_connection');
    // También agregar un flag para indicar que fue desconexión manual
    localStorage.setItem('manual_disconnect', 'true');
  };

  // Verificar si fue una desconexión manual reciente
  const wasManuallyDisconnected = () => {
    return localStorage.getItem('manual_disconnect') === 'true';
  };

  // Limpiar flag de desconexión manual
  const clearManualDisconnectFlag = () => {
    localStorage.removeItem('manual_disconnect');
  };

  // Verificar si la conexión es reciente (menos de 24 horas)
  const isRecentConnection = (timestamp: number) => {
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    return Date.now() - timestamp < ONE_DAY;
  };

  const initializeContracts = async (signerInstance: ethers.JsonRpcSigner) => {
    try {
      const accessControl = new ethers.Contract(
        CONTRACT_ADDRESSES.AccessControl,
        CONTRACT_ABIS.AccessControl,
        signerInstance
      );

      const medicalRecords = new ethers.Contract(
        CONTRACT_ADDRESSES.MedicalRecords,
        CONTRACT_ABIS.MedicalRecords,
        signerInstance
      );

      const auditTrail = new ethers.Contract(
        CONTRACT_ADDRESSES.AuditTrail,
        CONTRACT_ABIS.AuditTrail,
        signerInstance
      );

      setContracts({ accessControl, medicalRecords, auditTrail });
      return { accessControl, medicalRecords, auditTrail };
    } catch (error) {
      console.error('Error inicializando contratos:', error);
      throw error;
    }
  };

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask no está instalado. Por favor instálalo para continuar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Solicitar acceso a cuentas
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Verificar/cambiar red
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const numericChainId = parseInt(chainId, 16);

      if (!isCorrectNetwork(numericChainId)) {
        await switchToArbitrumSepolia();
      }

      // Crear provider y signer
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const ethSigner = await ethProvider.getSigner();
      const address = await ethSigner.getAddress();

      setProvider(ethProvider);
      setSigner(ethSigner);

      // Inicializar contratos
      const contractInstances = await initializeContracts(ethSigner);

      // Obtener tipo de entidad del usuario
      let entityType = EntityType.PATIENT; // Por defecto
      try {
        entityType = await contractInstances.accessControl.getEntityType(address);
      } catch (error) {
        console.log('Usuario no registrado, será tratado como paciente');
      }

      // Convertir entityType a string para userType
      const entityTypeString = Object.keys(EntityType)[entityType] || 'PATIENT';
      setUserType(entityTypeString);

      const userData = {
        address,
        entityType,
        isConnected: true,
      };

      setUser(userData);

      // Guardar estado en localStorage para persistencia
      saveConnectionState(address, entityType, entityTypeString);
      
      // Limpiar flag de desconexión manual ya que el usuario se conectó voluntariamente
      clearManualDisconnectFlag();

    } catch (error: any) {
      console.error('Error conectando wallet:', error);
      setError(error.message || 'Error conectando con MetaMask');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    console.log('Desconectando wallet manualmente...');
    setIsManualDisconnect(true);
    setUser(null);
    setUserType(null);
    setProvider(null);
    setSigner(null);
    setContracts({
      accessControl: null,
      medicalRecords: null,
      auditTrail: null,
    });
    setError(null);
    
    // Limpiar estado de conexión del localStorage
    clearConnectionState();
    
    // Reset del flag de estado después de un breve delay
    setTimeout(() => setIsManualDisconnect(false), 1000);
  }, []);

  // Escuchar cambios de cuenta y red
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        // No procesar cambios si fue una desconexión manual reciente
        if (isManualDisconnect || wasManuallyDisconnected()) {
          console.log('Ignorando cambio de cuenta por desconexión manual');
          return;
        }
        
        if (accounts.length === 0) {
          // Si no hay cuentas, desconectar y limpiar localStorage
          disconnectWallet();
        } else {
          // Verificar si la nueva cuenta coincide con la guardada
          const savedConnection = localStorage.getItem('wallet_connection');
          if (savedConnection) {
            const connectionData = JSON.parse(savedConnection);
            if (accounts[0].toLowerCase() !== connectionData.address.toLowerCase()) {
              // Si la cuenta cambió, limpiar estado y reconectar
              clearConnectionState();
            }
          }
          // Reconectar con nueva cuenta
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        // Recargar página cuando cambie la red
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connectWallet, disconnectWallet, isManualDisconnect]);

  // Auto-conectar si ya estaba conectado
  useEffect(() => {
    const autoConnect = async () => {
      // No intentar auto-conectar si fue una desconexión manual
      if (wasManuallyDisconnected()) {
        console.log('No auto-conectando debido a desconexión manual previa');
        return;
      }
      
      if (window.ethereum && !user && !isManualDisconnect) {
        try {
          // Verificar si hay una conexión guardada reciente
          const savedConnection = localStorage.getItem('wallet_connection');
          if (savedConnection) {
            const connectionData = JSON.parse(savedConnection);
            
            // Verificar si la conexión es reciente (menos de 24 horas)
            if (!isRecentConnection(connectionData.timestamp)) {
              clearConnectionState();
              return;
            }
          }

          // Verificar si MetaMask tiene cuentas conectadas
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            // Si hay conexión guardada y cuentas conectadas, reconectar
            if (savedConnection) {
              const connectionData = JSON.parse(savedConnection);
              // Verificar que la cuenta actual coincida con la guardada
              if (accounts[0].toLowerCase() === connectionData.address.toLowerCase()) {
                console.log('Auto-reconectando con cuenta guardada');
                await connectWallet();
              } else {
                // Si la cuenta cambió, limpiar el estado guardado
                clearConnectionState();
              }
            } else {
              // Si no hay estado guardado pero hay cuentas conectadas, intentar conectar
              console.log('Auto-conectando con cuenta disponible');
              await connectWallet();
            }
          }
        } catch (error) {
          console.error('Error en auto-conexión:', error);
          // Si hay error, limpiar estado guardado
          clearConnectionState();
        }
      }
    };

    // Solo ejecutar una vez al montar el componente
    autoConnect();
  }, [connectWallet, user, isManualDisconnect]);

  const updateKYCStatus = (status: 'pending' | 'submitted' | 'approved' | 'rejected') => {
    setKycStatus(status);
    // Guardar en localStorage para persistencia
    localStorage.setItem('kyc_status', status);
  };

  const value: Web3ContextType = {
    user,
    userType,
    kycStatus,
    provider,
    signer,
    contracts,
    connectWallet,
    disconnectWallet,
    updateKYCStatus,
    isLoading,
    error,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
