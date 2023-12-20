const canvas=document.createElement('canvas');
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
//document.body.appendChild(canvas);
const key='Qw?5a$';
const ctx=canvas.getContext('2d');

const enemies=[];
const spawnRadius=75000;

let minSide=Math.min(canvas.width,canvas.height);
const explosionImage=new Image(50,50);
explosionImage.src='images/explosion.png';

let explosionLoaded=false;
explosionImage.onload=()=>explosionLoaded=true;
let level=1,kills=0;
let maxScore=localStorage.getItem(key)||1;
let time=0;
let pause=true;
let onPlay=()=>{};
const onPause=()=>{
    pause=true;
};

const explosions={};
function explode(x,y){
    explosions[[x,y]]=100;
    kills++;
}
function drawExplosion([x,y]){
    if(explosions[[x,y]]--<0){
        delete explosions[[x,y]];
        console.log('del')
    }
    else if(explosionLoaded)
        ctx.drawImage(explosionImage,x-minSide/20,y-minSide/20,minSide/20,minSide/20);
}

class ship{
    constructor(scale,color,speed){
        this.angle=0;
        this.scale=scale;
        this.speed=speed;
        this.color=color;
    }
    drawTo(x,y,cos,sin){
        ctx.lineTo(
            this.x+this.scale*(x*cos-y*sin),
            this.y+this.scale*(y*cos+x*sin)
        );
    }
    draw(){
        if(this.x<0||this.y<0||this.x>canvas.width||this.y>canvas.height)
            return;
        ctx.fillStyle=this.color;
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        const cos=Math.cos(this.angle);
        const sin=Math.sin(this.angle);
        this.drawTo(0,-2,cos,sin);
        this.drawTo(-1,1,cos,sin);
        this.drawTo(0,0,cos,sin);
        this.drawTo(1,1,cos,sin);
        this.drawTo(0,-2,cos,sin);
        ctx.closePath();
        ctx.fill();
    }
    spawn(player){
        for(let i=0;i<1;i++){
            this.x=Math.random()*canvas.width*1.25;
            this.y=Math.random()*canvas.height*1.25;
            if(((this.x-player.x)**2+(this.y-player.y)**2)<=spawnRadius)
                i--;
        }
    }
    update(player,enemies){
        for(let enemy of enemies){
            if(this===enemy) break;
            const dir={x:this.x-enemy.x,y:this.y-enemy.y};
            const length=dir.x**2+dir.y**2;
            if(length<400){
                explode((this.x+enemy.x)/2,(this.y+enemy.y)/2)
                this.spawn(player);
                enemy.spawn(player);
            }
        }
        const dir={x:this.x-player.x,y:this.y-player.y};
        const length=Math.sqrt(dir.x**2+dir.y**2);
        if(length<20){
            explode(this.x,this.y);
            this.spawn(player);
            player.hit();
        }
        
            
        dir.x/=length;
        dir.y/=length;
        this.x-=dir.x*this.speed;
        this.y-=dir.y*this.speed;

        this.angle=Math.acos(dir.y)*(dir.x>0?-1:1);
    }
}

const player=new ship(minSide*.02,'green',4);
player.spawn=function(){
    this.x=canvas.width*.5;
    this.y=canvas.height*.5;
    this.moveForward=this.moveBackward=this.moveLeft=this.moveRight=0;
}
player.setup=function(){
    this.spawn();
    canvas.onkeydown=ev=>{
        if(ev.key=='q') {
            if(pause)
                onPlay();
            else
                onPause();
        }
        switch ( ev.code ) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = 1;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = 1;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = 1;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = 1;
                break;
        }
    };
    canvas.onkeyup=ev=> {
        switch ( ev.code ) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = 0;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = 0;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = 0;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = 0;
                break;
        }
    };
};
player.move=function(){
    let dir={
        y:this.moveForward-this.moveBackward,
        x:this.moveRight-this.moveLeft
    };
    if(dir.x===0&&dir.y===0)
        return;
    const length=Math.sqrt(dir.x**2+dir.y**2);
    dir.x/=length;
    dir.y/=length;

    if ( this.moveForward || this.moveBackward ) this.y-=dir.y*this.speed;
    if ( this.moveLeft || this.moveRight ) this.x+=dir.x*this.speed;
    this.y=Math.min(Math.max(0,this.y),canvas.height);
    this.x=Math.min(Math.max(0,this.x),canvas.width);
    //console.log(player)
    this.angle=Math.acos(dir.y)*(dir.x<0?-1:1);
};
player.hit=function(){
    console.log('died')
    time=0;
    this.setup();
    enemies.forEach(val=>val.spawn(player));
    let score=level*25+kills*2;
    if(score>maxScore){
        maxScore=score;
        localStorage.setItem(key,score);
    }
    while(level>1){
        level--;
        enemies.pop();
    }
    kills=0;
};
function levelUp(){
    time=0;
    level++;
    let ds=0;
    if(level%5==0) ds=.05;
    enemies.push(new ship(minSide*.015,'red',3+ds));
    player.spawn();
    for(let enemy of enemies)
        enemy.spawn(player);
}

enemies.setup=function(){
    for(let i=0;i<6;i++){
        const newEnemy=new ship(minSide*.015,'red',3);
        newEnemy.spawn(player);
        this.push(newEnemy);
    }
}

player.setup();
enemies.setup();

function loop(){
    setTimeout(()=>{
        if(time>20000)
            levelUp();
        time+=60;
        ctx.fillStyle='black';
        ctx.fillRect(0,0,canvas.width,canvas.height);

        player.draw();
        player.move();
        enemies.forEach(enemy=>{
            enemy.update(player,enemies);
            enemy.draw();
        });
        for(let boom in explosions)
            drawExplosion(boom.split(',').map(val=>parseFloat(val)));
        
        ctx.strokeStyle='red';
        ctx.strokeText('max score: '+maxScore,canvas.width-90,25);
        ctx.strokeText('level '+level,canvas.width-90,35);
        ctx.strokeText((time/1000).toFixed(1),canvas.width-90,45);
        if(pause)
            return;
        loop();
    },60);
}
// window.onresize=()=>{
//     canvas.width=window.innerWidth;
//     canvas.height=window.innerHeight;
//     minSide=Math.min(canvas.width,canvas.height);
//     player.scale=minSide*.02;
//     enemies.forEach(enemy=>enemy.scale=minSide*.015);
//     if(pause)
//         loop();
// }
onPlay=()=>{
    pause=false;
    loop();
};
loop();
export {onPlay, onPause, canvas};