import os
import glob

assets_dir = "/Users/shivpat/CleanUpGiveBack App Development/nonprofit-mobile-app/assets/stitch"
app_dir = "/Users/shivpat/CleanUpGiveBack App Development/nonprofit-mobile-app/src/app"

html_files = glob.glob(os.path.join(assets_dir, "*.html"))

require_map = []
for filepath in html_files:
    filename = os.path.basename(filepath)
    name = filename.replace('.html', '')
    require_map.append(f"  '{name}': require('../../../assets/stitch/{filename}')")

require_map_str = ",\n".join(require_map)

prototype_screen_code = f"""import React from 'react';
import {{ View, StyleSheet }} from 'react-native';
import {{ WebView }} from 'react-native-webview';
import {{ useLocalSearchParams, useRouter }} from 'expo-router';
import {{ Asset }} from 'expo-asset';
import {{ useSafeAreaInsets }} from 'react-native-safe-area-context';

const HTML_MAP: Record<string, any> = {{
{require_map_str}
}};

export default function PrototypeScreen() {{
  const {{ screen }} = useLocalSearchParams<{'{'} screen: string {'}'}>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const screenKey = Array.isArray(screen) ? screen[0] : (screen || 'welcome');
  const source = HTML_MAP[screenKey];
  
  if (!source) {{
    return (
      <View style={{styles.container}}>
        <WebView source={{{{ html: `<h1>404 - Screen ${{screenKey}} not found</h1>` }}}} />
      </View>
    );
  }}

  // We can pass the required module to WebView, but on some platforms it requires resolving the URI
  // Or since we injected JS that sets window.location.href, we can intercept that:
  const onShouldStartLoadWithRequest = (request: any) => {{
    const url = request.url;
    
    // Check if it's navigating to another HTML file
    if (url && url.endsWith('.html')) {{
      // Extract filename
      const match = url.match(/([^/]+)\\.html$/);
      if (match && match[1]) {{
        const targetScreen = match[1];
        if (targetScreen !== screenKey) {{
          router.push(`/prototype/${{targetScreen}}`);
          return false; // Stop webview from loading it natively
        }}
      }}
    }}
    return true; // Allow initial load
  }};

  return (
    <View style={{[styles.container, {{ paddingTop: insets.top, paddingBottom: insets.bottom }}]}}>
      <WebView
        source={{source}}
        onShouldStartLoadWithRequest={{onShouldStartLoadWithRequest}}
        originWhitelist={{['*']}}
        allowFileAccess={{true}}
        allowUniversalAccessFromFileURLs={{true}}
      />
    </View>
  );
}}

const styles = StyleSheet.create({{
  container: {{ flex: 1, backgroundColor: '#fcf9f8' }}
}});
"""

os.makedirs(os.path.join(app_dir, "prototype"), exist_ok=True)
with open(os.path.join(app_dir, "prototype", "[screen].tsx"), "w") as f:
    f.write(prototype_screen_code)

layout_code = """import { Stack } from 'expo-router';

export default function PrototypeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
"""
with open(os.path.join(app_dir, "prototype", "_layout.tsx"), "w") as f:
    f.write(layout_code)

index_code = """import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/prototype/welcome" />;
}
"""
with open(os.path.join(app_dir, "index.tsx"), "w") as f:
    f.write(index_code)

print("Generated prototype screens successfully.")
