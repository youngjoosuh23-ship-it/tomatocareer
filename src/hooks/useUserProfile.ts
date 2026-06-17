import React from 'react';
import { UserBackground } from '../types';
import { isSupabaseConfigured, loadProfileFromCloud, onAuthChange } from '../services/supabaseService';

export function useUserProfile() {
  const [cloudProfile, setCloudProfile] = React.useState<UserBackground | null>(null);
  const [profileLoaded, setProfileLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setProfileLoaded(true);
      return;
    }

    loadProfileFromCloud()
      .then(profile => {
        setCloudProfile(profile);
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));

    const { data: { subscription } } = onAuthChange(user => {
      if (user) {
        loadProfileFromCloud().then(setCloudProfile).catch(() => {});
      } else {
        setCloudProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { cloudProfile, profileLoaded };
}
