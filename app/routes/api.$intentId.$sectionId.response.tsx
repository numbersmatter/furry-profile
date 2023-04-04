import { ActionArgs, LoaderArgs, unstable_composeUploadHandlers, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData, UploadHandler } from "@remix-run/node";
import { Field, getIntentDoc, getOpeningDoc } from "~/server/db.server";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { uploadImage } from "~/server/cloudinary.server";
import { saveImageUpload, writeSectionResponse } from "~/server/db.server";

export async function action({ params, request }: ActionArgs) {
  const formValues = Object.fromEntries(await request.formData());
  const intentDoc = await getIntentDoc(params.profileId, params.intentId)
  if (!intentDoc) {
    throw new Response("no intent document", { status: 404 })
  }
  const openingDoc = await getOpeningDoc(intentDoc.profileId, intentDoc.openingId)
  if (!openingDoc) {
    throw new Response("no open form document", { status: 404 })
  }
  const sectionIndex = openingDoc.sectionOrder.findIndex(sectionId => params.sectionId == sectionId)

  if (sectionIndex < 0) {
    throw new Response("error valid section id", { status: 404 })
  }

  const sectionData = openingDoc.sections[sectionIndex];

  const fields = sectionData.fields;

  const createZodElement = (field: Field) => {
    if (field.type === "email") {
      return z.string().email();
    }
    if (field.type === "shortText" || "longText") {
      return z.string();
    }
    if (field.type === "select") {
      // const options = field.options ?? []
      // const validOptions = options.map(option => option.value)
      return z.string();
    }
    return z.string();

  }

  const SchemaObject = fields
    .reduce((arr, cur) =>
      ({ ...arr, [cur.fieldId]: createZodElement(cur) }), {})

  const SchemaCheck = z.object(SchemaObject);

  const sectionCheck = SchemaCheck.safeParse(formValues);

  if (!sectionCheck.success) {
    //   const rawMessage = checkSchema.error.issues.find((error) => error.path[0] === "email")?.message
    const errorObject = sectionCheck.error.issues.reduce((arr, cur) => ({ ...arr, [cur.path[0]]: cur.message }), {})

    return errorObject
  } else {
    const sectionResponseData = {
      fields,
      formValues
    }
    await writeSectionResponse(intentDoc.profileId, intentDoc.intentId, params.sectionId ?? "no-sectionId", sectionResponseData);

    return redirect(`/profile/${intentDoc.profileId}/intent/${intentDoc.intentId}`)
  }
}

// export async function loader({ params, request }: LoaderArgs) {


//   return json({});
// }



