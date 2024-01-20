import { paintingState } from "./setPaintings";
import { CanvasTexture } from "three";
import {state as dodgeGame} from './games/dodge';
import {state as shootGame} from './games/shoot';

const captionDiv=document.createElement('div');
captionDiv.className='no-caption';
document.body.appendChild(captionDiv);
const caption={
    top:document.createElement('div'),
    bottom:document.createElement('div'),
    link:document.createElement('a'),
};
for(let e in caption)
    captionDiv.appendChild(caption[e]);
const button=document.createElement('button');
button.textContent='E';
button.className='action';

const games={dodgeGame,shootGame,paused:true};
const canvases={};
const gameScreen=document.createElement('div');
gameScreen.style={position:'absolute',top:'10%',left:'20%',width:'60%',height:'80%'};
document.body.appendChild(gameScreen);
const actions={
  none:null,
  drink:()=>{console.log('drink');camera.health-=10;},
  walkThrough:()=>{console.log('walk');camera.position.y=10;}
};
const actionList=[];
for(let game in games){
  if(game==='paused')
    continue;
  canvases[game]=new CanvasTexture(games[game].canvas);
  actions[game]=()=>{
    games.paused=!games.paused;
    if(games.paused){
      games[game].canvas.remove();
      games[game].onPause();
      console.log('paused');
    }
    else{
      gameScreen.appendChild(games[game].canvas);
      games[game].onPlay();
      console.log('unpaused');
    }
  };
}
for(let action in actions)
  actionList.push(action);

const none={top:'',bottom:'',link:'',href:''};
const curText={...none};
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
  const {text,action}=getClosestText(camera);
  let k=true,c=0;
  for(let t in text){
      if(t==='hasButton')
          continue;
      if(text[t]!=curText[t])
          k=false;
      if(text[t]==='')
          c++;
  }

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