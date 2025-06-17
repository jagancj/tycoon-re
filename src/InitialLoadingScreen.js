import React, { useContext, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GameContext } from '../GameContext';
import { LinearGradient } from 'expo-linear-gradient';

const InitialLoadingScreen = ({ navigation }) => {
  // We get the whole context value. We don't destructure here yet
  // to avoid the crash if the context value is still undefined on the very first render.
  const gameContext = useContext(GameContext);    useEffect(() => {
    // This effect runs when the context value is finally available and not loading.
    if (gameContext && !gameContext.isLoading) {
      // Add a small delay to ensure all data is properly loaded and state is synchronized
      const navigationTimeout = setTimeout(() => {
        // Use explicit boolean check to ensure we have a definitive value
        const hasCompletedTutorial = gameContext.hasCompletedTutorial === true;
        const destination = hasCompletedTutorial ? 'Home' : 'Tutorial';
        
        console.log('Navigation decision:', {
          hasCompletedTutorial: gameContext.hasCompletedTutorial,
          explicitCheck: hasCompletedTutorial,
          destination: destination,
          contextKeys: Object.keys(gameContext || {}),
          playerLevel: gameContext.playerLevel,
          gameMoney: gameContext.gameMoney,
        });
        
        // Reset the entire navigation stack to the correct starting screen.
        // This prevents the user from ever being able to go "back" to the loading screen.
        navigation.reset({
          index: 0,
          routes: [{ name: destination }],
        });
      }, 300); // Increased delay to ensure state is fully synchronized

      return () => clearTimeout(navigationTimeout);
    }
  }, [gameContext, navigation]); // Depend on the entire context object

  // While waiting, show a loading spinner.
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#141E30', '#243B55']} style={styles.background} />
      <ActivityIndicator size="large" color="#FFD700" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
});

export default InitialLoadingScreen;