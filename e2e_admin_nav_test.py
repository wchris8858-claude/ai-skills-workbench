#!/usr/bin/env python3
"""
管理员导航测试 - 验证登录后能看到开发工具
"""

from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("1. 登录管理员账号...")
    page.goto(f"{BASE_URL}/login", timeout=60000)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # 输入凭证并登录
    page.fill('input#username', 'admin')
    page.fill('input#password', 'admin123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)

    print("2. 检查导航栏...")
    page.wait_for_load_state('networkidle')

    # 获取页面内容
    content = page.content()

    # 检查导航项
    nav_items = ['技能广场', '我的店铺', '我的技能', '历史记录', '开发工具', '文档']

    print("\n3. 导航项检查结果:")
    for item in nav_items:
        if item in content:
            print(f"   ✅ {item}")
        else:
            print(f"   ❌ {item}")

    # 截图
    page.screenshot(path="/tmp/e2e_admin_nav.png", full_page=True)
    print("\n4. 截图保存到 /tmp/e2e_admin_nav.png")

    # 测试访问开发工具页面
    print("\n5. 测试访问开发工具页面...")
    page.goto(f"{BASE_URL}/dev-tools", timeout=30000)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    dev_tools_content = page.content()
    if "开发" in dev_tools_content or "调试" in dev_tools_content or "工具" in dev_tools_content:
        print("   ✅ 开发工具页面可访问")
    else:
        print("   ⚠️  开发工具页面内容可能不正确")

    page.screenshot(path="/tmp/e2e_dev_tools.png", full_page=True)
    print("   📸 截图保存到 /tmp/e2e_dev_tools.png")

    browser.close()

print("\n测试完成!")
