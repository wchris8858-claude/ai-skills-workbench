#!/usr/bin/env python3
"""
网络请求测试 - 检查所有网络请求
"""

from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 记录所有网络请求
    requests = []
    responses = []

    def handle_request(request):
        requests.append({
            "url": request.url,
            "method": request.method
        })

    def handle_response(response):
        responses.append({
            "url": response.url,
            "status": response.status
        })

    page.on("request", handle_request)
    page.on("response", handle_response)

    print("1. 访问登录页面...")
    page.goto(f"{BASE_URL}/login", timeout=60000)

    print("2. 等待网络空闲...")
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    print("\n3. 网络请求汇总:")
    print(f"   总请求数: {len(requests)}")
    print(f"   总响应数: {len(responses)}")

    # 显示失败的请求
    print("\n4. 失败的请求 (状态码 >= 400):")
    failed = [r for r in responses if r["status"] >= 400]
    if failed:
        for r in failed:
            print(f"   [{r['status']}] {r['url']}")
    else:
        print("   无")

    # 显示 API 请求
    print("\n5. API 请求:")
    api_requests = [r for r in responses if "/api/" in r["url"]]
    if api_requests:
        for r in api_requests:
            print(f"   [{r['status']}] {r['url']}")
    else:
        print("   无 API 请求")

    # 检查 auth/me 是否被调用
    auth_me = [r for r in responses if "/api/auth/me" in r["url"]]
    if auth_me:
        print(f"\n6. /api/auth/me 请求状态: {auth_me[0]['status']}")
    else:
        print("\n6. /api/auth/me 未被调用!")

    # 截图
    page.screenshot(path="/tmp/e2e_network.png", full_page=True)
    print("\n7. 截图保存到 /tmp/e2e_network.png")

    browser.close()

print("\n测试完成!")
