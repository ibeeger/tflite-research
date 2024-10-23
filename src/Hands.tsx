import React, { useEffect } from 'react'
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";
import './App.less'
import { publicPath, fetchAndCache } from './utils';

let objectDetector: GestureRecognizer | undefined;
async function createImageSegmenter() {

  const text = await FilesetResolver.forVisionTasks( publicPath() + "wasm");
  const buffer = await fetchAndCache( publicPath() + "gesture_recognizer.task");
  objectDetector = await GestureRecognizer.createFromOptions(text, {
    baseOptions: {
      delegate: navigator.gpu ? "GPU" : "CPU",
      // modelAssetPath: publicPath() + "efficientdet_lite2.tflite",
      modelAssetBuffer: new Uint8Array(buffer),
    },
    runningMode: 'VIDEO'
  });
}

let speakText = 'it looks like ';
let canspeak = false;
let cachedText = '';
let isSpeaking = false;
let lastVideoTime = -1;
let running = false;

function renderLoop(setState): void {
  if(running === false) return;
  const video = document.getElementById("video");
  if(!video) return;
  if (video?.currentTime !== lastVideoTime) {
    const detections = objectDetector.recognizeForVideo(video, video.currentTime);
    // processResults(detections);
    if(detections['handedness'].length > 0){
      console.log(detections);
      setState(detections);
    }
    lastVideoTime = video.currentTime;
  }

  setTimeout(() => {
    renderLoop(setState);
  }, 1000 / 25);
}


function Hands() {
  
  const [results, setResult] = React.useState([])
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    let streamItem: any;
    createImageSegmenter().then(() => {
      console.log("objectDetector", objectDetector)
      setReady(true);
      navigator.mediaDevices.getUserMedia({ video: {
        facingMode: 'environment',
        width: 400,
        height: 300
      } }).then((stream) => {
        streamItem = stream;
        const video = document.getElementById('video') as HTMLVideoElement;
        const canvas = document.getElementById('output') as HTMLCanvasElement;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          running = true;
          renderLoop(setResult);
        }
      })
    })
    return () => {
      running = false;
      if (objectDetector){
        objectDetector.close();
      }
      if(streamItem){
        streamItem.getTracks().forEach((track:any) => {
          track.stop();
        });
      }
    }
  }, [])

  return (
    <>
    <h4>Detect Gestures   {ready ? 'Load complete' : 'model loading'}</h4>
    <div className='container'> 
    <video id="video" autoPlay loop muted></video>
    <canvas id="output"></canvas>
    </div>
    {results['gestures']?.map((c:any, i) => {
        return c.map((d:any, j) => {
          if(d['categoryName'] === 'None') return null;
          return <p key={i}>{d['categoryName']} {d['score']}</p>
        })
    })}
    <img  alt="" /><br /><br />
    </>
  )
}

export default Hands