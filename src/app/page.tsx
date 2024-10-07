import Image from "next/image";

export default function Home() {
  return (
    <div className="grid place-items-center min-h-screen">
      <div className="flex justify-center items-center flex-col">
        <Image
          priority
          src="/images/logo.jpg"
          alt="Andrei.fun logo"
          width={220}
          height={47}
        />
        {/* <div className="flex justify-center items-center text-gray-400 mt-1">a collection of&nbsp;<span className="handwritten-strike">silly</span>&nbsp;side projects</div> */}
      <div className="flex justify-center items-center text-gray-500 text-lg mt-1">coming soon, unfortunately</div>
      </div>
      
    </div>
  );
}
