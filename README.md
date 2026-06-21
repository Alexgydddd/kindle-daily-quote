# Kindle 每日语录与天气

这是一个给 Kindle 浏览器使用的极简页面：每天按日期显示一句语录，并从 Open-Meteo 拉取当天实时天气。

## 推荐发布方式：GitHub Pages

GitHub Pages 可以免费托管这个静态页面。电脑关机后，Kindle 仍然可以访问 GitHub 提供的网址。

### 网页上传发布

1. 打开 GitHub，新建一个公开仓库，例如 `kindle-daily-quote`。
2. 进入仓库页面，点击 `Add file` -> `Upload files`。
3. 上传本文件夹里的全部文件：
   - `.nojekyll`
   - `index.html`
   - `styles.css`
   - `app.js`
   - `quotes.js`
   - `README.md`
4. 提交后，进入仓库的 `Settings` -> `Pages`。
5. `Build and deployment` 选择：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. 保存后等 1-3 分钟，GitHub 会给你一个网址，通常类似：
   - `https://你的用户名.github.io/kindle-daily-quote/`
7. 用 Kindle 的实验性浏览器打开这个网址即可。

## 本地预览

如需在电脑上先预览，可以在本文件夹启动一个本地静态服务，再打开 `index.html`。

## 修改城市

当前默认是上海：

- 纬度：`31.2304`
- 经度：`121.4737`
- 时区：`Asia/Shanghai`

如需换城市，编辑 `quotes.js` 里的 `locationName`、`latitude`、`longitude` 和 `timezone`。

## 扩充语录

继续往 `quotes.js` 的 `quotes` 数组里添加条目即可：

```js
{
  text: "你的语录",
  source: "来源说明"
}
```

## 天气数据

天气接口使用 Open-Meteo Forecast API，无需 API Key。页面请求当前温度、体感温度、湿度、天气代码和风速。

## Kindle 改造建议

低风险方式：不越狱，只把这个页面设为 Kindle 浏览器书签，每天手动打开或刷新。

进阶方式：如果你的 Kindle 型号和固件支持越狱，可以把这个页面做成自动刷新的屏保/信息屏。越狱兼容性强依赖具体型号和固件，操作前需要先确认设备信息。
