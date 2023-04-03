import { ActionArgs, LoaderArgs, unstable_composeUploadHandlers, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData, UploadHandler} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { uploadImage } from "~/server/cloudinary.server";
import { saveImageUpload } from "~/server/db.server";

export async function action({params, request}:ActionArgs) {
  const intentId = params.intentId ??"no-intent"
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

    await saveImageUpload("furscience", intentId, "9SuJjiOMmonFW1GZ6ghx", { url: imgSrc, description: imgDesc })
    const imageUploadedText = `${imgDesc} uploaded`
    return json({ imageUploadedText });

  

}

export async function loader({params, request}:LoaderArgs) {
  

  return json({});
}



