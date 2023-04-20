import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { ReactNode } from "react";
import { getIntentDoc, getOpeningDoc, setIntentStatus } from "~/server/db.server";
import { submitIntent } from "~/server/submission.server";

export async function action({ params, request }: ActionArgs) {
  const intentDoc = await getIntentDoc(params.profileId, params.intentId)
  if (!intentDoc) {
    throw new Response("no intent document", { status: 404 })
  }

  const intentStatus = intentDoc.intentStatus
  if (intentStatus === "submitted") { return redirect(`/profile/${intentDoc.profileId}/intent/${intentDoc.intentId}/submitted`) }

  // check all sections are complete
  //
  const sectionOrder = intentDoc.sectionOrder
  const incompleteSections = sectionOrder.find(sectionId => intentDoc.sectionStatus[sectionId] == false)

  if (incompleteSections) {
    return redirect(`/profile/${intentDoc.profileId}/intent/${intentDoc.intentId}/${incompleteSections}`)
  }

  await setIntentStatus(intentDoc.profileId, intentDoc.intentId, "submitted");
  await submitIntent(intentDoc.profileId, intentDoc.intentId);


  return redirect(`/profile/${intentDoc.profileId}/intent/${intentDoc.intentId}/submitted`);
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

  const intentStatus = intentDoc.intentStatus
  if (intentStatus === "submitted") { return redirect(`/profile/${intentDoc.profileId}/intent/${intentDoc.intentId}/submitted`) }

  const previousSection = intentDoc.sectionOrder[intentDoc.sectionOrder.length - 1]

  const backUrl = `/profile/${intentDoc.profileId}/intent/${intentDoc.intentId}/${previousSection}`


  return json({backUrl});
}



export default function FormSections() {
  const { backUrl} = useLoaderData<typeof loader>();
  return (
    <div className="">
      <SectionPanel name="Ready to submit your request?" text="To you are happy with your answers you may submit your request here">
        <div className="col-span-6 sm:col-span-6">
          <p>{backUrl}</p>
        </div>
        <div className="col-span-6 sm:col-span-3">
          <Link
            to={backUrl}
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Previous Section
          </Link>
        </div>
        <Form replace method='post' className="col-span-6 sm:col-span-3">
          <button
            type="submit"
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Submit Request
          </button>
        </Form>
      </SectionPanel>
    </div>
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
