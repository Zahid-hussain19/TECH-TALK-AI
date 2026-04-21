import React from "react"

export default function ConfidenceMeter({confidence}){

const color =
confidence > 70 ? "lime"
: confidence > 40 ? "orange"
: "red"

return(

<div style={{marginTop:"20px"}}>

<h3>Confidence</h3>

<div
style={{
width:"100%",
height:"20px",
background:"#333",
borderRadius:"10px"
}}
>

<div
style={{
width:`${confidence}%`,
height:"100%",
background:color,
borderRadius:"10px"
}}
/>

</div>

<p>{confidence}%</p>

</div>

)

}