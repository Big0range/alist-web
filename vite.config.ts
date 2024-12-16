import path from "path"
import { defineConfig } from "vite"
import solidPlugin from "vite-plugin-solid"
import legacy from "@vitejs/plugin-legacy"
import { dynamicBase } from "vite-plugin-dynamic-base"
import { webUpdateNotice } from '@plugin-web-update-notification/vite';
import removeConsole from 'vite-plugin-remove-console';
import fs from 'fs';
const version = JSON.parse(
  fs.readFileSync('./package.json', 'utf-8')
).version;
console.log('version', version);
export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
      "@solidjs/router": path.resolve(__dirname, "solid-router/src"),
    },
  },
  plugins: [
    solidPlugin(),
    webUpdateNotice({
      versionType: 'git_commit_hash',
      // customVersion: version,
      logVersion: true,
      checkInterval: 0.5 * 60 * 1000,
      notificationProps: {
        title: '系统升级通知',
        description: '检测到当前系统版本已更新，请刷新页面后使用。',
        buttonText: '刷新',
        dismissButtonText: '忽略'
      }
    }),
    legacy({
      targets: ["defaults"],
    }),
    dynamicBase({
      // dynamic public path var string, default window.__dynamic_base__
      publicPath: " window.__dynamic_base__",
      // dynamic load resources on index.html, default false. maybe change default true
      transformIndexHtml: true,
    }),
      // !打包时去除console.log
      removeConsole(),
  ],
  base: process.env.NODE_ENV === "production" ? "/__dynamic_base__/" : "/",
  // base: "/",
  build: {
    // target: "es2015", //next
    // polyfillDynamicImport: false,
  },
  // experimental: {
  //   renderBuiltUrl: (filename, { type, hostId, hostType }) => {
  //     if (type === "asset") {
  //       return { runtime: `window.ALIST.cdn/${filename}` };
  //     }
  //     return { relative: true };
  //   },
  // },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "https://www.limeichao.cn:5245",
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
