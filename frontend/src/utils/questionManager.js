let questions=[]
let index=0

export function setQuestions(q){
questions=q
index=0
}

export function currentQuestion(){
return questions[index]
}

export function nextQuestion(){

if(index < questions.length-1){
index++
}

return questions[index]

}