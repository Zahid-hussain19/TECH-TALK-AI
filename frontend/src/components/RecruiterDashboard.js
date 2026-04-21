import {useEffect,useState} from "react"

export default function RecruiterDashboard(){

const[candidates,setCandidates] = useState([])

useEffect(()=>{

const data = JSON.parse(
localStorage.getItem("candidateScores")
) || []

setCandidates(data)

},[])

return(

<div className="dashboard">

<h2>Recruiter Dashboard</h2>

<table>

<thead>

<tr>
<th>Name</th>
<th>Confidence</th>
<th>Emotion</th>
</tr>

</thead>

<tbody>

{candidates.map((c,i)=>(

<tr key={i}>
<td>{c.name}</td>
<td>{c.confidence}</td>
<td>{c.emotion}</td>
</tr>

))}

</tbody>

</table>

</div>

)

}