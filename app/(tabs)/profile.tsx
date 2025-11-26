import { AIBackground } from "@/components/ui/AIBackground";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { WiseColors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import capitalize from "@/utils/capitalize";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  // Get current user from Convex
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateCurrentUserProfile);
  const disconnectMessenger = useMutation(api.users.disconnectMessengerAndRegenerateCode);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Common underlying conditions options
  const underlyingConditionsOptions = [
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'hypertension', label: 'Hypertension' },
    { value: 'heart_disease', label: 'Heart Disease' },
    { value: 'asthma', label: 'Asthma' },
    { value: 'arthritis', label: 'Arthritis' },
    { value: 'back_pain', label: 'Back Pain' },
    { value: 'obesity', label: 'Obesity' },
    { value: 'depression', label: 'Depression' },
    { value: 'anxiety', label: 'Anxiety' },
    { value: 'thyroid', label: 'Thyroid Disorder' },
    { value: 'allergies', label: 'Allergies' },
    { value: 'migraine', label: 'Migraine' },
    { value: 'sleep_disorder', label: 'Sleep Disorder' },
    { value: 'none', label: 'None' },
  ];

  // Helper to parse conditions string to array
  const parseConditionsToArray = (conditionsString: string | undefined): string[] => {
    if (!conditionsString) return [];
    return conditionsString.split(', ').map(c => c.trim().toLowerCase().replace(/ /g, '_')).filter(c => c);
  };

  // Helper to convert conditions array to string
  const conditionsArrayToString = (conditions: string[]): string => {
    return conditions
      .map(c => underlyingConditionsOptions.find(opt => opt.value === c)?.label || c)
      .join(', ');
  };

  // Form state
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    fitnessLevel: '',
    underlyingConditions: [] as string[],
    height: '',
    weight: '',
    timezone: '',
    language: '',
    notificationTypes: [] as string[],
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (currentUser) {
      const healthProfile = currentUser.healthProfile || {};
      const preferences = currentUser.preferences || {};
      setFormData({
        age: healthProfile.age?.toString() || '',
        gender: healthProfile.gender || '',
        fitnessLevel: healthProfile.fitnessLevel || '',
        underlyingConditions: parseConditionsToArray(healthProfile.underlyingConditions),
        height: healthProfile.height?.toString() || '',
        weight: healthProfile.weight?.toString() || '',
        timezone: preferences.preferredTimezone || '',
        language: preferences.language || '',
        notificationTypes: preferences.notificationTypes || [],
      });
    }
  }, [currentUser]);

  // Form handlers
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Reset form data to current user values
    if (currentUser) {
      const healthProfile = currentUser.healthProfile || {};
      const preferences = currentUser.preferences || {};
      setFormData({
        age: healthProfile.age?.toString() || '',
        gender: healthProfile.gender || '',
        fitnessLevel: healthProfile.fitnessLevel || '',
        underlyingConditions: parseConditionsToArray(healthProfile.underlyingConditions),
        height: healthProfile.height?.toString() || '',
        weight: healthProfile.weight?.toString() || '',
        timezone: preferences.preferredTimezone || '',
        language: preferences.language || '',
        notificationTypes: preferences.notificationTypes || [],
      });
    }
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      await updateProfile({
        healthProfile: {
          age: formData.age ? parseInt(formData.age) : undefined,
          gender: formData.gender || undefined,
          fitnessLevel: formData.fitnessLevel || undefined,
          underlyingConditions: formData.underlyingConditions.length > 0 
            ? conditionsArrayToString(formData.underlyingConditions) 
            : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
        },
        preferences: {
          preferredTimezone: formData.timezone || undefined,
          language: formData.language || undefined,
          notificationTypes: formData.notificationTypes,
        },
      });
      setIsEditing(false);
      // Show success message
      Alert.alert("Success", "Your profile has been updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 justify-center items-center bg-wise-background">
        <ActivityIndicator size="large" color={WiseColors.primary} />
        <Text className="mt-4 font-sans-medium text-base text-wise-text-secondary">
          Loading profile...
        </Text>
      </View>
    );
  }

  const healthProfile = currentUser.healthProfile || {};
  const preferences = currentUser.preferences || {};

  const copyToClipboard = async () => {
    if (currentUser.uniqueCode) {
      await Clipboard.setStringAsync(currentUser.uniqueCode);
    }
  };

  const handleDisconnectMessenger = async () => {
    Alert.alert(
      "Disconnect Messenger",
      "This will disconnect your Messenger account and generate a new connection code. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setIsDisconnecting(true);
            try {
              await disconnectMessenger();
              Alert.alert("Success", "Messenger disconnected. A new code has been generated.");
            } catch (error) {
              console.error("Error disconnecting messenger:", error);
              Alert.alert("Error", "Failed to disconnect. Please try again.");
            } finally {
              setIsDisconnecting(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <View className="flex-1 bg-wise-background">
      <AIBackground className="flex-1">
        <Header 
          title="Profile" 
          subtitle="Your account" 
          showAvatar={false}
          rightAction={
            !isEditing ? (
              <TouchableOpacity 
                onPress={handleStartEdit}
                className="w-10 h-10 bg-wise-primary/10 rounded-full items-center justify-center"
              >
                <IconSymbol name="pencil" size={18} color={WiseColors.primary} />
              </TouchableOpacity>
            ) : null
          }
        />
        <ScrollView 
          className="flex-1 pt-2"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <AnimatedSection index={0} className="px-4 mb-6">
            <Card padding="lg">
              <View className="items-center">
                {/* Avatar */}
                <View className="relative mb-4">
                  {user?.imageUrl ? (
                    <Image 
                      source={{ uri: user.imageUrl }} 
                      className="w-24 h-24 rounded-full border-4 border-wise-primary/20" 
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-wise-primary/10 justify-center items-center border-4 border-wise-primary/20">
                      <Text className="font-archivo-bold text-3xl text-wise-primary">
                        {currentUser.displayName?.charAt(0) || "U"}
                      </Text>
                    </View>
                  )}
                  {/* Online indicator */}
                  <View className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                </View>
                
                <Text className="font-archivo-bold text-2xl text-wise-text">
                  {currentUser.displayName || user?.firstName || "User"}
                </Text>
                <Text className="font-sans text-sm text-wise-text-secondary mt-1">
                  {currentUser.email}
                </Text>
              </View>

              {/* Quick Stats Row */}
              <View className="flex-row mt-6 pt-6 border-t border-wise-border">
                <View className="flex-1 items-center">
                  <View className="w-10 h-10 bg-wise-primary/10 rounded-lg items-center justify-center mb-2">
                    <IconSymbol name="ruler" size={18} color={WiseColors.primary} />
                  </View>
                  <Text className="font-archivo-bold text-lg text-wise-text">
                    {healthProfile.height || "—"}
                  </Text>
                  <Text className="font-sans text-xs text-wise-text-secondary">cm</Text>
                </View>
                <View className="flex-1 items-center border-x border-wise-border">
                  <View className="w-10 h-10 bg-wise-accent/10 rounded-lg items-center justify-center mb-2">
                    <IconSymbol name="scalemass" size={18} color={WiseColors.accent} />
                  </View>
                  <Text className="font-archivo-bold text-lg text-wise-text">
                    {healthProfile.weight || "—"}
                  </Text>
                  <Text className="font-sans text-xs text-wise-text-secondary">kg</Text>
                </View>
                <View className="flex-1 items-center">
                  <View className="w-10 h-10 bg-purple-100 rounded-lg items-center justify-center mb-2">
                    <IconSymbol name="figure.run" size={18} color="#8B5CF6" />
                  </View>
                  <Text className="font-archivo-bold text-lg text-wise-text">
                    {capitalize(healthProfile.fitnessLevel as string) || "—"}
                  </Text>
                  <Text className="font-sans text-xs text-wise-text-secondary">Level</Text>
                </View>
              </View>
            </Card>
          </AnimatedSection>

          {/* Messenger Connection */}
          <AnimatedSection index={1} className="px-4 mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-[#0084FF]/10 rounded-lg items-center justify-center mr-2">
                <IconSymbol name="message.fill" size={16} color="#0084FF" />
              </View>
              <Text className="font-archivo-bold text-xl text-wise-text">
                Messenger Bot
              </Text>
              {currentUser.messengerPsid ? (
                <View className="ml-2 bg-green-100 px-2 py-0.5 rounded-full">
                  <Text className="font-sans-bold text-[10px] text-green-600">LINKED</Text>
                </View>
              ) : (
                <View className="ml-2 bg-wise-accent/15 px-2 py-0.5 rounded-full">
                  <Text className="font-sans-bold text-[10px] text-wise-accent">PENDING</Text>
                </View>
              )}
            </View>
            
            <Card padding="md">
              <Text className="font-sans text-sm text-wise-text-secondary mb-3">
                {currentUser.messengerPsid 
                  ? "Your Messenger is connected. Chat with WellBuddy anytime!"
                  : "Send this code to WellBuddy bot to connect:"}
              </Text>
              
              {!currentUser.messengerPsid && (
                <TouchableOpacity 
                  className="flex-row items-center justify-between bg-wise-subtle p-4 rounded-xl mb-3"
                  onPress={copyToClipboard}
                  activeOpacity={0.7}
                >
                  <Text className="font-archivo-bold text-2xl text-wise-text tracking-[0.2em]">
                    {currentUser.uniqueCode || "..."}
                  </Text>
                  <View className="bg-wise-primary/10 p-2 rounded-lg">
                    <IconSymbol name="doc.on.doc" size={18} color={WiseColors.primary} />
                  </View>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={handleDisconnectMessenger}
                disabled={isDisconnecting}
                className={`flex-row items-center justify-center py-3 rounded-xl ${
                  currentUser.messengerPsid ? 'bg-red-50' : 'bg-wise-primary/5'
                }`}
              >
                {isDisconnecting ? (
                  <ActivityIndicator size="small" color={currentUser.messengerPsid ? "#EF4444" : WiseColors.primary} />
                ) : (
                  <>
                    <IconSymbol 
                      name={currentUser.messengerPsid ? "xmark.circle" : "arrow.clockwise"} 
                      size={16} 
                      color={currentUser.messengerPsid ? "#EF4444" : WiseColors.primary} 
                    />
                    <Text className={`ml-2 font-sans-medium text-sm ${
                      currentUser.messengerPsid ? 'text-red-500' : 'text-wise-primary'
                    }`}>
                      {currentUser.messengerPsid ? "Disconnect Messenger" : "Regenerate Code"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Card>
          </AnimatedSection>

          {/* Health Profile Section */}
          <AnimatedSection index={2} className="px-4 mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-2">
                <IconSymbol name="heart.fill" size={16} color="#10B981" />
              </View>
              <Text className="font-archivo-bold text-xl text-wise-text">
                Health Profile
              </Text>
            </View>
            
            <Card padding="md">
              {isEditing ? (
                <View className="space-y-4">
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <TextInput
                        label="Age"
                        value={formData.age}
                        onChangeText={(value) => handleFormChange('age', value)}
                        placeholder="25"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Select
                        label="Gender"
                        value={formData.gender}
                        onValueChange={(value) => handleFormChange('gender', value)}
                        options={[
                          { value: 'male', label: 'Male' },
                          { value: 'female', label: 'Female' },
                          { value: 'other', label: 'Other' },
                          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                        ]}
                        placeholder="Select"
                      />
                    </View>
                  </View>
                  <Select
                    label="Fitness Level"
                    value={formData.fitnessLevel}
                    onValueChange={(value) => handleFormChange('fitnessLevel', value)}
                    options={[
                      { value: 'beginner', label: 'Beginner' },
                      { value: 'intermediate', label: 'Intermediate' },
                      { value: 'advanced', label: 'Advanced' },
                    ]}
                    placeholder="Select fitness level"
                  />
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <TextInput
                        label="Height (cm)"
                        value={formData.height}
                        onChangeText={(value) => handleFormChange('height', value)}
                        placeholder="170"
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <TextInput
                        label="Weight (kg)"
                        value={formData.weight}
                        onChangeText={(value) => handleFormChange('weight', value)}
                        placeholder="70"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <MultiSelect
                    label="Health Conditions"
                    value={formData.underlyingConditions}
                    onValueChange={(value) => handleFormChange('underlyingConditions', value)}
                    options={underlyingConditionsOptions}
                    placeholder="Select any conditions..."
                  />
                </View>
              ) : (
                <View className="space-y-1">
                  {/* Info Rows with Icons */}
                  <View className="flex-row items-center py-3 border-b border-wise-border">
                    <View className="w-9 h-9 bg-wise-subtle rounded-lg items-center justify-center mr-3">
                      <IconSymbol name="calendar" size={16} color={WiseColors.textSecondary} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans text-xs text-wise-text-secondary">Age</Text>
                      <Text className="font-sans-medium text-base text-wise-text">
                        {healthProfile.age ? `${healthProfile.age} years` : "Not set"}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center py-3 border-b border-wise-border">
                    <View className="w-9 h-9 bg-wise-subtle rounded-lg items-center justify-center mr-3">
                      <IconSymbol name="person.fill" size={16} color={WiseColors.textSecondary} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans text-xs text-wise-text-secondary">Gender</Text>
                      <Text className="font-sans-medium text-base text-wise-text">
                        {capitalize(healthProfile.gender as string) || "Not set"}
                      </Text>
                    </View>
                  </View>

                  {healthProfile.underlyingConditions && (
                    <View className="flex-row items-start py-3">
                      <View className="w-9 h-9 bg-wise-subtle rounded-lg items-center justify-center mr-3">
                        <IconSymbol name="cross.case.fill" size={16} color={WiseColors.textSecondary} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-sans text-xs text-wise-text-secondary">Conditions</Text>
                        <Text className="font-sans-medium text-base text-wise-text">
                          {healthProfile.underlyingConditions}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Card>
          </AnimatedSection>

          {/* Preferences Section */}
          <AnimatedSection index={3} className="px-4 mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-wise-primary/10 rounded-lg items-center justify-center mr-2">
                <IconSymbol name="gearshape.fill" size={16} color={WiseColors.primary} />
              </View>
              <Text className="font-archivo-bold text-xl text-wise-text">
                Preferences
              </Text>
            </View>
            
            <Card padding="md">
              {isEditing ? (
                <View className="space-y-4">
                  <TextInput
                    label="Timezone"
                    value={formData.timezone}
                    onChangeText={(value) => handleFormChange('timezone', value)}
                    placeholder="e.g., Asia/Manila"
                  />
                  <Select
                    label="Language"
                    value={formData.language}
                    onValueChange={(value) => handleFormChange('language', value)}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'tl', label: 'Tagalog' },
                    ]}
                    placeholder="Select language"
                  />
                  <MultiSelect
                    label="Notifications"
                    value={formData.notificationTypes}
                    onValueChange={(value) => handleFormChange('notificationTypes', value)}
                    options={[
                      { value: 'push', label: 'Push Notifications' },
                      { value: 'messenger', label: 'Messenger' },
                    ]}
                    placeholder="Select notification types"
                  />
                </View>
              ) : (
                <View className="space-y-1">
                  <View className="flex-row items-center py-3 border-b border-wise-border">
                    <View className="w-9 h-9 bg-wise-subtle rounded-lg items-center justify-center mr-3">
                      <IconSymbol name="globe" size={16} color={WiseColors.textSecondary} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans text-xs text-wise-text-secondary">Timezone</Text>
                      <Text className="font-sans-medium text-base text-wise-text">
                        {preferences.preferredTimezone || "Not set"}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center py-3 border-b border-wise-border">
                    <View className="w-9 h-9 bg-wise-subtle rounded-lg items-center justify-center mr-3">
                      <IconSymbol name="textformat" size={16} color={WiseColors.textSecondary} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans text-xs text-wise-text-secondary">Language</Text>
                      <Text className="font-sans-medium text-base text-wise-text">
                        {preferences.language === 'en' ? 'English' :
                          preferences.language === 'tl' ? 'Tagalog' : "Not set"}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center py-3">
                    <View className="w-9 h-9 bg-wise-subtle rounded-lg items-center justify-center mr-3">
                      <IconSymbol name="bell.fill" size={16} color={WiseColors.textSecondary} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans text-xs text-wise-text-secondary">Notifications</Text>
                      <Text className="font-sans-medium text-base text-wise-text">
                        {preferences.notificationTypes && preferences.notificationTypes.length > 0
                          ? preferences.notificationTypes.map(type =>
                            type === 'push' ? 'Push' : type === 'messenger' ? 'Messenger' : type
                          ).join(' & ')
                          : "Not set"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </Card>
          </AnimatedSection>

          {/* Edit Mode Actions */}
          {isEditing && (
            <AnimatedSection index={4} className="px-4 mb-6">
              <View className="flex-row gap-3">
                <Button
                  title="Cancel"
                  onPress={handleCancelEdit}
                  variant="outline"
                  disabled={isSaving}
                  className="flex-1"
                />
                <Button
                  title="Save Changes"
                  onPress={handleSaveProfile}
                  loading={isSaving}
                  disabled={isSaving}
                  className="flex-1"
                />
              </View>
            </AnimatedSection>
          )}

          {/* Sign Out */}
          <AnimatedSection index={5} className="px-4 mb-8">
            <TouchableOpacity 
              onPress={handleSignOut}
              className="flex-row items-center justify-center py-4 bg-red-50 rounded-xl"
            >
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color="#EF4444" />
              <Text className="ml-2 font-sans-medium text-base text-red-500">Sign Out</Text>
            </TouchableOpacity>
            
            <Text className="font-sans text-xs text-wise-text-secondary text-center mt-4">
              WellBuddy v1.0.0
            </Text>
          </AnimatedSection>

          <View className="h-10" />
        </ScrollView>
      </AIBackground>
    </View>
  );
}

