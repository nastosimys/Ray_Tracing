using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using OpenTK;
using OpenTK.Graphics.OpenGL;

namespace CG_RayTracing
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void glControl1_Load(object sender, EventArgs e)
        {
            View.InitShaders();
        }

        private void glControl1_Paint(object sender, PaintEventArgs e)
        {
            View.Draw();
            glControl1.SwapBuffers();
        }

        private void trackBar1_Scroll(object sender, EventArgs e)
        {
            View.Color.X = trackBar1.Value/10f;
            glControl1.Invalidate();
        }

        private void trackBar2_Scroll(object sender, EventArgs e)
        {
            View.Color.Y = trackBar2.Value/10f;
            glControl1.Invalidate();
        }

        private void trackBar3_Scroll(object sender, EventArgs e)
        {
            View.Color.Z = trackBar3.Value/10f;
            glControl1.Invalidate();
        }

        private void trackBar4_Scroll(object sender, EventArgs e)
        {
           View.Mirror = trackBar4.Value/10f;
           glControl1.Invalidate();
        }

        private void trackBar5_Scroll(object sender, EventArgs e)
        {
            View.Refraction = trackBar5.Value/10f;
            glControl1.Invalidate();
        }
    }
}
