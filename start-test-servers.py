#!/usr/bin/env python3
"""
启动多个测试 HTTP 服务器
使用方法: python3 start-test-servers.py
停止: Ctrl+C
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import sys

# 定义要启动的端口
PORTS = [3100, 3101, 3102, 3103, 3104, 
         5100, 5101, 5102, 
         8100, 8101, 8102, 
         9100, 9101, 9102, 9103]

def create_html(port):
    """为每个端口生成不同的 HTML"""
    colors = [
        ('667eea', '764ba2'),  # 紫色渐变
        ('f093fb', 'f5576c'),  # 粉红渐变
        ('4facfe', '00f2fe'),  # 蓝色渐变
        ('43e97b', '38f9d7'),  # 绿色渐变
        ('fa709a', 'fee140'),  # 橙粉渐变
    ]
    color_idx = (port // 100) % len(colors)
    color1, color2 = colors[color_idx]
    
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Server {port}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #{color1} 0%, #{color2} 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: white;
        }}
        .container {{
            text-align: center;
            animation: fadeIn 0.5s ease-in;
        }}
        h1 {{
            font-size: 5em;
            margin-bottom: 0.2em;
            text-shadow: 2px 2px 20px rgba(0,0,0,0.2);
        }}
        p {{
            font-size: 1.8em;
            opacity: 0.9;
        }}
        .emoji {{
            font-size: 6em;
            margin-bottom: 0.2em;
            animation: bounce 2s infinite;
        }}
        @keyframes fadeIn {{
            from {{ opacity: 0; transform: translateY(-20px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        @keyframes bounce {{
            0%, 100% {{ transform: translateY(0); }}
            50% {{ transform: translateY(-20px); }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">🚀</div>
        <h1>Port {port}</h1>
        <p>测试服务器运行中</p>
    </div>
</body>
</html>"""

class MyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        html = create_html(self.server.server_port)
        self.wfile.write(html.encode('utf-8'))
    
    def log_message(self, format, *args):
        pass  # 静默日志

def start_server(port):
    """启动单个服务器"""
    try:
        server = HTTPServer(('127.0.0.1', port), MyHandler)
        print(f"✅ 服务器运行: http://127.0.0.1:{port}")
        server.serve_forever()
    except OSError as e:
        print(f"❌ 端口 {port} 启动失败: {e}")
    except Exception as e:
        print(f"❌ 端口 {port} 错误: {e}")

if __name__ == "__main__":
    print("\n🎉 启动测试服务器...\n")
    
    threads = []
    success_count = 0
    
    for port in PORTS:
        try:
            thread = threading.Thread(target=start_server, args=(port,), daemon=True)
            thread.start()
            threads.append(thread)
            success_count += 1
        except Exception as e:
            print(f"❌ 无法启动端口 {port}: {e}")
    
    if success_count > 0:
        print(f"\n✨ 成功启动 {success_count} 个服务器")
        print("📍 端口:", ", ".join(map(str, PORTS)))
        print("\n按 Ctrl+C 停止所有服务器\n")
        
        try:
            while True:
                import time
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n👋 正在停止所有服务器...")
            print("✅ 已停止\n")
            sys.exit(0)
    else:
        print("\n❌ 没有服务器成功启动\n")
        sys.exit(1)
