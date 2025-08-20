import React, { useState, useEffect } from 'react';
import { FileText, Search, Check, X } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '../config/contracts';

interface Document {
  id: number;
  documentType: DocumentType;
  description: string;
  createdAt: number;
  ipfsHash: string;
}

interface DocumentSelectorProps {
  selectedDocuments: number[];
  onDocumentsChange: (documentIds: number[]) => void;
  maxSelections?: number;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  selectedDocuments,
  onDocumentsChange,
  maxSelections = 10
}) => {
  const { user, contracts } = useWeb3();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all');

  // Cargar documentos del usuario
  useEffect(() => {
    const loadDocuments = async () => {
      if (!contracts.medicalRecords || !user) return;

      setLoading(true);
      try {
        // En un sistema real, esto vendría del contrato
        // Por ahora simulamos algunos documentos
        const mockDocuments: Document[] = [
          {
            id: 1,
            documentType: DocumentType.MEDICAL_HISTORY,
            description: 'Historia clínica general - 2024',
            createdAt: Date.now() - 86400000 * 30, // 30 días atrás
            ipfsHash: 'QmHash1...'
          },
          {
            id: 2,
            documentType: DocumentType.LAB_RESULTS,
            description: 'Análisis de sangre - Hemograma completo',
            createdAt: Date.now() - 86400000 * 7, // 7 días atrás
            ipfsHash: 'QmHash2...'
          },
          {
            id: 3,
            documentType: DocumentType.IMAGING,
            description: 'Radiografía de tórax - PA y lateral',
            createdAt: Date.now() - 86400000 * 14, // 14 días atrás
            ipfsHash: 'QmHash3...'
          },
          {
            id: 4,
            documentType: DocumentType.PRESCRIPTION,
            description: 'Receta médica - Antibióticos',
            createdAt: Date.now() - 86400000 * 3, // 3 días atrás
            ipfsHash: 'QmHash4...'
          },
          {
            id: 5,
            documentType: DocumentType.INSURANCE_CLAIM,
            description: 'Reclamación de seguro - Consulta especialista',
            createdAt: Date.now() - 86400000 * 1, // 1 día atrás
            ipfsHash: 'QmHash5...'
          }
        ];

        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Error cargando documentos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [contracts.medicalRecords, user]);

  const handleDocumentToggle = (documentId: number) => {
    if (selectedDocuments.includes(documentId)) {
      // Remover documento
      onDocumentsChange(selectedDocuments.filter(id => id !== documentId));
    } else {
      // Agregar documento (si no excede el límite)
      if (selectedDocuments.length < maxSelections) {
        onDocumentsChange([...selectedDocuments, documentId]);
      }
    }
  };

  const handleSelectAll = () => {
    const allIds = documents.map(doc => doc.id);
    onDocumentsChange(allIds.slice(0, maxSelections));
  };

  const handleClearAll = () => {
    onDocumentsChange([]);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         DOCUMENT_TYPE_LABELS[doc.documentType].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.documentType === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDocumentIcon = (type: DocumentType) => {
    const colors = {
      [DocumentType.MEDICAL_HISTORY]: 'text-blue-600 dark:text-blue-400',
      [DocumentType.LAB_RESULTS]: 'text-green-600 dark:text-green-400',
      [DocumentType.IMAGING]: 'text-purple-600 dark:text-purple-400',
      [DocumentType.PRESCRIPTION]: 'text-orange-600 dark:text-orange-400',
      [DocumentType.INSURANCE_CLAIM]: 'text-red-600 dark:text-red-400'
    };
    return colors[type] || 'text-gray-600 dark:text-gray-400';
  };

  if (!user) {
    return (
      <div className="text-center text-gray-500 py-8">
        Conecta tu wallet para ver tus documentos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Seleccionar Documentos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedDocuments.length} de {maxSelections} documentos seleccionados
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            disabled={selectedDocuments.length >= maxSelections}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Seleccionar Todos
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="sm:w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as DocumentType | 'all')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="border border-gray-200 dark:border-slate-600 rounded-lg max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando documentos...</p>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-slate-600">
            {filteredDocuments.map((doc) => {
              const isSelected = selectedDocuments.includes(doc.id);
              const isDisabled = !isSelected && selectedDocuments.length >= maxSelections;
              
              return (
                <div
                  key={doc.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                    isDisabled ? 'opacity-50' : ''
                  }`}
                  onClick={() => !isDisabled && handleDocumentToggle(doc.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-gray-300 dark:border-slate-600'
                    }`}>
                      {isSelected ? (
                        <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <FileText className={`h-5 w-5 ${getDocumentIcon(doc.documentType)}`} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.description}
                        </p>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded">
                          {DOCUMENT_TYPE_LABELS[doc.documentType]}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>ID: {doc.id}</span>
                        <span>Creado: {formatDate(doc.createdAt)}</span>
                        <span className="font-mono">IPFS: {doc.ipfsHash.substring(0, 8)}...</span>
                      </div>
                    </div>
                    
                    {isDisabled && (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterType !== 'all' 
                ? 'No se encontraron documentos que coincidan con los filtros'
                : 'No tienes documentos médicos registrados'
              }
            </p>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Información sobre permisos por documento:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Puedes seleccionar hasta {maxSelections} documentos</li>
              <li>Los permisos se aplicarán solo a los documentos seleccionados</li>
              <li>Puedes modificar la selección en cualquier momento</li>
              <li>Los permisos se pueden revocar individualmente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSelector;
