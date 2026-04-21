import React,{useEffect,useRef} from "react"

function VideoPanel({videoRef}){

const localRef = useRef()

useEffect(()=>{

async function start(){

const stream = await navigator.mediaDevices.getUserMedia({
video:true
})

localRef.current.srcObject = stream

if(videoRef){
videoRef.current = localRef.current
}

}

start()

},[])

return(

<div className="video-panel">

<video
ref={localRef}
autoPlay
muted
width="240"
/>

</div>

)

}

export default VideoPanel