import { getApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';

const app = getApp(); // gets default app (auto-initialized via google-services.json)

export const db = getFirestore(app);