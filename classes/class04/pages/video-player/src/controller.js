

export default class Controller {
  #view
  #worker
  #blinkLeftCounter = 0;
  #blinkRightCounter = 0;
  #camera
  constructor({ view, worker, camera, videoUrl }) {
    this.#view = view
    this.#camera = camera
    this.#worker = this.#configureWorker(worker)

    this.#view.configureOnBtnClick(this.onBtnStart.bind(this))
    this.#view.setVideoSrc(videoUrl)
  }

  static async initialize(deps) {
    const controller = new Controller(deps)
    controller.log('not yet detected eye blink! click in the button to start')
    return controller.init()

  }
  
  #configureWorker(worker) {
    let ready = false
    worker.onmessage = ({data}) => {
      if ('READY' === data) {
        console.log('worker is ready!')
        this.#view.enableButton()
        ready = true
        return;
      }

      const blinkedRight = data.blinkedRight
      const blinkedLeft = data.blinkedLeft
      this.#blinkRightCounter += blinkedRight
      this.#blinkLeftCounter += blinkedLeft
      this.#view.togglePlayPause({right:blinkedRight, left:blinkedLeft})
      console.log(blinkedLeft ? 'blinked left'+ blinkedLeft : 'blinked right'+ blinkedRight)
    }

    return {
      send(msg) {
        if (!ready) return
        worker.postMessage(msg)
      }
    }
  }

  async init() {
    console.log('init!!')
  }

  loop() {
    const video = this.#camera.video
    const img = this.#view.getVideoFrame(video)
    this.#worker.send(img)
    this.log('detecting eye blink...')

    setTimeout(() => this.loop(), 100)
  }

  log(text) {
    const timesRight = `        - blink time: ${this.#blinkRightCounter}`
    const timesLeft = `        - blink time: ${this.#blinkRightCounter}`
    this.#view.log(`status: ${text}`.concat(this.#blinkRightCounter ? timesRight : ""))
  }

  onBtnStart() {
    this.log('initializing detection...')
    this.#blinkLeftCounter = 0;
    this.#blinkRightCounter = 0;
    this.loop()
  }
}