import {saveImages,loadImages} from '../state/fireStorage'

const canvas=document.createElement('canvas');
canvas.width=Math.round(window.screen.width*.6);
canvas.height=Math.round(window.screen.height*.6);
const ctx=canvas.getContext('2d');
ctx.fillRect(0,0,canvas.width,canvas.height);

const sidePanel=document.createElement('div');
const colorPicker=document.createElement('input');
const sizePicker=document.createElement('input');
const saveButton=document.createElement('button');
const nameInput=document.createElement('input');
const captionInput=document.createElement('input');
const key='4#ee3&g';

const state={onPlay:()=>{}, onPause:()=>{}, canvas, bindKeys:()=>{}, unbindKeys:()=>{}};
state.onSave=saveImages;

let brushSize=10;
let color='black';

const getDate=()=>{
  const date=new Date();
  return date.getFullYear()+':'+date.getUTCMonth()+':'+date.getDate();
};

const canUpLoad=()=>{
  const lastTime=localStorage.getItem(key)||0;
  console.log(lastTime,getDate());
  return getDate()!==lastTime;
};

const setupPanel=()=>{
  const text=str=>sidePanel.appendChild(document.createTextNode(str));
  const newLine=()=>sidePanel.appendChild(document.createElement('br'));
  
  text(' Brush Color: ');
  sidePanel.appendChild(colorPicker);
  newLine();newLine();
  
  text(' Brush Size: ');
  sidePanel.appendChild(sizePicker);
  newLine();newLine();
  
  text(' Painting Name: ')
  sidePanel.appendChild(nameInput);
  newLine();newLine();

  text(' Painting Caption: ')
  sidePanel.appendChild(captionInput);
  newLine();newLine();
  
  text(' Submit Your Painting For All To See! ')
  newLine();
  sidePanel.appendChild(saveButton);

  sidePanel.style.left='100%';
  sidePanel.style.width='10%';
  sidePanel.style.top='20%';
  sidePanel.style.position='absolute';

  colorPicker.type='color';
  colorPicker.value=color;
  colorPicker.oninput=()=>{
    color=colorPicker.value;
    ctx.fillStyle=color;
  };

  sizePicker.type='number';
  sizePicker.step=1;
  sizePicker.value=brushSize;
  sizePicker.oninput=()=>brushSize=sizePicker.value;

  saveButton.textContent='Submit';
  saveButton.onclick=()=>{
    // if(!canUpLoad())
    //   return alert('You already submitted something today!');
    localStorage.setItem(key,getDate());
    state.onSave(nameInput.value,canvas,captionInput.value);
  };
};

const draw=ev=>{
  const x=ev.pageX-canvas.parentElement.offsetLeft;
  const y=ev.pageY-canvas.parentElement.offsetTop;
  ctx.fillRect(x-brushSize/2,y-brushSize/2,brushSize,brushSize);
};

const setupCanvas=()=>{
  ctx.fillStyle='white';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=color;
  canvas.onmousemove=null;
  canvas.ondblclick=ev=>{
    ev.preventDefault();
    canvas.onmousemove===null?draw(ev):canvas.onmousemove=null;
  };
  canvas.onclick=ev=>{
    ev.preventDefault();
    canvas.onmousemove=canvas.onmousemove===null?draw:null;
    draw(ev);
  };
};

setupPanel();

state.onPlay=(container)=>{
  container.appendChild(sidePanel);
  setupCanvas();
};
state.onPause=()=>{
  sidePanel.remove();
  state.unbindKeys();
}
export {state};