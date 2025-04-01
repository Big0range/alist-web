import axios from "axios"
import { local, password, selectedObjs as _selectedObjs, objStore } from "~/store"
import { fsList, notify, pathBase, pathJoin } from "~/utils"
import { getLinkByDirAndObj, useRouter, useT } from "~/hooks"
import { useSelectedLink } from "~/hooks"
import { Obj } from "~/types"

interface File {
  path: string
  dir: string
  url: string
  name: string
}

function isEmpty(value: string | object): boolean {
  return value === undefined || value === null || value === ""
}
function isNullOrUndefined(value: string | object): boolean {
  return value === undefined || value === null
}

async function getSaveDir(rpc_url: string, rpc_secret: string) {
  let save_dir: string = "/downloads/alist"

  const resp = await axios.post(rpc_url, {
    id: Math.random().toString(),
    jsonrpc: "2.0",
    method: "aria2.getGlobalOption",
    params: ["token:" + (rpc_secret ?? "")],
  })
  console.log(resp)
  if (resp.status === 200) {
    if (!isEmpty(resp.data.result.dir)) {
      save_dir = resp.data.result.dir
    }
    save_dir = save_dir.endsWith("/") ? save_dir.slice(0, -1) : save_dir
  }
  return save_dir
}
let sendToAria2Loading = false
export const useDownload = () => {
  const { rawLinks } = useSelectedLink()
  const t = useT()
  const { pathname } = useRouter()
  return {
    batchDownloadSelected: () => {
      const urls = rawLinks(true)
      urls.forEach((url) => {
        window.open(url, "_blank")
      })
    },
    sendToAria2: async () => {

      const selectedObjs = _selectedObjs()
      const fetchFolderStructure = async (
        pre: string,
        obj: Obj,
      ): Promise<File[] | string> => {
        if (!obj.is_dir) {
          return [
            {
              path: pathJoin(pre, obj.name),
              dir: pre,
              url: getLinkByDirAndObj(
                pathJoin(pathname(), pre),
                obj,
                "direct",
                true,
              ),
              name: obj.name,
            },
          ]
        } else {
          const resp = await fsList(
            pathJoin(pathname(), pre, obj.name),
            password(),
          )
          if (resp.code !== 200) {
            return resp.message
          }
          const res: File[] = []
          for (const _obj of resp.data.content ?? []) {
            const _res = await fetchFolderStructure(
              pathJoin(pre, obj.name),
              _obj,
            )
            if (typeof _res === "string") {
              return _res
            } else {
              res.push(..._res)
            }
          }
          return res
        }
      }
      const { aria2_rpc_url, aria2_rpc_secret } = local
      if (!aria2_rpc_url) {
        notify.warning(t("home.toolbar.aria2_not_set"))
        return
      }
      try {

        let save_dir = "/data/alist/下载/"
        const fullPathList = pathname().split('/')
        const currentCurName = fullPathList.slice(2).join('/')
        // const currentCurName = pathBase(pathname())
        save_dir = save_dir + currentCurName
        // // 如果下载的是文件夹则这样处理下载路径
        // if (selectedObjs.length === 1 && selectedObjs[0].is_dir) {
        //   save_dir = save_dir + pathBase(selectedObjs[0].name)
        // } else {
        //   // 如果下载的是文件则这样处理下载路径
        //   const currentCurName = pathBase(pathname())
        //   save_dir = save_dir + currentCurName
        // }
        // TODO: select dir, but it seems there is no way to get the full path
        // if (window.showDirectoryPicker) {
        //   const dirHandle = await window.showDirectoryPicker()
        //   save_dir = dirHandle.name
        //   console.log(dirHandle)
        //   return
        // }
        // save_dir = await getSaveDir(aria2_rpc_url, aria2_rpc_secret)
        let isStartAria2Mission = false
        notify.info(`${t("home.package_download.fetching_struct")}`)
        for (let index = 0; index < selectedObjs.length; index++) {
          // for (const obj of selectedObjs) {
          const obj = selectedObjs[index]
          const res = await fetchFolderStructure("", obj)

          if (typeof res !== "object" || res.length === undefined) {
            notify.error(
              `${t("home.package_download.fetching_struct_failed")}: ${res}`,
            )
            return res
          } else {
            for (let key = 0; key < res.length; key++) {
              if (
                isEmpty(res[key].path) ||
                isNullOrUndefined(res[key].dir) ||
                isEmpty(res[key].url) ||
                isEmpty(res[key].name)
              ) {
                notify.error(
                  `${t(
                    "home.package_download.fetching_struct_failed",
                  )}: ${JSON.stringify(res[key])}`,
                )
                continue
              }
              if (!isStartAria2Mission) {
                isStartAria2Mission = true
                notify.info(`${t("home.package_download.downloading")}`)
              }
              const resp = await axios.post(aria2_rpc_url, {
                id: Math.random().toString(),
                jsonrpc: "2.0",
                method: "aria2.addUri",
                params: [
                  "token:" + (aria2_rpc_secret ?? ""),
                  [res[key].url],
                  {
                    out: res[key].name,
                    dir: save_dir + res[key].dir,
                    "check-certificate": "false",
                  },
                ],
              })
              // 只有当res和selectedObjs长度都等于1时  或者res和selectedObjs进行到最后一个了 才不会进行sleep判断

              if ((res.length === 1 && selectedObjs.length === 1)|| (res.length - 1 === key && selectedObjs.length - 1 === index)) {
                notify.success("全部下载任务发送成功")
                console.log('全部下载任务发送成功')
              }else {
                notify.success(`${key + 1}/${res.length}`)
                // 分钟
                const minute_sleep = Math.max(Number(local["multifile_download_sleep"]) || 0, 0)
                console.log('minute_sleep', minute_sleep, local["multifile_download_sleep"])
                if (minute_sleep) {
                  await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * minute_sleep))
                }
              }

              console.log(resp)
            }
          }
        }
        notify.success(t("home.toolbar.send_aria2_success"))
      } catch (e) {
        console.error(e)
        notify.error(`failed to send to aria2: ${e}`)
      }
    },
    playlistDownloadSelected: () => {
      const selectedObjs = _selectedObjs().filter((obj) => !obj.is_dir)
      let saveName = pathBase(pathname())
      if (selectedObjs.length === 1) {
        saveName = selectedObjs[0].name
      }
      if (!saveName) {
        saveName = t("manage.sidemenu.home")
      }
      const m3u8Content = selectedObjs.reduce(
        (acc, obj, index) =>
          `${acc}#EXTINF:-1,${obj.name}\n${rawLinks(true)[index]}\n`,
        "#EXTM3U\n",
      )
      const m3u8Blob = new Blob([m3u8Content], {
        type: "application/x-mpegURL",
      })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(m3u8Blob)
      a.download = `${saveName}.m3u8`
      a.click()
      URL.revokeObjectURL(a.href)
    },
  }
}
