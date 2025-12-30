#!/usr/bin/env python3
"""
登录页面详细测试
"""

from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("访问登录页面...")
    page.goto(f"{BASE_URL}/login", timeout=60000)

    # 等待更长时间
    print("等待页面完全加载...")
    page.wait_for_timeout(5000)  # 等待 5 秒
    page.wait_for_load_state('networkidle')

    # 截图
    page.screenshot(path="/tmp/e2e_login_detail.png", full_page=True)
    print("截图保存到 /tmp/e2e_login_detail.png")

    # 输出页面内容
    content = page.content()
    print(f"\n页面内容片段:\n{content[:2000]}...")

    browser.close()
