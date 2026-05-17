export type Screen = 'splash' | 'login' | 'dashboard' | 'create' | 'preview' | 'upload' | 'templates' | 'history' | 'settings' | 'checkNumber' | 'policy' | 'help' | 'admin-notifications';

export type Language = 'ps' | 'en';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Report {
  id?: string;
  userId: string;
  country?: string;
  phoneNumber?: string;
  targetEmail?: string;
  reportType: string;
  description: string;
  aiSuggestion?: string;
  status: 'pending' | 'sent' | 'failed' | 'draft';
  generatedContent?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  description?: string;
}

export interface UploadRecord {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  status: 'processing' | 'completed' | 'failed';
  recordCount?: number;
  createdAt: any;
}
