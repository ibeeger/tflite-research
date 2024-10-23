

export const publicPath = () => {
  console.log('NODE_ENV', process.env.NODE_ENV)
  if(process.env.NODE_ENV === 'development'){
    return '/'
  }
  return '/ai/'
}


/*
 * fetch and cache model
 */
export const fetchAndCache = async  (model_path:string) => {
  const url = `${model_path}`;
  try {
      const cache = await caches.open("tflite_model_cache");
      let cachedResponse = await cache.match(url);
      if (cachedResponse == undefined) {
          await cache.add(url);
          cachedResponse = await cache.match(url);
          console.log(`${model_path} (network)`);
      } else {
          console.log(`${model_path} (cached)`);
      }
      const data = await cachedResponse.arrayBuffer();
      return data;
  } catch (error) {
      console.log(`${model_path} (network)`);
      return await fetch(url).then(response => response.arrayBuffer());
  }
}
