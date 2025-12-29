/**
 * 图标映射工具
 *
 * 通过按需导入替代 `import * as LucideIcons`，
 * 将打包体积从 31MB 减少到约 100KB
 */

import {
  // 技能图标
  MessageCircle,
  Video,
  TrendingUp,
  Mic,
  Search,
  Bell,
  Image,
  Camera,
  Sparkles,
  FileText,
  Zap,
  Wand2,
  Palette,
  Brain,
  Code,
  BookOpen,
  PenTool,
  Music,
  Film,
  Globe,
  Mail,
  Phone,
  Calendar,
  Clock,
  Settings,
  User,
  Users,
  Heart,
  Star,
  Bookmark,
  Tag,
  Folder,
  File,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Link,
  Copy,
  Share,
  Download,
  Upload,
  RefreshCw,
  RotateCw,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Key,
  Home,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Grid,
  List,
  Layout,
  Layers,
  Filter,
  SortAsc,
  SortDesc,
  History,
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  ThumbsUp,
  ThumbsDown,
  Award,
  Target,
  Lightbulb,
  Rocket,
  Coffee,
  Gift,
  Package,
  Box,
  Database,
  Server,
  Cloud,
  Wifi,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Printer,
  Camera as CameraIcon,
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Fullscreen,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Thermometer,
  MapPin,
  Navigation,
  Compass,
  Map,
  type LucideIcon,
} from 'lucide-react'

/**
 * 图标名称到组件的映射
 * 只包含项目中实际使用的图标
 */
const iconMap: Record<string, LucideIcon> = {
  // 技能相关图标
  MessageCircle,
  Video,
  TrendingUp,
  Mic,
  Search,
  Bell,
  Image,
  Camera,
  Sparkles,
  FileText,
  Zap,
  Wand2,
  Palette,
  Brain,
  Code,
  BookOpen,
  PenTool,
  Music,
  Film,
  Globe,

  // 通用操作图标
  Mail,
  Phone,
  Calendar,
  Clock,
  Settings,
  User,
  Users,
  Heart,
  Star,
  Bookmark,
  Tag,
  Folder,
  File,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  X,

  // 导航图标
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Link,

  // 操作图标
  Copy,
  Share,
  Download,
  Upload,
  RefreshCw,
  RotateCw,

  // 状态图标
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,

  // 安全图标
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Key,

  // 布局图标
  Home,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Grid,
  List,
  Layout,
  Layers,
  Filter,
  SortAsc,
  SortDesc,

  // 消息图标
  History,
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  ThumbsUp,
  ThumbsDown,

  // 成就图标
  Award,
  Target,
  Lightbulb,
  Rocket,
  Coffee,
  Gift,

  // 技术图标
  Package,
  Box,
  Database,
  Server,
  Cloud,
  Wifi,

  // 设备图标
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Printer,

  // 媒体图标
  Play,
  Pause,
  Square,
  Circle,
  Triangle,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,

  // 天气图标
  Sun,
  Moon,
  CloudRain,
  Wind,
  Thermometer,

  // 地图图标
  MapPin,
  Navigation,
  Compass,
  Map,
}

/**
 * 根据图标名称获取图标组件
 * @param name 图标名称（如 'MessageCircle', 'Video'）
 * @returns 对应的 Lucide 图标组件，找不到时返回 Sparkles
 */
export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Sparkles
}

/**
 * 检查图标是否存在
 * @param name 图标名称
 * @returns 是否存在该图标
 */
export function hasIcon(name: string): boolean {
  return name in iconMap
}

/**
 * 获取所有可用的图标名称
 * @returns 图标名称数组
 */
export function getAvailableIcons(): string[] {
  return Object.keys(iconMap)
}

// 默认导出
export default iconMap
