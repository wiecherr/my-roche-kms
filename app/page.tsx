"use client";

import Image from "next/image";
import {useState} from "react";

export default function Home() {
  const [counter, setCounter]= useState(0);
  return (
      <h1 className="text-center text-4xl font-semibold text-zinc-950 sm:text-5xl">
        RFID Key Management System
      </h1>

      
  );
}
