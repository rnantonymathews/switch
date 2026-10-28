import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Profile, Reminder } from '../../types';
import { LoadingScreen } from './LoadingScreen';
import { AuthScreen } from './AuthScreen';
import { BiometricsWelcomeScreen } from './BiometricsWelcomeScreen';
import { EnablementRemindersScreen } from './EnablementRemindersScreen';

interface OnboardingFlowProps {
  user: User | null;
  profile: Profile;
  onFinishOnboarding: (
    updatedProfile: Profile,
    newReminders?: Reminder[]
  ) => Promise<void>;
  triggerToast: (msg: string) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  user,
  profile,
  onFinishOnboarding,
  triggerToast
}) => {
  // Check if athlete is returning with a completed profile
  const isReturningAthlete = Boolean(profile.onboardingCompleted || (profile.username && profile.weight > 25));

  const [currentStep, setCurrentStep] = useState<'splash' | 'auth' | 'biometrics' | 'enablement' | 'complete'>(
    'splash'
  );

  const [pendingProfile, setPendingProfile] = useState<Profile>(profile);

  // Splash Screen finished (after 1.2s)
  const handleSplashFinish = () => {
    if (user && isReturningAthlete) {
      setCurrentStep('complete');
    } else if (!user) {
      setCurrentStep('auth');
    } else {
      setCurrentStep('biometrics');
    }
  };

  // Auth Screen finished
  const handleAuthenticated = (authedUser: User) => {
    if (isReturningAthlete) {
      setCurrentStep('complete');
    } else {
      setCurrentStep('biometrics');
    }
  };

  // Biometrics Screen finished
  const handleBiometricsCompleted = (data: Partial<Profile>) => {
    setPendingProfile((prev) => ({
      ...prev,
      ...data
    }));
    setCurrentStep('enablement');
  };

  // Enablement Screen finished
  const handleEnablementCompleted = async (preferences: {
    hydrationAlerts: boolean;
    workoutAlerts: boolean;
    macroAlerts: boolean;
    soundEnabled: boolean;
  }) => {
    const finalProfile: Profile = {
      ...pendingProfile,
      onboardingCompleted: true,
      notificationPreferences: preferences
    };

    // Create default reminders based on selected preferences
    const defaultReminders: Reminder[] = [];
    const now = Date.now();

    if (preferences.hydrationAlerts) {
      defaultReminders.push({
        id: `rem-hydr-${now}`,
        timeStr: '10:00',
        title: 'Hydration Wave — 250ml Drink',
        notes: 'Smart reminder every 2h to hit your daily water quota.',
        enabled: true,
        days: ['Daily'],
        category: 'hydration',
        createdAt: now
      });
    }

    if (preferences.workoutAlerts) {
      defaultReminders.push({
        id: `rem-work-${now + 1}`,
        timeStr: '17:30',
        title: 'SWITCH Training Session',
        notes: 'Pre-workout prep and active routine window.',
        enabled: true,
        days: ['Daily'],
        category: 'workout',
        createdAt: now + 1
      });
    }

    if (preferences.macroAlerts) {
      defaultReminders.push({
        id: `rem-macro-${now + 2}`,
        timeStr: '20:30',
        title: 'Evening Macro Review',
        notes: 'Log remaining dinner and review today’s protein target.',
        enabled: true,
        days: ['Daily'],
        category: 'macro',
        createdAt: now + 2
      });
    }

    setCurrentStep('complete');
    try {
      await onFinishOnboarding(finalProfile, defaultReminders);
    } catch (err) {
      console.warn('Onboarding completion sync error:', err);
    }
  };

  if (currentStep === 'splash') {
    return <LoadingScreen onFinish={handleSplashFinish} isReady={true} />;
  }

  if (currentStep === 'auth') {
    return <AuthScreen onAuthenticated={handleAuthenticated} triggerToast={triggerToast} />;
  }

  if (currentStep === 'biometrics') {
    return (
      <BiometricsWelcomeScreen
        initialProfile={pendingProfile}
        onCompleted={handleBiometricsCompleted}
      />
    );
  }

  if (currentStep === 'enablement') {
    return (
      <EnablementRemindersScreen
        onCompleted={handleEnablementCompleted}
        triggerToast={triggerToast}
      />
    );
  }

  return null;
};
