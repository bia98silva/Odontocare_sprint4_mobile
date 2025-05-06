import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthService, PacienteService } from '../services/api/Api';
import { RootStackParamList } from '../App'; // Importe RootStackParamList do App.tsx

// Defina o tipo para o navigation
type CadastroScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Interface para dados do formulário
interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
  dataNascimento: string;
}

// Interface para dados do usuário
interface UsuarioData {
  nome: string;
  email: string;
  senha: string;
  tipo: string;
  id?: number;
}

// Interface para dados do paciente
interface PacienteData {
  usuarioId: number;
  nome: string;
  dataNascimento: string | null;
  telefone: string;
  pontos: number;
}

const CadastroScreen = () => {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    dataNascimento: '',
  });
  const [loading, setLoading] = useState(false);
  
  // Use o tipo correto para navigation
  const navigation = useNavigation<CadastroScreenNavigationProp>();

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validarFormulario = (): boolean => {
    // Validação básica
    if (!formData.nome || !formData.email || !formData.senha || !formData.confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return false;
    }

    if (formData.senha !== formData.confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return false;
    }

    // Validação de email simples
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erro', 'Por favor, informe um email válido.');
      return false;
    }

    // Validação de data (opcional)
    if (formData.dataNascimento) {
      const dataRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dataRegex.test(formData.dataNascimento)) {
        Alert.alert('Erro', 'A data de nascimento deve estar no formato DD/MM/AAAA.');
        return false;
      }
    }

    return true;
  };

  const handleCadastro = async () => {
    if (!validarFormulario()) return;

    try {
      setLoading(true);

      // Converter data para formato ISO se necessário
      let dataNascimentoFormatada: string | null = null;
      if (formData.dataNascimento) {
        const partes = formData.dataNascimento.split('/');
        if (partes.length === 3) {
          dataNascimentoFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
      }

      // Primeiro, criar o usuário
      const usuarioData: UsuarioData = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        tipo: 'paciente',
      };

      const usuarioCriado = await AuthService.registro(usuarioData);

      // Depois, criar o perfil de paciente usando o método apropriado
      // Utilizando update em vez de create (que não existe no serviço)
      const pacienteData: PacienteData = {
        usuarioId: usuarioCriado.id,
        nome: formData.nome,
        dataNascimento: dataNascimentoFormatada,
        telefone: formData.telefone,
        pontos: 0
      };

      // Supondo que PacienteService.update também possa ser usado para criar
      // quando um ID não existe, ou use outro método disponível no serviço
      await PacienteService.update(usuarioCriado.id, pacienteData);

      // Fazer login automático após cadastro
      await AuthService.login(formData.email, formData.senha);

      Alert.alert(
        'Sucesso', 
        'Cadastro realizado com sucesso!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Funcionalidades') 
          }
        ]
      );
    } catch (error) {
      console.error('Erro no cadastro:', error);
      Alert.alert(
        'Erro', 
        'Não foi possível realizar o cadastro. Verifique os dados e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo2.png')} style={styles.logo} />
        </View>

        <Text style={styles.title}>Cadastro</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome completo"
            placeholderTextColor="#999"
            value={formData.nome}
            onChangeText={(text) => handleChange('nome', text)}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#999"
            secureTextEntry
            value={formData.senha}
            onChangeText={(text) => handleChange('senha', text)}
          />

          <Text style={styles.label}>Confirmar Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirme sua senha"
            placeholderTextColor="#999"
            secureTextEntry
            value={formData.confirmarSenha}
            onChangeText={(text) => handleChange('confirmarSenha', text)}
          />

          <Text style={styles.label}>Telefone (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={formData.telefone}
            onChangeText={(text) => handleChange('telefone', text)}
          />

          <Text style={styles.label}>Data de Nascimento (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={formData.dataNascimento}
            onChangeText={(text) => handleChange('dataNascimento', text)}
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleCadastro}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>Já tem uma conta? Faça login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 10,
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: '#FFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#003366',
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#FFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default CadastroScreen;