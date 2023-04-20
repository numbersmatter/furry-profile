import {
  dataPoint,
  dbBase,
  Field,
  FieldTypes,
  getOpeningDoc,
} from "./db.server";
import type { Timestamp } from "@google-cloud/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { makeRandomHumanReadableId } from "./utils.server";

export interface ArtistIntentReview {
  reviewStatus: "accepted" | "declined" | "hold" | "review";
  reviewLastUpdated: Timestamp;
  archived: boolean;
  humanReadableId: string;
  formId: string;
  formName: string;
}

export interface IntentDoc {
  createdAt: Timestamp;
  formId: string;
  intentStatus: "in-progress" | "submitted";
  openingId: string;
  profileId: string;
  sectionOrder: string[];
  sectionStatus: { [key: string]: boolean };
  updatedAt: Timestamp;
}
export interface SubmissionDoc extends IntentDoc {
  archived?: boolean;
}

// export interface SubmittedIntentDoc {
//   createdAt:Timestamp,
//   formId: string,
//   intentStatus: "in-progress" | "submitted",
//   openingId: string,
//   profileId: string,
//   sectionOrder: string[],
//   sectionStatus: { [key: string]: boolean },
// };

export interface SectionResponse {
  fields?: Field[];
  formValues?: { [key: string]: string };
  imageArray?: { imageId: string; url: string; description: string }[];
}

export interface DisplayField {
  label: string;
  userInput: string;
  fieldType: FieldTypes;
  fieldId: string;
}

export interface SubmittedSection {
  title: string;
  text: string;
  type: "fields" | "imageArray";
  imageArray: { imageId: string; url: string; description: string }[];
  formValues: { [key: string]: string };
  displayFields: DisplayField[];
}

export interface SubmittedDoc extends IntentDoc {
  createdAt: Timestamp;
  humanReadableId: string;
  submittedSections: SubmittedSection[];
  submittedAt: Timestamp;
}

export const submissionDb = {
  intents: (profileId: string) =>
    dataPoint<IntentDoc>(`${dbBase}/profiles/${profileId}/intents`),
  status: (profileId: string) =>
    dataPoint<ArtistIntentReview>(`${dbBase}/profiles/${profileId}/status`),
  sectionResponses: (profileId: string, intentId: string) =>
    dataPoint<SectionResponse>(
      `${dbBase}/profiles/${profileId}/intents/${intentId}/sectionResponse`
    ),
  submissions: (profileId: string) =>
    dataPoint<SubmittedDoc>(`${dbBase}/profiles/${profileId}/submissions`),
};

export const getSectionResponses = async ({
  profileId,
  intentId,
}: {
  profileId: string | undefined;
  intentId: string | undefined;
}) => {
  if (!intentId || !profileId) {
    return [];
  }
  const colRef = submissionDb.sectionResponses(profileId, intentId);
  const colSnap = await colRef.get();
  const sectionResponses = colSnap.docs.map((snap) => ({
    ...snap.data(),
    sectionId: snap.id,
  }));
  return sectionResponses;
};

export const submitIntent = async (profileId: string, intentId: string) => {
  const intentRef = submissionDb.intents(profileId).doc(intentId);
  const intentSnap = await intentRef.get();
  const intentData = intentSnap.data();
  if (!intentData) return;
  const {
    createdAt,
    formId,
    openingId,
    sectionOrder,
    sectionStatus,
    updatedAt,
  } = intentData;

  const sectionResponses = await getSectionResponses({ profileId, intentId });
  const openingDoc = await getOpeningDoc(profileId, openingId);
  if (!openingDoc) return;
  const { sections } = openingDoc;

  const responseSectionIds = sectionResponses.map(
    (section) => section.sectionId
  );

  const submittedSections = sections.map((section) => {
    const sectionResponse = sectionResponses.find(
      (response) => response.sectionId === section.sectionId
    );

    const fields = section.fields ?? [];
    const formValues = sectionResponse?.formValues ?? {};
    const imageArray = sectionResponse?.imageArray ?? [];
    const type = fields.length > 0 ? "fields" : "imageArray";

    const displayFields = fields.map((field) => {
      const fieldOptions = field.options ?? [];
      const rawInput = formValues[field.fieldId];

      const selectValue =
        fieldOptions.find((option) => option.value === rawInput)?.label ??
        "error";

      const userInput =
        field.type === "select" ? selectValue : rawInput ?? "error";

      return {
        label: field.label,
        userInput,
        fieldType: field.type,
        fieldId: field.fieldId,
      };
    });

    return {
      title: section.name,
      text: section.text,
      type: type,
      imageArray,
      formValues,
      displayFields,
    }
  });



  const humanReadableId = makeRandomHumanReadableId();
  const submissionData: SubmittedDoc = {
    createdAt,
    formId,
    intentStatus: "submitted",
    openingId,
    profileId,
    sectionOrder,
    sectionStatus,
    updatedAt,
    humanReadableId,
    // @ts-ignore
    submittedSections,
    // @ts-ignore
    submittedAt: FieldValue.serverTimestamp(),
  };

  const submissionRef = submissionDb.submissions(profileId).doc(intentId);
  await submissionRef.create(submissionData);

  // create artist intent review doc
  const artistIntentReviewData: ArtistIntentReview = {
    reviewStatus: "review",
    //  @ts-ignore
    reviewLastUpdated: FieldValue.serverTimestamp(),
    archived: false,
    humanReadableId,
    formId,
    formName: openingDoc.formName,
  };
  const artistIntentReviewRef = submissionDb.status(profileId).doc(intentId);
  await artistIntentReviewRef.create(artistIntentReviewData);

};
