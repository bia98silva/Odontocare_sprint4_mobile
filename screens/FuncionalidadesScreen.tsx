
import React from 'react';
import { View, Image, TouchableOpacity, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';


type RootStackParamList = {
  Agendamentos: undefined;
  BuscarClinicas: undefined;
  Alertas: undefined;
  PerfilPaciente: undefined;
};

type FuncionalidadesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Agendamentos'>;

const FuncionalidadesScreen = () => {
  const navigation = useNavigation<FuncionalidadesScreenNavigationProp>();

  const handleNavigate = (screen: keyof RootStackParamList) => {
    try {
      navigation.navigate(screen);
    } catch (error) {
      ToastAndroid.show('Erro ao abrir tela: ' + error.message, ToastAndroid.SHORT);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
      {/* Ícones de navegação */}
      <TouchableOpacity onPress={() => handleNavigate('Agendamentos')}>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('Alertas')}>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleNavigate('PerfilPaciente')}>
      </TouchableOpacity>
    </View>
  );
};

export default FuncionalidadesScreen;
