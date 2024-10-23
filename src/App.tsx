import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";
import React, { useEffect } from "react";
import "./App.less";
import { publicPath, fetchAndCache } from "./utils";
var runningMode = "VIDEO";
let imageSegmenter: ImageSegmenter | undefined;
async function createImageSegmenter() {
  const buffer = await fetchAndCache(publicPath() + "deeplab_v3.tflite");
  const vision = await FilesetResolver.forVisionTasks( publicPath() + "wasm");
  imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      delegate: navigator.gpu ? "GPU" : "CPU",
      // modelAssetPath:  publicPath() + "deeplab_v3.tflite?version=1",
      modelAssetBuffer: new Uint8Array(buffer),
    },
    outputCategoryMask: true,
    outputConfidenceMasks: true,
    runningMode: runningMode,
  });
}

// const worker = new Worker(publicPath() + "/worker.js?" + Date.now());
let lastWebcamTime = -1;
var video: HTMLVideoElement;
var webcamRunning = true;
var canvasCtx: any = null;
var textOffsetX = 0;
var textOffsetY = 200;
var enableSegmentation = false;
var videourl = "";
// var videourl = '//localhost/video/selft_person.mov?'+Date.now();

const App = () => {
  const [enable, setEnableSegmentation] = React.useState(enableSegmentation);
  const [ready, setReady] = React.useState(false);
  const callbackForVideo = (result: any) => {
    if(canvasCtx === null) return;
    let imageData = canvasCtx.getImageData(
      0,
      0,
      video.videoWidth,
      video.videoHeight
    ).data;
    const mask: Number[] = result.categoryMask.getAsFloat32Array();
    let j = 0;
    for (let i = 0; i < mask.length; ++i) {
      let mk = mask[i] * 255;
      if (mk > 1) {
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
  };

  const predictWebcam = async () => {
    const canvas = document.getElementById("output") as HTMLCanvasElement;
    if(!canvas) return;
    canvasCtx = canvas.getContext("2d");
    if (video.currentTime === lastWebcamTime) {
      if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
      }
      return;
    }
    lastWebcamTime = video.currentTime;
    if (enableSegmentation) {
      canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvasCtx.font = "48px serif";
    canvasCtx.fillStyle = "red";
    if (textOffsetX > video.videoWidth) {
      textOffsetX = -200;
      textOffsetY = Math.random() * video.videoHeight;
    }
    textOffsetX += 4;
    canvasCtx.fillText("Hello, World!", textOffsetX, textOffsetY);
    if (imageSegmenter === undefined) {
      return;
    }
    // Do not segmented if imageSegmenter hasn't loaded
    let startTimeMs = performance.now();
    // Start segmenting the stream.
    if (enableSegmentation) {
      imageSegmenter.segmentForVideo(video, startTimeMs, callbackForVideo);
    } else {
      if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
      }
    }
  };

  useEffect(() => {
    let streamItem;
    if (videourl) {
      createImageSegmenter().then(() => {
        setReady(true);
        video = document.getElementById("video") as HTMLVideoElement;
        const canvas = document.getElementById("output") as HTMLCanvasElement;
        video.crossOrigin = "anonymous";
        video.addEventListener("loadeddata", (e) => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          video.width = video.videoWidth;
          video.height = video.videoHeight;
          predictWebcam();
        });
        video.src = videourl;
      });
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: {
          width: 640,
          height: 480,
        } })
        .then(async (stream) => {
          webcamRunning = true;
          streamItem = stream;
          await createImageSegmenter();
          setReady(true);

          video = document.getElementById("video") as HTMLVideoElement;
          // const canvas = document.getElementById("output").transferControlToOffscreen();
          video.addEventListener("loadeddata", predictWebcam);
          // worker.postMessage({canvas, rendererName: '2d'}, [canvas]);
          if (video != null) {
            video.srcObject = stream;
          }
        });
    }
    return () => {
      webcamRunning = false;
      if (imageSegmenter) {
        imageSegmenter.close();
      }
      video.removeEventListener("loadeddata", predictWebcam);
      if(streamItem){
        streamItem.getTracks().forEach((track:any) => {
          track.stop();
        });
      }
    }
  }, []);

  return (
    <React.Fragment>
      <h1>Image Segmentation {ready ? 'Load complete' : 'model loading'}</h1>
      <div className="container">
        <video id="video" width="640" height="480" loop muted autoPlay></video>
        <canvas id="output" width="640" height="480"></canvas>
      </div>
      enable:{enableSegmentation}
      <button
        onClick={() => {
          enableSegmentation = !enableSegmentation;
          setEnableSegmentation((e) => !e);
        }}
      >
        {enableSegmentation ? "已开启" : "开启分离"}
      </button>
    </React.Fragment>
  );
};

export default App;
