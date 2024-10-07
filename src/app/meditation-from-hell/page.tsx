import Image from "next/image";
import Link from "next/link";
import { AudioPlayer } from "./components/AudioPlayer";
import {SOUNDS, SoundType} from "./util/config";

export default function MeditationFromHell() {
  return (
    <>
    <div>
      <div className="flex justify-center items-center flex-col mt-5">
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
          return <AudioPlayer key={`audio_player_${sound.id}`} audio={sound}/>;
        })}
      </div>
    </div>
    </>
  );
}
