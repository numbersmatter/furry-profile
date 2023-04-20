import { XCircleIcon } from "@heroicons/react/20/solid";
import { ActionArgs, LoaderArgs, unstable_composeUploadHandlers, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData, UploadHandler } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { uploadImage } from "~/server/cloudinary.server";
import { getIntentDoc, getOpeningDoc, getSectionResponse, saveImageUpload, setSectionComplete, writeSectionImageResponse } from "~/server/db.server";

export async function action({ params, request }: ActionArgs) {
  const intentId = params.intentId ?? "no-intent"
  const intentDoc = await getIntentDoc(params.profileId, params.intentId)
  if (!intentDoc) {
    throw new Response("no intent document", { status: 404 })
  }
  const openingDoc = await getOpeningDoc(intentDoc.profileId, intentDoc.openingId)
  if (!openingDoc) {
    throw new Response("no open form document", { status: 404 })
  }

  const sectionData = openingDoc.sections.find(section => section.sectionId === params.sectionId);

  if(!sectionData) {
    throw new Response("no section data", { status: 404 })
  }

  const uploadHandler: UploadHandler = unstable_composeUploadHandlers(
    async ({ name, data }) => {
      if (name !== "img") {
        return undefined;
      }
      if (!data) {
        return undefined
      }

      const uploadedImage = await uploadImage(intentId, data);
      return uploadedImage.secure_url;
    },
    unstable_createMemoryUploadHandler()
  );

  const formData = await unstable_parseMultipartFormData(request, uploadHandler);

  const imgSrc = formData.get("img") as string;
  const imgDesc = formData.get("desc") as string;
  if (!imgSrc) {
    return json({ error: "something wrong" });
  }
  // random id
  const imageId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const sectionDetails = {
  name: sectionData.name,
  text: sectionData.text,
}

  await writeSectionImageResponse(
    params.profileId ?? "no-profile",
    params.intentId ?? "no-intent",
    params.sectionId ?? "no-section",
    { url: imgSrc, description: imgDesc, imageId },
    sectionDetails
  )
  const imageUploadedText = `${imgDesc} uploaded`
  return json({ imageUploadedText });
}

export async function loader({ params, request }: LoaderArgs) {
  const profileId = params.profileId ?? "no-profileId"
  const intentId = params.intentId ?? "no-intentId"
  const sectionId = params.sectionId ?? "no-sectionId"

  const pathData = { profileId, intentId, sectionId }

  const intentDoc = await getIntentDoc(params.profileId, params.intentId)
  if (!intentDoc) {
    throw new Response("no intent document", { status: 404 })
  }
  const openingDoc = await getOpeningDoc(intentDoc.profileId, intentDoc.openingId)
  if (!openingDoc) {
    throw new Response("no open form document", { status: 404 })
  }

  const sectionResponseData = await getSectionResponse(intentDoc.profileId, intentDoc.intentId, params.sectionId ?? "no-sectionId")

  const imageArray = sectionResponseData?.imageArray ?? []

  const sectionIndex = openingDoc.sectionOrder.findIndex(sectionId => params.sectionId == sectionId)

  if (sectionIndex < 0) {
    throw new Response("error valid section id", { status: 404 })
  }

  const previousIndex = sectionIndex - 1
  
  const previousSection = sectionIndex > 0
  ? openingDoc.sectionOrder[previousIndex]
  : "cancel"
  
  const nextIndex = sectionIndex + 1

  const nextSection = nextIndex < openingDoc.sectionOrder.length
    ? openingDoc.sectionOrder[nextIndex]
    : "submit"

  

  const nextUrl = `/profile/${intentDoc.profileId}/intent/${intentDoc.intentId}/${nextSection}`

  const backurl = previousSection === "cancel"
    ? `/profile/${intentDoc.profileId}`
    : `/profile/${intentDoc.profileId}/intent/${intentDoc.intentId}/${previousSection}`

  const sectionData = openingDoc.sections[sectionIndex];
  await setSectionComplete(intentDoc.profileId, intentDoc.intentId, params.sectionId ?? "no-sectionId")

  return json({ sectionData, sectionResponseData, imageArray, backurl, nextUrl, pathData });
}



export default function ImageUploadSection() {
  const [filesPresent, setFilesPresent] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const { sectionData, sectionResponseData, backurl, imageArray, nextUrl, pathData } = useLoaderData<typeof loader>();


  const actionData = useActionData<typeof action>();
  let transition = useNavigation();
  let submit = useSubmit();
  let isUploading =
    transition.state === "submitting" &&
    transition.formData.get("_action") === "uploadImage"

  // transition.submission?.formData.get("_action") === "uploadImage"

  let formRef = useRef();
  let fileInputRef = useRef(null);

  useEffect(() => {
    if (filesPresent && formRef.current) {
      submit(formRef.current, {})
    }
  }, [filesPresent, submit])

  useEffect(() => {
    if (!isUploading) {
      // @ts-ignore
      formRef.current?.reset()
      setFilesPresent(false)
    }
  }, [isUploading])
  const checkFilesPresent = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const filesArray = e.currentTarget.files ?? []
    const areFiles = filesArray.length > 0

    if (areFiles) {
      return setFilesPresent(true)
    }
    return setFilesPresent(false)
  };
  const openFileInput = () => {
    // @ts-ignore
    fileInputRef.current.click()
  }

  return (
    <>
      <  >
        <div className="max-w-2xl pt-6 pb-5">
          <SectionPanel name={sectionData.name} text={sectionData.text}>
            <Form
              replace
              method="post"
              encType="multipart/form-data"
              // @ts-ignore
              ref={formRef}
            >
              {actionData ? <p>{JSON.stringify(actionData)}</p> : <p>
              </p>}
              <fieldset className="grid grid-cols-1 py-3">
                <div className="mx-auto">

                  {/* <label className=" max-w-xs inline-flex items-center border-2 gap-x-4 rounded-md bg-slate-500 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" htmlFor="img-field"> */}
                  <input
                    ref={fileInputRef}
                    hidden// className="hidden"
                    onChange={(e) => checkFilesPresent(e)}
                    id="img-field"
                    type="file"
                    name="img"
                    accept="image/*"
                  />
                  <input
                    className="hidden"
                    name="_action"
                    value="uploadImage"
                    readOnly
                  />
                  <button
                    type="button"
                    // className={isUploading ? disabledClass : regularClass}
                    onClick={openFileInput}
                    disabled={isUploading}
                  >

                    {isUploading ? "Uploading..." : "Upload Image"}
                  </button>
                  <button
                      onClick={openFileInput}
                      disabled={isUploading}
                      type="button"
                      className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Change
                    </button>

                  {/* </label> */}
                </div>


                <div className="">
                  <div className="mt-2">
                    <input
                      id="desc"
                      name="desc"
                      // className="hidden"
                      value={fileName}
                      readOnly
                    />
                  </div>
                </div>

              </fieldset>


            </Form>

          </SectionPanel>
          <div className="py-4">
            <h4 className="text-xl text-slate-700">Uploaded Images:</h4>
            <p>Uploaded images will appear here. If you do not see your image it did not upload correctly.</p>
            <ul
              className=" pt-2 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8"
            >
              {

                imageArray.length > 0 ?
                  imageArray.map((imageData: { url: string; description: string; imageId: string; }
                  ) => (
                    <li key={imageData.url} className="relative">
                      <div className="group aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
                        <img src={imageData.url} alt="" className="pointer-events-none object-cover group-hover:opacity-75" />
                      </div>
                      <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">{imageData.description}</p>
                      <Form replace method="post" action={"/api/deleteImages"}>
                        <button name="_action" value="delete" className="inline-flex items-center gap-x-1.5 rounded-md bg-slate-100 py-1.5 px-2.5 text-sm font-semibold text-slate-500 shadow-sm hover:bg-red-500  hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"> <XCircleIcon className="h-6 w-6 " /> Delete </button>
                        <input
                          className="hidden"
                          name="imageId"
                          value={imageData.imageId}
                          readOnly
                        />
                        <input
                          className="hidden"
                          name="sectionId"
                          value={pathData.sectionId}
                          readOnly
                        />
                        <input
                          className="hidden"
                          name="profileId"
                          value={pathData.profileId}
                          readOnly
                        />
                        <input
                          className="hidden"
                          name="intentId"
                          value={pathData.intentId}
                          readOnly
                        />
                      </Form>
                    </li>
                  ))
                  : <div className="mx-auto ">

                    <p className="text-xl text-slate-500"> No images uploaded</p>
                  </div>

              }
            </ul>
          </div>
          <div className="py-3 flex justify-end">
            <Link
              to={backurl}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Back
            </Link>
            <Link
              to={nextUrl}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save
            </Link>
          </div>
        </div>
      </>
    </>
  );
}

function ImageUploadFetch(props: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  intentId: string,

}) {
  // let fetcher = useFetcher();

  const postUrl = `api/${props.intentId}.imageUpload`
  return (
    <Form method="post" encType="multipart/form-data" action={postUrl}>
      <input
        // ref={props.ref}
        // className="hidden"
        onChange={(e) => props.onChange(e)}
        id="img-field"
        type="file"
        name="img"
        accept="image/*"
      />
      <button type="submit">submit</button>
    </Form>
  )
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
