import React, { useState, useEffect } from 'react';
import { 
  View, TextInput, Text, TouchableOpacity, ActivityIndicator, 
  Alert, Image, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthService } from '../services/api/Api';
import { RootStackParamList } from '../App'; // Importe RootStackParamList do App.tsx

// Defina o tipo para o navigation
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Interface para usuário
interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Use o tipo correto para navigation
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Verificar se usuário já está logado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const usuario = await AuthService.getUsuarioLogado();
        if (usuario) {
          navigation.navigate('Funcionalidades');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    
    try {
      // Chamar serviço de autenticação
      await AuthService.login(email, password);
      navigation.navigate('Funcionalidades');
    } catch (error) {
      console.error('Erro de login:', error);
      Alert.alert(
        'Erro de autenticação', 
        'Email ou senha incorretos. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    // Navegação para tela de cadastro
    navigation.navigate('Cadastro');
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Verificando autenticação...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo2.png')} style={styles.logo} />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#FFF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#FFF"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRegister}>
        <Text style={styles.registerText}>Ainda não tem uma conta? Cadastre-se</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#007AFF', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 10,
  },
  logoContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    borderRadius: 10,
    padding: 10, 
    marginBottom: 20, 
  },
  logo: {
    width: 120,  
    height: 120, 
    resizeMode: 'contain', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 5, 
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#FFF', 
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#003366', 
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF', 
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerText: {
    color: '#FFF', 
    fontSize: 16,
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;