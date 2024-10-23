import React, { useEffect } from 'react'
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import './App.less'
import { publicPath, fetchAndCache } from './utils';

let objectDetector: ObjectDetector | undefined;
async function createImageSegmenter() {

  const text = await FilesetResolver.forVisionTasks( publicPath() + "wasm");
  const buffer = await fetchAndCache( publicPath() + "efficientdet_lite2.tflite");
  objectDetector = await ObjectDetector.createFromOptions(text, {
    baseOptions: {
      delegate: navigator.gpu ? "GPU" : "CPU",
      // modelAssetPath: publicPath() + "efficientdet_lite2.tflite",
      modelAssetBuffer: new Uint8Array(buffer),
    },
    scoreThreshold: 0.5,
    runningMode: 'VIDEO'
  });
}

let speakText = 'it looks like ';
let canspeak = false;
let cachedText = '';
let isSpeaking = false;
let lastVideoTime = -1;
let running = false;
function renderLoop(): void {
  if(running === false) return;
  const video = document.getElementById("video");
  if(!video) return;
  if (video?.currentTime !== lastVideoTime) {
    const detections = objectDetector.detectForVideo(video, video.currentTime);
    // processResults(detections);
    // console.log(detections);
    drawCanvas(detections['detections']);
    lastVideoTime = video.currentTime;
  }

  requestAnimationFrame(() => {
    clearCanvas();
    renderLoop();
  });
}


function clearCanvas() {
  if(!running) return;
  const canvas = document.getElementById('output') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCanvas(boundingBoxs: any) {
  if(!running) return;
  if(boundingBoxs.length === 0) return;
  let text = '';
  let categories = {}
  const canvas = document.getElementById('output') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  for (let i = 0; i < boundingBoxs.length; i++) {
    const boundingBox = boundingBoxs[i]['boundingBox'];
    ctx.strokeRect(boundingBox['originX'], boundingBox['originY'], boundingBox['width'], boundingBox['height']);
    ctx.font = '16px Arial';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'red';
    const cagname = boundingBoxs[i]['categories'][0]['categoryName'];
    categories[cagname] = categories[cagname] ? categories[cagname] + 1 : 1;
    ctx.fillText(cagname, boundingBox['originX']+5, boundingBox['originY']+5);
  }
  for (let key in categories) {
    text += categories[key] + ' '+key+' , ';
  }
  if(!isSpeaking) {

    if(cachedText !== text){
      if(Math.floor(performance.now()) % 3 === 0){
        textToSpeech(speakText + text);
        console.log(speakText + text);
      }
      cachedText = text;
    }
  }
  ctx.stroke();
  ctx.save();
}


function textToSpeech(text) {
  if(canspeak === false) return;
  if(isSpeaking === true) return;
  return new Promise((resolve, reject) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'en';  // 设置为英文
      isSpeaking = true;
      window.speechSynthesis.speak(speech);
      speech.onend = () => {
        resolve();
        isSpeaking = false;
      }
  } else {
      alert("Text-to-Speech not supported in this browser.");
  }
  });
}


function Detection() {
  
  const [results, setResult] = React.useState([])
  const [enableSpeech, setSpeech ] = React.useState(false);
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
          renderLoop();
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
    <h4>DetectionVideo  {ready ? 'Load complete' : 'model loading'}</h4>
    <button onClick={() => setSpeech(e => {
      canspeak = !e;
      return !e;
    })}>{enableSpeech? '关闭': '开启'}语音播报</button>
    <div className='container'> 
    <video id="video" autoPlay loop muted></video>
    <canvas id="output"></canvas>
    </div>
    <div id="cs"></div>
    {results.map((r:any, i) => {
      return r['categories'].map((c: any) => {
        return <p key={i}>{c['categoryName']} {c['score']}</p>
      })
    })}
    <img  alt="" /><br /><br />
    可检测类型
    <table><thead><tr><th>类别</th><th data-spm-anchor-id="5176.28103460.0.i11.70845d27LGCze0">物品名称</th></tr></thead><tbody><tr><td><strong>人物</strong></td><td>person</td></tr><tr><td><strong>交通工具</strong></td><td>bicycle, car, motorcycle, airplane, bus, train, truck, boat</td></tr><tr><td><strong>交通设施</strong></td><td>traffic light, fire hydrant, stop sign, parking meter</td></tr><tr><td><strong>家具</strong></td><td>bench, chair, couch, bed, dining table, toilet</td></tr><tr><td><strong>动物</strong></td><td>bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe</td></tr><tr><td><strong>日常用品</strong></td><td>backpack, umbrella, handbag, tie, suitcase, frisbee, skis, snowboard, sports ball, kite, baseball bat, baseball glove, skateboard, surfboard, tennis racket</td></tr><tr><td><strong>餐具</strong></td><td data-spm-anchor-id="5176.28103460.0.i7.70845d27LGCze0">bottle, wine glass, cup, fork, knife, spoon, bowl</td></tr><tr><td><strong>食物</strong></td><td>banana, apple, sandwich, orange, broccoli, carrot, hot dog, pizza, donut, cake, potted plant</td></tr><tr><td><strong>家电</strong></td><td data-spm-anchor-id="5176.28103460.0.i5.70845d27LGCze0">tv, laptop, mouse, remote, keyboard, cell phone, microwave, oven, toaster, sink, refrigerator</td></tr><tr><td><strong>其他物品</strong></td><td data-spm-anchor-id="5176.28103460.0.i3.70845d27LGCze0">book, clock, vase, scissors, teddy bear, hair drier, toothbrush</td></tr></tbody></table>
    </>
  )
}

export default Detection