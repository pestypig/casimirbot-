#if UNITY_EDITOR
using System;
using System.IO;
using System.Reflection;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace CasimirBot
{
    [Serializable]
    public class HullRenderSolve
    {
        public float beta = 0f;
        public float alpha = 1f;
        public float sigma = 6f;
        public float R = 1f;
        public string chart = "comoving_cartesian";
    }

    [Serializable]
    public class HullRenderRequest
    {
        public int width = 1280;
        public int height = 720;
        public string skyboxMode = "off";
        public HullRenderSolve solve = new HullRenderSolve();
    }

    public static class HullRenderBridge
    {
        public static void RenderFromCli()
        {
            try
            {
                var requestPath = ReadArg("-cbRequest");
                var outputPath = ReadArg("-cbOutput");
                var scenePath = ReadArg("-cbScene") ?? "Assets/Scenes/CornellBox2.unity";

                if (string.IsNullOrWhiteSpace(requestPath))
                {
                    throw new InvalidOperationException("Missing -cbRequest <path>");
                }

                if (string.IsNullOrWhiteSpace(outputPath))
                {
                    throw new InvalidOperationException("Missing -cbOutput <path>");
                }

                if (File.Exists(scenePath))
                {
                    EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                }

                var requestJson = File.ReadAllText(requestPath);
                var request = JsonUtility.FromJson<HullRenderRequest>(requestJson) ?? new HullRenderRequest();
                request.width = Mathf.Clamp(request.width, 320, 4096);
                request.height = Mathf.Clamp(request.height, 180, 4096);

                ConfigureRayTracer(request);
                RenderToPng(request, outputPath);
                Debug.Log("[HullRenderBridge] Render completed: " + outputPath);
                EditorApplication.Exit(0);
            }
            catch (Exception ex)
            {
                Debug.LogError("[HullRenderBridge] Render failed: " + ex.Message);
                Debug.LogError(ex.ToString());
                EditorApplication.Exit(3);
            }
        }

        private static string ReadArg(string key)
        {
            var args = Environment.GetCommandLineArgs();
            for (var i = 0; i < args.Length - 1; i++)
            {
                if (string.Equals(args[i], key, StringComparison.OrdinalIgnoreCase))
                {
                    return args[i + 1];
                }
            }
            return null;
        }

        private static void ConfigureRayTracer(HullRenderRequest request)
        {
            var manager = UnityEngine.Object.FindObjectOfType(Type.GetType("RayTracingManager"));
            if (manager == null)
            {
                return;
            }

            SetField(manager, "rayTracingEnabled", true);
            SetField(manager, "accumulate", false);
            SetField(manager, "useSky", request.skyboxMode != "off");
            SetField(manager, "maxBounceCount", Mathf.Clamp(2 + Mathf.RoundToInt(Mathf.Abs(request.solve.beta) * 12f), 2, 12));
            SetField(manager, "numRaysPerPixel", Mathf.Clamp(Mathf.RoundToInt(2f + request.solve.sigma), 1, 16));
            SetField(manager, "defocusStrength", 0f);
            SetField(manager, "divergeStrength", Mathf.Clamp(0.2f + Mathf.Abs(request.solve.beta) * 0.3f, 0.1f, 2f));
            SetField(manager, "focusDistance", Mathf.Clamp(request.solve.R * 2f, 0.25f, 30f));
            SetField(manager, "standardPathTracingRange", 0f);
            SetField(manager, "directLightSamplingRange", 0f);
            SetField(manager, "sunIntensity", 8f + Mathf.Abs(request.solve.beta) * 10f);
            SetField(manager, "sunFocus", 320f + request.solve.alpha * 220f);
        }

        private static void SetField(object target, string name, object value)
        {
            var type = target.GetType();
            var field = type.GetField(name, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            if (field != null)
            {
                field.SetValue(target, value);
            }
        }

        private static void RenderToPng(HullRenderRequest request, string outputPath)
        {
            var camera = Camera.main;
            if (camera == null)
            {
                var firstCamera = UnityEngine.Object.FindObjectOfType<Camera>();
                if (firstCamera != null)
                {
                    camera = firstCamera;
                }
            }
            if (camera == null)
            {
                var go = new GameObject("HullRenderBridgeCamera");
                camera = go.AddComponent<Camera>();
                camera.transform.position = new Vector3(0f, 1.25f, -4.2f);
                camera.transform.LookAt(Vector3.zero);
                camera.clearFlags = CameraClearFlags.SolidColor;
                camera.backgroundColor = Color.black;
            }

            var renderTexture = new RenderTexture(request.width, request.height, 24, RenderTextureFormat.ARGB32);
            var previousActive = RenderTexture.active;
            var previousTarget = camera.targetTexture;

            camera.targetTexture = renderTexture;
            camera.Render();
            RenderTexture.active = renderTexture;

            var texture = new Texture2D(request.width, request.height, TextureFormat.RGBA32, false, false);
            texture.ReadPixels(new Rect(0, 0, request.width, request.height), 0, 0, false);
            texture.Apply(false, false);

            var png = texture.EncodeToPNG();
            if (png == null || png.Length == 0)
            {
                throw new InvalidOperationException("Rendered PNG was empty.");
            }

            var outputDir = Path.GetDirectoryName(outputPath);
            if (!string.IsNullOrWhiteSpace(outputDir))
            {
                Directory.CreateDirectory(outputDir);
            }
            File.WriteAllBytes(outputPath, png);

            camera.targetTexture = previousTarget;
            RenderTexture.active = previousActive;
            UnityEngine.Object.DestroyImmediate(texture);
            UnityEngine.Object.DestroyImmediate(renderTexture);
        }
    }
}
#endif

