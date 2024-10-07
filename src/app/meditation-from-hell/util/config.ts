export type SoundType = {
    id: number,
    filename: string,
    label: string
    volumeSettings: {
        min: number;
        max: number;
        default: number;
    }
}

export const SOUNDS : Array<SoundType> = [
    {
        id: 1,
        filename: 'crying-baby',
        label: 'Crying baby',
        volumeSettings: {
            min: 0,
            max: 1,
            default: 0.5,
        },
    },
    {
        id: 2,
        filename: 'chewing-gum',
        label: 'Chewing',
        volumeSettings: {
            min: 0,
            max: 1,
            default: 0.75,
        },
    },
    {
        id: 3,
        filename: 'car-alarm',
        label: 'Car alarm',
        volumeSettings: {
            min: 0,
            max: 0.03,
            default: 0.01,
        },
    },
    {
        id: 4,
        filename: 'fork-scrape',
        label: 'Fork scraping bowl',
        volumeSettings: {
            min: 0,
            max: 1,
            default: 0.5,
        },
    },
]
