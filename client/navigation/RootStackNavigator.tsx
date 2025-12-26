import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import QuizDetailsScreen from "@/screens/QuizDetailsScreen";
import QuizScreen from "@/screens/QuizScreen";
import ResultsScreen from "@/screens/ResultsScreen";
import CreateProfileScreen from "@/screens/CreateProfileScreen";
import LoginProfileScreen from "@/screens/LoginProfileScreen";
import OwnerLoginScreen from "@/screens/OwnerLoginScreen";
import CreateRoomScreen from "@/screens/CreateRoomScreen";
import JoinRoomScreen from "@/screens/JoinRoomScreen";
import LobbyScreen from "@/screens/LobbyScreen";
import MultiplayerQuizScreen from "@/screens/MultiplayerQuizScreen";
import MultiplayerResultsScreen from "@/screens/MultiplayerResultsScreen";
import BadgesScreen from "@/screens/BadgesScreen";
import AdminDashboardScreen from "@/screens/AdminDashboardScreen";
import ManageQuizzesScreen from "@/screens/ManageQuizzesScreen";
import HelpSupportScreen from "@/screens/HelpSupportScreen";
import PrivacyPolicyScreen from "@/screens/PrivacyPolicyScreen";
import TermsConditionsScreen from "@/screens/TermsConditionsScreen";
import ProfileSettingsScreen from "@/screens/ProfileSettingsScreen";
import ChangePasswordScreen from "@/screens/ChangePasswordScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  AdminDashboard: undefined;
  ManageQuizzes: undefined;
  QuizDetails: { quizId: string };
  Quiz: { quizId: string };
  CreateProfile: undefined;
  LoginProfile: undefined;
  OwnerLogin: undefined;
  Badges: undefined;
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  ProfileSettings: undefined;
  ChangePassword: undefined;
  CreateRoom: { quizId: string; quizTitle: string };
  JoinRoom: undefined;
  Lobby: { roomCode: string; odId: string; quizId: string; isHost: boolean; playerName: string };
  MultiplayerQuiz: { roomCode: string; odId: string; quizId: string; playerName: string };
  MultiplayerResults: { 
    roomCode: string; 
    odId: string; 
    playerName: string; 
    score: number; 
    correctAnswers: number; 
    totalQuestions: number;
    answers?: { 
      questionId: string; 
      selectedAnswer: number; 
      correctAnswer: number;
      isCorrect: boolean;
      question: string;
      options: string[];
    }[];
  };
  Results: { 
    quizId: string;
    score: number;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    negativeMarking: number;
    finalScore: number;
    answers: { 
      questionId: string; 
      selectedAnswer: number; 
      correctAnswer?: number;
      isCorrect: boolean;
      question?: string;
      options?: string[];
    }[];
    timeTaken: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="QuizDetails"
        component={QuizDetailsScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateProfile"
        component={CreateProfileScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LoginProfile"
        component={LoginProfileScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OwnerLogin"
        component={OwnerLoginScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateRoom"
        component={CreateRoomScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="JoinRoom"
        component={JoinRoomScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Lobby"
        component={LobbyScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MultiplayerQuiz"
        component={MultiplayerQuizScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MultiplayerResults"
        component={MultiplayerResultsScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Badges"
        component={BadgesScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ManageQuizzes"
        component={ManageQuizzesScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TermsConditions"
        component={TermsConditionsScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ProfileSettings"
        component={ProfileSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
