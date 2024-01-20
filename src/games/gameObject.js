export default class gameObject{
  constructor(canvas,ctx,scale,color,speed,angle,x,y){
    this.canvas=canvas;
    this.ctx=ctx;
    this.angle=angle||0;
    this.scale=scale||1;
    this.speed=speed||0;
    this.color=color||'red';
    this.x=x||0;
    this.y=y||0;
  }
  drawTo(x,y,cos,sin){
    this.ctx.lineTo(
      this.x+this.scale*(x*cos-y*sin),
      this.y+this.scale*(y*cos+x*sin)
    );
  }
  drawPattern(){
    const cos=Math.cos(this.angle);
    const sin=Math.sin(this.angle);
    this.drawTo(0,-2,cos,sin);
    this.drawTo(-1,1,cos,sin);
    this.drawTo(0,0,cos,sin);
    this.drawTo(1,1,cos,sin);
    this.drawTo(0,-2,cos,sin);
  }
  draw(){
    if(this.x<0||this.y<0||this.x>this.canvas.width||this.y>this.canvas.height)
        return;
    this.ctx.fillStyle=this.color;
    this.ctx.beginPath();
    this.ctx.moveTo(this.x,this.y);
    this.drawPattern();
    this.ctx.closePath();
    this.ctx.fill();
  }
}