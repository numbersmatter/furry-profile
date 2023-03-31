import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirestore } from "firebase-admin/firestore";

// helper function to convert firestore data to typescript
const converter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
});

// helper to apply converter to multiple collections
const dataPoint = <T extends FirebaseFirestore.DocumentData>(
  collectionPath: string
) => getFirestore().collection(collectionPath).withConverter(converter<T>());

interface SurveyDoc {
  profileId: string;
}

export interface Profile {
  bannerImage: string;
  avatar: string;
  displayName: string;
}
export type FieldTypes =
  | "select"
  | "date"
  | "currency"
  | "longText"
  | "email"
  | "shortText"
  | "imageUpload";

export type Field = {
  type: FieldTypes;
  label: string;
  fieldId: string;
  options?: { value: string; label: string }[];
  // schema? : {
  //   optional: boolean,
  //   minLength:number,
  //   maxLenght: number,
  //  }
};

export const versionUrl = "testCollection/version6";

export const surveyDb = {
  survey: () => dataPoint<SurveyDoc>(`${versionUrl}/survey`),
  intents: (profileId: string) =>
    dataPoint(`${dbBase}/profiles/${profileId}/intents`),
  profile: () => dataPoint<Profile>(`${versionUrl}/profile`),
  assets: (profileId: string) =>
    dataPoint(`${versionUrl}/profile/${profileId}/profile_assets`),
  openings: (profileId: string) =>
    dataPoint<OpeningDoc>(`${dbBase}/profiles/${profileId}/openings`),
};
export interface OpeningDoc {
  formId: string;
  formName: string;
  formText: string;
  profileId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "open" | "closed";
  sectionOrder: string[];
  sections: {
    sectionId: string;
    fieldOrder: string[];
    fieldObj: {
      [key: string]: Field;
    };
    name: string;
    text: string;
  }[];
}
export interface OpeningDocWId extends OpeningDoc {
  openId: string;
}

const dbBase = "database/version2";

export const getOpenForms = async (profileId: string) => {
  const openQuery = await surveyDb
    .openings(profileId)
    .where("status", "==", "open")
    .get();

  const openForms = openQuery.docs.map((snap) => ({
    ...snap.data(),
    openId: snap.id,
  }));

  return openForms;
};

export const getProfilePageHeaderData = async (
  profileId: string | undefined
) => {
  if (!profileId) {
    return undefined;
  }
  const profileDataRef = surveyDb.profile().doc(profileId);
  const profileSnap = await profileDataRef.get();
  const profileData = profileSnap.data();
  if (!profileData) {
    return undefined;
  }

  return profileData;
};

export const createNewIntent =async (profileId: string, openingId:string) => {
  const openDocRef = surveyDb.openings(profileId).doc(openingId);
  const newIntentRef = surveyDb.intents(profileId).doc();
  const openDocSnap = await openDocRef.get();
  const openDocData = openDocSnap.data();
  
  if(!openDocData){
    return undefined;
  }

  const sectionStatus = openDocData.sectionOrder.reduce((arr, current)=>({...arr, [current]: false}), {})

  const newIntentData = {
    openingId,
    profileId,
    formId: openDocData.formId,
    intentStatus: "in-progress",
    sectionStatus: sectionStatus,
    sectionOrder: openDocData.sectionOrder,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),

  }

  const writeNewIntent = await newIntentRef.set(newIntentData);

  return { ...writeNewIntent, intentId: newIntentRef.id}
  

}
