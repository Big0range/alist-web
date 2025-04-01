import { createLocalStorage } from "@solid-primitives/storage"
import { isMobile } from "~/utils/compatibility"

import CryptoJS from "crypto-js"

let key: any = import.meta.env.VITE_ENCRYPTION
key = CryptoJS.enc.Latin1.parse(key)
const iv = key

/**
 * 加密数据
 * @param str String
 * @returns String
 */
export function encryption(str: string) {
  const encrypted = CryptoJS.AES.encrypt(str, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding,
  })
  return encrypted.toString()
}

/**
 * 解密数据
 * @param str String
 * @returns String
 */
export function decrypt(str: string) {
  const decrypt2 = CryptoJS.AES.decrypt(str, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding,
  })
  const decryptedStr = decrypt2.toString(CryptoJS.enc.Utf8)
  return decryptedStr.toString()
}

const [local, setLocal, { remove, clear, toJSON }] = createLocalStorage({
  serializer(value, key) {
    // console.log("加密加密加密加密加密加密加密", { value, key })
    return encryption(JSON.stringify(value))
  },
  deserializer(value, key, options) {
    // console.log("解密解密解密解密解密解密解密解密", { value, key, options })
    return JSON.parse(decrypt(value))
  },
})
// export function isValidKey(
//   key: string | number | symbol,
//   object: object
// ): key is keyof typeof object {
//   return key in object
// }

export const initialLocalSettings = [
  {
    key: "aria2_rpc_url",
    default: "https://www.limeichao.cn:6801/jsonrpc",
    hidden: true,
  },
  {
    key: "aria2_rpc_secret",
    default: "xiaomei888",
    hidden: true,
  },
  {
    key:"multifile_download_sleep",
    default: "0",
  },
  {
    key: "global_default_layout",
    default: "list",
    type: "select",
    options: ["list", "grid", "image"],
  },
  {
    key: "show_folder_in_image_view",
    default: "top",
    type: "select",
    options: ["top", "bottom", "none"],
  },
  {
    key: "show_sidebar",
    default: "none",
    type: "select",
    options: ["none", "visible"],
  },
  {
    key: "position_of_header_navbar",
    default: "sticky",
    type: "select",
    options: ["static", "sticky", "only_navbar_sticky"],
  },
  {
    key: "grid_item_size",
    default: "90",
    type: "number",
  },
  {
    key: "list_item_filename_overflow",
    default: "ellipsis",
    type: "select",
    options: ["ellipsis", "scrollable", "multi_line"],
  },
  {
    key: "open_item_on_checkbox",
    default: "direct",
    type: "select",
    options: () =>
      isMobile
        ? ["direct", "disable_while_checked"]
        : ["direct", "disable_while_checked", "with_alt", "with_ctrl"],
  },
  {
    key: "select_with_mouse",
    default: "disabled",
    type: "select",
    options: ["disabled", "open_item_with_dblclick"],
    hidden: isMobile,
  },
]
export type LocalSetting = (typeof initialLocalSettings)[number]
for (const setting of initialLocalSettings) {
  if (!local[setting.key]) {
    setLocal(setting.key, setting.default)
  }
}

export { local, setLocal, remove, clear, toJSON }
