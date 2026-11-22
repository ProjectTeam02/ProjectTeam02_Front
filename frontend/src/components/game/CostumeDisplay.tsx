
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { COSTUME_IMAGES, getCostumeImage } from '../../constants/costumeImages';
import type { Costume } from '../../services/costumeApi';
import LerenCharacter from '../common/LerenCharacter';

function swatch(source?: ImageSourcePropType) {
  if (source === COSTUME_IMAGES.guardian) return { base: '#FFF3D7', shade: '#ECDDAE' };
  if (source === COSTUME_IMAGES.starlight) return { base: '#EFEEF9', shade: '#D9D7E9' };
  return { base: COLORS.soft, shade: '#D3DFF9' };
}

export function CostumeArt({ item, fallback, size, height }: { item?: Costume; fallback?: ImageSourcePropType; size: number; height: number }) {
  const source = (item && getCostumeImage(item.costumeCode, item.name)) ?? fallback;
  const colors = swatch(source);
  return <View style={[s.art, { height, backgroundColor: colors.base }]}>
    {source ? <>
      <View style={[s.platform, { width: size * 1.1, height: size * 0.2, top: (height + size * 0.58) / 2, backgroundColor: colors.shade, transform: [{ translateX: -6 }] }]} />
      <LerenCharacter source={source} size={size} accessibilityLabel={item?.name ?? '현재 직업'} />
    </> : <Text style={s.caption}>이미지 준비 중</Text>}
  </View>;
}

interface ShowcaseProps {
  item?: Costume; fallback?: ImageSourcePropType; title: string; description?: string; status: string;
  onPress?: () => void;
}

export function CostumeShowcase({ item, fallback, title, description, status, onPress }: ShowcaseProps) {
  const source = (item && getCostumeImage(item.costumeCode, item.name)) ?? fallback;
  const content = <>
    <View style={s.copy}><Text style={s.status}>{status}</Text><Text style={s.heroTitle}>{title}</Text>
      {!!description && <Text style={s.caption}>{description}</Text>}</View>
    <View style={s.heroArt}><CostumeArt item={item} fallback={fallback} size={onPress ? 132 : 125} height={160} /></View>
  </>;
  const style = [s.hero, { backgroundColor: swatch(source).base }];
  return onPress ? <Pressable style={style} accessibilityRole="button" onPress={onPress}>{content}</Pressable> : <View style={style}>{content}</View>;
}

export function CostumeTile({ item, label, onPress, equipped = false, shop = false }: {
  item: Costume; label: string; onPress: () => void; equipped?: boolean; shop?: boolean;
}) {
  return <Pressable style={s.tile} accessibilityRole="button" accessibilityLabel={item.name + ' · ' + label}
    accessibilityState={{ disabled: equipped }} disabled={equipped} onPress={onPress}>
    <CostumeArt item={item} height={shop ? 125 : 101} size={shop ? 95 : 83} />
    <View style={s.tileCopy}><Text style={s.tileTitle}>{item.name}</Text><Text style={s.status}>{label}</Text></View>
  </Pressable>;
}

export const costumeGrid = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 } });
const s = StyleSheet.create({
  hero: { minHeight: 171, borderRadius: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  copy: { flex: 1, paddingLeft: 16, paddingVertical: 16, gap: 7 },
  heroTitle: { ...TYPOGRAPHY.title, color: COLORS.ink }, heroArt: { width: '43%' },
  art: { borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  platform: { position: 'absolute', borderRadius: 100 }, status: { ...TYPOGRAPHY.label, color: COLORS.primary },
  caption: { ...TYPOGRAPHY.small, color: COLORS.muted },
  tile: { width: '48.3%', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface },
  tileCopy: { padding: 12, gap: 8 }, tileTitle: { ...TYPOGRAPHY.label, fontSize: 16, color: COLORS.ink },
});
