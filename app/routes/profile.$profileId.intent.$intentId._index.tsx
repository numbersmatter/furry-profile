import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getIntentDoc } from "~/server/db.server";

export async function action({ params, request }: ActionArgs) {


  return redirect('/');
}

export async function loader({ params, request }: LoaderArgs) {
  const intentDoc = await getIntentDoc(params.profileId, params.intentId)
  if (!intentDoc) {
    throw new Response("no intent document", { status: 404 })
  }
  const nextSection = intentDoc.sectionOrder.find((sectionId) => intentDoc.sectionStatus[sectionId] == false)

  if(!nextSection){
    return redirect("submitted")
  }

  return redirect(nextSection);
}



export default function FormSections() {
  const { } = useLoaderData<typeof loader>();
  return (
    <div className="">

    </div>
  );
}