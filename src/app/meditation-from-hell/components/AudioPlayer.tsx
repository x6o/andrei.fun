'use client'
import React from 'react'

import { useRef, useState, useEffect } from 'react'
import { SoundType } from '../util/config'

export const AudioPlayer = ({ audio }: { audio: SoundType }) => {
    const volumeControl = useRef<HTMLInputElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hadErrorLoading, setHadErrorLoading] = useState(false)

    const loadSound = () => {
        if (typeof window !== 'undefined') {
            const context = new AudioContext()
            const gainNode = context.createGain()

            const loadSound = async () => {
                try {
                    setIsLoading(true)

                    const response = await fetch(
                        `/projects/meditation-from-hell/audio/${audio.filename}.mp3`
                    )
                    const arrayBuffer = await response.arrayBuffer()
                    const decodedBuffer =
                        await context.decodeAudioData(arrayBuffer)

                    const source = context.createBufferSource()
                    source.buffer = decodedBuffer
                    source.connect(gainNode).connect(context.destination)
                    source.loop = true

                    // Let's not blow eardrums out
                    gainNode.gain.value = audio.volumeSettings.default

                    source.start(0)
                    setIsLoading(false)
                    setIsPlaying(true)

                    if (volumeControl.current) {
                        volumeControl.current.addEventListener(
                            'input',
                            function () {
                                const newValue = parseFloat(this.value)
                                if (newValue <= audio.volumeSettings.max) {
                                    gainNode.gain.value = newValue
                                }
                            }
                        )
                    }
                } catch (error) {
                    console.error('Error loading sound:', error)
                    setHadErrorLoading(true)
                }
            }

            loadSound()
        }
    }

    return (
        <div className="flex h-[150px] w-[200px] flex-col rounded-xl bg-red-600 p-4">
            <h2 className=' text-white'>{audio.label}</h2>
            <div onClick={loadSound} className="hover:cursor-pointer">
                <p>{isPlaying ? 'Playing...' : 'Play'}</p>
            </div>
            <p>{hadErrorLoading && 'Error loading!'}</p>
            <p>{isLoading && 'Loading...'}</p>
            <input
                className="w-[100%] mt-auto appearance-none bg-transparent hover:cursor-grab active:cursor-grabbing [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-black/25 [&::-webkit-slider-thumb]:h-[50px] [&::-webkit-slider-thumb]:w-[50px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500"
                ref={volumeControl}
                type="range"
                id={`volume_${audio.filename}`}
                min={audio.volumeSettings.min}
                max={audio.volumeSettings.max}
                step="0.01"
                defaultValue={audio.volumeSettings.default}
            />
        </div>
    )
}
