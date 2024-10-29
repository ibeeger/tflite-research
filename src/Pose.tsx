import React, { useEffect } from 'react'
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import './App.less'
import { publicPath, fetchAndCache } from './utils';

var poseLandmarker: PoseLandmarker | undefined;

async function creaetPoseMaker() {
  const vision = await FilesetResolver.forVisionTasks( publicPath() + "wasm");
  const buffer = await fetchAndCache( publicPath() + "pose_landmarker_lite.task");
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      delegate: navigator.gpu ? "GPU" : "CPU",
      // modelAssetPath: publicPath() + "efficientdet_lite2.tflite",
      modelAssetBuffer: new Uint8Array(buffer),
    },
    runningMode: 'VIDEO',
    numPoses: 2
  });
}

let lastVideoTime = -1;
let running = false;
function detectHandRaise(keypoints: any[]) {
  const nose = keypoints[0];
  const leftShoulder = keypoints[11];
  const rightShoulder = keypoints[12];
  const leftElbow = keypoints[13];
  const rightElbow = keypoints[14];
  const leftWrist = keypoints[15];
  const rightWrist = keypoints[16];


  console.log(nose, leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist);
  // 定义一些辅助函数来计算是否手举过肩膀
  function isHandRaised(wrist: any, elbow: any, shoulder: any) {
      return wrist[1] < shoulder[1] && elbow[1] < shoulder[1];
  }

  // 检测左手和右手举手状态
  let isLeftHandRaised = isHandRaised(leftWrist, leftElbow, leftShoulder);
  let isRightHandRaised = isHandRaised(rightWrist, rightElbow, rightShoulder);

  if (isLeftHandRaised && isRightHandRaised) {
      return "Both hands raised";
  } else if (isLeftHandRaised) {
      return "Left hand raised";
  } else if (isRightHandRaised) {
      return "Right hand raised";
  } else {
      return "No hands raised";
  }
}

function renderLoop(): void {
  if(running === false) return;
  const video = document.getElementById("video");
  if(!video) return;
  // console.log(video.currentTime);
  let startTs = performance.now();
  if (video?.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    poseLandmarker?.detectForVideo(video, startTs, (result) =>{
      //  console.log(result.landmarks[0][19], result.landmarks[0][20]);
      //  console.log(result.worldLandmarks, result.landmarks[0][20]);
      // renderLoop();
      // console.log(document.getElementById('cs'));

      // console.log('当前识别数量', result.landmarks?.length)
      if(result.landmarks?.length > 0){
        let hansStatus= '';
        result.landmarks.forEach((item: any, i: any) => {
          let isLeftHandRaised = item[15]['visibility']>.7 && item[19]['y'] < item[11]['y'] && item[15]['y'] < item[13]['y'];
          let isRightHandRaised = result.landmarks[0][16]['visibility']>.7 && result.landmarks[0][20]['y'] < result.landmarks[0][12]['y'] && result.landmarks[0][16]['y'] < result.landmarks[0][14]['y'];
          hansStatus += `第${i+1}个人：左手${isLeftHandRaised? '举起': '放下'}， 右手${ isRightHandRaised? '举起' : '放下' } \n`;
        })
        document.getElementById('cs').innerHTML = hansStatus;
      }
      // lastVideoTime = video.currentTime;
    });
    // processResults(detections);
    // console.log(detections);
    // drawCanvas(detections['detections']);
  }

  requestAnimationFrame(renderLoop);
}
 

function clearCanvas() {
  if(!running) return;
  const canvas = document.getElementById('output') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCanvas(boundingBoxs: any) {
  if(!running) return;
  console.log(boundingBoxs); 

  // if(boundingBoxs.length === 0) return;
}


function PoseVideo() {
  
  const [results, setResult] = React.useState([])
  const [enableSpeech, setSpeech ] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    let streamItem: any;
    creaetPoseMaker().then(() => {
      console.log("objectDetector", poseLandmarker)
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
      if (poseLandmarker){
        poseLandmarker.close();
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
    <h4>模型加载状态：  {ready ? 'Load complete' : 'model loading'}</h4>
    <div className='container'> 
    <video id="video" autoPlay loop muted style={{opacity: 1}}></video>
    <canvas id="output"></canvas>
    </div>
    <pre id="cs" style={{
      display: 'block',
      width: '100%',
      height: '300px',
    }}>
      
    </pre>
    </>
  )
}

export default PoseVideo