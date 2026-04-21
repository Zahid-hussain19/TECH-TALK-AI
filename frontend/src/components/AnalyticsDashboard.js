import Analytics from "./Analytics"
import ConfidenceMeter from "./ConfidenceMeter"

export default function AnalyticsDashboard({
confidence,
emotion
}){

return(

<div className="dashboard">

<h2>Interview Analytics</h2>

<ConfidenceMeter confidence={confidence}/>

<Analytics
confidence={confidence}
emotion={emotion}
/>

</div>

)

}