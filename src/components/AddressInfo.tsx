import React from 'react';
import { Info, AlertCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface AddressInfoProps {
  title?: string;
  showCopyButton?: boolean;
}

const AddressInfo: React.FC<AddressInfoProps> = ({ 
  title = "Información sobre Direcciones de Wallet",
  showCopyButton = false 
}) => {
  const [copied, setCopied] = useState(false);

  const exampleAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exampleAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando dirección:', error);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            {title}
          </h4>
          
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
            <div>
              <p className="font-medium mb-1">✅ Direcciones Válidas:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Deben comenzar con <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">0x</code></li>
                <li>Deben tener exactamente 42 caracteres</li>
                <li>Deben contener solo caracteres hexadecimales (0-9, a-f, A-F)</li>
              </ul>
            </div>

            <div>
              <p className="font-medium mb-1">❌ No usar:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Nombres ENS como <code className="bg-red-100 dark:bg-red-800 px-1 rounded">usuario.eth</code></li>
                <li>Direcciones de otras redes (Ethereum Mainnet, etc.)</li>
                <li>Direcciones incompletas o mal formateadas</li>
              </ul>
            </div>

            <div>
              <p className="font-medium mb-1">🔍 Ejemplo de dirección válida:</p>
              <div className="flex items-center space-x-2">
                <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded font-mono text-xs">
                  {exampleAddress}
                </code>
                {showCopyButton && (
                  <button
                    onClick={handleCopy}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                    title="Copiar dirección de ejemplo"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                    ¿Por qué no funciona ENS?
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-400 text-xs">
                    ENS (Ethereum Name Service) solo funciona en Ethereum Mainnet. 
                    En Arbitrum Sepolia (red de prueba) debes usar direcciones completas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressInfo;
