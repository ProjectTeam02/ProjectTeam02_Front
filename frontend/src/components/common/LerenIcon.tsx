
/** LEREN 공통 아이콘 */
import { createElement } from 'react';
import { LockKeyhole, Mail, Bell, BellOff, Clock, UserRound, Coins, Shirt, Settings, CalendarDays, ChartNoAxesColumn, TrendingUp, BookOpen, ChevronRight, Pencil, CheckCircle2, Flag, History, Send, MessageCircle, RefreshCw, House, Map, CheckCheck, Sparkles, Eye, EyeOff, type LucideProps } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

const icons = { LockKeyhole, Mail, Bell, BellOff, Clock, UserRound, Coins, Shirt, Settings, CalendarDays, ChartNoAxesColumn, TrendingUp, BookOpen, ChevronRight, Pencil, CheckCircle2, Flag, History, Send, MessageCircle, RefreshCw, House, Map, CheckCheck, Sparkles, Eye, EyeOff };

type IconName = keyof typeof icons;

export default function LerenIcon({ name, size = 20, color = COLORS.primary, strokeWidth = 1.8 }: { name: IconName; size?: LucideProps['size']; color?: LucideProps['color']; strokeWidth?: LucideProps['strokeWidth'] }) {
  return createElement(icons[name], { size, color, strokeWidth });
}
