# DSH 角色伙伴

`dsh-role-companion` 是运行在 DeepSeek Harness（DSH）中的角色伙伴插件。它在角色之家中保存核心设定、原始经历、长期记忆、成长内容、作品、运行规则和恢复资料，并通过受控工具支持模型交流、网页查阅、文件操作、QQ 文字收发、自主活动与主动联系。

## 适用范围

- DSH `0.2.1-rc.2` 与 `0.2.1-rc.3`
- Web 与 Desktop 的 DSH 设置页
- 本地角色之家与显式授权的文件目录

rc.2 可以使用角色之家、官方模型对话、QQ 文字收发和运行规则。文件工具要求 rc.3，并在 rc.2 上失败关闭。

## 安装

在 DSH 的插件管理页安装本仓库生成的本地 tarball，然后启用 `dsh-role-companion`。Web 与 Desktop 使用各自载体的插件管理入口。

```sh
npm ci --ignore-scripts
npm run build
npm run typecheck
npm run pack:plugin
```

产物生成到 `artifacts/`。

## 开发验证

```sh
npm test
```

## 安全边界

- 自有 Remote 方法检查 Gateway 注入的 owner 身份。
- 模型输入、QQ 文字和请求体中的身份字段不能取得管理权限。
- 凭据由 DSH provider 的私密引用解析，插件不接收或保存凭据值。
- 角色之家、受保护配置、加载代码和已验证凭据不能通过外部父目录授权读取。
- 文件工具只接受受控 scope 内的相对路径，并拒绝路径穿越、链接逃逸、别名和受保护后代。
- 原始经历、知识版本、操作 ID、备份与恢复过程均有独立事实边界。

项目术语见 [`GLOSSARY.md`](GLOSSARY.md)，代码审查约束见 [`CODING_STANDARDS.md`](CODING_STANDARDS.md)。

## 许可证

本项目依据 [MIT License](LICENSE) 授权。
