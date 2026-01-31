export interface User {
  peerId: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  age: number;
  avatar?: string;
  showAge: boolean;
  showGender: boolean;
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface UserProfile {
  name: string;
  gender: User['gender'];
  age: number;
  avatar?: string;
}
