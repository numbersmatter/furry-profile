import type {
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
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
    dataPoint<IntentDoc>(`${dbBase}/profiles/${profileId}/intents`),
  profile: () => dataPoint<Profile>(`${versionUrl}/profile`),
  assets: (profileId: string) =>
    dataPoint(`${versionUrl}/profile/${profileId}/profile_assets`),
  openings: (profileId: string) =>
    dataPoint<OpeningDoc>(`${dbBase}/profiles/${profileId}/openings`),
  sectionResponse: (profileId: string, intentId: string) =>
    dataPoint(
      `${dbBase}/profiles/${profileId}/intents/${intentId}/sectionResponse`
    ),
};

export const getSectionResponse = async (
  profileId: string,
  intentId: string,
  sectionId: string
) => {
  const sectionResponseRef = surveyDb
    .sectionResponse(profileId, intentId)
    .doc(sectionId);

  const sectionSnap = await sectionResponseRef.get();
  return sectionSnap.data();
};

export const writeSectionResponse = async (
  profileId: string,
  intentId: string,
  sectionId: string,
  data: any
) => {
  const sectionResponseRef = surveyDb
    .sectionResponse(profileId, intentId)
    .doc(sectionId);

  const writeData = await sectionResponseRef.set(data);
  await setSectionComplete(profileId, intentId, sectionId);
  return writeData;
};

const setSectionComplete = async (
  profileId: string,
  intentId: string,
  sectionId: string
) => {
  const intentDocRef = surveyDb.intents(profileId).doc(intentId);

  const idSection = `sectionStatus.${sectionId}`;

  const updateData = {
    updatedAt: FieldValue.serverTimestamp(),
    [idSection]: true,
  };

  const writeData = intentDocRef.update(updateData);
  return writeData;
};

export interface IntentDoc {
  intentStatus: "in-progress" | "submitted";
  createdAt: Timestamp;
  submittedAt?: Timestamp;
  updatedAt: Timestamp;
  profileId: string;
  openingId: string;
  formId: string;
  sectionOrder: string[];
  sectionStatus: { [key: string]: boolean };
}

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
    fields: Field[];
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

export const getIntentDoc = async (
  profileId: string | undefined,
  intentId: string | undefined
) => {
  if (profileId === undefined) {
    return undefined;
  }
  if (intentId === undefined) {
    return undefined;
  }
  const intentDocRef = surveyDb.intents(profileId).doc(intentId);
  const intentDocSnap = await intentDocRef.get();
  const intentDocData = intentDocSnap.data();
  if (!intentDocData) {
    return undefined;
  }

  return { ...intentDocData, intentId };
};

export const getOpeningDoc = async (profileId: string, openingId: string) => {
  const openDocRef = surveyDb.openings(profileId).doc(openingId);
  const newIntentRef = surveyDb.intents(profileId).doc();
  const openDocSnap = await openDocRef.get();
  const openDocData = openDocSnap.data();

  if (!openDocData) {
    return undefined;
  }
  return { ...openDocData, openingId };
};

export const createNewIntent = async (profileId: string, openingId: string) => {
  const openDocRef = surveyDb.openings(profileId).doc(openingId);
  const newIntentRef = surveyDb.intents(profileId).doc();
  const openDocSnap = await openDocRef.get();
  const openDocData = openDocSnap.data();

  if (!openDocData) {
    return undefined;
  }

  const sectionStatus = openDocData.sectionOrder.reduce(
    (arr, current) => ({ ...arr, [current]: false }),
    {}
  );

  const newIntentData = {
    openingId,
    profileId,
    formId: openDocData.formId,
    intentStatus: "in-progress",
    sectionStatus: sectionStatus,
    sectionOrder: openDocData.sectionOrder,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  // @ts-ignore
  const writeNewIntent = await newIntentRef.set(newIntentData);

  return { ...writeNewIntent, intentId: newIntentRef.id };
};
