import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import React, { useEffect } from 'react';
import './App.less';
var runningMode = "VIDEO";
let imageSegmenter: ImageSegmenter;
async function createImageSegmenter() {
  const vision = await FilesetResolver.forVisionTasks("/wasm");

  imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      delegate: "GPU",
      modelAssetPath:
        "//localhost:8080/deeplab_v3.tflite?version=1",
    },
    outputCategoryMask: true,
    outputConfidenceMasks: false,
    runningMode: runningMode
  });
}


const legendColors = [
  [255, 197, 0, 255], // Vivid Yellow
  [128, 62, 117, 255], // Strong Purple
  [255, 104, 0, 255], // Vivid Orange
  [166, 189, 215, 255], // Very Light Blue
  [193, 0, 32, 255], // Vivid Red
  [206, 162, 98, 255], // Grayish Yellow
  [129, 112, 102, 255], // Medium Gray
  [0, 125, 52, 255], // Vivid Green
  [246, 118, 142, 255], // Strong Purplish Pink
  [0, 83, 138, 255], // Strong Blue
  [255, 112, 92, 255], // Strong Yellowish Pink
  [83, 55, 112, 255], // Strong Violet
  [255, 142, 0, 255], // Vivid Orange Yellow
  [179, 40, 81, 255], // Strong Purplish Red
  [244, 200, 0, 255], // Vivid Greenish Yellow
  [127, 24, 13, 255], // Strong Reddish Brown
  [147, 170, 0, 255], // Vivid Yellowish Green
  [89, 51, 21, 255], // Deep Yellowish Brown
  [241, 58, 19, 255], // Vivid Reddish Orange
  [35, 44, 22, 255], // Dark Olive Green
  [0, 161, 194, 255] // Vivid Blue
];


let lastWebcamTime = -1;
var video : HTMLVideoElement;
var webcamRunning = true;
var canvasCtx:any=null;
var textOffsetX = 0;

const App = () => {

const callbackForVideo = (result: any) => {
  let imageData = canvasCtx.getImageData(0,0, video.videoWidth,video.videoHeight).data;
  const mask: Number[] = result.categoryMask.getAsFloat32Array();
  let j = 0;
  for (let i = 0; i < mask.length; ++i) {
    if(mask[i] != 0){
      imageData[j] = 0;
      imageData[j + 1] = 0;
      imageData[j + 2] = 0;
      imageData[j + 3] = 0;
    }
    
    j += 4;
  }

  const uint8Array = new Uint8ClampedArray(imageData.buffer);
  const dataNew = new ImageData(
    uint8Array,
    video.videoWidth,
    video.videoHeight
  );
  canvasCtx.putImageData(dataNew, 0, 0);
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}


  const predictWebcam = async () => {
    const canvas = document.getElementById("output") as HTMLCanvasElement;
    canvasCtx = canvas.getContext("2d");
    if (video.currentTime === lastWebcamTime) {
      if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
      }
      return;
    }
    lastWebcamTime = video.currentTime;
    canvasCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    canvasCtx.font = "48px serif";
    canvasCtx.fillStyle = "red";
    if(textOffsetX > video.videoWidth){
      textOffsetX = -200;
    }
    textOffsetX += 5;
    canvasCtx.fillText("Hello, World!", textOffsetX, 220);
    // Do not segmented if imageSegmenter hasn't loaded
    if (imageSegmenter === undefined) {
      return;
    }
    let startTimeMs = performance.now();
    // console.log("Start segmenting the stream.");
    // Start segmenting the stream.
    imageSegmenter.segmentForVideo(video, startTimeMs, callbackForVideo);
  }

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(async (stream) => {
      await createImageSegmenter();
      video = document.getElementById("video") as HTMLVideoElement;
      video.addEventListener("loadeddata", predictWebcam);
      if(video != null){
        video.srcObject = stream;
      }
    });

  }, []);

  return (
    <React.Fragment>
    <div className="container">
      <video id="video" width="640" height="480" autoPlay></video>
      <canvas id="output" width="640" height="480"></canvas>
    </div>
    </React.Fragment>
  )
}

export default App