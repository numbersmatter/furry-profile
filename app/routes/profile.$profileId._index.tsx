import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { createNewIntent, getOpenForms, surveyDb } from "~/server/db.server";
import { Disclosure } from '@headlessui/react';
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline';
import * as z from "zod"
import { CheckIcon } from "@heroicons/react/20/solid";

export async function action({ params, request }: ActionArgs) {
  let formData = await request.formData();
  let { _action, ...values } = Object.fromEntries(formData);

  const IntentCreateSchema = z.object({
    profileId: z.string(),
    openId: z.string()
  })

  const checkSchema = IntentCreateSchema.safeParse(values);

  const profileId = params.profileId ?? "no-profile"

  if (!checkSchema.success) {
    console.log("error on check checkSchema")
    return json({ status: "error" })

  } else {
    const newIntent = await createNewIntent(profileId, checkSchema.data.openId);
    if (!newIntent) {
      return json({ error: "error on create intent" });
    }
    return redirect(`intent/${newIntent.intentId}`);
  }

}

export async function loader({ params, request }: LoaderArgs) {
  const profileId = params.profileId ?? "no-profileId"
  // const faqs = await getProfileFAQs("milachu92");
  const homepageRef = surveyDb.assets(profileId).doc("homepage");
  const homepageSnap = await homepageRef.get();
  const homepageData = homepageSnap.data();

  const homepageDefault = {
    heroImage: "https://images.unsplash.com/photo-1606607291535-b0adfbf7424f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&q=80",
    faq: [],
    closedImage: "https://firebasestorage.googleapis.com/v0/b/fm-mvp6.appspot.com/o/website-assets%2Fclawfeehouseclosed.png?alt=media&token=8b93aedd-3fa4-4a76-8020-a2182d38db3e",
    heroText: ""
  }



  const homepageDisplay = {
    heroImage: homepageData?.heroImage ?? homepageDefault.heroImage,
    faq: homepageData?.faq ?? homepageDefault.faq,
    closedImage: homepageData?.closedImage ?? homepageDefault.closedImage,
    heroText: homepageData?.heroText ?? homepageDefault.heroText,
  }

  const openforms = await getOpenForms(profileId);


  return json({ homepageDisplay, openforms });
}



export default function ProfileHomepage() {
  const { homepageDisplay, openforms } = useLoaderData<typeof loader>();
  const actionData = useActionData();
  return (
    <div className="space-y-4">
      {
        actionData
          ? <p>{JSON.stringify(actionData)} </p>
          : <p></p>
      }
      <ProfileHero heroText={homepageDisplay.heroText} heroImage={homepageDisplay.heroImage} />

      <div id="open-forms" className="relative">

        <div className="mx-auto max-w-7xl py-5  grid grid-cols-1 gap-y-4 ">
          {
            openforms.length > 0 ? <>
              {
                openforms.map((openform) => {
                  return <Form replace method="post" key={openform.openId}  >
                    <input
                      name="openId"
                      hidden
                      readOnly
                      value={openform.openId}
                    />
                    <input
                      name="profileId"
                      hidden
                      readOnly
                      value={openform.profileId}
                    />

                    <CommisionCard
                    // @ts-ignore
                      buttonText={openform.buttonText}
                      key={openform.openId}
                      name={openform.formName}
                      text={openform.formText}
                      linkUrl={""}
                    />
                  </Form>

                }
                )
              }
            </>
              :
              <img className='h-72 mx-auto w-auto max-w-lg ' alt="Closed Sign" src={homepageDisplay.closedImage} />
          }

        </div>
      </div>

      {
        homepageDisplay.faq.length > 0
          ?
          <div className=" max-w-2xl mx-auto">
            <ProfileFaq faqs={homepageDisplay.faq} />
          </div>
          : null
      }





    </div>
  )

}
interface IProfileFaq {
  faqs: { faqId: string, faqQuestion: string, faqAnswer: string, createdAt?: any }[]
}

function ProfileFaq(props: IProfileFaq) {

  const faqs = props.faqs
  return (
    <div id='faq' className="bg-white rounded-lg max-w-2xl">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40 lg:px-8">
        <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">Frequently asked questions</h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {faqs.map((faq) => (
              <Disclosure as="div" key={faq.faqId} className="pt-6">
                {({ open }) => (
                  <>
                    <dt>
                      <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                        <span className="text-base font-semibold leading-7">{faq.faqQuestion}</span>
                        <span className="ml-6 flex h-7 items-center">
                          {open ? (
                            <MinusSmallIcon className="h-6 w-6" aria-hidden="true" />
                          ) : (
                            <PlusSmallIcon className="h-6 w-6" aria-hidden="true" />
                          )}
                        </span>
                      </Disclosure.Button>
                    </dt>
                    <Disclosure.Panel as="dd" className="mt-2 pr-12">
                      <p className="text-base leading-7 text-gray-600">{faq.faqAnswer}</p>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
interface IProfileHero {
  heroImage: string,
  heroText: string,
}

function ProfileHero(props: IProfileHero) {
  const { heroImage, heroText } = props;


  return (
    <div className="relative">

      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8">
        <div className="px-6 pt-10 pb-24 sm:pb-32 lg:col-span-7 lg:px-0 lg:pt-48 lg:pb-56 xl:col-span-6">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <div className="hidden sm:mt-32 sm:flex lg:mt-16">

            </div>
            <h1 className="mt-24 text-4xl font-bold tracking-tight text-white sm:mt-10 sm:text-6xl">
              {heroText}
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">

            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                to="#open-forms"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Get started
              </Link>
              <Link to="#faq" className="text-sm font-semibold leading-6 text-slate-100">
                Learn More In My FAQ <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="relative  lg:col-span-5 lg:-mr-8 xl:absolute xl:inset-0 xl:left-1/2 xl:mr-0">
          <img
            className="rounded-xl aspect-[3/2] w-full bg-transparent object-cover lg:absolute lg:inset-0 lg:aspect-auto lg:h-full"
            src={heroImage}
            alt="" />
        </div>
      </div>
    </div>
  )
}

// @ts-ignore
function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function CommisionCard(props: { name: string, text: string, linkUrl: string, buttonText?: string }) {
  const { name, text, buttonText } = props;
  
  // @ts-ignore
  const features: string[] = []

  return (
    <div
      className={classNames(

        'flex flex-col  max-w-2xl mx-auto justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10'
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-x-4">
          <h3
            className={classNames(
              'text-gray-900',
              'text-3xl font-semibold leading-8'
            )}
          >
            {name}
          </h3>
        </div>
        <p className="mt-4 text-sm leading-6 text-gray-600">{text}</p>
        <p className="mt-6 flex items-baseline gap-x-1">
          {/* <span className="text-4xl font-bold tracking-tight text-gray-900">pricing</span>
          <span className="text-sm font-semibold leading-6 text-gray-600">/month</span> */}
        </p>
        <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
          {features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <CheckIcon className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <button

        className={classNames(
          'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500',          'mt-8 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
        )}
      >
        { buttonText ?? "Start Form"}
      </button>
    </div>);
}


