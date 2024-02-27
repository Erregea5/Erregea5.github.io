import { Vector3,Vector2,Raycaster } from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import TouchControls from "./TouchControls/TouchControls";

let camera,renderer,moveControls,rotateControls;
const y=.6,e=.5,
  bigBound={lo:new Vector3(-1.867,.6,-19.35),hi:new Vector3(5.5,.6,8.898)},
  smallBound={lo:new Vector3(-1.867,.6,-7.5),hi:new Vector3(15.5,.6,-2.9)},
  player={moveForward:0,moveBackward:0,moveLeft:0,moveRight:0},
  velocity=new Vector3(0,0,0),
  direction=new Vector2(0,0);

function init(button,_renderer,_camera,hitTestObjects,games){
  renderer=_renderer;
  camera=_camera;
  moveControls=new TouchControls(document.body,camera,{
    delta:.75,
    moveSpeed: .15,
    rotationSpeed: .002,
    maxPitch: 55,
    hitTest: true,
    hitTestDistance: .5,
    hitTestObjects
  });
  moveControls.setPosition(1,1,0)
  rotateControls=new PointerLockControls(moveControls.fpsBody,renderer.domElement);
  camera.isLocked=()=>rotateControls.isLocked;
  camera.lock=()=>rotateControls.lock();
  camera.unlock=()=>rotateControls.unlock();

  const bindKeys=player=>{
    if(window.hasTouchPadDevice)
      return;
    player.moveForward=0;
    player.moveBackward=0;
    player.moveLeft=0;
    player.moveRight=0;
    window.onkeydown=ev=>{
      if(games.paused){
        if(ev.key==button.textContent) {
          camera.unlock();
          button.click();
        }
        if(ev.key=='q') {
          if(camera.isLocked())camera.unlock();
          else camera.lock();
        }
      }
      else if(ev.key=='Escape')
        button.click();
      
      switch ( ev.code ) {
        case 'ArrowUp':
        case 'KeyW':
          player.moveForward = 1;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          player.moveLeft = 1;
          break;
        case 'ArrowDown':
        case 'KeyS':
          player.moveBackward = 1;
          break;
        case 'ArrowRight':
        case 'KeyD':
          player.moveRight = 1;
          break;
      }
    };
    window.onkeyup=ev=> {
      switch ( ev.code ) {
        case 'ArrowUp':
        case 'KeyW':
          player.moveForward = 0;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          player.moveLeft = 0;
          break;
        case 'ArrowDown':
        case 'KeyS':
          player.moveBackward = 0;
          break;
        case 'ArrowRight':
        case 'KeyD':
          player.moveRight = 0;
          break;
      }
    };
  };
  bindKeys(player);
  for(let game in games)
    if(game!=='paused')
      games[game].bindKeys=bindKeys;
}
function update(delta){
  moveControls.update();
  keepInBounds(camera.position)
  manageHealth(camera.position);
}
function keepInBounds(pos){
  if(Math.abs(pos.y-10)<e){
    pos.y=10;
    return;
  }
  pos.y=1.7;
}
function manageHealth(pos){
    if(camera.health==0){
        camera.position.set(0,0,0);
        camera.health=100;
    }
    if(Math.abs(pos.y-10)<e){
      pos.y=10;
    }
}

export {init,update,player};