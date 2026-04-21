import {useEffect,useState} from "react"
import api from "../services/api"
import AnalyticsDashboard from "../components/AnalyticsDashboard"

export default function Result(){

const[score,setScore] = useState(null)

useEffect(()=>{

async function evaluate(){

const res = await api.post("/evaluate",{

name: localStorage.getItem("name"),
email: localStorage.getItem("email"),
answer:"Interview Completed"

})

setScore(res.data)

}

evaluate()

},[])

if(!score){

return <h2>Evaluating interview...</h2>

}

return(

<div className="center">

<div className="glass">

<h2>Interview Result</h2>

<AnalyticsDashboard
confidence={score.confidence}
emotion={score.emotion}
/>

</div>

</div>

)

}