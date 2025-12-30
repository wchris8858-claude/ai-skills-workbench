#!/usr/bin/env python3
"""
登录页面完整测试 - 等待页面完全渲染
"""

from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 监听控制台输出
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))

    print("1. 访问登录页面...")
    page.goto(f"{BASE_URL}/login", timeout=60000)

    print("2. 等待网络空闲...")
    page.wait_for_load_state('networkidle')

    print("3. 额外等待 3 秒让 React hydration 完成...")
    page.wait_for_timeout(3000)

    # 检查是否有登录表单
    print("\n4. 检查页面元素...")

    # 尝试等待登录表单出现
    try:
        # 等待用户名输入框
        username_input = page.wait_for_selector('input[name="username"], input#username', timeout=10000)
        if username_input:
            print("  ✅ 用户名输入框已加载")

        # 等待密码输入框
        password_input = page.wait_for_selector('input[name="password"], input#password', timeout=5000)
        if password_input:
            print("  ✅ 密码输入框已加载")

        # 等待登录按钮
        login_button = page.wait_for_selector('button[type="submit"]', timeout=5000)
        if login_button:
            print("  ✅ 登录按钮已加载")
            button_text = login_button.inner_text()
            print(f"     按钮文本: {button_text}")

    except Exception as e:
        print(f"  ❌ 等待元素超时: {e}")

        # 获取当前页面内容进行分析
        content = page.content()

        # 检查是否显示加载状态
        if "animate-spin" in content:
            print("  ⚠️  页面仍在显示加载状态")
        if "Loader2" in content or "lucide-loader" in content:
            print("  ⚠️  检测到加载图标")

        # 检查是否有错误信息
        if "error" in content.lower() or "错误" in content:
            print("  ⚠️  页面可能有错误")

    # 截图
    page.screenshot(path="/tmp/e2e_login_full.png", full_page=True)
    print("\n5. 截图保存到 /tmp/e2e_login_full.png")

    # 输出控制台消息
    if console_messages:
        print("\n6. 控制台消息:")
        for msg in console_messages[:20]:  # 只显示前 20 条
            print(f"   {msg}")
    else:
        print("\n6. 无控制台消息")

    # 获取页面 HTML 结构
    print("\n7. 页面主要结构:")
    main_elements = page.locator('body > *').all()
    for i, elem in enumerate(main_elements[:5]):
        tag = elem.evaluate("el => el.tagName.toLowerCase()")
        classes = elem.get_attribute("class") or ""
        print(f"   {i+1}. <{tag}> class=\"{classes[:60]}...\"" if len(classes) > 60 else f"   {i+1}. <{tag}> class=\"{classes}\"")

    browser.close()

print("\n测试完成!")
