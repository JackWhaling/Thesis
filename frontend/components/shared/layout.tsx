import Head from "next/head";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>A prototype thesis project created by Jack Whaling for proportional representation. Special thanks to Dr. Haris Aziz and Xinhang Lu</title>
        <meta charSet="utf-8" />
        <meta name="description" content="A voting platform to analyse user interaction for preferencial voting outcomes" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <main>{children}</main>
    </>
  )
}

export default Layout