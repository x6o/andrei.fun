'use client';
import { useState, useEffect } from 'react';
import { bubbleSortCode } from '../util/config';


const SortingVisualizer = () => {
  const [array, setArray] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const generateArray = (size: number = 15) => {
    const newArray = Array.from({ length: size }, () => 
      Math.floor(Math.random() * 90) + 10
    );
    setArray(newArray);
  };

  const bubbleSort = async () => {
    setIsSorting(true);
    const arr = [...array];
    for (let i = 0; i < arr.length; i++) {
      setActiveLine(1);
      for (let j = 0; j < arr.length - i - 1; j++) {
        setActiveLine(2);
        const bars = document.getElementsByClassName('array-bar');
        
        // Highlight compared elements
        setActiveLine(3);
        bars[j].classList.add('bg-red-500');
        bars[j + 1].classList.add('bg-red-500');
        await new Promise(resolve => setTimeout(resolve, 50));

        if (arr[j] > arr[j + 1]) {
          setActiveLine(4);
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Reset color
        bars[j].classList.remove('bg-red-500');
        bars[j + 1].classList.remove('bg-red-500');
      }
    }
    setActiveLine(null);
    setIsSorting(false);
  };

  useEffect(() => {
    generateArray();
  }, []);

  return (
    <div className="h-screen bg-gray-900 text-white">
      <div className="w-full bg-gray-800 p-4 fixed top-0">
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => generateArray()}
            className="disabled:opacity-50 disabled:pointer-events-none py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            disabled={isSorting}
          >
            New Array
          </button>
          <button 
            onClick={bubbleSort}
            disabled={isSorting}
            className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
          >
            Start Sorting
          </button>
        </div>
      </div>

      <div className="flex pt-20 h-full">
        <div className="w-1/2 p-6 border-r border-gray-700 overflow-auto">
          <pre className="text-sm font-mono">
            <code>
              {bubbleSortCode.map((line, index) => (
                <div
                  key={index}
                  className={`p-1 ${activeLine === index ? 'bg-gray-700 rounded' : ''}`}
                >
                  {line}
                </div>
              ))}
            </code>
          </pre>
        </div>

        <div className="w-1/2 p-6 flex items-end h-full gap-1">
          {array.map((value, idx) => (
            <div
              key={idx}
              className="array-bar bg-indigo-500 transition-all duration-100 rounded-t"
              style={{
                height: `${value}%`,
                width: `${100 / array.length}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SortingVisualizer;