import React from "react"
import { motion } from "framer-motion"

function AiOrb({speaking}){

return(

<motion.div
animate={{
scale: speaking ? [1,1.2,1] : 1
}}
transition={{
duration:1,
repeat: speaking ? Infinity : 0
}}
style={{
width:140,
height:140,
borderRadius:"50%",
background:"radial-gradient(circle,#6366f1,#312e81)",
display:"flex",
alignItems:"center",
justifyContent:"center",
margin:"auto"
}}
>

<div style={{
width:60,
height:60,
borderRadius:"50%",
background:"white"
}}/>

</motion.div>

)

}

export default AiOrb