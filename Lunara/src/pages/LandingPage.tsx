// Landing page — hero, about, client login, offerings accordion, and inquiry form.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { SimpleHeader } from '../components/layout/SimpleHeader';
import { SimpleFooter } from '../components/layout/SimpleFooter';
import { getBaseApiUrl } from '../utils/getBaseApiUrl';

/** Zod schema for the inquiry form fields. */
const inquiryFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  inquiryType: z.string().min(1, 'Please select a type'),
  consultationDate: z.string().min(1, 'Consultation date is required'),
  relevantInfo: z.string().optional(),
});

type InquiryFormData = z.infer<typeof inquiryFormSchema>;

/** Service categories displayed in the accordion. */
const OFFERINGS = [
  { title: 'Birth & Recovery', content: 'Support through birth and postpartum recovery.' },
  {
    title: 'Fourth Trimester Planning & Care',
    content: 'Planning and care for the fourth trimester.',
  },
  { title: 'Loss & Bereavement', content: 'Compassionate support through loss.' },
  { title: 'Photography', content: 'Birth and family photography.' },
];

const LandingPage = () => {
  const [openOfferingIndex, setOpenOfferingIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      inquiryType: '',
      consultationDate: '',
      relevantInfo: '',
    },
  });

  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(data: InquiryFormData) {
    try {
      const baseUrl = getBaseApiUrl();
      const response = await fetch(`${baseUrl}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          message: [
            `Inquiry type: ${data.inquiryType}`,
            `Preferred consultation date: ${data.consultationDate}`,
            data.relevantInfo ? `Additional info: ${data.relevantInfo}` : '',
          ].filter(Boolean).join('\n'),
          dueDate: data.consultationDate,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message ?? 'Failed to submit inquiry');
      }

      setSubmitted(true);
      toast.success('Inquiry submitted! We\'ll get back to you within 24 hours.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-[100dvh] min-h-screen flex flex-col bg-[#FAF7F2] overflow-x-hidden w-full max-w-[100vw]">
      {/* Header */}
      <SimpleHeader />

      <main className="flex-grow min-w-0 overflow-x-hidden">
        {/* Hero */}
        <section className="relative w-full min-h-[40vh] sm:min-h-[500px] md:min-h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/ollie head.png"
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-[#2d1b15]/25" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[500px] md:min-h-[600px] px-4 sm:px-6 py-12 sm:py-16 text-center">
            <h1 className="font-script text-[#FAF7F2] text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-wide drop-shadow-md">
              Lunara
            </h1>
            <p className="font-roman text-[#FAF7F2] text-lg sm:text-xl md:text-2xl mt-4 max-w-2xl leading-relaxed px-2">
              Rest-centered, birth & postpartum care for West Valley families
            </p>
          </div>
        </section>

        {/* Dear Parent */}
        <section className="relative z-10 w-full bg-[#EAEAE8] pt-20 pb-24 md:pt-24 md:pb-32 flex flex-col items-center rounded-[30px] sm:rounded-[40px] md:rounded-[50px] shadow-[0px_-1px_23px_0px_rgba(0,0,0,0.44)] -mt-12 sm:-mt-16 md:-mt-24">
          <div className="absolute left-1/2 -translate-x-1/2 -top-14 md:-top-16 z-20 w-32 h-32 md:w-36 md:h-36 rounded-full bg-[#EAEAE8] flex items-center justify-center">
            <img
              src="/images/wax seal.png"
              alt="Lunara Seal"
              className="w-32 h-32 md:w-36 md:h-36 object-contain drop-shadow-lg"
            />
          </div>
          <div className="w-full max-w-3xl px-6 sm:px-8 md:px-12">
            <h2 className="font-script text-[#431902] text-5xl md:text-6xl mb-6 tracking-wide">
              Dear parent.
            </h2>
            <div className="font-roman text-[#431902] text-base md:text-lg leading-relaxed space-y-5">
              <p>
                Maybe you&apos;ve told yourself you shouldn&apos;t bother people with your
                needs. Maybe you think support isn&apos;t for you, or that you should already
                know what to do. Maybe asking for help feels impossible. If so, you&apos;re
                in the right place.
              </p>
              <p>
                I offer accessible, practical support to help new parents thrive. Together,
                we&apos;ll create sustainable routines, reduce fatigue, and help you feel more
                organized and accomplished.
              </p>
            </div>
            <div className="mt-8 text-right">
              <Link
                to="/#offerings"
                className="font-roman text-[#431902] text-xl md:text-2xl underline underline-offset-4 hover:text-[#2d1b15] hover:tracking-wide hover:scale-[1.02] inline-block transition-all duration-300"
              >
                Learn More...
              </Link>
            </div>
          </div>
        </section>

        {/* Client Login */}
        <section className="relative z-20 -mt-12 sm:-mt-16 md:-mt-24">
          <Link
            to="/login"
            className="block relative w-full min-h-[220px] sm:min-h-[350px] md:min-h-[450px] overflow-hidden rounded-t-[30px] sm:rounded-t-[40px] md:rounded-t-[50px] shadow-[0px_-1px_7px_0px_rgba(11,11,11,0.39)] group"
          >
            <div className="absolute inset-0">
              <img
                src="/images/newborn.png"
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute inset-0 bg-[#2d1b15]/40" />
            <span className="absolute inset-0 flex items-center justify-center font-roman text-[#FAF7F2] text-2xl md:text-3xl tracking-wider z-10 group-hover:text-white transition-colors underline underline-offset-4">
              Client Login
            </span>
          </Link>
        </section>

        {/* Offerings */}
        <section id="offerings" className="relative z-30 w-full min-h-[320px] sm:min-h-[450px] md:min-h-[520px] overflow-hidden rounded-t-[30px] sm:rounded-t-[40px] md:rounded-t-[50px] shadow-[0px_-1px_23px_0px_rgba(0,0,0,0.44)] -mt-2 sm:-mt-4 md:-mt-10">
          <div className="absolute inset-0">
            <img
              src="/images/belly.png"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-[#2d1b15]/50" />
          <div className="relative z-10 px-6 md:px-12 py-12 md:py-16 flex flex-col items-center gap-8">
            <h2 className="font-script text-[#FAF7F2] text-4xl md:text-5xl lg:text-6xl text-center">
              Lunara&apos;s Offerings
            </h2>
            <div className="w-full max-w-md space-y-0 border border-[#FAF7F2]/30 rounded-2xl overflow-hidden bg-[#2d1b15]/20 backdrop-blur-sm">
              {OFFERINGS.map((item, index) => (
                <div key={item.title} className="border-b border-[#FAF7F2]/20 last:border-b-0">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-roman text-[#FAF7F2] text-lg hover:bg-[#2d1b15]/30 transition-colors"
                    onClick={() =>
                      setOpenOfferingIndex(openOfferingIndex === index ? null : index)
                    }
                  >
                    <span>{item.title}</span>
                    <svg
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        openOfferingIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openOfferingIndex === index && (
                    <div className="px-5 pb-4 pt-0 font-roman text-[#FAF7F2]/90 text-base">
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inquiry Form */}
        <section className="relative z-50 w-full min-h-0 overflow-hidden rounded-t-[30px] sm:rounded-t-[40px] md:rounded-t-[50px] shadow-[0px_-1px_23px_0px_rgba(57,74,72,0.19)] -mt-12 sm:-mt-16 md:-mt-24">
          <div className="absolute inset-0">
            <img
              src="/images/baby.png"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-[#1a1716]/70" />
          <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 py-8 sm:py-12 md:py-16 min-h-0">
            <h2 className="font-serif text-[#FAF7F2] text-2xl md:text-3xl text-center mb-8 tracking-wider">
              Inquiry Form
            </h2>
            {submitted ? (
              <div className="w-full max-w-2xl text-center space-y-4">
                <div className="text-[#FAF7F2] text-5xl">&#10003;</div>
                <h3 className="font-serif text-[#FAF7F2] text-xl md:text-2xl">Thank you for reaching out!</h3>
                <p className="font-serif text-[#FAF7F2]/80 text-base md:text-lg">
                  We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-8 py-3 rounded-[48px] bg-[#f2f0ef]/55 text-[#FAF7F2] font-serif text-lg tracking-wider hover:bg-[#f2f0ef]/70 transition-colors"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl min-w-0 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="firstName" className="sr-only">First Name (required)</label>
                  <input
                    id="firstName"
                    type="text"
                    {...register('firstName')}
                    className="w-full px-5 py-3 rounded-[26px] bg-[#f2f0ef]/55 font-serif text-white text-lg placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="First Name *"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-300">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">Last Name (required)</label>
                  <input
                    id="lastName"
                    type="text"
                    {...register('lastName')}
                    className="w-full px-5 py-3 rounded-[26px] bg-[#f2f0ef]/55 font-serif text-white text-lg placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Last Name *"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-300">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="phone" className="sr-only">Phone Number (required)</label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="w-full px-5 py-3 rounded-[26px] bg-[#f2f0ef]/55 font-serif text-white text-lg placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Phone Number *"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-300">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">Email (required)</label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="w-full px-5 py-3 rounded-[26px] bg-[#f2f0ef]/55 font-serif text-white text-lg placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Email *"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="inquiryType" className="sr-only">Inquiry Type (required)</label>
                  <select
                    id="inquiryType"
                    {...register('inquiryType')}
                    className="w-full px-5 py-3 rounded-[26px] bg-[#f2f0ef]/55 font-serif text-white text-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value="" className="text-[#431902]">Birth / Postpartum / Bereavement *</option>
                    <option value="birth" className="text-[#431902]">Birth</option>
                    <option value="postpartum" className="text-[#431902]">Postpartum</option>
                    <option value="bereavement" className="text-[#431902]">Bereavement</option>
                  </select>
                  {errors.inquiryType && (
                    <p className="mt-1 text-sm text-red-300">{errors.inquiryType.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="consultationDate" className="sr-only">Preferred Consultation Date</label>
                  <input
                    id="consultationDate"
                    type="date"
                    {...register('consultationDate')}
                    className="w-full px-5 py-3 rounded-[26px] bg-[#f2f0ef]/55 font-serif text-white text-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  {errors.consultationDate && (
                    <p className="mt-1 text-sm text-red-300">{errors.consultationDate.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="relevantInfo" className="sr-only">Relevant Information or Questions</label>
                <textarea
                  id="relevantInfo"
                  rows={4}
                  {...register('relevantInfo')}
                  className="w-full px-5 py-3 rounded-[26px] bg-[#f2f0ef]/55 font-serif text-white text-lg placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30 resize-y"
                  placeholder="Relevant Information or Questions (i.e. pronouns, due date, weeks postpartum, etc.)"
                />
              </div>
              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-3 rounded-[48px] bg-[#f2f0ef]/55 text-[#FAF7F2] font-serif text-lg tracking-wider hover:bg-[#f2f0ef]/70 transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <SimpleFooter fixed={false} />
    </div>
  );
};

export default LandingPage;
