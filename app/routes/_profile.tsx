
import type { ActionArgs, LoaderArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";

export async function action({params, request}:ActionArgs) {
  

  return redirect('/');
}

export async function loader({params, request}:LoaderArgs) {
  
  const profileHeader = {
    banner: "https://images.unsplash.com/photo-1557243962-0a093922933f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    avatar: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=871&q=80",
    displayName: "Kanvas",
  }

  return json({profileHeader});
}



export default function FormSections() {
  const { profileHeader} = useLoaderData<typeof loader>();
  return (
    <div className="min-h-screen bg-[#2a9bb5] flex flex-col ">
      <ProfileHeader data={profileHeader} />
      <div className="mx-auto rounded-lg">
        <Outlet />

      </div>
      <div className="h-16">
       
      </div>
    </div>
  )
}


export interface ProfileHeaderProps {
  data:{
    banner: string,
    avatar:string,
    displayName: string,
  }
}

export function ProfileHeader(props: ProfileHeaderProps) {
  const { banner, avatar, displayName } = props.data;

  return (
    <div>
      <div
        className="h-32 w-full bg-center place-i bg-cover pt-4 lg:h-48 lg:pt-6"
        style={{
          backgroundImage: `url('${banner}')`,
        }}
      >
        {/* <h1 className=" font-DynaPuff text-center text-3xl text-white  text-shadow md:text-5xl  lg:text-7xl ">
          {headerText}
        </h1> */}
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
          <div className="flex">
            <img
              className="h-24 w-24 rounded-full ring-4 ring-white sm:h-32 sm:w-32"
              src={ avatar }
              alt=""
            />
          </div>
          <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white truncate">
                {displayName}
              </h1>
            </div>
            <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
            </div>
          </div>
        </div>
        <div className="hidden sm:block md:hidden mt-6 min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-white truncate">
            {displayName}
          </h1>
        </div>
      </div>
    </div>
  );
}
