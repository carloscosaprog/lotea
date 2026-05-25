import {
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Tv,
  Camera,
  Headphones,
  Watch,
  Shirt,
  Gem,
  Footprints,
  House,
  Sofa,
  BedDouble,
  Lamp,
  CookingPot,
  Car,
  Bike,
  Wrench,
  Gamepad2,
  Dumbbell,
  Trophy,
  BookOpen,
  Music2,
  PawPrint,
  Sparkles,
  BriefcaseBusiness,
  LucideIcon,
  Package,
  WashingMachine,
  Hammer,
  Home,
  HeartPulse,
  Boxes,
  Baby,
  BookCopy,
  Film,
  Disc3,
  Radio,
  Tent,
  Goal,
  PersonStanding,
  Fan,
  Microwave,
  SprayCan,
  Drill,
  Paintbrush,
  ChefHat,
  Lightbulb,
  Trees,
  Store,
  Utensils,
  ToyBrick,
  Heart,
  Cable,
  Cpu,
  Computer,
} from "lucide-react-native";

export const categoryIcons: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  monitor: Monitor,
  tablet: Tablet,
  tv: Tv,
  camera: Camera,
  headphones: Headphones,
  watch: Watch,

  shirt: Shirt,
  gem: Gem,
  footprints: Footprints,

  house: House,
  sofa: Sofa,
  bed: BedDouble,
  lamp: Lamp,
  cooking: CookingPot,

  car: Car,
  bike: Bike,
  wrench: Wrench,

  gamepad: Gamepad2,

  dumbbell: Dumbbell,
  trophy: Trophy,

  book: BookOpen,
  music: Music2,

  paw: PawPrint,

  sparkles: Sparkles,

  briefcase: BriefcaseBusiness,
  "washing-machine": WashingMachine,
  hammer: Hammer,
  home: Home,
  "paw-print": PawPrint,
  "gamepad-2": Gamepad2,
  "heart-pulse": HeartPulse,
  boxes: Boxes,
  baby: Baby,
  "book-copy": BookCopy,
  film: Film,
  "disc-3": Disc3,
  radio: Radio,

  tent: Tent,
  goal: Goal,
  "person-standing": PersonStanding,

  fan: Fan,
  microwave: Microwave,
  "spray-can": SprayCan,

  drill: Drill,
  paintbrush: Paintbrush,

  "chef-hat": ChefHat,
  lightbulb: Lightbulb,
  trees: Trees,

  store: Store,
  utensils: Utensils,

  "toy-brick": ToyBrick,

  heart: Heart,

  cable: Cable,

  cpu: Cpu,
  computer: Computer,
};

export const getCategoryIcon = (iconName?: string): LucideIcon => {
  if (!iconName) {
    return Package;
  }

  return categoryIcons[iconName] || Package;
};
