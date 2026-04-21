export function calculateConfidence(answer){

  const words = answer.split(" ").length

  return Math.min(100,words*5)

}