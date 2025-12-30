#!/usr/bin/env python3
"""
登录流程完整测试 - 测试实际登录功能
"""

from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

def test_login_flow():
    """测试完整登录流程"""
    print("=" * 60)
    print("登录流程 E2E 测试")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. 访问登录页面
            print("\n1. 访问登录页面...")
            page.goto(f"{BASE_URL}/login", timeout=60000)
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # 2. 等待登录表单加载
            print("2. 等待登录表单加载...")
            username_input = page.wait_for_selector('input#username', timeout=10000)
            password_input = page.wait_for_selector('input#password', timeout=5000)
            login_button = page.wait_for_selector('button[type="submit"]', timeout=5000)

            if username_input and password_input and login_button:
                print("   ✅ 登录表单已加载")
            else:
                print("   ❌ 登录表单加载失败")
                return False

            # 3. 输入测试凭证
            print("3. 输入测试凭证 (admin/admin123)...")
            username_input.fill("admin")
            password_input.fill("admin123")

            # 截图 - 输入后
            page.screenshot(path="/tmp/e2e_login_filled.png")
            print("   📸 截图保存到 /tmp/e2e_login_filled.png")

            # 4. 点击登录按钮
            print("4. 点击登录按钮...")
            login_button.click()

            # 5. 等待响应
            print("5. 等待登录响应...")
            page.wait_for_timeout(3000)

            # 检查是否登录成功 (重定向到首页或显示错误)
            current_url = page.url

            if "/login" not in current_url:
                print(f"   ✅ 登录成功，已重定向到: {current_url}")

                # 截图 - 登录后
                page.screenshot(path="/tmp/e2e_login_success.png", full_page=True)
                print("   📸 截图保存到 /tmp/e2e_login_success.png")

                # 检查是否显示用户信息
                page.wait_for_timeout(2000)
                content = page.content()

                if "admin" in content.lower() or "管理员" in content:
                    print("   ✅ 检测到用户信息显示")

                # 6. 测试访问受保护页面
                print("\n6. 测试访问受保护页面 (/shops)...")
                page.goto(f"{BASE_URL}/shops", timeout=30000)
                page.wait_for_load_state('networkidle')
                page.wait_for_timeout(2000)

                shops_url = page.url
                shops_content = page.content()

                if "/login" not in shops_url:
                    print("   ✅ 可以访问店铺页面")
                    page.screenshot(path="/tmp/e2e_shops_logged_in.png", full_page=True)
                    print("   📸 截图保存到 /tmp/e2e_shops_logged_in.png")
                else:
                    print("   ⚠️  被重定向到登录页")

                return True

            else:
                # 检查错误信息
                error_element = page.locator('.text-destructive, [class*="error"]').first
                if error_element.count() > 0:
                    error_text = error_element.inner_text()
                    print(f"   ❌ 登录失败: {error_text}")
                else:
                    print("   ❌ 登录失败 (未知原因)")

                page.screenshot(path="/tmp/e2e_login_failed.png", full_page=True)
                print("   📸 截图保存到 /tmp/e2e_login_failed.png")
                return False

        except Exception as e:
            print(f"\n❌ 测试出错: {e}")
            page.screenshot(path="/tmp/e2e_login_error.png", full_page=True)
            return False

        finally:
            browser.close()

if __name__ == "__main__":
    success = test_login_flow()
    print("\n" + "=" * 60)
    if success:
        print("✅ 登录流程测试通过")
    else:
        print("❌ 登录流程测试失败")
    print("=" * 60)
