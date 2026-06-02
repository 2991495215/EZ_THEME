# EZ_THEME 交接文档

## 当前状态

- 本地项目目录：`C:\Users\a2832\Documents\Codex\2026-05-28\dedione-1c1g-us-144-225-187\EZ_THEME`
- 线上站点：`https://sub.trent30.com/`
- XBoard 服务器：SSH alias `s3`
- XBoard 容器：`xboard-xboard-1`
- 面板路径：容器内 `/www`
- 当前主题名：`Xboard`

现在线上已经部署 EZTHEME/EZ_THEME，并且根站 `https://sub.trent30.com/` 已改成加载 EZ_THEME 的静态资源。

## 已做改动

主要改了 EZ_THEME 配置：

- `src/config/index.js`
  - `PANEL_TYPE: 'Xboard'`
  - API 地址改为 `https://sub.trent30.com/api/v1`
  - 站点名改为 `Trent机场`
  - 关闭前端域名检查、API 域名检查、反调试、license 检查
  - 授权域名包含 `sub.trent30.com`

- `src/utils/baseConfig.js`
  - 默认安全检查同样关闭
  - 默认站点名改为 `Trent机场`

另外生成了根站 Blade 入口：

- 本地：`C:\Users\a2832\Documents\Codex\2026-05-28\dedione-1c1g-us-144-225-187\dashboard.blade.php`
- 线上：容器内 `/www/theme/Xboard/dashboard.blade.php`

这个文件的作用：让 XBoard 根站 `/` 加载 `/theme/Xboard/static/...`，否则它会继续加载旧 XBoard 的 `/theme/Xboard/assets/umi.js`。

## 本地开发

进入项目：

```powershell
cd C:\Users\a2832\Documents\Codex\2026-05-28\dedione-1c1g-us-144-225-187\EZ_THEME
```

安装依赖已经做过，本地有 `node_modules` 和 `package-lock.json`。

本地构建：

```powershell
npm run build
```

构建产物在：

```text
EZ_THEME\dist
```

## 部署流程

从工作区根目录执行：

```powershell
cd C:\Users\a2832\Documents\Codex\2026-05-28\dedione-1c1g-us-144-225-187
tar -czf ez_theme_dist.tar.gz -C EZ_THEME/dist .
scp ez_theme_dist.tar.gz s3:/tmp/ez_theme_dist.tar.gz
ssh s3 "docker cp /tmp/ez_theme_dist.tar.gz xboard-xboard-1:/tmp/ez_theme_dist.tar.gz"
ssh s3 "docker exec xboard-xboard-1 sh -lc 'rm -rf /www/public/theme/Xboard/*; tar -xzf /tmp/ez_theme_dist.tar.gz -C /www/public/theme/Xboard; chown -R www:www /www/public/theme/Xboard'"
```

根站入口也要同步。重新生成 `dashboard.blade.php` 的规则：

- 把 `EZ_THEME/dist/index.html` 里的 `./static/` 改成 `/theme/Xboard/static/`
- 把 `./images/` 改成 `/theme/Xboard/images/`
- 把 `%VUE_APP_TITLE%` 改成 `{{$title}}`

当前本地已有生成好的 `dashboard.blade.php`。同步命令：

```powershell
scp dashboard.blade.php s3:/tmp/dashboard.blade.php
ssh s3 "docker cp /tmp/dashboard.blade.php xboard-xboard-1:/tmp/dashboard.blade.php"
ssh s3 "docker exec xboard-xboard-1 cp /tmp/dashboard.blade.php /www/theme/Xboard/dashboard.blade.php"
ssh s3 "docker exec xboard-xboard-1 chown www:www /www/theme/Xboard/dashboard.blade.php"
```

清缓存：

```powershell
ssh s3 "docker exec xboard-xboard-1 php artisan view:clear"
ssh s3 "docker exec xboard-xboard-1 php artisan cache:clear"
ssh s3 "docker exec xboard-xboard-1 php artisan octane:reload"
```

## 验证命令

根站应返回 EZ_THEME HTML，并引用 `/theme/Xboard/static/...`：

```powershell
ssh s3 "curl -k -sS -m 20 --resolve sub.trent30.com:443:127.0.0.1 https://sub.trent30.com/ | grep -E 'theme/Xboard/(static|assets)|umi.js'"
```

正确结果应看到：

```text
/theme/Xboard/static/index-xxx.js
/theme/Xboard/static/vendor-xxx.js
```

不应该看到：

```text
/theme/Xboard/assets/umi.js
```

API 验证：

```powershell
ssh s3 "curl -k -sS -m 20 --resolve sub.trent30.com:443:127.0.0.1 https://sub.trent30.com/api/v1/guest/comm/config | head -c 500; echo"
```

静态配置验证：

```powershell
ssh s3 "docker exec xboard-xboard-1 grep -R -F sub.trent30.com/api/v1 /www/public/theme/Xboard/static"
```

旧 API 不应存在：

```powershell
ssh s3 "docker exec xboard-xboard-1 grep -R -F vpn.trent30.com/api/v1 /www/public/theme/Xboard/static"
```

这个命令退出码 `1` 表示没找到，是正常的。

## 线上备份

已保留备份：

```text
/www/storage/logs/theme_Xboard_before_ez_20260528_220533.tar.gz
/www/storage/logs/dashboard_Xboard_before_ez_20260528_2235.blade.php
```

恢复主题静态文件：

```powershell
ssh s3 "docker exec xboard-xboard-1 sh -lc 'rm -rf /www/public/theme/Xboard/*; tar -C /www/public/theme -xzf /www/storage/logs/theme_Xboard_before_ez_20260528_220533.tar.gz; chown -R www:www /www/public/theme/Xboard'"
```

恢复根站入口：

```powershell
ssh s3 "docker exec xboard-xboard-1 cp /www/storage/logs/dashboard_Xboard_before_ez_20260528_2235.blade.php /www/theme/Xboard/dashboard.blade.php"
ssh s3 "docker exec xboard-xboard-1 php artisan view:clear"
ssh s3 "docker exec xboard-xboard-1 php artisan cache:clear"
ssh s3 "docker exec xboard-xboard-1 php artisan octane:reload"
```

## 注意点

- 不要只改容器里的 JS。以后会丢，也不好追踪。
- 改源码后一定 `npm run build`。
- 只覆盖 `/www/public/theme/Xboard` 不够，根站还依赖 `/www/theme/Xboard/dashboard.blade.php`。
- EZ_THEME 里仍有 `API_MIDDLEWARE_URL` 的 demo 地址，但 `API_MIDDLEWARE_ENABLED:false`，当前不生效。
- 如果出现白屏，先查根站 HTML 是否又回到 `/theme/Xboard/assets/umi.js`。
- 如果 API 错，先查构建后的静态 JS 里是否还是 `https://sub.trent30.com/api/v1`。

