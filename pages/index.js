import Head from "next/head";
import Image from "next/image";
import Footer from "../Components/Footer";
import Header from "../Components/Header";
import Main from "../Components/Main";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Head>
        <title>NETRO NAME SERVICE</title>
        <meta name="description" content="Create your own domains" />
      </Head>
      <Header />
      <div className="py-[100px]" />
      <Main />
      <Footer />
    </div>
  );
}
