let timer

export function detectPanic(callback){

  clearTimeout(timer)

  timer = setTimeout(()=>{

    callback()

  },40000)

}