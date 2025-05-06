import React, { useState, useEffect } from "react";
import { 
  View, Text, Button, Alert, StyleSheet, TouchableOpacity, 
  ScrollView, ActivityIndicator, Image
} from "react-native";
import { Checkbox } from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { 
  PacienteService, AuthService, AtividadeService 
} from "../services/api/Api";
import { RootStackParamList } from "../App"; // Importe RootStackParamList do App.tsx

// Defina o tipo para o navigation
type PerfilPacienteScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Interfaces para os modelos de dados
interface Paciente {
  id: number;
  nome: string;
  pontos: number;
  ultimaConsulta?: string;
  telefone?: string;
}

interface Atividade {
  id: number;
  pacienteId: number;
  descricao: string;
  pontos: number;
  data: string;
  concluida: boolean;
}

interface AtividadesState {
  escovouCafe: boolean;
  escovouAlmoco: boolean;
  escovouJantar: boolean;
  marcouAvaliacao: boolean;
  realizouLimpeza: boolean;
}

interface Usuario {
  id: number;
  tipo: string;
}

const PerfilPacienteScreen = () => {
  const navigation = useNavigation<PerfilPacienteScreenNavigationProp>();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [atividades, setAtividades] = useState<AtividadesState>({
    escovouCafe: false,
    escovouAlmoco: false,
    escovouJantar: false,
    marcouAvaliacao: false,
    realizouLimpeza: false,
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [atividadesList, setAtividadesList] = useState<Atividade[]>([]);
  
  useFocusEffect(
    React.useCallback(() => {
      carregarDados();
    }, [])
  );

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Buscar usuário logado
      const usuario = await AuthService.getUsuarioLogado();
      if (!usuario) {
        navigation.navigate("Login");
        return;
      }
      
      // Buscar informações do paciente
      if (usuario.tipo === 'paciente') {
        const pacienteData = await PacienteService.getByUsuarioId(usuario.id);
        setPaciente(pacienteData);
        
        // Buscar atividades do dia
        const hoje = new Date().toISOString().split('T')[0];
        const atividadesHoje = await AtividadeService.getByPacienteIdAndData(
          pacienteData.id, 
          hoje
        );
        
        setAtividadesList(atividadesHoje);
        
        // Mapear atividades do dia para o estado
        const atividadesState = { ...atividades };
        atividadesHoje.forEach(atv => {
          if (atv.descricao.includes("café da manhã")) {
            atividadesState.escovouCafe = atv.concluida;
          } else if (atv.descricao.includes("almoço")) {
            atividadesState.escovouAlmoco = atv.concluida;
          } else if (atv.descricao.includes("jantar")) {
            atividadesState.escovouJantar = atv.concluida;
          } else if (atv.descricao.includes("avaliação")) {
            atividadesState.marcouAvaliacao = atv.concluida;
          } else if (atv.descricao.includes("limpeza")) {
            atividadesState.realizouLimpeza = atv.concluida;
          }
        });
        
        setAtividades(atividadesState);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (campo: keyof AtividadesState, descricao: string, pontos: number) => {
    try {
      setSalvando(true);
      
      if (!paciente) {
        Alert.alert("Erro", "Dados do paciente não disponíveis.");
        return;
      }
      
      // Verificar se a atividade já existe
      const atividadeExistente = atividadesList.find(
        a => a.descricao === descricao
      );
      
      if (atividadeExistente) {
        // Se existe e não está concluída, marcar como concluída
        if (!atividadeExistente.concluida) {
          await AtividadeService.marcarComoConcluida(atividadeExistente.id);
        }
      } else {
        // Se não existe, criar nova atividade
        const hoje = new Date();
        const novaAtividade = {
          pacienteId: paciente.id,
          descricao: descricao,
          pontos: pontos,
          data: hoje.toISOString(),
          concluida: true
        };
        
        await AtividadeService.create(novaAtividade);
      }
      
      // Atualizar estado local
      setAtividades(prev => ({ ...prev, [campo]: true }));
      
      // Recarregar dados
      await carregarDados();
      
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
      Alert.alert("Erro", "Não foi possível atualizar a atividade.");
    } finally {
      setSalvando(false);
    }
  };

  const formatarData = (dataString?: string): string => {
    if (!dataString) return "Não informado";
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Perfil do Paciente</Text>
        
        {paciente && (
          <View style={styles.perfilCard}>
            <View style={styles.avatarContainer}>
              <Image 
                source={require('../assets/logo2.png')}
                style={styles.avatar}
              />
            </View>
            
            <Text style={styles.nomePaciente}>{paciente.nome}</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pontos acumulados:</Text>
              <Text style={styles.infoValor}>{paciente.pontos}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Última consulta:</Text>
              <Text style={styles.infoValor}>
                {formatarData(paciente.ultimaConsulta)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone:</Text>
              <Text style={styles.infoValor}>{paciente.telefone || "Não informado"}</Text>
            </View>
          </View>
        )}

        <View style={styles.atividadesContainer}>
          <Text style={styles.subtitulo}>Atividades diárias</Text>
          <Text style={styles.dica}>Marque as atividades concluídas para ganhar pontos!</Text>
          
          <View style={styles.checkboxesContainer}>
            <Checkbox.Item 
              label="Escovou os dentes após o café da manhã" 
              status={atividades.escovouCafe ? "checked" : "unchecked"} 
              onPress={() => handleCheck(
                "escovouCafe", 
                "Escovou os dentes após o café da manhã", 
                1
              )}
              disabled={atividades.escovouCafe || salvando}
              labelStyle={styles.checkboxLabel}  
            />
            <Checkbox.Item 
              label="Escovou os dentes após o almoço" 
              status={atividades.escovouAlmoco ? "checked" : "unchecked"} 
              onPress={() => handleCheck(
                "escovouAlmoco", 
                "Escovou os dentes após o almoço", 
                1
              )}
              disabled={atividades.escovouAlmoco || salvando}
              labelStyle={styles.checkboxLabel}  
            />
            <Checkbox.Item 
              label="Escovou os dentes após o jantar" 
              status={atividades.escovouJantar ? "checked" : "unchecked"} 
              onPress={() => handleCheck(
                "escovouJantar", 
                "Escovou os dentes após o jantar", 
                1
              )}
              disabled={atividades.escovouJantar || salvando}
              labelStyle={styles.checkboxLabel}  
            />
            <Checkbox.Item 
              label="Marcou uma avaliação dental" 
              status={atividades.marcouAvaliacao ? "checked" : "unchecked"} 
              onPress={() => handleCheck(
                "marcouAvaliacao",
                "Marcou uma avaliação dental", 
                2
              )}
              disabled={atividades.marcouAvaliacao || salvando}
              labelStyle={styles.checkboxLabel}  
            />
            <Checkbox.Item 
              label="Realizou limpeza dental" 
              status={atividades.realizouLimpeza ? "checked" : "unchecked"} 
              onPress={() => handleCheck(
                "realizouLimpeza", 
                "Realizou limpeza dental", 
                3
              )}
              disabled={atividades.realizouLimpeza || salvando}
              labelStyle={styles.checkboxLabel}  
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={async () => {
            try {
              await AuthService.logout();
              navigation.navigate("Login");
            } catch (error) {
              console.error("Erro ao fazer logout:", error);
            }
          }}
        >
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.voltarButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.voltarButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1, 
    backgroundColor: "#003366",
  },
  container: {
    padding: 20,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#003366",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#FFF",
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 40,
    color: '#FFF',  
  },
  perfilCard: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e6e6e6',
  },
  nomePaciente: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 5,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoValor: {
    fontSize: 16,
    color: '#007bff',
  },
  atividadesContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  dica: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  checkboxesContainer: {
    width: '100%', 
    marginBottom: 10, 
  },
  checkboxLabel: {
    fontSize: 14,
    flexShrink: 1,
  },
  logoutButton: {
    backgroundColor: "#ff4d4d",
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  voltarButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  voltarButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PerfilPacienteScreen;