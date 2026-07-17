package app.subscriptionstats.offline;

import android.app.Activity;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private static final int CREATE_ICS_REQUEST = 7401;
    private WebView webView;
    private String pendingIcs;

    @Override
    @SuppressLint("SetJavaScriptEnabled") // Required only for the bundled, network-blocked local app.
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(245, 242, 237));
        getWindow().setNavigationBarColor(Color.rgb(245, 242, 237));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setBlockNetworkLoads(true);
        settings.setDatabaseEnabled(false);
        settings.setGeolocationEnabled(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        android.webkit.CookieManager.getInstance().setAcceptCookie(false);
        webView.addJavascriptInterface(new AndroidBridge(), "SubscriptionStatsAndroid");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !"file".equals(uri.getScheme());
            }
        });
        webView.loadUrl("file:///android_asset/index.html");
    }

    public final class AndroidBridge {
        @JavascriptInterface
        public void exportIcs(String content) {
            runOnUiThread(() -> {
                pendingIcs = content;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("text/calendar");
                intent.putExtra(Intent.EXTRA_TITLE, "subscription-stats.ics");
                startActivityForResult(intent, CREATE_ICS_REQUEST);
            });
        }

        @JavascriptInterface
        public String deviceLanguage() {
            return getResources().getConfiguration().getLocales().get(0).getLanguage();
        }

    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != CREATE_ICS_REQUEST || resultCode != RESULT_OK || data == null || pendingIcs == null) {
            return;
        }
        try (OutputStream output = getContentResolver().openOutputStream(data.getData())) {
            if (output == null) throw new IllegalStateException("No output stream");
            output.write(pendingIcs.getBytes(StandardCharsets.UTF_8));
            Toast.makeText(this, "ICS exported / 日历已导出", Toast.LENGTH_SHORT).show();
        } catch (Exception error) {
            Toast.makeText(this, "Export failed / 导出失败", Toast.LENGTH_LONG).show();
        } finally {
            pendingIcs = null;
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("SubscriptionStatsAndroid");
            webView.destroy();
        }
        super.onDestroy();
    }
}
