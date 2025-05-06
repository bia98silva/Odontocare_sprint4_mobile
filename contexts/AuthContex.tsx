import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthService, PacienteService } from '../services/api/Api';

// Definindo tipos
type Usuario = {
  id: number;
  nome: string;
  email: string;
  tipo: string;
};

type Paciente = {
  id: number;
  usuarioId: number;
  nome: string;
  dataNascimento?: string;
  telefone?: string;
  endereco?: string;
  pontos: number;
  ultimaConsulta?: string;
};

type AuthContextType = {
  usuario: Usuario | null;
  paciente: Paciente | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  atualizarPaciente: (id: number, dados: Partial<Paciente>) => Promise<void>;
};

// Criando o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Criando o provedor do contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se o usuário está autenticado ao iniciar o app
  useEffect(() => {
    const verificarAuth = async () => {
      try {
        const usuarioLogado = await AuthService.getUsuarioLogado();
        if (usuarioLogado) {
          setUsuario(usuarioLogado);

          // Buscar informações do paciente se for um paciente
          if (usuarioLogado.tipo === 'paciente') {
            const pacienteData = await PacienteService.getByUsuarioId(usuarioLogado.id);
            if (pacienteData) {
              setPaciente(pacienteData);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    verificarAuth();
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      setLoading(true);
      const usuarioLogado = await AuthService.login(email, senha);
      setUsuario(usuarioLogado);

      // Buscar informações do paciente se for um paciente
      if (usuarioLogado.tipo === 'paciente') {
        const pacienteData = await PacienteService.getByUsuarioId(usuarioLogado.id);
        if (pacienteData) {
          setPaciente(pacienteData);
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AuthService.logout();
      setUsuario(null);
      setPaciente(null);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarPaciente = async (id: number, dados: Partial<Paciente>) => {
    try {
      const pacienteAtualizado = await PacienteService.updateParcial(id, dados);
      setPaciente(pacienteAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        usuario, 
        paciente, 
        loading, 
        login, 
        logout, 
        atualizarPaciente 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};