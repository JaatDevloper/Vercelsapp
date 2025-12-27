import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface CreateQuizData {
  title: string;
  description: string;
  timer: 15 | 20 | 30;
  negativeMarking: 0 | 0.33 | 0.66;
  questions: Question[];
  category: string;
}

const TIMER_OPTIONS: (15 | 20 | 30)[] = [15, 20, 30];
const NEGATIVE_MARKING_OPTIONS: (0 | 0.33 | 0.66)[] = [0, 0.33, 0.66];

export default function CreateQuizScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [step, setStep] = useState<"basic" | "questions">("basic");
  const [loading, setLoading] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showNegativeModal, setShowNegativeModal] = useState(false);

  const [quizData, setQuizData] = useState<CreateQuizData>({
    title: "",
    description: "",
    timer: 15,
    negativeMarking: 0,
    questions: [],
    category: "General Knowledge",
  });

  const [questionInput, setQuestionInput] = useState("");

  const parseQuestions = (text: string): Question[] => {
    const questions: Question[] = [];
    const blocks = text.split(/\n\n+/);

    for (const block of blocks) {
      const lines = block.trim().split("\n").filter((l) => l.trim());
      if (lines.length < 5) continue;

      const question = lines[0].trim();
      const optionsText = lines.slice(1, 5);
      const options: string[] = [];
      let correctAnswer = -1;

      for (let i = 0; i < optionsText.length; i++) {
        let optionText = optionsText[i].trim();
        if (optionText.includes("✅")) {
          correctAnswer = i;
          optionText = optionText.replace("✅", "").trim();
        }
        options.push(optionText);
      }

      if (
        options.length === 4 &&
        correctAnswer !== -1 &&
        question.length > 0
      ) {
        questions.push({
          question,
          options,
          correctAnswer,
        });
      }
    }

    return questions;
  };


  const parseManualQuestions = () => {
    const parsedQuestions = parseQuestions(questionInput);

    if (parsedQuestions.length === 0) {
      Alert.alert(
        "No questions found",
        "Could not parse questions. Ensure each question has exactly 4 options with one marked with ✅"
      );
      return;
    }

    setQuizData((prev) => ({
      ...prev,
      questions: parsedQuestions,
    }));
    setStep("questions");
  };

  const handleCreateQuiz = async () => {
    if (!quizData.title.trim()) {
      Alert.alert("Error", "Please enter a quiz title");
      return;
    }

    if (quizData.questions.length === 0) {
      Alert.alert("Error", "Please add at least one question");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/create-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) throw new Error("Failed to create quiz");

      Alert.alert("Success", "Quiz created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderBasicStep = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepContainer}>
        <ThemedText type="h2" style={styles.stepTitle}>
          Quiz Details
        </ThemedText>

        {/* Title */}
        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>
            Quiz Title
          </ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="e.g., Indian History Basics"
            placeholderTextColor={theme.textSecondary}
            value={quizData.title}
            onChangeText={(text) =>
              setQuizData((prev) => ({ ...prev, title: text }))
            }
          />
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>
            Description
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textarea,
              { color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Describe your quiz"
            placeholderTextColor={theme.textSecondary}
            value={quizData.description}
            onChangeText={(text) =>
              setQuizData((prev) => ({ ...prev, description: text }))
            }
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Timer Selection */}
        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>
            Timer per Question (seconds)
          </ThemedText>
          <Pressable
            style={[styles.selectButton, { borderColor: theme.border }]}
            onPress={() => setShowTimerModal(true)}
          >
            <ThemedText type="body">{quizData.timer}s</ThemedText>
            <Feather name="chevron-down" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Negative Marking Selection */}
        <View style={styles.formGroup}>
          <ThemedText type="body" style={styles.label}>
            Negative Marking
          </ThemedText>
          <Pressable
            style={[styles.selectButton, { borderColor: theme.border }]}
            onPress={() => setShowNegativeModal(true)}
          >
            <ThemedText type="body">{quizData.negativeMarking}</ThemedText>
            <Feather name="chevron-down" size={20} color={theme.text} />
          </Pressable>
        </View>

      </View>
    </ScrollView>
  );

  const renderQuestionsStep = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepContainer}>
        <ThemedText type="h2" style={styles.stepTitle}>
          Add Questions
        </ThemedText>

        <ThemedText type="small" style={styles.formatHint}>
          Format: One question per block. Mark correct answer with ✅
        </ThemedText>
        <TextInput
          style={[
            styles.textarea,
            styles.largeTextarea,
            { color: theme.text, borderColor: theme.border },
          ]}
          placeholder={`महाराणा प्रताप कहा का राजा था?
(A) उदयपुर ✅
(B) चितौड़
(C) जयपुर
(D) जोधपुर`}
          placeholderTextColor={theme.textSecondary}
          value={questionInput}
          onChangeText={setQuestionInput}
          multiline
          numberOfLines={15}
        />

        {quizData.questions.length > 0 && (
          <View style={styles.questionsPreview}>
            <ThemedText type="body" style={styles.previewTitle}>
              Questions: {quizData.questions.length}
            </ThemedText>
            <FlatList
              data={quizData.questions.slice(0, 3)}
              keyExtractor={(_, index) => index.toString()}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <View style={styles.questionCard}>
                  <ThemedText type="small" style={styles.questionNumber}>
                    Q{index + 1}: {item.question}
                  </ThemedText>
                </View>
              )}
            />
            {quizData.questions.length > 3 && (
              <ThemedText type="small" style={styles.moreQuestions}>
                +{quizData.questions.length - 3} more
              </ThemedText>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">
          {step === "basic" ? "Create Quiz" : "Add Questions"}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {step === "basic" ? renderBasicStep() : renderQuestionsStep()}

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {step === "questions" && (
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setStep("basic")}
          >
            <ThemedText type="body" style={{ color: theme.text }}>
              Back
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: Colors.light.primary,
              opacity: loading ? 0.6 : 1,
            },
          ]}
          onPress={() => {
            if (step === "basic") {
              if (!useFileUpload) {
                parseManualQuestions();
              }
            } else {
              handleCreateQuiz();
            }
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {step === "basic" ? "Next" : "Create Quiz"}
            </ThemedText>
          )}
        </Pressable>
      </View>

      {/* Timer Modal */}
      <Modal visible={showTimerModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTimerModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <FlatList
              data={TIMER_OPTIONS}
              keyExtractor={(item) => item.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor:
                        quizData.timer === item
                          ? Colors.light.primary
                          : "transparent",
                    },
                  ]}
                  onPress={() => {
                    setQuizData((prev) => ({ ...prev, timer: item }));
                    setShowTimerModal(false);
                  }}
                >
                  <ThemedText
                    type="body"
                    style={{
                      color:
                        quizData.timer === item ? "#FFFFFF" : theme.text,
                      fontWeight: quizData.timer === item ? "600" : "400",
                    }}
                  >
                    {item} seconds
                  </ThemedText>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Negative Marking Modal */}
      <Modal visible={showNegativeModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowNegativeModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <FlatList
              data={NEGATIVE_MARKING_OPTIONS}
              keyExtractor={(item) => item.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor:
                        quizData.negativeMarking === item
                          ? Colors.light.primary
                          : "transparent",
                    },
                  ]}
                  onPress={() => {
                    setQuizData((prev) => ({
                      ...prev,
                      negativeMarking: item,
                    }));
                    setShowNegativeModal(false);
                  }}
                >
                  <ThemedText
                    type="body"
                    style={{
                      color:
                        quizData.negativeMarking === item
                          ? "#FFFFFF"
                          : theme.text,
                      fontWeight:
                        quizData.negativeMarking === item ? "600" : "400",
                    }}
                  >
                    {item}
                  </ThemedText>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  stepContainer: {
    padding: Spacing.lg,
  },
  stepTitle: {
    fontWeight: "700",
    marginBottom: Spacing.xl,
  },
  formGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  textarea: {
    textAlignVertical: "top",
    minHeight: 100,
    paddingVertical: Spacing.md,
  },
  largeTextarea: {
    minHeight: 300,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  methodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  methodButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
  },
  formatHint: {
    marginBottom: Spacing.md,
    fontStyle: "italic",
    opacity: 0.7,
  },
  questionsPreview: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  previewTitle: {
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  questionCard: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  questionNumber: {
    opacity: 0.8,
  },
  moreQuestions: {
    marginTop: Spacing.md,
    opacity: 0.6,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    maxWidth: 300,
    paddingVertical: Spacing.md,
  },
  modalOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
});
