/**
 * Atomi riesportati dai primitivi shadcn. Le feature importano SOLO da
 * `@/components/shared` (mai da `@/components/ui`): se un primitivo serve
 * così com'è, va riesportato qui; se serve composto, va wrappato in un
 * componente dedicato di questa cartella.
 */

export { Button, buttonVariants } from "@/components/ui/button";
export { Badge } from "@/components/ui/badge";
export { Input } from "@/components/ui/input";
export { Textarea } from "@/components/ui/textarea";
export { Label } from "@/components/ui/label";
export { Checkbox } from "@/components/ui/checkbox";
export { Switch } from "@/components/ui/switch";
export { Separator } from "@/components/ui/separator";
export { Skeleton } from "@/components/ui/skeleton";
export { Spinner } from "@/components/ui/spinner";
export { Progress } from "@/components/ui/progress";
export { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
export { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export { AspectRatio } from "@/components/ui/aspect-ratio";
export { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
export { Toaster } from "@/components/ui/sonner";
export { Kbd, KbdGroup } from "@/components/ui/kbd";
