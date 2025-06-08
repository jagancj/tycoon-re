import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameContext } from '../GameContext';
import { BLUEPRINT_LIST } from '../data/buildingBlueprints';
import { Ionicons } from '@expo/vector-icons';

const ConstructionScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const { constructionProjects, advanceConstructionPhase } = useContext(GameContext);

  const project = constructionProjects[projectId];

  // This effect will run when the project is completed and removed from the context state.
  // It safely navigates the user back to their portfolio.
  useEffect(() => {
    if (!project) {
      navigation.navigate('Portfolio');
    }
  }, [project, navigation]);
  
  // Guard clause to prevent crashes while the state is updating.
  if (!project) {
    return <SafeAreaView style={styles.container}><Text style={styles.loadingText}>Loading Project...</Text></SafeAreaView>;
  }

  const blueprint = BLUEPRINT_LIST.find(b => b.id === project.blueprintId);
  const isLastPhase = project.currentPhaseIndex === blueprint.phases.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#434343', '#000000']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Portfolio')}><Ionicons name="close-outline" size={32} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{blueprint.name}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Construction In Progress</Text>
        {blueprint.phases.map((phase, index) => {
          const isCompleted = index < project.currentPhaseIndex;
          const isInProgress = index === project.currentPhaseIndex && project.status === 'In Progress';
          const isReadyForNext = index === project.currentPhaseIndex && project.status === 'Phase Complete';

          return (
            <View key={phase.name} style={[styles.phaseCard, isInProgress && styles.activePhaseCard]}>
              <Ionicons name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'} size={32} color={isCompleted ? '#43e97b' : '#888'} />
              <View style={styles.phaseDetails}>
                <Text style={styles.phaseName}>{phase.name}</Text>
                <Text style={styles.phaseCost}>Cost: ${phase.cost.toLocaleString()}</Text>
                {isInProgress && (
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>{Math.floor(project.progress)}%</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressBarFill, { width: `${project.progress}%` }]} />
                    </View>
                  </View>
                )}
              </View>
              {isReadyForNext && (
                <TouchableOpacity style={styles.nextButton} onPress={() => advanceConstructionPhase(projectId)}>
                  <Text style={styles.nextButtonText}>{isLastPhase ? 'Complete Project' : 'Start Next Phase'}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
    loadingText: { color: 'white', fontSize: 18 },
    header: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginLeft: 15 },
    content: { padding: 20 },
    subtitle: { fontSize: 18, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 30 },
    phaseCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 10, marginBottom: 15, alignItems: 'center', opacity: 0.6 },
    activePhaseCard: { opacity: 1, borderWidth: 1, borderColor: '#ffae42' },
    phaseDetails: { flex: 1, marginLeft: 15 },
    phaseName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    phaseCost: { color: '#ccc', fontSize: 14, marginTop: 4 },
    progressContainer: { marginTop: 10 },
    progressText: { color: '#ffae42', fontSize: 12, alignSelf: 'flex-end', marginBottom: 2 },
    progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
    progressBarFill: { height: '100%', backgroundColor: '#ffae42', borderRadius: 4 },
    nextButton: { backgroundColor: '#43e97b', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
    nextButtonText: { color: 'black', fontWeight: 'bold' },
});

export default ConstructionScreen;