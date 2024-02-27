import { paintingState } from "./setPaintings";
import { CanvasTexture } from "three";
import {state as dodgeGame} from './games/dodge';
import {state as shootGame} from './games/shoot';
import {state as diyArt} from "./games/DIYArt";
import {state as solarSystem} from "./games/solarSystem";

const games={
  dodgeGame,
  shootGame,
  diyArt,
  solarSystem,
  paused:true
};

const captionDiv=document.createElement('div');
captionDiv.className='no-caption';
document.body.appendChild(captionDiv);
const caption={
    top:document.createElement('div'),
    bottom:document.createElement('div'),
    link:document.createElement('a'),
};
caption.link.target='_blank'
for(let e in caption)
    captionDiv.appendChild(caption[e]);
const button=document.createElement('button');
button.textContent='Enter';
button.className='action';

const canvases={};
const gameScreen=document.createElement('div');
const screenBorder=document.createElement('div');

gameScreen.style.position='absolute';
gameScreen.style.top=Math.round(.1*window.screen.height)+'px';
gameScreen.style.left=Math.round(.2*window.screen.width)+'px';
gameScreen.style.width=Math.round(.6*window.screen.width)+'px';
gameScreen.style.height=Math.round(.6*window.screen.height)+'px';
gameScreen.style.zIndex=3;

screenBorder.style.position='absolute';
screenBorder.style.top=Math.round(.05*window.screen.height)+'px';
screenBorder.style.left=Math.round(.1*window.screen.width)+'px';
screenBorder.style.width=Math.round(.8*window.screen.width)+'px';
screenBorder.style.height=Math.round(.7*window.screen.height)+'px';
screenBorder.style.backgroundColor='grey';
screenBorder.style.zIndex=2;


const actions={
  none:null,
  drink:()=>{console.log('drink');camera.health-=10;},
  walkThrough:()=>{console.log('walk');camera.position.y=10;}
};

document.body.appendChild(gameScreen);
for(let game in games){
  if(game==='paused')
    continue;
  console.log(game+' canvas: ',games[game].canvas)
  canvases[game]=new CanvasTexture(games[game].canvas);
  
  actions[game]=()=>{
    games.paused=!games.paused;
    if(games.paused){
      screenBorder.remove();
      games[game].canvas.remove();
      games[game].onPause();
      console.log('paused');
    }
    else{
      games[game].canvas.width=gameScreen.offsetWidth;
      games[game].canvas.height=gameScreen.offsetHeight;
      gameScreen.appendChild(games[game].canvas);
      document.body.appendChild(screenBorder);
      games[game].onPlay(gameScreen);
      console.log('unpaused');
    }
  };
}

const actionList=[];
for(let action in actions)
  actionList.push(action);

const none={top:'',bottom:'',link:'',href:''};
const curText={...none};
const lookText={...none};
lookText.top='press Q to look around';
lookText.bottom='use WASD or Arrows to move'
const distanceToPaintings=20;

const getClosestText=camera=>{
  let text=none;
  let action=null;
  for(let painting in paintingState.objects){
      if(paintingState.objects[painting].position)
      if(paintingState.objects[painting].position.distanceToSquared(camera.position)<=distanceToPaintings){
          text=paintingState.objects[painting].text;
          action=actions[paintingState.objects[painting].action];
          break;
      }
  }
  return {text,action};
}

function renderText(camera){
  if(window.hasTouchPadDevice)
    return;
  if(!games.paused)
    return;
  let text,action;
  // if(!camera.isLocked()){
  //   text={...none};
  //   text.top='press Q to look around';
  //   action=undefined;
  // }
  // else{
    ({text,action}=getClosestText(camera));
  // }
  
  let c=0;
  for(let t in text)
    if(text[t]==='')
        c++;

  if(text==none||c==4)
    if(!camera.isLocked()){
      text=lookText;
      action=undefined;
      c=1;
      //captionDiv.className='caption';
    }
  
  let k=true
  for(let t in text)
    if(text[t]!=curText[t])
      k=false;

  if(k)return;

  if(text==none||c===4)
      captionDiv.className='no-caption';
  else
      captionDiv.className='caption';

  for(let t in caption){
      if(t==='hasButton')
          continue;
      caption[t].textContent=text[t];
      curText[t]=text[t]
  }
  if(text.href!='')
      caption.link.href=text.href;

  if(action){
      if(!caption.hasButton){
          caption.hasButton=true;
          caption.top.appendChild(button);
      }
      button.onclick=action;
  }
  else if(caption.hasButton){
      caption.hasButton=false;
      button.remove();
      button.onclick=()=>{console.log('hi')};
  }
}

export {renderText,actionList,button,canvases,games};