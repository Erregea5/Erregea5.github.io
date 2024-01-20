import gameObject from "./gameObject";
const canvas=document.createElement('canvas');
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
const ctx=canvas.getContext('2d');

let time=0,maxKills=0,kills=0;
let baseHealth=1;
let pause=true;
const state={onPlay:()=>{}, onPause:()=>{}, canvas, bindKeys:()=>{}, unbindKeys:()=>{}};
const enemies=[];
let bullets=[];
let player;

class bullet extends gameObject{
  constructor(x,y,scale,angle,color,speed){
    super(canvas,ctx,scale,color,speed,angle,x,y);
    this.dir={x:-Math.sin(angle),y:Math.cos(angle)};
    this.x-=this.dir.x*20;
    this.y-=this.dir.y*20;
    this.used=false;
  }
  drawPattern(){
    const cos=this.dir.x;
    const sin=this.dir.y;
    this.drawTo(.5,1,cos,sin);
    this.drawTo(.5,-1,cos,sin);
    this.drawTo(-.5,-1,cos,sin);
    this.drawTo(-.5,1,cos,sin);
    this.drawTo(.5,1,cos,sin);
  }
  update(){
    if(this.x<0||this.y<0||this.x>this.canvas.width||this.y>this.canvas.height){
      this.used=true;
      bullets.used=true;
    }
    this.x-=this.dir.x*this.speed;
    this.y-=this.dir.y*this.speed;
  }
}
class turret extends gameObject{
  constructor(x,y,scale,angle,color,speed){
    super(canvas,ctx,scale,color,speed,angle,x,y);
    this.health=1;
    this.shoot=this.moveForward=this.moveBackward=this.moveLeft=this.moveRight=0;
    this.time=0;
  }
  drawPattern(){
    const cos=Math.cos(this.angle);
    const sin=Math.sin(this.angle);
    this.drawTo(1,-1,cos,sin);
    this.drawTo(1,1,cos,sin);
    this.drawTo(-1,1,cos,sin);
    this.drawTo(-1,-1,cos,sin);
    this.drawTo(-.5,-1,cos,sin);
    this.drawTo(-.5,-2,cos,sin);
    this.drawTo(.5,-2,cos,sin);
    this.drawTo(.5,-1,cos,sin);
    this.drawTo(1,-1,cos,sin);
  }
  update(){
    if(this.shoot&&this.time>4){
      bullets.push(new bullet(this.x,this.y,5,this.angle,'red',12));
      this.time=0;
    }
    this.time++;
    let dir={
      y:this.moveForward-this.moveBackward,
      x:this.moveRight-this.moveLeft
    };
    if(dir.x===0&&dir.y===0)
      return;
    const length=Math.sqrt(dir.x**2+dir.y**2);
    dir.x/=length;
    dir.y/=length;
  
    if ( this.moveForward || this.moveBackward ) this.angle-=dir.y*this.speed/20;
    if ( this.moveLeft || this.moveRight ) this.x+=dir.x*this.speed;
    this.x=Math.min(Math.max(0,this.x),canvas.width);
  }
}

const enemyImages=[];
for(let i=0;i<2;i++){
  const enemyImage=new Image(50,50);
  enemyImage.src='/../dist/images/games/enemy'+i+'.png';
  enemyImage.loaded=false;
  enemyImage.onload=()=>enemyImage.loaded=true;
  enemyImages.push(enemyImage);
}

class enemy extends gameObject{
  constructor(scale,color,speed){
    super(canvas,ctx,scale,color,speed);
  }
  draw(){
    if(this.y>this.canvas.height){
      baseHealth-=.05;
      this.spawn();
    }
    if(this.x<0||this.y<0||this.x>this.canvas.width)
      return;
    if(enemyImages[this.idx].loaded)
      this.ctx.drawImage(enemyImages[this.idx],this.x,this.y,this.scale,this.scale);
  }
  spawn(){
    this.x=Math.random()*(canvas.width-40)+20;
    this.y=Math.random()*-500;    
    this.idx=Math.floor(Math.random()*(enemyImages.length-.1));
  }
  update(){
    if(this.idx===1)
      this.y+=this.speed;
    else{
      const dir={x:this.x-(player.x-5),y:this.y-(player.y-5)};
      const length=Math.sqrt(dir.x**2+dir.y**2);
      if(length<20){
        player.health-=.001;
        return;
      }
      
      
      dir.x/=length;
      dir.y/=length;
      this.x-=dir.x*this.speed;
      this.y-=dir.y*this.speed;

      this.angle=Math.acos(dir.y)*(dir.x>0?-1:1);
    }
    bullets.forEach(bullet=>{
      if((bullet.x-this.x)**2+(bullet.y-this.y)**2<this.scale**2){
        this.spawn();
        kills+=1;
        bullet.used=true;
        bullets.used=true;
      }
    });
  }
}


player=new turret(canvas.width/2,canvas.height-100,10,0,'red',3);
for(let i=0;i<10;i++){
  const e=new enemy(20,'white',2);
  e.spawn();
  enemies.push(e);
}

function restart(){
  maxKills=Math.max(maxKills,kills);
  bullets.length=0;
  enemies.length=10;
  enemies.forEach(enemy=>enemy.spawn());
  kills=0;
  time=0;
  player.health=1;
  player.x=canvas.width/2;
  player.angle=0;
}

function loop(){
  setTimeout(()=>{
    if(time%12000===0){
      console.log('new enemy')
      const e=new enemy(20,'white',2);
      e.spawn();
      enemies.push(e);
    }
    time+=60;
    ctx.fillStyle='black';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    player.draw();
    player.update();
    enemies.forEach(enemy=>{
      enemy.update(player,enemies);
      enemy.draw();
    });
    if(bullets.used){
      bullets.used=false;
      bullets=bullets.filter(val=>!val.used);
    }
    bullets.forEach(bullet=>{
      bullet.update(player,enemies);
      bullet.draw();
    });
    
    if(player.health<=0||baseHealth<=0)
      restart();
    
    ctx.strokeStyle='red';
    ctx.strokeText('max kills: '+maxKills,canvas.width-90,25);
    ctx.strokeText('kills '+kills,canvas.width-90,35);
    ctx.strokeText((time/1000).toFixed(1),canvas.width-90,45);
    
    ctx.strokeStyle='green';
    ctx.fillStyle='green';
    ctx.strokeText('health',50,35);
    ctx.strokeRect(90,25,100,15);
    ctx.fillRect(90,25,player.health*100,15);

    
    ctx.strokeText('base health',30,55);
    ctx.strokeRect(90,45,100,15);
    ctx.fillRect(90,45,baseHealth*100,15);
    if(pause)
      return;
    loop();
  },60);
}

state.onPlay=()=>{
  state.bindKeys(player);
  pause=false;
  loop();
};
state.onPause=()=>{
  pause=true;
  state.unbindKeys();
};
loop();
export {state};