import { Vector3,Vector2 } from "three";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera,renderer,controls;
const y=.6,e=.5,
  bigBound={lo:new Vector3(-1.867,.6,-19.35),hi:new Vector3(5.5,.6,8.898)},
  smallBound={lo:new Vector3(-1.867,.6,-7.5),hi:new Vector3(15.5,.6,-2.9)},
  player={moveForward:0,moveBackward:0,moveLeft:0,moveRight:0},
  velocity=new Vector3(0,0,0),
  direction=new Vector2(0,0);

function init(button,_renderer,_camera,games){
  renderer=_renderer;
  camera=_camera;
  controls=new PointerLockControls(camera,renderer.domElement);
  const bindKeys=player=>{
      window.onkeydown=ev=>{
          if(ev.key=='e') button.click();
          if(ev.key=='q') {
              if(controls.isLocked)controls.unlock();
              else controls.lock();
          }
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
function move(delta){
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  direction.y = player.moveForward-player.moveBackward;
  direction.x = player.moveRight-player.moveLeft;
  direction.normalize();

  if ( player.moveForward || player.moveBackward ) velocity.z -= direction.y * 40.0 * delta;
  if ( player.moveLeft || player.moveRight ) velocity.x -= direction.x * 40.0 * delta;

  controls.moveRight( - velocity.x * delta );
  controls.moveForward( - velocity.z * delta );
}
function keepInBounds(pos){
    if(Math.abs(pos.y-10)<e){
        pos.y=10;
        camera.health-=1;
        return;
    }
    // pos=new Vector3();
    const upperBound=new Vector3();
    upperBound.copy(bigBound.hi);
    const lowerBound=new Vector3();
    lowerBound.copy(bigBound.lo);

    if((pos.z<smallBound.hi.z+e)&&(pos.z>smallBound.lo.z-e)){
        upperBound.copy(smallBound.hi);
        if(pos.x>=bigBound.hi.x)
            lowerBound.copy(smallBound.lo);
        else
            upperBound.setZ(bigBound.hi.z);
    }
    
    pos.clamp(lowerBound,upperBound);
}
function manageHealth(){
    if(camera.health==0){
        camera.position.set(0,0,0);
        camera.health=100;
    }
}

export {init,move,keepInBounds,manageHealth,player};