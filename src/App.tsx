import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3Provider, useWeb3 } from './contexts/Web3Context';
import { ThemeProvider } from './contexts/ThemeContext';
import WalletConnect from './components/WalletConnect';
import Dashboard from './components/Dashboard';
import DocumentManager from './components/DocumentManager';
import PermissionManager from './components/PermissionManager';
import UserRegistration from './components/UserRegistration';
import KYCVerification from './components/KYCVerification';
import VerificationStatus from './components/VerificationStatus';
import ThemeToggle from './components/ThemeToggle';
import { Menu, X, Home, FileText, Shield, UserPlus, UserCheck } from 'lucide-react';

// Componente para manejar la ruta KYC
const KYCRoute: React.FC = () => {
  const { user, kycStatus, updateKYCStatus } = useWeb3();

  if (!user) {
    return (
      <div className="text-center text-gray-500">
        Conecta tu wallet para acceder a la verificación KYC
      </div>
    );
  }

  // Si el KYC está aprobado, mostrar estado
  if (kycStatus === 'approved') {
    return <VerificationStatus status="approved" />;
  }

  // Si está en proceso, mostrar estado
  if (kycStatus === 'submitted') {
    return <VerificationStatus status="submitted" />;
  }

  // Si fue rechazado, permitir reintentar
  if (kycStatus === 'rejected') {
    return (
      <VerificationStatus 
        status="rejected" 
        onRetry={() => updateKYCStatus('pending')} 
      />
    );
  }

  // Si está pendiente, mostrar formulario de verificación
  return <KYCVerification />;
};

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Documentos', href: '/documents', icon: FileText },
    { name: 'Permisos', href: '/permissions', icon: Shield },
    { name: 'Registro', href: '/register', icon: UserPlus },
    { name: 'KYC', href: '/kyc', icon: UserCheck },
  ];

  return (
    <ThemeProvider>
      <Web3Provider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
            {/* Sidebar para móvil */}
            <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
              <div className="relative flex w-full max-w-xs flex-col bg-white dark:bg-slate-800 pb-4 shadow-xl">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                
                <div className="flex shrink-0 items-center px-4 py-6">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Histo Bit</h1>
                </div>
                
                <nav className="mt-5 flex-1 space-y-1 px-2">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    >
                      <item.icon className="mr-4 h-6 w-6" />
                      {item.name}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* Sidebar para desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
              <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex h-16 shrink-0 items-center px-4 border-b border-gray-200 dark:border-slate-700">
                  <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Histo Bit</h1>
                </div>
                
                <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                  <nav className="mt-5 flex-1 space-y-1 px-2">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      >
                        <item.icon className="mr-3 h-6 w-6" />
                        {item.name}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
              {/* Header */}
              <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>

                <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                  <div className="flex flex-1 items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Sistema de Historias Clínicas Blockchain
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <ThemeToggle />
                    <WalletConnect compact />
                  </div>
                </div>
              </div>

              {/* Área de contenido principal */}
              <main className="flex-1 py-10">
                <div className="px-4 sm:px-6 lg:px-8">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/documents" element={<DocumentManager />} />
                    <Route path="/permissions" element={<PermissionManager />} />
                    <Route path="/register" element={<UserRegistration />} />
                    <Route path="/kyc" element={<KYCRoute />} />
                  </Routes>
                </div>
              </main>

              {/* Footer */}
              <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                <div className="px-4 py-6 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Arbitrum Sepolia</span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        v1.0.0
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Desarrollado con ❤️ para la salud digital</span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </Router>
      </Web3Provider>
    </ThemeProvider>
  );
};

export default App;
