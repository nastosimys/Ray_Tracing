#version 430

in vec3 glPosition;
out vec4 FragColor;

#define EPSILON = 0.001
#define BIG = 1000000.0

const int DIFFUSE = 1;
const int REFLECTION = 2;
const int REFRACTION = 3;
const int DIFFUSE_REFLECTION = 1;
const int MIRROR_REFLECTION = 2;

uniform vec3 color;
uniform float mirror;
uniform float refraction;

/*** DATA STRUCTURES ***/
struct SCamera
{
    vec3 Position;
    vec3 View;
    vec3 Up;
    vec3 Side;
// отношение сторон выходного изображения
    vec2 Scale;
};

struct SRay
{
    vec3 Origin;
    vec3 Direction;
};

struct SSphere
{
    vec3 Center;
    float Radius;
    int MaterialIdx;
};

struct STriangle
{
    vec3 v1;
    vec3 v2;
    vec3 v3;
    int MaterialIdx;
};

struct SIntersection
{
    float Time;
    vec3 Point;
    vec3 Normal;
    vec3 Color;
    vec4 LightCoeffs;
    float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

struct SLight
{
    vec3 Position;
};

struct SMaterial
{
    vec3 Color;
    vec4 LightCoeffs;
// 0 - non-reflection, 1 - mirror
    float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

struct STracingRay
{
    SRay ray;
    float contribution;
    int depth;
};

STriangle Triangles[28];
SSphere Spheres[2];
SLight uLight;
SMaterial Materials[9];
SCamera uCamera;

SCamera initializeDefaultCamera()
{
//** CAMERA **//
    SCamera camera;
    camera.Position = vec3(0.0, -0.5, -4.99);
    camera.View = vec3(0.0, 0.0, 1.0);
    camera.Up = vec3(0.0, 1.0, 0.0);
    camera.Side = vec3(1.8, 0.0, 0.0);
    camera.Scale = vec2(1.0);
    return camera;
} 

SRay GenerateRay(SCamera uCamera)
{ 
    vec2 coords = glPosition.xy * uCamera.Scale;
    vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;
    return SRay ( uCamera.Position, normalize(direction) );
}

void initializeDefaultScene (out STriangle triangles[28], out SSphere spheres[2])
{
    /** TRIANGLES **/
    /* left wall */
    triangles[0].v1 = vec3(-5.0,-5.0,-5.0); 
    triangles[0].v2 = vec3(-5.0, 5.0, 5.0); 
    triangles[0].v3 = vec3(-5.0, 5.0,-5.0); 
    triangles[0].MaterialIdx = 6; 
 
    triangles[1].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
    triangles[1].v3 = vec3(-5.0, 5.0, 5.0); 
    triangles[1].MaterialIdx = 6;
	
    /* front wall */
    triangles[2].v1 = vec3(-5.0, 5.0, 5.0); 
    triangles[2].v2 = vec3(-5.0,-5.0, 5.0); 
    triangles[2].v3 = vec3( 5.0,-5.0, 5.0); 
    triangles[2].MaterialIdx = 1; 
 
    triangles[3].v1 = vec3( 5.0,-5.0, 5.0);
    triangles[3].v2 = vec3( 5.0, 5.0, 5.0);
    triangles[3].v3 = vec3(-5.0, 5.0, 5.0); 
    triangles[3].MaterialIdx = 1;
	
    /* right wall */
    triangles[4].v1 = vec3( 5.0,-5.0, 5.0); 
    triangles[4].v2 = vec3( 5.0, 5.0, 5.0); 
    triangles[4].v3 = vec3( 5.0, 5.0,-5.0); 
    triangles[4].MaterialIdx = 6; 
 
    triangles[5].v1 = vec3( 5.0, 5.0,-5.0);
    triangles[5].v2 = vec3( 5.0,-5.0,-5.0);
    triangles[5].v3 = vec3( 5.0,-5.0, 5.0); 
    triangles[5].MaterialIdx = 6;
	
    /* top wall */
    triangles[6].v1 = vec3(-5.0, 5.0, 5.0); 
    triangles[6].v2 = vec3(-5.0, 5.0,-5.0); 
    triangles[6].v3 = vec3( 5.0, 5.0,-5.0); 
    triangles[6].MaterialIdx = 3; 
 
    triangles[7].v1 = vec3( 5.0, 5.0,-5.0); 
    triangles[7].v2 = vec3( 5.0, 5.0, 5.0); 
    triangles[7].v3 = vec3(-5.0, 5.0, 5.0); 
    triangles[7].MaterialIdx = 3;
 
    /* bottom wall */
    triangles[8].v1 = vec3(-5.0,-5.0, 5.0);
    triangles[8].v2 = vec3(-5.0,-5.0,-5.0);
    triangles[8].v3 = vec3( 5.0,-5.0,-5.0); 
    triangles[8].MaterialIdx = 4;
	
    triangles[9].v1 = vec3( 5.0,-5.0,-5.0);
    triangles[9].v2 = vec3( 5.0,-5.0, 5.0);
    triangles[9].v3 = vec3(-5.0,-5.0, 5.0); 
    triangles[9].MaterialIdx = 4;
	
    /* back wall */
    triangles[10].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[10].v2 = vec3( 5.0,-5.0,-5.0);
    triangles[10].v3 = vec3( 5.0, 5.0,-5.0); 
    triangles[10].MaterialIdx = 5;
	
    triangles[11].v1 = vec3( 5.0, 5.0,-5.0);
    triangles[11].v2 = vec3(-5.0, 5.0,-5.0);
    triangles[11].v3 = vec3(-5.0,-5.0,-5.0); 
    triangles[11].MaterialIdx = 5;
	
    /** SPHERES **/
    spheres[0].Center = vec3(-1.0,-1.0,-1.5);
    spheres[0].Radius = 1.5; 
    spheres[0].MaterialIdx = 6;
    spheres[1].Center = vec3( 2.0, 1.0, 2.0);
    spheres[1].Radius = 1.0;
    spheres[1].MaterialIdx = 0;

    /** CUBE **/
    /* left wall */
    triangles[12].v1 = vec3( 1.5,-2.0,-0.5); 
    triangles[12].v2 = vec3( 1.5,-1.0, 0.5); 
    triangles[12].v3 = vec3( 1.5,-1.0,-0.5); 
    triangles[12].MaterialIdx = 7; 
 
    triangles[13].v1 = vec3( 1.5,-2.0,-0.5);
    triangles[13].v2 = vec3( 1.5,-2.0, 0.5);
    triangles[13].v3 = vec3( 1.5,-1.0, 0.5); 
    triangles[13].MaterialIdx = 7;
	
    /* front wall */
    triangles[14].v1 = vec3( 1.5,-1.0, 0.5); 
    triangles[14].v2 = vec3( 1.5,-2.0, 0.5); 
    triangles[14].v3 = vec3( 2.5,-2.0, 0.5); 
    triangles[14].MaterialIdx = 7; 
 
    triangles[15].v1 = vec3( 2.5,-2.0, 0.5);
    triangles[15].v2 = vec3( 2.5,-1.0, 0.5);
    triangles[15].v3 = vec3( 1.5,-1.0, 0.5); 
    triangles[15].MaterialIdx = 7;
	
    /* right wall */
    triangles[16].v1 = vec3( 2.5,-2.0, 0.5); 
    triangles[16].v2 = vec3( 2.5,-1.0, 0.5); 
    triangles[16].v3 = vec3( 2.5,-1.0,-0.5); 
    triangles[16].MaterialIdx = 7; 
 
    triangles[17].v1 = vec3( 2.5,-1.0,-0.5);
    triangles[17].v2 = vec3( 2.5,-2.0,-0.5);
    triangles[17].v3 = vec3( 2.5,-2.0, 0.5); 
    triangles[17].MaterialIdx = 7;
	
    /* top wall */
    triangles[18].v1 = vec3( 1.5,-1.0, 0.5); 
    triangles[18].v2 = vec3( 1.5,-1.0,-0.5); 
    triangles[18].v3 = vec3( 2.5,-1.0,-0.5); 
    triangles[18].MaterialIdx = 7; 
 
    triangles[19].v1 = vec3( 2.5,-1.0,-0.5); 
    triangles[19].v2 = vec3( 2.5,-1.0, 0.5); 
    triangles[19].v3 = vec3( 1.5,-1.0, 0.5); 
    triangles[19].MaterialIdx = 7;
 
    /* bottom wall */
    triangles[20].v1 = vec3( 1.5,-2.0, 0.5);
    triangles[20].v2 = vec3( 1.5,-2.0,-0.5);
    triangles[20].v3 = vec3( 2.5,-2.0,-0.5); 
    triangles[20].MaterialIdx = 7;
	
    triangles[21].v1 = vec3( 2.5,-2.0,-0.5);
    triangles[21].v2 = vec3( 2.5,-2.0, 0.5);
    triangles[21].v3 = vec3( 1.5,-2.0, 0.5); 
    triangles[21].MaterialIdx = 7;
	
    /* back wall */
    triangles[22].v1 = vec3( 1.5,-2.0,-0.5);
    triangles[22].v2 = vec3( 2.5,-2.0,-0.5);
    triangles[22].v3 = vec3( 2.5,-1.0,-0.5); 
    triangles[22].MaterialIdx = 7;
	
    triangles[23].v1 = vec3( 2.5,-1.0,-0.5);
    triangles[23].v2 = vec3( 1.5,-1.0,-0.5);
    triangles[23].v3 = vec3( 1.5,-2.0,-0.5); 
    triangles[23].MaterialIdx = 7;

    /** TETRAHEDRON **/
    triangles[24].v1 = vec3( 1.55,-3.25,-1.3);
    triangles[24].v2 = vec3( 2.15,-3.25,-1.8);
    triangles[24].v3 = vec3( 2.75,-3.25,-1.3); 
    triangles[24].MaterialIdx = 8; //2;
	
    triangles[25].v1 = vec3( 1.55,-3.25,-1.3);
    triangles[25].v2 = vec3( 2.15,-3.25,-1.8);
    triangles[25].v3 = vec3( 2.55,-2.25,-0.55); 
    triangles[25].MaterialIdx = 8;
	
    triangles[26].v1 = vec3( 2.15,-3.25,-1.8);
    triangles[26].v2 = vec3( 2.75,-3.25,-1.3);
    triangles[26].v3 = vec3( 2.55,-2.25,-0.55); 
    triangles[26].MaterialIdx = 8;
	
    triangles[27].v1 = vec3( 1.55,-3.25,-1.3);
    triangles[27].v2 = vec3( 2.75,-3.25,-1.3);
    triangles[27].v3 = vec3( 2.55,-2.25,-0.55); 
    triangles[27].MaterialIdx = 8;
}

void initializeDefaultLightMaterials(out SLight light, out SMaterial materials[9])
{
//** LIGHT **//
    light.Position = vec3(0.0, 2.0, -4.0f);
/** MATERIALS **/
    vec4 lightCoefs = vec4(0.4,0.9,0.0,512.0);

    materials[0].Color = vec3(1.0, 1.0, 1.0);
    materials[0].LightCoeffs = vec4(lightCoefs);
    materials[0].ReflectionCoef = 0.5;
    materials[0].RefractionCoef = refraction; //1.0;
    materials[0].MaterialType = REFRACTION;

    materials[1].Color = vec3(0.0, 0.0, 1.0);
    materials[1].LightCoeffs = vec4(lightCoefs);
    materials[1].ReflectionCoef = 0.5;
    materials[1].RefractionCoef = 1.0;
    materials[1].MaterialType = DIFFUSE_REFLECTION;

    materials[2].Color = vec3(1.0, 0.0, 0.3);  
    materials[2].LightCoeffs = vec4(lightCoefs); 
    materials[2].ReflectionCoef = 0.5;  
    materials[2].RefractionCoef = 1.0;  
    materials[2].MaterialType = MIRROR_REFLECTION;

    materials[3].Color = vec3(1.0, 0.0, 1.0);  
    materials[3].LightCoeffs = vec4(lightCoefs); 
    materials[3].ReflectionCoef = 0.5;  
    materials[3].RefractionCoef = 1.0;  
    materials[3].MaterialType = DIFFUSE_REFLECTION;
	
    materials[4].Color = vec3(0.0, 1.0, 1.0);  
    materials[4].LightCoeffs = vec4(lightCoefs); 
    materials[4].ReflectionCoef = 0.5;  
    materials[4].RefractionCoef = 1.0;  
    materials[4].MaterialType = DIFFUSE_REFLECTION;
	
    materials[5].Color = vec3(1.0, 1.0, 1.0);  
    materials[5].LightCoeffs = vec4(lightCoefs); 
    materials[5].ReflectionCoef = 0.5;  
    materials[5].RefractionCoef = 1.0;  
    materials[5].MaterialType = DIFFUSE_REFLECTION;
	
    materials[6].Color = vec3(1.0, 1.0, 1.0);  
    materials[6].LightCoeffs = vec4(lightCoefs); 
    materials[6].ReflectionCoef = 0.5;  
    materials[6].RefractionCoef = 1.0;  
    materials[6].MaterialType = MIRROR_REFLECTION;
    
    materials[7].Color = color;
    materials[7].LightCoeffs = vec4(lightCoefs);
    materials[7].ReflectionCoef = 0.5;
    materials[7].RefractionCoef = 1.0;
    materials[7].MaterialType = DIFFUSE_REFLECTION;

    materials[8].Color = vec3(1.0, 0.0, 0.3);
    materials[8].LightCoeffs = vec4(lightCoefs);
    materials[8].ReflectionCoef = mirror;
    materials[8].RefractionCoef = 1.0;
    materials[8].MaterialType = MIRROR_REFLECTION;

}

bool IntersectSphere (SSphere sphere, SRay ray, float start, float final, out float time )
{
    ray.Origin -= sphere.Center;
    float A = dot ( ray.Direction, ray.Direction );
    float B = dot ( ray.Direction, ray.Origin );
    float C = dot ( ray.Origin, ray.Origin ) - sphere.Radius * sphere.Radius;
    float D = B * B - A * C;
    if ( D > 0.0 )
    {
        D = sqrt ( D );
        //time = min ( max ( 0.0, ( -B - D ) / A ), ( -B + D ) / A );
        float t1 = ( -B - D ) / A;
        float t2 = ( -B + D ) / A;
        if(t1 < 0 && t2 < 0) return false;
        if(min(t1, t2) < 0)
        {
            time = max(t1,t2);
            return true;
        }
        time = min(t1, t2);
        return true;
    }
    return false;
}

bool IntersectTriangle (SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time )
{
    time = -1;
    vec3 A = v2 - v1;
    vec3 B = v3 - v1;
    vec3 N = cross(A, B);
    float NdotRayDirection = dot(N, ray.Direction);
    if (abs(NdotRayDirection) < 0.001) return false;
    float d = dot(N, v1);
    float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;
    if (t < 0) return false;
    vec3 P = ray.Origin + t * ray.Direction;
    vec3 C;
    vec3 edge1 = v2 - v1;
    vec3 VP1 = P - v1;
    C = cross(edge1, VP1);
    if (dot(N, C) < 0) return false;
    vec3 edge2 = v3 - v2;
    vec3 VP2 = P - v2;
    C = cross(edge2, VP2);
    if (dot(N, C) < 0) return false;
    vec3 edge3 = v1 - v3;
    vec3 VP3 = P - v3;
    C = cross(edge3, VP3);
    if (dot(N, C) < 0) return false;
    time = t;
    return true;
}

bool Raytrace ( SRay ray, float start, float final, inout SIntersection intersect )
{
    bool result = false;
    float test = start;
    intersect.Time = final;
    for(int i = 0; i < 2; i++)
    {
        SSphere sphere = Spheres[i];
        if( IntersectSphere (sphere, ray, start, final, test ) && test < intersect.Time )
        {
            intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal = normalize ( intersect.Point - Spheres[i].Center );
            SMaterial mat = Materials[Spheres[i].MaterialIdx];
            intersect.Color = mat.Color;
            intersect.LightCoeffs = mat.LightCoeffs;
            intersect.ReflectionCoef = mat.ReflectionCoef;
            intersect.RefractionCoef = mat.RefractionCoef;
            intersect.MaterialType = mat.MaterialType;
            result = true;
        }
    } 
    for(int i = 0; i < 28; i++)
    {
        STriangle triangle = Triangles[i];
        if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time)
        {
            intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal = normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
            SMaterial mat = Materials[Triangles[i].MaterialIdx];
            intersect.Color = mat.Color;
            intersect.LightCoeffs = mat.LightCoeffs;
            intersect.ReflectionCoef = mat.ReflectionCoef;
            intersect.RefractionCoef = mat.RefractionCoef;
            intersect.MaterialType = mat.MaterialType;
            result = true;
        }
    }
    return result;
}

vec3 Phong ( SIntersection intersect, SLight currLight, float shadowing)
{
    vec3 light = normalize ( currLight.Position - intersect.Point );
    float diffuse = max(dot(light, intersect.Normal), 0.0);
    vec3 view = normalize(uCamera.Position - intersect.Point);
    vec3 reflected= reflect( -view, intersect.Normal );
    float specular = pow(max(dot(reflected, light), 0.0), intersect.LightCoeffs.w);
    return intersect.LightCoeffs.x * intersect.Color +
        intersect.LightCoeffs.y * diffuse * intersect.Color * shadowing +
        intersect.LightCoeffs.z * specular; 
}

float Shadow(SLight currLight, SIntersection intersect)
{
    float shadowing = 1.0;
    vec3 direction = normalize(currLight.Position - intersect.Point);
    float distanceLight = distance(currLight.Position, intersect.Point);
    SRay shadowRay = SRay(intersect.Point + direction * 0.001, direction);
    SIntersection shadowIntersect;
    shadowIntersect.Time = 1000000.0;
    if(Raytrace(shadowRay, 0, distanceLight, shadowIntersect))
    {
        shadowing = 0.0;
    }
    return shadowing;
}

STracingRay stack[100];
int stackSize = 0;

void pushRay(STracingRay Ray){
    stack[stackSize++] = Ray;
}

STracingRay popRay()
{
    stackSize--;
    return stack[stackSize];	
}

bool isEmpty()
{
    if(stackSize <= 0)
	return true;
    return false;
}

void main(void)
{
    float start = 0; 
    float final = 1000000.0;
    uCamera = initializeDefaultCamera(); 
    SRay ray = GenerateRay(uCamera);
    SIntersection intersect;
    intersect.Time = 1000000.0;
    vec3 resultColor = vec3(0,0,0);
    initializeDefaultScene(Triangles, Spheres);
    initializeDefaultLightMaterials(uLight, Materials);

    STracingRay trRay = STracingRay(ray, 1, 0);
    pushRay(trRay);
    while(!isEmpty())
    {
        STracingRay trRay = popRay();
        ray = trRay.ray;
        SIntersection intersect;
        intersect.Time = 1000000.0;
        start = 0;
        final = 1000000.0;
        if (Raytrace(ray, start, final, intersect))
        {
            switch(intersect.MaterialType)
            {
                case DIFFUSE_REFLECTION:
                {
                    float shadowing = Shadow(uLight, intersect);
                    resultColor += trRay.contribution * Phong (intersect, uLight, shadowing);
                    break;
                }
                case MIRROR_REFLECTION:
                {
                    if(intersect.ReflectionCoef < 1)
                    {
                        float contribution = trRay.contribution * (1 - intersect.ReflectionCoef);
                        float shadowing = Shadow(uLight, intersect);
                        resultColor += contribution * Phong(intersect, uLight, shadowing);
                    }
                    vec3 reflectDirection = reflect(ray.Direction, intersect.Normal);
                    float contribution = trRay.contribution * intersect.ReflectionCoef;
                    STracingRay reflectRay = STracingRay(SRay(intersect.Point + reflectDirection * 0.001, reflectDirection),
                    contribution, trRay.depth + 1);
                    pushRay(reflectRay);
                    break;
                }
                case REFRACTION:
                {
                    if(intersect.RefractionCoef <= 1)
                    {
                        float contribution = trRay.contribution * (1 - intersect.RefractionCoef);
                        float shadowing = Shadow(uLight, intersect);
                        resultColor += contribution * Phong(intersect, uLight, shadowing);
                    }
                    float ior = 1.0f/intersect.RefractionCoef;
                    if (dot(ray.Direction, intersect.Normal) >= 0){
                        intersect.Normal = -intersect.Normal;
                        ior = intersect.RefractionCoef;
                    }
                    vec3 refractDirection = refract(ray.Direction, intersect.Normal, ior);
                    float contribution = trRay.contribution * intersect.RefractionCoef;
                    STracingRay refractRay = STracingRay(SRay(intersect.Point + refractDirection * 0.001, refractDirection),
                    contribution, trRay.depth + 1);
                    pushRay(refractRay);
                    break;
                }
            }  
        }  
    }  
    FragColor = vec4 (resultColor, 1.0);
}