export function speak(text){

  const msg = new SpeechSynthesisUtterance(text)

  msg.rate = 1
  msg.pitch = 1

  speechSynthesis.speak(msg)

}