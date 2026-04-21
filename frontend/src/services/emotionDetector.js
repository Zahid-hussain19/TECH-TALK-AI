import * as faceapi from "face-api.js"

export async function loadModels(){

await faceapi.nets.tinyFaceDetector.loadFromUri("/models")
await faceapi.nets.faceExpressionNet.loadFromUri("/models")

}

export async function detectEmotion(video){

const result = await faceapi
.detectSingleFace(video,new faceapi.TinyFaceDetectorOptions())
.withFaceExpressions()

if(!result) return null

return result.expressions

}