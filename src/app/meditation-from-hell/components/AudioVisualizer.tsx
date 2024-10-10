'use client'
import React, { useRef, useState, useEffect } from 'react'
import { SoundType } from '../util/config'

export const AudioVisualizer = ({ audio }: { audio: SoundType }) => {
    const volumeControl = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null) // Canvas for visualization
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hadErrorLoading, setHadErrorLoading] = useState(false)

    const drawVisualizer = (analyserNode: AnalyserNode) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const { innerWidth: width, innerHeight: height } = window;
    
        if (canvas) {
            canvas.width = width;
            canvas.height = height;
        }
    
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
    
        const draw = () => {
            if (!canvas || !ctx) return;
            analyserNode.getByteFrequencyData(dataArray);
    
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(255, 0, 0, 1)';
            ctx.fillRect(0, 0, width, height);
    
            const radiusStep = 15;
            const maxRadius = Math.min(width, height) / 1; 
    
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i];
                const radius = (barHeight / 255) * maxRadius;
    
                ctx.beginPath();
                ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
                ctx.fillStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
                ctx.fill();
                ctx.closePath();
            }
    
            requestAnimationFrame(draw);
        };
        draw();
    };
    
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        const { innerWidth: width, innerHeight: height } = window
        if (canvas) {
            canvas.width = width
            canvas.height = height
        }

        return () => {
            if (ctx) ctx.clearRect(0, 0, width, height)
        }
    }, [isPlaying])

    const loadSound = () => {
        if (typeof window !== 'undefined') {
            const context = new AudioContext()
            const gainNode = context.createGain()
            const analyserNode = context.createAnalyser() 
            analyserNode.fftSize = 256

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
                    source.connect(gainNode).connect(analyserNode).connect(context.destination)
                    source.loop = true

                    // Let's not blow eardrums out
                    gainNode.gain.value = audio.volumeSettings.default

                    source.start(0)
                    setIsLoading(false)
                    setIsPlaying(true)

                    // Start visualizer after sound plays
                    const canvas = canvasRef.current
                    if (canvas) {
                        drawVisualizer(analyserNode) // Call visualizer function
                    }

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
        <>
        <div className="flex h-[150px] w-[200px] flex-col rounded-xl bg-red-600 p-4 z-10">
            <h2 id={`${audio.id}_label`} className=' text-white'>{audio.label}</h2>
            <div onClick={loadSound} className="hover:cursor-pointer">
                <p>{isPlaying ? 'Playing...' : 'Play'}</p>
            </div>
            <p>{hadErrorLoading && 'Error loading!'}</p>
            <p>{isLoading && 'Loading...'}</p>
            <input
                className="w-[100%] mt-auto appearance-none bg-transparent hover:cursor-grab active:cursor-grabbing [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-black/25 [&::-webkit-slider-thumb]:h-[50px] [&::-webkit-slider-thumb]:w-[50px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500"
                ref={volumeControl}
                aria-labelledby={`${audio.id}_label`}
                type="range"
                id={`volume_${audio.filename}`}
                min={audio.volumeSettings.min}
                max={audio.volumeSettings.max}
                step="0.01"
                defaultValue={audio.volumeSettings.default}
            />
            {/* Canvas for visualizer */}
            
        </div>
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" />
        </>
    )
}
