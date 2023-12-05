uniform float iTime;
varying vec2 vUv;

void main()
{
    vec2 uv = vUv*2.0-1.0;
    uv*=5.0;
    float r=length(uv)+(iTime/10.0);
    float tan_theta=uv.x/uv.y;
    
    vec3 col = .3*cos(iTime+vec3(0,2,4));
    
    float e=10.2+(iTime/1000.0);
    for(int i=0;i<3;i++)
        if(abs(tan(r+float(i))-tan_theta)*r<e)
            col+=1.0;
    
    gl_FragColor = vec4(col,1.0);
}