import Image from "next/image";
import Link from "next/link";
import {SOUNDS, SoundType} from "./util/config";
import { AudioVisualizer } from "./components/AudioVisualizer";

export default function MeditationFromHell() {
  return (
    <>
    <div className="flex flex-col mt-5">
      <div className="flex ml-10 mt-5 z-50">
        <Link href="/">
          <Image

            priority
            src="/images/logo.jpg"
            alt="Andrei.fun logo"
            width={220}
            height={47}
          />
        </Link>
      </div>
      <div className="flex justify-center items-center gap-5 mt-5">
        {SOUNDS.map((sound: SoundType) => {
          return <AudioVisualizer key={`audio_player_${sound.id}`} audio={sound}/>;
        })}
        {/* <AudioVisualizer audio={SOUNDS[0]}/>
        <AudioVisualizer audio={SOUNDS[2]}/> */}
      </div>
    </div>
    </>
  );
}
