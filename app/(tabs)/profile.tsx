import { AIBackground } from "@/components/ui/AIBackground";
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
          subtitle="Manage your account"
          showAvatar={false} 
          rightAction={
            !isEditing && (
              <TouchableOpacity 
                onPress={handleStartEdit}
                className="w-min h-10 px-4 border-wise-primary border rounded-full flex flex-row bg-wise-surface items-center justify-center shadow-sm"
              >
                <IconSymbol name="pencil" size={15} color={WiseColors.primary} />
                <Text className="text-sm text-wise-primary ml-2">Edit Profile</Text>
              </TouchableOpacity>
            )
          }
        />
        
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View className="items-center mb-8 px-4">
            <View className="mb-4 shadow-md">
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} className="w-[100px] h-[100px] rounded-full border-4 border-wise-surface" />
              ) : (
                <View className="w-[100px] h-[100px] rounded-full bg-wise-primary-light justify-center items-center border-4 border-wise-surface">
                  <Text className="font-archivo-bold text-5xl text-wise-primary">
                    {currentUser.displayName?.charAt(0) || "U"}
                  </Text>
                </View>
              )}
            </View>
            <Text className="font-archivo-bold text-4xl tracking-tighter text-wise-text mb-1">
              {currentUser.displayName || user?.firstName || "User"}
            </Text>
            <Text className="font-sans text-base text-wise-text-secondary">
              {currentUser.email}
            </Text>
          </View>

          {/* Messenger Connection Code */}
          <View className="px-4 mb-8">
            <Text className="font-archivo-bold text-lg text-wise-text mb-4">
              Messenger Connection
            </Text>
            <Card padding="lg">
              <Text className="font-sans text-sm text-wise-text-secondary mb-4">
                Send this code to the WellBuddy Messenger bot to link your account:
              </Text>
              <TouchableOpacity 
                className="flex-row items-center justify-between bg-wise-subtle p-4 rounded-wise-md mb-4"
                onPress={copyToClipboard}
              >
                <Text className="font-archivo-bold text-xl text-wise-text tracking-widest">
                  {currentUser.uniqueCode || "Generating..."}
                </Text>
                <View className="bg-wise-surface px-2 py-1 rounded-wise-sm flex flex-row items-center gap-1">
                  <IconSymbol name="doc.on.doc" size={20} color={WiseColors.primary} />
                </View>
              </TouchableOpacity>
              <View className="flex-row items-center justify-between">
                <Text className="font-sans-medium text-base text-wise-text">Status:</Text>
                {currentUser.messengerPsid ? (
                  <View className="bg-wise-success/20 px-2 py-1 rounded-full">
                    <Text className="font-sans-bold text-xs text-wise-success">Connected</Text>
                  </View>
                ) : (
                  <Text className="font-sans-medium text-sm text-wise-text-secondary">Not Connected</Text>
                )}
              </View>
              
              {/* Disconnect / Generate New Code Button */}
              <View className="mt-4 pt-4 border-t border-wise-border">
                <TouchableOpacity
                  onPress={handleDisconnectMessenger}
                  disabled={isDisconnecting}
                  className={`flex-row items-center justify-center py-3 rounded-wise-md ${currentUser.messengerPsid ? 'bg-red-50' : 'bg-wise-subtle'}`}
                >
                  {isDisconnecting ? (
                    <ActivityIndicator size="small" color={currentUser.messengerPsid ? "#EF4444" : WiseColors.primary} />
                  ) : (
                    <>
                      <IconSymbol 
                        name={currentUser.messengerPsid ? "xmark.circle" : "arrow.clockwise"} 
                        size={18} 
                        color={currentUser.messengerPsid ? "#EF4444" : WiseColors.primary} 
                      />
                      <Text className={`ml-2 font-sans-medium text-sm ${currentUser.messengerPsid ? 'text-red-500' : 'text-wise-primary'}`}>
                        {currentUser.messengerPsid ? "Disconnect & Generate New Code" : "Generate New Code"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Card>
          </View>

          {/* Health Profile */}
          <View className="px-4 mb-8">
            <Text className="font-archivo-bold text-lg text-wise-text mb-4">
              Health Profile
            </Text>
            <Card padding="md">
              {isEditing ? (
                <View className="space-y-4">
                  <TextInput
                    label="Age"
                    value={formData.age}
                    onChangeText={(value) => handleFormChange('age', value)}
                    placeholder="Enter your age"
                    keyboardType="numeric"
                  />
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
                    placeholder="Select gender"
                  />
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
                  <View className="flex-row gap-4">
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
                    label="Underlying Conditions"
                    value={formData.underlyingConditions}
                    onValueChange={(value) => handleFormChange('underlyingConditions', value)}
                    options={underlyingConditionsOptions}
                    placeholder="Select any health conditions..."
                  />
                </View>
              ) : (
                <View>
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="font-sans-medium text-base text-wise-text">Age</Text>
                    <Text className="font-sans text-base text-wise-text-secondary">
                      {healthProfile.age || "Not set"}
                    </Text>
                  </View>
                  <View className="h-px bg-wise-border my-2" />
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="font-sans-medium text-base text-wise-text">Gender</Text>
                    <Text className="font-sans text-base text-wise-text-secondary">
                      {capitalize(healthProfile.gender as string) || "Not set"}
                    </Text>
                  </View>
                  <View className="h-px bg-wise-border my-2" />
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="font-sans-medium text-base text-wise-text">Fitness Level</Text>
                    <Text className="font-sans text-base text-wise-text-secondary">
                      {capitalize(healthProfile.fitnessLevel as string) || "Not set"}
                    </Text>
                  </View>
                  <View className="h-px bg-wise-border my-2" />
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="font-sans-medium text-base text-wise-text">Height</Text>
                    <Text className="font-sans text-base text-wise-text-secondary">
                      {healthProfile.height ? `${healthProfile.height} cm` : "Not set"}
                    </Text>
                  </View>
                  <View className="h-px bg-wise-border my-2" />
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="font-sans-medium text-base text-wise-text">Weight</Text>
                    <Text className="font-sans text-base text-wise-text-secondary">
                      {healthProfile.weight ? `${healthProfile.weight} kg` : "Not set"}
                    </Text>
                  </View>
                  {(healthProfile.underlyingConditions || healthProfile.goals?.length) && (
                    <>
                      <View className="h-px bg-wise-border my-2" />
                      <View className="py-2">
                        <Text className="font-sans-medium text-base text-wise-text mb-1">
                          Underlying Conditions
                        </Text>
                        <Text className="font-sans text-base text-wise-text-secondary">
                          {healthProfile.underlyingConditions || "None specified"}
                        </Text>
                      </View>
                    </>
                  )}
                  {healthProfile.goals && healthProfile.goals.length > 0 && (
                    <>
                      <View className="h-px bg-wise-border my-2" />
                      <View className="py-2">
                        <Text className="font-sans-medium text-base text-wise-text mb-1">Goals</Text>
                        <Text className="font-sans text-base text-wise-text-secondary">
                          {healthProfile.goals.join(", ")}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}
            </Card>
          </View>

          {/* Preferences */}
          <View className="px-4 mb-8">
            <Text className="font-archivo-bold text-lg text-wise-text mb-4">
              Preferences
            </Text>
            <Card padding="md">
              {isEditing ? (
                <View className="space-y-4">
                  <TextInput
                    label="Timezone"
                    value={formData.timezone}
                    onChangeText={(value) => handleFormChange('timezone', value)}
                    placeholder="e.g., America/New_York"
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
                    label="Notification Types"
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
                <View>
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="font-sans-medium text-base text-wise-text">Timezone</Text>
                    <Text className="font-sans text-base text-wise-text-secondary">
                      {preferences.preferredTimezone || "Not set"}
                    </Text>
                  </View>
                  <View className="h-px bg-wise-border my-2" />
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="font-sans-medium text-base text-wise-text">Language</Text>
                    <Text className="font-sans text-base text-wise-text-secondary">
                      {preferences.language === 'en' ? 'English' :
                        preferences.language === 'tl' ? 'Tagalog' :
                          "Not set"}
                    </Text>
                  </View>
                  <View className="h-px bg-wise-border my-2" />
                  <View className="py-2">
                    <Text className="font-sans-medium text-base text-wise-text mb-1">
                      Notifications
                    </Text>
                    <Text className="font-sans text-base text-wise-text-secondary">
                      {preferences.notificationTypes && preferences.notificationTypes.length > 0
                        ? preferences.notificationTypes.map(type =>
                          type === 'push' ? 'Push Notifications' :
                            type === 'messenger' ? 'Messenger' : type
                        ).join(', ')
                        : "Not set"}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          </View>

          {/* Edit Mode Actions */}
          {isEditing && (
            <View className="px-4 mb-8">
              <View className="flex-row space-x-4">
                <View className="flex-1 mr-1">
                  <Button
                    title="Discard Changes"
                    onPress={handleCancelEdit}
                    variant="outline"
                    disabled={isSaving}
                  />
                </View>
                <View className="flex-1 ml-1">
                  <Button
                    title="Save Changes"
                    onPress={handleSaveProfile}
                    loading={isSaving}
                    disabled={isSaving}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Sign Out */}
          <View className="px-4 items-center mb-8">
            <Button 
              title="Sign Out" 
              onPress={handleSignOut} 
              variant="outline"
              className="w-full mb-6 bg-gray-50"
              icon={<IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={WiseColors.primary} />}
            />
            <Text className="font-sans text-xs text-wise-text-secondary">Version 1.0.0</Text>
          </View>
          
          <View className="h-10" />
        </ScrollView>
      </AIBackground>
    </View>
  );
}

