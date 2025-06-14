import React, { useState, useContext, useRef } from 'react'; // Import useRef
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameContext } from '../GameContext'; // Assuming you have useGame hook

// --- Tutorial Content Data (remains the same) ---
const tutorialPages = [
  {
    key: '1',
    icon: 'card-outline',
    title: 'Getting Started with Capital',
    steps: [
      'Welcome, Tycoon! You start with nothing but ambition.',
      'To begin your empire, you need capital. Navigate to the Bank Hub.',
      'Select an available bank to see the loans they offer.',
      'Take out a Personal Loan to get your first injection of cash.',
      'Use this money wisely to start buying properties!',
    ],
  },
  {
    key: '2',
    icon: 'cash-outline',
    title: 'Buy & Sell Properties',
    steps: [
      'Go to the Market to find properties for sale.',
      'Consider hiring an Agent to inspect for hidden issues.',
      'Negotiate the price and purchase the property.',
      'Renovate and install Upgrades from your Portfolio to increase its value.',
      'List the property for sale and wait for the best offer!',
    ],
  },
  {
    key: '3',
    icon: 'business-outline',
    title: 'Build From Scratch',
    steps: [
      'Purchase empty Land from the Land Market.',
      'From your Portfolio, select "Develop" on your land plot.',
      'Hire a skilled Architectural Firm for the job.',
      'Choose a Blueprint for the building you want to construct.',
      'Assign an available Supervisor to manage the project.',
    ],
  },
  {
    key: '4',
    icon: 'people-outline',
    title: 'Manage Your Staff',
    steps: [
      'You need staff to build and renovate!',
      'Navigate to the Staff Center from the Home Screen.',
      'In the "Hiring Agency" tab, hire employees with different skills.',
      'Staff require a daily salary, but efficient staff work faster.',
    ],
  },
  {
    key: '5',
    icon: 'stats-chart-outline',
    title: 'Watch Your Finances',
    steps: [
        'Every tycoon knows their numbers.',
        'Go to the Bank Hub, then the Financial Center.',
        'Review your Balance Sheet to see your Net Worth.',
        'Check the Property Ledger for your profit/loss history.',
    ],
  },
];

const { width } = Dimensions.get('window');

// --- Tutorial Page Component (remains the same) ---
const TutorialPage = ({ item }) => (
    <View style={styles.page}>
        <Ionicons name={item.icon} size={100} color="#FFD700" />
        <Text style={styles.title}>{item.title}</Text>
        {item.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
            </View>
        ))}
    </View>
);

// --- Main Tutorial Screen (with new logic) ---
const TutorialScreen = ({ navigation }) => {
  const { completeTutorial } = useContext(GameContext); // Using the helper hook
  const [activeIndex, setActiveIndex] = useState(0);

  // --- NEW: Create a ref for the FlatList ---
  const flatListRef = useRef(null);

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleGetStarted = () => {
    completeTutorial();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  // --- NEW: A smarter handler for the main button ---
  const handleNextPress = () => {
    const isLastPage = activeIndex === tutorialPages.length - 1;

    if (isLastPage) {
      // If on the last page, finish the tutorial
      handleGetStarted();
    } else {
      // Otherwise, scroll to the next page
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  };

  return (
    <View style={{ flex: 1 }}>
          <LinearGradient colors={['#141E30', '#243B55']} style={styles.background} />

    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef} // <-- Assign the ref here
        data={tutorialPages}
        renderItem={({ item }) => <TutorialPage item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      <View style={styles.pagination}>
        {tutorialPages.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
        ))}
      </View>
      
      {/* --- UPDATE: The button now uses the new handler and dynamic text --- */}
      <TouchableOpacity style={styles.actionButton} onPress={handleNextPress}>
        <Text style={styles.actionButtonText}>
          {activeIndex === tutorialPages.length - 1 ? "Let's Go!" : "Next"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  page: { width: width, padding: 30, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  stepRow: { flexDirection: 'row', width: '90%', marginVertical: 8, alignItems: 'flex-start' },
  stepNumber: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  stepText: { color: '#ccc', fontSize: 18, flex: 1, lineHeight: 24 },
  pagination: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 120, alignSelf: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 5 },
  activeDot: { backgroundColor: '#FFD700' },
  actionButton: { position: 'absolute', bottom: 40, backgroundColor: '#43e97b', paddingVertical: 15, paddingHorizontal: 50, borderRadius: 30, alignSelf: 'center' },
  actionButtonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
});

export default TutorialScreen;