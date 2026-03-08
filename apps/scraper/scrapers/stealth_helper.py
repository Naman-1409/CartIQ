"""
stealth_helper.py — Inline anti-bot detection for Playwright
Replaces playwright_stealth which is broken on Python 3.12
"""

def _get_stealth_js(platform="MacIntel"):
    return f"""
// Override navigator.webdriver
Object.defineProperty(navigator, 'webdriver', {{ get: () => undefined }});

// Override Chrome property
window.chrome = {{
    runtime: {{}},
    loadTimes: function() {{}},
    csi: function() {{}},
    app: {{}}
}};

// Override permissions
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications'
        ? Promise.resolve({{ state: Notification.permission }})
        : originalQuery(parameters)
);

// Override plugins
Object.defineProperty(navigator, 'plugins', {{
    get: () => [1, 2, 3, 4, 5],
}});

// Override languages
Object.defineProperty(navigator, 'languages', {{
    get: () => ['en-IN', 'en-US', 'hi-IN'],
}});

// Override platform
Object.defineProperty(navigator, 'platform', {{
    get: () => '{platform}',
}});
"""


async def apply_stealth(page, platform="MacIntel"):
    """Apply anti-bot detection measures to a Playwright page."""
    await page.add_init_script(_get_stealth_js(platform))
