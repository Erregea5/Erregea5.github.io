uniform float iTime;
varying vec2 vUv;

void main()
{
    vec2 uv = vUv*2.0-1.0;
    uv=uv*2.0-1.0;

    vec2[] luv=vec2[](
        vec2(1.0,1.5),
        vec2(2.0,2.5),
        vec2(.4,2.0),
        vec2(1.3,.7)
    );
    vec3 col=vec3(0.0);
    int isIn=0;
    for(int i=0;i<4;i++){
        vec2 nuv=uv;
        nuv.x-=sin(iTime*luv[i].x);
        nuv.y-=cos(iTime*luv[i].y);
        nuv*=5.0;

        if(abs(fract(iTime)-fract(length(nuv)))<.05)
            isIn+=1;
    }
    if(isIn>0)
        col = 0.5 + 0.5*cos(iTime*float(isIn)+uv.xyx/5.0+vec3(0,2,4));
    else
        col = 0.4 + 0.4*cos(iTime/2.0+uv.yxx/5.0+vec3(1,3,5));
    
    gl_FragColor = vec4(col,1.0);
}