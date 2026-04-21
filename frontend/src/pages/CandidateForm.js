import {useState} from "react"
import axios from "axios"
import {useNavigate} from "react-router-dom"

export default function CandidateForm(){

const[name,setName]=useState("")
const[email,setEmail]=useState("")
const[level,setLevel]=useState("easy")
const[file,setFile]=useState(null)

const navigate=useNavigate()

const upload=async()=>{

const allowed=["pdf","docx","png","jpg","jpeg"]

const ext=file.name.split(".").pop()

if(!allowed.includes(ext)){
alert("Only resume files allowed")
return
}

let form=new FormData()

form.append("name",name)
form.append("email",email)
form.append("level",level)
form.append("resume",file)

await axios.post("http://localhost:9000/upload",form)

navigate("/disclaimer")

}

return(

<div className="formPage">

<input placeholder="Name"
onChange={e=>setName(e.target.value)}
/>

<input placeholder="Email"
onChange={e=>setEmail(e.target.value)}
/>

<select onChange={e=>setLevel(e.target.value)}>

<option value="easy">Easy</option>
<option value="medium">Medium</option>
<option value="hard">Hard</option>

</select>

<input type="file"
onChange={e=>setFile(e.target.files[0])}
/>

<button onClick={upload}>
Upload Resume
</button>

</div>

)

}