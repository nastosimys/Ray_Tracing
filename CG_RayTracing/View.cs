using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using OpenTK;
using OpenTK.Graphics.OpenGL;

namespace CG_RayTracing
{
    class View
    {
        private static int BasicProgramID;
        public static Vector3 Color;
        public static float Mirror = 0.0f;
        public static float Refraction;
        public static void loadShader(String filename, ShaderType type, int program, out int address)
        {
            address = GL.CreateShader(type);
            using (System.IO.StreamReader sr = new StreamReader(filename))
            {
                GL.ShaderSource(address, sr.ReadToEnd());
            }
            GL.CompileShader(address);
            GL.AttachShader(program, address);
            Console.WriteLine(GL.GetShaderInfoLog(address));
        }

        public static void InitShaders()
        {
            int BasicVertexShader;
            int BasicFragmentShader;
            BasicProgramID = GL.CreateProgram(); // создание объекта программы 
            loadShader("..\\..\\raytracing.vert", ShaderType.VertexShader, BasicProgramID,
            out BasicVertexShader);
            loadShader("..\\..\\raytracing.frag", ShaderType.FragmentShader, BasicProgramID,
            out BasicFragmentShader);
            GL.LinkProgram(BasicProgramID);
            // Проверяем успех компоновки
            int status = 0;
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out status);
            Console.WriteLine(GL.GetProgramInfoLog(BasicProgramID));
        }

        public static void Draw()
        {
            int vbo_position;

            ////int attribute_vpos = GL.GetAttribLocation(BasicProgramID, "vPosition");
            //int uniform_pos = GL.GetUniformLocation(BasicProgramID, "cam_pos");
            //int uniform_aspect = GL.GetUniformLocation(BasicProgramID, "glPosition");
            //double aspect = 0.0;
            //Vector3 campos = new Vector3(1, 1, 0);

            Vector3[] vertdata = new Vector3[]
            {
                new Vector3(-1f, -1f, 0f),
                new Vector3( 1f, -1f, 0f),
                new Vector3( 1f, 1f, 0f), 
                new Vector3(-1f, 1f, 0f)
            };
            GL.GenBuffers(1, out vbo_position);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vbo_position);
            GL.BufferData<Vector3>(BufferTarget.ArrayBuffer, (IntPtr)(vertdata.Length *
             Vector3.SizeInBytes), vertdata, BufferUsageHint.StaticDraw);
            int attribute_vpos = 0;
            GL.VertexAttribPointer(attribute_vpos, 3, VertexAttribPointerType.Float, false, 0, 0);
            GL.UseProgram(BasicProgramID);
            //GL.Uniform3(uniform_pos, campos);
            //GL.Uniform1(uniform_aspect, aspect);
            GL.Uniform3(GL.GetUniformLocation(BasicProgramID, "color"), Color);
            GL.Uniform1(GL.GetUniformLocation(BasicProgramID, "mirror"), Mirror);
            GL.Uniform1(GL.GetUniformLocation(BasicProgramID, "refraction"), Refraction);
            GL.EnableVertexAttribArray(attribute_vpos);
            GL.DrawArrays(BeginMode.Quads, 0, 4);
            GL.BindBuffer(BufferTarget.ArrayBuffer, 0);
        }
    }
}

