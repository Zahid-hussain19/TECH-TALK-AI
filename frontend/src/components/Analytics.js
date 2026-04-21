import {Bar} from "react-chartjs-2"

import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
} from "chart.js"

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
Title,
Tooltip,
Legend
)

export default function Analytics({confidence,emotion}){

const data = {

labels:["Confidence","Emotion Stability"],

datasets:[
{
label:"Interview Score",
data:[confidence, emotion],
backgroundColor:["cyan","magenta"]
}
]

}

return(

<div style={{width:"400px"}}>

<h3>Interview Analytics</h3>

<Bar data={data}/>

</div>

)

}