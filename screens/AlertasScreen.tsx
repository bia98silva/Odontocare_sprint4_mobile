import React, { useState, useEffect } from "react";
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert 
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AlertaService, AuthService, PacienteService } from "../services/api/Api";
import { RootStackParamList } from "../App"; // Importe RootStackParamList do App.tsx

// Defina o tipo para o navigation
type AlertasScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Interface para alerta
interface Alerta {
  id: number;
  pacienteId: number;
  titulo: string;
  descricao?: string;
  data: string;
  lido: boolean;
}

// Interface para usuário
interface Usuario {
  id: number;
  tipo: string;
}

// Interface para paciente
interface Paciente {
  id: number;
  usuarioId: number;
}

const AlertasScreen = () => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  
  // Use o tipo correto para navigation
  const navigation = useNavigation<AlertasScreenNavigationProp>();

  // Carregar alertas sempre que a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      carregarAlertas();
    }, [])
  );

  useEffect(() => {
    carregarAlertas();
  }, []);

  const carregarAlertas = async () => {
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
        const paciente = await PacienteService.getByUsuarioId(usuario.id);
        setPacienteId(paciente.id);
        
        // Buscar alertas
        const response = await AlertaService.getByPacienteId(paciente.id);
        setAlertas(response);
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
      Alert.alert("Erro", "Não foi possível carregar os alertas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    carregarAlertas();
  };

  const marcarComoLido = async (id: number) => {
    try {
      await AlertaService.marcarComoLido(id);
      // Atualizar o estado local
      setAlertas(alertas.map(alerta => 
        alerta.id === id ? { ...alerta, lido: true } : alerta
      ));
    } catch (error) {
      console.error("Erro ao marcar alerta como lido:", error);
      Alert.alert("Erro", "Não foi possível marcar o alerta como lido.");
    }
  };

  const marcarTodosComoLidos = async () => {
    try {
      if (pacienteId) {
        await AlertaService.marcarTodosComoLidos(pacienteId);
        // Atualizar o estado local
        setAlertas(alertas.map(alerta => ({ ...alerta, lido: true })));
        Alert.alert("Sucesso", "Todos os alertas foram marcados como lidos.");
      }
    } catch (error) {
      console.error("Erro ao marcar todos alertas como lidos:", error);
      Alert.alert("Erro", "Não foi possível marcar todos os alertas como lidos.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Carregando alertas...</Text>
      </View>
    );
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' às ' + 
           data.getHours().toString().padStart(2, '0') + ':' + 
           data.getMinutes().toString().padStart(2, '0');
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Alertas</Text>

        {alertas.length > 0 && (
          <TouchableOpacity
            style={styles.marcarTodosButton}
            onPress={marcarTodosComoLidos}
          >
            <Text style={styles.marcarTodosButtonText}>Marcar todos como lidos</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={alertas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.alertItem,
                !item.lido && styles.alertItemNaoLido
              ]}
              onPress={() => marcarComoLido(item.id)}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitulo}>{item.titulo}</Text>
                <Text style={styles.alertData}>
                  {formatarData(item.data)}
                </Text>
              </View>
              
              {item.descricao && (
                <Text style={styles.alertDescricao}>{item.descricao}</Text>
              )}
              
              {!item.lido && (
                <View style={styles.naoLidoIndicator} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Você não possui alertas no momento.
            </Text>
          }
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.flatListContainer}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#003366", 
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  innerContainer: {
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    width: '100%',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 20,
    marginTop: 20,
  },
  marcarTodosButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignSelf: 'flex-end',
  },
  marcarTodosButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  alertItem: {
    backgroundColor: "#FFF",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    width: '100%',
    elevation: 3,
    position: 'relative',
  },
  alertItemNaoLido: {
    backgroundColor: "#e6f7ff",
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  alertTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  alertData: {
    fontSize: 12,
    color: "#666",
  },
  alertDescricao: {
    fontSize: 14,
    color: "#333",
  },
  naoLidoIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007bff",
  },
  emptyText: {
    color: "#FFF",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  flatListContainer: {
    flexGrow: 1, 
    width: '100%',
    paddingBottom: 20, 
  },
});

export default AlertasScreen;