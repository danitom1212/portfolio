package com.samsglitchedcafe

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.*
import android.widget.FrameLayout

class MainActivity : Activity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        /* ── Immersive fullscreen ──────────────────── */
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.let { ctrl ->
                ctrl.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                ctrl.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
        }

        /* ── WebView setup ────────────────────────── */
        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#0E0920"))
            isDrawingCacheEnabled = false
        }

        applyWebSettings(webView)

        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(
                view: WebView, request: WebResourceRequest, error: WebResourceError
            ) { /* swallow non-critical errors */ }

            override fun shouldInterceptRequest(
                view: WebView, request: WebResourceRequest
            ): WebResourceResponse? = null   /* all requests pass through */
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(msg: ConsoleMessage): Boolean = true
        }

        /* Full-bleed layout */
        val root = FrameLayout(this)
        root.setBackgroundColor(Color.parseColor("#0E0920"))
        root.addView(webView, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ))
        setContentView(root)

        webView.loadUrl("file:///android_asset/game/episode.html")
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun applyWebSettings(wv: WebView) {
        wv.settings.apply {
            javaScriptEnabled             = true
            domStorageEnabled             = true
            databaseEnabled               = true
            allowFileAccess               = true
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs   = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode              = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode                     = WebSettings.LOAD_DEFAULT
            setSupportZoom(false)
            builtInZoomControls           = false
            displayZoomControls           = false
            loadWithOverviewMode          = true
            useWideViewPort               = true
            layoutAlgorithm               = WebSettings.LayoutAlgorithm.NORMAL
            /* Enable GPU rasterization for Canvas 2D / WebGL */
            setRenderPriority(WebSettings.RenderPriority.HIGH)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WebView.enableSlowWholeDocumentDraw()
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) reapplyImmersive()
    }

    private fun reapplyImmersive() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.apply {
                hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
        webView.pauseTimers()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        webView.resumeTimers()
        reapplyImmersive()
    }

    override fun onDestroy() {
        webView.stopLoading()
        webView.destroy()
        super.onDestroy()
    }
}
