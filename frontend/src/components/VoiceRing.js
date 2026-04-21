import {useRef,useEffect} from "react"

export default function VoiceRing(){

const ringRef = useRef()

useEffect(()=>{

navigator.mediaDevices.getUserMedia({audio:true})
.then(stream=>{

const ctx = new AudioContext()

const analyser = ctx.createAnalyser()

const source = ctx.createMediaStreamSource(stream)

source.connect(analyser)

const dataArray = new Uint8Array(analyser.frequencyBinCount)

function animate(){

analyser.getByteFrequencyData(dataArray)

const volume = dataArray.reduce((a,b)=>a+b)/dataArray.length

ringRef.current.style.transform =
`scale(${1 + volume/300})`

requestAnimationFrame(animate)

}

animate()

})

},[])

return(
<div className="voice-ring" ref={ringRef}></div>
)

}