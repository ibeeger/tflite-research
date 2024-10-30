import React, { useEffect } from 'react'
import './cartoon.css'
declare global {
  interface Window {
    tflite: any;
    tf: any;
  }
}


var gmodel : any = null;
async function loadModel(){
  const model = await window.tflite.loadTFLiteModel("./cartoon_v3.tflite");
  setupTrigger(model);
  // console.log(model)
  gmodel = model;
}

function Cartoon() {

  const onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = function(e:any) {
              // const img = document.getElementById('selectedImage') as HTMLImageElement;
              // img.src = e.target.result;
              // img.classList.remove('hide');
              let img = new Image();
              img.onload = function() {
                cartoonize(gmodel, img);
              }
              img.src = e.target.result;
              
          };
          reader.readAsDataURL(file);
      }
  }

  useEffect(() => {
    loadModel().then(model => {
      console.log(model)
    })
  }, [])
  return (
    <div>
      <input type="file"  onChange={onchange} accept="image/*" />
      <img id="selectedImage" src="https://storage.googleapis.com/tfweb/demos/cartoonizer/cat.jpg" alt="cat" />
      <canvas className="hide"></canvas>
      <div className="trigger">Loading...</div>
    </div>
  )
}


async function cartoonize(tfliteModel: any, img: any = null) {
  // Prepare the input tensors from the image.
  const dom = img ?? document.querySelector("img") as HTMLImageElement;
  const inputTensor = window.tf.image
      // Resize.
      .resizeBilinear(window.tf.browser.fromPixels(dom), [
          224,
          224
      ])
      // Normalize.
      .expandDims()
      .div(127.5)
      .sub(1);

  // Run the inference and get the output tensors.
  const outputTensor = tfliteModel.predict(inputTensor);

  // Process and draw the result on the canvas.
  //
  // De-normalize.
  const data = outputTensor.add(1).mul(127.5);
  // Convert from RGB to RGBA, and create and return ImageData.
  const rgb = Array.from(data.dataSync());
  const rgba: any = [];
  for (let i = 0; i < rgb.length / 3; i++) {
      for (let c = 0; c < 3; c++) {
          rgba.push(rgb[i * 3 + c]);
      }
      rgba.push(255);
  }

  console.log(rgba.length, inputTensor)
  // Draw on canvas.
  const imageData = new ImageData(Uint8ClampedArray.from(rgba), 224, 224);
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  const ctx: any = canvas.getContext("2d");
  var cs = document.createElement('canvas');
  cs.width = 224;
  cs.height = 224;
  const ctx2: any = cs.getContext("2d");
  ctx2.putImageData(imageData, 0, 0);
  document.body.appendChild(cs);
  canvas.width = 1024;
  canvas.height = 1024;
  canvas.style.width="512px"
  canvas.style.height="512px"
  ctx.drawImage(
    cs,  // Source image data
    0, 0, 224, 224,                                         // Source size (224x224)
    0, 0, 1024, 1024
  );
  canvas.classList.remove("hide");
}


function setupTrigger(tfliteModel:any) {
  const trigger: any = document.querySelector(".trigger");
  trigger.textContent = "Cartoonize!";
  trigger.addEventListener("click", () => {
      trigger.textContent = "Processing...";
      setTimeout(() => {
          cartoonize(tfliteModel);
          trigger.classList.add("hide");
      });
  });
}

export default Cartoon