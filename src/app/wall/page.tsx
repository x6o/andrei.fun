
import "./styles/global.css";
export default function Wall() {
  return (
    <>
          {/* <style jsx>{`
        body {
          margin: 0;
          overflow: hidden;
        }
        canvas {
          display: block;
        }
      `}</style> */}
    <canvas id="tileCanvas"></canvas>
    <button className="button" id="resetButton">Go to (0, 0)</button>
    </>
  );
}
