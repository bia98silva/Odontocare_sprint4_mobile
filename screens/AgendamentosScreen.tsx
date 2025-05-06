import React, { useState, useEffect } from "react";
import { 
  View, Text, Button, Alert, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Modal, TextInput
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AgendamentoService, AuthService, PacienteService } from "../services/api/Api";
import { RootStackParamList } from "../App"; // Importe RootStackParamList do App.tsx


type AgendamentosScreenNavigationProp = StackNavigationProp<RootStackParamList>;


interface Agendamento {
  id: number;
  pacienteId: number;
  data: string;
  tipo: string;
  observacoes: string;
  status: string;
}


interface Usuario {
  id: number;
  tipo: string;
}

interface Paciente {
  id: number;
  usuarioId: number;
}

const AgendamentosScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [novoAgendamento, setNovoAgendamento] = useState({
    data: "",
    tipo: "Consulta de rotina",
    observacoes: ""
  });
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  

  const navigation = useNavigation<AgendamentosScreenNavigationProp>();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
     
      const usuario = await AuthService.getUsuarioLogado();
      if (!usuario) {
     
        navigation.navigate("Login");
        return;
      }
      
    
      if (usuario.tipo === 'paciente') {
        const paciente = await PacienteService.getByUsuarioId(usuario.id);
        setPacienteId(paciente.id);
        
      
        const response = await AgendamentoService.getByPacienteId(paciente.id);
        setAgendamentos(response);
      
        const marcacoes: Record<string, any> = {};
        response.forEach(agendamento => {
          const data = new Date(agendamento.data);
          const dataString = data.toISOString().split('T')[0];
          marcacoes[dataString] = {
            selected: true,
            marked: true,
            selectedColor: agendamento.status === 'agendado' ? 'blue' : 
                          agendamento.status === 'confirmado' ? 'green' : 
                          agendamento.status === 'cancelado' ? 'red' : 'orange'
          };
        });
        setMarkedDates(marcacoes);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      Alert.alert("Erro", "Não foi possível carregar os agendamentos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setNovoAgendamento({
      ...novoAgendamento,
      data: day.dateString
    });
  };

  const confirmarAgendamento = async () => {
    if (!selectedDate) {
      Alert.alert("Erro", "Por favor, selecione uma data antes de confirmar.");
      return;
    }

    try {
      setLoading(true);
      
   
      if (!pacienteId) {
        Alert.alert("Erro", "Informações do paciente não encontradas.");
        return;
      }
      
    
      const dataHora = new Date(selectedDate);
      dataHora.setHours(12, 0, 0);
      
      const dados = {
        pacienteId: pacienteId,
        data: dataHora.toISOString(),
        tipo: novoAgendamento.tipo,
        observacoes: novoAgendamento.observacoes,
        status: "agendado"
      };
  
      await AgendamentoService.create(dados);
      
      Alert.alert("Sucesso", `Seu agendamento foi marcado para ${selectedDate}`);
      
   
      await carregarDados();
      

      setModalVisible(false);
      setSelectedDate(null);
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      Alert.alert("Erro", "Não foi possível confirmar o agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNovoAgendamento = () => {
    setSelectedDate(null);
    setNovoAgendamento({
      data: "",
      tipo: "Consulta de rotina",
      observacoes: ""
    });
    setModalVisible(true);
  };

  const cancelarAgendamento = async (id: number) => {
    try {
      setLoading(true);
      await AgendamentoService.updateStatus(id, "cancelado");
      Alert.alert("Sucesso", "Agendamento cancelado com sucesso!");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      Alert.alert("Erro", "Não foi possível cancelar o agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' às ' + 
           data.getHours().toString().padStart(2, '0') + ':' + 
           data.getMinutes().toString().padStart(2, '0');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Carregando agendamentos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Agendamentos</Text>
      
      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.agendamentoItem}>
            <Text style={styles.agendamentoData}>
              {formatarData(item.data)}
            </Text>
            <Text style={styles.agendamentoTipo}>{item.tipo}</Text>
            <Text style={styles.agendamentoStatus}>
              Status: <Text style={{
                color: item.status === 'agendado' ? 'blue' : 
                       item.status === 'confirmado' ? 'green' : 
                       item.status === 'cancelado' ? 'red' : 'orange'
              }}>
                {item.status.toUpperCase()}
              </Text>
            </Text>
            {item.observacoes && (
              <Text style={styles.agendamentoObs}>
                Obs: {item.observacoes}
              </Text>
            )}
            
            {(item.status === 'agendado' || item.status === 'confirmado') && (
              <TouchableOpacity
                style={styles.cancelarButton}
                onPress={() => {
                  Alert.alert(
                    "Cancelar Agendamento",
                    "Tem certeza que deseja cancelar este agendamento?",
                    [
                      { text: "Não", style: "cancel" },
                      { text: "Sim", onPress: () => cancelarAgendamento(item.id) }
                    ]
                  );
                }}
              >
                <Text style={styles.cancelarButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Você não possui agendamentos. Clique no botão abaixo para agendar.
          </Text>
        }
        style={styles.agendamentosList}
      />

      <TouchableOpacity
        style={styles.novoAgendamentoButton}
        onPress={abrirModalNovoAgendamento}
      >
        <Text style={styles.novoAgendamentoButtonText}>Novo Agendamento</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.voltarButton} onPress={() => navigation.goBack()}>
        <Text style={styles.voltarButtonText}>Voltar</Text>
      </TouchableOpacity>

      {/* Modal para novo agendamento */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Agendamento</Text>
            
            <Text style={styles.calendarLabel}>Selecione uma data:</Text>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                ...markedDates,
                ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: 'blue' } } : {})
              }}
              style={styles.calendar}
            />
            
            <Text style={styles.inputLabel}>Tipo de Consulta:</Text>
            <TextInput
              style={styles.input}
              value={novoAgendamento.tipo}
              onChangeText={(text) => setNovoAgendamento({...novoAgendamento, tipo: text})}
              placeholder="Ex: Consulta de rotina, Limpeza, etc."
            />
            
            <Text style={styles.inputLabel}>Observações:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={novoAgendamento.observacoes}
              onChangeText={(text) => setNovoAgendamento({...novoAgendamento, observacoes: text})}
              placeholder="Adicione observações (opcional)"
              multiline={true}
              numberOfLines={3}
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]} 
                onPress={confirmarAgendamento}
                disabled={!selectedDate}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#003366", 
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
    color: "#FFF", 
  },
  agendamentosList: {
    width: '100%',
    marginBottom: 10,
  },
  agendamentoItem: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  agendamentoData: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  agendamentoTipo: {
    fontSize: 14,
    marginBottom: 5,
  },
  agendamentoStatus: {
    fontSize: 14,
    marginBottom: 5,
  },
  agendamentoObs: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 5,
  },
  cancelarButton: {
    backgroundColor: "#ff6b6b",
    padding: 8,
    borderRadius: 5,
    alignSelf: "flex-end",
    marginTop: 5,
  },
  cancelarButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#FFF",
    fontSize: 16,
    marginVertical: 20,
  },
  novoAgendamentoButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  novoAgendamentoButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  voltarButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  voltarButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  calendarLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  calendar: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default AgendamentosScreen; 