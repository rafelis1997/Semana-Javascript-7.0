import "https://unpkg.com/@tensorflow/tfjs-core@2.4.0/dist/tf-core.js"
import "https://unpkg.com/@tensorflow/tfjs-converter@2.4.0/dist/tf-converter.js"
import "https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.4.0/dist/tf-backend-webgl.js"
import "https://unpkg.com/@tensorflow-models/face-landmarks-detection@0.0.1/dist/face-landmarks-detection.js"

import Service from "./service.js"
//no processo principal é window
//no worker é self
const {tf, faceLandmarksDetection} = self
tf.setBackend('webgl')

const service = new Service({
  faceLandmarksDetection,
})
console.log('loading tf model...')
await service.loadModel()
console.log('tf model loaded successfully!')
postMessage('READY')

onmessage = async ({ data: video }) => {
  const {blinkedLeft, blinkedRight} = await service.handBlinked(video)
  if ((!blinkedLeft && !blinkedRight) || (blinkedLeft && blinkedRight)) return
  postMessage({ blinkedLeft, blinkedRight })
}