const EAR_THRESHOLD = 0.24;

import { prepareRunChecker } from "../../../lib/shared/util.js";

const { shouldRun } = prepareRunChecker({timerDelay: 1500})

export default class Service {
  #model = null
  #faceLandmarksDetection
  #blinkCounterRight = 0
  #blinkCounterLeft = 0
  constructor({ faceLandmarksDetection }) { 
    this.#faceLandmarksDetection = faceLandmarksDetection
  }
  async loadModel() {
    this.#model = await this.#faceLandmarksDetection.load(
      this.#faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
      { maxFaces: 1 }
    )
  }

  #getEAR(upper, lower) {
    function getEucledianDistance(x1, y1, x2, y2) {
      return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }

    return (
      (getEucledianDistance(upper[5][0], upper[5][1], lower[4][0], lower[4][1])
        + getEucledianDistance(
          upper[3][0],
          upper[3][1],
          lower[2][0],
          lower[2][1],
        ))
      / (2
        * getEucledianDistance(upper[0][0], upper[0][1], upper[8][0], upper[8][1]))
    );
  }

  async handBlinked(video) {
    const predictions = await this.#estimateFaces(video)
    if (!predictions.length) return { blinkedLeft: false, blinkedRight: false }

    for (const prediction of predictions) {
      // Right eye parameters
      const lowerRight = prediction.annotations.rightEyeUpper0;
      const upperRight = prediction.annotations.rightEyeLower0;
      const rightEAR = this.#getEAR(upperRight, lowerRight);
      // Left eye parameters
      const lowerLeft = prediction.annotations.leftEyeUpper0;
      const upperLeft = prediction.annotations.leftEyeLower0;
      const leftEAR = this.#getEAR(upperLeft, lowerLeft);

      // True if the eye is closed
      const blinkedRight = rightEAR <= EAR_THRESHOLD;
      this.#blinkCounterRight += blinkedRight
      const blinkedLeft = leftEAR <= EAR_THRESHOLD;
      this.#blinkCounterLeft += blinkedLeft

      if ((!blinkedRight && !blinkedLeft) || (blinkedRight && blinkedLeft)) {
        this.#blinkCounterRight = 0
        this.#blinkCounterLeft = 0
        continue
      }

      console.log("right", this.#blinkCounterRight)

     
      if (shouldRun()) {
        this.#blinkCounterRight = 0
        this.#blinkCounterLeft = 0
        continue
      }

      if (this.#blinkCounterRight >= 2) {
        console.log("right eye")

        this.#blinkCounterRight = 0
        return { blinkedLeft: false, blinkedRight }
      }

      if (this.#blinkCounterLeft >= 2) {
        console.log("left eye")
        this.#blinkCounterLeft = 0
        return { blinkedLeft, blinkedRight: false }
      }
      
      continue
    }
    return { blinkedLeft: false, blinkedRight: false }
  }

  #estimateFaces(video) {
    return this.#model.estimateFaces({
      input: video,
      returnTensors: false,
      flipHorizontal: true,
      predictIrises: true,
    })
  }
}