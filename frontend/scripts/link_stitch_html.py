import os
import glob

# Paths
target_dir = "/Users/shivpat/CleanUpGiveBack App Development/nonprofit-mobile-app/assets/stitch"

html_files = glob.glob(os.path.join(target_dir, "*.html"))

injection_script = """
<script>
document.addEventListener('DOMContentLoaded', () => {
    // Helper to find elements by text content and tag
    function linkElement(selector, textMatch, targetUrl) {
        document.querySelectorAll(selector).forEach(el => {
            if (el.textContent.toLowerCase().includes(textMatch.toLowerCase()) || el.getAttribute('aria-label')?.toLowerCase().includes(textMatch.toLowerCase()) || el.getAttribute('data-icon')?.toLowerCase().includes(textMatch.toLowerCase())) {
                el.style.cursor = 'pointer';
                el.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = targetUrl;
                };
            }
        });
    }

    // Auth & Onboarding Flow
    linkElement('button', 'Sign up with Email', 'create_account___standardized_progress.html');
    linkElement('a', 'Log in', 'home_dashboard___final_branding.html');
    linkElement('button', 'Continue', 'account_details___standardized_progress.html'); // This is tricky, handle per-page below if needed

    // Specific page logic based on current URL
    const currentPath = window.location.pathname;

    if (currentPath.includes('create_account')) {
        linkElement('button', 'Continue', 'account_details___standardized_progress.html');
    } else if (currentPath.includes('account_details')) {
        linkElement('button', 'Continue', 'notification_preference___standardized_redo.html');
    } else if (currentPath.includes('notification_preference')) {
        linkElement('button', 'Enable Notifications', 'welcome___standardized_progress.html');
        linkElement('button', 'Not now', 'welcome___standardized_progress.html');
    } else if (currentPath.includes('welcome___standardized_progress')) {
        linkElement('button', 'Start Tracking', 'session_setup___prd_aligned_standardized.html');
        linkElement('button', 'Go to Home', 'home_dashboard___final_branding.html');
    }

    // Main Navigation
    linkElement('a', 'Home', 'home_dashboard___final_branding.html');
    linkElement('a', 'Shop', 'shop_home___prd___reference_aligned.html');
    linkElement('a', 'Sessions', 'sessions_list_view___standardized_refined.html');
    linkElement('button', 'Track', 'session_setup___prd_aligned_standardized.html');
    
    // Bottom Nav items (often icons)
    linkElement('.material-symbols-outlined', 'home', 'home_dashboard___final_branding.html');
    linkElement('.material-symbols-outlined', 'shopping_cart', 'shop_home___prd___reference_aligned.html');
    linkElement('.material-symbols-outlined', 'list', 'sessions_list_view___standardized_refined.html');
    linkElement('.material-symbols-outlined', 'person', 'account.html');

    // Home / Dashboard
    linkElement('button', 'Start Session', 'live_session___refined_map_tracker.html');
    linkElement('button', 'Start Tracking', 'session_setup___prd_aligned_standardized.html');

    // Live Session
    linkElement('button', 'Submit a photo', 'photo_checkpoint.html');
    linkElement('button', 'End Session', 'submission_confirmation___prd_aligned.html');

    // Photo Checkpoint
    linkElement('button', 'Submit Photo', 'live_session___refined_map_tracker.html');
    linkElement('button', 'Submit', 'live_session___refined_map_tracker.html');

    // Submission Confirmation
    linkElement('button', 'Submit for Approval', 'home_dashboard___final_branding.html');

    // Shop
    linkElement('div', 'View Kit', 'product_detail__cleanup_kit___high_fidelity.html');
    linkElement('h2', 'Trash Cleanup Kit', 'product_detail__cleanup_kit___high_fidelity.html');
    linkElement('a', 'Donate', 'donate.html');
    linkElement('button', 'Donate', 'donate.html');

    // Product Detail
    linkElement('button', 'Add to Cart', 'shopping_cart__no_tote_bag_.html');

    // Cart
    linkElement('button', 'Checkout', 'thank_you___no_tote_bag_.html');

    // Donate
    linkElement('button', 'Donate', 'thank_you___no_tote_bag_.html');

    // Thank You
    linkElement('button', 'Return to Home', 'home_dashboard___final_branding.html');
    linkElement('a', 'Return to Home', 'home_dashboard___final_branding.html');

    // Account
    linkElement('a', 'Export Service Record', 'export_service_record.html');
    linkElement('a', 'Order History', 'order_history.html');
    linkElement('a', 'Donation History', 'donation_history.html');
    linkElement('a', 'Settings', 'notification_settings___refined_toggles.html');

    // Global intercept for {{DATA:SCREEN:SCREEN_...}}
    document.querySelectorAll('a').forEach(a => {
        if (a.href.includes('{{DATA:SCREEN')) {
            a.onclick = (e) => {
                e.preventDefault();
                console.log("Unmapped stitch screen link clicked");
            };
        }
    });
});
</script>
</body>
"""

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Avoid double injection
    if "document.addEventListener('DOMContentLoaded'" not in content:
        # Replace </body> with the injected script + </body>
        content = content.replace("</body>", injection_script)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Linked {os.path.basename(filepath)}")

print("Linking complete.")
