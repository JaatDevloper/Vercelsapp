import React from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { Pressable } from "react-native";

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={styles.headerTitle}>Privacy Policy</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.paragraph}>
          <strong>Privacy Policy</strong>
          {"\n\n"}
          This privacy policy applies to the QuizzyEdu app (hereby referred to as "Application") for mobile devices that was created by Govind Chowdhury (hereby referred to as "Service Provider") as a Freemium service. This service is intended for use "AS IS".
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Information Collection and Use</ThemedText>
        <ThemedText style={styles.paragraph}>
          The Application collects information when you download and use it. This information may include information such as:
          {"\n"}• Your device's Internet Protocol address (e.g. IP address)
          {"\n"}• The pages of the Application that you visit, the time and date of your visit, the time spent on those pages
          {"\n"}• The time spent on the Application
          {"\n"}• The operating system you use on your mobile device
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          The Application does not gather precise information about the location of your mobile device.
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          The Service Provider may use the information you provided to contact you from time to time to provide you with important information, required notices and marketing promotions.
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          For a better experience, while using the Application, the Service Provider may require you to provide us with certain personally identifiable information, including but not limited to Email, Name, profile Password. The information that the Service Provider request will be retained by them and used as described in this privacy policy.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Third Party Access</ThemedText>
        <ThemedText style={styles.paragraph}>
          Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider in improving the Application and their service. The Service Provider may share your information with third parties in the ways that are described in this privacy statement.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Opt-Out Rights</ThemedText>
        <ThemedText style={styles.paragraph}>
          You can stop all collection of information by the Application easily by uninstalling it. You may use the standard uninstall processes as may be available as part of your mobile device or via the mobile application marketplace or network.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Data Retention Policy</ThemedText>
        <ThemedText style={styles.paragraph}>
          The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter. If you'd like them to delete User Provided Data that you have provided via the Application, please contact them at jaatcoderx@gmail.com and they will respond in a reasonable time.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Children</ThemedText>
        <ThemedText style={styles.paragraph}>
          The Service Provider does not use the Application to knowingly solicit data from or market to children under the age of 13.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Security</ThemedText>
        <ThemedText style={styles.paragraph}>
          The Service Provider is concerned about safeguarding the confidentiality of your information. The Service Provider provides physical, electronic, and procedural safeguards to protect information the Service Provider processes and maintains.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Changes</ThemedText>
        <ThemedText style={styles.paragraph}>
          This Privacy Policy may be updated from time to time for any reason. The Service Provider will notify you of any changes to the Privacy Policy by updating this page with the new Privacy Policy. You are advised to consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          This privacy policy is effective as of 2025-12-26
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Your Consent</ThemedText>
        <ThemedText style={styles.paragraph}>
          By using the Application, you are consenting to the processing of your information as set forth in this Privacy Policy now and as amended by us.
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
        <ThemedText style={styles.paragraph}>
          If you have any questions regarding privacy while using the Application, or have questions about the practices, please contact the Service Provider via email at jaatcoderx@gmail.com.
        </ThemedText>
      </ScrollView>
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
  headerTitle: {
    fontWeight: "700",
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
    opacity: 0.8,
  },
});