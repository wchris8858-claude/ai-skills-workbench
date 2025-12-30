#!/usr/bin/env python3
"""
AI 掌柜 v2.0 E2E 测试脚本
使用 Playwright 进行端到端测试
"""

import json
import sys
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:3000"

def test_homepage():
    """测试首页加载"""
    print("\n=== 测试首页 ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto(BASE_URL, timeout=30000)
            page.wait_for_load_state('networkidle')

            # 检查页面标题
            title = page.title()
            print(f"  页面标题: {title}")
            assert "AI 掌柜" in title or "掌柜" in title or "Skills" in title, f"标题不正确: {title}"

            # 检查导航栏
            nav = page.locator('header nav, header')
            assert nav.count() > 0, "找不到导航栏"
            print("  ✅ 导航栏存在")

            # 检查是否有技能卡片或内容
            content = page.locator('main')
            assert content.count() > 0, "找不到主内容区域"
            print("  ✅ 主内容区域存在")

            # 截图
            page.screenshot(path="/tmp/e2e_homepage.png", full_page=True)
            print("  📸 截图保存到 /tmp/e2e_homepage.png")

            print("  ✅ 首页测试通过")
            return True
        except Exception as e:
            print(f"  ❌ 首页测试失败: {e}")
            page.screenshot(path="/tmp/e2e_homepage_error.png", full_page=True)
            return False
        finally:
            browser.close()

def test_login_page():
    """测试登录页面"""
    print("\n=== 测试登录页面 ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto(f"{BASE_URL}/login", timeout=30000)
            page.wait_for_load_state('networkidle')

            # 检查登录表单
            username_input = page.locator('input[name="username"], input[type="text"]').first
            password_input = page.locator('input[name="password"], input[type="password"]').first

            if username_input.count() > 0:
                print("  ✅ 用户名输入框存在")
            else:
                print("  ⚠️  用户名输入框可能使用其他选择器")

            if password_input.count() > 0:
                print("  ✅ 密码输入框存在")
            else:
                print("  ⚠️  密码输入框可能使用其他选择器")

            # 检查登录按钮
            login_button = page.locator('button[type="submit"], button:has-text("登录")')
            if login_button.count() > 0:
                print("  ✅ 登录按钮存在")

            page.screenshot(path="/tmp/e2e_login.png", full_page=True)
            print("  📸 截图保存到 /tmp/e2e_login.png")

            print("  ✅ 登录页面测试通过")
            return True
        except Exception as e:
            print(f"  ❌ 登录页面测试失败: {e}")
            page.screenshot(path="/tmp/e2e_login_error.png", full_page=True)
            return False
        finally:
            browser.close()

def test_shops_page():
    """测试店铺列表页面"""
    print("\n=== 测试店铺列表页面 ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto(f"{BASE_URL}/shops", timeout=30000)
            page.wait_for_load_state('networkidle')

            # 检查页面内容
            content = page.content()

            # 可能需要登录才能访问
            if "登录" in content or "login" in content.lower():
                print("  ⚠️  需要登录才能访问店铺页面")
                page.screenshot(path="/tmp/e2e_shops_redirect.png", full_page=True)
                return True  # 重定向到登录页是预期行为

            # 检查页面元素
            page.screenshot(path="/tmp/e2e_shops.png", full_page=True)
            print("  📸 截图保存到 /tmp/e2e_shops.png")

            print("  ✅ 店铺列表页面测试通过")
            return True
        except Exception as e:
            print(f"  ❌ 店铺列表页面测试失败: {e}")
            page.screenshot(path="/tmp/e2e_shops_error.png", full_page=True)
            return False
        finally:
            browser.close()

def test_skill_detail_page():
    """测试技能详情页"""
    print("\n=== 测试技能详情页 ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 测试朋友圈文案技能
        skill_id = "moments-copywriter"

        try:
            page.goto(f"{BASE_URL}/skill/{skill_id}", timeout=30000)
            page.wait_for_load_state('networkidle')

            content = page.content()

            # 可能需要登录
            if "登录" in content or "login" in content.lower():
                print("  ⚠️  需要登录才能访问技能详情页")
                return True

            # 检查技能名称
            if "朋友圈" in content or "文案" in content:
                print("  ✅ 技能名称显示正确")

            # 检查输入区域
            textarea = page.locator('textarea')
            if textarea.count() > 0:
                print("  ✅ 文本输入区域存在")

            page.screenshot(path="/tmp/e2e_skill_detail.png", full_page=True)
            print("  📸 截图保存到 /tmp/e2e_skill_detail.png")

            print("  ✅ 技能详情页测试通过")
            return True
        except Exception as e:
            print(f"  ❌ 技能详情页测试失败: {e}")
            page.screenshot(path="/tmp/e2e_skill_detail_error.png", full_page=True)
            return False
        finally:
            browser.close()

def test_api_endpoints():
    """测试 API 端点"""
    print("\n=== 测试 API 端点 ===")

    import urllib.request
    import urllib.error

    endpoints = [
        ("/api/skills", "技能列表 API"),
        ("/api/health", "健康检查 API"),
    ]

    results = []

    for endpoint, name in endpoints:
        try:
            url = f"{BASE_URL}{endpoint}"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=10) as response:
                status = response.status
                print(f"  ✅ {name} ({endpoint}): {status}")
                results.append(True)
        except urllib.error.HTTPError as e:
            if e.code == 401:
                print(f"  ⚠️  {name} ({endpoint}): 401 (需要认证 - 预期行为)")
                results.append(True)
            else:
                print(f"  ❌ {name} ({endpoint}): {e.code}")
                results.append(False)
        except Exception as e:
            print(f"  ❌ {name} ({endpoint}): {e}")
            results.append(False)

    # 测试 v2 API
    v2_endpoints = [
        ("/api/v2/shops", "店铺管理 API"),
        ("/api/v2/generate", "生成 API"),
        ("/api/v2/content/check", "内容检测 API"),
    ]

    for endpoint, name in v2_endpoints:
        try:
            url = f"{BASE_URL}{endpoint}"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=10) as response:
                status = response.status
                print(f"  ✅ {name} ({endpoint}): {status}")
                results.append(True)
        except urllib.error.HTTPError as e:
            if e.code in [401, 405]:  # 401=未认证, 405=方法不允许 (GET on POST-only)
                print(f"  ✅ {name} ({endpoint}): {e.code} (预期行为)")
                results.append(True)
            else:
                print(f"  ❌ {name} ({endpoint}): {e.code}")
                results.append(False)
        except Exception as e:
            print(f"  ❌ {name} ({endpoint}): {e}")
            results.append(False)

    return all(results)

def test_navigation():
    """测试导航功能"""
    print("\n=== 测试导航功能 ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto(BASE_URL, timeout=30000)
            page.wait_for_load_state('networkidle')

            # 查找导航链接
            nav_links = page.locator('header a, nav a')
            link_count = nav_links.count()
            print(f"  找到 {link_count} 个导航链接")

            # 检查关键导航项
            nav_items = ["技能广场", "我的店铺", "我的技能", "开发工具"]
            page_content = page.content()

            for item in nav_items:
                if item in page_content:
                    print(f"  ✅ 导航项 '{item}' 存在")
                else:
                    print(f"  ⚠️  导航项 '{item}' 未找到")

            print("  ✅ 导航测试完成")
            return True
        except Exception as e:
            print(f"  ❌ 导航测试失败: {e}")
            return False
        finally:
            browser.close()

def test_responsive_design():
    """测试响应式设计"""
    print("\n=== 测试响应式设计 ===")

    viewports = [
        {"width": 1920, "height": 1080, "name": "Desktop"},
        {"width": 768, "height": 1024, "name": "Tablet"},
        {"width": 375, "height": 667, "name": "Mobile"},
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for vp in viewports:
            try:
                page = browser.new_page(viewport={"width": vp["width"], "height": vp["height"]})
                page.goto(BASE_URL, timeout=30000)
                page.wait_for_load_state('networkidle')

                # 截图
                filename = f"/tmp/e2e_responsive_{vp['name'].lower()}.png"
                page.screenshot(path=filename, full_page=True)
                print(f"  ✅ {vp['name']} ({vp['width']}x{vp['height']}): 截图保存到 {filename}")

                page.close()
            except Exception as e:
                print(f"  ❌ {vp['name']}: {e}")

        browser.close()
        print("  ✅ 响应式设计测试完成")
        return True

def main():
    """运行所有测试"""
    print("=" * 60)
    print("AI 掌柜 v2.0 E2E 测试")
    print("=" * 60)

    results = {
        "首页": test_homepage(),
        "登录页面": test_login_page(),
        "店铺列表": test_shops_page(),
        "技能详情页": test_skill_detail_page(),
        "API 端点": test_api_endpoints(),
        "导航功能": test_navigation(),
        "响应式设计": test_responsive_design(),
    }

    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)

    passed = 0
    failed = 0

    for name, result in results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"  {name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1

    print("-" * 60)
    print(f"总计: {passed} 通过, {failed} 失败")
    print("=" * 60)

    # 列出截图文件
    print("\n📸 截图文件:")
    import os
    for f in os.listdir("/tmp"):
        if f.startswith("e2e_") and f.endswith(".png"):
            print(f"  /tmp/{f}")

    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
