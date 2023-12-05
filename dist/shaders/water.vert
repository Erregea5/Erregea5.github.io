uniform float iTime;
varying float dy;
varying vec3 norm;

void main(){
    dy=0.1;
    norm=normal;
    for(int i=1;i<10;i++){
        float fi=5.0*float(i);
        dy+=(1.0/fi)*sin(fi*(sin(uv.x+iTime/10.0)+uv.y)+iTime);
    }
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    mvPosition.y+=dy;
	gl_Position = projectionMatrix * mvPosition;
}