import React from 'react'
import * as tfTFLite from '@tensorflow/tfjs-tflite';



async function loadModel() {
  const tfliteModel = await tfTFLite.loadTFLiteModel(
    'path/to/your/model/tts_model.tflite'
  );
  return tfliteModel;
}

function TextToSpeech() {
  return (
    <>
      <h4>TextToSpeech</h4>
      <input type="text" id="input-text" />
      <button id="synthesize-button">TextToSpeech</button>
    </>
  )
}

export default TextToSpeech