import { cn } from "@/lib/utils";

type ScreenVariant = "overview" | "workflow" | "insights" | "team";

type ProductScreenPlaceholderProps = Readonly<{
  variant: ScreenVariant;
  caption: string;
  className?: string;
}>;

const sidebarRows = ["w-3/4", "w-5/6", "w-2/3", "w-4/5", "w-3/5"];

function BrowserFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="overflow-hidden rounded-[2px] border border-black/10 bg-white shadow-[0_24px_70px_rgb(0_0_0/0.14)]">
      <div className="flex h-7 items-center gap-1.5 border-b border-black/8 bg-[#fafafa] px-3 sm:h-9 sm:px-4">
        <span className="size-1.5 rounded-full bg-[#ff5f57] sm:size-2" />
        <span className="size-1.5 rounded-full bg-[#febc2e] sm:size-2" />
        <span className="size-1.5 rounded-full bg-[#28c840] sm:size-2" />
        <span className="ml-3 h-2 w-1/3 rounded-full bg-black/6 sm:h-2.5" />
      </div>
      <div className="flex aspect-[16/9] min-h-44 bg-[#f7f7f8] sm:min-h-72">
        <aside className="hidden w-[18%] shrink-0 border-r border-black/8 bg-white p-[3%] sm:block">
          <div className="mb-[20%] flex items-center gap-2">
            <span className="size-3 rounded-[2px] bg-primary" />
            <span className="h-2 w-1/2 rounded-full bg-black/75" />
          </div>
          <div className="space-y-[13%]">
            {sidebarRows.map((width, index) => (
              <div key={index} className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2 rounded-[2px]",
                    index === 0 ? "bg-primary/80" : "bg-black/10"
                  )}
                />
                <span className={cn("h-1.5 rounded-full bg-black/10", width)} />
              </div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1 p-[4%]">{children}</div>
      </div>
    </div>
  );
}

function ScreenHeader({ titleWidth = "w-1/3" }: Readonly<{ titleWidth?: string }>) {
  return (
    <div className="mb-[4%] flex items-center justify-between">
      <div className={cn("space-y-2", titleWidth)}>
        <div className="h-2.5 w-full rounded-full bg-black/75 sm:h-4" />
        <div className="h-1.5 w-2/3 rounded-full bg-black/12 sm:h-2" />
      </div>
      <div className="h-5 w-[18%] rounded-[2px] bg-primary sm:h-8" />
    </div>
  );
}

function OverviewScreen() {
  return (
    <>
      <ScreenHeader />
      <div className="grid grid-cols-3 gap-[2%]">
        {["bg-primary/12", "bg-[#ececf0]", "bg-[#ececf0]"].map(
          (background, index) => (
            <div
              key={index}
              className={cn("rounded-[2px] border border-black/6 p-[7%]", background)}
            >
              <div className="h-1.5 w-1/2 rounded-full bg-black/15" />
              <div className="mt-[16%] h-3 w-2/3 rounded-full bg-black/70 sm:h-5" />
            </div>
          )
        )}
      </div>
      <div className="mt-[3%] grid grid-cols-[1.35fr_0.65fr] gap-[2%]">
        <div className="rounded-[2px] border border-black/6 bg-white p-[5%]">
          <div className="flex h-24 items-end gap-[3%] sm:h-36">
            {[34, 48, 42, 66, 58, 82, 74, 92].map((height, index) => (
              <span
                key={index}
                className={cn(
                  "flex-1 rounded-t-[2px]",
                  index > 5 ? "bg-primary" : "bg-primary/25"
                )}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-[5%] rounded-[2px] border border-black/6 bg-white p-[7%]">
          {["w-full", "w-5/6", "w-4/5", "w-11/12"].map((width, index) => (
            <div key={index} className="flex items-center gap-2 border-b border-black/6 pb-[5%]">
              <span className="size-2 rounded-full bg-primary/70" />
              <span className={cn("h-1.5 rounded-full bg-black/12", width)} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function WorkflowScreen() {
  return (
    <>
      <ScreenHeader titleWidth="w-2/5" />
      <div className="grid h-[78%] grid-cols-3 gap-[2%]">
        {[0, 1, 2].map((column) => (
          <div key={column} className="rounded-[2px] bg-[#ececf0] p-[5%]">
            <div className="mb-[8%] flex items-center justify-between">
              <span className="h-1.5 w-1/2 rounded-full bg-black/30" />
              <span className="size-3 rounded-full bg-black/8" />
            </div>
            <div className="space-y-[6%]">
              {Array.from({ length: column === 1 ? 3 : 2 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[2px] border border-black/6 bg-white p-[7%] shadow-sm"
                >
                  <div className="h-1.5 w-4/5 rounded-full bg-black/55" />
                  <div className="mt-[8%] h-1.5 w-full rounded-full bg-black/8" />
                  <div className="mt-[4%] h-1.5 w-2/3 rounded-full bg-black/8" />
                  <div className="mt-[10%] h-2 w-1/3 rounded-full bg-primary/20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function InsightsScreen() {
  return (
    <>
      <ScreenHeader titleWidth="w-2/5" />
      <div className="rounded-[2px] border border-black/6 bg-white p-[5%]">
        <div className="flex items-baseline gap-2">
          <span className="h-4 w-1/5 rounded-full bg-black/75 sm:h-7" />
          <span className="h-2 w-[12%] rounded-full bg-[#2f9e6f]/35" />
        </div>
        <svg
          viewBox="0 0 600 180"
          aria-hidden
          className="mt-[4%] w-full overflow-visible"
        >
          <path
            d="M0 150 C60 148 65 115 120 120 S180 92 230 100 S300 52 360 68 S430 40 480 50 S550 12 600 25"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-primary"
          />
          <path
            d="M0 150 C60 148 65 115 120 120 S180 92 230 100 S300 52 360 68 S430 40 480 50 S550 12 600 25 L600 180 L0 180 Z"
            className="fill-primary/10"
          />
        </svg>
      </div>
      <div className="mt-[3%] grid grid-cols-3 gap-[2%]">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-[2px] border border-black/6 bg-white p-[5%]">
            <div className="h-1.5 w-1/2 rounded-full bg-black/12" />
            <div className="mt-[12%] h-3 w-3/4 rounded-full bg-black/65 sm:h-5" />
          </div>
        ))}
      </div>
    </>
  );
}

function TeamScreen() {
  return (
    <>
      <ScreenHeader titleWidth="w-2/5" />
      <div className="grid grid-cols-[1.3fr_0.7fr] gap-[2%]">
        <div className="overflow-hidden rounded-[2px] border border-black/6 bg-white">
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="grid grid-cols-[auto_1fr_0.55fr_0.4fr] items-center gap-[4%] border-b border-black/6 px-[5%] py-[4%] last:border-0"
            >
              <span className={cn("size-3 rounded-full sm:size-5", row % 2 ? "bg-primary/25" : "bg-primary/65")} />
              <span className="h-1.5 w-4/5 rounded-full bg-black/35" />
              <span className="h-1.5 w-full rounded-full bg-black/10" />
              <span className="h-2 w-full rounded-full bg-[#2f9e6f]/25" />
            </div>
          ))}
        </div>
        <div className="rounded-[2px] border border-black/6 bg-white p-[8%]">
          <div className="mx-auto size-10 rounded-full bg-primary/20 sm:size-16" />
          <div className="mx-auto mt-[8%] h-2 w-2/3 rounded-full bg-black/55" />
          <div className="mx-auto mt-[5%] h-1.5 w-1/2 rounded-full bg-black/10" />
          <div className="mt-[14%] space-y-[7%]">
            {["w-full", "w-5/6", "w-2/3"].map((width) => (
              <div key={width} className="flex items-center gap-2">
                <span className="size-2 rounded-[2px] bg-primary/60" />
                <span className={cn("h-1.5 rounded-full bg-black/10", width)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function ProductScreenPlaceholder({
  variant,
  caption,
  className,
}: ProductScreenPlaceholderProps) {
  return (
    <figure className={cn("rounded-[2px] bg-[#e8e8ed] p-3 sm:p-6", className)}>
      <BrowserFrame>
        {variant === "overview" && <OverviewScreen />}
        {variant === "workflow" && <WorkflowScreen />}
        {variant === "insights" && <InsightsScreen />}
        {variant === "team" && <TeamScreen />}
      </BrowserFrame>
      <figcaption className="mt-3 text-center text-xs font-medium text-black/45 sm:mt-4">
        Placeholder schermata · {caption}
      </figcaption>
    </figure>
  );
}
