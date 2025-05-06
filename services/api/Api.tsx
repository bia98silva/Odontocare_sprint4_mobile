import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Substitua pelo IP da máquina onde a API está rodando
// Se estiver usando emulador Android, use 10.0.2.2 em vez de localhost
// Se estiver usando dispositivo físico, use o IP da sua máquina na rede local
const API_URL = 'http://10.0.2.2:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@OdontoCare:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthService = {
  login: async (email, senha) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
    
      await AsyncStorage.setItem('@OdontoCare:token', response.data.token);
      await AsyncStorage.setItem('@OdontoCare:usuario', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  registro: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('@OdontoCare:token');
      await AsyncStorage.removeItem('@OdontoCare:usuario');
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  },

  getUsuarioLogado: async () => {
    try {
      const usuario = await AsyncStorage.getItem('@OdontoCare:usuario');
      return usuario ? JSON.parse(usuario) : null;
    } catch (error) {
      console.error('Erro ao buscar usuário logado:', error);
      return null;
    }
  }
};


export const PacienteService = {
  getById: async (id) => {
    try {
      const response = await api.get(`/pacientes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar paciente com ID ${id}:`, error);
      throw error;
    }
  },

  getByUsuarioId: async (usuarioId) => {
    try {
      const response = await api.get(`/pacientes/usuario/${usuarioId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar paciente pelo usuário ${usuarioId}:`, error);
      throw error;
    }
  },

  update: async (id, pacienteData) => {
    try {
      const response = await api.put(`/pacientes/${id}`, pacienteData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar paciente com ID ${id}:`, error);
      throw error;
    }
  },

  updateParcial: async (id, pacienteData) => {
    try {
      const response = await api.patch(`/pacientes/${id}`, pacienteData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar parcialmente paciente com ID ${id}:`, error);
      throw error;
    }
  },

  adicionarPontos: async (id, pontos) => {
    try {
      const response = await api.patch(`/pacientes/${id}/pontos/${pontos}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar pontos ao paciente ${id}:`, error);
      throw error;
    }
  }
};

// Serviço de Agendamentos
export const AgendamentoService = {
  getAll: async () => {
    try {
      const response = await api.get('/agendamentos');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/agendamentos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar agendamento com ID ${id}:`, error);
      throw error;
    }
  },

  getByPacienteId: async (pacienteId) => {
    try {
      const response = await api.get(`/agendamentos/paciente/${pacienteId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar agendamentos do paciente ${pacienteId}:`, error);
      throw error;
    }
  },

  create: async (agendamentoData) => {
    try {
      const response = await api.post('/agendamentos', agendamentoData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  },

  update: async (id, agendamentoData) => {
    try {
      const response = await api.put(`/agendamentos/${id}`, agendamentoData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar agendamento com ID ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/agendamentos/${id}/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/agendamentos/${id}`);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir agendamento com ID ${id}:`, error);
      throw error;
    }
  }
};

// Serviço de Alertas
export const AlertaService = {
  getAll: async () => {
    try {
      const response = await api.get('/alertas');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      throw error;
    }
  },

  getByPacienteId: async (pacienteId) => {
    try {
      const response = await api.get(`/alertas/paciente/${pacienteId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar alertas do paciente ${pacienteId}:`, error);
      throw error;
    }
  },

  getNaoLidosByPacienteId: async (pacienteId) => {
    try {
      const response = await api.get(`/alertas/paciente/${pacienteId}/nao-lidos`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar alertas não lidos do paciente ${pacienteId}:`, error);
      throw error;
    }
  },

  marcarComoLido: async (id) => {
    try {
      const response = await api.patch(`/alertas/${id}/marcar-como-lido`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao marcar alerta ${id} como lido:`, error);
      throw error;
    }
  },

  marcarTodosComoLidos: async (pacienteId) => {
    try {
      const response = await api.patch(`/alertas/paciente/${pacienteId}/marcar-todos-como-lidos`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao marcar todos alertas do paciente ${pacienteId} como lidos:`, error);
      throw error;
    }
  }
};

// Serviço de Atividades
export const AtividadeService = {
  getByPacienteId: async (pacienteId) => {
    try {
      const response = await api.get(`/atividades/paciente/${pacienteId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar atividades do paciente ${pacienteId}:`, error);
      throw error;
    }
  },

  getByPacienteIdAndData: async (pacienteId, data) => {
    try {
      const response = await api.get(`/atividades/paciente/${pacienteId}/data/${data}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar atividades do paciente ${pacienteId} na data ${data}:`, error);
      throw error;
    }
  },

  marcarComoConcluida: async (id) => {
    try {
      const response = await api.patch(`/atividades/${id}/marcar-como-concluida`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao marcar atividade ${id} como concluída:`, error);
      throw error;
    }
  },

  create: async (atividadeData) => {
    try {
      const response = await api.post('/atividades', atividadeData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      throw error;
    }
  }
};

export default api;