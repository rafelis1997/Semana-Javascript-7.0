import Controller from "./controller.js"
import Service from "./service.js"
import View from "./view.js"
import Camera from "../../../lib/shared/camera.js"
import { supportsWorkerType } from "../../../lib/shared/util.js"

async function getWorker() {
  if (supportsWorkerType()) {
    console.log("initializing esm workers!")
    const worker = new Worker(`./src/worker.js`, {type: 'module'})
    return worker
  } 
  
  console.warn("Your browser does not support esm modules on webworkers!")
  console.warn("Importing libraries ")
  await import ("https://unpkg.com/@tensorflow/tfjs-core@2.4.0/dist/tf-core.js")
  await import ("https://unpkg.com/@tensorflow/tfjs-converter@2.4.0/dist/tf-converter.js")
  await import ("https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.4.0/dist/tf-backend-webgl.js")
  await import("https://unpkg.com/@tensorflow-models/face-landmarks-detection@0.0.1/dist/face-landmarks-detection.js")
  
  console.warn("Using worker mock instead!")
  const service = new Service({
    faceLandmarksDetection: window.faceLandmarksDetection
  })

  const workerMock = {
    async postMessage(video) { 
      const {blinkedLeft, blinkedRight} = await service.handBlinked(video)
      if ((!blinkedLeft && !blinkedRight) || (blinkedLeft && blinkedRight)) return
      workerMock.onmessage({ data: { blinkedLeft, blinkedRight } })
    },
    // vai ser sobrescrito pela controller
    onmessage(msg) {}
  }

  console.log('loading tf model...')
  await service.loadModel()
  console.log('tf loaded!')

  setTimeout(() => worker.onmessage({data: 'READY'}), 1500)

  return workerMock
}

const view = new View()
const [rootPath] = window.location.href.split('/pages/')
view.setVideoSrc(`${rootPath}/assets/video.mp4`)

const worker = await getWorker()

const camera = await Camera.init()

const factory = {
  async initialize() {
    return Controller.initialize({
      view: new View(),
      camera,
      worker,
    })
  }
}

export default factory