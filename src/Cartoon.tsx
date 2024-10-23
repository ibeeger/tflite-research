import React, { useEffect } from 'react'
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import './App.less'
import { publicPath, fetchAndCache } from './utils';

let objectDetector: ObjectDetector | undefined;
async function createImageSegmenter() {

  const text = await FilesetResolver.forVisionTasks(publicPath()+"wasm");
  const buffer = await fetchAndCache(publicPath()+"efficientdet_lite2.tflite");
  objectDetector = await ObjectDetector.createFromOptions(text, {
    baseOptions: {
      delegate: navigator.gpu ? "GPU" : "CPU",
      // modelAssetPath: publicPath()+"efficientdet_lite2.tflite",
      modelAssetBuffer: new Uint8Array(buffer),
    },
    scoreThreshold: 0.5,
    runningMode: 'IMAGE'
  });
}


function compressImage(image: HTMLImageElement, maxWidth: number): any {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let width = image.width;
  let height = image.height;
  canvas.id = 'd_canvas';
  if (width > maxWidth) {
    height = height * maxWidth / width;
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(image, 0, 0, width, height);

  return canvas;
}


function drawCanvas(canvas: any, boundingBoxs: any) {
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  for (let i = 0; i < boundingBoxs.length; i++) {
    const boundingBox = boundingBoxs[i]['boundingBox'];
    ctx.strokeRect(boundingBox['originX'], boundingBox['originY'], boundingBox['width'], boundingBox['height']);
    ctx.font = '16px Arial';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'red';
    ctx.fillText(boundingBoxs[i]['categories'][0]['categoryName'], boundingBox['originX']+5, boundingBox['originY']+5);
  }
  ctx.stroke();
  ctx.save();
}

function Detection() {
  
  const [results, setResult] = React.useState([])

  useEffect(() => {
    createImageSegmenter().then(() => {
      console.log("objectDetector", objectDetector)
      document.getElementById('file')?.addEventListener('change', async (e) => {
        const img = document.querySelector('img') as HTMLImageElement;
        var nimg = document.createElement('img');
        img.onload = () => {
          var canvas = compressImage(img as any, 300);
           canvas.toBlob((blob:any) => {
            const nurl = URL.createObjectURL(blob);
            nimg.setAttribute('src', nurl)
            nimg.onload = () => {
              document.body.appendChild(nimg);
              const res = objectDetector.detect(nimg as any)
              console.log(res)
              if(res['detections'].length){
                drawCanvas(canvas, res['detections'])
                setResult(res['detections'] as any)
                document.getElementById('cs')?.appendChild(canvas)
              }else{
                setResult([])
              }
            }
          });
        }
        img?.setAttribute('src', URL.createObjectURL((e.target as HTMLInputElement).files![0]))
      })
    })

    return () => {
      if(objectDetector){
        objectDetector.close()
      }
    }
  }, [])

  return (
    <>
    <div>Detection</div>
    <input type="file" id="file" /><br />
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