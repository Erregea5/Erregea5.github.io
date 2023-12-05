uniform float iTime;
varying vec2 vUv;

float f(float x){
    if(x>0.0) return x;
    return 1000.0;
}

void main()
{
    vec2 uv = vUv*2.0-1.0;
    uv*=10.0;
    float r=length(uv);
    float tan_theta=uv.x/uv.y;

    float n=-20.0;
    float m=f(sin(2.0*iTime)/2.0-(sin(iTime)+1.0))/.299*n;
    if(m<n/2.0)m=n-m;
    
    vec3 col = vec3(0);
    
    float e=.1;
    
    //eye
    if(r-2.0<e)
        col+=vec3(.5,1.0,1.0);
        
    if(r-.2<e)
        col+=1.0;
    
    if(abs(r-1.0)<e/2.0)
        col+=1.0;
     
    vec2[] centers=vec2[](vec2(0.0,sqrt(.5)),vec2(.5,-.5),vec2(-.5,-.5));
    for(int i=0;i<3;i++){
        if(distance(uv,centers[i]*1.35)-.1<e)
            col+=1.0;
    }
    //lids
    float x=-(uv.x/5.0)*(uv.x/5.0)-n/4.0;
    
    if((x-uv.y)<e||(-x-uv.y)>e)
        col+=1.0;

    if((-m/n*4.0+1.0)*x-uv.y<e)
        col+=1.0;

    gl_FragColor = vec4(1.0-col,1.0);
}