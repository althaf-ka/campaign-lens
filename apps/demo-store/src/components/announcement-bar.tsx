import { announcementData } from "@/data/campaign";

export function AnnouncementBar() {
  return (
    <aside
      aria-label="Announcement"
      className="bg-stone-900 text-stone-100 text-xs sm:text-sm font-medium py-2.5 px-4 text-center border-b border-stone-800"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400 text-stone-950 uppercase tracking-wider">
          {announcementData.badge}
        </span>
        <span className="tracking-wide text-stone-200">
          {announcementData.text}
        </span>
      </div>
    </aside>
  );
}
