
import { useEffect,useState } from "react"
import { Card,CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

export default function MosqueDisplay(){

const mosqueName="Masjid As-Sunnah"
const city="Sydney"
const country="Australia"

const backgroundImage="https://wallpapercave.com/wp/wp4666645.jpg"

const iqamaOffsets={
Fajr:30,
Dhuhr:15,
Asr:20,
Maghrib:5,
Isha:10
}

const arabicNames={
Fajr:"الفجر",
Shuruq:"الشروق",
Dhuhr:"الظهر",
Jumah:"الجمعة",
Asr:"العصر",
Maghrib:"المغرب",
Isha:"العشاء"
}

const messages=[
"O children of Adam, take your adornment at every mosque — Qur’an 7:31",
"In houses which Allah has ordered to be raised and that His name be remembered therein — Qur’an 24:36",
"The most beloved places to Allah are the mosques — Sahih Muslim",
"Prayer in congregation is 27 times more rewarding than prayer alone — Sahih al-Bukhari, Sahih Muslim",
"Whoever builds a mosque for Allah, Allah will build for him a house in Paradise — Sahih al-Bukhari, Sahih Muslim",
"Give glad tidings of complete light on the Day of Resurrection to those who walk to the mosques in the darkness — Sunan Abu Dawud"
]

const [time,setTime]=useState(new Date())
const [prayers,setPrayers]=useState(null)
const [currentPrayer,setCurrentPrayer]=useState("")
const [nextPrayer,setNextPrayer]=useState("")
const [countdown,setCountdown]=useState("")
const [countdownLabel,setCountdownLabel]=useState("Begins In")
const [progress,setProgress]=useState(0)
const [iqamaScreen,setIqamaScreen]=useState(false)
const [iqamaActive,setIqamaActive]=useState(false)
const [hijriDate,setHijriDate]=useState("")
const [messageIndex,setMessageIndex]=useState(0)
const [shift,setShift]=useState({x:0,y:0})

useEffect(()=>{
const timer=setInterval(()=>setTime(new Date()),1000)
return()=>clearInterval(timer)
},[])
useEffect(()=>{

let wakeLock=null

async function enableWakeLock(){

try{
wakeLock=await navigator.wakeLock.request("screen")
}catch(err){
console.log("Wake lock not supported",err)
}

}

enableWakeLock()

document.addEventListener("visibilitychange",()=>{
if(document.visibilityState==="visible"){
enableWakeLock()
}
})

},[])
useEffect(()=>{
const rot=setInterval(()=>{
setMessageIndex(i=>(i+1)%messages.length)
},15000)
return()=>clearInterval(rot)
},[])

useEffect(()=>{
const move=setInterval(()=>{
const x=(Math.random()*8)-4
const y=(Math.random()*8)-4
setShift({x,y})
},240000)
return()=>clearInterval(move)
},[])

async function loadPrayerTimes(){

try{

const res=await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=2`)
const data=await res.json()

const t=data.data.timings

const times={
Fajr:t.Fajr,
Shuruq:t.Sunrise,
Dhuhr:t.Dhuhr,
Asr:t.Asr,
Maghrib:t.Maghrib,
Isha:t.Isha
}

localStorage.setItem("prayerTimes",JSON.stringify(times))
setPrayers(times)

const hijri=data.data.date.hijri
setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year} AH`)

}catch{

const cached=localStorage.getItem("prayerTimes")
if(cached){
setPrayers(JSON.parse(cached))
}

}

}

useEffect(()=>{loadPrayerTimes()},[])

useEffect(()=>{
const check=setInterval(()=>{
const now=new Date()
if(now.getHours()===0 && now.getMinutes()===1){
loadPrayerTimes()
}
},60000)
return()=>clearInterval(check)
},[])

function format12(timeStr){

const [h,m]=timeStr.split(":")
const d=new Date()
d.setHours(parseInt(h))
d.setMinutes(parseInt(m))

return d.toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit",hour12:true})

}

/* detect jumah mode */

function isJumahMode(){

const now=new Date()

const day=now.getDay()
const hour=now.getHours()

if(day===4 && hour>=18) return true
if(day===5 && hour<15) return true

return false

}

/* prayer calculations */

useEffect(()=>{

if(!prayers)return

const now=new Date()

let displayPrayers={...prayers}

if(isJumahMode()){
displayPrayers.Dhuhr="13:15"
}

const entries=Object.entries(displayPrayers).map(([name,value])=>{

const [h,m]=value.split(":")

const d=new Date()
d.setHours(parseInt(h))
d.setMinutes(parseInt(m))
d.setSeconds(0)

return {name,time:d}

})

let next=null
let nextIndex=0

for(let i=0;i<entries.length;i++){

if(entries[i].time>now){
next=entries[i]
nextIndex=i
break
}

}

if(!next){
next=entries[0]
nextIndex=0
}

const previous=(nextIndex===0)?entries[entries.length-1]:entries[nextIndex-1]

setNextPrayer(next.name)
setCurrentPrayer(previous.name)

const athanTime=previous.time

let iqamaTime=new Date(athanTime)

if(previous.name==="Dhuhr" && !isJumahMode()){

iqamaTime=new Date()
iqamaTime.setHours(13)
iqamaTime.setMinutes(30)

}
else if(iqamaOffsets[previous.name]){

iqamaTime.setMinutes(iqamaTime.getMinutes()+iqamaOffsets[previous.name])

}

/* jumah has no iqama */

if(previous.name==="Dhuhr" && isJumahMode()){

const diff=next.time-now
const minutes=Math.floor(diff/60000)
setCountdownLabel("Begins In")
setCountdown(`${minutes}m`)
setIqamaActive(false)

}

else if(now>=athanTime && now<iqamaTime){

setCountdownLabel("Iqama In")

const diff=iqamaTime-now

if(diff<60000){

const sec=Math.floor(diff/1000)
setCountdown(`${sec}s`)

}else{

const min=Math.floor(diff/60000)
const sec=Math.floor((diff%60000)/1000)
setCountdown(`${min}m ${sec}s`)

}

setIqamaActive(true)

}

else if(now>=iqamaTime && now-iqamaTime<60000){

if(!iqamaScreen){

setIqamaScreen(true)
setTimeout(()=>setIqamaScreen(false),60000)

}

setIqamaActive(false)

}

else{

const diff=next.time-now

const mins=Math.floor(diff/60000)
const hrs=Math.floor(mins/60)

setCountdownLabel("Begins In")
setCountdown(`${hrs}h ${mins%60}m`)
setIqamaActive(false)

}

const prevTime=previous.time.getTime()
const nextTime=next.time.getTime()
const nowTime=now.getTime()

const percent=((nowTime-prevTime)/(nextTime-prevTime))*100
setProgress(Math.max(0,Math.min(100,percent)))

},[time,prayers])

const formattedTime=time.toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true})

const gregorianDate=time.toLocaleDateString("en-AU",{weekday:"long",year:"numeric",month:"long",day:"numeric"})

let announcement=iqamaActive
?"Please silence your phone"
:messages[messageIndex]

function enterFullscreen(){
const elem=document.documentElement

if(elem.requestFullscreen){
elem.requestFullscreen()
}
else if(elem.webkitRequestFullscreen){
elem.webkitRequestFullscreen()
}
else if(elem.msRequestFullscreen){
elem.msRequestFullscreen()
}
}

return(

<div
onClick={enterFullscreen}
className="min-h-screen w-full relative text-white flex items-center justify-center overflow-hidden font-[Inter] cursor-pointer"
>

{iqamaScreen&&(
<div className="absolute inset-0 bg-black flex items-center justify-center z-50">
<div className="text-8xl font-bold text-emerald-300">IQAMA</div>
</div>
)}

<motion.div
className="absolute inset-0 bg-cover bg-center"
style={{backgroundImage:`url(${backgroundImage})`}}
animate={{scale:1.08}}
transition={{duration:120,repeat:Infinity,repeatType:"reverse"}}
/>

<div className="absolute inset-0 bg-black/50 z-0"/>

<div className="relative z-10 backdrop-blur-xl bg-white/15 border border-white/20 rounded-[40px] p-14 w-full max-w-[1600px]">
<div style={{transform:`translate(${shift.x}px,${shift.y}px)`}}></div>

<div className="flex justify-between mb-10">

<div>
<h1 className="text-5xl">{mosqueName}</h1>
<div className="text-emerald-400">Sydney • Australia</div>
</div>

<div className="text-5xl">{formattedTime}</div>

<div className="text-right">
<div>{gregorianDate}</div>
<div className="text-emerald-400">{hijriDate}</div>
</div>

</div>

<div className="grid grid-cols-3 gap-8 mb-6">

<Card className="bg-white/15 rounded-3xl border border-white/20">
<CardContent className="p-8 text-center">
<div>Current Prayer</div>
<div className="text-3xl">{currentPrayer}</div>
</CardContent>
</Card>

<Card className="bg-white/15 rounded-3xl border border-white/20">
<CardContent className="p-8 text-center">
<div>Next Prayer</div>
<div className="text-3xl">{nextPrayer}</div>
</CardContent>
</Card>

<Card className="bg-white/15 rounded-3xl border border-white/20">
<CardContent className="p-8 text-center">
<div>{countdownLabel}</div>
<div className="text-3xl">{countdown}</div>
</CardContent>
</Card>

</div>

<div className="w-full h-4 rounded-full bg-white/10 overflow-hidden mb-10">

<motion.div
className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-400 to-emerald-400 opacity-50 backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.4)]"
style={{width:`${progress}%`}}
/>

</div>

{prayers&&(

<div className="grid grid-cols-6 gap-6">

{Object.entries(prayers).map(([name,t])=>{

const highlight=name===currentPrayer

let displayName=name
if(name==="Dhuhr" && isJumahMode()) displayName="Jumah"

return(

<Card
key={name}
className={`rounded-3xl border transition-all duration-700 ${
highlight
?"bg-white/25 border-emerald-400/40 shadow-md shadow-emerald-500/20"
:"bg-white/15 border-white/20"
}`}
>

<CardContent className="p-8 text-center">

<div className="text-lg font-medium">{displayName}</div>
<div className="text-sm opacity-70">{arabicNames[displayName]}</div>
<div className="text-4xl font-semibold opacity-80">{format12(t)}</div>

{name !== "Shuruq" && (
<div className="text-lg mt-2">

<div>Iqama</div>
<div className="opacity-70">الإقامة</div>

<div>
{format12(

name==="Dhuhr" && !isJumahMode()
? "13:30"
:
new Date(
new Date().setHours(
parseInt(t.split(":")[0]),
parseInt(t.split(":")[1]) + (iqamaOffsets[name] || 0)
)
).toTimeString().slice(0,5)

)}
</div>

</div>
)}

</CardContent>

</Card>

)

})}

</div>

)}

<div className="mt-12 text-center text-xl opacity-50">
{announcement}
</div>

</div>

</div>

)

}