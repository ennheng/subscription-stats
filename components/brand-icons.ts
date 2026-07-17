import {
  siAnthropic,
  siApplemusic,
  siAppletv,
  siBilibili,
  siDuolingo,
  siGoogledrive,
  siIcloud,
  siNeteasecloudmusic,
  siNetflix,
  siNotion,
  siPlaystation,
  siSpotify,
  siYoutube,
} from "simple-icons";

export interface BrandIcon {
  path: string;
  hex: string;
}

const byId: Record<string, BrandIcon> = {
  netflix: { path: siNetflix.path, hex: siNetflix.hex },
  spotify: { path: siSpotify.path, hex: siSpotify.hex },
  youtube: { path: siYoutube.path, hex: siYoutube.hex },
  icloud: { path: siIcloud.path, hex: siIcloud.hex },
  applemusic: { path: siApplemusic.path, hex: siApplemusic.hex },
  appletv: { path: siAppletv.path, hex: siAppletv.hex },
  bilibili: { path: siBilibili.path, hex: siBilibili.hex },
  netease: { path: siNeteasecloudmusic.path, hex: siNeteasecloudmusic.hex },
  claude: { path: siAnthropic.path, hex: siAnthropic.hex },
  psn: { path: siPlaystation.path, hex: siPlaystation.hex },
  duolingo: { path: siDuolingo.path, hex: siDuolingo.hex },
  notion: { path: siNotion.path, hex: siNotion.hex },
  googledrive: { path: siGoogledrive.path, hex: siGoogledrive.hex },
};

export function brandIconFor(id: string): BrandIcon | undefined {
  return byId[id];
}
