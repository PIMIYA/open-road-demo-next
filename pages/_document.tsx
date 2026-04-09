import React from "react";
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Fonts: Lobster Two (English) + Noto Sans SC (Chinese) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,400;1,9..144,700&family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
