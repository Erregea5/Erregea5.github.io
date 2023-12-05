uniform float iTime;
varying float dy;
varying vec3 norm;

void main()
{
    vec3 col=vec3(0,1,1);
    col.g-=dy;
    
    gl_FragColor = vec4(col,.4);
}