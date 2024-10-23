import React, { useEffect } from 'react'
import { LlmInference, FilesetResolver } from "@mediapipe/tasks-genai";
import { publicPath, fetchAndCache } from './utils';
let genText: LlmInference;
async function createImageSegmenter() {
  const text = await FilesetResolver.forGenAiTasks(publicPath()+"wasm");
  const buffer = await fetchAndCache(publicPath()+"gemma-2b-it-gpu-int4.bin");
  genText = await LlmInference.createFromOptions(text, {
    baseOptions: {
      delegate: "GPU",
      // modelAssetPath: publicPath()+"gemma-2b-it-gpu-int4.bin",
      modelAssetBuffer: new Uint8Array(buffer),
    },
    maxTokens: 512,
    temperature: 0.5,
  });
}

function Gen() {

  const displayPartialResults = (partialResults: any, complete:any) => {
    const output = document.querySelector('section');
      output.textContent += partialResults;
      if (complete) {
        if (!output.textContent) {
          output.textContent = 'Result is empty';
        }
        submit.disabled = false;
      }
  }

  useEffect(() => {
    const submit = document.getElementById('submit');
    const input = document.getElementById('input');
    const result = document.querySelector('section');

    createImageSegmenter().then(() => {
      
      submit?.addEventListener('click', async () => {
        const textData = input?.value.trim();
        submit.disabled = true;
        result.textContent = '';
        genText.generateResponse(textData, displayPartialResults);
      })

    })


    return () => {
      genText.close()
    }
  }, [])




  return (
    <>
    <div>Gen</div>
    <input type="text" id="input" /> <button id='submit'>提交</button>
    <section>

    </section>
    </>
  )
}

export default Gen