import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import type { Field } from "~/server/db.server";
import { getIntentDoc, getOpeningDoc, getSectionResponse, writeSectionResponse } from "~/server/db.server";
import StackedField from "~/server/ui/StackFields";
import * as z from "zod";
// import { FieldValue } from "firebase-admin/firestore";

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

export async function loader({ params, request }: LoaderArgs) {
  const intentDoc = await getIntentDoc(params.profileId, params.intentId)
  if (!intentDoc) {
    throw new Response("no intent document", { status: 404 })
  }
  const openingDoc = await getOpeningDoc(intentDoc.profileId, intentDoc.openingId)
  if (!openingDoc) {
    throw new Response("no open form document", { status: 404 })
  }
  const sectionIndex = openingDoc.sectionOrder.findIndex(sectionId => params.sectionId == sectionId)


  const sectionData = openingDoc.sections[sectionIndex];
  const isImageUpload = sectionData?.type === "imageUpload"

  if(isImageUpload){
    return redirect("upload")
  }

  const sectionResponseData = await getSectionResponse(intentDoc.profileId, intentDoc.intentId, params.sectionId ?? "no-sectionId")


  if (sectionIndex < 0) {
    throw new Response("error valid section id", { status: 404 })
  }

  const previousIndex = sectionIndex - 1

  const previousSection = sectionIndex > 0
    ? openingDoc.sectionOrder[previousIndex]
    : "cancel"

  const backurl = previousSection === "cancel"
    ? `/profile/${intentDoc.profileId}`
    : `/profile/${intentDoc.profileId}/intent/${intentDoc.intentId}/${previousSection}`

  const fieldValues: { [key: string]: string } = sectionResponseData?.formValues ?? {}

  const intentId = params.intentId ?? "no-intent"

  return json({ sectionData, fieldValues, backurl, intentId });
}



export default function FormSections() {
  const [filesPresent, setFilesPresent] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const params = useParams();
  const sectionId = params.sectionId;

  let fileInputRef = useRef(null);
  const checkFilesPresent = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const filesArray = e.currentTarget.files ?? []
    const areFiles = filesArray.length > 0

    if (areFiles) {
      setFileName(filesArray[0].name)
      return setFilesPresent(true)
    }
    return setFilesPresent(false)
  };


  const { sectionData, fieldValues, backurl, intentId } = useLoaderData<typeof loader>();
  const actionData = useActionData();



  return (
    <>
      <Form method="post">
        <div className="max-w-2xl pt-6 pb-5">
          <SectionPanel name={sectionData.name} text={sectionData.text}>
            {
              sectionData.fields.map((field) => {
                const errorObj = actionData ?? {}
                const errorText = errorObj[field.fieldId] ?? undefined
                const defaultValue = fieldValues[field.fieldId] ?? ""

                return <StackedField
                  key={field.fieldId}
                  field={field}
                  errorText={errorText}
                  defaultValue={defaultValue}
                />
              }
              )
            }
          </SectionPanel>
          <div className="py-3 flex justify-end">
            <Link
              to={backurl}
              type="button"
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Back
            </Link>
            <button
              type="submit"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save
            </button>
          </div>
        </div>
      </Form>
    </>
  );
}


function SectionPanel(props: { name: string, text: string, children: ReactNode }) {

  return (
    <div className="bg-white  px-4 py-5 shadow sm:rounded-lg sm:p-6">
      <div className="space-y-8 divide-y divide-gray-200">
        <div>
          <div>
            <h3 className="text-2xl font-semibold leading-6 text-gray-900">{props.name}</h3>
            <p className="mt-1 text-base text-gray-500">
              {props.text}
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {props.children}
          </div>
        </div>
      </div>
    </div>
  );
};



