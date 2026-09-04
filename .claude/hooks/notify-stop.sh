#!/usr/bin/env bash
# Claude Code の Stop フック — WSL2 から Windows のトースト通知を出す。
#
# Stop は「Claude が応答を終えた」タイミングで発火する（/clear・resume・compact も含む）。
# 通知が出ない場合は Windows の「設定 > システム > 通知」で Windows PowerShell が
# 許可されているか、集中モードが有効になっていないかを確認する。
set -uo pipefail

readonly POWERSHELL='/mnt/c/windows/System32/WindowsPowerShell/v1.0/powershell.exe'

# 文言を変えるならこの 2 行だけ
readonly TOAST_TITLE='Claude Code'
readonly TOAST_BODY='Claude Codeがタスクを終了しました'

# WSL 以外／Windows 側が見えない環境では黙って何もしない。
# フックの失敗でセッションを止めないことを最優先にする。
[[ -x "$POWERSHELL" ]] || exit 0
command -v iconv >/dev/null 2>&1 || exit 0

# AppId は「スタートメニューに登録済みの AUMID」である必要がある。
# 未登録の値を渡すと Show() は成功するのにトーストが表示されないので、
# Windows に必ず存在する PowerShell 自身の AUMID を借りている。
ps_script=$(cat <<'PS'
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Stop'
$AppId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] > $null
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml(@"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>__TITLE__</text>
      <text>__BODY__</text>
    </binding>
  </visual>
</toast>
"@)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($AppId).Show(
  (New-Object Windows.UI.Notifications.ToastNotification $xml))
PS
)
ps_script=${ps_script//__TITLE__/$TOAST_TITLE}
ps_script=${ps_script//__BODY__/$TOAST_BODY}

# -EncodedCommand（UTF-16LE + base64）を使う理由:
#   1. WSL → Win32 のコマンドライン変換で日本語が文字化けするのを防ぐ
#   2. 引用符のエスケープを一切考えなくてよい
encoded=$(printf '%s' "$ps_script" | iconv -f UTF-8 -t UTF-16LE | base64 -w0)

# cwd が WSL パスのままだと powershell.exe が UNC 警告を stderr に出すので /mnt/c へ移る
cd /mnt/c || exit 0
"$POWERSHELL" -NoProfile -NonInteractive -EncodedCommand "$encoded" >/dev/null 2>&1

# Stop フックの終了コードは常に 0。stdout も空にして、通知以外の副作用を持たせない。
exit 0
