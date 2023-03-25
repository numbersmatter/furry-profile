import type { LoaderArgs } from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { Disclosure } from '@headlessui/react'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'


export async function loader({ params }: LoaderArgs) {

  const heroImage = "https://images.unsplash.com/photo-1606607291535-b0adfbf7424f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"

  const faqs = [
    {
      id: "1",
      question: "How does my selection process work",
      answer: " I like to select art by.."
    },
    {
      id: "2",
      question: "What kind of commissions do you take",
      answer: " I like to select art by.."
    },
    {
      id: "3",
      question: "How long does it take to get a commission",
      answer: " It usually takes about..."
    },
  ]

  return {
    heroImage,
    faqs
  }

}


export default function ProfileMain() {
  const { heroImage, faqs } = useLoaderData<typeof loader>()


  return (
    <div className="space-y-4">
      <ProfileHero heroImage={heroImage} />
      <div id="open-forms" className="relative">
        <div 
          className="mx-auto max-w-7xl py-5  grid grid-cols-1 gap-y-4 "
        >
          <CommisionCard 
            name="commission form" 
            text="helper text to explain the commission process" linkUrl="commission"  
          />
        </div>
      </div>
      <div className=" max-w-2xl mx-auto">
        <ProfileFaq  faqs={faqs}/>
      </div>
    </div>
  )
}

function ProfileHero({ heroImage }: { heroImage: string }) {
  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8">
        <div className="px-6 pt-10 pb-24 sm:pb-32 lg:col-span-7 lg:px-0 lg:pt-48 lg:pb-56 xl:col-span-6">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <div className="hidden sm:mt-32 sm:flex lg:mt-16">
            </div>
            <h1 className="mt-24 text-4xl font-bold tracking-tight text-white sm:mt-10 sm:text-6xl">
              Kanvas Artist Taking Commissions
            </h1>
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
            className="rounded-xl aspect-[3/2] w-full bg-gray-50 object-cover lg:absolute lg:inset-0 lg:aspect-auto lg:h-full"
            src={heroImage}
            alt="" />
        </div>
      </div>
    </div>
  )
}


function CommisionCard(props: { name: string, text: string, linkUrl: string }) {
  const { name, text, linkUrl } = props;



  return (
    <div className="max-w-2xl mx-auto rounded-lg shadow-lg overflow-hidden lg:max-w-none lg:flex">
      <div className="flex-1 bg-white px-6 py-8 lg:p-12">
        <h3 className="text-2xl font-extrabold text-green-700 sm:text-3xl"> {name}</h3>
        <p className="mt-6 text-base text-gray-500">
          {text}
        </p>
        <div className="mt-8">
          <div className="flex items-center">
            <h4 className="flex-shrink-0 pr-4 bg-white text-sm tracking-wider font-semibold uppercase text-indigo-600">
              
            </h4>
            <div className="flex-1 border-t-2 border-gray-200" />
          </div>
         
        </div>
      </div>
      <div className="py-8 px-6 text-center bg-gray-50 lg:flex-shrink-0 lg:flex lg:flex-col lg:justify-center lg:p-12">

        <p className="mt-4 text-sm">
          <button 
            className="font-medium text-gray-500 underline"
          >
            Learn about commission policy
          </button>
        </p>
        <div className="mt-6">
          <div className="rounded-md shadow">
            <Link
              to={linkUrl}
              className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-gray-900"
            >
              Start Form
            </Link>
          </div>
        </div>
        <div className="mt-4 text-sm">
          {/* <a href="#" className="font-medium text-gray-900">
          See Gallary <span className="font-normal text-gray-500">twitter</span>
        </a> */}
        </div>
      </div>
    </div>
  );
}


function ProfileFaq(
  {faqs}
  : 
  {faqs: {id: string, question:string, answer:string}[]}
) {
  
  return (
    <div id='faq' className="bg-white rounded-lg max-w-2xl">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40 lg:px-8">
        <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">Frequently asked questions</h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {faqs.map((faq) => (
              <Disclosure as="div" key={faq.id} className="pt-6">
                {({ open }) => (
                  <>
                    <dt>
                      <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                        <span className="text-base font-semibold leading-7">{faq.question}</span>
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
                      <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
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
