import type { ActionArgs, LoaderArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";


export async function loader({params, request}:LoaderArgs) {
  

  return json({});
}



export default function FormSections() {
  return (
      <Outlet />
  );
}