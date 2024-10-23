import React, { useEffect } from 'react'
import { TextEmbedder, FilesetResolver } from "@mediapipe/tasks-text";
import { publicPath } from './utils';

let textEmbedder: TextEmbedder | undefined;
async function createImageSegmenter() {
  const text = await FilesetResolver.forTextTasks( publicPath() + "wasm");

  textEmbedder = await TextEmbedder.createFromOptions(text, {
    baseOptions: {
      delegate: "CPU",
      modelAssetPath:  publicPath() + "universal_sentence_encoder.tflite",
    },
    quantize: true
  });
}


function Detection() {

  const [result, setResult] = React.useState('');
  const enter = async (e) => {
    if(e.key !== "Enter") return;
    const input = document.getElementById("input")
    if(!input) return;
    const textData = input?.value.trim();
    const embeddings = textEmbedder.embed(textData);
    let res = embeddings['embeddings'][0]['quantizedEmbedding']?.join(',')
    console.log(res);
    setResult('\nembeddings:\n'+ res);
  }

  useEffect(() => {
    createImageSegmenter().then(() => {
      console.log('TextEmbedder is ready');
      document.getElementById("input")?.addEventListener("keydown", enter)
    });
    return () => {
      document.getElementById("input")?.removeEventListener("keydown", enter)
      textEmbedder?.close()
    }
  }, [])

  return (
    <>
    <div>TextEmbedding</div>
    <input type="text" id="input" />
    {result}
    </>
  )
}

export default Detection