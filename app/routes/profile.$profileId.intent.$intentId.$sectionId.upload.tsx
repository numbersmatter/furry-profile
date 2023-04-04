import { ActionArgs, LoaderArgs, unstable_composeUploadHandlers, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData, UploadHandler } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { ReactNode, useState } from "react";
import { uploadImage } from "~/server/cloudinary.server";
import { saveImageUpload } from "~/server/db.server";

export async function action({ params, request }: ActionArgs) {
  const intentId = params.intentId ?? "no-intent"
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

  await saveImageUpload(
    "furscience", 
    "36AdybwjSPrGePBBUSrN", 
    "9SuJjiOMmonFW1GZ6ghx", 
    { url: imgSrc, description: imgDesc }
  )
  const imageUploadedText = `${imgDesc} uploaded`
  return json({ imageUploadedText });




}

export async function loader({ params, request }: LoaderArgs) {
  const intentId = params.intentId ?? "no-intent";

  return json({ intentId });
}



export default function FormSections() {
  const [filesPresent, setFilesPresent] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const { intentId } = useLoaderData<typeof loader>();

  // let fileInputRef = useRef(null);
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

  const actionUrl = `/api/${intentId}/imageUpload`

  const actionData = useActionData();
  return (
    <>
      <  >
        <div className="max-w-2xl pt-6 pb-5">
          <SectionPanel name={"imageUpload"} text={""}>
            <Form
              replace
              method="post"
              encType="multipart/form-data"

            >
              {actionData ? <p>{JSON.stringify(actionData)}</p> : <p>
              </p>}
              <fieldset className="grid grid-cols-1 py-3">
                <div className="mx-auto">

                  {/* <label className=" max-w-xs inline-flex items-center border-2 gap-x-4 rounded-md bg-slate-500 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" htmlFor="img-field"> */}
                  <input
                    // ref={fileInputRef}
                    // className="hidden"
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
              <button
                type="submit"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Save
              </button>

            </Form>

          </SectionPanel>
          <div className="py-3 flex justify-end">
            <Link
              to={".."}
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
