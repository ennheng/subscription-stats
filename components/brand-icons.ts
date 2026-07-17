import {
  siAnthropic,
  siApplemusic,
  siAppletv,
  siBilibili,
  siDuolingo,
  siGoogledrive,
  siIcloud,
  siKimi,
  siNeteasecloudmusic,
  siNetflix,
  siNotion,
  siPlaystation,
  siSpotify,
  siYoutube,
} from "simple-icons";

interface SvgBrandIcon {
  kind: "svg";
  path: string;
  hex: string;
}

interface ImageBrandIcon {
  kind: "image";
  src: string;
}

export type BrandIcon = SvgBrandIcon | ImageBrandIcon;

const byId: Record<string, BrandIcon> = {
  netflix: { kind: "svg", path: siNetflix.path, hex: siNetflix.hex },
  spotify: { kind: "svg", path: siSpotify.path, hex: siSpotify.hex },
  youtube: { kind: "svg", path: siYoutube.path, hex: siYoutube.hex },
  icloud: { kind: "svg", path: siIcloud.path, hex: siIcloud.hex },
  applemusic: { kind: "svg", path: siApplemusic.path, hex: siApplemusic.hex },
  appletv: { kind: "svg", path: siAppletv.path, hex: siAppletv.hex },
  bilibili: { kind: "svg", path: siBilibili.path, hex: siBilibili.hex },
  netease: {
    kind: "svg",
    path: siNeteasecloudmusic.path,
    hex: siNeteasecloudmusic.hex,
  },
  claude: { kind: "svg", path: siAnthropic.path, hex: siAnthropic.hex },
  kimi: { kind: "svg", path: siKimi.path, hex: siKimi.hex },
  psn: { kind: "svg", path: siPlaystation.path, hex: siPlaystation.hex },
  duolingo: { kind: "svg", path: siDuolingo.path, hex: siDuolingo.hex },
  notion: { kind: "svg", path: siNotion.path, hex: siNotion.hex },
  googledrive: { kind: "svg", path: siGoogledrive.path, hex: siGoogledrive.hex },
  chatgpt: { kind: "image", src: "/service-icons/chatgpt.jpg" },
  lightroom: { kind: "image", src: "/service-icons/lightroom.png" },
  windy: { kind: "image", src: "/service-icons/windy.jpg" },
};

export function brandIconFor(id: string): BrandIcon | undefined {
  return byId[id];
}
