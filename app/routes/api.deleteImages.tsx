import type { ActionArgs} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { deleteImage } from "~/server/db.server";
// import { deleteMilaImageUpload } from "~/server/mila.server";
// import { getParams } from "~/server/routes-logic/profile/profile.server";

export async function action({ params, request }: ActionArgs) {
  
  const intialFormData = Object.fromEntries(await request.formData());

  let { _action, ...values } = intialFormData;

  const redirectUrl = `/profile/${values.profileId}/intent/${values.intentId}/${values.sectionId}`

  if(_action === "delete"){

    // @ts-ignore
    await deleteImage(values.profileId, values.intentId, values.sectionId, values.imageId)



    return redirect(redirectUrl)

  }

};
