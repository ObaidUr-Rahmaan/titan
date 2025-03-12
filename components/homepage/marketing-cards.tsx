'use client';
import { TITLE_TAILWIND_CLASS } from '@/utils/constants';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { Sparkles, Zap } from 'lucide-react';

const ProjectsData = [
  {
    id: 1,
    name: 'Nextjs 15',
    description:
      'Full-Stack framework for React that enables server-side rendering and effortless deployment.',
    image: '/icons-png/nextjs.png',
    imageDark: '/icons-png/nextjs.png',
    svgContent: `<svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <mask id="mask0_408_139" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
        <circle cx="90" cy="90" r="90" fill="black"/>
      </mask>
      <g mask="url(#mask0_408_139)">
        <circle cx="90" cy="90" r="90" fill="black"/>
        <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="url(#paint0_linear_408_139)"/>
        <rect x="115" y="54" width="12" height="72" fill="url(#paint1_linear_408_139)"/>
      </g>
      <defs>
        <linearGradient id="paint0_linear_408_139" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
          <stop stop-color="white"/>
          <stop offset="1" stop-color="white" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="paint1_linear_408_139" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
          <stop stop-color="white"/>
          <stop offset="1" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
    </svg>`,
    url: 'https://nextjs.org/',
  },
  {
    id: 2,
    name: 'Clerk Authentication',
    description: 'Seamless and secure authentication service for web applications.',
    image: '/icons-png/clerk.png',
    svgContent: `<svg viewBox="0 0 62 18" fill="none" aria-hidden="true" class="w-full h-full">
      <ellipse cx="8.99999" cy="9" rx="2.81249" ry="2.8125" fill="white"></ellipse>
      <path d="M14.0674 15.6591C14.3067 15.8984 14.2827 16.2945 14.0015 16.4829C12.571 17.4411 10.8504 17.9999 8.9993 17.9999C7.14818 17.9999 5.42758 17.4411 3.99704 16.4829C3.71589 16.2945 3.69186 15.8984 3.93115 15.6591L5.98648 13.6037C6.17225 13.418 6.46042 13.3886 6.69424 13.5084C7.3856 13.8626 8.16911 14.0624 8.9993 14.0624C9.82948 14.0624 10.613 13.8626 11.3044 13.5084C11.5382 13.3886 11.8263 13.418 12.0121 13.6037L14.0674 15.6591Z" fill="white"></path>
      <path d="M14.0022 1.51706C14.2834 1.70539 14.3074 2.10155 14.0681 2.34084L12.0128 4.39619C11.827 4.58195 11.5388 4.61129 11.305 4.49151C10.6136 4.13733 9.83014 3.9375 8.99996 3.9375C6.20403 3.9375 3.93748 6.20406 3.93748 9C3.93748 9.83018 4.13731 10.6137 4.49149 11.3051C4.61127 11.5389 4.58193 11.827 4.39617 12.0128L2.34083 14.0682C2.10154 14.3074 1.70538 14.2834 1.51705 14.0023C0.558857 12.5717 0 10.8511 0 9C0 4.02944 4.02942 0 8.99996 0C10.8511 0 12.5717 0.55886 14.0022 1.51706Z" fill="white" fill-opacity="0.5"></path>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M29.3906 1.82813C29.3906 1.75046 29.4535 1.6875 29.5312 1.6875H31.6406C31.7182 1.6875 31.7812 1.75046 31.7812 1.82813V16.1719C31.7812 16.2495 31.7182 16.3125 31.6406 16.3125H29.5312C29.4535 16.3125 29.3906 16.2495 29.3906 16.1719V1.82813ZM26.4137 13.2701C26.3577 13.2217 26.2739 13.2253 26.2201 13.2761C25.8913 13.5864 25.5063 13.8347 25.0843 14.0078C24.6215 14.1979 24.1239 14.2936 23.622 14.2891C23.1982 14.3016 22.7762 14.2291 22.3821 14.076C21.988 13.9229 21.63 13.6925 21.3303 13.3989C20.7859 12.8431 20.4726 12.0496 20.4726 11.1037C20.4726 9.2101 21.7324 7.91491 23.622 7.91491C24.1289 7.90793 24.631 8.01058 25.0926 8.21543C25.5111 8.40122 25.8869 8.66683 26.1982 8.99629C26.2514 9.05264 26.3398 9.05916 26.3985 9.00842L27.8225 7.7762C27.8807 7.72586 27.8877 7.63797 27.8364 7.58065C26.7653 6.38368 25.0872 5.76563 23.4914 5.76563C20.2783 5.76563 18 7.93299 18 11.1217C18 12.6988 18.5662 14.0268 19.5211 14.9645C20.476 15.9023 21.8363 16.4531 23.4059 16.4531C25.3741 16.4531 26.9582 15.6984 27.8869 14.7302C27.9414 14.6734 27.9354 14.583 27.8758 14.5315L26.4137 13.2701ZM43.401 11.8056C43.3931 11.876 43.3332 11.9287 43.2623 11.9287H35.8731C35.7833 11.9287 35.7164 12.012 35.7398 12.0986C36.1074 13.4614 37.2035 14.286 38.6995 14.286C39.2038 14.2966 39.7037 14.1928 40.1605 13.9827C40.5862 13.787 40.9639 13.5038 41.2682 13.1528C41.305 13.1104 41.3691 13.1041 41.4122 13.1401L42.8978 14.4335C42.9547 14.483 42.9626 14.5687 42.9138 14.6262C42.0169 15.6843 40.5637 16.4531 38.5695 16.4531C35.5016 16.4531 33.1874 14.3286 33.1874 11.1009C33.1874 9.51732 33.7326 8.18944 34.6412 7.25179C35.1209 6.76963 35.6959 6.38911 36.3307 6.13368C36.9656 5.87826 37.6469 5.75332 38.3327 5.76658C41.4422 5.76658 43.453 7.95343 43.453 10.973C43.4491 11.2512 43.4317 11.5291 43.401 11.8056ZM35.7842 9.84589C35.7581 9.93268 35.8251 10.0172 35.9158 10.0172H40.829C40.9198 10.0172 40.9869 9.93217 40.9617 9.84491C40.6268 8.68592 39.7772 7.91244 38.4577 7.91244C38.0696 7.90013 37.6834 7.97039 37.3254 8.11832C36.9675 8.26633 36.6462 8.48856 36.3836 8.76977C36.1075 9.08283 35.9034 9.44988 35.7842 9.84589ZM50.7639 5.76717C50.8422 5.76632 50.9061 5.82952 50.9061 5.90779V8.26951C50.9061 8.35135 50.8365 8.41586 50.7548 8.40981C50.5269 8.39291 50.3114 8.37856 50.1701 8.37856C48.3301 8.37856 47.2499 9.67359 47.2499 11.3735V16.1719C47.2499 16.2495 47.1869 16.3125 47.1092 16.3125H44.9999C44.9222 16.3125 44.8592 16.2495 44.8592 16.1719V6.05379C44.8592 5.97613 44.9222 5.91317 44.9999 5.91317H47.1092C47.1869 5.91317 47.2499 5.97613 47.2499 6.05379V7.47394C47.2499 7.48196 47.2563 7.48845 47.2644 7.48845C47.2689 7.48845 47.2733 7.48627 47.276 7.48261C48.1006 6.38146 49.3176 5.76892 50.6033 5.76892L50.7639 5.76717ZM56.4778 11.9525C56.4864 11.9432 56.4985 11.938 56.5112 11.938C56.5269 11.938 56.5415 11.9461 56.5498 11.9595L59.217 16.2462C59.2426 16.2874 59.2878 16.3125 59.3364 16.3125L61.7342 16.3125C61.8445 16.3125 61.9118 16.1915 61.8538 16.0978L58.1947 10.1939C58.1616 10.1406 58.1679 10.0719 58.21 10.0254L61.7355 6.13573C61.8174 6.04534 61.7533 5.90066 61.6313 5.90066H59.1298C59.0904 5.90066 59.0528 5.91719 59.0261 5.94622L54.9472 10.3925C54.8605 10.487 54.7029 10.4257 54.7029 10.2974V1.82812C54.7029 1.75046 54.64 1.6875 54.5623 1.6875H52.453C52.3753 1.6875 52.3123 1.75046 52.3123 1.82812V16.1719C52.3123 16.2495 52.3753 16.3125 52.453 16.3125L54.5623 16.3125C54.64 16.3125 54.7029 16.2495 54.7029 16.1719V13.9147C54.7029 13.8792 54.7164 13.8449 54.7406 13.8189L56.4778 11.9525Z" fill="white"></path>
    </svg>`,
    url: 'https://clerk.com/',
  },
  {
    id: 3,
    name: 'Supabase (PostgreSQL)',
    description:
      'PostgreSQL-based open-source database for building scalable applications.',
    image: '/icons-png/supabase.png',
    svgContent: `<svg width="100%" height="100%" viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear)"/>
      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint1_linear)" fill-opacity="0.2"/>
      <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
      <defs>
        <linearGradient id="paint0_linear" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
          <stop stop-color="#249361"/>
          <stop offset="1" stop-color="#3ECF8E"/>
        </linearGradient>
        <linearGradient id="paint1_linear" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
          <stop/>
          <stop offset="1" stop-opacity="0"/>
        </linearGradient>
      </defs>
    </svg>`,
    url: 'https://supabase.com/',
  },
  {
    id: 4,
    name: 'Drizzle ORM',
    description:
      'Modern headless TypeScript ORM for high-speed database interactions.',
    image: '/icons-png/drizzle.png',
    svgContent: null,
    url: 'https://orm.drizzle.team/',
  },
  {
    id: 5,
    name: 'Stripe Subsctiptions & One-Time Payments',
    description:
      'Payment processing solution for handling subscriptions and one-off transactions securely.',
    image: '/icons-png/stripe.png',
    svgContent: `<svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="60" height="25" class="w-full h-full">
      <path fill="#fff" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z" fill-rule="evenodd"></path>
    </svg>`,
    url: 'https://stripe.com',
  },
  {
    id: 6,
    name: 'Tanstack Query',
    description:
      'Powerful data fetching library that handles caching, background updates and stale data out of the box.',
    image: 'https://tanstack.com/_build/assets/logo-color-100w-br5_Ikqp.png',
    svgContent: null,
    url: 'https://tanstack.com/query/v5',
  },
  {
    id: 7,
    name: 'Plunk',
    description:
      'Simple and powerful email service for sending transactional and marketing emails.',
    image: '/icons-png/plunk.png',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1080 1080" class="w-full h-full">
      <path fill="white" d="M976 284.628q0 95.414-49.38 175.112-49.379 79.699-143.65 130.212-94.27 50.512-224.453 59.493L510.26 919.971Q482.204 1076 357.632 1076q-68.459 0-126.816-40.41-57.235-40.41-92.026-123.477Q104 829.048 104 707.816q0-227.871 72.947-386.145 74.07-159.396 197.519-237.973Q499.037 4 648.299 4q105.492 0 178.44 37.043 74.069 37.042 111.104 101.026Q976 204.929 976 284.628M578.718 533.826q230.064-29.185 230.065-239.095 0-74.086-49.38-120.109-48.258-47.145-150.384-47.146-115.593 0-202.007 72.964-85.293 72.963-132.428 203.175-46.013 129.088-46.013 295.221 0 69.596 13.468 123.476 14.59 53.88 35.912 84.189 22.446 29.185 42.646 29.185 28.057 0 42.646-77.454l37.035-212.154q-43.769-6.736-38.157-5.613-33.668-5.613-43.768-20.205-10.101-15.715-10.101-39.288 0-24.696 13.467-39.288 14.59-14.593 39.28-14.593 11.223 0 16.834 1.123 26.934 4.49 41.524 5.612 14.589-87.556 41.523-234.605 6.734-38.166 30.302-53.881 24.689-16.837 57.235-16.837 37.035 0 52.746 14.592 16.834 13.47 16.834 43.778 0 17.96-2.244 29.186z"></path>
      <path fill="#122331" d="m304.835 467.541 121.264 22.411-14.248 90.985-20.76 118.879-125.003-23.173z"></path>
    </svg>`,
    url: 'https://useplunk.com',
  },
  {
    id: 8,
    name: 'DataFast',
    description: 'User Analytics for Actionable Growth (Know exactly which marketing channels are working).',
    image: '/icons-png/datafast.png',
    url: 'https://datafa.st',
  },
  {
    id: 9,
    name: 'UserJot',
    description: 'User Feedback/Bug-Reports and Product Roadmap management.',
    image: '/icons-png/userjot.png',
    svgContent: `<svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#1F1F1F" d="M5.89913 90.8654C8.0522 95.5121 10.6368 100.378 9.13098 105.618C8.06985 109.311 5.75106 112.334 5.42471 116.308C4.86915 123.072 10.8259 128.553 17.5205 127.438C23.7626 126.398 29.7626 120.467 36.339 122.014C36.9967 122.168 39.1761 122.939 44.4944 124.841C50.4386 126.967 56.7724 128 64 128C99.3462 128 128 99.3462 128 64C128 28.6538 99.3462 0 64 0C28.6538 0 0 28.6538 0 64C0 73.5861 2.11243 82.6911 5.89913 90.8654Z"></path>
      <path stroke="#F5F5F5" d="M86 82.6663C80.9833 89.3457 72.9962 93.6663 64 93.6663C55.0038 93.6663 47.0167 89.3457 42 82.6663" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`,
    url: 'https://userjot.com',
  },
  {
    id: 10,
    name: 'GetFernand',
    description: 'Fast, Calm Customer Support interface for your product.',
    image: '/icons-png/fernand.png',
    svgContent: `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52">
      <path d="M25.96 20.95a4.8 4.8 0 00-5.08-.26c-.62.34-1.16.8-1.58 1.38a.62.62 0 00.6.98.62.62 0 00.4-.25 3.58 3.58 0 011.96-1.32.12.12 0 01.1.1c0 .02 0 .04-.02.06a1.24 1.24 0 001.02 1.74 1.26 1.26 0 001.34-.9c.06-.2.06-.39.03-.58a.12.12 0 01.04-.12.12.12 0 01.13-.01l.34.2a.63.63 0 00.89-.84.62.62 0 00-.17-.18z" fill="#6f7a96"></path>
      <path d="M32.6 29.64l.6-5.38c.34-3.03.21-6 .07-7.8a.88.88 0 01.79-.95l.92-.1 5.02-.53c-.25-1.01-2.4-1.47-5.72-1.41-3.73.07-8.93.8-14.58 2.17-8.56 2.06-14.61 4.4-16.78 6.57-.53.53 2.05 4.98 2.38 5.65a38.39 38.39 0 012.52 7.96c.41 1.87.68 3.78.81 5.7a.9.9 0 00.32.63l10.6 8.95a.32.32 0 00.44-.02l4.13-4.24a.35.35 0 01.46-.03l3.64 2.72a.32.32 0 00.49-.14.31.31 0 000-.2l-1.03-4.13c-.23-.9-.3-1.83-.23-2.76l.05-.6c2.5-.53 4.17-1.72 4.2-3.19l.36-3.55a.55.55 0 01.59-.5 3.67 3.67 0 003.92-2.52.3.3 0 00-.16-.38.31.31 0 00-.14-.03c-1.16.04-1.91-1.13-3.67-1.89zm-1.76 4.5c-.03.33-.18.65-.41.9-.3.3-.69.51-1.11.6-.43.07-.86.1-1.3.09a.58.58 0 00-.59.54.57.57 0 00.55.6h.09c.09 0 .25 0 .45-.02a1.33 1.33 0 011.44 1.61 2.52 2.52 0 01-1.69 1.85c-1.02.34-2.33.56-3.84.56-2.59 0-5-.71-5.82-1.71l-3.91-5.14a.6.6 0 00-.76-.17.57.57 0 00-.17.84l3.94 5.18c.74.9 2.22 1.57 4.04 1.91.7.16 1.43.52 2.09.93 1.47.92.48 3.18-1.2 2.73a2.77 2.77 0 01-.22-.06L10.5 41.3a1.2 1.2 0 01-.8-1.01 41 41 0 00-.74-4.73 50.4 50.4 0 00-.93-3.64c-.11-.38.38-.65.64-.35l.08.08a3.24 3.24 0 004.6-.19.58.58 0 00-.02-.81.58.58 0 00-.84.05c-.1.12-.21.24-.35.32-.9.55-1.93.42-2.6-.2l-2.97-3.35a2.73 2.73 0 011.6-4.72 2.76 2.76 0 012.2.74 3 3 0 011 1.9s.17 2.51 2.18 2.51c1.1 0 2-.92 2.15-2.13l.24-3.5a5.42 5.42 0 014.15-4.9l.04-.02c1.38-.33 2.72-.6 3.95-.79 1.37-.22 2.63-.35 3.7-.4l3.3-.33a.87.87 0 01.86.46c.05.1.08.21.1.32.06.85.12 1.95.13 3.18a4.3 4.3 0 00-4.08 1.54l-.01.02a.56.56 0 00-.12.44v.02c.01.08.27 1.9.48 2.71.5 1.86.91 2.7 1.21 3.3.2.39.32.64.4 1.02a.4.4 0 01-.2.44 2.02 2.02 0 01-1.44.17c-.74-.18-1.83-.14-3.21.74-2.57 1.62-4.2 2.54-6.18 2.52a.31.31 0 00-.31.3c0 .05 0 .1.04.15.8 1.45 3.79 5.38 10.6.7a.67.67 0 01.63-.06c.3.12.6.22.87.3v.03zm.5-5.67a.16.16 0 01-.15-.1c-.1-.29-.28-.8-.42-1.08-.3-.6-.66-1.34-1.13-3.08-.12-.47-.27-1.38-.36-1.98a.56.56 0 01.19-.52c.2-.17.41-.3.65-.42.13-.06.28.04.26.19a1.13 1.13 0 001.4 1.2.24.24 0 01.3.24l-.12 1.2-.47 4.22a.15.15 0 01-.15.13z" fill="#6f7a96"></path>
      <path d="M10.06 28.47a.57.57 0 01-.52-.33s-.51-1.04-1.56-1.7a.57.57 0 01-.25-.59.57.57 0 01.44-.45c.15-.04.3 0 .43.07a5.84 5.84 0 011.98 2.18.57.57 0 01-.52.82zM34.47 1.9A30.88 30.88 0 0024.19.18C12.01.18 1.92 6.94.05 15.8c-.27 1.3.62 2.4 1.3 3.61.28.5.5.89.59 1l.04.07a20.95 20.95 0 014.21-2.44c3.59-1.67 7.78-2.99 13.06-4.26a81.44 81.44 0 0112.98-2.13 1.04 1.04 0 00.92-.72l2.26-7.16a1.5 1.5 0 00-.94-1.87zM27.9 9.18a2.95 2.95 0 01-2.72-1.8 2.91 2.91 0 012.14-4 2.95 2.95 0 013.52 2.87 2.91 2.91 0 01-2.94 2.93z" fill="#6f7a96"></path>
    </svg>`,
    url: 'https://getfernand.com',
  },
  {
    id: 11,
    name: 'Vercel',
    description: 'Deployments without worrying about infrastructure (DDoS protection, etc.)',
    image: '/icons-png/vercel.png',
    svgContent: `<svg aria-label="Vercel Logo" fill="white" viewBox="0 0 75 65" class="w-full h-full"><path d="M37.59.25l36.95 64H.64l36.95-64z"></path></svg>`,
    url: 'https://vercel.com',
  },
];

// Electric pulse animation component
const ElectricPulse = () => {
  return (
    <motion.div 
      className="absolute -inset-0.5 rounded-md z-0 bg-gradient-to-r from-green-400/30 to-emerald-500/30 opacity-0 group-hover:opacity-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0 }}
      whileHover={{ 
        opacity: [0, 0.7, 0.4],
        transition: { duration: 0.3 }
      }}
    />
  );
};

// Zap icon animation
const AnimatedZap = () => {
  return (
    <motion.div
      className="absolute top-3 right-3 text-green-400 opacity-0 group-hover:opacity-100"
      initial={{ scale: 0, rotate: -10 }}
      whileHover={{ 
        scale: 1,
        rotate: [0, 15, 0, -10, 0],
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 5,
          duration: 1,
          repeat: Infinity,
          repeatType: "loop"
        } 
      }}
    >
      <Sparkles size={16} />
    </motion.div>
  );
};

const SpringAnimatedFeatures = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  
  return (
    <motion.div 
      ref={ref}
      className="flex flex-col justify-center items-center w-full py-24 bg-black px-4 sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex flex-col mb-[3rem]"
        initial={{ y: 20, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h2
          className="text-4xl md:text-5xl mt-2 font-semibold tracking-tight text-white text-center"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2"
          >
            <span>Built with the best Tech</span>
            <motion.span
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 0.5, 
                repeat: Infinity, 
                repeatDelay: 4,
                ease: "easeInOut" 
              }}
            >
              <Zap className="text-green-500" size={32} />
            </motion.span>
          </motion.div>
        </h2>
        <motion.p 
          className="mx-auto max-w-[600px] text-gray-400 text-center mt-2"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Your customers deserve your focus - build with tech that just works.
        </motion.p>
      </motion.div>

      <motion.div 
        className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {ProjectsData.map((project, index) => {
          return (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.1 * index,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 10
                }
              }}
              key={project.id}
              className="mt-5 text-left border border-gray-800 p-6 rounded-md dark:bg-black/30 bg-gray-900 backdrop-blur-sm relative group"
            >
              <ElectricPulse />
              <AnimatedZap />
              <Link href={project?.url} target="_blank" rel="noopener noreferrer" className="relative z-10 block">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {project.svgContent ? (
                    <div 
                      className="mb-3 h-[30px] w-[40px] flex items-center justify-center bg-gray-900 rounded p-1"
                      dangerouslySetInnerHTML={{ __html: project.svgContent }}
                    />
                  ) : (
                    <Image
                      src={project?.imageDark ? project?.imageDark : project.image}
                      width={40}
                      height={30}
                      className="mb-3 rounded object-contain"
                      alt={project.name}
                    />
                  )}
                </motion.div>
                <motion.div 
                  className="mb-1 text-sm font-medium text-white"
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  {project.name}
                </motion.div>
                <div className="max-w-[250px] text-sm font-normal text-gray-400">
                  {project.description}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default SpringAnimatedFeatures;
