import type { ActionArgs, LoaderArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

export async function action({params, request}:ActionArgs) {
  

  return redirect('/');
}

export async function loader({params, request}:LoaderArgs) {
  
  const data={
    confirmSubmitImage: "https://firebasestorage.googleapis.com/v0/b/component-sites.appspot.com/o/furrymarketplace%2FKanvas%20drawing%20banner.png?alt=media&token=d7c93657-f389-495d-b525-6efede812e80",
    headline: "Thanks for your input!",
    
  }
  return json({data});
}



export default function SubmittedPAge() {
  const { data} = useLoaderData<typeof loader>();


  return (
    <main className="relative lg:min-h-full border-2 bg-slate-50 rounded-lg pt-0">
    <div className="h-80  overflow-hidden mt-0 lg:absolute lg:w-1/2 lg:h-full lg:pr-4 xl:pr-12">
      <img
        src={data.confirmSubmitImage}
        alt="confirmation"
        className="h-full border-2 w-full bg-transparent object-center object-cover mt-0 "
      />
    </div>

    <div>
      <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8 lg:py-32 lg:grid lg:grid-cols-2 lg:gap-x-8 xl:gap-x-24">
        <div className="lg:col-start-2">
          <h1 className="text-sm font-medium text-indigo-600">
            {data.headline}
          </h1>
          

          {/* <dl className="mt-16 text-sm font-medium">
            <dt className="text-gray-900">Confirmation Phrase</dt>
            <dd className="mt-2 text-indigo-600">{data.humanReadableId}</dd>
          </dl> */}

          <ul
            className="mt-6 text-sm font-medium text-gray-500 border-t border-gray-200 divide-y divide-gray-200"
          >
            {/* {products.map((product) => (
                <li key={product.id} className="flex py-6 space-x-6">
                  <img
                    src={product.imageSrc}
                    alt={product.imageAlt}
                    className="flex-none w-24 h-24 bg-gray-100 rounded-md object-center object-cover"
                  />
                  <div className="flex-auto space-y-1">
                    <h3 className="text-gray-900">
                      <a href={product.href}>{product.name}</a>
                    </h3>
                    <p>{product.color}</p>
                    <p>{product.size}</p>
                  </div>
                  <p className="flex-none font-medium text-gray-900">
                    {product.price}
                  </p>
                </li>
              ))} */}
          </ul>

          <dl className="text-sm font-medium text-gray-500 space-y-6 border-t border-gray-200 pt-6"></dl>

          <dl className="mt-16 grid grid-cols-2 gap-x-4 text-sm text-gray-600"></dl>

          <div className="mt-16 border-t border-gray-200 py-6 text-right">
            <Link
              to={"../../"}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to Homepage<span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </main>
  )
}